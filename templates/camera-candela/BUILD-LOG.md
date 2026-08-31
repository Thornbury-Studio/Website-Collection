# CANDELA — build log (working notes, not the final DESIGN.md)

New child site: premium mechanical camera brand, **CANDELA**. Stage 1 (this
session, Fable 5) produces ONE real, textured 3D hero asset via Blender MCP —
a full-manual rangefinder-style camera — exported as a web-ready GLB. Stage 2
(the actual page: index.html/css/js) is deliberately NOT started here; Opus 5
picks it up from this log.

**Why this build exists:** FRACTURE's hero object was pure procedural geometry
with flat ShaderMaterial colour and read as unfinished next to real references
(Lusion, Oryzo — confirmed via real screenshots in a prior session). This is
the direct fix: model the object in Blender, real materials, real HDRI light,
ship a GLB. See `templates/combat-fracture/DESIGN.md` for what not to repeat.

**The asset test:** four distinct material families in one object — brushed
metal (top plate, anisotropic), glass (lens elements, transmission + real
IOR), leatherette (procedural bump, no image texture), rubber (shutter
button, matte high-roughness). The range is the point.

**Known repo traps for Stage 2** (from memory / PATTERNS.md):
- Shipping a .glb needs vendored loaders + four CSP grants that pass locally
  and only fail on deploy — see memory `gltf-model-in-template-csp`.
- New template joins the hub gallery + sitemap, never the personal portfolio.
- No demo/AI disclaimers in child-site copy (CLAUDE.md).

## Plan (checkpoint + commit after each)

1. Block out camera form in Blender (primitives + bevel + boolean), viewport
   render to confirm proportions. ⬜
2. Mechanical detail: dials, shutter button, strap lugs, lens barrel rings —
   bevel every hard edge (PARALLAX shard lesson: the bevel highlight sells
   precision). ⬜
3. Materials, one family at a time, render-verified each before the next:
   brushed metal → leather → glass → rubber. ⬜
4. HDRI environment light, hero-angle Cycles render judged against the
   Lusion screenshot standard. ⬜
5. Export `assets/candela.glb`, textures embedded, target well under 5MB.
   If Draco/meshopt isn't trivially available, flag here and let Opus 5
   decide — don't burn budget on compression tooling. ⬜

## Log

### 2026-08-31 — session start (Fable 5)

Folder created, log started. Nothing modelled yet. Next: connect to Blender
MCP, block out the body.

### 2026-08-31 — steps 1–3 done: modelled + all four materials read ✅

**Toolchain note:** the interactive Blender MCP server was down, so the whole
build is driven headless: `blender.exe --background --python <script>`.
Mid-session an msiexec update DELETED Blender 4.5 from this machine — steps 1–2
ran on 4.5.3, everything from step 3 on runs on **Blender 5.2.1 LTS** at
`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`, and
`candela.blend` is now a 5.2 file. Stay on 5.2.

- `blender-src/build.py` — full deterministic rebuild of the model (26 parts:
  body stack, knurled dials, shutter button, hot shoe, VF/RF windows, lens
  stack with 2 glass elements, lugs, badge; 0.45mm angle bevels everywhere).
  Material-family map stored in `scene["candela_parts"]`.
- `blender-src/materials.py` — the four families as Principled node setups +
  built-in `studio.exr` world HDRI + Cycles check render.
- `blender-src/fix1.py`, `fix2.py` — judged renders and fixed: leather sheen
  (spec 0.30, rough 0.55–0.80), badge salmon→deep enamel, glass got a violet
  AR-coat. **Trap worth keeping:** texture nodes with unplugged Vector sample
  *Generated* (bbox-normalised) space — metric-tuned scales (700) gave
  sub-pixel invisible grain; ~110 in normalised space = ~1.3mm pebbling.

**Renders:** `renders/step3c-leather-grain.png` is the current state — brushed
metal streaks, visible leatherette pebbling, coated glass dome, matte rubber
button, deep red badge. All four families read.

**Next:** step 4 hero-angle render (higher samples/res), then step 5 GLB
export (bake leather normal to PNG — procedural nodes don't export — flat
values for the rest, anisotropy via KHR extension, Draco if trivial).

### 2026-08-31 — STAGE 1 COMPLETE ✅ — asset exported and verified

**What's done (all five steps):** hero render (`blender-src/hero.py` +
`hero2.py` — hero.py's framing was cropped, hero2.py is the good frame),
then export (`blender-src/export_glb.py`): baked the leather bump to a
1024 tangent normal map (`assets/leather_nrm.png`, also embedded in the
GLB), flattened the other procedural chains to plain values, exported
**`assets/candela.glb` — 2.19MB, Draco-compressed**, extensions:
KHR_draco_mesh_compression, KHR_materials_transmission, KHR_materials_ior,
KHR_materials_anisotropy, KHR_materials_clearcoat.
`blender-src/verify_glb.py` reimported the GLB into an empty scene and
Cycles-rendered it: all 26 meshes, grain, glass, knurls survive.

**Renders to look at:** `renders/step4-hero.png` (the hero standard),
`renders/step5-glb-reimport.png` (proof the GLB itself renders).

**Blend files:** `candela.blend` = source of truth (procedural materials,
pre-export). `candela-export.blend` = post-bake flattened state. Both are
Blender 5.2 files — 4.5 no longer exists on this machine.

**For Opus 5 — Stage 2 (the actual site):**
1. Build `index.html` + `css/` + `js/` here — premium CANDELA brand site
   around the 3D hero. Load `assets/candela.glb` with three.js.
2. **Draco means DRACOLoader + its decoder must be vendored** — and see
   memory `gltf-model-in-template-csp` for the four CSP grants that pass
   locally and fail only on deploy. If vendoring the Draco decoder is
   annoying, re-export without Draco (flip the flag in export_glb.py;
   uncompressed will still be well under 5MB).
3. Transmission glass needs `WebGLRenderer` with transmission support
   (three r152+ handles KHR_materials_transmission natively via
   GLTFLoader). Anisotropy needs r167+ for KHR_materials_anisotropy.
4. Register in hub `index.html` + `sitemap.xml` (expect conflicts from the
   other machine — fetch first). NOT the personal portfolio.
5. No demo/AI disclaimers in site copy (CLAUDE.md).
6. Write the real DESIGN.md once the site exists; this file stays as the
   working log.
