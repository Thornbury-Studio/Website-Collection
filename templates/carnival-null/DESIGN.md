# NULL CARNIVAL — design notes

A maximal 3D/art-direction experiment: a travelling night fair that appears
once in a decommissioned civic building. The whole site is one room, and
scrolling turns it around you.

## Concept

A carnival with a hole in it. `NULL` is the missing value — the empty field
where the attraction, the face, the prize should be. Every element is composed
around an absence: the masks have no faces, the prize shelf is empty, the
ticket tier that matters costs nothing and cannot be bought, and the visitor
carries a hole with them across the page.

The register is deliberately not cyberpunk: it is **fairground print gone
nocturnal** — painted banner plates, gilt hairlines, bulb strings, sodium lamps
in a wet concrete hall.

## Palette

| token | hex | role |
|---|---|---|
| `--pitch` | `#050309` | deepest void |
| `--ink` | `#0A0711` | the hall — plum-black, never pure black |
| `--bone` | `#F4EADA` | type — warm paper, never white |
| `--sodium` | `#FF8A2B` | the lamps above the booths |
| `--gilt` | `#E0B457` | banner gold, arches, rules |
| `--mercury` | `#6FF2C4` | the NULL channel — vapour out of the empty tank |
| `--carmine` | `#FF2D55` | ritual and hazard |

Three of these are hoverable **channels** (SODIUM / MERCURY / CARMINE). Taking a
booth, a programme row or a ticket tier re-lights the entire site in that
channel at once — WebGL lighting, floor tint, portal colour, bloom tint and
every CSS accent. `--acc` is registered with `@property` so the switch is a
620 ms crossfade rather than a cut.

## Type

- **Bodoni Moda** — display. A high-contrast didone is the fairground banner
  voice, and it is the one register no other template in this collection uses.
- **Archivo** — body.
- **Space Mono** — telemetry, HUD, ticket stubs, the crew's own labels.

Headings are split per character and take a `steps(3)` tear on the downbeat of
every eighth bar. `CARNIVAL` floats letter by letter on staggered delays. The
hero `NULL` is not set in type at all — it is cut clean through a painted
banner plate by an SVG mask, so the moving room shows through the letterforms.

## The room (`js/carnival.js`, three@0.180 ES module)

A drained natatorium. A concrete deck ring at floor level, a 16-unit pit in the
middle with a carousel standing on the bottom of it, seven monumental gilt
arches around the outside at radius 40, and a heptagram of bulb wire strung
overhead. Scroll rotates the camera around the ring through seven stations on a
Catmull-Rom-interpolated path, looking outward at a booth at some stations and
inward and down into the tank at others.

- **Floor** — fbm concrete with puddles, sodium pools from the bulb ring and
  mercury out of the pit mouth, plus ripple rings the pointer pushes through the
  standing water. Unlit within a few metres of the camera, so the light belongs
  to the middle distance and the room reads as a room.
- **Masks** — one `InstancedMesh` of 180 quads, each a signed-distance-field
  carnival mask drawn in the fragment shader: pointed chin, scalloped crown,
  slanted almond voids where the eyes are not, and two string holes at the
  temples. Billboarded in the vertex shader, and each one able to turn and face
  the pointer with its own willingness to do so.
- **Booths** — instanced arch, legs and a portal disc whose shader shows a
  different colour space inside it — a hole punched through the back of the booth.
- **Bulb wire** — one `Points` draw of ~390 bulbs on catenary spans, chasing and
  flickering on the 84 BPM clock, with a few duds.
- **Carousel drum** — the programme printed on a `CanvasTexture` and wrapped on
  a cylinder at the bottom of the empty pool, turning against the midway. Redrawn
  once when the display font lands so the fallback face never bakes in.
- **Symbol storm** — 3000 `Points` glyphs off a procedural atlas, drifting, and
  gathered into orbit around the null.
- **Searchlights** — seven rigs on the ring, each sweeping its own arc on its
  own phase, hollow cones that are brightest at their edges the way a real
  beam in haze is. All seven lean toward the null when the visitor holds one.
- **Signage** — a named, bulb-edged board hung in the mouth of every arch,
  buzzing on a slow tube flicker with a faster mains ripple over the top. Read
  from across the ring they come out mirrored, which is the building's problem
  and not ours.
- **The tank lip reads itself out loud** — a ticker wrapped round the pool edge,
  turning against the carousel: STAND STILL · THE LIGHTS ARE OURS · EXCHANGE
  BEFORE 03:00.
- **Shadows** — every mask over the deck throws one, computed from the same
  `maskCentre()` the mask itself uses, so the two can never drift apart. The
  higher a mask rides the wider and fainter its shadow.

Rendering is hand-rolled end to end. The page's CSP forbids inline script, which
forbids an import map, which puts every `examples/jsm` addon out of reach — so
the composer is four fullscreen passes written here: bright-pass with a soft
knee, two octaves of separable gaussian at quarter resolution, then a composite
doing barrel distortion, radial chromatic aberration, bloom, the null lens,
vignette, scanline and grain, in that order. Colour management is disabled and
the output space is linear, so every conversion in the chain is an identity and
the hex in the GLSL is the hex on screen.

