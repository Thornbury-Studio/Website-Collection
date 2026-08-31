# CANDELA — step 4 hero render. Run:  blender --background --python hero.py
import bpy, math, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene

# rotate the HDRI so the studio softbox rakes across the top plate + glass
wnt = scn.world.node_tree
env = next(n for n in wnt.nodes if n.type == 'TEX_ENVIRONMENT')
mapn = wnt.nodes.new('ShaderNodeMapping')
coord = wnt.nodes.new('ShaderNodeTexCoord')
mapn.inputs['Rotation'].default_value = (0, 0, math.radians(55))
wnt.links.new(coord.outputs['Generated'], mapn.inputs['Vector'])
wnt.links.new(mapn.outputs['Vector'], env.inputs['Vector'])

# tighter, lower hero angle
cam = scn.objects['Cam']
cam.location = (0.185, -0.255, 0.105)
cam.data.lens = 90
scn.objects['Target'].location = (0.0, -0.012, 0.041)

# cool rim from behind-left to cut the dark side off the background
rim = bpy.data.lights.new("Rim", 'AREA'); rim.energy = 25; rim.size = 0.35
rim.color = (0.85, 0.9, 1.0)
rimo = bpy.data.objects.new("Rim", rim)
scn.collection.objects.link(rimo)
rimo.location = (-0.35, 0.25, 0.25)
rimo.rotation_euler = (math.radians(55), 0, math.radians(-125))

scn.cycles.samples = 256
scn.render.resolution_x = 1600; scn.render.resolution_y = 1100
scn.render.filepath = os.path.join(BASE, "renders", "step4-hero.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile()
print("HERO OK")
