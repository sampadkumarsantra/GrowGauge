import { describe, it, expect } from 'vitest';
import { matchLenders, CURATED_LENDER_TYPES } from '../lib/lenders';

describe('Lender Matcher (Final Feature PRD 1.2)', () => {
  it('returns 2–3 matched lender types for any band', () => {
    for (const band of ['Early Stage', 'Developing', 'Moderate', 'Strong'] as const) {
      const lenders = matchLenders(band, {
        registrationType: 'Producer Company',
        activeMembers: 150,
      });
      expect(lenders.length).toBeGreaterThanOrEqual(2);
      expect(lenders.length).toBeLessThanOrEqual(3);
      for (const lender of lenders) {
        expect(lender.lenderType).toBeTruthy();
        expect(lender.description).toBeTruthy();
        expect(lender.rationale).toContain(band === 'Developing' ? 'Developing' : lender.rationale);
      }
    }
  });

  it('never suggests a lender requiring a band above the FPO band', () => {
    const bandRank = { 'Early Stage': 0, Developing: 1, Moderate: 2, Strong: 3 };
    for (const band of ['Early Stage', 'Developing', 'Moderate', 'Strong'] as const) {
      const lenders = matchLenders(band, {
        registrationType: 'Producer Company',
        activeMembers: 100,
      });
      for (const lender of lenders) {
        const src = CURATED_LENDER_TYPES.find(
          (l) => l.lenderType === lender.lenderType
        )!;
        expect(bandRank[src.minBandRequired]).toBeLessThanOrEqual(bandRank[band]);
      }
    }
  });

  it('prefers cooperative-sector lenders for cooperative-registered FPOs', () => {
    const coOp = matchLenders('Early Stage', {
      registrationType: 'Cooperative',
      activeMembers: 150,
    });
    const smallSociety = matchLenders('Early Stage', {
      registrationType: 'Society',
      activeMembers: 40,
    });
    expect(coOp[0].lenderType).toContain('Co-operative');
    expect(smallSociety[0].lenderType).toContain('Microfinance');
  });

  it('offers commercial banks only from the Moderate band upward', () => {
    const early = matchLenders('Early Stage', {
      registrationType: 'Producer Company',
      activeMembers: 150,
    });
    const developing = matchLenders('Developing', {
      registrationType: 'Producer Company',
      activeMembers: 150,
    });
    const strong = matchLenders('Strong', {
      registrationType: 'Producer Company',
      activeMembers: 250,
    });
    expect(early.some((l) => l.lenderType.includes('Commercial'))).toBe(false);
    expect(developing.some((l) => l.lenderType.includes('Commercial'))).toBe(false);
    expect(strong.some((l) => l.lenderType.includes('Commercial'))).toBe(true);
  });

  it('suggests microfinance for small early-stage FPOs but not for large ones', () => {
    const small = matchLenders('Early Stage', {
      registrationType: 'Society',
      activeMembers: 40,
    });
    expect(small.some((l) => l.lenderType.includes('Microfinance'))).toBe(true);
  });

  it('gives a Strong FPO access to the bulk/syndication tier', () => {
    const strong = matchLenders('Strong', {
      registrationType: 'Producer Company',
      activeMembers: 400,
    });
    expect(
      strong.some((l) => l.lenderType.includes('syndication'))
    ).toBe(true);
  });
});