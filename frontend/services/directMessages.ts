import { socket } from './socket';

interface UserData {
	ID: number;
	alias: string;
	online: boolean;
}

interface IncomingDirectMessage {
	messageID: number;
	sender: UserData;
	message: string;
	dateTime: Date;
}

interface IncomingFriendRequest {
	requestID: number;
	sender: UserData;
	sentAt: Date;
}

type SendDirectMessageResponse = {
	success: boolean;
	error?: string;
};

type SendFriendRequestResponse = {
	success: boolean;
	error?: string;
};

declare global {
	interface Window {
		sendDM: (alias: string, message: string) => void;
		readDM: (ID: number) => void;
		sendFriendRequest: (alias: string) => void;
	}
}

export function initDirectMessages() {
	window.sendDM = (alias: string, message: string) => {
		socket.emit(
			'sendDirectMessage',
			{ receiverAlias: alias, message: message },
			(response: SendDirectMessageResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Message send!');
				}
			}
		);
	};

	window.readDM = (ID: number) => {
		socket.emit('readMessage', ID);
	}

	window.sendFriendRequest = (alias: string) => {
		socket.emit(
			'sendFriendRequest',
			{ receiverAlias: alias },
			(response: SendFriendRequestResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Friend request sent to', alias);
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
}
