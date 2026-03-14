import type { PrismaClient, Prisma } from '@prisma/client';

export async function findUser(db: PrismaClient, alias: string) {
	return db.user.findUnique({
		where: { Alias: alias }
	});
}
