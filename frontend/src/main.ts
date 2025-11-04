

import './styles.css';

interface GameState {
    ball: {
        x: number;
        y: number;
    };
    player1: {
        y: number;
    };
    player2: {
        y: number;
    };
    score: {
        p1: number;
        p2: number;
    };
}


const SERVER_GAME_WIDTH = 800;
const SERVER_GAME_HEIGHT = 600;
const app = document.getElementById('app');

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









// connection

let ws: WebSocket;
let WS_URL: string;
if (window.location.hostname === 'localhost') {
    // When developing locally, use the standard proxied URL
    WS_URL = `ws://${window.location.host}/ws`;
} else {
    // When on ngrok, connect to a DIFFERENT port (e.g., 3001) on the same host.
    // We will map this port directly to the backend.
    WS_URL = `wss://${window.location.hostname}/ws`;
    // Use 'wss://' (secure) because ngrok URLs are https.
}
let reconnectDelay : number  = 1000;
function connectWebSocket() {
	// Use wss:// for secure connections in production
	// The '/ws' path matches the endpoint on our server
	console.log('function connectWebSocket');
	ws = new WebSocket(WS_URL);

	ws.onopen = () => {
		console.log('Connected to game server!');
		reconnectDelay = 1000;
	};

	ws.onmessage = (event) => {
		// The server sent us the new game state. We will handle this later.
		
		const data = JSON.parse(event.data);
		console.log('Message received from server:', data.type);
		switch (data.type){
			case 'gameStateUpdate' :
				const gameState = data.payload as GameState;
				renderGameState(gameState);
				break;
			case 'match status' :
				if (data.payload.status === 'waiting_for_player') {
					console.log("Server confirms: We are in the queue.");
				} else if (data.payload.status === 'match_found') {
					console.log("Match found! Starting game ");
					render('gamePage');
				}
				break;
			case 'gameOver':
				showMessage(data.payload);
				break;
			case  'opponentDisconnected' :
				const lastGameState = data.payload as GameState;
				renderGameState(lastGameState);
				showDisconnectedMessage('Opponent Disconnected ');
				break;

		}
		// if (data.type === 'gameStateUpdate'){
		// 	const gameState = data.payload as GameState;
		// 	renderGameState(gameState);
		// }if (data.type === 'play with other person'){
		// 	isRoomEmpty = data.payload ;
		// }
	};

	ws.onclose = () => {
		console.log('Disconnected from game server. Attempting to reconnect...');
		setTimeout(connectWebSocket, reconnectDelay);
		reconnectDelay = Math.min(10000, reconnectDelay * 2);
	};
	ws.onerror = (error) => {
		console.error('WebSocket Error:', error);
	};
}


function render(viewName : ViewName) {
    if (!app || !views[viewName]) {
        console.error('App container or view not found!');
        return;
    }

    // Set the HTML content of our stage
    app.innerHTML = views[viewName];

    if (viewName === 'firstPage') {
        attachMainPageListeners();
    } else if (viewName === 'gamePage') {
        attachGameListeners();
    } else if (viewName === 'gameType') {
		attachGameTypeListeners();
	}

}

function attachMainPageListeners() {
    console.log("Attaching Lobby Listeners...");


	const	gameBtn = document.getElementById('game-btn') as HTMLButtonElement | null;
	const	registerBtn = document.getElementById('register-btn') as HTMLButtonElement | null;
	const	logBtn = document.getElementById('log-btn') as HTMLButtonElement | null;
	const	modalForm = document.getElementById('modal-form') as HTMLElement | null;
	const	closeBtn = document.querySelector('.close-btn') as HTMLElement | null;
	const	submitAddPlayer = document.getElementById('modal-submit-addPlayer-btn') as HTMLElement | null;
	const	tournamentButton = document.getElementById('tournament-btn') as HTMLElement | null;
	const	modalFormAddPlayer = document.getElementById('modal-form-addPlayer') as HTMLElement | null;
	const	addButton = document.getElementById('add-btn') as HTMLElement | null;
	const	closeAddPlayerBtn = document.querySelector('.close-addPlayer-btn') as HTMLButtonElement | null;
	const	aliesInput = document.getElementById('alies') as HTMLInputElement | null;
	const	modalAddPlayer = document.getElementById('modal-addPlayer-id') as HTMLDialogElement | null;
	const	tournamentPlayersAmountError = document.getElementById('tournament-players-error') as HTMLElement | null;


	if (!logBtn || !registerBtn || !modalForm || !tournamentButton || !addButton ||
		!closeBtn || !modalFormAddPlayer || !closeAddPlayerBtn) {
		console.error("Here : Initialization failed: A required element was not found in the DOM.");
		throw new Error("Game element missing.");
	}

    //button that switches to the game view
    gameBtn?.addEventListener('click', () => {
		console.log('game btn pressed!');
        render('gameType');
    });


	logBtn.addEventListener('click', () => {openModal('login')});
	registerBtn.addEventListener('click', () => {openModal('register')});
	//closeBtn.addEventListener('click', (closeModal));
	closeBtn.addEventListener('click', () => {closeModal()});
	tournamentButton.addEventListener('click', () => {tournamentPressed()});
	addButton.addEventListener('click', () => {addPressed()});
	modalForm.addEventListener('submit', (event) =>{modalFormHandlar(event)});
	closeAddPlayerBtn.addEventListener('click', () => {
		modalAddPlayer?.close();
	});


	modalFormAddPlayer.addEventListener('submit', (event) => {
		event.preventDefault();
		const	userAlies = aliesInput!.value;
		playersList.push(userAlies);
		modalAddPlayer?.close();
	});

	document.addEventListener('click' , (event) => {
		const	isClickInsideTournamentBtn = tournamentButton.contains(event.target as Node);
		if ( !isClickInsideTournamentBtn && tournamentPlayersAmountError!.style.display === 'block'){
			tournamentPlayersAmountError!.style.display = 'none';
		}
	});
}

