/* REDOUT — cut, grade and encode the five licensed clips.
 *
 * The palette is black, white and one red, and the red is reserved for the
 * brand: it shows up on the buttons, the hazard bands and the veil that
 * floods the edges of the screen when you scroll hard. So the footage has
 * to give its colour up. Every clip gets the same pass — saturation pulled
 * to a third, contrast up, blue lifted into the shadows — which turns a
 * rust-orange railway bridge, a beige logistics hall and a sunset rugby
 * pitch into the same grey-steel world. What survives is the speed.
 *
 * Masters are ProRes at 2160×3840 (the three portrait feeds), 4096×2160 (the
 * bench) and 3840×2160 (the pitch). They live in tools/raw/ on the build
 * machine and are not shipped. Exports are H.264 at the size the layout
 * actually shows — a feed column is never wider than a third of the screen,
 * so 1080 across it is already more than a 4K monitor can use.
 *
 *   node tools/encode.mjs            # everything
 *   node tools/encode.mjs wall-a     # one clip
 */
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, 'raw');
const video = join(here, '..', 'video');
const img = join(here, '..', 'img');
mkdirSync(video, { recursive: true });
mkdirSync(img, { recursive: true });

/* The steel grade. Same numbers on every clip; the photographs in grade.mjs
 * use the same pass so a still and a frame sit next to each other without
 * a seam in tone. */
const STEEL = 'eq=contrast=1.14:brightness=-0.022:saturation=0.30:gamma=0.96,colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rm=-0.02:bm=0.03:rh=-0.01:bh=0.01';
const SHARP = 'unsharp=3:3:0.35:3:3:0';

const CLIPS = {
  /* The feed wall. Three portrait masters, each cut to the nine or ten
   * seconds where the flight is lowest and the structure closest. */
  'wall-a': { src: '1124840956.mov', ss: 5.5, t: 9.5, w: 1080, h: 1920, crf: 23, poster: 0.0 },
  'wall-b': { src: '817944064.mov',  ss: 2.0, t: 9.5, w: 1080, h: 1920, crf: 25, poster: 0.0 },
  'wall-c': { src: '1124833486.mov', ss: 14.0, t: 9.5, w: 1080, h: 1920, crf: 23, poster: 0.0 },
  /* The bench, from directly overhead. 4096 wide, cropped to 16:9 on the centre. */
  'pit':    { src: '583562226.mov',  ss: 4.0, t: 10.0, w: 1920, h: 1080, crf: 24, crop: 'crop=3840:2160:128:0', poster: 0.0 },
  /* The pitch: the run at the posts and the dive under them. Season page hero. */
  'posts':  { src: '554398903.mov',  ss: 0.4, t: 9.6, w: 1920, h: 1080, crf: 24, poster: 2.6 }
};

function run(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

function encode(name) {
  const c = CLIPS[name];
  const filters = [c.crop, `scale=${c.w}:${c.h}:flags=lanczos`, STEEL, SHARP, 'format=yuv420p'].filter(Boolean).join(',');
  const out = join(video, `${name}.mp4`);
  run([
    '-ss', String(c.ss), '-t', String(c.t), '-i', join(raw, c.src),
    '-vf', filters, '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(c.crf), '-profile:v', 'high', '-level', '4.2',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
    '-movflags', '+faststart', out
  ]);
  /* Poster: one frame of the encoded file, so it matches the video to the
   * pixel and the swap from still to motion is invisible. */
  run(['-ss', String(c.poster), '-i', out, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6', join(img, `${name}-poster.webp`)]);
  console.log('encoded', name);
}

const only = process.argv.slice(2);
for (const name of Object.keys(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  encode(name);
}
