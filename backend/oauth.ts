import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import {verifyToken, generateSecret, generateCookie} from './TOTP'
import type { ApiMessageHandler } from './messageHandler';


export const handleOauthToken: ApiMessageHandler = async (
  payload: { Token: string },
  request,
    prisma,
    fastify,
    reply
) => {
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
    const user = await prisma.user.findFirst({
      where: { OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }
    });
    if (user) {
      if (user.OauthLogin === false) {
        fastify.log.error(`User exists but is not an OAuth user: ${JSON.stringify(user)}`);
        reply.status(400).send({ message: 'User exists but is not an OAuth user' });
        return;
      }
      reply.status(200).send({oauthAccount: true} );
      return ;
    }
    else {
        const secret = generateSecret();
        fastify.log.info(`created secret for: ${userInfo.email} secret: ${secret}`);
        reply.status(200).send({email: userInfo.email, secret2FA : secret});
        return ;
    }
}


export const oauthRegister: ApiMessageHandler = async (  
    payload: { Token: string, Secret2FA: string },
  request,
  prisma,
  fastify,
  reply

) => {
    const userInfo : { email: string; name: string } | null = await getGoogleUserInfo(payload.Token, fastify, reply);
    if (!userInfo) {
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
  if (!user) {
    fastify.log.info(`failed to Register OAuth user:' ${JSON.stringify(payload)}`);
    reply.status(400).send({ message: "Failed to create OAuth user object" });
    return;
  }
  fastify.log.info(`Created new OAuth user: ${JSON.stringify(user)}`);
  const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
  if (!dbCookie)
      return;
  fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: 'OAuth login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}

export const oauthLogin: ApiMessageHandler = async (
  payload: { Token: string, loginToken: string },
  request,
  prisma,
  fastify,
  reply

) => {
  const userInfo: { email: string; name: string } | null = await getGoogleUserInfo(payload.Token, fastify, reply);
  if (!userInfo) {
    return;
  }
  const user = await prisma.user.findFirst({
    where: { OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }
  });
  if (!user) {
    reply.status(400).send({ message: 'No such OAuth user' });
    return;
  }
  fastify.log.info(`Verifying 2FA token for OAuth login: ${payload.loginToken}, user secret: ${user.Secret2FA}`);
  if (!(await verifyToken(payload.loginToken, user.Secret2FA))) {
    fastify.log.error(`Invalid 2FA token for OAuth registration`);
    reply.status(400).send({ message: 'Invalid 2FA token' });
    return;
  }
  const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
  fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: 'OAuth login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}

async function getGoogleUserInfo(token: string, fastify: FastifyInstance, reply: FastifyReply): Promise<{ email: string; name: string } | null> {
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