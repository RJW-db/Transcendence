import type { ApiMessageHandler } from '../handlers/loginHandler';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';

export const getCurrentLoginInfo: ApiMessageHandler = async (
  payload,
  db,
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
    const user = await prisma.user.findUnique({ where: { ID: userId } }, { logMessage: 'Finding user in getCurrentLoginInfo', errorCode: 'P2025' });
    if (!user) {
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
