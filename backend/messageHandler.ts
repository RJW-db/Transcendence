import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
// import { addListener } from 'process';
// import { userInfo } from 'os';

const { serialize, parse } = require('@fastify/cookie')

import type { fastifyCookieOptions } from './app'
import { fastify } from './app'



// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'oauthLogin': apiHandleOAuthLogin,
  'registerUser': apiHandleRegister,
  'loginUser': apiHandleLogin,
  'logoutUser': apiHandleLogout
};

async function apiHandleLogout(
  payload: { },
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
        fastify.log.error('No sessionId cookie found for logout');
        reply.status(400).send({ message: 'failed to delete sessionId cookie' });
        return;
    }
    // Delete the cookie from the database
    const deletedCookie = await prisma.cookie.deleteMany({
        where: { CookieValue: sessionId },
    });
    if (deletedCookie.count === 0) {
        fastify.log.error(`No cookie found in DB for sessionId: ${sessionId}`);
    } else {
        fastify.log.info(`Deleted cookie from DB for sessionId: ${sessionId}`);
    }
    // Clear the cookie in the response
    reply.clearCookie('sessionId');
    fastify.log.info(`User logged out successfully for sessionId: ${sessionId}`);
    reply.status(200).send({ message: 'Logout successful' });
}

async function apiHandleLogin(
  payload: { Email: string; Password: string },
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) {
    fastify.log.info(`Handling login for email: ${payload.Email}`);
    const user = await prisma.user.findUnique({
      where: { Email: payload.Email },
    });
    if (!user) {
      fastify.log.error(`User not found for email: ${payload.Email}`);
      reply.status(400).send({ message: 'Invalid email or !password' });
      return;
    }
    // Here you would normally check the password hash
    // For simplicity, we assume the password is stored in plain text (not recommended)
    if (user.Password !== payload.Password) {
      fastify.log.error(`Invalid password for email: ${payload.Email}`);
      reply.status(400).send({ message: 'Invalid !email or password' });
      return;
    }
    // Set a cookie or session here if needed
    const sessionId : string = `session-${user.ID}-${Date.now()}`;
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
    fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
    reply.status(200).send({ message: 'Login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}

async function apiHandleRegister(
  payload: { Alias: string; Email: string; Password: string },
  request: FastifyRequest,
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
          Password: payload.Password,
          OauthLogin: false,
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
    const sessionId : string = `session-${user.ID}-${Date.now()}`;
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

