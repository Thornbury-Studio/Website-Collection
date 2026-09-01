# EPHEMERIS — EXHIBIT 01 · design notes

A gallery that shows exactly one object at a time. Exhibit 01 is a real
armillary sphere made in Kraków in 1771, standing in an unlit room and read by
one moving light.

Sibling to [PARALLAX](../exhibition-parallax/DESIGN.md) (Exhibit 00) — same
sales-instrument standard, same structural conventions (act-based scroll
narrative, plateau holds, fallback chain, CSP discipline). Opposite premise:
PARALLAX is a thousand invented fragments that could not exist; EPHEMERIS is
one real object that does, and the whole build is about not getting in its way.

## The governing idea

> **Most of what is worth seeing on an old instrument is only visible when the
> light is nearly parallel to its surface.**

That is a real conservation fact, and it is the entire site. The room is dark.
The engraving on the horizon band is invisible under ordinary light and comes
back at four degrees of incidence. So the interaction is not decoration: in
act III the lamp is handed to the visitor, and the reveal *is* the exhibit.

An ephemeris is a table of where things will be. The light moves; the object
stays. That is the other half of the name.

## The walk (one scroll, ~11.5 viewports)

| p | act |
|---|---|
| 0.00–0.17 | **I · The Object** — the whole instrument at distance, out of an unlit room. Hold at 0.125–0.165 |
| 0.24–0.39 | **II · The Horizon Ring** — a fall onto the graduated band, from *above* its plane so the engraved face is actually pointed at. Hold at 0.335–0.385 |
| 0.47–0.67 | **III · Raking Light** — the room dims, the lamp passes to the pointer, and marks cut in 1771 come up out of the brass in the order they were cut. Long hold at 0.545–0.665: this is the play zone |
| 0.74–0.88 | **IV · The Mechanism** — the pull-back; the instrument turns on its vertical axis while the lamp runs its own inclined arc. Hold at 0.835–0.88 |
| 0.95–1.00 | **V · Resting** — the composition it is left in; the canvas dissolves and the notes arrive |

The notes (object, acts, visit, next) are plain readable DOM — and they are
also the whole site under no-JS or CDN failure.

## The hero — what it is and what it is not

**A real, downloaded, licensed scan. Nothing about the object is generated.**

- **Armillary sphere (1771)**, Franciszek Słupski, built for the doctoral thesis
  he defended at the Philosophy Department of the University of Kraków.
- Jagiellonian University Museum, Collegium Maius. Inventory 4307; 307/V.
- Digitised by the Regional Digitalisation Lab, Małopolska Institute of Culture
  for *Virtual Museums of Małopolska*.
