// import io  from 'socket.io-client';
import './services/socket';
import './styles.css';

import { Navbar } from './pages/navbar'
// import { PongPage } from './pages/pong';
// import { TournamentsPage } from './pages/tournament';
import { initRouter } from './router';

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
}

booststrap();
