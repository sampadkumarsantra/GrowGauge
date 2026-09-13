import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalEmail, createAuthToken, isValidEmail } from '@/lib/token';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp, sendMail } from '@/lib/mail';
import { resetPasswordEmail } from '@/lib/mail-templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? canonicalEmail(body.email) : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.FORGOT.kind, `ip:${ip}`, 10, RATE_LIMITS.FORGOT.window)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    if (await isRateLimited(RATE_LIMITS.FORGOT.kind, email, RATE_LIMITS.FORGOT.limit, RATE_LIMITS.FORGOT.window)) {
      return NextResponse.json(
        { error: 'Too many requests for this email. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Respond identically whether or not the account exists, to avoid account enumeration.
    if (!user || !user.passwordHash) {
      return NextResponse.json({
        message:
          'If an account exists for that email, a password reset link is on its way.',
      });
    }

    const token = await createAuthToken('password-reset', email, 1);
    await sendMail({ to: email, ...resetPasswordEmail(email, token) });

    return NextResponse.json({
      message: 'If an account exists for that email, a password reset link is on its way.',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}