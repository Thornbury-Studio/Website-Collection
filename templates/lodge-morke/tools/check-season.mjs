// Every season figure the page states in plain text, re-derived from js/sun.js.
// The chart and the live readout use the model directly; the copy can't, so this
// is the bake check (DARK.md §5): if the model and the words ever disagree, fail.
//   node templates/lodge-morke/tools/check-season.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
new Function(fs.readFileSync(path.join(ROOT, 'js/sun.js'), 'utf8'))();
const Sun = globalThis.MorkeSun;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/&nbsp;/g, ' ');

const days = [];
for (let t = Date.UTC(2026, 9, 1); t <= Date.UTC(2027, 2, 1); t += 864e5) {
  const d = new Date(t);
  days.push({ d, max: Sun.dayMax(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) });
}
const up = (x) => x.max >= Sun.RISE;
const lastUp = days.filter((x) => x.d.getUTCMonth() >= 9 && up(x)).at(-1).d;
const back = days.find((x) => x.d > Date.UTC(2026, 11, 1) && up(x)).d;
const dark = days.filter((x) => !up(x)).length;
const civil = days.filter((x) => x.max < Sun.CIVIL);
const low = days.reduce((m, x) => (x.max < m.max ? x : m));

const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const long = (d) => d.getUTCDate() + ' ' + M[d.getUTCMonth()];
const short = (d) => d.getUTCDate() + ' ' + M[d.getUTCMonth()].slice(0, 3);
const firstDark = new Date(lastUp.getTime() + 864e5);
const lowDeg = '−' + Math.abs(low.max).toFixed(1) + '°';

const expect = [
  ['last sunrise (facts list)', short(lastUp)],
  ['days without the sun', dark + ' days'],
  ['open: first morning without sunrise', long(firstDark)],
  ['close: the sun comes back', long(back)],
  ['no civil twilight, from (copy)', long(civil[0].d)],
  ['no civil twilight, range (facts list)', short(civil[0].d) + ' – ' + short(civil.at(-1).d)],
  ['noon sun at the solstice', lowDeg],
  ['solstice date', short(low.d).replace(/^(\d+) (\w+)$/, '$1 $2')],
];
let bad = 0;
for (const [what, text] of expect) {
  const ok = html.includes(text);
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + what.padEnd(40) + text);
}
if (bad) { console.error(bad + ' figure(s) in index.html disagree with js/sun.js'); process.exit(1); }
