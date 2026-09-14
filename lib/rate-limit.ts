import { prisma } from '@/lib/prisma';

export const RATE_LIMITS = {
  LOGIN: { kind: 'login', limit: 5, window: 900 },
  REGISTER: { kind: 'register', limit: 5, window: 900 },
  FORGOT: { kind: 'forgot', limit: 3, window: 3600 },
  RESET: { kind: 'reset', limit: 5, window: 900 },
  CLAIM: { kind: 'claim', limit: 30, window: 600 },
} as const;

const memoryStore = new Map<string, { count: number; windowStart: number }>();
let memoryFallback = false;

export async function isRateLimited(
  kind: string,
  key: string,
  limit: number,
  windowSeconds: number,
  touch = true
): Promise<boolean> {
  const normalizedKey = key.trim().toLowerCase();

  async function attemptDb(): Promise<boolean | 'unavailable'> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    try {
      const existing = await prisma.authRateLimit.findUnique({
        where: { kind_key: { kind, key: normalizedKey } },
      });

      if (!touch && !existing) return false;
      if (!touch && existing) {
        return existing.windowStart >= windowStart && existing.count > limit;
      }

      if (!existing) {
        await prisma.authRateLimit.create({
          data: { kind, key: normalizedKey, count: 1, windowStart: now, lastAttempt: now },
        });
        return false;
      }

      if (existing.windowStart < windowStart) {
        await prisma.authRateLimit.update({
          where: { id: existing.id },
          data: { count: 1, windowStart: now, lastAttempt: now },
        });
        return false;
      }

      await prisma.authRateLimit.update({
        where: { id: existing.id },
        data: { count: { increment: 1 }, lastAttempt: now },
      });

      return existing.count + 1 > limit;
    } catch {
      return 'unavailable';
    }
  }

  if (!memoryFallback) {
    const result = await attemptDb();
    if (result !== 'unavailable') return result;
    memoryFallback = true;
  }

  // In-memory fallback
  const mk = `${kind}:${normalizedKey}`;
  const now = Date.now();
  const hit = memoryStore.get(mk);

  if (!hit || now - hit.windowStart > windowSeconds * 1000) {
    memoryStore.set(mk, { count: 1, windowStart: now });
    return false;
  }

  if (touch) hit.count += 1;
  return hit.count > limit;
}
