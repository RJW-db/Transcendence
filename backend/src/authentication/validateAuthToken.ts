// import { FastifyRequest, FastifyReply } from 'fastify';
// import { decodeJWT, JWT_SECRET } from './jsonWebToken';

// declare module 'fastify' {
//   interface FastifyRequest {
//     userId?: number;
//   }
// }

// export async function validateAuthToken(request: FastifyRequest, reply: FastifyReply) {
//   try {
//     const token = request.cookies.auth;
    
//     if (!token) {
//       return reply.status(401).send({ error: 'token_expired', message: 'No authentication token' });
//     }

//     const decoded = decodeJWT(token, JWT_SECRET);
//     if (!decoded) {
//       return reply.status(401).send({ error: 'token_expired', message: 'Invalid or expired token' });
//     }

//     // Attach userId properly
//     request.userId = decoded.sub;
//   } catch (error) {
//     reply.status(500).send({ error: 'Internal server error' });
//   }
// }
