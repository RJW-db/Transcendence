import { SocketContext, OutgoingDirectMessage, IncomingDirectMessage, ActionResponse } from '../types';
import { requireUser } from '../services/authService';
import { findUser } from '../services/userService';
import { createDirectMessage, findUnreadDirectMessages, markDirectMessageAsRead, notifyDirectMessage, sendUnreadDirectMessages } from '../services/directMessageService';

// Add logger instead of using console.log
// TODO: clean up handler by adding service functions

export async function directMessageHandler({ io, socket, db }: SocketContext) {

	// TODO: check if reciever hasn't blocked sender
	socket.on('sendDirectMessage', async (msg: OutgoingDirectMessage, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId: senderId, alias: senderAlias } = auth;

		if (!msg.message || msg.message.trim().length === 0) {
			return callback({ success: false, error: "Message cannot be empty" });
		}

		try {
			// Check if user exists
			const receiver = await findUser(db, msg.receiverAlias);
			if (!receiver) {
				return callback({ success: false, error: "User does not exist" });
			}

			// Add to database
			const savedMessage = await createDirectMessage(db, senderId, receiver.ID, msg.message);

			// Send to receiver
			notifyDirectMessage(io, senderAlias, savedMessage);
			callback({ success: true });
		} catch (error) {
			console.error("Prisma error sending direct message:", error);
			return callback({ success: false, error: "Failed to send message" });
		}
	});

	
	socket.on('loadUnreadMessages', async (callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId } = auth;
		
		try {
			// Retreive unread messages from database
			const rows = await findUnreadDirectMessages(db, userId);

			// Send to user
			sendUnreadDirectMessages(socket, rows);
			callback({ success: true });
		} catch (error) {
			console.error("Failed to load unread messages:", error);
			return callback({ success: false, error: "Failed to load unread messages" });
		}
	});

	// TODO: Check for error and if its wrong receiver catch and throw more obvious error
	socket.on('readMessage', async (messageId: number, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId } = auth;

		try {
			await markDirectMessageAsRead(db, messageId, userId);
			callback({ success: true });
		}
		catch (error) {
			console.error("Failed to set message as read", error);
			return callback({ success: false, error: "Failed to mark message as read" });
		}
	});
};
