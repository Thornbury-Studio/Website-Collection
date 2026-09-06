# THORNBURY DIGITAL v6 — DAYLIGHT

The studio's site as one room in Singapore, lit through a screen of
ventilation blocks by the actual sun at the actual minute. Every page is a
wall of that room. The visitor can drag the sun.

Five real pages (`index`, `work`, `services`, `studio`, `contact`), vanilla
HTML/CSS/JS, no framework, no library, two WebGL canvases, two typefaces.

## Why this, after v4 and v5

v4 (47/100) and v5 (38/100) were scored on the studio's own bar and both died
on execution: inner pages that did not match the home, a three-plan row and
price pills on Work, a carousel that ate the click, a type pairing the
reviewer could name from a hundred other sites, and — on both — a full-bleed
stock film as the first thing on screen. The concepts were real; the details
were generic.

So v6 is built the other way round. Nothing on the first screen is sourced:
the light is computed from the studio's real coordinates, the wordmark is
fitted to the column by measurement, and the only photograph on the site is
of the thing the light comes through. Every page hangs its content on the
same two components, a plate and a hairline index, so Work and Studio are the
home page's logic continued rather than a brochure attached to it. There is
one authored motion system, the light, and nothing competes with it.

## The room

The page is the floor. Above it hangs a screen of vent blocks, the
tropical-modernist answer to sun and rain, and the sun comes through it.

**The day is eight authored moments, not a clock.** The first build computed
the sun for every minute and let a rail scrub it continuously; that produced
in-between arrangements nobody had looked at, and almost nobody found the
rail. So `js/light.js` now holds eight fixed parameter sets — dawn, morning,
late morning, noon, afternoon, golden hour, dusk, night — each rendered,
screenshotted and kept (`?state=<key>` opens any of them). The room walks
through them on an ambient loop: 14 s held, 2.6 s crossfade, the finished
picture of one moment dissolving into the finished picture of the next (the
shader evaluates both and mixes the pixels; it never invents a new layout).
The loop starts at the moment nearest the real Singapore time, so the first
frame is roughly the light outside, and the rail is still there for anyone
who wants to hold a moment.

- `js/sun.js` — NOAA solar position for 01°17′N 103°51′E, now used only to
  read the real clock and pick the starting moment. Verified against the
  almanac for 6 Sep 2026: sunrise 06:59, solar noon 13:03, sunset 19:07 SGT.
- `js/light.js` — one fragment shader on two fixed canvases. `#wall` (z 0)
  paints the lit wall under the page; `#shade` (z 5, `mix-blend-mode:
  multiply`, pointer-events none) paints only the illumination factor over
  everything, so the type, the plates and the bar are shaded by the same
  screen as the wall behind them. Neither darkens twice: the wall carries
  the *colour* of the light, the shade carries the *darkness* of the screen.
- Dawn and dusk are dark-wall moments with the block depth thinned to 0.05
  cells so a 5–7° sun still gets through as amber slivers, and the lamp
  already up; without that a low sun through a real block gives nothing.
- The screen mixes three block types per cell from a hash, the way a real
  vent wall does: a circle in a square with quarter-circle corners, the petal
  block (a square void with four corner discs of material), and a plain
  square. Cells are `clamp(150px, vw / 4.2, 380px)`.
- Where the light lands is the sun's horizontal direction times the
  cotangent of its altitude times the screen height (5.2 cells). The block's
  own depth (0.30 cells) cuts the beam at low sun, so evening light arrives
  as slivers and a 3° sun gives almost nothing. Patches stretch along the
  sun direction by `1 + .45·cot`, capped, and the penumbra widens with it.
- The screen stands on the sun's side of the room: intensity falls to half
  and the penumbra doubles across the floor away from it. At solar noon the
  direction is nearly vertical, so the fall-off vanishes and the room is
  even — and calmer: an overhead sun is drawn 30 % dimmer and a little
  softer, because the low light of the morning and the late afternoon is
  where the drama should be.
- Colour: the light warms from white (`1.0, .965, .90`) toward amber
  (`1.0, .62, .30`) as `sin(alt)` drops below .55. The ambient shade rises
  from .79 to .90 with the sun, because a high sun fills the shade from the
  sky. There is no blue anywhere in the shader or the stylesheet.
- After sunset the wall crosses to warm charcoal (`#272320`) and a street
  lamp takes over through the same screen from a fixed low bearing (31°,
  244°), sodium-coloured, with a soft radial fall-off from the left. The
  lamp fades in while the sun is still a few degrees high so dusk never goes
  flat; the wall itself crosses hard in the middle of that fade, in step
  with the CSS token flip on `html[data-light]`, so text is never light on a
  light wall or dark on a dark one.
- It renders only when something changed — time (once every 30 s), scroll,
  pointer, size, the rail — never on a free-running loop. At rest it costs
  nothing. Reduced motion drops the entrance and the parallax and keeps the
  light.
- The entrance: on load the sun arrives from three hours earlier and settles
  on now over about half a second, so the first thing a visitor sees move is
  the concept.
- `?at=HH:MM` or `?state=golden` opens the room at that moment and holds it,
  so a link can say "see it at six". `TBLight.go(i)` does the same from the
  console; `TBLight.resume()` restarts the loop.

## The rail

An optional layer, not the way most people meet the light: a native `<input
type="range">` with eight stops, the daylight run drawn in ink, the sun as the
thumb. Dragging it holds a moment and pauses the loop; "Back to the loop"
resumes from the moment nearest now. Keyboard and screen-reader users get the
same control with an `aria-valuetext` naming the moment. It sits in the hero,
on the studio page and on the contact page.

