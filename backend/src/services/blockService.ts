import type { PrismaClient, Prisma } from '@prisma/client';
import { removeFriendRequest, findFriendRequestByUsers } from './friendRequestService';
import { areFriends, removeFriend } from './relationshipService';

export async function createBlock(
	db: PrismaClient | Prisma.TransactionClient,
	blockerId: number,
	blockedId: number,
) {
	return db.blockedUser.create({
		data: {
			BlockerId: blockerId,
			BlockedId: blockedId,
			BlockedDate: new Date()
		}
	});
}

export async function findBlock(
	db: PrismaClient,
	blockerId: number,
	blockedId: number,
) {
	return db.blockedUser.findFirst({
		where: {
			BlockerId: blockerId,
			BlockedId: blockedId
		}
	});
}

export async function blockUserAndRemoveFriendship(
	db: PrismaClient,
	blockerId: number,
	blockedId: number,
) {
	return db.$transaction(async (tx: Prisma.TransactionClient) => {
		const friendship = await areFriends(tx, blockerId, blockedId);

		if (friendship) {
			await removeFriend(tx, friendship.ID);
		}

		const friendRequest = await findFriendRequestByUsers(tx, blockerId, blockedId);
		if (friendRequest) {
			await removeFriendRequest(tx, friendRequest.ID);
		}

		return createBlock(tx, blockerId, blockedId);
	});
}
