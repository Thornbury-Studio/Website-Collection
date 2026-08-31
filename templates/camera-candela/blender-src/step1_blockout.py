# CANDELA step 1 — block out the camera form. Run:
#   blender --background --python step1_blockout.py
import bpy, bmesh, math, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
os.makedirs(os.path.join(BASE, "renders"), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.unit_settings.system = 'METRIC'

def rounded_slab(name, w, d, h, z0, round_r, inset=0.0):
    """Box w x d x h, bottom at z0, the 4 vertical edges rounded to round_r."""
    mesh = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, mesh)
    scn.collection.objects.link(ob)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= (w - 2*inset); v.co.y *= (d - 2*inset); v.co.z *= h
        v.co.z += z0 + h/2
    vedges = [e for e in bm.edges
              if abs(e.verts[0].co.x - e.verts[1].co.x) < 1e-9
              and abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-9]
    bmesh.ops.bevel(bm, geom=vedges, offset=round_r, segments=12,
                    profile=0.5, affect='EDGES', clamp_overlap=True)
    bm.to_mesh(mesh); bm.free()
    return ob

# --- body stack (Leica-M-ish proportions, metres) ---
W, D = 0.140, 0.033
rounded_slab("BottomPlate", W, D, 0.007, 0.000, 0.0125)
rounded_slab("BodyMid",     W, D, 0.059, 0.007, 0.0120, inset=0.0005)
rounded_slab("TopPlate",    W, D, 0.012, 0.066, 0.0125)

def cyl(name, r, depth, loc, rot=(math.pi/2, 0, 0), verts=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth,
                                        location=loc, rotation=rot)
    ob = bpy.context.active_object; ob.name = name
    return ob

# --- lens barrel block-out (front = -Y), slightly right of centre ---
LX, LZ = 0.010, 0.0375
FRONT = -D/2
cyl("LensMount",  0.0290, 0.008, (LX, FRONT - 0.004, LZ))
cyl("LensBarrel", 0.0245, 0.030, (LX, FRONT - 0.008 - 0.015, LZ))
cyl("FocusRing",  0.0260, 0.010, (LX, FRONT - 0.023 - 0.005, LZ))
cyl("LensFront",  0.0225, 0.006, (LX, FRONT - 0.033 - 0.003, LZ))

# --- preview camera + light ---
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 85
cam = bpy.data.objects.new("Cam", cam_data); scn.collection.objects.link(cam)
cam.location = (0.24, -0.30, 0.14)
target = bpy.data.objects.new("Target", None); scn.collection.objects.link(target)
target.location = (0.0, 0.0, 0.038)
con = cam.constraints.new('TRACK_TO'); con.target = target
scn.camera = cam

key = bpy.data.lights.new("Key", 'AREA'); key.energy = 40; key.size = 0.5
keyo = bpy.data.objects.new("Key", key); scn.collection.objects.link(keyo)
keyo.location = (0.3, -0.25, 0.45); keyo.rotation_euler = (math.radians(35), 0, math.radians(45))

scn.render.engine = 'BLENDER_WORKBENCH'
scn.display.shading.light = 'STUDIO'
scn.render.resolution_x = 800; scn.render.resolution_y = 600
scn.render.filepath = os.path.join(BASE, "renders", "step1-blockout.png")
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE, "candela.blend"))
print("STEP1 OK", bpy.app.version_string)
