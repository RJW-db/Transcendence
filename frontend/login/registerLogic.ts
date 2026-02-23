import { totpSetup, validateEmail } from "../src/authentication/TOTP-app";
import { fetchWithJWTRefresh } from './fetchWithJWTRefresh';


export async function registerUser(container: HTMLDivElement, secret: string, token: string ) {
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

async function sendRegisterRequest(Alias: string, Email: string, Password: string): Promise<Response> {
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

    const response = await sendRegisterRequest(alias, email, password);

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
    await totpSetup(container, alias, checkResult.secret);
}
