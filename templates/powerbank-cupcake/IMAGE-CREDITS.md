# CUPCAKE — media provenance

This is a maximalist-typography template: huge, clashing type (Archivo's ultra-black
expanded axis against Instrument Serif italic, Space Mono for hardware truth) does the
visual heavy lifting. The product is fictional; the product photography is AI-generated
(see below) and the cupcake photographs are real.

**Nothing on the page itself declares that CUPCAKE is fictional** — the disclaimer was
removed on 8 August 2026 at the owner's request, on the basis that the template is
delivered to clients with that context given directly. This file is now the only record
of provenance, so keep it accurate.

The cupcake "punctuation" photographs are all **CC0 (public domain dedication)** via
StockSnap, found through the Openverse API on **7 August 2026**:

| File | Used in | Source page | License |
|---|---|---|---|
| `img/hero-cupcake.webp` | Hero — small rotated chip, "the namesake" | https://stocksnap.io/photo/pink-cupcake-NSME1Z2VLU | CC0 |
| `img/name-cupcake.webp` | "Why Cupcake?" — Exhibit A frame | https://stocksnap.io/photo/cupcake-pink-LG0UWR21SG | CC0 |
| `img/buy-cupcake.webp` | Buy section — round sticker, "actual cupcake, not actual product" | https://stocksnap.io/photo/cupcake-dessert-GBQEG43QXW | CC0 |

CC0 requires no attribution; sources are recorded here anyway as repo policy.
Originals were center-cropped and re-encoded to WebP locally with Pillow
(quality 80, `method=6`) — three images, **90 KB** total.

## The product shots (AI-generated)

The four product images are **AI-generated (Google Gemini)**, supplied by the site owner.
They depict a product that does not exist.

| File | Shown as | Source |
|---|---|---|
| `img/product-hero.webp` | Hero shot in "The BRICK, reimagined" | `Cup1.jpg` |
| `img/product-vanilla.webp` | Colorway — Vanilla | `Cup 2.jpg` |
| `img/product-matcha.webp` | Colorway — Matcha | `58cce670-…jpg` |
| `img/product-macaron.webp` | Special edition — The Macaron | `Cup 3.jpg` |

Each source was 768×1024 and carried Gemini's visible four-point sparkle badge on the
table edge at roughly `(668, 919)`, spanning y≈897–941. All four are **cropped to
768×885** — the badge falls outside the frame with ~12px to spare, while the product and
most of the cable stay in shot. No retouching or clone-stamping was used. Re-encoded to
WebP (quality 82–84, `method=6`), **182 KB** for the set.

As with the portrait, cropping removes only the *visible* badge; Gemini's invisible
SynthID watermark survives cropping and re-encoding and is left intact.

An earlier hand-built composite (`product-cupcake.webp` — a licensed Adobe Stock power
bank, 288464158, with a licensed cupcake, 193216356, cut out and stacked in Pillow) was
replaced by these and deleted. The two Stock licences remain on the account.

## The portrait (AI-generated)

| File | Used in | Origin | Notes |
|---|---|---|---|
| `img/eric-ceo.webp` | Founder card — "Eric, chief executive officer" | **AI-generated** (Google Gemini), supplied by the site owner | Depicts no real person |

Eric is a **fictional executive of a fictional company**. The on-page notes that said so
were removed on 8 August 2026 at the owner's request, so this file is now the only place
that records it.

The source file carried Gemini's visible four-point sparkle badge on the subject's left
shoulder, centred near `(668, 923)` in the 768×1024 original. It is **not** retouched out:
the image is cropped to `(57, 40) → (713, 860)` for a 4:5 head-and-shoulders portrait, and
that framing — the normal crop for a headshot card — leaves the badge outside the frame
with ~40px to spare. Re-encoded to 640×800 WebP (quality 82, `method=6`), **31 KB**.

Note that the crop removes only the *visible* badge. Gemini also embeds an invisible
SynthID watermark in the pixels, which survives cropping and re-encoding; that provenance
signal is intentionally left intact, and the AI origin is stated in plain text above and
in the page footer.

Other graphics: the favicon (hand-written SVG battery glyph) and the nav battery
(CSS borders + a scaleX fill) are original to this template. All three typefaces are
served from Google Fonts under the SIL Open Font License.

## Figures

Every figure — capacity, wattage, weight, cycle counts, prices, reviews, and the
company itself — is **invented**. The comparison table's competitors ("Beige Brick™",
"Gas-Station Special") are fictional archetypes, not real products.
