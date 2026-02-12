import { Message } from '@prisma/client';
import { SocketContext, DirectMessagePayload, IncomingDirectMessage } from '../types';

// Add logger instead of using console.log

export async function directMessageHandler({ io, socket, db }: SocketContext) {

	socket.on('sendDirectMessage', async (msg: DirectMessagePayload, callback: (response: { success: boolean, error?: string}) => void) => {
		const senderID = socket.data.userId;

		if (!senderID)
			return callback({ success: false, error: "Not authenticated" });
		if (!msg.message || msg.message.trim().length === 0) {
			return callback({ success: false, error: "Message cannot be empty" });
		}

		try {
			// Check if user exists
			const receiver = await db.user.findUnique({
				where: {
					Alias: msg.receiverUserName
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
						connect: { ID: senderID },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					},
				},
			});

			// Check if receiver is online
			// If online, send message to receiver
			const outgoingMessage: IncomingDirectMessage = {
				messageID: savedMessage.ID,
				senderID: senderID,
				message: savedMessage.Message,
			};
			io.to(receiver.ID.toString()).emit('directMessage', outgoingMessage);
			callback({ success: true });
		} catch (error) {
			console.error("Prisma error sending direct message:", error);
			return callback({ success: false, error: "Failed to send message" })
		}
	});

	
	socket.on('loadUnreadMessages', async (callback: (response: { success: boolean, error?: string}) => void) => {
		try {
			const userID = socket.data.userId;
			if (!userID) return;

			const rows: Message[] = await db.message.findMany({
				where: {
					ReceiverID: userID,
					IsRead: false
				}
			});

			const messages: IncomingDirectMessage[] = rows.map((m) => ({
				messageID: m.ID,
				senderID: m.SenderID,
				message: m.Message,
			}));
			socket.emit('unreadMessages', messages);
			callback({ success: true });
		} catch (error) {
			console.error("Failed to load unread messages:", error);
			return callback({ success: false, error: "Failed to load unread messages" });
		}
	})
};