## The null (the central interaction)

The cursor is not a cursor. It is a circular absence the visitor carries.

It lives as a uniform in the **composite pass**, so it acts on everything at
once: inside it the world inverts and channel-rotates, so it reads *wrong*
rather than merely negative, with a mercury rim. Masks within reach turn to face
it, the glyph storm is pulled in and held in orbit around its edge, and the floor
ripples bend toward it. Over the page's own type it does the same thing to the
copy — the public name of a booth dissolves and the name the crew uses for it is
stencilled in the hole underneath. After four seconds of stillness the null
starts wandering the room on its own.

At the ACCESS station the polarity reverses: the hall is handed back to the dark
and only the middle of the frame keeps its light — the ticket, lit, in an empty
building. (Draining rather than inverting: inverting a night scene turns the
page white under the copy.)

The null also has weight. Masks are drawn out of the crowd toward it and swung
around its rim, damped against their own scale so a mask the size of a door
barely answers while the small ones come readily. Point at the carousel and the
printed programme buckles — a real vertex displacement falling off with distance,
not a filter.

And the ring can be pushed. Hold the pointer out past the middle third and the
turn keeps going that way, bounded to well under one station and unwinding when
you let go. It is a nudge, not navigation: scroll still owns where you are. The
push only answers a hand actually on the page — the idle drift wanders to the
edges by design, and letting *that* push would turn the carnival away from its
own composition while nobody is looking.

On touch the null is a fixed band across the vertical centre-third and the
content is scrolled *through* it, which is a better idea on a phone than a
cursor was ever going to be.

## Sound: the wrong calliope

Opt-in, synthesized live, no samples. A three-oscillator detuned square organ
playing Am–F–C–E **in three** over a clock that counts **in four**, so the two
only realign every twelve beats. Under it: a struck-bell FM voice on the downbeat
of every fourth bar, a bellows drone of two beating sawtooths behind a breathing
lowpass, a tape-hiss bed, and one slow LFO fanned into every voice's detune for
worn-tape flutter. The clock is re-zeroed on play so light and sound share
downbeats, and the organ's bandpass opens as the visitor goes deeper.

## Seven turns, seven rooms

Each station carries its own air density, searchlight intensity, sweep rate and
carousel speed, interpolated between stations the same way the camera path is.
The Second Turn reverses the bulb chase, because the programme says the ring
reverses at 01:30 and the building should agree with its own running order.

## Composition under load

Every luminous material reads one shared `uExpo` uniform, which eases down over
text-dense stations so the room yields to the copy instead of fighting it. The
line art — masks, bulbs, glyphs — reads a second, gentler `uExpoLine`, so the
*drawing* keeps its presence where the *lighting* has to give way.

## What the copy is made of

The functional sections are objects from the night rather than styled panels.
Entry is three stubs torn off a roll — notched flanks, a punched counterfoil, a
serial down the edge, and a stamp struck on at an angle; the null stub's serial
is blank, because it does not exist until the Oracle draws. The running order is
the production copy off the clipboard: hole-fed left margin, boxed times, ruled
rows, sheet number. The conditions of entry are a bill pasted to the tiles by the
door, taped at both top corners and hanging very slightly out of true.

## Performance

Fill rate, not draw calls, is the budget: the scene pass with additive overdraw
is the frame. Mobile drops to `COARSE && SMALL`, DPR 1.5, MSAA off, half the
masks and glyphs, and the fixed chrome shrinks to a single low-contrast line so
it never argues with the copy. A latching ladder samples 110 frames and steps down when the
mean frame exceeds 26 ms — DPR first (it cuts the scene pass and the composite
together), then MSAA, then instance counts, then DPR again, then bloom
resolution last, since the whole bloom chain is about 3% of the frame. The render
loop is gated on both `IntersectionObserver` and `visibilitychange`, and one
frame is painted synchronously before the loop starts.

Two placement rules earn their keep here, both learned the hard way. Nothing
large and additive may sit inside the camera's own orbit (r 8–21) — the mask
shoals live outside it, below the deck, or up in the roof space where the camera
never goes. And anything that can still end up near the lens (masks, beams,
haze) fades out by its distance to the camera, because a metre-wide additive
quad on the glass is a white balloon, not a mask.

`window.NC.layers` exposes every layer. Bisecting a blown-out frame by toggling
`.visible` is the only reliable way to attribute one.

## Safety

No seizure-risk strobing: every large-area pulse is eased and under 2 Hz, and
the tear on the headings is a transform and clip jolt, never a luminance flash.
`prefers-reduced-motion` renders one composed static frame, never starts the
loop and never registers the pointer listeners. The copy sells the light policy
as festival operations ("managed light", "the Null Hour"), not as a site notice.

## Fallback

House watchdog: if `window.NC.ready` never appears within 3.5 s — CDN failure,
old browser, no WebGL — `body.no3d` reveals a hand-authored SVG midway with the
arches, portals, bulb wire and masks, and the page stays completely legible.
`webglcontextlost` folds to the same state. Every section, including the ticket
tiers, is in the HTML and needs no JavaScript to render.
