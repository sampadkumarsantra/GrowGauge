import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationToken, canonicalEmail } from '@/lib/token';
import { sendMail } from '@/lib/mail';
import { resetPasswordEmail } from '@/lib/mail-templates';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? canonicalEmail(body.email) : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const success = { message: 'If an account exists for this email, a reset link is on its way.' };

    if (await isRateLimited(RATE_LIMITS.FORGOT.kind, email, RATE_LIMITS.FORGOT.limit, RATE_LIMITS.FORGOT.window)) {
      return NextResponse.json(success);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) {
      return NextResponse.json(success);
    }

    const rawToken = await createVerificationToken('password-reset', email, 1);
    const template = resetPasswordEmail(email, rawToken);
    await sendMail({ to: email, ...template });

    return NextResponse.json(success);
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
