import { FactorScores } from './scoring';

interface Scheme {
  name: string;
  eligibilityTags: string[];
  description: string;
  link: string;
}

export const CURATED_SCHEMES: Scheme[] = [
  {
    name: 'e-NAM (electronic National Agriculture Market)',
    eligibilityTags: ['low-marketLinkage'],
    description:
      'Onboard to the electronic National Agriculture Market for transparent price discovery and pan-India buyer reach for your produce.',
    link: 'https://www.enam.gov.in/',
  },
  {
    name: 'NABARD Interest Subvention on FPO Credit',
    eligibilityTags: ['low-governance', 'low-costEfficiency'],
    description:
      'Access interest subvention (effective rate significantly below commercial lending) on working capital loans for FPOs that maintain audited accounts and formal governance.',
    link: 'https://www.nabard.org/',
  },
  {
    name: 'Venture Capital Assistance (SFAC)',
    eligibilityTags: ['low-membership', 'low-diversification'],
    description:
      'Venture / equity support from SFAC for FPOs with a bankable project to fund aggregation, processing, and infrastructure expansion.',
    link: 'https://www.sfacindia.com/',
  },
  {
    name: 'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
    eligibilityTags: ['low-diversification'],
    description:
      'Capital subsidy for FPOs entering food processing, grading, packaging and value-addition across the agri-horticulture supply chain.',
    link: 'https://pmfme.mofpi.gov.in/',
  },
  {
    name: 'Agricultural Marketing Infrastructure (AMI) Fund',
    eligibilityTags: ['low-marketLinkage', 'low-costEfficiency'],
    description:
      'NABARD-subsidised credit for building marketing, aggregation and post-harvest infrastructure such as cold storage and packhouses.',
    link: 'https://www.nabard.org/',
  },
  {
    name: 'Agri Infrastructure Fund (AIF)',
    eligibilityTags: ['low-costEfficiency', 'low-revenueStability'],
    description:
      'Long-term concessional debt from the NABARD/DAC scheme for developing farm-gate storage, customs clearance and logistics infrastructure.',
    link: 'https://agriinfra.dac.gov.in/',
  },
  {
    name: 'FPO Facilitation & Capacity Building (SFAC/CBBO)',
    eligibilityTags: ['low-membership', 'low-governance'],
    description:
      'Dedicated hand-holding support through SFAC Cluster Based Business Organizations (CBBOs) to strengthen FPO governance, financial discipline and member mobilisation.',
    link: 'https://www.sfacindia.com/',
  },
];

function factorScoreToTag(factor: keyof FactorScores, score: number): string | null {
  if (score < 50) return `low-${factor}`;
  return null;
}

export interface MatchedScheme {
  name: string;
  description: string;
  link: string;
  matchedTags: string[];
  score: number;
}

export function matchSchemes(
  factorScores: FactorScores,
  registrationType: string
): MatchedScheme[] {
  const profileTags: string[] = [];

  (Object.keys(factorScores) as (keyof FactorScores)[]).forEach((factor) => {
    const tag = factorScoreToTag(factor, factorScores[factor]);
    if (tag) profileTags.push(tag);
  });

  if (profileTags.length === 0) {
    return CURATED_SCHEMES.map((s) => ({
      name: s.name,
      description: s.description,
      link: s.link,
      matchedTags: [],
      score: 0,
    }));
  }

  const scored: MatchedScheme[] = CURATED_SCHEMES.map((scheme) => {
    const matched = profileTags.filter((t) => scheme.eligibilityTags.includes(t));
    return {
      name: scheme.name,
      description: scheme.description,
      link: scheme.link,
      matchedTags: matched,
      score: matched.length,
    };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored.slice(0, 3) : [];
}