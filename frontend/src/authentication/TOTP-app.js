import { setupTwoFactorAuth, verifyToken } from './TOTP.js';

let currentSecret = '';

document.getElementById('setup-btn').addEventListener('click', async () => {
  console.log('Button clicked');
  const username = document.getElementById('username-input').value.trim();
  
  if (!username) {
    alert('Please enter your email');
    return;
  }

  try {
    const { secret, qrCodeImage } = await setupTwoFactorAuth(username);
    currentSecret = secret;
    console.log('Setup complete, secret generated');
    
    const qrCodeDiv = document.getElementById('qr-code');
    qrCodeDiv.innerHTML = `
      <p><strong>Scan this QR code:</strong></p>
      <img src="${qrCodeImage}" alt="QR Code" />
    `;
    qrCodeDiv.classList.remove('hidden');
    
    document.getElementById('secret-text').textContent = secret;
    document.getElementById('secret-display').classList.remove('hidden');
    document.getElementById('verify-section').classList.remove('hidden');
  } catch (err) {
    console.error('Error during setup:', err);
    alert('Error generating QR code. Check console.');
  }
});

document.getElementById('verify-btn').addEventListener('click', () => {
  const token = document.getElementById('token-input').value.trim();
  const messageDiv = document.getElementById('verify-message');
  
  if (!token || token.length !== 6) {
    messageDiv.innerHTML = '<div class="message error">Please enter a 6-digit code</div>';
    return;
  }
  
  const isValid = verifyToken(token, currentSecret);
  console.log('Verification result:', isValid);
  
  if (isValid) {
    messageDiv.innerHTML = '<div class="message success">✓ Token is valid!</div>';
  } else {
    messageDiv.innerHTML = '<div class="message error">✗ Invalid token</div>';
  }
});
