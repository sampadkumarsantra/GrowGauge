import { calculateScore, FactorScores, FPOSubmissionInput } from './scoring';

export type RoadmapStage = '0-30 days' | '30-90 days' | '90+ days';

export interface RoadmapItemSpec {
  stageLabel: RoadmapStage;
  actionText: string;
  targetFactor: keyof FactorScores;
  estimatedScoreImpact: number;
}

interface ActionTemplate {
  stageLabel: RoadmapStage;
  actionText: (sub: FPOSubmissionInput) => string;
  apply: (sub: FPOSubmissionInput) => FPOSubmissionInput;
}

const FACTOR_NAMES: Record<keyof FactorScores, string> = {
  membership: 'Membership Strength',
  revenueStability: 'Revenue Stability',
  costEfficiency: 'Cost Efficiency',
  diversification: 'Product Diversification',
  marketLinkage: 'Market Linkage',
  governance: 'Governance & Compliance',
};

const ACTION_TEMPLATES: Record<keyof FactorScores, ActionTemplate[]> = {
  membership: [
    {
      stageLabel: '0-30 days',
      actionText: (sub) =>
        `Mobilise new farmer members to cross the 200-member commercial scale threshold (currently ${sub.activeMembers}).`,
      apply: (sub) => ({ ...sub, activeMembers: Math.max(200, sub.activeMembers) }),
    },
    {
      stageLabel: '30-90 days',
      actionText: (sub) =>
        `Stabilise shareholder retention so renewals match last year's base (${sub.members2YrAgo}) and prevent patronage churn.`,
      apply: (sub) => ({ ...sub, activeMembers: Math.max(sub.activeMembers, sub.members2YrAgo) }),
    },
    {
      stageLabel: '90+ days',
      actionText: () =>
        'Scale membership past 300 shareholders to qualify for larger institutional credit tranches and strengthen aggregate bargaining power.',
      apply: (sub) => ({ ...sub, activeMembers: 300 }),
    },
  ],
  revenueStability: [
    {
      stageLabel: '0-30 days',
      actionText: () =>
        'Secure pre-harvest forward supply agreements covering the dominant crop to reduce year-on-year revenue swings.',
      apply: (sub) => {
        const years = [sub.revenueYear1, sub.revenueYear2 ?? null, sub.revenueYear3 ?? null].filter(
          (v) => v != null
        ) as number[];
        const mean = years.reduce((s, v) => s + v, 0) / years.length;
        return {
          ...sub,
          revenueYear1: mean,
          revenueYear2: sub.revenueYear2 != null ? mean : null,
          revenueYear3: sub.revenueYear3 != null ? mean : null,
        };
      },
    },
    {
      stageLabel: '30-90 days',
      actionText: () =>
        'Introduce monthly revenue and cash-flow tracking so seasonal dips are forecast and smoothed across quarters.',
      apply: (sub) => {
        const years = [sub.revenueYear1, sub.revenueYear2 ?? null, sub.revenueYear3 ?? null].filter(
          (v) => v != null
        ) as number[];
        const mean = years.reduce((s, v) => s + v, 0) / years.length;
        const target = (mean + sub.revenueYear1) / 2;
        return {
          ...sub,
          revenueYear1: target,
          revenueYear2: sub.revenueYear2 != null ? mean : null,
          revenueYear3: sub.revenueYear3 != null ? mean : null,
        };
      },
    },
    {
      stageLabel: '90+ days',
      actionText: () =>
        'Develop multi-season storage and staggered sale timing so harvest gluts no longer destabilise annual turnover.',
      apply: (sub) => {
        const years = [sub.revenueYear1, sub.revenueYear2 ?? null, sub.revenueYear3 ?? null].filter(
          (v) => v != null
        ) as number[];
        const mean = years.reduce((s, v) => s + v, 0) / years.length;
        return {
          ...sub,
          revenueYear1: mean,
          revenueYear2: sub.revenueYear2 != null ? mean : null,
          revenueYear3: sub.revenueYear3 != null ? mean : null,
        };
      },
    },
  ],
  costEfficiency: [
    {
      stageLabel: '0-30 days',
      actionText: () =>
        'Centralise bulk input procurement for the entire membership to capture volume discounts and cut unit costs.',
      apply: (sub) => ({
        ...sub,
        costYear1: sub.costYear1 * 0.9,
        costYear2: sub.costYear2 != null ? sub.costYear2 * 0.9 : null,
        costYear3: sub.costYear3 != null ? sub.costYear3 * 0.9 : null,
      }),
    },
    {
      stageLabel: '30-90 days',
      actionText: () =>
        'Optimise post-harvest handling, transport and processing losses to move the operating ratio below 0.80.',
      apply: (sub) => ({
        ...sub,
        costYear1: sub.costYear1 * 0.8,
        costYear2: sub.costYear2 != null ? sub.costYear2 * 0.8 : null,
        costYear3: sub.costYear3 != null ? sub.costYear3 * 0.8 : null,
      }),
    },
    {
      stageLabel: '90+ days',
      actionText: () =>
        'Reach the benchmark operating ratio of 0.70 (lower is better) through sustained cost discipline — the level top-performing lenders reward.',
      apply: (sub) => ({
        ...sub,
        costYear1: sub.revenueYear1 * 0.7,
        costYear2: sub.revenueYear2 != null ? sub.revenueYear2 * 0.7 : null,
        costYear3: sub.revenueYear3 != null ? sub.revenueYear3 * 0.7 : null,
      }),
    },
  ],
  diversification: [
    {
      stageLabel: '0-30 days',
      actionText: (sub) =>
        `Add one secondary crop or product line to break reliance on ${sub.products?.[0]?.name ?? 'your primary crop'}.`,
      apply: (sub) => {
        const products = [...(sub.products ?? [])];
        const topIdx = products.reduce((ix, p, i) => (p.revenueSharePct > products[ix].revenueSharePct ? i : ix), 0);
        if (products.length === 1) {
          products[0] = { ...products[0], revenueSharePct: 70 };
          return { ...sub, products: [...products, { name: 'Secondary Crop', revenueSharePct: 30 }] };
        }
        products[topIdx] = { ...products[topIdx], revenueSharePct: products[topIdx].revenueSharePct - 20 };
        return { ...sub, products: [...products, { name: 'Secondary Crop', revenueSharePct: 20 }] };
      },
    },
    {
      stageLabel: '30-90 days',
      actionText: () =>
        'Introduce a third revenue stream (new crop or allied activity) to further lower concentration risk.',
      apply: (sub) => {
        const products = [...(sub.products ?? [])];
        const topIdx = products.reduce((ix, p, i) => (p.revenueSharePct > products[ix].revenueSharePct ? i : ix), 0);
        const others = products.map((p, i) => ({ p, i })).filter(({ i }) => i !== topIdx);
        const shareTaken = others.length > 0 ? 10 : 20;
        let lastIdx = topIdx;
        if (others.length > 0) {
          const second = others.reduce((max, cur) => (cur.p.revenueSharePct > max.p.revenueSharePct ? cur : max));
          lastIdx = second.i;
        }
        products[lastIdx] = {
          ...products[lastIdx],
          revenueSharePct: (products[lastIdx].revenueSharePct || 60) - shareTaken,
        };
        return { ...sub, products: [...products, { name: 'Value-Added Line', revenueSharePct: shareTaken }] };
      },
    },
    {
      stageLabel: '90+ days',
      actionText: () =>
        'Develop value-addition / processing for the leading crop so the FPO captures margin beyond raw commodity sales.',
      apply: (sub) => {
        const products = [...(sub.products ?? [])];
        const topIdx = products.reduce((ix, p, i) => (p.revenueSharePct > products[ix].revenueSharePct ? i : ix), 0);
        products[topIdx] = { ...products[topIdx], revenueSharePct: (products[topIdx].revenueSharePct || 60) - 15 };
        return { ...sub, products: [...products, { name: 'Processed / Value-Added', revenueSharePct: 15 }] };
      },
    },
  ],
  marketLinkage: [
    {
      stageLabel: '0-30 days',
      actionText: (sub) =>
        `Sign on new off-takers to grow the buyer base beyond the current ${sub.activeBuyersCount} and reduce single-buyer dependence.`,
      apply: (sub) => ({ ...sub, activeBuyersCount: 10 }),
    },
    {
      stageLabel: '30-90 days',
      actionText: (sub) =>
        `Convert a larger share of sales into written forward contracts (currently ${sub.contractSalesPct}%).`,
      apply: (sub) => ({ ...sub, contractSalesPct: 70 }),
    },
    {
      stageLabel: '90+ days',
      actionText: (sub) =>
        `Capture a greater share of the consumer rupee through grading, packing and direct channel sales (currently ${sub.estimatedPriceRealizationPct ?? 'unknown'}%).`,
      apply: (sub) => ({
        ...sub,
        estimatedPriceRealizationPct: Math.min(90, (sub.estimatedPriceRealizationPct ?? 50) + 15),
      }),
    },
  ],
  governance: [
    {
      stageLabel: '0-30 days',
      actionText: () =>
        'Commission and complete an independent statutory financial audit by a chartered accountant.',
      apply: (sub) => ({ ...sub, auditedAccounts: true }),
    },
    {
      stageLabel: '30-90 days',
      actionText: () =>
        'Hold quarterly board meetings with documented minutes (at least 4 per year).',
      apply: (sub) => ({ ...sub, boardMeetingsLastYear: 4 }),
    },
    {
      stageLabel: '90+ days',
      actionText: () =>
        'Conduct an Annual General Meeting with verified shareholder attendance and file statutory returns on time.',
      apply: (sub) => ({ ...sub, agmCountLastYear: 1 }),
    },
  ],
};

