import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { canonicalEmail, createAuthToken, isValidEmail, isValidPassword } from '@/lib/token';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp, sendMail } from '@/lib/mail';
import { verificationEmail } from '@/lib/mail-templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? canonicalEmail(body.email) : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.REGISTER.kind, `ip:${ip}`, 10, RATE_LIMITS.REGISTER.window)) {
      return NextResponse.json(
        { error: 'Too many sign-up attempts from your network. Please try again later.' },
        { status: 429 }
      );
    }
    if (await isRateLimited(RATE_LIMITS.REGISTER.kind, email, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.window)) {
      return NextResponse.json(
        { error: 'Too many sign-up attempts for this email. Please try again later.' },
        { status: 429 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        error:
          'An account with this email already exists. Try signing in, or reset your password if you have forgotten it.',
        code: 'account_exists',
      }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          emailVerified: false,
        },
      });

      const token = await createAuthToken('email-verify', email, 48);
      await sendMail({
        to: email,
        ...verificationEmail(email, token),
      });

      return NextResponse.json(
        {
          id: user.id,
          email: user.email,
          message:
            'Account created. We sent a verification link to your email — verify it to save assessments and claim existing scorecards.',
        },
        { status: 201 }
      );
    } catch (err) {
      console.error('Error creating user:', err);
      return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}