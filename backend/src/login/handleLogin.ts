import type { ApiMessageHandler } from '../handlers/loginHandler';
import { getGoogleUserInfo, generateCookie} from './accountUtils';
import { verifyPassword } from '../authentication/hashPasswords';
import { verifyToken } from '../authentication/TOTP'
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT, authenticateUserSession, generateShortLivedJWT, generateRegistrationJWT } from '../authentication/jsonWebToken';
import { db } from '../database/database';
import { refreshUserToken } from '../authentication/refreshToken';


export const handleLoginPassword: ApiMessageHandler = async (
  payload: { Email: string; Password: string},
  request,
  prisma,
  fastify,
  reply
) => {
  fastify.log.info(`Handling login for email: ${payload.Email}`);

    const user = await db.findUser({ Email: payload.Email }, reply, { messages: { P2025: 'User not found' }, autoReply: true });
    if (!db.isDatabaseOperationSuccessful() || !user) return;

  if (user.OauthLogin === false && (!user.Password || !(await verifyPassword(user.Password, payload.Password)))) {
    fastify.log.error(`Invalid password for email: ${payload.Email}`);
    reply.status(400).send({ message: 'Invalid email or password' });
    return;
  }

  // let tmpToken = generateJWT(user.ID, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_MS / 1000);
  // reply.cookie('jwtReg', tmpToken, { maxAge: TOKEN_TIMES.SHORT_LIVED_TOKEN_MS });
  reply.clearCookie('jwt');
  generateShortLivedJWT(user.ID, reply);

  // Return temporary token so frontend can use it with TOTP
  reply.status(200).send({ message: 'Password verified, please enter 2FA code' });
}

export const handleLoginTotp: ApiMessageHandler = async (
  payload: { Token2fa: string},
  request,
  prisma,
  fastify,
  reply
) => {
  const tempToken = request.cookies.jwt;
  if (!tempToken) {
    reply.status(401).send({ message: 'cookie session expired' });
    return;
  }
  const decoded = decodeJWT(tempToken);
  if (!decoded) {
    reply.clearCookie('jwt');
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const userId = decoded.sub;
  
    const user = await db.findUser({ ID: userId }, reply, { messages: { P2025: 'User not found' }, autoReply: true });
    if (!db.isDatabaseOperationSuccessful() || !user) return;

  if (!(await verifyToken(payload.Token2fa, user.Secret2FA))) {
    reply.status(400).send({ message: 'Invalid 2FA token' });
    return;
  }

  // const refreshSuccess = await createRefreshToken(user.ID, request, reply, prisma);
  // if (!refreshSuccess) {
  //   return;
  // }
  reply.clearCookie('jwt');
  generateShortLivedJWT(user.ID, reply);
  // await generateCookie(user.ID, prisma, reply, fastify);
  reply.status(200).send({ message: 'Login successful', user: {email: user.Email, alias: user.Alias, userID: user.ID} });
};

export const oauthLogin: ApiMessageHandler = async (
  payload: { Token: string, loginToken: string },
  request,
  prisma,
  fastify,
  reply

) => {
  const userInfo: { email: string; name: string } | null = await getGoogleUserInfo(payload.Token, fastify, reply);
  if (!userInfo) {
    return;
  }

    const user = await db.findUser({ OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }, reply, { messages: { P2025: 'No such OAuth user' }, autoReply: true });
    if (!db.isDatabaseOperationSuccessful() || !user) return;

  fastify.log.info(`Verifying 2FA token for OAuth login: ${payload.loginToken}, user secret: ${user.Secret2FA}`);
  if (!(await verifyToken(payload.loginToken, user.Secret2FA))) {
    fastify.log.error(`Invalid 2FA token for OAuth registration`);
    reply.status(400).send({ message: 'Invalid 2FA token' });
    return;
  }
  // const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
  reply.clearCookie('jwt');
  generateShortLivedJWT(user.ID, reply);
  // authenticateUserSession(request, reply, prisma);
  fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: 'OAuth login successful', user: {email: user.Email, alias: user.Alias, userID: user.ID} });
}

export const handleLogout: ApiMessageHandler = async (
  payload,
  request,
  prisma,
  fastify,
  reply
) => {
    // Clear the cookie in the response
    reply.clearCookie('jwt');
    reply.status(200).send({ message: 'Logout successful' });
};
