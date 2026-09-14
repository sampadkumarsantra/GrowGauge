import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/require-session';
import { getAccessToken } from '@/lib/api-helpers';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

/**
 * Attaches a logged-in account to a scorecard so it appears on the user's
 * dashboard. Requires the private accessToken (?token=...) plus a session.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);

    const auth = await requireSession();
    if (auth.error) return auth.error;
    const { session } = auth;

    const submission = await prisma.fPOSubmission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json({ error: 'FPO submission not found' }, { status: 404 });
    }

    if (!token || submission.accessToken !== token) {
      return NextResponse.json(
        { error: 'Forbidden: this scorecard link is missing or has an invalid access token' },
        { status: 403 }
      );
    }

    const updated = await prisma.fPOSubmission.update({
      where: { id },
      data: { userId: session.user.id },
      include: { scoreResult: true },
    });

    return NextResponse.json({
      id: updated.id,
      saved: true,
      message: 'Scorecard saved to your dashboard.',
      overallScore: updated.scoreResult?.overallScore ?? null,
      band: updated.scoreResult?.band ?? null,
    });
  } catch (error) {
    console.error('Error claiming submission:', error);
    return NextResponse.json({ error: 'Internal server error while saving scorecard' }, { status: 500 });
  }
}