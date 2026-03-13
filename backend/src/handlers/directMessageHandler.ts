import { SocketContext, OutgoingDirectMessage, IncomingDirectMessage, ActionResponse } from '../types';

// Add logger instead of using console.log

export async function directMessageHandler({ io, socket, db }: SocketContext) {

	// TODO: check if reciever hasn't blocked sender
	socket.on('sendDirectMessage', async (msg: OutgoingDirectMessage, callback: (response: ActionResponse) => void) => {
		const senderID = socket.data.userId;

		// Check authentication and input
		if (!senderID)
			return callback({ success: false, error: "Not authenticated" });
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
						connect: { ID: senderID },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					}
				}
			});

			// Send to receiver
			const outgoingMessage: IncomingDirectMessage = {
				messageID: savedMessage.ID,
				sender: {
					ID: senderID,
					alias: socket.data.alias,
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
			const userID = socket.data.userId;
			if (!userID) return callback({ success: false, error: "Not authenticated" });

			// Retreive unread messages from database
			const rows = await db.message.findMany({
				where: {
					ReceiverID: userID,
					IsRead: false
				},
				include: {
					Sender: true
				}
			});

			// Send to user
			const messages: IncomingDirectMessage[] = rows.map((m: typeof rows[number]) => ({
				messageID: m.ID,
				sender: {
					ID: m.Sender.ID,
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
	socket.on('readMessage', async (messageID: number) => {
		try {
			await db.message.update({
				where: {
					ID: messageID,
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
