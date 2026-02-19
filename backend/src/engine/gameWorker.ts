// workers/gameWorker.ts
import { parentPort } from 'worker_threads';
import { PongGame } from './pongGame';

const games = new Map<string, PongGame>();

// === 1. The Game Loop (60 FPS) ===
const TICK_RATE = 1000 / 120;

const intervalId = setInterval(() => {
  if (games.size === 0) return;

  const updates: any[] = [];
  const finished: any[] = [];

  games.forEach((game) => {
    game.update();
    // Prepare snapshot to send to main thread
    if (game.end === false)
      updates.push({ roomId: game.roomId, state: game.state });
    else {
      finished.push({matchId: game.matchId, roomId: game.roomId, state: game.state });
      games.delete(game.roomId);
    }

  });

  // Batch send updates to Main Thread to reduce message overhead
  if (parentPort) {
    parentPort.postMessage({ type: 'UPDATE_BATCH', updates });
    if (finished.length !== 0)
      parentPort.postMessage({ type: 'FINISHED', finished });
  }

}, TICK_RATE);

// === 2. Handle Messages from Main Thread ===
if (parentPort) {
  parentPort.on('message', (msg: any) => {
    switch (msg.type) {
      case 'CREATE_GAME':
        games.set(msg.roomId, new PongGame(msg.matchId, msg.roomId, msg.p1, msg.p2));
        const gamestart = games.get(msg.roomId);
        if (gamestart) gamestart.init();
        break;
        
      case 'DELETE_GAME':
        games.delete(msg.roomId);
        break;

      case 'INPUT':
        // msg: { roomId, player, action }
        const game = games.get(msg.roomId);
        if (game) game.handleInput(msg.player, msg.action);
        break;

      case 'SHUTDOWN':
        console.log('Worker received shutdown signal');
        clearInterval(intervalId);
        process.exit(0);
        break;
    }
  });
}