# CANDELA — design notes

A product site for a fictional optical-instrument maker, built around one
modelled object. The rule that separates it from its 3D neighbours:
**nothing here is described in a shader. The object was made, then shipped.**

## Why this template exists

`combat-fracture` (FRACTURE) shades ~1,400 procedurally generated fragments
in one hand-rolled `ShaderMaterial`. It is a good piece of engineering and it
still reads as unfinished next to real studio work, because procedural
geometry with computed colour has no manufacturing history in it — no bevel
that catches a highlight, no grain that only exists because a hide was
pressed. CANDELA is the direct answer: model the object in Blender, give it
four genuinely different materials, bake what has to be baked, export a GLB,
and light it in the browser with a real environment.

The test was deliberately four material families in one object — metal,
glass, leather, rubber. One convincing material can be luck. Four in the same
frame, under the same light, is a pipeline.

## The object

A full-manual rangefinder, 26 parts, modelled from primitives with booleans
and bevels (`blender-src/build.py` rebuilds it deterministically):

| group | parts |
|---|---|
| body | bottom plate, leatherette mid-section, top plate — rounded ends, 0.4 mm chamfer on every hard edge |
| lens | mount, knurled aperture ring, barrel, knurled focus ring, front ring, recessed bezel, two glass elements |
| deck | shutter-speed dial, rewind dial, knurled shutter collar, rubber release dome, hot shoe with rails |
| front | viewfinder and rangefinder windows in metal frames, brand badge |
| sides | two strap lugs |

Real proportions (139 × 80 × 39 mm) drive the model; it is normalised to one
unit at load. The knurls are a radial triangle-wave displacement on the ring
cylinders, not a texture — at the zoom the site allows, a knurl texture reads
as a sticker.

**The bevels are load-bearing.** An angle-limited 0.45 mm bevel on every hard
part is what produces the thin bright line along each edge under the studio
environment. That line is the whole difference between "machined" and "a box
with a phase", and it was already the lesson from PARALLAX's shard work.

## Materials

| family | treatment |
|---|---|
| **Metal** | Brushed aluminium, base colour 0.66 (not the 0.80 the Blender material carried — at 0.80 under a studio it reads as chrome). Roughness comes from a canvas-drawn stroke map generated at runtime. |
| **Glass** | `transmission: 1`, `ior: 1.517`, real `thickness`, faint blue attenuation. Two elements, not a coloured disc. |
| **Leather** | Procedural Voronoi/noise grain baked to a 1024 tangent normal map, the only texture in the file. |
| **Rubber** | Matte, roughness 0.88, low environment response — the one soft component. |

Two findings worth keeping, both recorded in
[[blender-headless-glb-pipeline]]:

- **Procedural node graphs do not survive a glTF export.** The Blender metal
  had its brush as a stretched-noise roughness node; the exporter flattens
  that to a single scalar and the plate arrives in the browser as featureless
  chrome. The fix is not to bake a second texture — it is to redraw the brush
  at runtime as literal strokes on a canvas (`brushedRoughness()` in
  `js/scene.js`). Costs zero bytes, and each smart-projected UV island gets
  its own stroke direction, which is what genuinely machined parts do.
- **Texture nodes with an unplugged Vector sample Generated space**, not
  metres. The leather grain was authored at scale 700 for a 140 mm body and
  rendered sub-pixel — invisible. In bbox-normalised space ~110 gives the
  1.3 mm pebbling that was wanted.

## The studio

No `.hdr` ships and no CSP host is added. The environment is a procedural
scene baked through `PMREMGenerator.fromScene`: a vertical-gradient surround
plus five emissive rectangles — key, overhead, cool fill, rim, floor bounce —
which is what a product studio physically is. The rectangles matter more than
their brightness: a long softbox is what draws the long specular streak down
a brushed plate, and a point light never will.

Panel energy is deliberately modest. The first pass ran the key at 7.4 and
the top plate clipped to flat white; a saturated surface cannot show a brush
stroke, so all the roughness detail was being thrown away to win an exposure
fight nobody asked for. Tone mapping is `NeutralToneMapping` (Khronos PBR
Neutral) at 1.12 — it keeps the leatherette black and the plates white
without crushing small specular highlights the way ACES does.

One weak, near-neutral directional light exists only for the contact shadow
and a hard catch on the bevels. At its first setting (2.1, `0xfff4e6`) it was
doing diffuse work the environment should own and pushed the black wrap to
olive.

## Framing

`VIEWS[].dist` is a **zoom factor, not a distance**: 1.0 means the model's
bounding sphere exactly fills the tighter of the two fields of view. Authoring
absolute distances broke the moment the stage stopped being landscape — the
desktop stage is a tall column beside the captions and the object ran off both
edges. Fitting the bounding *sphere* rather than the current silhouette makes
it rotation-safe: the object is 1.0 wide and 0.59 tall, so however it is
turned it cannot leave the frame.

Idle motion is an **oscillation about the authored azimuth, not a spin**. A
continuous rotation means the composition somebody designed only exists for
one frame in every eighty.

## Interaction

