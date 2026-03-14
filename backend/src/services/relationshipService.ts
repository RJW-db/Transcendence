import type { PrismaClient, Prisma } from '@prisma/client';
import { MyServer, UserData } from '../types';

export async function areFriends(
	db: PrismaClient,
	userAId: number,
	userBId: number,
) {
	return db.friend.findFirst({
	where: {
		OR: [
			{ User1ID: userAId, User2ID: userBId },
			{ User1ID: userBId, User2ID: userAId }
		 ]
		}
	});
}

export async function createFriend(
	db: PrismaClient | Prisma.TransactionClient,
	userAId: number,
	userBId: number,
) {
	return db.friend.create({
		data: {
			User1ID: userAId,
			User2ID: userBId,
			DateBefriended: new Date()
		}
	});
}

export function notifyFriendshipCreated(
	io: MyServer,
	senderId: number,
	receiverId: number,
	receiverAlias: string,
	senderAlias: string,
	senderOnline: boolean,
) {
	const senderView: UserData = {
		id: receiverId,
		alias: receiverAlias,
		online: true,
	};

	const receiverView: UserData = {
		id: senderId,
		alias: senderAlias,
		online: senderOnline,
	};

	io.to(senderId.toString()).emit('newFriend', senderView);
	io.to(receiverId.toString()).emit('newFriend', receiverView);
}
