// SEJUK image generation batch — nano banana with fallback + 429 marathon retry.
// Usage: node generate.mjs [jobName ...]   (no args = all pending jobs)
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENV = readFileSync(join(HERE, "..", "..", "..", ".env"), "utf8");
const KEY = ENV.match(/GEMINI_API_KEY\s*=\s*"?([^"\r\n]+)"?/)[1];
const LOG = join(HERE, "batch.log");
const log = (m) => appendFileSync(LOG, `[${new Date().toISOString()}] ${m}\n`);

const MODELS = ["nano-banana-pro-preview", "gemini-3.1-flash-image"];

// ONE style block, verbatim across every frame. Only the subject sentence varies.
const STYLE = `STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.`;

const BOWL = `served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation`;
const PLATE = `served on a small warm-grey stoneware plate`;

const JOBS = [
  // The eight ices — 1:1
  ["gunung-pandan", "1:1", `Subject: a tall snow-fine dome of pale green pandan milk ice ${BOWL}, thick dark amber palm-sugar syrup running slowly down its slopes and pooling at the rim, toasted coconut flakes scattered across the peak, one soft spoonful of pale-green coconut custard sliding down one side.`],
  ["bandung-monsoon", "1:1", `Subject: a tall snow-fine dome of rose-pink milk ice ${BOWL}, tiny translucent basil seeds clinging to the slopes like rain droplets, a thin ribbon of sweetened milk crowning the peak.`],
  ["malt-avalanche", "1:1", `Subject: a tall snow-fine dome of deep cocoa-brown malted milk ice ${BOWL}, chunks of dark chocolate rubble tumbling down one slope, a wide stripe of sweetened condensed milk poured over the summit and running toward the rim.`],
  ["chendol-glacier", "1:1", `Subject: a tall snow-fine dome of pure white coconut ice ${BOWL}, short soft green pandan jelly noodles draped around the base, glossy slow-cooked dark red beans clustered at one side, dark amber palm-sugar syrup running from the peak.`],
  ["soursop-squall", "1:1", `Subject: a tall dome of pale ivory soursop ice with a coarse sparkling granita texture ${BOWL}, two halves of a small round green calamansi lime resting on the peak, clear pale juice glistening between the ice crystals.`],
  ["mango-sticky-peak", "1:1", `Subject: a tall snow-fine dome of white coconut milk ice ${BOWL}, generous cubes of deep golden ripe mango stacked on the summit, a scatter of toasted puffed rice, pale golden salted coconut caramel running down two slopes.`],
  ["kopi-tarik-summit", "1:1", `Subject: a tall snow-fine dome of coffee-brown milk ice ${BOWL}, small golden butter-toast cubes stacked against the base, a generous ribbon of sweetened condensed milk pulled across the peak.`],
  ["lychee-kacang", "1:1", `Subject: a tall snow-fine dome of blush-white lychee ice ${BOWL}, whole peeled translucent lychees and cubes of dark grass jelly arranged at the base, pale soft palm seeds tucked between them, thin ruby-red syrup traced over the peak.`],
  // Warm counter — 1:1
  ["ondeh-mochi", "1:1", `Subject: three glossy round pandan-green glutinous rice cakes rolled in fine grated coconut ${PLATE}, one broken open with dark liquid palm sugar flowing out, a faint wisp of steam rising.`],
  ["gula-waffle", "1:1", `Subject: a golden-brown crisp rectangular waffle strip brushed with a dark glossy palm-sugar butter glaze ${PLATE}, glaze dripping from one corner, a small pool of glaze beside it.`],
  ["tang-yuan", "1:1", `Subject: three smooth white glutinous rice balls floating in clear pale amber ginger soup in a small warm-grey stoneware bowl, thin curls of young ginger on the surface, a faint wisp of steam rising.`],
  // Take-home — 1:1
  ["syrup-bottles", "1:1", `Subject: three identical tall slim glass bottles standing in a row, filled with deep amber syrup, deep green syrup and deep rose-red syrup, each sealed with a plain black cap and wearing a completely blank kraft-paper label band, condensation beading on the glass.`],
  // Wide frames — 16:9
  ["hero-pour", "16:9", `Subject: a wide close macro of thick dark amber palm-sugar syrup pouring in one thin unbroken ribbon from a small brushed-steel jug onto the peak of a tall snow-fine dome of pale green pandan ice, fine ice crystals catching the cold backlight, a few droplets suspended mid-air around the point of impact.`],
  ["sharing-spoons", "16:9", `Subject: two long-handled steel dessert spoons held by two different people's hands reaching from opposite sides, breaking simultaneously into the slopes of one very large dome of rose-pink shaved ice in a wide steel bowl, small flakes of ice scattering mid-air.`],
  ["ice-texture", "16:9", `Subject: a full-frame extreme macro of finely shaved snow-like ice, thin curled translucent ribbons and sparkling crystals filling the entire frame edge to edge, faint cool blue shadow in the crevices.`],
];

async function generate(name, aspect, subject) {
  const out = join(HERE, "..", "src", `${name}.png`);
  if (existsSync(out)) { log(`${name}: exists, skip`); return true; }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${STYLE}\n\n${subject}` }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect, imageSize: "4K" } },
  });
  for (let attempt = 1; attempt <= 60; attempt++) {
    for (const model of MODELS) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": KEY, "content-type": "application/json" },
          body,
        });
        if (res.status === 429 || res.status === 503) { log(`${name}: ${model} HTTP ${res.status} (attempt ${attempt})`); continue; }
        if (!res.ok) { log(`${name}: ${model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); continue; }
        const data = await res.json();
        const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
        if (!part) { log(`${name}: ${model} no image in response`); continue; }
        writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
        log(`${name}: OK via ${model} (${part.inlineData.data.length} b64 chars)`);
        return true;
      } catch (e) { log(`${name}: ${model} threw ${e.message}`); }
    }
    const wait = Math.min(300, 15 * attempt);
    log(`${name}: both models failed, waiting ${wait}s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  log(`${name}: GAVE UP after 60 attempts`);
  return false;
}

const wanted = process.argv.slice(2);
const queue = JOBS.filter(([n]) => wanted.length === 0 || wanted.includes(n));
log(`batch start: ${queue.length} jobs`);
let ok = 0;
for (const [name, aspect, subject] of queue) if (await generate(name, aspect, subject)) ok++;
log(`batch done: ${ok}/${queue.length} succeeded`);
