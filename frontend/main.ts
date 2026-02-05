import io  from 'socket.io-client';
import './styles.css';


const	views = {
	firstPage: `
		<header class="game-header">
		<h1>Pong</h1>
		<nev class="buttons">
			<div class="tournament">
				<button id="tournament-btn" class="leftsidebtn">Tournament</button>
				<p id="tournament-players-error" class="error-amount-players" style="display: none;"></p>
				<button id="add-btn" class="leftsidebtn">Add player &plus;</button>	
			</div>
			<div class="playingButton">
				<button id="game-btn" class="centerbtn">Game</button>
			</div>
			<div class="registeringButtons">
				<button id="register-btn" class="rightsidebtn">registration</button>
				<button id="log-btn" class="rightsidebtn">log in</button>
			</div>
		</nev>
	</header>
	<dialog id="modal-addPlayer-id">
		<div class="modal-addPlayer-content">
			<button class="close-addPlayer-btn">&times;</button>
			<form id="modal-form-addPlayer">
				<div class="form-group-addPlayer">
					<label for="alies">Alies</label>
					<input type="text" id="alies" name="alies" required>
				</div>
				<button type="submit" id="modal-submit-addPlayer-btn">Submit</button>
			</form>
		</div>
	</dialog>
	<dialog id="modal-overlay" hidden>
		<div class="modal-content">
			<button class="close-btn">&times;</button>
			<h2 id="modal-title">modal-title</h2>
			<form id="modal-form">
				<div class="form-group">
					<label for="username">Username</label>
					<input type="text" id="username" name="username" required>
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input type="password" id="password" name="password" required>
				</div>
				<div class="form-group" id="confirm-password-group" style="display: none;">
					<label for="confirm-password">Confirm Password</label>
					<input type="password" id="confirm-password" name="confirm-password" required>
					<p id="password-error" class="error-message"></p>
				</div>
				<button type="submit" id="modal-submit-btn">Submit</button>
			</form>
		</div>
	</dialog>
	`, gamePage:`
	<div class="game-view-container">
		<div id="gamePageHeader" class="gamePageH">
			<p class="placeHolder"></p>
			<p id="aliesLeftPlayerId" class="aliesMessage"> Player 1</p>
			<button id="playBtn" class="gamePageHeaderBtn"> Play </button>
			<button id="pauseBtn" class="gamePageHeaderBtn"> Pause </button>
			<p id="aliesRightPlayerId" class="aliesMessage"> player 2</p>
			<p class="placeHolder"></p>
		</div>
		<main class="game-aria">
			<div class="vertical-dash-line"></div>
			<div id="left-paddle" class="side-line"></div>
            <div id="right-paddle" class="side-line"></div>
            <div id="ball" class="ball"></div>
            <div id="left-score" class="score">0</div>
            <div id="right-score" class="score">0</div>
			<p id="winner-message" class="winner-message-style" style="display: none;"></p>
		</main>
		<button id="back-to-lobby-btn" class="back-button"> Back to main page</button>
	</div>
	`, gameType:`
	    
	<div class="game-type-container">
		<h2>Choose Your Opponent</h2>
		<div class="game-type-buttons">
			<button id="play-with-ai-btn" class="game-type-btn">Play with AI</button>
			<button id="play-with-person-btn" class="game-type-btn">Play with Another Person</button>
		</div>
		<div id="waiting-message" class="waiting-message" style="display: none;">
			<p>Waiting for another player to join...</p>
			<div class="spinner"></div>
		</div>
	</div>
	`
};

type ViewName = keyof typeof views;
const app = document.getElementById('app');

function render(viewName : ViewName) {
    if (!app || !views[viewName]) {
        console.error('App container or view not found!');
        return;
    }

    // Set the HTML content of our stage
    app.innerHTML = views[viewName];

    if (viewName === 'firstPage') {
        //attachMainPageListeners();
    } else if (viewName === 'gamePage') {
    	attachGameListeners();
    } else if (viewName === 'gameType') {
		//attachGameTypeListeners();
	}

}
render('gamePage');

function attachGameListeners() {
    console.log("Attaching Game Listeners...");
	const	startPlayBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
	const	pausePlayBtn =document.getElementById('pauseBtn') as HTMLButtonElement | null;
	


	document.addEventListener('keydown', handleKeyPress);
	startPlayBtn!.addEventListener('click', (event) =>
		btnPressed('startPlay', event));
	pausePlayBtn!.addEventListener('click', (event) =>
		btnPressed('pausePlay', event));
    
    // NOTE: Remember to REMOVE the keydown listener when leaving the game page
    // to avoid sending paddle movements from the lobby!
}


