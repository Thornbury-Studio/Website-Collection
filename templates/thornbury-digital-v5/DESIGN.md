# THORNBURY DIGITAL v5 — LIQUID MONOLITH

The studio's own site as a heavy, expensive object. Obsidian `#080808`, liquid
chrome `#e1e1e1`, one ember `#ff2a00`. No blue, no navy, no sepia, no paper, no
brush. Four real pages (`index`, `work`, `studio`, `contact`), vanilla
HTML/CSS/JS, GSAP from jsDelivr, one 2D canvas.

## Palette audit

| Role | Value | Where |
|---|---|---|
| Ground | `#080808` | html, body, canvas clear, wipe |
| Chrome | `#e1e1e1` + 70 / 45 / 18 / 10 / 4.5 % alphas | type, hairlines, grid, glass skin |
| Ember | `#ff2a00` | active-nav square, plate markers, prices, focus ring, 4.5 % of strands, hover on the button |

Nothing else. Shadows are black, highlights are white at low alpha, grid lines
are chrome at low alpha. There is no third hue anywhere in the stylesheet.

## The liquid metal audit (`js/field.js`)

**Attractor.** Thomas, `x' = sin y − b·x`, `y' = sin z − b·y`, `z' = sin x − b·z`,
`b` per world (0.19 on Home). Euler with `dt = 0.02` in one sub-step, 60 sim
steps per second on a fixed-rate accumulator, so speed is identical at any frame
rate.

**Why it is a ribbon, not dust.**

1. *Strands.* 2,600 particles (900 on mobile) are seeded in strands of 24. A
   leader is settled onto the attractor with 240 warm steps, then each follower
   is placed two steps behind the previous one. A strand therefore lies along one
   trajectory and its segments overlap into one continuous string. Chaotic
   divergence is slow at this `b`, so strands stretch and fold rather than scatter.
2. *Segment = velocity.* Every frame each particle draws the segment from its
   previous screen position to its current one. Length is the displacement, so a
   fast stretch draws long, thin and bright and a slow bend draws short, heavy and
   dim: `lineWidth = (2.1 − 1.1·s)·(0.5 + 0.8·d)`, `alpha = (0.16 + 0.3·s)·(0.45 + 0.55·d)`
   with `s = clamp(|v| / 1.3)` and `d` the depth in `[0, 1]`. Round caps close the
   joints between frames.
3. *Wipe.* Before drawing, the canvas is covered with `rgba(8,8,8,0.08)`, so a
   trail decays to 1/e in ~12 frames — a short tail behind a strand that is being
   redrawn anyway. Every 7th frame the wipe is `0.24`: an 8-bit canvas cannot
   subtract less than half a level, so a soft wipe alone leaves a permanent ghost
   a few levels above black; the periodic harder wipe clears that floor.
4. *Metal.* Segments composite with `lighter`. Luminance is
   `0.22 + 0.45·d + 0.6·spec` where `spec = |t̂·L|³` against a fixed key light from
   the upper right — strands aligned with the light flare to white, the rest sit as
   mid chrome, and crossings pool to white the way mercury catches a lamp.
   Buckets of quantised `(kind, luminance, alpha, width)` are stroked as one path
   each, ~150–300 `stroke()` calls per frame instead of 2,600.
5. *Projection.* `Ry(rot)·Rx(tilt)` orthographic, `S = 0.10·min(vw, vh)` px per
   unit, `rot` advances at 0.06 rad/s; the pointer eases ±0.25 rad of yaw and a
   3 % parallax. DPR is capped at 1.5 (1.25 mobile) because fill rate is the cost.

**Interaction law.** `html[data-field]` is `live` on Home and Studio (rAF loop) and
`still` on Work and Contact: the still page pours 54 warm frames in four at a
time and then never touches the canvas again (re-pours on resize). Reduced
motion forces `still` everywhere. The `continuum` direction overrides this and
runs everywhere — see *Moving between pages*.

