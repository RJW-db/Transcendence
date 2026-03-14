import { ActionResponse, BlockActionRequest, SocketContext } from '../types';
import { requireUser } from '../services/authService';
import { findUser } from '../services/userService';
import { blockUserAndRemoveFriendship, findBlock } from '../services/blockService';

// TODO: clean up handler by adding service functions

export async function blockHandler({ io, socket, db }: SocketContext) {

	socket.on("blockUser", async (req: BlockActionRequest, callback: (response: ActionResponse) => void) => {
		const auth = requireUser(socket, callback);
		if (!auth)
			return;
		const { userId } = auth;

		// TODO: implement block logic
		try {
			const targetUser = await findUser(db, req.receiverAlias);
			if (!targetUser)
				return callback({ success: false, error: "User does not exist" });

			const blocked = await findBlock(db, userId, targetUser.ID);
			if (blocked)
				return callback({ success: false, error: "User is already blocked" });

			await blockUserAndRemoveFriendship(db, userId, targetUser.ID);
			callback({ success: true });
		} catch (error) {
			console.error("Prisma error blocking user:", error);
			return callback({ success: false, error: "Failed to block user" });
		}

	});
}
