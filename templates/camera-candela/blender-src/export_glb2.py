# CANDELA — re-export the GLB with WebP textures.
# The first export was 2.19MB of which the leather normal PNG was 85.2%
# (1.851MB). Geometry after Draco is only ~320KB, so the texture is the
# whole budget. WebP q90 keeps the grain and drops the file by ~10x.
# Run:  blender --background --python export_glb2.py
import bpy, os, json, struct

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela-export.blend"))
scn = bpy.context.scene
PARTS = dict(scn["candela_parts"])

for ob in scn.objects:
    ob.select_set(ob.name in PARTS)

glb = os.path.join(BASE, "assets", "candela.glb")
bpy.ops.export_scene.gltf(
    filepath=glb, export_format='GLB', use_selection=True,
    export_apply=True, export_animations=False,
    export_image_format='WEBP', export_image_quality=90,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

with open(glb, 'rb') as f:
    f.seek(12)
    jlen, _ = struct.unpack('<I4s', f.read(8))
    meta = json.loads(f.read(jlen))
bvs = meta['bufferViews']
imgb = sum(bvs[im['bufferView']]['byteLength'] for im in meta.get('images', []))
print("GLB_MB", round(os.path.getsize(glb) / 1e6, 3))
print("IMAGE_MB", round(imgb / 1e6, 3),
      [im.get('mimeType') for im in meta.get('images', [])])
print("EXTENSIONS", meta.get("extensionsUsed", []))
print("EXPORT2 OK")
