# Image credits — property-bluehour (MABEL SEOW)

Every photograph on this site was generated for it. Nothing is licensed stock,
and nothing was taken from a real agent, agency or listing.

## Provenance

| File | Frame | Model | Notes |
|---|---|---|---|
| `img/portrait-1000.webp` | `portrait` | Higgsfield `soul_2` (text2image_soul_v2), 2K | Hero portrait. First generation kept. |
| `img/portrait-alt-1000.webp` | `portrait-alt` | Higgsfield `soul_2`, 2K | Story page. First generation kept. |
| `img/home-tower-{1800,900}.webp` | `home-tower` | Higgsfield `soul_2`, 2K | First generation kept. |
| `img/home-block-{1800,900}.webp` | `home-block` | Higgsfield `soul_2`, 2K | **One re-roll.** v1 returned a six-storey European slab, which contradicted the "twelfth floor" copy; the prompt was changed only to pin storey count and tropical typology. |
| `img/home-kitchen-{1800,900}.webp` | `home-kitchen` | Higgsfield `soul_2`, 2K | First generation kept. |
| `img/home-bedroom-{1200,800}.webp` | `home-bedroom` | Higgsfield `soul_2`, 2K | First generation kept. |
| `img/home-terrace-{1800,900}.webp` | `home-terrace` | Higgsfield `soul_2`, 2K | First generation kept. |
| `img/keys-1000.webp` | `keys` | Higgsfield `soul_2`, 2K | First generation kept. |
| `img/og.webp` | — | derived | Crop of the graded `portrait` frame to 1200×630. |
| `../../img/property-bluehour-sm.webp` | — | derived | 960×600 screenshot of the homepage, for the hub gallery card. |

Cost: 9 generations at ~0.12 credits each (8 frames plus one re-roll), ≈ 1.1
credits total. Per `VIDEO-POLICY.md` this is the still-image tier; no video
was generated.

## Route taken

`src/gen.mjs` is the Gemini (nano-banana) batch this set was planned for, and
it is kept because it holds the prompts. It never ran: both
`nano-banana-pro-preview` and `gemini-3.1-flash-image` returned HTTP 429 on
every attempt across ~17 retry passes over roughly an hour — the same
quota-event pattern recorded in memory. Adobe Stock's free tier was searched
next and could supply plausible interiors but no portrait that did not read as
generic corporate stock, which is fatal for a site whose whole subject is one
person. Higgsfield `soul_2` absorbed the entire set at 0.12 credits a frame.

`src/grade.mjs` holds the grading pass and the responsive encodes. Every frame
goes through one identical chain — a little contrast, blue into the shadows,
amber into the highlights, gentle unsharp — so the eight photographs read as
one evening rather than eight. Re-run it after replacing any raw frame.

Note that `templates/*/src/` is gitignored repo-wide, so `gen.mjs`,
`grade.mjs` and the raw 2K frames stay on the build machine and are not in the
repository. The two prompt blocks are therefore reproduced below, so this file
alone is enough to regenerate the set.

## Prompt discipline

Both prompt families carry the same hour verbatim. Only the subject sentence
varies — that repetition is the whole reason the set holds together.

**Shared hour (in every prompt):**

> Photographed at blue hour in tropical Singapore, about twenty-five minutes
> after sunset: the sky is a deep petrol blue-teal and every interior light is
> warm tungsten amber around 2700K. Palette strictly limited to deep blue-teal
> night, warm amber lamplight and desaturated neutral surfaces. Fine 35mm film
> grain, natural contrast, deep shadows that stay open, no HDR flattening, no
> lens flare.

**PERSON tail:** editorial 85mm portrait at f/2, shallow depth of field,
natural skin texture with no retouching or beauty smoothing, composed and
unforced expression, no teeth-baring grin, hands relaxed and simple.

**PLACE tail:** editorial architectural photography on a 35mm prime, tripod,
long exposure, natural perspective with vertical lines kept perfectly vertical,
calm, unstaged, no people.

**Both end with:** NO text, NO letters, NO numbers, NO logos, NO signage, NO
house numbers, NO block numbers, NO watermarks anywhere in the frame.

The grading chain, for reference:

```
eq=contrast=1.06:saturation=1.04:gamma=0.99,
colorbalance=rs=-0.03:gs=-0.01:bs=0.05:rh=0.04:gh=0.01:bh=-0.03,
unsharp=5:5:0.45:5:5:0.0
```

## Fictional entities

Mabel Seow, Fairwind Realty Pte Ltd, the phone number, the email address, the
CEA registration and agency licence numbers, the transactions and the
testimonials are all invented for this template. The registration numbers are
deliberately all-zero (`R000000Z`, `L0000000Z`) so they cannot collide with any
real registrant.
