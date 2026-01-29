
import { SocketContext } from '../types';
import { PrismaClient } from '@prisma/client';
import { TournamentManager } from '../engine/tournamentManager';
const prisma = PrismaClient;

export const tournamentHandler = ({ io, socket, gameManager }: SocketContext) => {
  
  socket.on('joinTournament', async () => {

	if (gameManager.tournamentRunning === false)
		socket.join('Tournament')
	else {
		//Send tournament is full page to frontend
	}



	// let sockets = await io.in('Tournament').fetchSockets();
	// if (sockets.length < 8)
	// 	socket.join('Tournament')
	// //Check if at least 8 people waiting
	// sockets = await io.in('Tournament').fetchSockets();
	// if (sockets.length === 8) {
	// 	const	repeat = 1000;

	// 	const tournament = new TournamentManager(io, socket, gameManager);
	// 	setInterval(() => {
	// 		tournament.update();
	// 		if (gameOnProgress)
	// 			return;

	// 		const matchID = `tournamentGame:`;
	// 		sockets[nextSocket].join(matchID);
	// 		sockets[nextSocket].data.matchID = matchID;
	// 		sockets[nextSocket + 1].join(matchID);
	// 		sockets[nextSocket + 1].data.matchID = matchID;

	// 		//Start match
	// 		gameManager.createGame(matchID, sockets[nextSocket].data.userId, sockets[nextSocket + 1].data.userId);
	// 		gameOnProgress = true;
	// 		if ( sockets[nextSocket].data.matchId = null ){
	// 			// create two rooms 1. for winners 2.for losers 
	// 			findWinner(sockets[nextSocket].data.userId);

				
	// 			gameOnProgress = false;
	// 			nextSocket += 2;
				
	// 		}
			
	// 	}, repeat);

	// }
  });

  socket.on('startTournament', () => {
	gameManager.tournamentRunning = true;
	const	repeat = 1000;

	const tournament = new TournamentManager(io, socket, gameManager);
	socket.data.tournament = tournament;
	tournament.startRound();
	setInterval(() => {
		tournament.update();
	}, repeat);
  })

  socket.on('leaveTournament', () => {
    // Logic for leaving
  });
};