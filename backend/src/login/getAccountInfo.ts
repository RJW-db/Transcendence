import type { ApiMessageHandler } from '../handlers/loginHandler';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import { db } from '../database/database';

export const getCurrentLoginInfo: ApiMessageHandler = async (
  payload,
  request,
  prisma,
  fastify,
  reply
) => {
    fastify.log.info(`Handling getUserInfo request`);
    const decoded = decodeJWT(payload.tempToken);
    if (!decoded) {
      reply.status(401).send({ message: 'Session expired' });
      return;
    }
    const userId = decoded.sub;
    const user = await db.findUser({ ID: userId }, reply, { messages: { P2025: 'User not found' }, autoReply: true });
    if (!db.isDatabaseOperationSuccessful() || !user) {
      return;
    }

    fastify.log.info(`Found user: ${user.Alias}`);

    reply.status(200).send({
        user: {
            Alias: user.Alias,
            Email: user.Email,
            Online: user.Online.toString(),
            CreationDate: user.CreationDate,
        },
    });
}

