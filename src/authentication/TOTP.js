// node src/authentication/TOTP.js
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
console.log('otplib', authenticator);
console.log('qrcode', QRCode);
authenticator.options = {
  step: 30,        // Time step in seconds
  window: 1,       // Allow 1 step before/after for clock drift
  digits: 6,       // 6-digit codes
  algorithm: 'sha1'
};

// 1. Generate a secret for a new user
function generateSecret() {
  const secret = authenticator.generateSecret();
  return secret;
}

// 2. Generate QR code URL for authenticator apps (Google Authenticator, Authy, etc.)
function generateQRCodeURL(username, secret) {
  const serviceName = 'Transcendence'; // Your app name
  const otpauth = authenticator.keyuri(username, serviceName, secret);
  return otpauth;
}

// 3. Generate QR code image
async function generateQRCodeImage(username, secret) {
  const otpauth = generateQRCodeURL(username, secret);
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);
    return qrCodeDataURL;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

// 4. Verify user's token
function verifyToken(token, secret) {
  try {
    const isValid = authenticator.verify({ token, secret });
    return isValid;
  } catch (err) {
    console.error('Error verifying token:', err);
    return false;
  }
}

// Example usage for user registration
async function setupTwoFactorAuth(username) {
  // Generate secret
  const secret = generateSecret();
  
  // Generate QR code
  const qrCodeImage = await generateQRCodeImage(username, secret);
  
  console.log('Secret:', secret);
  console.log('QR Code:', qrCodeImage);
  
  // Store secret in database for this user
  // Return QR code to user to scan with authenticator app
  
  return { secret, qrCodeImage };
}

// Example usage for login verification
function verifyUserLogin(userToken, userSecret) {
  const isValid = verifyToken(userToken, userSecret);
  
  if (isValid) {
    console.log('✓ Token is valid - allow login');
  } else {
    console.log('✗ Token is invalid - deny login');
  }
  
  return isValid;
}

// // DOM Event Handlers - wrap in DOMContentLoaded
// window.addEventListener('DOMContentLoaded', () => {
//   let currentSecret = '';
//   let currentUsername = '';

//   document.getElementById('setup-btn').addEventListener('click', async () => {
//     const username = document.getElementById('username-input').value.trim();
    
//     if (!username) {
//       alert('Please enter your email');
//       return;
//     }

//     currentUsername = username;
//     const { secret, qrCodeImage } = await setupTwoFactorAuth(username);
//     currentSecret = secret;
    
//     const qrCodeDiv = document.getElementById('qr-code');
//     qrCodeDiv.innerHTML = `
//       <p><strong>Scan this QR code:</strong></p>
//       <img src="${qrCodeImage}" alt="QR Code" />
//     `;
//     qrCodeDiv.classList.remove('hidden');
    
//     document.getElementById('secret-text').textContent = secret;
//     document.getElementById('secret-display').classList.remove('hidden');
//     document.getElementById('verify-section').classList.remove('hidden');
//   });

//   document.getElementById('verify-btn').addEventListener('click', () => {
//     const token = document.getElementById('token-input').value.trim();
//     const messageDiv = document.getElementById('verify-message');
    
//     if (!token || token.length !== 6) {
//       messageDiv.innerHTML = '<div class="message error">Please enter a 6-digit code</div>';
//       return;
//     }
    
//     const isValid = verifyUserLogin(token, currentSecret);
    
//     if (isValid) {
//       messageDiv.innerHTML = '<div class="message success">✓ Token is valid!</div>';
//     } else {
//       messageDiv.innerHTML = '<div class="message error">✗ Invalid token</div>';
//     }
//   });

//   document.getElementById('username-input').addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') document.getElementById('setup-btn').click();
//   });

//   document.getElementById('token-input').addEventListener('keypress', (e) => {
//     if (e.key === 'Enter') document.getElementById('verify-btn').click();
//   });
// });

// Test it
const testUser = 'user@example.com';
setupTwoFactorAuth(testUser).then(({ secret, qrCodeImage }) => {
  console.log('Setup complete. User should scan QR code.');
  
  // Simulate user entering code from authenticator app
  const userEnteredToken = authenticator.generate(secret);
  console.log('User entered token:', userEnteredToken);
  
  // Verify it
  verifyUserLogin(userEnteredToken, secret);
});