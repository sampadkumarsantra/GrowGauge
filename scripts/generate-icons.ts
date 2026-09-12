import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { renderMarkParts, renderMarkSvg } from '../lib/growgauge-mark';

const OUT = path.join(process.cwd(), 'public');

function rasterize(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true },
  });
  return resvg.render().asPng();
}

function write(name: string, data: Buffer | string) {
  fs.writeFileSync(path.join(OUT, name), data);
  const kb = Buffer.isBuffer(data) ? (data.byteLength / 1024).toFixed(1) : data.length;
  console.log(`wrote ${name} (${Buffer.isBuffer(data) ? `${kb} KB` : `${kb} chars`})`);
}

// Favicon / PWA set — simplified icon, full two-tone colour.
const simpleSvg = renderMarkSvg('simplified', 'full');
write('icon-16.png', rasterize(simpleSvg, 16));
write('icon-32.png', rasterize(simpleSvg, 32));
write('apple-touch-icon.png', rasterize(simpleSvg, 180));
write('icon-512.png', rasterize(simpleSvg, 512));

// Refined SVG masters — all six variants of the logo & brand mark.
write('growgauge-mark.svg', renderMarkSvg('simplified', 'full'));
write('growgauge-icon.svg', renderMarkSvg('full', 'full'));
write('growgauge-lockup.svg', renderMarkSvg('horizontal', 'full'));
write('growgauge-stacked.svg', renderMarkSvg('stacked', 'full'));
write('growgauge-ink.svg', renderMarkSvg('simplified', 'ink'));
write('growgauge-paper.svg', renderMarkSvg('simplified', 'paper'));

// Monochrome Ink raster for the PDF report header (react-pdf cannot render the web component).
write('growgauge-ink.png', rasterize(renderMarkSvg('simplified', 'ink'), 256));

// Social share / link-preview image — stacked lockup on Paper, 1200×630.
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F1F0E6"/>
<g transform="translate(492 140) scale(1.8)">${renderMarkParts('stacked', 'full')}</g>
<text x="600" y="452" font-family="Public Sans, Segoe UI, sans-serif" font-weight="500" font-size="30" text-anchor="middle" fill="#565F58">FPO Credit-Readiness Scorecard</text>
<text x="600" y="496" font-family="Public Sans, Segoe UI, sans-serif" font-weight="400" font-size="19" text-anchor="middle" fill="#747D74">Open-methodology diagnostic — no login, just clarity before the bank visit</text>
</svg>`;
write('opengraph.png', rasterize(ogSvg, 1200));

console.log('done.');