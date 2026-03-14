import type { PrismaClient, Prisma, FriendRequest } from '@prisma/client';
import { createFriend } from './relationshipService';
import type { IncomingFriendRequest, MyServer } from '../types';

export async function findFriendRequestById(db: PrismaClient, requestId: number) {
	return db.friendRequest.findUnique({
		where: { ID: requestId },
		include: { Sender: true },
	});
}

export async function findFriendRequestByUsers(
	db: PrismaClient | Prisma.TransactionClient,
	userAId: number, 
	userBId: number,
) {
	return db.friendRequest.findFirst({
		where: {
			OR: [
				{ SenderID: userAId, ReceiverID: userBId },
				{ SenderID: userBId, ReceiverID: userAId }
			]
		}
	});
}

export async function createFriendRequest(
	db: PrismaClient,
	senderId: number,
	receiverId: number,
) {
	return db.friendRequest.create({
		data: {
			SentAt: new Date(),
			Sender: { connect: { ID: senderId } },
			Receiver: { connect: { ID: receiverId } }
		}
	});
}

export async function removeFriendRequest(db: PrismaClient | Prisma.TransactionClient, requestId: number) {
	return db.friendRequest.delete({ where: { ID: requestId }});
}

export async function finalizeFriendRequest(
	db: PrismaClient,
	userAId: number,
	userBId: number,
	requestId: number,	
) {
	return db.$transaction(async (tx: Prisma.TransactionClient) => {
		const createdFriend = await createFriend(tx, userAId, userBId);
		await removeFriendRequest(tx, requestId);
		return createdFriend;
	});
}

export function notifyFriendRequestSent(
	io: MyServer,
	req: FriendRequest,
	senderAlias: string,
) {
	const outgoingRequest: IncomingFriendRequest = {
		requestId: req.ID,
		sender: {
			id: req.SenderID,
			alias: senderAlias,
			online: true
		},
		sentAt: req.SentAt
	}
	io.to(req.ReceiverID.toString()).emit('newFriendRequest', outgoingRequest);
}
