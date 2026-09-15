# HOLLOWGATE — image provenance

Hollowgate Junction, the Calder & Thrushmoor Railway, Thrushmoor, Calderfoot,
the Quarry Branch, the Trust, its charity number, its staff, its prices and
every date on the site are **original to this template**. No real preservation
trust, signal box, heritage railway or charity is depicted, named or implied.
The locking table is an original design drawn for this fictional junction; it is
built on the published principles of mechanical tappet interlocking, not copied
from any particular box's locking sheet.

## Photography — licensed Adobe Stock (free tier)

Four photographs were searched, licensed and downloaded on **15 September 2026**
through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this template.
Originals ran 2 880–7 360 px on the long edge; every export is downsampled from
the full-resolution licensed file, never from a search thumbnail.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/hero.webp`, `img/hero-900.webp` | 460058692 | Homepage hero — a tank engine and carriages approaching a junction, with a semaphore at danger and a turnout in the foreground |
| `img/arm.webp`, `img/arm-640.webp` | 356179405 | The mid-page arm plate — two semaphore arms on one post, upper on, lower off |
| `img/shed.webp`, `img/shed-700.webp` | 511251791 | `visit.html` hero — a locomotive under a station roof at night |
| `img/wheel.webp`, `img/wheel-700.webp` | 274849422 | The visiting band at the foot of the homepage — driving wheels and coupling rod |
| `img/og.webp` | 460058692 | 1.91:1 crop of the graded hero, for social cards |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/signals-hollowgate-sm.webp` | — | 960×600 homepage screenshot for the hub card |

460058692 carries a visible locomotive running number. It is a licensed
photograph used as imagery only; no locomotive, operator or railway is named or
claimed anywhere in the site's copy.

## Grading

`tools/grade.py` (Pillow) is the whole image pipeline: per-channel gain,
saturation, a gamma-and-black-point lift, and a blend toward the page ground,
then a Lanczos downsample to WebP at quality 74. Nothing generative, nothing
composited, no object removal.

Each frame is pulled toward the site's two grounds so the photographs sit in the
same room as the authored SVG:

- **hero** — summer foliage was the loudest thing in the frame and fought the
  cream type. Saturation to 0.62, cooled, shadows pulled 17% toward the page
  ground.
- **arm** — the red is the one colour on this site that must not move, because
  it is the same red as a stop-signal lever. So the sky was taken down into dusk
  instead: saturation 0.82, blue and green channels pulled back, gamma 1.55.
- **shed** — already near-monochrome; only needed to stop being neutral grey and
  start being box green.
- **wheel** — shot with a heavy sunset grade that read as a postcard. Stripped
  to near-monochrome (saturation 0.16) and re-tinted cream so it reads as a
  plate.

## Authored, not photographed

Everything else on the site is drawn in SVG or CSS and has no external source:
the track diagram and its semaphores, points, gates and route highlights; the
sixteen levers and their quadrants; the tappet locking drawing on `frame.html`;
the bell-code beats; the favicon and the wordmark signal.
