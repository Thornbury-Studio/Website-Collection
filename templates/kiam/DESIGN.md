This project inherits the company-wide taste system at `C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md` (see this repo's own root `CLAUDE.md` — the pointer is absolute, not relative, because this repo lives outside the company folder). Below are this project's own tokens and brand-specific rules.

---
name: kiam
type: DESIGN.md
brand: KIAM 咸 — small-batch salted sodas, Singapore
status: Website-Collection template (migrated from a Showcase capability-test build, 2026-09-20)
inherits: C:\School\Personal\Company\DESIGN-SYSTEM\DESIGN.md
version: 1.0.0
last_updated: 2026-09-19
colors:
  salt: "#EFEFEA"
  plum: "#3D1A1B"
  sea: "#18606E"
  stone: "#5E5853"
  range:
    calamansi: "#D8D54F"
    grapefruit: "#F08A80"
    pineapple: "#F2C24B"
    roselle: "#A81B36"
    watermelon: "#EE5A73"
type:
  display: "Anybody (variable: wdth 50–150, wght 100–900, italic) — self-hosted"
  text: "Newsreader (variable: opsz 6–72, wght 200–800, italic) — self-hosted"
  mark: "Noto Sans SC 900, subset to 咸酸甜汽水 only (1.9 KB)"
radius: "0 on layout; 999px only on the pill button and the profile dots"
motion: "one load moment — the five hero bottles fill from the base (1.1 s, staggered). Nothing else moves unprompted."
---

# KIAM — design tokens and brand rules

## 1. Overview & Identity

KIAM makes five salted sodas in a small unit in Tai Seng and sells them
by the bottle at a Saturday stall and through a handful of cafés and
grocers. The idea comes from the drinks stall: every Singaporean already
knows that a sour plum in a lime juice, or plum powder on a slice of
guava, makes fruit taste more like itself. KIAM bottles that instinct —
fresh fruit, half a pinch of sea salt, about a third of the sugar of an
ordinary soda. The name is Hokkien for *salty* (咸) and Singlish for
*stingy*; both are true of the drink, and the brand says so.

Audience: people who buy Fever-Tree, East Imperial or a S$6 cold-pressed
juice without blinking, and who would rather have less sugar than a
diet sweetener. The site's one job: make the five sodas legible at a
glance and get the visitor to the stall, a stockist, or a WhatsApp
order for six.

Tone: plain, exact, a little dry. It gives numbers where other brands
give adjectives. Never "crafted", "artisanal", "journey", "elevate",
"curated". Singlish is allowed in one place — the name's own joke — and
nowhere else.

## 2. Colors

Four system colours carry every page. The five range colours are
*fills* — they belong to the sodas, not to the interface, and they only
appear as a bottle's liquid, a label accent, or a full-bleed band on the
sodas page. Ratios are WCAG contrast against the surface the colour is
actually used on.

| token      | hex       | role                                          | contrast |
|------------|-----------|-----------------------------------------------|----------|
| `--salt`   | `#EFEFEA` | ground — a cool, slightly grey off-white       | —        |
| `--plum`   | `#3D1A1B` | ink — headings, body, the wordmark            | 13.37:1 on salt |
| `--sea`    | `#18606E` | links, the focus ring, the one action colour   | 6.20:1 on salt |
| `--stone`  | `#5E5853` | secondary text (captions, meta)                | 6.07:1 on salt |

Range fills (never used as text on salt — they all fail):

| token             | hex       | text on it                          |
|-------------------|-----------|-------------------------------------|
| `--calamansi`     | `#D8D54F` | plum 9.95:1 · sea 4.61:1            |
| `--grapefruit`    | `#F08A80` | plum 6.35:1 · sea fails (2.5) → links in plum |
| `--pineapple`     | `#F2C24B` | plum 9.25:1 · sea 4.29:1 → links in plum |
| `--roselle`       | `#A81B36` | salt 6.33:1 · plum fails → all text in salt |
| `--watermelon`    | `#EE5A73` | plum 4.66:1 → body ≥ 18px, no small plum text |

**Why the ground is not the AI cream:** `#EFEFEA` is cooler and greyer
than `#F4F1EA`; it is meant to read as salt crystal / kopitiam marble,
not as paper. Bend it: if a screen renders it yellow, push it cooler,
never warmer. The warmth on this site comes from the range fills, not
the ground.

**Why the ink is plum, not near-black:** `#3D1A1B` is the colour of a
sour plum. It is warm, visibly brown-red at large sizes, and it ties
the type to the drink. It is never lightened to make "grey text" — use
`--stone` for that.

**Why sea is the only action colour:** salt comes from the sea. Every
link, focus ring and the WhatsApp/order button use it. On the
grapefruit and pineapple bands it fails contrast, so links there switch
to `--plum` with an underline; on roselle everything is `--salt`. The
CSS does this through a per-surface `--ink` / `--link` / `--focus` set,
never by hand-picking colours in components.

## 3. Typography

**Anybody** is the display face — a variable grotesk with a real width
axis. The wordmark and every heading set it *wide* (`font-stretch:
125%–150%`, weight 700–850, tight leading); that wide, heavy cut is
what a bottle cap or a hand-painted kopitiam signboard looks like, and
it is the one place the brand shouts. Interface text (nav, buttons,
labels, table figures) uses Anybody at normal width, weight 500–600.

**Newsreader** is the text face, driven by its optical-size axis: 16–19
px body at `opsz` auto, a larger `opsz` for pull-quotes. Its italic is
used for asides and the reviewers' locations. A serif body next to a
wide heavy grotesk is the pairing: the sans is the label, the serif is
the person explaining it.

**咸** is set in Noto Sans SC Black from a five-glyph subset
(咸酸甜汽水). It appears as the mark beside the wordmark and, on the
sodas page, as the three taste axes (咸 salty · 酸 sour · 甜 sweet).

Scale (rem, 1rem = 16px; fluid between 360 and 1440):

| role            | size                          | face / setting                       |
|-----------------|-------------------------------|--------------------------------------|
| wordmark        | 1.5rem in the nav; 2.25rem in the footer | Anybody wdth 150 wght 850, lh .9 |
| h1              | clamp(2.5rem, 5.3vw, 4.75rem) | Anybody wdth 135 wght 800, lh .97, tracking −0.02em — sized so the two-sentence home headline sets as two lines at 1280 |
| h2              | clamp(2rem, 4.2vw, 3.5rem)    | Anybody wdth 125 wght 750, lh 1      |
| h3              | 1.375rem                      | Anybody wdth 110 wght 650, lh 1.15   |
| body            | 1.125rem (18px), max 66ch     | Newsreader 400, lh 1.5               |
| body small      | 1rem                          | Newsreader 400, lh 1.5               |
| ui / label      | 0.875rem                      | Anybody wdth 100 wght 550, lh 1.2    |
| figure          | 1rem–2.5rem                   | Anybody wdth 110 wght 600, tabular   |
| pull quote      | clamp(1.5rem, 2.6vw, 2.25rem) | Newsreader 400 opsz 72, lh 1.25      |

No ALL CAPS anywhere except the four letters of the wordmark, which is
a logotype, not a label. No eyebrow labels above headings. No single
italic/coloured word inside a headline. Sentence case for every heading
and button — the web-interface-guidelines pass asks for Title Case, and
this brand deliberately declines it: it writes the way a person talks.

Inside the bottle SVG the label text is Anybody 720 at 9.6 units (the
viewBox is 120 × 368), the wordmark 850 at 12, "250 ml" 550 at 7.5; the
label rectangle is 86 units wide so "Watermelon" and "Grapefruit" fit on
one line. Verified by `tools/checks.js` (`labelOverflow`).

## 4. Layout & Spacing

Left-aligned everywhere. A 12-column grid inside a 1280px max content
width, with a side gutter of `clamp(1rem, 4vw, 4rem)`. Full-bleed
surfaces (the sodas bands, the plum footer) break the max width; the
content inside them does not.

Spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 (px,
exposed as `--s1`…`--s10`). Section rhythm is 96–128 on desktop, 64 on
phones.

Radius policy: zero on every layout element, image and band. The only
rounded things are the pill action button and the taste-profile dots,
because they are the same shape as a bottle cap. The bottle illustration
has its own drawn shoulders and is not a CSS radius.

The bottle: an inline SVG (viewBox 120 × 368) — a 250 ml straight-sided
bottle with a crown cap, written out per instance (the label text
differs), filled per soda through a `.bottle--<soda>` class that sets
`--fill`, carrying its label as SVG text in the page's own fonts. Its
base sits exactly on the 1px plum shelf line; bottles are never floated,
tilted, or given a drop shadow. The liquid is clipped by a rect that
scales from the base — that is the fill animation.

## 5. Elevation & Depth

None. No box shadows, no blur, no glass. Depth comes from colour bands
and from the liquid highlight inside the bottle (one 8%-opacity white
strip). Borders are 1px `--plum` at 100% on salt, or 1px `--salt` at 40%
on dark and coloured surfaces. Photographs sit flush, uncropped by
radius, with a 1px border only when they touch the ground colour at a
similar value.

## 6. Components & States

- **Action button** (`.btn`): pill, Anybody 600, `--sea` ground with
  `--salt` text (6.2:1). Hover: ground darkens to `#134C57`. Active:
  translateY(1px). Focus-visible: 3px `--focus` outline, 3px offset.
  Disabled: 50% opacity, `cursor: not-allowed`, still readable.
- **Quiet link**: `--link` colour, 1px underline, 3px offset; hover
  thickens to 2px. Same focus ring.
- **Nav**: wordmark left, four links right, no hamburger icon glyph —
  a text button "Menu" below 760px that opens a full-width list with
  `aria-expanded`, Escape closes, focus returns to the button.
- **Taste profile** (`.taste`): three rows (咸 / 酸 / 甜) of five dots,
  filled dots in `--plum` or `--salt` depending on surface; the value is
  also in text for screen readers ("salty 4 of 5").
- **Six-pack builder** (`.pack`): five steppers (− count +), the total
  counts up to exactly six, the price is computed from the catalogue in
  `site.js`, and the order button becomes a `wa.me` link with the
  message pre-filled. Steppers are real `<button>`s with labels; the
  live total uses `aria-live="polite"`.
- **Stockist map** (`.map`): an SVG outline of Singapore with one dot
  per stockist; hovering or focusing a dot highlights the matching row,
  and vice-versa. Dots are `<a>` elements with names, not decoration.
- **Inputs** (contact form): 1px plum border, 12px padding, Newsreader
  body; focus-visible ring as above; invalid after submit shows a plum
  message beneath, never a red border alone.
- **Reveal**: none. Content is visible on load; the only animation is
  the hero fill, and `prefers-reduced-motion: reduce` sets the bottles
  full from the start.

## 7. Do's and Don'ts

Do
- Give a number where a competitor would give an adjective (8 g of
  sugar per bottle, not "lightly sweetened").
- Let a range colour own a whole band. One soda, one colour, one screen.
- Use real candid photography for people; the only rendered object on
  the site is the bottle, and it is drawn flat on purpose.
- Keep the joke to the name. "Kiam by name, kiam with the sugar" is the
  whole allowance.

Don't
- Don't photograph-fake the product: no stock bottle with a label
  composited on. The drawn bottle is honest; a fake photo is not.
- Don't put the range colours behind body text on salt, or use them
  for links.
- Don't stack the five sodas in a card grid. They are bands (sodas
  page) or a line-up (home), never five identical boxes.
- Don't add a testimonial slider, star ratings, or a badge wall. The
  reviews page is photographs and set type.
- Don't add hover-lift, fade-up reveals, or parallax. The brief for
  motion is one moment, and it has been spent on the fill.
- Don't use the 咸 glyph decoratively at random; it marks the wordmark
  and the salty axis, nothing else.

## 8. Agent Instructions

This repo's own root `CLAUDE.md` already states the Agent Instructions
block once for every template in this catalog (frontend-design/impeccable
invocation, the company DESIGN-SYSTEM pointer, web-design-guidelines
before done) — not repeated here per-template, matching how every other
template in this catalog works.
