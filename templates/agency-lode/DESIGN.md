# LODE — Design brief

B2B brand & web design agency sales sample. Motion language inspired by
papertiger.com (GSAP kinetic type + one mouse-trail signature), not a clone:
cobalt on paper, original brand, no Webflow.

## Decisions

1. **Material:** print-poster on warm paper — flat ink, bold type, handmade
   client posters (SVG). Not glassmorphism.
2. **Light:** hard graphic contrast; trail posters carry the color hits.
3. **L1 tactility:** project-card mask reveal; services scrub numbers.
4. **L2 signature (one only):** Clients Gallery kinetic image trail
   (GSAP `quickTo` + staggered lag). No custom cursor, no WebGL, no Lenis
   scroll-jacking.

## Stack

Static `index.html` + `expertise.html` + `css/style.css` + `js/main.js`.
CDN: GSAP 3.15 + ScrollTrigger. Fonts: Syne + Instrument Sans.

## Reduced motion

Hero lines visible immediately; trail disabled; marquee paused; entrances
become simple opacity fades.
