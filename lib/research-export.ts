import { FactorScores } from './scoring';

/**
 * Anonymized aggregate export for researchers.
 *
 * Only district-level aggregates that clear the disclosure thresholds are ever
 * emitted. No submission-level field (FPO name, access token, email, exact
 * financials) is included, so no individual FPO can be re-identified.
 */
export const MIN_SUBMISSIONS_PER_DISTRICT = 5;
export const MIN_SUBMISSIONS_PER_CELL = 5;

export interface AggregateRow {
  state: string;
  district: string;
  registrationType: string;
  band: string;
  submissionCount: number;
  avgOverallScore: number;
  avgFactorScores: FactorScores;
}

export interface ScoredSubmission {
  state: string;
  district: string;
  registrationType: string;
  scoreResult: {
    band: string;
    overallScore: number;
    membershipScore: number;
    revenueStabilityScore: number;
    costEfficiencyScore: number;
    diversificationScore: number;
    marketLinkageScore: number;
    governanceScore: number;
  } | null;
}

const FACTOR_KEYS = [
  'membership',
  'revenueStability',
  'costEfficiency',
  'diversification',
  'marketLinkage',
  'governance',
] as const;

type FactorKey = (typeof FACTOR_KEYS)[number];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

interface Cell {
  state: string;
  district: string;
  registrationType: string;
  band: string;
  count: number;
  sumOverall: number;
  sums: Record<FactorKey, number>;
}

interface ScoredResult {
  band: string;
  overallScore: number;
  membershipScore: number;
  revenueStabilityScore: number;
  costEfficiencyScore: number;
  diversificationScore: number;
  marketLinkageScore: number;
  governanceScore: number;
}

function emptySums(): Record<FactorKey, number> {
  return {
    membership: 0,
    revenueStability: 0,
    costEfficiency: 0,
    diversification: 0,
    marketLinkage: 0,
    governance: 0,
  };
}

/**
 * Pure aggregation: turns scored submissions into disclosure-controlled rows.
 * A row is emitted only when its district has at least
 * MIN_SUBMISSIONS_PER_DISTRICT scored submissions AND the specific
 * (registrationType × band) cell has at least MIN_SUBMISSIONS_PER_CELL.
 */
export function buildAggregateRows(submissions: ScoredSubmission[]): AggregateRow[] {
  const districtTotals = new Map<string, number>();
  const cells = new Map<string, Cell>();

  for (const submission of submissions) {
    const result = submission.scoreResult as ScoredResult | null | undefined;
    if (!result) continue;

    const districtKey = `${submission.state}|${submission.district}`;
    districtTotals.set(districtKey, (districtTotals.get(districtKey) ?? 0) + 1);

    const cellKey = `${districtKey}|${submission.registrationType}|${result.band}`;
    let cell = cells.get(cellKey);
    if (!cell) {
      cell = {
        state: submission.state,
        district: submission.district,
        registrationType: submission.registrationType,
        band: result.band,
        count: 0,
        sumOverall: 0,
        sums: emptySums(),
      };
      cells.set(cellKey, cell);
    }

    cell.count += 1;
    cell.sumOverall += result.overallScore;
    cell.sums.membership += result.membershipScore;
    cell.sums.revenueStability += result.revenueStabilityScore;
    cell.sums.costEfficiency += result.costEfficiencyScore;
    cell.sums.diversification += result.diversificationScore;
    cell.sums.marketLinkage += result.marketLinkageScore;
    cell.sums.governance += result.governanceScore;
  }

  const rows: AggregateRow[] = [];
  for (const cell of cells.values()) {
    const districtTotal = districtTotals.get(`${cell.state}|${cell.district}`) ?? 0;
    if (cell.count < MIN_SUBMISSIONS_PER_CELL) continue;
    if (districtTotal < MIN_SUBMISSIONS_PER_DISTRICT) continue;

    const avgFactorScores = {} as FactorScores;
    for (const key of FACTOR_KEYS) {
      avgFactorScores[key] = round1(cell.sums[key] / cell.count);
    }

    rows.push({
      state: cell.state,
      district: cell.district,
      registrationType: cell.registrationType,
      band: cell.band,
      submissionCount: cell.count,
      avgOverallScore: round1(cell.sumOverall / cell.count),
      avgFactorScores,
    });
  }

  rows.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    if (a.district !== b.district) return a.district.localeCompare(b.district);
    if (a.registrationType !== b.registrationType) {
      return a.registrationType.localeCompare(b.registrationType);
    }
    return a.band.localeCompare(b.band);
  });

  return rows;
}

const CSV_HEADERS = [
  'state',
  'district',
  'registrationType',
  'band',
  'submissionCount',
  'avgOverallScore',
  'avgMembershipScore',
  'avgRevenueStabilityScore',
  'avgCostEfficiencyScore',
  'avgDiversificationScore',
  'avgMarketLinkageScore',
  'avgGovernanceScore',
];

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function aggregateRowsToCsv(rows: AggregateRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.state,
        row.district,
        row.registrationType,
        row.band,
        row.submissionCount,
        row.avgOverallScore,
        row.avgFactorScores.membership,
        row.avgFactorScores.revenueStability,
        row.avgFactorScores.costEfficiency,
        row.avgFactorScores.diversification,
        row.avgFactorScores.marketLinkage,
        row.avgFactorScores.governance,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  return `${lines.join('\n')}\n`;
}