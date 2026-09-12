import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken } from '@/lib/api-helpers';

interface RouteContext {
  params: { id: string };
}

/**
 * Returns all FPOs referred through this facilitator, with their scores.
 * Requires the facilitator's accessToken as the `?token=` query parameter.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: facilitator accessToken is required as query parameter (?token=...)' },
        { status: 401 }
      );
    }

    const facilitator = await prisma.facilitator.findUnique({ where: { id } });

    if (!facilitator || facilitator.accessToken !== token) {
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