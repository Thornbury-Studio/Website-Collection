# IMAGE-CREDITS — REDLINE.

Every picture on this site is a real photograph or real filmed footage,
licensed, checked as it was added (DARK.md §2). The free libraries were
searched first and were enough: Pexels (photos and 4K video), with Pixabay,
Mixkit and Coverr also searched (Mixkit and Coverr had no usable unbranded
hardware footage; Pixabay's one strong 4K fan clip is the same clip Pexels
carries as 856084). Nothing paid, nothing generated, nothing lifted from
another brand's site. No frame shows a face.

**Licence — Pexels License:** free for commercial use, no attribution
required, no model or property release implied; not to be sold unaltered or
used to imply endorsement. Credited here anyway.

Masters live in `tools/raw/` (gitignored) and every served file is re-derived
by `python tools/media.py` (one grade for all of them — see DESIGN.md §2).

## Sourcing rule that decided the set

No legible third-party mark at the size the site shows it, checked on
full-resolution frames, not search thumbnails. PC hardware is covered in
logos, so this rejected most of what the searches returned: every GPU shot
with GEFORCE / RTX lettering (Pexels 34552790, 34552794, 34552800 and the
Zotac series 6704936–6704967), every pump with an NZXT or ARCTIC screen or
badge (34552789, 34552800, 11047218, 11047223), a Gigabyte-printed board
behind mesh (8108683), and a whole rig series by Atahan Demir (33356254,
33356261) whose cooler reads "FROZN" and whose speaker carries a logo. Crops
below remove the rest.

## Films — 4K masters, 3840×2160

| Served as | Pexels video · by | Page | Crop and why |
|---|---|---|---|
| `film/rig*.mp4`, `rig-poster.webp` | [30470985](https://www.pexels.com/video/30470985/) · Atahan Demir, 24 fps | index hero | 2380×1338 from x 1382: the monitor (third-party artwork on screen) is cropped out, left |
| `film/air*.mp4`, `air-poster.webp` | [30470981](https://www.pexels.com/video/30470981/) · Atahan Demir, 24 fps | index "No water", airflow hero | 2380×1338 from x 1459: monitor cropped out |
| `film/tower*.mp4`, `tower-poster.webp` | [30470983](https://www.pexels.com/video/30470983/) · Atahan Demir, 24 fps | order hero | the tower only, 1728×972 from x 2112 |
| `film/boot*.mp4`, `boot-poster.webp` | [3108007](https://www.pexels.com/video/3108007/) · Silviu Din, 25 fps | order "nine days" | a 2740×960 band at y 1200: the POST-code display; the board's model silkscreen is cropped out above. Graded almost to monochrome — it's lit blue end to end |
| `film/fan/l/`, `film/fan/s/` (75 frames), `js/fan-data.js` | [856084](https://www.pexels.com/video/856084/) · uploaded by Pixabay (also Pixabay 8064), 25 fps | index stage | 1.40–4.40 s: the fan dead and grey, powering up, lit and spinning. Square 2160 crop on the hub |

The three Atahan Demir films are one rig from three angles, used on three
pages on purpose: it is the product, and it should read as one machine.
Each loop is 9–12 s, graded, with its last second dissolved into its first,
no audio, H.264, 1920 px (960 px for phones).

## Stills — each on one page only

| File | Pexels · photographer | Page | Notes |
|---|---|---|---|
| `img/card.webp` | [34552809](https://www.pexels.com/photo/34552809/) · Matheus Bertelli | gx9900 hero | the GX9900. No marks in frame |
| `img/card-side.webp` | [34552811](https://www.pexels.com/photo/34552811/) · Matheus Bertelli | index "The card" | same card, the other photograph of it; left 22 % cropped to remove an "RTX" wordmark |
| `img/chips.webp` | [36169774](https://www.pexels.com/photo/36169774/) · Jakub Pabis | gx9900 memory | part numbers only, no maker marks |
| `img/trace.webp` | [3520679](https://www.pexels.com/photo/3520679/) · Miguel Á. Padriñán | gx9900 power | |
| `img/fins.webp` | [6704966](https://www.pexels.com/photo/6704966/) · Sergei Starostin | gx9900 heat | the card's edge; the maker's name on this series is out of frame in this one |
| `img/red-fan.webp` | [2643596](https://www.pexels.com/photo/2643596/) · Dave Morgan | airflow arithmetic | right 28 % cropped: memory-module labels |
| `img/blades.webp` | [6636472](https://www.pexels.com/photo/6636472/) · Sergei Starostin | airflow loop | |
| `img/sink.webp` | [3520696](https://www.pexels.com/photo/3520696/) · Miguel Á. Padriñán | airflow noise | |
| `img/stripes.webp` | [2100918](https://www.pexels.com/photo/2100918/) · Brett Sayles | airflow dust | graded harder (lilac highlights) |
| `img/service.webp` | [31854230](https://www.pexels.com/photo/31854230/) · Anete Lusina | order service | hands only |
| `img/gold.webp` | [37005283](https://www.pexels.com/photo/37005283/) · ed br | order power | |

Considered and dropped after download: Pexels 9965285 ("Golden Shining
Graphic Boards") — from an account that posts 3D abstract art, so likely a
render rather than a photograph; this site uses photographs only.

## Derived

- `img/og.jpg` — a capture of this site's own index hero at 1440×900,
  cropped to 1200×630.
- `../../img/pc-redline-dark-sm.webp` — 480×300 hub thumbnail from the same
  capture.
