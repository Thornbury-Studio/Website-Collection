# PARALLAX — EXHIBIT 00 · design notes

An international digital-art exhibition dedicated to objects that cannot exist.
The website is the first exhibit: **Exhibit 00 is the site itself.**

## The governing idea

The name is the thesis. Real-world "impossible object" sculptures (Penrose
tri-bars) exist only from one exact viewpoint — *parallax is what destroys
them*. So the whole experience is built on one rule:

> **The visitor's line of sight is the medium.**

Everything the site does is a version of that sentence. Scroll moves the
sightline along one continuous camera path; the pointer (or a thumb-drag on
touch) bends it. Works assemble when you stand in the right place and shear
apart when you move — and the visitor can break every alignment themselves.

## The walk (one scroll, ~11 viewports)

One world, one camera, one population of ~1,340 porcelain fragments that
**reassembles** from work to work — never separate scenes stitched together.
The travel between exhibits is a storm of the same matter flying ahead of you.

| p | act |
|---|---|
| 0.00–0.10 | **00 · The Exhibition Itself** — eight ink letters scattered in depth; the first scroll swings the camera onto the one axis where they spell PARALLAX (true anamorphosis: each glyph is placed by unprojection from the alignment camera and scaled by its distance) |
| 0.17–0.285 | **01 · Vessel, Pouring Itself Back Together** (Amara Okafor) — an amphora of porcelain flakes perpetually reassembling from its own debris field, upward |
| 0.36–0.55 | **02 · Nine Doors, Larger Inside** (Ren Ishikawa) — a fly-through colonnade of shard portals ending in a rose ring four times their size |
| 0.61–0.73 | **03 · A Surface Learning to Swallow Itself** (Beatriz Sandoval) — a torus whose surface rolls through its own throat forever, seen down the hole |
| 0.80–0.945 | **04 · Alignment No. 00** (everyone, at once) — every fragment gathers into a Penrose tri-bar as the lens tightens (dolly-zoom 42°→16°, camera 70 units out on the (1,1,1) axis, near-orthographic so the open ends truly overlap). At alignment the bars *print themselves in ink*. Move the pointer: the joint shears open. Keep scrolling: the camera swings off-axis and the coda label answers — *"It was never joined. You were simply standing in the right place."* |
| 0.945–1 | dissolve to porcelain white; the DOM catalogue arrives |

The catalogue (works list, artists, touring cities, tickets) is plain
readable DOM — it is also the whole site under no-JS / CDN failure.

## Art direction

- **Porcelain, not black.** The predictable experimental-3D move is chrome on
  black; this is an over-lit bone-white void (`#ece8e0`) with warm/cool
  hemisphere shading. Colour lives **only on matter**: a dichroic thin-film
  ramp on grazing angles (iq cosine palette), biased per act — silver-violet,
  cobalt, ochre, viridian.
- **Ink is for impossible things.** The typography is ink; at the climax the
  tri-bar joins the type system by darkening to ink as it aligns.
- **Wall labels, not sections.** Each work gets a gallery label (artist, year,
  materials line, one curator's sentence). The materials lines do the poetry:
  "unfired porcelain, gravity in refusal".
- Type: Archivo (variable width, expanded for display), Archivo Black in-scene
  via canvas textures, IBM Plex Mono for labels.

## Technique

- Three.js (jsdelivr ES module, pinned 0.180.0) — the collection's first
  WebGL child site. No other libraries; scroll smoothing, camera splines
  (non-uniform Hermite with plateau handling) and the morph engine are
  hand-rolled (~42 KB unminified).
- Three `InstancedMesh` groups (slab/rod/chip) share one `ShaderMaterial`;
  six precomputed formations (pos/quat/scale per instance) are blended
  per-frame on the CPU with per-instance stagger and arc lift. Dynamic roles
  (vessel pour loop, torus flow) override their formation slot live.
- In-scene text is canvas-texture planes (alphaTest for real z-occlusion) —
  no text library, no workers (repo CSP has no `worker-src`).
- **Zero image assets.** Everything visible is generated; the only binary in
  the folder is the og card, which is a screenshot of the site itself.
- Performance: 165 fps (vsync-capped) at every act on the reference machine,
  DPR capped (2 desktop / 1.8 mobile), one automatic quality step-down if the
  frame budget is blown, all counts roughly halved on mobile. Fragments'
  matrices are written directly into the instance buffer — no per-frame
  allocation.
- Fallbacks: no-JS → catalogue only (gate hidden via `<noscript>`); CDN
  failure → 8 s watchdog folds to catalogue; WebGL failure → same fold;
  reduced motion → idle drift and breathing off, flows slowed, scroll still
  drives the walk.

## Reference DNA (principles, not imitation)

- Hatom: many continuously-moving elements, one coherent world whose *states*
  are the sections.
- Active Theory: the technology should disappear — no visible "shader demo"
  framing, no loading percentages after entry.
- Unseen: exploration/interaction as identity — the sway-to-break-alignment
  mechanic *is* the brand.

## Content truth

All artists, works, venues and dates are original fiction for this showcase.
No external creative assets were used anywhere in the experience.
