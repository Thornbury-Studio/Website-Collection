This project inherits the company-wide taste system at `C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md` (see this repo's own root `CLAUDE.md` — the pointer is absolute, not relative, because this repo lives outside the company folder). Below are this project's own tokens and brand-specific rules.

---
name: slake
type: DESIGN.md
brand: Slake — small-batch spicy ginger soda
status: Website-Collection template (migrated from a Showcase capability-test build, 2026-09-20)
inherits: C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md
version: 1.0.0
last_updated: 2026-09-19
colors:
  scorch: "#150703"
  flame: "#FF5A1F"
  ginger: "#F2B544"
  frost: "#EEF5F7"
  glacier: "#0F6E93"
  tarn: "#0F2A36"
  ash: "#C9B9AE"
  slate: "#4C6470"
type:
  display: "Bodoni Moda (variable: opsz 6–96, wght 400–900, italic)"
  text: "Archivo (variable: wdth 62–125, wght 100–900, italic)"
radius: 0
motion: "one scroll-driven variable, --heat, 1 → 0; everything else static"
---

# Slake — design tokens and brand rules

## 1. Overview & Identity

Slake is a small-batch ginger soda built on one tension: pressed ginger
heat (fire, char, a real burn) meeting an ice-cold pour (condensation,
frost, relief). The audience is people who already pay Fever-Tree /
Fentimans / Fly By Jing money for heat as a feature, not a gimmick. The
site's one job: make a visitor feel the burn-then-relief before they've
tasted it, and get them to order a case. The name is the concept: to
*slake* is to satisfy thirst, and it's also what quicklime does when cold
water hits it — heat comes off, the stone cools. Two meanings, one drink.

The tone is plain, dry, a little cocky: it says exactly what's in the
bottle and exactly what it does to you. No "crafted", no "journey".

## 2. Colors

Six core values. The page is never all six at once — the top of the page
lives in the heat register, the bottom in the cold register, and one
scroll-driven variable (`--heat`, 1 → 0) mixes between them. Ratios are
WCAG contrast against the surface each color is actually used on.

| token       | hex       | role                                   | contrast |
|-------------|-----------|----------------------------------------|----------|
| `--scorch`  | `#150703` | heat surface — scorched, warm black    | —        |
| `--flame`   | `#FF5A1F` | heat accent, headline color on scorch  | 6.33:1 on scorch |
| `--ginger`  | `#F2B544` | heat secondary — ginger-flesh gold     | 10.78:1 on scorch |
| `--frost`   | `#EEF5F7` | cold surface — frosted white           | —        |
| `--glacier` | `#0F6E93` | cold accent — links, buttons, focus    | 5.19:1 on frost |
| `--tarn`    | `#0F2A36` | cold ink — headline/body on frost      | 13.55:1 on frost |

Two derived text tones, for secondary copy only:

| `--ash`   | `#C9B9AE` | secondary text on scorch | 10.37:1 on scorch |
| `--slate` | `#4C6470` | secondary text on frost  | 5.66:1 on frost |

**Why scorch is not "tinted near-black":** DESIGN-SYSTEM §3 flags `#0B0B0B`
/ `#111` standing in for black. `#150703` is not a stand-in — it's a
deliberately warm, brown-black *char* color, and it exists to be left
behind: the whole structure of the page is the scorch giving way to
frost. Bend it: if a surface reads as neutral grey-black on a real
screen, push it warmer, never cooler.

**Why glacier is `#0F6E93` and not the pale ice-blue you'd expect:** the
pale version (`#5FB8D6`) fails text contrast on frost at 2.04:1. Pale
ice-blue is allowed only as a *fill* (condensation highlights, the frost
bloom overlay) — never as text or a focus ring. Bend it: when a cold
accent is purely decorative and never carries meaning, use
`color-mix(in oklab, var(--glacier), var(--frost) 60%)`.

**Flame on frost is 2.83:1** — it must never be used as text on the cold
register. The heat register does not leak into the cold one; that's the
point.

## 3. Typography

- **Display: Bodoni Moda**, variable (optical size 6–96, weight 400–900,
  true italics). Wordmark, headlines, and pull-quotes. The Didone contrast
  *is* the brand's contrast: at display sizes the heavy strokes carry the
  heat and the hairlines carry the frost. Always set the optical size to
  match the rendered size (`font-optical-sizing: auto`); never fake a
  display cut by scaling a text cut.
- **Text: Archivo**, variable (width 62–125, weight 100–900). Body, UI,
  labels, the ingredient "label" block. The width axis is a real tool
  here: `font-stretch: 75%` (condensed) for the bottle-label ingredient
  column and small meta; normal width for reading copy; never wider than
  100% except the single "Get a case" button at 110%.
- **Scale** (Elements of Typographic Style, base 1.125 stepping, clamp for
  fluid display):
  - `--t-wordmark`: `clamp(5.5rem, 22vw, 20rem)` Bodoni 900, opsz 96, line-height 0.82, letter-spacing -0.03em
  - `--t-display`: `clamp(2.6rem, 6.5vw, 6.5rem)` Bodoni 700, line-height 0.95
  - `--t-h2`: `clamp(2rem, 4vw, 3.5rem)` Bodoni 600, line-height 1.02
  - `--t-quote`: `clamp(1.25rem, 1.8vw, 1.6rem)` Bodoni italic 500, line-height 1.25
  - `--t-body`: `1.0625rem` Archivo 400, line-height 1.55, max 68ch
  - `--t-small`: `0.875rem` Archivo 500, line-height 1.4
  - `--t-label`: `0.8125rem` Archivo 500 at 75% width, line-height 1.35
- Serif body-length copy (the pull-quotes) gets 1.25 line-height and up
  to 60ch; Archivo body stays under 68ch.
- Sentence case everywhere. No tracked-out caps labels. The wordmark is
  the only all-caps element on the page, and it's caps because it's a
  wordmark.

**Why not Inter / a neutral sans + a trendy serif:** Bodoni Moda was
chosen because its stroke contrast maps literally onto heat/frost;
Archivo because its width axis gives a bottle-label voice without
adding a third face. Bend it: if a client-side fork needs a text face
with a lighter footprint, Archivo can be swapped for any grotesque with
a real condensed cut — not for Inter, and never for a second serif.

## 4. Layout & Spacing

- **Concept:** the page is a thermometer you scroll down. One variable,
  `--heat`, runs 1 → 0 across a pinned crossfade from smouldering coals
  to an ice pour, and every color, surface and type color on the page
  derives from it. Heat register above the stage, cold register below;
  nothing above is ever cold, nothing below is ever hot.
- **Grid:** 12 columns, `minmax(0, 1fr)` tracks (never bare `1fr` — see
  the min-content overflow trap), gutter `clamp(16px, 2.5vw, 40px)`,
  outer margin `clamp(16px, 5vw, 96px)`, no max-width on full-bleed
  stages; reading columns cap at 68ch.
- **Alignment:** left-anchored. The hero wordmark sits bottom-left and
  bleeds off the left edge; the stage headline sits right of the glass.
  Nothing is centered except by accident of the grid.
- **Spacing scale** (rem): 0.25, 0.5, 1, 1.5, 2, 3, 5, 8, 13. Section
  padding block: `clamp(5rem, 12vh, 10rem)`.
- **Radius policy:** zero, always. Photos, buttons, inputs — square.
  The only curve on the page is the glass in the video.
- **Stage:** the transition stage is a 300vh track with a 100vh sticky
  child; `--heat` is animated 1 → 0 over `cover 30% cover 70%` of the
  track's view timeline (native CSS scroll-driven animation, hoisted to
  `:root` with `timeline-scope`), with a scroll-listener fallback for
  browsers without `animation-range` support (Firefox).

