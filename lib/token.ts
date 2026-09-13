import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export type AuthTokenKind = 'email-verify' | 'password-reset';

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createAuthToken(
  kind: AuthTokenKind,
  email: string,
  ttlHours: number
): Promise<string> {
  const raw = generateRawToken();
  await prisma.authToken.create({
    data: {
      tokenHash: hashToken(raw),
      kind,
      email: email.trim().toLowerCase(),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    },
  });
  return raw;
}

export interface AuthTokenPayload {
  email: string;
  kind: AuthTokenKind;
}

export async function consumeAuthToken(
  raw: string | null,
  kind: AuthTokenKind,
  targetEmail?: string
): Promise<AuthTokenPayload | null> {
  if (!raw) return null;

  const tokenHash = hashToken(raw);
  const record = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.kind !== kind) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  if (targetEmail && record.email !== targetEmail.trim().toLowerCase()) return null;

  await prisma.authToken.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return { email: record.email, kind: record.kind };
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