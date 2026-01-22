import { randomUUID } from "crypto";
import {FastifyRequest, FastifyInstance, FastifyReply} from 'fastify';
import { PrismaClient } from '@prisma/client';


export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      return false;
    }

    const validToken = await generateTOTP(secret);
    console.log('Expected token:', validToken);
    console.log('Received token:', token);

    return token === validToken;
  } catch (err) {
    console.error('Error verifying token:', err);
    return false;
  }
}

// HMAC-SHA1
async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const key = base32Decode(secret);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(time), false);

  // Import key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}


function base32Decode(base32: string): Uint8Array {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (let char of base32.toUpperCase()) {
    const val = charset.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  return bytes;
}


// Browser-compatible secret generation
export function generateSecret(): string {
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
