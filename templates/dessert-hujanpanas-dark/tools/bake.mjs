// Hujan Panas: bakes the no-JavaScript page from js/weather.js and js/log-data.js.
//   usage: node tools/bake.mjs [--at 2026-11-15T17:30:00+08:00]
// Rewrites every block between <!--bake:NAME--> and <!--/bake:NAME--> in index.html:
// the readout, the state word, the top three, the board, the screen-reader summary and the
// October chart. Every place a computed number appears is inside one of these blocks.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..');
const ctx = { console, Date, Math };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/weather.js', 'tools/log-data.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
const HP = ctx.HP, LOG = ctx.HP_LOG;

const atArg = process.argv.indexOf('--at');
const at = new Date(atArg > 0 ? process.argv[atArg + 1] : '2026-11-15T17:30:00+08:00');
const w = HP.typical(at);
const st = HP.state(w.temp, w.rain);
const words = HP.WORDS[st];
const ranked = HP.rank(w.temp, w.rain);
const MOVES = HP.moves(ranked);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const part = w.hour < 12 ? 'morning' : w.hour < 18 ? 'afternoon' : 'evening';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => 'S$' + n.toFixed(2);
const pad = (n) => String(n).padStart(2, '0');

function pic(name, sizes, alt, cls, lazy = true) {
  return `<picture class="${cls}"><source type="image/avif" srcset="img/${name}-640.avif 640w, img/${name}-1280.avif 1280w" sizes="${sizes}"><img src="img/${name}-1280.webp" srcset="img/${name}-640.webp 640w, img/${name}-1280.webp 1280w" sizes="${sizes}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}></picture>`;
}
const ALT = {
  tangyuan: 'Two rice balls, one white and one pandan green, in a bowl of amber ginger syrup with crushed peanuts.',
  pulut: 'A white bowl of glossy black glutinous rice on a dark slate table, a wooden spoon beside it.',
  redbean: 'Red bean soup in a white bowl, the beans soft and split.',
  greenbean: 'Green bean soup with coconut milk in a green-rimmed bowl, a steel spoon resting in it.',
  chengtng: 'A bowl of cheng tng from above: longan, red dates, lotus seeds and barley in clear syrup on a banana leaf.',
  tauhuay: 'Silken beancurd with barley in a blue and white bowl on a wooden table.',
  ondeh: 'Ondeh-ondeh coated in grated coconut, sitting in half coconut shells beside pandan leaves.',
  akk: 'Rows of red ang ku kueh on squares of banana leaf.',
  'kueh-plate': 'A plate of assorted kueh: rainbow kueh lapis, red ang ku kueh, white coconut kueh and brown cakes.'
};

function dishRow(r, i) {
  const it = r.item;
  const thumbUnused = it.img ? `<picture class="dish__pic"><source type="image/avif" srcset="img/${it.img}-320.avif 320w, img/${it.img}-640.avif 640w" sizes="(min-width: 900px) 9rem, 5.5rem"><img src="img/${it.img}-320.webp" srcset="img/${it.img}-320.webp 320w, img/${it.img}-640.webp 640w" sizes="(min-width: 900px) 9rem, 5.5rem" width="320" height="240" alt="${esc(ALT[it.img] || '')}" loading="lazy" decoding="async"></picture>`
    : '';
  const mv = MOVES[it.id];
  return `      <li class="dish" data-id="${it.id}" data-warmth="${it.warmth}"${it.img ? ` data-alt="${esc(ALT[it.img] || '')}"` : ''} style="view-transition-name: d-${it.id}">
        <span class="dish__rank" aria-hidden="true">${pad(i + 1)}</span>
        <div class="dish__main"><h3 class="dish__name">${esc(it.name)}${it.zh ? ` <span lang="zh-Hans">${it.zh}</span>` : ''}</h3><p class="dish__desc">${esc(it.desc)}</p><p class="dish__served">Served ${it.temp}</p></div>
        <span class="dish__move" data-move="${mv > 0 ? 'up' : mv < 0 ? 'down' : 'same'}"><span aria-hidden="true">${HP.moveText(mv)}</span><span class="sr-only">${HP.moveSr(mv)}</span></span>
        <span class="dish__price">${money(it.price)}</span>
      </li>`;
}

