#!/usr/bin/env node
/* Manager ratings for the hub cards (index.html).
 *
 * Every card shows ten dots in its browser-chrome bar. A rating is a human
 * judgement from 1 to 10, given only by a manager machine (BENCH or HELM).
 *   1-4  -> that many dots lit red      5-6  -> lit yellow      7-10 -> lit green
 * The unlit dots stay visible. An unrated card shows ten unlit dots.
 * A card whose data-facet is "experimental" has no dots and no rating: the bar
 * says EXPERIMENTAL instead.
 *
 * The source of truth is the data-rating attribute on the card's <a>. The dots
 * are generated from it by this script; never hand-edit them.
 *
 * usage:
 *   node scripts/ratings.mjs set <slug> <1-10>   manager machines only; rewrites index.html
 *   node scripts/ratings.mjs unset <slug>        manager machines only
 *   node scripts/ratings.mjs apply               re-render every bar from data-rating (no rating change)
 *   node scripts/ratings.mjs check [--base REF]  validate; with --base, every commit since REF that
 *                                                touches a data-rating must carry a `Rated-by:` trailer
 *                                                naming a manager machine
 *
 * Who is a manager: MANAGERS below. The machine is read from HUB_MACHINE, else
 * from the Admin-Hub clone's .machine file next to this repo. If neither can be
 * read, `set` refuses (fail closed). This is a guard against honest mistakes by
 * other machines and AI helpers, not a lock against someone editing the file by
 * hand; the Rated-by check in CI is the second tripwire.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANAGERS = ['BENCH', 'HELM'];
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(repo, 'index.html');

const tier = n => (n <= 4 ? 'red' : n <= 6 ? 'yellow' : 'green');

function dots(rating) {
  if (rating == null) {
    return '<div class="chrome" role="img" aria-label="Not yet rated">' + '<i></i>'.repeat(10) + '</div>';
  }
  return `<div class="chrome chrome--${tier(rating)}" role="img" aria-label="Manager rating ${rating} out of 10">` +
    '<i class="on"></i>'.repeat(rating) + '<i></i>'.repeat(10 - rating) + '</div>';
}
const experimentalBar = '<div class="chrome chrome--exp"><span>EXPERIMENTAL</span></div>';

const CARD = /(<a class="card[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/g;
const CHROME = /<div class="chrome[^"]*"[^>]*>[\s\S]*?<\/div>/;
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const slugOf = tag => ((attr(tag, 'href') || '').match(/^templates\/([^/]+)\//) || [])[1];

function transform(html, edit) {
  const problems = [];
  let rendered = 0;
  const out = html.replace(CARD, (whole, open, body, close) => {
    const slug = slugOf(open) || attr(open, 'href');
    const experimental = (attr(open, 'data-facet') || '').split(/\s+/).includes('experimental');
    if (edit && edit.slug === slug) {
      if (experimental) { problems.push(`${slug}: experimental cards cannot be rated`); }
      else if (edit.rating == null) open = open.replace(/\sdata-rating="[^"]*"/, '');
      else if (/\sdata-rating="/.test(open)) open = open.replace(/(\sdata-rating=")[^"]*(")/, `$1${edit.rating}$2`);
      else open = open.replace(/^<a class="card([^"]*)"/, `<a class="card$1" data-rating="${edit.rating}"`);
      edit.done = true;
    }
    const raw = attr(open, 'data-rating');
    let rating = null;
    if (raw != null) {
      if (!/^(10|[1-9])$/.test(raw)) problems.push(`${slug}: data-rating="${raw}" is not a whole number 1-10`);
      else rating = Number(raw);
      if (experimental) problems.push(`${slug}: experimental card carries a rating`);
    }
    if (!CHROME.test(body)) { problems.push(`${slug}: no chrome bar found`); return whole; }
    rendered++;
    return open + body.replace(CHROME, experimental ? experimentalBar : dots(rating)) + close;
  });
  return { out, problems, rendered };
}

function machine() {
  if (process.env.HUB_MACHINE) return process.env.HUB_MACHINE.trim();
  for (const p of [join(repo, '..', '..', 'Admin-Hub', '.machine'), join(repo, '..', 'Admin-Hub', '.machine')]) {
    if (existsSync(p)) return readFileSync(p, 'utf8').trim();
  }
  return '';
}
function requireManager() {
  const m = machine();
  if (!MANAGERS.includes(m)) {
    console.error(`REFUSED: only manager machines (${MANAGERS.join(', ')}) may give or change a rating. This machine is "${m || 'unknown'}".`);
    process.exit(3);
  }
  return m;
}

const [cmd, a, b] = process.argv.slice(2);
const html = readFileSync(FILE, 'utf8');

if (cmd === 'set' || cmd === 'unset') {
  const m = requireManager();
  const rating = cmd === 'set' ? b : null;
  if (cmd === 'set' && !/^(10|[1-9])$/.test(rating || '')) { console.error('rating must be a whole number 1-10'); process.exit(2); }
  const edit = { slug: a, rating: cmd === 'set' ? Number(rating) : null, done: false };
  const { out, problems } = transform(html, edit);
  if (!edit.done) problems.push(`no card with href templates/${a}/`);
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  writeFileSync(FILE, out);
  console.log(`${a}: ${cmd === 'set' ? rating + '/10' : 'rating removed'}\nCommit message must end with the line:\nRated-by: ${m}`);
} else if (cmd === 'apply') {
  const { out, problems, rendered } = transform(html);
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  writeFileSync(FILE, out);
  console.log(`re-rendered ${rendered} bars`);
} else if (cmd === 'check') {
  const { out, problems, rendered } = transform(html);
  if (out !== html) problems.push('a bar does not match its data-rating: run `node scripts/ratings.mjs apply`');
  const bi = process.argv.indexOf('--base');
  const base = bi > -1 ? process.argv[bi + 1] : '';
  if (base && !/^0+$/.test(base)) {
    const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    for (const sha of git('log', '--format=%H', '-G', 'data-rating=', `${base}..HEAD`, '--', 'index.html').split('\n').filter(Boolean)) {
      const msg = git('log', '-1', '--format=%B', sha);
      const m = msg.match(/^Rated-by:\s*(\S+)\s*$/m);
      if (!m || !MANAGERS.includes(m[1])) problems.push(`${sha.slice(0, 7)} changes a rating without "Rated-by: ${MANAGERS.join(' | ')}"`);
    }
  }
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`ok: ${rendered} cards`);
} else {
  console.error('usage: ratings.mjs set <slug> <1-10> | unset <slug> | apply | check [--base REF]');
  process.exit(2);
}
