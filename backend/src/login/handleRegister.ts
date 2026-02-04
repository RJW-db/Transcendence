import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from './hashPasswords';
import { verifyToken, generateSecret } from './TOTP'
import { generateCookie } from './accountUtils'
import { JWT_SECRET, generateJWT, verifyJWT } from './jsonWebToken';


export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string, Secret: string, VerifyToken: string },
  request,
  prisma,
  fastify,
  reply
) => {
  console.log('=== REGISTER HANDLER STARTED ===');
  if (!payload.Alias || !payload.Email || !payload.Password || !payload.Secret) {
    fastify.log.error(`Incomplete user info received:' ${JSON.stringify(payload)}`);
    reply.status(500).send({ message: 'Incomplete user info received to register account' });
    return;
  }
  if (!(await verifyToken(payload.VerifyToken, payload.Secret))) {
    fastify.log.error(`Incorrect Token entered for registration:' ${JSON.stringify(payload)}`);
    reply.status(400).send({message: "Incorrect Token entered"});
    return;
  }
  const hashedPassword = await hashPassword(payload.Password)
  const user = await prisma.user.create({
    data: {
      Alias: payload.Alias,
      Email: payload.Email,
      Password: hashedPassword,
      Secret2FA: payload.Secret,
      OauthLogin: false,
      Online: true,
      CreationDate: new Date(),
    },
  });
  if (!user) {
    fastify.log.info(`failed to Register user:' ${JSON.stringify(payload)}`);
    reply.status(400).send({ message: "Failed to create user object" });
    return;
  }

  // let currentTime = Date.now() / 1000;
  // let payloadJWT = { sub: user.ID, iat: Math.floor(currentTime), exp: Math.floor(currentTime) + (600) }; // Token valid for 10 minutes
  // let token = generateJWT(payloadJWT, JWT_SECRET);
  // console.log(token);


  
  // // Example usage of verifyJWT
  // try {
  //     const decoded = verifyJWT(token, JWT_SECRET);
  //     console.log('Decoded JWT:', decoded);
  // } catch (e) {
  //     console.error('JWT verification failed:', (e as Error).message);
  // }

  if (!await generateCookie(user.ID, prisma, reply, fastify))
    return;
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
  const secret = generateSecret();
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
  const user = await prisma.user.create({
    data: {
      Alias: alias,
      Email: email,
      Password: '',
      Secret2FA: secret,
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
