import { SocketContext } from '../types';
import type { ActionResponse, IncomingFriendRequest, OutgoingFriendRequest, UserData } from '../types';


export async function friendRequestHandler({ io, socket, db }: SocketContext) {

	async function acceptFriendRequest(requestID: number, receiverID: number): Promise<ActionResponse> {
		const request = await db.friendRequest.findUnique({
			where: { ID: requestID },
			include: { Sender: true }
		});

		if (!request)
			return { success: false, error: "No request found" };
		if (request.ReceiverID !== receiverID)
			return { success: false, error: "Unauthorized" };

		// Check if already friends and remove request if so
		const existing = await db.friend.findFirst({
			where: {
				OR: [
					{ User1ID: receiverID, User2ID: request.SenderID },
					{ User1ID: request.SenderID, User2ID: receiverID }
				]
			}
		});
		if (existing) {
			db.friendRequest.delete({ where: { ID: requestID } }).catch((err: unknown) =>
				console.error("Failed to clean up stale friend request:", err)
			);
			return { success: false, error: "Already friends" };
		}

		// Create friendship
		await db.friend.create({
			data: {
				User1ID: receiverID,
				User2ID: request.SenderID,
				DateBefriended: new Date()
			}
		});

		// Delete request
		db.friendRequest.delete({ where: { ID: requestID } }).catch((err: unknown) =>
			console.error("Failed to clean up stale friend request:", err)
		);
		io.to(request.SenderID.toString()).emit('newFriend', { ID: receiverID, alias: socket.data.alias, online: true });
		io.to(receiverID.toString()).emit('newFriend', { ID: request.SenderID, alias: request.Sender.Alias, online: request.Sender.Online });
		return { success: true };
	}


	// TODO: Check if receiver has blocked sender
	socket.on('sendFriendRequest', async (req: OutgoingFriendRequest, callback: (response: ActionResponse) => void) => {
		const senderID = socket.data.userId;
		const senderAlias = socket.data.alias;

		if (!senderID || !senderAlias)
			return callback({ success: false, error: "Not authenticated" });
		if (!req.receiverAlias || req.receiverAlias.trim().length === 0)
			return callback({ success: false, error: "Username cannot be empty" });
		if (senderAlias === req.receiverAlias)
			return callback({ success: false, error: "Cannot send friend request to yourself" });

		try {
			// Find receiver
			const receiver = await db.user.findUnique({
				where: { Alias: req.receiverAlias }
			});
			if (!receiver)
				return callback({ success: false, error: "User does not exist" });

			// Check if user are already friends
			const existing = await db.friend.findFirst({
				where: {
					OR: [
						{ User1ID: receiver.ID, User2ID: senderID },
						{ User1ID: senderID, User2ID: receiver.ID }
					]
				}
			});
			if (existing)
				return callback({ success: false, error: "Already friends"});

			// Check if friend request exists
			const existingRequest = await db.friendRequest.findFirst({
				where: {
					OR: [
						{ SenderID: senderID, ReceiverID: receiver.ID },
						{ SenderID: receiver.ID, ReceiverID: senderID }
					]
				}
			});
			if (existingRequest) {
				if (existingRequest.SenderID === senderID) {
					return callback({ success: false, error: "Friend request already sent" });
				}
				// Accept friend request since both requested each other
				const result = await acceptFriendRequest(existingRequest.ID, senderID);
				if (!result.success)
					return callback(result);
				return callback({ success: true });
			}

			// Create FriendRequest
			const friendRequest = await db.friendRequest.create({
				data: {
					SentAt: new Date(),
					Sender: {
						connect: { ID: senderID },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					}
				}
			});

			// Send to user
			const outgoingRequest: IncomingFriendRequest = {
				requestID: friendRequest.ID,
				sender: {
					ID: senderID,
					alias: senderAlias,
					online: true
				},
				sentAt: friendRequest.SentAt
			}
			io.to(receiver.ID.toString()).emit('newFriendRequest', outgoingRequest);
			callback({ success: true });
		} catch (error) {
			console.error("Prisma error sending friend request:", error);
			return callback({ success: false, error: "Failed to send friend request" });
		}
	});


	socket.on('acceptFriendRequest', async (requestID: number, callback: (response: ActionResponse) => void) => {
		const receiverID = socket.data.userId;
		const receiverAlias = socket.data.alias;

		if (!receiverID || !receiverAlias)
			return callback({ success: false, error: "Not authenticated" });

		try {
			const result = await acceptFriendRequest(requestID, receiverID);
			callback(result);
		} catch (error) {
			console.error("Prisma error accepting friend request:", error);
			return callback({ success: false, error: "Failed to accept friend request" });
		}
	});


	socket.on('declineFriendRequest', async (requestID: number, callback: (response: ActionResponse) => void) => {
		const receiverID = socket.data.userId;
		const receiverAlias = socket.data.alias;

		if (!receiverID || !receiverAlias)
			return callback({ success: false, error: "Not authenticated" });

		try {
			const request = await db.friendRequest.findUnique({
				where: { ID: requestID }
			});
			if (!request)
				return callback({ success: false, error: "No request found" });
			if (request.ReceiverID !== receiverID)
				return callback({ success: false, error: "Unauthorized" });

			await db.friendRequest.delete({ where: { ID: requestID }});
			callback({ success: true });

		} catch (error) {
			console.error("Prisma error declining friend request:", error);
			return callback({ success: false, error: "Failed to decline friend request" });
		}
	});
}
