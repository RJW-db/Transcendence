import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client'; // Adjust if using a different DB
// import { Logger } from 'pino';                 // Adjust if using a different Logger

// ========================================================
// 1. EVENT DEFINITIONS
// ========================================================

export interface ServerToClientEvents {
  chatMessage: (msg: string) => void;
  notification: (msg: string) => void;
  // Add other events here
}

export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  sendMessage: (msg: string) => void;
  gameEvent: (msg: string) => void;
  // Add other events here
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  cookie: string;
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
  // db: PrismaClient; 
  // logger: Logger;
}