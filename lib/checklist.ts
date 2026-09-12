export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

const COMMON_ITEMS: Omit<ChecklistItem, 'id'>[] = [
  { label: 'FPO registration / incorporation certificate (valid, with latest renewal)', required: true },
  { label: 'PAN card of the FPO', required: true },
  { label: 'Compendium of governing documents (MoA/AoA or Bye-laws / Rules & Regulations)', required: true },
  { label: 'Audited financial statements for the last 2–3 financial years', required: true },
  { label: 'Auditor\'s report and tax filings (latest income-tax returns)', required: true },
  { label: 'Bank statement of the FPO current account (last 6–12 months)', required: true },
  { label: 'Board resolution authorising the loan application and naming signatories', required: true },
  { label: 'Register of active farmer members / shareholders', required: true },
  { label: 'Details of existing borrowings and repayment track record, if any', required: false },
  { label: 'Project/utilisation proposal if applying for a term loan', required: false },
];

const TYPE_SPECIFIC_ITEMS: Record<string, Omit<ChecklistItem, 'id'>[]> = {
  'Producer Company': [
    { label: 'Certificate of Incorporation under Part IXA (Chapter XXIA) of the Companies Act', required: true },
    { label: 'Memorandum & Articles of Association (with latest amendments)', required: true },
    { label: 'Annual statutory filings with Registrar of Companies (MGT-7/AOC-4)', required: true },
  ],
  Cooperative: [
    { label: 'Registration certificate under the State Co-operative Societies Act', required: true },
    { label: 'Bye-laws with all amendments duly registered', required: true },
    { label: 'Annual returns submitted to the Registrar of Co-operative Societies', required: true },
  ],
  Society: [
    { label: 'Registration certificate under the Societies Registration Act, 1860', required: true },
    { label: 'Memorandum of Association, Rules & Regulations of the Society', required: true },
    { label: 'Annual general body report and list of the managing committee', required: true },
  ],
};

export function getChecklistItems(registrationType: string): ChecklistItem[] {
  const typeItems =
    TYPE_SPECIFIC_ITEMS[registrationType] ?? TYPE_SPECIFIC_ITEMS['Producer Company'];
  const all: Omit<ChecklistItem, 'id'>[] = [...typeItems, ...COMMON_ITEMS];
  return all.map((item, idx) => ({ ...item, id: `item-${idx + 1}` }));
}