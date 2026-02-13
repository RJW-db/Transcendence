import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

export const serverHandler = ({ io, socket }: SocketContext) => {
	
	socket.on('sendMessage', (msg: string) => {
		console.log(`In serverHandler: ${msg}`);
		// io.emit
	})

	socket.on('disconnect', () => {
		console.log(`Socket disconnected: ${socket.id}`);
		console.log(`userId : ${socket.data.userId}, machId :${socket.data.matchID}`)
		

	});
}