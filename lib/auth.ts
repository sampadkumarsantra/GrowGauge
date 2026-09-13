import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

const AUTH_SECRET_RAW = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

if (AUTH_SECRET_RAW.length < 32) {
  throw new Error(
    '[GrowGauge] AUTH_SECRET is missing or too short on this server. Set AUTH_SECRET (a random string of 32+ chars) in your host environment (e.g. Vercel Settings → Environment Variables) and redeploy.'
  );
}

export const AUTH_SECRET = AUTH_SECRET_RAW;

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
// DynamicServerError state during static generation. We replicate the
// next-auth JWT strategy: decode the session cookie with the same secret.

const SESSION_COOKIE_PREFIX = process.env.NEXTAUTH_COOKIE_PREFIX ?? 'next-auth';
const SECURE_COOKIE =
  process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.AUTH_URL?.startsWith('https://');

function sessionCookieName(): string {
  const securePrefix = SECURE_COOKIE ? '__Secure-' : '';
  return `${securePrefix}${SESSION_COOKIE_PREFIX}.session-token`;
}

async function joseSecret(): Promise<Uint8Array> {
  return new TextEncoder().encode(AUTH_SECRET);
}

async function getSessionFromCookie(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, await joseSecret(), {
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    return {
      user: {
        id: payload.sub,
        email: (payload.email as string) ?? '',
        role: (payload.role as string) ?? 'fpo_rep',
        emailVerified: Boolean(payload.emailVerified),
        name: (payload.name as string | null) ?? null,
        organization: (payload.organization as string | null) ?? null,
      } satisfies AuthSessionUser,
    };
  } catch {
    return null;
  }
}