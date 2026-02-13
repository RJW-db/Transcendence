import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('JWT_SECRET environment variable is required');
})();

export const TOKEN_TIMES = {
  SHORT_LIVED_TOKEN_MS: (parseInt(process.env.JWT_ACCESS_TOKEN_MINUTES ?? "15", 10)) * 60 * 1000,
  REFRESH_TOKEN_MS: (parseInt(process.env.JWT_REFRESH_TOKEN_DAYS ?? "30", 10)) * 24 * 60 * 60 * 1000,
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

export function verifyAndDecodeJWT(token: string, secret: string): JWTPayload {
  const parts: string[] = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [encodedHeader, encodedPayload, signature]: string[] = parts;

  const signatureBase: string = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature: string = crypto
    .createHmac('sha256', secret)
    .update(signatureBase)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export function decodeJWT(token: string, secret: string): JWTPayload | null {
  try {
    return verifyAndDecodeJWT(token, secret);
  } catch (e) {
    console.error('Failed to decode JWT:', (e as Error).message);
    return null;
  }
}

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
