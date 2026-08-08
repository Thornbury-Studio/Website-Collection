# SMALL HOURS — image provenance

SMALL HOURS is a **fictional brand** built as a portfolio template. The name, the Tiong Bahru
address, every product and all copy are original. The design brief was "the premium fashion
e-commerce formula, interpreted for childrenswear" — studied from real premium fashion sites,
copied from none.

## Photography — AI-generated (Google Gemini)

Every image was **generated for this project** on 9 August 2026 via the Gemini API on the
project's own key. **The children in the campaign photographs do not exist** — they are
entirely synthetic, shown mostly from behind in everyday clothing in a garden, and no real
child's likeness was used or referenced.

Consistency was held with a reference chain: the campaign master (two children on a garden
path, `gemini-3-pro-image` at 2K) was generated first; the first flat-lay was generated
against it; the remaining eleven flat-lays were generated against both, holding one oatmeal
linen backdrop, one soft daylight, and one oat/butter/sage/clay palette. Four products — the
sage tee, butter camp shirt, clay short and ecru trouser — are the literal garments worn in
the campaign.

| File | Model | Role |
|---|---|---|
| img/sh-hero.webp | gemini-3-pro-image (2K) | Campaign master — "The Long Afternoon" |
| img/e01-tee.webp | gemini-2.5-flash-image | Flat-lay anchor, refs: master |
| img/e02…s12 (11 files) | gemini-2.5-flash-image | Flat-lays, refs: master + anchor |
| img/ed-afternoon.webp | gemini-2.5-flash-image | Journal editorial, refs: master |
| img/ed-detail.webp | gemini-2.5-flash-image | Folded-stack detail, refs: master + anchor |

PNG output was cover-cropped and re-encoded to WebP with Pillow (hero 1920×1080, flat-lays
900×1200, editorial 1400×1050). Total imagery ~2.3 MB across 15 files.

## What is real and what is not

The shop works: twelve pieces in four collections, product pages (`product.html?id=`) with
age-based sizing (2Y–8Y), a "goes well with" strip, and a bag persisted in localStorage
(`smallhours.bag.v1`) with a live free-delivery-over-S$120 line. Checkout validates a name,
email and sixteen-digit card format, then goes nowhere by design and says so.
