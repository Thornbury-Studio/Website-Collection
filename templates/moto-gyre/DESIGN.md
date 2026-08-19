---
name: GYRE
description: A futurist motorcycle marque built on one physical truth — a motorcycle is only stable in motion. Five machines named after riding dynamics, presented half as night-stage theatre, half as an engineer's bone-white workshop manual.
colors:
  ink: "#0b0e12"
  coal: "#141920"
  panel: "#1a2029"
  bone: "#edefe7"
  bone-deep: "#dfe2d6"
  white: "#f4f6f2"
  steel: "#9aa5b1"
  volt: "#d6f42b"
  volt-deep: "#a8c410"
  line: "rgba(154, 165, 177, 0.16)"
  line-strong: "rgba(154, 165, 177, 0.4)"
  ink-line: "rgba(11, 14, 18, 0.14)"
typography:
  mega:
    fontFamily: "Archivo, sans-serif"
    fontVariationSettings: "'wdth' 125, 'wght' 900"
    fontSize: "clamp(3.4rem, 13vw, 12rem)"
    lineHeight: 0.9
    letterSpacing: "-0.01em"
    textTransform: uppercase
  headline:
    fontFamily: "Archivo, sans-serif"
    fontVariationSettings: "'wdth' 118, 'wght' 800"
    fontSize: "clamp(1.8rem, 4.6vw, 3.8rem)"
    lineHeight: 0.98
    textTransform: uppercase
  body:
    fontFamily: "Archivo, sans-serif"
    fontVariationSettings: "'wdth' 100, 'wght' 400"
    fontSize: "clamp(0.98rem, 1.15vw, 1.06rem)"
    lineHeight: 1.62
  label:
    fontFamily: "Chakra Petch, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.14em"
    textTransform: uppercase
rounded:
  none: "0px"
  chip: "2px"
spacing:
  rim: "clamp(16px, 2.2vw, 34px)"
  block-y: "clamp(72px, 11vh, 148px)"
components:
  button-arm:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "15px 30px"
    note: "Hard-edged; presses with a 1px translate + inset shadow 'detent' — no soft glow"
  button-ghost:
    backgroundColor: "transparent"
    border: "1px solid {colors.line-strong}"
    textColor: "{colors.white}"
  spec-cell:
    note: "Chakra Petch label over Archivo-expanded numeral; hairline rules, no boxes"
---

# GYRE design system

## The one idea

A gyroscope falls over when it is still and stands when it spins. So does a
motorcycle. GYRE is built entirely on that inversion — **stability is a
property of motion** — and the site says it in the first three seconds:
"ONLY STABLE IN MOTION."

Everything follows from it. The machines are named for the vocabulary of
riding dynamics — APEX, CAMBER, RAKE, TRAIL, SLIP — words that describe what
a motorcycle *does*, not what it is. The interface behaves like a machined
object: detents, hard cuts, a gear-selector model switcher, no soft fades on
anything interactive. And the page itself rides: section transitions carry a
degree or two of horizon lean, the way the world tilts from the saddle.

**Deliberately not KARN.** KARN was a closed cinematic world — a place. GYRE
is an *anatomy* — the machine itself is the entire landscape. Half the site
is night-stage theatre (ink ground, volt rim light), half is a bone-white
workshop monograph (exploded callouts, hairline rules, engineering prose).
The tension between showroom dark and manual white is the visual identity.

## The marque

GYRE. Singapore-based futurist marque. Wordmark set in Archivo Expanded
Black, tracked wide — no crest, no mascot. The graphic signature is the
**halo**: an unbroken ring, drawn as a thin stroke everywhere the brand
appears (header mark, favicon), and worn by every machine as its ring-shaped
lamp.

## Design DNA (on every machine)

1. **The halo** — an unbroken circular LED lamp. One ring, never split.
2. **The spine** — exposed cast-aluminium structural frame member in matte
   ash, tank to tail. Engineering worn on the outside.
3. **Single-sided swingarm** — the rear wheel shown as a full disc face.
4. **The volt line** — one continuous yellow-green accent line tracing each
   body; the only colour on an otherwise graphite machine.

## The lineup (5 machines, one DNA, five personalities)

| Machine | Class | Powertrain |
|---|---|---|
| APEX | hypersport | 1090cc 65° V4, 214 hp |
| CAMBER | naked performance | 890cc inline-3, 128 hp |
| RAKE | electric power cruiser | twin radial-flux motors, 380 Nm |
| TRAIL | electric grand tourer | 96 kW, 29.6 kWh dual pack |
| SLIP | urban flyweight EV | 30 kW peak, 138 kg |

Every derived figure on the site (power-to-weight, top-speed estimate, dyno
curves, 0–100 estimates) is **computed at runtime** in `js/bikes-data.js`
from declared engineering (mass, power, torque curve points, drag area) —
never typed into copy — per the repo-wide arithmetic rule.

## Pages

- `index.html` — video hero (muted, poster fallback, reduced-motion static),
  manifesto, lineup rail, DNA plates, teardown teaser, ride CTA.
- `garage.html` — the stage. One machine at a time on the graphite
  cyclorama; a **gear-selector detent switcher** (mechanical click feel,
  keyboard ← → support) swaps machines with a hard cut; spec sheet, computed
  dyno curve SVG, and a synthesized **motor signature** (Web Audio, original,
  off by default, obvious control) per machine.
- `teardown.html` — bone-white monograph of the APEX: full side profile,
  hotspot callouts on real mechanical regions, engineering prose.
- `ride.html` — book a demonstration ride: outlet, machine, licence class.
  Contact is mailto-only (fictional marque; no live numbers), per the
  Common Ground precedent.

## Interaction rules

- Detents, not eases: interactive state changes are 80–120ms hard moves.
  Decorative reveals may be slower; nothing interactive ever floats.
- The lean motif: exactly one element per page may tilt (−1.5° to −2°); it
  is a signature, not a theme. Overuse reads as broken.
- Audio is synthesized in-browser (no licensing), starts only on explicit
  user action, visibly labelled, and the site is complete without it.
- `prefers-reduced-motion` kills the hero video (poster swap), the lean,
  and all reveals.

## Imagery

Generated set (Gemini nano-banana-pro 4K, per IMAGE-CREDITS.md): five stage
three-quarter portraits on one identical graphite cyclorama with volt rim
light, one bone-ground side profile for the teardown, one cinematic hero
keyframe. Detail crops are cut from the 4K stage frames, never generated
separately, so the machine cannot drift between hero and detail. Hero video
is one image-to-video pass on the approved keyframe under VIDEO-POLICY.md.
