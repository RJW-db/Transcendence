



// const { fork } = require('child_process');
// const { constrainedMemory } = require('process');

import	{fork} from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const	matchScriptPath = path.join(__dirname, 'match.js');

import	{constrainedMemory} from 'process';
const	childProcessMap = new Map();
let		playersWaitForMatch = [];
const	matchsList = new Map();






function handleGameLogic(fastify, socket, data, player) {
  fastify.log.info('Handling game logic for subType:', data.subtype);
  console.log(`subtype is : ${data.subtype}`);
  // Your game-related logic here
  switch (data.subtype) {
    case 'findMatch':
		findMatch(player, data);
		break;
    case 'move':
		moveHandle(player, data);
      break;
	case "playPause" :
		playAndPause(player, data);
		break;
	case "playerLeftGamePage" :
		removePlayer(player, data);
		break;


    default:
      socket.send(JSON.stringify({ error: 'Unknown game subType' }));
  }
}

export default handleGameLogic;




function	addToMatchList(player2, player1){
	player2.assignRole('player2');
	console.log("second player and role is :", player2.role);

	const	MATCHID = Math.random().toString(36).substring(2, 9);
	player2.matchId = MATCHID;
	player1.matchId = MATCHID;
	const	playersInMatch = {
		p1 : player1 ,p2 : player2
	};

	matchsList.set(MATCHID, playersInMatch);

	const	payload = {
		status : 'match_found'
	}

	
	player1.sendMessage('match status', payload);
	player2.sendMessage('match status', payload);
	return (MATCHID);

}




let	cpGameState = null;
function	findMatch(player, data){
	console.log('find match () ', playersWaitForMatch.length);
	if (playersWaitForMatch.length > 0){
		const	MATCHID = addToMatchList(player, playersWaitForMatch.pop());

		console.log("two players ready to start!!");
		
		//matchChild = fork('./src/match.js');
		const  matchChild = fork(matchScriptPath);
		childProcessMap.set(MATCHID, matchChild);
		console.log("after fork main server ");
		matchChild.send({type: 'init', MATCHID});
		console.log(" after sending message to child");
		matchChild.on('message', message => {
			const	id = message.object.matchID;
			if (id !== 0){
				if(message.type === 'gameState'){
					const	players = matchsList.get(id);
					cpGameState = message.object.gameState;
					broadcastGameState(players, message.object.gameState);
				}else if (message.type === 'gameOver'){
					// add result to db
					// delete players from matchlist
					const	players = matchsList.get(id);
					broadcastWinnerMessage(players, message.object.winner);
				}
			}
		})
		matchChild.on('exit', (code, signal) => {
			if (signal === 'SIGTERM')
				return;
			console.log('child on exit');
			childProcessMap.delete(MATCHID);
			const players = matchsList.get(MATCHID)
			players.p1.role = null;
			players.p2.role = null;
			console.log(`match list map BEFORE delete size is : ${matchsList.size} .`);
			matchsList.delete(MATCHID);
			console.log(`match list map AFTER delete size is : ${matchsList.size} .`);
			
		});


	}else{
		const	payload = {
			status : 'waiting_for_player'
		}
		player.sendMessage({type: 'match status', payload});
		player.assignRole('player1');
		console.log("player wait");
		playersWaitForMatch.push(player);
	}
}

function	removePlayer(player, data){
	
	const matchId = player.matchId;
	console.log('remove player func', matchId);
	if ( matchId !== null) {
		console.log(`player with role ${player.role} has laft the mathc !!`);  
	}

}

export	function cleanUpClientDisconnected(player){
	console.log(`Handling disconnect for player ID: ${player.id}`);
	const	waitIndex = playersWaitForMatch.findIndex(p => p.clientId === player.clientId);
	if (waitIndex > -1){
		// player was on waiting just remove it from this array
		playersWaitForMatch.splice(waitIndex, 1);
		return;
	}
	const	matchId = player.matchId;
	if (matchId){
		const	players = matchsList.get(matchId);
		const	childP = childProcessMap.get(matchId);
		const	playerRoleDisconnected = player.role;
		let	playerAvalable = null;
		if (players.p1.role === playerRoleDisconnected){
			playerAvalable =  players.p2;
			cpGameState.score.p2 = 8;
		}else{
			playerAvalable =  players.p1;
			cpGameState.score.p1 = 8;
		}
		// announe the avalible player the other player disconnected and you are wins the match
		if (playerAvalable && playerAvalable.socket.readyState === 1){
			playerAvalable.sendMessage('opponentDisconnected', cpGameState);
		}
		if (childP){
			console.log('terminate the child process!!!');
			childP.kill();

			childProcessMap.delete(matchId);
			matchsList.delete(matchId);
		}

		

	}

}

function	playAndPause(player, data){
	console.log("main server playAndPause");
	const	id = player.matchId;
	const	players = matchsList.get(id);
	const	btn = data.body.btn;
	const	matchChild = childProcessMap.get(id);
	matchChild.send({type: "playPause", body: btn});


}

function	moveHandle(player, data){
	const	id = player.matchId;
	// const	players = matchsList.get(id);
	const	matchChild = childProcessMap.get(id);
	const	role = player.role;
	const	body = {role, data};
	matchChild.send({type: "move", body: body});

}


function broadcastGameState(player, gameState) {
	//console.log("check if player object is been here ", player.p2.role);

	if (player.p1.socket.readyState === 1) { // 1 means OPEN
		//console.log('broad cast');
		player.p1.sendMessage("gameStateUpdate", gameState);
		//player.p1.socket.send(gameState);
	}
	if (player.p2.socket.readyState === 1) { // 1 means OPEN
		player.p2.sendMessage("gameStateUpdate", gameState);
		//match.p2.socket.send(gameState);
	}
}

function	broadcastWinnerMessage(player, winner){
	console.log("send game over to front end !!!")
	if (player.p1.socket.readyState === 1) {
		player.p1.sendMessage("gameOver", winner);
	}
	if (player.p2.socket.readyState === 1) {
		player.p2.sendMessage("gameOver", winner);
	}
}