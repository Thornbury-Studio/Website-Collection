# CANDELA — re-render the hero on transparent film with a shadow catcher.
# The first fallback still carried the studio's grey backdrop, which read as
# a pasted-in rectangle against the site's near-black ground. Alpha lets the
# fallback sit on the page exactly the way the live canvas does.
# Run:  blender --background --python hero_alpha.py
import bpy, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene

scn.render.film_transparent = True
gnd = scn.objects.get("Ground")
if gnd:
    gnd.is_shadow_catcher = True

scn.render.image_settings.file_format = 'PNG'
scn.render.image_settings.color_mode = 'RGBA'
scn.cycles.samples = 320
scn.render.resolution_x = 1600
scn.render.resolution_y = 1100
scn.render.filepath = os.path.join(BASE, "renders", "hero-alpha.png")
bpy.ops.render.render(write_still=True)
print("HERO_ALPHA OK")
