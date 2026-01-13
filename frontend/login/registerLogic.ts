import { appRoot, showHomePage} from "../main";
import registerPageHtml from '../html/registerPage.html?raw';
import totp from '../html/TOTP.html?raw'
import { totpSetup, totpVerify } from "../src/authentication/TOTP-app";

export async function showRegisterPage() {
  appRoot.innerHTML = totp;


  document.getElementById('setup-btn')?.addEventListener('click', async () => {
    totpSetup();
  });

  document.getElementById('verify-btn')?.addEventListener('click', async () => {
    totpVerify();
  });

  // const form = appRoot.querySelector('form');
  // const errorBox = appRoot.querySelector('#registerError');

  // form?.addEventListener('submit', async (event) => {
  //   event.preventDefault();
  //   const data = new FormData(form as HTMLFormElement);
  //         const response = await fetch('/api', {
	// 		method: 'POST',
	// 		headers: {
	// 		'Content-Type': 'application/json',
	// 		},
	// 		body: JSON.stringify({ 
	// 			type: 'registerUser',
	// 			Payload: {
	// 				Alias: data.get('alias'),
	// 				Email: data.get('email'),
	// 				Password: data.get('password')
	// 			} 
	// 		}),
  //   	});
  //   const result = await response.json();

  //   if (!response.ok) { // Check if the request was successful (status code 2xx)
  //     console.log('Register failed:', result.message);
  //     errorBox && (errorBox.textContent = result.message ?? 'Registration failed.');
  //     return;
  //   }
  //   else
  //     console.log('Register successful:', result.message);
  //   window.location.hash = '';
  // }
  // );
} 