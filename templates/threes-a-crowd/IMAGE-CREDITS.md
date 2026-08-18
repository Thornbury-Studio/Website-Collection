# Image credits — Three's A Crowd

This is a **concept preview** built as a cold pitch. Nothing visual was taken
from Three's A Crowd's website, online store, menu graphic, or social accounts.
Their published menu and store data were read once for *factual* extraction
(names, tiers, prices) and no pixel of theirs is reused.

## Licensed stock

| File | Source | Notes |
|---|---|---|
| `cabinet-*.webp` | Adobe Stock **1430978746** (free tier), "Variety of colorful gelato flavors displayed in a glass case at a dessert shop", licensed 18 Aug 2026, `isGenTech: false` | 16:7 band crop from the full-res licensed file. |

## Generated concept imagery

Everything below was generated on 18 Aug 2026 via Higgsfield (submitted as
`nano_banana_2`, reported back as `nano_banana_flash`), one set sharing a
single verbatim style block — warm evening tungsten, caramel wood, cream
ceramics, cocoa shadows — so it reads as one campaign shoot. These frames are
**concept imagery**: they do not depict the real Three's A Crowd premises,
staff, customers or exact dishes, and should be replaced with approved
authentic photography if the prospect becomes a client.

| File | Subject |
|---|---|
| `hero-*.webp`, `og-1200.webp`, root `img/threes-a-crowd-sm.webp` | Waffle with melting gelato scoop, steam rising |
| `mochi-*.webp` | Mochi waffle pulled apart, chewy strands |
| `durian-*.webp` | Durian gelato scoop with durian flesh (re-rolled once for a background figure, then tight-cropped to remove generated chalkboards whose pseudo-prices could read as real) |
| `pistachio-*.webp` | Roasted pistachio scoop with pistachio cream |
| `affogato-*.webp` | Espresso over vanilla gelato |
| `churros-*.webp` | Churros waffle with chocolate sauce |
| `chicken-*.webp` | Fried chicken and waffle |
| `brownie-*.webp` | Brownie with melting chocolate scoop |
| `bandung-*.webp` | Iced bandung latte (a background chalkboard was locally blurred out) |
| `shake-*.webp` | Gelato milkshake with sprinkles |
| `interior-*.webp` | Compact evening dessert-shop interior (concept, not their unit) |
| `pints-*.webp` | Three open unlabelled gelato pints |
| `texture-*.webp` | Gelato ripple close-up (dark band background) |

## Grading

Every frame — stock included — went through one identical pass
(`grade.py`, scratchpad): +0.6% red / −0.4% blue, a 12% smoothstep S-curve,
colour 0.98, brightness 1.02, then responsive WebP export at q82.

## Fonts

`fonts/*.woff2` are the latin subsets of **Bricolage Grotesque** and
**Schibsted Grotesk**, downloaded from Google Fonts (SIL Open Font License)
and self-hosted so the site loads no third-party resources at all.

## Original work

`img/favicon.svg` and the inline three-scoop mark are original drawings for
this build — three overlapping scoops for the name. Three's A Crowd's own
logo and brand marks are deliberately not used or imitated.
