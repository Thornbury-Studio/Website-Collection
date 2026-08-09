# ATELIER № 8 — design record

Recorded from the built pages (2026-08-09), ground truth over intention.

## World

A private art club presented as **the catalogue of its current hang**. Plates, apparatus,
provenance and tissue-guard leaves; membership reads as *registration of interest*,
sign-in as a key sent by hand. Five pages: frontispiece (`index`), The Hang
(`collection`), Calendar (`viewings`), Membership (`apply`), Sign in (`login`).
Extremely simple on purpose — no dashboards, no clutter.

## Tokens (css/style.css `:root`)

- Paper: `#FAF9F5`; tint `#F4F2EC`. Ink `#171614` / `#57544D` / `#6E6A61`.
- Hairlines `#E3E0D6`. Champagne foil: `#B99B62` rules · `#9A7F4C` decorative ·
  `#7C6538` **whenever champagne must be read** (kept ≥4.5:1).
- Error (functional only): `#9C4F3B`. Square corners everywhere; no shadows except the
  soft one under the tissue leaf.

## Type

- **Bodoni Moda** (variable, optical sizes, true italics) — wordmark, headings, plate
  numbers, and artwork titles in italic.
- **Familjen Grotesk** — apparatus: letter-spaced caps for artists, labels, nav, buttons.

## Components

- **Plate**: `.plate-fig` (image + `.tissue` leaf) + `.caption` (plate №/room in
  champagne serif caps · artist caps · italic title · media line · provenance).
- **Tissue leaf**: translucent paper layer over every plate; lifts (`translateY(-103%)`,
  1.1 s) when the plate enters view — the one authored motion. Removed entirely under
  `prefers-reduced-motion`.
- **.noted**: quiet italic-serif inline confirmation that replaces buttons — no toasts
  anywhere on this site.
- **Forms**: underline-only inputs, italic serif placeholders, error in the hint line.
- **Buttons**: square, ink-filled or hairline-quiet; spinner + label swap while busy.

## Behaviors

Enquire per plate (`no8.enquiries.v1`), place requests per event (`no8.places.v1`),
one application (`no8.application.v1`, returning visitors see their filing), sign-in
by link fiction (no password, honest copy). Background-tab reveal fallback included.

## Imagery

Eight AI plates in one reference chain (see img/IMAGE-CREDITS.md): the Kaan master,
six further works in distinct hands, and the dinner room — which hangs the master
above the table, matching the Calendar's dinner copy.

## Boundaries

Self-contained multi-page template, shared `css/style.css` + `js/main.js` keyed by
`body[data-page]`, zero dependencies, CSP `script-src 'self'`. Direction contract in
index.html's opening body comment (seed 161fdd40).
