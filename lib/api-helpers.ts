import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { FPOSubmissionInput } from './scoring';

export interface AuthorizedResult {
  status: null;
  submission: import('@prisma/client').FPOSubmission & {
    scoreResult: import('@prisma/client').ScoreResult | null;
  };
}

export interface UnauthorizedResult {
  status: number;
  body: { error: string };
}

export function getAccessToken(req: NextRequest): string | null {
  return req.nextUrl.searchParams.get('token');
}

/**
 * Loads a submission authorized by its private access token (?token=...).
 * This is the only authorization path now that accounts are not used: the
 * scorecard link (with its embedded token) is the proof of access.
 */
export async function loadAuthorizedSubmission(
  id: string,
  token: string | null
): Promise<AuthorizedResult | UnauthorizedResult> {
  const submission = await prisma.fPOSubmission.findUnique({
    where: { id },
    include: { scoreResult: true },
  });

  if (!submission) {
    return { status: 404, body: { error: 'FPO submission not found' } };
  }

  if (token && submission.accessToken === token) {
    return { status: null, submission };
  }

  if (!token) {
    return {
      status: 401,
      body: { error: 'Unauthorized: accessToken is required as query parameter (?token=...)' },
    };
  }

  return { status: 403, body: { error: 'Forbidden: Invalid access token' } };
}

export function hydrateSubmission(
  submission: import('@prisma/client').FPOSubmission
): FPOSubmissionInput {
  let products: FPOSubmissionInput['products'] = [];
  try {
    products = JSON.parse(submission.products);
  } catch {
    products = [];
  }

  return {
    fpoName: submission.fpoName,
    state: submission.state,
    district: submission.district,
    registrationType: submission.registrationType,
    activeMembers: submission.activeMembers,
    members2YrAgo: submission.members2YrAgo,
    revenueYear1: submission.revenueYear1,
    revenueYear2: submission.revenueYear2,
    revenueYear3: submission.revenueYear3,
    costYear1: submission.costYear1,
    costYear2: submission.costYear2,
    costYear3: submission.costYear3,
    products,
    activeBuyersCount: submission.activeBuyersCount,
    contractSalesPct: submission.contractSalesPct,
    estimatedPriceRealizationPct: submission.estimatedPriceRealizationPct,
    auditedAccounts: submission.auditedAccounts,
    agmCountLastYear: submission.agmCountLastYear,
    boardMeetingsLastYear: submission.boardMeetingsLastYear,
    email: submission.email,
    fpoGroupId: submission.fpoGroupId,
    facilitatorId: submission.facilitatorId,
    optedIntoLeaderboard: submission.optedIntoLeaderboard,
  };
}

export function factorScoresFromResult(scoreResult: {
  membershipScore: number;
  revenueStabilityScore: number;
  costEfficiencyScore: number;
  diversificationScore: number;
  marketLinkageScore: number;
  governanceScore: number;
}): import('./scoring').FactorScores {
  return {
    membership: scoreResult.membershipScore,
    revenueStability: scoreResult.revenueStabilityScore,
    costEfficiency: scoreResult.costEfficiencyScore,
    diversification: scoreResult.diversificationScore,
    marketLinkage: scoreResult.marketLinkageScore,
    governance: scoreResult.governanceScore,
  };
}