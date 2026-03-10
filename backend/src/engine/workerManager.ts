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
        // const updatePromises = msg.finished.map(async (match: any) => {
          msg.finished.forEach( async (match: any) => {
            this.io.volatile.to(match.roomId).emit('finished', match);
            const matchDB = await this.db.match.update ({
              where: {
                ID: match.matchId,
              },
              data: {
                Player1Score: match.state.score.p1,
                Player2Score: match.state.score.p2,
                WinnerID: match.winner,
              },
            })
            if (matchDB) {
              console.log("Database update completed after match");
            }
            else
              console.log("Database update failed after match");
            console.log(`The winner is: ${match.winner}`)
            const sockets = await io.in(match.roomId).fetchSockets();
            sockets.forEach( (socket: any) => {
              socket.data.matchID = null;
            });
            io.socketsLeave(match.roomId);

          })
          // return this.db.match.update ({
          //   where: {
          //     ID: match.matchId,
          //   },
          //   data: {
          //     Player1Score: match.state.score.p1,
          //     Player2Score: match.state.score.p2,
          //     WinnerID: match.winner,
          //   },
          // })
        // });
        // const results = await Promise.all(updatePromises);
        // results.forEach((result, index) => {
        //   if (result.status === 'fulfilled') {
        //     console.log("Database update completed after match");
        //   }
        //   else {
        //     console.log("Database update failed after match");
        //   }
        // })
      }
        
    });
  }

  createGame(matchId: number, roomId: string, p1: number, p2: number) {
    this.worker.postMessage({ type: 'CREATE_GAME', matchId, roomId, p1, p2 });
  }

  destroyGame(roomId: string, disc_user: number) {
    this.worker.postMessage({ type: 'DELETE_GAME', roomId, disc_user });
  }

  handleInput(roomId: string, player: number, action: 'up' | 'down') {
    this.worker.postMessage({ type: 'INPUT', roomId, player, action });
  }

  //If shutdown received, store last state of game in db or remove match
  //entry
  async shutdown(): Promise<void> {
    console.log('Shutting down game worker...');
    
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('Force terminating worker thread');
        this.worker.terminate();
        resolve();
      }, 5000); // 5 second timeout

      // Tell the worker to gracefully shut down
      this.worker.postMessage({ type: 'SHUTDOWN' });
      
      this.worker.on('exit', (code) => {
        clearTimeout(timeout);
        console.log(`Worker thread exited with code ${code}`);
        resolve();
      });
    });
  }
}