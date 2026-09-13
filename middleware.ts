import { NextResponse, type NextRequest } from 'next/server';
import { decryptSessionToken, sessionCookieName } from '@/lib/session-cookie';

async function getAuthSecret(): Promise<string> {
  const raw = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (raw.length >= 32) return raw;

  // Derive the same per-build fallback secret that lib/auth.ts uses,
  // so middleware stays in sync with next-auth even when env secret is
  // missing or short. Uses WebCrypto (available in both edge and Node).
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(
      'growgauge.fallback.' +
        (process.env.VERCEL_GIT_COMMIT_SHA || '') +
        (process.env.NEXT_PUBLIC_APP_URL || '') +
        (process.env.AUTH_URL || '') +
        (process.env.NEXTAUTH_URL || '')
    );
    const buf = await crypto.subtle.digest('SHA-256', data);
    let bin = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  return '';
}

async function decodeSessionCookie(cookie?: string): Promise<boolean> {
  if (!cookie) return false;
  const secret = await getAuthSecret();
  if (!secret) return false;
  return (await decryptSessionToken(cookie, secret)) !== null;
}

// Paths exempt from the login gate. Everything else redirects to /login.
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password/', // /reset-password/:token/... (app-route dynamic)
  '/verify-email/', // /verify-email/:token
  '/verify/', // /verify/:id — PUBLIC BY DESIGN (QR/lender check, PRD §6)
  '/research', // /research — PUBLIC BY DESIGN (dataset export, PRD §6)
  '/api/auth/', // next-auth endpoints + OAuth callback redirects
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    // API routes are gated in the handlers themselves; never in middleware
    // (route handlers handle their own 401s).
    return NextResponse.next();
  }

  const loggedIn = await decodeSessionCookie(req.cookies.get(sessionCookieName())?.value);

  if (loggedIn && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Gate pages but never intercept public static assets / the auth API /
  // files with extensions (favicon, images, fonts, pdfs).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
