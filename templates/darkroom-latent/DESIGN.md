This project inherits C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md (absolute on purpose: this template sits at `Company/Websites/Website-Collection/templates/darkroom-latent/`, four levels below company root, and the repo moves independently of where it sits on disk — verified to resolve 2026-09-25). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — LATENT.

## 1. Overview & Identity

**LATENT.** is a community black-and-white darkroom on the second floor of
a Jalan Besar shophouse: six enlarger bays by the hour, film developed by
Friday, and small Saturday printing classes. One page, `index.html`.

**The one idea:** *a print exists before you can see it.* The home page's
hero is not a picture of a darkroom — it is bay 3. The visitor composes
through the red filter, sets an f-stop timer and a Multigrade grade,
exposes (holding light back or letting it through with their hand), and
the sheet still looks blank. Only the developer brings it up, shadows
first. Turning the white light on before the sheet is fixed fogs it, and
the page says so plainly.

**How it is enacted:**

1. **One model** (`js/paper.js`). Each grade is a logistic characteristic
   curve spanning its modelled ISO range R (00 = 1.70 log units down to
   5 = 0.55), all pivoting about one log exposure because grades 00–3
   print at the same time; 4 and 5 carry a ×2 filter factor. Development
   has a 7-second induction, is complete at 60 s, and fogs past it. The
   three negatives are defined *inversely*: each is the negative that,
   printed at the house printer's settings (frame 14: grade 3, 11.3 s),
   gives back the photographer's own print. So the house settings are
   honest by construction, and every other choice is a real departure
   from them.
2. **One shader** (`js/bench.js`). A float map of lamp-seconds (250×200,
   one cell per millimetre of a 10×8 in sheet) is written on the CPU as
   the lamp burns — the hand's shadow, the burning card's hole, the test
   strip's card and the lamp's corner fall-off all subtract from it —
   and uploaded as R16F. One WebGL2 fragment program turns it into
   density on the sheet's grade, scaled by development, lit by whatever
   light is in the room (amber safelight, the filtered lamp, the red
   swing filter, or white). The easel blades hold a 9×6 in image on the
   10×8 sheet, so every print has real white borders.
3. **The same numbers everywhere.** The characteristic-curve chart
   (`js/curve.js`) draws all seven curves from the model and marks where
   the negative in the carrier lands at the time on the clock; the live
   sentence beside it prints those densities. `tools/bake.mjs` bakes the
   opening state's numbers — including the screen-reader mirror of the
   timer — into the static HTML (`--check` fails if they drift).
4. **Every photograph on the page develops in** as it scrolls into view
   (`js/main.js`): flat and pale first, contrast last — the bench's own
   curve, applied to the rest of the site.

**Time compression is stated, not hidden:** the lamp runs 2× and the
trays 6× real time; the readouts show true darkroom seconds and the
console says so in one line.

## 2. Real references (the bar, not a template)

| Reference | What was taken | What was not |
|---|---|---|
| **RH Designs StopClock** f-stop darkroom timer | The red seven-segment LED window with unlit segments ghosted behind the digits; stepping in thirds of a stop rather than seconds; the readout switching between exposure and process clocks | Its casing, key layout, logo or any product styling |
| **Ilford Multigrade paper datasheets** | The grade table as a typographic object (grade · range · filter factor), characteristic curves plotted as density against log exposure, the ×2 factor for grades 4–5, the yellow→magenta filter colours | Ilford's branding, their exact published ISO R values (ours are modelled and labelled as such) |
| ***Magnum Contact Sheets*** (Kristen Lubben, Thames & Hudson, 2011) | Red china-marker loops that overshoot and don't close, scribbled decisions in the margin, the contact sheet as the place a print is chosen | Any Magnum photograph, mark or layout |

Technique from each is fair game (DARK.md §2); no asset, mark or code
was lifted from any of them.

## 3. Colors

All ratios are WCAG contrast against the surface they sit on.

