/* Authoring tool, not shipped to the browser.

   Bakes floor plans and estimator figures into the HTML between markers,
   so every page carries its plan and its numbers before any script runs,
   and the numbers are the estimator's, not typed. Idempotent — run it
   again after any change to plans.js or estimate.js:

     node tools/bake.mjs

   Markers:
     <!--PLAN:hero-->…<!--/PLAN-->
     <!--PLAN:pick:hdb4-->…<!--/PLAN-->
     <!--PLAN:mini:hdb4:liv,kit-->…<!--/PLAN-->
     <!--SHEET:hdb4:liv=full,kit=full-->…<!--/SHEET-->          hero table rows
     <!--LINES:hdb4:kit=standard-->…<!--/LINES-->               one room's line items
     <!--ROOMS:hdb4-->…<!--/ROOMS-->                            the pick list, no-script default
     <!--EST:hdb4:liv=full:sum|band|weeks|area|rooms-->…<!--/EST--> */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(here, '..');
const load = (f) => new Function(fs.readFileSync(path.join(rootDir, 'js', f), 'utf8'))();
load('plans.js');
load('estimate.js');
const P = globalThis.CHALK_PLANS, E = globalThis.CHALK_EST;

const HERO_PHOTOS = {
  liv: 'img/a-living-800.webp', kit: 'img/a-kitchen-800.webp', mbr: 'img/a-master-800.webp',
  mb: 'img/a-mbath-800.webp', br2: 'img/a-study-800.webp', cb: 'img/a-cbath-800.webp',
  cor: 'img/a-entry-800.webp'
};
const HERO_HREFS = {
  liv: 'work.html#tampines-living', kit: 'work.html#tampines-kitchen', mbr: 'work.html#tampines-master',
  mb: 'work.html#tampines-mbath', br2: 'work.html#tampines-study', cb: 'work.html#tampines-cbath',
  cor: 'work.html#tampines-entry', br3: 'work.html#tampines', hs: 'work.html#tampines'
};

