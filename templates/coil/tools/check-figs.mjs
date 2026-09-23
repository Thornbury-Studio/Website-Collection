// node tools/check-figs.mjs  (from templates/coil/)
// Runs js/site.js against a stub DOM to get the figures it would render, then
// checks every no-JS fallback in index.html against them. Exit 1 on any drift.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../js/site.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const win = { matchMedia: () => ({ matches: true }), innerHeight: 900, location: {} };
const doc = { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null };
new Function('window', 'document', 'requestAnimationFrame', src)(win, doc, () => {});
const { FIGS, STEEPS } = win.COIL;
const clock = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const norm = s => s.replace(/&nbsp;| /g, ' ').replace(/&#8201;/g, ' ').trim();
let bad = 0, n = 0;
for (const m of html.matchAll(/data-fig="([a-z0-9-]+)"[^>]*>([^<]*)</g)) {
  n++;
  const want = FIGS[m[1]];
  if (want === undefined) { console.log('unknown fig', m[1]); bad++; continue; }
  if (norm(m[2]) !== norm(want)) { console.log(`fig ${m[1]}: html "${m[2]}" vs js "${want}"`); bad++; }
}
for (const m of html.matchAll(/data-steep-time="(\d)"[^>]*>([^<]*)</g)) {
  n++;
  const want = clock(STEEPS[m[1] - 1].secs);
  if (m[2].trim() !== want) { console.log(`steep ${m[1]}: html "${m[2]}" vs js "${want}"`); bad++; }
}
console.log(`${n} fallbacks checked, ${bad} drifted`);
process.exit(bad ? 1 : 0);
