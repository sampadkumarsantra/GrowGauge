import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeAuthToken } from '@/lib/token';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/mail';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    if (!token) {
      return NextResponse.json({ error: 'A verification token is required.' }, { status: 400 });
    }

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.VERIFY.kind, `ip:${ip}`, 20, RATE_LIMITS.VERIFY.window)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const payload = await consumeAuthToken(token, 'email-verify');
    if (!payload) {
      return NextResponse.json(
        { error: 'This verification link is invalid or has expired. Request a new one.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return NextResponse.json({ error: 'This verification link is invalid.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Invalidate any earlier, unused verification tokens for that email.
    await prisma.authToken.updateMany({
      where: { email: payload.email, kind: 'email-verify', consumed: false },
      data: { consumed: true },
    });

    return NextResponse.json({
      message: 'Email verified. You can now save assessments and claim existing scorecards.',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}