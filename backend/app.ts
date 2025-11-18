import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket } from 'ws';
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

import { messageHandlers } from './messageHandler';

const fastify = Fastify({
  logger: true // Enable logger for better development experience
});

// Register the WebSocket plugin
fastify.register(websocket);

// Define a WebSocket route
fastify.register(async function (fastify: FastifyInstance) {

  fastify.get('/ws', { websocket: true }, (socket : WebSocket, req : FastifyRequest) => {
      socket.on('message', (message: Buffer) => {

      
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        // switch (data.type) {
        //   case 'Register':
        //     {
        //       const userinfo : {Alias : string, Email : string, Password : string} = data.Payload;
        //       console.log('Registering user:', userinfo.Email);
        //       // handleRegister(socket, data.payload);
        //       break;
        //     }
        //   default:
        //     socket.send(JSON.stringify({ error: 'Unknown message type' }));
        // }

        const handler = messageHandlers[data.type];
        if (data.type) {
          handler(socket, data.Payload, prisma, fastify);
        } else {
          console.log('No handler for message type:', data.type);
          // crash
        }


      // Echo back the message received from the client
      // socket.send(`Echo from server: ${message}`);
      // fastify.log.info(`Received: ${message}`);
      });

    socket.on('close', () => {
      fastify.log.info('WebSocket connection closed.');
    });

    socket.on('error', (error : Error) => {
      fastify.log.error('WebSocket error:');
    });

    // Send a welcome message when a client connects
    socket.send('Welcome to the Fastify WebSocket server!');
  });
});


// Start the server
const start = async () => {
  try {
    // Listen on '0.0.0.0' to be accessible from outside the container
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://0.0.0.0:8080`);
    fastify.log.info(`WebSocket endpoint: ws://0.0.0.0:8080/ws`);

    // let user = await prisma.user.findFirst({
    //   where: { 
    //     OR: [
    //       { Alias: 'Testuser' },
    //       { Email: 'test@test.com' }
    //     ]
    //   }
    // });

    // if (!user) {
    //   user = await prisma.user.create({
    //     data: {
    //       Alias: 'TestUser',
    //       Email: 'test@test.com',
    //       Password: 'password123',
    //       Online: true,
    //       CreationDate: new Date(),
    //     },
    //   });
    //   console.log('Created User:', user);
    // } else {
    //   console.log('Found existing User:', user);
    // }

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

