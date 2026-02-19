import { socket } from './socket';

interface IncomingDirectMessage {
	senderID: number;
	message: string;
}

type SendDirectMessageResponse = {
	success: boolean;
	error?: string;
};

declare global {
	interface Window {
		sendDM: (userName: string, message: string) => void;
	}
}

export function initDirectMessages() {
	window.sendDM = (userName: string, message: string) => {
		socket.emit(
			'sendDirectMessage',
			{ receiverUserName: userName, message },
			(response: SendDirectMessageResponse) => {
				if (!response.success) {
					console.error('Error:', response.error);
				} else {
					console.log('Message send!');
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
}
