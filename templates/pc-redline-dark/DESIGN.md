This project inherits ../../../DESIGN-SYSTEM/DARK.md (verified: that path resolves from this folder to `C:\School\Personal\Company\DESIGN-SYSTEM\DARK.md`). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — REDLINE.

## 1. Overview & Identity

**REDLINE.** is a Singapore workstation builder (Kaki Bukit) that makes one
machine, REDLINE One, in one configuration, six a week, around an invented
flagship GPU, the **GX9900**. Four pages: the machine (`index.html`), the
card (`gx9900.html`), the cooling (`airflow.html`), the order
(`order.html`).

**The one idea:** *the machine works as hard as you make it.* The visitor's
real, measured scroll speed is the load. Scroll hard and the machine
visibly works — load and board power climb, the core heats, and once it
passes 50 °C the card's fans wake — then it idles back down the moment you
stop. Nothing is scripted to look busy.

**How it is enacted:**

1. **One model** (`js/redline-model.js`). Scroll velocity in px/s — taken
   from the real scroll position every frame in `js/telemetry.js`, not from
   a timeline — becomes demand (2.6 viewport heights a second is flat out).
   Load follows demand fast (τ 0.22 s up, 0.4 s down) so it drops the moment
   scrolling stops; board power follows load; core temperature follows
   load with real thermal lag (τ 1.1 s up, 1.6 s down); the fans follow the
   GX9900's own fan curve (stopped below 50 °C, 900 → 2,600 RPM from 50 to
   74 °C, stop again below 46 °C) with a slew limit. A 1.5 s hard burst
   wakes the fans; the machine is back to stopped fans within ~3 s of
   stopping. The same curve is drawn on `airflow.html`, with a dot that
   tracks the live state.
2. **One formatter.** Every readout on every page — the fixed readout bar,
   the stage gauge, the chart dot, and the `aria-live` burst summary — is
   painted from `REDLINE.text(REDLINE.readout(state))` /
   `REDLINE.sentence(...)`. `tools/bake.mjs` bakes the static idle and
   full-load figures (and every spec figure, and the page descriptions)
   from the same functions. There is no hand-typed copy of any readout.
3. **The stage** (`index.html`, `[data-fan]`). A real 4K clip of a case fan
   going from dead and grey to lit red and spinning (Pexels 856084), cut
   into 75 frames by `tools/media.py`. The frame shown is indexed by the
   model's fan speed: stopped = the dark frame; 0 → 900 RPM = the frames
   where the light actually comes up (found by measuring per-frame
   brightness, not guessed); above that, the lit frames cycle at a rate
   proportional to RPM. The photograph only moves when the model says the
   fans do.
4. **The heat** (`js/heat.js`). One WebGL2 fragment program over one
   full-screen triangle, composited with `mix-blend-mode: screen`: a
   turbulent heat front rising off the bottom of the screen whose height,
   speed and embers follow the model's heat value. Draws nothing at zero
   heat, sleeps, renders at 0.5× (0.35× on touch). Handles
   `webglcontextlost` **and** `webglcontextrestored` (tested: readout keeps
   running through a forced loss, glow returns on restore).
5. **The one choreographed moment.** GSAP is spent on the hero headline
   reveal (once) and the redline state flare on the readout. Nothing else
   animates on scroll. Lenis smooths wheel input and runs on GSAP's ticker.

**Why air, not a loop.** Free libraries (Pexels, Pixabay, Mixkit, Coverr)
have plenty of unbranded 4K fans, heatsinks and red-lit rigs, and almost no
water-loop photography without a maker's mark on the block, pump or
reservoir. Rather than fake a loop the pictures can't show, the cooling
story is air on purpose, and the grounded loop figure (720 ml) became the
stated counter-comparison: "we built a 720 ml loop against it; 4 °C wasn't
worth it."

## 2. Colors

| Token | Hex | Use | Contrast on ground | On the hottest glow |
|---|---|---|---|---|
| `--ground` | #09090a | page | — | lifted to rgb(78, 24, 16) max |
| `--ground-2` | #111113 | order panel | — | — |
| `--line` | #2a2a2e | rules | — | — |
| `--ink` | #edeae4 | text | 16.6:1 | 12.0:1 |
| `--ink-2` | #a8a49e | secondary text | 8.0:1 | 5.8:1 |
| `--ink-3` | #9a968f | labels only | 6.8:1 | 4.9:1 |
| `--red` | #ff3b1f | signal only: redline, focus ring, live values, the big load number | 5.6:1 | 4.0:1 (never used for small text over the glow — the stage's small "Redline" state label switches to ink + a red underline) |

The heat shader caps its glow at rgb(0.28, 0.06, 0.024) so the ratios in
the last column hold; embers are brighter but a few pixels wide and moving.
The readout bar sits above the heat layer, so its text is always on
`rgba(9,9,10,.94)`.

