import type { ApiMessageHandler } from '../handlers/loginHandler';
import {verifyToken, generateTOTPsecret} from '../authentication/TOTP'
import { getGoogleUserInfo, generateCookie} from './accountUtils';
import { handleLoginPassword, oauthLogin } from './handleLogin';
import { handleRegister, handleRegisterTotp } from './handleRegister';

export const handleOauthToken: ApiMessageHandler = async (
  payload: { Token: string },
  request,
    prisma,
    fastify,
    reply
) => {
  const userInfo : { email: string; name: string } | null = await getGoogleUserInfo(payload.Token, fastify, reply);
  if (!userInfo) {
      return;
  }
  const user = await prisma.user.findFirst({
    where: { OR: [{ Email: userInfo.email }, { Alias: userInfo.name }] }
  });

  if (user) {
    if (user.OauthLogin === true) {
      const input = { Email: userInfo.email, Password: 'oauth_placeholder'};
      return handleLoginPassword(input, request, prisma, fastify, reply);
    }
    else {
      fastify.log.error(`User exists but is not an OAuth user: ${JSON.stringify(user)}`);
      reply.status(400).send({ message: 'User exists but is not an OAuth user' });
    }

  }
  else {
      const input = {Alias: userInfo.name, Email: userInfo.email, Password: 'tempoauth', oauthLogin: true, };
      handleRegister(input, request, prisma, fastify, reply);
  }
}

export const oauthRegister: ApiMessageHandler = async (  
    payload: { Token: string, loginToken: string },
  request,
  prisma,
  fastify,
  reply

) => {
  const userInfo : { email: string; name: string } | null = await getGoogleUserInfo(payload.Token, fastify, reply);
  if (!userInfo) {
      return;
  }
  return handleRegisterTotp({verifyToken: payload.loginToken}, request, prisma, fastify, reply);

}