function attachGameTypeListeners() {
    const playWithAiBtn = document.getElementById('play-with-ai-btn');
    const playWithPersonBtn = document.getElementById('play-with-person-btn');
    const waitingMessage = document.getElementById('waiting-message');
    const gameTypeButtons = document.querySelector('.game-type-buttons') as HTMLElement;

    if (playWithAiBtn) {
        playWithAiBtn.addEventListener('click', () => {
            // Logic to start a game against the AI
            console.log("Starting game with AI");
			const	message = {type : 'playing with AI'};
			ws.send(JSON.stringify(message));
            render('gamePage');
        });
    }

    if (playWithPersonBtn) {
        playWithPersonBtn.addEventListener('click', () => {
			console.log("send a play request!!");
			const	message = {type : 'game', subtype: 'findMatch'};
			ws.send(JSON.stringify(message));
            // Here you would check if the room is empty
            // For this example, we'll just simulate it
            //const isRoomEmpty = true; // This would come from your backend/server
			 if (gameTypeButtons) gameTypeButtons.style.display = 'none';
            if (waitingMessage) waitingMessage.style.display = 'block';
			console.log("Sent 'find_match' request. Now waiting for server response...");

			//console.log(`isRoomEmpty is ${isRoomEmpty}`);

            // if (isRoomEmpty) {
            //     // Hide buttons and show waiting message
            //     if (gameTypeButtons) gameTypeButtons.style.display = 'none';
            //     if (waitingMessage) waitingMessage.style.display = 'block';

            //     // Here you would wait for another player
            //     console.log("Waiting for another player...");
            // } else {
            //     // The room is not empty, so start the game
            //     console.log("Joining existing game...");
            //     render('gamePage');
            // }
        });
    }
}


function	openModal(which: string){
	const	modalOverlay = document.getElementById('modal-overlay') as HTMLDialogElement | null;
	const	modalTitle = document.getElementById('modal-title') as HTMLElement | null;
	const	confirmPassword = document.getElementById('confirm-password-group') as HTMLElement | null;
	const	submitBtn = document.getElementById('modal-submit-btn') as HTMLElement | null;
	const	modalAddPlayer = document.getElementById('modal-addPlayer-id') as HTMLDialogElement | null;
	if (!modalOverlay || !modalTitle || !modalAddPlayer|| !confirmPassword || !submitBtn)
		return;
	if (which == 'login'){
		modalTitle.textContent = "Log In";
		submitBtn.textContent = "Log In";
		confirmPassword.style.display = 'none';
		//modalAddPlayer?.show();
		modalOverlay.classList.add('active');
	}else if (which == 'register'){
		modalTitle.textContent = "Register";
		submitBtn.textContent = "Register";
		confirmPassword.style.display = 'flex';
		//modalOverlay?.show();
		//modalAddPlayer?.show();
		modalOverlay.classList.add('active');
	}

}

function	closeModal(){
	const	modalOverlay = document.getElementById('modal-overlay') as HTMLDialogElement | null;
	if (modalOverlay){
		modalOverlay.classList.remove('active');
	}
}


function	addPressed(){
	const	modalAddPlayer = document.getElementById('modal-addPlayer-id') as HTMLDialogElement | null;
	if (modalAddPlayer){
		console.log('add pressed');
		modalAddPlayer.showModal();
	}else {
		console.log('modalAddPlayer is null');
	}

}

let	playersList: string[] = [];

function	countPlayers(){
	return(playersList.length);
}

function	tournamentPressed(){
	const	playersAmount = countPlayers();
	const	tournamentPlayersAmountError = document.getElementById('tournament-players-error') as HTMLElement | null;
	if ( playersAmount < 2){
		if (tournamentPlayersAmountError){
			tournamentPlayersAmountError.textContent = 'add at least two players for tournament!';
			tournamentPlayersAmountError.style.display = 'block';
		}
		return;
	}
	for(let i = 0; i < playersAmount; ++i ){
		console.log(`player index ${i} = ${playersList[i]}.`);
	}
	

}

