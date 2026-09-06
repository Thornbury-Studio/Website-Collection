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

const STYLE = `Night interior (or night exterior for the yard) of a shuttered tropical match factory in maritime Southeast Asia, photographed as if on 35mm tungsten film. The only light is a single struck match: a small teardrop of orange-amber flame that carves a cone of warm light into otherwise near-black space. Surfaces are sooty brick, oil-dark timber, wax-stained pine, iron troughs, and pale wooden match splints. Palette strictly limited to soot black, wax-cream wood, dull iron, and the orange of the flame — no blue moonlight, no neon, no green exit signs, no purple, no cyan. Fine film grain, deep shadows that still hold brick texture, no HDR flattening, no lens-flare spikes, no fog machines, no volumetric god-rays. NO people, NO faces, NO hands, NO fingers, NO human silhouettes, NO mannequins, NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame. Markings, if any, are abstract scratches and stains only.`;

const FRAMES = {
  dip: {
    file: 'dip.png',
    ratio: '16:9',
    subject: 'A long brick dipping hall. Rows of iron troughs filled with dark wax recede into darkness. Racks of pale wooden match splints stand beside the nearest trough. One small match flame sits in the left foreground, lighting the nearest wax surface, a stretch of sooty brick, and the first rack. The hall is empty and still.',
  },
  packing: {
    file: 'packing.png',
    ratio: '16:9',
    subject: 'A packing floor. Stacks of unlabelled cream cardboard matchboxes on timber pallets form a narrow aisle. One match flame at waist height lights the nearest stack and the worn floorboards; the rest of the room falls to soot. Empty. No printing on the boxes — plain cream board only.',
  },
  vault: {
    file: 'vault.png',
    ratio: '16:9',
    subject: 'A small brick chemical vault. Walls stained dull rust-brown from phosphorus compound, not bright red, not neon. Sealed iron drums, a timber bench, one match flame revealing the stained brick and the dull metal. Empty and tight.',
  },
  yard: {
    file: 'yard.png',
    ratio: '16:9',
    subject: 'Exterior of a two-storey tropical brick factory at night in light monsoon rain. Louvered vents, a corrugated roof, a yard of packed earth and puddles. One small upper window glows warm from a match inside; the puddles pick up that single reflection. No people, no cars, no signage.',
  },
  match: {
    file: 'match.png',
    ratio: '3:4',
    subject: 'Extreme close-up of a single wooden match, just struck, teardrop orange flame, charred black head, pale poplar shaft. It stands planted in a small unseen mound of wax, in otherwise complete darkness, so only the flame and a few centimetres of wood exist. NO hand, NO fingers, NO person.',
  },
  splints: {
    file: 'splints.png',
    ratio: '16:9',
    subject: 'Dense drying racks of thousands of unlabelled wooden match splints, seen from a narrow aisle. The nearest rack catches the match-light so the wood grain reads; the racks recede into black. Empty of people.',
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
