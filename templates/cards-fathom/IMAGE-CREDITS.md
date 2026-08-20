# Image & media credits — FATHOM

FATHOM is an entirely original fictional universe built for this showcase.
No creature, name, card layout, logo, sound or mechanic is taken from
Pokémon or any other trading-card property. The rarity ladder (Drift → Glow
→ Pulse → Beacon → Abyssal Signature), the depth-zone taxonomy, the essence
system and all thirty creatures were written for this project first, and
the artwork was generated to match that bible — not the other way around.

## Generation

All 30 illustration masters were generated 20 Aug 2026 via **Higgsfield**
(Nano Banana 2 / Nano Banana Pro, both Google-provided models) at 2K
portrait (1792×2400, 3:4), 2 credits per frame. One STYLE block — painterly
scientific-romantic natural-history plate, dark water, self-lit subject,
"NO text, NO border, pure artwork bleeding to every edge" — was repeated
verbatim across the whole set with only the creature sentence varying;
that is what makes thirty subjects read as one illustrator.

Operational note for future sets: the first submissions ran on the
`nano_banana_flash` backend and failed at 66–83% (transient backend
trouble; failures were **not** charged). The same prompts resubmitted on
**`nano_banana_pro` completed 12/12 at the same 2-credit price**. The
Gemini free path was unavailable outright ("monthly spending cap
exceeded"). Total spend for all 30 masters incl. the wasted flash attempts:
**60 credits** (verified against the balance: 820 → 760).

## The card chrome is not in the images

Frames, names, stats, set glyphs, rarity marks, foil, holographic bands,
glare and the card back are all **HTML/CSS/SVG**, rendered over the pure
artwork. This keeps text crisp at every size, makes rarity a *material
system* (Pulse adds foil, Beacon adds the pointer-tracked holo band,
Signatures carry an autonomous gold sheen), and lets Full Plate variants
reuse approved art at zero cost. The essence glyphs, set chevron, favicon
and card-back compass are hand-drawn SVG, original to this template.

## QA

Three masters (threnody, vesperwing, gravebloom) baked a paper border in
despite the no-border instruction; the artwork inside each frame was
excellent, so the borders were measured with PIL and cropped at export
rather than re-rolled. No re-rolls were needed anywhere in the set — the
30 approved masters are all first-take. Contact-sheet review confirmed a
single consistent painterly hand across both models.

## Export

Every master ships as three WebP tiers cut to exact 3:4 — `-lg` 1096×1462
(inspector), `-md` 560×747 (archive grid), `-sm` 280×374 (binder cells,
related rails). Full art library: 90 files, ~2.8 MB total. Grids and
binder lazy-load; only the inspector and the desk hero load eagerly.

## Audio

All sounds are synthesized in-browser with the Web Audio API (filtered
noise swishes, sparkle arpeggios, an FM bell for Beacons) — original,
unlicensed-because-unneeded, off by default, and the site is complete
muted.
