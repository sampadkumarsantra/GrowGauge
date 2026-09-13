import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken } from '@/lib/api-helpers';
import { getAuthSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

/**
 * Returns all FPOs referred through this facilitator, with their scores.
 * Authorizes via the facilitator's legacy accessToken (?token=...), or via a
 * logged-in session linked to that facilitator account.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);

    const facilitator = await prisma.facilitator.findUnique({ where: { id } });

    if (!facilitator) {
      return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 });
    }

    const session = await getAuthSession();
    const sessionIsLinked = Boolean(session?.user && facilitator.userAccountId === session.user.id);
    const tokenValid = Boolean(token && facilitator.accessToken === token);

    if (!sessionIsLinked && !tokenValid) {
      return NextResponse.json({ error: 'Forbidden: Invalid facilitator access token' }, { status: 403 });
    }

    const submissions = await prisma.fPOSubmission.findMany({
      where: { facilitatorId: id },
      include: { scoreResult: true },
      orderBy: { createdAt: 'desc' },
    });

    const fpos = submissions.map((sub) => ({
      id: sub.id,
      fpoName: sub.fpoName,
      state: sub.state,
      district: sub.district,
      createdAt: sub.createdAt.toISOString(),
      overallScore: sub.scoreResult?.overallScore ?? null,
      band: sub.scoreResult?.band ?? null,
    }));

    const assessedCount = fpos.filter((f) => f.band !== null).length;

    return NextResponse.json({
      facilitatorId: facilitator.id,
      name: facilitator.name,
      organization: facilitator.organization,
      totalFpos: fpos.length,
      assessedCount,
      fpos,
    });
  } catch (error) {
    console.error('Error listing facilitator FPOs:', error);
    return NextResponse.json({ error: 'Internal server error while listing FPOs' }, { status: 500 });
  }
}