## Glass under the anti-stacking rule

Glass is `backdrop-filter: blur(16px)` + `mix-blend-mode: overlay`, and it is
applied in exactly three places: the bar, the one hero CTA button, the work
metadata cards. `mix-blend-mode` only blends with what is painted below it in
the *same stacking context*, and the canvas lives in the root context, so:

- `.site` has no `z-index` and no `isolation`.
- The bar is two fixed siblings: `.bar-glass` (blur + overlay, z 30) under `.bar`
  (chrome, z 31). Blending the bar itself would blend its text into black.
- `.gpanel::before` is the blended liquid layer; `.gpanel::after` is the
  unblended skin (edge, tint, highlight); children are `position: relative` so
  they paint above both.
- Every GSAP tween ends with `clearProps`, so no leftover `transform`/`opacity`
  opens a stacking context under a glass.

## The hero, and the handoff

One object, full bleed, and almost nothing else. A cratered moon on a slow
push-in, desaturated into the obsidian/chrome palette, with five pieces of type
on it: a mono kicker, the wordmark, the positioning line, two buttons, and three
figures along the bottom edge. No blueprint frame, no reticle, no coordinate
readouts — that scaffolding read as an unfinished tool, not a studio. A hook is a
subject plus restraint; everything that is not the subject is either a word you
need or it is noise. The stand-in is still marked, but by one 9px line in the
corner at 28% opacity.

**The film loops both ways.** The web encode is the strongest 7.5 seconds
followed by the same 7.5 seconds reversed, concatenated into one 448-frame file
(`split` → `reverse` → `concat` in a single ffmpeg pass), with the duplicate
frame trimmed at the turn. A plain `loop` attribute then runs forever with no
cut, because the last frame is one step from the first. Measured: the loop point
reads 32.2 dB PSNR against 32.8 dB for an ordinary frame step, and the turnaround
35.4 dB against 35.3 dB — both seams are indistinguishable from normal motion,
where unrelated frames sit at 13.6 dB.

**It does not cut off at the fold.** `.hero-stick` is 165 dvh tall and the hero is
`position: sticky` inside it, which buys 65 dvh of scroll to hand over in. Across
that range a scrubbed timeline dissolves the film to nothing and drifts it back
12%, while the copy lifts and fades sooner — so the moon gives way to the liquid
chrome field that was behind it all along. `autoAlpha` hides the spent hero
rather than leaving a transparent layer over the page catching clicks. Without
GSAP the hero simply un-pins and scrolls away, and the `.film-fade` gradient
still keeps its bottom edge from ending on a hard line.

Two things the lit subject broke, both the same bug in different clothes. The
`overlay` glass on the secondary button brightened against the moon until it
matched the solid primary and the hierarchy vanished — it needs a dark base under
the blend. And `.btn--glass` was losing the cascade to `.btn`, which is declared
later at equal specificity; `.btn.btn--glass` settles it.

## What is in the plates

The five work plates each hold a capture of that case's own site, taken live from
this collection:

| Case | Site |
|---|---|
| Midwater | `templates/film-midwater/` |
| Kiyo 清 | `templates/japanese-restaurant/` |
| Aurel | `templates/watch-atelier/` |
| Loam | `templates/cafe-loam/` |
| Form/01 | `templates/streetwear-form01/` |

On the home page they are **figures, not exhibits** — 148 px wide on a phone,
260 px at 1440 — set in an alternating hairline index where the case name carries
the row at up to 3.8 rem. A screenshot blown up to 800 px blocks the page and
buries the field behind it; at 260 px it reads as a plate in a book, and the
chrome field runs through the whole section. They rest at
`grayscale(.55) brightness(.7)` so a light site sits back inside the monolith,
and return to full colour on hover. The Work page keeps a proper gallery, three
up at ~408 px, where the metadata cards still fit.

