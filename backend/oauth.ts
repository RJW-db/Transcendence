import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import {verifyToken, generateSecret} from './TOTP'


export async function handleOauthToken(
  payload: { Token: string },
  request: FastifyRequest,
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
    if (user) {
      if (user.OauthLogin === false) {
        fastify.log.error(`User exists but is not an OAuth user: ${JSON.stringify(user)}`);
        reply.status(400).send({ message: 'User exists but is not an OAuth user' });
        return;
      }
      reply.status(200).send({oauthAccount: true} );
    }
    else {
        const secret = generateSecret();
        fastify.log.info(`created secret for: ${userInfo.email} secret: ${secret}`);
        reply.status(200).send({email: userInfo.email, secret2FA : secret});
    }
}


export async function oauthRegister(
  payload: { Token: string, Secret2FA: string },
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) {
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

  const user = await prisma.user.create({
    data: {
      Alias: userInfo.name,
      Email: userInfo.email,
      Secret2FA : payload.Secret2FA,
      OauthLogin: true,
      Online: true,
      CreationDate: new Date(),
    },
  });
  fastify.log.info(`Created new OAuth user: ${JSON.stringify(user)}`);
  const sessionId: string = `session-${user.ID}-${Date.now()}`;
  reply.setCookie('sessionId', sessionId, { httpOnly: true });
  // reply.setCookie('sessionId', user.ID.toString(), { httpOnly: true });
  const dbCookie = await prisma.cookie.create({
    data: {
      UserID: user.ID,
      CookieValue: sessionId
    },
  });
  if (!dbCookie) {
    fastify.log.error(`Failed to create cookie for user ID: ${user.ID}`);
    reply.status(500).send({ message: 'Failed to create session' });
    return;
  }
  console.log('Created cookie in DB:', dbCookie);
  reply.status(200).send({ message: 'OAuth login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}