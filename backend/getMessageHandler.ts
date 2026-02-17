import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest,  FastifyInstance, FastifyReply} from 'fastify';
import { fastify } from './app'

export type getMessageHandler = (
  request : FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

export const getMessageHandlers: Record<string, getMessageHandler> = {
    'getUserInfo': apiHandleGetUserInfo
    };

async function apiHandleGetUserInfo(
    request : FastifyRequest,
    prisma: PrismaClient,
    fastify: FastifyInstance,
    reply: FastifyReply
) {
    fastify.log.info(`Handling getUserInfo request`);
    // Here you would normally authenticate the user using cookies or tokens
    // For simplicity, we will skip authentication in this example
    // Fetch user info from the database
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
        fastify.log.error('No current login found(sessionID missing)');
        reply.status(401).send({ message: 'No current login found' });
        return;
    }
    fastify.log.info(`Found sessionId cookie: ${sessionId}`);
    const dbCookie = await prisma.cookie.findUnique({
        where: { CookieValue: sessionId },
        include: { User: true },
    });
    if (!dbCookie || !dbCookie.User) {
        fastify.log.error('No current login found(dbCookie missing)');
        reply.status(401).send({ message: 'No current login found' });
        return;
    }
    fastify.log.info(`Found dbCookie user: ${dbCookie.User}`);
    const user = dbCookie.User;
    fastify.log.info(`Found user: ${user.Alias}`);
    // Return user info
    reply.status(200).send({
        user: {
            Alias: user.Alias,
            Email: user.Email,
            Online: user.Online.toString(),
            CreationDate: user.CreationDate,
        },
    });
}

