import { prisma } from '@/lib/prisma';

export const RATE_LIMITS = {
  LOGIN: { kind: 'login', limit: 10, window: 300 },
  REGISTER: { kind: 'register', limit: 5, window: 900 },
  FORGOT: { kind: 'forgot', limit: 3, window: 900 },
  RESET: { kind: 'reset', limit: 5, window: 600 },
  VERIFY: { kind: 'verify', limit: 10, window: 900 },
  CLAIM: { kind: 'claim', limit: 10, window: 600 },
} as const;

const WINDOW_MS = 60 * 1000;

const memoryStore = new Map<string, { count: number; windowStart: number }>();
let memoryFallback = false;

export function resetRateLimitMemory() {
  memoryStore.clear();
}

/**
 * Returns true when the caller has exceeded `limit` attempts within `windowSeconds`
 * for a given key. Backed by the Postgres `AuthAttempt` table so limits survive
 * restarts and multiple instances; falls back to an in-process map only when the
 * database is unavailable (e.g. local dev before migrations have run).
 */
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
      if (!touch) {
        const existing = await prisma.authAttempt.findUnique({
          where: { email_kind: { email: normalizedKey, kind } },
        });
        if (!existing) return false;
        return existing.windowStart >= windowStart && existing.count > limit;
      }

      const existing = await prisma.authAttempt.findUnique({
        where: { email_kind: { email: normalizedKey, kind } },
      });

      if (!existing) {
        await prisma.authAttempt.create({
          data: { email: normalizedKey, kind, windowStart: now, count: 1, lastAttemptAt: now },
        });
        return false;
      }

      if (existing.windowStart < windowStart) {
        await prisma.authAttempt.update({
          where: { id: existing.id },
          data: { count: 1, windowStart: now, lastAttemptAt: now },
        });
        return false;
      }

      await prisma.authAttempt.update({
        where: { id: existing.id },
        data: { count: { increment: 1 }, lastAttemptAt: now },
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

  if (memoryFallback) {
    const mk = `${kind}:${normalizedKey}`;
    const now = Date.now();
    const hit = memoryStore.get(mk);

    if (!hit || now - hit.windowStart > windowSeconds * WINDOW_MS) {
      memoryStore.set(mk, { count: 1, windowStart: now });
      return false;
    }

    if (touch) hit.count += 1;
    return hit.count > limit;
  }

  return false;
}