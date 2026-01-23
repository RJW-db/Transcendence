// managers/GameWorkerManager.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { MyServer } from '../types';

export class GameWorkerManager {
  private worker: Worker;

  constructor(private io: MyServer) {

	const isTs = __filename.endsWith('.ts');
	const workerFileName = isTs ? 'gameWorker.ts' : 'gameWorker.js';
  console.log(`${workerFileName}`);
	const workerPath = path.join(__dirname, '../engine', workerFileName);

    // Spin up ONE worker thread to handle ALL games
    this.worker = new Worker(workerPath, {
		execArgv: isTs ? ['-r', 'ts-node/register'] : undefined,
	});

    // Listen for updates from the worker
    this.worker.on('message', (msg: any) => {
      if (msg.type === 'UPDATE_BATCH') {
        // Broadcast the new state to the specific rooms
        msg.updates.forEach((update: any) => {
          // Volatile: If a packet is dropped, don't retry (good for games)
          this.io.volatile.to(update.roomId).emit('gameState', update.state);
        });
      }
    });
  }

  createGame(roomId: string, p1: number, p2: number) {
    this.worker.postMessage({ type: 'CREATE_GAME', roomId, p1, p2 });
  }

  destroyGame(roomId: string) {
    this.worker.postMessage({ type: 'DELETE_GAME', roomId });
  }

  handleInput(roomId: string, player: number, action: 'up' | 'down') {
    this.worker.postMessage({ type: 'INPUT', roomId, player, action });
  }
}