# THORNBURY DIGITAL v6 — THE GROUND

The studio's site as ink on a slow film of sand in raking light. One hero,
one spectacle, and a quiet limewash page under it: five cases, a wall of
sixty-four live sites, the two real rates, three people, one form.

Six real pages (`index`, `work`, `collection`, `services`, `studio`,
`contact`), vanilla HTML/CSS/JS, no framework, no library, two typefaces.

## What this is, after three rounds

The first two rounds lit the page with a computed Singapore sun through a
screen of ventilation blocks — first scrubbed by the minute, then as eight
authored moments on a loop. It was an owned idea and it did not survive a
normal visitor: at dusk and at night the sheared amber slivers read as a
rendering fault, and a person who did not know the concept saw a broken site.
The boss's verdict was blunt and correct. The whole light system was removed,
not tuned.

What replaced it is the simplest thing that is unmistakably intentional: real
footage of the desert, graded into the palette the site already had —
limewash, ink, amber — with the wordmark set in ink across it. Sand, shadow
and sun is the palette in nature. The film is pinned while the page arrives
over it and then the page is quiet: a plaster surface with a grain, type,
plates and hairlines, and a feedback layer that answers the hand.

## The film

Cut the way a travel film is cut: a throw of angles and subjects, not the
same place seen closer and closer. Nine beats in 16 seconds — the ripples in
macro, dunes from straight above, a hand letting sand fall, a camel caravan
and its shadows from above, the camel's eye, a beetle digging, a lone figure
among footprint trails, the crest, and the opening beat played backward into
its own first frame so the loop never cuts. Every join is a 0.6 s crossfade.
The animals are the point of the tagline — the things you notice on the
second look — and every beat stays mid-to-light so the ink wordmark reads on
all of them.

Sharpness is enforced, not assumed: every candidate was measured (Sobel mean
on the frame it contributes) and the soft ones replaced with true 4K masters
— the round-four feedback named one soft aerial, and the meter agreed with
the eye (13 against 74 for the caravan). The whole film gets a
contrast-adaptive sharpen (`cas=0.6`) after scaling, strong enough to
resolve individual grains of sand on the beetle beat at 1:1, gentle enough
to leave no halos.

- `video/hero.mp4` — 1920×1080, 16 s, 4.5 MB; `hero-m.mp4` — a portrait cut
  with each beat re-framed around its subject, 900×1600, 2.6 MB. Sources,
  Sobel numbers, trims, grade and rejections in `IMAGE-CREDITS.md`.
- The still is the hero, the film is an upgrade to it: the `<picture>` paints
  first from the film's own first frame; `js/hero.js` attaches the sources in
  `requestIdleCallback` and crosses the film in only on the `playing` event.
  Reduced motion never fetches it.
- The type is ink on sand; a 12–16 % gradient at the head and foot of the
  frame keeps the kicker and the wordmark's baseline clean.

## The one scroll treatment

- **The pinned hero.** `.hero-stick` is 165 svh tall and the hero is sticky
  inside it. Across that range `--p` runs 0 → 1: the film scales up 6 % and
  dims to 8 %, the copy lifts and fades sooner, and the spent hero is hidden
  so it never catches a click. Without JS the hero simply scrolls away.
- **Plates drift.** Every plate image sits at scale 1.1 inside its clipped
  frame and translates ±5 % of its height as it crosses the viewport, so the
  work has depth as you pass it. One rAF handles the hero and the drift.
- **Surface.** Two SVG noise layers over the limewash: a soft plaster mottle
  at 7 % multiply under everything and a fine grain at 5.5 % over everything,
  stepped six frames a second, so the wall is a material and not a fill.
- Reduced motion keeps the still and the surface and drops the rest.

## Feedback

Everything that answers the hand, in `js/ui.js`:

- A cursor label over every plate — "Open the site" in a pill that trails the
  pointer — and a round arrow badge that rises on the plate's corner; the
  title underlines in amber and its number turns amber. Fine pointers only.
