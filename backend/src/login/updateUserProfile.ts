import type { ApiMessageHandler } from '../handlers/loginHandler';
import { JWT_SECRET, TOKEN_TIMES, generateJWT, decodeJWT } from '../authentication/jsonWebToken';
import {getCurrentUserId} from './getAccountInfo';
import { hashPassword } from '../authentication/hashPasswords';
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import { PrismaClient } from '@prisma/client';




export async function updateUserImage(request : FastifyRequest, prisma : PrismaClient, fastify : FastifyInstance, reply : FastifyReply) {
    const userId = await getCurrentUserId(request, reply);
    if (!userId)
        return; 
    const user = await prisma.user.findUnique({ where: { ID: userId } });
    if (!user) {
        reply.status(400).send({ message: 'User not found' });
        return;
    }
	const data = await request.file();
	if (!data) {
		fastify.log.error('No file received in multipart/form-data request');
        reply.status(400).send({ message: 'No file received in multipart/form-data request' });
		return;
	}
    const dataBuffer : Uint8Array<ArrayBuffer> = await data.toBuffer() as Uint8Array<ArrayBuffer>;
    if (dataBuffer.length > 5 * 1024 * 1024) { // Limit file size to 5MB
        fastify.log.error('File size exceeds limit of 5MB');
        reply.status(400).send({ message: 'File size exceeds limit of 5MB' });
        return;
    }
    const updatedUser = await prisma.user.update({
        where: { ID: userId },
        data: {
            ProfilePicture: dataBuffer,
        },
    });
    if (!updatedUser) {
        reply.status(500).send({ message: 'Failed to update user profile picture' });
        return;
    }
    reply.send({ message: 'User profile picture updated successfully' });
}



export const updateUserProfile: ApiMessageHandler = async (
  payload: { Alias?: string; Email?: string; ProfilePicture?: string, password?: string },
  request,
  prisma,
  fastify,
  reply
) => {
    const userId = await getCurrentUserId(request, reply);
    if (!userId)
        return; 
    const user = await prisma.user.findUnique({ where: { ID: userId } });
    if (!user) {
        reply.status(400).send({ message: 'User not found' });
        return;
    }
    if (user.OauthLogin) {
        payload.Email = user.Email; // Ensure email is not changed for OAuth users
    }
    
    // let profilePicture: Buffer | null = null;

    // if (payload.ProfilePicture) {
    //     try {
    //         // Remove the data URL prefix (e.g., "data:image/png;base64,")
    //         const base64Data = payload.ProfilePicture.split(',')[1] || payload.ProfilePicture;
    //         // Convert base64 string to Buffer
    //         profilePicture = Buffer.from(base64Data, 'base64');
    //         fastify.log.info(`Received profile picture update for user ID ${userId}, size: ${profilePicture.length} bytes`);
    //     } catch (error) {
    //         fastify.log.error(`Error processing profile picture for user ID ${userId}: ${error}`);
    //         reply.status(400).send({ message: 'Invalid profile picture data' });
    //         return;
    //     }
    // } else {
    //     fastify.log.info(`No profile picture update for user ID ${userId}`);
    // }
    

    const hashedPassword = payload.password ? await hashPassword(payload.password) : null;


    fastify.log.info(`Updating profile for user ID ${userId} with data: Alias=${payload.Alias}, Email=${payload.Email}, HasProfilePicture=${!!payload.ProfilePicture}, HasPassword=${!!hashedPassword}`);
    const updatedUser = await prisma.user.update({
        where: { ID: userId },
        data: {
            Alias: payload.Alias || user.Alias,
            Email: payload.Email || user.Email,
            // ProfilePicture: profilePicture || user.ProfilePicture,
            Password: hashedPassword || user.Password,
        },
    });
    // print new profile picture data size if updated
    if (payload.ProfilePicture) {
        fastify.log.info(`Updated profile picture for user ID ${userId}, new size: ${updatedUser.ProfilePicture ? updatedUser.ProfilePicture.length : 0} bytes`);
    }
    if (!updatedUser) {
        reply.status(500).send({ message: 'Failed to update user profile' });
        return;
    }
    reply.send({ message: 'User profile updated successfully' });
  }
