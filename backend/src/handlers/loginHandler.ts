import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import { Database } from '../database/database';
// const prisma = new PrismaClient();


export type ApiMessageHandler = (
  payload: any,
  request: FastifyRequest,
  db: Database,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

import {handleRegister, handleRegisterTotp, createGuestAccount} from '../login/handleRegister';
import {handleLoginPassword, handleLoginTotp, oauthLogin, handleLogout} from '../login/handleLogin';
import {handleOauthToken, oauthRegister} from '../login/oauthRegister';
import { create } from 'node:domain';

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'registerUser': handleRegister,
  'registerTotp': handleRegisterTotp,
  'loginUser': handleLoginPassword,
  'verifyTotp': handleLoginTotp,
  'logoutUser': handleLogout,
  'oauthToken': handleOauthToken,
  'oauthRegister': oauthRegister,
  'oauthLogin': oauthLogin,
  'createGuestAccount': createGuestAccount,
};