/* Authoring tool, not shipped to the browser.

   Bakes a static floor plan (and its per-room figures) out of js/plans.js
   and js/estimate.js so the pages carry the plan in their HTML before any
   script runs. Run from the template folder:

     node tools/emit-plan.mjs hero        # hdb4 hero plan for index.html
     node tools/emit-plan.mjs pick hdb4   # default pick-mode plan for quote.html
     node tools/emit-plan.mjs mini hdb4 liv,kit,mbr   # scoped mini plan
     node tools/emit-plan.mjs est hdb4 liv=standard,kit=full  # estimate dump */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => new Function(fs.readFileSync(path.join(here, '..', 'js', f), 'utf8'))();
load('plans.js');
load('estimate.js');

const P = globalThis.CHALK_PLANS, E = globalThis.CHALK_EST;
const [,, cmd = 'hero', planId = 'hdb4', extra = ''] = process.argv;

const HERO_PHOTOS = {
  liv: 'img/a-living-800.webp', kit: 'img/a-kitchen-800.webp', mbr: 'img/a-master-800.webp',
  mb: 'img/a-mbath-800.webp', br2: 'img/a-study-800.webp', cb: 'img/a-cbath-800.webp',
  cor: 'img/a-entry-800.webp'
};
const HERO_HREFS = {
  liv: 'work.html#tampines-living', kit: 'work.html#tampines-kitchen', mbr: 'work.html#tampines-master',
  mb: 'work.html#tampines-mbath', br2: 'work.html#tampines-study', cb: 'work.html#tampines-cbath',
  cor: 'work.html#tampines-entry', br3: 'work.html#tampines'
};

if (cmd === 'hero') {
  process.stdout.write(P.render(P.PLANS.hdb4, { uid: 'hero', mode: 'hero', photos: HERO_PHOTOS, hrefs: HERO_HREFS,
    scoped: ['liv', 'kit', 'mbr', 'mb', 'br2', 'cb', 'cor', 'br3'] }));
} else if (cmd === 'pick') {
  process.stdout.write(P.render(P.PLANS[planId], { uid: 'pick', mode: 'pick' }));
} else if (cmd === 'mini') {
  process.stdout.write(P.render(P.PLANS[planId], { uid: 'mini-' + planId, mode: 'mini', scoped: extra.split(',').filter(Boolean), labels: false, dims: false }));
} else if (cmd === 'est') {
  const picks = {};
  extra.split(',').forEach((kv) => { const [k, v] = kv.split('='); if (k) picks[k] = v || 'standard'; });
  const e = E.estimate(planId, picks);
  for (const r of e.rooms) {
    console.log(`\n${r.name} (${r.area} m², ${r.scope}) — ${E.money(r.total)}`);
    for (const l of r.lines) console.log(`   ${l.label.padEnd(48)} ${String(l.qty).padStart(7)} ${l.unit.padEnd(6)} @ ${l.rate}  = ${E.money(l.amount)}`);
  }
  console.log('\nSite');
  for (const l of e.site) console.log(`   ${l.label.padEnd(48)} ${String(l.qty).padStart(7)} ${l.unit.padEnd(6)} @ ${l.rate}  = ${E.money(l.amount)}`);
  console.log(`\nSubtotal ${E.money(e.subtotal)}   Band ${E.band(e)}   Weeks ${E.weeks(e)}`);
  console.log('Flat area', P.totalArea(e.plan).toFixed(1), 'm²');
} else if (cmd === 'areas') {
  for (const id of Object.keys(P.PLANS)) {
    const p = P.PLANS[id];
    console.log(id, P.totalArea(p).toFixed(1), 'm²', p.rooms.map(r => `${r.id}:${P.measure(r).area.toFixed(1)}`).join(' '));
  }
}
