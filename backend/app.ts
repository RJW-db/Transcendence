import Fastify from 'fastify';
import websocket from '@fastify/websocket';
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true // Enable logger for better development experience
});

// Register the WebSocket plugin
fastify.register(websocket);

// Define a WebSocket route
fastify.register(async function (fastify: any) {

  fastify.get('/ws', { websocket: true }, (socket : any, req : any) => {
      socket.on('message', (message: any) => {
      // Echo back the message received from the client
      socket.send(`Echo from server: ${message}`);
      fastify.log.info(`Received: ${message}`);
      });

    socket.on('close', () => {
      fastify.log.info('WebSocket connection closed.');
    });

    socket.on('error', (error : any) => {
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
  //   const user = await prisma.user.create({
	// 	data: {
	// 		Alias: 'TestUser',
	// 		Email: 'test@test.com',
	// 		Password: 'password123',
	// 		Online: true,
	// 		CreationDate: new Date(),
	// 	},
	// });

	// console.log('Created User:', user);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

