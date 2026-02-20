import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from '../authentication/hashPasswords';
import { verifyToken, generateTOTPsecret } from '../authentication/TOTP'
import { generateCookie } from './accountUtils'
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import { PrismaClient } from '@prisma/client';

async function  checkAccountExists(alias: string, email: string, prisma : PrismaClient): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { Alias: alias },
        { Email: email }
      ]
    }
  });
  if (!user) {
    return Promise.resolve(false);
  }
  return Promise.resolve(true);
}

export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string; oauthLogin?: boolean },
  request,
  prisma,
  fastify,
  reply
) => {
  if (await checkAccountExists(payload.Alias, payload.Email, prisma)) {
    fastify.log.error(`User already exists: ${payload.Alias}, ${payload.Email}`);
    reply.status(400).send({ message: 'User already exists' });
    return;
  }

  if (!payload.Alias || !payload.Email || !payload.Password) {
    fastify.log.error(`Incomplete user info received:' ${JSON.stringify(payload)}`);
    reply.status(500).send({ message: 'Incomplete user info received to register account' });
    return;
  }
  const hashedPassword = await hashPassword(payload.Password)
  const secret = generateTOTPsecret();

  const user = await prisma.user.create({
    data: {
      Alias: payload.Alias,
      Email: payload.Email,
      Password: hashedPassword,
      Secret2FA: secret,
      Online: true,
      CreationDate: new Date(),
      OauthLogin: payload.oauthLogin ?? false,
    },
  });
  if (!user) {
    fastify.log.info(`failed to Register user:' ${JSON.stringify(payload)}`);
    reply.status(400).send({ message: "Failed to create user object" });
    return;
  }
  let tmpToken = generateJWT(user.ID, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_MS / 1000);
  reply.cookie('tempAuth', tmpToken, { maxAge: TOKEN_TIMES.SHORT_LIVED_TOKEN_MS });

  fastify.log.info(`Registered new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "User registered, please verify 2FA code", userID: user.ID, secret: secret , userEmail: user.Email});
  
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // removes account if not confirmed within 1 minute

  const pendingAccount : Boolean = (await prisma.user.findUnique({ where: { ID: user.ID } }))?.pendingAccount ?? false;
  if (pendingAccount) {
    await prisma.user.delete({ where: { ID: user.ID } });
    fastify.log.info(`Deleted unverified user: ${JSON.stringify(user)}`);
    return;
  }
  else
    console.log(`User ${user.Email} verified 2FA and completed registration`);
};

export const handleRegisterTotp: ApiMessageHandler = async (
  payload: { VerifyToken: string},
  request,
  prisma,
  fastify,
  reply
) => {
  const tempToken : string | undefined = request.cookies.tempAuth;
  if (!tempToken) {
    console.log("No temp token found in cookies");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }
  const decoded = decodeJWT(tempToken, JWT_SECRET);
  if (!decoded) {
    console.log("Failed to decode temp token");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const userId = decoded.sub;
  
  let user = await prisma.user.findUnique({ where: { ID: userId } });
  if (!user) {
    reply.status(400).send({ message: 'User not found' });
    return;
  }
  
  if (!(await verifyToken(payload.VerifyToken, user.Secret2FA))) {
    fastify.log.error(`Incorrect Token entered for registration`);
    reply.status(400).send({message: "Incorrect Token entered"});
    return;
  }

  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;
  user = await prisma.user.update({
    where: { ID: user.ID },
    data: { pendingAccount: false }
  });
  if (!user) {
    fastify.log.error(`Failed to update user after 2FA verification:`);
    reply.status(500).send({ message: 'Failed to register user after 2FA verification' });
    return;
  }
  reply.clearCookie('tempAuth');
  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  
  reply.status(200).send({ message: "Created new user with email: " + user.Email, user: {email: user.Email, alias: user.Alias, userID: user.ID}});
}

export const createGuestAccount : ApiMessageHandler = async (
  payload: { Alias: string },
  request,
  prisma,
  fastify,
  reply
) => {
  fastify.log.info(`Handling guest account creation for alias: ${payload.Alias}`);
  const secret = ''
  const email = payload.Alias + '@guest.account'
  const alias = payload.Alias + '_guest'
  const user = await prisma.user.create({
    data: {
      Alias: alias,
      Email: email,
      Password: '',
      Secret2FA: secret,
      // AccountDeleteTime: null,
      GuestLogin: true,
      CreationDate: new Date(),
    },
  });
  if (!user) {
    fastify.log.error(`Failed to create guest account for alias: ${payload.Alias}`);
    reply.status(500).send({ message: 'Failed to create guest account' });
    return;
  }
  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;
  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "Created new guest user ", user: {email: user.Email, alias: user.Alias, userID: user.ID, guestLogin: true}});
};
