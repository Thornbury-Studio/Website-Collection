# SALTFIELD — image provenance

Saltfield is a **fictional business**. The house, the coast at 54°36′N 0°54′W, the six rooms,
the rates, the shore levy and all copy are original to this template. No real hotel's identity,
imagery or prices are used. Prices are invented.

## Photography — licensed Adobe Stock (free tier)

Fourteen photographs were searched, licensed and downloaded on **11 August 2026** through the
Adobe Stock connector, free-tier assets only. Every asset was checked to be `isGenTech: false`.
Originals ranged 2 917–9 407 px on the long edge; all were downsampled from the full-resolution
licensed file, never from a search thumbnail.

### The grade

The set was held to one world — warm limestone light, linen, muted coast — and every frame runs
one identical pass (Pillow): warm shift (R ×1.022, B ×0.965), contrast ×1.045, saturation ×0.94,
brightness ×1.005. No vignette: this is a light-ground site and photographs sit in hairline
"plate" frames rather than dissolving into shadow.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/hero-dunes.webp | 719719472 | Arrival — dunes under a pale sky |
| img/coast-bay.webp | 533940568 | Field notes / home teaser — the bay at low water |
| img/coast-grass.webp | 482302430 | Field notes — marram grass |
| img/room-fen.webp | 433974427 | Room No. 01, The Fen |
| img/room-gull.webp | 476582178 | Room No. 02, The Gull |
| img/room-bay.webp | 269904157 | Room No. 03, The Bay |
| img/room-keepers.webp | 387707629 | Room No. 04, The Keeper's |
| img/room-heron.webp | 445153001 | Room No. 05, The Heron |
| img/room-lantern.webp | 629601673 | Room No. 06, The Lantern |
| img/detail-morning.webp | 483719829 | Room pages / kitchen — morning detail |
| img/kitchen-main.webp | 396876380 | The kitchen, breakfast laid |
| img/kitchen-bread.webp | 138105081 | Kitchen band / notes — the morning bake |
| img/bath-tub.webp | 695688244 | Bathhouse band — tub and sheer curtain |
| img/bath-stone.webp | 837743203 | Bathhouse — the stone room |

Licensed, reviewed, not shipped: **339125554** (bread on dark wood — its ground broke the
set's light register). Free-tier licence, no credit cost; recorded so the licensing history
matches the folder.

`img/coastal-saltfield-sm.webp` in the repository root is a screenshot of this template's own
homepage, used as its card in the hub gallery.

## Generated illustrations — Gemini (Nano Banana Pro)

Two assets no stock library could supply — the property's own map and its brand sketch — were
generated on **11 August 2026** with Google's `nano-banana-pro-preview` model via the Gemini
API, from original text prompts written for this template:

| File | What it is |
|---|---|
| img/map.webp | Hand-drawn ink map of the property: house, bathhouse, kitchen garden, dune path, jetty, tidal field, lane |
| img/sketch.webp | Ink field-sketch of the house from the lane, used in the About split and the footer |

Both were reviewed for label spelling and style, then tone-matched to the site's paper and
re-encoded as WebP locally.

## What is real and what is not

The booking flow is a working demonstration. Rates are computed night by night against three
season bands, the 9% shore levy is exact to the cent, and the quote on a room page and the sum
at booking come from the same function so they cannot disagree. The "hold" carries a room and
dates between pages in localStorage (`saltfield.hold.v1`) and is cleared on booking. The
conditions line in the header — first light and last light at the house — is computed
astronomically (NOAA simplified equations with the equation-of-time correction) for the
house's fictional coordinates, in the house's own clock. Validation is real: date logic,
minimum and maximum stays, a guests-per-room fit rule, and email format. The submit charges
nothing and sends nothing — it renders a confirmation, and says as much on the page.
