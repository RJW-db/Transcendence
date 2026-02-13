import { io, Socket } from 'socket.io-client';

// Initialize the socket once
export const socket: Socket = io({
  path: '/ws',
  autoConnect: true, // Connect automatically
});

socket.on('connect', () => {
	console.log('Connected to Socket.IO server!');
	// Emit an event to the server
	socket.emit('login', 1);
	//socket.emit('message', 'Hello from the client!');
});

socket.on('disconnect', () => {
	console.log('Disconnected from Socket.IO server.');
});