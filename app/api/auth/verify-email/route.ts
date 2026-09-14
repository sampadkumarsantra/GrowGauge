import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/token';
import {
  decryptSessionToken,
  encryptSessionToken,
  sessionCookieName,
  altSessionCookieName,
} from '@/lib/session-cookie';
import { AUTH_SECRET } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
    }

    const payload = await consumeVerificationToken(token, 'email-verify');
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: payload.email },
      data: { emailVerified: new Date() },
      select: { id: true, role: true, name: true, image: true },
    });

    const response = NextResponse.json({ message: 'Email verified successfully.' });

    // If the user already has an active session, re-issue it so the JWT now
    // carries emailVerified = true and the dashboard unlocks immediately.
    const existingToken =
      req.cookies.get(sessionCookieName())?.value || req.cookies.get(altSessionCookieName())?.value;
    if (existingToken) {
      const decoded = await decryptSessionToken(existingToken, AUTH_SECRET);
      if (decoded?.sub && decoded.sub === user.id) {
        const fresh = await encryptSessionToken(
          {
            ...decoded,
            emailVerified: true,
          },
          AUTH_SECRET,
          SESSION_MAX_AGE
        );
        const secure = Boolean(
          req.url.startsWith('https://') || process.env.VERCEL === '1'
        );
        response.cookies.set({
          name: sessionCookieName(req.url),
          value: fresh,
          httpOnly: true,
          secure,
          sameSite: 'lax',
          path: '/',
          maxAge: SESSION_MAX_AGE,
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/verify-email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
