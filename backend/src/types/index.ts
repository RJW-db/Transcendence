import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Adjust if using a different DB
import { GameWorkerManager } from '../engine/workerManager';
import { TournamentManager } from '../engine/tournamentManager';
import type {
  ActionResponse,
  UserData,
  OutgoingDirectMessage,
  IncomingDirectMessage,
  OutgoingFriendRequest,
  IncomingFriendRequest,
} from '@transcendence/shared';
// import { Logger } from 'pino';                 // Adjust if using a different Logger

// ========================================================
// 1. EVENT DEFINITIONS
// ========================================================

export type {
  ActionResponse,
  UserData,
  OutgoingDirectMessage,
  IncomingDirectMessage,
  OutgoingFriendRequest,
  IncomingFriendRequest,
};

export interface ServerToClientEvents {
  chatMessage: (msg: string) => void;
  notification: (msg: string) => void;
  gameState: (msg: any) => void;
  finished: (msg: any) => void;
  directMessage: (msg: IncomingDirectMessage) => void;
  unreadMessages: (msgs: IncomingDirectMessage[]) => void;
  newFriendRequest: (req: IncomingFriendRequest) => void;
  allFriendRequests: (reqs: IncomingFriendRequest[]) => void;
  newFriend: (user: UserData) => void;
  // Add other events here
}

export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  sendMessage: (msg: string) => void;
  gameEvent: (msg: string) => void;
  gameKey: (msg: string) => void;
  joinGame: (msg: string) => void;
  joinTournament: (msg: string) => void;
  startTournament: (msg: string) => void;
  sendDirectMessage: (msg: OutgoingDirectMessage, callback: (response: ActionResponse) => void) => void;
  loadUnreadMessages: (callback: (response: ActionResponse) => void) => void;
  readMessage: (messageID: number) => void;
  sendFriendRequest: (req: OutgoingFriendRequest, callback: (response: ActionResponse) => void) => void;
  acceptFriendRequest: (requestID: number, callback: (response: ActionResponse) => void) => void;
  declineFriendRequest: (requestID: number, callback: (response: ActionResponse) => void) => void;
  // Add other events here
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: number;
  alias: string;
  cookie: string;
  matchID: string | null;
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