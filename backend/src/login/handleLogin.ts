import type { ApiMessageHandler } from '../handlers/loginHandler';
import { getGoogleUserInfo, generateCookie} from './accountUtils';
import { verifyPassword } from '../authentication/hashPasswords';
import { verifyToken } from '../authentication/TOTP'
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';


export const handleLoginPassword: ApiMessageHandler = async (
  payload: { Email: string; Password: string; Token2fa: string},
  request,
  prisma,
  fastify,
  reply
) => {
  fastify.log.info(`Handling login for email: ${payload.Email}`);
  const user = await prisma.user.findUnique({
    where: { Email: payload.Email },
  });
  if (!user) {
    fastify.log.error(`User not found for email: ${payload.Email}`);
    reply.status(400).send({ message: 'Invalid email or password' });
    return;
  }

  if (!user.Password || !(await verifyPassword(user.Password, payload.Password))) {
    fastify.log.error(`Invalid password for email: ${payload.Email}`);
    reply.status(400).send({ message: 'Invalid email or password' });
    return;
  }

  let tmpToken = generateJWT(user.ID, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_MS / 1000);
  reply.cookie('tempAuth', tmpToken, { maxAge: TOKEN_TIMES.SHORT_LIVED_TOKEN_MS });

  // Return temporary token so frontend can use it with TOTP
  reply.status(200).send({ message: 'Password verified, please enter 2FA code', tmpToken });
}

export const handleLoginTotp: ApiMessageHandler = async (
  payload: { Token2fa: string, tempToken: string },
  request,
  prisma,
  fastify,
  reply
) => {
  const decoded = decodeJWT(payload.tempToken, JWT_SECRET);
  if (!decoded) {
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const userId = decoded.sub;
  
  const user = await prisma.user.findUnique({ where: { ID: userId } });
  if (!user) {
    reply.status(400).send({ message: 'User not found' });
    return;
  }

  if (!(await verifyToken(payload.Token2fa, user.Secret2FA))) {
    reply.status(400).send({ message: 'Invalid 2FA token' });
    return;
  }

  await generateCookie(user.ID, prisma, reply, fastify);
  reply.clearCookie('tempAuth');
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
  const user = await prisma.user.findFirst({
    where: { OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }
  });
  if (!user) {
    reply.status(400).send({ message: 'No such OAuth user' });
    return;
  }
  fastify.log.info(`Verifying 2FA token for OAuth login: ${payload.loginToken}, user secret: ${user.Secret2FA}`);
  if (!(await verifyToken(payload.loginToken, user.Secret2FA))) {
    fastify.log.error(`Invalid 2FA token for OAuth registration`);
    reply.status(400).send({ message: 'Invalid 2FA token' });
    return;
  }
  const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
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
    reply.clearCookie('auth');
    reply.status(200).send({ message: 'Logout successful' });
};
