import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Adjust if using a different DB
import { GameWorkerManager } from '../engine/workerManager';
import { TournamentManager } from '../engine/tournamentManager';
// import { Logger } from 'pino';                 // Adjust if using a different Logger

// ========================================================
// 1. EVENT DEFINITIONS
// ========================================================

export interface DirectMessagePayload {
  receiverId: number;
  message: string;
}

export interface IncomingDirectMessage {
  senderId: number;
  message: string;
}

export interface ServerToClientEvents {
  chatMessage: (msg: string) => void;
  notification: (msg: string) => void;
  gameState: (msg: any) => void;
  directMessage: (msg: IncomingDirectMessage) => void;
  // Add other events here
}

export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  sendMessage: (msg: string) => void;
  gameEvent: (msg: string) => void;
  gameKey: (msg: string) => void;
  joinGame: (msg: string) => void;
  joinTournament: (msg: string) => void;
  startTournament: () => void;
  leaveTournament: () => void;
  sendDirectMessage: (msg: DirectMessagePayload) => void;
  // Add other events here
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: number;
  cookie: string;
  matchID: string;
  tournament: TournamentManager;
  // Add other data here
}

// ========================================================
// 2. HELPER TYPES (Aliases)
// ========================================================
// We define these here so we don't have to type out the generic <> tags everywhere

export type MySocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type MyServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// ========================================================
// 3. CONTEXT DEFINITION
// ========================================================

export interface SocketContext {
  io: MyServer;
  socket: MySocket;
  gameManager: GameWorkerManager;
  db: PrismaClient; 
//   tournamentManager: TournamentManager;
  // logger: Logger;
}
