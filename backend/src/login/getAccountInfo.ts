import type { ApiMessageHandler } from '../handlers/loginHandler';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';



export const getCurrentLoginInfo: ApiMessageHandler = async (
  payload,
  request,
  prisma,
  fastify,
  reply
) => {
    fastify.log.info(`Handling getUserInfo request`);
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
    fastify.log.info(`Found user: ${user.Alias}`);
    // Return user info
    reply.status(200).send({
        user: {
            Alias: user.Alias,
            Email: user.Email,
            Online: user.Online.toString(),
            CreationDate: user.CreationDate,
        },
    });
}

