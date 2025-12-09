import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';


export type ApiMessageHandler = (
  payload: any,
  prisma: PrismaClient,
  fastify: FastifyInstance,
  reply: FastifyReply
) => Promise<void> | void;

export const apimessageHandlers: Record<string, ApiMessageHandler> = {
  'Register': apiHandleRegister,
  'Login': apiHandleLogin
};

async function apiHandleRegister(
	payload: { Alias: string; Email: string; Password: string },
	prisma: PrismaClient,
	fastify: FastifyInstance,
	reply: FastifyReply
) {
	try {

		let user = await prisma.user.findFirst({
			where: { 
				OR: [
				{ Alias: payload.Alias },
				{ Email: payload.Email }
				]
			}
		});
		if (user) {
			console.log('User already exists:', user);
			reply.status(401).send({message: `choose other Alias and Email please!`})
			return;
		}
		user = await prisma.user.create({
			data: {
				Alias: payload.Alias,
				Email: payload.Email,
				Password: payload.Password,
				Online: true,
				CreationDate: new Date(),
			},
		});
		reply.status(201).send({message: `successfully registerd!`})
	} catch (error) {
    console.error('Registration error:', error);
  }

}

async function apiHandleLogin(
	payload: { Alias: string; Password: string },
	prisma: PrismaClient,
	fastify: FastifyInstance,
	reply: FastifyReply
){
	if (!payload.Password || !payload.Alias){
		console.log('uncompleted info');
		reply.status(400).send({message: `User login failed!`})
		return;


	}
	let	user = await prisma.user.findFirst({
		where: {
			AND: [
			{Alias : payload.Alias},
			{Password: payload.Password}
			]
		}
	});
	if (user){
		console.log(`payload password is ${payload.Password}`);
		console.log(`prisma password is ${user.Password}`);
		console.log(`alias is ${user.Alias}`);
		reply.status(201).send({message: `User can log in successfully!`})

	}else{
		reply.status(401).send({message: `User login failed else statement!`})
		console.log(`api handle log in invalid log info`);
	}
	
}

