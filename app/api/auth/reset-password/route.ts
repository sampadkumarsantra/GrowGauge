import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken, isValidPassword } from '@/lib/token';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const payload = await consumeVerificationToken(token, 'password-reset');
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || !user.emailVerified) {
      return NextResponse.json({ error: 'Account not found or email not verified.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
