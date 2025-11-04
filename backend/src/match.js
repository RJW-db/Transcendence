
//const { interceptors } = require('undici-types');
//const	playerClass = require('./Player.js');
//const	matchObject = require('./matchObject.js');

//import	playerClass from './Player.js';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_HEIGHT = 50;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 20;
let	isPlaying = true;
let ballVelocityX = 0;
let ballVelocityY = 0;
let	ballx = 400;
let	ballxNew = 400;
let bally = 300;
let ballyNew = 300;
let leftSideScore = 0;
let rightSideScore = 0;
let	gameOver = false;
let moveStep = 10;
let paddleRightY = (GAME_HEIGHT / 2) - ( PADDLE_HEIGHT / 2);
let paddleLeftY = (GAME_HEIGHT / 2) - (PADDLE_HEIGHT / 2);
let	paddleLeftX = (GAME_WIDTH * 0.02) + PADDLE_WIDTH;
let paddleRightX = (GAME_WIDTH - (GAME_WIDTH * 0.02) ) - PADDLE_WIDTH;


let gameState = {
    player1: { y: 0 },
    player2: { y: 0 },
    ball: { x: 0, y: 0 },
    score: { p1: 0, p2: 0 }
};



function	replay(){
	leftSideScore = 0;
	rightSideScore = 0;
	resetBall();
	gameOver = false;

}

function	playANDpause(body){
	if (body === 'startPlay'){
		console.log('play pressed!');
		isPlaying = true;
	}else if (body === 'pausePlay'){
		isPlaying = false;
		console.log('pause pressed!');
	}

}






//gameLogic
let	justOnce = true;
function	gameLoop(){
	
	if (!isPlaying || gameOver){
		if (gameOver === true && justOnce === true) {
			justOnce = false;
			console.log("inside second statement");
			sendWinnerMessage();
			exitChildProcess();
		}
		return;
	}
	// 1. Update ball position based on its velocity (physics)
	

    // 2. Check for collisions with walls or paddles
	// collisionCheck();
    // 3. Check for scores
	newballposcheck();
	const ballState = ballVelocity();
    // 4. Update the gameState object with all new positions

    // After all calculations are done, broadcast the new state
	gameState.ball.x = ballState.x;
	gameState.ball.y = ballState.y;
	gameState.score.p1 = leftSideScore;
	gameState.score.p2 = rightSideScore;
	gameState.player1.y = paddleLeftY;
	gameState.player2.y = paddleRightY;
	sendState();
    //broadcastGameState();
}



function	ballVelocity(){
	let ballState = {};
	// ballx += ballVelocityX * 1.01;
	// bally += ballVelocityY * 1.01;
	ballState = {x : ballx, y: bally};
	// console.log(`randomx is ${ballx} and random y is ${bally}`);
	return (ballState);
}

function	newballposcheck(){
	ballxNew = ballx + ballVelocityX * 1.01;
	ballyNew = bally + ballVelocityY * 1.01;
	collisionCheck();


}