function simulateImpact(base: FPOSubmissionInput, modified: FPOSubmissionInput): number {
  try {
    const baseScore = calculateScore(base);
    const modifiedScore = calculateScore(modified);
    const impact = modifiedScore.overallScore - baseScore.overallScore;
    return Math.round(Math.max(0, impact) * 10) / 10;
  } catch {
    return 0;
  }
}

export function getWeakestFactors(factorScores: FactorScores): (keyof FactorScores)[] {
  return (Object.keys(factorScores) as (keyof FactorScores)[])
    .sort((a, b) => factorScores[a] - factorScores[b])
    .slice(0, 2);
}

export function generateRoadmap(
  submission: FPOSubmissionInput,
  factorScores: FactorScores
): RoadmapItemSpec[] {
  const weakest = getWeakestFactors(factorScores);

  const items: RoadmapItemSpec[] = [];
  for (const factor of weakest) {
    for (const template of ACTION_TEMPLATES[factor]) {
      const modified = template.apply(submission);
      items.push({
        stageLabel: template.stageLabel,
        actionText: template.actionText(submission),
        targetFactor: factor,
        estimatedScoreImpact: simulateImpact(submission, modified),
      });
    }
  }
  return items;
}

export const ROADMAP_FACTOR_NAMES = FACTOR_NAMES;

export const ROADMAP_STAGES: RoadmapStage[] = ['0-30 days', '30-90 days', '90+ days'];