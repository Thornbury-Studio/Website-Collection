This project inherits the company-wide taste system at `C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md` (see this repo's own root `CLAUDE.md` — the pointer is absolute, not relative, because this repo lives outside the company folder). Below are this project's own tokens and brand-specific rules.

---
name: strake
type: DESIGN.md
brand: STRAKE — Strake Coachworks, Hamble. An invented low-volume marque; one car, the Carvel.
status: Website-Collection template (capability-test build, 2026-09-22)
inherits: C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md
version: 1.0.0
last_updated: 2026-09-22
colors:
  cloth: "#F2F1ED"
  white: "#FFFFFF"
  ink: "#24262A"
  slate: "#62666C"
  bronze: "#9A6B3C"
  bronze_ink: "#7B5330"
  hairline: "#D9D7D0"
type:
  display: "Familjen Grotesk (variable 400–700 + italic) — self-hosted, latin"
  text: "Source Serif 4 (variable opsz 8–60, wght 200–900 + italic) — self-hosted, latin"
radius: "0 on every layout element and button; 999px only on the paint and hide swatches, because they are samples, not chrome"
motion: "three moments — the hero settles once on load, its three layers drift apart under the pointer and the scroll, and the heritage timeline slides sideways while it is pinned. The configurator answers a click with a spring-driven paint pass. Nothing else moves unprompted."
---

# STRAKE — design tokens and brand rules

## 1. Overview & identity

Strake Coachworks builds one car, the Carvel, forty a year, in a boat shed on the
Hamble that has formed hulls since 1921. The audience is a buyer who already owns
the obvious cars and wants the one that was planked by hand: someone pricing a
£250,000 commission, not a badge. The site's one job is to make the car feel
built rather than styled — to show the hull, the bronze, the shed and the people,
and then let the buyer specify a hull number. Tone: plain, specific, unhurried;
a yard foreman's sentences, not a brochure's.

## 2. Reference DNA

Grounded in one real site: **Spyker Cars** (spykercars.com, built by The Brink
Agency). Taken, at the level of mechanics:

1. **The stack.** A vertical run of full-width content blocks under a fixed,
   minimal header — wordmark left, four words right — with no framed page and
   no sidebars. Each block is one idea at one scale.
2. **The hero.** A single product image at very large scale paired with a short,
   stacked, centred headline in two lines and a one-line standfirst. No buttons
   inside the headline group; the product is the call to action.
3. **The heritage as a horizontal timeline**, not a wall of text: a run of dated
   chapters read left to right, images beside short captions, the years doing
   the work of headings.
4. **Symmetrical press grid.** Three equal columns, equal image crops, date
   above title, no featured tile.
5. **Negative space as the luxury signal.** Their page is white with charcoal
   text and exactly one warm metallic (a rose-gold detail on the car and in
   the UI); the expensiveness comes from the air around things, not from
   gradients, glow or dark mode.

Deliberately not taken: Spyker's name, logo, models, Latin motto, aviation
story, propeller badge, photography, copy or their rose-gold hue. The marque,
the boat-yard heritage, the bronze rubbing strake, the car and every word here
are invented for this build.

Secondary grounding (structure only): Vipp and Landmark Trust product pages for
the habit of selling a whole thing with a whole number and plain facts.

## 3. Colours

| token | hex | use | contrast |
|---|---|---|---|
| `--cloth` | `#F2F1ED` | page ground (sailcloth), hero, alternating blocks | — |
| `--white` | `#FFFFFF` | alternating blocks (gelcoat) | — |
| `--ink` | `#24262A` | all body and display text | 13.4:1 on cloth, 15.2:1 on white |
| `--slate` | `#62666C` | secondary text: dates, captions, specs | 5.1:1 on cloth, 5.8:1 on white |
| `--bronze` | `#9A6B3C` | the one accent: rules under active nav, swatch rings, button borders, large numerals | 4.1:1 on cloth, 4.6:1 on white — UI and large text only |
| `--bronze-ink` | `#7B5330` | bronze when it has to be read as small text (prices, the active option name) | 6.0:1 on cloth, 6.7:1 on white |
| `--hairline` | `#D9D7D0` | rules and dividers, never text | — |

Only one warm metallic exists. There is no second accent, no success green, no
error red beyond the browser's own invalid outline restyled in bronze-ink.
The paint swatches in the configurator are product colours, not UI colours;
they appear only inside the swatch circles.

## 4. Typography

- **Familjen Grotesk** for the wordmark, every heading, navigation, buttons,
  numbers and the configurator interface. Chosen because it is a compact
  grotesk with a drawn, slightly nautical "a" and "g" that reads as lettering
  on a builder's plate rather than a software default, and because nothing
  else in this catalogue uses it.
- **Source Serif 4** for running prose — the heritage captions, the detail
  paragraphs, the yard text. A serif for the reading passages gives the yard
  its printed-ledger register; the grotesk display keeps the car modern. The
  two are clearly distinct.

Scale (rem, desktop → phone via `clamp`):

| role | face | size | weight | leading | tracking |
|---|---|---|---|---|---|
| h1 hero | Familjen | clamp(2.75, 7vw, 6.5) | 500 | 0.98 | -0.025em |
| h2 block | Familjen | clamp(2, 4.2vw, 3.5) | 500 | 1.02 | -0.02em |
| h3 item | Familjen | 1.375 | 500 | 1.2 | -0.01em |
| standfirst | Source Serif | clamp(1.125, 1.6vw, 1.375) | 400 | 1.45 | 0 |
| body | Source Serif | 1.0625–1.125 | 400 | 1.6 | 0 |
| ui / nav | Familjen | 0.9375 | 500 | 1.2 | 0 |
| caption / date | Familjen | 0.8125 | 400 | 1.35 | 0.01em |
| numeral | Familjen | 2.25 | 500 | 1 | -0.02em |

Sentence case everywhere, including buttons and the nav. No tracked caps. No
eyebrow labels: a block's heading is its label.

## 5. Layout & spacing

- Full-width stacked blocks; content sits in a `--wrap` of `min(1440px, 100% -
  2 * var(--gutter))`, `--gutter: clamp(20px, 5vw, 72px)`.
- Block padding `--block: clamp(5rem, 12vw, 11rem)` top and bottom. The hero
  is `100svh` with the car pinned to its bottom edge.
- Prose measure 62ch; standfirst 44ch; centred only in the hero and block
  headings, left-aligned everywhere else.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px as `--s1 … --s10`.
- Grids: three equal columns for details and press, four for materials, a
  6/6 split for the configurator and the yard; single column under 800px.
- Radius policy: 0 on every box, image, button and input. 999px only on the
  configurator swatches.

## 6. Elevation & depth

- No drop shadows on any UI element. The only shadow on the page is the car's
  own rendered contact shadow, which is part of the image.
- No glass, blur or gradient panels. The fixed header is solid `--cloth` once
  the page has scrolled past the hero, transparent over the hero.
- Borders: 1px `--hairline` rules between grid cells and above the footer; 1px
  `--bronze` only on the primary button and the active swatch ring.

## 7. Components & states

- **Primary button** (Configure, Reserve): Familjen 500, 1px bronze border,
  ink text, 14px 22px padding, radius 0. Hover: bronze fill, cloth text.
  Focus-visible: 2px bronze-ink outline, 3px offset. Active: bronze-ink fill.
  Disabled: hairline border, slate text, no hover.
- **Text link**: ink, 1px underline in hairline, hover underline bronze.
  Focus-visible as above. No arrows appended.
- **Nav link**: Familjen 500, ink; the current section carries a 1px bronze
  rule beneath (aria-current). Hover: bronze-ink. Menu toggle on phones is a
  real `<button aria-expanded>`, 44×44 tap target.
- **Swatch** (paint, wheels, hide): a `<label>` around a real radio input; 36px
  circle of the product colour, 2px cloth gap, 1px hairline ring; checked ring
  is 2px bronze; focus-visible ring 2px bronze-ink offset 3px. The option's name
  is always written beside it, never colour-only.
- **Inputs**: 1px hairline border, radius 0, ink text, 12px 14px padding.
  Focus: bronze border. Invalid after submit: bronze-ink border and a plain
  sentence underneath.
- **The car stage**: one render exported as three layers — cast shadow, body, wheels — stacked
  absolutely and translated at 3 / 11 / 17 px per unit of pointer travel and 6 / 16 / 24 px
  across the first viewport of scroll. The parallax is damped (0.08 lerp) so the car settles
  rather than tracking the cursor, and is off entirely under `prefers-reduced-motion`. The
  configurator reuses the same stack with the parallax factors set to 0, so a paint change
  swaps only the body layer and a wheel change swaps only the wheels.
- **Timeline chapter**: image (4:3, greyed with `filter: grayscale(1)` and a
  bronze-tinted duotone via `mix-blend` on the cloth ground), year as a large
  numeral, one short paragraph. Not interactive.
- **Press card**: image 3:2, date, title, standfirst. Not a link.

## 8. Do's and don'ts

Do
- Let the car be the loudest thing on the page. Everything else is smaller,
  quieter and further apart than feels safe.
- Use the yard's own materials for colour: bronze from the strake, cloth from
  sailcloth, charcoal from the hull's shadow. If a new colour is needed, it has
  to come from something in the shed.
- Write in the foreman's voice: short sentences, real numbers, no adjectives
  that a buyer could not verify.

Don't
- No dark mode, no black hero, no "silhouette at sunset" — the whole point is
  a white cyclorama.
- No second metallic (no chrome-blue, no gold), no gradients, no glow.
- No caps-tracked eyebrows, no middle-dot meta strings, no numbered markers
  except where the content is a sequence (the timeline's years are the
  sequence; nothing else gets numbered).
- No hover-lift on cards, no fade-up on every section. Two moments of motion
  and one interaction response, as declared in the front matter.
- Never show a swatch row that does not change the car. Every paint and wheel
  option swaps a real layer of the product.
- The car is one render, recoloured; it is never a tint over a flat picture, and the
  bronze strake and the smoked canopy keep their own colour in every paint.

## 9. Agent instructions

```
# UI Generation Rules
Before writing, editing, or restyling any front-end UI in this repo:
1. Invoke the `frontend-design` skill and, if installed, `impeccable`
   and this project's own design-critique skill.
2. Read this repo's own DESIGN.md AND C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md
   (the company-wide taste system — this template uses the absolute
   path because the Website-Collection repo does not live at a fixed
   depth under the company folder; see the repo root CLAUDE.md). Treat
   both as hard constraints.
3. Do not introduce unapproved fonts, unmapped tokens, or any pattern
   listed in DESIGN-SYSTEM/DESIGN.md §3 (the anti-slop checklist)
   without stating the reason it's a real choice, not a default.
4. Before calling any UI work done, run the `web-design-guidelines`
   skill against the changed files and screenshot the result at
   desktop and mobile widths.
```