| Token | Hex | Use | Ratio |
|---|---|---|---|
| `--ground` | `#0e0b09` | Page | — |
| bench ground | `#120d0a` | The bench section (turns `#d9d3c9` with the lights on) | — |
| `--paper` | `#efe6da` | Body text | 15.88 on ground |
| `--muted` | `#b3a494` | Secondary text | 8.08 on ground, 7.57 on console |
| `--amber` | `#ff9a47` | Safelight: kickers, the next action, focus rings | 9.31 on ground; ink on amber 8.82 |
| `--red` | `#ff5233` | Rules, the door rule, "full" | 6.08 on ground |
| `--led` | `#ff3a1a` | Timer digits | 5.74 on the LED window `#070303` |
| LED unit | `#e0502f` | "sec / lamp / dev" | 5.24 on the LED window |
| china marker | `#c02a14` | Contact-sheet notes | 4.72 on the sheet `#ece6dc` |
| strip label | `#b3261a` | Test-strip times on the print | 5.67 on paper white |
| lit text / muted | `#17120e` / `#4e433a` | Bench with the lights on | 12.5 / 6.45 |
| lit kicker | `#8a3d10` | Bench kicker with the lights on | 5.12 |

No purple, no gradients-as-decoration: the only gradient is the soft
amber pool behind the easel, which is the safelight.

## 4. Typography

- **Archivo** (variable, wdth 62–125) — everything. Headlines at
  wdth ~68–72 and weight ~720–760, sentence case, tight leading, like the
  condensed bold on a paper datasheet; the second hero line in light
  italic. Kickers and legends at wdth 112, tracked uppercase.
- **DSEG7 Classic Bold** — the timer only. `!` is a blank digit and `.`
  takes no width, so the ghost `88.8` lines up behind any reading.
- **Permanent Marker** — only the china-marker notes on the contact sheet
  and the test-strip times pencilled on the print.

## 5. Layout & Spacing

- Gutter `clamp(16px, 4vw, 56px)`, max width 1440.
- **Desktop (≥1100):** the bench is a two-column instrument — copy and
  console on the left (300–390 px), the carrier and easel on the right,
  sized so the easel never exceeds the viewport height.
- **Tablet (720–1099):** easel full width; the console splits into two
  columns (timer and grades | hand and actions).
- **Phone (<720), composed on its own:** the easel, status line, a mini
  LED and the single next action live in a **sticky deck** pinned under
  the header, so the visitor can hold a finger on the easel to dodge and
  still reach Stop lamp; the full console scrolls underneath it,
  full-bleed so all seven grade keys clear 44 px. The carrier moves below
  the deck.
- Any grid that places one child places all of them (PATTERNS.md, grid rule); the phone bench switches to a flex column instead.

## 6. Elevation & Depth

Depth comes from light, not shadows: the lamp, the safelight, the
room. The easel has one deep drop shadow; in the tray its frame thickens
and darkens. The contact sheet is the only object that tilts (−0.6°,
desktop only).

## 7. Components & States

- **Bench phases:** blank → exposing → exposed (latent) → developing →
  fixing → fixed; the white light can be switched at any point and fogs
  anything unfixed. Grade and negative lock once light has touched the
  sheet (New sheet unlocks). Exposing again after the lamp stops burns
  in.
- **The next action** (Expose → Develop → Stop + fix → Lights on → Hang
  it up) is the only amber button; everything else stays quiet.
  Disabled buttons drop to an outline.
- **Hand:** out of the light / dodge (a soft disc) / burn (a card with a
  hole — with the pointer off the easel, the card covers everything).
  Pointer, touch (touch-action is released only while the hand is live)
  and arrow keys on the focused easel all drive it.
- **Test strip:** five bands, −1 to +1 stop in halves, by moving card.
  After developing, the pencilled times on the print set the timer.
- **Tonight's line:** hung prints, newest first, max six, with their
  settings.
- **Contact sheet:** the three ringed frames load that negative into the
  carrier and scroll back to the bench.
- **No WebGL2:** the house print shows as a still, and the exposure
  controls say why.

## 8. Do's and Don'ts

- **Do** keep every number the page prints coming from `js/paper.js`,
  and re-run `node tools/bake.mjs` after touching the model.
- **Do** keep the negatives defined by the house print — if a negative
  changes, its house grade and time are the only things that set it.
- **Don't** add a hero photograph of a darkroom above the bench. The
  bench *is* the hero.
- **Don't** reuse section photographs: each of the eight is used once, and
  the three street frames are the only images that repeat, because they
  are the negatives (carrier, easel, contact sheet — one roll).
- **Don't** clamp the bench clock to a small `dt`: the lamp and trays
  are timers, and a throttled tab must not stretch a 12-second exposure
  (PATTERNS.md, clock traps).

## 9. Agent Instructions

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
2. Read this repo's own DESIGN.md AND
   C:\Users\sengc\OneDrive\Desktop\Company\DESIGN-SYSTEM\DARK.md (the
   company-wide dark taste system — absolute path because this project
   is nested inside a shared catalog repo). Treat both as hard
   constraints.
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
