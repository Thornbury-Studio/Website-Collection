This project inherits ../../../../DESIGN-SYSTEM/DARK.md (verified: that path resolves from this folder to `C:\School\Personal\Company\DESIGN-SYSTEM\DARK.md`). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — MØRKE

## 1. Overview & Identity

**MØRKE** is an invented six-room expedition lodge in Svalbard, 78°26′ N 15°57′ E,
open only during the polar night: from 26 October, the first morning the sun
doesn't rise, to 16 February, the day it comes back. One page, `index.html`.

**The one idea: the visit is a descent.** One filmed clip, scrubbed by scroll,
carries the page from the sky to the lodge: the top of the page is the aurora
overhead, and the bottom is the lit house on the shore. Every chapter is read
at the height the camera is passing:
- **01 Sky:** the aurora.
- **02 Mørketid:** the dark season, with its numbers.
- **03 The way in:** the ridge comes into view.
- **04 The lodge:** the camera lands.
- **Inside:** the film pushes in on the second lit window, which opens into the
  table, a north-window room and the sauna. It closes back to the house for the booking.
- **05 Season:** the booking, beside the house.

The brand mark is the Ø redrawn as a sun *under* a horizon line (`img/favicon.svg`, the
header mark): the whole product in one glyph.

Everything quoted about the sun comes from one model, `js/sun.js`. The page
reads it three ways:
- **The live readout:** where the sun is at the lodge right now.
- **The season chart:** the noon sun on every day from October to March.
- **The copy:** the dates in the text, checked against the model by
  `tools/check-season.mjs` (DARK.md §5's bake rule; there is no build step to
  bake into, so the check is what fails instead).

The season figures, computed for 78.43° N:
- **Last sunrise:** 25 October.
- **Without the sun:** 113 days.
- **First sunrise back:** 16 February.
- **No civil twilight:** 12 November to 30 January.
- **Noon on 21 December:** the sun is 11.9° below the horizon.

These match Longyearbyen's published polar-night dates.

## 2. Colors

| Token | Hex | Use | Contrast on `--night` |
|---|---|---|---|
| `--night` | `#05090e` | page, film letterbox, footer | — |
| `--night-2` | `#0b121a` | select option lists | — |
| `--ink` | `#eef2f4` | all body text and headings | 17.7:1 |
| `--frost` | `#a9b7c2` | labels, captions, secondary lines | 9.7:1 |
| `--aurora` | `#a7e8c0` | live data only: the sun readout, today's mark on the chart, the rail fill | 14.2:1 |
| `--ember` | `#f2b968` | window light: the one action colour (button, focus ring, the sun in the mark) | 11.3:1 as a focus ring |
| `--ember-ink` | `#1b1206` | text on ember | 10.5:1 on `--ember` |

**Text sits on a moving film, so token ratios are not the real test.**
`tools/contrast.mjs` and `contrast.py` measure every visible text box against the
brightest 5% of the film behind it, with the glyphs hidden, at 7 scroll stops,
desktop and mobile. Final run (r11/r10):
- **Desktop:** 160 boxes, none below AA; worst 4.9:1, the 12px rail numbers.
- **Mobile:** 58 boxes, none below AA; worst 8.0:1.

Getting there took four things:
- A stronger left scrim on desktop.
- A right-edge scrim under the rail and readout, repeated on the interior layer.
- A soft dark backing behind each text block on phones.
- A radial "pool of shadow" behind each interior caption and behind the readout.

These are gradients only: no blur, no panel edge, no glass.

No purple. The aurora is green because the clip is; the only warm colour is the window light.

## 3. Typography

- **Display: Newsreader** (Production Type, OFL, Google Fonts). Weight 300, opsz
  60–72. Headlines only, italic for a single stressed word ("the *dark*").
- **Text and UI: Schibsted Grotesk** (OFL, Google Fonts), designed for the Norwegian
  publisher Schibsted. Labels in tracked uppercase at 0.74–0.78rem; numbers tabular.
- No Inter, Roboto, Arial or Space Grotesk anywhere; no centred hero.
- Scale: h1 `clamp(3.4rem, 9.4vw, 9.2rem)` / 0.92; h2 `clamp(2.3rem, 4.6vw, 4.5rem)`;
  the table caption is the one type moment, `clamp(3rem, 7.6vw, 7.8rem)`.

