import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken, hydrateSubmission, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { calculateScore } from '@/lib/scoring';
import crypto from 'crypto';

interface RouteContext {
  params: { id: string };
}

/**
 * Starts a NEW assessment cycle: clones the current submission into a fresh
 * FPOSubmission carrying the same fpoGroupId (preserving score history) instead
 * of overwriting the existing record.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);
    const result = await loadAuthorizedSubmission(id, token);

    if (result.status !== null) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const existing = result.submission;
    const input = hydrateSubmission(existing);
    const scoreResult = calculateScore(input);
    const accessToken = crypto.randomBytes(24).toString('hex');

    // A new cycle is a new anonymous submission secured by its own access token.
    const created = await prisma.fPOSubmission.create({
      data: {
        accessToken,
        fpoGroupId: existing.fpoGroupId || crypto.randomUUID(),
        fpoName: existing.fpoName,
        state: existing.state,
        district: existing.district,
        registrationType: existing.registrationType,
        activeMembers: existing.activeMembers,
        members2YrAgo: existing.members2YrAgo,
        revenueYear1: existing.revenueYear1,
        revenueYear2: existing.revenueYear2,
        revenueYear3: existing.revenueYear3,
        costYear1: existing.costYear1,
        costYear2: existing.costYear2,
        costYear3: existing.costYear3,
        products: existing.products,
        activeBuyersCount: existing.activeBuyersCount,
        contractSalesPct: existing.contractSalesPct,
        estimatedPriceRealizationPct: existing.estimatedPriceRealizationPct,
        auditedAccounts: existing.auditedAccounts,
        agmCountLastYear: existing.agmCountLastYear,
        boardMeetingsLastYear: existing.boardMeetingsLastYear,
        email: existing.email,
        optedIntoLeaderboard: existing.optedIntoLeaderboard,
        facilitatorId: existing.facilitatorId,
        scoreResult: {
          create: {
            overallScore: scoreResult.overallScore,
            band: scoreResult.band,
            membershipScore: scoreResult.factorScores.membership,
            revenueStabilityScore: scoreResult.factorScores.revenueStability,
            costEfficiencyScore: scoreResult.factorScores.costEfficiency,
            diversificationScore: scoreResult.factorScores.diversification,
            marketLinkageScore: scoreResult.factorScores.marketLinkage,
            governanceScore: scoreResult.factorScores.governance,
            narrativeSummary: scoreResult.narrativeSummary,
            suggestions: JSON.stringify(scoreResult.suggestions),
            dataCompletenessFlag: scoreResult.dataCompletenessFlag,
          },
        },
      },
      include: { scoreResult: true },
    });

    return NextResponse.json(
      {
        id: created.id,
        accessToken: created.accessToken,
        fpoGroupId: created.fpoGroupId,
        message:
          'New assessment cycle started. Update this year\'s data from the new scorecard link.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error starting new assessment cycle:', error);
    return NextResponse.json(
      { error: 'Internal server error while starting a new assessment cycle' },
      { status: 500 }
    );
  }
}