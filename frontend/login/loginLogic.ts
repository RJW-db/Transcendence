import { appRoot, showHomePage } from "../main";
import loginPageHtml from '../html/loginPage.html?raw';
import guestLoginHtml from '../html/guestLogin.html?raw';
import { oauthSignIn } from "./auth";
import { fetchWithJWTRefresh } from './fetchWithJWTRefresh';

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

    const response = await sendLoginRequest(email, password);
    const result = await response.json();
    if (!response.ok) {
      console.log('login failed:', result.message);
      errorBox!.textContent = `Error: ${result.message}`;
      return;
    }

    // Now send 2FA token with the temporary token
    const totpResponse = await sendTotpRequest(token2fa, result.tmpToken);
    const totpResult = await totpResponse.json();
    if (!totpResponse.ok) {
      console.log('2FA verification failed:', totpResult.message);
      errorBox!.textContent = `Error: ${totpResult.message}`;
      return;
    }

    localStorage.setItem("userEmail", totpResult.user.email);
    localStorage.setItem("userAlias", totpResult.user.alias);
    localStorage.setItem("userId", totpResult.user.userID);
    localStorage.setItem("guestUser", "false");
    window.location.hash = '';
  });
}

// Update sendLoginRequest to not include token2fa
async function sendLoginRequest(email: string, password: string): Promise<Response> {
  const response = await fetchWithJWTRefresh('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'loginUser',
      Payload: {
        Email: email,
        Password: password
      }
    }),
  });
  return response;
}

// Add new function to send TOTP verification
async function sendTotpRequest(token2fa: string, tempToken: string): Promise<Response> {
  const response = await fetchWithJWTRefresh('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'verifyTotp',
      Payload: {
        Token2fa: token2fa,
        tempToken: tempToken
      }
    }),
  });
  return response;
}

async function userLoggedIn(): Promise<boolean> {
  const response = await fetchWithJWTRefresh('/api?type=getUserInfo', {
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
    const response = await fetchWithJWTRefresh('/api', {
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