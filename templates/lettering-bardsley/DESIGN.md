# NELL BARDSLEY — design notes

The collection's second personal creative portfolio. `animator-fenn` already
holds stop-motion, so this one takes a discipline that does not collide with
it: a lettering artist and type designer — signwritten fascias, gilded glass,
and four retail families.

The fictional subject works from a first-floor room in Leith. Leith rather
than London because Scottish shopfront signwriting is a real and continuous
trade, which grounds an invented practice in a true place without borrowing
anybody's biography.

## Reference

DNA taken from the awwwards entry for **michaelgatt.com** — principles only,
and nothing of the real person's name, work or life.

| From the reference | What it became here |
|---|---|
| Two-tone, high-contrast, no accent hue | Same discipline, **inverted polarity**: `#E6E3DC` paper, `#131211` ink, 15:1. No accent colour in `style.css`, no pure white and no pure black. |
| Single-page scroll narrative | One document, five numbered movements, no sub-pages. |
| Personality from a few hand-placed graphic objects | Three line-drawn tools a letterer owns — a nib, a mahlstick with the gilder's knife and tip, a worn quill. One each in hero, signwriting, About. Nowhere else. |
| Motion spent on a loader plus one signature interaction | A loader that writes the wordmark with a nib you can turn, and an instrument where scroll is the pen. |

**The polarity is the one deliberate departure.** The obvious reading of
"restrained two-tone" is a near-black page, and this collection already has
one — reading the reference that way a second time would have produced
FENN's page with different words in it. The DNA is *two values at maximum
contrast with no third colour*, not *dark*. This trade's ground is paper, so
the values are inverted and the same restraint applies from the other side.

## The one rule

**Ink is laid, never faded.** Every reveal on this page is a `clip-path` wipe
travelling in the direction the thing was written — left to right for a line
of text, top to bottom for anything that reads as a stem. Nothing here
animates from `opacity: 0`, because a letter arriving at 40% opacity is not a
letter being written, it is a letter being printed badly.

The deliberate exception is anything the pointer drives. Hover and focus
change colour and position, never coverage: a link that re-writes itself
under the cursor reads as a repaint bug rather than as craft. That contrast
is the only reason the wipes elsewhere are legible as a decision.

## The nib

`js/nib.js` is the whole argument of the site in about 300 lines. Nothing in
it stores an outline. Every glyph is a **skeleton** — the path the pen
travelled — and the shape is computed by sweeping a straight edge along it at
a fixed angle. Turn the angle and the same skeleton yields a different
letter, because the thicks and thins move. That is not a stylisation of
calligraphy; it is what calligraphy is.

One engine, three uses, which is why it is worth having at all:

- the loader writes the wordmark with it, and the pointer turns the nib while
  it does;
- the instrument in THE HAND writes whatever you type;
- each of the four release cards renders its diagnostic letter through it at
  that family's tool setting. The section claims four families came out of
  one hand at four settings, and setting the specimens in a finished font
  would have made that claim unverifiable on its own page.

Three things that had to be right:

- **Centripetal Catmull-Rom, not uniform.** The control points in a
  hand-authored skeleton are wildly unevenly spaced — 40 units apart at the
  turn of a bowl, 200 down the side of a stem — and uniform Catmull-Rom
  cusps and self-intersects exactly there. Centripetal (α = 0.5) is the
  variant with a proof that it cannot, which is worth the extra arithmetic.
- **One `Path2D` per stroke, not one `fill()` per quad.** A twelve-letter
  word is ~30 strokes and ~5,000 swept quads. Thirty fills a frame is
  nothing; five thousand is a stall.
- **Winding normalisation.** `nonzero` unions shapes wound the same way and
  *subtracts* ones wound the other way, and the winding of a swept quad flips
  every time the stroke direction crosses the nib direction — which happens
  inside almost every curve. Every quad is checked by signed area before it
  is added. Without that, letters develop holes precisely where the pen turns.

The readouts are arithmetic, not adjectives. A nib of width W at angle t
sweeps a ribbon of perpendicular width `W·|sin(t − travel)|`, so a vertical
stem comes out `W·|cos t|` and a horizontal bar `W·|sin t|`; the panel
reports the ratio between them, and at 0° or 90° reports the hairline as a
hairline rather than as a large number.

`hamburgevons` is the default word because it is the control string every
type designer actually uses — it carries the shapes that decide a lowercase.

## Two clocks

Scroll drives the **pen**; the pointer drives the **tool**. They are
different in kind on purpose: writing has a beginning and an end and belongs
on the axis the reader is already travelling, while angle and width are
settings that should apply instantly wherever the pen has got to. Typing your
own word hands authorship over — scroll stops scrubbing, because it would
erase what you just asked for — and that mode change is one flag.

## Things that were wrong first, and why

- **The canvas and its own container chased each other.** A canvas sized
  `height: 100%` inside an auto-height grid track is a feedback loop: its
  intrinsic size comes from its `width`/`height` attributes, the script sets
  those from the box it ended up in, and the sheet grew half again as tall as
  the panel beside it. It is now absolutely positioned against the sheet, so
  it only ever reads the box and never contributes to it.
- **The write had no floor under it.** `requestAnimationFrame` is not
  guaranteed to run — measured at literally zero frames per second in one
  embedded browser here, which is also what `animator-fenn` recorded. The
  write ran its first frame at progress zero and stopped, and an empty sheet
  is not a missing animation, it is missing content. Both the redraw queue
  and the write now carry a `setTimeout` alongside the rAF: the frame loop
  decides how it looks, a timer guarantees it finishes.
- **A specimen letter was being fitted to the full ascender-to-descender
  band**, so a lone `a` rendered at a fifth of the size its card could hold.
  The layout now carries ink bounds as well as metric bounds and the caller
  picks: tight for a specimen, metric for the instrument, where the baseline
  must not jump every time the word loses a descender.
- **The hero claimed too much.** It said every letter on the page was swept
  by a nib. The headline is set in a typeface; only the instrument is swept.
  On a site whose entire argument is honesty about tools, that sentence had
  to be exact.

## Mobile is a different composition

- The nav keeps **one** link. Five anchors on a single scrolling page do not
  justify a drawer, but burying the only commercial action at the foot of a
  long document is worse. Wordmark and Commissions.
- The instrument **stops being scrubbed** and becomes a self-contained card:
  it writes itself once when it comes into view, and a button replays it.
  Scroll-as-pen needs a pinned pane the reader travels past, and a phone
  cannot give one without eating the whole screen.
- The role line in the hero reflows from a stacked block to a single
  baseline, and the nib moves under the lede rather than sitting beside it.
- The six-column job table stops being a table and becomes stacked records
  with the year set against the name.
- A viewport too short to hold the instrument at all — a phone in landscape —
  **never pins it**. Losing an enhancement beats cropping content.

## Failure directions

Everything that starts hidden is gated behind a `.js` class set in `boot.js`
before first paint. With script off or broken, nothing is clipped: no loader
covers the page, no wipe holds content at zero width, and the document is a
plain scrolling page. The sheet is inert, which is the correct thing for an
enhancement to be. Anything still un-wiped after three seconds is shown
regardless, because between IntersectionObserver, the scroll sweep and a deep
link like `/#faces` there are more ways to miss a trigger than are worth
enumerating.

## Type

`Fraunces` for display and body — one family across every size, which is the
argument a lettering site should be making, and its `WONK` axis gives the
headline a hand that a neutral serif would not. `JetBrains Mono` for every
technical readout: angles, nib widths, contrast ratios, the job table's
years. Two families, no third.
