import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canonicalEmail, createAuthToken, isValidEmail } from '@/lib/token';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp, sendMail } from '@/lib/mail';
import { verificationEmail } from '@/lib/mail-templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? canonicalEmail(body.email) : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.VERIFY.kind, `ip:${ip}`, 10, RATE_LIMITS.VERIFY.window)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    if (await isRateLimited(RATE_LIMITS.VERIFY.kind, email, RATE_LIMITS.VERIFY.limit, RATE_LIMITS.VERIFY.window)) {
      return NextResponse.json(
        { error: 'Too many verification emails sent for this address. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return NextResponse.json({
        message: 'If a verification email is needed, it has been sent.',
      });
    }

    const token = await createAuthToken('email-verify', email, 48);
    await sendMail({ to: email, ...verificationEmail(email, token) });

    return NextResponse.json({
      message: 'If a verification email is needed, it has been sent.',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}