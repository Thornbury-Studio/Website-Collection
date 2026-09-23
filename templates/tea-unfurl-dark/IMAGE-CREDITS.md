# IMAGE-CREDITS — UNFURL.

Every picture on this site is a real photograph or a real film, licensed, checked as it was added (DARK.md §2). The free libraries were searched first (Pexels, Pixabay, Mixkit), then Adobe Stock's **free** tier; nothing paid, nothing generated, nothing lifted from another brand. No frame shows an identifiable face.

Masters are cached in `tools/raw/` (gitignored) and re-derived by `tools/film.py`, `tools/grade.py`, `tools/label.mjs` + `tools/tin.py`.

## Licences

- **Pexels License** — free for commercial use, no attribution required, no model or property release implied.
- **Pixabay Content License** — free for commercial use, no attribution required; not to be sold unaltered or used to imply endorsement.
- **Adobe Stock Standard License** (free-tier assets, licensed through the Adobe connector on 2026-09-23) — web use without view limits; the files themselves are not redistributed except as rendered on this site.

## The film (stage, `index.html` only)

| File | Source | Notes |
|---|---|---|
| `film/xl/`, `film/l/`, `film/s/` (160 frames each), `js/film-data.js` | **Adobe Stock 737291599** — "Slow motion brewing loose leaf tea with hot water in a transparent glass teapot", 2160×3840, 25 fps, 29.3 s, `isGenTech: false` | 160 evenly spaced frames, amber grade, a focus-following 16:9 band for desktop (2048 and 1440 wide) and a 9:16 cut for phones, by `tools/focus.py` + `tools/film.py`. Chosen after searching Pexels, Pixabay and Mixkit; see DESIGN.md §2 for what exists and why this one. |

## The garden loop (`garden.html` hero)

| File | Source | Notes |
|---|---|---|
| `film/fog.mp4`, `film/fog-poster.webp` | **Pixabay 125841** · jeffplay — "Tea garden, tea field, fog, Alishan" (tagged Alishan, Taiwan, Chiayi) | 12 s seamless loop (last 1.5 s dissolved into the first), graded darker, 1600 px, no audio. Plays only while on screen; paused under reduced motion. |

## The tin (`index.html` tin band, `tin.html` hero — the one stated repeat, see DESIGN.md §9)

| File | Source | Notes |
|---|---|---|
| `img/tin.webp`, `img/tin-900.webp`, `img/og-tin.jpg` | **Adobe Stock 368133712** — "tin can with closed round lid … isolated on white", 4271×3417, `isGenTech: false` | Cut out with Adobe Photoshop's background removal; the label (`tools/label.html`, site fonts, numbers read from `js/steep-model.js`) wrapped round the measured cylinder and lit by the tin's own light by `tools/tin.py`; metal brought down for a dark set. The printed band is our artwork. |

## Stills — Pexels, one grade (`tools/grade.py`), each on one page only

