import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import { PrismaClient } from '@prisma/client';

import { randomUUID } from "crypto";


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


export async function generateCookie(userId : number, prisma: PrismaClient, reply: FastifyReply, fastify: FastifyInstance) : Promise<any> {
      const sessionId : string = randomUUID();
      reply.setCookie('sessionId', sessionId, {
          httpOnly: true, // js cannot access this cookie for security reasons
          path: '/', 
          secure: process.env.NODE_ENV === 'production', // Send only over HTTPS unless localhost for production
          sameSite: 'lax', // Protects against CSRF
          maxAge: 24 * 60 * 60 * 7 // Expire after 7 days (in seconds)
      });
      const dbCookie = await prisma.cookie.create({
        data: {
          UserID: userId,
          CookieValue: sessionId
        },
      });
      if (!dbCookie) {
        fastify.log.error(`Failed to create cookie for user ID: ${userId}`);
        reply.status(500).send({ message: 'Failed to create cookie session' });
        return;
      }
      fastify.log.info(`Created cookie in DB for user ID: ${userId} with sessionId: ${sessionId}`);
      return dbCookie;
}
