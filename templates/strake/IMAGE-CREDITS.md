# STRAKE — image provenance

STRAKE is a **fictional business**. Strake Coachworks, the Carvel, the Bowline,
Edwin and Anna Strake, the yard's history, every date, price, specification,
address, phone number and email on the site are original to this template. No
real marque's identity, imagery, product names or prices are used. The places
and boats in the photographs are real; the yard that claims them is invented.

## The car — rendered, then layered and recoloured in Adobe

The Carvel does not exist, so no photograph of it does. Every high-quality car-on-a-plain-
background on this Adobe Stock tier is a recognisable production model (an Audi A7, a Mercedes
SLS), and the only brandless ones are poor renders — so the car is **modelled and rendered from
scratch in Blender 5.2**, and the Adobe image tools are used for the layering and the colour.
No AI image generation of any kind is used anywhere on this template.

`tools/carvel.py` lofts the body as a hull of thirteen cross-sections, cuts the arches, grille,
lamps and shut lines, builds the wheels and the bronze strake, and lights a studio built as
geometry — five emissive softboxes and two negative-fill cards, so the glossy paint has
something real to reflect. It renders four passes of the same frame through Cycles (OptiX):

| Pass | What it is | Used as |
|---|---|---|
| `body` | the car with the wheels hidden | the body layer |
| `wheels` | the wheels, with the bodywork kept as a holdout so the far side stays hidden | the wheels layer |
| `shadow` | the car invisible to camera but still casting | the shadow layer |
| `matte` / `mattewheel` | every material black except the paint (or the rims) | the masks Adobe is given |

The layers are what the hero parallaxes and what the configurator swaps.

**The colourways are made in Adobe, from one render.** `up-body.jpg` and `up-wheels.jpg` were
uploaded to Creative Cloud, and `image_apply_adjustments` was run with `colorize` against the
Blender-rendered mattes as `maskURI` — an exact mask, so the bronze strake, the smoked canopy,
the lamps and the tyres keep their own colour while only the painted panels move:

| Colourway | HSL applied through the paint matte |
|---|---|
| Sailcloth | hue 38°, saturation 9, lightness +16 |
| Keel black | hue 210°, saturation 3, lightness −62 |
| Ebb | hue 178°, saturation 34, lightness −44 |
| Red lead | hue 8°, saturation 46, lightness −30 |
| Cast bronze wheels | hue 33°, saturation 44, lightness +4, through the rim matte |

Solent silver and satin graphite are the render itself. `tools/compose.py` blends each Adobe
result back into its render through the same matte and restores the alpha from it, so a later
change to a part Adobe never touched carries into every colourway without re-running it.

Masters live in `tools/raw/` (gitignored); `tools/render-all.sh` regenerates them.

## Photography — licensed Adobe Stock (free tier)

Twenty-four photographs were searched, licensed and downloaded on
**22 September 2026** through the Adobe Stock connector, free-tier assets only
(licence state `just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this template.
Originals ran 3 000–8 256 px on the long edge; every export is cropped and
downsampled from the full-resolution licensed file by `tools/grade.py`, never
from a search thumbnail. Nothing licensed is unused.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 604839569 | `h-1921` | Heritage, 1921 |
| 214376332 | `h-1929` | Heritage, 1929 |
| 541845545 | `h-1934` | Heritage, 1934 |
| 635976127 | `h-1952` | Heritage, 1952 |
| 431900872 | `h-1968` | Heritage, 1968 |
| 619449328 | `h-1979` | Heritage, 1979 |
| 516877061 | `h-2014` | Heritage, 2014 |
| 546849280 | `h-2026` | Heritage, 2026 |
| 542481759 | `d-bucks` | "The bucks" detail |
| 223283429 | `d-bronze` | "The bronze" detail |
| 420883852 | `m-bronze` | Materials, bronze |
| 509705313 | `m-mahogany` | Materials, mahogany |
| 309233242 | `m-sailcloth` | Materials, sailcloth; configurator, sailcloth seats swatch |
| 307314752 | `m-hide` | Materials, hide; configurator, tan hide swatch |
| 325779682 | `m-peat` | Configurator, peat hide swatch |
| 127141697 | `m-bronze-fine` | Configurator, cast bronze wheels swatch |
| 440034312 | `p-coast` | Press, "The Bowline" |
| 159224995 | `p-hammer` | Press, "Hull 200" |
| 659465069 | `p-v8` | Press, "A V8 for people who count to eight" |
| 523360026 | `band-coast` | The coast band |
| 269507635 | `y-hands` | "Come to the shed" |
| 530007638 | `y-builder` | "Come to the shed" |
| 381121587 | `y-rope` | "Come to the shed" |
| `img/favicon.svg` | — | Drawn: a hull section crossed by its strake |

The heritage chapters are shown in a single grade (`filter: grayscale(1)
sepia(.22)`) applied in CSS; the exported files are the photographers' colour.

The full-resolution originals live in `tools/raw/` on the build machine and
are gitignored; `tools/grade.py` documents every crop.
