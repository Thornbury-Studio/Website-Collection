# HEDDLE — image provenance

HEDDLE is a **fictional business**. Kirkbrae Mill, the eight cloths and their
names, the prices, the lead times, the shade card and every figure on the
site are original to this template. No real mill's identity, imagery, product
names or prices are used.

## Photography — licensed Adobe Stock (free tier)

Fourteen photographs were searched, licensed and downloaded on **15 September
2026** through the Adobe Stock connector, free-tier assets only (licence state
`just_purchased`, no credit cost). Every asset was checked to be
`isGenTech: false` — no AI-generated imagery is used anywhere on this
template. Originals ran 4 000–9 547 px on the long edge; every export is
downsampled from the full-resolution licensed file, never from a search
thumbnail.

The first build of this template had no photography at all: every cloth was
painted from its weave draft by `js/weave.js`. That read as a diagram rather
than a mill, so the range was re-cast around what the free tier could
actually supply — eight real cloths with clear structures — and the drafts
were rewritten to match the photographs, not the other way round. Two cloths
from the first pass (a log cabin and a rosepath) had no honest photograph
available and were dropped rather than faked.

| File | Adobe Stock ID | Used as |
|---|---|---|
| `img/cloth-kirkbrae.webp`, `-700` | 403180461 | Kirkbrae Twill — a folded camel scarf, fringed |
| `img/cloth-ettrick.webp`, `-700` | 393922799 | Ettrick Herringbone — grey herringbone tweed |
| `img/cloth-hound.webp`, `-700` | 410957032 | Hound — black and white houndstooth |
| `img/cloth-check.webp`, `-700` | 731341555 | Kirkbrae Check — herringbone ground with a red and black overcheck |
| `img/cloth-glen.webp`, `-700` | 269790050 | Glen — brown glen check with a rust overcheck |
| `img/cloth-minchmoor.webp`, `-700` | 1004108433 | Minchmoor Plaid — blue and brown flannel plaid, draped |
| `img/cloth-yarrow.webp`, `-700` | 1839319011 | Yarrow Chevron — blue and white chevron throw |
| `img/cloth-hopsack.webp`, `-700` | 1363206840 | Hopsack — grey basket-weave upholstery cloth |
| `img/mill-warping.webp`, `-700` | 247143456 | The mill, 01 — cones on a warping creel |
| `img/mill-threading.webp`, `-700` | 415208523 | The mill, 02 — warp ends tied off on an old loom |
| `img/mill-weaving.webp`, `-700` | 634321794 | The mill, 03 — a blue warp through the heddles |
| `img/mill-finishing.webp`, `-700` | 480915499 | The mill, 04 — a stack of finished blankets |
| `img/hero.webp`, `-600` | 182899738 | Hero plate, 4:5 — three bolts of cloth on a bench |
| `img/order.webp`, `-600` | 615231335 | Ordering — two folded blankets, fringed |
| `img/og.webp` | — | 1200×630 screenshot of the home page |
| `img/favicon.svg` | — | Drawn, not licensed |
| `../../img/mill-heddle-sm.webp` | — | 960×600 homepage screenshot for the hub card |

All fourteen are in use; nothing was licensed and thrown away.

## The grade

`tools/grade.py` (Pillow, no ffmpeg) does two different things to two kinds
of plate.

The eight **cloth plates are barely graded**: a centred crop to 3:2 — tighter
on Hound and Glen, whose patterns are small enough to vanish at card size — a
light unsharp after the Lanczos downsample, and nothing done to colour. They
are product photographs; the colour is the product.

Two of them were shot on a white sweep (the camel scarf and the folded
blankets). Their whites are mapped onto the page ground, `#ECE6D8`, by a
luminance-weighted blend that leaves anything darker than about 200 alone,
so the product sits on the page rather than in a white box. The same
treatment is used on the ordering plate.

The six **mill and shop plates** are pulled a fifth of the way towards grey,
given four per cent more contrast and a small warm shift (red up three per
cent, blue down four), so a blue steel creel and a saturated blue warp read as
the same mill as an undyed-cloth page.

All exports are WebP through Pillow at quality 74 (cloth plates, which are
fine textures and compress badly) to 80, `method=6`, Lanczos downsample. Raw
JPEGs live in `tools/raw/` on the build machine and are not shipped.

## Faces

There is no readable human face anywhere on this site, and no bare hand. The
mill plates are the equipment: a creel, a loom, a warp, a shelf.

## Generated imagery

None. This template was briefed as stock-only and no image-generation tool
was called at any point. No video was generated.

## What is drawn and what is photographed

The cloth is photographed. The draft is drawn: the draft written out beside
each cloth on `cloths.html` and the drafting room are both painted by
`js/weave.js` from the same data, and each draft was
written to produce the structure in the photograph it sits beside — the
Ettrick threading is a broken twill because the tweed is, Hound is four-and-
four because the photograph is, Hopsack has two treadles because a basket
weave does.