Two things make a screenshot survive being framed this way. A two-stop `.scrim`
darkens the top and bottom bands, because three of the five sites are light and
the chrome corner labels would otherwise sit white-on-white. And the metadata
card carries its own `rgba(8,8,8,.5)` base under the `overlay` blend, so the
glass composites over a known ground instead of inverting on a bright plate.
The blueprint ruling is redrawn as a `.grid` overlay above the media, so the
frame still reads as a plate rather than a picture in a box.

## Layout DNA

Massive Archivo (`wdth 92`, weight 800) at `clamp(3.4rem, 9.6vw, 11.5rem)` with
`−0.04em` tracking, against JetBrains Mono metadata at 0.6–0.66rem with Off-White
style quoted labels (“FIG. 00”). The hero plate is a full-viewport blueprint
grid (10 % / 2.5 % lines, corner ticks, X/Y axes with ticks) that reports its own
pixel size into its corner labels and the hero meta line; the inline label is
“Hero still — Higgsfield later”. Work slots are windows into the liquid:
transparent plates with a hairline diagram per case, an outlined index numeral
overlapping the top-left corner, and a glass metadata card inside.

## Performance

Measured with Chrome DevTools traces and rAF sampling, desktop at 1440 and a
4x-CPU-throttled phone at 390.

| | Before | After |
|---|---|---|
| Field cost per frame | 12 ms, every frame | ~6 ms, every other frame |
| LCP (4x throttle, mobile) | 1,281 ms | 379 ms |
| Long tasks on Work at load | one at 78 ms | none |
| Page transfer | 4,544 kB | 2,918 kB |
| Lighthouse accessibility | 93 | 100 |

CLS was 0.00 throughout.

**The field was quadratic in disguise.** `flush()` walked a `Map` of *every*
bucket key ever created, decoding the key and testing `arr.length` for each,
including thousands that were empty — so per-frame cost grew with the number of
distinct (luminance, alpha, width) combinations the run had ever produced. It now
records only the keys touched this frame in an `Int32Array` and walks that.
Buckets are reusable `Float64Array`s with their own fill counts, because plain
arrays reset with `length = 0` churned their backing store and left a 5% tail of
18 ms frames. Euler runs one sub-step at the same `dt` instead of two, halving
the `Math.sin` count with no visible change to the trajectory.

**Then it stopped drawing when nobody can see it.** The field paints at 30 fps
while physics stays at 60 — it is a slow ambient drift and the wipe is doubled to
keep the trail the same length in wall-clock terms. It is switched off entirely
while the hero film is opaque, driven from the handoff's `onUpdate`, and on Home
that means it does no work at all until the first scroll.

**Startup.** Seeding 2,600 particles and pouring the first frames costs ~23 ms,
so the field starts in `requestIdleCallback` rather than on the critical path;
that alone removed the only long task on Work. Still pages pour 54 frames four
at a time instead of 84 twelve at a time, so no single task runs long.

**What did not work.** Moving GSAP off the critical path required hiding the hero
copy until it arrived, and an `opacity: 0` element does not count as painted —
LCP went from 1.28 s to 3.33 s. The 47 kB library stays in the head, deliberately.

## Moving between pages

Navigation used to be a hard cut: the browser tore the canvas down, the next page
built a new one from a different seed, and the background blinked. Every page is
still a real HTML file, but same-directory links are now intercepted and only
`<main>` is swapped (`js/bg.js`), so the canvas survives and the background can
carry a thought across the navigation. Anything unexpected — a modified click, a
cross-origin URL, a failed fetch — falls back to a real navigation.

`<main>` fades and lifts on the way out and back in, identically in every
direction, so the only thing being compared is what happens behind it. The
opacity lives in a class and never on the element at rest: an element at
`opacity < 1` is a stacking context, and the glass inside `<main>` can only blend
with the canvas from the root one.

**Four directions are built, plus the hard cut as a control.**

