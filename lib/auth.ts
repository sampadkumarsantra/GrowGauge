import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { decryptSessionToken, sessionCookieName } from '@/lib/session-cookie';

// The AUTH_SECRET that signs and verifies the session cookie. It MUST be stable
// across redeploys and instances, so it comes from your host env. When unset we
// still boot (so builds/deploys never hard-fail), deriving a per-build secret as
// an explicitly-insecure fallback and warning loudly — every page still works,
// but sessions reset on the next deploy. Set AUTH_SECRET on the host to get
// stable sessions.
import { createHash } from 'crypto';

const AUTH_SECRET_RAW = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

const derivedFallback = createHash('sha256')
  .update(
    'growgauge.fallback.' +
      (process.env.VERCEL_GIT_COMMIT_SHA || '') +
      (process.env.NEXT_PUBLIC_APP_URL || '') +
      (process.env.AUTH_URL || '') +
      (process.env.NEXTAUTH_URL || '')
  )
  .digest('base64');

export const AUTH_SECRET = AUTH_SECRET_RAW.length >= 32 ? AUTH_SECRET_RAW : derivedFallback;

if (AUTH_SECRET_RAW.length < 32) {
  console.warn(
    '[GrowGauge] AUTH_SECRET is missing or too short on this server. Set AUTH_SECRET (a random 32+ char string) in your host environment (e.g. Vercel Settings → Environment Variables) for stable sessions. Using an insecure per-build fallback for now.'
  );
}

export interface AuthSessionUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  name: string | null;
  organization: string | null;
}

export interface AuthSession {
  user: AuthSessionUser;
}

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) return null;

        // Brute-force guard: only failed attempts count, capped at 10 per email
        // per 5 minutes.
        const alreadyLimited = await isRateLimited(
          RATE_LIMITS.LOGIN.kind,
          email,
          RATE_LIMITS.LOGIN.limit,
          RATE_LIMITS.LOGIN.window,
          false
        );
        if (alreadyLimited) {
          console.warn(`[auth] rate-limited login attempt for ${email}`);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.warn(`[auth] login: no user for ${email}`);
          return null;
        }
        if (!user.passwordHash) {
          console.warn(`[auth] login: no passwordHash for ${email}`);
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          console.warn(`[auth] login: password mismatch for ${email}`);
          await isRateLimited(
            RATE_LIMITS.LOGIN.kind,
            email,
            RATE_LIMITS.LOGIN.limit,
            RATE_LIMITS.LOGIN.window,
            true
          );
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          name: user.name,
          organization: user.organization,
        };
      },
    }),
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub as string,
          role: (token.role as string) ?? 'fpo_rep',
          emailVerified: Boolean((token as any).emailVerified),
          name: (token.name as string) ?? null,
          organization: (token as any).organization ?? null,
        } as typeof session.user;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role ?? 'fpo_rep';
        token.emailVerified = (user as any).emailVerified ?? false;
        token.organization = (user as any).organization ?? null;
      }

      if (account && account.provider === 'google') {
        const ephemeral = (token as any).ephemeral as string | undefined;
        if (ephemeral) delete (token as any).ephemeral;

        const sub = token.sub as string | undefined;
        const email = token.email as string | undefined;
        if (sub && email) {
          try {
            await prisma.user.update({
              where: { id: sub },
              data: { emailVerified: true, lastLoginAt: new Date() },
            });
            token.emailVerified = true;
          } catch {
            /* best-effort on the way through */
          }
        }
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && !existing.googleId) {
          return '/login?error=AccountExistsSignin';
        }
      }
      return true;
    },
  },
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getSessionFromCookie();
  if (!session?.user) return null;
  const user = session.user as any;
  const id = (user.id ?? user.sub) as string | undefined;
  if (!id) return null;
  const email = (user.email ?? '') as string;
  return {
    user: {
      id,
      email,
      role: (user.role as string) ?? 'fpo_rep',
      emailVerified: Boolean(user.emailVerified),
      name: (user.name as string) ?? null,
      organization: (user.organization as string) ?? null,
    } satisfies AuthSessionUser,
  };
}

// ─── Cookie-based JWT session decoding ──────────────────────────────────────
// Avoids `getServerSession`, which reads `headers()` and forces routes into a
// DynamicServerError state during static generation. We decrypt the next-auth
// JWE session cookie using the same HKDF-derived encryption key that next-auth
// uses when encoding (see lib/session-cookie.ts).

async function getSessionFromCookie(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) return null;

  const payload = await decryptSessionToken(token, AUTH_SECRET);
  if (!payload) return null;

  return {
    user: {
      id: payload.sub,
      email: payload.email ?? '',
      role: payload.role ?? 'fpo_rep',
      emailVerified: Boolean(payload.emailVerified),
      name: payload.name ?? null,
      organization: payload.organization ?? null,
    } satisfies AuthSessionUser,
  };
}
