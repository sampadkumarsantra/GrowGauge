import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken } from '@/lib/api-helpers';

interface RouteContext {
  params: { fpoGroupId: string };
}

/**
 * Score history for "the same" FPO across assessment cycles, keyed by fpoGroupId.
 * Authorizes via a valid accessToken belonging to any submission in the group.
 * Returns only aggregate score data (no raw financials).
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { fpoGroupId } = params;
    const token = getAccessToken(req);

    const submissions = await prisma.fPOSubmission.findMany({
      where: { fpoGroupId },
      include: { scoreResult: true },
      orderBy: { createdAt: 'asc' },
    });

    if (submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions found for this FPO group' }, { status: 404 });
    }

    const hasValidToken = submissions.some((s) => s.accessToken === token);

    if (!hasValidToken) {
      return NextResponse.json({ error: 'Forbidden: Invalid access token' }, { status: 403 });
    }

    const history = submissions
      .filter((s) => s.scoreResult)
      .map((s) => ({
        id: s.id,
        date: s.createdAt.toISOString(),
        overallScore: s.scoreResult!.overallScore,
        band: s.scoreResult!.band,
        factorScores: {
          membership: s.scoreResult!.membershipScore,
          revenueStability: s.scoreResult!.revenueStabilityScore,
          costEfficiency: s.scoreResult!.costEfficiencyScore,
          diversification: s.scoreResult!.diversificationScore,
          marketLinkage: s.scoreResult!.marketLinkageScore,
          governance: s.scoreResult!.governanceScore,
        },
      }));

    return NextResponse.json({
      fpoGroupId,
      hasMultipleCycles: history.length > 1,
      history,
    });
  } catch (error) {
    console.error('Error fetching FPO history:', error);
    return NextResponse.json({ error: 'Internal server error while fetching history' }, { status: 500 });
  }
}