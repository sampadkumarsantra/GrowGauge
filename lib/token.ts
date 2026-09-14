import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type TokenKind = 'email-verify' | 'password-reset';

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(
  kind: TokenKind,
  email: string,
  ttlHours: number
): Promise<string> {
  const raw = generateRawToken();
  await prisma.verificationToken.create({
    data: {
      identifier: `${kind}:${email.trim().toLowerCase()}`,
      token: hashToken(raw),
      expires: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    },
  });
  return raw;
}

export interface TokenPayload {
  email: string;
  kind: TokenKind;
}

export async function consumeVerificationToken(
  raw: string | null,
  kind: TokenKind,
  targetEmail?: string
): Promise<TokenPayload | null> {
  if (!raw) return null;
  const tokenHash = hashToken(raw);
  const identifier = `${kind}:${(targetEmail ?? '').trim().toLowerCase()}`;
  
  const record = await prisma.verificationToken.findFirst({
    where: targetEmail ? { token: tokenHash, identifier } : { token: tokenHash },
  });
  if (!record) return null;
  if (record.expires.getTime() < Date.now()) return null;
  
  // Extract email from identifier
  const parts = record.identifier.split(':');
  const email = parts.slice(1).join(':');
  
  // Delete used token
  await prisma.verificationToken.delete({ where: { token: tokenHash } });
  
  return { email, kind };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function canonicalEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}
