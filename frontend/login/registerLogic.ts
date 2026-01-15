import { appRoot, showHomePage} from "../main";
import registerPageHtml from '../html/registerPage.html?raw';
import { totpSetup, totpVerify, validateEmail } from "../src/authentication/TOTP-app";
import { verifyToken } from "../src/authentication/TOTP";
import { error } from "node:console";

  let Alias = '';
  let email = '';
  let Password = '';

export async function showRegisterPage() {
  appRoot.innerHTML = registerPageHtml;



  // document.getElementById('setup-btn')?.addEventListener('click', async () => {
  //   totpSetup();
  // });

  // document.getElementById('verify-btn')?.addEventListener('click', async () => {
  //   totpVerify();
  // });

  const form = appRoot.querySelector('form');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form as HTMLFormElement);
    email = data.get('email') as string;
    if (!validateEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    Alias = data.get("alias") as string;
    Password = data.get('password') as string;
    const errorBox = appRoot.querySelector('#registerError');
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'checkAccountExists',
        Payload: {
          Alias: Alias,
          Email: email,
        }
      }),
    });
    const result = await response.json();
        if (!response.ok) { // Check if the request was successful (status code 2xx)
      console.log('Register failed:', result.message);
      errorBox!.textContent = `Error: ${result.message}`;
      return;
    }
    else
      console.log('Register successful:', result.message);
    const secret = await totpSetup(email, false);
  }
  );
} 

export async function registerUser(secret :string ) {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'registerUser',
        Payload: {
          Alias: Alias,
          Email: email,
          Password: Password,
          Secret: secret
        }
      }),
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    window.location.hash = '';
}

document.getElementById('verify-btn')?.addEventListener('click', async () => {
  console.log("verify button clicked")
      }
    );