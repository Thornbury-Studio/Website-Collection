/* HAMON — one grade pass over the licensed plates, then WebP exports.
 *
 * The whole point of the pass is temperature: the licensed frames arrive warm
 * (stock blacksmith photography is graded amber by default) and this site is
 * steel, not bronze. Every frame gets blue lifted into the shadows, global
 * saturation pulled down, and only the highlights left warm — so the ember
 * survives as a hot core and nothing else in the frame is allowed to be amber.
 *
 * node tools/grade.mjs
 */
import { mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const out = join(here, '..', 'img');
mkdirSync(out, { recursive: true });

const SHARP = 'unsharp=5:5:0.45:5:5:0.0';

const PLATES = {
  hero: {
    src: '6144x3865',
    crop: 'crop=6144:3456:0:204',
    grade: 'eq=contrast=1.07:brightness=-0.015:saturation=0.90:gamma=0.97,colorbalance=bs=0.045:bm=0.02',
    sizes: [2000, 1000],
  },
  grain: {
    src: '6000x4000',
    crop: 'crop=6000:3375:0:330',
    grade: 'eq=contrast=1.08:brightness=-0.02:saturation=0.60:gamma=0.97,colorbalance=rs=-0.03:bs=0.065:rm=-0.02:bm=0.03',
    sizes: [1800, 900],
  },
  forge: {
    src: '6240x4160',
    crop: 'crop=6240:3510:0:325',
    grade: 'eq=contrast=1.05:brightness=-0.03:saturation=0.85:gamma=0.96,colorbalance=rs=-0.04:bs=0.07:bm=0.02:rh=0.03',
    sizes: [1800, 900],
  },
  anvil: {
    src: '6240x4160',
    crop: 'crop=6240:3510:0:325',
    /* The warmest frame in the set by a wide margin: the anvil body and the
     * whole background read khaki-amber straight out of the library. Yellow is
     * cut at the source with selectivecolor (reds are left alone so the blade
     * keeps its heat), then the usual cool-shadow pass on top. */
    grade: 'selectivecolor=reds=0 0 0.10 0:yellows=0.02 0 -0.62 0.04:neutrals=0.03 0 -0.16 0,eq=contrast=1.09:brightness=-0.04:saturation=0.72:gamma=0.93,colorbalance=rs=-0.07:bs=0.11:rm=-0.05:bm=0.07:rh=0.03:bh=-0.03',
    sizes: [1800, 900],
  },
};

function ff(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

for (const [name, p] of Object.entries(PLATES)) {
  const src = join(raw, `${name}.jpg`);
  if (!existsSync(src)) { console.log('missing', src); continue; }
  for (const w of p.sizes) {
    const suffix = w === p.sizes[0] ? '' : `-${w}`;
    const dest = join(out, `${name}${suffix}.webp`);
    const vf = [p.crop, `scale=${w}:-2:flags=lanczos`, p.grade, SHARP].join(',');
    ff(['-i', src, '-vf', vf, '-quality', '78', '-compression_level', '6', dest]);
    console.log('wrote', dest);
  }
}

/* Social card — a tighter 1.91:1 crop of the graded hero. */
{
  const src = join(raw, 'hero.jpg');
  const vf = [
    'crop=6144:3216:0:324',
    'scale=1200:-2:flags=lanczos',
    PLATES.hero.grade,
    SHARP,
  ].join(',');
  ff(['-i', src, '-vf', vf, '-quality', '80', join(out, 'og.webp')]);
  console.log('wrote og.webp');
}
