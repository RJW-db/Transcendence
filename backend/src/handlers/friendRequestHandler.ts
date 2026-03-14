import { SocketContext } from '../types';
import type { ActionResponse, IncomingFriendRequest, OutgoingFriendRequest, UserData } from '../types';
import { requireUser } from '../services/authService';
import { createFriendRequest, finalizeFriendRequest, findFriendRequestById, findFriendRequestByUsers, notifyFriendRequestSent, removeFriendRequest } from '../services/friendRequestService';
import { areFriends, notifyFriendshipCreated } from '../services/relationshipService';
import { findUser } from '../services/userService';

// TODO: clean up handler by adding service functions

export async function friendRequestHandler({ io, socket, db }: SocketContext) {

	async function handleAcceptFriendRequest(requestId: number, receiverId: number): Promise<ActionResponse> {
		const request = await findFriendRequestById(db, requestId);
		if (!request)
			return { success: false, error: "No request found" };
		if (request.ReceiverID !== receiverId)
			return { success: false, error: "Unauthorized" };

		// Check if already friends and remove request if so
		const existing = await areFriends(db, receiverId, request.SenderID);
		if (existing) {
			await removeFriendRequest(db, requestId);
			return { success: false, error: "Already friends" };
		}

		// Create friendship
		await finalizeFriendRequest(db, receiverId, request.SenderID, requestId);
		notifyFriendshipCreated(io, request.SenderID, receiverId, socket.data.alias, request.Sender.Alias, request.Sender.Online);
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
			const receiver = await findUser(db, req.receiverAlias);
			if (!receiver)
				return callback({ success: false, error: "User does not exist" });

			// Check if user are already friends
			const existing = await areFriends(db, receiver.ID, senderId);
			if (existing)
				return callback({ success: false, error: "Already friends"});

			// Check if friend request exists
			const existingRequest = await findFriendRequestByUsers(db, receiver.ID, senderId);
			if (existingRequest) {
				if (existingRequest.SenderID === senderId) {
					return callback({ success: false, error: "Friend request already sent" });
				}
				// Accept friend request since both requested each other
				const result = await handleAcceptFriendRequest(existingRequest.ID, senderId);
				if (!result.success)
					return callback(result);
				return callback({ success: true });
			}

			// Create FriendRequest
			const friendRequest = await createFriendRequest(db, senderId, receiver.ID);

			// Send notification to user
			notifyFriendRequestSent(io, friendRequest, senderAlias);
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
			const result = await handleAcceptFriendRequest(requestId, receiverId);
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
			// Find request
			const request = await findFriendRequestById(db, requestId);
			if (!request)
				return callback({ success: false, error: "No request found" });
			if (request.ReceiverID !== receiverId)
				return callback({ success: false, error: "Unauthorized" });

			await removeFriendRequest(db, requestId);
			callback({ success: true });

		} catch (error) {
			console.error("Prisma error declining friend request:", error);
			return callback({ success: false, error: "Failed to decline friend request" });
		}
	});
}
