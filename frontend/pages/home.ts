import { socket } from '../services/socket'

export function home() {
	const home = document.createElement('home');

	home.innerHTML = ''
	return home
}