## 5. Elevation & Depth

- **No shadows.** Not on photos, not on buttons, nowhere. Depth comes
  from the video layers and from *material*: the scorch surface is the
  coals; the frost surface is flat and matte.
- **No glass / backdrop blur.** Legibility over video uses a scrim — a
  linear gradient of the current surface color to transparent — never a
  blur.
- **Borders:** 1px hairlines in `color-mix(in oklab, currentColor, transparent 78%)`;
  used only where they encode structure (the ingredient-label column's
  rules, the order form's field underlines).
- **Photos in the People section** overlap by design (a real pinboard),
  so stacking order is set explicitly and never with shadows.

## 6. Components & States

- **Nav:** wordmark (Bodoni 700, 1.25rem) left; "Pause footage" (a real
  `<button>`, `aria-pressed`, hidden when the system already prefers
  reduced motion) and one text link "Get a case" right. Color follows
  `--heat` (ginger on scorch → tarn on frost). Fixed; no background; a
  light scrim only. A skip link precedes it, visible on focus.
  Every control on the page is at least 44×44 (measured, not assumed).
  - hover: underline offset 0.2em, thickness 2px. focus-visible: 2px
    solid outline in the register's accent, offset 4px. active: no change.
- **Button (one style only):** Archivo 600, 1rem, width 110%, padding
  1rem 1.5rem, square, filled: `--glacier` background / `--frost` text on
  the cold register; `--flame` background / `--scorch` text on the heat
  register (if ever needed — currently there is exactly one button, on
  frost). hover: background darkens 8% via `color-mix`. focus-visible:
  2px solid `--tarn` outline, 4px offset. active: translateY(1px).
  disabled: 45% opacity, no hover. Minimum hit area 44×44.
- **Text link:** currentColor, underline always, thickness 1px, offset
  0.18em; hover thickness 2px; focus-visible as above.
- **Inputs (order form: email, quantity):** transparent, 1px bottom rule
  in `--tarn` at 40%, 3rem tall, Archivo 400. focus: rule becomes 2px
  `--glacier`, plus the focus-visible outline. invalid (after
  interaction, `:user-invalid`): rule `--flame`... no — flame is banned on
  frost; invalid uses `--tarn` 2px plus a plain-text message below.
- **Photo moment (People):** square-cornered image with an explicit
  aspect-ratio box, `<figure>` + `<figcaption>`; caption = quote in
  Bodoni italic + name/city in Archivo small. No hover effect. No motion.
- **Scroll cue (hero):** a real link to `#stage`, Archivo small, "Scroll
  to cool it down", with a 4rem hairline before it. Static; it stays
  under `prefers-reduced-motion`.
- **Footage under reduced motion:** both clips are `display: none` and
  their posters stand in; the register still changes with scroll
  position, because that's state, not motion.

## 7. Do's and Don'ts (this brand, on top of DESIGN-SYSTEM §3)

Do:
- Let `--heat` do the work. If a color or surface needs to differ between
  the top and bottom of the page, derive it from `--heat` rather than
  hard-coding two values and switching classes.
- Keep the copy device intact: "It burns." above the stage, "Then it
  doesn't." completing inside it. The sentence finishing *is* the
  transition.
- Show the pour, not the bottle. There is no product shot; the video is
  the product. Don't add a rendered bottle, mock label or hero can.
- Use real people from real photography (licensed Adobe Stock, all
  `isGenTech: false`) in the People section, laid out as scattered
  moments on the frost. Candid > posed.

Don't:
- No testimonial carousel, slider, or auto-advancing anything. Ever.
- No white-background catalog hero. The first frame is coals.
- No flame-colored text on frost (fails 2.83:1 and breaks the registers).
- No fade-and-slide-up on sections; no hover-lift on photos. The page has
  one motion idea. Guard it.
- No eyebrow labels, no middle-dot meta strings, no `→` on links, no
  numbered markers except on **the four seconds**, which is a real timed
  sequence (0.0 s / 1.5 s / 3.0 s / 4.0 s) — that one's earned.
- No monospace anywhere. The ingredient block uses condensed Archivo.

**Declared §3 exception — near-black + one hot accent.** The heat
register is scorch + flame (+ ginger gold). That's item two on the
anti-slop list, and it's used here on purpose: the subject is char and
fire, and the dark surface exists precisely so the page can leave it —
the cold register is a full inversion to pale frost, which is the
opposite of "and nothing else". Ginger gold is the second color. If a
future pass finds the heat register reading as "generic dark site with
an orange accent", the fix is more char texture and more gold, not less
flame.

## 8. Agent Instructions

This repo's own root `CLAUDE.md` already states the Agent Instructions
block once for every template in this catalog (frontend-design/impeccable
invocation, the company DESIGN-SYSTEM pointer, web-design-guidelines
before done) — not repeated here per-template, matching how every other
template in this catalog works.
