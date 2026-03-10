import type { ApiMessageHandler } from '../handlers/loginHandler';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import { get } from 'node:http';

export const getLoginInfo: ApiMessageHandler = async (
  payload: { userID: number },
  request,
  prisma,
  fastify,
  reply
) => {
    const user = await prisma.user.findUnique({ where: { ID: payload.userID } });
  if (!user) {
    reply.status(400).send({ message: 'User not found' });
    return;
  }
  // Return user info
  const accountType = user.GuestLogin ? 'guest' : user.OauthLogin ? 'oauth' : 'standard';

  reply.status(200).send({
    user: {
      ID: user.ID,
      Alias: user.Alias,
      Email: user.Email,
      Online: user.Online.toString(),
      CreationDate: user.CreationDate,
      AccountType: accountType,
      GamesWon: user.GamesWon,
    },
  });


}
export const getCurrentLoginInfo: ApiMessageHandler = async (
  payload,
  request,
  prisma,
  fastify,
  reply
) => {
  const userId = await getCurrentUserId(request, reply);
  if (!userId) {
    return; // getCurrentUserId already sent the response
  }
  getLoginInfo({ userID: userId }, request, prisma, fastify, reply);

}

export async function getCurrentUserId(request: FastifyRequest, reply : FastifyReply) : Promise<number> {
  const jwtCookie = request.cookies.auth;
  if (!jwtCookie) {
    reply.status(401).send({ message: 'Not authenticated' });
    return 0;
  }

  const decoded = decodeJWT(jwtCookie, JWT_SECRET);
  if (!decoded) {
    reply.status(401).send({ message: 'Session expired' });
    return 0;
  }
  const userId : number = decoded.sub;
  return userId;
}
export const getProfilePicture: ApiMessageHandler = async (
  payload: {},
  request,
  prisma,
  fastify,
  reply
) => {
  const userId = await getCurrentUserId(request, reply);
  const user = await prisma.user.findUnique({ where: { ID: userId } });
  if (!user) {
    reply.status(400).send({ message: 'User not found' });
    return;
  }
  if (!user.ProfilePicture) {
    reply.status(404).send({ message: 'Profile picture not found' });
    return;
  }
  const imageBuffer = Buffer.from(user.ProfilePicture);
  reply.code(200).type('image/png').send(imageBuffer);
}
