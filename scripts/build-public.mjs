#!/usr/bin/env node
/* Build the PUBLIC copy of the catalog for Cloudflare Pages.
 *
 * COPY-ONLY: reads tracked files from this git checkout and writes them to an
 * output folder OUTSIDE the repo. It never moves, renames, edits or deletes
 * anything in the repo. The private side (password gate, client previews,
 * /portfolio, api/, middleware) is excluded and stays on Vercel.
 *
 * usage: node scripts/build-public.mjs [outDir] [baseline.json]
 *   outDir        default ../dist-public (next to the worktree)
 *   baseline.json optional crawl of the live host, used only to print a parity diff
 */
import { execSync, execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, rmSync, readFileSync, writeFileSync, statSync, existsSync, createReadStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const repo = resolve(process.cwd());
const outDir = resolve(process.argv[2] || join(repo, '..', 'dist-public'));
const baselinePath = process.argv[3];
const LIMIT = 25 * 1024 * 1024;          // Cloudflare Pages: 25 MiB per file
const TARGET = 23 * 1024 * 1024;         // re-encode target, keeps a margin
const MAX_FILES = 19000;                 // free plan: 20,000

// ---- the private side: never copied -------------------------------------
// Keep in sync with CLIENT_PREVIEW_SLUGS in middleware.js (checked below).
const GATED_SLUGS = ['professor-brawn', 'timestealer-cafe', 'gig-cafe', 'fancy-nails-paradise',
  'cafe-bombom', 'threes-a-crowd', 'ae-unisex-salon', 'esteem-auto-medics-v3', 'esteem-auto-medics'];
const PRIVATE_PREFIXES = ['portfolio/', 'api/', 'db/', ...GATED_SLUGS.map(s => `templates/${s}/`)];
const SERVER_FILES = new Set(['middleware.js', 'vercel.json', '.vercelignore', '.gitignore']);
// same intent as .vercelignore: internal docs/tooling, never served
const isIgnoredByVercelRules = p =>
  p.startsWith('scripts/') ||            // migration tooling lives in git, never in the public copy
  /(^|\/)\.DS_Store$/.test(p) || /\.md$/i.test(p) || p.startsWith('.claude/') || p.startsWith('.impeccable/') ||
  p.includes('/.claude/') || p.includes('/.impeccable/') || /(^|\/)\.gitignore$/.test(p);

// safety: the gated list here must match middleware.js exactly
const mw = readFileSync(join(repo, 'middleware.js'), 'utf8');
const mwSlugs = (mw.match(/CLIENT_PREVIEW_SLUGS\s*=\s*\[([^\]]*)\]/) || [, ''])[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
if (mwSlugs.slice().sort().join() !== GATED_SLUGS.slice().sort().join()) {
  console.error('STOP: GATED_SLUGS differs from middleware.js CLIENT_PREVIEW_SLUGS.\n  middleware:', mwSlugs.join(','), '\n  this script:', GATED_SLUGS.join(','));
  process.exit(2);
}

const tracked = execSync('git ls-files -z', { cwd: repo, maxBuffer: 1 << 28 }).toString('utf8').split('\0').filter(Boolean);
const keep = [], skipped = { private: 0, server: 0, ignored: 0 };
for (const p of tracked) {
  if (PRIVATE_PREFIXES.some(x => p.startsWith(x))) { skipped.private++; continue; }
  if (SERVER_FILES.has(p)) { skipped.server++; continue; }
  if (isIgnoredByVercelRules(p)) { skipped.ignored++; continue; }
  keep.push(p);
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Exact git blob bytes (HEAD), NOT the working-tree file: a Windows checkout has core.autocrlf=true and
// would convert every text file to CRLF, so the copy would differ from what the live site (built on Linux) serves.
const blob = p => execFileSync('git', ['cat-file', 'blob', `HEAD:${p}`], { cwd: repo, maxBuffer: 1 << 30 });
const sha = f => new Promise((ok, no) => { const h = createHash('sha256'); createReadStream(f).on('data', d => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', no); });
const manifest = {}, mediaManifest = {}; const problems = [];

// Videos (mp4/webm) do NOT go to the static-assets origin: Cloudflare static assets ignore Range requests and
// were unreliable for video in testing. They go to ./dist-media (exact bytes, same relative paths) for R2.
const isMedia = p => /\.(mp4|webm|mp3)$/i.test(p);   // anything a browser seeks with Range (Safari needs it for audio too)
const mediaDir = join(outDir, '..', 'dist-media');
if (existsSync(mediaDir)) rmSync(mediaDir, { recursive: true, force: true });
mkdirSync(mediaDir, { recursive: true });

for (const p of keep) {
  const dst = join(isMedia(p) ? mediaDir : outDir, p);
  mkdirSync(dirname(dst), { recursive: true });
  const buf = blob(p);
  if (!isMedia(p) && buf.length > LIMIT) { problems.push(`over 25 MiB: ${p} (${(buf.length / 1048576).toFixed(1)} MiB)`); continue; }
  writeFileSync(dst, buf);
}

// ---- leak scan (the Verifier re-runs an independent one) ----------------
const leaks = [];
for (const p of keep) {
  if (PRIVATE_PREFIXES.some(x => p.startsWith(x)) || SERVER_FILES.has(p)) leaks.push(p);
  if (/(^|\/)\.env/.test(p) || /\.(pem|key|p12|pfx)$/i.test(p)) leaks.push(p);
}
for (const p of keep) { // hash what actually landed in dist / dist-media
  const f = join(isMedia(p) ? mediaDir : outDir, p); if (!existsSync(f)) continue;
  (isMedia(p) ? mediaManifest : manifest)[p] = { size: statSync(f).size, sha256: await sha(f) };
}

// ---- directory URLs -------------------------------------------------------
// The live host (Vercel, exact serving) answers /dir and /dir/ from dir/index.html and also
// answers /dir/index.html and /page.html directly. Cloudflare's html_handling must stay "none"
// (its other modes 307-redirect .html / index.html URLs, which would leak the origin host through
// the Vercel proxy), so the directory forms are mapped with 200 rewrites in a generated _redirects.
const dirsWithIndex = keep.filter(p => p.endsWith('/index.html') && existsSync(join(outDir, p))).map(p => p.slice(0, -'/index.html'.length));
const unsafeDirs = dirsWithIndex.filter(d => /[\s:*]/.test(d));      // ':' '*' and spaces are special in _redirects
const safeDirs = dirsWithIndex.filter(d => !/[\s:*]/.test(d));
const rules = ['/ /index.html 200', ...safeDirs.map(d => `/${d}/ /${d}/index.html 200`)];
const withNoSlash = rules.length + safeDirs.length <= 1900;          // limit: 2,000 static rules
if (withNoSlash) rules.push(...safeDirs.map(d => `/${d} /${d}/index.html 200`));
writeFileSync(join(outDir, '_redirects'), rules.join('\n') + '\n');
manifest['_redirects'] = { size: statSync(join(outDir, '_redirects')).size, sha256: await sha(join(outDir, '_redirects')), generated: true };

const files = Object.keys(manifest);
if (files.length > MAX_FILES) problems.push(`too many files: ${files.length}`);
const over = files.filter(p => manifest[p].size > LIMIT);
if (over.length) problems.push(`files over 25 MiB: ${over.join(', ')}`);

// ---- optional parity diff vs the live baseline --------------------------
let parity = null;
if (baselinePath && existsSync(baselinePath)) {
  const live = JSON.parse(readFileSync(baselinePath, 'utf8')).results;
  const enc = p => '/' + p.split('/').map(encodeURIComponent).join('/');
  const included = new Set([...files, ...Object.keys(mediaManifest)].map(enc));
  const liveOkNotBuilt = Object.entries(live).filter(([u, r]) => r.status === 200 && !included.has(u) && !u.endsWith('/') && u !== '/' && !u.includes('?'));
  const builtNotLive = [...files, ...Object.keys(mediaManifest)].filter(p => { const r = live[enc(p)]; return !r || r.status !== 200; });
  parity = { liveServes200ButNotInBuild: liveOkNotBuilt.map(x => x[0]), inBuildButLiveNot200: builtNotLive };
}

writeFileSync(join(outDir, '..', 'dist-manifest.json'), JSON.stringify({ builtAt: new Date().toISOString(), commit: execSync('git rev-parse --short HEAD', { cwd: repo }).toString().trim(), count: files.length, files: manifest }, null, 1));
writeFileSync(join(outDir, '..', 'dist-media-manifest.json'), JSON.stringify({ builtAt: new Date().toISOString(), count: Object.keys(mediaManifest).length, files: mediaManifest }, null, 1));
const totalMiB = +(files.reduce((a, p) => a + manifest[p].size, 0) / 1048576).toFixed(0);
const mediaMiB = +(Object.values(mediaManifest).reduce((a, m) => a + m.size, 0) / 1048576).toFixed(0);
const report = { outDir, tracked: tracked.length, copied: files.length, totalMiB, media: { dir: mediaDir, files: Object.keys(mediaManifest).length, MiB: mediaMiB }, skipped, redirects: { rules: rules.length, withNoSlash, unsafeDirsSkipped: unsafeDirs }, leaks, problems, parity: parity && { liveServes200ButNotInBuild: parity.liveServes200ButNotInBuild.length, inBuildButLiveNot200: parity.inBuildButLiveNot200.length, sampleA: parity.liveServes200ButNotInBuild.slice(0, 10), sampleB: parity.inBuildButLiveNot200.slice(0, 10) } };
console.log(JSON.stringify(report, null, 2));
if (leaks.length || problems.length) { console.error('\nBUILD HAS PROBLEMS — do not deploy.'); process.exit(1); }
