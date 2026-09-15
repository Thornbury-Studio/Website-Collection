# REDOUT — image and footage provenance

REDOUT is a **fictional business**. The league, the eight teams, the sixteen
pilots, the eight venues, the results, the prices and every figure on the
site are original to this template. No real racing league, team, pilot or
venue is used or implied; the pilots' names were invented for this template
and any resemblance to a real FPV racer is accidental.

## Footage — licensed Adobe Stock (free tier)

Five clips were searched, licensed and downloaded on **15 September 2026**
through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated footage or imagery is used anywhere on
this template. The masters are ProRes at 2160×3840 (three portrait feeds),
4096×2160 (the bench) and 3840×2160 (the pitch); every export is cut, graded
and encoded from the full-resolution licensed master, never from a preview.

| File | Adobe Stock ID | Master | Used as |
|---|---|---|---|
| `video/wall-a.mp4`, `img/wall-a-poster.webp` | 1124840956 | 2160×3840 ProRes | Feed 01 of the wall — a low run down a warehouse aisle, yellow floor lines |
| `video/wall-b.mp4`, `img/wall-b-poster.webp` | 817944064 | 2160×3840 H.264 | Feed 02 of the wall — under the trusses of a railway bridge |
| `video/wall-c.mp4`, `img/wall-c-poster.webp` | 1124833486 | 2160×3840 ProRes | Feed 03 of the wall — through an open logistics hall |
| `video/pit.mp4`, `img/pit-poster.webp` | 583562226 | 4096×2160 ProRes | The pit — a racing frame on the bench from overhead (cropped to 16:9) |
| `video/posts.mp4`, `img/posts-poster.webp` | 554398903 | 3840×2160 ProRes | Season page hero — the run at the goalposts and the dive under them |

Each feed on the wall is 9.5 seconds of the master where the flight is
lowest and the structure closest, looped. Exports are H.264 at 1080×1920
for the portrait feeds and 1920×1080 for the two landscape clips — a feed
column is never wider than a third of the screen, so 1080 across it is
already more than a 4K monitor can show. The three feeds together weigh
about 29 MB on a desktop; a phone loads one.

## Photography — licensed Adobe Stock (free tier)

Six photographs, same day, same terms. Originals ran 3 771–6 048 px on the
long edge; every export is downsampled from the licensed file.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/sport.webp`, `-1400`, `-800` | 367998622 | Home — the plate behind the four numbers: a racing quad lifting off in its own dust |
| `img/flight.webp`, `-1400`, `-800` | 658942409 | Pilots page hero — a racing quad in the air, side on |
| `img/paddock.webp`, `-1200`, `-800` | 171413510 | Season page — the race-morning band: a red frame on a trestle table, three pilots in goggles behind it |
| `img/hands.webp`, `-1200`, `-800` | 141008011 | Tickets page hero — hands on a transmitter (cropped to 16:9) |
| `img/goggles.webp`, `-1000` | 545405593 | Pilots page — a pilot in goggles, in profile |
| `img/parts.webp`, `-900` | 695078236 | Home — the bench plate: props, a motor, the tools |
| `img/og.webp` | 367998622 | 1.91:1 crop of the dust plate |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/redout-circuit-sm.webp` | — | 960×600 homepage screenshot for the hub card |

## The grade

The palette is black, paper and one red, and the red is reserved for the
brand: buttons, hazard bands, armed gates, the veil that floods the edge of
the screen under hard scrolling. So the footage and the photographs give
their colour up. `tools/encode.mjs` and `tools/grade.mjs` run the same pass
on every clip and plate — saturation to a third, contrast up, blue lifted
into the shadows, highlights left alone — which turns a rust-orange bridge,
a beige logistics hall and a golden-hour rugby pitch into one grey-steel
world. What survives is the speed. A still and a video frame on this site
are graded by the same numbers, so the page never changes temperature when
it changes medium.

One plate keeps a little more colour. `paddock` has a red racing frame on
the table, and red is the only colour this brand owns, so it is allowed to
keep some of it (saturation 0.46 against 0.30 everywhere else).

The bridge feed (817944064) is the one master that arrived as H.264 rather
than ProRes, and the one clip encoded at crf 25 rather than 23: steel
lattice against foliage is about as high-entropy as footage gets, and at
crf 23 it came out half again the size of the other two feeds for no
visible gain. All five encodes were checked at 1:1 with frame crops from
the encoded files, not from the masters.

Photographs export as WebP through `libwebp` at `-quality 70–78`,
`-compression_level 6`, Lanczos downsample, light unsharp. Masters live in
`tools/raw/` on the build machine and are not shipped.

## Faces

Two plates carry a person. The pilot in `goggles` is a licensed model
photographed and released for this use, and his goggles cover his eyes —
which is also true of every pilot at a REDOUT round. The pilots in `paddock`
are out of focus, backs to the camera, goggles on. `hands` is hands. The
feed wall has no one in it at all, because a pilot's-eye view never does.

## Generated imagery

None. This template was briefed as stock-only. No image-generation or
video-generation tool was called at any point, and no credits were spent.

## What was licensed and what is still open

All eleven assets were licensed without hitting a limit, and all eleven are
on a page. Nothing was licensed and thrown away.

What the set does not have, and would want next:

- **A gate.** There is no licensed frame of an actual LED race gate on the
  free tier; the gates on this site are drawn, in the SVG, from the course
  data. A real one would replace the dust plate on the home page.
- **A crowd at the rail.** The tickets page sells a rail position with no
  photograph of one.