function	collisionCheck() {
	//console.log(`collision check ball x is => ${ballx} and bally ${bally}`);
	// console.log(`collision check paddleLeftY is => ${paddleLeftY}`);
	// console.log(`collision check paddleLeftx is => ${paddleLeftX}`);
	//console.log(`collision check paddleRightx is => ${paddleRightX}`);

	ballx = ballxNew;
	bally = ballyNew;

	if (bally <= 0 || bally >= GAME_HEIGHT - BALL_SIZE) {
        ballVelocityY *= -1;
    }

	const	ballLeftEdge = ballxNew - 10;
	const	ballRightEdge = ballxNew + 10;
	const	ballTopEdge = ballyNew - 10;
	const	ballBottomEdge = ballyNew + 10;
	//console.log(`ball edges is letf : ${ballLeftEdge} right : ${ballRightEdge} top : ${ballTopEdge} bottom : ${ ballBottomEdge}`);

    // Check collision with left paddle (player 1)
    // Is the ball at the left edge? AND is its vertical position within the paddle's range?
    // if (ballx <= PADDLE_WIDTH && bally > paddleLeftY && bally < ( paddleLeftY + (PADDLE_HEIGHT / 2))) {
	// 	console.log('left collision');
    //     ballVelocityX *= -1;
    // }

	if (ballLeftEdge < paddleLeftX && ((ballBottomEdge > paddleLeftY && ballTopEdge < paddleLeftY + PADDLE_HEIGHT) || (ballTopEdge < paddleLeftY + PADDLE_HEIGHT && ballBottomEdge > paddleLeftY + PADDLE_HEIGHT) || (ballTopEdge > paddleLeftY && ballBottomEdge < paddleLeftY + PADDLE_HEIGHT))) {
		//console.log('left collision');
        ballVelocityX *= -1;
		ballx = paddleLeftX + 10;
		// ballHasHitPaddle();
	}

	if (ballRightEdge > paddleRightX && ((ballBottomEdge > paddleRightY && ballTopEdge < paddleRightY + PADDLE_HEIGHT) || (ballTopEdge < paddleRightY + PADDLE_HEIGHT && ballBottomEdge > paddleRightY + PADDLE_HEIGHT) || (ballTopEdge > paddleRightY && ballBottomEdge < paddleRightY + PADDLE_HEIGHT))) {
		ballVelocityX *= -1;
		ballx = paddleRightX - 10;
	}
    
    // Check collision with right paddle (player 2)
    // if (ballx >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE && bally > ( paddleRightY - (PADDLE_HEIGHT / 2)) && bally < (paddleRightY + (PADDLE_HEIGHT / 2))) {
    //     console.log('right collision');
	// 	ballVelocityX *= -1;
    // }

	// if (ballx >= paddleRightX && bally > ( paddleRightY - (PADDLE_HEIGHT / 2)) && bally < (paddleRightY + (PADDLE_HEIGHT / 2))) {
	// 	//console.log('right collision');
	// 	ballVelocityX *= -1;
	// 	// ballHasHitPaddle();
	// }

    // Check for scoring
    // if (ballx < 0) { // Left wall
	// 	//console.log('right');
    //     updateScoreServer("right");
    // } else if (ballx > GAME_WIDTH) { // Right wall
	// 	//console.log('left');
    //     updateScoreServer("left");
    // }



	    // Check for scoring
    if (ballLeftEdge < 0) { // Left wall
		//console.log('right');
        updateScoreServer("right");
    } else if (ballRightEdge > GAME_WIDTH) { // Right wall
		//console.log('left');
        updateScoreServer("left");
    }

	// if (!hasHit) {

	// 	if (ballRect.left <= paddleLeftRect.right && ballRect.top <= paddleLeftRect.bottom && ballRect.bottom >= paddleLeftRect.top) {
	// 		// x = -x
	// 		ballVelocityX = -ballVelocityX;
	// 		console.log(`ball hit the LEFT paddle `);
	// 		ballHasHitPaddle();
		
	// 	}else if(ballRect.right >= paddleRightRect.left && ballRect.top <= paddleRightRect.bottom && ballRect.bottom >= paddleRightRect.top){
	// 		// x = -x
	// 		ballVelocityX = -ballVelocityX;
	// 		console.log(`ball hit the Right paddle `);
	// 		ballHasHitPaddle();
	// 	}else if (ballRect.left < paddleLeftRect.left && (ballRect.bottom < paddleLeftRect.top || ballRect.top > paddleLeftRect.bottom)){
	// 		// right make score
	// 		updateScoreServer("right");
	// 	}else if (ballRect.right > paddleRightRect.right && (ballRect.bottom < paddleRightRect.top || ballRect.top > paddleRightRect.bottom)) {
	// 		// left make score
	// 		updateScoreServer("left");
	// 	}else if (ballRect.top <= ceilingRect.bottom){
	// 		ballVelocityY = -ballVelocityY;
	// 		ballHasHitPaddle();
	// 	}else if (ballRect.bottom >= floorRect.top){
	// 		ballVelocityY = -ballVelocityY;
	// 		ballHasHitPaddle();
	// 	}

	// }
}


function	ballHasHitPaddle(){
	hasHit = true;
	setTimeout(() => {
		hasHit = false;}, 300);
}

function	updateScoreServer(which){
	if (gameOver) {
		return;
	}
	if (which == "left"){
		leftSideScore +=1;
	}else{
		rightSideScore +=1;
	}
	if (leftSideScore === 8 || rightSideScore === 8) {
		gameOver = true;
		// end of play
	}else{
		resetBall();
	}
}


