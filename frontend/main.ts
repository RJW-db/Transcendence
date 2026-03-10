// import io  from 'socket.io-client';
import { socket } from './services/socket';
import './styles.css';
import { initDirectMessages } from './services/directMessages';

import { Navbar } from './pages/navbar'
// import { PongPage } from './pages/pong';
// import { TournamentsPage } from './pages/tournament';
import { initRouter } from './router';

export class CustomError extends Error{
	constructor(public message: string, public code: string) {
		super(message);
	}
}


function booststrap() {
	const appRoot = document.querySelector<HTMLDivElement>('#app');
	
	if (!appRoot) return;

	appRoot.innerHTML = '';
	appRoot.appendChild(Navbar());
	// appRoot.appendChild(PongPage())
	// appRoot.appendChild(TournamentsPage())

	const pageContent = document.createElement('main');
	pageContent.id = 'page-content';
	pageContent.className = 'container mx-auto p-6';
	appRoot.appendChild(pageContent);
	
	initRouter();
	initDirectMessages();

	socket.on('internalError', (msg: string) => {
		console.log(`${msg}`);
		pageContent.innerHTML = 'Internal Server Error';
		appRoot.appendChild(pageContent);
	})

}

booststrap();
