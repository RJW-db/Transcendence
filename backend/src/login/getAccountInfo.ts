import type { ApiMessageHandler } from '../handlers/loginHandler';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';

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
      ProfilePicture: user.ProfilePicture,
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
  const jwtCookie = request.cookies.auth;
  if (!jwtCookie) {
    reply.status(401).send({ message: 'Not authenticated' });
    return;
  }

  const decoded = decodeJWT(jwtCookie, JWT_SECRET);
  if (!decoded) {
    reply.status(401).send({ message: 'Session expired' });
    return;
  }
  const userId : number = decoded.sub;
  getLoginInfo({ userID: userId }, request, prisma, fastify, reply);

}

