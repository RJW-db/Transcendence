import Fastify from 'fastify';
import websocket from '@fastify/websocket';

const fastify = Fastify({
  logger: true // Enable logger for better development experience
});

// Register the WebSocket plugin
fastify.register(websocket);

// Define a WebSocket route
fastify.get('/ws', { websocket: true }, (socket, req) => {
  	socket.on('message', message => {
    // Echo back the message received from the client
    socket.send(`Echo from server: ${message}`);
    fastify.log.info(`Received: ${message}`);
  });

  socket.on('close', () => {
    fastify.log.info('WebSocket connection closed.');
  });

  socket.on('error', (error) => {
    fastify.log.error('WebSocket error:');
  });

  // Send a welcome message when a client connects
  socket.send('Welcome to the Fastify WebSocket server!');
});

// Start the server
const start = async () => {
  try {
    // Listen on '0.0.0.0' to be accessible from outside the container
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://0.0.0.0:8080`);
    fastify.log.info(`WebSocket endpoint: ws://0.0.0.0:8080/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();