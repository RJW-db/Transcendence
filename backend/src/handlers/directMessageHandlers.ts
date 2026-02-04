import { SocketContext, DirectMessagePayload, IncomingDirectMessage
 } from '../types';

export async function directMessageHandler({ io, socket, db }: SocketContext) {
  socket.on('sendDirectMessage', async (msg: DirectMessagePayload) => {
    const senderID = socket.data.userId;

	// Add to database
	// await db.message.create({
	// 	data: {
	// 		SenderID: senderID,
	// 		ReceiverID: msg.receiverId,
	// 		Message: msg.message,
	// 		DateTime: new Date(),
	// 		IsRead: false,
	// 	},
	// }); Need to have actual users to be able to add to database

	// Check if receiver is online


	// If online, send message to receiver


	// If offline, send notification to sender


	const outgoingMessage: IncomingDirectMessage = {
		senderId: senderID,
		message: msg.message,
	};

	io.to(msg.receiverId.toString()).emit('directMessage', outgoingMessage);
  });
};
