import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeAuthToken, isValidPassword } from '@/lib/token';
import { hashPassword } from '@/lib/password';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) {
      return NextResponse.json({ error: 'A reset token is required.' }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.RESET.kind, `ip:${ip}`, 20, RATE_LIMITS.RESET.window)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const payload = await consumeAuthToken(token, 'password-reset');
    if (!payload) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Request a new one.' },
        { status: 400 }
      );
    }

    if (await isRateLimited(RATE_LIMITS.RESET.kind, payload.email, RATE_LIMITS.RESET.limit, RATE_LIMITS.RESET.window)) {
      return NextResponse.json(
        { error: 'Too many attempts for this account. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || !user.passwordHash || !user.emailVerified) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, lastLoginAt: new Date() },
    });

    return NextResponse.json({
      message: 'Your password has been reset. You can now sign in.',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}