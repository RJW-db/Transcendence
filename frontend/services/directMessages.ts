import { socket } from './socket';
import type {
	ActionResponse,
	UserData,
	IncomingDirectMessage,
	IncomingFriendRequest,
} from '@transcendence/shared';

declare global {
	interface Window {
		sendDM: (alias: string, message: string) => void;
		readDM: (ID: number) => void;
		sendFriendRequest: (alias: string) => void;
		acceptFriendRequest: (requestID: number) => void;
		declineFriendRequest: (requestID: number) => void;
	}
}

export function initDirectMessages() {
	window.sendDM = (alias: string, message: string) => {
		socket.emit(
			'sendDirectMessage',
			{ receiverAlias: alias, message: message },
			(response: ActionResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Message send!');
				}
			}
		);
	};

	window.readDM = (ID: number) => {
		socket.emit(
			'readMessage',
			ID,
			(response: ActionResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Message marked as read:', ID);
				}
			}
		);
	};

	window.sendFriendRequest = (alias: string) => {
		socket.emit(
			'sendFriendRequest',
			{ receiverAlias: alias },
			(response: ActionResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Friend request sent to', alias);
				}
			}
		);
	};

	window.acceptFriendRequest = (requestID: number) => {
		socket.emit(
			'acceptFriendRequest',
			requestID,
			(response: ActionResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Friend request accepted:', requestID);
				}
			}
		);
	};

	window.declineFriendRequest = (requestID: number) => {
		socket.emit(
			'declineFriendRequest',
			requestID,
			(response: ActionResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Friend request declined:', requestID);
				}
			}
		);
	};

	socket.on('directMessage', (msg: IncomingDirectMessage) => {
		console.log('Received direct message:', msg);
	});

	socket.on('unreadMessages', (msgs: IncomingDirectMessage[]) => {
		msgs.forEach((incomingMessage) =>
			console.log('Received direct message:', incomingMessage)
		);
	});

	socket.on('newFriendRequest', (req: IncomingFriendRequest) => {
		console.log('Received friend request:', req);
	});

	socket.on('allFriendRequests', (reqs: IncomingFriendRequest[]) => {
		console.log('All friend requests:', reqs);
	});

	socket.on('newFriend', (friend: UserData) => {
		console.log('You are now friends with:', friend);
	});
}