The stage is sticky beside five scrolling captions. Scroll position and the
five material chips are two inputs to one piece of state, so they share a
setter (`setView` in `js/app.js`) rather than each poking the scene. Pointer
drag rotates, wheel and pinch dolly within a clamp, and the canvas is
focusable with arrow keys and `+`/`-` so the object is reachable without a
pointer.

On mobile the two-column grid becomes a plain block — a sticky element can
only travel inside its own grid area, so the stage cannot stay pinned while
captions scroll past it otherwise.

## Palette

Near-monochrome on purpose: the object is the only thing on the page allowed
to be shiny. Differentiated from FRACTURE (blood red + bruise violet) and from
the gilt/sodium of `carnival-null`.

| token | hex | role | contrast on ink |
|---|---|---|---|
| `--ink` | `#0B0C0E` | page ground | — |
| `--ink-2` | `#101216` | raised band (spec, enquiry) | — |
| `--panel` | `#15181D` | edition cards | — |
| `--line` | `#23262C` | hairlines | — |
| `--chalk` | `#EFEDE8` | type — warm white, never pure | 16.7:1 |
| `--muted` | `#9DA0A7` | secondary copy | 7.5:1 |
| `--brass` | `#C08A4A` | the single accent | 6.5:1 |

All 126 text elements were measured against computed colour with ancestor
opacity composited in — zero AA failures. Two elements (`.scroll-cue`,
`.stage-hint`) originally carried `opacity: .7`, which drops `--muted` to
4.15:1 and fails; the opacity was removed rather than the colour changed,
because the colour is already the muted step.

## Type

- **Sora** 600/700 — display. Squared, technical, reads as hardware.
- **DM Sans** — body.
- **Roboto Mono** — kickers, spec values, chips, all instrument labels.

None of the three is used elsewhere in the collection.

## Assets

`assets/candela.glb` — **702 KB**, Draco-compressed geometry, WebP textures,
33k triangles. Extensions: `KHR_draco_mesh_compression`,
`KHR_materials_transmission`, `KHR_materials_ior`, `KHR_materials_anisotropy`,
`KHR_materials_clearcoat`, `EXT_texture_webp`.

The first export was 2.19 MB, of which the leather normal PNG was **85.2%**.
Geometry after Draco is only ~320 KB, so the texture was the entire budget;
WebP q90 cut the file by a factor of three. Always check that split before
reaching for mesh compression.

Loaders are vendored (`js/vendor/`) with their bare `from 'three'` specifiers
rewritten to the same pinned build the module imports — one three instance is
mandatory or every `instanceof` in the loader fails. The Draco decoder is
self-hosted because `connect-src 'self'` rules out fetching it from a CDN.

**CSP: no new hosts were needed.** The production policy in `vercel.json`
already carries the four grants a Draco GLB requires — `'wasm-unsafe-eval'`,
`worker-src blob:`, `child-src blob:`, `connect-src blob:` — from the
APERTURE INDEX build. The template's own `<meta http-equiv>` mirrors that
header exactly, because a local `http.server` sends no CSP at all and every
one of those failures is invisible until deploy.

The GLB is preloaded; verified as **one** request, not a duplicate fetch.

## Fallback chain (each verified in a real browser)

- **No JS** — every element is static HTML. `html:not(.js)` unpins the sticky
  column, hides the canvas and chips, and shows a real product shot rendered
  on transparent film with a shadow catcher, so it composites onto the page
  ground instead of arriving as a grey rectangle.
- **No WebGL2** — renderer construction throws, is caught, folds to the same
  still. Verified by stubbing `getContext('webgl*')` to null: three logs its
  own context error, nothing escapes uncaught.
- **CDN blocked / model missing** — `js/boot.js` folds if `CANDELA_READY`
  never appears within 8 s. The watchdog will not relabel a specific cause the
  module already recorded.
- **`webglcontextlost`** — same fold.

## Accessibility

Skip link, one `h1`, labelled landmarks. All 26 focusable controls carry an
accessible name; every form field has a real `<label for>`. Chips are
`aria-pressed` buttons. The canvas has an `aria-label` describing the object
and its controls. Form errors are `aria-describedby` and the confirmation is
`role="status"`. `prefers-reduced-motion` stops the idle drift entirely,
snaps view changes, and disables reveal transitions. Verified: no horizontal
overflow at 320 / 390 / 1440, with `overflow-x: visible` throughout, so
nothing is being masked.

## Content truth

CANDELA is an original fictional maker. The instrument, its specification,
the three editions and their prices are written for this showcase. The only
binaries in the folder are the GLB, its baked normal map, the product stills
derived from the Blender render, and the og card.

## Open items

- The metal's `KHR_materials_anisotropy` is held at 0.35 because the tangent
  comes off arbitrary smart-projected UVs; a deliberate UV pass on the top
  plate would let real anisotropy replace part of the stroke map.
- No baked AO. The contact shadow and environment occlusion carry the seams
  well at the zooms allowed here, but a baked AO atlas is the next elevation
  step if the viewer is ever allowed closer.
- Editions are presentational — there is no cart, and the enquiry form
  confirms client-side only.
