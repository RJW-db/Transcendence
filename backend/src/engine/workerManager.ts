// managers/GameWorkerManager.ts
import { Worker } from 'worker_threads';
import path from 'path';
import { MyServer } from '../types';
import { PrismaClient } from '@prisma/client';

export class GameWorkerManager {
  private worker: Worker;
  public tournamentRunning = false;

  constructor(private io: MyServer, private db: PrismaClient) {

	const isTs = __filename.endsWith('.ts');
	const workerFileName = isTs ? 'gameWorker.ts' : 'gameWorker.js';
  console.log(`${workerFileName}`);
	const workerPath = path.join(__dirname, '../engine', workerFileName);

    // Spin up ONE worker thread to handle ALL games
    this.worker = new Worker(workerPath, {
		execArgv: isTs ? ['-r', 'ts-node/register'] : undefined,
	});

    // Listen for updates from the worker
    this.worker.on('message', async (msg: any) => {
      if (msg.type === 'UPDATE_BATCH') {
        // Broadcast the new state to the specific rooms
        msg.updates.forEach((match: any) => {
          // Volatile: If a packet is dropped, don't retry (good for games)
          this.io.volatile.to(match.roomId).emit('gameState', match.state);
        });
      }
      else if (msg.type === 'FINISHED') {
        const updatePromises = msg.finished.map(async (match: any) => {
          this.io.volatile.to(match.roomId).emit('finished', match.state);
          return this.db.match.update ({
            where: {
              ID: match.matchId,
            },
            data: {
              Player1Score: match.state.score.p1,
              Player2Score: match.state.score.p2,
            },
          })
        });
        const results = await Promise.all(updatePromises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log("Database update completed after match");
          }
          else {
            console.log("Database update failed after match");
          }
        })
      }
        
    });
  }

  createGame(matchId: number, roomId: string, p1: number, p2: number) {
    this.worker.postMessage({ type: 'CREATE_GAME', matchId, roomId, p1, p2 });
  }

  destroyGame(roomId: string) {
    this.worker.postMessage({ type: 'DELETE_GAME', roomId });
  }

  handleInput(roomId: string, player: number, action: 'up' | 'down') {
    this.worker.postMessage({ type: 'INPUT', roomId, player, action });
  }
}