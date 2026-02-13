import { socket } from './services/socket'
import { home } from './pages/home';
import { pong } from './pages/pong';
import { tournament } from './pages/tournament';
import { Navbar } from './pages/navbar';

const	routes: Record<string, () => HTMLElement> = {
	'/' : home,
	'/matches/player' : pong,
	'/matches/ai' : pong,
	'/matches/local' : pong,
	'/tournaments' : tournament,
}

function handleRoute() {
	const path = window.location.pathname;
	const view = routes[path];

	const container = document.querySelector('#page-content');
	if (container) {
		container.innerHTML = ''
		container.appendChild(view());
		if (path === '/matches/player')
			socket.emit('joinGame', 'Message from client for cookie test')

	}
}

export function initRouter() {
  window.addEventListener('popstate', handleRoute);

  document.body.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-link]');
    if (target instanceof HTMLAnchorElement) {
      e.preventDefault();
      history.pushState(null, '', target.getAttribute('href'));
      handleRoute();
    }
  });

  // Initial load
  handleRoute();
}