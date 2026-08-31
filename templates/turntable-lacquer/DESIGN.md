# TAPE//LACQUER — design & asset log

Slug folder: `turntable-lacquer` (hub card). Live concept: underground cassette label **TAPE//LACQUER**, not the prior LACQUER turntable catalogue.

## Direction

Chaotic warehouse listening room — fixed full-bleed **video + WebGL** stage (VOLTFLOOD-adjacent layout), overlapping HUD, scanlines, ticker. Scroll raises STATIC; hold-click burns the tape. **No sticky product-catalog chrome.**

## 3D (sourced only — no procedural meshes)

| Asset | Source | License | Path |
|-------|--------|---------|------|
| Boombox | [Poly Haven — boombox](https://polyhaven.com/a/boombox) | CC0 | `assets/models/boombox/` |
| Portable cassette player | [Poly Haven — portable_cassette_player](https://polyhaven.com/a/portable_cassette_player) | CC0 | `assets/models/cassette/` |
| Warehouse HDRI | [Poly Haven — empty_warehouse_01](https://polyhaven.com/a/empty_warehouse_01) | CC0 | `assets/warehouse.hdr` |
| Studio HDRI (fallback) | [Poly Haven — studio_small_09](https://polyhaven.com/a/studio_small_09) | CC0 | `assets/studio.hdr` |

Materials are **authored textures from glTF** — scene.js only applies environment map, no canvas-generated roughness maps.

## Video

| Asset | Source | License | Path |
|-------|--------|---------|------|
| Warehouse loop | [Pixabay #40130](https://pixabay.com/videos/warehouse-industry-metal-40130/) | Pixabay License | `assets/bg-warehouse.mp4` |

## Stack

- Vanilla HTML/CSS/JS + Three.js 0.180 (jsDelivr + import map)
- `js/app.js` — `TLSTATE` (scroll, pointer, 118 BPM, burn charge)
- `js/scene.js` — loads glTF + HDRI, point static rain
- CSP: self-hosted media + scripts; no new external hosts

## Fallbacks

- `no-3d` / `prefers-reduced-motion`: static SVG poster, video hidden, reduced motion on rig
- `js/boot.js` — 14s watchdog → `no-3d`

## Verify

`node templates/foundry-harlowe/src/serve.mjs` → `http://localhost:8123/templates/turntable-lacquer/`

Breakpoints: 320, 390, 1440.
