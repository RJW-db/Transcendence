import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import {verifyToken, generateSecret, generateCookie} from './TOTP'
import { handleOauthToken, oauthRegister, oauthLogin} from './oauth';
const { serialize, parse } = require('@fastify/cookie')

// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;


const apiHandleLogout: ApiMessageHandler = async (
  payload,
  request,
  prisma,
  fastify,
  reply
) => {
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
};

const apiHandleLogin: ApiMessageHandler = async (
  payload: { Email: string; Password: string; Token2fa: string},
  request,
  prisma,
  fastify,
  reply
) => {
    fastify.log.info(`Handling login for email: ${payload.Email}`);
    const user = await prisma.user.findUnique({
      where: { Email: payload.Email },
    });
    if (!user) {
      fastify.log.error(`User not found for email: ${payload.Email}`);
      reply.status(400).send({ message: 'Invalid email or password' });
      return;
    }

    // Here you would normally check the password hash
    // For simplicity, we assume the password is stored in plain text (not recommended)
    if (user.Password !== payload.Password) {
      fastify.log.error(`Invalid password for email: ${payload.Email}`);
      reply.status(400).send({ message: 'Invalid email or password' });
      return;
    }
    if (!(await verifyToken(payload.Token2fa, user.Secret2FA))) {
      fastify.log.error(`Invalid code entered for email: ${payload.Email}, code provided: ${payload.Token2fa}`);
      reply.status(400).send({ message: 'Invalid 2FA token entered' });
      return;
    }
    // Set a cookie or session here if needed
    const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
    if (!dbCookie) 
      return;
    fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
    reply.status(200).send({ message: 'Login successful', user: { id: user.ID, alias: user.Alias, email: user.Email } });
}

const apiHandleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string, Secret: string, VerifyToken: string },
  request,
  prisma,
  fastify,
  reply
) => {
  console.log("register api called with payload:", payload);
  if (!payload.Alias || !payload.Email || !payload.Password || !payload.Secret) {
    fastify.log.error(`Incomplete user info received:' ${JSON.stringify(payload)}`);
    reply.status(500).send({ message: 'Incomplete user info received to register account' });
    return;
  }
  if (!(await verifyToken(payload.VerifyToken, payload.Secret))) {
    fastify.log.error(`Incorrect Token entered for registration:' ${JSON.stringify(payload)}`);
    reply.status(400).send({message: "Incorrect Token entered"});
    return;
  }
  const user = await prisma.user.create({
    data: {
      Alias: payload.Alias,
      Email: payload.Email,
      Password: payload.Password,
      Secret2FA: payload.Secret,
      OauthLogin: false,
      Online: true,
      CreationDate: new Date(),
    },
  });
  if (!user) {
    fastify.log.info(`failed to Register user:' ${JSON.stringify(payload)}`);
    reply.status(400).send({ message: "Failed to create user object" });
  }
  reply.status(200).send({ message: "Created new user with email: " + user.Email });
}

const apiCheckAccountExists: ApiMessageHandler = async (
  payload: { Alias: string; Email: string },
  request,
  prisma,
  fastify,
  reply
) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ Email: payload.Email }, { Alias: payload.Alias }] }
  });
  if (user) {
    let message = '';
    if (user.Email == payload.Email && user.Alias == payload.Alias)
      message = "user with email: " + payload.Email + " and alias: " + payload.Alias + " already exists";
    else if (user.Email == payload.Email)
      message = "user with email: " + payload.Email + " already exists";
    else
      message = "user with alias: " + payload.Alias + " already exists";
    reply.status(400).send({ message: message });
  }
  const secret = generateSecret();
  fastify.log.info(`Generated secret for new user: ${secret}`);
  reply.status(200).send({ message: "No accounts with email: " + payload.Email + " or alias: " + payload.Alias + " exist", secret: secret });
};

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'oauthToken': handleOauthToken,
  'registerUser': apiHandleRegister,
  'loginUser': apiHandleLogin,
  'logoutUser': apiHandleLogout,
  'checkAccountExists': apiCheckAccountExists,
  'oauthRegister': oauthRegister,
  'oauthLogin': oauthLogin
};
