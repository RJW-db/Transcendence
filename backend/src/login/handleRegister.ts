import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from '../authentication/hashPasswords';
import { verifyToken, generateTOTPsecret } from '../authentication/TOTP'
import { generateCookie } from './accountUtils'
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import { createSafePrisma } from '../utils/prismaHandle';
import { PrismaClient } from '@prisma/client';
import { createRefreshToken } from '../authentication/refreshToken';


export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string; oauthLogin?: boolean },
  request,
  prisma,
  fastify,
  reply
) => {
  const dbCheck = createSafePrisma(prisma, reply, fastify, {
    P2025: 'User not found'
  });
  const existingUser = await dbCheck.user.findFirst({
    where: {
      OR: [
        { Alias: payload.Alias },
        { Email: payload.Email }
      ]
    }
  });
  if (existingUser) {
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

  const db = createSafePrisma(prisma, reply, fastify, {
    P2002: 'Email or alias already taken'
  });

  const user = await db.user.create({
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

  if (!user) return; // Error already sent to client

  let tmpToken = generateJWT(user.ID, JWT_SECRET, TOKEN_TIMES.TMP_TOKEN_MS / 1000);
  reply.cookie('tempAuth', tmpToken);


  fastify.log.info(`Registered new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "User registered, please verify 2FA code", userID: user.ID, secret: secret , userEmail: user.Email});
  
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // removes account if not confirmed within 1 minute

  const dbCleanup = createSafePrisma(prisma, reply, fastify, {
    P2025: 'User not found'
  });

  const pendingAccount: boolean = (await dbCleanup.user.findUnique({ where: { ID: user.ID } }))?.pendingAccount ?? false;
  if (pendingAccount) {
    await dbCleanup.user.delete({ where: { ID: user.ID } });
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
  // Use the safe Prisma wrapper for user lookup
  const db = createSafePrisma(prisma, reply, fastify, {
    P2025: 'User not found'
  });

  let user = await db.user.findUnique({ where: { ID: userId } });
  if (!user) return; // Error already sent to client

  if (!(await verifyToken(payload.VerifyToken, user.Secret2FA))) {
    fastify.log.error(`Incorrect Token entered for registration`);
    reply.status(400).send({message: "Incorrect Token entered"});
    return;
  }

  const refreshSuccess = await createRefreshToken(user.ID, request, reply, prisma);
  if (!refreshSuccess) {
    return;
  }

  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;

  user = await db.user.update({
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

  const db = createSafePrisma(prisma, reply, fastify, {
    P2002: 'Guest account already exists'
  });

  const user = await db.user.create({
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

  if (!user) return; // Error already sent to client

  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;
  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "Created new guest user ", user: {email: user.Email, alias: user.Alias, userID: user.ID, guestLogin: true}});
};
