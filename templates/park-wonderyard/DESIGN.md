# WONDERYARD — design document

An original international entertainment destination. Category reference: major
theme-park websites (Universal-tier production values). Zero borrowed IP —
world, worlds, attractions, brand language and imagery are all invented here.

## The one-line brand

**GROWING UP WAS OPTIONAL.**

WONDERYARD's voice is deadpan-playful: it talks about ridiculous things with a
straight face, the way park wayfinding signage would if signage had a sense of
humour. Never childish, never SaaS. Short declaratives. Signage grammar.

Secondary lines used in copy:
- "You're through the gate. Now what?"
- "The day has a deep end."
- "Every night ends with exactly one firework."

## The memorable idea (the site's signature)

**The homepage is a walk through the park, and the walk ends at night.**

- The page opens at the Gate: controlled, cinematic, almost formal.
- Scrolling deeper = walking deeper. Each world section shifts the page's
  palette and personality (accent tokens interpolate per section).
- The final stretch is AFTERDARK: a scroll-driven day→night transition —
  the *entire page chrome* (background, ink, accents) crossfades to the night
  palette as you approach it, and stays night through the footer.
- The page ends on The Last Firework — the park's closing ritual — and then
  the practical strip (plan / tickets) sits inside the night.

Persistent chrome: a **wayfinding rail** (fixed) that behaves like park
signage — a "YOU ARE HERE" marker tracks scroll progress through the worlds
(GATE → YARD → TILT → SOAK → SIDEWAYS → LITTLE GIANTS → AFTERDARK). It is the
nav: every stop is a real anchor/link. Mobile gets a compact version.

## The worlds (six, renamed where the brief's placeholder was weak)

1. **THE YARD** — the central district. Music, kinetic architecture, the
   Hundredhand, food halls. Accent: marigold/sun yellow.
2. **TILT** — thrill district (replaces "Dropzone"; tilt = pinball + vertigo).
   Accent: signal red/orange.
3. **SOAK** — water district (replaces "Splashworks"). Accent: pool cyan.
4. **SIDEWAYS** — surreal playground district (replaces "Oddland"); normal
   rules slightly broken. Accent: violet/acid green tension.
5. **LITTLE GIANTS** — kept from brief (it's good). Family world designed so
   *kids feel giant*, not infantile. Accent: leaf green/warm cream.
6. **AFTERDARK** — kept. Not a district but a *time*: the park after sunset.
   Night palette: deep indigo ground, neon accents from all worlds.

## Attractions (18, all original)

THE YARD: The Hundredhand (kinetic gate sculpture, waves on the hour) ·
Carousel of Other Animals (creatures that never existed) · Signal Stage
(daily live schedule) · The Snackworks (food hall).
TILT: Loosetooth (signature wood-steel hybrid coaster) · The Grandfather
(120 ft pendulum, ticks) · Vertigo Garden (high-ropes over the district).
SOAK: Squall (water coaster) · The Millpond (a lazy river with opinions) ·
Rainroom (a storm you control) · The Hosepipe Rebellion (splash battleground).
SIDEWAYS: The Upside House · The Slow Race (slowest wins) · Marble Run
(human-scale).
LITTLE GIANTS: Tall Grass (oversized meadow — kids read as giants) ·
The Fort · Small Parade (daily, 15 min).
AFTERDARK: Lantern Route · Night Market · The Last Firework (one. every night).

Each attraction carries: world, type (coaster/water/interactive/show/food/
playground/ritual), intensity 1–5, min height where relevant, one-line copy
with personality, "now" status derived deterministically from time of day.

## Pages

1. `index.html` — the walk (gate → six worlds → night → plan strip).
2. `attractions.html` — **The Board**: full index styled as a departure/wait
   board. Filter by world, type, intensity. Statuses feel live.
3. `map.html` — interactive SVG park map: hand-drawn-geometry districts,
   clickable, synced list, day/night toggle.
4. `plan.html` — tickets (prices computed from data in JS, never typed),
   hours, getting there, food, accessibility, FAQ.

## Design system

- Type: **Bricolage Grotesque** (display — loud, characterful, not childish)
  + **Archivo** (text/wayfinding) + mono fallback stack for board figures.
- Day ground: warm paper `#f4efe6`; ink `#1b1611`. Night ground: `#100e1c`;
  night ink `#efeaff`. Six world accents as CSS tokens, all AA-checked.
- Texture: flat colour fields, hard shadows (2–4px offset, no blur —
  signage/screenprint language), rotated ticket-stub chips, dashed "path"
  connectors between sections like a map route. No glassmorphism, no
  gradients-as-decoration, no pill soup.
- Motion: attraction cards behave by type (thrill = tilt/jolt on hover,
  water = ripple, playground = soft bounce, ritual = slow glow). One effect
  per moment; reveals gated on `.js-anim` with failsafe per house rules.
- Sound: none auto. Optional tiny UI ticks behind an obvious toggle — or skip
  entirely if it doesn't earn its place.

## Imagery

Per repo recipe: imagery FIRST, layout follows what exists.
- Generated (Higgsfield nano_banana_pro, ~2cr/frame): the frames that define
  WONDERYARD's own architecture — gate hero + one establishing frame per
  world. One STYLE block verbatim across all; "real destination photography
  of a place that happens not to exist"; NO readable text anywhere.
- Licensed Adobe Stock (free tier): human/texture truth — crowds, hands,
  water impact, night food, lights — where real photography beats synthesis.
- All frames through one identical grade; contact sheet on page ground before
  commit. Credits in IMAGE-CREDITS.md.
- Video: stock-first per brief; NO generated video without explicit approval
  (VIDEO-POLICY.md). If no suitable stock: static hero + CSS motion.

## Commercial reality

Clear ticket pathway on every page (wayfinding rail carries a TICKETS stub).
Hours, prices (Day / AFTERDARK-after-5pm / Little Giants family), location
(fictional but geographically plausible: "Wondervale, 40 min from the city"),
accessibility, height chart on the Board.

## Quality bar

SGD $25–35K judgement: fewer, better moments. The three signature moves are
(1) the walk-with-nightfall homepage, (2) the wayfinding rail, (3) the Board.
Everything else stays calm so those three can breathe.
