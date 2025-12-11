import Fastify, { FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { fork, ChildProcess } from 'child_process';
const { PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
import { apimessageHandlers, ApiMessageHandler } from './handlers/messageHandler';
import { SocketContext, MyServer, MySocket } from './types';
import { gameHandler } from './handlers/game.handler';
import { serverHandler } from './handlers/server.handler';
const clients = new Map<Socket, number>();

const matchlist = new Map<ChildProcess, Match>();

class Match{
	socket1 : Socket;
	socket2 : Socket;
	uid1 : any;
	uid2 : any;
	constructor(socketP1: Socket, socketP2: Socket, uidP1 : number, uidP2 : number){
		this.socket1 = socketP1;
		this.socket2 = socketP2;
		this.uid1 = uidP1;
		this.uid2 = uidP2;
	}
}


const fastify = Fastify({
  logger: true // Enable logger for better development experience
});


// When fastify is ready, initialize Socket.IO
fastify.ready((error) => {
	if (error) throw error;
});


const io: MyServer = new Server(fastify.server, {
cors: {
	origin: "*", // Allow all origins for simplicity, adjust in production
	methods: ["GET", "POST"]
},
path: '/ws'
});
let dataid = 0;
//console.log("client .size is ", clients.size);


io.on('connection', (socket: MySocket) => {
	console.log(`Socket connected: ${socket.id}`);
	clients.set( socket, dataid);
	if (!clients.has(socket)){
		console.log("Failed to add client to map");
	}
	// io.emit('chatMessage','welcome from server ');
	// io.emit('chatMessage','game event!! ');

	const ctx: SocketContext = {
		io,
		socket,
		// db: prisma, // Assuming you decorated fastify with prisma
		// logger: fastify.log,
	};
	dataid++;
	socket.data.cookie = 'cookie';
	gameHandler(ctx);
	serverHandler(ctx);

	// socket.on('startmatch', () => {
	// 	if (clients.size === 2){
	// 		console.log("we have two clients !");
	// 		let i = 0;
	// 		let firstSocket : Socket | undefined;
	// 		let secondSocket : Socket | undefined;
	// 		let uid1 : any;
	// 		let uid2 : any;
	// 		for (const [socket , id] of clients){
	// 			if (i === 0){
	// 				firstSocket = socket;
	// 				uid1 = id;
	// 			}else if (i === 1){
	// 				secondSocket = socket;
	// 				uid2 = id;
	// 			}
	// 			++i;
	// 		}
	// 		if (firstSocket && secondSocket){
	// 			const	match = new Match(firstSocket, secondSocket, uid1, uid2);
	// 			console.log("match created ");
	// 		}
	// 	}
	// });

	// socket.on('message', (data: string) => {
	// 	console.log(`Message from ${socket.id}: ${data}`);
	// 	io.emit('message', `Server received: ${data}`); // Broadcast to all connected clients
	// });
	// socket.on('login', (data: number) => {
	// 	// clients.set( socket, data + dataid);
	// 	console.log(`Added userid ${data + dataid} with socketid ${socket.id}`);
	// 	clients.forEach((id, socketid) => {
	// 		console.log(`Current connected users:${id} && ${socketid.id}`);
	// 	})
	// 	// dataid++;
	// });
	// socket.on('gamestate', (data: string) => {
	// 	console.log(`${data} has been pressed`);
	// })
	// socket.on('gamekey', (data: string) => {
	// 	console.log(`${data} key pressed`);
	// })
	// socket.on('disconnect', () => {
	// 	console.log(`Socket disconnected: ${socket.id}`);
	// 	clients.delete(socket);
	// 	clients.forEach((id, socketid) => {
	// 		console.log(`Current connected users:${id} && ${socketid.id}`);
	// 	})
	// });
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