**Text over footage/photography:** hero text sits on a left + bottom scrim
(0.94 → 0.78 → 0.1 horizontally, 0.96 → 0 from the bottom; phones: a
bottom scrim to 0.97). Under the headline and lede the footage is held at
or below ~rgb(40, 14, 12), which keeps `--ink` above 12:1 and `--ink-2`
above 6:1.

**Colour story:** the only saturated colour on the site is the rigs' own red
light and the one signal red. The grade (`tools/media.py`) pulls blue and
cyan out of every photograph and film so the footage never argues with it;
the boot film (lit blue end to end) is taken almost to monochrome so its
red POST digits are the only colour in it.

## 3. Typography

- **Big Shoulders Display 900** — display, uppercase, 0.84–0.92 leading.
  Hero size is capped by viewport *height* as well as width
  (`min(10vw, 16svh)`) so the headline, lede and actions always clear the
  readout bar.
- **Geist 400/500/600** — body, 17 px.
- **Geist Mono 400–600** — every number, label and the readout, tabular
  figures.

All three: SIL Open Font License, served by Google Fonts. No Inter, no
centred hero.

## 4. Layout & Spacing

12-column editorial rows, media 7 / copy 4, alternating (`.row`, `.row.flip`,
`.row.wide`), max 1440, gutter `clamp(16px, 4vw, 56px)`. Rows collapse to
one column under 960 px. The stage is a 280vh section with a sticky
full-height pin, so there's real room to scroll hard while watching it.
The readout bar is 64 px (58 on phones); `body` pads for it.

## 5. Elevation & Depth

No shadows, no glass, no rounded corners. Depth comes from the footage and
the heat layer only. The only blend mode is `screen` on the heat canvas.

## 6. Components & States

- **Readout bar** (`.hud`, every page): state dot + word, four readings, a
  2 px load rail along its top edge (red past 85 % — the redline), and a
  44×44 on/off toggle (`aria-pressed`, remembered per device). Its `dl` is
  readable any time; the `aria-live="polite"` line speaks one summary per
  burst, when the machine is back at idle.
- **Stage** (`.stage`): fan canvas + gauge (the gauge is `aria-hidden` —
  it's the visual twin of the readout bar, same formatter).
- **Films** (`[data-film]`): play only while on screen; every one has a
  44×44 "Pause film" button (WCAG 2.2.2).
- **Spec table + versus bars** (`gx9900.html`): real table with `th scope`;
  the bars are the actual ratios, baked.
- **Fan curve** (`airflow.html`): baked SVG with `title`/`desc`; the live
  dot is the model state.
- **Order hold** (`order.html`): client-side only (no backend, per
  `AGENT.md`). Holds a build week on this device, gives a reference, and
  says so in plain words; focus moves to the confirmation.

Focus: 2 px `--red` outline, 3 px offset, on everything. Touch targets:
44 px minimum everywhere (nav, buttons, toggles, footer links).

## 7. Motion & reduced motion

`prefers-reduced-motion: reduce` → no readout bar, no heat canvas, no
Lenis, no hero reveal, films paused on their posters (a static hero frame),
and the stage is replaced by two still frames of the same fan — stopped,
and lit — captioned with the baked idle and full-load sentences. The copy
and photography carry the whole pitch without the mechanism.

## 8. Imagery rules

- Real, licensed only: Pexels (photos + 4K video). Masters in `tools/raw/`
  (gitignored), every derived file re-made by `python tools/media.py`.
  Nothing generated. Credits: `IMAGE-CREDITS.md`.
- **No legible third-party mark**, checked on full-resolution frames, not
  thumbnails. Rejected on that basis: every GPU shot with GEFORCE/RTX
  lettering, every pump with an NZXT or ARCTIC screen or badge, a
  Gigabyte-printed board, and an entire otherwise-excellent rig series
  (Pexels 33356254/61) carrying a "FROZN" cooler mark and a speaker logo.
  Crops that remove a mark or monitor artwork are listed per file.
- **Stated reuse.** Three films (index hero, airflow hero, order hero) are
  of the same rig — deliberately: it is the product, and it should look
  like one machine across the site. The GX9900 is always the same card
  (two photographs of it). Every other picture appears on one page only.

## 9. Do's and Don'ts

- Do derive every number from `js/redline-model.js`; run
  `node tools/bake.mjs` after touching it. Markers can't live inside
  attributes — bake the whole element (see the bars and meta tags).
- Do keep the heat cap and the contrast table in step if either changes.
- Don't add a second animated effect. The load is the one.
- Don't name a real product in copy. "Today's fastest card" is anchored by
  its numbers, not its name.
- Don't let red become decoration: it means load, focus or price.

## 10. Agent Instructions

See `CLAUDE.md` in this folder (DARK.md §8 block, verbatim with the depth
adjusted).
