import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

export const serverHandler = ({ io, socket, gameManager, db }: SocketContext) => {
	
	socket.on('sendMessage', (msg: string) => {
		console.log(`In serverHandler: ${msg}`);
		// io.emit
	})

	//Sends userid to gameManager so it knows which user left
	socket.on('disconnect', () => {
		console.log(`Socket disconnected: ${socket.id}`);
		console.log(`userId : ${socket.data.userId}, matchId :${socket.data.matchID}`)
		if (socket.data.matchID)
			gameManager.destroyGame(socket.data.matchID, socket.data.userId);
		

	});
}