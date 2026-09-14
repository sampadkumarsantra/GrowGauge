import { NextRequest, NextResponse } from 'next/server';
import { decryptSessionToken, sessionCookieName, altSessionCookieName } from '@/lib/session-cookie';

// Empty or too-short secret => the derived fallback in lib/auth.ts applies and
// cannot be reproduced here (edge runtime has no synchronous Node crypto), so we
// rely on route-level guards instead of the middleware gate.
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

// Fully public pages (PRD §6) plus token-protected scorecard/verification links
// that must keep working without a session (PRD §8 – zero regression).
const PUBLIC_PREFIXES = [
  '/_next',
  '/api/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify',
  '/results',
  '/assess',
  '/research',
  '/leaderboard',
  '/about',
];

// Public API namespaces (each route still enforces its own token/validation).
const PUBLIC_API_PREFIXES = ['/api/fpo', '/api/leaderboard', '/api/research', '/api/score'];

function isPublic(pathname: string): boolean {
  if (pathname === '/' || pathname === '/favicon') return true;
  return (
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (AUTH_SECRET.length < 32 || isPublic(pathname)) {
    return NextResponse.next();
  }

  const primary = sessionCookieName(req.nextUrl.origin);
  const fallback = altSessionCookieName();
  const token = req.cookies.get(primary)?.value || req.cookies.get(fallback)?.value;
  const payload = token ? await decryptSessionToken(token, AUTH_SECRET) : null;
  const authed = Boolean(payload?.sub);

  if (!authed) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|woff2?|ttf|otf|eot|pdf|json)).*)',
  ],
};