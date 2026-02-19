import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from '../authentication/hashPasswords';
import { verifyToken, generateTOTPsecret } from '../authentication/TOTP'
import { generateCookie } from './accountUtils'
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import { createSafePrisma } from '../utils/prismaHandle';


export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string, Secret: string },
  request,
  prisma,
  fastify,
  reply
) => {
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
      OauthLogin: false,
      AccountDeleteTime: new Date(Date.now() + 1000 * 60), // 60 seconds from now
      Online: true,
      CreationDate: new Date(),
    },
  });

  if (!user) return; // Error already sent to client

  let tmpToken = generateJWT(user.ID, JWT_SECRET, 10);
  reply.cookie('tempAuth', tmpToken);


  fastify.log.info(`Registered new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "User registered, please verify 2FA code", userID: user.ID, secret: secret });
};

export const handleRegisterTotp: ApiMessageHandler = async (
  payload: { VerifyToken: string, tempToken: string },
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

  const user = await db.user.findUnique({ where: { ID: userId } });
  if (!user) return; // Error already sent to client

  if (!(await verifyToken(payload.VerifyToken, user.Secret2FA))) {
    fastify.log.error(`Incorrect Token entered for registration`);
    reply.status(400).send({message: "Incorrect Token entered"});
    return;
  }

  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;
  reply.clearCookie('tempAuth');
  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  
  reply.status(200).send({ message: "Created new user with email: " + user.Email, user: {email: user.Email, alias: user.Alias, userID: user.ID}});
}





export const checkAccountExists: ApiMessageHandler = async (
  payload: { Alias: string; Email: string },
  request,
  prisma,
  fastify,
  reply
) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ Email: payload.Email }, { Alias: payload.Alias }] }
  });
  if (user) {
    let message = '';
    if (user.Email == payload.Email && user.Alias == payload.Alias)
      message = "user with email: " + payload.Email + " and alias: " + payload.Alias + " already exists";
    else if (user.Email == payload.Email)
      message = "user with email: " + payload.Email + " already exists";
    else
      message = "user with alias: " + payload.Alias + " already exists";
    reply.status(400).send({ message: message });
    return;
  }
  const secret = generateTOTPsecret();
  fastify.log.info(`Generated secret for new user: ${secret}`);
  reply.status(200).send({ message: "No accounts with email: " + payload.Email + " or alias: " + payload.Alias + " exist", secret: secret });
};

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
