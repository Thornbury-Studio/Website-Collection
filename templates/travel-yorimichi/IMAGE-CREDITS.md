# YORIMICHI — image and video provenance

YORIMICHI is a **fictional business**. Yorimichi Travel Pte. Ltd., the Duxton
Hill office, the licence number, the three tour leaders, the eight tours,
their dates, prices and every review on the site are original to this
template. No real tour operator's identity, imagery, product names or prices
are used. The places in the photographs are real; the itineraries that visit
them are invented.

## Photography — licensed Adobe Stock (free tier)

Eighteen photographs were searched, licensed and downloaded on **15 September
2026** through the Adobe Stock connector, free-tier assets only (licence
state `just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this
template. Originals ran 4 928–9 504 px on the long edge; every export is
cropped and downsampled from the full-resolution licensed file, never from a
search thumbnail.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 241334776 | `hero-kyoto`, `hero-kyoto-tall`, `plate-fushimi`, `og` | Home hero slide 1; Golden Route and Inland Sea galleries; gallery page; social card |
| 335263778 | `hero-tokyo`, `hero-tokyo-tall`, `plate-shibuya` | Home hero slide 2; Golden Route, Sakura, Tokyo and Fuji galleries; gallery page |
| 66949015 | `hero-miyajima`, `hero-miyajima-tall`, `tour-inland-sea-card`, `tour-inland-sea-wide` | Home hero slide 3; Hiroshima & the Inland Sea card and header; gallery page |
| 301061444 | `hero-shirakawa`, `hero-shirakawa-tall`, `plate-shirakawa` | Home hero slide 4; home gallery strip; Snow Country and Onsen galleries; gallery page |
| 270204267 | `hero-fuji`, `hero-fuji-tall`, `tour-fuji-lakes-card`, `tour-fuji-lakes-wide` | Home hero slide 5; Fuji & the Five Lakes card and header; gallery page |
| 309757748 | `tour-golden-route-card`, `tour-golden-route-wide` | The Golden Route card and header; Sakura gallery; gallery page |
| 312548943 | `tour-kyoto-autumn-card`, `tour-kyoto-autumn-wide` | Kyoto in Autumn card and header; gallery page |
| 316939084 | `tour-sakura-card`, `tour-sakura-wide` | Sakura Season card and header; gallery page |
| 323976191 | `tour-snow-country-card`, `tour-snow-country-wide` | Snow Country card and header; gallery page |
| 1027066035 | `tour-onsen-card`, `tour-onsen-wide` | Onsen & Ryokan Retreat card and header; gallery page |
| 611202634 | `tour-tokyo-dark-card`, `tour-tokyo-dark-wide` | Tokyo After Dark card and header; gallery page |
| 203493494 | `plate-torii-umbrella` | Tours page header; home gallery strip; Kyoto in Autumn gallery; gallery page |
| 322528078 | `plate-nara-deer` | Home gallery strip; Kyoto in Autumn and Sakura galleries; gallery page |
| 394064502 | `plate-toji-pagoda` | Gallery page header; home gallery strip; Kyoto in Autumn gallery; gallery page |
| 417120402 | `plate-private-onsen` | Snow Country, Onsen and Fuji galleries; gallery page |
| 281660858 | `plate-kyoto-lane`, `thumb-kyoto-lane` | Contact page header; home gallery strip; about page; Golden Route, Tokyo and Inland Sea galleries; gallery page |
| 356015840 | `plate-travellers`, `thumb-travellers` | About page header and rules plate; Snow Country, Onsen, Tokyo and Inland Sea galleries; gallery page |
| 249311815 | `plate-milkyway` | Home film band background; gallery page |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/travel-yorimichi-sm.webp` | — | 960×600 homepage screenshot for the hub card |

Every licensed frame appears on at least one page; nothing was licensed and
left unused. The night-sky plate (249311815) is not captioned with a place on
the site, because the photograph does not show one.

## Video — licensed Adobe Stock (free tier)

Two clips were licensed the same day, also free-tier and `isGenTech: false`,
and downloaded as the full-resolution masters (one 4K ProRes HQ at 945 MB,
one 4K H.264 at 65 MB). They are the two chapters of the film on the home
page, played in a dialog on request — nothing autoplays.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 340124809 | `video/film-fushimi.mp4`, `img/film-fushimi-poster.webp` | Chapter one, Fushimi Inari — 9 s, 1280×720 |
| 239698022 | `video/film-fuji.mp4`, `img/film-fuji-poster.webp` | Chapter two, Fuji from Kawaguchiko — 8 s, 1280×720; poster also in the Fuji tour gallery |

## The grade

Stock travel photography arrives saturated and cheerful, and this site is
night indigo with one vermilion. `tools/grade.py` gives every plate the same
treatment: the black point is lifted into the page ground (`#0B0F1A`) so a
photograph's shadows and the page read as one surface, saturation comes down
to 82%, and a gentle S-curve puts the contrast back. The torii vermilion
survives the desaturation on purpose; it is the accent colour of the site.

Each plate is exported at the crops the pages actually use — 16:9 at 1 920 px
for the hero slider, 4:5 at 900 px for the same slides on a phone (a taller
composition, not a squeezed desktop frame), 3:4 at 720 px for the tour cards,
3:2 at 1 600 px for headers and galleries. Every photograph that fills the
viewport — the five slides, the page headers, the tour headers and the film
band — also ships a 2 560 px export (and the phone crops a 1 400 px one),
offered through `srcset` so a 2× screen gets a file that is sharp at its
size while a 1× screen never downloads it. All exports are WebP through
Pillow at quality 70–76, Lanczos downsample. The clips are re-encoded with
ffmpeg (libx264, CRF 25, the same saturation pull) at 1280×720 with the
audio track dropped.

Raw originals live in `tools/raw/` on the build machine and are not shipped.

## Faces

Three plates carry readable faces: the traveller in the Kyoto lane, the
three friends in Kanazawa, and the woman in the floral kimono on Sannenzaka.
All are licensed frames of models photographed and released for exactly this
use; the guest in the red coat at Ginzan Onsen is photographed from behind.
The three named tour leaders on the about page have initials, not
photographs.

## Generated imagery

None. No image- or video-generation tool was called at any point.
