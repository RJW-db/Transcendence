import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

export const gameHandler = ({ io, socket, gameManager }: SocketContext) => {
	
	socket.on('gameEvent', async (msg: string) => {
		console.log(`${msg}`);
		// console.log(`In gameHandler cookie test: ${socket.data.cookie}`);
	const sockets = await io.in('1').fetchSockets();
	if (sockets.length == 2)
	{
		console.log("Start game");
		gameManager.createGame('1', sockets[0].data.userId, sockets[1].data.userId);
	}
	})

	socket.on('gameKey', (msg: any) => {
		console.log(`Key pressed: ${msg}`);
		gameManager.handleInput('1', socket.data.userId, msg);
	})
}