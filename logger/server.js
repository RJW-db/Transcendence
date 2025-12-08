import Fastify from 'fastify';
import { setupLogging } from './logger.js';

const fastify = Fastify({ logger: false });

// Attach our logging system to Fastify and requests
setupLogging(fastify);

fastify.get('/', async (req, reply) => {
  fastify.log.info('Hello from Fastify route!');
  return { ok: true };
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
  fastify.log.info(`Server running at ${address}`);
});
