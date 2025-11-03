
//const	fastify = require('fastify')({logger: true});
const fastify = require('fastify')({
  disableRequestLogging: true, // Turn off automatic logging
  logger: true
});
const { LIMIT_WORKER_THREADS } = require('sqlite3');
const	playerClass = require('./Player.js');
//const	matchObject = require('./matchObject.js');
fastify.register(require('@fastify/websocket'));
const { fork } = require('child_process');
const { constrainedMemory } = require('process');

const	clients = new Map();
const	childProcessMap = new Map();


let	playersWaitForMatch = [];
//let	matchIdesArray = [];
const	matchsList = new Map();
// let	playersInMatch = {
// 	p1 : null,p2 : null
// };

fastify.addHook('onClose', (request, reply, done) => {
	request.log.warn({req: request}, 'closing socket');
	done();
})


fastify.get('/health', async (request, reply) => {

  return { status: 'ok' };
});

fastify.register(async function (fastify){
	fastify.get('/ws', {websocket: true}, (socket, req) => {
		fastify.log.info("connecting new client :")
		for (const client of clients.values()){
			if (client.socket === socket){
				console.log("Existing client reconnected, ignoring.");
				return;
			}
			// console.log(`client id ${client.id} and client role ${client.role}.`);
			// console.log(`{number of clinet are ${clientCounter}}`);
		}
		//console.log('client try to connect !!')
		const clientId = Math.random().toString(36).substring(2, 9);
		const myPlayer = new playerClass(socket, clientId);

		clients.set(clientId, myPlayer);
		let	clientCounter = 0;
		for (const client of clients.values()){
			console.log(`client id ${client.id} and client role ${client.role}.`);
			console.log(`{number of clinet are ${clientCounter}}`);
			++clientCounter;
		}
		console.log(`clienttt object size is ${clients.size}`);


		console.log(`Client id is ${clientId} connected.`);
		socket.on('message', message => {
			fastify.log.info('client send a request : ')
			//console.log(`Received message from ${clientId}:`, message.toString());
			handlePlayerInput(myPlayer, message.toString());
		});
		socket.on('close', () => {
			fastify.log.warn('client disconnected :')
			deleteClient(myPlayer);
			
		});
	});
});

function	deleteClient(player){
	const	id = player.id;
	for(let i = 0; i < playersWaitForMatch.length; ++i){
		if (playersWaitForMatch[i].id === id){
			playersWaitForMatch.pop();
			break;
		}
	}
	clients.delete(player.id);
	console.log(`Client ${id} disconnected and removed from map.`);
}


function	handleRegisterRequest(){

}



const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { request } = require('http');
// const { Interface } = require('readline');
// const { json } = require('stream/consumers');
// const Player = require('./player');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    fastify.log.error('Could not connect to database', err);
    process.exit(1);
  }
  fastify.log.info('Connected to SQLite database.');
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)', (err) =>{
		if (err){
			fastify.log.error('Could not create users table', err);
		}else {
			fastify.log.info('Users table is ready.');
		}
	});
});
fastify.decorate('db', db);




let	dbId = 0;

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

// adding the match script
// const match = require('./match.js');
let matchChild = null;
function	findMatch(player, data){
	console.log('find match () ', playersWaitForMatch.length);
	if (playersWaitForMatch.length > 0){
		const	MATCHID = addToMatchList(player, playersWaitForMatch.pop());

		// player.assignRole('player2');
		// console.log("second player and role is :", player.role);

		// const	MATCHID = Math.random().toString(36).substring(2, 9);
		// player.matchId = MATCHID;
		// const	firstPlayer = playersWaitForMatch.pop();
		// firstPlayer.matchId = MATCHID;
		// const	playersInMatch = {
		// 	p1 : firstPlayer,p2 : player
		// };

		// matchsList.set(MATCHID, playersInMatch);

		// const	payload = {
		// 	status : 'match_found'
		// }

		
		// firstPlayer.sendMessage('match status', payload);
		// player.sendMessage('match status', payload);
		// pass to the match script
		console.log("two players ready to start!!");
		matchChild = fork('./match.js');
		childProcessMap.set(MATCHID, matchChild);
		console.log("after fork main server ");
		matchChild.send({type: 'init', MATCHID});
		console.log(" after sending message to child");
		matchChild.on('message', message => {
			// catch message from child process
			const	id = message.object.matchID;
			//console.log("id is ", id);
			if (id !== 0){
				if(message.type === 'gameState'){
					const	players = matchsList.get(id);
					//console.log(' does he find it ', players.p1.role);
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


function	handlePlayerInput(player, message){

	const	data = JSON.parse(message);

	switch (data.type) {
		case "register" :

			break;
		case "playing with AI" :

			break;
		case "find match" :
			findMatch(player, data);
			break;
		case "playPause" :
			playAndPause(player, data);
			break;
		case "move" :
			moveHandle(player, data);
			break;
	}

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

const start = async () => {
  try {
    // CRITICAL for Docker: Listen on '0.0.0.0' to accept connections from outside the container
    await fastify.listen({ host: '0.0.0.0', port: 3000 });
    
    // Log the addresses the server is listening on
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Call the function to actually start the server!
start();
