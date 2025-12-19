export let ws: WebSocket;

import './html/style.css';
import homePageHtml from './html/homePage.html?raw';
import { oauthSignIn } from "./login/auth";
import { showRegisterPage } from "./login/registerLogic";
import { showLoginPage } from "./login/loginLogic";
import { showUserInfoPage } from "./login/userInfoPage";
import { showLogoutPage } from "./login/logout";

// // Initialize WebSocket
// function initWebSocket() {
//   ws = new WebSocket('ws://localhost:8080/ws');

//   ws.onopen = () => {
//     console.log('Connected');
//   };

//   ws.onmessage = (event) => {
//     console.log('Received:', event.data);
//   };

//   ws.onerror = (error) => {
//     console.error('WebSocket error:', error);
//   };

//   ws.onclose = () => {
//     console.log('Disconnected from server');
//   };
// }

// Start WebSocket connection
// initWebSocket();

export const appRoot = document.getElementById('app') as HTMLElement;

// Hash-based navigation
window.addEventListener('hashchange', handleHashChange);
handleHashChange();

function setHash(hash: string) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    handleHashChange();
  }
}

async function handleHashChange() {
  switch (window.location.hash) {
    case '#login':
      await showLoginPage();
      break;
    case '#register':
      await showRegisterPage();
      break;
    case '#userinfo':
      await showUserInfoPage();
      break;
    case '#logout':
      await showLogoutPage();
      break;
    default:
      await showHomePage();
      break;
  }
}

export async function showHomePage() {
  appRoot.innerHTML = homePageHtml;
  console.log("loading homepage")

  document.getElementById('registerButton')?.addEventListener('click', async () => {
    setHash('#register');
  });

  document.getElementById('loginButton')?.addEventListener('click', async () => {
    setHash('#login');
  });

  document.getElementById('oauthButton')?.addEventListener('click', async () => {
    console.log('OAuth button clicked');
    await oauthSignIn();
  });

  document.getElementById('showUserInfoButton')?.addEventListener('click', async () => {
    setHash('#userinfo');
  });

  document.getElementById('logoutButton')?.addEventListener('click', async () => {
    setHash('#logout');
  });
}

