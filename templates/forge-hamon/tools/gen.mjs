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

const STYLE = `Photographed on 35mm film with a fast prime lens inside a small working bladesmith's shop — a two-bay, stone-floored workshop in a converted water mill. Real materials only: forge-scale black oxide, ground and polished steel, coal, oak, stone, oil, leather. Palette strictly cool near-black, grey steel, bone-white daylight, and the red-orange of hot steel — NO blue neon, NO purple, NO magenta, NO cyan, NO teal, NO green, NO gold or bronze glamour lighting, NO colour grading toward amber. Fine film grain; deep shadows that still hold surface texture; shallow depth of field; no HDR flattening, no lens flare, no fog machine, no volumetric god-rays, no sparks storm. NO people, NO faces, NO hands, NO fingers, NO arms, NO human silhouettes, NO mannequins, NO text, NO numbers, NO letters, NO logos, NO labels, NO stamped writing, NO maker's marks, NO engraving anywhere in the frame. Any marking is abstract scratch, scale or stain only.`;

const FRAMES = {
  hamon: {
    file: 'hamon.png',
    ratio: '16:9',
    subject: `A single finished chef's knife blade lying diagonally across a scarred dark steel bench top. The blade is polished bright; along its lower third runs a soft cloudy white temper line with a gently wavy upper border, clearly lighter than the darker, finer steel above it. One low warm rim light from the right picks out the spine; the rest of the bench falls to near-black. The handle is out of frame. Blank blade — no writing, no stamp, no etched name.`,
  },
  billet: {
    file: 'billet.png',
    ratio: '16:9',
    subject: `Three flat steel bars stacked and clamped into a cold billet, resting on a stone bench in plain flat grey daylight from a high window. Mill scale, bandsaw marks, a wire brush and a pair of steel dividers beside it. Cold, grey, matter-of-fact. No heat, no fire, no glow.`,
  },
  weld: {
    file: 'weld.png',
    ratio: '16:9',
    subject: `A stacked steel billet at forge-welding heat lying in the bed of a coal forge: white-yellow at its core, deep orange at its edges, the coal bed glowing dull red around it, the shop beyond falling to black. A thin haze of flux smoke lifts off the surface.`,
  },
  anvil: {
    file: 'anvil.png',
    ratio: '16:9',
    subject: `A cross-peen hammer and a pair of long flat-jaw tongs resting on the face of a worn anvil, lit only by the red glow of a forge just out of frame to the left. The anvil face is scarred, chipped at the far edge and polished mirror-smooth in the middle by use. Everything past the anvil falls to black.`,
  },
  quench: {
    file: 'quench.png',
    ratio: '16:9',
    subject: `A blade at orange heat entering a black steel quench tank of oil, edge first, half submerged. The oil surface flashes with low flame along the blade and heavy grey smoke rolls upward. Night shop, near-black surroundings, the only light coming from the blade and the burning oil.`,
  },
  grain: {
    file: 'grain.png',
    ratio: '16:9',
    subject: `Extreme macro of an etched pattern-welded steel surface: many dozens of fine alternating dark and bright layers folded into a rippling ladder pattern, with the polished edge bevel crossing the lower third of the frame at a shallow angle. Grey, black and silver only — no colour cast at all. Razor-thin depth of field.`,
  },
  bench: {
    file: 'bench.png',
    ratio: '16:9',
    subject: `A bladesmith's finishing bench in flat grey daylight from a tall north window: oilstones in a wooden box, a rack of files, a leather strop, handle blanks in oak and dark walnut, an old bench vice, and hand tools hung on a plain board behind. Dust hanging in the daylight. Cool and quiet — no fire, no artificial colour, no glow.`,
  },
  edge: {
    file: 'edge.png',
    ratio: '16:9',
    subject: `Three finished kitchen knives laid in an even row on a pale oak board, photographed from directly overhead in flat grey daylight. Blades bright and plain with soft cloudy temper lines, handles in dark oiled hardwood with brass pins. Quiet, catalogue-like, generous empty board around them. Blank blades — no writing, no stamps.`,
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
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(name, model, `try ${attempt + 1}`);
        const got = await generate(model, prompt, frame.ratio);
        writeFileSync(out, got.buf);
        console.log('wrote', out, 'via', got.model, got.buf.length);
        return { name, model: got.model, bytes: got.buf.length };
      } catch (e) {
        last = e;
        console.log('fail', name, e.message, e.status || '', (e.body || '').slice(0, 200));
        if (e.status === 429 || e.status === 503) await sleep(8000 * (attempt + 1));
        else break;
      }
    }
  }
  console.log('GIVING UP on', name, last && last.message);
  return { name, failed: true, error: last && last.message };
}

const arg = process.argv[2];
const names = arg === '--all' || !arg || arg === '--force' ? Object.keys(FRAMES) : [arg];

const report = [];
for (const name of names) {
  report.push(await one(name));
}
writeFileSync(join(here, 'gen-report.json'), JSON.stringify(report, null, 2));
console.log('done', JSON.stringify(report));
