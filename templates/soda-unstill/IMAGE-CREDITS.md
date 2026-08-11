# UNSTILL — media provenance

UNSTILL is an original template. The company, the four flavours, the recipes, prices,
stockists and all copy are invented for this template. No real drinks brand's identity,
trade dress or products are referenced.

This file is the provenance record for the repository. Per the collection's content policy
it is deliberately not surfaced in the site's own page copy.

## Video — Mixkit (free licence)

Three clips, downloaded **11 August 2026** from Mixkit's stock video library
(assets.mixkit.co), each published under the **Mixkit Stock Video Free License**. Mixkit's
site states the clips "can be downloaded for free, without watermark, to be used in your
next awesome video project under the Mixkit License", and its User Terms grant a
non-exclusive licence covering commercial use, prohibiting only resale of unaltered copies
or redistribution "on a stock or inventory basis" (mixkit.co/license/, mixkit.co/terms/,
clauses 9.2 and 9.4). Embedding regraded excerpts in a website design is squarely within
that scope; no attribution is required and none is printed on-page.

| Shipped file | Mixkit source | Subject |
|---|---|---|
| `video/hero.mp4/.webm` | Clip 45674, "Multicoloured ink exploding" | Ink erupting on black — the hero, trimmed to its first eruption cycle (1.5–11.5 s of 87 s) |
| `video/pour.mp4/.webm` | Clip 41999, "Texture of red ink in water on a white background" | Red ink blooming on white — the flavour pages |
| `video/collide.mp4/.webm` | Clip 45675, "Bright orange and blue ink exploding" | Two inks colliding — the story page |

Clips 286 and 229 were downloaded for review and cut: 286 duplicated 45674's role and 229
was too calm for the brand.

All three were re-encoded with a role-based quality budget rather than one setting for
all: `pour` is a framed foreground element on white and gets the most bits (its true 1080p
source runs ~30 Mbps); `hero` is full-bleed and gets a Lanczos upscale to 1080 plus a light
unsharp, because Mixkit publishes no 1080 for that clip and a good offline resample beats
the browser's own upscale at the 1.5–3× factors a large or retina display asks for;
`collide` sits behind a 55% scrim mid-page and stays native 720p. VP9 is capped with
constrained quality (`-crf` with `-b:v`) because high-entropy sharpened ink otherwise runs
to 5 Mbps. Combined 13.3 MB for six files — but what a visitor actually downloads is
3.4 MB on the home page, 1.0 MB on a flavour page and 1.5 MB on the story page. **The four flavour treatments ship no extra video:** each flavour
applies its own `hue-rotate` filter rule to the same two clips, so choosing a flavour
re-inks the films live at zero bytes of additional weight.

Poster frames (`img/hero-poster.webp`, `img/pour-poster.webp`, `img/collide-poster.webp`)
are single frames extracted from the licensed clips above.

## Generated imagery — Gemini

Photographs cannot be licensed of a product that does not exist, so the can range was
generated on **11 August 2026** via the Gemini API (`gemini-3.1-flash-image`; the
`nano-banana-pro-preview` model was listed as fallback but was not needed this run).

| File | Subject |
|---|---|
| `img/can-citrus.webp` | Citrus Riot can — cadmium yellow wrap |
| `img/can-burn.webp` | Slow Burn can — red-orange wrap (the model doubled the band; adopted as that flavour's livery) |
| `img/can-mood.webp` | Mood Ring can — indigo wrap |
| `img/can-snap.webp` | Cold Snap can — emerald wrap |
| `img/lineup.webp` | All four cans in a row — the model cross-coloured the bands between flavours, and that unplanned detail was adopted as the brand's livery system |

One style brief was repeated verbatim across all five prompts (slim 330 ml matte
aluminium can, white seamless, single softbox, condensation, colour-blocked wrap).
Lettering was explicitly forbidden — generated type arrives as gibberish — so the cans
are deliberately unlabelled and all brand typography on the site is genuine HTML.
Softbox edges intruding into two frames were cropped out; no other retouching.

## Fonts

Unbounded, Instrument Sans and Martian Mono, served from Google Fonts under the SIL Open
Font License.

## Everything else

The code — including the carbonation physics, the pressure/detonation system and the
butterfly-pea pH colour model (anchored to the published colour behaviour of butterfly pea
anthocyanins) — plus the layout, copy and identity are original to this template.
