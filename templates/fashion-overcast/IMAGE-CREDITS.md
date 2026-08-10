# OVERCAST — media provenance

OVERCAST is a **fictional clothing label**. The brand, garments, mills, prices,
stock levels and collection story are all invented for this template.

## The art direction, and why it exists

Every garment on this site is photographed as a **tight detail crop of its cloth**
rather than on a model. That is a real editorial language — Lemaire, Margaret Howell
and Arket all sell this way — but here it was also the honest answer to a constraint:
there is no CC0 library of clean per-product packshots, and inventing a photo studio
we don't have would have shown. Rather than assemble a set of mismatched lifestyle
photos, the limitation became the brand's stated position, printed on the homepage:
*"We photograph the cloth, not the pose."*

**No identifiable faces appear anywhere on the site.** Where a person is present they
are cropped at the chin, the hand or the knee. CC0 waives copyright but not
personality rights, so using recognisable people as a fictional label's models was
ruled out on principle — the same reason the AMICUS and BRIGHTSIDE templates avoided
it.


## The one rule the grid obeys

**Product images are cloth macros. Only editorial images show the world.**

The first build broke this — the grid mixed flat cloth swatches with
garments-in-context, a hand, and a skein of yarn, at wildly different scales. The
house grade unified the colour but not the subject, and the result read as random
even though every frame was individually fine. The eight product images are now all
macro cloth at comparable scale, with hands, hair and faces cropped out of frame;
the hero and the two editorial splits carry the world. Consistency of *subject* did
more for the site than the grade did.

## The house grade

All fifteen images pass through one grading function: saturation pulled to 52%,
shadows cooled toward blue, highlights warmed slightly, blacks lifted to a filmic
0.026. The grade is deliberately gentler than the first build's — clean, high-resolution
originals need the palette pulled together, not rescued, and the heavier pass was
adding mud. Sources shot by different photographers in different light still resolve
into one campaign.

## Sources

All photographs are from the **Adobe Stock Free Collection**, searched and licensed
through the Adobe MCP integration on **10 August 2026**. Each was licensed to this
account before use; none are unlicensed previews or thumbnails.

These are **licensed copyrighted works, not public domain.** The hub's About panel and
this file both say so — the earlier "copyrighted assets: 0" claim was retired when
these were brought in, because it would no longer have been true.

| File | Used as | Adobe Stock ID |
|---|---|---|
| `img/hero.webp` | Homepage hero (world) | 312874536 |
| `img/p-overshirt.webp` | Haar Overshirt — khaki twill | 272067056 |
| `img/p-cableknit.webp` | Nimbus Cable Knit — cable knit | 1881092831 |
| `img/p-crew.webp` | Ashfield Crew — cotton heather | 1256881109 |
| `img/p-jacket.webp` | Drizzle Quilted Jacket — padded quilting | 470951531 |
| `img/p-trouser.webp` | Slate Pleated Trouser — pinstripe suiting | 378322146 |
| `img/p-shirt.webp` | Gloaming Shirt — shirting | 396837736 |
| `img/p-scarf.webp` | Haar Scarf — alpaca / mohair | 471306273 |
| `img/p-cap.webp` | Fieldcap — draped wool coating | 1058850562 |
| `img/ed-stack.webp` | Art-direction split — tweed coat pocket | 145648761 |
| `img/ed-rail.webp` | Atelier split — brushed alpaca | 471306273 |
| `img/ed-store.webp` | Reserved | 312874536 |
| `img/sw-wool.webp` | Cloth library — Hopsack 340 | 378322146 |
| `img/sw-lambswool.webp` | Cloth library — Geelong 12gg | 1881092831 |
| `img/sw-felt.webp` | Cloth library — Boiled Felt 480 | 1058850562 |

## Why these replaced the first set

The first build sourced CC0 imagery from StockSnap. It failed on two counts, both
fair criticism:

1. **Resolution.** Only 960 px thumbnails were reachable from that CDN, and product
   crops were taken *out of* those thumbnails — one card shipped at 231 px wide
   against a ~355 px display slot, so it was soft on any screen and visibly poor on
   a retina one. The Adobe originals are 3568–8000 px, so a 820 × 1093 export is a
   downsample rather than a crop-and-pray.
2. **Palette discipline.** Even once every frame was a cloth macro, the set ran
   rust / chalk-white / dusty pink / oatmeal — too wide a spread to read as one
   collection. The replacements are held to charcoal, grey marl, ecru, navy and a
   single clay note, which is what an actual AW range looks like.

Originals were centre-cropped, downsampled with Lanczos, graded, and encoded to WebP
(quality 76–78). Fifteen images total **~3.0 MB**; everything below the fold is lazy-loaded.

## Figures

Capacities, weights, mill towns and founding dates, prices, stock levels, run sizes
and the "180 made per run" figures are **invented** and internally consistent. No
payment can be taken; the checkout button raises a notice saying so.
