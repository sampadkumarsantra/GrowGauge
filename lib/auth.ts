import { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

export const AUTH_SECRET = process.env.AUTH_SECRET;

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
        if (alreadyLimited) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.passwordHash) return null;

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
  const session = await getServerSession(authOptions);
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