- Buttons, links and filter chips lean a few pixels toward the pointer; a
  press scales them down; a chip pulses and a toast says how many are on the
  wall.
- A 2 px amber hairline across the top of the viewport fills with scroll.
- The brief validates as you go: a field that is empty or an address that is
  not one gets an amber rule and a hint under it on blur, a tick when it is
  right, and the button reports what it is doing when the mail opens; a
  toast counts what is missing and focus goes to the first gap.
- A back-to-top control in the footer, hairline icons on the principles, the
  factors, the facts and the footer, drawn as a sprite for this site.

## Palette

| Role | Value |
|---|---|
| Wall | `#ebe7df` limewash |
| Ink | `#17150f`; text `#4f4a41`; labels ink at 70 % |
| Sun | `#f0a13d` — active nav, focus, the S$ |
| The film | sand at roughly `#c8b48c` in light, `#8a7250` in shadow |

No blue anywhere, including the footage: the dune-crest clip was rejected
because its shadow side ran blue-grey.

## Type

Two families. Big Shoulders (variable, `opsz` 10–72, `wght` 100–900) for the
wordmark, headings, labels and every numeral; Newsreader (variable, `opsz`
6–72) for text and the italic positioning line. The wordmark is fitted to
its column by measurement (`.fit` in `js/main.js`), because the display cut
renders at different widths in different engines; on a phone it breaks in two,
THORN over BURY, each line fitted.

## Composition

12 columns, gutter `clamp(20px, 3.4vw, 60px)`, one hairline language. Two
components carry every page:

- **The plate** — a captured site behind a 1 px edge, a hairline caption row
  (number, name, sector) and one line. Five hang at five heights on the home
  page; the same five are large on Work with a sticky side column of facts.
  Every plate opens the real site, which is in this collection.
- **The index** — numbered hairline rows for principles, rates and factors.

The hero is bottom-weighted: kicker top-left, the positioning line and the
wordmark across the whole column at the foot. Every inner page opens with the
same head (label, display line, side note), below the bar on every width.

## The bar

Transparent over the top of a page; once anything has scrolled under it, a
frosted strip of the wall (74 % wall colour, 14 px backdrop blur) with a
hairline, so no content ever reads through the navigation. On a phone the
two-row bar is transparent over the film at the top and opaque once scrolled.

## The collection wall

`collection.html` hangs every public site on the hub: 64 plates, four across
with every seventh at double width, one filter row by sector, every plate
opening the real site. The home page carries the first eighteen as a mosaic.
Generated from `tools/collection.json` by `tools/build-collection.mjs`, so the
wall rebuilds in one command when the hub gains a template. The nine
password-gated client previews are excluded: the wall is public, they are not.

## The rate

The two figures on Services are the studio's real published rates and only
those: S$500 promotional and S$800 fixed. Nothing else on the site states a
price.

## Mobile

Composed again, not shrunk: the portrait film, the two-line wordmark, plates
one to a row, the Work side column under its plate, terms as a ruled table,
the form full width with 16 px inputs. Verified at 320/360/375/390/414/540/
768/1024/1280/1440/1920 on all six pages: `scrollWidth − clientWidth === 0`,
66 of 66, one `h1` per page, every image alt-texted.

## Navigation

Same-directory links are intercepted and only `<main>` is swapped, with title,
description, canonical and `data-page` following; the film is re-attached and
the drift re-bound on every arrival. Modified clicks, other directories and
failed fetches fall back to a real navigation.

## Verification

Headless Chrome through a 60-line CDP harness at 1440, 1920 and 390, plus a
text-collision audit (every text-bearing element on all six pages at five
widths and five scroll stops, pairwise intersections, clipped plate images
measured by their frames) and the width sweep above. Console clean on every
page. Not verified here: an on-device phone; the 4.3 MB film and the wall's
3 MB of lazy plates are the first things a phone-performance pass should weigh.
