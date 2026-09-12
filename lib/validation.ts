import { FPOSubmissionInput } from './scoring';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export function validateFPOSubmission(data: Partial<FPOSubmissionInput>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Step 1: Org Basics
  if (!data.fpoName || data.fpoName.trim().length === 0) {
    errors.push({ field: 'fpoName', message: 'FPO name is required.' });
  }
  if (!data.state || data.state.trim().length === 0) {
    errors.push({ field: 'state', message: 'State is required.' });
  }
  if (!data.district || data.district.trim().length === 0) {
    errors.push({ field: 'district', message: 'District is required.' });
  }
  if (!data.registrationType) {
    errors.push({ field: 'registrationType', message: 'Registration type is required.' });
  }

  // Step 2: Membership
  if (data.activeMembers === undefined || data.activeMembers === null || Number(data.activeMembers) <= 0) {
    errors.push({ field: 'activeMembers', message: 'Active members must be greater than 0.' });
  }
  if (data.members2YrAgo === undefined || data.members2YrAgo === null || Number(data.members2YrAgo) < 0) {
    errors.push({ field: 'members2YrAgo', message: 'Members 2 years ago must be 0 or greater.' });
  }

  // Step 3: Financials
  if (data.revenueYear1 === undefined || data.revenueYear1 === null || isNaN(Number(data.revenueYear1)) || Number(data.revenueYear1) <= 0) {
    errors.push({ field: 'revenueYear1', message: 'Revenue for at least Year 1 is required and must be greater than 0.' });
  }
  if (data.costYear1 === undefined || data.costYear1 === null || isNaN(Number(data.costYear1)) || Number(data.costYear1) < 0) {
    errors.push({ field: 'costYear1', message: 'Cost for Year 1 must be 0 or greater.' });
  }

  // Step 4: Products
  if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
    errors.push({ field: 'products', message: 'At least one product or crop must be specified.' });
  } else {
    let sumShare = 0;
    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i];
      if (!p.name || p.name.trim().length === 0) {
        errors.push({ field: `products[${i}].name`, message: `Product ${i + 1} name is required.` });
      }
      if (p.revenueSharePct === undefined || p.revenueSharePct === null || isNaN(Number(p.revenueSharePct)) || Number(p.revenueSharePct) < 0) {
        errors.push({ field: `products[${i}].revenueSharePct`, message: `Product ${i + 1} share must be 0% or greater.` });
      } else {
        sumShare += Number(p.revenueSharePct);
      }
    }
    if (Math.abs(sumShare - 100) > 2) {
      warnings.push(`Product revenue shares sum to ${sumShare.toFixed(1)}%. It is recommended to total approximately 100%.`);
    }
  }

  // Step 5: Market Linkage
  if (data.activeBuyersCount === undefined || data.activeBuyersCount === null || Number(data.activeBuyersCount) < 0) {
    errors.push({ field: 'activeBuyersCount', message: 'Active buyers count must be 0 or greater.' });
  }
  if (data.contractSalesPct === undefined || data.contractSalesPct === null || Number(data.contractSalesPct) < 0 || Number(data.contractSalesPct) > 100) {
    errors.push({ field: 'contractSalesPct', message: 'Contract sales percentage must be between 0% and 100%.' });
  }
  if (data.estimatedPriceRealizationPct !== undefined && data.estimatedPriceRealizationPct !== null && data.estimatedPriceRealizationPct !== ('' as unknown)) {
    const pr = Number(data.estimatedPriceRealizationPct);
    if (isNaN(pr) || pr < 0 || pr > 100) {
      errors.push({ field: 'estimatedPriceRealizationPct', message: 'Estimated price realization must be between 0% and 100% if provided.' });
    }
  }

  // Step 6: Governance
  if (typeof data.auditedAccounts !== 'boolean') {
    errors.push({ field: 'auditedAccounts', message: 'Audited accounts status is required.' });
  }
  if (data.agmCountLastYear === undefined || data.agmCountLastYear === null || Number(data.agmCountLastYear) < 0) {
    errors.push({ field: 'agmCountLastYear', message: 'AGM count must be 0 or greater.' });
  }
  if (data.boardMeetingsLastYear === undefined || data.boardMeetingsLastYear === null || Number(data.boardMeetingsLastYear) < 0) {
    errors.push({ field: 'boardMeetingsLastYear', message: 'Board meetings count must be 0 or greater.' });
  }

  if (data.facilitatorId !== undefined && data.facilitatorId !== null && typeof data.facilitatorId !== 'string') {
    errors.push({ field: 'facilitatorId', message: 'Facilitator reference must be a valid identifier.' });
  }

  if (data.optedIntoLeaderboard !== undefined && typeof data.optedIntoLeaderboard !== 'boolean') {
    errors.push({ field: 'optedIntoLeaderboard', message: 'Leaderboard preference must be true or false.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
