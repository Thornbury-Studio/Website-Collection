---
name: FATHOM
description: An original deep-sea creature-card universe — a naturalist's paper logbook holding windows into the abyss. Collecting is real (localStorage log, simulated trawls); the plates are the product.
colors:
  paper: "#f2ecdd"
  paper-deep: "#e7dfc9"
  card-paper: "#faf6ea"
  ink: "#15202b"
  ink-soft: "#3d4c5c"
  brass: "#8f7134"
  brass-bright: "#c9a75c"
  abyss: "#071019"
  abyss-hi: "#0d1d2c"
  lume: "#6fe3ff"
  ember: "#ffa14f"
  volt: "#8be9ff"
  frost: "#cfeaff"
  bloom: "#6ee8a6"
  veil: "#b993ff"
  tide: "#5cb8ff"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    note: "opsz 9..144, wght 300..900; big heads at high opsz, SOFT default"
  body:
    fontFamily: "Spline Sans, system-ui, sans-serif"
  label:
    fontFamily: "Spline Sans Mono, Consolas, monospace"
    fontSize: "10.5px"
    letterSpacing: "0.14em"
    textTransform: uppercase
rounded:
  card: "14px"
  plate-art: "8px"
  chip: "999px"
---

# FATHOM — design system

## The one idea

A naturalist's logbook that holds windows into the abyss. The UI is warm
paper, ink and brass — a survey ledger you could hold. The cards ("plates")
are the only dark objects on every page: rectangles of deep water that glow.
That inversion IS the visual identity: the site never competes with the
cards, and every plate reads as a specimen window cut into paper.

## The universe

**FATHOM** is the archive of the **Meridian Trench Survey** — a fictional
deep-water expedition that issues collectible specimen plates of the
creatures it records. Tagline: *"Some light never surfaces."*

- **Depth zones** (regions): PHOTIC (0–200 m) · TWILIGHT (200–1,000 m) ·
  MIDNIGHT (1–4 km) · ABYSSAL (4–6 km) · HADAL (6 km+). Deeper skews rarer.
- **Essences** (types): what a creature's light is made of — EMBER (warm),
  VOLT (storm), FROST (cold), BLOOM (living colony), VEIL (shadow/absence),
  TIDE (kinetic water). Each has a colour and a small SVG glyph.
- **Rarity is a luminescence scale**, native to the world:
  1. **Drift** — matte plate, plain brass rule. The everyday sea.
  2. **Glow** — the frame's inner edge carries the essence light.
  3. **Pulse** — animated bioluminal border; foil shimmer on the art.
  4. **Beacon** — full holographic treatment, pointer/tilt-reactive.
  5. **Abyssal Signature** — two per Descent (AS-01, AS-02). Full-bleed art,
     gold-ink serial, deep animated shimmer. Mythic: titles, not names.
- **Sets are Descents.** Launch set: **Descent I — The Long Dark**,
  36 plates (24 creatures, 4 environmental "Field" plates, 6 Full Plate
  variants, 2 Signatures). **Descent II — The Glass Gardens** is teased as
  "in preparation" — the archive is alive.

## Why it isn't Pokémon

No battles, no trainers, no evolution mechanics, no "catching". The frame is
natural history: you *log* specimens, complete survey pages, and pin
favourites to a display shelf. Stats are survey data (depth range, length,
lumen output), not combat numbers. Tone: David Attenborough meets a
collector's cabinet, adult enough to be a real modern IP.

## Architecture

- The **card chrome is HTML/CSS, never baked into the art**. Generation
  produces pure borderless illustrations; frames, names, stats, set glyphs,
  rarity materials, foil and holo are all DOM. Text stays crisp at any size,
  rarity is a *material system*, and variants (Full Plate) reuse approved
  art for free.
- `js/cards-data.js` — the single source of truth (creatures, plates,
  zones, essences, rarity, lore). Completion figures are computed from it.
- `js/collection.js` — localStorage log (owned counts, pins, new flags,
  trawl history), CustomEvent on change.
- `js/holo.js` — shared plate renderer + tilt/glare/foil pointer engine
  (touch drag on mobile; reduced-motion kills tilt).
- `js/audio.js` — synthesized-only sounds (flip, shimmer, beacon chime,
  trawl tear, page turn). Muted by default until first toggle; site is
  complete silent.
- Pages: `index.html` (the survey desk: hero plate demo, expedition status,
  display shelf, milestones) · `archive.html` (browse/search/filter) ·
  `binder.html` (the Log: 9-slot spreads, embossed empty slots, page
  completion) · `trawl.html` (pack opening: hold-to-haul, card-by-card
  reveal, rarity-gated effects).

## The Trawl (pack opening, no money)

Five plates per trawl, free and unlimited — this is a fictional archive, not
a shop; there is nothing to buy and no pity-timer psychology. Distribution:
every trawl guarantees a Glow+, Beacons are genuinely uncommon, Signatures
are rare events. Reveal pacing: hold to haul the net, then flip plates one
by one; Pulse+ plates hold a beat longer under shimmer before turning.

## Collection feeling

Completion ring per Descent and per binder page; "missing" is always
visible as embossed slots (want is stronger than have); recently logged
plates carry a small brass NEW pip; milestones are quiet brass stamps on
the desk (First Light, Ten Fathoms, The Field Survey, The Long Dark
complete). No streaks, no FOMO, no dark patterns.

## Performance

Art ships as WebP tiers: `-lg` (1096w, inspector), `-md` (560w, grid),
`-sm` (280w, binder cells). Grid and binder always lazy-load; the inspector
upgrades in place. Aspect-ratio boxes everywhere for zero layout shift; the
36-plate set needs no virtualisation, just discipline.
