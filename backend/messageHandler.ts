import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply} from 'fastify';
// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'oauthLogin': apiHandleOAuthLogin
};

async function apiHandleOAuthLogin(
  payload: { Token: string },
	prisma: PrismaClient,
	fastify: FastifyInstance,
	reply: FastifyReply
) {
    fastify.log.info(`Handling OAuth token: ${payload.Token}`);
        fastify.log.info(`Handling OAuth token: ${payload.Token}`);
     const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${payload.Token}`
      }
    });
    if (!response.ok) {
      fastify.log.error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      reply.status(500).send({ message: 'Failed to fetch user info from OAuth provider' });
      return;
    }
    const userInfo = await response.json() as { email: string; name: string };
    if (!userInfo.email || !userInfo.name) {
      fastify.log.error(`Incomplete user info received:' ${JSON.stringify(userInfo)}`);
      reply.status(500).send({ message: 'Incomplete user info received from OAuth provider' });
      return;
    }
    let user = await prisma.user.findFirst({
      where: { OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }
    });
    
    if (!user) {
        user = await prisma.user.create({
        data: {
          Alias: userInfo.name,
          Email: userInfo.email,
          OauthLogin: true,
          Online: true,
          CreationDate: new Date(),
        },
      });
      fastify.log.info(`Created new OAuth user: ${JSON.stringify(user)}`);
    } else {
      fastify.log.info(`Found existing OAuth user: ${JSON.stringify(user)}`);
    }
    reply.status(200).send({ message: 'OAuth login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}


