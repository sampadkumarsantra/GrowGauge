import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

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

    await prisma.user.update({
      where: { email: payload.email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Error in POST /api/auth/verify-email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
