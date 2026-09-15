/* APOGEE — cut, grade and encode the six licensed clips.
 *
 * Same quiet grade as the photographs (tools/grade.mjs): colour to two
 * thirds, blacks lifted a touch, a little blue in the shadows. The wing
 * clip was shot on descent, into cloud; it is played backwards here, so
 * the aircraft climbs out of it. Masters are ProRes or HEVC at 3840×2160
 * and 4096×2304, and one portrait master at 2160×3840; they live in tools/raw/
 * on the build machine and are not shipped.
 *
 *   node tools/encode.mjs            # everything
 *   node tools/encode.mjs deck       # one clip
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

const QUIET = (sat) => `eq=contrast=1.04:brightness=0.005:saturation=${sat}:gamma=1.02,colorbalance=rs=-0.02:bs=0.04:rm=-0.01:bm=0.02`;

const CLIPS = {
  /* The climb, middle: a private-jet wing rising out of cloud (the master reversed). */
  wing:  { src: '470419800.mov', ss: 0, t: 10, w: 1920, h: 1080, crf: 23, sat: 0.62, reverse: true, poster: 0 },
  /* The climb, top: a cloud deck from far above, drifting. */
  deck:  { src: '589794660.mov', ss: 2, t: 12, w: 1920, h: 1080, crf: 23, sat: 0.62, poster: 0 },
  /* The climb, apex: the cloud deck far below and the horizon, from forty thousand feet. Holds at the top. */
  apex:  { src: '939422575.mov', ss: 0, t: 10, w: 1920, h: 1080, crf: 23, sat: 0.7, poster: 0 },
  /* The cabin: a slow pan along cream leather and the windows. */
  cabin: { src: '301279898.mov', ss: 0, t: 12, w: 1920, h: 1080, crf: 23, sat: 0.72, poster: 0 },
  /* The host, walking the cabin toward the camera. Portrait. */
  host:  { src: '846924700.mov', ss: 0, t: 10, w: 1080, h: 1920, crf: 24, sat: 0.72, poster: 0 },
  /* A jet on the apron, waiting. Request page. 4096 wide, cropped to 16:9. */
  apron: { src: '175646036.mov', ss: 0, t: 12, w: 1920, h: 1080, crf: 24, sat: 0.55, crop: 'crop=4096:2304:0:0', poster: 0 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

function encode(name) {
  const c = CLIPS[name];
  const filters = [c.reverse ? 'reverse' : null, c.crop, `scale=${c.w}:${c.h}:flags=lanczos`, QUIET(c.sat), 'unsharp=3:3:0.3:3:3:0', 'format=yuv420p'].filter(Boolean).join(',');
  const out = join(video, `${name}.mp4`);
  run([
    '-ss', String(c.ss), '-t', String(c.t), '-i', join(raw, c.src),
    '-vf', filters, '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(c.crf), '-profile:v', 'high', '-level', '4.2',
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-movflags', '+faststart', out
  ]);
  run(['-ss', String(c.poster), '-i', out, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6', join(img, `${name}-poster.webp`)]);
  console.log('encoded', name);
}

const only = process.argv.slice(2);
for (const name of Object.keys(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  encode(name);
}
