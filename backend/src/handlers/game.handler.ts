import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

interface Vector2 {
  x: number;
  y: number;
}

export class GameStateInfo {
    private leftPaddleY: number;
    private rightPaddlyY: number;
    private ballPos: Vector2:
    private directionDegrees: number;
};



export const gameHandler = ({ io, socket, db }: SocketContext) => {
	
}