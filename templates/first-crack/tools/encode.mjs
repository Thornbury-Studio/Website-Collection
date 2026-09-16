/* FIRST CRACK — cut, grade, loop and encode the four licensed clips.
 *
 * Same warm grade as the photographs (tools/grade.mjs). Every clip loops
 * without a cut: the last F seconds of the segment are cross-faded into
 * its first F seconds and the file begins F seconds in, so the wrap lands
 * on the frame the fade arrived at. Masters are ProRes and MJPEG at
 * 3840x2160 and 4096x2304; they live in tools/raw/ on the build machine
 * and are not shipped.
 *
 *   node tools/encode.mjs            # everything
 *   node tools/encode.mjs hero       # one clip
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

const WARM = (sat) => `eq=contrast=1.05:brightness=0:saturation=${sat}:gamma=1.0,colorbalance=rs=0.03:gs=0.0:bs=-0.04:rm=0.01:bm=-0.02:rh=0.01:bh=-0.01`;

const CLIPS = {
  /* Home hero: the cooling tray, arm turning through fresh roast. */
  hero:    { src: '484266104.mov', ss: 1.5, d: 11, f: 1.5, w: 1920, h: 1080, crf: 28, sat: 0.82, fps: 30, small: 960 },
  /* The roast: smoke lifting off beans. Sits behind the curve sheet. */
  roast:   { src: '515590024.mov', ss: 3, d: 11, f: 1.5, w: 1920, h: 1080, crf: 27, sat: 0.75, fps: 30, small: 960 },
  /* Subscription: beans scattering across a dark counter. */
  scatter: { src: '472143423.mov', ss: 4, d: 11, f: 1.5, w: 1920, h: 1080, crf: 27, sat: 0.8, fps: 25, small: 960 },
  /* Freshness: a cup being poured, steam in backlight. */
  pour:    { src: '525370684.mov', ss: 2, d: 11, f: 1.5, w: 1920, h: 1080, crf: 27, sat: 0.8, fps: 25, small: 960 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

function encode(name) {
  const c = CLIPS[name];
  const s = c.ss, d = c.d, f = c.f;
  const targets = [[c.w, c.h, `${name}.mp4`, c.crf]];
  if (c.small) targets.push([c.small, Math.round(c.h * c.small / c.w / 2) * 2, `${name}-sm.mp4`, c.crf + 1]);
  for (const [w, h, file, crf] of targets) {
    const pre = `scale=${w}:${h}:flags=lanczos,${WARM(c.sat)},format=yuv420p,fps=${c.fps}`;
    const graph = [
      `[0:v]trim=start=${s + f}:end=${s + d},setpts=PTS-STARTPTS,${pre}[mid]`,
      `[0:v]trim=start=${s + d}:end=${s + d + f},setpts=PTS-STARTPTS,${pre}[tail]`,
      `[0:v]trim=start=${s}:end=${s + f},setpts=PTS-STARTPTS,${pre}[head]`,
      `[tail][head]xfade=transition=fade:duration=${f}:offset=0[x]`,
      `[mid][x]concat=n=2:v=1:a=0[out]`
    ].join(';');
    run([
      '-i', join(raw, c.src), '-filter_complex', graph, '-map', '[out]', '-an',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-level', '4.1',
      '-g', String(c.fps * 2), '-keyint_min', String(c.fps * 2), '-sc_threshold', '0', '-movflags', '+faststart', join(video, file)
    ]);
  }
  run(['-i', join(video, `${name}.mp4`), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6', join(img, `${name}-poster.webp`)]);
  console.log('encoded', name);
}

const only = process.argv.slice(2);
for (const name of Object.keys(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  encode(name);
}
