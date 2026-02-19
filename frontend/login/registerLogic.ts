// import { appRoot, showHomePage} from "../main";
import registerPageHtml from '../html/registerPage.html?raw';
import { totpSetup, validateEmail } from "../src/authentication/TOTP-app";
import { verifyToken } from "../src/authentication/TOTP";
import { error } from "node:console";
import { read } from "node:fs";
import { fetchWithJWTRefresh } from './fetchWithJWTRefresh';


let Alias = '';
let Email = '';
let Password = '';

export async function registerUser(container: HTMLDivElement, secret: string, token: string ) {


    // Step 2: verify TOTP with temp token
    const totpResponse = await sendRegisterTotpRequest(token);
    const totpResult = await totpResponse.json();
    if (!totpResponse.ok) {
      const errorBox = container.querySelector('#registerError');
      errorBox!.textContent = `Error: ${totpResult.message}`;
      console.log("error verifying 2FA:", totpResult.message);
      return;
    }

    localStorage.setItem("userEmail", totpResult.user.email);
    localStorage.setItem("userAlias", totpResult.user.alias);
    localStorage.setItem("userId", totpResult.user.userID);
    alert("Registration successful! Redirecting to home page.");
    window.location.href = '/';
}

async function sendRegisterRequest(): Promise<Response> {
  const response = await fetchWithJWTRefresh('/api', {
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
      }
    }),
  });
  return response;
}

async function sendRegisterTotpRequest(token: string): Promise<Response> {
  const response = await fetchWithJWTRefresh('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'registerTotp',
      Payload: {
        VerifyToken: token,
      }
    }),
  });
  return response;
}

export async function registerNewUser(container : HTMLDivElement) : Promise<void> {
      const errorBox = container.querySelector('#registerError') as HTMLElement | null;
      const form = container.querySelector('form') as HTMLFormElement | null;
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

    const response = await sendRegisterRequest();

    // const checkRes = await fetchWithJWTRefresh('/api', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: 'checkAccountExists',
    //     Payload: { Alias: alias, Email: email },
    //   }),
    // });

    const checkResult = await response.json();
    if (!response.ok) {
      errorBox!.textContent = checkResult.message ? `Error: ${checkResult.message}`: 'Error registering account';
      console.log("Error registering account:", checkResult.message);
      return;
    }
    else
    {
      console.log("Account registration successful, proceeding to TOTP setup");
    }
    await totpSetup(container, alias, false, checkResult.secret);
}

// export async function showRegisterPage(): Promise<void> {
//   appRoot.innerHTML = registerPageHtml;

//   const form = appRoot.querySelector('form') as HTMLFormElement | null;
//   const errorBox = appRoot.querySelector('#registerError') as HTMLElement | null;

//   form?.addEventListener('submit', async (e: Event) => {
//     e.preventDefault();

//     const formData = new FormData(form);
//     const alias = String(formData.get('alias') ?? '').trim();
//     const email = String(formData.get('email') ?? '').trim();
//     const password = String(formData.get('password') ?? '').trim();

//     if (!alias || !email || !password) {
//       errorBox!.textContent = 'Error: Please fill in all fields.';
//       return;
//     }
//     if (!validateEmail(email)) {
//       errorBox!.textContent = 'Error: Invalid email address.';
//       return;
//     }

//     // These are used by sendRegisterRequest()
//     Alias = alias;
//     Email = email;
//     Password = password;

//     const response = await sendRegisterRequest();

//     // const checkRes = await fetchWithJWTRefresh('/api', {
//     //   method: 'POST',
//     //   headers: { 'Content-Type': 'application/json' },
//     //   body: JSON.stringify({
//     //     type: 'checkAccountExists',
//     //     Payload: { Alias: alias, Email: email },
//     //   }),
//     // });

//     const checkResult = await response.json();
//     if (!response.ok) {
//       errorBox!.textContent = checkResult.message ? `Error: ${checkResult.message}`: 'Error registering account';
//       return;
//     }

//     // Move to TOTP setup page
//     // await totpSetup(alias, false, checkResult.secret);
//   });
// }