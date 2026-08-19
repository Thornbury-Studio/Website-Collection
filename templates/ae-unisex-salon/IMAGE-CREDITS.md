# Image credits — A&E Unisex Salon

This is a **concept preview** built as a cold pitch. Nothing was taken from
A&E Unisex Salon's own Facebook page, photographs, or any listing's imagery.
Only their published factual business information was used.

## No AI generation was used on this build

Per the client-preview default mode, real licensed photography came first and
covered every slot — **zero image-generation credits were spent**, and no video
was produced (see `VIDEO-POLICY.md`).

## Licensed stock — Adobe Stock free tier, licensed 19 Aug 2026

All six are `isGenTech: false` (real photography, not AI-generated stock).

| File | Adobe Stock ID | Subject |
|---|---|---|
| `hero-*.webp`, `og-1200.webp`, root `img/ae-unisex-salon-sm.webp` | **625389485** | Stylist cutting a seated client's hair in a small neighbourhood shop |
| `cut-*.webp` | **256484166** | Man's haircut, scissors and comb |
| `colour-*.webp` | **128905298** | Colourist applying colour to foiled sections |
| `wash-*.webp` | **364569995** | Client at the wash basin |
| `style-*.webp` | **415803123** | Combing and setting after a wash |
| `detail-*.webp` | **192234126** | Hands, comb and scissors close-up |

Selection was deliberately biased toward believable neighbourhood-salon work
rather than fashion-editorial glamour, and the hero was chosen partly because
it reads as a small Asian shopfront salon, which suits Tampines.

**One frame was rejected and replaced:** Adobe Stock 716846376 (colour rinse at
a basin) was licensed first but discarded — flat grey background and a clinical
feel that broke the set's warmth. 128905298 replaced it.

## Grading

Because these are six *different* real shoots rather than one generated set,
`grade.py` (scratchpad) applies one rule to every file, in this order:

1. **Exposure normalisation** — each image's mean luminance is pushed toward a
   shared target (138), capped at ±1.35×. Same target, same formula, every
   image. This is what actually makes mixed stock read as one set; measured
   corrections ranged from ×0.907 (hero) to ×1.350 (detail, colour).
2. **The identical look grade** — +1.0% red / −1.0% blue, a 10% smoothstep
   S-curve, colour ×0.95.

Then responsive WebP at q80. Total shipped imagery: ~330 KB.

## Fonts

`fonts/PlusJakartaSans-400.woff2` is the latin subset of **Plus Jakarta Sans**
(SIL Open Font License), self-hosted so the page makes no third-party requests.
It is a variable file — one 26 KB download serves all five weights used.

## Original work

`img/favicon.svg` and the inline scissors mark are original drawings for this
build. A&E Unisex Salon's own signage and any logo are not used or imitated.
