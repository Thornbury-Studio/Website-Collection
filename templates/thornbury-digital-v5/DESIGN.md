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
`b = 0.19`. Euler with `dt = 0.02` in two sub-steps, 60 sim steps per second on
a fixed-rate accumulator, so speed is identical at any frame rate.

**Why it is a ribbon, not dust.**

1. *Strands.* 2,600 particles (900 on mobile) are seeded in strands of 24. A
   leader is settled onto the attractor with 400 warm steps, then each follower
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
`still` on Work and Contact: the still page pours 84 warm frames in over seven
rAFs and then never touches the canvas again (re-pours on resize). Reduced
motion forces `still` everywhere.

## Glass under the anti-stacking rule

Glass is `backdrop-filter: blur(16px)` + `mix-blend-mode: overlay`, and it is
applied in exactly three places: the bar, the one hero CTA panel, the work
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

## What is in the plates

The plates are not empty frames. The hero holds a stand-in film — dark chrome
rings turning through specular flares, Pixabay Content License, graded to sit on
the obsidian ground — under the blueprint ruling, the reticle and the corner
coordinates, labelled "Hero still — Higgsfield later". It is replaced by the
Higgsfield film when that exists; nothing else about the plate changes.

The five work plates each hold a capture of that case's own site, taken live from
this collection:

| Case | Site |
|---|---|
| Midwater | `templates/film-midwater/` |
| Kiyo 清 | `templates/japanese-restaurant/` |
| Aurel | `templates/watch-atelier/` |
| Loam | `templates/cafe-loam/` |
| Form/01 | `templates/streetwear-form01/` |

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

## Verification

Playwright MCP against `http://localhost:8123/templates/thornbury-digital-v5/`
(1440×900, real frames while the window is visible; ~1 fps when occluded — force
ScrollTrigger animations to `progress(1)` before a capture). Checked: console
clean, 2,600 particles live on Home/Studio and 84 warm frames then static on
Work/Contact, `mix-blend-mode: overlay` + `blur(16px)` computed on every glass
layer, h1 at 138 px on 1440, zero horizontal overflow at 320 / 360 / 375 / 414 /
768 / 1024 / 1440 on all four pages, work grid two tracks, marquee half-track
covers the container.
