import { ScoreBand } from './scoring';

export interface LenderType {
  lenderType: string;
  minBandRequired: ScoreBand;
  description: string;
  typicalUseCase: string;
  /* Tags used to nudge relevant lender types ahead for a given profile. */
  focus: Array<'cooperative' | 'microfinance' | 'commercial' | 'priority'>;
}

export interface MatchedLender {
  lenderType: string;
  description: string;
  typicalUseCase: string;
  rationale: string;
}

export interface LenderProfile {
  registrationType: string;
  activeMembers: number;
}

const BAND_RANK: Record<ScoreBand, number> = {
  'Early Stage': 0,
  Developing: 1,
  Moderate: 2,
  Strong: 3,
};

export const CURATED_LENDER_TYPES: LenderType[] = [
  {
    lenderType: 'District Central Co-operative Bank (DCCB)',
    minBandRequired: 'Early Stage',
    description:
      'Member-owned district-level co-operative bank serving primary agricultural credit societies and FPOs.',
    typicalUseCase:
      'Entry-point institutional credit for cooperative-registered FPOs: crop loans, working capital, and one-window access to district co-operative structures.',
    focus: ['cooperative'],
  },
  {
    lenderType: 'Microfinance institution / NBFC-MFI',
    minBandRequired: 'Early Stage',
    description:
      'Small-loan lender focused on farmer livelihood groups and early-stage collectives.',
    typicalUseCase:
      'Bridge credit while institutional records, audits, and governance practices develop — repaid as the FPO formalises.',
    focus: ['microfinance'],
  },
  {
    lenderType: 'Regional Rural Bank (RRB)',
    minBandRequired: 'Developing',
    description:
      'Government-owned bank with a rural lending mandate under the Regional Rural Banks Act, 1976.',
    typicalUseCase:
      'Rural-focused term and working-capital credit aligned to priority-sector lending targets, with accessible branch networks in block headquarters.',
    focus: ['priority'],
  },
  {
    lenderType: 'NABARD refinance-backed lending (via sponsor bank)',
    minBandRequired: 'Developing',
    description:
      'Working capital and investment credit refinanced under NABARD schemes such as the FPO credit facility.',
    typicalUseCase:
      'Capital for aggregation, godowns and processing where audited accounts already exist — typically routed through a sponsor bank.',
    focus: ['priority'],
  },
  {
    lenderType: 'Small Finance Bank (SFB)',
    minBandRequired: 'Moderate',
    description:
      'Schedule-bank licence with a mandate to serve small businesses and formalising farmer enterprises.',
    typicalUseCase:
      'A formal banking relationship (savings plus credit) for mid-stage FPOs moving from project loans to repeat borrowing.',
    focus: ['commercial'],
  },
  {
    lenderType: 'Private / Scheduled Commercial Bank',
    minBandRequired: 'Moderate',
    description:
      'Mainstream commercial bank with an agri-business vertical and priority-sector obligations.',
    typicalUseCase:
      'Larger structured credit lines — term loans, ODs, and trade finance — for credit-ready FPOs with audited financials and a bankable project.',
    focus: ['commercial'],
  },
  {
    lenderType: 'Priority-sector commercial credit (bulk / syndication)',
    minBandRequired: 'Strong',
    description:
      'Large structured agri-credit facilities, often syndicated, for the most credit-ready collectives.',
    typicalUseCase:
      'Multi-crore working-capital and infrastructure facilities for Strong-band FPOs pursuing major aggregation or processing investments.',
    focus: ['commercial', 'priority'],
  },
];

function focusBoost(lender: LenderType, profile: LenderProfile): number {
  let boost = 0;
  const reg = profile.registrationType.toLowerCase();
  const members = profile.activeMembers || 0;

  if (reg.includes('cooperative') && lender.focus.includes('cooperative')) boost += 1;
  if (members < 100 && lender.focus.includes('microfinance')) boost += 1;
  if (members >= 200 && lender.focus.includes('commercial')) boost += 1;
  if (members >= 300 && lender.focus.includes('priority')) boost += 1;

  return boost;
}

/**
 * Suggests 2–3 realistic lender types for an FPO based on its credit-readiness
 * band and basic profile. Mirrors the curated, low-risk pattern of the
 * government Scheme Matcher: no live integration, no scoring-engine changes.
 */
export function matchLenders(
  band: ScoreBand,
  profile: LenderProfile
): MatchedLender[] {
  const rank = BAND_RANK[band] ?? 0;

  const eligible = CURATED_LENDER_TYPES.filter(
    (l) => BAND_RANK[l.minBandRequired] <= rank
  );

  const evaluated = eligible.map((lender) => ({
    lender,
    boost: focusBoost(lender, profile),
  }));

  // Prefer lenders whose tier matches the FPO band most closely (higher-tier
  // options become relevant as the band rises), then apply the profile boost
  // as a tiebreaker for same-tier lenders, keeping the curated order stable.
  evaluated.sort((a, b) => {
    const diff =
      BAND_RANK[b.lender.minBandRequired] - BAND_RANK[a.lender.minBandRequired];
    if (diff !== 0) return diff;
    if (b.boost !== a.boost) return b.boost - a.boost;
    return (
      CURATED_LENDER_TYPES.indexOf(a.lender) -
      CURATED_LENDER_TYPES.indexOf(b.lender)
    );
  });

  return evaluated.slice(0, 3).map(({ lender }) => ({
    lenderType: lender.lenderType,
    description: lender.description,
    typicalUseCase: lender.typicalUseCase,
    rationale: `Matched to your ${band} credit-readiness profile. ${lender.typicalUseCase}`,
  }));
}