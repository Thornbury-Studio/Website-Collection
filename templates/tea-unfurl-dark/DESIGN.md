This project inherits ../../../DESIGN-SYSTEM/DARK.md. Below are this project's own tokens and brand-specific rules.

(Path verified 2026-09-23: from `Company/Website-Collection/templates/tea-unfurl-dark/`, `../../../DESIGN-SYSTEM/DARK.md` resolves to `C:\School\Personal\Company\DESIGN-SYSTEM\DARK.md`. Per DARK.md §8's exception, DESIGN-SYSTEM/DESIGN.md §2 and §6 were also read and apply here as hard constraints; nothing else in DESIGN.md does.)

# UNFURL. — design

## 1. Overview & identity

UNFURL. sells one thing: a 100 g tin of charcoal-roasted, cloth-rolled Qingxin oolong from a ridge garden above Shizhuo in the Alishan range (Chiayi County, Taiwan), delivered across Singapore. Four pages: the steep (`index.html`), the garden, brewing, the tin.

**The one mechanism (DESIGN.md §2: one load-bearing constraint).** A rolled oolong is a leaf folded into a knot; hot water opens it back into a leaf. The home page is that first pot. A real macro film of loose leaf opening in a glass teapot fills the screen, pinned, and is scrubbed by scroll (Apple's frame-sequence technique: GSAP ScrollTrigger maps scroll to one of 160 frames drawn to a canvas). The same scroll position drives a steep clock (0:00 → 3:00), the colour the liquor would pour at that second ("Poured now" — the backlit pot itself reads amber throughout, so the readout names the cup, not the film), and the brand's cupping notes for that second: when the knots crack, when the aroma is out but the body isn't, when the liquor turns gold, then amber, when to pour. The notes and every number come from `js/steep-model.js`. The transformation in the film is the proof; the notes say what it means in the cup.

The wordmark carries the same idea without adding a second effect: `UNFURL.` is set in Archivo's variable width axis and opens from 62% to 125% width as the clock runs, top left, over the film's top scrim.

**What this deliberately is not.** Not BLOOM.'s mechanic (a synthetic WebGL simulation driven by a days-since-roast slider). No shader, no simulation, no slider-as-concept: the picture is filmed, and the only control is the scroll (the steep-time slider mirrors the scroll position for keyboard users and drives it; it never changes what the tea "is").

## 2. The film, and the search behind it (DARK.md §5 real-footage preference; DESIGN.md §6 ask-before-generating)

Searched before choosing, in order: Pexels video (tea leaves water, unfurling, oolong, steeping, macro, time-lapse, gaiwan and ~25 more terms), Pixabay, Mixkit, then Adobe Stock's free tier. What exists:

- Plenty of pouring, cups and tea bags; several macro clips of leaves *falling into* liquor (Pexels 4926068, 5404501).
- One genuine rolled-oolong time-lapse (Pixabay 103852, a celadon gaiwan from above) — real unfurling, but 1080p, soft, and a bright white table; the bowl is ~500 px across. Too weak for a hero.
- **Adobe Stock 737291599** (free tier, not generative): 4K vertical, 29 s, loose leaf in a glass teapot, backlit amber, the leaves moving from a dense dark mass to open leaves drifting apart as the liquor opens up. Chosen.

It is not a single leaf filmed from knot to leaf; no free or free-tier clip of that exists at usable quality. It is real macro footage of whole leaf opening in hot water, which is the mechanic. No AI generation was used or proposed anywhere on the site. The index copy says plainly that the film is "slowed so you can see the leaf move"; the steep clock is the pot's clock, not the film's.

Frames: `tools/focus.py` measures, for each of the 160 frames, where down the portrait master the leaves are in focus (Laplacian energy) and smooths that into a slow camera path; `tools/film.py` cuts a 16:9 band along that path, grades every frame identically (the master is red-orange; the grade pulls it to amber so the dark early frames read as wet leaf, not embers), and writes three sets: 2048×1152 (3.7 MB) and 1440×810 (2.4 MB) landscape for desktop, 720×1280 portrait (3.2 MB) for phones. A visitor loads one set, coarse to fine.

The first round of critique (below) is why it works this way: the first build showed the film as a 9:16 column in the middle of the screen, which read as a letterboxed phone clip, and a fixed crop, which was often all blur.

## 3. Colours

| Token | Hex | Use | Contrast on ground (#0c0a08) |
|---|---|---|---|
| `--ground` | #0b0d0b | page — leaf-black, faintly green | — |
| `--raise` | #121512 | order panel | — |
| `--line` | #232923 | rules | ornament only |
| `--paper` | #ece7da | text | **15.8:1** (14.9 on raise) |
| prose | #d9d6c8 | body copy | **13.4:1** |
| note | #e3d8c6 | cupping notes, italic | **13.8:1** |
| `--muted` | #9ea593 | labels, captions | **7.7:1** (7.2 on raise) |
| `--amber` | #e39a3b | accent text, focus ring, buttons | **8.3:1**; button text (ground on amber) 8.3:1 |
| `--dim` | #5c6559 | rules | 3.2:1 — **never text** |

The ground is green-black, not warm: the only warm thing on the page is the tea. Amber is the liquor and the only accent. No purple anywhere. Text over film or photographs always sits on a scrim (stage and band gradients reach 0.72–0.94 ground at the text; paper on that is ≥12:1), and labels over imagery switch from muted to paper.

## 4. Typography

- **Archivo** (variable: wdth 62–125, wght 100–900) — display, UI, numbers. Headings at 112–116% width, the stage word animates 62→125%. Tabular figures for the clock and tables; Archivo's zero is unslashed.
- **Newsreader** (opsz, italic) — body and every tasting note, in italic: tasting language reads as someone's notebook, not a spec sheet.
- Labels: Archivo 600, 12.5 px, tracked 0.16em, uppercase, `--muted`.
- No Inter/Roboto/Space Grotesk, nothing centred over a hero headline, no pill above a headline.

## 5. Layout & spacing

- Gutter `clamp(16px, 4vw, 64px)`; sections `clamp(72px, 10vw, 150px)` vertical.
- **The stage**: a pinned 100svh frame, the film edge to edge. A top scrim carries the word (top left, opening to 70% of the width) and the lede with the pot's spec (top right); a bottom scrim carries the clock and liquor (bottom left), the note (bottom right) and a full-width ruler. The middle of the frame is picture only. Phones: the same, stacked — word, lede and spec at the top, clock, note and ruler at the bottom.
- Other pages avoid repeating one split: full-bleed bands, a two-image day layout that alternates sides, a five-column ledger, sticky recipe media with tables, a spec list beside the order panel.

## 6. Elevation & depth

Flat. Depth comes from the film's own backlight and the scrims over it. No glassmorphism except the header's 10 px blur once scrolled.

## 7. Components & states

- **Stage** (`js/stage.js`): scrub mode (motion allowed, GSAP present) vs still mode (reduced motion, or GSAP failed). Canvas backing store capped at 1.5× device pixels; frame set picked by viewport (phones portrait; desktop 1440 or 2048 by backing width); draws only when on screen (IntersectionObserver) and only when the frame index changes; frames load every 32nd → 16th → … → every frame, nearest-first around the reader; adjacent frames cross-fade for slow scrolls; crossing a breakpoint reloads the right set (stale loads from the old set are ignored). The 2D context handles both `contextlost` and `contextrestored` (the restore redraws — verified by `tools/probe.mjs context`).
- **Reduced motion**: no pin, no scrub, no Lenis, no reveals, garden film paused. The stage is a still at the pour (3:00) with its readouts; the steep-time slider swaps still frames and readouts by hand.
- **Live region**: `#steep-summary` speaks once per cupping note (not per second), from `STEEP.summary()`; its static text is baked by the same function.
- **Order panel** (`tin.html`): quantity stepper (1–6), courier/collect radios, tally priced by `STEEP.orderTotal()`. "Hold my order" keeps the hold in `localStorage` (`unfurl.hold.v1`) with a reference; the customer emails the reference and address and gets a payment link. No personal data is entered or stored on the page, and nothing is charged — a template folder has no backend (AGENT.md).
- Buttons: amber fill, ground text, 48 px; ghost variant with a 1 px line. Links: amber with an arrow that nudges on hover. Focus: 2 px amber outline everywhere. Touch targets ≥ 44 px (radio inputs sit inside ≥48 px labels).

## 8. Baked numbers (DARK.md §5, 2026-09-24 rule)

Every number and every cupping note — visible text, the `aria-live` summary, table cells, the order tally, word-form counts ("four steeps", "three minutes"), `<title>` and meta descriptions, even the numbers printed on the tin label — is computed from `js/steep-model.js`. `node tools/bake.mjs` rewrites 113 markers (`<!--b:key:arg-->…<!--/b-->`) plus each page's title and descriptions; `tools/label.html` reads the model when the label is rendered. Nothing numeric is hand-typed in the pages.

## 9. Imagery (DARK.md §2)

Nineteen graded stills (16 Pexels photographs + frames of two Pexels clips), one Adobe Stock free film for the stage, one Pixabay loop for the garden hero, one Adobe Stock free blank tin printed by `tools/tin.py`. One identical grade (`tools/grade.py`). Full credits and licence notes: `IMAGE-CREDITS.md`.

**Stated repeats (the only two):**
- `img/tin.webp` appears on `index.html` (the tin band) and `tin.html` (hero). It is the only product; the shop is one tin, and the page that sells it has to show the same object the home page promised.
- The stage film is used only on `index.html`; its frames are not reused as stills elsewhere.

Every other photograph appears on exactly one page.

## 10. Do's and don'ts

- Do keep the film honest: never claim it is real-time or that the clock is the film's clock.
- Do add a new cupping note by adding it to `MARKS` and re-baking; never type it into HTML.
- Don't add a second hero effect. The word's width is the same idea as the film, and it stops there.
- Don't put paper text straight onto the film or a photo without a scrim.
- Don't add a product grid, a subscription, or a second tin.

## 11. Agent instructions

See `CLAUDE.md` in this folder: DARK.md §8's block verbatim, depth adjusted to three.

## Critique log (DARK.md §6)

**Round 1** — fresh-context critic, given only desktop + mobile screenshots, the two references (Apple's scroll-scrubbed product pages; BLOOM., the sibling this must not repeat) and §4's checklist, asked to disprove that it was good enough. Verdict: **No.**
- §4: all PASS except the stat-banner row (soft FAIL: POTS/LITRES/A POT-style strips on three pages). Can't judge OG/alt from pixels (the harness checks those: all present).
- Hero vs Apple: REFERENCE WINS on footage — the film was a ~455 px portrait strip letterboxed in black, soft, graded red, so the early frames read as embers. Storytelling (clock, notes, the widening word): CURRENT WINS narrowly. Copy specificity: CURRENT WINS.
- vs BLOOM.: different technique, but the same skeleton (one-word wordmark with a full stop, "one X from one Y" lede, "The only thing we sell", nav ending in the price, warm black + cream + orange).
- **Single largest gap: the hero film.** Fixed: full-bleed landscape cut from the 4K master, three frame sets up to 2048 px, an amber grade, and a focus-following crop (`tools/focus.py`) so every frame shows leaf in focus.
- Also fixed from its defect list: stat strips became the arithmetic they stand for (S$42 ÷ 80 pots = S$0.53; 20 doses × 4 steeps = 80 pots; the lot ledger chains with ÷ and =) or went (brew); the phone hero now carries the lede and the pot's spec; one label for one action ("Order the tin", "Hold my order"), and the hold now issues a reference to email instead of implying a checkout; the "3 min, then 4 steeps" contradiction; labels over photographs raised to paper and a header scrim added; the tin no longer sits on a lighter rectangle; heading-to-body gaps; the knot heading's orphan; the lone ledger cell on phones; the concrete-and-teapot shoot no longer appears twice (the tin page uses a frame of rolled leaf in a scoop); the pink village photo removed; the FAQ given two columns; the first-steep log (a word-for-word repeat of the hero) replaced by the next three pots from the same leaf; BLOOM.'s skeleton broken (new lede, no price in the nav, "The shop", a green-black ground).

**Round 2** — a new fresh-context critic, same materials, new screenshots. Verdict: **No**, and the same single largest gap: the film. §4 now all PASS (stat banner "narrowly": the lot ledger is a real sum); repeated heading/section rhythm flagged; "a sibling from the same kit, not a copy" of BLOOM. The critic's fix is different footage — a sharp, locked-off macro of knots opening in clear water that visibly goes clear to amber, with its own portrait edit. **That is a plateau (DARK.md §6.5), and it is not a tweak:** no free or free-tier clip of that exists (the full search is in §2), and the two ways to get one — paid stock (on hold per DARK.md §2) or AI generation (ask-first per DESIGN.md §6 and the brief) — are the owner's call, so the question was put to the owner instead of a third round on the same element. What round 2 did change:
- the stage's liquor readout now reads "Poured now" (it names the cup at that second; the backlit pot is amber from the first frame, and re-grading the film to fake a clear-to-amber change would manufacture the proof);
- the first screen says what is for sale (a charcoal-roasted oolong, one S$42 tin);
- the knot section uses the scoop of rolled knots (the concrete-and-teapot shoot, which showed broken green leaf beside "nothing is broken", is gone from the site), the tin page gets dry knots in a gaiwan;
- "rolled by hand" is gone (the garden photographs show a rolling machine, which is how cloth-ball rolling is done);
- the brew photographs' pale liquors are captioned for what they are (a fourth pot, a short gaiwan steep);
- one active state in the nav; stronger scrims on the garden hero and bands; the garden hero's spec list spaced; the order section aligned to the top; the steep track ends at 3:00 with its ticks measured from the thumb's centre; "Water so far" renamed "Total time"; less dead space between sections.
