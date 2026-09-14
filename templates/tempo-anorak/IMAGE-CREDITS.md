# ANORAK — image provenance

ANORAK is a **fictional business**. Garrow Mill, Ardsleigh, the four cloth
codes, the six garments, the prices, the mills, the fourteen testers and every
figure on the site are original to this template. No real apparel brand's
identity, imagery, product names or prices are used.

## Photography — licensed Adobe Stock (free tier)

Eight photographs were searched, licensed and downloaded on **15 September
2026** through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this
template. Originals ran 2 957–7 952 px on the long edge; every export is
downsampled from the full-resolution licensed file, never from a search
thumbnail.

Six were licensed in the first pass. Two more were added afterwards to close
the two gaps the first pass left open — a garment-only studio shot, and a cold
frame that agrees with the warm one.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/hero.webp`, `img/hero-700.webp` | 119340115 | Hero — a runner from directly overhead on asphalt |
| `img/cold.webp`, `img/cold-900.webp` | 134774006 | Conditions wipe, cold half — a runner on a snow path through bare trees |
| `img/shell.webp`, `img/shell-600.webp` | 130239977 | The Crosswind product plate — a hooded windbreaker, studio |
| `img/snow.webp`, `img/snow-900.webp` | 94696729 | Fabric page — snow and pines |
| `img/warm.webp`, `img/warm-900.webp` | 135651719 | Conditions wipe, warm half — dust and hard sun (also `fabric.html`) |
| `img/fabric.webp`, `img/fabric-1000.webp` | 1807110477 | The ultramarine plate — a polyester knit macro |
| `img/field.webp`, `img/field-900.webp` | 217723500 | Field notes — a runner on a gravel climb |
| `img/detail.webp`, `img/detail-600.webp` | 466481959 | Sizing and the range page — legs and shoes on dirt |
| `img/og.webp` | 119340115 | 1.91:1 crop of the graded hero |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/tempo-anorak-sm.webp` | — | 960×600 homepage screenshot for the hub card |

94696729 was the cold half of the conditions wipe in the first pass, and was
also cropped 4:5 to stand in as the Crosswind product plate. Both jobs have
since been done properly by frames chosen for them, so it now appears once, as
the mid-page plate on `fabric.html`. It is licensed and it is in use; nothing
was licensed and thrown away.

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

The two halves of the conditions wipe are a matched pair by selection, not by
grading: one male runner toward the camera at the same subject scale and
camera height, in open landscape, in each of the two climates. 134774006
replaced the original cold frame, which was a different person running away
from the camera and read as a second photograph rather than a second morning.

The cold runner's jacket is red in the original and is knocked down to a muted
brick, the same treatment `detail` gets. Recolouring it to the brand's Signal
blue was tried and rejected: every method that moved the jacket far enough —
a red/blue channel swap, a hue rotation, a selective-colour push — took his
face with it and turned the skin cyan.

`shell` is the one plate where that recolour is safe, because it is a studio
shot with nothing saturated in it but the garment. A red/blue channel swap
turns the jacket ultramarine and leaves a neutral background exactly where it
was, which is how a red windbreaker becomes the Signal colourway. Its white
studio ground is then mapped onto `--paper`, and the frame is padded — not
cropped — out to 4:5 in the same colour, so the jacket floats on the page
instead of sitting in a white box. Sampled against the page ground either side
of the divider, the plate reads `#F3F1ED` to the page's `#F2F1ED`.

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

## What was licensed and what is still missing

All eight plates were licensed without hitting a limit, including the two the
first pass flagged as gaps — the garment-only studio shot and the matched cold
frame. Both are now in place.

What the set still does not have, and would want next:

- **The other five garments as studio shots.** Only Crosswind has a product
  plate, which is why it is the only piece with a page of its own. A
  free-tier search turns up no singlet, tight, grid fleece or five-panel cap
  clean enough to pass as one brand's own product photography, and a range
  page that showed one garment and five gaps would be worse than the
  typographic listing it has.
- **A second colourway of the Crosswind.** Ink and Bone are selectable and
  correct in the spec line, but the plate does not change with them. One more
  studio frame of the same jacket, or the same frame recoloured a second time,
  would close that.
