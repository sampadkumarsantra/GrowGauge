import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScore, FPOSubmissionInput } from '@/lib/scoring';
import { validateFPOSubmission } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body: FPOSubmissionInput = await req.json();

    const validation = validateFPOSubmission(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Pure scoring calculation
    const scoreResult = calculateScore(body);

    // Generate secure random access token
    const accessToken = crypto.randomBytes(24).toString('hex');

    // Persist submission and score in database
    const facilitatorId = body.facilitatorId || null;
    if (facilitatorId) {
      const facilitatorExists = await prisma.facilitator.findUnique({ where: { id: facilitatorId } });
      if (!facilitatorExists) {
        return NextResponse.json({ error: 'Invalid facilitator reference' }, { status: 400 });
      }
    }

    const submission = await prisma.fPOSubmission.create({
      data: {
        accessToken,
        fpoGroupId: body.fpoGroupId || crypto.randomUUID(),
        fpoName: body.fpoName.trim(),
        state: body.state.trim(),
        district: body.district.trim(),
        registrationType: body.registrationType,
        activeMembers: Number(body.activeMembers),
        members2YrAgo: Number(body.members2YrAgo),
        revenueYear1: Number(body.revenueYear1),
        revenueYear2: body.revenueYear2 != null ? Number(body.revenueYear2) : null,
        revenueYear3: body.revenueYear3 != null ? Number(body.revenueYear3) : null,
        costYear1: Number(body.costYear1),
        costYear2: body.costYear2 != null ? Number(body.costYear2) : null,
        costYear3: body.costYear3 != null ? Number(body.costYear3) : null,
        products: JSON.stringify(body.products),
        activeBuyersCount: Number(body.activeBuyersCount),
        contractSalesPct: Number(body.contractSalesPct),
        estimatedPriceRealizationPct:
          body.estimatedPriceRealizationPct != null && body.estimatedPriceRealizationPct !== ('' as unknown)
            ? Number(body.estimatedPriceRealizationPct)
            : null,
        auditedAccounts: Boolean(body.auditedAccounts),
        agmCountLastYear: Number(body.agmCountLastYear),
        boardMeetingsLastYear: Number(body.boardMeetingsLastYear),
        email: body.email ? body.email.trim() : null,
        optedIntoLeaderboard: Boolean(body.optedIntoLeaderboard),
        facilitatorId,
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
      include: {
        scoreResult: true,
      },
    });

    return NextResponse.json({
      id: submission.id,
      accessToken: submission.accessToken,
      overallScore: scoreResult.overallScore,
      band: scoreResult.band,
      factorScores: scoreResult.factorScores,
      narrativeSummary: scoreResult.narrativeSummary,
      suggestions: scoreResult.suggestions,
      dataCompletenessFlag: scoreResult.dataCompletenessFlag,
      fpoGroupId: submission.fpoGroupId,
      optedIntoLeaderboard: submission.optedIntoLeaderboard,
      facilitatorId: submission.facilitatorId,
      calculatedAt: scoreResult.calculatedAt,
      warnings: validation.warnings,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/fpo:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing submission' },
      { status: 500 }
    );
  }
}
