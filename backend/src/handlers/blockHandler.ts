import { ActionResponse, BlockActionRequest, SocketContext } from '../types';
import { requireUser } from '../services/authService';

// TODO: clean up handler by adding service functions

export async function blockHandler({ io, socket, db }: SocketContext) {

	socket.on("blockUser", async (req: BlockActionRequest, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId, alias } = auth;

		// TODO: implement block logic using userId, alias and req
		try {
			const targetUser = db.user.findUnique({
				where: { Alias: req.receiverAlias },
				select: { ID: true }
			});
			if (!targetUser)
				return callback({ success: false, error: "User does not exist" });

			
			
		} catch (error) {
			console.error("Prisma error blocking user:", error);
			return callback({ success: false, error: "Failed to block user" });
		}

	});
} 