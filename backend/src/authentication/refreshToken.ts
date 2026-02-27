import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
// import { validateAuthToken } from './validateAuthToken';
import { PrismaClient } from '@prisma/client';
import { createSafePrisma } from '../utils/prismaHandle';

export const REFRESH_TOKEN_TIME = parseInt(process.env.JWT_REFRESH_TOKEN_DAYS ?? "30", 10) * 24 * 60 * 60; // in seconds

export async function refreshUserToken(userID: number, request: FastifyRequest, reply: FastifyReply, prisma: PrismaClient) {
    const db = createSafePrisma(prisma, reply, request.server, {
        P2025: 'No refresh token found (record missing or deleted)'
    });

    const rawToken: string = request.cookies.refreshToken || '';
    if (!rawToken) {
        // reply.status(401).send({ message: 'No refresh token provided' });
        const created = await createRefreshToken(userID, reply, db);
        if (!created) {
            reply.clearCookie('refreshToken');
        }
        return created;
    }

    const tokenRecord = await db.jWTRefreshToken.findUnique({
        where: { userId: userID }
    });

    if (!tokenRecord) {
        // This should only happen if no record is found and not a Prisma error; wrapper already sent response
        reply.clearCookie('refreshToken');
        return false;
    }

    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (!verifyRefreshToken(tokenRecord, hashedToken, userID, reply)) {
        // Invalidate: clear cookie and delete refresh token from DB
        reply.clearCookie('refreshToken');
        await deleteRefreshTokenFromDB(db, userID);
        return false;
    }
    return true;
}

async function createRefreshToken(userID: number, reply: FastifyReply, db: PrismaClient) {
    const rawToken: string = crypto.randomBytes(32).toString('hex');
    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Delete old token if exists, then create new one
    if (await deleteRefreshTokenFromDB(db, userID) === false) {
        return false;
    }

    const currentTime: Date = new Date();
    const expiryDate: Date = new Date(currentTime.getTime() + REFRESH_TOKEN_TIME);

    const created = await db.jWTRefreshToken.create({
        data: {
            userId: userID,
            tokenHash: hashedToken,
            iat: currentTime,
            exp: expiryDate
        }
    });

    if (!created) {
        return false;
    }

    reply.setCookie('refreshToken', rawToken, {
      httpOnly: true,
      sameSite: 'lax', // or 'none' if cross-site
      secure: true,
      maxAge: REFRESH_TOKEN_TIME,
    });
    return true;
}

function verifyRefreshToken(tokenRecord: any, hashedToken: string, userID: number, fastify: any): boolean {
    if (tokenRecord.revoked) {
        fastify.log.warn(`[RefreshToken] User ${userID}: Token revoked`);
        return false;
    }
    if (new Date() > tokenRecord.exp) {
        fastify.log.warn(`[RefreshToken] User ${userID}: Token expired`);
        return false;
    }
    if (tokenRecord.tokenHash !== hashedToken) {
        fastify.log.warn(`[RefreshToken] User ${userID}: Hash mismatch`);
        return false;
    }
    return true;
}

async function deleteRefreshTokenFromDB(db: PrismaClient, userID: number, retries: number = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const result = await db.jWTRefreshToken.deleteMany({ where: { userId: userID } });
    if (result !== null) return true;
    await new Promise(res => setTimeout(res, 200)); // wait 200ms before retry
  }
  return false;
}


