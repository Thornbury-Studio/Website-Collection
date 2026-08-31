# CANDELA — leather grain rescale. The Voronoi/Noise had metric-space scales but
# unplugged Vector inputs sample Generated (bbox-normalised 0..1) space: scale 700
# meant 0.2mm cells, sub-pixel, invisible. ~110 gives ~1.3mm leatherette pebbling.
# Run:  blender --background --python fix2.py
import bpy, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene

nt = bpy.data.materials["CandelaLeather"].node_tree
vor = next(n for n in nt.nodes if n.type == 'TEX_VORONOI')
noi = next(n for n in nt.nodes if n.type == 'TEX_NOISE')
vor.inputs['Scale'].default_value = 110
noi.inputs['Scale'].default_value = 200
noi.inputs['Detail'].default_value = 5
bump = next(n for n in nt.nodes if n.type == 'BUMP')
bump.inputs['Strength'].default_value = 0.85
bump.inputs['Distance'].default_value = 0.0005

scn.render.filepath = os.path.join(BASE, "renders", "step3c-leather-grain.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile()
print("FIX2 OK")
