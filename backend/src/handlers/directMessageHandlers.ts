import { Message } from '@prisma/client';
import { SocketContext, DirectMessagePayload, IncomingDirectMessage } from '../types';

export async function directMessageHandler({ io, socket, db }: SocketContext) {
	socket.on('sendDirectMessage', async (msg: DirectMessagePayload) => {
		const senderID = socket.data.userId;

		// Add to database
		await db.message.create({
			data: {
				Message: msg.message,
				DateTime: new Date(),
				IsRead: false,
				Sender: {
					connect: { ID: senderID },
				},
				Receiver: {
					connect: { ID: msg.receiverID },
				},
			},
		});

		// Check if receiver is online
		// If online, send message to receiver
		const receiver = await db.user.findUnique({
			where: {
				ID: msg.receiverID,
			},
			select: {
				ID: true,
				Online: true,
			},
		});
		if (receiver) {
			const outgoingMessage: IncomingDirectMessage = {
				senderID: senderID,
				message: msg.message,
			};
			io.to(receiver.ID.toString()).emit('directMessage', outgoingMessage);
		}
	});

	socket.on('loadUnreadMessages', async () => {
		const userID = socket.data.userId;

		const rows: Message[] = await db.message.findMany({
			where: {
				ReceiverID: userID,
				IsRead: false
			}
		});

		const messages: IncomingDirectMessage[] = rows.map((m) => ({
			senderID: m.SenderID,
			message: m.Message,
		}));
		socket.emit('unreadMessages', messages);
	})
};
