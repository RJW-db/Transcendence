import { SocketContext } from '../types';
import type { UserData } from '../types';


export async function friendRequestHandler({ io, socket, db }: SocketContext) {

	socket.on('sendFriendRequest', async (receiverUserName: string, callback: (response: { success: boolean, error?: string}) => void) => {
		const senderID = socket.data.userId;

		if (!senderID)
			return callback({ success: false, error: "Not authenticated" });
		if (!receiverUserName || receiverUserName.trim().length === 0)
			return callback({ success: false, error: "Username cannot be empty" });

		try {

			const receiver = await db.user.findUnique({
				where: { Alias: receiverUserName }
			});
			if (!receiver)
				return callback({ success: false, error: "User does not exist" });

			const friendRequest = await db.friendRequest.create({
				data: {
					SentAt: new Date(),
					Sender: {
						connect: { ID: senderID },
					},
					Receiver: {
						connect: { ID: receiver.ID },
					}
				}
			});

			// TODO: add socket.data.userName variable and store user name in there.

			// const userData: UserData = {
			// 	userID: senderID,
			// 	userName: socket.data.userName
			// };

		} catch (error) {
			console.error("Prisma error sending friend request:", error);
			return callback({ success: false, error: "Failed to send friend request" });
		}
	});
}