function	modalFormHandlar(event: Event){
	console.log("new submit event fired!");
	const	userNameInput = document.getElementById('username') as HTMLInputElement | null;
	const	passwordInput = document.getElementById('password') as HTMLInputElement | null;
	const	passwordError = document.getElementById('password-error') as HTMLInputElement | null;
	const	confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement | null;
	const	confirmPassword = document.getElementById('confirm-password-group') as HTMLElement | null;

	event.preventDefault();

	const	username = userNameInput!.value;
	const	password = passwordInput!.value;
	const	confirm = confirmPasswordInput!.value;
	const	isregistermode = confirmPassword && confirmPassword.style.display !== 'none';
	let		apiEndpoint : string;
	let		requestBody : {};

	if (isregistermode){
		if (confirm !== password){
			console.log(`incorect! pass is ${password} conf is ${confirm}.`);
			if (passwordError){
				passwordError.textContent = "Passwords do not match. Please try again.";
				passwordError.style.display = 'block';
			}
			return;
		}
	// 	apiEndpoint = '/api/register';
	// 	requestBody = { username: username, password: password };
	// }else{
	// 	apiEndpoint = '/api/login';
	// 	requestBody = { username: username, password: password };
	}
	requestBody = { username: username, password: password };
	if(passwordError){
		passwordError.style.display = 'none';
	}
	console.log('frontend register ');
	ws.send(JSON.stringify({type: 'register', body: requestBody}));
	//leftPlayerName!.textContent = username;
	closeModal();


	console.log(`submit pressed`);
	console.log(`frontend username is ${username} and password is ${password}.`);
}



















function attachGameListeners() {
    console.log("Attaching Game Listeners...");
    const	backBtn = document.getElementById('back-to-lobby-btn');
	const	startPlayBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
	const	pausePlayBtn =document.getElementById('pauseBtn') as HTMLButtonElement | null;
	



    //button that switches back to the lobby
    backBtn?.addEventListener('click', () => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			console.log("play left the match front end !!!");
			ws.send(JSON.stringify({ type: 'game', subtype : 'playerLeftGamePage'}));
		}
        render('firstPage');
    });


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
			break;
		case 'pausePlay':
			btn = 'pausePlay';
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

	if (ws && ws.readyState === WebSocket.OPEN) {
		console.log('open and send!');
		ws.send(JSON.stringify({ type: 'game', subtype : 'playPause', body: body }));
	} else {
		// Log an error so you know why the message wasn't sent.
		console.error('WebSocket is not connected. readyState:', ws?.readyState);
	}

}

function	handleKeyPress(event: KeyboardEvent){

	let direction = null;
	let body = {};
	//console.log(`event key target is ${event.key}`);
	if (event.key === 'w' || event.key === 'o' || event.key === 'ArrowUp'){
		direction = 'up';
	}else if(event.key === 's' || event.key === 'l' || event.key === 'ArrowDown' ){
		direction = 'down';
	}
	if (direction !== null){
		body = {direction : direction};
		ws.send(JSON.stringify({type: 'game', subtype: 'move', body: body}));
	}
}



function	movingBall(x : number, y : number){
	const	ballPercentX = (x / SERVER_GAME_WIDTH ) * 100;
	const	ballPercentY = (y / SERVER_GAME_HEIGHT) * 100;
	const	ball = document.querySelector('#ball') as HTMLElement | null;
	if (ball){
		ball.style.left = `${ballPercentX}%`;
		ball.style.top = `${ballPercentY}%`;
	}
	
}

function updatePaddlePosition(leftPY : number, rightPY: number) {
	const	leftPaddle = document.querySelector('#left-paddle') as HTMLElement | null;
	const	rightPaddle = document.querySelector('#right-paddle') as HTMLElement | null;



	const	leftPaddlePercent = (leftPY / SERVER_GAME_HEIGHT) * 100;
	const	rightPaddlePercent = (rightPY / SERVER_GAME_HEIGHT) * 100;
	if (leftPaddle && rightPaddle){
		leftPaddle.style.top = `${leftPaddlePercent}%`;
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


function	renderGameState(gameState : GameState){
	updatePaddlePosition(gameState.player1.y, gameState.player2.y);
	movingBall(gameState.ball.x, gameState.ball.y);
	updateScore(gameState.score.p1, gameState.score.p2);
}

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

async function	showMessage(winner : string){
	const	winnerMessage = document.getElementById('winner-message') as HTMLElement | null;
	if (winnerMessage) {
		winnerMessage.textContent = `${winner} Wins!`;
		winnerMessage.style.display = 'block';
	}
	await sleep(5000);

	render('firstPage');
}

async function showDisconnectedMessage(mess : string){
	const	winnerMessage = document.getElementById('winner-message') as HTMLElement | null;
	if (winnerMessage) {
		winnerMessage.textContent = `${mess} you winn by default`;
		winnerMessage.style.display = 'block';
	}
	await sleep(5000);

	render('firstPage');

}


render('firstPage');
connectWebSocket();



