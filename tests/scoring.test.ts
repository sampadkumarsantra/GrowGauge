import { describe, it, expect } from 'vitest';
import { calculateScore, FPOSubmissionInput } from '../lib/scoring';

describe('FPO Scoring Engine (PRD Section 10 & Appendix A)', () => {
  it('Profile 1: Established, diversified FPO should score in "Strong" band (>= 80)', () => {
    const profile1: FPOSubmissionInput = {
      fpoName: 'Green Valley Farmers Producer Co',
      state: 'Jharkhand',
      district: 'Ranchi',
      registrationType: 'Producer Company',
      activeMembers: 300,
      members2YrAgo: 250,
      revenueYear1: 5500000,
      revenueYear2: 5200000,
      revenueYear3: 4800000,
      costYear1: 3800000,
      costYear2: 3600000,
      costYear3: 3400000,
      products: [
        { name: 'Paddy', revenueSharePct: 40 },
        { name: 'Vegetables', revenueSharePct: 35 },
        { name: 'Pulses', revenueSharePct: 25 },
      ],
      activeBuyersCount: 8,
      contractSalesPct: 60,
      estimatedPriceRealizationPct: 62,
      auditedAccounts: true,
      agmCountLastYear: 1,
      boardMeetingsLastYear: 6,
    };

    const result = calculateScore(profile1);

    expect(result.band).toBe('Strong');
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    // HHI = 0.40^2 + 0.35^2 + 0.25^2 = 0.16 + 0.1225 + 0.0625 = 0.345
    // Diversification score = (1 - 0.345) * 100 = 65.5
    expect(result.factorScores.diversification).toBe(65.5);
    expect(result.dataCompletenessFlag).toBe(false);
    expect(result.factorScores.governance).toBe(100);
  });

  it('Profile 2: New, single-crop FPO should score in "Early Stage" band (< 40) with dataCompletenessFlag=true', () => {
    const profile2: FPOSubmissionInput = {
      fpoName: 'Kisan Uday FPO',
      state: 'Jharkhand',
      district: 'Hazaribagh',
      registrationType: 'Cooperative',
      activeMembers: 60,
      members2YrAgo: 0,
      revenueYear1: 1200000,
      revenueYear2: null,
      revenueYear3: null,
      costYear1: 1000000,
      costYear2: null,
      costYear3: null,
      products: [{ name: 'Paddy', revenueSharePct: 100 }],
      activeBuyersCount: 1,
      contractSalesPct: 0,
      estimatedPriceRealizationPct: null, // omitted
      auditedAccounts: false,
      agmCountLastYear: 0,
      boardMeetingsLastYear: 1,
    };

    const result = calculateScore(profile2);

    expect(result.band).toBe('Early Stage');
    expect(result.overallScore).toBeLessThan(40);
    expect(result.dataCompletenessFlag).toBe(true);
    // HHI = 1.0^2 = 1.0 -> (1 - 1) * 100 = 0
    expect(result.factorScores.diversification).toBe(0);
    // Fallback market linkage path without price realization:
    // buyer_score = min(1/10, 1)*50 = 5, contract_score = 0
    expect(result.factorScores.marketLinkage).toBe(5);
  });

  it('Profile 3: Mid-stage moderate FPO matches Section 10 worked calculation and "Moderate" band', () => {
    const profile3: FPOSubmissionInput = {
      fpoName: 'Sample FPO',
      state: 'Jharkhand',
      district: 'Ranchi',
      registrationType: 'Producer Company',
      activeMembers: 150,
      members2YrAgo: 120,
      revenueYear1: 4200000,
      revenueYear2: 3800000,
      revenueYear3: 3500000,
      costYear1: 3100000,
      costYear2: 2900000,
      costYear3: 2700000,
      products: [
        { name: 'Paddy', revenueSharePct: 70 },
        { name: 'Vegetables', revenueSharePct: 30 },
      ],
      activeBuyersCount: 4,
      contractSalesPct: 40,
      estimatedPriceRealizationPct: 55,
      auditedAccounts: true,
      agmCountLastYear: 1,
      boardMeetingsLastYear: 5,
    };

    const result = calculateScore(profile3);

    expect(result.band).toBe('Moderate');
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);

    // HHI = 0.70^2 + 0.30^2 = 0.49 + 0.09 = 0.58 -> diversification = 42
    expect(result.factorScores.diversification).toBe(42);

    // Market linkage with price realization:
    // min(4/10, 1)*30 + 0.40*30 + 55*0.4 = 12 + 12 + 22 = 46
    expect(result.factorScores.marketLinkage).toBe(46);

    // Operating ratio ~ 0.757 -> cost_efficiency ~ 85.8
    expect(result.factorScores.costEfficiency).toBeCloseTo(85.8, 0);

    // Governance: audited (40) + AGM (30) + Board (30) = 100
    expect(result.factorScores.governance).toBe(100);

    expect(result.dataCompletenessFlag).toBe(false);
  });

  it('Edge case: zero members2YrAgo should default retention rate to 1.0 gracefully', () => {
    const edgeSub: FPOSubmissionInput = {
      fpoName: 'Brand New FPO',
      state: 'Bihar',
      district: 'Patna',
      registrationType: 'Producer Company',
      activeMembers: 100,
      members2YrAgo: 0,
      revenueYear1: 2000000,
      costYear1: 1500000,
      products: [{ name: 'Maize', revenueSharePct: 100 }],
      activeBuyersCount: 2,
      contractSalesPct: 20,
      auditedAccounts: true,
      agmCountLastYear: 1,
      boardMeetingsLastYear: 4,
    };

    const result = calculateScore(edgeSub);
    // Size score: min(100/200, 1) * 50 = 25
    // Retention score: min(1.0, 1.2) / 1.2 * 50 = 1.0 / 1.2 * 50 = 41.67
    // Total membership: 25 + 41.67 = 66.67 -> ~66.7
    expect(result.factorScores.membership).toBeCloseTo(66.7, 0);
  });
});
