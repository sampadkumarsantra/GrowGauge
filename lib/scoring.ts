/**
 * Pure, stateless scoring engine for Farmer Producer Organizations (FPOs).
 * Implemented strictly according to PRD Version 3.3 (Section 10).
 *
 * Scoring factors:
 * 1. Membership Strength (15%): Size score + Retention score
 * 2. Revenue Stability (20%): Coefficient of Variation (CV = std_dev / mean)
 * 3. Cost-to-Revenue Efficiency (20%): Operating Ratio (avg_cost / avg_revenue)
 * 4. Diversification (15%): Herfindahl-Hirschman Index (HHI = Σ(share_i)^2)
 * 5. Market Linkage Strength (15%): Buyer base + Contract share + optional Farmer's Share of Consumer Rupee
 * 6. Governance & Compliance (15%): Audited accounts + AGM + Board meetings
 */

import { generateNarrativeAndSuggestions } from './narrative-templates';

export interface ProductRevenueShare {
  name: string;
  revenueSharePct: number; // 0 to 100
}

export interface FPOSubmissionInput {
  fpoName: string;
  state: string;
  district: string;
  registrationType: 'Producer Company' | 'Cooperative' | 'Society' | string;
  activeMembers: number;
  members2YrAgo: number;
  revenueYear1: number;
  revenueYear2?: number | null;
  revenueYear3?: number | null;
  costYear1: number;
  costYear2?: number | null;
  costYear3?: number | null;
  products: ProductRevenueShare[];
  activeBuyersCount: number;
  contractSalesPct: number;
  estimatedPriceRealizationPct?: number | null;
  auditedAccounts: boolean;
  agmCountLastYear: number;
  boardMeetingsLastYear: number;
  email?: string | null;
  fpoGroupId?: string | null;
  facilitatorId?: string | null;
  optedIntoLeaderboard?: boolean;
}

export type ScoreBand = 'Strong' | 'Moderate' | 'Developing' | 'Early Stage';

export interface FactorScores {
  membership: number;
  revenueStability: number;
  costEfficiency: number;
  diversification: number;
  marketLinkage: number;
  governance: number;
}

export interface ScoreResult {
  overallScore: number;
  band: ScoreBand;
  factorScores: FactorScores;
  narrativeSummary: string;
  suggestions: string[];
  dataCompletenessFlag: boolean;
  calculatedAt?: string;
}

/**
 * Calculates standard deviation.
 * For sample N > 1, uses sample standard deviation (N - 1 denominator).
 * If N === 1, returns 0.
 */
function calculateStdDev(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (values.length === 1) {
    // With only 1 year of data, sample standard deviation is undefined (N - 1 = 0).
    // In economic risk analysis, a single observation represents maximum dispersion uncertainty (CV = 1.0).
    return { mean, stdDev: mean };
  }
  const sumSquaredDiffs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const sampleVariance = sumSquaredDiffs / (values.length - 1);
  return { mean, stdDev: Math.sqrt(sampleVariance) };
}

/**
 * Pure function to calculate FPO health score.
 * Never executes side effects or database calls.
 */
