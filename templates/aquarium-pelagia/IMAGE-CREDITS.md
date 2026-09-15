# PELAGIA — image and video provenance

PELAGIA is a **fictional business**. Pelagia Aquarium Pte. Ltd., the Marina
Coastal Drive address, the licence and company numbers, the five halls, the
timetable, the ticket prices, the four experiences, the named animals and
every review on the site are original to this template. No real aquarium's
identity, imagery, names or prices are used. Several plates were shot in real
aquariums (their Adobe Stock titles say which); the building the site
describes is invented.

## Photography — licensed Adobe Stock (free tier)

Twenty-three photographs were searched, licensed and downloaded on
**16 September 2026** through the Adobe Stock connector, free-tier assets
only (licence state `just_purchased`, no credit cost). Every asset was
checked to be `isGenTech: false` — no AI-generated imagery is used anywhere
on this template. Originals ran 2 789–7 952 px on the long edge; every
export is cropped and downsampled from the full-resolution licensed file,
never from a search thumbnail.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 470743772 | `hero-window` (+ `-2560`, `-tall`, `-tall-1400`), `thumb-window`, `og` | Home hero; the deck row; gallery; social card |
| 355618012 | `head-crowd` (+ `-2560`) | Visit page header; gallery |
| 698075768 | `plate-couple`, `card-sleepover` | Sleep with the Sharks card and detail; gallery |
| 359782110 | `plate-jelly-window`, `card-jelly-window` | The deck's photograph; gallery |
| 194979177 | `plate-two-kids` | Gallery |
| 324426305 | `hall-open-ocean` (+ `-2560`) | Open Ocean hall card; gallery |
| 481863313 | `plate-sharks`, `card-shark-dive` | Shark Dive card and detail; gallery |
| 237269797 | `head-manta` (+ `-2560`) | Halls page header; gallery |
| 245369785 | `plate-rays`, `card-ray-feed` | Ray Bay Feed card and detail; gallery |
| 283556952 | `hall-jellies` (+ `-2560`) | The Jellies hall card; gallery |
| 253618291 | `plate-lilac` | Gallery |
| 244083439 | `head-nettles` (+ `-2560`) | What's on header; gallery |
| 274963144 | `plate-single-jelly` | Gallery |
| 715480698 | `hall-reef` (+ `-2560`) | Reef Edge hall card and section; gallery |
| 157134933 | `plate-reef-tank` | Gallery |
| 472535607 | `plate-clownfish` | Gallery |
| 397882008 | `plate-mandarin` | Gallery |
| 768871856 | `plate-seadragon` | Gallery |
| 702291460 | `plate-turtle` | Gallery |
| 274189038 | `plate-touch`, `card-backstage` | Behind the Glass card and detail; gallery |
| 98593678 | `head-tunnel` (+ `-2560`) | Tickets page header; gallery |
| 307545555 | `hall-seagrass` (+ `-2560`) | Seagrass & Mangrove hall card and section; gallery |
| 767065301 | `hall-penguins` (+ `-2560`) | Penguin Cove hall card and section; gallery |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/aquarium-pelagia-sm.webp` | — | 960×600 homepage screenshot for the hub card |

Every licensed frame appears on at least one page, and every exported file
is referenced by one; nothing was licensed and left unused.

## Video — licensed Adobe Stock (free tier)

Two clips were licensed the same day, also free-tier and `isGenTech: false`,
and downloaded as the full-resolution masters (4K H.264, 451 MB and 35 MB).
They play muted and looped as the background of the After Dark band on the
home page and as the media of two hall sections — only while on screen,
paused otherwise.

| Adobe Stock ID | Exported as | Used on |
|---|---|---|
| 377511324 | `video/loop-jellies.mp4`, `img/loop-jellies-poster.webp` | Home After Dark band; the Jellies section on the halls page — 12 s, 1280×720, 30 fps |
| 526482179 | `video/loop-shark.mp4`, `img/loop-shark-poster.webp` | The dive-feed band on What's on; the Open Ocean section on the halls page — 10 s, 1280×720 |

## The grade

Everything here was photographed through glass or under water, and the site
is abyss blue with ice-cyan light, so `tools/grade.py` grades lightly: the
black point is lifted into the page ground (`#050B18`) so a tank's shadows
and the page read as one surface, saturation comes down a tenth, and a gentle
S-curve puts the contrast back. The reef plates keep their colour; that is
the point of a reef hall.

Crops are the ones the pages use — 16:9 at 1 920 px for the hero and a 4:5
crop for phones, 3:2 at 1 600 px for hall headers and the gallery, 3:4 at
720 px for the experience cards. Everything that fills the viewport also
ships a 2 560 px export offered through `srcset`, so a 2× screen gets a file
that is sharp at its size while a 1× screen never downloads it. All exports
are WebP through Pillow at quality 70–76, Lanczos downsample. The clips are
re-encoded with ffmpeg (libx264, CRF 26) at 1280×720 with the audio dropped.

Raw originals live in `tools/raw/` on the build machine and are not shipped.

## Faces

Three plates carry readable faces — the woman at the reef window, the
child at the jelly porthole and the two children at the reef glass (from
behind). All are licensed frames of models photographed and released for
exactly this use. The reviews carry names, not photographs.

## Generated imagery

None. No image- or video-generation tool was called at any point.
