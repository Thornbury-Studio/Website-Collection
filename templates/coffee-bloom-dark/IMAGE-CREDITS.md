# IMAGE-CREDITS — BLOOM.

Every photograph on this site is a real photograph under the **Pexels
License** (free for commercial use, no attribution required; no
model/property release implied — none of these frames shows an
identifiable face). The licence was checked as each frame was added, per
DARK.md §2, and the free libraries were searched before any paid source
(none was needed). Nothing here is generated, scraped, or lifted from
another brand's site.

Sources are cached under `tools/raw/` (gitignored) and re-derived by
`python tools/grade.py`. Two treatments:

- **roast** — the house grade, applied identically to every editorial
  frame: blacks land on the page ground, highlights on the paper tone,
  greens pulled to olive, reds kept.
- **bed** — the bloom plate. Cropped square on the dry grounds and left
  near-neutral, because the WebGL program does all of its wetting, foam
  and light on top of it.

**Twenty-one distinct photographs, no editorial photograph reused across
pages** (DARK.md §2's 2026-09-23 diligence rule). Two deliberate,
stated repeats:

- the bloom plate is drawn twice by the stage — once per bed — because
  the comparison only means something if both doses are literally the
  same grounds;
- the bag (`img/bag-front.webp`) is the hero object on `index.html` and
  on `bag.html`, because it is the only thing the brand sells — each
  carries a different live date (this week's roast on the home page, the
  next roast on the bag page).

| File | Pexels photo · photographer | Used on |
|---|---|---|
| `img/bed.webp` | [30349807](https://www.pexels.com/photo/30349807/) · Cihan Yüce — dry grounds in a wave dripper, from directly above | `index.html`, the bloom stage (both beds) |
| `img/bag-front.webp` | [12039675](https://www.pexels.com/photo/12039675/) · mockupbee — a blank kraft stand-up pouch on a grey sweep, **printed and relit by `tools/bag.py`**: cut out by chroma, the label from `tools/label.html` (site fonts, rendered by `tools/label.mjs`) multiplied into the kraft with a slight bulge, relit for a dark set, stood on the page ground. No date is printed: the site stamps the live roast date over the "Roasted on" box. | `index.html` hero, `bag.html` hero |
| `img/foam.webp` | [28298184](https://www.pexels.com/photo/28298184/) · Alina Skazka — a real bloom, close up | `index.html`, "What you just watched" |
| `img/beans.webp` | [31890566](https://www.pexels.com/photo/31890566/) · Alejandro Aznar — light roast in a cooling tray | `index.html`, "Inside the bag" |
| `img/hands.webp` | [36040333](https://www.pexels.com/photo/36040333/) · Irvin David — hand picking ripe cherries | `index.html`, lot band |
| `img/slope.webp` | [32419583](https://www.pexels.com/photo/32419583/) · Tiarra Sorte — coffee hillside with farmhouse | `lot.html` hero |
| `img/branch.webp` | [7125698](https://www.pexels.com/photo/7125698/) · Michael Burrows — ripe cherries on a branch | `lot.html` |
| `img/pick.webp` | [6152430](https://www.pexels.com/photo/6152430/) · Sergiu Iacob — fingers picking red cherries | `lot.html` |
| `img/basket.webp` | [7125739](https://www.pexels.com/photo/7125739/) · Michael Burrows — cherries falling into a basket | `lot.html` |
| `img/wash.webp` | [7125590](https://www.pexels.com/photo/7125590/) · Michael Burrows — washing parchment in the hand | `lot.html` |
| `img/beds.webp` | [17366133](https://www.pexels.com/photo/17366133/) · Imanishimwe regis — raised drying beds | `lot.html`, full-bleed band |
| `img/valley.webp` | [13807913](https://www.pexels.com/photo/13807913/) · Paula Rebolledo — valley under low cloud, Tolima | `lot.html`, "In the cup" |
| `img/discharge.webp` | [31890552](https://www.pexels.com/photo/31890552/) · Alejandro Aznar — beans dropping from a roaster, smoke | `monday.html` hero |
| `img/panel.webp` | [4820811](https://www.pexels.com/photo/4820811/) · cottonbro studio — a roaster's control panel with a roast curve on its screen (no maker's mark in frame) | `monday.html`, "Six batches, one log" |
| `img/cooling.webp` | [12088958](https://www.pexels.com/photo/12088958/) · Hannoversche Kaffeemanufaktur — cooling tray | `monday.html`, full-bleed band. **Cropped to the lower 55%** so the roaster's maker's badge in the original is not in frame; no third-party mark appears. |
| `img/sacks.webp` | [18053128](https://www.pexels.com/photo/18053128/) · Barış Türköz — stacked jute sacks | `monday.html`, the green room |
| `img/scoop.webp` | [29873454](https://www.pexels.com/photo/29873454/) · Ferhat E. Arslan — scooping green coffee into a sack | `monday.html` |
| `img/bagging.webp` | [22679458](https://www.pexels.com/photo/22679458/) · Bia Sousa — scoop over open valve bags | `monday.html`, "Sealed before lunch" |
| `img/origami.webp` | [34386686](https://www.pexels.com/photo/34386686/) · Ana Gonzalez — pour into a black fluted dripper | `bag.html`, brew guide |
| `img/kettle.webp` | [12100693](https://www.pexels.com/photo/12100693/) · Jill Qin — kettle with clip-on thermometer | `bag.html`, brew guide |
| `img/cup.webp` | [8250943](https://www.pexels.com/photo/8250943/) · PNW Production — black coffee from above | `bag.html`, brew guide |
| `img/og.webp` | Derived from this site's own bloom stage at 0:16 (both beds). | OpenGraph / Twitter card |
| `img/favicon.svg` | Original: a crema dome rising off a baseline — the mechanic as a mark. | Favicon |

**Rejected while sourcing** (recorded so nobody re-tries them):
Pexels 19162213 (glossy dark-roast beans — contradicts a light filter
roast), 35923206 (hands picking mostly green cherries — contradicts
"only the red ones"), 28411623 (a grey black-and-white bag, too flat to
hold a hero), 28484530 (an Origami dripper whose grounds were already
wet at the rim, so it could not be the dry "before" plate). Removed after
the critique round: 14679166 (the kettle-over-dripper hero — the most
overused coffee photograph there is, and it showed no product) and
18428694 (a cooling tray with an ornate brass stirring arm that no
Brunswick roastery owns).

Hub thumbnail `../../img/coffee-bloom-dark-sm.webp` is a 480×300 downscale
of the bloom stage captured by `tools/shot.mjs`.

## Fonts

- **Bricolage Grotesque** — SIL Open Font License 1.1, Google Fonts.
- **IBM Plex Mono** — SIL Open Font License 1.1, Google Fonts.
