# CANDELA — full deterministic model build (supersedes step1_blockout.py).
# Run:  blender --background --python build.py
# Rebuilds the entire camera from scratch, saves candela.blend, renders preview.
import bpy, bmesh, math, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
os.makedirs(os.path.join(BASE, "renders"), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.unit_settings.system = 'METRIC'

W, D = 0.140, 0.033          # body width/depth (m)
FRONT = -D / 2               # front face y
LX, LZ = 0.010, 0.039        # lens axis (x, z)

PARTS = {}                   # name -> material family, consumed by materials pass

def register(ob, family):
    PARTS[ob.name] = family
    return ob

def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob

def rounded_slab(name, w, d, h, z0, round_r, inset=0.0):
    """Box w x d x h with the 4 vertical edges rounded — the body's footprint."""
    mesh = bpy.data.meshes.new(name)
    ob = link(bpy.data.objects.new(name, mesh))
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= (w - 2 * inset); v.co.y *= (d - 2 * inset); v.co.z *= h
        v.co.z += z0 + h / 2
    vedges = [e for e in bm.edges
              if abs(e.verts[0].co.x - e.verts[1].co.x) < 1e-9
              and abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-9]
    bmesh.ops.bevel(bm, geom=vedges, offset=round_r, segments=12,
                    profile=0.5, affect='EDGES', clamp_overlap=True)
    bm.to_mesh(mesh); bm.free()
    return ob

def cyl(name, r, depth, loc, rot=(math.pi / 2, 0, 0), verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth,
                                        location=loc, rotation=rot)
    ob = bpy.context.active_object; ob.name = name
    return ob

def knurled(name, r, depth, loc, rot=(math.pi / 2, 0, 0), teeth=48, amp=0.035):
    """Cylinder with a radial triangle-wave knurl on its local-Z wall."""
    ob = cyl(name, r, depth, loc, rot, verts=teeth * 4)
    for v in ob.data.vertices:
        x, y = v.co.x, v.co.y
        rad = math.hypot(x, y)
        if rad < 1e-9:
            continue
        ang = math.atan2(y, x)
        tri = abs(((ang * teeth / math.pi) % 2.0) - 1.0)   # 0..1 triangle wave
        f = 1.0 + amp * tri
        v.co.x, v.co.y = x / rad * rad * f, y / rad * rad * f
    return ob

def box(name, w, d, h, loc):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.active_object; ob.name = name
    ob.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    return ob

def lens_element(name, r, y_center, curvature=0.45):
    """Squashed sphere = biconvex glass element, axis along Y."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=r,
                                         location=(LX, y_center, LZ))
    ob = bpy.context.active_object; ob.name = name
    ob.scale = (1.0, curvature, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    return ob

# ---------------- body stack ----------------
register(rounded_slab("BottomPlate", W, D, 0.007, 0.000, 0.0125), "metal")
register(rounded_slab("BodyMid",     W, D, 0.059, 0.007, 0.0120, inset=0.0005), "leather")
register(rounded_slab("TopPlate",    W, D, 0.012, 0.066, 0.0125), "metal")

# ---------------- lens stack (front = -Y) ----------------
y = FRONT
register(cyl("LensMount",   0.0290, 0.008, (LX, y - 0.004, LZ)), "metal")
y -= 0.008
register(knurled("ApertureRing", 0.0250, 0.008, (LX, y - 0.004, LZ), teeth=56, amp=0.03), "metal_dark")
y -= 0.008
register(cyl("LensBarrel",  0.0235, 0.014, (LX, y - 0.007, LZ)), "metal_dark")
y -= 0.014
register(knurled("FocusRing", 0.0262, 0.011, (LX, y - 0.0055, LZ), teeth=64, amp=0.035), "metal_dark")
y -= 0.011
register(cyl("FrontRing",   0.0225, 0.007, (LX, y - 0.0035, LZ)), "metal_dark")
front_y = y - 0.007
# recessed dark bezel + glass inside the front ring
register(cyl("InnerBezel",  0.0200, 0.004, (LX, front_y + 0.003, LZ)), "black_matte")
register(lens_element("GlassFront", 0.0180, front_y + 0.0045, 0.40), "glass")
register(lens_element("GlassInner", 0.0150, FRONT - 0.024, 0.35), "glass")

# ---------------- top deck ----------------
deck = 0.078
register(knurled("ShutterDial", 0.0088, 0.0060, (0.046, 0, deck + 0.003),
                 rot=(0, 0, 0), teeth=40, amp=0.04), "metal")
register(cyl("ShutterDialCap", 0.0060, 0.0015, (0.046, 0, deck + 0.006 + 0.00075), rot=(0, 0, 0)), "metal")
register(knurled("RewindDial", 0.0080, 0.0050, (-0.056, 0, deck + 0.0025),
                 rot=(0, 0, 0), teeth=36, amp=0.04), "metal")
# shutter button: knurled metal collar + rubber dome button
register(knurled("ShutterCollar", 0.0050, 0.0030, (0.030, 0, deck + 0.0015),
                 rot=(0, 0, 0), teeth=24, amp=0.05), "metal")
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.0036,
                                     location=(0.030, 0, deck + 0.0035))
btn = bpy.context.active_object; btn.name = "ShutterButton"
btn.scale = (1, 1, 0.75); bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.shade_smooth()
register(btn, "rubber")
# hot shoe: base plate + two rails
register(box("HotShoeBase", 0.019, 0.018, 0.0018, (-0.008, 0, deck + 0.0009)), "metal")
register(box("HotShoeRailL", 0.0022, 0.018, 0.0016, (-0.008 - 0.0085, 0, deck + 0.0026)), "metal")
register(box("HotShoeRailR", 0.0022, 0.018, 0.0016, (-0.008 + 0.0085, 0, deck + 0.0026)), "metal")

# ---------------- front details ----------------
# viewfinder + rangefinder windows: dark glass panes proud of the face, metal frames
register(box("VFFrame", 0.0165, 0.0016, 0.0105, (-0.052, FRONT - 0.0004, 0.0585)), "metal_dark")
register(box("VFGlass", 0.0140, 0.0014, 0.0082, (-0.052, FRONT - 0.0009, 0.0585)), "black_glass")
register(box("RFFrame", 0.0075, 0.0016, 0.0105, (-0.024, FRONT - 0.0004, 0.0585)), "metal_dark")
register(box("RFGlass", 0.0056, 0.0014, 0.0082, (-0.024, FRONT - 0.0009, 0.0585)), "black_glass")
# brand badge — small disc, right of the lens
register(cyl("Badge", 0.0042, 0.0016, (0.052, FRONT - 0.0004, 0.052)), "badge")

# ---------------- strap lugs ----------------
for sx, nm in ((-1, "LugL"), (1, "LugR")):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.0042,
                                         location=(sx * (W / 2 - 0.001), 0.0, 0.060))
    lug = bpy.context.active_object; lug.name = nm
    lug.scale = (0.75, 1, 1); bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    register(lug, "metal")

# ---------------- finish: bevels + smoothing ----------------
for ob in list(scn.objects):
    if ob.type != 'MESH':
        continue
    if not ob.name.startswith("Glass") and ob.name not in ("ShutterButton", "LugL", "LugR"):
        mod = ob.modifiers.new("EdgeBevel", 'BEVEL')
        mod.width = 0.00045; mod.segments = 2
        mod.limit_method = 'ANGLE'; mod.angle_limit = math.radians(40)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(38))
    ob.select_set(False)

# stash the material-family map on the scene for the materials pass
scn["candela_parts"] = PARTS

# ---------------- preview camera + light ----------------
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 85
cam = link(bpy.data.objects.new("Cam", cam_data))
cam.location = (0.22, -0.30, 0.15)
target = link(bpy.data.objects.new("Target", None))
target.location = (0.0, -0.01, 0.040)
cam.constraints.new('TRACK_TO').target = target
scn.camera = cam

key = bpy.data.lights.new("Key", 'AREA'); key.energy = 40; key.size = 0.5
keyo = link(bpy.data.objects.new("Key", key))
keyo.location = (0.3, -0.25, 0.45)
keyo.rotation_euler = (math.radians(35), 0, math.radians(45))

scn.render.engine = 'BLENDER_WORKBENCH'
scn.display.shading.light = 'STUDIO'
scn.render.resolution_x = 900; scn.render.resolution_y = 650
scn.render.filepath = os.path.join(BASE, "renders", "step2-detail.png")
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BASE, "candela.blend"))
print("STEP2 OK — parts:", len(PARTS))
