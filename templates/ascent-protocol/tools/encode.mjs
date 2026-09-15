/* ASCENT — cut, grade, loop and encode the four licensed clips.
 *
 * Same cool grade as the photographs (tools/grade.mjs). Every clip is
 * made to loop without a cut: the last F seconds of the segment are
 * cross-faded into its first F seconds, and the file starts F seconds
 * in, so the wrap lands on the frame the fade arrived at. Masters are
 * ProRes or H.264 at 3840x2160 and 4096x1716; they live in tools/raw/ on
 * the build machine and are not shipped.
 *
 *   node tools/encode.mjs            # everything
 *   node tools/encode.mjs fog        # one clip
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

const COOL = (sat) => `eq=contrast=1.06:brightness=-0.01:saturation=${sat}:gamma=0.98,colorbalance=rs=-0.03:bs=0.04:rm=-0.01:bm=0.015:rh=0.02:bh=-0.01`;

const CLIPS = {
  /* Home hero: fog rolling over a dark fir ridge. */
  ridge: { src: '476256403.mov', ss: 2, d: 13, f: 1.5, w: 1920, h: 1080, crf: 24, sat: 0.5, fps: 24, small: 960 },
  /* The decision: pure fog. Sits behind the glass and clears. */
  fog:   { src: '513769794.mov', ss: 1, d: 11, f: 1.5, w: 1280, h: 720, crf: 27, sat: 0.4, fps: 24 },
  /* Protocol page hero: storm inversion over snow ridges. 2.39:1 master. */
  storm: { src: '393401933.mov', ss: 4, d: 14, f: 1.5, w: 1920, h: 804, crf: 24, sat: 0.5, fps: 30, small: 960 },
  /* Apply page: walking the road. */
  road:  { src: '564302069.mov', ss: 0.5, d: 12, f: 1.5, w: 1920, h: 1080, crf: 24, sat: 0.5, fps: 25, small: 960 }
};

function run(args) { execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); }

function encode(name) {
  const c = CLIPS[name];
  const s = c.ss, d = c.d, f = c.f;
  const targets = [[c.w, c.h, `${name}.mp4`, c.crf]];
  if (c.small) targets.push([c.small, Math.round(c.h * c.small / c.w / 2) * 2, `${name}-sm.mp4`, c.crf + 1]);
  for (const [w, h, file, crf] of targets) {
    const pre = `scale=${w}:${h}:flags=lanczos,${COOL(c.sat)},format=yuv420p,fps=${c.fps}`;
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
  run(['-i', join(video, `${name}.mp4`), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '70', '-compression_level', '6', join(img, `${name}-poster.webp`)]);
  console.log('encoded', name);
}

const only = process.argv.slice(2);
for (const name of Object.keys(CLIPS)) {
  if (only.length && !only.includes(name)) continue;
  encode(name);
}
