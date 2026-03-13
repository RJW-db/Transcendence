import type { ActionResponse, MySocket } from '../types';

type Ack = (response: ActionResponse) => void;

export function requireUser(socket: MySocket, callback: Ack): { userId: number; alias: string } | null {
	const userId = socket.data.userId;
	const alias = socket.data.alias;
	if (!userId || !alias) {
		callback({ success: false, error: 'Not authenticated' });
		return null;
	}
	return { userId, alias };
}
