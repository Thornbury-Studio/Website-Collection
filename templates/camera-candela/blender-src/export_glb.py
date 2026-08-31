# CANDELA — step 5: bake leather normal, flatten procedurals to glTF-safe
# values, export assets/candela.glb (Draco if available). Run headless as usual.
import bpy, os, json, struct

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
os.makedirs(os.path.join(BASE, "assets"), exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene
PARTS = dict(scn["candela_parts"])

# ---------- bake the leather bump to a tangent normal map ----------
scn.render.engine = 'CYCLES'
scn.cycles.samples = 8
img = bpy.data.images.new("leather_nrm", 1024, 1024, alpha=False)
img.colorspace_settings.name = 'Non-Color'
mat = bpy.data.materials["CandelaLeather"]
nt = mat.node_tree
tex_node = nt.nodes.new('ShaderNodeTexImage')
tex_node.image = img
nt.nodes.active = tex_node

body = scn.objects["BodyMid"]
for ob in scn.objects:
    ob.select_set(False)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=4)
# build artifact, not a shipped asset — the GLB embeds its own WebP copy,
# so a PNG left in assets/ is ~1.8MB deployed and served for nothing
nrm_path = os.path.join(BASE, "renders", "leather_nrm.png")
img.filepath_raw = nrm_path
img.file_format = 'PNG'
img.save()

# ---------- rebuild leather as glTF-safe: flat values + baked normal ----------
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new('ShaderNodeOutputMaterial')
b = nt.nodes.new('ShaderNodeBsdfPrincipled')
b.inputs['Base Color'].default_value = (0.022, 0.020, 0.019, 1)
b.inputs['Roughness'].default_value = 0.62
ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = img
nm = nt.nodes.new('ShaderNodeNormalMap')
nm.inputs['Strength'].default_value = 1.0
nt.links.new(ti.outputs['Color'], nm.inputs['Color'])
nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])

# ---------- flatten the other procedural chains to plain values ----------
mnt = bpy.data.materials["CandelaMetal"].node_tree
mb = mnt.nodes["Principled BSDF"]
for l in list(mnt.links):
    if l.to_socket == mb.inputs['Roughness']:
        mnt.links.remove(l)
mb.inputs['Roughness'].default_value = 0.30

rnt = bpy.data.materials["CandelaRubber"].node_tree
rb = rnt.nodes["Principled BSDF"]
for l in list(rnt.links):
    if l.to_socket == rb.inputs['Normal']:
        rnt.links.remove(l)

# ---------- select only camera parts and export ----------
for ob in scn.objects:
    ob.select_set(ob.name in PARTS)
glb = os.path.join(BASE, "assets", "candela.glb")
common = dict(filepath=glb, export_format='GLB', use_selection=True,
              export_apply=True, export_animations=False)
try:
    bpy.ops.export_scene.gltf(**common, export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=6)
    draco = True
except TypeError:
    bpy.ops.export_scene.gltf(**common)
    draco = False

# ---------- read back the GLB header: size + extensions actually written ----------
with open(glb, 'rb') as f:
    f.seek(12)
    jlen, jtype = struct.unpack('<I4s', f.read(8))
    meta = json.loads(f.read(jlen))
print("GLB_SIZE_MB", round(os.path.getsize(glb) / 1e6, 2), "DRACO", draco)
print("EXTENSIONS", meta.get("extensionsUsed", []))
print("MATERIALS", [m.get("name") for m in meta.get("materials", [])])
print("IMAGES", len(meta.get("images", [])))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE, "candela-export.blend"))
print("EXPORT OK")
