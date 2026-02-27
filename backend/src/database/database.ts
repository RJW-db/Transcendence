import { PrismaClient, Prisma, User } from '@prisma/client';
import { FastifyReply, FastifyInstance } from 'fastify';

export let db: Database;
export function initializeDatabase(fastify: FastifyInstance) {
  db = new Database(fastify);
}

export async function closeDatabase() {
  if (db) {
    await db.disconnect();
  }
}

type CustomErrorMessages = Partial<Record<string, string>>;

const defaultMessages: Record<string, string> = {
  P2000: 'Value too long for field',
  P2005: 'Invalid value provided',
  P2006: 'Invalid value provided',
  P2007: 'Data validation error',
  P2001: 'Record not found',
  P2015: 'Record not found',
  P2025: 'Record not found',
  P2002: 'Record already exists',
  P2003: 'Related record does not exist',
  P2014: 'Relation violation',
  P2004: 'Database constraint failed',
  P2011: 'Required field cannot be null',
};

const errorStatusCodes: Record<string, number> = {
  P2000: 400, P2005: 400, P2006: 400, P2007: 400,
  P2001: 404, P2015: 404, P2025: 404,
  P2002: 409,
  P2003: 400, P2014: 400, P2004: 400, P2011: 400,
};

export class Database {
    // Find refresh token by user ID
    async findRefreshToken(userId: number, reply: FastifyReply, options?: { messages?: CustomErrorMessages; autoReply?: boolean }): Promise<any | null> {
      const { messages = {}, autoReply } = options || {};
      const prevAutoReply = this.autoReply;
      if (autoReply !== undefined) this.autoReply = autoReply;
      try {
        const result = await this.prisma.jWTRefreshToken.findUnique({ where: { userId } });
        this.lastOperationSuccess = true;
        return result;
      } catch (error) {
        return this.handleError(error, reply, messages);
      } finally {
        this.autoReply = prevAutoReply;
      }
    }

    // Create refresh token
    async createRefreshToken(data: { userId: number; tokenHash: string; iat: Date; exp: Date }, reply: FastifyReply, options?: { messages?: CustomErrorMessages; autoReply?: boolean }): Promise<any | null> {
      const { messages = {}, autoReply } = options || {};
      const prevAutoReply = this.autoReply;
      if (autoReply !== undefined) this.autoReply = autoReply;
      try {
        const result = await this.prisma.jWTRefreshToken.create({ data });
        this.lastOperationSuccess = true;
        return result;
      } catch (error) {
        return this.handleError(error, reply, messages);
      } finally {
        this.autoReply = prevAutoReply;
      }
    }

    // Delete refresh token(s) by user ID
    async deleteRefreshToken(userId: number, reply: FastifyReply, options?: { messages?: CustomErrorMessages; autoReply?: boolean }): Promise<boolean> {
      const { messages = {}, autoReply } = options || {};
      const prevAutoReply = this.autoReply;
      if (autoReply !== undefined) this.autoReply = autoReply;
      try {
        await this.prisma.jWTRefreshToken.deleteMany({ where: { userId } });
        this.lastOperationSuccess = true;
        return true;
      } catch (error) {
        this.handleError(error, reply, messages);
        return false;
      } finally {
        this.autoReply = prevAutoReply;
      }
    }
  private prisma: PrismaClient;
  private fastify: FastifyInstance;
  private globalMessages: CustomErrorMessages = {};
  private autoReply: boolean = true;
  private lastOperationSuccess: boolean = true;

  constructor(fastify: FastifyInstance) {
    this.prisma = new PrismaClient();
    this.fastify = fastify;
  }

  setGlobalMessages(messages: CustomErrorMessages) {
    this.globalMessages = messages;
  }

  setAutoReply(enabled: boolean) {
    this.autoReply = enabled;
  }

