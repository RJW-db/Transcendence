import { appRoot, showHomePage } from "../main";
import loginPageHtml from '../html/loginPage.html?raw';
import guestLoginHtml from '../html/guestLogin.html?raw';
import { oauthSignIn } from "./auth";
import { get } from "node:http";
import { resourceLimits } from "node:worker_threads";


export async function showLoginPage(): Promise<void> {
  appRoot.innerHTML = loginPageHtml;

  const form = appRoot.querySelector('form');
  const googleBtn = appRoot.querySelector('#loginWithGoogle');

  const errorBox = appRoot.querySelector('#loginError');

  // Add event listener for the alert link
  const guestLogin = appRoot.querySelector('#guestLogin');
  guestLogin?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    loginGuestUser();
    return true;
  });

  googleBtn?.addEventListener('click', async (e: Event) => {
    e.preventDefault();
    oauthSignIn();
  });

  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(form);
    const { email, password, token2fa } = getLoginFormData(form as HTMLFormElement);

    const response = await sendLoginRequest(email, password, token2fa);
    const result = await response.json();
    if (!response.ok) {
      console.log('login failed:', result.message);
      errorBox!.textContent = `Error: ${result.message}`;
      return;
    }
    localStorage.setItem("userEmail", result.user.email);
    localStorage.setItem("userAlias", result.user.alias);
    localStorage.setItem("userId", result.user.userID);
    localStorage.setItem("guestUser", "false");
    window.location.hash = '';
  }
  );

}

function getLoginFormData(form: HTMLFormElement): { email: string; password: string; token2fa: string } {
  const data = new FormData(form);
  return {
    email: data.get('email') as string,
    password: data.get('password') as string,
    token2fa: data.get('2faToken') as string,
  };
}

async function sendLoginRequest(email: string, password: string, token2fa: string): Promise<Response> {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'loginUser',
      Payload: {
        Email: email,
        Password: password,
        Token2fa: token2fa
      }
    }),
  }
  );
  return response;
}

async function userLoggedIn(): Promise<boolean> {
  const response = await fetch('/api?type=getUserInfo', {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    return false;
  }
  return true;
}

async function loginGuestUser() {
  appRoot.innerHTML = guestLoginHtml;
  
  
  const form : HTMLFormElement = appRoot.querySelector('form');
  const errorBox = appRoot.querySelector('#guestLoginError');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const alias = data.get('alias') as string;
    console.log('Creating guest account with alias:', alias);
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'createGuestAccount',
        Payload: {
          Alias: alias
        }
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.log('login failed:', result.message);
      errorBox!.textContent = `Error: ${result.message}`;
      setTimeout(() => {
        errorBox!.textContent = '';
      }, 2000);
      return;
    }
    else {
      console.log('Guest account created successfully:', result.message);
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userAlias", result.user.alias);
      localStorage.setItem("userId", result.user.userID);
      localStorage.setItem("guestUser", "true");
      window.location.hash = '';
    }
  });
  
}