- Source: Zenodo record [10.5281/zenodo.21375741](https://doi.org/10.5281/zenodo.21375741),
  file `41e23659c75241459eec6477d9e77c93_normalized_compressed.glb`.
- **Licence: CC BY 4.0** — and per this repo's standing rule the badge was not
  the evidence. The licence is asserted *inside the delivered file*, at
  `asset.extras`: `license: "CC-BY-4.0"`, `author: "Virtual Museums of
  Małopolska"`, plus the source URL. Attribution is carried in the page footer,
  which is what CC BY requires and is not a "demo disclaimer".

Chosen over the 1828 Jüttner armillary in the same collection (also CC BY):
the 1771 has a far denser ring nest, a legible engraved horizon band, claw-foot
gilt legs and an inset compass in the base — six times the mechanical incident,
which is what a slow dolly-in actually needs.

### Processing

309k triangles, four 1K PBR maps (base colour, normal, AO, metal-rough), Draco
geometry. Re-encoded the three PNG maps to WebP in place (`EXT_texture_webp`,
geometry untouched): **5.90 MB → 2.26 MB**. Textures were already 1K, so the
GPU-memory ceiling from [[gltf-model-in-template-csp]] was never in play.

### What the scan cannot do

**It is one fused solid.** Four mesh chunks, but they are 65k-vertex index
splits of a single surface sharing one material — there are no separable rings
in the file. A per-ring articulation would mean slicing a fused mesh along a
plane, and the radius profile shows no gap to slice at (base r 0.41 · legs
0.31→0.10 · sphere 0.26→0.32 · **band y 0.70–0.78 r 0.345** · pole 0.15 — the
legs are continuous through the whole span).

So act IV does **not** fake internal articulation. What turns is the whole
instrument about its vertical axis, which is what a museum turntable does, and
the orbital motion the piece is actually about lives in the light: the lamp
runs a 23.4°-inclined arc around the object throughout. Stated here because
"rings and arms in independent orbital motion" is the obvious thing to claim
and this build does not do it.

## Art direction

- **Unlit room, not black.** A near-neutral gradient dome with three drifting
  bands of haze, low and toward the front. Saturation here is the tell: any
  real colour and a dark room reads as a lit purple backdrop.
- **Brass, recovered.** The scan ships `metalness 1.0` against a rough map,
  which is how photogrammetry describes brass and how it always renders as mud
  — a fully metallic surface has no diffuse term, so the baked colour in the
  albedo is discarded. Treated as mostly-dielectric (roughness 0.58, metalness
  0.28) and the plate comes back.
- **A procedural PMREM studio**, no `.hdr`, no new CSP host: gradient surround
  plus five emissive *rectangles* — a tall narrow key front-left, a weaker
  second key front-right, cool fill, rim, floor bounce. The rectangle shape is
  the point: a long softbox draws the long specular streak down a ring.
  `NeutralToneMapping`, exposure 1.15, metal kept off the clip.
- **The compass cover is not glass-with-transmission.** Transmission refracted
  the unlit room instead of the dial 4 mm underneath and the cover rendered as
  a hole punched through the base. Nearly clear, very smooth, high
  `envMapIntensity`, no transmission pass on any tier — which is also the
  cheaper answer on mobile.
- **No secondary motion at all.** No dust motes, no light particles, no
  instanced debris. One lit object in a dark room does not need company, and
  PATTERNS.md's instanced-debris recipe is therefore not invoked rather than
  invoked badly. The only atmosphere is a shaded volume on the backdrop sphere.
- Type: Spectral (serif, for an antiquarian instrument) + IBM Plex Mono (for
  data). Ink is bone `#e8e3d8`; the one accent is brass `#c69a4e`.

## Technique

- **three.js r180 `WebGPURenderer`**, pinned from jsdelivr — the only CDN this
  repo's CSP allows. It selects a WebGPU backend where one exists and WebGL2
  where it doesn't; the TSL node graphs compile to WGSL or GLSL from the same
  source, so there is **one code path here, not one per renderer**. Verified
  running on the WebGPU backend in Chrome.
- **Vendored loaders.** `GLTFLoader` / `DRACOLoader` / `BufferGeometryUtils`
  copied and their bare `from 'three'` rewritten to the same absolute pinned
  build URL the app imports — `three.webgpu.js`, so there is exactly one three
  instance. (`three.tsl.js` is *not* vendored: `three.webgpu.js` already
  exports the `TSL` namespace, so the shim is unnecessary.)
- **Camera physics.** The keyframe spline is a non-uniform Hermite that zeroes
  its tangents across repeated keys (plateaus), same as PARALLAX. On top of it
  the camera position, look target and scroll `p` are each a **critically
  damped spring** integrated on real elapsed time in fixed substeps — not a
  per-frame lerp. A lerp's speed depends on frame rate and has no momentum, so
  it cannot arrive at a plateau with weight; a critically damped spring arrives
  asymptotically, which is what makes a hold feel like a hold rather than a
  freeze. Substepping keeps the stiff reduced-motion constants stable when a
  frame runs long.
- **Responsive framing.** Distances are scaled by the ratio of the desktop
  vertical half-angle to the real *binding* half-angle
  (`min(vHalf, hHalf)`), so a phone held upright pulls back exactly enough
  (RESP ≈ 1.69 at 390×844) instead of running the object off both edges.
- **The reveal (act III).** `N·L` amplified, not `1 − |N·L|`. The lamp is held
  ~4° above the plane of the band, so the flat brass returns N·L ≈ 0.075 and
  stays dark while a groove wall tilted 25° into the lamp reaches 1.0 — six
  times the contrast with the field still dark. The relief is real: it comes
  out of the scan's normal map, so the marks that appear are the marks that are
  there. Masked to the band's up-facing fragments by a world-space
  radius-and-height test (rotation-invariant, so act IV's turntable is
  unaffected) — unmasked, the band's vertical rim faces the lamp head-on and
  burns white while the engraved face beside it stays dark.
- Zero image assets in the template. The only binaries are the `.glb` and an og
  card that is a screenshot of the site.

## Things that were wrong first, kept here so they are not rediscovered

- **`p` must be measured against the track, not the document.** The notes are a
  real section in normal flow, so `document.body.scrollHeight` includes their
  height; `p` then reaches 1.0 only at the bottom of the notes and acts IV–V
  play out behind a page of opaque text that has already scrolled over the
  canvas. PARALLAX computes against the document and gets away with it; this
  build does not.
- **Fixed walk chrome has to be dismissed explicitly.** Labels, HUD and
  vignette are `position: fixed`; without a `reading-on` class they hang over
  the notes for the rest of the page.
- **A gain high enough to saturate the flat brass throws away the relief it was
  added to show.** First pass used ×6.5 and blew the object white. Same family
  as CANDELA's clipping lesson.
- The wide part of the bounding box is the **wooden base** (r 0.41), not the
  band (r 0.345). A bbox-derived radius aims every close-up 0.06 too far out —
  measure the ring off the loaded geometry.
- No `overflow-x: hidden` on `body` anywhere: it masks real overflow rather
  than fixing it. Swept clean at 390 px with nothing hiding it.

## Verification

Real Chrome over CDP (chrome-devtools MCP — the Browser pane suspends rAF and
CSS transitions while hidden, which fabricates black frames and frozen
opacities on a page like this).

- Desktop 1440×900 and mobile 390×844 @3 with `mobile,touch` (so
  `pointer: coarse` genuinely matches).
- All five acts reached and screenshotted; camera asserted at its authored
  keyframe at each hold.
- Mouse-reveal confirmed *pointer-driven*, not just present: the grazing sweep
  moves across the band between two pointer positions. Touch path exercised on
  mobile.
- Zero horizontal overflow at 390 px, with nothing masking it.
- **All four fallback paths triggered for real, not simulated in the app:**
  no-JS via a `sandbox=""` iframe (scripting genuinely off, `<noscript>`
  applies) → reading room only; CDN unreachable via a broken module specifier →
  8 s watchdog folds to `js no-3d`, scroll unlocked; GPU failure via
  `navigator.gpu` removed and `getContext('webgl2')` returning null → same
  fold; reduced motion via the exact `matchMedia` query the module reads →
  spin drift measured at **0.000 over 5 s** while the act still arrives and the
  plateau still lands on its authored camera.

Not covered: a real handset. Same gap PARALLAX notes; CDP emulation is the
bar, and this matches it.

## Open

**The atmospheric plate is not shipped.** One generated 4K loop was planned for
the environment; the Higgsfield account was at 4.78 credits against a 20-credit
floor (MiniMax H3, the cheapest video model), so nothing was generated —
generating a worse thing was not the alternative, generating nothing was. The
procedural air stands alone and the page is complete without it.

The integration is already in place and inert: drop `img/air.mp4` in and set
`HAS_PLATE = true` in `js/app.js`. The plate mixes into the same air node graph
over two seconds; nothing else changes. The prompt is written and costed in the
build report.
