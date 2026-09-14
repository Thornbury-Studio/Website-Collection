# ANORAK — image provenance

ANORAK is a **fictional business**. Garrow Mill, Ardsleigh, the four cloth
codes, the six garments, the prices, the mills, the fourteen testers and every
figure on the site are original to this template. No real apparel brand's
identity, imagery, product names or prices are used.

## Photography — licensed Adobe Stock (free tier)

Six photographs were searched, licensed and downloaded on **15 September 2026**
through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this
template. Originals ran 5 447–7 952 px on the long edge; every export is
downsampled from the full-resolution licensed file, never from a search
thumbnail.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/hero.webp`, `img/hero-700.webp` | 119340115 | Hero — a runner from directly overhead on asphalt |
| `img/cold.webp`, `img/cold-900.webp` | 94696729 | Conditions wipe, cold half — snow and pines |
| `img/shell.webp`, `img/shell-600.webp` | 94696729 | The same frame cut 4:5 for the Crosswind product page |
| `img/warm.webp`, `img/warm-900.webp` | 135651719 | Conditions wipe, warm half — dust and hard sun (also `fabric.html`) |
| `img/fabric.webp`, `img/fabric-1000.webp` | 1807110477 | The ultramarine plate — a polyester knit macro |
| `img/field.webp`, `img/field-900.webp` | 217723500 | Field notes — a runner on a gravel climb |
| `img/detail.webp`, `img/detail-600.webp` | 466481959 | Sizing and the range page — legs and shoes on dirt |
| `img/og.webp` | 119340115 | 1.91:1 crop of the graded hero |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/tempo-anorak-sm.webp` | — | 960×600 homepage screenshot for the hub card |

Two exports share one licence (94696729): `cold` is the 16:9 landscape half of
the conditions wipe, `shell` is the same frame cut 4:5 and held tighter on the
runner, because it is the only licensed frame in the set where somebody is
actually wearing a shell.

## The grade

Stock running photography arrives saturated and cheerful — that is what the
libraries reward — and this site is bone, ink and one ultramarine. `tools/grade.mjs`
runs one ffmpeg pass per plate: contrast up a little, saturation down a lot,
blue lifted into the shadows. What survives is the subject and the weather
rather than whoever shot it.

Three plates are deliberate exceptions.

`warm` and `cold` are the two halves of one interactive frame, so they are the
only pair that must *disagree*: warm keeps its amber (pulled back far enough
to stop it fighting the blue, and no further), cold keeps its blue, and both
are graded to the same contrast and black point so the seam reads as weather
rather than as two different photographs.

`fabric` is not a photograph on the page at all. It is flattened to luminance,
pushed hard on contrast, and mapped through an ultramarine ramp
(`lutrgb`), so the blue plate in the middle of the site is literally a picture
of the cloth.

`detail` had red trainers in it. The accent on this site is one blue; a second
loud colour in a supporting plate would have made it two, so the reds are cut
at the source with `selectivecolor` before the standard pass.

The hero is the one plate that needed a denoise: fresh asphalt is sensor noise
as far as WebP is concerned, and ungraded it cost over a megabyte at display
width. `hqdn3d` plus a light blur removes grain the reader cannot see at
1 200 px anyway, and `unsharp` puts the figure's edges back.

All exports are WebP through `libwebp` at `-quality 58–78`,
`-compression_level 6`, Lanczos downsample. Raw JPEGs live in `tools/raw/` on
the build machine and are not shipped.

## Faces

There is one readable face on the site — the trail runner in `warm`, at
distance and in a cap — and it is a licensed frame of a model who was
photographed and released for exactly this use. Every other athlete plate is
shot from overhead, from behind, or cropped below the shoulders. That is a
composition preference, not a rule: an apparel brand sells on the body wearing
the garment, and a licensed athlete photograph is the honest way to show one.

## Generated imagery

None. This template was briefed as stock-only and no image-generation tool was
called at any point. No video was generated.

## What was licensed and what was wanted

All six intended plates were licensed without hitting a limit. Had the budget
gone further, the set was short of two things it would have used:

- **A garment-only still** — a flat-lay or hanger shot of a shell — so the
  product page could show the thing being sold rather than a person wearing
  one like it. Free-tier stock has no apparel photography that could pass as a
  fictional brand's own product.
- **A second cold frame with a different runner**, so the conditions wipe could
  hold the same subject on both sides of the seam and read as one person
  changing clothes rather than two photographs meeting.
