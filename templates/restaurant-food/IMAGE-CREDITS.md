# EMBER — image credits & processing

All photography is **licensed from Adobe Stock** (free-tier collection) through the site
owner's Adobe account, then reframed and graded with the Adobe Photoshop and Lightroom
APIs. No third-party copyrighted material is used, and none of the images are AI-generated.

EMBER itself is a fictional restaurant created for template showcase purposes.

| File | Adobe Stock ID | Reframe (Photoshop) | Grade (Lightroom) |
|---|---|---|---|
| `img/hero-coals.webp` | 314047983 | 2958×1972 → 1800×1013 | `Style: Film-Inspired — Soft Ember` |
| `img/sparks.webp` | 369650300 | 8256×5504 → 1600×900 | `Color — High Contrast` |
| `img/flambe.webp` | 204352639 | 9223×6594 → 1200×1500, subject-detected on "the flames in the pan" | `Creative — Warm & Moody` |
| `img/room.webp` | 182558747 | 5760×3840 → 1400×933 | `Creative — Warm Shadows` |
| `img/dish-steak.webp` | 666389882 | 5000×3333 → 900×900, subject-detected on "the steak" | `Subject: Food — FD01` |
| `img/dish-salmon.webp` | 282413849 | 6016×4016 → 900×900, subject-detected on "the salmon steak" | `Subject: Food — FD01` |
| `img/dish-brisket.webp` | 360093134 | 5760×3840 → 900×900, subject-detected on "the sliced smoked brisket" | `Subject: Food — FD03` |
| `img/dish-veg.webp` | 328944864 | 5184×3456 → 900×900, subject-detected on "the grilled vegetables" | `Subject: Food — FD01` |
| `img/rosemary.webp` | 312065770 | 3901×3246 → 1000×1000, then `image_remove_background` cutout | — (alpha preserved) |

## Pipeline

1. `asset_search` (Adobe Stock) → `asset_license_and_download_stock`
2. `image_crop_and_resize` — Photoshop subject/prompt detection picks the crop, not a centre guess
3. `image_apply_preset` — Lightroom presets do the colour grade
4. `image_remove_background` — Photoshop cutout for the floating rosemary in the hero
5. Local re-encode to WebP (Pillow, quality 72–80, method 6) — 846 KB for the full set

## Notes

- Portrait crops from landscape sources fall back to letterbox padding; the dish shots are
  square reframes for that reason.
- The `sparks` layer is composited in CSS with `mix-blend-mode: screen`, so its blacks need
  to stay genuinely black — hence the high-contrast grade rather than a warm one.
