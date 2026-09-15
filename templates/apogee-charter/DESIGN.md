# APOGEE — design notes

Private jet charter with its own fleet. Four pages: the brand (`index.html`),
the fleet (`fleet.html`), the programme (`programme.html`) and the request
(`request.html`).

## The one idea

The business sells altitude and quiet, so the site has one colour and
earns it. Everything is bone and ink — until the climb, the section on the
home page where scrolling is altitude: the page goes from the apron to
forty-five thousand feet, the ground turns into the sky above the weather,
bone becomes the near-black of the stratosphere, and the type crosses from
ink to bone at the tropopause. The altitude counts, the outside air falls
to −57 °C on the ISA lapse, the cabin altitude and Mach rise, and five lines
of copy arrive at the heights they are about. The footage under it is a
private-jet wing rising out of cloud (a descent master, reversed) and then
a cloud deck from far above. Nothing else on the site is coloured.

The references were principles, not surfaces. The Lando Norris site's
lesson was a single authored, pinned, cinematic sequence with bold type set
low and heavy and a lot of restraint either side of it; By-Kin's was weight
— type that leans a degree with velocity and settles, plates that lag the
scroll. Both were about a racing driver and a studio; this is about an
aircraft, so the sequence is a climb and the weight is inertia.

## What was refused

An italic serif wordmark, a gold hairline, and a jet at sunset. The
wordmark is Bricolage Grotesque, sentence case, with a mark that is an arc
with a dot at its highest point — the word's meaning, drawn. The only warm
thing on the site is cream leather in the cabin footage. The apron
photograph is grey daylight.

## Type

**Bricolage Grotesque** at its largest optical size (`opsz 96`) and
heaviest weight, set tight and low — the giant lines at 10.4vw, the section
heads at 6vw. The face has enough character in its `a`, `g` and `R` to
carry a brand without a second display face. **Instrument Sans** does the
talking. No mono, no serif.

## Motion, and what each piece is about

| Effect | About | Where |
|---|---|---|
| The climb | Altitude. Scroll is height; the sky, the type colour, the readouts and the footage all derive from one progress number | Home |
| Lean | Weight. The big lines skew up to 1.6° with scroll velocity and ease back | Every giant / h2 |
| Lag | Weight. Plates translate at a fraction of the scroll, so the page feels heavier than the type on it | Every `.para` plate |
| Wipe | Arrival. Headlines are revealed by a clip that opens downward over 1.3 s; plates open from a letterboxed crop | Everywhere |
| Great-circle | Range. Two cities, the real arc between them drawn onto a Natural Earth dot-matrix, block time per type, nonstop or not | Fleet |
| Cabin plans | Size. Four cabins drawn to one scale, seats and zones included, against the biggest as a dashed reference | Fleet |
| Hours | The programme's truth. Any leg, in hours off your year and money at that type's rate | Programme |
| Buttons | Invert on hover over 0.35 s; scale 0.985 on press. Links draw their underline from the left | Everywhere |

Under `prefers-reduced-motion` the climb arrives at altitude as one still
composition with every line showing, footage shows its posters, reveals
are instant, and nothing leans or lags.

## Data

`js/data.js` is the business. Four aircraft with range, cruise, seats,
cabin dimensions and hourly rate; four bases; twenty-eight cities with the
coordinates of their business-aviation airports; the programme's three
years and six terms. Distance is haversine; arcs are slerped great circles;
block time is distance over cruise plus taxi, climb and descent, plus a
technical stop whenever a leg is beyond ninety per cent of the headline
range. The fleet rows, the cabin plans, the map, the hours tool and the
request form's suggestion all compute from it, so none can disagree.

## Verification

Headless Chrome over CDP. Overflow sweep at 320 / 375 / 414 / 768 / 1024 /
1440 / 1920 on all four pages; console clean. The climb was sampled at
five progress points and its altitude, temperature, sky colour and line
read back. The route tool, the hours tool and the request form were driven
by script; the form's mailto was captured through the `apogee:request`
event it dispatches before navigating, so no mail client opened. The
reduced-motion path was rendered with the media feature emulated.
