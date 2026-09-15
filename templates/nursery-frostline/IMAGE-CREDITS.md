# FROSTLINE — image provenance

FROSTLINE is a **fictional business**. Harrowgill Bank, the grid reference, the
two people named on `field.html`, the prices, the loss figures and the opening
hours are all original to this template. No real nursery's identity, imagery or
prices are used.

The horticulture is not invented. Every plant in `js/catalogue.js` is a real
species or cultivar, and its RHS hardiness rating, height × spread, aspect,
moisture and pH tolerances are its real ones. Upper Teesdale genuinely holds a
relict arctic–alpine flora including *Dryas octopetala*, which is why the
template is sited there.

## Photography

**None.** There is no raster photography anywhere on this site.

That is a design decision recorded in `DESIGN.md`, not a sourcing compromise:
the Curtis's Botanical Magazine DNA calls for a drawn specimen, and stock
photography of plants is the most generic imagery available for the subject.

## Drawn assets

| File | What | How |
|---|---|---|
| Nine `<symbol>` specimen glyphs | mat, grass, spike, umbel, mound, palmate, plume, stems, thistle | Hand-authored SVG paths, inline in `index.html`, `catalogue.html` and `field.html`. Stroke only, no fill, `currentColor`. |
| `img/favicon.svg` | Eight-petalled *Dryas octopetala* flower | Drawn. The species name means "eight petals"; the mark is eight rotated petal paths around a madder centre. |

The plates are duplicated inline per page rather than referenced from one
external file, because `<use href="external.svg#id">` is not reliably supported
and a JS-injected sprite would lose the drawings when scripting is off.

## Rendered assets

| File | Size | Source |
|---|---|---|
| `img/og.webp` | 1200 × 628 | 1.91:1 crop from the top of the rendered homepage |
| `../../img/nursery-frostline-sm.webp` | 960 × 600 | Homepage screenshot for the hub card |

Both are renders of this template's own homepage, captured from
`http://localhost:8123` with headless Chrome at `--force-device-scale-factor=2`
(2880 × 1800 source), then downsampled with Pillow (Lanczos) and encoded WebP
q78 for the card and q80 for `og`. No external image was involved at any stage.

`ffmpeg` and `cwebp` are not installed on this machine, so the grading pass
other templates in this repo use (`tools/grade.mjs`) does not apply here — and
is not needed, since the source is a render of the page itself rather than a
stock plate that arrives mis-graded.

## Generated imagery

None. No AI image or video generation was used for this template, so
`VIDEO-POLICY.md`'s credit-conservation rules were not engaged. The Gemini path
(`tools/gen.mjs`) was not called.

## No faces

There are no people depicted anywhere on this site, drawn or photographed. The
two named growers on `field.html` appear as text only.

## What is computed and what is written

The gate computes every figure it shows from the stock array: the headline, the
tally, each failure reason, the cold margin in °C and the recommended first
plant. The lifting calendar on `field.html` derives each row from that plant's
own dormancy window. The order sheet derives every line and the stock total
from the same prices printed on `catalogue.html`, so the two cannot drift apart.

The order sheet composes a specification and hands it to a mail client. There
is no backend, nothing is submitted, no card field exists anywhere on the site,
and the page says so rather than implying a checkout.
