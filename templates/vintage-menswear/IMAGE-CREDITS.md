# MORROW & FINCH — image provenance

MORROW & FINCH is a **fictional shop**. The name, the address on Ledbury Row, every garment
name, every price and all the copy are original to this template. No real brand's identity is
used; the shopfront signage visible in the hero ("J. Smith & Sons", "The London Hatter") was
invented by the image model and belongs to no real business.

## Photography — AI-generated (Google Gemini)

Every image on this site was **generated for this project** on 9 August 2026 via the Gemini
API, on the project's own key. No stock photography, no scraped images, and no real person,
garment or place is depicted.

Consistency was held with a reference chain: the campaign master (the man on Ledbury Row) was
generated first at 2K with `gemini-3-pro-image`; the first catalogue plate was generated with
the master attached as an image reference; the remaining nine plates were generated with
**both** the master and that first plate attached, which held the same cream backdrop, dress
form, oak table, window light and warm film palette across all ten.

| File | Model | Role |
|---|---|---|
| img/hero.webp | gemini-3-pro-image (2K) | Campaign master — sets palette and light |
| img/p01-overcoat.webp | gemini-2.5-flash-image | Plate I — style anchor for all others |
| img/p02-flightjacket.webp … img/p10-scarf.webp | gemini-2.5-flash-image | Plates II–X, refs: master + Plate I |

PNG output was cover-cropped and re-encoded to WebP with Pillow (hero 1920×1080 q82, plates
840×1120 q80). Total imagery ~654 KB.

## What is real and what is not

The shop works: ten products across five departments, real product pages
(`product.html?id=…`), size and quantity selection, and an Order Book cart persisted in
localStorage (`mf.orderbook.v1`) shared across pages. Validation is real — UK phone, postal
address with postcode when "by post" is chosen, sixteen-digit card format — and the submit
goes nowhere by design. The telephone exchange (TEMple Bar 0134) stopped existing in 1966,
which is rather the point.
