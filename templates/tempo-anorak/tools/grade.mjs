/* ANORAK — crop, grade and export the six licensed plates.
 *
 * The palette is bone, ink and one ultramarine. Stock running photography
 * arrives saturated and cheerful, because that is what the libraries reward,
 * so every plate here gets the same treatment: contrast up a little,
 * saturation down a lot, blue lifted into the shadows. What survives is the
 * subject and the weather, not the colour grading of whoever shot it.
 *
 * Two plates are deliberate exceptions.
 *
 * `warm` and `cold` are the two halves of the conditions wipe on the home
 * page, so they are the only pair that must disagree: warm keeps its amber,
 * cold keeps its blue, and they are graded to the same contrast and the same
 * black point so the seam between them reads as weather rather than as two
 * different photographs.
 *
 * `fabric` is not a photograph on the page at all. It is desaturated to
 * luminance and mapped through a blue ramp, so the ultramarine plate in the
 * middle of the site is literally a picture of the cloth.
 *
 *   node tools/grade.mjs
 */
import { mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const out = join(here, '..', 'img');
mkdirSync(out, { recursive: true });

const SHARP = 'unsharp=5:5:0.40:5:5:0.0';

/* gray -> ultramarine ramp. At val 200 this lands near #2E44E0, which is the
 * --blue token plus a little air; at val 60 it is a deep navy. */
const BLUE_RAMP = "lutrgb=r='clip(val*0.22-6,0,255)':g='clip(val*0.30+4,0,255)':b='clip(val*0.55+130,0,255)'";

const PLATES = {
  /* Top-down runner on asphalt. Cropped 4:5 so the figure and its shadow own
   * a tall column beside the headline. Saturation is low but not zero — the
   * orange socks are the only warm thing on the home page and they are worth
   * keeping opposite the blue.
   *
   * Fresh asphalt is sensor noise as far as WebP is concerned — ungraded it
   * costs more than a megabyte at this width, which is absurd for one plate.
   * hqdn3d takes the grain out before the encoder has to pay for it. */
  hero: {
    src: '5447x3632',
    crop: 'crop=2906:3632:1230:0',
    grade: 'hqdn3d=12:9:14:14,gblur=sigma=0.9,eq=contrast=1.13:brightness=-0.018:saturation=0.66:gamma=0.97,colorbalance=rs=-0.02:bs=0.05:bm=0.02',
    sharp: 'unsharp=5:5:0.55:5:5:0',
    sizes: [1200, 700],
    q: 58,
  },
  /* Snow, pines, a runner going away. The cold half of the wipe. */
  cold: {
    src: '7360x4912',
    crop: 'crop=7360:4140:0:300',
    grade: 'eq=contrast=1.09:brightness=-0.012:saturation=0.68:gamma=0.98,colorbalance=rs=-0.05:bs=0.09:bm=0.04:bh=0.02',
    sizes: [1600, 900],
  },
  /* Dust, sun, a runner coming at you. The warm half. Amber is pulled back
   * far enough to stop it fighting the blue, and no further — this plate has
   * to still read as heat when it sits next to `cold`. */
  warm: {
    src: '7952x4532',
    crop: 'crop=7952:4473:0:30',
    grade: 'selectivecolor=yellows=0.02 0 -0.30 0.02,eq=contrast=1.09:brightness=-0.012:saturation=0.74:gamma=0.98,colorbalance=rs=-0.02:bs=0.04',
    sizes: [1600, 900],
  },
  /* Polyester knit macro -> luminance -> ultramarine. This is the blue plate. */
  fabric: {
    src: '6000x4000',
    crop: 'crop=6000:1800:0:1100',
    grade: `format=gray,eq=contrast=2.0:brightness=-0.02:gamma=0.95,${BLUE_RAMP}`,
    sizes: [1800, 1000],
  },
  /* The same frame as `cold`, cut 4:5 and held tighter on the runner: the
   * Crosswind page needs a portrait plate of somebody actually wearing a
   * shell, and this is the only licensed frame in the set where one appears. */
  shell: {
    src: '7360x4912 (same source as cold)',
    crop: 'crop=3930:4912:1715:0',
    grade: 'eq=contrast=1.09:brightness=-0.012:saturation=0.68:gamma=0.98,colorbalance=rs=-0.05:bs=0.09:bm=0.04:bh=0.02',
    sizes: [1000, 600],
  },
  /* Gravel, mountains, a runner from behind. The field plate. */
  field: {
    src: '6016x4188',
    crop: 'crop=6016:3384:0:330',
    grade: 'eq=contrast=1.08:brightness=-0.02:saturation=0.60:gamma=0.96,colorbalance=rs=-0.04:bs=0.07:bm=0.03',
    sizes: [1600, 900],
  },
  /* Legs and shoes on dirt. Red trainers are cut at the source: the accent on
   * this site is one blue, and a second loud colour in a supporting plate
   * would make it two. */
  detail: {
    src: '5994x4024',
    crop: 'crop=3219:4024:1687:0',
    grade: 'selectivecolor=reds=0 0.16 0.20 0.14:yellows=0 0 -0.34 0.04,eq=contrast=1.09:brightness=-0.03:saturation=0.40:gamma=0.95,colorbalance=rs=-0.05:bs=0.08:bm=0.03',
    sizes: [1000, 600],
  },
};

/* 1.91:1 share card, cut from the hero before its 4:5 crop. */
const OG = {
  from: 'hero',
  crop: 'crop=5447:2852:0:420',
  grade: PLATES.hero.grade,
  width: 1200,
  q: 62,
};

function ff(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

for (const [name, p] of Object.entries(PLATES)) {
  const src = join(raw, `${name}.jpg`);
  if (!existsSync(src)) { console.log('missing', src); continue; }
  for (const w of p.sizes) {
    const suffix = w === p.sizes[0] ? '' : `-${w}`;
    const dst = join(out, `${name}${suffix}.webp`);
    ff(['-i', src, '-vf', `${p.crop},${p.grade},scale=${w}:-2:flags=lanczos,${p.sharp || SHARP}`,
        '-c:v', 'libwebp', '-quality', String(p.q || 76), '-compression_level', '6', dst]);
    console.log('wrote', dst);
  }
}

const ogSrc = join(raw, `${OG.from}.jpg`);
if (existsSync(ogSrc)) {
  const dst = join(out, 'og.webp');
  ff(['-i', ogSrc, '-vf', `${OG.crop},${OG.grade},scale=${OG.width}:-2:flags=lanczos,${SHARP}`,
      '-c:v', 'libwebp', '-quality', String(OG.q), '-compression_level', '6', dst]);
  console.log('wrote', dst);
}
