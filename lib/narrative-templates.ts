import { FactorScores, FPOSubmissionInput, ScoreBand } from './scoring';

interface FactorMeta {
  key: keyof FactorScores;
  name: string;
  score: number;
}

const FACTOR_NAMES: Record<keyof FactorScores, string> = {
  membership: 'Membership Strength',
  revenueStability: 'Revenue Stability',
  costEfficiency: 'Cost Efficiency',
  diversification: 'Product Diversification',
  marketLinkage: 'Market Linkage',
  governance: 'Governance & Compliance',
};

const SUGGESTIONS_MAP: Record<keyof FactorScores, (sub: FPOSubmissionInput, score: number) => string> = {
  membership: (sub) => {
    if (sub.activeMembers < 200) {
      return `Mobilize new farmer members to reach at least 200 active shareholders, qualifying your FPO for larger institutional credit tranches.`;
    }
    return `Strengthen member retention programs and input patronage rebates to prevent shareholder attrition.`;
  },
  revenueStability: () => {
    return `Establish forward sales commitments and aggregate produce earlier in the season to reduce revenue volatility between agricultural cycles.`;
  },
  costEfficiency: () => {
    return `Improve your operating ratio by centralizing bulk input procurement and optimizing post-harvest handling costs to retain a higher margin.`;
  },
  diversification: (sub) => {
    const topProduct = sub.products?.[0]?.name || 'primary crop';
    return `Diversify beyond ${topProduct} into complementary crops or value-added processing to lower concentration risk (HHI).`;
  },
  marketLinkage: (sub) => {
    if (sub.activeBuyersCount < 5) {
      return `Expand your off-taker network beyond ${sub.activeBuyersCount} buyer${sub.activeBuyersCount === 1 ? '' : 's'} and formalize written supply contracts.`;
    }
    return `Increase the share of pre-agreed contract sales above ${sub.contractSalesPct}% to secure assured off-take before harvest.`;
  },
  governance: (sub) => {
    if (!sub.auditedAccounts) {
      return `Complete an independent statutory financial audit; audited balance sheets are a prerequisite for institutional bank loans.`;
    }
    if (sub.boardMeetingsLastYear < 4) {
      return `Hold regular quarterly board meetings (at least 4 per year) with documented minutes to demonstrate active management oversight.`;
    }
    return `Conduct an Annual General Meeting (AGM) with verified shareholder attendance to maintain formal statutory compliance.`;
  },
};

export function generateNarrativeAndSuggestions(
  factorScores: FactorScores,
  submission: FPOSubmissionInput,
  band: ScoreBand
): { narrativeSummary: string; suggestions: string[] } {
  const factorList: FactorMeta[] = (Object.keys(factorScores) as (keyof FactorScores)[]).map((key) => ({
    key,
    name: FACTOR_NAMES[key],
    score: factorScores[key],
  }));

  // Sort ascending by score to find weakest factors
  factorList.sort((a, b) => a.score - b.score);

  const weakest1 = factorList[0];
  const weakest2 = factorList[1];
  const strongest = factorList[factorList.length - 1];

  let narrativePrefix = '';
  switch (band) {
    case 'Strong':
      narrativePrefix = `Your FPO demonstrates robust institutional and financial fundamentals, positioning it well for formal bank credit.`;
      break;
    case 'Moderate':
      narrativePrefix = `Your FPO shows dependable operating capability and healthy performance in key areas like ${strongest.name}, but lender credit readiness is constrained by specific operational bottlenecks.`;
      break;
    case 'Developing':
      narrativePrefix = `Your FPO exhibits promising operational activity, but needs structured improvements in core financial discipline and market links before commercial lenders can extend working capital loans.`;
      break;
    case 'Early Stage':
      narrativePrefix = `Your FPO is in an early developmental phase with significant scope to institutionalize governance, diversify product streams, and stabilize cash flows.`;
      break;
  }

  const narrativeDetail = `Performance is anchored by ${strongest.name} (${strongest.score}/100). However, your credit readiness is currently weighted down by ${weakest1.name} (${weakest1.score}/100) and ${weakest2.name} (${weakest2.score}/100). Addressing these two priority areas will deliver the fastest improvement in your overall bankability.`;

  const narrativeSummary = `${narrativePrefix} ${narrativeDetail}`;

  // Suggestions: generated from the 2 or 3 weakest factors
  const suggestions: string[] = [
    SUGGESTIONS_MAP[weakest1.key](submission, weakest1.score),
    SUGGESTIONS_MAP[weakest2.key](submission, weakest2.score),
  ];

  // If third weakest is also below 70, add it
  const weakest3 = factorList[2];
  if (weakest3 && weakest3.score < 70) {
    suggestions.push(SUGGESTIONS_MAP[weakest3.key](submission, weakest3.score));
  }

  return { narrativeSummary, suggestions };
}
