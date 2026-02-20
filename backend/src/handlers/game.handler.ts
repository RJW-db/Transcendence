import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Example DB
import { Logger } from 'pino'; // Example Logger

import { SocketContext } from '../types';

export const gameHandler = ({ io, socket, gameManager, db }: SocketContext) => {
	
	socket.on('gameEvent', async (msg: string) => {
		console.log(`${msg}`);
		// console.log(`In gameHandler cookie test: ${socket.data.cookie}`);
	})

	socket.on('gameKey', (msg: any) => {
		console.log(`Key pressed: ${msg}`);
		if (socket.data.matchID)
			gameManager.handleInput(socket.data.matchID, socket.data.userId, msg);
	})

	socket.on('joinGame', async (msg: string) => {
		throw new Error("tester");
		//Add users to waiting room
		socket.join('waitRoom');
		console.log("user joined")
		//Check if at least 2 people waiting
		const sockets = await io.in('waitRoom').fetchSockets();
		if (sockets.length === 2)
		{
			// Create Match entry in db
			const match = await db.match.create({
				data: {
					Player1ID: sockets[0].data.userId,
					Player2ID: sockets[1].data.userId
					// status: 'PENDING'
				}
			});

			// Create room for match
			const matchID = `game:${match.ID}`;
			// const matcIDD = `game:`;
			sockets[0].join(matchID);
			sockets[0].data.matchID = matchID;
			sockets[1].join(matchID);
			sockets[1].data.matchID = matchID;
			io.in(matchID).socketsLeave('waitRoom');

			//Start match
			gameManager.createGame(match.ID, matchID, sockets[0].data.userId, sockets[1].data.userId);
		}

	})
}