This project inherits ../../../DESIGN-SYSTEM/DARK.md. Below are this project's own tokens and brand-specific rules.

# DESIGN.md — BLOOM.

## 1. Overview & Identity

**BLOOM.** is a one-product coffee roaster in Brunswick, Melbourne. It
sells a single bag — 250 g of whole-bean washed Caturra from one slope in
Planadas, south Tolima — roasted every Monday and posted Tuesday. Four
pages: the bloom (`index.html`), the lot (`lot.html`), Monday
(`monday.html`) and the bag (`bag.html`).

**The one idea:** *freshness is something you watch happen, never a
sentence claiming it.* The bloom — hot water hits fresh grounds, the CO₂
they still hold forces its way out, the bed domes, foams, holds and then
gives — is the site's single authored mechanism and its only proof.

**How it is enacted:**

1. **The stage** (`[data-bloom]`, `js/bloom.js`). One real photograph of
   dry grounds in a wave dripper, seen from directly above, drawn twice
   by one WebGL2 fragment program — two doses of the same coffee, side by
   side. Scroll scrubs brew time from 0:00 to 0:50: the pour spirals out
   from the centre (freshly wet grounds are glossy for a second, so the
   spiral draws itself in light), the bed darkens, and then the two beds
   diverge. The fresh one domes toward the lens under a red-brown froth
   of packed bubbles, big see-through bubbles swell and burst, and after
   ~35 s the crust cracks as the dome gives. The old one barely moves:
   water stands on it, reflecting the room, and drains away.
2. **The numbers are the same numbers.** The program knows nothing about
   freshness. Dome height, foam, bubble activity, cumulative gas and
   standing water all arrive as uniforms from `js/bloom-model.js`,
   sampled at the current brew time for that bed's days-since-roast. The
   readouts under each bed (rise, held, CO₂ left) and the sparkline are
   printed from those same samples, and `tools/bake.mjs` bakes the same
   model's output into the static HTML for no-JS readers.
3. **Both ages are real.** The left bed is *today's* shelf bag: days since
   the most recent Monday, in Melbourne time (`BLOOM.schedule`). The
   right bed is the visitor's — a slider, or the roast date off the bag
   in their own cupboard. Beside each bed a steel rule (0–12 mm) shows
   the rise itself, with a ghost mark at the peak so far — the copy says
   the rise is "read off a steel rule", so the page shows one.
4. **The bag carries the date.** The product — one kraft pouch, printed
   with the label in `tools/label.html` — is the hero on the home page
   and the bag page, and its "Roasted on" box is stamped live, in red
   ink, by the site: this week's roast on the home page, the next roast
   on the bag page. The date on the bag and the day on the stage are the
   same number from the same calendar.

*Critique round 1 (fresh-context critic, DARK.md §6).* Largest gap: **the
bag never appeared** — the hero was a stock kettle-over-dripper shot,
"One bag." sat beside loose beans, the bag page opened on an unbranded
pouch. Fixed by the printed, relit bag (`tools/bag.py`) with the live
stamp. Also fixed in the same round: the dripper read as an eye at 0:00
(filter paper dimmed), rise was only a number (the gauge), the pour read
as a pupil (now a bright water column), inner pages repeated one
half-and-half row (a staggered pair on the lot page, a full-bleed band on
Monday), a roaster photo with a brass teapot-style arm (replaced by the
control panel), decorative section numbers (removed). Do not regress to
a kettle hero or to phase labels on the shared timeline.

**The model** (`js/bloom-model.js`): CO₂ left = exp(−(day / 28)^1.2), a
stretched exponential; peak rise = 11 mm × CO₂^0.85; the dome gives at
5 + 30·CO₂ seconds; "held" is measured as time above half the bed's own
peak. Day 2 rises 10.6 mm and holds 44 s; day 60 rises 1.2 mm and holds
10 s. The Monday page prints the curve and a table from the same
functions, so the copy cannot drift from the simulation.

**Not to be confused with** `first-crack` (a Singapore roastery with six
bags, a subscription, a roast-curve playhead and frosted-glass panels
whose tint is solved from the photograph behind them). BLOOM. has one
product, no subscription, no glass, and its mechanism is a simulation,
not a chart. Also not `perfume-tallow-dark`: both use one WebGL2 pass
over one photograph, but Tallow grades a photograph across a moving
line; BLOOM. simulates a physical process on top of one, twice, from a
model.

