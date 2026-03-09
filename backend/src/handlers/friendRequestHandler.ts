import { SocketContext } from '../types';
import type { IncomingFriendRequest, OutgoingFriendRequest, UserData } from '../types';


export async function friendRequestHandler({ io, socket, db }: SocketContext) {

	socket.on('sendFriendRequest', async (req: OutgoingFriendRequest, callback: (response: { success: boolean, error?: string}) => void) => {
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

			// TODO: check if users are already friends
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
				// TODO: accept friend request since both requested each other
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
}