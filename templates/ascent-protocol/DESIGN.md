# ASCENT — design notes

Elite performance coaching for people under real pressure: founders,
operators, competitive athletes. The product is a twelve-week discipline
protocol in four fixed phases, Focus, Discipline, Consistency, Repetition,
sold as structure rather than motivation. Three pages: the brand
(`index.html`), the twelve weeks (`protocol.html`) and the application
(`apply.html`).

## The reference, and what was taken from it

The brief's reference was a moody mountain wallpaper with a thin vertical
hairline, tracked serif capitals stacked on it, and a frosted glass card:
the genre that is already everywhere. The grammar was kept and the surface
was not. Three things were taken and systemised:

- **The hairline became the spine.** One vertical rule runs the length of
  every page and is the column gutter for every layout: sections hang off
  it, the pillar slabs overlap it, glass panels sit across it and blur it.
  It carries a dot for every section, a travelling marker fixed at the
  middle of the viewport that reads which section the visitor has reached,
  and on the protocol page a dot for every week. The structure encodes the
  one true thing about the product: it is a sequence.
- **The tracked capitals became a type system with three roles.** Bodoni
  Moda for the words that matter, in two registers: tracked capitals for
  the pillar words (tighter as they get larger, `.34em` at 13px, `.22em` at
  44px) and tight, large, roman or italic for the sentences. Hanken Grotesk
  talks. Geist Mono measures: every date, day count, label, readout and
  schedule is set in it, so the page reads as an instrument rather than a
  poster.
- **The glass card became a family.** Eight distinct treatments, each a
  different answer to what the frost is for, listed below.

## The signature: one day, day one

The two phrases are the same two words. The interaction is a rail with a
puck; dragging it reorders the words. As the puck moves, *one day* (italic,
lower case, fog-coloured) crosses over into *DAY ONE* (roman, capitals,
chalk and ember), the two words passing each other on a small arc with a
z-swap at the midpoint. The glass panel's `backdrop-filter` blur is driven
from 26px to 0 by the same number, and the fog video layered over the sharp
mountain plate fades out with it, so the fog literally clears. On release
the puck snaps to whichever side it is nearer.

Committing is real: the date on the right becomes today's date, day 01 of
84 lights in the grid, the button becomes *Start on 16 Sep* and links to
the application with that date in the query string, where the form
preselects one-to-one and fills the start. The choice is stored, so a
returning visitor sees *Day 07 of 84* with six cells filled. *Undo* clears
it. The rail is a `role="slider"` with arrow, Home, End, Enter and Space
handling, and reads *One day. A dream* or *Day one. A decision* as its
value text.

## Glass

| Version | Where | What is different |
|---|---|---|
| Bar | Header, once scrolled | 14px blur, saturate, hairline bottom |
| Pill | Hero readouts | 10px blur, gradient hairline border, live text (days until the cohort opens) |
| Decide | The decision, apply form | Blur is a CSS variable the mechanic drives, 26px to 0 |
| Slab | The four pillars | Clear centre, frosted 26px rim through a masked pseudo-element; the rim narrows to 8px on hover and the plate sharpens |
| Obsidian | Under pressure | Barely frosted, heavily tinted, square corners, a lit top edge |
| Paper | Field notes | Heavy frost, warm-grey tint, ruled every 32px |
| Field | Form inputs | Inset: inner shadow, cut into the sheet rather than sitting on it |
| Drawer | Mobile menu | Full-screen, 24px blur |

Every version has a `@supports not (backdrop-filter)` fallback with an
opaque tint.

## Colour

Near-black ground (`#0A0C0F`), graphite panels, a cool fog for secondary
text and a warm chalk (`#E8E4DC`) for primary. One warm accent, ember
(`#D8B78E`), for the plumb dots, the committed state, the current day and
the first pillar. The photographs are graded to the same temperature:
saturation at half to two thirds, cool shadows, a touch of warmth in the
highlights, blacks left deep so plates sit in the ground.

## Motion

| Effect | About | Where |
|---|---|---|
| The line draws | Arrival: the hero line draws down, the four words arrive along it, then the line continues | Home hero |
| The marker | Position: a dot fixed mid-viewport rides the spine, dots light as they pass it | Every page |
| Lag | Weight: band plates translate at 8% of scroll | Bands |
| Reveal | Arrival: 16px rise and fade, staggered | Everywhere |
| The decision | See above | Home |
| Slab sharpen | Attention: plate scales 3.5% and unfilters, rim narrows | Pillars |
| Phase map | Proportion: bars draw to 2/12, 4/12, 4/12, 2/12 | Home, protocol, apply |

Under `prefers-reduced-motion` no footage loads (posters stand), the hero
line is drawn, reveals are instant, the marker still reports position, and
the rail snaps without a tween.

## Footage

Four clips, each made to loop without a cut: the last 1.5 s of the segment
is cross-faded into its first 1.5 s and the file begins 1.5 s in, so the
wrap lands on the frame the fade arrived at (`tools/encode.mjs`). Source is
chosen by viewport (a 960px version under 760px wide), loaded only near the
viewport and paused out of it. The whole set is under 12 MB.

## Verification

Headless Chrome over CDP. All three pages swept at 320 / 375 / 414 / 768 /
1024 / 1440 / 1920 for horizontal overflow and console errors. The rail was
driven with real pointer events and with the keyboard; the stored state was
checked across a reload; the form's mailto was captured through the
`ascent:apply` event it dispatches before navigating, so no mail client
opened. The reduced-motion path was rendered with the media feature
emulated.