/* what each room's scope means, in the client's words */
const PHRASE = {
  'living:light': 'Paint, lights and points',
  'living:standard': 'Vinyl overlay, cove lighting, TV console',
  'living:full': 'Hacked and re-tiled, cove lighting, console, fluted feature wall',
  'kitchen:light': 'Paint, lights and points',
  'kitchen:standard': 'Quartz L-run on new carpentry, backsplash, plumbing',
  'kitchen:full': 'Hacked to bare, re-tiled floor to ceiling, quartz L-run, glass sliding door',
  'bed:light': 'Paint, lights and points',
  'bed:standard': 'Vinyl, full-height wardrobe, new door',
  'bed:full': 'Hacked, vinyl, wardrobe, platform bed with headboard',
  'study:light': 'Paint, lights and points',
  'study:standard': 'Vinyl, built-in desk along the window, open shelves',
  'study:full': 'Hacked, vinyl, built-in desk, open shelves',
  'bath:light': 'New sanitary ware and vanity',
  'bath:standard': 'Overlay tiles, re-plumbed, vanity, glass screen',
  'bath:full': 'Hacked, waterproofed, re-tiled, re-plumbed, vanity, glass screen',
  'entry:light': 'Paint, lights and points',
  'entry:standard': 'Vinyl, full-height shoe cabinet',
  'entry:full': 'Re-tiled, shoe cabinet, new fire-rated main door',
  'hs:light': 'Paint and vinyl; shelter walls stay as built',
  'yard:light': 'Paint and points',
  'yard:standard': 'Overlay tiles, new sink and tap',
  'store:light': 'Paint and a point',
  'store:standard': 'Vinyl and shelving',
  'utility:light': 'Paint and a point',
  'utility:standard': 'Vinyl and shelving',
  'balcony:light': 'Paint and a point',
  'balcony:standard': 'Overlay tiles'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const parsePicks = (s) => {
  const picks = {};
  (s || '').split(',').forEach((kv) => { const [k, v] = kv.split('='); if (k) picks[k] = v || 'standard'; });
  return picks;
};

function sheet(planId, picks) {
  const e = E.estimate(planId, picks);
  const plan = e.plan;
  let rows = '';
  for (const r of plan.rooms) {
    const est = e.rooms.find((x) => x.id === r.id);
    if (est) {
      rows += `<tr data-room="${r.id}"><th scope="row">${esc(r.name)}</th><td class="desc">${esc(PHRASE[r.kind + ':' + est.scope] || est.scope)}</td><td class="amt">${E.money(est.total)}</td></tr>\n`;
    } else {
      rows += `<tr data-room="${r.id}" class="out"><th scope="row">${esc(r.name)}</th><td class="desc">Not touched</td><td class="amt">—</td></tr>\n`;
    }
  }
  rows += `<tr data-room="site"><th scope="row">Site</th><td class="desc">Protection, haulage${e.anyFull ? ' with hacking debris' : ''}, chemical wash${e.anyFull ? ', permit' : ''}</td><td class="amt">${E.money(e.siteTotal)}</td></tr>\n`;
  return rows;
}

function lines(planId, picks) {
  const e = E.estimate(planId, picks);
  const r = e.rooms[0];
  let h = '';
  for (const l of r.lines) {
    h += `<div class="quote-row"><dl><dt>${esc(l.label)}</dt><dd>${l.qty} ${esc(l.unit)} × S$${l.rate}</dd><dd class="tot">${E.money(l.amount)}</dd></dl></div>\n`;
  }
  h += `<div class="quote-total"><span>${esc(r.name)}, ${esc(E.SCOPES[r.scope].label.toLowerCase())} scope, ${r.area} m²</span><span class="num">${E.money(r.total)}</span></div>\n`;
  return h;
}

function rooms(planId) {
  const plan = P.PLANS[planId];
  let h = '';
  for (const r of plan.rooms) {
    const m = P.measure(r), allowed = P.KINDS[r.kind].scopes;
    h += `<li class="rm" data-room="${r.id}"><input type="checkbox" id="r-${r.id}" data-room="${r.id}"><label for="r-${r.id}">${esc(r.name)}<small>${Math.round(m.area * 10) / 10} m²</small></label><span class="amt" data-amt="${r.id}">—</span><span class="scope" role="radiogroup" aria-label="Scope for ${esc(r.name)}">`;
    for (const s of ['light', 'standard', 'full']) {
      const ok = allowed.indexOf(s) !== -1;
      const checked = (s === 'standard' && ok) || (s === 'light' && allowed.length === 1);
      h += `<label><input type="radio" name="s-${r.id}" value="${s}"${ok ? '' : ' disabled'}${checked ? ' checked' : ''}><span>${E.SCOPES[s].label}</span></label>`;
    }
    if (r.kind === 'hs') h += '<span class="scope__note">Shelter walls stay as built; paint and floor only.</span>';
    h += '</span></li>\n';
  }
  return h;
}

function est(planId, picks, field) {
  const e = E.estimate(planId, picks);
  if (field === 'sum') return E.money(e.subtotal);
  if (field === 'band') return E.band(e);
  if (field === 'weeks') return String(E.weeks(e));
  if (field === 'area') return (Math.round(P.totalArea(e.plan) * 10) / 10) + ' m²';
  if (field === 'rooms') return String(e.rooms.length);
  throw new Error('unknown EST field ' + field);
}

function plan(spec) {
  const [mode, planId = 'hdb4', extra = ''] = spec.split(':');
  if (mode === 'hero') {
    return P.render(P.PLANS.hdb4, { uid: 'hero', mode: 'hero', photos: HERO_PHOTOS, hrefs: HERO_HREFS,
      scoped: ['liv', 'kit', 'mbr', 'mb', 'br2', 'cb', 'cor', 'br3', 'hs'] });
  }
  if (mode === 'pick') return P.render(P.PLANS[planId], { uid: 'pick', mode: 'pick' });
  if (mode === 'mini') return P.render(P.PLANS[planId], { uid: 'mini-' + planId, mode: 'mini', scoped: extra.split(',').filter(Boolean), labels: false, dims: false });
  throw new Error('unknown PLAN mode ' + mode);
}

const files = fs.readdirSync(rootDir).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const fp = path.join(rootDir, f);
  let html = fs.readFileSync(fp, 'utf8'), n = 0;
  html = html.replace(/<!--PLAN:([^>]+?)-->[\s\S]*?<!--\/PLAN-->/g, (m, spec) => { n++; return `<!--PLAN:${spec}-->\n${plan(spec.trim())}\n<!--/PLAN-->`; });
  html = html.replace(/<!--SHEET:([a-z0-9]+):([^>]*?)-->[\s\S]*?<!--\/SHEET-->/g, (m, id, picks) => { n++; return `<!--SHEET:${id}:${picks}-->\n${sheet(id, parsePicks(picks))}<!--/SHEET-->`; });
  html = html.replace(/<!--LINES:([a-z0-9]+):([^>]*?)-->[\s\S]*?<!--\/LINES-->/g, (m, id, picks) => { n++; return `<!--LINES:${id}:${picks}-->\n${lines(id, parsePicks(picks))}<!--/LINES-->`; });
  html = html.replace(/<!--ROOMS:([a-z0-9]+)-->[\s\S]*?<!--\/ROOMS-->/g, (m, id) => { n++; return `<!--ROOMS:${id}-->\n${rooms(id)}<!--/ROOMS-->`; });
  html = html.replace(/<!--EST:([a-z0-9]+):([^:>]*?):([a-z]+)-->[\s\S]*?<!--\/EST-->/g, (m, id, picks, field) => { n++; return `<!--EST:${id}:${picks}:${field}-->${est(id, parsePicks(picks), field)}<!--/EST-->`; });
  fs.writeFileSync(fp, html);
  console.log(f, n, 'markers baked');
}
