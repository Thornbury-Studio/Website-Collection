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
