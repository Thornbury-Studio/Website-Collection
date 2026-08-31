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
