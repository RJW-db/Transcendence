// workers/gameWorker.ts
import { parentPort } from 'worker_threads';
import { PongGame } from './pongGame';

const games = new Map<string, PongGame>();

// === 1. The Game Loop (60 FPS) ===
const TICK_RATE = 1000 / 60;

setInterval(() => {
  if (games.size === 0) return;

  const updates: any[] = [];

  games.forEach((game) => {
    game.update();
    // Prepare snapshot to send to main thread
    updates.push({ roomId: game.id, state: game.state });
  });

  // Batch send updates to Main Thread to reduce message overhead
  if (parentPort) parentPort.postMessage({ type: 'UPDATE_BATCH', updates });
}, TICK_RATE);

// === 2. Handle Messages from Main Thread ===
if (parentPort) {
  parentPort.on('message', (msg: any) => {
    switch (msg.type) {
      case 'CREATE_GAME':
        games.set(msg.roomId, new PongGame(msg.roomId, msg.p1, msg.p2));
        break;
        
      case 'DELETE_GAME':
        games.delete(msg.roomId);
        break;

      case 'INPUT':
        // msg: { roomId, player, action }
        const game = games.get(msg.roomId);
        if (game) game.handleInput(msg.player, msg.action);
        break;
    }
  });
}