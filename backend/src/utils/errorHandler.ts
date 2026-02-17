import { MyServer, MySocket } from '../types';
import { PrismaClient } from '@prisma/client';

export class ErrorHandler {
  private socket: MySocket;
  private io: MyServer;
  private db: PrismaClient;

  constructor(socket: MySocket, io: MyServer, db: PrismaClient) {
    this.socket = socket;
    this.io = io;
    this.db = db;
  }

  /**
   * Log error to console and eventually to database
   */
  log(error: Error, context?: string) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${context ? `[${context}]` : ''} Error: ${error.message}`;
    
    console.error(message);
    console.error(error.stack);

    // TODO: Write to database later
    // await this.db.errorLog.create({
    //   data: {
    //     message: error.message,
    //     stack: error.stack,
    //     context: context,
    //     socketId: this.socket.id,
    //     userId: this.socket.data.userId,
    //     timestamp: new Date(),
    //   }
    // });
  }

  /**
   * Handle socket-specific errors and notify client
   */
  handleError(error: Error, context?: string) {
    this.log(error, context);
    
    // Notify the client
    this.socket.emit('error', {
      message: error.message,
      context: context,
      timestamp: new Date(),
    });
  }

  /**
   * Wrap async functions with error handling
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * Wrap sync functions with error handling
   */
  wrapSync<T>(
    fn: () => T,
    context?: string
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * Wrap socket event handlers automatically with error handling
   */
  on<T extends any[]>(
    event: string,
    handler: (...args: T) => void | Promise<void>
  ): void {
    this.socket.on(event, async (...args: T) => {
      try {
        await handler(...args);
      } catch (error) {
        this.handleError(error as Error, `${event} event`);
      }
    });
  }

  /**
   * Wrap database operations with error handling
   */
  async dbQuery<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const dbError = error as Error;
      this.handleError(
        new Error(`Database error in ${operationName}: ${dbError.message}`),
        `DB:${operationName}`
      );
      return null;
    }
  }

  /**
   * Wrap multiple database operations in a transaction
   */
  async dbTransaction<T>(
    operations: (tx: any) => Promise<T>,
    transactionName: string
  ): Promise<T | null> {
    try {
      return await this.db.$transaction(operations);
    } catch (error) {
      const dbError = error as Error;
      this.handleError(
        new Error(`Transaction error in ${transactionName}: ${dbError.message}`),
        `DB:Transaction:${transactionName}`
      );
      return null;
    }
  }
}
