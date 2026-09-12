export const MARK_PALETTE = {
  ink: '#1E2A1F',
  turmeric: '#C1861A',
  paper: '#F1F0E6',
  leaf: '#2E7D32',
} as const;

export type MarkLayout = 'full' | 'simplified' | 'horizontal' | 'stacked';
export type MarkColor = 'full' | 'ink' | 'paper';

const ICON_VIEW = '0 0 48 48';
const HORIZONTAL_VIEW = '0 0 272 48';
const STACKED_VIEW = '0 0 120 88';

const ARC_D =
  'M10.92 37.08 A18.5 18.5 0 1 1 38.97 13.13';

const STEM_D = 'M24 30.5 L24 18';
const LEAF_LEFT_D =
  'M24 22 C19.4 17.6 14.4 19 14.4 23 C14.4 24.6 17.4 25.3 21 24.2 C22.4 23.8 23.4 23 24 22.2';
const LEAF_RIGHT_D =
  'M24 22 C28.6 17.6 33.6 19 33.6 23 C33.6 24.6 30.6 25.3 27 24.2 C25.6 23.8 24.6 23 24 22.2';

const TICKS: [number, number, number, number][] = [
  [44.5, 24, 47.5, 24],
  [38.49, 38.49, 40.61, 40.61],
  [24, 44.5, 24, 47.5],
  [9.51, 38.49, 7.39, 40.61],
  [3.5, 24, 0.5, 24],
  [9.51, 9.51, 7.39, 7.39],
  [24, 3.5, 24, 0.5],
  [38.49, 9.51, 40.61, 7.39],
];

function palette(color: MarkColor) {
  if (color === 'ink') {
    return { ring: MARK_PALETTE.ink, arc: MARK_PALETTE.ink, seed: MARK_PALETTE.leaf, tick: MARK_PALETTE.ink, word: MARK_PALETTE.ink };
  }
  if (color === 'paper') {
    return { ring: MARK_PALETTE.paper, arc: MARK_PALETTE.paper, seed: MARK_PALETTE.paper, tick: MARK_PALETTE.paper, word: MARK_PALETTE.paper };
  }
  return {
    ring: MARK_PALETTE.ink,
    arc: MARK_PALETTE.turmeric,
    seed: MARK_PALETTE.leaf,
    tick: MARK_PALETTE.ink,
    word: MARK_PALETTE.ink,
  };
}

function ring(p: ReturnType<typeof palette>): string {
  return `<circle cx="24" cy="24" r="18.5" fill="none" stroke="${p.ring}" stroke-width="4"/>`;
}

function arc(p: ReturnType<typeof palette>): string {
  return `<path d="${ARC_D}" fill="none" stroke="${p.arc}" stroke-width="4" stroke-linecap="round"/>`;
}

function ticks(p: ReturnType<typeof palette>): string {
  return TICKS.map(
    ([x1, y1, x2, y2], i) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.tick}" stroke-width="2.2" stroke-linecap="round" opacity="${i % 4 === 0 ? 1 : 0.85}"/>`
  ).join('');
}

function seedling(p: ReturnType<typeof palette>, weight: number): string {
  return `<g fill="none" stroke="${p.seed}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${weight}">
  <path d="${LEAF_LEFT_D}"/>
  <path d="${LEAF_RIGHT_D}"/>
  <path d="${STEM_D}"/>
</g>`;
}

function iconParts(layout: MarkLayout, p: ReturnType<typeof palette>): string {
  if (layout === 'simplified') {
    return `${ring(p)}${arc(p)}${seedling(p, 3)}`;
  }
  return `${ring(p)}${arc(p)}${ticks(p)}${seedling(p, 2.75)}`;
}

export function renderMarkParts(layout: MarkLayout, color: MarkColor = 'full'): string {
  const p = palette(color);
  if (layout === 'horizontal') {
    return `${iconParts('full', p)}${wordmark(64, 33, 32, 'start', p)}`;
  }
  if (layout === 'stacked') {
    return `<g transform="translate(36 0)">${iconParts('full', p)}</g>${wordmark(60, 78, 22, 'middle', p)}`;
  }
  return iconParts(layout, p);
}

function wordmark(x: number, y: number, size: number, anchor: string, p: ReturnType<typeof palette>): string {
  return `<text x="${x}" y="${y}" font-family="Zilla Slab, Georgia, serif" font-weight="600" font-size="${size}" text-anchor="${anchor}" letter-spacing="0.5" fill="${p.word}">GrowGauge</text>`;
}

/**
 * Renders the GrowGauge brand mark in one of the six defined layouts:
 *   full / simplified / horizontal / stacked, each usable in the full
 *   two-tone (Ink + Turmeric) rendering or a single Ink / Paper color.
 */
export function renderMarkSvg(layout: MarkLayout, color: MarkColor = 'full'): string {
  const parts = renderMarkParts(layout, color);
  switch (layout) {
    case 'full':
    case 'simplified':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEW}">${parts}</svg>`;
    case 'horizontal':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${HORIZONTAL_VIEW}">${parts}</svg>`;
    case 'stacked':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${STACKED_VIEW}">${parts}</svg>`;
  }
}