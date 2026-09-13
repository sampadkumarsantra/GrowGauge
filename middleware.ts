import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// The default jose algorithm check is stricter than next-auth's decode() —
// next-auth signs session cookies with HS256, so pin that.
const SESSION_COOKIE_PREFIX = process.env.NEXTAUTH_COOKIE_PREFIX ?? 'next-auth';
const SECURE_COOKIE =
  process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.AUTH_URL?.startsWith('https://');

function sessionCookieName(): string {
  const securePrefix = SECURE_COOKIE ? '__Secure-' : '';
  return `${securePrefix}${SESSION_COOKIE_PREFIX}.session-token`;
}

async function decodeSessionCookie(cookie?: string): Promise<boolean> {
  if (!cookie) return false;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(cookie, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    if (typeof payload.sub === 'string' && payload.sub.length > 0) return true;
    // 'jti'+exp are always present; verify nothing else. Reject on any decode error.
    return false;
  } catch {
    return false;
  }
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