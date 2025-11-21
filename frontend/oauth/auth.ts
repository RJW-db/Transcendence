import { ws } from '../main';

function oauthSignIn() {
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
  console.log('Full OAuth URL:', fullUrl);
  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
}


async function handleOAuthCallback() {
  // Check if we're on the callback page
  if (!window.location.pathname.includes('/callback/google')) {
    console.error('not on OAuth callback page: ', window.location.pathname);
    window.history.replaceState({}, document.title, '/callback/google');
    return;
  }

  // console.log(window.location.hash);
  // // Parse the hash fragment (everything after #)
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
  const accessToken = await params.get('access_token');
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
				type: 'oauthLogin',
				Payload: {
					Token: accessToken
				} 
			}),
    	});
    if (!response.ok) { // Check if the request was successful (status code 2xx)
      alert('Authentication failed: ' + response.statusText);
      window.location.href = '/';
      return;
    }
    console.log('OAuth login successful:', await response.json());
    window.history.replaceState({}, document.title, '/');
  } else {
    console.error('No access token received');
    alert('Authentication failed: No token received');
    window.location.href = '/';
  }
}
// Call this when the callback page loads - wrap in setTimeout to ensure ws is initialized
if (window.location.pathname.includes('/callback/google')) {
  // Wait for both DOM and modules to load
  setTimeout(() => {
    handleOAuthCallback();
  }, 100);
}

export { oauthSignIn };
// const clientId = '1017664873801-raklnn8mib38hhaqjar66bm45fonuov6.apps.googleusercontent.com';


// function loadGoogleIdentityServices(callback) {
//   const script = document.createElement('script');
//   script.src = 'https://accounts.google.com/gsi/client';
//   script.async = true;
//   script.defer = true;
//   script.onload = callback;
//   document.head.appendChild(script);
// }

// function initGoogleOAuth() {
//   const tokenClient = google.accounts.oauth2.initTokenClient({
//     client_id: clientId,
//     scope: 'profile email',
//     callback: (tokenResponse) => {
//       if (tokenResponse.access_token) {
//         console.log('Access Token:', tokenResponse.access_token);
//       }
//     },
//   });

//   // Request token immediately after initialization
//   tokenClient.requestAccessToken();
// }

// function handleOAuthCallback() {
//   console.log(window.location.search);
//     const urlParams = new URLSearchParams(window.location.search);

//   const code = urlParams.get('code');

//   if (code) {
//     console.log('OAuth code received:', code);
    
//     // Send code to backend or process it
//     // ... your code here ...

//     // Clean up the URL - remove the query parameters
//     window.history.replaceState({}, document.title, '/');
//   }
// }

// // Call this when the page loads
// handleOAuthCallback();

// export { loadGoogleIdentityServices, initGoogleOAuth };