## 2. Colors

One accent that means something. `--stamp` is the red of a date stamp on
kraft, and it is used for **dates and day counts only** — the shelf
bag's day, the next roast, the day on each bed, and the stamp on the
bag itself (there the ink is `#D8452A` with `mix-blend-mode: multiply`,
so it darkens into the kraft the way stamp ink does). Everything else is
roasted neutrals, plus two data colours that belong to the two beds.

| Token | Hex | Role | On `--ground` | On `--raise` |
|---|---|---|---|---|
| `--ground` | `#0F0D0B` | page ground (roasted black) | — | — |
| `--raise` | `#171411` | raised band (bag band, measurement) | — | — |
| `--line` | `#2B261F` | hairlines | — | — |
| `--paper` | `#F2EBE0` | primary type | 16.4:1 | 15.5:1 |
| `--muted` | `#A89E90` | secondary type, labels | 7.4:1 | 7.0:1 |
| `--dim` | `#6F665B` | rules and ornament only — **never text** | 3.4:1 | 3.3:1 |
| `--stamp` | `#F0603F` | dates and day counts, nothing else | 6.0:1 | 5.6:1 |
| `--crema` | `#D6A571` | the fresh bed's curve; focus ring; button hover | 8.8:1 | 8.3:1 |
| `--stale` | `#8C877F` | the old bed's curve | 5.4:1 | 5.1:1 |

Buttons are `--ground` on `--paper` (16.4:1), `--crema` on hover (8.8:1).

## 3. Typography

Two families; the contrast between them is voice versus measurement.

- **Bricolage Grotesque** (OFL, Google Fonts; `opsz`, `wdth`, `wght`) —
  the voice. Display at `font-stretch: 75%`, weight 800, for the
  wordmark, the giant hero word and page titles; the optical-size axis
  opens its ink traps at display sizes and closes them in running text,
  which is set in the same family at 400–600.
- **IBM Plex Mono** (OFL) — the instrument. Every number that is a
  measurement, every label, the stamp, the clock, the ledger values.

Not Inter, not Roboto, not Space Grotesk. No centred hero: the hero word
sits flush left at the foot of the viewport, and the lede sits above it
on the left, beside the bag.

Scale: `--step--1` … `--step-5`, fluid `clamp()` from 360 px to 1600 px.
The hero word is `clamp(96px, 17.5vw, 330px)` — sized to end before the
bag starts on desktop.

## 4. Layout & Spacing

12-column grid, 24 px column gap, `--gutter: clamp(16px, 4vw, 64px)`,
1680 px max. Long prose capped at ~52ch.

Sections alternate between **photograph-led bands** (full-bleed or
7-column photographs with type beside or over a scrim) and **ruled
typography** (ledgers, spec lists, the readings table — hairlines at
`--line`). No card grid anywhere; story rows alternate sides.

The stage is the one pinned element on the site: a 380vh section (320vh
on phones) with a sticky 100svh stage. Desktop: two beds side by side,
data under each. Phones: the beds stack as rows, bed on the left and
readouts stacked on the right; the age control drops under the second
bed at full width.

## 5. Elevation & Depth

No elevation system: no shadows, no glass, no blur panels, no pills.
Depth comes from photography and from the one computed surface — the
bloom, whose dome is lit by a single raking light from the top left and
which comes toward the lens (a parallax magnification) as it rises.
`--raise` is the only raised surface, used for two bands and the order
panel.

## 6. Components & States

- **Stamp** — mono caps in `--stamp`, 1.5 px border, 2 px radius,
  rotated −2° when standalone (inline stamps sit square). Only ever a
  date or a day.
