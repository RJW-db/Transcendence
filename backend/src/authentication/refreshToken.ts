import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { db } from '../database/database';

export const REFRESH_TOKEN_TIME = parseInt(process.env.JWT_REFRESH_TOKEN_DAYS ?? "30", 10) * 24 * 60 * 60; // in seconds

export async function refreshUserToken(userID: number, request: FastifyRequest, reply: FastifyReply) {
    const rawToken: string = request.cookies.refreshToken || '';
    if (!rawToken) {
        const created = await createRefreshToken(userID, reply);
        if (!created) {
            reply.clearCookie('refreshToken');
        }
        return created;
    }

    const tokenRecord = await db.findRefreshToken(userID, reply);
    if (!db.isDatabaseOperationSuccessful() || !tokenRecord) {
        reply.clearCookie('refreshToken');
        return false;
    }

    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (!verifyRefreshToken(tokenRecord, hashedToken, userID, reply)) {
        reply.clearCookie('refreshToken');
        await db.deleteRefreshToken(userID, reply);
        return false;
    }
    return true;
}

async function createRefreshToken(userID: number, reply: FastifyReply) {
    const rawToken: string = crypto.randomBytes(32).toString('hex');
    const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Delete old token if exists, then create new one
    const deleted = await db.deleteRefreshToken(userID, reply);
    if (!db.isDatabaseOperationSuccessful() || !deleted) {
        return false;
    }

    const currentTime: Date = new Date();
    const expiryDate: Date = new Date(currentTime.getTime() + REFRESH_TOKEN_TIME);

    const created = await db.createRefreshToken({
        userId: userID,
        tokenHash: hashedToken,
        iat: currentTime,
        exp: expiryDate
    }, reply);
    if (!db.isDatabaseOperationSuccessful() || !created) {
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

