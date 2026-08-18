# LINIA ALVA — design record

Written at finish, from the built world. Seed 74b25f28, direction 5 of 7
(slow-television journey transmission), fused with the cyclorama-dawn light
system dealt as a challenger and beaten on nothing — it won its slot as the
colour grammar while the broadcast form kept the structure.

## The world

A slow-television transmission of one winter day on a fictional Grisons
mountain railway (Tarven 988 m → Alvagrat 2,236 m, 41.8 km). The page **is**
the broadcast: it joins "live" wherever the visitor's real clock falls in the
line's timetable, and scrolling rides the whole day from first light to the
last arrival. Everything visual is real 4K footage — seven clips, six of them
by one Graubünden filmmaker (Oskar Gross, Chur), which is what makes the
stock-based world read as a single commissioned shoot. No AI imagery.
Licences and sources: IMAGE-CREDITS.md.

## Light system (the cyclorama)

Four fixed-position gradient layers crossfade behind everything, keyed to
journey km, not scroll whimsy: night cobalt (yard, tunnel), first-light
rose/gold (the climb), porcelain day (the plateau — the page fully inverts
to light ground here), alpenglow dusk (arrival). The tunnel chapter forces
night and blacks the viewport to near-void; its glow bleeds into neighbours
via box-shadow so the transition has no hard seam.

## Palette

- `--night #0A1017` ground · `--porcelain #EDF1F5` ink and day ground
- `--red #C8362B` / `--red-bright #E04A3F` — reserved strictly for the live
  train dot, the LIVE pip, and the reserve action. Nothing else is red.
- `--cobalt #1C3A5E`, `--rose #B0616B`, `--gold #D9A05B` live only inside the
  cyclorama gradients and the "next departure" accent.

## Type

- **Saira Condensed** (500/600): signage caps — wordmark, station names,
  chapter titles, fares, actions. The line's physical signage voice.
- **Literata** (variable opsz): all prose, italic for asides. The journal voice.
- **Red Hat Mono** (400/500): instruments — HUD, km posts, timetable,
  chit, cue labels. Tabular numerals throughout.

## Signature devices

- **Lower-third**: fixed broadcast bar carrying the route's elevation profile
  as an SVG spine; a porcelain dot = the visitor (scroll position → km), a
  red dot = the live train (real clock → timetable position). HUD reads
  km / altitude / lapse-rate temperature / next station.
- **Tunnel dal Corv**: 165svh of sticky black with a spinning km counter —
  the page's one authored "cut". Audio muffles through a 420 Hz lowpass.
- **The window seat**: interior footage masked inside a rounded carriage
  window with layered frame shadows and a glass reflection sweep.
- **Value-true everything**: departures strike through as they leave today,
  next-departure is computed, altitude/temperature derive from the profile,
  the seat chit persists (`linia.seat.v1`).

## Audio

Opt-in only (lower-third toggle, preference in `linia.sound`, re-armed on
next gesture). WebAudio graph: interior-rumble bed + high-plain wind through
a shared lowpass. Wind fades in above the tunnel (km ≥ 23); tunnel closes the
filter and ducks the bed. Loops are crossfade-baked offline.

## Performance

Tiered encodes (star clip 1440/1080/720, rest 1080/540), x264 aq-mode=3 for
snow gradients, every clip lazy-attached and IO play/paused, posters as WebP,
`Save-Data` honoured, hero 3.3 MB. Full-journey desktop ≈ 40 MB fetched only
if the visitor rides the entire line; mobile ≈ 15 MB. Reduced motion: posters
only, no video fetch, no cue animation.

## Voice

Slow TV: calm, factual, unhurried; no exclamation marks, no "experience the
magic". The line does not hurry. Neither should you.
