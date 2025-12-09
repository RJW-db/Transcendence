import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

export const gameHandler = ({ io, socket, db, logger }: SocketContext) => {
	
}