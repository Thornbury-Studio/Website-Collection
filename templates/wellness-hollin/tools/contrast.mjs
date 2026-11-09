// Contrast ratios for every text/UI colour against the grounds it sits on (WCAG 2 relative luminance).
// node tools/contrast.mjs   — prints the table used in DESIGN.md and the worst case along the home scroll.
import { readFileSync } from 'node:fs'; import vm from 'node:vm';
const sb = {}; sb.globalThis = sb; vm.runInNewContext(readFileSync(new URL('../js/hollin-data.js', import.meta.url), 'utf8'), sb);
const H = sb.HOLLIN, L = H.lum;
const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const f = (n) => n.toFixed(1);
for (const T of [90, 38, 21, 4]) {
  const a = H.at(T);
  console.log(`${T} °C | ground ${a.ground} ground2 ${a.ground2} | ink ${f(cr(a.ink, a.ground))}/${f(cr(a.ink, a.ground2))} | dim ${f(cr(a.dim, a.ground))}/${f(cr(a.dim, a.ground2))} | accent ${f(cr(a.accent, a.ground))}/${f(cr(a.accent, a.ground2))} | err ${f(cr(a.err, a.ground))}/${f(cr(a.err, a.ground2))} | ground-on-accent ${f(cr(a.ground, a.accent))}`);
}
let worst = { ink: [99], dim: [99], accent: [99] };
for (let T = 90; T >= 4; T -= 0.1) {
  const a = H.at(T);
  for (const k of ['ink', 'dim', 'accent']) { const c = cr(a[k], a.ground); if (c < worst[k][0]) worst[k] = [c, T.toFixed(1)]; }
}
console.log('worst along the home scroll (vs bare ground):', Object.entries(worst).map(([k, v]) => `${k} ${f(v[0])} at ${v[1]} °C`).join(', '));
// photo bands: text on the scrim; worst case = pure white pixel under the scrim alpha
const scrim = (alpha) => { const c = Math.round(255 * (1 - alpha) + 5 * alpha); return '#' + [c, c, Math.round(255 * (1 - alpha) + 12 * alpha)].map((v) => v.toString(16).padStart(2, '0')).join(''); };
for (const al of [0.84, 0.86, 0.9]) console.log(`scrim ${al}: worst ground ${scrim(al)} | photo-ink #F3F6F8 ${f(cr('#F3F6F8', scrim(al)))} | photo-dim #C9D2D9 ${f(cr('#C9D2D9', scrim(al)))}`);
