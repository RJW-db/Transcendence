
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export class dbError extends Error {
  public statusCode: number;
  public customMessage?: string;
  public originalError: string;

  constructor(statusCode: number, originalError: string, customMessage?: string) {
    super(originalError);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.customMessage = customMessage;
  }
}

// Export a singleton db instance (to be initialized with fastify in your app entrypoint)
export let db: Database;
export function initializeDatabase(fastify: FastifyInstance, prisma?: PrismaClient) {
  db = new Database(fastify, prisma);
}
export async function closeDatabase() {
  if (db) await db.disconnect();
}

// type ErrorContext = { logMessage?: string; errorCode?: string };
type ErrorContext = { logMessage?: string; statusCode?: number; shouldLog?: string };

export class Database {
  public prisma: PrismaClient;
  fastify: FastifyInstance;

  [key: string]: any; 

  constructor(fastify: FastifyInstance, prisma?: PrismaClient) {
    this.fastify = fastify;
    this.prisma = prisma || new PrismaClient();
    return new Proxy(this, {
      get: this._getHandler.bind(this)
    });
  }

  private _getHandler(target: any, prop: PropertyKey) {
    if (prop in target.prisma) {
      const model = (target.prisma as any)[prop];
      if (typeof model === 'object') {
        return new Proxy(model, {
          get: this._modelMethodHandler.bind(this, target, prop)
        });
      }
    }
    return (target as any)[prop];
  }

  private _modelMethodHandler(target: any, prop: PropertyKey, m: any, method: PropertyKey) {
    const fn = m[method];
    if (typeof fn !== 'function')
      return fn;

    return async (...args: any[]) => {
      let ctx: ErrorContext = {};
      let errorType = undefined;
      // Check for 'socketio' as last argument to disable logging
      let shouldLog = true;
      if (args.length && args[args.length - 1] === 'socketio') {
        shouldLog = false;
        args.pop();
      }

      if (args.length && typeof args[args.length - 1] === 'object' &&
          (args[args.length - 1].logMessage || args[args.length - 1].errorCode)) {
        ctx = args.pop();
      }

      try {
        const result = await fn.apply(m, args);
        if (result === null) {
          const msg = ctx.logMessage || `Prisma ${String(method)} returned null for ${String(prop)}`;
          if (shouldLog) {
            target.fastify.log.error(`[${ctx.statusCode || 404}] ${msg}`);
          }
          // throw new CustomError('Manual test error: result was null', ctx.statusCode || 'P2025');
        }
        return result;
      } catch (e: any) {
        const statusCode = ctx.statusCode || e.statusCode || 500;
        const msg = ctx.logMessage || `Prisma error in ${String(prop)}.${String(method)}`;
        if (shouldLog) {
          target.fastify.log.error(`[${statusCode}] ${msg}: ${e.message || e} stackTrace: ${e.stack || 'no stack trace'}`);
        }
        const error = new dbError(statusCode, e.message || String(e), msg);
        if (e.stack) {
          error.stack = e.stack;
        }
        throw error
      }
    };
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

