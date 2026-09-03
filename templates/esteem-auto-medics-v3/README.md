# EAM v3 — design concept (Client Preview)

This is a design exploration ("version 3") for Esteem Auto Medics, not the
production site — the live build lives in its own standalone repo. It is
registered on the Website Collection hub under **Client Preview** (gated),
next to the original PPF-first rebuild in `../esteem-auto-medics/`. It is
not in the public catalog. Where v2 was
typography-led with abstract CSS-only surfaces, v3 pushes real photography and video:
a minimal, high-contrast direction with full-viewport media panels, one message and one
action per screen, and understated motion. Everything is a single self-contained
`index.html` using real client facts and pricing only (content cross-checked against the
live production site; operating hours, email and coating-product spec are intentionally
absent because they are unconfirmed).

## Media assets (self-hosted; Pexels license)

Hotlinking Pexels is blocked by the collection CSP (`img-src`/`default-src 'self'`).
Masters live in `video/` and `img/`. Source downloads stay in `video/src/` (gitignored).
All independent-creator uploads; shots with readable manufacturer badges or plates
were rejected during selection.

| Use | File | Source | Creator |
|---|---|---|---|
| Hero video (black paint macro) | `video/hero.mp4` | pexels.com/video/6159202 | Pavel Danilyuk |
| "Road keeps score" video (night road POV) | `video/road.mp4` | pexels.com/video/33650283 | Kim Dodge |
| Coating photo (booth spray application) | `img/coating.webp` | pexels.com/photo/30250199 | Mohammad Hammad |
| Full-body gloss video (studio LED sweep) | `video/gloss.mp4` | pexels.com/video/6159204 | Pavel Danilyuk |
| Supercar silhouette video (rim-lit, dark) | `video/super.mp4` | pexels.com/video/29498796 | Michael Pronin |
| Accident repair photo (hood-up assessment) | `img/repair.webp` | pexels.com/photo/37809554 | Bulat843 |
| Spray painting video (painter, respirator) | `video/paint.mp4` | pexels.com/video/8469678 | Anastasia Shuraeva |
| Servicing photo (underbody with work light) | `img/service.webp` | pexels.com/photo/7019602 | cottonbro studio |