const read = `<!--bake:read-->
    <p class="now__where" id="now-where">A typical ${MONTHS[w.month]} ${part} in Singapore</p>
    <p class="now__temp"><span class="now__num" id="now-temp">${w.temp.toFixed(1)}</span><span class="now__unit">&deg;C</span></p>
    <p class="now__rain"><span id="now-rain">${w.rain.toFixed(1)}</span> mm of rain in the last five minutes</p>
    <h1 class="now__word"><span class="sr-only">Hujan Panas, a dessert house in Singapore. The weather now: </span><span id="now-word">${words.word}</span></h1>
    <p class="now__line" id="now-line">${words.line}</p>
    <!--/bake:read-->`;

const heroRow = (r, i) => { const m = MOVES[r.item.id]; return `<li data-id="${r.item.id}" style="view-transition-name: h-${r.item.id}"><span class="hb__n">${pad(i + 1)}</span><span class="hb__nm">${esc(r.item.name)}</span><span class="hb__mv" data-move="${m > 0 ? 'up' : m < 0 ? 'down' : 'same'}"><span aria-hidden="true">${HP.moveText(m)}</span><span class="sr-only">${HP.moveSr(m)}</span></span></li>`; };
const top3 = `<!--bake:top3-->
      ${ranked.slice(0, 5).map(heroRow).join('\n      ')}
      <!--/bake:top3-->`;
const hd = ranked.find((r) => r.item.img).item;
const hdish = `<!--bake:hdish-->
    <figure class="hb__dish" id="hb-dish" data-id="${hd.id}">
      <picture><source type="image/avif" data-srcset="img/${hd.img}-640.avif 640w, img/${hd.img}-1280.avif 1280w" sizes="(min-width: 900px) 26rem, 92vw"><img data-src="img/${hd.img}-640.webp" data-srcset="img/${hd.img}-640.webp 640w, img/${hd.img}-1280.webp 1280w" sizes="(min-width: 900px) 26rem, 92vw" width="640" height="427" alt="${esc(ALT[hd.img] || '')}" decoding="async"></picture>
      <noscript><img src="img/${hd.img}-640.webp" width="640" height="427" alt="${esc(ALT[hd.img] || '')}"></noscript>
      <figcaption><span class="hb__tag" id="hb-dish-tag">${ranked[0].item.id === hd.id ? 'No. 1 right now' : 'Highest with a photograph'}</span> <b id="hb-dish-name">${esc(hd.name)}</b> <span class="hb__price" id="hb-dish-price">${money(hd.price)}</span></figcaption>
    </figure>
    <!--/bake:hdish-->`;

const leadItem = ranked.find((r) => r.item.img).item;
const lead = `<!--bake:lead-->
      <figure class="board__lead" id="board-lead">
        <picture><source type="image/avif" srcset="img/${leadItem.img}-640.avif 640w, img/${leadItem.img}-1280.avif 1280w" sizes="(min-width: 900px) 52vw, 92vw"><img src="img/${leadItem.img}-1280.webp" srcset="img/${leadItem.img}-640.webp 640w, img/${leadItem.img}-1280.webp 1280w" sizes="(min-width: 900px) 52vw, 92vw" width="1280" height="853" alt="${esc(ALT[leadItem.img] || '')}" loading="lazy" decoding="async"></picture>
        <figcaption>Highest on the board with a photograph: <b>${esc(leadItem.name)}</b></figcaption>
      </figure>
      <!--/bake:lead-->`;

const board = `<!--bake:board-->
${ranked.map(dishRow).join('\n')}
      <!--/bake:board-->`;

const dial = `<!--bake:dial-->
        <label for="dial-temp">Air temperature <output id="dial-temp-out" for="dial-temp">${w.temp.toFixed(1)}&deg;C</output></label>
        <input type="range" id="dial-temp" min="24" max="35" step="0.1" value="${w.temp.toFixed(1)}" aria-valuetext="${w.temp.toFixed(1)} degrees">
        <fieldset class="dial__rain">
          <legend>Rain</legend>
          ${[['0', 'Dry'], ['0.6', 'Drizzle'], ['2.4', 'Downpour']].map(([v, l]) => `<label><input type="radio" name="rain" value="${v}"${Number(v) === w.rain ? ' checked' : ''}> ${l}</label>`).join('\n          ')}
        </fieldset>
        <!--/bake:dial-->`;

