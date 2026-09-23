This project inherits ../../../DESIGN-SYSTEM/DARK.md. Below are this project's own tokens and brand-specific rules.

# DESIGN.md — GROUND.

## 1. Overview & Identity

**GROUND.** is one fountain pen, one nib size, one price, from a two-bench
workshop in Sheffield. There is nothing else in the range and nothing
planned.

**The one idea:** *a nib is stamped identical and then ground individual.*
The blank comes off a press like every other blank; the tipping pellet is
welded on by a machine; the slit is cut by a disc. Then someone puts the
tipping to a wheel, and to lapping film, and to paper, and from that
moment two nibs of the same model are no longer the same. That is the
real, checkable reason two pens with the same letter on the box write
differently — and the whole site exists to say it once, clearly, with
real macro photography of the object and typography that carries the
argument. No process animation, no simulation, no mechanism to scrub.

**How it is enacted:**

1. **Photography does the talking.** Thirteen real, licensed frames
   (Unsplash + Pexels, ids in `IMAGE-CREDITS.md`), every one graded to a
   single dark register in which the only colour allowed is the gold of
   the tipping (`tools/grade.py`, grade `nib`). The hero is a real 14k nib
   filling the frame with no maker's name on it — the brand lives in the
   type, never engraved into a stock photograph. The section whose subject
   is the tipping (`#touch`) gets the one frame where a ground tipping is
   actually large and sharp. **One pen:** every frame that shows the whole
   pen is the same photograph (Litvyak, `H-o28jg1mjw`) in two crops, and
   the spec table describes *that* pen — brass under black lacquer,
   gold-plated band, ring and clip — not an imagined one. That reuse is
   deliberate and stated (DARK.md §2). Fresh-context critique round 1
   (2026-09-23) found the first draft showing four visibly different pens,
   an "IRIDIUM POINT GERMANY" steel nib beside the 14k spec, and dip nibs
   captioned as stamped blanks; all three were replaced or re-captioned
   to what the frame actually shows. Do not regress to "any nice pen".