| File | Pexels · photographer | Page | Where it was taken |
|---|---|---|---|
| `img/fog.webp` | [27852909](https://www.pexels.com/photo/27852909/) · Marek Piwnicki | index | not stated |
| `img/pour.webp` | [6545369](https://www.pexels.com/photo/6545369/) · Tima Miroshnichenko | index | studio |
| `img/ridge.webp` | [31998928](https://www.pexels.com/photo/31998928/) · Alix Lee | garden | Taiwan (per the photo's title) |
| `img/bush.webp` | [30359265](https://www.pexels.com/photo/30359265/) · Marek Piwnicki | garden | Taiwan (per the photo's title) |
| `img/terraces.webp` | [11866733](https://www.pexels.com/photo/11866733/) · Starzzz Studios | garden | **not Taiwan-confirmed** (photographer based in Vietnam). Cropped to the lower 66%: the saturated sky broke the set. |
| `img/pick.webp` | [38237927](https://www.pexels.com/photo/38237927/) · Umma Akifa | garden | not stated |
| `img/basket.webp` | [11586131](https://www.pexels.com/photo/11586131/) · Mumine Durmaz | garden | **not Taiwan** (photographer based in Istanbul; likely Rize) |
| `img/shade.webp` | [12882299](https://www.pexels.com/photo/12882299/) · Leenee Chuang | garden | not stated |
| `img/drum.webp` | [6875313](https://www.pexels.com/photo/6875313/) · Quang Nguyen Vinh | garden | **Vietnam** (photographer's series) |
| `img/ball.webp` | [6713009](https://www.pexels.com/photo/6713009/) · Quang Nguyen Vinh | garden | **Vietnam** — cloth-ball rolling, the Taiwanese oolong method |
| `img/press.webp` | [6713017](https://www.pexels.com/photo/6713017/) · Quang Nguyen Vinh | garden | **Vietnam** — same series |
| `img/trays.webp` | [38534899](https://www.pexels.com/photo/38534899/) · 晓鸟 蓝 | garden | **not Taiwan** (photographer based in Guangzhou) |
| `img/amber.webp` | [16607225](https://www.pexels.com/photo/16607225/) · Maria | brew | — |
| `img/pitcher.webp` | [6545346](https://www.pexels.com/photo/6545346/) · Tima Miroshnichenko | brew | studio |
| `img/tray.webp` | [6545344](https://www.pexels.com/photo/6545344/) · Tima Miroshnichenko | brew | studio |
| `img/cup.webp` | [34917497](https://www.pexels.com/photo/34917497/) · liu | brew | — |
| `img/scoop.webp` | Pexels video [6540435](https://www.pexels.com/video/6540435/) ("A person pouring oolong tea in a gaiwan"), one frame at 0.5 s, cropped to the scoop of rolled leaf | index | studio. Photographer not recorded (bot-walled video page). |
| `img/gaiwan.webp` | The same Pexels video 6540435, a frame at 10.2 s, cropped to the gaiwan of dry knots | tin | studio. Two frames of one clip, used on different pages, a minute apart in the film. |
| `img/wet.webp` | Pexels video [5404501](https://www.pexels.com/video/5404501/) ("Extracting tea flavor with hot water"), one frame at 3.3 s; shot under yellow light, colour-corrected to amber before the house grade | tin | Photographer not recorded: Pexels video pages sit behind a bot check; the search listing has no credit. |

**Place rule.** The garden page illustrates each step of rolled-oolong making ("this is how rolled oolong is made wherever it is made well") and captions no photo with a place. Photos marked "not Taiwan" above must never be captioned as Alishan or the garden.

## Derived

- `img/og.jpg` — a capture of this site's own stage at 2:23 (desktop), letterboxed to 1200×630.
- `../../img/tea-unfurl-dark-sm.webp` — 480×300 hub thumbnail from the same capture.
- `img/favicon.svg` — original: a U with the amber dot.

## Considered and not used

Removed after critique round 2: Pexels 6351839 (the concrete-and-teapot flatlay; its leaf read green and broken beside "nothing is broken"). Removed after critique round 1: Pexels 6351882 (a second frame from that same shoot) and 32930391 (the Chiayi village — a pink apartment block that read as nobody's tea garden). Pexels video 4926068 was tried for the wet-leaf band and rejected: its leaf is broken fannings, which contradicts the copy beside it. Pixabay 103852 (vinaykva) — a real rolled-oolong unfurl time-lapse in a celadon gaiwan, but 1080p, soft, and on a white table; the bowl is ~500 px across. Pexels 4926068 / 4926072 (leaves dropping into already-dark liquor — no unfurl), 8255164 (herbal leaves in a kettle), Mixkit 45526 (a tea bag), 13929 (linden in a press). Pexels photos 9025660 and 6545351 (strip-style leaf, wrong shape for a rolled oolong), 36103417 (a decorative charm in frame), 6691941 (open strip leaf).

## Fonts

- **Archivo** — SIL Open Font License 1.1, Google Fonts.
- **Newsreader** — SIL Open Font License 1.1, Google Fonts.
