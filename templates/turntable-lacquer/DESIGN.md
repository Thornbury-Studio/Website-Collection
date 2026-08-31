# LACQUER — design notes

A product site for a fictional mastering turntable brand, built around a
**sourced** glTF base — not primitive geometry authored in Blender on this
machine.

## Asset strategy

Josh's brief priority order was followed:

1. **No Blender MCP** in Cursor — not connected.
2. **Sourced base geometry:** Poly by Google *Vintage Turntable Player*
   (via get3dmodels.com mirror), **221 KB** GLB, CC Attribution.
   Same lineage as the archive-aperture-index lesson — real topology beats
   primitive builds.
3. **Runtime material passes** on top: brushed aluminium (canvas stroke
   roughness + anisotropy), walnut veneer (grain roughness map), vinyl
   grooves (radial canvas pattern), felt mat, acrylic cover (transmission
   + IOR 1.49).

**Environment:** Poly Haven `studio_small_09` **1k HDR** (CC0), self-hosted
as `assets/studio.hdr` (~1.6 MB). Loaded via `RGBELoader` → PMREM. No new
CSP hosts.

## Material families

| family | treatment |
|---|---|
| **Platter / tonearm** | MeshPhysicalMaterial, metalness 0.92, brushed roughness map, anisotropy 0.42 |
| **Plinth** | Walnut colour + procedural grain roughness |
| **Vinyl** | Near-black, radial groove roughness map |
| **Felt** | High roughness, low env response |
| **Cover** | Transmission 1, thickness 0.06, IOR 1.49 (mobile: opaque fallback) |

Mesh → family mapping uses name heuristics + HSL from imported vertex
colours (Poly models ship without descriptive material names).

## Palette

| token | hex | role |
|---|---|---|
| `--ink` | `#0E0C0A` | page ground |
| `--chalk` | `#F0EBE3` | primary type |
| `--muted` | `#A39A8E` | secondary |
| `--lacquer` | `#C67A3A` | single accent |

## Type

- **Fraunces** — display / wordmark
- **IBM Plex Sans** — body, italic accents
- **IBM Plex Mono** — kickers, readouts, chips

## CSP

Mirrors `vercel.json` production header in `<meta http-equiv>`. Draco
decoder vendored under `js/vendor/draco/` for parity with sibling templates
(even though shipped GLB is uncompressed).

**Import map** in `index.html` resolves bare `three` specifiers for
`RGBELoader` (addons import `from 'three'`).

## Credits

| Asset | Source | License |
|---|---|---|
| Turntable geometry | Poly by Google (via get3dmodels.com) | CC Attribution |
| Studio HDRI | Poly Haven `studio_small_09` 1k | CC0 |

## Open items

- Hub card still uses SVG hero until a WebP still is captured from live render.
- Poly base is low-poly with vertex colours — closer to Aperture's *structure*
  lesson than its surface wear; next elevation is a higher-detail sourced model
  or Blender detail pass when available.
