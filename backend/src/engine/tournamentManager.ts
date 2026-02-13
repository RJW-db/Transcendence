import { GameWorkerManager } from './workerManager';
import { MyServer } from '../types';
import { MySocket } from '../types';

export class TournamentManager {

	constructor(private io: MyServer, private Socket: MySocket, private gameManager: GameWorkerManager) {}

	private round = 0;
	private continue = true;
	private players: MySocket[] = [];
	private winners: MySocket[] = [];

	update = async() => {
		if (this.round === 0) {
			const sockets = await this.io.in('Tournament').fetchSockets();
			sockets.forEach((socket: any) => {
				this.players.push(socket);
				this.winners.push(socket);
			});
			// this.startRound();
		}
		if (this.round % 2 === 1) {
			this.winners.forEach((socket: any) => {
				if (socket.data.matchID)
					return ;
			});
			//call function to check winners and remove losers from winners array
			this.round += 1;

		}

		if (this.round === 0) {}
	}

	// startRound = async() => {
	// 	// const sockets = await this.io.in('Tournament').fetchSockets();
	// 	let i = 0;
	// 	if (this.winners.length === 1) {
	// 		//last player in winners wins the tournament, finish and exit tournament from here
	// 	}
	// 	while (i < this.winners.length - 1) {
	// 		let matchID = i;
	// 		if (this.winners[i].connected === true) {
	// 			this.winners[i].join(matchID);
	// 			this.winners[i].data.matchID = matchID;
	// 		}
	// 		else {
	// 			//p1 will be AI
	// 		}
	// 		if (this.winners[i + 1].connected === true) {
	// 			this.winners[i + 1].join(matchID);
	// 			this.winners[i + 1].data.matchID = matchID;
	// 		}
	// 		else {
	// 			//p2 will be AI
	// 		}
	// 		this.gameManager.createGame(matchID, this.winners[i].data.userId, this.winners[i + 1].data.userId);
	// 		i += 2;
	// 	}
	// 	if (this.winners.length % 2 !== 0) {
	// 		//last remaining socket will play against AI
	// 	}
	// 	this.round += 1;
	// }







//   addParticipant(userId: number) {

//     this.checkAndStartTournament();
//   }

//   private checkAndStartTournament() {
//     // If we have 4 or 8 players, generate brackets
//     if (this.participants.size === 8) {
//       this.startRound([/* array of pairs */]);
//     }
//   }

//   private startRound(pairs: [number, number][]) {
//     pairs.forEach(([p1, p2]) => {
//       const matchId = `tourney_match_${p1}_${p2}`;
      
//       // Tell the engine to start a physics loop for this specific match
//       this.gameManager.createGame(matchId, p1, p2);
      
//       // Notify the players via their private rooms
//       this.io.to(`user:${p1}`).to(`user:${p2}`).emit('match_ready', { matchId });
//     });
//   }
}