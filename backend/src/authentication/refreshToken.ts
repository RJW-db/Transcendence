import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import type { Database } from '../database/database';

export const REFRESH_TOKEN_TIME = parseInt(process.env.JWT_REFRESH_TOKEN_DAYS ?? "30", 10) * 24 * 60 * 60; // in seconds

export async function refreshUserToken(userID: number, request: FastifyRequest, reply: FastifyReply, db: Database) {
    const rawToken: string = request.cookies.refreshToken || '';
    if (!rawToken) {
        const created = await createRefreshToken(userID, reply, db);
        if (!created) {
            reply.clearCookie('refreshToken');
        }
        return created;
    }

    const tokenRecord = await db['JWTRefreshToken'].findUnique({ where: { userId: userID } }, { logMessage: 'Finding refresh token in refreshUserToken' });
    if (!tokenRecord) {
        reply.clearCookie('refreshToken');
        return false;
    }

    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (!verifyRefreshToken(tokenRecord, hashedToken, userID, reply)) {
        reply.clearCookie('refreshToken');
        await db['JWTRefreshToken'].deleteMany({ where: { userId: userID } }, { logMessage: 'Deleting refresh token in refreshUserToken' });
        return false;
    }
    return true;
}

async function createRefreshToken(userID: number, reply: FastifyReply, db: Database) {
    const rawToken: string = crypto.randomBytes(32).toString('hex');
    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Delete old token if exists, then create new one
    await db['JWTRefreshToken'].deleteMany({ where: { userId: userID } }, { logMessage: 'Deleting old refresh token in createRefreshToken' });

    const currentTime: Date = new Date();
    const expiryDate: Date = new Date(currentTime.getTime() + REFRESH_TOKEN_TIME * 1000);

    const created = await db['JWTRefreshToken'].create({
        data: {
            userId: userID,
            tokenHash: hashedToken,
            iat: currentTime,
            exp: expiryDate
        }
    }, { logMessage: 'Creating refresh token in createRefreshToken' });
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