| | What it is | What it costs |
|---|---|---|
| `off` | A real browser navigation. The control. | — |
| `continuum` | One world, never reseeded. The camera travels to the next page's viewpoint over 1.35 s and the key light moves with it. The strand you were watching is still there when you arrive. | The field must run on every page, including the two that were static: ~6 ms on 30 frames a second, ~18 % of one desktop core. |
| `chapters` | A different world per page — its own `b`, density and seed — under one material and one motion law. The previous frame is frozen onto a ghost canvas and cross-dissolved over the new one across 1 s. | Only the reseed, and it happens under the ghost where nothing can see it. Still pages stay still. |
| `pour` | The frozen frame is torn off by a procedural front: a per-band noise offset sweeping left to right behind a bright chrome edge. No asset, no continuity — the transition is the material re-pouring itself. | One second of coarse `fillRect` work on the ghost, then nothing. Still pages stay still. |
| `film` | A looping video plate instead of the field, reframed per page. | Not measured on a real phone, so not a contender. See below. |

The ghost is one frozen copy of the canvas laid over it, which is what lets the
live field become the next page — reseed included — with nothing visible. The
tear needs no second buffer because the front only ever advances: the bright edge
drawn at one frame's position is erased by the next frame's cut.

**Camera and world per page.** `continuum` moves only the camera, so all four
pages are the same tangle seen from four places: Home centred and wide, Work
pushed in 1.42× and off-axis with the light swung to the left, Studio pulled back
under a 1.18 rad tilt, Contact close and low. `chapters` and `pour` change the
attractor itself — Home 0.190, Work 0.155 (large and restless), Studio 0.205
(near the edge of chaos, orderly loops), Contact 0.130 at 60 % density (wide,
slow, sparse). `b` sets size and speed as well as character, so each world
carries the extent and velocity normal measured for it; the projection divides by
extent so a looser attractor cannot outgrow the frame.

**Reduced motion overrides every direction.** No mode is allowed to wake the
field: `wake()` re-pours a still frame instead, `fieldPolicy` forces `still`, the
content fade is skipped, the camera snaps, the tear is not drawn and the film
plate does not autoplay. Verified: zero painted frames while idle and zero
ScrollTriggers, in all four directions.

**Direction D is built but not qualified.** It reuses the licensed moon loop that
is already in the repo — no video was generated for it and no credits were spent.
It is in the switcher so it can be judged by clicking, but this exact pattern was
already killed once in this project for mobile cost, and nothing here answers
that: a desktop screenshot is not a phone. It should not be treated as a
contender without a real on-device measurement.

## The temporary switcher

`js/dev-bg-switcher.js` replaces the coordinate readout in the bar with a
dropdown that swaps direction live, with no reload. It is ember rather than
chrome so it can never be mistaken for part of the design.

It is inert unless the dev flag is on: a local hostname, or `?dev=1`, which
appears in no link on the site and is remembered for that tab only. A normal
visit to the deployed site builds none of it and keeps the readout.

**To remove it:** delete `js/dev-bg-switcher.js` and the four
`<script defer src="js/dev-bg-switcher.js">` tags. Nothing else refers to it, and
the bar markup was never touched. The shipped direction is whatever `DEFAULT`
names at the top of `js/bg.js`.

## Verification

Playwright MCP against `http://localhost:8123/templates/thornbury-digital-v5/`
(1440×900, real frames while the window is visible; ~1 fps when occluded — force
ScrollTrigger animations to `progress(1)` before a capture). Checked: console
clean, 2,600 particles live on Home/Studio and 84 warm frames then static on
Work/Contact, `mix-blend-mode: overlay` + `blur(16px)` computed on every glass
layer, h1 at 138 px on 1440, zero horizontal overflow at 320 / 360 / 375 / 414 /
768 / 1024 / 1440 on all four pages, work grid two tracks, marquee half-track
covers the container.
