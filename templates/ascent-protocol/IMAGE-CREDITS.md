# ASCENT — image and footage provenance

ASCENT is a **fictional business**. The company, its cohorts, its fee, its
dates, its email addresses and every quotation on the site are original
to this template. No real coaching practice's identity or marketing is
used or implied. The brief's reference image was not licensed and is not
reproduced: no frame on this site is that photograph or a recreation of
it; the mood was matched with separately sourced, licensed plates.

## Footage — licensed Adobe Stock (free tier)

Four clips were searched, previewed through their public preview
renditions, licensed and downloaded on **16 September 2026** through the
Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false`. Every export is cut, graded, looped and encoded from
the licensed master, never from a preview.

| File | Adobe Stock ID | Master | Used as |
|---|---|---|---|
| `video/ridge.mp4`, `-sm`, `img/ridge-poster.webp` | 476256403 | 3840×2160 H.264 | Home hero: fog rolling over a dark fir ridge |
| `video/fog.mp4`, `img/fog-poster.webp` | 513769794 | 3840×2160 H.264 | The decision: the fog layer that clears |
| `video/storm.mp4`, `-sm`, `img/storm-poster.webp` | 393401933 | 4096×1716 ProRes | Protocol page hero: a storm inversion over snow ridges |
| `video/road.mp4`, `-sm`, `img/road-poster.webp` | 564302069 | 3840×2160 ProRes | Apply page: walking the road |

Exports are H.264 at 1920 wide (1280 for the fog, which sits behind glass),
crf 24–27, with a 960-wide version for phones. Every clip is a seamless
loop: the tail is cross-faded into the head (see `tools/encode.mjs`). The
four clips together weigh under 12 MB.

## Photography — licensed Adobe Stock (free tier)

Fourteen photographs, same day, same terms. Originals ran 3 362–6 800 px
on the long edge; every export is downsampled from the licensed file.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/decide.webp`, `-1400`, `-800` | 404347410 | The decision: the sharp plate the fog clears from |
| `img/ridge.webp`, `-1400`, `-800`, `img/og.webp` | 158124758 | Field notes band; share image |
| `img/focus.webp`, `-900`, `-600` | 265070919 | Pillar 01, Focus: one peak out of the fog |
| `img/discipline.webp`, `-900`, `-600` | 556647321 | Pillar 02, Discipline: a snow face |
| `img/consistency.webp`, `-900`, `-600` | 318232485 | Pillar 03, Consistency: a figure walking a ridge above cloud |
| `img/repetition.webp`, `-900`, `-600` | 486490296 | Pillar 04, Repetition: ridges into haze |
| `img/above.webp`, `-900`, `-600` | 416717019 | Protocol page closing band |
| `img/storm.webp`, `-1400`, `-800` | 947281776 | Under pressure band |
| `img/hand.webp`, `-900` | 399273737 | The week: a chalked hand on a hold |
| `img/horn.webp`, `-1400`, `-800` | 473879093 | Protocol page band |
| `img/towers.webp`, `-1400`, `-800` | 489887303 | Protocol page band |
| `img/stand.webp`, `-1400`, `-800` | 235455328 | Home closing band |
| `img/haze.webp`, `-1400`, `-800` | 482009068 | Apply page closing band |
| `img/road.webp`, `-1400`, `-800` | 291223274 | Licensed and graded; not placed |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/ascent-protocol-sm.webp` | — | 960×600 homepage screenshot for the hub card |

## The grade

One temperature for everything (`tools/grade.mjs`, `tools/encode.mjs`):
saturation pulled to 0.38–0.6, contrast eased up, gamma just under one,
cool shadows and a little warmth in the highlights. Three plates that
arrived pale (the focus peak, the misty layers, the road) are pulled darker
than the rest so they sit in the page.

## Faces

Two plates carry a person, both from behind and unrecognisable: the walker
on the road (`road.mp4`) and the figure seated above the cloud (`above`).
The walker on the ridge (`consistency`) is a few pixels tall. No face is
used as a stand-in for a named person; no person on this site is named.

## Generated imagery

None. No image-generation or video-generation tool was called at any
point, and no credits were spent.

## Open

- **A coach.** The site deliberately names nobody. A client build would
  want one portrait, shot, not stocked.
- **A room.** The Monday review happens "in the room in Singapore or
  London"; a plate of that room would carry the *How it's run* section
  better than a spec table alone.
