// Bakes every model-derived number into the static HTML, so the page reads
// correctly before (or without) JavaScript and no figure is ever typed.
//
//   node tools/bake.mjs
//
// Markers look like <!--b:key:arg-->…<!--/b-->. The markers stay in the
// output, so re-running is idempotent. The model is js/bloom-model.js — the
// same file the browser runs.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
new Function(readFileSync(path.join(root, 'js/bloom-model.js'), 'utf8'))();
const B = globalThis.BLOOM;

const nf = (n) => n.toLocaleString('en-AU');
const READING_DAYS = [1, 4, 7, 14, 21, 30, 45, 60, 90];

// the degassing chart on monday.html: CO2 left against days since roast,
// with the window we drink it in shaded and three days marked
function co2chart() {
  const W = 640, H = 352, L = 44, R = 12, T = 16, Bm = 56;
  const w = W - L - R, h = H - T - Bm, max = 90;
  const x = (d) => L + (d / max) * w;
  const y = (f) => T + h - f * h;
  const grid = [0.25, 0.5, 0.75, 1].map((f) =>
    `<line x1="${L}" x2="${W - R}" y1="${y(f).toFixed(1)}" y2="${y(f).toFixed(1)}"/>`).join('');
  const yl = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    `<text x="${L - 10}" y="${(y(f) + 4).toFixed(1)}" text-anchor="end">${Math.round(f * 100)}%</text>`).join('');
  const xl = [0, 15, 30, 45, 60, 75, 90].map((d) =>
    `<text x="${x(d).toFixed(1)}" y="${H - Bm + 22}" text-anchor="middle">${d}</text>`).join('');
  const curve = B.co2Path(max, w, h).replace(/([ML])([\d.]+) ([\d.]+)/g,
    (_, c, a, b) => `${c}${(+a + L).toFixed(1)} ${(+b + T).toFixed(1)}`);
  const marks = [B.WINDOW.from, B.WINDOW.to, 60].map((d) => {
    const cx = x(d), cy = y(B.co2(d));
    const pct = Math.round(B.co2(d) * 100);
    const anchor = 'start';
    return `<circle class="mark" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5"/>` +
      `<text class="mark-l" x="${(cx + 10).toFixed(1)}" y="${(cy - 10).toFixed(1)}" text-anchor="${anchor}">Day ${d} · ${pct}%</text>`;
  }).join('');
  return `
          <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-t chart-d">
            <title id="chart-t">Carbon dioxide left in the beans, by days since roast</title>
            <desc id="chart-d">A falling curve: ${Math.round(B.co2(B.WINDOW.from) * 100)} per cent on day ${B.WINDOW.from}, ${Math.round(B.co2(B.WINDOW.to) * 100)} per cent on day ${B.WINDOW.to}, ${Math.round(B.co2(60) * 100)} per cent on day 60 and ${Math.round(B.co2(90) * 100)} per cent on day 90. Days ${B.WINDOW.from} to ${B.WINDOW.to} are shaded as the window we drink it in.</desc>
            <rect class="window" x="${x(B.WINDOW.from).toFixed(1)}" y="${T}" width="${(x(B.WINDOW.to) - x(B.WINDOW.from)).toFixed(1)}" height="${h}"/>
            <g class="grid">${grid}<line x1="${L}" x2="${W - R}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/></g>
            <g class="axis">${yl}${xl}<text x="${W - R}" y="${H - 2}" text-anchor="end">days since roast</text></g>
            <text class="note" x="${(x(B.WINDOW.from) + 8).toFixed(1)}" y="${T + h - 10}">the month we drink it in</text>
            <path class="curve" d="${curve}"/>
            ${marks}
          </svg>
          `;
}

function readings() {
  const rows = READING_DAYS.map((d) => {
    const s = B.summary(d);
    const inWin = d >= B.WINDOW.from && d <= B.WINDOW.to;
    return `
              <tr class="${inWin ? 'in' : 'out'}"><td>Day ${d}</td><td>${Math.round(s.co2 * 100)}%</td><td>${s.peak.toFixed(1)}</td><td>${Math.round(s.hold)}</td></tr>`;
  }).join('');
  return rows + '\n              ';
}

const KEYS = {
  num: (a) => a,
  peak: (d) => B.summary(+d).peak.toFixed(1),
  hold: (d) => String(Math.round(B.summary(+d).hold)),
  co2: (d) => String(Math.round(B.co2(+d) * 100)),
  lot: (k) => {
    const v = B.LOT[k];
    if (k === 'loss') return String(Math.round(v * 100));
    return Number.isInteger(v) ? nf(v) : v.toFixed(2);
  },
  win: (k) => String(B.WINDOW[k]),
  total: (arg) => {                       // total:qty:collect
    const [q, c] = arg.split(':');
    const t = B.orderTotal(+q, c === 'collect').total;
    return Number.isInteger(t) ? String(t) : t.toFixed(2);
  },
  goods: (q) => String(+q * B.LOT.priceAud),
  cups: () => String(Math.floor(B.LOT.bagG / B.DOSE_G)),
  spark: (d) => `\n              <path class="spark-full" d="${B.path(+d, 200, 56)}"/>\n              `,
  co2chart: () => co2chart(),
  readings: () => readings(),
  model: (k) => String(B[k])
};

const re = /<!--b:([a-zA-Z0-9]+):?([^>]*?)-->([\s\S]*?)<!--\/b-->/g;
let total = 0;
for (const page of ['index.html', 'lot.html', 'monday.html', 'bag.html']) {
  const file = path.join(root, page);
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }
  let n = 0;
  const out = src.replace(re, (m, key, arg) => {
    const fn = KEYS[key];
    if (!fn) throw new Error(`${page}: unknown bake key "${key}"`);
    n++;
    return `<!--b:${key}${arg ? ':' + arg : ''}-->${fn(arg)}<!--/b-->`;
  });
  if (out !== src) writeFileSync(file, out);
  console.log(`  ${page.padEnd(12)} ${n} markers`);
  total += n;
}
console.log(`  baked ${total}`);
