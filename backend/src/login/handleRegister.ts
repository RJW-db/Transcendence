import type { ApiMessageHandler } from '../handlers/loginHandler';
import { hashPassword } from '../authentication/hashPasswords';
import { verifyToken, generateTOTPsecret } from '../authentication/TOTP';
import { generateCookie } from './accountUtils';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT, generateRegistrationJWT, authenticateUserRegistration, generateShortLivedJWT } from '../authentication/jsonWebToken';
import { refreshUserToken } from '../authentication/refreshToken';

export const handleRegister: ApiMessageHandler = async (
  payload: { Alias: string; Email: string; Password: string; oauthLogin?: boolean },
  request,
  db,
  fastify,
  reply
) => {
  const existingUser = await db.user.findFirst({
    where: {
      OR: [
        { Alias: payload.Alias },
        { Email: payload.Email }
      ]
    }
  }, { logMessage: 'Checking for existing user in handleRegister' });
// const existingUser = await db.user.findFirst({
//   where: { nonExistentField: "value" }, // Field does not exist in your schema
// }, { logMessage: "Testing invalid field in findFirst" });

  if (existingUser) {
    fastify.log.error(`Attempt to register with existing email or alias: ${JSON.stringify(payload)}`);
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

  const user = await db.user.create({
    data: {
      Alias: payload.Alias,
      Email: payload.Email,
      Password: hashedPassword,
      Secret2FA: secret,
      Online: true,
      CreationDate: new Date(),
      OauthLogin: payload.oauthLogin ?? false,
      pendingAccount: true,
    }
  }, { logMessage: 'Creating user in handleRegister', errorCode: 'P2002' });

  if (!user) {
    console.log('User creation failed');
    return;
  }

  generateRegistrationJWT(user.ID, reply);
  fastify.log.info(`Registered new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "User registered, please verify 2FA code", userID: user.ID, secret: secret , userEmail: user.Email});
  
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // removes account if not confirmed within 1 minute

  const pendingAccount: boolean = (await db.user.findUnique({ where: { ID: user.ID } }, { logMessage: 'Checking pendingAccount in handleRegister' }))?.pendingAccount ?? false;
  if (pendingAccount) {
    await db.user.delete({ where: { ID: user.ID } }, { logMessage: 'Deleting unverified user in handleRegister' });
    fastify.log.info(`Deleted unverified user: ${JSON.stringify(user)}`);
    return;
  } else {
    console.log(`User ${user.Email} verified 2FA and completed registration`);
  }
};

export const handleRegisterTotp: ApiMessageHandler = async (
  payload: { VerifyToken: string },
  request,
  db,
  fastify,
  reply
) => {
  const tempToken: string | undefined = request.cookies.jwtReg;
  console.log('handleRegisterTotp called');
  if (!tempToken) {
    console.log("No temp token found in cookies");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const decoded = decodeJWT(tempToken);
  console.log('Decoded JWT:', decoded);
  if (!decoded) {
    reply.clearCookie('jwtReg');
    console.log("Failed to decode temp token");
    reply.status(401).send({ message: 'Session expired' });
    return;
  }

  const userId = decoded.sub;
  let user = await db.user.findUnique({ where: { ID: userId } }, { logMessage: 'Finding user in handleRegisterTotp' });
  console.log('User found:', user);
  if (!user) {
    console.log('No user found for ID:', userId);
    return;
  }

  if (!(await verifyToken(payload.VerifyToken, user.Secret2FA))) {
    fastify.log.error(`Incorrect Token entered for registration`);
    reply.status(400).send({ message: "Incorrect Token entered" });
    return;
  }
  console.log('Token valid:');

  if (!await authenticateUserRegistration(userId, request, reply, db)) {
    console.log('authenticateUserRegistration failed');
    return;
  }
  console.log('authenticateUserRegistration success:');


  user = await db.user.update({ where: { ID: user.ID }, data: { pendingAccount: false } }, { logMessage: 'Updating user after 2FA in handleRegisterTotp' });
  if (!user) {
    console.log('User update failed');
    return;
  }
  console.log('User update successful:', user);


  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  console.log('Sending success response for new user:', user);
  reply.status(200).send({ message: "Created new user with email: " + user.Email, user: { email: user.Email, alias: user.Alias, userID: user.ID } });
};

export const createGuestAccount: ApiMessageHandler = async (
  payload: { Alias: string },
  request,
  db,
  fastify,
  reply
) => {
  fastify.log.info(`Handling guest account creation for alias: ${payload.Alias}`);
  const secret = '';
  const email = payload.Alias + '@guest.account';
  const alias = payload.Alias + '_guest';

  const user = await db.user.create({
    data: {
      Alias: alias,
      Email: email,
      Password: '',
      Secret2FA: secret,
      GuestLogin: true,
      CreationDate: new Date(),
    }
  }, { logMessage: 'Creating guest user in createGuestAccount', errorCode: 'P2002' });

  if (!user)
    return;

  reply.clearCookie('jwt');
  generateShortLivedJWT(user.ID, reply);
  fastify.log.info(`Created new user: ${JSON.stringify(user)}`);
  reply.status(200).send({ message: "Created new guest user ", user: { email: user.Email, alias: user.Alias, userID: user.ID, guestLogin: true } });
};
