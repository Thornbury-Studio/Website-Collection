# APOGEE — image and footage provenance

APOGEE is a **fictional business**. The company, its four bases, its
programme, its prices, its phone number and every figure on the site are
original to this template. The aircraft types named (Global 7500, Praetor
600, Challenger 350, Phenom 300E) are real products of their manufacturers,
referred to by name the way any operator's site would; no manufacturer's
imagery, logo or copy is used, and the headline figures quoted for each
are the public ones, rounded down. No real charter operator's identity,
livery or marketing is used or implied.

## Footage — licensed Adobe Stock (free tier)

Five clips were searched, licensed and downloaded on **15 September 2026**
through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated footage or imagery is used anywhere on
this template. Every export is cut, graded and encoded from the licensed
master, never from a preview.

| File | Adobe Stock ID | Master | Used as |
|---|---|---|---|
| `video/wing.mp4`, `img/wing-poster.webp` | 470419800 | 3840×2160 ProRes | The climb, middle — a private-jet wing in cloud. The master was shot on descent; it is played backwards, so the wing rises out of it |
| `video/deck.mp4`, `img/deck-poster.webp` | 589794660 | 3840×2160 ProRes | The climb, top — a cloud deck from far above |
| `video/cabin.mp4`, `img/cabin-poster.webp` | 301279898 | 3840×2160 H.264 | Home — the cabin, a slow pan along cream leather and the windows |
| `video/host.mp4`, `img/host-poster.webp` | 846924700 | 2160×3840 H.264 | Home — the host, walking the cabin toward the camera (portrait) |
| `video/apron.mp4`, `img/apron-poster.webp` | 175646036 | 4096×2304 MJPEG | Request page hero — a jet on the apron, waiting |

Exports are H.264 at 1920×1080 (1080×1920 for the portrait clip), crf 23–24.
Sky and cabin footage is low-entropy and encodes small: the five clips
together weigh under 13 MB, and only the two climb layers load on the home
page's first screen.

## Photography — licensed Adobe Stock (free tier)

Ten photographs, same day, same terms. Originals ran 3 750–7 360 px on the
long edge; every export is downsampled from the licensed file.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/apron.webp`, `-1400`, `-800` | 165963897 | Home hero, and the ground layer the climb lifts away from — a large-cabin jet on the apron, stairs down |
| `img/approach.webp`, `-1400`, `-800` | 631923686 | Fleet page hero — a business jet on final approach |
| `img/night.webp`, `-1400`, `-800` | 921816819 | Programme page hero — a wing over a snowy runway at night |
| `img/stairs.webp`, `-1200`, `-800` | 330061589 | Licensed and graded; not placed — see below |
| `img/gear.webp`, `-900` | 232690415 | Fleet page — the nose gear with the streamer still on (cropped to 16:10) |
| `img/seat.webp`, `-900` | 297618980 | Licensed and graded; not placed — see below |
| `img/cabin.webp`, `-1200`, `-800` | 311310903 | Licensed and graded; not placed — see below |
| `img/table.webp`, `-1200`, `-800` | 479398762 | Licensed and graded; not placed — see below |
| `img/shade.webp`, `-1400`, `-800` | 482312066 | Home — discretion: the host bringing the shade down |
| `img/service.webp`, `-1400`, `-800` | 346134202 | Request page — the panoramic band: the host laying a table |
| `img/og.webp` | 165963897 | 1.91:1 crop of the apron plate |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/apogee-charter-sm.webp` | — | 960×600 homepage screenshot for the hub card |

## Map data

The dot-matrix world on the fleet page is drawn from `js/landgrid.js`, a
240×120 land grid baked from **Natural Earth 110m land polygons (public
domain)**. The grid was generated for this collection's `logistics-northline`
template by its `src/build-landgrid.mjs` and is reused here unchanged under a
different global name. Great-circle arcs, distances and the city list are
computed in `js/data.js`; the coordinates are those of each city's
business-aviation airport where one exists.

## The grade

The site is bone and ink, and the photographs are asked to be quiet.
`tools/grade.mjs` and `tools/encode.mjs` run one pass on every plate and
clip: colour pulled to about two thirds, contrast eased rather than pushed,
blacks lifted a touch so nothing on the page is harder than the type, and
a little blue in the shadows so an apron, a cabin and a night runway read
as one temperature. The cabin plates keep their warmth in the highlights —
cream leather is the one warm thing the brand owns — at saturation 0.72–0.74
against 0.60–0.66 elsewhere. The apron clip arrived heavily teal-graded
and is pulled the furthest, to 0.55.

The wing clip (470419800) is the one deliberate edit: the master is a
descent into cloud, and the climb needs the opposite, so it is reversed in
the encode. Nothing else is composited, generated or altered beyond the
grade and the crop.

## Faces

Three plates carry a person. The host in `host.mp4` is a licensed model
photographed and released for this use; she is the point of the section
and is shown as herself. The host in `shade` is in profile, and the pair in
`service` are a laid table with a guest beside it. No face is used as a
stand-in for a named person, because no person on this site is named.

## Generated imagery

None. This template was briefed as stock-only. No image-generation or
video-generation tool was called at any point, and no credits were spent.

## What was licensed and what is still open

Fifteen assets were licensed; eleven are on a page. Four stills —
`stairs`, `seat`, `cabin` and `table` — were licensed for a cabin-detail
band on the fleet page and set aside when that page settled on the cabin
plans and the nose-gear plate instead. They are graded and in `img/`, and
they are the right plates for a "the cabin, in detail" section if one is
added; nothing else on the free tier is as clean.

What the set does not have, and would want next:

- **The fleet in its own livery.** Every airframe here is somebody else's,
  in white. A consistent branded fleet is the whole VistaJet truth and the
  one thing stock cannot supply; a client build would shoot it.
- **A base at night.** Farnborough after dark, a car at the stairs, would
  carry the discretion section better than the shade.
