# FORM/01 — image provenance

FORM/01 is a **fictional label** built as a portfolio template. The name, the pieces, the
prices and all copy are original. No real brand's identity, silhouettes or marks are used, and
the garments deliberately carry no visible logos.

## Photography — AI-generated (Google Gemini)

Every image was **generated for this project** on 9 August 2026 via the Gemini API on the
project's own key. No stock photography, no scraped images; the model in the campaign
photograph is not a real person.

Consistency was held with a reference chain: the campaign master (full-body model on seamless
grey) was generated first at 2K with `gemini-3-pro-image`; all six product shots were then
generated with the master attached as an image reference, and three of them ("the same … from
the photograph") are the literal garments the model is wearing, re-shot as floating product
images. One palette — black, white, silver — one backdrop, one light.

| File | Model | Role |
|---|---|---|
| img/hero.webp | gemini-3-pro-image (2K) | Campaign master |
| img/t01-tee.webp, img/p03-trouser.webp, img/s05-sneaker.webp, img/b06-bag.webp | gemini-2.5-flash-image | The exact pieces worn in the master |
| img/j02-jacket.webp, img/c04-cargo.webp, img/l07-longsleeve.webp, img/h08-hoodie.webp, img/v09-vest.webp, img/r10-runner.webp, img/t11-tote.webp, img/k12-beanie.webp | gemini-2.5-flash-image | Collection pieces in the same system |

The sock runner was generated twice: the first attempt came out with side-stripe markings too
close to a real sportswear brand's design language, so it was regenerated with an explicitly
smooth, unmarked upper. Only the clean version ships.

PNG output was cover-cropped and re-encoded to WebP with Pillow (hero 1500×2000 q84, products
1100×1100 q82).

## What is real and what is not

The shop works: twelve pieces, a full-screen product takeover with prev/next, size selection, and
a minimal cart persisted in localStorage (`f01.cart.v1`). Checkout validates an email and a
sixteen-digit card format, then goes nowhere by design and says so in its own voice.
