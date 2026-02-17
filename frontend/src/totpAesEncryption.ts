import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY; // 32 bytes hex string
const ALGORITHM = 'aes-256-gcm';

export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv + authTag + encrypted (all hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

export function decryptSecret(encryptedData: string): string {
  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
  const authTag = Buffer.from(encryptedData.slice(32, 64), 'hex');
  const encrypted = encryptedData.slice(64);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}