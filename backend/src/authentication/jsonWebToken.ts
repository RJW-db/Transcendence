import crypto from 'crypto';
import { refreshUserToken } from './refreshToken';


export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('JWT_SECRET environment variable is required');
})();

export const TOKEN_TIMES = {
  REGISTRATION_TOKEN_MS: 90000, // 1.5 minutes for 2FA verification
  REGISTRATION_TOKEN_SECONDS: 90, // 1.5 minutes for 2FA verification
  SHORT_LIVED_TOKEN_MS: (parseInt(process.env.JWT_ACCESS_TOKEN_MINUTES ?? "15", 10)) * 60 * 1000,
  SHORT_LIVED_TOKEN_SECONDS: (parseInt(process.env.JWT_ACCESS_TOKEN_MINUTES ?? "15", 10)) * 60
};

interface JWTHeader {
  alg: string;
  typ: string;
}

export interface JWTPayload {
  sub: number;
  iat: number;
  exp: number;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function base64UrlEncode(obj: JWTHeader | JWTPayload): string {
  function stableStringify(o: unknown): string {
    if (o === null || typeof o !== 'object')
      return JSON.stringify(o);

    if (Array.isArray(o))
      return '[' + o.map(stableStringify).join(',') + ']';

    const obj_cast: Record<string, unknown> = o as Record<string, unknown>;
    return '{' + Object.keys(obj_cast).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj_cast[k])).join(',') + '}';
  }

  return Buffer.from(stableStringify(obj))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function verifyAndDecodeJWT(token: string): JWTPayload {
  const parts: string[] = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [encodedHeader, encodedPayload, signature]: string[] = parts;

  const signatureBase: string = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature: string = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureBase)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;


  return payload;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const payload = verifyAndDecodeJWT(token);

    console.log('\n\nJWT payload:', payload, 'Current time:', Math.floor(Date.now() / 1000));

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');     //fix not throw??
    }

    return payload;
  } catch (e) {
    console.error('Failed to decode JWT:', (e as Error).message);
    return null;
  }
}

async function authenticateUserBase(request: any, reply: any, prisma: any) {
  const payload: JWTPayload | null = decodeJWT(request.cookies.jwt);
  const now: number = Math.floor(Date.now() / 1000);
  if (payload && payload.exp - payload.iat <= TOKEN_TIMES.SHORT_LIVED_TOKEN_SECONDS) {
    return payload;
  }

  if (payload == null) {
    return null;
  }
 
  const userId = payload.sub;
  const refreshSuccess = await refreshUserToken(userId, request, reply, prisma);
  if (refreshSuccess) {
    const newJwt = generateShortLivedJWT(userId, reply);
    return decodeJWT(newJwt);
  }
  return null;
}

// Exported wrapper for normal session (10 min JWT)
export async function authenticateUserSession(request: any, reply: any, prisma: any): Promise<JWTPayload | null> {
  const payload = await authenticateUserBase(request, reply, prisma);
  if (payload) {
    return payload;
  }

  reply.clearCookie('jwt');
  // reply.status(401).send({ message: 'Authentication required' });
  return null;
}

export async function authenticateUserRegistration(userID: number, request: any, reply: any, prisma: any): Promise<boolean> {
  const refreshSuccess = await refreshUserToken(userID, request, reply, prisma);
  if (!refreshSuccess) {
    return false;
  }
  generateShortLivedJWT(userID, reply);
  reply.clearCookie('jwtReg');
  return true;
}

export function generateRegistrationJWT(userId: number, reply: any) {
  const token = generateJWT(userId, JWT_SECRET, TOKEN_TIMES.REGISTRATION_TOKEN_SECONDS);
  reply.cookie('jwtReg', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: TOKEN_TIMES.REGISTRATION_TOKEN_MS });
}

export function generateShortLivedJWT(userId: number, reply: any) {
  const token = generateJWT(userId, JWT_SECRET, TOKEN_TIMES.SHORT_LIVED_TOKEN_SECONDS);
  reply.cookie('jwt', token, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: TOKEN_TIMES.SHORT_LIVED_TOKEN_MS });
  return token;
}

// all calls to this function can remove the secret because it will be scoped to this file.
export function generateJWT(userId: number, secret: string, expiresInSeconds: number): string {
  const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };
  const currentTime: number = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: userId,
    iat: currentTime,
    exp: currentTime + expiresInSeconds,
  };

  const encodedHeader: string = base64UrlEncode(header);
  const encodedPayload: string = base64UrlEncode(payload);
  const signatureBase: string = `${encodedHeader}.${encodedPayload}`;

  const signature: string = crypto
    .createHmac('sha256', secret)
    .update(signatureBase)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureBase}.${signature}`;
}
