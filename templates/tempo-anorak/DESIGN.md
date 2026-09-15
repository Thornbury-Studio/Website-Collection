# ANORAK° — Garrow Mill, Ardsleigh

A storefront for a six-piece running label. Product, brand and story — not a
metrics tool and not a lookbook.

## DNA (extracted, not copied)

Studied, then rebuilt as a different company:

| Source | What we took | What we refused |
|---|---|---|
| [Black Sheep](https://au.blacksheep.cc/) | Hero-scale athlete photography as the selling device rather than a pack-shot grid. A modular grid with real whitespace. A neutral base cut by one loud saturated colour, spent in one place instead of spread thin. Brand story woven through the shop rather than parked on an About page. | Their black bar with a centred wordmark and hamburger-plus-search; their tier names; their type pairing; their headline voice ("built for hard roads and long hours"); their palette; every line of their copy and layout. |

The extraction is the *grammar* — photography-led, modular, one loud colour,
story woven in. Everything that makes a site recognisable — name, wordmark,
nav structure, type, palette, copy, the interactive idea — is authored here.

## The company

**ANORAK°.** *anorak, n. — a person who cares far too much about something.*
A running label at Garrow Mill in Ardsleigh, West Yorkshire. Six garments,
four cloths, two fits, no seasons and no drops. The voice is dry, specific,
British and slightly self-aware about the obsession: it names rejected fabrics,
prints measurements in centimetres, and says when a thing was argued about for
four months.

Pieces are named for weather, never for tiers: **Crosswind**, **Half Light**,
**Hard Frost**, **Dew Point**, **Dry Spell**, **Low Sun**.

## The site's one authored moment

**The conditions wipe.** The real question a runner asks before leaving the
house is *what do I wear at this temperature*, so that question is a control.
Dragging a temperature from −5 °C to 30 °C drags the weather across a single
photographic plate: a cold frame occupies the left of the frame and retreats as
the number climbs, with an ultramarine seam and a hi-vis handle marking the
join. The band name, the note and the kit list underneath change with it, and
every piece in the list links into the shop.

The two halves are a matched pair, and that is the whole trick. Both are one
male runner coming toward the camera at the same subject scale and camera
height in open landscape; one is in a jacket and tights on snow, the other in
a singlet and shorts in heat. Read across the seam they are the same person
dressed for two different mornings, not two photographs meeting in the middle.

The subjects sit at 0.16–0.32 and 0.42–0.55 across the frame, which is
measured rather than eyeballed, and the page opens at 17 °C so the seam lands
in the clear ground between them and both runners are whole. Drag either way
and the seam crosses a runner only while that runner is being taken away,
which is what a wipe is for.

It is a native `<input type="range">`, restyled — so it works with a pointer, a
finger, arrow keys and a screen reader without any of that being reimplemented.
The six bands are contiguous by construction in `js/site.js`, so they cannot
develop a gap or an overlap later. Reduced motion keeps the control and drops
the easing; the wipe is direct manipulation, not an animation, so it still
works when motion is off.

Supporting motion: the hero photograph wipes up on load, and sections rise as
they arrive. The wipe is kept to the two places that need no scroll detection
to be correct — a load animation and a control the visitor is holding — for
the reason in the traps section below. Nothing floats, nothing bounces. No
marquee, no scroll mapping, no parallax.

## Materials

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F2F1ED` | ground — warm-neutral, matte, not cream |
| `--paper-2` | `#E7E5E0` | raised band, image wells |
| `--paper-3` | `#D7D4CC` | hairline rules and the whole grid |
| `--ink` | `#14161B` | type (blue-black, not pure) |
| `--ink-2` | `#565B64` | muted copy — 5.8:1 on paper |
| `--blue` | `#1B32E0` | ultramarine — 7.3:1 on paper, 8.1:1 as bone-on-blue |
| `--blue-deep` | `#0E1C8C` | button hover only |
| `--hivis` | `#DDFF2E` | signal only, never text: the slider thumb, the seam handle, the in-stock dot |

The blue is spent in one place: a full-bleed plate in the middle of the home
page (and the head of `fabric.html`) that is **a photograph of the cloth itself**
mapped to luminance and run through an ultramarine ramp. Everywhere else the
blue is doing a job — a button, a link, the focus ring, the seam.

Type: **Archivo** (variable `wdth` 112–125, `wght` 750–800) for display, set
uppercase and wide; **Hanken Grotesk** for reading; **Martian Mono** (`wdth`
87.5) for every label, measurement and price. The contrast in the pairing is
width, not style. Not Schibsted Grotesk, not Spline Sans Mono, not Bodoni, not
Inter.

## How it differs from EVEN (`templates/running-even/`)

EVEN is also running-adjacent, so the separation is deliberate and total:

| | EVEN | ANORAK |
|---|---|---|
| What it is | a race-day pace-band tool | a storefront |
| Palette | cool silver-fog monochrome | warm-neutral bone + one ultramarine |
| Type | Schibsted Grotesk + Spline Sans Mono | Archivo (wide) + Hanken Grotesk + Martian Mono |
| Signature | scroll mapped to distance on a fixed rail | temperature dragged across a photographic plate |
| Imagery | one generated silver-fog world | eight licensed photographs, graded cool |

The one shared instinct — mono for anything measured — is a correctness rule,
not a style: a number that is not in a tabular mono is a number you cannot
compare.

## Pages

1. `index.html` — the shop. Hero, creed line, the conditions wipe, the six
   pieces as spec cards, the blue cloth plate, field notes, sizing.
2. `range.html` — the six at length, each with a spec table; the size chart.
3. `fabric.html` — the four cloths, their mills, and the list of what was
   turned down, which says more about the bar than the list of what was kept.
4. `crosswind.html` — a real product page: the garment itself on the page
   ground rather than somebody wearing one like it, colourway and size, a live
   spec line, and a reserve link that composes a message and hands it to a
   mail client. There is no backend and the page does not pretend there is
   one. The plate is the Signal colourway, so Signal is the option selected
   when the page opens; the photograph and the control agree.

## Numbers are computed, not typed

Every "fabric weight" figure on `range.html` and `crosswind.html` is derived in
`js/site.js` from three measured attributes — cut area, cloth weight per square
metre, finished garment weight — and printed as grams plus the share of the
garment that is cloth. Nothing in those cells is written by hand, so a spec
table cannot drift away from the fabric page.

## Traps found while building this

- **`clip-path` breaks `IntersectionObserver`.** A reveal whose hidden state is
  `clip-path: inset(0 0 100% 0)` has an intersection rectangle of zero area, so
  the observer reports `isIntersecting: false` wherever the element sits —
  measured at ratio 0 with the element parked in the middle of the viewport —
  and nothing ever appears. The fix is to stop clipping the observed element,
  not to stop using the observer: the hidden state here is opacity and a
  translate.

  The intermediate attempt is worth recording because it looked reasonable and
  was worse. Driving reveals from a scroll listener keeps the wipe, but scroll
  events are coalesced, and anchor jumps, scroll restoration and find-in-page
  can all move the page without one — and every miss leaves a paragraph
  invisible forever. A `requestAnimationFrame` ticker has the same class of
  problem wherever frames are throttled. The observer is the only one of the
  three that depends on neither events nor frames, so the hidden state has to
  be something it can see.
- **A display heading in a `minmax(0, …)` track will overflow, not wrap.**
  The footer wordmark was sized `clamp(2.4rem, 8vw, 5rem)` — off the viewport —
  while its column is about a quarter of the viewport. "ANORAK°" has no space
  in it, so there is no break opportunity: it did not wrap, it painted 85 px
  past its own column at 1440 and 155 px at 1200, and dropped the blue degree
  mark on top of the Shop list. Two rules now, because either alone is a
  half-fix: every display heading carries `overflow-wrap: break-word` so the
  worst case is an ugly wrap inside the box rather than a silent overlap
  outside it, and the wordmark is sized in `cqi` against its own column so it
  fills a constant 88% of whatever that column turns out to be — which is the
  part that survives somebody changing the grid ratio.

- **The two dial plates must not be lazy.** The cold frame is the clipped top
  layer of the wipe, so if it arrives after the warm one the visitor sees the
  warm photograph occupying the cold half — a wrong state rather than a blank
  one. They are a matched pair one viewport below the hero; deferring them
  bought nothing and cost correctness.

- **Tight display leading plus a comma.** At `line-height: .86` the comma
  ending one line landed inside the cap height of the next. `.9` is the
  tightest leading that survives real punctuation at every width.

## Verifying this one

Two notes for whoever picks this up next.

The reveal mechanism cannot be trusted to a headless or automated browser that
starves the rendering pipeline: scroll events arrive coalesced and
`IntersectionObserver` callbacks lag by seconds, which looks exactly like a
broken page. The test that actually settles it is to render the whole document
in one very tall window with motion on, render it again with
`--force-prefers-reduced-motion` (where JavaScript reveals everything
immediately), and compare the two. They came back at 56.5 dB PSNR, which means
every reveal fired.

Screenshotting a URL with a `#fragment` in headless Chrome returns a blank
plate whether or not the page is working. It is a capture artefact, not a bug
in the page.

Layout faults of the overflow kind do not show up in a box-model check, because
the box is the right size — it is the *text* that leaves it. Measure the
painted extent instead: a `Range` over an element's contents, its
`getClientRects()` compared against the element's own border box. That scan,
run over four pages at ten widths from 880 to 2400, is what proved the footer
fix and found nothing else. Note that a `<sup>` sits above its parent's content
box, so a containment test that requires full enclosure will flag it as
escaping its own column; that one is an artefact.

## What this is not

- Not EVEN (a tool, cool monochrome, scroll-as-distance).
- Not HAMON (dark ground, Bodoni, a single-maker workshop).
- No dark mode, no theme switch, no product carousel, no bento grid.
- No fabricated live weather: the temperature is the visitor's to choose, and
  the site never claims to know where they are.
