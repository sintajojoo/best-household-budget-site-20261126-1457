// Hand-drawn SVG charts from the same data the tables use — no library,
// so the first load stays tiny and every bar always matches its number.
import { money0 } from './format.js';

const PALETTE = ['#1d5c3f', '#c98a1b', '#3f6d8e', '#8e4a3f', '#5b7a4a', '#7a5b8e', '#4a7a7a', '#a85b2a', '#6b6b6b', '#2f4858', '#96703a'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// Donut of spending by category (savings excluded — it is a transfer, not spending).
export function donutSVG(segments, size = 200) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 14, inner = r * 0.62;
  let a0 = -Math.PI / 2;
  let paths = '';
  segments.forEach((s, i) => {
    const frac = s.value / total;
    const a1 = a0 + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a0), yi0 = cy + inner * Math.sin(a0);
    paths += `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${xi1.toFixed(1)} ${yi1.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${xi0.toFixed(1)} ${yi0.toFixed(1)} Z" fill="${PALETTE[i % PALETTE.length]}"><title>${esc(s.label)} ${money0(s.value)}</title></path>`;
    a0 = a1;
  });
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category, total ${money0(total)}" width="${size}" height="${size}">${paths}<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="15" font-weight="700" fill="#22301f">${money0(total)}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#5a6b57">spent in Nov</text></svg>`;
}

// Grouped bars: income vs spending per month, with saved as a thin marker.
export function trendSVG(history, width = 560, height = 190) {
  const max = Math.max(...history.map((h) => h.income)) * 1.05;
  const padL = 46, padB = 22, padT = 12;
  const iw = width - padL - 8, ih = height - padT - padB;
  const bw = iw / history.length;
  const y = (v) => padT + ih - (v / max) * ih;
  let out = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Income versus spending, last six months" width="100%" height="${height}">`;
  for (let g = 0; g <= 4; g++) {
    const v = (max / 1.05 / 4) * g;
    out += `<line x1="${padL}" y1="${y(v)}" x2="${width - 8}" y2="${y(v)}" stroke="#e3ddc8" stroke-width="1"/><text x="${padL - 5}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="#7a7563">$${Math.round(v / 1000)}k</text>`;
  }
  history.forEach((h, i) => {
    const x = padL + i * bw + bw * 0.14;
    const w = bw * 0.3;
    out += `<rect x="${x.toFixed(1)}" y="${y(h.income).toFixed(1)}" width="${w.toFixed(1)}" height="${(ih - (y(h.income) - padT)).toFixed(1)}" rx="2" fill="#1d5c3f"><title>${h.month} income ${money0(h.income)}</title></rect>`;
    out += `<rect x="${(x + w + 3).toFixed(1)}" y="${y(h.spending).toFixed(1)}" width="${w.toFixed(1)}" height="${(ih - (y(h.spending) - padT)).toFixed(1)}" rx="2" fill="#c98a1b"><title>${h.month} spending ${money0(h.spending)}</title></rect>`;
    out += `<text x="${(padL + i * bw + bw / 2).toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="10" fill="#5a6b57">${h.month}</text>`;
  });
  out += `<g font-size="10" fill="#5a6b57"><rect x="${padL}" y="2" width="9" height="9" fill="#1d5c3f"/><text x="${padL + 13}" y="10">Income</text><rect x="${padL + 62}" y="2" width="9" height="9" fill="#c98a1b"/><text x="${padL + 75}" y="10">Spending</text></g>`;
  return out + '</svg>';
}

// Horizontal budget bars, one row per category.
export function budgetBar(spent, budget) {
  const ratio = budget > 0 ? spent / budget : 0;
  const w = Math.min(ratio, 1) * 100;
  const over = ratio > 1;
  const cls = over ? 'bar over' : ratio > 0.9 ? 'bar warm' : 'bar';
  return `<div class="${cls}"><span style="width:${w.toFixed(1)}%"></span></div>`;
}
