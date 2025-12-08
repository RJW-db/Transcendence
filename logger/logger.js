import { Worker } from 'node:worker_threads';
import path from 'node:path';
import pino from 'pino';

// Worker to handle printing/storing logs
const logWorker = new Worker(path.resolve('./worker.js'));

// Create local Pino logger (used for console + structured logs)
export const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: undefined,  // or remove transport entirely
  enabled: false         // disables Pino console output
});


function sendToWorker(level, message, file, line) {
  logWorker.postMessage({
    level,
    message,
    file,
    line,
    timestamp: new Date().toISOString()
  });
}

function getCaller() {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack;
  Error.prepareStackTrace = orig;

  if (!stack) return { file: null, line: null };

  for (let i = 0; i < stack.length; i++) {
    const frame = stack[i];
    const fname = frame.getFileName && frame.getFileName();
    if (!fname) continue;
    // skip internal modules, node internals, node_modules, and this logger file
    if (fname.includes('internal/') || fname.includes('node:') || fname.includes('node_modules') || fname.endsWith('logger.js')) continue;
    return { file: fname, line: frame.getLineNumber() };
  }
  return { file: null, line: null };
}

function normalizeMessage(args) {
  if (args.length === 0) return '';
  if (typeof args[0] === 'string') {
    if (args.length === 1) return args[0];
    return `${args[0]} ${args.slice(1).map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}`;
  }
  try { return JSON.stringify(args[0]); } catch (e) { return String(args[0]); }
}

const levels = ['trace','debug','info','warn','error','fatal'];

export function setupLogging(fastify) {
  const log = {};
  for (const lvl of levels) {
    log[lvl] = (...args) => {
      baseLogger[lvl](...args);
      const { file, line } = getCaller();
      const message = normalizeMessage(args);
      sendToWorker(lvl, message, file, line);
    };
  }

  fastify.log = log;
  fastify.addHook('onRequest', (req, reply, done) => {
    req.log = log;
    done();
  });
}
