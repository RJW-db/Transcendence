import { appRoot, showHomePage} from "../main";
import registerPageHtml from '../html/registerPage.html?raw';
import { totpSetup, validateEmail } from "../src/authentication/TOTP-app";
import { verifyToken } from "../src/authentication/TOTP";
import { error } from "node:console";
import { read } from "node:fs";
import { fetchWithJWTRefresh } from './fetchWithJWTRefresh';


let Alias = '';
let Email = '';
let Password = '';

export async function registerUser(secret: string, token: string ) {
    const response = await sendRegisterRequest(secret);
    const result = await response.json();
    if (!response.ok) {
      const errorBox = document.getElementById('registerError');
      errorBox!.textContent = `Error: ${result.message}`;
      console.log("error registering:", result.message);
      return;
    }

    // Step 2: verify TOTP with temp token
    const totpResponse = await sendRegisterTotpRequest(token, result.tmpToken);
    const totpResult = await totpResponse.json();
    if (!totpResponse.ok) {
      const errorBox = document.getElementById('registerError');
      errorBox!.textContent = `Error: ${totpResult.message}`;
      console.log("error verifying 2FA:", totpResult.message);
      return;
    }

    localStorage.setItem("userEmail", totpResult.user.email);
    localStorage.setItem("userAlias", totpResult.user.alias);
    localStorage.setItem("userId", totpResult.user.userID);
    alert("Registration successful! Redirecting to home page.");
    window.location.hash = '';
}

async function sendRegisterRequest(secret: string): Promise<Response> {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'registerUser',
      Payload: {
        Alias: Alias,
        Email: Email,
        Password: Password,
        Secret: secret
      }
    }),
  });
  return response;
}

async function sendRegisterTotpRequest(token: string, tempToken: string): Promise<Response> {
  const response = await fetchWithJWTRefresh('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'registerTotp',
      Payload: {
        VerifyToken: token,
        tempToken: tempToken
      }
    }),
  });
  return response;
}


export async function showRegisterPage(): Promise<void> {
  appRoot.innerHTML = registerPageHtml;

  const form = appRoot.querySelector('form') as HTMLFormElement | null;
  const errorBox = appRoot.querySelector('#registerError') as HTMLElement | null;

  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const formData = new FormData(form);
    const alias = String(formData.get('alias') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    if (!alias || !email || !password) {
      errorBox!.textContent = 'Error: Please fill in all fields.';
      return;
    }
    if (!validateEmail(email)) {
      errorBox!.textContent = 'Error: Invalid email address.';
      return;
    }

    // These are used by sendRegisterRequest()
    Alias = alias;
    Email = email;
    Password = password;

    const checkRes = await fetchWithJWTRefresh('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'checkAccountExists',
        Payload: { Alias: alias, Email: email },
      }),
    });

    const checkResult = await checkRes.json();
    if (!checkRes.ok) {
      errorBox!.textContent = `Error: ${checkResult.message}`;
      return;
    }

    // Move to TOTP setup page
    await totpSetup(alias, false, checkResult.secret);
  });
}