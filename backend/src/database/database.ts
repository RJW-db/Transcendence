
import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

// Export a singleton db instance (to be initialized with fastify in your app entrypoint)
export let db: Database;
export function initializeDatabase(fastify: FastifyInstance, prisma?: PrismaClient) {
  db = new Database(fastify, prisma);
}
export async function closeDatabase() {
  if (db) await db.disconnect();
}

type ErrorContext = { logMessage?: string; errorCode?: string };

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
    if (typeof fn !== 'function') return fn;
    return async (...args: any[]) => {
      let ctx: ErrorContext = {};
      let errorType = undefined;
      if (args.length && typeof args[args.length - 1] === 'object' && args[args.length - 1].type) {
        errorType = args.pop().type;
      }
      if (args.length && typeof args[args.length - 1] === 'object' &&
          (args[args.length - 1].logMessage || args[args.length - 1].errorCode)) {
        ctx = args.pop();
      }
      try {
        const result = await fn.apply(m, args);
        if (result === null) {
          const msg = ctx.logMessage || `Prisma ${String(method)} returned null for ${String(prop)}`;
          target.fastify.log.error(`[${ctx.errorCode || 'P2025'}] ${msg}`);
          throw new Error('Manual test error: result was null');
        }
        return result;
      } catch (e: any) {
        const code = ctx.errorCode || e.code || 'INTERNAL_SERVER_ERROR';
        const msg = ctx.logMessage || `Prisma error in ${String(prop)}.${String(method)}`;
        target.fastify.log.error(`[${code}] ${msg}: ${e.message || e}`);
        throw { type: errorType, error: e, code };
      }
    };
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

