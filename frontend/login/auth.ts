// import { ws } from '../main';

import { totpSetup } from "../src/authentication/TOTP-app";

export function oauthSignIn() {
  // Google's OAuth 2.0 endpoint for requesting an access token
  var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  // Create <form> element to submit parameters to OAuth 2.0 endpoint.
  var form = document.createElement('form');
  form.setAttribute('method', 'GET'); // Send as a GET request.
  form.setAttribute('action', oauth2Endpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  var params = {client_id: '1017664873801-raklnn8mib38hhaqjar66bm45fonuov6.apps.googleusercontent.com',
                redirect_uri: 'https://nondeprecatory-hyperexcursively-laverna.ngrok-free.dev/callback/google',
                response_type: 'token',
                scope: 'openid email profile'};

  // Add form parameters as hidden input values.
  for (var p in params) {
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }
  // Print everything in the form for debugging
  // Build and print the full OAuth URL for debugging
  const urlParams = new URLSearchParams(params);
  const fullUrl = oauth2Endpoint + '?' + urlParams.toString();
  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  window.open(fullUrl);
}

let accessToken = "";

async function handleOAuthCallback() {
  // Check if we're on the callback page
  if (!window.location.pathname.includes('/callback/google')) {
    console.error('not on OAuth callback page: ', window.location.pathname);
    window.history.replaceState({}, document.title, '/callback/google');
    return;
  }

  const params = await new URLSearchParams(window.location.hash.substring(1));

  // Check for errors first
  const error = params.get('error');
  if (error) {
    const errorDescription = params.get('error_description');
    console.error('OAuth Error:', error);
    console.error('Error Description:', errorDescription);    
    // Redirect back to login or home
    window.location.href = '/';
    return;
  }

  // Extract token and other parameters
  accessToken = await params.get('access_token') as string;
  const tokenType = params.get('token_type');
  const expiresIn = params.get('expires_in');
  const scope = params.get('scope');

  if (accessToken) {
    console.log('Access Token:', accessToken);
    console.log('Token Type:', tokenType);
    console.log('Expires In:', expiresIn, 'seconds');
    console.log('Scope:', scope);
    
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
    if (!response.ok) { // Check if the request was successful (status code 2xx)
      alert('Authentication failed: ' + response.statusText);
      window.location.hash = '#login';
      return;
    }
    const result = await response.json();
    if (result.secret2FA)
    {
      const secret = result.secret2FA;
      console.log("got secret from server:", secret);
      await totpSetup(result.email, true, secret);
    }
  } else {
    if (result.oauthAccount) {
      console.log('OAuth account exists, proceeding to app');
      
    }
    console.error('No access token received');
    alert('Authentication failed: No token received');
    window.location.href = '/';
  }
  // window.close();
}

export async function createOauthUser(secret: string)
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
          Secret2FA : secret
				} 
			}),
    	});
    if (!response.ok) { // Check if the request was successful (status code 2xx)
      alert('Authentication failed: ' + response.statusText);
      window.location.hash = '#login';
      return;
    }
    else
      console.log("OAuth user created successfully");

}

// Call this when the callback page loads - wrap in setTimeout to ensure ws is initialized
if (window.location.pathname.includes('/callback/google')) {
  // Wait for both DOM and modules to load
    handleOAuthCallback();
}

