import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply} from 'fastify';
import { addListener } from 'process';
import { userInfo } from 'os';
// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'oauthLogin': apiHandleOAuthLogin,
  'registerUser': apiHandleRegister
};

async function apiHandleRegister(
  payload: { Alias: string; Email: string; Password: string },
	prisma: PrismaClient,
	fastify: FastifyInstance,
	reply: FastifyReply
) {
    if (!payload.Alias || !payload.Email || !payload.Password) {
      fastify.log.error(`Incomplete user info received:' ${JSON.stringify(payload)}`);
      reply.status(500).send({ message: 'Incomplete user info received from OAuth provider' });
      return;
    }
    let user = await prisma.user.findFirst({
      where: { OR: [{ Email: payload.Email }, { Alias: payload.Alias }] }
    });
    
    if (!user) {
        user = await prisma.user.create({
        data: {
          Alias: payload.Alias,
          Email: payload.Email,
          OauthLogin: true,
          Online: true,
          CreationDate: new Date(),
        },
      });
      fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
    } else {
      // check if alias or email already exists
      fastify.log.error(`User already exists: ${JSON.stringify(user)}`);
      if (user.Email == payload.Email ) {
        fastify.log.error(`Email already exists: ${payload.Email}`);
        reply.status(400).send({ message: 'Email already exists' });
        return;
      }
      else if (user.Alias == payload.Alias ) {
        fastify.log.error(`Alias already exists: ${payload.Alias}`);
        reply.status(400).send({ message: 'Alias already exists' });
        return;
      }
    }
    reply.status(200).send({ message: 'OAuth login successful', user: { id: user.ID} });


}
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

