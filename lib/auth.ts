import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { decryptSessionToken, sessionCookieName } from '@/lib/session-cookie';
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
    '[GrowGauge] AUTH_SECRET is missing or too short. Using derived fallback. Set AUTH_SECRET in your host env for stable sessions.'
  );
}

export interface AuthSessionUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
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
    maxAge: 60 * 60 * 24 * 30, // 30 days
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

        const alreadyLimited = await isRateLimited(
          RATE_LIMITS.LOGIN.kind,
          email,
          RATE_LIMITS.LOGIN.limit,
          RATE_LIMITS.LOGIN.window,
          false
        );
        if (alreadyLimited) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
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
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: Boolean(user.emailVerified),
        };
      },
    }),
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: 'openid email profile',
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google sign-in: link to existing account if email matches
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (existing) {
          // Link Google account to existing user
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existing.id,
              provider: 'google',
              providerAccountId: account.providerAccountId,
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existing.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }

          // Update user fields
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              emailVerified: new Date(),
              lastLoginAt: new Date(),
              name: existing.name ?? user.name,
              image: existing.image ?? user.image,
            },
          });

          // Set user.id for JWT callback
          user.id = existing.id;
          user.email = existing.email;
          (user as any).role = existing.role;
          (user as any).emailVerified = true;
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              lastLoginAt: new Date(),
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              },
            },
          });

          user.id = newUser.id;
          user.email = newUser.email;
          (user as any).role = newUser.role;
          (user as any).emailVerified = true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role ?? 'fpo_rep';
        token.emailVerified = Boolean((user as any).emailVerified);
        token.image = user.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role ?? 'fpo_rep';
        (session.user as any).emailVerified = Boolean(token.emailVerified);
        (session.user as any).image = token.image ?? null;
      }
      return session;
    },
  },
};

/**
 * Server-side session getter. Decrypts the JWE session cookie and returns
 * the session user info. Safe to call from any server component or API route.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) return null;

  const payload = await decryptSessionToken(token, AUTH_SECRET);
  if (!payload) return null;

  // For JWT strategy, the payload contains: sub (user ID), email, role, emailVerified, name, image
  const sub = payload.sub as string | undefined;
  if (!sub) return null;

  return {
    user: {
      id: sub,
      email: (payload.email as string) ?? '',
      role: (payload.role as string) ?? 'fpo_rep',
      emailVerified: Boolean(payload.emailVerified),
      name: (payload.name as string) ?? null,
      image: (payload.image as string) ?? null,
    },
  };
}
