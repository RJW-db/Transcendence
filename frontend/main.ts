import io  from 'socket.io-client';


const socket = io ({
	path: '/ws'
});



socket.on('connect', () => {
	console.log('Connected to Socket.IO server!');
	// Emit an event to the server
	//socket.emit('message', 'Hello from the client!');
});
	socket.on('disconnect', () => {
	console.log('Disconnected from Socket.IO server.');
});

socket.on('message', (msg) => {
	console.log('Received message in message :', msg);

	// You can update your UI here with the received message
});
socket.on('game', (msg) => {
	console.log('Received message in game:', msg);
	
	// You can update your UI here with the received message
});







// Register button event listener
const registerButton = document.getElementById('registerButton') as HTMLButtonElement;
registerButton.addEventListener('click', () => {
  console.log('Register button clicked');

	registerUser();
	
});

// Login button event listener
const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
loginButton.addEventListener('click', () => {
  console.log('Login button clicked');

	loginUser();
});

const	upgrade = document.getElementById('upgradeConnectionButton') as HTMLButtonElement;
upgrade.addEventListener('click', () => {
	console.log('upgrade button clicked');
	socket.emit('message', 'Hello from the client!');
	socket.emit('login', 1);
});



async	function registerUser(){
	try {
    	const response = await fetch('/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				type: 'Register',
				Payload: {
					Alias: 'Hulk Hogan',
					Email: 'testemail',
					Password: 'testpass'
				} 
			}),
    	});
		if (!response.ok) { // Check if the request was successful (status code 2xx)
			const errorData = await response.json();
			throw new Error(errorData.message || 'register failed');
		}
		const data = await response.json();
		console.log('register successful:', data);
		return data;
	} catch (error) {
		console.error('Error during register:', error.message);
		throw error; // Re-throw to be handled by the caller
	}
}

async function loginUser() {
  try {
    const response = await fetch('/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				type: 'Login',
				Payload: {
					Alias: '',
					Password: 'testpass'
				} 
			}),
		});

		if (!response.ok) { // Check if the request was successful (status code 2xx)
			const errorData = await response.json();
			throw new Error(errorData.message || 'Login failed');
		}

		const data = await response.json();
		console.log('Login successful:', data);
		// You'll likely get a JWT token or session ID here
		// Store it (e.g., in localStorage) and redirect the user
		return data;
  	} catch (error) {
		console.error('Error during login:', error.message);
		throw error; // Re-throw to be handled by the caller
	}
}