export function calculateScore(submission: FPOSubmissionInput): ScoreResult {
  // --- 1. Membership Strength (weight 15%) ---
  const activeMembers = Math.max(0, submission.activeMembers || 0);
  const members2YrAgo = Math.max(0, submission.members2YrAgo || 0);

  // retention_rate = members2YrAgo > 0 ? min(activeMembers / members2YrAgo, 1.5) : 1.0
  const retentionRate = members2YrAgo > 0 ? Math.min(activeMembers / members2YrAgo, 1.5) : 1.0;
  const sizeScore = Math.min(activeMembers / 200, 1.0) * 50;
  const retentionScore = (Math.min(retentionRate, 1.2) / 1.2) * 50;
  const membershipScore = Math.min(100, Math.max(0, sizeScore + retentionScore));

  // --- 2. Revenue Stability (weight 20%) ---
  // Coefficient of Variation (CV) = std_dev / mean
  const revenueYears: number[] = [];
  if (submission.revenueYear1 != null && !isNaN(submission.revenueYear1)) revenueYears.push(Number(submission.revenueYear1));
  if (submission.revenueYear2 != null && !isNaN(submission.revenueYear2)) revenueYears.push(Number(submission.revenueYear2));
  if (submission.revenueYear3 != null && !isNaN(submission.revenueYear3)) revenueYears.push(Number(submission.revenueYear3));

  const dataCompletenessFlag = revenueYears.length < 3;
  const { mean: meanRevenue, stdDev: stdDevRevenue } = calculateStdDev(revenueYears);

  const coefficientOfVariation = meanRevenue > 0 ? stdDevRevenue / meanRevenue : 1.0;
  const rawRevenueStability = Math.max(0, 100 - (coefficientOfVariation * 100));
  const revenueStabilityScore = Math.min(100, rawRevenueStability);

  // --- 3. Cost-to-Revenue Efficiency (weight 20%) ---
  // Operating Ratio = avg_cost / avg_revenue (lower is better)
  const costYears: number[] = [];
  if (submission.revenueYear1 != null && submission.costYear1 != null && !isNaN(submission.costYear1)) {
    costYears.push(Number(submission.costYear1));
  }
  if (submission.revenueYear2 != null && submission.costYear2 != null && !isNaN(submission.costYear2)) {
    costYears.push(Number(submission.costYear2));
  }
  if (submission.revenueYear3 != null && submission.costYear3 != null && !isNaN(submission.costYear3)) {
    costYears.push(Number(submission.costYear3));
  }

  const avgCost = costYears.length > 0 ? costYears.reduce((sum, c) => sum + c, 0) / costYears.length : (submission.costYear1 || 0);
  const operatingRatio = meanRevenue > 0 ? avgCost / meanRevenue : 1.0;
  // cost_efficiency_score = max(0, min(100, (1.1 - operating_ratio) / 0.4 * 100))
  const costEfficiencyScore = Math.max(0, Math.min(100, ((1.1 - operatingRatio) / 0.4) * 100));

  // --- 4. Diversification (weight 15%) ---
  // Herfindahl-Hirschman Index: HHI = Σ(share_i)^2
  const products = Array.isArray(submission.products) && submission.products.length > 0
    ? submission.products
    : [{ name: 'Primary Product', revenueSharePct: 100 }];

  // Normalize shares if sum differs noticeably, or use directly
  const totalSharePct = products.reduce((sum, p) => sum + (p.revenueSharePct || 0), 0);
  const normalizer = totalSharePct > 0 ? totalSharePct : 100;

  const hhi = products.reduce((acc, p) => {
    const normalizedShare = (p.revenueSharePct || 0) / normalizer;
    return acc + Math.pow(normalizedShare, 2);
  }, 0);

  const diversificationScore = Math.max(0, Math.min(100, (1 - hhi) * 100));

  // --- 5. Market Linkage Strength (weight 15%) ---
  const activeBuyersCount = Math.max(0, submission.activeBuyersCount || 0);
  const contractSalesPct = Math.max(0, Math.min(100, submission.contractSalesPct || 0));

  const buyerScore = Math.min(activeBuyersCount / 10, 1.0) * 50;
  const contractScore = (contractSalesPct / 100) * 50;

  let marketLinkageScore: number;
  const hasPriceRealization = submission.estimatedPriceRealizationPct != null &&
    !isNaN(Number(submission.estimatedPriceRealizationPct)) &&
    Number(submission.estimatedPriceRealizationPct) >= 0;

  if (hasPriceRealization) {
    const priceRealizationScore = Math.min(100, Math.max(0, Number(submission.estimatedPriceRealizationPct)));
    marketLinkageScore = (Math.min(activeBuyersCount / 10, 1.0) * 30) +
                         ((contractSalesPct / 100) * 30) +
                         (priceRealizationScore * 0.4);
  } else {
    // Fallback: 50/50 split
    marketLinkageScore = buyerScore + contractScore;
  }
  marketLinkageScore = Math.max(0, Math.min(100, marketLinkageScore));

  // --- 6. Governance & Compliance (weight 15%) ---
  const auditedPoints = submission.auditedAccounts ? 40 : 0;
  const agmCount = Math.max(0, submission.agmCountLastYear || 0);
  const boardMeetings = Math.max(0, submission.boardMeetingsLastYear || 0);

  const agmPoints = Math.min(agmCount / 1, 1.0) * 30;
  const boardPoints = Math.min(boardMeetings / 4, 1.0) * 30;
  const governanceScore = Math.max(0, Math.min(100, auditedPoints + agmPoints + boardPoints));

  // --- Overall Composite Score (Weighted Composite Index) ---
  const overall = (membershipScore * 0.15) +
                  (revenueStabilityScore * 0.20) +
                  (costEfficiencyScore * 0.20) +
                  (diversificationScore * 0.15) +
                  (marketLinkageScore * 0.15) +
                  (governanceScore * 0.15);

  const roundedOverall = Math.round(overall * 10) / 10;

  // Band classification
  let band: ScoreBand;
  if (roundedOverall >= 80) {
    band = 'Strong';
  } else if (roundedOverall >= 60) {
    band = 'Moderate';
  } else if (roundedOverall >= 40) {
    band = 'Developing';
  } else {
    band = 'Early Stage';
  }

  const factorScores: FactorScores = {
    membership: Math.round(membershipScore * 10) / 10,
    revenueStability: Math.round(revenueStabilityScore * 10) / 10,
    costEfficiency: Math.round(costEfficiencyScore * 10) / 10,
    diversification: Math.round(diversificationScore * 10) / 10,
    marketLinkage: Math.round(marketLinkageScore * 10) / 10,
    governance: Math.round(governanceScore * 10) / 10,
  };

  const { narrativeSummary, suggestions } = generateNarrativeAndSuggestions(
    factorScores,
    submission,
    band
  );

  return {
    overallScore: roundedOverall,
    band,
    factorScores,
    narrativeSummary,
    suggestions,
    dataCompletenessFlag,
    calculatedAt: new Date().toISOString(),
  };
}
