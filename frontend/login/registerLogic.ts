import { appRoot, showHomePage} from "../main";
import registerPageHtml from '../html/registerPage.html?raw';
import { totpSetup, validateEmail } from "../src/authentication/TOTP-app";
import { verifyToken } from "../src/authentication/TOTP";
import { error } from "node:console";
import { read } from "node:fs";

  let Alias = '';
  let Email = '';
  let Password = '';

export async function showRegisterPage() {
  appRoot.innerHTML = registerPageHtml;
    const form = appRoot.querySelector('form');
    const errorBox = appRoot.querySelector('#registerError');



  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    readRegisterForm(form);
    if (!validateEmail(Email)) {
      errorBox!.textContent = 'Please enter a valid email address';
      return;
    }
    const response = await sendAccountExistCheck();
    const result = await response.json();
    if (!response.ok) { // Check if the request was successful (status code 2xx)
      console.log('Register failed:', result.message);
      errorBox!.textContent = `Cannot register: ${result.message}`;
      return;
    }
    await totpSetup(Email, false, result.secret);
  }
  );
}

function readRegisterForm(form: HTMLFormElement) {
    const data = new FormData(form as HTMLFormElement);
    Email = data.get('email') as string;
    Alias = data.get("alias") as string;
    Password = data.get('password') as string;
} 

async function sendAccountExistCheck():Promise < Response > {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'checkAccountExists',
      Payload: {
        Alias: Alias,
        Email: Email,
      }
    }),
  });
  return response;
}
export async function registerUser(secret: string, token: string ) {
    const response = await sendRegisterRequest(secret, token );
    const result = await response.json();
    if (!response.ok) {
      const errorBox = document.getElementById('registerError');
      errorBox!.textContent = `Error: ${result.message}`;
      console.log("error registering:", result.message);
      return ;
    }
    localStorage.setItem("userEmail", result.user.email);
    localStorage.setItem("userAlias", result.user.alias);
    localStorage.setItem("userId", result.user.userID);
    alert( "Registration successful! Redirecting to home page." );
    window.location.hash = '';
}

async function sendRegisterRequest(secret: string, token: string ):Promise < Response > {
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
          Secret: secret,
          VerifyToken: token
        }
      }),
    });
    return response;
}