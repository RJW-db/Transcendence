import { FastifyRequest, FastifyReply } from 'fastify';
import { decodeJWT, JWT_SECRET } from './jsonWebToken';

export async function validateAuthToken(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.auth;
  
  if (!token) {
    reply.status(401).send({ error: 'token_expired', message: 'No authentication token' });
    return;
  }

  const decoded = decodeJWT(token, JWT_SECRET);
  if (!decoded) {
    reply.status(401).send({ error: 'token_expired', message: 'Invalid or expired token' });
    return;
  }

  // Attach userId to request
  (request as any).userId = decoded.sub;
}