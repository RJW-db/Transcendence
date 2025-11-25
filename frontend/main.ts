export let ws: WebSocket;

import { oauthSignIn } from "./login/auth";
import { showRegisterPage } from "./login/registerLogic";

// Initialize WebSocket
function initWebSocket() {
  ws = new WebSocket('ws://localhost:8080/ws');

  ws.onopen = () => {
    console.log('Connected');
  };

  ws.onmessage = (event) => {
    console.log('Received:', event.data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
  };
}

// Start WebSocket connection
initWebSocket();
export const appRoot = document.getElementById('app') as HTMLElement;

showHomePage()

export async function showHomePage() {
  const res = await fetch('/html/homePage.html');
  appRoot.innerHTML = await res.text();
  console.log("loading homepage")

  document.getElementById('registerButton')?.addEventListener('click', async () => {
    console.log('Register button clicked');
    await showRegisterPage();
  });

  document.getElementById('loginButton')?.addEventListener('click', async () => {
    console.log('Login button clicked');
    await showLoginPage();
  });

  document.getElementById('oauthButton')?.addEventListener('click', async () => {
    console.log('OAuth button clicked');
    await oauthSignIn();
  });
}


async function showLoginPage() {
  const res = await fetch('/html/loginPage.html');
  appRoot.innerHTML = await res.text();
}

