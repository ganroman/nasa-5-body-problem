import qrcode from '../../vendor/qrcode/qrcode.mjs';
import { html, raw } from './html.mjs';

const QUIET_MODULES = 4;

/** A QR code as inline SVG, written at build time. Dark modules are one path on a white tile so any scanner reads it on the dark page. */
export function qrSvg(text, label) {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();
  const count = code.getModuleCount();
  const cells = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (code.isDark(row, col)) cells.push(`M${col + QUIET_MODULES} ${row + QUIET_MODULES}h1v1h-1z`);
    }
  }
  const size = count + QUIET_MODULES * 2;
  return html`<svg class="pp-qr__svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}" shape-rendering="crispEdges" focusable="false"><rect width="${size}" height="${size}" fill="#ffffff"/>${raw(`<path d="${cells.join('')}" fill="#0b1628"/>`)}</svg>`;
}
