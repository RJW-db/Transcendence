import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';

// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  request: FastifyRequest,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

import {handleRegister, checkAccountExists, createGuestAccount} from '../login/handleRegister';
import {handleLogin, oauthLogin, handleLogout} from '../login/handleLogin';
import {handleOauthToken, oauthRegister} from '../login/oauthRegister';
import { create } from 'node:domain';

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'registerUser': handleRegister,
  'loginUser': handleLogin,
  'logoutUser': handleLogout,
  'checkAccountExists': checkAccountExists,
  'oauthToken': handleOauthToken,
  'oauthRegister': oauthRegister,
  'oauthLogin': oauthLogin,
  'createGuestAccount': createGuestAccount,
};
