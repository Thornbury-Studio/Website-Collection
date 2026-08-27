# EON ATELIER — No. 1 "Meantime" · design notes

An independent watchmaking house on Ushant that builds instruments for the
kinds of time a clock leaves out. Its first calibre keeps four registers —
the tide, the shadow, the while, the sky — and no hours at all.

## The governing idea

> **The instrument on the page is running.**

The hero object is not a picture of a watch; it is a working one. Every
register displays a real quantity at the moment of the visit:

| register | reads | source |
|---|---|---|
| I · AESTUS (the tide) | today's lunar age, spring/neap lean, semidiurnal swing | synodic month from the J2000 new-moon epoch |
| II · UMBRA (the shadow) | the visitor's lamp — the pointer carries the key light, and the gnomon casts a real shadow from it | pointer position |
| III · MEMORIA (the while) | time attended — one engraved gold mark per ten seconds on the page, un-settable | dwell clock |
| IIII · SIDERA (the sky) | today's true heliocentric arrangement of the six classical planets | mean elements, deg/day since J2000 |

The papers below repeat the readings as live mono lines ("now — moon 14.4 d ·
full · leaning spring"), so the spec sheet itself is running.

## The walk (one scroll, ~10 viewports)

Scroll unwinds the reserve: the HUD runs 96 h → 0 as the calibre opens
stratum by stratum, and the papers arrive when it is fully unwound. The gate
CTA is "Wind the movement."

| p | act |
|---|---|
| 0–.09 | arrival — the closed instrument on its plinth, breathing; balance beating at centre where hands would stand |
| .09–.21 | the dial is a lid — sapphire lifts, case sinks away, chapter ring expands, four dial petals tilt open |
| .21–.37 | Register I · AESTUS — flat pool of levelled silver, moon in today's phase (terminator presented toward the visitor) |
| .37–.53 | Register II · UMBRA — the lamp is forced low and off-axis; the blued gnomon's shadow sweeps the engraved arc |
| .53–.69 | Register III · MEMORIA — skeleton barrel, blued mainspring, the visitor's marks accruing on the rim |
| .69–.86 | Register IIII · SIDERA — the orrery expands; the train fans into a floating column |
| .86–1 | everything folds home fast; overhead portrait of the closed dial; canvas dims into the papers |

## Object architecture

One movement, radially honest: a central great wheel (Ø 13.4) meshes four
register pinions at the cardinals at exact centre distance (6.7 + 1.5 = 8.2),
so one wheel visibly drives all four kinds of time. The balance (18,000 vph,
matching the spec sheet) beats at dial centre under the heart aperture —
"where the hands should stand, a heartbeat." Escape wheel ticks discretely;
ratios between meshing wheels are true.

## Art direction

- **Not black-and-gold.** Slate night (#0d1115), bone type (#e9e3d5),
  brushed rhodium and tantalum, thermally blued steel (iridescence-tinted),
  ruby jewels in gold chatons. Gold appears only as function: chatons, the
  orrery's sun, the memoria marks.
- **Finissage as texture:** procedural canvas roughness maps — radial sunray
  on the dial petals, côtes droites on bridges and cock, perlage on the
  plate, circular graining on platters, satin line brushing on the case.
- **Engraving as type:** register names on the chapter ring, dial
  signatures, register scales and the plate-rim inscription are canvas
  ring-textures in Spline Sans Mono / Marcellus, mapped planar onto annulus
  overlays.
- Type: Marcellus (lapidary display), Spectral (prose, italic), Spline Sans
  Mono (instrument labels).

## Technique

- Three.js 0.180.0 (jsdelivr ES module, pinned — same as PARALLAX). All
  geometry procedural: lathes for case/plate/bases, extruded 2-D shapes with
  chamfer bevels for gears/bridges/petals, tube spirals for springs.
  ~139 meshes, ~78 k triangles, no image assets (og.jpg is a screenshot of
  the site itself).
- Environment: a small emissive "studio" scene (window softbox, cool strip,
  overhead panel) baked once through PMREMGenerator — this is what makes the
  brushed metals read as metal.
- **The pointer is the lamp**: one shadow-casting spotlight rides the pointer
  on a sphere around the work (drag sideways on touch); idle drifts it on a
  slow lissajous. During UMBRA it is forced low and off-axis so the gnomon's
  shadow is long and visible. A faint point light pulses in the heart with
  the beat.
- Camera: keyframed positions/looks sampled with the non-uniform Hermite
  interpolator (PARALLAX pattern). Register acts frame at ~20 units for the
  40° lens. Mobile multiplies camera distance ×1.28 and halves fine counts.
- Layer choreography: every layer has a home and an opening gesture
  (rise/tilt/slide/scale) inside a scroll window, all multiplied by a global
  close factor for the fold-home finale. (Slide offsets are recomputed from
  home each frame — accumulating `+=` on position caused a petal to drift
  240 units over a walk. Reset, then offset.)
- Fallbacks: no-JS → papers only; CDN failure → 8 s watchdog folds to
  papers; WebGL failure → same fold; reduced motion → gentle beat, static
  planets, snappier scroll. Papers reveals are gated on `.js-anim` with a
  failsafe timeout + scroll sweep.

## Content truth

Eon Atelier, Léonie Vasseur, the calibre and every specification are
original fiction for this showcase. The astronomy is not: moon age, phase,
spring/neap lean and planetary longitudes are computed from the real date.
No external creative assets were used.
