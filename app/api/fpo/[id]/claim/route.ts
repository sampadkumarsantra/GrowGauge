import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: please log in.' }, { status: 401 });
    }
    const user = session.user;

    const ip = getRequestIp(req);
    if (await isRateLimited(RATE_LIMITS.CLAIM.kind, `ip:${ip}`, 30, RATE_LIMITS.CLAIM.window)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Verify your email before claiming a scorecard. Check your inbox or request a new verification link.',
          code: 'email_not_verified',
        },
        { status: 403 }
      );
    }

    const submission = await prisma.fPOSubmission.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, userId: true, accessToken: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Scorecard not found.' }, { status: 404 });
    }

    // Presenting a token is required for the legacy claim path, so the person
    // proving ownership of the email is also in possession of the private link.
    const presentedToken = req.nextUrl.searchParams.get('token');
    if (!presentedToken || submission.accessToken !== presentedToken) {
      return NextResponse.json(
        { error: 'This scorecard must be claimed from its private share link.' },
        { status: 403 }
      );
    }

    if (submission.userId) {
      if (submission.userId === user.id) {
        return NextResponse.json({
          message: 'This scorecard is already saved to your account.',
          claimed: true,
        });
      }
      return NextResponse.json(
        { error: 'This scorecard is already linked to another account.' },
        { status: 422 }
      );
    }

    if (!submission.email || submission.email.trim().toLowerCase() !== user.email) {
      return NextResponse.json(
        {
          error:
            'The email on this scorecard does not match your account email, so it cannot be claimed. If you entered a different email at assessment time, create an account with that email instead.',
          code: 'email_mismatch',
        },
        { status: 403 }
      );
    }

    await prisma.fPOSubmission.update({
      where: { id: submission.id },
      data: { userId: user.id, claimedAt: new Date() },
    });

    return NextResponse.json({
      message: 'Scorecard saved to your account. It now appears on your dashboard.',
      claimed: true,
    });
  } catch (error) {
    console.error('Error claiming submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}