# ARDVREN — image provenance

ARDVREN is a **fictional business**. Loch Ardvren, Loch Ardvren Estate Ltd,
the Steading sales office and its address, the phone number, Fiona Kerr and
Callum Reid, the forty plots, the three lodge designs, every price, covenant,
date and hour on the site are original to this template. No real estate's
identity, imagery, product names or prices are used. The places in the
photographs are real; the estate that claims them is invented.

## Photography — licensed Adobe Stock (free tier)

Twenty-seven photographs and three video clips were searched, licensed and
downloaded on **16 September 2026** through the Adobe Stock connector,
free-tier assets only (licence state `just_purchased`, no credit cost). Every
asset was checked to be `isGenTech: false` — no AI-generated imagery is used
anywhere on this template. Originals ran 3 840–8 192 px on the long edge;
every export is cropped, graded and downsampled from the full-resolution
licensed file by `tools/grade.py`, never from a search thumbnail. Nothing
licensed is unused.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 449691027 | `hero-forest`, `hero-forest-tall`, `og` | Home hero slide 2 (desktop and phone crops); social card on every page |
| 1442873552 | `band-river`, `band-river-tall` | Home, "What you own / what you don't" band |
| 556571655 | `tile-pine` | Home, "Three hundred years, kept" tile |
| 654228867 | `tile-owners` | Home, "Phase 1, occupied" tile |
| 403233677 | `band-aerial`, `band-aerial-tall`, `hero-aerial`, `hero-aerial-tall`, `head-plots`, `head-plots-tall` | Home hero slide 3 and "Twenty-four plots" band; Plots page header and model fallback |
| 541577575 | `lodge-bothy` | Home lodge tile; Lodges page (sheet and configurator card) |
| 447487886 | `lodge-pine`, `hero-pine`, `hero-pine-tall` | Home hero slide 4 and lodge tile; Lodges page (sheet, configurator card and summary) |
| 982533832 | `lodge-ridge` | Home lodge tile; Lodges page (sheet and configurator card) |
| 1169072572 | `lodge-winter`, `hero-winter`, `hero-winter-tall` | Home hero slide 5; Lodges page, "Winter" tile |
| 536497028 | `lodge-interior` | Lodges page, "Inside" tile |
| 1550187324 | `lodge-sauna` | Lodges page, "Shore sauna" tile |
| 321301016 | `tile-coffee` | Lodges page, "Owners since 2024" tile; Visit page, "Open morning" tile |
| 622840542 | `head-lodges`, `head-lodges-tall` | Lodges page header |
| 330710261 | `plot-woodland` | Home and Plots page, Woodland tile |
| 322590478 | `plot-ridge` | Home and Plots page, Ridge tile |
| 331163795 | `plot-lochside` | Home and Plots page, Lochside tile |
| 305418681 | `head-visit`, `head-visit-tall` | Visit page header |
| 283568656 | `person-fiona` | Visit page, Fiona Kerr |
| 425530290 | `person-callum` | Visit page, Callum Reid |
| 186908592 | `g-deer` | Home gallery, October |
| 565132524 | `g-swim` | Home gallery, May |
| 493083492 | `g-winter` | Home gallery, January |
| 311495973 | `g-boat` | Home gallery, September |
| 524696543 | `g-boats` | Home gallery, November |
| 635653950 | `g-heather` | Home gallery, August |
| 605778258 | `g-fire` | Home gallery, June |
| 244621165 | `g-snow` | Home gallery, February |
| `img/favicon.svg`, `img/ornament.svg` | — | Drawn, not licensed (the ornament is a generated contour-ring pattern) |

## Film — licensed Adobe Stock (free tier)

Three clips, licensed the same day and on the same terms, each trimmed to the
ten or twelve seconds that loop best, scaled from the 4K master to 1280 × 720,
graded to sit with the stills and encoded H.264 by `tools/grade.py --video`.
A poster frame is pulled from each export.

| Adobe Stock ID | Master | Exported as | Used on |
|---|---|---|---|
| 326369057 | 3840 × 2160 H.264, 25 s | `video/film-loch.mp4`, `film-loch-poster`, `hero-loch`, `hero-loch-tall` (a 4K frame of the master) | Home hero slide 1 (the clip on wide screens, the frame elsewhere); film chapter 2 |
| 305032392 | 3840 × 2160 MJPEG, 30 s | `video/film-forest.mp4`, `film-forest-poster` | Home film band loop; film chapter 1 |
| 141091178 | 3840 × 2160 ProRes HQ, 30 s | `video/film-shore.mp4`, `film-shore-poster` | Lodges page header (wide screens); film chapter 3 |

The 3D model on the Plots page is drawn in three.js from the plot schedule;
it uses no imagery.

The full-resolution originals live in `tools/raw/` on the build machine and
are gitignored; `tools/grade.py` documents every crop and the grade.
