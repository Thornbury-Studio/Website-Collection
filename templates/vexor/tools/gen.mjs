import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const repo = join(here, '..', '..', '..');
const rawDir = join(here, 'raw');
const imgDir = join(root, 'img');
mkdirSync(rawDir, { recursive: true });
mkdirSync(imgDir, { recursive: true });

const env = readFileSync(join(repo, '.env'), 'utf8');
const key = (env.match(/^GEMINI_API_KEY=(.+)$/m) || [])[1];
if (!key) {
  console.error('no GEMINI_API_KEY in .env');
  process.exit(1);
}

const STYLE = `Photoreal commercial motorcycle studio photography for a premium Singapore marque named VEXOR. Dark asphalt / charcoal studio ground, hard side light from camera-left, subtle signal-red (#E11D2E) accent only where natural on paint or stitching. No riders, no people, no hands, no logos, no brand text, no watermarks, no UI chrome, no purple glow, no neon cyberpunk. Sharp catalogue quality, 35mm look, shallow depth of field on details.`;

const FRAMES = {
  hero: {
    file: 'hero.jpg',
    ratio: '16:9',
    subject: 'Full-bleed hero: naked performance motorcycle three-quarter front view dominating frame, dark studio, signal-red frame accents, aggressive stance, asphalt floor reflecting faintly.',
  },
  thesis: {
    file: 'thesis.jpg',
    ratio: '4:3',
    subject: 'Close three-quarter of motorcycle front wheel, fork and brake caliper leaned slightly, dark asphalt texture, engineering still-life mood.',
  },
  'model-line': {
    file: 'model-line.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: naked streetfighter motorcycle, exposed engine, wide bars, signal-red accents, dark studio seamless.',
  },
  'model-hold': {
    file: 'model-hold.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: adventure motorcycle with tall screen, spoked front wheel, luggage rails, grey/ink paint, dark studio.',
  },
  'model-arc': {
    file: 'model-arc.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: fully faired supersport motorcycle with small winglets, race-white and ink paint, dark studio.',
  },
  'model-span': {
    file: 'model-span.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: touring motorcycle with tall electrically adjustable screen and soft side bags, midnight paint, dark studio.',
  },
  'model-volt': {
    file: 'model-volt.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: modern electric motorcycle, clean bodywork, belt drive, bone-white and ink, dark studio, no exhaust pipes.',
  },
  'model-trace': {
    file: 'model-trace.jpg',
    ratio: '16:9',
    subject: 'Catalogue plate: heritage motorcycle with round LED headlamp, low seat, British green tank, dark studio.',
  },
  'tech-chassis': {
    file: 'tech-chassis.jpg',
    ratio: '16:9',
    subject: 'Bare aluminium twin-spar motorcycle chassis on a dark engineering bench, hard light, no bodywork.',
  },
  'tech-power': {
    file: 'tech-power.jpg',
    ratio: '16:9',
    subject: 'Still life: motorcycle combustion engine beside a compact electric motor pack on dark bench, catalogue lighting.',
  },
  'tech-aids': {
    file: 'tech-aids.jpg',
    ratio: '16:9',
    subject: 'Motorcycle cockpit close-up: TFT dash and handlebar controls, dark ambient, readable but not showing fake brand logos.',
  },
  ownership: {
    file: 'ownership.jpg',
    ratio: '16:9',
    subject: 'Clean workshop bay with motorcycle on rear stand, tools neatly arranged, dark industrial but premium lighting.',
  },
  og: {
    file: 'og.jpg',
    ratio: '16:9',
    subject: 'Wide social crop: dramatic three-quarter motorcycle in dark studio with strong signal-red accent on frame, empty negative space on left for typography.',
  },
};

const MODELS = ['nano-banana-pro-preview', 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'];

function promptFor(frame) {
  return `${STYLE}\n\nSubject: ${frame.subject}`;
}

async function generate(model, prompt, ratio) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: ratio, imageSize: '2K' },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(`${model} HTTP ${res.status}`);
    err.status = res.status;
    err.body = await res.text().catch(() => '');
    throw err;
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      return Buffer.from(inline.data, 'base64');
    }
  }
  throw new Error(`${model} no image in response`);
}

async function one(name, frame) {
  const rawPath = join(rawDir, frame.file);
  const outJpg = join(imgDir, frame.file);
  const outWebp = join(imgDir, frame.file.replace(/\.jpg$/, '.webp'));
  if (existsSync(outWebp) || existsSync(outJpg)) {
    console.log('skip', name);
    return;
  }
  const prompt = promptFor(frame);
  let buf = null;
  let lastErr;
  for (const model of MODELS) {
    try {
      console.log('gen', name, model);
      buf = await generate(model, prompt, frame.ratio);
      break;
    } catch (e) {
      lastErr = e;
      console.warn('fail', name, model, e.status || e.message);
    }
  }
  if (!buf) throw lastErr || new Error('all models failed for ' + name);
  writeFileSync(rawPath, buf);
  writeFileSync(outJpg, buf);
  copyFileSync(outJpg, outWebp);
  console.log('ok', name, buf.length);
}

const only = process.argv[2];
const entries = Object.entries(FRAMES).filter(([k]) => !only || k === only);
for (const [name, frame] of entries) {
  await one(name, frame);
}
console.log('done');