async function resetBall() {
		ballVelocityX = 0;
		ballVelocityY = 0;
		ballx = 400;
		bally = 300;
		paddleRightY = (GAME_HEIGHT / 2) - ( PADDLE_HEIGHT / 2);
		paddleLeftY = (GAME_HEIGHT / 2) - (PADDLE_HEIGHT / 2);

		// 2. Wait for 1 second (1000 milliseconds)
		//console.log('Ball reset. Waiting for 1 second...');
		await delay(1000);
		//console.log('...serve!');


		// ballVelocityX = (Math.random() * 4) - 2;
		// ballVelocityY = (Math.random() * 4) - 2;

		let changeDirection = Math.random() * 2;
		if (changeDirection <= 1)
			changeDirection = -1;
		else
			changeDirection = 1;

		let randomx = (Math.random() * 4);
		if	(randomx > 0 && randomx < 2)
			randomx = 2;
		randomx *= changeDirection;

		let	randomy = (Math.random() * 4);
		if (randomy > 0 && randomy < 2)
			randomy = 2;
		randomy = randomy * changeDirection;

		ballVelocityX = randomx;
		ballVelocityY = randomy;

		// ballVelocityX = -2;
		// ballVelocityY = -2;

		
	}

function delay(ms) {
	return new Promise( resolve => setTimeout(resolve, ms) );
}


function	paddleMove(role, data){
    // Note: topBoundary should be negative, bottomBoundary should be positive
    //const topBoundary = GAME_HEIGHT - PADDLE_HEIGHT;
	
    //const bottomBoundary = 0;


	const bottomBoundary = 0;
	const topBoundary = GAME_HEIGHT - PADDLE_HEIGHT;
	//console.log(`top boundaries ${topBoundary}`);

    if (role === 'player1') {
        if (data.body.direction === 'up') {
            paddleLeftY -= moveStep;
			if (paddleLeftY < bottomBoundary)
				paddleLeftY = bottomBoundary;
        } else if (data.body.direction === 'down') {
            paddleLeftY += moveStep;
			if (paddleLeftY > topBoundary)
				paddleLeftY = topBoundary;
        }
    } else if (role === 'player2') {
        if (data.body.direction === 'up') {
            paddleRightY -= moveStep;
			if (paddleRightY < bottomBoundary)
				paddleRightY = bottomBoundary;
        } else if (data.body.direction === 'down') {
            paddleRightY += moveStep;
			if (paddleRightY > topBoundary)
				paddleRightY = topBoundary;
        }
    }

}


// function broadcastGameState() {
// 	  const stateString = JSON.stringify(gameState);
//     // Send the latest state to every single connected client
//     for (const [clientId, player] of clients.entries()) {
//         if (player.socket.readyState === 1) { // 1 means OPEN
//            player.socket.send(stateString);
//         }
//     }
// }
// function broadcastGameState() {
//     // Send the latest state to every single connected client
//     for (const [clientId, player] of clients.entries()) {
//         if (player.socket.readyState === 1) { // 1 means OPEN
// 			player.sendMessage('gameStateUpdate', gameState);
//         }
//     }
// }

function startGameWithDelay() {
    console.log("The game will begin in 3 seconds...");

    // Set a one-time timer for 3000 milliseconds (3 seconds).
    setTimeout(() => {
        // This code will only run AFTER the 3-second delay.
        console.log("Delay is over. Starting the game loop now!");
		resetBall();
        
        // Start the interval, which will now call gameLoop every ~16.7ms.
        const gameIntervalId = setInterval(gameLoop, 1000 / 60);
		

    }, 3000);
}

function	exitChildProcess(){
	if (gameOver){
		// clearInterval(gameIntervalId);
		console.log('match script game OVER !!!');
		setTimeout(() => {
			process.exit();
		}, 5000);

	}
}
let	matchID = 0;

startGameWithDelay();


//setInterval(gameLoop, 1000 / 60);

const	player1 = null;
const	player2 = null;
process.on('message', (message) => {
	console.log("child message type " , message.type);
	console.log("child message id " , matchID);
	switch (message.type) {
		case 'init':
			matchID = message.MATCHID;
			break;
		case 'playPause':
			playANDpause(message.body);
			break;
		case 'move':
			paddleMove(message.body.role, message.body.data);
			break;

	}
	// if (message.type === 'init'){
	// matchID = message.MATCHID;
	// // player1 = message.match.p1;
	// // player2 = message.match.p2;
	// // const	match = new matchObject(message.match.p1, message.match.p2, message.match.matchID);
	// } 


});

function	sendState(){
	process.send({type: 'gameState', object:{ matchID, gameState}});
}

function	sendWinnerMessage(){
	let	winner = "";
	if (gameState.player1 > gameState.player2){
		winner = "player1";
	}else{
		winner = "player2";
	}
	process.send({type: 'gameOver', object:{ matchID, gameState, winner}});
}


// process.on('message', (message, player) => {

// 	if (message ===  'player1'){

// 		const player1 = new playerClass(player.socket, player.id);
// 	}
// 	if (message ===  'player2'){
// 		const player2 = new playerClass(player.socket, player.id);
// 	}
// });
