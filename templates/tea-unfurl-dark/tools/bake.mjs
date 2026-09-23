// Bakes every number and steep note on the site from js/steep-model.js into
// the static HTML, so the page reads correctly before (and without) script —
// and so no copy of a number can drift from the model. Markers:
//   <!--b:key:arg-->…<!--/b-->   (the text between them is replaced)
// Every mirror of a value — visible text, the aria-live summary, the
// reduced-motion log, table cells — carries its own marker.
//   node tools/bake.mjs

import { readFile, writeFile } from 'node:fs/promises';

const src = await readFile(new URL('../js/steep-model.js', import.meta.url), 'utf8');
const box = {};
new Function('globalThis', src)(box);
const S = box.STEEP;
const { TIN, LOT, POT, GAIWAN, COLD, STAGE, MARKS, D } = S;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const ORD = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
// small counts the copy spells out in words — still the model's numbers
const COUNT = {
  potsteeps: () => POT.steeps.length, gaiwansteeps: () => GAIWAN.steeps.length,
  stagemin: () => STAGE.seconds / 60, roasts: () => LOT.roasts, resteeps: () => POT.steeps.length - 1
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const frameFor = (t) => Math.round((t / STAGE.seconds) * 159);

const BAKE = {
  clock: (t) => S.clock(+t),
  word: (k) => WORDS[COUNT[k]()],
  wordcap: (k) => cap(WORDS[COUNT[k]()]),
  ordinal: (k) => ORD[COUNT[k]()],
  ordinalcap: (k) => cap(ORD[COUNT[k]()]),
  mark: (i, f) => esc(MARKS[+i][f]),
  at: (t, f) => esc(MARKS[S.markAt(+t)][f]),
  summary: (t) => esc(S.summary(+t)),
  d: (k) => S.num(D[k]),
  money: (k) => S.money(k in D ? D[k] : TIN[k]),
  tin: (k) => S.num(TIN[k]),
  lot: (k) => esc(typeof LOT[k] === 'number' ? S.num(LOT[k]) : LOT[k]),
  pot: (k) => S.num(POT[k]),
  gaiwan: (k) => S.num(GAIWAN[k]),
  cold: (k) => S.num(COLD[k]),
  potsteeps: () => String(POT.steeps.length),
  gaiwansteeps: () => String(GAIWAN.steeps.length),
  potsteep: (i) => S.dur(POT.steeps[+i]),
  gaiwanwater: () => S.dur(D.gaiwanWater),
  potwater: () => S.dur(S.sum(POT.steeps)),
  // the still under the stage's column when there's no scrub: the pour
  still: () => { const f = String(frameFor(STAGE.seconds)).padStart(3, '0');
    return `<picture><source media="(max-width: 899px)" srcset="film/s/${f}.webp" width="720" height="1280"><img class="column-still" src="film/l/${f}.webp" data-still width="1440" height="810" alt="Rolled oolong in the pot at ${S.clock(STAGE.seconds)}: whole leaves opened out and drifting, backlit amber through the glass" fetchpriority="high"></picture>`; },
  range: () => `<input type="range" id="steep-t" min="0" max="${STAGE.seconds}" step="1" value="${STAGE.seconds}" aria-describedby="steep-summary" aria-valuetext="${S.clock(STAGE.seconds)}">`,
  // a tick closer than 10% of the ruler to the last labelled one keeps its mark, loses its label
  ticks: () => {
    let last = -1;
    return MARKS.map((m, i) => {
      const at = m.t / STAGE.seconds, quiet = last >= 0 && at - last < 0.1;
      if (!quiet) last = at;
      return `<li style="--at:${at.toFixed(4)}" data-i="${i}"${quiet ? ' class="tick-quiet"' : ''}><span>${S.clock(m.t)}</span></li>`;
    }).join('');
  },
  // the order panel's state before script: one tin, by courier — main.js recalculates with the same model
  order: (k) => { const o = S.orderTotal(1, false);
    return { goods: `1 × ${S.money(TIN.priceSgd)} = ${S.money(o.goods)}`, post: o.post ? `${S.money(o.post)} (free from ${TIN.freeFrom} tins)` : 'Free',
      total: S.money(o.total), pots: `${S.num(D.potsPerTin)} pots of tea` }[k]; },
  qtyinput: () => `<input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${TIN.maxQty}" value="1">`,
  rulerdiv: () => `<div class="ruler">`,
  log: () => MARKS.map((m, i) => `<li data-i="${i}"><span class="log-t">${S.clock(m.t)}</span><span class="log-head">${esc(m.head)}</span><span class="log-liquor">${esc(m.liquor)}</span><span class="log-note">${esc(m.note)}</span></li>`).join(''),
  resteeps: () => S.RESTEEPS.map((r, i) => `<li><span class="log-t">${S.clock(POT.steeps[i + 1])}</span><span class="log-head">${['Second', 'Third', 'Fourth', 'Fifth'][i]} pot · ${esc(r.head)}</span><span class="log-liquor">${esc(r.liquor)}</span><span class="log-note">${esc(r.note)}</span></li>`).join(''),
  pottable: () => POT.steeps.map((s, i) => `<tr><th scope="row">${['First', 'Second', 'Third', 'Fourth', 'Fifth'][i]}</th><td>${S.dur(s)}</td><td>${S.clock(S.sum(POT.steeps.slice(0, i + 1)))}</td></tr>`).join(''),
  gaiwantable: () => [`<tr><th scope="row">Rinse</th><td>${S.dur(GAIWAN.rinse)}</td><td>${S.clock(GAIWAN.rinse)}</td></tr>`]
    .concat(GAIWAN.steeps.map((s, i) => `<tr><th scope="row">${i + 1}</th><td>${S.dur(s)}</td><td>${S.clock(GAIWAN.rinse + S.sum(GAIWAN.steeps.slice(0, i + 1)))}</td></tr>`)).join('')
};

// Titles and meta descriptions can't hold comment markers, so they are written
// whole from these templates on every bake — the same model values, no hand copy.
const m = S.money, n = S.num;
const META = {
  'index.html': {
    title: `UNFURL. — one charcoal-roasted oolong from Alishan, in one tin`,
    description: `UNFURL. sells one tea: a charcoal-roasted, cloth-rolled oolong from a ridge garden at ${n(LOT.altitudeM)} m in the Alishan range, Taiwan. ${TIN.grams} g tin, ${m(TIN.priceSgd)}, delivered in Singapore. Scroll and watch the first ${WORDS[STAGE.seconds / 60]} minutes of the pot.`,
    og: `One charcoal-roasted oolong from Alishan. Scroll through the first ${WORDS[STAGE.seconds / 60]} minutes of the pot, with our cupping notes at the second they change.`,
    tw: `One charcoal-roasted oolong from Alishan. Scroll through the first ${WORDS[STAGE.seconds / 60]} minutes of the pot.`
  },
  'garden.html': {
    title: `The garden — UNFURL. | A ridge above Shizhuo, Alishan, Taiwan`,
    description: `Where UNFURL. comes from: a family garden at ${n(LOT.altitudeM)} m above Shizhuo in the Alishan range, Taiwan. Qingxin oolong, picked by hand in April, rolled in cloth ${LOT.rolls} times and roasted ${LOT.roasts === 2 ? 'twice' : LOT.roasts + ' times'} over longan charcoal.`,
    og: `A ridge above Shizhuo, in the fog. From bush to knot in three days, then ${WORDS[LOT.roasts]} roasts over longan charcoal.`,
    tw: `A ridge above Shizhuo, in the fog. From bush to knot in three days.`
  },
  'brew.html': {
    title: `Brewing — UNFURL. | Pot, gaiwan and cold`,
    description: `How to steep UNFURL.'s charcoal-roasted oolong: ${POT.doseG} g in a ${POT.waterMl} ml pot at ${POT.tempC} °C for ${WORDS[POT.steeps.length]} steeps, ${GAIWAN.doseG} g in a gaiwan for ${WORDS[GAIWAN.steeps.length]}, or ${COLD.doseG} g in a litre of cold water overnight. With what to change when the cup is off.`,
    og: `Pot, gaiwan or cold. Every steep time for one charcoal-roasted oolong, and what to change when the cup is off.`,
    tw: `Pot, gaiwan or cold. Every steep time for one charcoal-roasted oolong.`
  },
  'tin.html': {
    title: `The tin — UNFURL. | ${TIN.grams} g charcoal-roasted Alishan oolong, ${m(TIN.priceSgd)}`,
    description: `Buy UNFURL.: ${TIN.grams} g of charcoal-roasted, cloth-rolled Qingxin oolong from ${n(LOT.altitudeM)} m in the Alishan range, in a slip-lid tin. ${m(TIN.priceSgd)}, courier across Singapore, free from ${WORDS[TIN.freeFrom]} tins. About ${D.potsPerTin} pots of tea.`,
    og: `${TIN.grams} g of charcoal-roasted Alishan oolong in a slip-lid tin. ${m(TIN.priceSgd)}, about ${D.potsPerTin} pots of tea.`,
    tw: `${TIN.grams} g of charcoal-roasted Alishan oolong. ${m(TIN.priceSgd)}, about ${D.potsPerTin} pots of tea.`
  }
};
const attr = (s) => esc(s).replace(/"/g, '&quot;');
function meta(p, html) {
  const M = META[p];
  if (!M) return html;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(M.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(M.description)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(M.og)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${attr(M.tw)}">`);
}

const pages = ['index.html', 'garden.html', 'brew.html', 'tin.html'];
let total = 0;
for (const p of pages) {
  const file = new URL('../' + p, import.meta.url);
  let html;
  try { html = await readFile(file, 'utf8'); } catch { continue; }
  let n = 0;
  html = html.replace(/<!--b:([a-z]+)((?::[^:>-]+)*)-->([\s\S]*?)<!--\/b-->/g, (all, key, args) => {
    const fn = BAKE[key];
    if (!fn) throw new Error(`${p}: unknown bake key ${key}`);
    n++;
    const a = args ? args.slice(1).split(':') : [];
    return `<!--b:${key}${args}-->${fn(...a)}<!--/b-->`;
  });
  html = meta(p, html);
  await writeFile(file, html);
  console.log(p, n, 'markers');
  total += n;
}
console.log('total', total);