const sr = `<!--bake:sr--><p class="sr-only" id="board-live" aria-live="polite">Board sorted for ${w.temp.toFixed(1)} degrees and ${w.rain.toFixed(1)} millimetres of rain. First: ${esc(ranked[0].item.name)}.</p><!--/bake:sr-->`;

// ---------- October chart (the shop's own count; invented for the template) ----------
const days = LOG.days;
const W = 1200, H = 380, padL = 8, padR = 8, top = 34, bottom = 300;
const step = (W - padL - padR) / days.length, bw = step * 0.62;
const maxB = Math.max(...days.map((d) => d.warm + d.cold));
const tMin = 26, tMax = 34;
const y = (v) => bottom - (v / maxB) * (bottom - top - 40);
const ty = (t) => top + (1 - (t - tMin) / (tMax - tMin)) * 120;
let bars = '', dots = '', ticks = '', line = '';
days.forEach((d, i) => {
  const x = padL + i * step + (step - bw) / 2;
  const yw = y(d.warm), yc = y(d.warm + d.cold);
  bars += `<g class="day${d.rain ? ' day--wet' : ''}" style="--i:${i}"><rect class="b-warm" x="${x.toFixed(1)}" y="${yw.toFixed(1)}" width="${bw.toFixed(1)}" height="${(bottom - yw).toFixed(1)}"/><rect class="b-cold" x="${x.toFixed(1)}" y="${yc.toFixed(1)}" width="${bw.toFixed(1)}" height="${(yw - yc).toFixed(1)}"/>${d.rain ? `<rect class="b-rain" x="${x.toFixed(1)}" y="${bottom + 10}" width="${bw.toFixed(1)}" height="6"/>` : ''}</g>`;
  const cx = padL + i * step + step / 2;
  line += `${i ? 'L' : 'M'}${cx.toFixed(1)} ${ty(d.t).toFixed(1)}`;
  if ((i + 1) % 7 === 1) ticks += `<text x="${x.toFixed(1)}" y="${bottom + 58}" class="tick">${i + 1} Oct</text>`;
});
const wet = days.filter((d) => d.rain), dry = days.filter((d) => !d.rain);
const share = (arr) => Math.round(100 * arr.reduce((s, d) => s + d.warm, 0) / arr.reduce((s, d) => s + d.warm + d.cold, 0));
const total = days.reduce((s, d) => s + d.warm + d.cold, 0);
const hottest = days.reduce((a, d) => (d.t > a.t ? d : a));
const svg = `<!--bake:log-->
      <svg class="log__svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="log-title log-desc" preserveAspectRatio="xMidYMid meet">
        <title id="log-title">Bowls sold each afternoon in October, warm and cold</title>
        <desc id="log-desc">${days.length} days. On the ${wet.length} afternoons with rain, ${share(wet)} per cent of bowls were warm. On the ${dry.length} dry afternoons, ${share(dry)} per cent were warm.</desc>
        <path class="t-line" d="${line}"/>
        ${bars}
        ${ticks}
      </svg>
      <!--/bake:log-->`;
const logFacts = `<!--bake:logfacts-->
      <p class="log__big"><span>${share(wet)}%</span> of bowls were warm on the ${wet.length} wet afternoons.</p>
      <p class="log__big log__big--dry"><span>${share(dry)}%</span> on the ${dry.length} dry ones.</p>
      <p class="log__small">${total.toLocaleString('en-SG')} bowls in October. The busiest cold day was ${hottest.date} October, ${hottest.t.toFixed(1)}&deg;C at three o'clock.</p>
      <!--/bake:logfacts-->`;

const file = path.join(dir, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const put = (name, block) => {
  const re = new RegExp(`<!--bake:${name}-->[\\s\\S]*?<!--/bake:${name}-->`);
  if (!re.test(html)) throw new Error('missing bake block ' + name);
  html = html.replace(re, block);
};
put('read', read); put('dial', dial); put('top3', top3); put('hdish', hdish); put('board', board); put('lead', lead); put('sr', sr); put('log', svg); put('logfacts', logFacts);
html = html.replace(/data-state="[a-z-]+"/, `data-state="${st}"`);
fs.writeFileSync(file, html);
console.log(`baked ${st} ${w.temp}C ${w.rain}mm; top: ${ranked.slice(0, 3).map((r) => r.item.id).join(', ')}; wet ${share(wet)}% dry ${share(dry)}%`);
