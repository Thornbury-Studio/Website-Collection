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

const STYLE = `Premium perfume product photography for an independent fragrance house. Single unlabeled amber glass dropper bottle (15–50 ml) as the only product, centered, sharp macro, soft natural daylight from the left, pale limestone / warm plaster wall, quiet desk surface. Liquid colour shifts per scent brief. No people, no hands, no faces, no logos, no brand text, no labels, no packaging copy, no barcodes, no watermarks. Not CGI plastic, not glassmorphism UI, not cream lifestyle collage. Photoreal, commercial catalogue quality like a serious product page — cleaner and sharper than mass-market tumbler store photography.`;

const FRAMES = {
  'iris-stone': {
    file: 'scent-iris-stone.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is cool pale gold with a faint violet-grey cast (iris + bergamot + vetiver). Soft limestone powder mood, dry stone light. Quiet and cool.',
  },
  'violet-ash': {
    file: 'scent-violet-ash.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is dusty rose-smoke, deeper mauve toward the base (pink pepper + rose + labdanum). Evening warmth, soft ash-rose atmosphere.',
  },
  'yuzu-veil': {
    file: 'scent-yuzu-veil.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is bright green-gold citrus (yuzu + magnolia + ambroxan). Clear daylight, fresh and light, pale wall.',
  },
  'sambac-dusk': {
    file: 'scent-sambac-dusk.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is warm jasmine-honey amber with a wood-dark base (neroli + jasmine sambac + cedar). Late-day side light, humid dusk feel.',
  },
  'root-mirror': {
    file: 'scent-root-mirror.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is powdered iris violet over mineral amber (bergamot + orris butter + ambroxan). Signature bottle, precise and still.',
  },
  'resin-letter': {
    file: 'scent-resin-letter.jpg',
    ratio: '4:5',
    subject: 'Bottle liquid is sticky dusk resin brown-rose (pink pepper + magnolia + labdanum). Sealed-note mood, warmer desk wood edge barely visible.',
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
  const parts = json.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData && p.inlineData.data);
  if (!img) throw new Error(`${model} returned no image`);
  return { buf: Buffer.from(img.inlineData.data, 'base64'), model };
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function one(name) {
  const frame = FRAMES[name];
  if (!frame) throw new Error(`unknown frame ${name}`);
  const out = join(rawDir, frame.file);
  if (existsSync(out) && !process.argv.includes('--force')) {
    console.log('skip', name, '(exists)');
    copyFileSync(out, join(imgDir, frame.file));
    return { name, skipped: true };
  }
  const prompt = promptFor(frame);
  let last;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        console.log(name, model, `try ${attempt + 1}`);
        const got = await generate(model, prompt, frame.ratio);
        writeFileSync(out, got.buf);
        copyFileSync(out, join(imgDir, frame.file));
        console.log('wrote', out, 'via', got.model, got.buf.length);
        return { name, model: got.model, bytes: got.buf.length };
      } catch (e) {
        last = e;
        console.log('fail', name, e.message, e.status || '', (e.body || '').slice(0, 180));
        if (e.status === 429 || e.status === 503) await sleep(8000 * (attempt + 1));
        else break;
      }
    }
  }
  throw last || new Error('all models failed');
}

const arg = process.argv[2];
const names = arg === '--all' || !arg ? Object.keys(FRAMES) : [arg];

const report = [];
for (const name of names) {
  report.push(await one(name));
  await sleep(1500);
}
writeFileSync(join(here, 'gen-report.json'), JSON.stringify(report, null, 2));
console.log('done', report);
