import { generateQRCodeImage, verifyToken } from './TOTP';
import totpHtml from '../../html/TOTP.html?raw'
import registerTokenHtml from '../../html/RegisterToken.html?raw'

import { appRoot } from '../../main';
import { registerUser } from '../../login/registerLogic';
import { createOauthUser } from '../../login/auth';



let currentSecret: string = '';

export function validateEmail(email: string): boolean {
  // console.log("valid email");
  if (!email || email.length > 254) return false;
  
  // Split and check parts
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [local, domain] = parts;
  if (local.length === 0 || local.length > 64) return false;
  if (domain.length === 0 || domain.length > 255) return false;
  
  // Simple pattern matching
  const simpleRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return simpleRegex.test(email);
}

export async function totpSetup(username: string, oauth: boolean, secret: string): Promise<string> {
  appRoot.innerHTML = await registerTokenHtml;
  // const usernameInput = document.getElementById('username-input') as HTMLInputElement;
  // const username = usernameInput.value.trim();

  try {
    const qrCodeImage = await generateQRCodeImage(username, secret);
    currentSecret = secret;
    console.log('Setup complete, secret generated');
    console.log("Secret:", secret);
    const qrCodeDiv = document.getElementById('qr-code');
    if (qrCodeDiv) {
      qrCodeDiv.innerHTML = `
        <p><strong>Scan this QR code:</strong></p>
        <img src="${qrCodeImage}" alt="QR Code" />
      `;
    }

    const secretText = document.getElementById('secret-text');
    if (secretText) {
      secretText.textContent = secret;
    }


    document.getElementById('verify-btn')?.addEventListener('click', async(event) => {
      event.preventDefault();
      const tokenInput = document.getElementById('token-input') as HTMLInputElement;

      const token = tokenInput.value.trim();
      console.log("verify button clicked")
      if (oauth)
        createOauthUser(currentSecret, token);
      else
        await registerUser(currentSecret, token);
    }
    );

    return secret;
  } catch (err) {
    console.error('Error during setup:', err);
    alert('Error generating QR code. Check console.');
    return '';
  }

}


// export async function totpVerify() : Promise<boolean> {
//   const tokenInput = document.getElementById('token-input') as HTMLInputElement;
//   const token = tokenInput.value.trim();
//   const messageDiv = document.getElementById('verify-message');
  
//   if (!token || token.length !== 6) {
//     if (messageDiv) {
//       messageDiv.innerHTML = '<div class="message error">Please enter a 6-digit code</div>';
//       return false;
//     }
//   }

//   const isValid = await verifyToken(token, currentSecret);
//   console.log('Verification result:', isValid);

//   if (messageDiv) {
//     if (isValid) {
//       messageDiv.innerHTML = '<div class="message success">✓ Token is valid!</div>';
//       // document.getElementById('registeredMessage')?.classList.remove('hidden');
//     } else {
//       messageDiv.innerHTML = '<div class="message error">✗ Invalid token</div>';
//     }
//   }
//   if (isValid)
//     return true;
//   else
//     return false;
// }