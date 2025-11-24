import Fastify, { FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
import { apimessageHandlers, ApiMessageHandler } from './messageHandler';
const clients = new Map<Socket, number>();


const fastify = Fastify({
  logger: true // Enable logger for better development experience
});


// When fastify is ready, initialize Socket.IO
fastify.ready((error) => {
	if (error) throw error;
});


const io = new Server(fastify.server, {
cors: {
	origin: "*", // Allow all origins for simplicity, adjust in production
	methods: ["GET", "POST"]
},
path: '/ws'
});
let dataid = 0;
io.on('connection', (socket: Socket) => {
	console.log(`Socket connected: ${socket.id}`);
	io.emit('message','welcome from server ');
	io.emit('game','game event!! ');

	socket.on('message', (data: string) => {
		console.log(`Message from ${socket.id}: ${data}`);
		io.emit('message', `Server received: ${data}`); // Broadcast to all connected clients
	});
	socket.on('login', (data: number) => {
		clients.set( socket, data + dataid);
		console.log(`Added userid ${data + dataid} with socketid ${socket.id}`);
		clients.forEach((id, socketid) => {
			console.log(`Current connected users:${id} && ${socketid.id}`);
		})
		dataid++;
	});
	socket.on('disconnect', () => {
		console.log(`Socket disconnected: ${socket.id}`);
		clients.delete(socket);
		clients.forEach((id, socketid) => {
			console.log(`Current connected users:${id} && ${socketid.id}`);
		})
	});
});

console.log('Socket.IO initialized');




//fastify.register(async function (fastify: FastifyInstance) {
fastify.post('/api', (request: FastifyRequest, reply: FastifyReply) => {
	try{
		const	data = request.body as any;
		if (data.type) {
			const	apiHandler = apimessageHandlers[data.type];
			apiHandler(data.Payload, prisma, fastify, reply);
		}
		
	}catch{
		console.log('faild to parse or no type !')
		reply.status(400).send({message: `Bad request!`})
	}
	
	

});
//});


// Start the server
const start = async () => {
  try {
    // Listen on '0.0.0.0' to be accessible from outside the container
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://0.0.0.0:8080`);
    fastify.log.info(`WebSocket endpoint: ws://0.0.0.0:8080/ws`);



  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