## The collection wall

`collection.html` hangs every public site in the collection on one wall: 64
plates, four across with every seventh at double width so the wall has a
rhythm, one filter row by sector, every plate opening the real site. The home
page carries the first eighteen as a six-across mosaic. The plates are fresh
1200×750 captures, lazy-loaded, generated from `tools/collection.json` by
`tools/build-collection.mjs`, so the wall is rebuilt in one command when the
hub gains a template. The nine password-gated client previews on the hub are
excluded: the wall is public, they are not.

## The bar

Transparent over the top of a page; once anything has scrolled under it, a
frosted strip of the wall (74 % wall colour, 14 px backdrop blur) with a
hairline, so no content ever reads through the navigation. The shade canvas
still multiplies over it, so the strip stays in the room. Every inner page
opens at `bar height + 84 px`, on every width, and the phone bar's real
two-row height is what `--bar-h` says it is. The two big words that used to
sit over photographs ("The room", "The screen") are heads above the pictures
now; a word laid over a picture read as a collision, so it is not one.

## Palette

| Role | Day | Night |
|---|---|---|
| Wall | `#ebe7df` limewash | `#272320` warm charcoal |
| Ink | `#17150f` | `#f1ebe0` |
| Ink 2 (text) | `#4f4a41` | `#bcb4a7` |
| Ink 3 (labels) | ink at 70 % | ink at 70 % |
| Sun | `#f0a13d` (rail thumb, active nav, focus, the S$) | `#ffa64f` |

Contrast was computed analytically under the deepest shade the multiply
layer can produce (×.79 by day, ×.80 by night): ink 9.1:1, text 5.4:1,
labels 4.8:1 by day; 9.2, 5.5 and 5.2 at night. The light only ever raises
those numbers.

## Type

Two families. Big Shoulders (variable, `opsz` 10–72, `wght` 100–900) for the
wordmark, headings, labels and every numeral; Newsreader (variable, `opsz`
6–72) for text and the italic positioning line. The wordmark is not sized by
CSS alone: the display cut of Big Shoulders renders at different widths in
different engines, so `js/main.js` measures each `.fit` heading after the
fonts arrive and sets its size to fill the column exactly (with a 36 svh cap
on the desktop so a short laptop viewport keeps it above the fold). On a
phone the wordmark breaks in two, THORN over BURY, each line fitted.

The specimen round compared Big Shoulders against Bricolage Grotesque
condensed, Bodoni Moda and Anybody at 55 width on the wall with a shade band
across; Big Shoulders won on reading as cast signage rather than as a font.

## Composition

12 columns, gutter `clamp(20px, 3.4vw, 60px)`, one hairline language
(`rgba(ink, .17)` and `.36`). Two components carry every page:

- **The plate** — a captured site behind a 1 px edge, a hairline caption
  row (number, name, sector·year) and one line. On the home page five plates
  hang at five heights across the wall; on Work the same plates are large,
  with a sticky side column of facts. Every plate opens the real site, which
  is in this collection, so the work is verifiable, not described.
- **The index** — numbered hairline rows for principles, rates and factors.

The hero is bottom-weighted: kicker top-left, the positioning line and the
rail on the right, the wordmark across the whole column at the foot. The
inner pages open with the same head (label, display line, side note) so the
site reads as one house.

## The rate

The two figures on Services are the studio's real published rates and only
those: S$500 promotional (up to five pages, three months of free changes) and
S$800 fixed (no page limit, one month of free changes). Nothing else on the
site states a price; the work plates carry no fees and the contact form asks
what exists now rather than for a budget band. The ledger takes any number of
rows so the coming service-charge chart can replace both figures without a
rebuild.

## Mobile

Composed again, not shrunk. The bar becomes two rows on an opaque wall
strip; the hero stacks kicker, line, rail, and the two-line wordmark; plates
go one to a row with their caption under them; the Work side column sits
beneath its plate; terms become a ruled table; the contact form goes full
width with 16 px inputs. Verified at 320/360/375/390/414/540/768/1024/1280/
1440/1920 on all five pages: `scrollWidth − clientWidth === 0`, 55 of 55, one
`h1` per page, every image alt-texted.

## Navigation

Same-directory links are intercepted and only `<main>` is swapped
(`fetch` → `DOMParser`), with title, description, canonical and `data-page`
following; the canvases are never torn down, so the light carries across the
navigation and the room stays the room. Modified clicks, other directories
and failed fetches fall back to a real navigation. Verified: two swaps and a
`history.back()` leave one `<main>`, two canvases, the right `aria-current`
and the sun where it was.

## Performance gut-check (per the brief: not solved now, not painted in)

Two full-screen fragment passes at DPR ≤ 1.5 (wall) and 1.0 (shade), cheap
math, drawn only on change. On a phone this is the first thing to lighten
and it has a cheaper fallback already built: `html.nogl` drops both canvases
for a flat wall with a static CSS dot pattern. Nothing on the site only
works as video, and there is no asset heavier than the 189 kB room
photograph.

## Verification

Playwright and the chrome-devtools MCP were both held by other sessions, so
this build was verified through a 60-line CDP harness on headless Chrome
(SwiftShader for the WebGL) at 1440, 1920 and 390, capturing at set hours via
`?at=`, plus the Browser pane while it was visible. Console clean on every
page (the only 404 is the sweep wrapper's own favicon). Not verified here:
an on-device phone; the light's cost on a real handset is the next stage.
