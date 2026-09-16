/* FIRST CRACK — crop, grade and export the licensed photographs.
 *
 * One warm temperature for every plate: colour held a little under the
 * master, contrast eased up, a touch of warmth pushed into the shadows so
 * green coffee, kraft paper, a cooling tray and a morning cup read as the
 * same room. Nothing is lifted or crushed; the glass panels meter their
 * own contrast against these plates at runtime.
 *
 *   node tools/grade.mjs            # everything
 *   node tools/grade.mjs green      # one plate
 */
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const out = join(here, '..', 'img');
mkdirSync(out, { recursive: true });

const WARM = (sat, lift = 0) => `eq=contrast=1.05:brightness=${lift}:saturation=${sat}:gamma=1.0,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.01:bm=-0.02:rh=0.01:bh=-0.01`;
const SHARP = 'unsharp=5:5:0.3:5:5:0';

const PLATES = {
  /* Bags: green coffee spilling from a burlap sack. Light plate. */
  green:   { src: '290419421.jpg', sat: 0.82, sizes: [2400, 1400, 800], q: 74 },
  /* Notes: a cappuccino on a wooden table in morning light. Light plate. */
  morning: { src: '452446137.jpg', sat: 0.85, sizes: [2400, 1400, 800], q: 72 },
  /* Roastery: beans going into the hopper. */
  hopper:  { src: '198707303.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 },
  /* Origins hero: hands holding a sack of green coffee. */
  sack:    { src: '377913992.jpg', sat: 0.82, sizes: [2400, 1400, 800], q: 72 },
  /* Origins: green against roasted, side by side. Panoramic. */
  split:   { src: '1878901703.jpg', sat: 0.85, sizes: [2400, 1400, 800], q: 72 },
  /* Brewing: the kettle over the dripper, dark. */
  brew:    { src: '603875080.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 },
  /* Brewing: pour-over on the wooden table, warm and light. */
  dripper: { src: '580435224.jpg', sat: 0.85, sizes: [2400, 1400, 800], q: 72 },
  /* Origins: beans on slate, macro. Dark. */
  slate:   { src: '296202842.jpg', sat: 0.85, sizes: [2400, 1400, 800], q: 72 },
  /* Origins: beans with smoke. Dark, panoramic. */
  smoke:   { src: '289223913.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 70 },
  /* Roastery: the cooling cylinder from above. */
  cylinder: { src: '272645455.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 },
  /* Freshness: beans going into the bag. */
  bagging: { src: '1064147071.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 },
  /* Roastery: the roaster with a paper bag. Dark, warm. */
  roaster: { src: '449430750.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 },
  /* Texture: roasted beans, full frame. */
  beans:   { src: '277515109.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 70 },
  /* Brewing: drip coffee in low light. */
  lowlight: { src: '283875300.jpg', sat: 0.8, sizes: [2400, 1400, 800], q: 72 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

const only = process.argv.slice(2);
for (const [name, p] of Object.entries(PLATES)) {
  if (only.length && !only.includes(name)) continue;
  for (const w of p.sizes) {
    const filters = [p.crop, `scale=${w}:-2:flags=lanczos`, WARM(p.sat, p.lift || 0), SHARP].filter(Boolean).join(',');
    const file = w === p.sizes[0] ? `${name}.webp` : `${name}-${w}.webp`;
    run(['-i', join(raw, p.src), '-vf', filters, '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(p.q), '-compression_level', '6', join(out, file)]);
  }
  console.log('graded', name);
}

/* Share image: the cooling cylinder at 1.91:1. */
if (!only.length || only.includes('og')) {
  run(['-i', join(raw, '272645455.jpg'), '-vf', ['crop=4000:2094:0:286', 'scale=1200:-2:flags=lanczos', WARM(0.8), SHARP].join(','), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', join(out, 'og.webp')]);
  console.log('graded og');
}
