import hkdf from '@panva/hkdf';
import { jwtDecrypt } from 'jose';

const SESSION_COOKIE_PREFIX = process.env.NEXTAUTH_COOKIE_PREFIX ?? 'next-auth';
const SECURE_COOKIE =
  process.env.NEXTAUTH_URL?.startsWith('https://') ||
  process.env.AUTH_URL?.startsWith('https://') ||
  process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://');

export function sessionCookieName(): string {
  const securePrefix = SECURE_COOKIE ? '__Secure-' : '';
  return `${securePrefix}${SESSION_COOKIE_PREFIX}.session-token`;
}

export interface DecodedSession {
  sub?: string;
  sessionToken?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean | Date | null;
  name?: string | null;
  image?: string | null;
}

async function deriveKey(keyMaterial: string): Promise<Uint8Array> {
  const key = await hkdf(
    'sha256',
    keyMaterial,
    '',
    'NextAuth.js Generated Encryption Key',
    32
  );
  return key as unknown as Uint8Array;
}

export async function decryptSessionToken(
  token: string,
  secret: string
): Promise<DecodedSession | null> {
  if (!secret || !token) return null;
  try {
    const key = await deriveKey(secret);
    const { payload } = await jwtDecrypt(token, key, { clockTolerance: 15 });
    return payload as unknown as DecodedSession;
  } catch {
    return null;
  }
}
