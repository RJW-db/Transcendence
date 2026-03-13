import { SocketContext, OutgoingDirectMessage, IncomingDirectMessage, ActionResponse } from '../types';
import { requireUser } from '../services/authService';

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
			const receiver = await db.user.findUnique({
				where: {
					Alias: msg.receiverAlias
				},
				select: {
					ID: true,
					Online: true,
				},
			});
			if (!receiver) {
				return callback({ success: false, error: "User does not exist" });
			}

			// Add to database
			const savedMessage = await db.message.create({
				data: {
					Message: msg.message,
					DateTime: new Date(),
					IsRead: false,
					Sender: {
						connect: { ID: senderId },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					}
				}
			});

			// Send to receiver
			const outgoingMessage: IncomingDirectMessage = {
				messageId: savedMessage.ID,
				sender: {
					id: senderId,
					alias: senderAlias,
					online: true
				},
				message: savedMessage.Message,
				dateTime: savedMessage.DateTime
			};
			io.to(receiver.ID.toString()).emit('directMessage', outgoingMessage);
			callback({ success: true });
		} catch (error) {
			console.error("Prisma error sending direct message:", error);
			return callback({ success: false, error: "Failed to send message" });
		}
	});

	
	socket.on('loadUnreadMessages', async (callback: (response: ActionResponse) => void) => {
		try {
			const auth = requireUser(socket, callback);
			if (!auth)
				return;
			const { userId } = auth;

			// Retreive unread messages from database
			const rows = await db.message.findMany({
				where: {
					ReceiverID: userId,
					IsRead: false
				},
				include: {
					Sender: true
				}
			});

			// Send to user
			const messages: IncomingDirectMessage[] = rows.map((m: typeof rows[number]) => ({
				messageId: m.ID,
				sender: {
					id: m.Sender.ID,
					alias: m.Sender.Alias,
					online: m.Sender.Online
				},
				message: m.Message,
				dateTime: m.DateTime
			}));
			socket.emit('unreadMessages', messages);
			callback({ success: true });
		} catch (error) {
			console.error("Failed to load unread messages:", error);
			return callback({ success: false, error: "Failed to load unread messages" });
		}
	});

	// TODO: Check for error and if its wrong receiver catch and throw more obvious error
	socket.on('readMessage', async (messageId: number) => {
		try {
			await db.message.update({
				where: {
					ID: messageId,
					ReceiverID: socket.data.userId
				},
				data: { IsRead: true }
			});
		}
		catch (error) {
			console.error("Failed to set message as read", error);
		}
	});
};
