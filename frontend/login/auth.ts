import { register } from "node:module";
import { totpSetup } from "../src/authentication/TOTP-app";
import oauthverifyPageHtml from '../html/oauthVerifyPage.html?raw'
import {sendTotpRequest} from '../login/loginLogic'

export function oauthSignIn() {
  // Google's OAuth 2.0 endpoint for requesting an access token
  var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  // Parameters to pass to OAuth 2.0 endpoint.
  var params = {client_id: '1017664873801-raklnn8mib38hhaqjar66bm45fonuov6.apps.googleusercontent.com',
                redirect_uri: 'https://nondeprecatory-hyperexcursively-laverna.ngrok-free.dev/callback/google',
                response_type: 'token',
                scope: 'openid email profile'};

  const urlParams = new URLSearchParams(params);
  console.log("URL Params:", urlParams.toString());
  const fullUrl = oauth2Endpoint + '?' + urlParams.toString();
  console.log("Opening OAuth URL:", fullUrl);
  window.location.href = fullUrl;
}


export async function handleOAuthCallback() {
  const params = await new URLSearchParams(window.location.hash.substring(1));

  if (await checkErrorResponse(params)) {
    return;
  }

  // Extract token and other parameters
  const accessToken = await params.get('access_token') as string;
  console.log("Access Token received:", accessToken);
  if (!accessToken) {
    console.error('No access token found in URL parameters');
    alert('Authentication failed: No token received');
    window.location.href = '/login';
    return;
  }

  // console.log("Access token extracted, checking account existence");
  const response = await sendOauthAccountExistCheck(accessToken);


  if (!response.ok) { // Check if the request was successful (status code 2xx)]
    alert('Authentication failed after sendaccountexistCheck: ' + response.statusText);
    window.location.href = '/login';
    return;
  }


  const container: HTMLDivElement = document.createElement('div');
  container.className = '';

  const result = await response.json();
  if (!result.secret)
  {
    await show2FaPage(container);
    console.log("trying to load 2FA page for existing user");
  }
  else
    await totpSetup(container, result.email, result.secret);


  return container;
}

async function show2FaPage(container: HTMLDivElement) {
  container.innerHTML = await oauthverifyPageHtml;
    const form = container.querySelector('form');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const token = formData.get('token') as string;
    const response = await sendTotpRequest(token);
    const result = await response.json();
    if (response.ok) {
      // window.close();
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userAlias", result.user.alias);
      localStorage.setItem("userId", result.user.userID);
      localStorage.setItem("guestUser", "false");
      window.location.href = '/';
      return;
    }
    if (!response.ok) {
      const errorBox = appRoot.querySelector('#verifyError');
      errorBox!.textContent = `Error: ${result.message}`;
    }
  }
  );
}

async function checkErrorResponse(params: URLSearchParams): Promise<boolean> {
    // Check for errors first
  const error = params.get('error');
  if (error) {
    const errorDescription = params.get('error_description');
    console.error('OAuth Error:', error);
    console.error('Error Description:', errorDescription);
    alert(`Authentication failed: ${errorDescription || error}`);
    // Redirect back to login or home
    window.location.href = '/login';
    return true;
  }
  return false;
}


async function sendOauthAccountExistCheck(accessToken: string): Promise<Response> {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'oauthToken',
      Payload: {
        Token: accessToken
      }
    }),
  });
  return response;
}

async function oauthLogin() {
  appRoot.innerHTML = oauthverifyPageHtml;
  const form = appRoot.querySelector('form');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const token = formData.get('token') as string;
    const response = await sendLoginRequest(token);
    const result = await response.json();
    if (response.ok) {
      // window.close();
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userAlias", result.user.alias);
      localStorage.setItem("userId", result.user.userID);
      localStorage.setItem("guestUser", "false");
      window.location.href = '/';
      return;
    }
    if (!response.ok) {
      const errorBox = appRoot.querySelector('#verifyError');
      errorBox!.textContent = `Error: ${result.message}`;
    }
  }
  );
}

export async function createOauthUser(secret: string, loginToken: string)
{
  const response = await fetch('/api', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				type: 'oauthRegister',
				Payload: {
					Token: accessToken,
          Secret2FA : secret,
          loginToken : loginToken
				} 
			}),
    	});
    const result = await response.json();
    if (!response.ok) {
      console.log('OAuth Register failed:', result.message);
      const errorBox = appRoot.querySelector('#registerError');
      errorBox!.textContent = `Error: ${result.message}`;
      return;
    }
    else
    {
      console.log("OAuth user created successfully");
      alert("OAuth user created successfully");
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userAlias", result.user.alias);
      localStorage.setItem("userId", result.user.userID);
      localStorage.setItem("guestUser", "false");
      window.location.href = '/';
    }

}

// // Call this when the callback page loads - wrap in setTimeout to ensure ws is initialized
// if (window.location.pathname.includes('/callback/google')) {
//   // Wait for both DOM and modules to load
//     handleOAuthCallback();
// }