## 4. Layout & Spacing

- **Gutter:** `clamp(1.25rem, 6vw, 6.5rem)`.
- **Desktop:** a ~37rem reading column on the left, over the left scrim. The right
  half belongs to the film, the chapter rail and the readout.
- **Inside act:** breaks the column on purpose:
  - The table caption runs wide across the frame.
  - The room caption sits in a right-hand column, with the north window left.
  - The sauna caption sits low along the benches.
- **Chapters:** 150vh tall (130vh on phones), so the film has room to move between texts.
- **Phones:** text blocks sit in the lower half with their own backing. The film is the
  9:16 cut centred on the lodge, x 0.433–0.747 of the master frame.

## 5. Elevation & Depth

Layers, back to front:
1. `.film`: the video and its fallback stills.
2. `.film__scrim`
3. `.inside-layer`: three photographs, clipped to the lit window.
4. `main`: the text.
5. The rail and the readout.
6. The header, with its own fade.

No shadows on boxes, no cards. Depth comes from the film and the window reveal only.

## 6. Components & States

- **Chapter rail** (`nav.rail`, desktop ≥ 901px): the five chapters as real links. The active
  one shows its name, and the fill tracks whole-page progress. Inside the lodge
  it stays on 04.
- **Sun readout:** the altitude now at 78.43° N and local time in Longyearbyen,
  updated every 30 s. Hidden when JS is off, because a static "below the horizon"
  would be false half the year. Hidden on phones once past the hero.
- **Season chart** (SVG, drawn by JS at its displayed width so its 11px labels stay
  11px on a phone):
  - The noon sun for every day, October to March, with the horizon and −6° lines.
  - The no-sunrise days shaded.
  - "Noon today" marked in aurora green.
  - Labels sit where the curve cannot be.
- **Route:** four stops, Longyearbyen to Mørke: a real sequence, not decoration.
- **Enquiry form:**
  - Name, email, month, nights (4/5/7), guests (1–12), a note.
  - A live estimate (NOK 11,400 × guests × nights) in an `aria-live` line.
  - Submit validates name and email, sets `aria-invalid` and focuses the first
    bad field.
  - It then composes a `mailto:` to booking@morkelodge.no (no backend: AGENT.md).
  - It dispatches a cancelable `morke:enquire` event first, so tests can stop the
    real mail client opening.
- **Focus:** 2px ember outline, 3px offset, on everything. Touch targets ≥ 44px; the
  button is 52px.

## 7. Motion, the film, and reduced motion

**The encode is what makes scrubbing work.**
- The clip is played reversed and re-encoded **all-intra** (`-g 1`, every frame a
  keyframe, `-bf 0`, faststart), so any `currentTime` seek decodes one frame.
- Measured in headless Chrome on this machine with `requestVideoFrameCallback`, to
  the frame actually presented:
  - Median 6.1 ms; p95 13.6 ms single-frame steps, 14 ms random jumps.
  - A 12-frame-GOP encode measured about the same here. It was not kept: phones pay
    for every P-frame walked on a seek, and an all-intra file is the one that can't stutter.
- CRF 27 at 1920×1072 (9.7 MB) and 720×1280 (4.4 MB) keeps the faint stars; CRF 31
  lost them visibly.
- The film is served at a fixed size whatever the DPR. That is the DPR cap: no
  canvas or WebGL anywhere, so nothing else scales with it.

**The scrub:** scroll progress (from the top to just before the window opens) maps
to film time. A 0.22 ease on top makes a flick read as a camera move. A seek is
only issued when the frame would change, and never while one is in flight; the
latest target is kept for when it lands. Lenis smooths wheel input on GSAP's
ticker; ScrollTrigger drives the heading line reveals and the chapter dimming.

**The window:** `clip-path: inset()` computed every frame from the second lit
window's rectangle, which is measured from the film's last frame and mapped
through `object-fit: cover`. It eases from that rectangle to the full screen
while `#inside` rises from 65% to 12% of the viewport, and closes after the last
caption has gone. The footer lifts the film as it arrives, so the house is never
cut at its roof.

**Fallback modes** (one code path, `mode = 'stills'`):
- **Triggers:** reduced motion, Save-Data, a film that errors or isn't loaded in
  15 s, or `?mode=stills`.