  private handleError(
    error: unknown,
    reply: FastifyReply,
    messages: CustomErrorMessages = {},
    extraData: Record<string, any> = {}
  ): null {
    const mergedMessages = { ...defaultMessages, ...this.globalMessages, ...messages };
    const callSite = (new Error()).stack?.split('\n')[2]?.trim() || '';
    this.lastOperationSuccess = false;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code;
      const message = mergedMessages[code] ?? 'Database error';
      const status = errorStatusCodes[code] ?? 500;
      this.fastify.log.error(`Prisma error [${code}]: ${error.message} at ${callSite}`);
      if (this.autoReply)
        reply.status(status).send({ message, ...extraData });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      this.fastify.log.error(`Prisma validation error at ${callSite}`);
      if (this.autoReply)
        reply.status(400).send({ message: mergedMessages['validation'] ?? 'Invalid data provided', ...extraData });
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      this.fastify.log.error(`Database connection error: ${error.message} at ${callSite}`);
      if (this.autoReply)
        reply.status(503).send({ message: mergedMessages['connection'] ?? 'Database unavailable', ...extraData });
    } else {
      this.fastify.log.error(`Unexpected error: ${error} at ${callSite}`);
      if (this.autoReply)
        reply.status(500).send({ message: mergedMessages['unknown'] ?? 'Internal server error', ...extraData });
    }
    return null;
  }

  // Example method with per-call message override and autoReply toggle
  async findUserById(
    userId: number,
    reply: FastifyReply,
    options?: { messages?: CustomErrorMessages; extraData?: Record<string, any>; autoReply?: boolean }
  ) {
    const { messages = {}, extraData = {}, autoReply } = options || {};
    const prevAutoReply = this.autoReply;
    if (autoReply !== undefined) this.autoReply = autoReply;
    try {
      const result = await this.prisma.user.findUnique({ where: { ID: userId } });
      this.lastOperationSuccess = true;
      return result;
    } catch (error) {
      return this.handleError(error, reply, messages, extraData);
    } finally {
      this.autoReply = prevAutoReply;
    }
  }

  // Flexible user finder
  async findUser(query: Prisma.UserWhereInput, reply: FastifyReply, options?: { messages?: CustomErrorMessages; extraData?: Record<string, any>; autoReply?: boolean }): Promise<User | null> {
    const { messages = {}, extraData = {}, autoReply } = options || {};
    const prevAutoReply = this.autoReply;
    if (autoReply !== undefined) this.autoReply = autoReply;
    try {
      const result = await this.prisma.user.findFirst({ where: query });
      if (!result && this.autoReply) {
        const notFoundMsg = messages['notFound'] || messages['P2001'] || messages['P2025'] || 'User not found';
        reply.status(404).send({ message: notFoundMsg, ...extraData });
        this.lastOperationSuccess = false;
        return null;
      }
      this.lastOperationSuccess = true;
      return result;
    } catch (error) {
      return this.handleError(error, reply, messages, extraData);
    } finally {
      this.autoReply = prevAutoReply;
    }
  }

  // Create user
  async createUser(data: Prisma.UserCreateInput, reply: FastifyReply, options?: { messages?: CustomErrorMessages; extraData?: Record<string, any>; autoReply?: boolean }): Promise<User | null> {
    const { messages = {}, extraData = {}, autoReply } = options || {};
    const prevAutoReply = this.autoReply;
    if (autoReply !== undefined) this.autoReply = autoReply;
    try {
      const result = await this.prisma.user.create({ data });
      this.lastOperationSuccess = true;
      return result;
    } catch (error) {
      return this.handleError(error, reply, messages, extraData);
    } finally {
      this.autoReply = prevAutoReply;
    }
  }

  // Delete user
  async deleteUser(userId: number, reply: FastifyReply, options?: { messages?: CustomErrorMessages; extraData?: Record<string, any>; autoReply?: boolean }): Promise<User | null> {
    const { messages = {}, extraData = {}, autoReply } = options || {};
    const prevAutoReply = this.autoReply;
    if (autoReply !== undefined) this.autoReply = autoReply;
    try {
      const result = await this.prisma.user.delete({ where: { ID: userId } });
      this.lastOperationSuccess = true;
      return result;
    } catch (error) {
      return this.handleError(error, reply, messages, extraData);
    } finally {
      this.autoReply = prevAutoReply;
    }
  }

  // Update user
  async updateUser(userId: number, data: Prisma.UserUpdateInput, reply: FastifyReply, options?: { messages?: CustomErrorMessages; extraData?: Record<string, any>; autoReply?: boolean }): Promise<User | null> {
    const { messages = {}, extraData = {}, autoReply } = options || {};
    const prevAutoReply = this.autoReply;
    if (autoReply !== undefined) this.autoReply = autoReply;
    try {
      const result = await this.prisma.user.update({ where: { ID: userId }, data });
      this.lastOperationSuccess = true;
      return result;
    } catch (error) {
      return this.handleError(error, reply, messages, extraData);
    } finally {
      this.autoReply = prevAutoReply;
    }
  }

  /**
   * Returns true if the last database operation was successful.
   */
  public isDatabaseOperationSuccessful(): boolean {
    return this.lastOperationSuccess;
  }

  public async disconnect() {
    await this.prisma.$disconnect();
  }
}


