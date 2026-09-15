/* ASCENT — crop, grade and export the licensed photographs.
 *
 * One temperature for every plate: colour pulled to about two thirds,
 * contrast eased up a touch, blacks left deep so the plates sit in the
 * page's near-black, cool shadows and a little warmth in the highlights
 * (the only warm thing on the site is the light).
 *
 *   node tools/grade.mjs            # everything
 *   node tools/grade.mjs decide     # one plate
 */
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const out = join(here, '..', 'img');
mkdirSync(out, { recursive: true });

const COOL = (sat, lift = 0) => `eq=contrast=1.06:brightness=${lift - 0.01}:saturation=${sat}:gamma=0.98,colorbalance=rs=-0.03:bs=0.04:rm=-0.01:bm=0.015:rh=0.02:bh=-0.01`;
const SHARP = 'unsharp=5:5:0.3:5:5:0';

const PLATES = {
  /* The decision: grey peaks under storm cloud. Sharp plate the fog clears from. */
  decide:  { src: '404347410.jpg', sat: 0.55, sizes: [2400, 1400, 800], q: 74 },
  /* Blue ridges in cloud layers. Protocol page band, share image. */
  ridge:   { src: '158124758.jpg', sat: 0.6,  sizes: [2400, 1400, 800], q: 74 },
  /* Focus: one peak out of the fog. Portrait. */
  focus:   { src: '265070919.jpg', sat: 0.5, lift: -0.05, sizes: [1400, 900, 600], q: 72 },
  /* Discipline: a snow face in fog. Portrait. */
  discipline: { src: '556647321.jpg', sat: 0.55, sizes: [1400, 900, 600], q: 72 },
  /* Consistency: a figure walking the ridge above the cloud. Portrait. */
  consistency: { src: '318232485.jpg', sat: 0.6, sizes: [1400, 900, 600], q: 72 },
  /* Repetition: the same ridge, again and again, into the haze. Portrait. */
  repetition: { src: '486490296.jpg', sat: 0.38, lift: -0.09, sizes: [1400, 900, 600], q: 72 },
  /* Sitting above the cloud. Method section. Portrait 4:5. */
  above:   { src: '416717019.jpg', sat: 0.6, sizes: [1400, 900, 600], q: 72 },
  /* Storm over the meadow. Under-pressure band. Panoramic. */
  storm:   { src: '947281776.jpg', sat: 0.55, sizes: [2400, 1400, 800], q: 72 },
  /* Chalked hand on the hold. The week. */
  hand:    { src: '399273737.jpg', sat: 0.6, sizes: [1600, 900], q: 72 },
  /* Matterhorn in grey cloud. Protocol page. */
  horn:    { src: '473879093.jpg', sat: 0.5, sizes: [2400, 1400, 800], q: 72 },
  /* Towers coming out of cloud. Protocol page. */
  towers:  { src: '489887303.jpg', sat: 0.55, sizes: [2400, 1400, 800], q: 72 },
  /* A road into fog before dawn. Apply page hero. */
  road:    { src: '291223274.jpg', sat: 0.45, lift: -0.04, sizes: [2400, 1400, 800], q: 72 },
  /* A road in massive fog, almost nothing visible. */
  haze:    { src: '482009068.jpg', sat: 0.5, lift: 0.01, sizes: [2400, 1400, 800], q: 70 },
  /* Silhouette on the rock above the cloud sea. Panoramic. */
  stand:   { src: '235455328.jpg', sat: 0.55, sizes: [2400, 1400, 800], q: 72 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

const only = process.argv.slice(2);
for (const [name, p] of Object.entries(PLATES)) {
  if (only.length && !only.includes(name)) continue;
  for (const w of p.sizes) {
    const filters = [p.crop, `scale=${w}:-2:flags=lanczos`, COOL(p.sat, p.lift), SHARP].filter(Boolean).join(',');
    const file = w === p.sizes[0] ? `${name}.webp` : `${name}-${w}.webp`;
    run(['-i', join(raw, p.src), '-vf', filters, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(p.q), '-compression_level', '6', join(out, file)]);
  }
  console.log('graded', name);
}

/* Share image: the ridge plate at 1.91:1. */
if (!only.length || only.includes('og')) {
  run(['-i', join(raw, '158124758.jpg'), '-vf', ['crop=5616:2940:0:110', 'scale=1200:-2:flags=lanczos', COOL(0.6), SHARP].join(','), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', join(out, 'og.webp')]);
  console.log('graded og');
}
