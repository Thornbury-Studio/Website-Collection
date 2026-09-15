/* REDOUT — crop, grade and export the six licensed photographs.
 *
 * Same steel pass as the footage in encode.mjs: saturation to a third,
 * contrast up, blue lifted into the shadows. A still and a video frame on
 * this site are graded by the same numbers, so the page never changes
 * temperature when it changes medium.
 *
 * One plate keeps a little more colour. `paddock` has a red racing frame
 * on the table in front of the pilots, and red is the only colour this
 * brand owns, so the frame is allowed to keep some of it.
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

const STEEL = (sat) => `eq=contrast=1.14:brightness=-0.022:saturation=${sat}:gamma=0.96,colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rm=-0.02:bm=0.03:rh=-0.01:bh=0.01`;
const SHARP = 'unsharp=5:5:0.45:5:5:0';

const PLATES = {
  /* A racing quad leaving the ground in its own dust. The plate behind the
   * four numbers on the home page. Full frame, 3:2. */
  sport:   { src: '367998622.jpg', sat: 0.30, sizes: [2400, 1400, 800], q: 70 },
  /* The same quad in the air, side on, against nothing. Pilots page hero. */
  flight:  { src: '658942409.jpg', sat: 0.30, sizes: [2400, 1400, 800], q: 70 },
  /* Race morning: a frame on the table, three pilots in goggles behind it.
   * Season page. */
  paddock: { src: '171413510.jpg', sat: 0.46, sizes: [2000, 1200, 800], q: 72 },
  /* Hands on a transmitter. Tickets page. Cropped to 16:9 on the hands. */
  hands:   { src: '141008011.jpg', sat: 0.30, crop: 'crop=6016:3384:0:400', sizes: [2000, 1200, 800], q: 70 },
  /* A pilot in goggles, profile, turbines behind. Pilots page. */
  goggles: { src: '545405593.jpg', sat: 0.30, sizes: [1800, 1000], q: 72 },
  /* Props, a motor, the tools. The bench plate on the home page. */
  parts:   { src: '695078236.jpg', sat: 0.34, sizes: [1600, 900], q: 72 }
};

function run(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

for (const [name, p] of Object.entries(PLATES)) {
  for (const w of p.sizes) {
    const filters = [p.crop, `scale=${w}:-2:flags=lanczos`, STEEL(p.sat), SHARP].filter(Boolean).join(',');
    const file = w === p.sizes[0] ? `${name}.webp` : `${name}-${w}.webp`;
    run(['-i', join(raw, p.src), '-vf', filters, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(p.q), '-compression_level', '6', join(out, file)]);
  }
  console.log('graded', name);
}

/* The share image: the dust plate at 1.91:1, tighter on the quad. */
run(['-i', join(raw, '367998622.jpg'), '-vf', ['crop=4928:2580:0:420', 'scale=1200:-2:flags=lanczos', STEEL(0.30), SHARP].join(','), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', join(out, 'og.webp')]);
console.log('graded og');
