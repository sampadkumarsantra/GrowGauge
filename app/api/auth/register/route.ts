import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { createVerificationToken, isValidEmail, isValidPassword, canonicalEmail } from '@/lib/token';
import { sendMail, getRequestIp } from '@/lib/mail';
import { verificationEmail } from '@/lib/mail-templates';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.REGISTER.kind, `ip:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.window)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    const rawToken = await createVerificationToken('email-verify', email, 48);
    const template = verificationEmail(email, rawToken);
    await sendMail({ to: email, ...template });

    return NextResponse.json({ message: 'Account created. Please check your email to verify.' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
