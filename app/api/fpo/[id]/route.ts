import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateScore, FPOSubmissionInput } from '@/lib/scoring';
import { validateFPOSubmission } from '@/lib/validation';
import { getAccessToken, loadAuthorizedSubmission } from '@/lib/api-helpers';
import { getAuthSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);
    const result = await loadAuthorizedSubmission(id, token);

    if (result.status !== null) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const submission = result.submission;

    let parsedProducts = [];
    try {
      parsedProducts = JSON.parse(submission.products);
    } catch {
      parsedProducts = [];
    }

    let parsedSuggestions = [];
    try {
      parsedSuggestions = submission.scoreResult ? JSON.parse(submission.scoreResult.suggestions) : [];
    } catch {
      parsedSuggestions = [];
    }

    const session = await getAuthSession();
    const currentUserId = session?.user.id ?? null;
    const claimable = (() => {
      if (!session) return false;
      if (submission.userId) return submission.userId === currentUserId;
      if (!session.user.emailVerified) return false;
      if (!submission.email) return false;
      return submission.email.trim().toLowerCase() === session.user.email;
    })();

    return NextResponse.json({
      id: submission.id,
      accessToken: submission.accessToken,
      userId: submission.userId,
      claimable,
      fpoName: submission.fpoName,
      state: submission.state,
      district: submission.district,
      registrationType: submission.registrationType,
      fpoGroupId: submission.fpoGroupId,
      activeMembers: submission.activeMembers,
      members2YrAgo: submission.members2YrAgo,
      revenueYear1: submission.revenueYear1,
      revenueYear2: submission.revenueYear2,
      revenueYear3: submission.revenueYear3,
      costYear1: submission.costYear1,
      costYear2: submission.costYear2,
      costYear3: submission.costYear3,
      products: parsedProducts,
      activeBuyersCount: submission.activeBuyersCount,
      contractSalesPct: submission.contractSalesPct,
      estimatedPriceRealizationPct: submission.estimatedPriceRealizationPct,
      auditedAccounts: submission.auditedAccounts,
      agmCountLastYear: submission.agmCountLastYear,
      boardMeetingsLastYear: submission.boardMeetingsLastYear,
      email: submission.email,
      optedIntoLeaderboard: submission.optedIntoLeaderboard,
      facilitatorId: submission.facilitatorId,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      scoreResult: submission.scoreResult
        ? {
            overallScore: submission.scoreResult.overallScore,
            band: submission.scoreResult.band,
            factorScores: {
              membership: submission.scoreResult.membershipScore,
              revenueStability: submission.scoreResult.revenueStabilityScore,
              costEfficiency: submission.scoreResult.costEfficiencyScore,
              diversification: submission.scoreResult.diversificationScore,
              marketLinkage: submission.scoreResult.marketLinkageScore,
              governance: submission.scoreResult.governanceScore,
            },
            narrativeSummary: submission.scoreResult.narrativeSummary,
            suggestions: parsedSuggestions,
            dataCompletenessFlag: submission.scoreResult.dataCompletenessFlag,
            calculatedAt: submission.scoreResult.calculatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error in GET /api/fpo/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const token = getAccessToken(req);
    const result = await loadAuthorizedSubmission(id, token);

    if (result.status !== null) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const existing = result.submission;

    const updates: Partial<FPOSubmissionInput> = await req.json();

    // Parse existing products
    let existingProducts = [];
    try {
      existingProducts = JSON.parse(existing.products);
    } catch {
      existingProducts = [];
    }

    // Merge updates with existing record to validate complete object
    const mergedData: FPOSubmissionInput = {
      fpoName: updates.fpoName !== undefined ? updates.fpoName : existing.fpoName,
      state: updates.state !== undefined ? updates.state : existing.state,
      district: updates.district !== undefined ? updates.district : existing.district,
      registrationType: updates.registrationType !== undefined ? updates.registrationType : existing.registrationType,
      activeMembers: updates.activeMembers !== undefined ? Number(updates.activeMembers) : existing.activeMembers,
      members2YrAgo: updates.members2YrAgo !== undefined ? Number(updates.members2YrAgo) : existing.members2YrAgo,
      revenueYear1: updates.revenueYear1 !== undefined ? Number(updates.revenueYear1) : existing.revenueYear1,
      revenueYear2: updates.revenueYear2 !== undefined ? (updates.revenueYear2 != null ? Number(updates.revenueYear2) : null) : existing.revenueYear2,
      revenueYear3: updates.revenueYear3 !== undefined ? (updates.revenueYear3 != null ? Number(updates.revenueYear3) : null) : existing.revenueYear3,
      costYear1: updates.costYear1 !== undefined ? Number(updates.costYear1) : existing.costYear1,
      costYear2: updates.costYear2 !== undefined ? (updates.costYear2 != null ? Number(updates.costYear2) : null) : existing.costYear2,
      costYear3: updates.costYear3 !== undefined ? (updates.costYear3 != null ? Number(updates.costYear3) : null) : existing.costYear3,
      products: updates.products !== undefined ? updates.products : existingProducts,
      activeBuyersCount: updates.activeBuyersCount !== undefined ? Number(updates.activeBuyersCount) : existing.activeBuyersCount,
      contractSalesPct: updates.contractSalesPct !== undefined ? Number(updates.contractSalesPct) : existing.contractSalesPct,
      estimatedPriceRealizationPct:
        updates.estimatedPriceRealizationPct !== undefined
          ? (updates.estimatedPriceRealizationPct != null ? Number(updates.estimatedPriceRealizationPct) : null)
          : existing.estimatedPriceRealizationPct,
      auditedAccounts: updates.auditedAccounts !== undefined ? Boolean(updates.auditedAccounts) : existing.auditedAccounts,
      agmCountLastYear: updates.agmCountLastYear !== undefined ? Number(updates.agmCountLastYear) : existing.agmCountLastYear,
      boardMeetingsLastYear: updates.boardMeetingsLastYear !== undefined ? Number(updates.boardMeetingsLastYear) : existing.boardMeetingsLastYear,
      email: updates.email !== undefined ? updates.email : existing.email,
      optedIntoLeaderboard:
        updates.optedIntoLeaderboard !== undefined ? Boolean(updates.optedIntoLeaderboard) : existing.optedIntoLeaderboard,
      facilitatorId:
        updates.facilitatorId !== undefined
          ? updates.facilitatorId
          : existing.facilitatorId,
    };

    const validation = validateFPOSubmission(mergedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Recalculate score with pure engine
    const scoreResult = calculateScore(mergedData);

    // Update in database
    const updated = await prisma.fPOSubmission.update({
      where: { id },
      data: {
        fpoName: mergedData.fpoName,
        state: mergedData.state,
        district: mergedData.district,
        registrationType: mergedData.registrationType,
        activeMembers: mergedData.activeMembers,
        members2YrAgo: mergedData.members2YrAgo,
        revenueYear1: mergedData.revenueYear1,
        revenueYear2: mergedData.revenueYear2,
        revenueYear3: mergedData.revenueYear3,
        costYear1: mergedData.costYear1,
        costYear2: mergedData.costYear2,
        costYear3: mergedData.costYear3,
        products: JSON.stringify(mergedData.products),
        activeBuyersCount: mergedData.activeBuyersCount,
        contractSalesPct: mergedData.contractSalesPct,
        estimatedPriceRealizationPct: mergedData.estimatedPriceRealizationPct,
        auditedAccounts: mergedData.auditedAccounts,
        agmCountLastYear: mergedData.agmCountLastYear,
        boardMeetingsLastYear: mergedData.boardMeetingsLastYear,
        email: mergedData.email,
        optedIntoLeaderboard: mergedData.optedIntoLeaderboard,
        facilitatorId: mergedData.facilitatorId,
        scoreResult: {
          upsert: {
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
            update: {
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
              calculatedAt: new Date(),
            },
          },
        },
      },
      include: { scoreResult: true },
    });

    return NextResponse.json({
      id: updated.id,
      overallScore: scoreResult.overallScore,
      band: scoreResult.band,
      factorScores: scoreResult.factorScores,
      narrativeSummary: scoreResult.narrativeSummary,
      suggestions: scoreResult.suggestions,
      dataCompletenessFlag: scoreResult.dataCompletenessFlag,
      fpoGroupId: updated.fpoGroupId,
      optedIntoLeaderboard: updated.optedIntoLeaderboard,
      facilitatorId: updated.facilitatorId,
      calculatedAt: scoreResult.calculatedAt,
    });
  } catch (error) {
    console.error('Error in PATCH /api/fpo/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}