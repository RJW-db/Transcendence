import { Prisma, PrismaClient } from '@prisma/client';
import { FastifyReply, FastifyInstance } from 'fastify';

/** Custom error messages per Prisma error code */
type CustomErrorMessages = Partial<Record<string, string>>;

/** Extended options for createSafePrisma */
type SafePrismaOptions = {
  messages?: CustomErrorMessages;
  extraData?: Record<string, any>;
  onError?: (error: unknown) => void;
};

/** Default HTTP status codes for each error type */
const errorStatusCodes: Record<string, number> = {
  P2000: 400, P2005: 400, P2006: 400, P2007: 400,
  P2001: 404, P2015: 404, P2025: 404,
  P2002: 409,
  P2003: 400, P2014: 400, P2004: 400, P2011: 400,
};

/** Default error messages (fallback when no custom message provided) */
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

/**
 * Handles Prisma errors and sends appropriate HTTP responses.
 * Uses custom messages if provided, otherwise falls back to defaults.
 * Full list: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
function handlePrismaError(
  error: unknown,
  reply: FastifyReply,
  fastify: FastifyInstance,
  options: SafePrismaOptions = {}
): null {
  const { messages = {}, extraData = {}, onError } = options;

  // Capture stack trace at the call site
  const callSite = (new Error()).stack?.split('\n')[2]?.trim() || '';

  if (onError) {
    onError(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const code = error.code;
    const message = messages[code] ?? defaultMessages[code] ?? 'Database error';
    const status = errorStatusCodes[code] ?? 500;

    fastify.log.error(`Prisma error [${code}]: ${error.message} at ${callSite}`);
    reply.status(status).send({ message, ...extraData });
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    fastify.log.error(`Prisma validation error at ${callSite}`);
    reply.status(400).send({ message: messages['validation'] ?? 'Invalid data provided', ...extraData });
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    fastify.log.error(`Database connection error: ${error.message} at ${callSite}`);
    reply.status(503).send({ message: messages['connection'] ?? 'Database unavailable', ...extraData });
  } else {
    fastify.log.error(`Unexpected error: ${error} at ${callSite}`);
    reply.status(500).send({ message: messages['unknown'] ?? 'Internal server error', ...extraData });
  }
  return null;
}

/**
 * Creates a wrapped Prisma client that automatically handles errors.
 * Usage:
 *   const db = createSafePrisma(prisma, reply, fastify);
 *   const user = await db.user.create({ data: {...} });  // Errors auto-handled!
 * 
 * With custom messages (simple):
 *   const db = createSafePrisma(prisma, reply, fastify, {
 *     P2002: 'Email or alias already taken',
 *     P2025: 'User not found'
 *   });
 * 
 * With full options (extraData, onError):
 *   const db = createSafePrisma(prisma, reply, fastify, {
 *     messages: { P2002: 'Email or alias already taken' },
 *     extraData: { field: 'email' },
 *     onError: (err) => console.log('Custom logging', err),
 *   });
 */
export function createSafePrisma(
  prisma: PrismaClient,
  reply: FastifyReply,
  fastify: FastifyInstance,
  optionsOrMessages: CustomErrorMessages | SafePrismaOptions = {}
): PrismaClient {
  // Normalize input: support both { P2002: 'msg' } and { messages: { P2002: 'msg' }, ... }
  const options: SafePrismaOptions = 'messages' in optionsOrMessages || 'extraData' in optionsOrMessages || 'onError' in optionsOrMessages
    ? optionsOrMessages as SafePrismaOptions
    : { messages: optionsOrMessages as CustomErrorMessages };

  // Create proxy for each model (user, cookie, etc.)
  const createModelProxy = (model: any) => {
    return new Proxy(model, {
      get(target, prop) {
        const original = target[prop];
        if (typeof original === 'function') {
          return async (...args: any[]) => {
            try {
              return await original.apply(target, args);
            } catch (error) {
              return handlePrismaError(error, reply, fastify, options);
            }
          };
        }
        return original;
      }
    });
  };

  // Create proxy for the entire Prisma client
  return new Proxy(prisma, {
    get(target, prop) {
      const value = (target as any)[prop];
      // If it's a model (user, cookie, etc.), wrap it
      if (value && typeof value === 'object' && !prop.toString().startsWith('$')) {
        return createModelProxy(value);
      }
      return value;
    }
  }) as PrismaClient;
}

// ============================================================
// USAGE EXAMPLES:
// ============================================================
// Basic usage (uses default messages):
//
//   const db = createSafePrisma(prisma, reply, fastify);
//   const user = await db.user.create({ data: {...} });
//   if (!user) return; // Error already sent with default message
//
// With custom messages (simple - backward compatible):
//
//   const db = createSafePrisma(prisma, reply, fastify, {
//     P2002: 'Email or alias already taken',
//     P2025: 'User not found in database'
//   });
//   const user = await db.user.create({ data: {...} });
//   if (!user) return; // P2002 shows custom message, others use defaults
//
// With full options (extraData included in response, custom error handler):
//
//   const db = createSafePrisma(prisma, reply, fastify, {
//     messages: { P2002: 'Email or alias already taken' },
//     extraData: { field: 'email', context: 'registration' },
//     onError: (err) => console.log('Custom error logging', err),
//   });
//   const user = await db.user.create({ data: {...} });
//   if (!user) return; // Response: { message: '...', field: 'email', context: 'registration' }
// ============================================================
