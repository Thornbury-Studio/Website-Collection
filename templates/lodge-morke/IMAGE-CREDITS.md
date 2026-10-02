# IMAGE-CREDITS — MØRKE

Every picture on this site is an AI generation made with the boss's explicit
approval: one film, its keyframe, and three interiors made from that keyframe. Each was checked at full
size as it was added (DARK.md §2). Masters live in `tools/raw/` (gitignored). Every
served file is re-derived by `python tools/media.py` in one grade
(`eq=gamma=0.94:saturation=1.04`).

## Why the film is generated (2026-10-02)

The brief asked for one real, licensed, filmed clip that travels from sky to
lodge. The free libraries were searched first and in full, judging every clip
from frames pulled out of it, not titles:
- **Pexels:** about 1,570 clips crawled across 18 queries and 5 pages each; 64 previewed.
- **Pixabay:** 149 previewed, many of them unlabelled AI renders.
- **Mixkit:** 29.
- **Coverr:** nothing relevant in its free set.
- **Adobe Stock's free tier:** 22. Two of those were themselves AI or CG: 819079671
  says so in its title, and 761299330 is a CG composite.

Nearly all free polar-night footage is locked-off timelapse. The few real
camera moves end on a ridge with no building (Mixkit 26990), on a lit town
(Mixkit 27020), or among trees at a branded resort (Pexels 29626867). None
could carry the mechanic. Per the brief, that went back to the boss, who chose
AI generation (DESIGN-SYSTEM/DESIGN.md §6: ask first). It was made on
Higgsfield, following VIDEO-POLICY.md: keyframe first, one image-to-video,
inspect, keep.

| Served as | Source | Notes |
|---|---|---|
| `film/descent.mp4` (1920×1072), `film/descent-s.mp4` (720×1280), `film/sky*.webp`, `film/ridge*.webp`, `film/lodge*.webp` | **Kling 3.0** image-to-video on Higgsfield, 2026-10-02. 4K (3852×2152), 24 fps, 8.04 s, 193 frames. 48 credits. Prompt enhancement and audio off | Start frame: the keyframe below. One slow tilt up from the lodge into the aurora; played **reversed** on the site. Accepted on the first generation. Mobile file is a 9:16 cut centred on the lodge. Posters are frames 0, 96 and 192 of the reversed clip |
| `img/og.jpg` (1200×630) | **Nano Banana Pro** on Higgsfield, 2026-10-02, 2752×1536, a free generation | The keyframe: an invented black-timber lodge with four lit windows, a frozen fjord, one green aurora. Checked at full size: no text, no signage, no people, no smoke. Cropped to 1200×630 |

**Rights in the generated media.** Higgsfield claims no ownership of outputs and
puts no restriction on commercial use: see the help-centre page ["Who owns my
generations and can I use them commercially"](https://higgsfield.ai/creator-hub/help-center/account-and-privacy/who-owns-my-generations-and-can-i-use-them-commercially),
checked 2026-10-02. The account is on the paid Plus plan, so the downloads carry
no watermark, which was confirmed on the files themselves. No real place,
building or brand is depicted; the lodge does not exist.

## Interiors — generated, matched to the outside

The first version used three Pexels photographs (a bedroom, 28412029; a banquet
table, 4992827; a log sauna, 5582214). The second fresh-context critic was right
that they contradicted the product:
- snowy trees in daylight outside a Svalbard window;
- a 20-plus-place wedding table for a 12-guest lodge;
- three different gradings that matched nothing outside.

They were removed. With the boss's OK, three matching interiors were generated
instead. Nothing from those Pexels files ships.

| Served as | Source | Notes |
|---|---|---|
| `img/table.webp`, `img/table-s.webp` | **Nano Banana Pro** on Higgsfield, 2026-10-02, 2752×1536, a free generation, the exterior keyframe as reference | One long table set for twelve, beeswax candles, a loaf on a board, a wood stove; a square window at the end with aurora over a treeless ridge |
| `img/room.webp`, `img/room-s.webp` | as above | A double bed under grey wool and a sheepskin, one lamp on a stool, a square north window with aurora over snow |
| `img/sauna.webp`, `img/sauna-s.webp` | as above | Pale benches, a stove with the door open, a bucket and ladle; a small window on the frozen fjord and aurora |

All three were checked at full size before use:
- no text and no people;
- no brand marks: the stove door was checked close up and is plain cast iron;
- no trees and no daylight.

The interior grade is the same as the film's.

## Icons

`img/favicon.svg` and `img/apple-touch-icon.png` are drawn for this site: a
circle, a line and a half-disc. Abstract geometry, not a depiction of anything.
