import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from '../authentication/hashPasswords';
import { verifyToken, generateTOTPsecret } from '../authentication/TOTP';
import { generateCookie } from './accountUtils';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT, generateRegistrationJWT, authenticateUserRegistration, generateShortLivedJWT } from '../authentication/jsonWebToken';
import { refreshUserToken } from '../authentication/refreshToken';
import { db } from '../database/database';

export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string; oauthLogin?: boolean },
  request,
  prisma,
  fastify,
  reply
) => {
  const existingUser = await db.findUser({
    OR: [
      { Alias: payload.Alias },
      { Email: payload.Email }
    ]
  }, reply, {
    autoReply: false
  });
  if (!db.isDatabaseOperationSuccessful())
    return;

  if (existingUser) {
    reply.status(409).send({ message: 'User already exists' });
    return;
  }

  if (!payload.Alias || !payload.Email || !payload.Password) {
    fastify.log.error(`Incomplete user info received:' ${JSON.stringify(payload)}`);
    reply.status(500).send({ message: 'Incomplete user info received to register account' });
    return;
  }
  const hashedPassword = await hashPassword(payload.Password);
  const secret = generateTOTPsecret();

  const user = await db.createUser({
    Alias: payload.Alias,
    Email: payload.Email,
    Password: hashedPassword,
    Secret2FA: secret,
    Online: true,
    CreationDate: new Date(),
    OauthLogin: payload.oauthLogin ?? false,
    pendingAccount: true,
  }, reply, {
    messages: { P2002: 'Email or alias already taken' },
    autoReply: true
  });

  if (!user) return; // Reply sent by db.createUser if creation fails

  generateRegistrationJWT(user.ID, reply);

  fastify.log.info(`Registered new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "User registered, please verify 2FA code", userID: user.ID, secret: secret , userEmail: user.Email});
  
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // removes account if not confirmed within 1 minute

  const pendingAccount: boolean = (await db.findUser({ ID: user.ID }, reply))?.pendingAccount ?? false;
  if (pendingAccount) {
    await db.deleteUser(user.ID, reply);
    fastify.log.info(`Deleted unverified user: ${JSON.stringify(user)}`);
    return;
  } else {
    console.log(`User ${user.Email} verified 2FA and completed registration`);
  }
};

export const handleRegisterTotp: ApiMessageHandler = async (
  payload: { VerifyToken: string },
  request,
  prisma,
  fastify,
  reply
) => {
  const tempToken: string | undefined = request.cookies.jwtReg;
  if (!tempToken) {
    console.log("No temp token found in cookies");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const decoded = decodeJWT(tempToken);
  if (!decoded) {
    reply.clearCookie('jwtReg');
    console.log("Failed to decode temp token");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const userId = decoded.sub;
  let user = await db.findUser({ ID: userId }, reply, { messages: { notFound: 'User not found' }, autoReply: true });
  if (!user) return; // Reply sent by db.findUser if user not found

  if (!(await verifyToken(payload.VerifyToken, user.Secret2FA))) {
    fastify.log.error(`Incorrect Token entered for registration`);
    reply.status(400).send({ message: "Incorrect Token entered" });
    return;
  }

  if (!await authenticateUserRegistration(userId, request, reply, db)) {
    return;
  }

  user = await db.updateUser(user.ID, { pendingAccount: false }, reply, { messages: { failed: 'Failed to register user after 2FA verification' }, autoReply: true });
  if (!user) return; // Reply sent by db.updateUser if update fails

  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "Created new user with email: " + user.Email, user: { email: user.Email, alias: user.Alias, userID: user.ID } });
};

export const createGuestAccount: ApiMessageHandler = async (
  payload: { Alias: string },
  request,
  prisma,
  fastify,
  reply
) => {
  fastify.log.info(`Handling guest account creation for alias: ${payload.Alias}`);
  const secret = '';
  const email = payload.Alias + '@guest.account';
  const alias = payload.Alias + '_guest';

  const user = await db.createUser({
    Alias: alias,
    Email: email,
    Password: '',
    Secret2FA: secret,
    GuestLogin: true,
    CreationDate: new Date(),
  }, reply, {
    messages: { P2002: 'Guest account already exists' },
    autoReply: true
  });

  if (!user) return; // Error already sent to client

  reply.clearCookie('jwt');
  generateShortLivedJWT(user.ID, reply);

  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "Created new guest user ", user: { email: user.Email, alias: user.Alias, userID: user.ID, guestLogin: true } });
};