- **Bed** — the WebGL view (square, vignetted into the ground), then
  name + day stamp, a one-line note ("Roasted Saturday 25 July — the
  back of the cupboard."), three readouts (rise, held, CO₂ left), and a
  sparkline of the bed's whole rise curve on the shared 0–11 mm scale,
  dashed ahead of the playhead and solid behind it.
- **Bagshot** (`.bagshot`) — the bag image with two absolutely placed
  stamps (`.bag-stamp--date`, `.bag-stamp--batch`). Their boxes are
  percentages written by `tools/bag.py` into `tools/raw/bagmap.json`;
  the stamp type is sized in container-query units so it scales with the
  image; an inline SVG filter (`#ink`) roughens and pits the stamp.
  Re-run `node tools/label.mjs && python tools/bag.py` after touching the
  label, and copy any changed percentages into `css/style.css`.
- **Gauge** — a 0–12 mm rule at the right edge of each bed view, a
  bed-coloured mark at the current rise and a faint one at the peak.
- **Timeline** — an `input[type=range]` over 0–50 s with the pour window
  (2–7 s, identical for both beds) marked. Dragging it scrolls the page
  to the matching position; under reduced motion it sets the time
  directly. There are deliberately no "rise / hold / give" phase labels:
  the two beds reach those phases at different times, so shared labels
  would be false for one of them.
- **Age control** — range 0–120 days plus a native date input ("the roast
  date on it"), kept in sync, `max` = today.
- **Order panel** (`bag.html`) — quantity stepper (1–6), post/collect
  radios, a tally computed by `BLOOM.orderTotal`, the posting window
  computed from the calendar. "Hold my bag" stores the hold on this
  device only and confirms it; there is no payment and no personal data
  collected (no backend, per AGENT.md).
- **Focus** — `outline: 2px solid var(--crema); outline-offset: 3px`,
  never removed.

## 7. Do's and Don'ts

**Do**
- Keep the stage the only scroll-pinned, only animated-in-place element.
- Compute every number. Freshness figures, lot arithmetic, prices, cups
  per bag and every date come from `js/bloom-model.js` — at runtime, or
  baked by `node tools/bake.mjs`. Re-bake after changing the model.
- Keep red for dates.
- Photograph honestly for the story: light-roast beans (matte, brown),
  fully red cherries on the picking frames.

**Don't**
- Add a second WebGL surface or a second "effect". One is the idea.
- Put phase labels on the shared timeline (see §6).
- Use `--dim` for text, or `--stamp` for anything that is not a date.
- Write "elevate", "unlock", "transform", "empower", "crafted",
  "artisanal".
- Reuse a photograph on a second page. Two stated exceptions: the bed
  plate (drawn twice on one stage because both doses must be the same
  grounds) and the bag (the only product, on the home and bag pages,
  each time with a different live date).

## 8. Stack — what was taken and why

Per DARK.md §5, chosen against the concept rather than taken wholesale.

| Library | License | Doing what |
|---|---|---|
| **Lenis** 1.1.20 | MIT | Smooth scroll, on GSAP's ticker so the scrub and the scroll share one clock. The scrub reads brew time off scroll position, so wheel-step jitter would show as the bed twitching. Not constructed under reduced motion. |
| **GSAP** 3.12.5 + **ScrollTrigger** | GSAP Standard "No Charge" | The scrub (a tween of brew time, `scrub: 0.5`) and the reveals. |
| **SplitType** 0.3.4 | MIT | The hero word rises character by character, centre first, the way a bed domes; line reveals on display headings. Not on body copy. |

**Deliberately not taken:** three.js — the stage is two viewports of one
full-screen triangle; a scene graph would be a coat of paint. Barba/Swup
— a page transition would be a second effect. No react-three-fiber or
magicui (bundler-only; this catalog has none).

There is no hand-authored geometry: the dripper, filter and grounds are
a licensed photograph; the program only computes light, wetness, foam
and bubbles over it from the model. The bag is likewise a licensed
photograph of a real blank pouch with a label printed into it — a
printer's mock-up, not a drawn or generated object.

Notices: `LICENSES.md`. Photography: `IMAGE-CREDITS.md`.

## 9. Performance & motion floor

- Canvas DPR capped at **1.5**; one WebGL2 context for both beds.
- The loop runs only while the stage intersects the viewport **and**
  bubbles are active; otherwise it draws once per change and stops.
- The bed plate loads off the critical path (1024 px on small screens,
  2048 px only when the device can show it).
- `prefers-reduced-motion: reduce` — no Lenis, no pin, no scrub, no
  idle shimmer, no reveals; the stage renders a still frame at 0:14 with
  both beds visible and their readouts printed, and the timeline slider
  steps the brew by hand.
- No WebGL2: the plate photograph stays in each bed and every number is
  still printed. No JS: the static page carries the baked numbers.
- Images: webp, two widths each, `srcset`/`sizes`, explicit dimensions,
  lazy below the fold.

## 10. Agent Instructions

See `CLAUDE.md` in this folder (DARK.md §8 block, depth adjusted to
three levels).