2. **The type is the line, as near as a roman gets.** Fraunces is a
   broad-nib-derived roman: its optical-size axis runs from a near-
   monoline cut at `opsz 9` to hairline contrast at `opsz 144`. Every
   grind is named in the cut *nearest* the line it makes — round at
   `opsz 9` (no variation), cursive italic and needlepoint at `opsz 144`,
   stub and oblique between. Architect writes a reverse-contrast line
   (thin down, broad across) that no roman face has; it is set in the
   heaviest low-contrast cut and the copy says so plainly ("No roman type
   writes this line; the rules do"). Fragment Mono carries every
   measurement.
3. **The widths are drawn at scale.** Each grind row carries its line at
   exactly 10× (`0.25 mm → 2.5 px`, `0.9 mm → 9 px`): the down stroke,
   then the cross stroke underneath it, so the thick/thin of a stub or an
   italic is visible as two bars side by side rather than one bar that
   looks like every other. Not a simulation of writing: a measured line,
   drawn once, that anyone with a ruler can check against the caption;
   `tools/shot.mjs` asserts the rendered heights (`badWr`).
4. **Two registers, one story.** The dark pages are the workshop and the
   metal. A paper-white section (`.paper`) is the test sheet — the page
   every pen is written on before it leaves — and the only place the
   light register appears.

**Refuse:** a pen floating on a gradient pedestal; a "heritage" script
wordmark; a nib photo with another maker's name on it; the words
"artisan", "crafted", "elevate", "unlock", "transform", "empower".

## 2. Reference DNA

**Franklin-Christoph's nib programme** (franklin-christoph.com, "FP Nib
Info") is the real-world grounding for the claim — cited for the
*practice*, not the site: factory widths EF .4 / F .5 / M .6 / B .8 mm;
specialty grinds cut one at a time by a named grinder (cursive italic
.55 / .7 / .9, stub .7 / .9, needlepoint .25 from Yukio Nagahara; the
S.I.G. — stub-italic gradient — ground in-house by Audrey Matteson); and
their own line, "all pens that we ship have been tuned and tested." Those
numbers are the industry's numbers and are used here as the brand's own
menu. Nothing of their layout, copy, or imagery is taken.

Compositional DNA, in the forensic sense DARK.md asks for:
- A technical drawing's **title block**: the mono spec column that sits in
  the left margin of every section (part, material, size, tolerance).
- The **specimen sheet** convention from type foundries: one word set in
  each cut, the cut's name and size beside it — reused as the grind menu.
- Editorial full-bleed photography with the caption in the margin, never
  over the image.

## 3. Colors

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--ground` | `#0B0B0A` | page ground (dark register) | — |
| `--raise` | `#141412` | raised band, table stripe | — |
| `--ink` | `#E9E4D8` | primary type on ground | 15.5:1 |
| `--gold` | `#C9A45C` | the tipping; accent, links, focus ring | 8.4:1 |
| `--steel` | `#9AA0A6` | secondary type, captions | 7.5:1 |
| `--mute` | `#8A867E` | meta only | 5.4:1 |
| `--rule` | `#2A2825` | hairlines | — (never text) |
| `--paper` | `#EDE7DA` | ground of the paper register | — |
| `--paper-ink` | `#14120F` | type on paper | 15.2:1 |
| `--paper-mute` | `#5A554C` | captions on paper | 6.0:1 |

`--gold` on `--paper` is 4.1:1 — used there only at display size (≥ 24px),
never for body. `--rule` is never used for text. Every ratio above was
computed, not estimated (`tools/` has the formula in `grade.py`'s sibling
one-liner; re-run before changing a token).

## 4. Typography

Two families, each carrying one register. The contrast between them *is*
the argument: the roman is the line, the mono is the measurement.

- **Fraunces** (OFL, Google Fonts, variable `opsz 9–144`, `wght
  100–900`, `SOFT`, `WONK`). Wordmark (`wght 700`, `opsz 144`, `WONK 1`),
  display, body. Optical size is set explicitly per role, not left to
  `font-optical-sizing: auto`, because the site uses it as meaning:
  - Round → `opsz 9`, `wght 400`, `SOFT 100` (nearest to monoline)
  - Stub → `opsz 72`, `wght 600`, `SOFT 100` (contrast, soft corners)
  - Cursive italic → italic, `opsz 144`, `wght 500` (sharp contrast, corners)
  - Needlepoint → `opsz 144`, `wght 200` (hairlines everywhere)
  - Oblique → italic, `opsz 72`, `wght 400`, `SOFT 100`, `WONK 1`
  - Architect → `opsz 9`, `wght 900` (no reverse-contrast axis exists;
    heaviest low-contrast cut, and the copy says the rules carry the line)
- **Fragment Mono** (OFL, Google Fonts, 400 + italic). Spec columns, mm
  figures, nav, labels, the order form. Tabular by construction.

Not Inter, not Roboto, not Space Grotesk, not Arial. No centred hero
`<h1>`; every display line sets flush left on the grid.

Scale: `clamp()` throughout — `--step--1` … `--step-6`, ratio 1.2 at 360px
opening to 1.333 at 1600px. Body 17–19px, line-height 1.55. Measure 62ch
for Fraunces prose, 44ch for mono.

## 5. Layout & Spacing

12-column grid, `--gutter: clamp(20px, 4vw, 72px)`, `--col` = one
twelfth. The **spec column** (`.spec`) occupies columns 1–2 on wide
screens and becomes a ruled strip above the content below 900px. Every
section is either:

- a **frame** — one photograph, full-bleed or 8 columns wide, its caption
  in the margin (`figcaption`, mono, never over the image); or
- a **sheet** — typography on the ground with hairline rules; the grind
  table, the ledger of numbers, the order form.

No card grid anywhere. No icon-topped columns. Radius is `0` everywhere,
always — the object is made of flat facets and ground edges.

Per PATTERNS.md: any grid that places a child places all of them
(`grid-column` and `grid-row`), never auto-placement beside a placed
sibling.

## 6. Elevation & Depth

None. Nothing floats, nothing has a shadow, nothing blurs. Depth comes
from the photography's own focus fall-off and from one hairline weight
(`1px` at `--rule`). Banned here: `backdrop-filter`, drop shadows on type,
gradient borders, pills.

## 7. Components & States

- **Nav** — fixed, mono, hairline underline that draws in on hover and
  focus. The wordmark's full stop is `--gold`.
- **Width rule** (`.wr`) — a `<span>` with an inline `height` in px equal
  to the grind's mm × 10, `background: var(--ink)`. Its `aria-label`
  states the width in words so the number is never image-only.
- **Ledger row** — mono label left, Fraunces value right, hairline below.
- **Buttons / links** — mono, uppercase, `1px` rule under; hover fills
  the rule to `--gold`; focus `outline: 2px solid var(--gold);
  outline-offset: 3px`. Never removed.
- **Order form** — native inputs, `1px` bottom rule, label always visible,
  error text in `--gold` with the field's `aria-describedby`. Submit
  produces a reference and a `mailto:` — nothing is charged, nothing is
  sent anywhere (no backend, per AGENT.md).
- **Touch targets** — every control ≥ 44×44px on `pointer: coarse`.

## 8. Do's and Don'ts

**Do**
- Show the tipping, not the whole pen, whenever the subject is the grind.
- State a number wherever a claim is made, and state its unit.
- Keep the gold for the metal and for focus. Nothing else is gold.
- Let a section be one photograph and one sentence if that is what it needs.

**Don't**
- Add a scroll-scrubbed mechanism, a process animation, or a simulated
  nib. This brief is photography and type; a mechanism would be a second
  idea.
- Use a nib photo carrying another maker's name — the sourcing rule that
  cost the most frames (Montblanc, Gucci, Pelikan, Kaweco, Parker all
  rejected on that basis).
- Introduce a third typeface, a card grid, or a testimonial strip.
- Use `--rule` for text, or `--gold` for body text on paper.

## 9. Stack — what was taken and why

Per DARK.md §5, chosen against the concept rather than taken wholesale:

| Library | License | Doing what |
|---|---|---|
| **Lenis** 1.1.x | MIT | Smooth scroll, native anchors/sticky/keyboard intact. Not constructed under `prefers-reduced-motion`. |
| **GSAP** 3.12 + **ScrollTrigger** | GSAP standard "no charge" | The staggered ledger rows only. No pinning, no scrub, no parallax — a scrubbed 6% parallax was in the first draft and removed after critique round 1, because the brief bans a scroll-scrubbed mechanism and a parallax is one, however small. Frame reveals are plain CSS `clip-path` transitions driven by IntersectionObserver. |
| **SplitType** 0.3.x | MIT | Line reveal on the display headlines only. |

**Deliberately not taken:** Three.js / any WebGL — there is no scene;
Barba/Swup — three pages with hard cuts read as three sheets of paper,
which is right for this object; react-bits/magicui effects — none of the
brief's content needs one.

## 10. Performance & motion floor

- Every image is `webp`, two or three widths, `srcset`/`sizes`,
  `loading="lazy"` below the fold, explicit `width`/`height`. Hero
  preloaded with `fetchpriority="high"`.
- `prefers-reduced-motion: reduce` — Lenis is never constructed,
  ScrollTrigger is not registered, every reveal resolves to its final
  state immediately, SplitType is not run.
- Visible focus on every interactive element; one `h1` per page; heading
  order never skips a level; every image alt-texted with what is
  actually in the frame.
