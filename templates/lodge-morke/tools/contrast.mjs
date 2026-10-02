// Contrast of real text over the real film, not over a flat token colour.
// At each scroll stop: one screenshot with every glyph made transparent (the
// backdrop), plus the box and colour of each visible text element. Then
// tools/contrast.py takes the brightest 5% of backdrop pixels in each box.
//   node templates/lodge-morke/tools/contrast.mjs <label> [desktop|mobile] [cdpPort]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, sleep } from './cdp.mjs';

const [label = 'c', kind = 'desktop', portArg] = process.argv.slice(2);
const view = kind === 'mobile' ? { width: 390, height: 844, mobile: true, dpr: 1 } : { width: 1440, height: 900 };
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots', label, 'contrast-' + kind);
fs.mkdirSync(OUT, { recursive: true });
const page = await open({ port: +(portArg || 9333), ...view });
await page.goto('http://127.0.0.1:8732/templates/lodge-morke/index.html', 2500);
for (let i = 0; i < 40 && !(await page.eval('MORKE.state().ready')); i++) await sleep(250);
const max = await page.eval('document.documentElement.scrollHeight - innerHeight');
const out = [];
for (const f of [0, 0.12, 0.3, 0.48, 0.66, 0.84, 1]) {
  const goal = Math.round(max * f);
  for (let g = 0; g < 400; g++) { const y = await page.eval('scrollY'); if (y >= goal - 2 || y >= max - 2) break; await page.wheel(Math.min(260, Math.max(40, goal - y))); await sleep(40); }
  await sleep(1400);
  const items = await page.eval(`(() => {
    const sel = 'h1,h2,p,dt,dd,label,li span,figcaption,.readout span,.rail a,.top__cta,.mark__word,.btn,.estimate';
    const vis = (el) => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && +s.opacity > 0.5 && s.display !== 'none'; };
    let alpha = (el) => { let a = 1; for (let n = el; n && n !== document.body; n = n.parentElement) a *= +getComputedStyle(n).opacity; return a; };
    return [...document.querySelectorAll(sel)].filter(el => el.textContent.trim() && vis(el) && alpha(el) > 0.5 && !el.closest('.foot')).map(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width < 2) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), text: el.textContent.trim().slice(0, 40), color: s.color, size: parseFloat(s.fontSize), weight: +s.fontWeight,
        box: [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)] };
    }).filter(Boolean);
  })()`);
  await page.eval(`(() => { const st = document.createElement('style'); st.id = '__hide'; st.textContent = '*:not(#__none) { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; } input,select,textarea{border-color:transparent!important} .top__cta{border-color:transparent!important} .cue__line,.rail__track,.mark__o{visibility:hidden!important}'; document.head.appendChild(st); })()`);
  await sleep(120);
  const file = `bg-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
  await page.shot(path.join(OUT, file));
  await page.eval(`document.getElementById('__hide').remove()`);
  out.push({ f, file, items });
}
fs.writeFileSync(path.join(OUT, 'items.json'), JSON.stringify(out, null, 1));
await page.close();
console.log(OUT);
