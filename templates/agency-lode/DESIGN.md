# LODE — Design brief

B2B brand & web design agency sales sample. Motion language inspired by
papertiger.com (GSAP kinetic type + image trail + news hover preview), not a
clone: cobalt on paper, original brand, no Webflow.

## Decisions

1. **Material:** print-poster on warm paper — solid paper/ink nav (no glass),
   squarer buttons, photo/poster covers, cobalt + ember accents. One LODE
   detail: ember ink rule + cobalt brand dot in the hero.
2. **Light:** hard graphic contrast; trail/float media carry the color hits.
3. **L1 tactility:** project-card mask reveal; services scrub; magnetic team.
4. **L2 signatures (page-scoped):**
   - Home: Clients Gallery kinetic image trail (desktop fine-pointer);
     touch/coarse gets tap-to-cycle or a static poster strip
   - News: row-hover cover that follows the cursor (`quickTo`), soft
     enter/exit, covers preloaded
5. **Fonts:** default **Unbounded + Plus Jakarta Sans** (loaded eagerly).
   Syne / Instrument Sans and Fraunces lazy-load on switcher use
   (persisted in `localStorage`). Switcher sits above the back-link on
   small screens.
6. **Hero:** brand-scale **LODE** first; one headline, one sub, CTAs.
   Stats sit below the fold. Hero type stays visible if GSAP fails,
   errors, or times out (`hero-animating` only while the timeline runs).
7. **Stubs:** `case.html#…` and `article.html#…` keep work/news links from
   dead-ending.

## Pages

| Page | Role |
|---|---|
| `index.html` | Hero, stats band, clients trail, work teaser, services, quotes, CTA |
| `work.html` | Project grid → case stubs |
| `case.html` | Shared case stub (hash id) |
| `studio.html` | Video hero, principles, magnetic team |
| `expertise.html` | Capability marquees + principles |
| `news.html` | Insight index + cursor-follow covers |
| `article.html` | Shared article stub (hash id) |

## Stack

Static HTML + `css/style.css` + `js/main.js`. CDN GSAP 3.15 + ScrollTrigger.
Media: generated PNG covers (`news-*.png`) for work grid, trail, and news;
Pexels MP4 for studio only (credited).

## Reduced motion

Hero lines visible; trails kinetic off (static strip on); floats/magnetic
off; marquees paused; all videos paused/hidden with poster only; entrances
become opacity fades.
