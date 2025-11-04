const	clients = new Map();
import	playerClass from './Player.js';
import gameHandler, {cleanUpClientDisconnected} from './gameAPI.js';
//import dbHandler from './dbAPI.js';

const messageHandlers = {
  game: gameHandler,
  db: null,
};


export default async function (fastify) {
	fastify.get('/ws', { websocket: true }, (socket, req) => {
		console.log('inside fastify');
		fastify.log.info('client try to connect');

		const clientId = Math.random().toString(36).substring(2, 9);
		const myPlayer = new playerClass(socket, clientId);

		clients.set(clientId, myPlayer);
		socket.on('message', message => {
			try  {
				const data = JSON.parse(message.toString());
				console.log (`type is ${data.type}`);
				if (messageHandlers[data.type]) {
					console.log('inside if');
					messageHandlers[data.type](fastify,socket, data, myPlayer);
				} else {
					fastify.log.warn(`No handler for message type: ${data.type}`);
				}

			} catch (error) {
					fastify.log.error('Error parsing message or handling request:', error);
			}
		});
		socket.on('close', () => {
			fastify.log.warn('client disconnected :')
			deleteClient(myPlayer);
			cleanUpClientDisconnected(myPlayer);
			
		});
	});
};


function	deleteClient(player){
	const	id = player.id;
	// for(let i = 0; i < playersWaitForMatch.length; ++i){
	// 	if (playersWaitForMatch[i].id === id){
	// 		playersWaitForMatch.pop();
	// 		break;
	// 	}
	// }
	// clients.delete(player.id);
	console.log(`Client ${id} disconnected and removed from map.`);
}
