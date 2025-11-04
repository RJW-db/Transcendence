
//const	fastify = require('fastify')({logger: true});



// const fastify = require('fastify')({
//   disableRequestLogging: true, // Turn off automatic logging
//   logger: true
// });
// const { LIMIT_WORKER_THREADS } = require('sqlite3');
// const	playerClass = require('./Player.js');

// fastify.register(require('@fastify/websocket'));

import	Fastify from 'fastify';
import	wsRoutes from './WSRoute.js';
const	fastify = Fastify({
	disableRequestLogging: true,
	logger: true
});

import websocket from '@fastify/websocket';
fastify.register(websocket);
fastify.register(wsRoutes);



// fastify.addHook('onRequest', (request, reply, done) => {
// 	request.log.info({req: request}, 'client send a request');
// 	done();
// });


// fastify.addHook('onSend', (request, reply, done) => {
// 	request.log.info({req: request}, 'before sending response to client');
// 	done();
// });

// fastify.addHook('onClose', (instance, done) => {
// 	request.log.warn({req: request}, 'Server is closing, shutting down connections...');
// 	done();
// });
// fastify.addHook('onError', (request, reply, error) => {
// 	request.log.error({err: error}, 'fastify Error');
// });




fastify.get('/health', async (request, reply) => {

  return { status: 'ok' };
});



// fastify.register(async function (fastify){
// 	fastify.get('/ws', {websocket: true}, (socket, req) => {
// 		fastify.log.info("connecting new client :")
// 		for (const client of clients.values()){
// 			if (client.socket === socket){
// 				console.log("Existing client reconnected, ignoring.");
// 				return;
// 			}
// 			// console.log(`client id ${client.id} and client role ${client.role}.`);
// 			// console.log(`{number of clinet are ${clientCounter}}`);
// 		}
// 		//console.log('client try to connect !!')
// 		const clientId = Math.random().toString(36).substring(2, 9);
// 		const myPlayer = new playerClass(socket, clientId);

// 		clients.set(clientId, myPlayer);
// 		let	clientCounter = 0;
// 		for (const client of clients.values()){
// 			console.log(`client id ${client.id} and client role ${client.role}.`);
// 			console.log(`{number of clinet are ${clientCounter}}`);
// 			++clientCounter;
// 		}
// 		console.log(`clienttt object size is ${clients.size}`);


// 		console.log(`Client id is ${clientId} connected.`);
// 		socket.on('message', message => {
// 			fastify.log.info('client send a request : ')
// 			//console.log(`Received message from ${clientId}:`, message.toString());
// 			handlePlayerInput(myPlayer, message.toString());
// 		});
// 		socket.on('close', () => {
// 			fastify.log.warn('client disconnected :')
// 			deleteClient(myPlayer);
			
// 		});
// 	});
// });




// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const { request } = require('http');
// // const { Interface } = require('readline');
// // const { json } = require('stream/consumers');
// // const Player = require('./player');

// const dbPath = path.join(__dirname, 'data', 'app.sqlite');
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     fastify.log.error('Could not connect to database', err);
//     process.exit(1);
//   }
//   fastify.log.info('Connected to SQLite database.');
//     db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)', (err) =>{
// 		if (err){
// 			fastify.log.error('Could not create users table', err);
// 		}else {
// 			fastify.log.info('Users table is ready.');
// 		}
// 	});
// });
// fastify.decorate('db', db);




// let	dbId = 0;








const start = async () => {
  try {
    await fastify.listen({ host: '0.0.0.0', port: 3000 });
    
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Call the function to actually start the server!
start();
