import { describe, it, expect } from 'vitest';
import {
  aggregateRowsToCsv,
  buildAggregateRows,
  MIN_SUBMISSIONS_PER_DISTRICT,
  MIN_SUBMISSIONS_PER_CELL,
  ScoredSubmission,
} from '../lib/research-export';

function scored(
  state: string,
  district: string,
  registrationType: string,
  band: string,
  factorBase: number
): ScoredSubmission {
  return {
    state,
    district,
    registrationType,
    scoreResult: {
      band,
      overallScore: factorBase,
      membershipScore: factorBase,
      revenueStabilityScore: factorBase + 1,
      costEfficiencyScore: factorBase + 2,
      diversificationScore: factorBase,
      marketLinkageScore: factorBase + 1,
      governanceScore: factorBase + 2,
    },
  };
}

describe('Researcher Export (Final Feature PRD 1.1)', () => {
  it('never exposes a district below the submission threshold', () => {
    const rows = buildAggregateRows([
      scored('Jharkhand', 'Sparse', 'Producer Company', 'Moderate', 60),
      scored('Jharkhand', 'Sparse', 'Producer Company', 'Moderate', 65),
      scored('Jharkhand', 'Sparse', 'Cooperative', 'Moderate', 62),
    ]);
    expect(rows).toHaveLength(0);
  });

  it('emits a district only once it clears the per-district threshold', () => {
    const submissions = Array.from({ length: MIN_SUBMISSIONS_PER_DISTRICT }, (_, i) =>
      scored('Jharkhand', 'Ranchi', 'Producer Company', 'Moderate', 60 + i)
    );
    const rows = buildAggregateRows(submissions);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].district).toBe('Ranchi');
    expect(rows[0].submissionCount).toBe(MIN_SUBMISSIONS_PER_DISTRICT);
    expect(rows[0].avgOverallScore).toBeCloseTo(62, 1);
  });

  it('suppresses sparse (registrationType × band) cells within a qualifying district', () => {
    const submissions = Array.from({ length: 5 }, (_, i) =>
      scored('Bihar', 'Patna', 'Producer Company', 'Moderate', 60 + i)
    );
    submissions.push(
      scored('Bihar', 'Patna', 'Cooperative', 'Strong', 85),
      scored('Bihar', 'Patna', 'Cooperative', 'Strong', 86)
    );
    const rows = buildAggregateRows(submissions);
    const cooperatives = rows.filter((r) => r.registrationType === 'Cooperative');
    expect(rows.some((r) => r.registrationType === 'Producer Company')).toBe(true);
    expect(cooperatives).toHaveLength(0);
  });

  it('averages factor scores and overall score per cell', () => {
    const submissions = Array.from({ length: 6 }, () =>
      scored('Maharashtra', 'Nagpur', 'Society', 'Developing', 50)
    );
    const rows = buildAggregateRows(submissions);
    const row = rows[0];
    expect(row.submissionCount).toBe(6);
    expect(row.avgOverallScore).toBe(50);
    expect(row.avgFactorScores.revenueStability).toBe(51);
    expect(row.avgFactorScores.costEfficiency).toBe(52);
  });

  it('ignores submissions without a score result', () => {
    const rows = buildAggregateRows([
      {
        state: 'Jharkhand',
        district: 'Ranchi',
        registrationType: 'Producer Company',
        scoreResult: null,
      },
      ...Array.from({ length: 5 }, () =>
        scored('Jharkhand', 'Ranchi', 'Producer Company', 'Moderate', 60)
      ),
    ]);
    expect(rows.reduce((sum, r) => sum + r.submissionCount, 0)).toBe(5);
  });

  it('produces a well-formed CSV with header and averaged values', () => {
    const rows = buildAggregateRows(
      Array.from({ length: 5 }, () =>
        scored('Jharkhand', 'Ranchi', 'Producer Company', 'Moderate', 60)
      )
    );
    const csv = aggregateRowsToCsv(rows);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(
      'state,district,registrationType,band,submissionCount,avgOverallScore,avgMembershipScore,avgRevenueStabilityScore,avgCostEfficiencyScore,avgDiversificationScore,avgMarketLinkageScore,avgGovernanceScore'
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Jharkhand');
    expect(lines[1]).toContain('60');
  });

  it('respects the minimum cell threshold constant used by the API', () => {
    expect(MIN_SUBMISSIONS_PER_DISTRICT).toBe(5);
    expect(MIN_SUBMISSIONS_PER_CELL).toBe(5);
  });
});