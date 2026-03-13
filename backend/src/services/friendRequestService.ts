import type { PrismaClient } from '@prisma/client';

export async function findFriendRequest(db: PrismaClient, requestId: number) {
	return db.friendRequest.findUnique({
		where: { ID: requestId },
		include: { Sender: true },
	});
}
