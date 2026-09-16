import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const rawDir = join(here, 'raw');
mkdirSync(rawDir, { recursive: true });

const env = readFileSync(join(repo, '.env'), 'utf8');
const key = (env.match(/^GEMINI_API_KEY=(.+)$/m) || [])[1];
if (!key) {
  console.error('no GEMINI_API_KEY in .env');
  process.exit(1);
}

const STYLE = `Luxury dark-studio coffee product photography, shot on a black void with no visible table, no seamless paper edge, no backdrop texture. A single warm key from upper left (3200K) and a thin cool specular rim on ceramic from the right. Shallow depth of field, 85mm, f/2.8, fine grain, no HDR flattening, no neon, no purple, no cyan gel, no fog, no god-rays, no UI, no chrome. Palette: soot black, warm cream foam, toasted caramel, dusty rose pastry, pistachio macaron. NO people, NO faces, NO hands, NO fingers, NO text, NO numbers, NO logos, NO labels, NO watermarks.`;

const FRAMES = {
  hero: {
    file: 'stack-hero.png',
    ratio: '1:1',
    subject: 'A floating ceramic cup of latte with microfoam, a sharp coffee splash arcing above the rim, three macarons (dusty rose, pistachio, cocoa) hovering around the cup as if in mid-air. Everything sits in a pure black studio. Product hero, centred, generous dark margin.',
  },
  cup: {
    file: 'stack-cup.png',
    ratio: '1:1',
    subject: 'A single ceramic coffee cup with latte microfoam, floating on a PURE BLACK background. No table, no saucer, no macarons, no splash, no steam clouds. Isolated product cutout on #000000. Cup occupies the centre, about 55% of the frame.',
  },
  splash: {
    file: 'stack-splash.png',
    ratio: '1:1',
    subject: 'An isolated coffee splash and a few airborne droplets on a PURE BLACK background. Liquid caramel-brown espresso, sharp highlights. No cup, no pastry, no table. Subject only on #000000, centred in the upper half.',
  },
  macL: {
    file: 'stack-macaron-l.png',
    ratio: '1:1',
    subject: 'One dusty-rose macaron, isolated, floating on a PURE BLACK background. No plate, no crumbs elsewhere, no cup. Subject only on #000000, placed left of centre.',
  },
  macR: {
    file: 'stack-macaron-r.png',
    ratio: '1:1',
    subject: 'One pistachio-green macaron, isolated, floating on a PURE BLACK background. No plate, no cup. Subject only on #000000, placed right of centre.',
  },
  flat: {
    file: 'menu-flat.png',
    ratio: '1:1',
    subject: 'Overhead three-quarter view of an oat flat white in a matte ceramic cup, dark studio, warm key, crema visible, no saucer text, no logo. Close product still for a menu card.',
  },
  basque: {
    file: 'menu-basque.png',
    ratio: '1:1',
    subject: 'A slice of Basque burnt cheesecake on a dark ceramic plate, caramelised top, creamy interior, dark studio, warm key. Close product still for a menu card. No fork, no garnish that reads as restaurant plating theatre.',
  },
  cortado: {
    file: 'menu-cortado.png',
    ratio: '1:1',
    subject: 'A cortado in a small glass, equal espresso and steamed milk, dark studio, warm key, tight crop. Close product still for a menu card.',
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
}
writeFileSync(join(here, 'gen-report.json'), JSON.stringify(report, null, 2));
console.log('done', report);