function	btnPressed(which: string, event: Event) {
	console.log(`event.targat is => ${event.target}!`);
	let body : {};
	let	btn : string;
	switch (which)
	{
		case 'startPlay':
			btn = 'startPlay';
			socket.emit('sendMessage', 'Message from client');
			break;
		case 'pausePlay':
			btn = 'pausePlay';
			socket.emit('joinGame', 'Message from client for cookie test')
			break;
		default :
			console.log('unknown button pressed!');
			btn = 'none';
			break;
	}
	if (btn === 'none')
		return;
	body = {btn : btn};
	console.log('btn pressed!');

	if (socket.connected) {
		console.log('open and send!');
		socket.emit('gamestate', btn);
	} else {
		// Log an error so you know why the message wasn't sent.
		console.error('WebSocket is not connected. readyState:', socket.connected);
	}

}

function	handleKeyPress(event: KeyboardEvent){

	let direction = null;
	let body = {};
	console.log(`event key target is ${event.key}`);
	if (event.key === 'w' || event.key === 'o' || event.key === 'ArrowUp'){
		direction = 'up';
	}else if(event.key === 's' || event.key === 'l' || event.key === 'ArrowDown' ){
		direction = 'down';
	}
	if (direction !== null){
		body = {direction : direction};
		socket.emit('gameKey', direction);
	}
}




const socket = io ({
	path: '/ws'
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

socket.on('message', (msg) => {
	console.log('Received message in message :', msg);

	// You can update your UI here with the received message
});
socket.on('game', (msg) => {
	console.log('Received message in game:', msg);
	
	// You can update your UI here with the received message
});

socket.on('gameState', (msg: any) => {
	console.log('Received gamestate');
	renderGameState(msg, false);
})

socket.on('finished', (msg: any) => {
	console.log('Received finished');
	renderGameState(msg, true);
})






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

function	movingBall(x : number, y : number){
	// console.log(`ball x is ${x} ball y is ${y}`);
	const	ballPercentX = (x / 800 ) * 100;
	const	ballPercentY = (y / 600) * 100;
	const	ball = document.querySelector('#ball') as HTMLElement | null;
	if (ball){
		ball.style.left = `${ballPercentX}%`;
		ball.style.top = `${ballPercentY}%`;
	}
	
}


function updatePaddlePosition(leftPX : number, leftPY : number, rightPX : number, rightPY: number) {
	// console.log(`left paddle pos is ${leftPY} right paddle pos is ${rightPY}`);
	const	leftPaddle = document.querySelector('#left-paddle') as HTMLElement | null;
	const	rightPaddle = document.querySelector('#right-paddle') as HTMLElement | null;






	const	leftPaddlePercent = (leftPY / 600) * 100;
	const	rightPaddlePercent = (rightPY / 600) * 100;
	const	leftPaddleXPercent = (leftPX / 800) * 100;
	const	rightPaddleXPercent = (rightPX / 800) * 100;
	if (leftPaddle && rightPaddle){
		leftPaddle.style.left = `${leftPaddleXPercent}%`;
		leftPaddle.style.top = `${leftPaddlePercent}%`;
		rightPaddle.style.left = `${rightPaddleXPercent}%`;
		rightPaddle.style.top = `${rightPaddlePercent}%`;
	}
}

function	updateScore(scoreBoardLeft: number, scoreBoardRight : number){
	const	leftScore = document.querySelector('#left-score') as HTMLElement | null;
	const	rightScore = document.querySelector('#right-score') as HTMLElement | null;
	if (leftScore && rightScore){
		leftScore.textContent = scoreBoardLeft.toString();
		rightScore.textContent = scoreBoardRight.toString();
	}
	
}

function	renderGameState(gameState : any, finished: boolean){
	updatePaddlePosition(gameState.p1X, gameState.p1Y, gameState.p2X, gameState.p2Y);
	movingBall(gameState.ball.x, gameState.ball.y);
	updateScore(gameState.score.p1, gameState.score.p2);
	if (finished) {
		const winnerMessage = document.getElementById('winner-message') as HTMLElement;
		if (gameState.score.p1 > gameState.score.p2)
			winnerMessage.textContent = "P1 won!";
		else
			winnerMessage.textContent = "P2 won!";
		winnerMessage.style.display = 'block';
	}
}