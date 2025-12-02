import Fastify, { FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket } from 'ws';
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
export const cookie = require('@fastify/cookie');
import type { FastifyCookieOptions } from '@fastify/cookie'


import { apimessageHandlers } from './messageHandler';
import { json } from 'stream/consumers';
import { getMessageHandlers } from './getMessageHandler';

export const fastify = Fastify({
  logger: true // Enable logger for better development experience
});

// Register the WebSocket plugin

// export fastiftCookieOptions
export const fastifyCookieOptions: FastifyCookieOptions = {
    secret: 'my-secret', // for cookies signature
    parseOptions: {}     // options for parsing cookies
  };

fastify.register(cookie, fastifyCookieOptions); 

// // Define a WebSocket route
// fastify.register(async function (fastify: FastifyInstance) {

//   fastify.get('/ws', { websocket: true }, (socket : WebSocket, req : FastifyRequest) => {
//       socket.on('message', (message: Buffer) => {
//       });

//     socket.on('close', () => {
//       fastify.log.info('WebSocket connection closed.');
//     });

//     socket.on('error', (error : Error) => {
//       fastify.log.error('WebSocket error:');
//     });

//   });
// });

fastify.register(async function (fastify: FastifyInstance) {
	fastify.post('/api', (request: FastifyRequest, reply: FastifyReply) => {
		try{
			//const	data = JSON.parse(request.body as string);
			// connect to db and return the result

			const	data = request.body as any;
			if (data.type) {
				const	apiHandler = apimessageHandlers[data.type];
				apiHandler(data.Payload, request, prisma, fastify, reply);
			}
			
		}catch{
			console.log('faild to parse or no type ! in post /api')
			reply.status(401).send({message: `Bad request!`})
		}
		
		

	})
});

fastify.register(async function (fastify: FastifyInstance) {
	fastify.get('/api', (request: FastifyRequest, reply: FastifyReply) => {
		try{
			//const	data = JSON.parse(request.body as string);
			// connect to db and return the result
      const query = request.query as any;
			// const	data = request.querySelector as any;
      if (!query.type) {
        throw new Error('No type specified in query parameters');
      }
      const	data = { type: query.type, Payload: {} };
      const	apiHandler = getMessageHandlers[data.type];
      apiHandler(request, prisma, fastify, reply);
        
			// if (data.type) {
			// 	const	apiHandler = apimessageHandlers[data.type];
			// 	apiHandler(data.Payload, prisma, fastify, reply);
			// }
			
		}
    catch{
			console.log('faild to parse or no type ! in get /api')
			reply.status(401).send({message: `Bad request!`})
		}
	})
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

