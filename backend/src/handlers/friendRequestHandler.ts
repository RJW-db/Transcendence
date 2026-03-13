import { SocketContext } from '../types';
import type { ActionResponse, IncomingFriendRequest, OutgoingFriendRequest, UserData } from '../types';
import { requireUser } from '../services/authService';
import { findFriendRequest } from '../services/friendRequestService';
import { areFriends } from 'src/services/relationshipService';

// TODO: clean up handler by adding service functions

export async function friendRequestHandler({ io, socket, db }: SocketContext) {

	async function acceptFriendRequest(requestId: number, receiverId: number): Promise<ActionResponse> {
		const request = await findFriendRequest(db, requestId);
		if (!request)
			return { success: false, error: "No request found" };
		if (request.ReceiverID !== receiverId)
			return { success: false, error: "Unauthorized" };

		// Check if already friends and remove request if so
		const existing = await areFriends(db, receiverId, request.SenderID);
		if (existing) {
			db.friendRequest.delete({ where: { ID: requestId } }).catch((err: unknown) =>
				console.error("Failed to clean up stale friend request:", err)
			);
			return { success: false, error: "Already friends" };
		}

		// Create friendship
		await db.friend.create({
			data: {
				User1ID: receiverId,
				User2ID: request.SenderID,
				DateBefriended: new Date()
			}
		});

		// Delete request
		db.friendRequest.delete({ where: { ID: requestId } }).catch((err: unknown) =>
			console.error("Failed to clean up stale friend request:", err)
		);
		io.to(request.SenderID.toString()).emit('newFriend', { id: receiverId, alias: socket.data.alias, online: true });
		io.to(receiverId.toString()).emit('newFriend', { id: request.SenderID, alias: request.Sender.Alias, online: request.Sender.Online });
		return { success: true };
	}


	// TODO: Check if receiver has blocked sender
	socket.on('sendFriendRequest', async (req: OutgoingFriendRequest, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId: senderId, alias: senderAlias } = auth;

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
						{ User1ID: receiver.ID, User2ID: senderId },
						{ User1ID: senderId, User2ID: receiver.ID }
					]
				}
			});
			if (existing)
				return callback({ success: false, error: "Already friends"});

			// Check if friend request exists
			const existingRequest = await db.friendRequest.findFirst({
				where: {
					OR: [
						{ SenderID: senderId, ReceiverID: receiver.ID },
						{ SenderID: receiver.ID, ReceiverID: senderId }
					]
				}
			});
			if (existingRequest) {
				if (existingRequest.SenderID === senderId) {
					return callback({ success: false, error: "Friend request already sent" });
				}
				// Accept friend request since both requested each other
				const result = await acceptFriendRequest(existingRequest.ID, senderId);
				if (!result.success)
					return callback(result);
				return callback({ success: true });
			}

			// Create FriendRequest
			const friendRequest = await db.friendRequest.create({
				data: {
					SentAt: new Date(),
					Sender: {
						connect: { ID: senderId },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					}
				}
			});

			// Send to user
			const outgoingRequest: IncomingFriendRequest = {
				requestId: friendRequest.ID,
				sender: {
					id: senderId,
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


	socket.on('acceptFriendRequest', async (requestId: number, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId: receiverId } = auth;

		try {
			const result = await acceptFriendRequest(requestId, receiverId);
			callback(result);
		} catch (error) {
			console.error("Prisma error accepting friend request:", error);
			return callback({ success: false, error: "Failed to accept friend request" });
		}
	});


	socket.on('declineFriendRequest', async (requestId: number, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId: receiverId } = auth;

		try {
			const request = await db.friendRequest.findUnique({
				where: { ID: requestId }
			});
			if (!request)
				return callback({ success: false, error: "No request found" });
			if (request.ReceiverID !== receiverId)
				return callback({ success: false, error: "Unauthorized" });

			await db.friendRequest.delete({ where: { ID: requestId }});
			callback({ success: true });

		} catch (error) {
			console.error("Prisma error declining friend request:", error);
			return callback({ success: false, error: "Failed to decline friend request" });
		}
	});
}
