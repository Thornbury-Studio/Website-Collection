/* Offline bake for the hero specimen: one photograph in, three files out.
 *
 *   img/lily-1600.webp  - the photograph, 1600 wide, backdrop flattened, metadata dropped
 *   img/lily-900.webp   - same frame at 900 wide, the mobile poster
 *   img/lily-relief.png - RGB: R = depth, G/B = surface normal x/y
 *
 * Depth comes from Depth Anything V2 Small (Apache-2.0, ONNX build from
 * onnx-community). The larger V2 checkpoints are non-commercial and are not
 * used. Only the baked PNG ships; the model and its weights stay out of the repo.
 *
 * usage: node bake.mjs <source.jpg> <out-dir>
 * needs: sharp, @huggingface/transformers (install them next to this file's
 * working copy, not in the template - templates carry no package.json).
 */
import sharp from 'sharp';
import { pipeline, env } from '@huggingface/transformers';
import { join } from 'node:path';

env.cacheDir = process.env.HF_CACHE || './hf-cache';
const [src, out] = process.argv.slice(2);

const W = 800, H = 600;          // relief texture size
const NORMAL_GAIN = 150;         // depth change per texel -> slope, tuned by eye

// The studio backdrop in the source is a grey gradient (RGB 4..25). Flatten it
// to one colour so the page can match it exactly: the flower is strongly
// chromatic, the backdrop is not, so chroma is the matte.
const BG = [10, 8, 7];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Keep the flower and drop everything else that happens to be coloured: loose specks and the
// dark green leaf that sits under one tepal. Largest connected chromatic region, grown a little.
function mainMask(chroma, w, h, thresh, grow) {
  const lab = new Int32Array(w * h), sizes = [0];
  let n = 0;
  const stack = new Int32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (lab[i] || chroma[i] < thresh) continue;
    n++; let sp = 0, size = 0; stack[sp++] = i; lab[i] = n;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % w, y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !lab[q] && chroma[q] >= thresh) { lab[q] = n; stack[sp++] = q; }
      }
    }
    sizes.push(size);
  }
  let best = 1; for (let k = 1; k <= n; k++) if (sizes[k] > sizes[best]) best = k;
  let m = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = lab[i] === best ? 1 : 0;
  for (let k = 0; k < 2; k++) m = boxBlur(m, w, h, grow);
  return m.map(v => (v > 0.01 ? 1 : 0));
}

async function flatten(width, file, quality) {
  const { data, info } = await sharp(src).resize(width, Math.round(width * 3 / 4), { kernel: 'lanczos3' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const chroma = new Float32Array(info.width * info.height);
  for (let i = 0; i < chroma.length; i++) chroma[i] = Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) - Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
  const keep = mainMask(chroma, info.width, info.height, 40, Math.round(width / 130));
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = smooth(6, 30, chroma[i / 3]) * keep[i / 3];
    data[i] = BG[0] + m * (r - BG[0]);
    data[i + 1] = BG[1] + m * (g - BG[1]);
    data[i + 2] = BG[2] + m * (b - BG[2]);
  }
  await sharp(data, { raw: info }).webp({ quality, effort: 6 }).toFile(join(out, file));
}
await flatten(1600, 'lily-1600.webp', 84);
await flatten(900, 'lily-900.webp', 82);

const est = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });
const res = await est(src);
const d = res.depth;

// The model returns 8-bit depth. Smooth it at full size in floating point,
// then sample the grid, so the 8-bit steps never reach the normals as rings.
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  const k = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / k;
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / k;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}
let big = Float32Array.from(d.data, v => v / 255);
for (let i = 0; i < 4; i++) big = boxBlur(big, d.width, d.height, 9);
const f = new Float32Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    f[y * W + x] = big[Math.min(d.height - 1, Math.round((y + 0.5) * d.height / H)) * d.width + Math.min(d.width - 1, Math.round((x + 0.5) * d.width / W))];
  }
}

// stretch between the 0.5th and 99.5th percentile so the full byte range is used
const sorted = Float32Array.from(f).sort();
const lo = sorted[Math.floor(sorted.length * 0.005)];
const hi = sorted[Math.floor(sorted.length * 0.995)];
for (let i = 0; i < f.length; i++) f[i] = Math.min(1, Math.max(0, (f[i] - lo) / (hi - lo)));

// Outside the flower the model reports "far". Left as is, the mesh would tear
// along every petal edge when it tilts, so grow the silhouette's own depth
// outward over the backdrop; the backdrop itself is cut out in the shader.
const rgb = await sharp(src).resize(W, H).removeAlpha().raw().toBuffer();
const chroma8 = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) chroma8[i] = Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) - Math.min(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
const known = Uint8Array.from(mainMask(chroma8, W, H, 22, 3));
const flower = known.slice();
for (let pass = 0; pass < 140; pass++) {
  const next = known.slice(), grown = f.slice();
  let any = false;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (known[i]) continue;
      let sum = 0, n = 0;
      for (const j of [i - 1, i + 1, i - W, i + W]) if (known[j]) { sum += f[j]; n++; }
      if (n) { grown[i] = sum / n; next[i] = 1; any = true; }
    }
  }
  f.set(grown); known.set(next);
  if (!any) break;
}

const at = (x, y) => f[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
const px = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const gx = (at(x + 2, y) - at(x - 2, y)) * 0.25 * NORMAL_GAIN;
    const gy = (at(x, y + 2) - at(x, y - 2)) * 0.25 * NORMAL_GAIN;
    const l = Math.hypot(gx, gy, 1);
    const i = (y * W + x) * 3;
    px[i] = Math.round(f[y * W + x] * 255);
    px[i + 1] = Math.round((-gx / l * 0.5 + 0.5) * 255);
    px[i + 2] = Math.round((gy / l * 0.5 + 0.5) * 255);
  }
}
// beyond a margin around the flower nothing is drawn, so spend no bytes there
let near = flower.slice();
for (let pass = 0; pass < 14; pass++) {
  const nx = near.slice();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (near[i - 1] || near[i + 1] || near[i - W] || near[i + W]) nx[i] = 1;
  }
  near = nx;
}
for (let i = 0; i < W * H; i++) {
  if (!near[i]) { px[i * 3] = 0; px[i * 3 + 1] = 128; px[i * 3 + 2] = 128; }
}
await sharp(px, { raw: { width: W, height: H, channels: 3 } })
  .png({ compressionLevel: 9, palette: false })
  .toFile(join(out, 'lily-relief.png'));
