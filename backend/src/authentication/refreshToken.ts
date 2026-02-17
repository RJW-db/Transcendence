// import { FastifyRequest, FastifyReply } from 'fastify';
// import crypto from 'crypto';
// // import { validateAuthToken } from './validateAuthToken';
// import { generateJWT, JWT_SECRET, TOKEN_TIMES } from './jsonWebToken';
// import { PrismaClient } from '@prisma/client';

// export async function verifyRefreshToken(userID: number, request: FastifyRequest, reply: FastifyReply, prisma: PrismaClient) {
//     const rawToken: string = request.cookies.refreshToken || '';
//     if (!rawToken) {
//         reply.status(401).send({ message: 'No refresh token provided' });
//         return false;
//     }

//     const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

//     const tokenRecord = await prisma.jWTRefreshToken.findUnique({
//         where: { userId: userID }
//     });
    
//     if (!tokenRecord) {
//         reply.status(401).send({ message: 'No refresh token found' });
//         return false;
//     }

//     if (tokenRecord.tokenHash !== hashedToken) {
//         reply.status(401).send({ message: 'Invalid refresh token (hash mismatch)' });
//         return false;
//     }

//     if (tokenRecord.revoked) {
//         reply.status(401).send({ message: 'Refresh token revoked' });
//         return false;
//     }

//     if (new Date() > tokenRecord.exp) {
//         // Token expired - create new refresh token and generate new JWT
//         // const newJWT = generateJWT(userID, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_MS / 1000);
//         // const newRefreshToken = await createRefreshToken(userID, request, reply, prisma);
//         // reply.send({ jwt: newJWT, refreshToken: newRefreshToken });
//         return false;
//     }

//     // // Token still valid - generate new JWT but keep refresh token
//     // const newJWT = generateJWT(userID, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_MS / 1000);
//     // reply.send({ jwt: newJWT });
//     return true;
// }

// export async function RefreshToken(userID: number, request: FastifyRequest, reply: FastifyReply, prisma: PrismaClient) {
//     if (await verifyRefreshToken(userID, request, reply, prisma)) {
//         return;
//     }

//     const rawToken: string = crypto.randomBytes(32).toString('hex');
//     const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

//     prisma.jWTRefreshToken.update({
//         where: { userId: userID },
//         data: { tokenHash: hashedToken, revoked: false }
//     });
//     reply.cookie('refreshToken', rawToken, { maxAge: TOKEN_TIMES.REFRESH_TOKEN_MS, httpOnly: true });
// }

// export async function createRefreshToken(userID: number, request: FastifyRequest, reply: FastifyReply, prisma: PrismaClient) {
//     const rawToken: string = crypto.randomBytes(32).toString('hex');
//     const hashedToken: string = crypto.createHash('sha256').update(rawToken).digest('hex');

//     // Delete old token if exists, then create new one
//     // await prisma.jWTRefreshToken.deleteMany({
//     //     where: { userId: userID }
//     // });

//     const currentTime: Date = new Date();
//     const expiryDate: Date = new Date(currentTime.getTime() + TOKEN_TIMES.REFRESH_TOKEN_MS);

//     await prisma.jWTRefreshToken.create({
//         data: {
//             userId: userID,
//             tokenHash: hashedToken,
//             iat: currentTime,
//             exp: expiryDate
//         }
//     });

//     return rawToken;
// }

