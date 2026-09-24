// Bakes every number index.html prints before JavaScript runs from the
// same model the bench uses (js/paper.js), so the static page, the
// screen-reader mirrors and the live bench can't disagree.
//   node tools/bake.mjs          rewrite index.html
//   node tools/bake.mjs --check  exit 1 if anything is stale
// Markers: <!--b:key-->value<!--/b-->

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../js/paper.js');

const START = { neg: 0, stops: 3, grade: '2' };   // the bench's opening state
const g = P.grade(START.grade);
const land = P.landing(P.NEGS[START.neg], START.stops, g);
const sec = (s) => P.fmtSec(P.seconds(s));
const led = (() => { let s = P.seconds(START.stops).toFixed(1); while (s.replace('.', '').length < 3) s = '!' + s; return s; })();

const lampName = { '00': 'yellow', '0': 'yellow', '1': 'pale amber', '2': 'near white', '3': 'pink', '4': 'magenta', '5': 'magenta' };
const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
const grades = '\n' + P.GRADES.map((gg) =>
  `          <tr><th scope="row">${gg.id}</th><td>${gg.R.toFixed(2)} log units</td><td>×${gg.factor}</td><td><span class="swatch" style="--sw: ${rgb(gg.lamp)}"></span>${lampName[gg.id]}</td></tr>`
).join('\n') + '\n          ';

const values = {
  grades,
  'landing.grade': START.grade,
  'landing.time': sec(START.stops),
  'landing.hi': land.hiD.toFixed(2),
  'landing.lo': land.loD.toFixed(2),
  dmin: P.DMIN.toFixed(2),
  dmax: P.DMAX.toFixed(2),
  steps: [0, 1 / 3, 2 / 3].map((d) => sec(START.stops + d)).join(' to '),
  third: String(Math.round((Math.pow(2, 1 / 3) - 1) * 100)),
  led,
  'led.sr': sec(START.stops),
  stopsText: START.stops + ' stops'
};

const file = new URL('../index.html', import.meta.url);
const html = await readFile(file, 'utf8');
// keep whatever line endings the checkout has (core.autocrlf gives CRLF on Windows)
const NL = html.includes('\r\n') ? '\r\n' : '\n';
values.grades = values.grades.replace(/\n/g, NL);
const seen = new Set();
const out = html.replace(/<!--b:([\w.]+)-->([\s\S]*?)<!--\/b-->/g, (m, key, old) => {
  if (!(key in values)) throw new Error('no value for bake marker ' + key);
  seen.add(key);
  return `<!--b:${key}-->${values[key]}<!--/b-->`;
});
const missing = Object.keys(values).filter((k) => !seen.has(k));
if (missing.length) throw new Error('markers missing from index.html: ' + missing.join(', '));

if (process.argv.includes('--check')) {
  if (out !== html) { console.error('index.html is stale: run node tools/bake.mjs'); process.exit(1); }
  console.log('baked numbers are current (' + seen.size + ' markers)');
} else {
  await writeFile(file, out);
  console.log(out === html ? 'nothing to change' : 'baked ' + seen.size + ' markers');
}
