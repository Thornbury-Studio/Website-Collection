# CANDELA — hero reframe (hero.py's angle was cropped). Run headless as usual.
import bpy, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene

cam = scn.objects['Cam']
cam.location = (0.245, -0.335, 0.135)
cam.data.lens = 90
scn.objects['Target'].location = (0.0, -0.010, 0.040)

scn.cycles.samples = 256
scn.render.resolution_x = 1600; scn.render.resolution_y = 1100
scn.render.filepath = os.path.join(BASE, "renders", "step4-hero.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile()
print("HERO2 OK")
