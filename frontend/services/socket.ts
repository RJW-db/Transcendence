import { io, Socket } from 'socket.io-client';

// Initialize the socket once
export const socket: Socket = io({
  path: '/ws',
  autoConnect: true, // Connect automatically
});

socket.on('connect', () => {
	// Check if this is a RE-connection (not the first load)
	console.log(`${socket.recovered} && ${window.performance.navigation.type}`)
	if (socket.recovered === false && window.performance.navigation.type !== 1) {
		console.log("Server rebooted. Refreshing for latest version...");
		window.location.reload();
	}
	console.log('Connected to Socket.IO server!');
	// Emit an event to the server
	socket.emit('login', 1);
	console.log("Requesting unread messages...");
	socket.emit('loadUnreadMessages', (response) => {
		if (!response.success) {
			console.error("Error:", response.error);
		} else {
			console.log("Request success");
		}
	});
	//socket.emit('message', 'Hello from the client!');
});

socket.on('disconnect', () => {
	console.log('Disconnected from Socket.IO server.');
	socket.connect();
});