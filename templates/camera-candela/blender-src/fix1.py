# CANDELA — material read fixes after step3 judgement:
# leather washed out to satin plastic, badge rendered salmon, glass had no coating.
# Run:  blender --background --python fix1.py
import bpy, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene

# ---- leather: kill the sheen, push the grain ----
m = bpy.data.materials["CandelaLeather"]
nt = m.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs['Base Color'].default_value = (0.022, 0.020, 0.019, 1)
b.inputs['Specular IOR Level'].default_value = 0.30
bump = next(n for n in nt.nodes if n.type == 'BUMP')
bump.inputs['Strength'].default_value = 0.75
bump.inputs['Distance'].default_value = 0.0006
rr = next(n for n in nt.nodes if n.type == 'MAP_RANGE')
rr.inputs['To Min'].default_value = 0.55
rr.inputs['To Max'].default_value = 0.80

# ---- badge: deep enamel red, not salmon ----
b = bpy.data.materials["CandelaBadge"].node_tree.nodes["Principled BSDF"]
b.inputs['Base Color'].default_value = (0.30, 0.008, 0.012, 1)
b.inputs['Roughness'].default_value = 0.22

# ---- glass: coated optics look ----
b = bpy.data.materials["CandelaGlass"].node_tree.nodes["Principled BSDF"]
b.inputs['Roughness'].default_value = 0.015
b.inputs['Coat Weight'].default_value = 0.6
b.inputs['Coat Tint'].default_value = (0.75, 0.72, 1.0, 1)   # violet AR-coating cast

# ---- calmer world so blacks stay black ----
scn.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
if "Key" in scn.objects:
    scn.objects["Key"].data.energy = 8

scn.render.filepath = os.path.join(BASE, "renders", "step3b-materials-fixed.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile()
print("FIX1 OK")
