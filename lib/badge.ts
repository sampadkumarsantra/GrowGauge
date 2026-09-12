import { ScoreBand } from './scoring';
import { qrModuleSvg } from './qr-svg';

export interface BadgeData {
  fpoName: string;
  band: ScoreBand;
  assessedDate: string;
  verifyUrl: string;
}

const BAND_COLORS: Record<ScoreBand, { color: string; label: string }> = {
  Strong: { color: '#3F6B45', label: 'Strong' },
  Moderate: { color: '#2F3E5C', label: 'Moderate' },
  Developing: { color: '#1E2A1F', label: 'Developing' },
  'Early Stage': { color: '#A85736', label: 'Early Stage' },
};

/**
 * Produces a shareable SVG badge: FPO name, score band, assessment date and a
 * QR code linking to the public verification page. Contains band + date only —
 * never raw financials or the numeric score, mirroring the /verify contract.
 */
export function renderBadgeSvg(data: BadgeData): string {
  const W = 720;
  const H = 360;
  const qr = qrModuleSvg(data.verifyUrl, { scale: 5, color: '#1E2A1F' });
  const qrSize = 180;
  const qrX = W - 40 - qrSize;
  const qrY = H / 2 - qrSize / 2;

  const band = BAND_COLORS[data.band];
  const date = new Date(data.assessedDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const documentedName = (data.fpoName || 'FPO').replace(/[<>&"]/g, '').slice(0, 42);

  const fontSizeName = documentedName.length > 28 ? 26 : 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#F1F0E6"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#D8D6C6" stroke-width="2"/>
  <rect x="36" y="36" width="22" height="6" fill="#C1861A"/>
  <text x="36" y="${H - 214}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#2F3E5C" font-weight="bold" letter-spacing="2">GrowGauge Verified Assessment</text>
  <text x="36" y="${H - 190}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#747D74">Band and assessment date only · never financial data</text>
  <text x="36" y="${Math.max(150, H - 140)}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSizeName}" fill="#1E2A1F" font-weight="bold">${documentedName}</text>
  <text x="36" y="${H - 108}" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${band.color}" font-weight="bold">${band.label}</text>
  <text x="36" y="${H - 84}" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#565F58">Assessed on ${date}</text>
  <text x="36" y="${H - 64}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#747D74">Scan to verify score band &amp; assessment date</text>
  <g transform="translate(${qrX} ${qrY})">${qr.svg}</g>
  <rect x="${qrX - 8}" y="${qrY - 8}" width="${qrSize + 16}" height="${qrSize + 16}" fill="none" stroke="#D8D6C6" stroke-width="1"/>
</svg>`;
}