/* APOGEE — crop, grade and export the ten licensed photographs.
 *
 * The site is bone and ink. The photographs are asked to be quiet: colour
 * pulled to about two thirds, contrast eased rather than pushed, blacks
 * lifted a touch so nothing on the page is harder than the type, and a
 * little blue in the shadows so an apron, a cabin and a night runway read
 * as one temperature. The cabin plates keep their warmth in the highlights
 * — cream leather is the one warm thing the brand owns.
 *
 *   node tools/grade.mjs
 */
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const out = join(here, '..', 'img');
mkdirSync(out, { recursive: true });

const QUIET = (sat, lift) => `eq=contrast=1.04:brightness=${lift}:saturation=${sat}:gamma=1.02,colorbalance=rs=-0.02:bs=0.04:rm=-0.01:bm=0.02`;
const SHARP = 'unsharp=5:5:0.35:5:5:0';

const PLATES = {
  /* Home hero: a large-cabin jet on the apron, stairs down, waiting. */
  apron:    { src: '165963897.jpg', sat: 0.66, lift: 0.01,  sizes: [2400, 1400, 800], q: 74 },
  /* Fleet page hero: a business jet on approach, landing lights on, clean sky. */
  approach: { src: '631923686.jpg', sat: 0.62, lift: 0.0,   sizes: [2400, 1400, 800], q: 72 },
  /* Programme page hero: a wing at night on a snowy runway, blue taxi lights. */
  night:    { src: '921816819.jpg', sat: 0.70, lift: 0.015, sizes: [2400, 1400, 800], q: 72 },
  /* A mid-size jet with the stairs down beside the hangar. Request page. */
  stairs:   { src: '330061589.jpg', sat: 0.66, lift: 0.01,  sizes: [2000, 1200, 800], q: 72 },
  /* Nose gear with the streamer still on. Fleet page detail. */
  gear:     { src: '232690415.jpg', sat: 0.60, lift: 0.0,   crop: 'crop=6000:3750:0:125', sizes: [1600, 900], q: 72 },
  /* A seat, a cup holder, cream leather. Cabin detail. */
  seat:     { src: '297618980.jpg', sat: 0.74, lift: 0.0,   sizes: [1600, 900], q: 72 },
  /* The cabin, empty, curtains half drawn. */
  cabin:    { src: '311310903.jpg', sat: 0.72, lift: 0.0,   sizes: [2000, 1200, 800], q: 72 },
  /* Nobody in the cabin: a table, a laptop, two glasses. */
  table:    { src: '479398762.jpg', sat: 0.72, lift: 0.0,   sizes: [2000, 1200, 800], q: 72 },
  /* The host bringing the shade down. Discretion. */
  shade:    { src: '482312066.jpg', sat: 0.66, lift: 0.0,   sizes: [2400, 1400, 800], q: 72 },
  /* Panoramic: the host setting the table. Request page band. */
  service:  { src: '346134202.jpg', sat: 0.70, lift: 0.0,   sizes: [2400, 1400, 800], q: 72 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

for (const [name, p] of Object.entries(PLATES)) {
  for (const w of p.sizes) {
    const filters = [p.crop, `scale=${w}:-2:flags=lanczos`, QUIET(p.sat, p.lift), SHARP].filter(Boolean).join(',');
    const file = w === p.sizes[0] ? `${name}.webp` : `${name}-${w}.webp`;
    run(['-i', join(raw, p.src), '-vf', filters, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(p.q), '-compression_level', '6', join(out, file)]);
  }
  console.log('graded', name);
}

/* Share image: the apron plate at 1.91:1. */
run(['-i', join(raw, '165963897.jpg'), '-vf', ['crop=3888:2036:0:300', 'scale=1200:-2:flags=lanczos', QUIET(0.66, 0.01), SHARP].join(','), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', join(out, 'og.webp')]);
console.log('graded og');
