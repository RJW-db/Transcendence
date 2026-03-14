import type { PrismaClient, Prisma, Message } from '@prisma/client';
import { IncomingDirectMessage, MyServer, MySocket } from '../types';

export async function createDirectMessage(
	db: PrismaClient,
	senderId: number,
	receiverId: number,
	msg: string,
) {
	return db.message.create({
		data: {
			Message: msg,
			DateTime: new Date(),
			IsRead: false,
			Sender: {
				connect: { ID: senderId },
			},
			Receiver: {
				connect: { ID: receiverId },
			}
		}
	});
}

export async function markDirectMessageAsRead(
	db: PrismaClient,
	messageId: number,
	receiverId: number,
) {
	await db.message.update({
		where: {
			ID: messageId,
			ReceiverID: receiverId
		},
		data: { IsRead: true }
	});
}

export async function findUnreadDirectMessages(
	db: PrismaClient,
	userId: number
) {
	return db.message.findMany({
		where: {
			ReceiverID: userId,
			IsRead: false
		},
		include: {
			Sender: true
		}
	});
}

type UnreadMessageWithSender = Prisma.MessageGetPayload<{
  include: { Sender: true };
}>;

export function sendUnreadDirectMessages(
	socket: MySocket,
	rows: UnreadMessageWithSender[],
) {
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
}

export function notifyDirectMessage(
	io: MyServer,
	senderAlias: string,
	msg: Message,
) {
	const outgoingMessage: IncomingDirectMessage = {
		messageId: msg.ID,
		sender: {
			id: msg.SenderID,
			alias: senderAlias,
			online: true
		},
		message: msg.Message,
		dateTime: msg.DateTime
	};
	io.to(msg.ReceiverID.toString()).emit('directMessage', outgoingMessage);
}
