# LODE — Design brief

B2B brand & web design agency sales sample. Motion language inspired by
papertiger.com (GSAP kinetic type + image trail + news hover preview), not a
clone: cobalt on paper, original brand, no Webflow.

## Decisions

1. **Material:** print-poster on warm paper — flat ink, bold type, photo +
   poster covers. Not glassmorphism.
2. **Light:** hard graphic contrast; trail/float media carry the color hits.
3. **L1 tactility:** project-card mask reveal; services scrub; magnetic team.
4. **L2 signatures (page-scoped):**
   - Home: Clients Gallery kinetic image trail
   - News: row-hover cover that follows the cursor (`quickTo`)
5. **Fonts:** default **Unbounded + Plus Jakarta Sans**. Live switcher also
   tries Syne / Instrument Sans and Fraunces / Plus Jakarta (persisted in
   `localStorage`).

## Pages

| Page | Role |
|---|---|
| `index.html` | Hero, clients trail, work teaser, services, quotes, CTA |
| `work.html` | Project grid + looping motion study |
| `studio.html` | Video hero, principles, magnetic team |
| `expertise.html` | Capability marquees + principles |
| `news.html` | Insight index + cursor-follow covers |

## Stack

Static HTML + `css/style.css` + `js/main.js`. CDN GSAP 3.15 + ScrollTrigger.
Media: generated PNG covers + Pexels MP4 (credited).

## Reduced motion

Hero lines visible; trails/floats/magnetic off; marquees paused; video
paused with poster only; entrances become opacity fades.
