// import { FastifyRequest, FastifyReply } from 'fastify';
// import crypto from 'crypto';
// import { validateAuthToken } from './validateAuthToken';
// import { generateJWT, JWT_SECRET, TOKEN_TIMES } from './jsonWebToken';


// // Mock database for demonstration purposes
// const db = {
//     hashToken: '',
//     iat: 0,
//     exp: 0,
//     revoked: false,
// };

// export async function refreshToken(request: FastifyRequest, reply: FastifyReply, prisma, fastify) {
//     // request.
//     const rawToken = crypto.randomBytes(32).toString('hex');
//     const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
//     // sendToDatabase(hashedToken);
//     // sendRawtokenToClient(rawToken, reply);

//     // const authHeader
//     return rawToken;
// }

// function sendToDatabase(hashedToken: string) {
//     db.hashToken = hashedToken;
//     db.iat = Date.now();
//     db.exp = db.iat + TOKEN_TIMES.REFRESH_TOKEN_MS;
//     db.revoked = false;
// }

// function verifyRefreshToken(rawToken: string) {
//     const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
//     if (hashedToken !== db.hashToken) {
//         throw new Error('Invalid refresh token');
//     }

//     if (db.revoked) {
//         throw new Error('Refresh token revoked');
//     }

//     if (Date.now() > db.exp) {
//         throw new Error('Refresh token expired');
//     }
// }

// function sendRawtokenToClient(rawToken: string, reply: FastifyReply) {
//     reply.cookie('refreshToken', rawToken, { maxAge: TOKEN_TIMES.REFRESH_TOKEN_MS, httpOnly: true });
// }
