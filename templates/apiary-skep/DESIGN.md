# SKEP — reference DNA

A working apiary and queen-rearing outfit on the Welsh Marches, selling
single-origin seasonal honey, nucs and mated queens, and teaching at the hive.

## The one idea

**The site is a colony, not a brochure.** Every number on the page comes out of
one running model of a honeybee colony's year. Nothing is typed in by hand and
nothing is decorative: the population ribbon, the comb fill, the surplus figure
and the harvest windows on `honey.html` are all read off the same simulation.
Perturb it — let it swarm, split it, give it a wet June, skip the varroa
treatment — and the rest of the year recomputes downstream, because that is what
actually happens to a colony.

This is the structural bet. A beekeeper's site that *says* "we work with the
season" is a claim. One that makes you lose 60% of the bees in May and then
watch the August surplus fail to arrive has made the argument for you.

## Reference DNA

| Source | What was taken | What was deliberately not |
|---|---|---|
| The ThemeForest seasonal-chapter theme (the pinned reference) | Full-bleed stacked chapters, one per season; a **silhouette used as a window** onto a landscape; centred, widely letterspaced editorial serif; hairline rules; a lot of air | The double-exposure *portrait*. The aperture here is a **skep**, not a face — the shape has to belong to the trade |
| Karel Martens — letterpress prints, overprinted flat inks | Numerals treated as structure rather than annotation: the year scale, the day counter and the data plates are set large, flat and unshaded | His colour clash. The palette is hive material, not printer's ink |
| Otl Aicher — ERCO / Munich 1972 | Isotype discipline on the forage bands: one bar, one bloom, one weight, no gradients, no shadow, no icon that is not doing work | The pictogram set itself. Drawing bees as pictograms would have made it a poster about bees |

## Colour doctrine

The ground is raw wax and the dark band is smoker char. **Amber is data and
never brand** — it appears only where honey is actually being measured (the
comb fill, the surplus bar, the harvest windows). The moment amber is used for
a button or a heading it stops reading as a quantity, which is the same trap
`nursery-frostline` avoids with green.

`--propolis` is the single reserved accent: one CTA per page, and the warning
state when the model kills the colony. Nothing else may use it.

## Type

- **Fraunces** for display, with the `SOFT`/`WONK` axes turned up a little. The
  wonk gives the wordmarks the slight unevenness of something pressed rather
  than rendered, which is the point of the chapter plates.
- **Instrument Sans** for voice.
- **IBM Plex Mono** for every number that comes out of the model, so instrument
  readings are visually separable from prose at a glance.

Deliberately not `Spectral`/`Archivo`/`Spline Sans Mono` — that trio is
`nursery-frostline`'s, and two craft templates in the same catalogue should not
share a voice.

## Imagery

There are no photographs. Every landscape behind a skep aperture is drawn as
inline SVG — hedgerow, blossom, hill line, ivy — so the template carries no
licensing burden, no image credits file, and no 400 KB hero. It also means the
seasonal chapters can be tinted from the same tokens as the charts, which a
photograph could never be.

## Motion

One curve (`--ease`), one duration. The year scrubber is the only continuous
motion and it is driven by the visitor, not by a timer. Under
`prefers-reduced-motion` the chapter reveals become instant and the colony model
still runs — the instrument is the content, so it is never the thing that gets
switched off.

## Known simplifications

The model is a real one but a teaching one. It runs a single colony on a daily
step with a 21-day capped-brood lag, seasonal worker longevity, and nectar
intake gated by forage windows and forager count. It does not model drone brood,
queen supersedure, robbing, or nosema, and its varroa term is a single viability
multiplier on winter bees rather than a mite population of its own. The numbers
are honest about shape and order of magnitude, not about any particular apiary's
yield.
