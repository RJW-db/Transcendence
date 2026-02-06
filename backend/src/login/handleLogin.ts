import type { ApiMessageHandler } from '../handlers/loginHandler';
import { getGoogleUserInfo, generateCookie} from './accountUtils';
import { verifyPassword } from './hashPasswords';
import { verifyToken } from './TOTP'
import { JWT_SECRET, generateJWT, verifyJWT, decodeJWT } from './jsonWebToken';


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

  let tmpToken = generateJWT(user.ID, JWT_SECRET);
  reply.cookie('tempAuth', tmpToken, { maxAge: 600000 }); // 10 minutes

  // Return temporary token so frontend can use it with TOTP
  reply.status(200).send({ message: 'Password verified, please enter 2FA code', tmpToken });

  // if (!(await verifyToken(payload.Token2fa, user.Secret2FA))) {
  //   fastify.log.error(`Invalid code entered for email: ${payload.Email}, code provided: ${payload.Token2fa}`);
  //   reply.status(400).send({ message: 'Invalid 2FA token entered' });
  //   return;
  // }
  // // Set a cookie or session here if needed
  // const dbCookie = await generateCookie(user.ID, prisma, reply, fastify);
  // if (!dbCookie) 
  //   return;
  // fastify.log.info(`User logged in successfully: ${JSON.stringify(user)}`);
  // reply.status(200).send({ message: 'Login successful', user: {email: user.Email, alias: user.Alias, userID: user.ID} });
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
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
        fastify.log.error('No sessionId cookie found for logout');
        reply.status(400).send({ message: 'failed to delete sessionId cookie' });
        return;
    }
    // Delete the cookie from the database
    const deletedCookie = await prisma.cookie.deleteMany({
        where: { CookieValue: sessionId },
    });
    if (deletedCookie.count === 0) {
        fastify.log.error(`No cookie found in DB for sessionId: ${sessionId}`);
    } else {
        fastify.log.info(`Deleted cookie from DB for sessionId: ${sessionId}`);
    }
    // Clear the cookie in the response
    reply.clearCookie('sessionId');
    fastify.log.info(`User logged out successfully for sessionId: ${sessionId}`);
    reply.status(200).send({ message: 'Logout successful' });
};
