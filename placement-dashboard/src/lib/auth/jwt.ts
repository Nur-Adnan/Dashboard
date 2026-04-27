import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1h' });
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [headerB64, payloadB64, signatureB64] = parts;
  
  // Base64Url decode helper
  const decodeB64 = (str: string) => {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  };

  const payload = decodeB64(payloadB64);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  // In Node.js environment, we can use jsonwebtoken for verification
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid token');
    }
  }

  // In Edge Runtime (Middleware), use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    data
  );

  if (!isValid) throw new Error('Invalid signature');
  
  return payload as JWTPayload;
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  return verifyJWT(token, ACCESS_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  return verifyJWT(token, REFRESH_SECRET);
}