- **Behaviour:** the film is never requested. Three frames of the same clip (sky,
  ridge, lodge) swap by chapter, and the window opens and closes instantly instead
  of growing. No Lenis, no split-line reveals, no dimming; CSS transitions go to 0.01 ms.
- **No JS at all:** each chapter carries its own still as a background, and each
  room its own photograph.

## 8. Imagery rules

- **The film and the keyframe are AI-generated, with the boss's explicit OK** (DESIGN.md §6 gate).
  - **Why:** a search of Pexels, Pixabay, Mixkit, Coverr and Adobe Stock's free tier found no
    real clip that films a sky-to-lodge move in polar night.
  - **The still:** one Nano Banana Pro keyframe, a free generation.
  - **The clip:** one Kling 3.0 image-to-video, 48 credits.
  - **Prompts:** the policy's subject / composition / camera / motion / constraints order.
  - **Excluded:** smoke and falling snow, because the clip plays reversed.
  - Accepted on the first generation; nothing regenerated (VIDEO-POLICY.md).
- **The three interiors are generated too:** Nano Banana Pro, with the keyframe as the reference.
  - **History:** the first build used Pexels stock. The round-2 critic showed it contradicted the product: trees
    outside the window, a wedding banquet, three gradings.
  - **Look:** the same black larch, the same square deep-framed windows, and aurora over treeless snow in every
    window.
  - **Checks:** no text, people or marks (the stove door was checked close up).
- One grade for everything (`eq=gamma=0.94:saturation=1.04`), so the photographs and the film sit in
  one light.
- Masters stay in `tools/raw/` (gitignored); `python tools/media.py` re-derives every served file.
- Provenance and licences: `IMAGE-CREDITS.md`, `LICENSES.md`. No disclaimer in the page itself
  (repo CLAUDE.md).

## 9. Do's and Don'ts

- **Do** let the film carry the page. New content goes in a chapter at the height where the camera is.
- **Do** keep every sun figure tied to `js/sun.js`; run `node tools/check-season.mjs` after any copy edit.
- **Do** re-run `tools/contrast.mjs` after any change to scrims, copy position or the clip.
- **Don't** re-encode the film with a GOP, B-frames or without faststart.
- **Don't** add a second film. The interiors are stills on purpose: the clip is the journey, and the window is the door.
- **Don't** add glass panels, pills above headlines, card grids or a stat strip. The facts list under the chart is the
  chart's legend, not a stat banner.
- **Don't** put a static sun position in the HTML.

## 10. Agent Instructions

```
# UI Generation Rules (DARK engine)
Before writing, editing, or restyling any front-end UI in this repo:
1. This project is DARK-engine (see .claude/engine-mode). Do NOT invoke
   `frontend-design`, `impeccable`, or `web-design-guidelines`, and do
   NOT read DESIGN-SYSTEM/DESIGN.md — those belong to the light engine
   only, mixing them in is exactly what the engine split exists to
   prevent. **Exception, added 2026-09-24 after a real build (`BLOOM.`)
   followed this line and skipped both: DESIGN.md §2 (the over-constraint
   rule) and §6 (the accessibility & motion floor, the no-hand-geometry
   rule, and the ask-before-generating gate on AI image/video generation)
   are NOT restated anywhere in DARK.md — read those two sections
   directly, they are hard constraints here too. Nothing else in
   DESIGN.md applies.**
2. Read this repo's own DESIGN.md AND ../../../../DESIGN-SYSTEM/DARK.md (the
   company-wide dark taste system — adjust the `../` depth to match
   this project's actual nesting, or use an absolute path if nested
   inside a shared catalog repo, see the note above). Treat both as
   hard constraints.
3. Reach for the real open-source stack named in DARK.md §5 by default
   rather than hand-rolling the effect from scratch. Compose from real
   licensed scaffolding (§1.2) — original execution and content on top,
   never a copy of a finished real brand.
4. Check licensing as each dependency/asset is added (DARK.md §2), not
   as cleanup at the end.
5. Before calling any UI work done: take real screenshots (desktop +
   mobile) and check them against DARK.md §4's checklist directly
   against the image, not just the code (DARK.md §6).
```
