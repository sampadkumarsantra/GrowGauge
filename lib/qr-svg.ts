import QRCode from 'qrcode';

/**
 * Renders a QR code as an inline SVG `<g>` group of module rectangles.
 * Uses the pure-matrix API so no native canvas is required server-side.
 */
export function qrModuleSvg(value: string, opts: { scale?: number; color?: string } = {}): {
  size: number;
  svg: string;
} {
  const scale = opts.scale ?? 6;
  const color = opts.color ?? '#14532d';
  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;

  const rects: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const bit = data[row * size + col];
      if (bit) {
        rects.push(
          `<rect x="${col * scale}" y="${row * scale}" width="${scale}" height="${scale}" fill="${color}"/>`
        );
      }
    }
  }

  return { size: size * scale, svg: `<g>${rects.join('')}</g>` };
}