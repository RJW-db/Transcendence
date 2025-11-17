import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
// const prisma = new PrismaClient();

export type MessageHandler = (
  socket: WebSocket,
  payload: any,
  prisma: PrismaClient,
  fastify: FastifyInstance
) => Promise<void> | void;

export const messageHandlers: Record<string, MessageHandler> = {
  'Register': handleRegister,
  'Login': handleLogin
};

async function handleRegister(
  socket: WebSocket,
  payload: { Alias: string; Email: string; Password: string },
  prisma: PrismaClient,
  fastify: FastifyInstance
) {
  try {
    fastify.log.info(`Registering user: ${payload.Email}`);
    // console.log('Registering user:', payload.Email);
    
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { Alias: payload.Alias },
          { Email: payload.Email }
        ]
      }
    });

    if (user) {
        fastify.log.info(`User already exists: ${JSON.stringify(user)}`);
        // fastify.log.info({ user }, 'User already exists');
        console.log('User already exists:', user);
		socket.send(JSON.stringify({
			type: 'RegisterResponse',
        	success: false
		}))
      return;
    }

    // Create user
    user = await prisma.user.create({
      data: {
        Alias: payload.Alias,
        Email: payload.Email,
        Password: payload.Password, // TODO: Hash password!
        Online: true,
        CreationDate: new Date(),
      },
    });
	socket.send(JSON.stringify({
			type: 'RegisterResponse',
        	success: true
		}))
    fastify.log.info(`User already exists: ${JSON.stringify(user)}`);
    // socket.send(JSON.stringify({
    //   type: 'RegisterResponse',
    //   success: true,
    //   user: { id: user.Id, alias: user.Alias, email: user.Email }
    // }));
  } catch (error) {
    console.error('Registration error:', error);
    // fastify.log.error('Registration error:', error);
    // socket.send(JSON.stringify({
    //   type: 'RegisterResponse',
    //   success: false,
    //   error: 'Registration failed'
    // }));
  }
}

async function handleLogin(
  socket: WebSocket,
  payload: { Alias: string; Password: string },
  prisma: PrismaClient,
  fastify: FastifyInstance
) {

    fastify.log.info(`Logging in user: ${payload.Alias}`);
    let user = await prisma.user.findFirst({
      where: { 
        AND: [
          { Alias: payload.Alias },
          { Password: payload.Password }
        ]
      }
    });

    if (user) {
        console.log('User logged in:', user);
      socket.send(JSON.stringify({
        type: 'LoginResponse',
        success: true,
        user: { id: user.ID, alias: user.Alias, email: user.Email }
      }));
    } else {
        console.log('Invalid login attempt for alias:', payload.Alias);
      socket.send(JSON.stringify({
        type: 'LoginResponse',
        success: false,
        error: 'Invalid alias or password'
      }));
    }
}