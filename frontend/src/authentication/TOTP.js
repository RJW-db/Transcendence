// node src/authentication/TOTP.js
import QRCode from 'qrcode';

console.log('qrcode', QRCode);

// Browser-compatible secret generation
function generateSecret() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 charset
  const secretLength = 32;
  let secret = '';
  const randomValues = new Uint8Array(secretLength);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < secretLength; i++) {
    secret += charset[randomValues[i] % charset.length];
  }
  return secret;
}

function generateQRCodeURL(username, secret) {
  const serviceName = 'Transcendence';
  const issuer = encodeURIComponent(serviceName);
  const user = encodeURIComponent(username);
  return `otpauth://totp/${issuer}:${user}?secret=${secret}&issuer=${issuer}`;
}

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

function verifyToken(token, secret) {
  try {
    // Simple validation for now
    // In production, you'd implement proper TOTP HMAC-SHA1 verification
    console.log('Verifying token:', token);
    console.log('Note: This is simplified verification for testing');
    
    // Basic check: token should be 6 digits
    return token.length === 6 && /^\d+$/.test(token);
  } catch (err) {
    console.error('Error verifying token:', err);
    return false;
  }
}

async function setupTwoFactorAuth(username) {
  const secret = generateSecret();
  const qrCodeImage = await generateQRCodeImage(username, secret);
  
  console.log('Secret:', secret);
  console.log('QR Code generated');
  
  return { secret, qrCodeImage };
}

export {
  generateSecret,
  generateQRCodeURL,
  generateQRCodeImage,
  verifyToken,
  setupTwoFactorAuth
};
