import { FastifyInstance, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from "crypto";
import { generateJWT, JWT_SECRET } from './jsonWebToken';


export async function getGoogleUserInfo(token: string, fastify: FastifyInstance, reply: FastifyReply): Promise<{ email: string; name: string } | null> {
      fastify.log.info(`Handling OAuth token: ${token}`);
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        fastify.log.error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        reply.status(500).send({ message: 'Failed to fetch user info from OAuth provider' });
        return null;
    }
    const userInfo = await response.json() as { email: string; name: string };
    return userInfo;
}

export async function generateCookie(userId: number, prisma: PrismaClient, reply: FastifyReply, fastify: FastifyInstance): Promise<boolean> {
  const sessionId = randomUUID();
  const sessionJWT = generateJWT(userId, JWT_SECRET, 86400 * 7); // 7 days

  try {
    await prisma.cookie.create({
      data: {
        UserID: userId,
        CookieValue: sessionId,
      },
    });

    reply.cookie('sessionId', sessionId, { maxAge: 86400000 * 7, httpOnly: true });
    reply.cookie('auth', sessionJWT, { maxAge: 86400000 * 7, httpOnly: true });

    fastify.log.info(`Created cookie in DB for user ID: ${userId} with sessionId: ${sessionId}`);
    return true;
  } catch (error) {
    fastify.log.error(`Failed to create cookie: ${error}`);
    return false;
  }
}
