import type { PrismaClient } from '@prisma/client';

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
