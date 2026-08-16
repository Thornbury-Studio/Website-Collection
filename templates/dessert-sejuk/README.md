# ⚠ SEJUK — NOT COMPLETE

**Do not link this from the hub gallery or the sitemap yet.**

This template is **code-complete but missing its photography**. Fifteen
dessert images were never generated: both Gemini image models returned
HTTP 429 for twenty-eight consecutive attempts across the build session.

Right now the pages render with **broken image placeholders** where every
dessert should be. Structure, copy, ordering flow and layout are all
finished and tested — it is only the pictures that are absent.

## Status at a glance

| | |
| --- | --- |
| Pages | ✅ 5 built — home, board, pickup, house, visit |
| Ordering flow | ✅ Chit → size/add-ons → outlet → computed slot → ticket |
| Behaviour tests | ✅ 26/26 passing |
| Layout | ✅ 0 overflow, 5 pages × 6 widths (320→1440) |
| Contrast | ✅ 18/18 WCAG AA, tightest 4.94:1 |
| Licensed stock | ✅ 3 frames graded and shipped |
| **Dessert photography** | ❌ **0 of 15 — the blocker** |
| **Hub card + sitemap** | ❌ **Deliberately omitted until the above lands** |

## To finish it

1. Generate the fifteen frames — every prompt is in
   [`gen/PROMPTS.md`](gen/PROMPTS.md), each self-contained.
2. Follow [`HANDOFF.md`](HANDOFF.md), which has the grade command, the
   verification battery, and ready-to-paste hub card and sitemap blocks.

The page markup already points at the final filenames, so the site
completes as soon as the WebP files exist — no HTML changes needed.
