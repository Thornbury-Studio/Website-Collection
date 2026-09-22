# The Carvel: an invented front-mid-engined two-seat grand tourer, built as a lofted "hull" of
# cross-sections in Blender 5.2 and rendered with Cycles. Run headless:
#   blender -b --python tools/carvel.py -- render <w> <h> <samples> <out.png> [paint] [rim] [strake]
#   blender -b --python tools/carvel.py -- glb <out.glb>
#   blender -b --python tools/carvel.py -- blend <out.blend>
import bpy, bmesh, math, sys
from mathutils import Vector


# ----------------------------------------------------------------------------- helpers
def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, rgb, metallic=0.0, rough=0.5, coat=0.0, coat_rough=0.05, transmission=0.0, ior=1.45, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Coat Weight'].default_value = coat
    bsdf.inputs['Coat Roughness'].default_value = coat_rough
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = ior
    bsdf.inputs['Alpha'].default_value = alpha
    if transmission > 0 or alpha < 1:
        m.surface_render_method = 'BLENDED'
    if name == 'Tyre':
        bsdf.inputs['Specular IOR Level'].default_value = 0.2
    return m


def obj_from_bmesh(name, bm, material=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    if material:
        o.data.materials.append(material)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return o


def loft(name, rings, material, cap=True):
    """rings: list of lists of (x,y,z) with equal length, consecutive stations."""
    bm = bmesh.new()
    vs = [[bm.verts.new(Vector(p)) for p in ring] for ring in rings]
    n = len(rings[0])
    for a, b in zip(vs, vs[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if cap:
        bm.faces.new(list(reversed(vs[0])))
        bm.faces.new(vs[-1])
    bm.normal_update()
    return obj_from_bmesh(name, bm, material)


def subsurf(o, levels=3):
    m = o.modifiers.new('subd', 'SUBSURF')
    m.levels = levels
    m.render_levels = levels
    return m


def apply_all(o):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    o.select_set(False)


def boolean(o, cutter, op='DIFFERENCE'):
    m = o.modifiers.new('bool', 'BOOLEAN')
    m.operation = op
    m.object = cutter
    m.solver = 'EXACT'
    apply_all(o)
    bpy.data.objects.remove(cutter, do_unlink=True)


def prim(kind, name, material, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), **kw):
    getattr(bpy.ops.mesh, 'primitive_' + kind + '_add')(location=loc, rotation=rot, **kw)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if material:
        o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    o.select_set(False)
    return o


def smooth_by_angle(o, deg=32):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(deg))
    o.select_set(False)


def curve_tube(name, pts, radius, material, mirror=False):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 6
    cu.resolution_u = 24
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, (x, y, z) in zip(sp.points, pts):
        p.co = (x, -y if mirror else y, z, 1.0)
    sp.use_endpoint_u = True
    sp.order_u = 4
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o


# ----------------------------------------------------------------------------- the car
# x runs nose (0) -> tail (4.45); y is across (half widths below); z is up. Metres.
GROUND = 0.0
WHEEL_R = 0.36             # 21-inch wheel on a 35-profile tyre
AXLE_Z = WHEEL_R
FRONT_AXLE, REAR_AXLE = 0.82, 3.52
TRACK = 0.80               # half track
FLOOR_Z = 0.17

# station: x, w_belt, z_belt, z_top, z_sill, w_sill, w_floor
STATIONS = [
    (0.00, 0.24, 0.55, 0.60, 0.42, 0.20, 0.12),
    (0.07, 0.54, 0.58, 0.66, 0.31, 0.48, 0.38),
    (0.28, 0.71, 0.63, 0.72, 0.24, 0.64, 0.56),
    (0.58, 0.83, 0.68, 0.79, 0.19, 0.76, 0.64),
    (1.05, 0.91, 0.73, 0.86, 0.17, 0.84, 0.66),
    (1.55, 0.94, 0.76, 0.91, 0.16, 0.86, 0.66),
    (2.05, 0.95, 0.78, 0.95, 0.16, 0.87, 0.66),
    (2.65, 0.95, 0.78, 0.96, 0.16, 0.87, 0.66),
    (3.20, 0.95, 0.78, 0.955, 0.16, 0.87, 0.66),
    (3.72, 0.93, 0.77, 0.93, 0.18, 0.85, 0.66),
    (4.12, 0.86, 0.75, 0.88, 0.24, 0.78, 0.60),
    (4.38, 0.66, 0.72, 0.80, 0.33, 0.58, 0.44),
    (4.45, 0.28, 0.68, 0.73, 0.42, 0.24, 0.12),
]


def body_ring(st):
    x, wb, zb, zt, zs, ws, wf = st
    half = [
        (0.0, FLOOR_Z),
        (wf, FLOOR_Z),
        (ws, zs),
        (wb * 0.995, zb - 0.16),      # flank bulge under the strake
        (wb, zb),                     # the strake / belt line
        (wb - 0.05, zb + 0.09),       # shoulder tuck
        (wb - 0.30, zt - 0.015),      # bonnet edge
        (0.0, zt),
    ]
    return [(x, y, z) for (y, z) in half] + [(x, -y, z) for (y, z) in reversed(half[1:-1])]


# greenhouse station: x, w_base, z_base, w_roof, z_roof
GLASS = [
    (1.78, 0.80, 0.925, 0.62, 0.975),
    (2.00, 0.82, 0.925, 0.63, 1.085),
    (2.30, 0.83, 0.925, 0.62, 1.185),
    (2.65, 0.83, 0.925, 0.60, 1.225),
    (3.00, 0.83, 0.925, 0.585, 1.215),
    (3.35, 0.82, 0.925, 0.55, 1.155),
    (3.72, 0.80, 0.905, 0.49, 1.05),
    (4.05, 0.74, 0.88, 0.39, 0.94),
    (4.24, 0.64, 0.84, 0.28, 0.865),
]


def glass_ring(st):
    x, wb, zb, wr, zr = st
    half = [(0.0, zb - 0.04), (wb, zb), (wb - 0.03, zb + 0.07), (wr + 0.05, zr - 0.045), (wr, zr), (0.0, zr + 0.008)]
    return [(x, y, z) for (y, z) in half] + [(x, -y, z) for (y, z) in reversed(half[1:-1])]


def belt_at(x):
    """interpolate (w_belt, z_belt) along the stations"""
    for a, b in zip(STATIONS, STATIONS[1:]):
        if a[0] <= x <= b[0]:
            t = (x - a[0]) / (b[0] - a[0])
            return a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t
    return STATIONS[-1][1], STATIONS[-1][2]


def profile_at(x):
    """half profile [(y, z)] interpolated between stations"""
    for a, b in zip(STATIONS, STATIONS[1:]):
        if a[0] <= x <= b[0]:
            t = (x - a[0]) / (b[0] - a[0])
            st = tuple(a[i] + (b[i] - a[i]) * t for i in range(7))
            return [(y, z) for (_, y, z) in body_ring(st)[:8]]
    return [(y, z) for (_, y, z) in body_ring(STATIONS[-1])[:8]]


def groove(body, x, pts, dark, thick=0.0045, depth=0.05, grow=0.04):
    """cut a shut line into the body along a polyline of (y, z) at station x"""
    bm = bmesh.new()
    cy = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    outer, inner = [], []
    for y, z in pts:
        dy, dz = y - cy, z - cz
        n = math.hypot(dy, dz) or 1.0
        outer.append(bm.verts.new((x, y + dy / n * grow, z + dz / n * grow)))
        inner.append(bm.verts.new((x, y - dy / n * depth, z - dz / n * depth)))
    for i in range(len(pts) - 1):
        bm.faces.new((outer[i], outer[i + 1], inner[i + 1], inner[i]))
    me = bpy.data.meshes.new('groove')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('groove', me)
    bpy.context.scene.collection.objects.link(o)
    m = o.modifiers.new('sol', 'SOLIDIFY')
    m.thickness = thick
    m.offset = 0
    apply_all(o)
    boolean(body, o)
    for p in body.data.polygons:
        if abs(p.center.x - x) < thick and abs(p.normal.x) > 0.9:
            p.material_index = 1


def build(paint=(0.56, 0.54, 0.50, 0.7, 0.24), rim=(0.14, 0.14, 0.15, 0.85, 0.38), strake=(0.72, 0.50, 0.28)):
    clear()
    sc = bpy.context.scene
    M = dict(
        paint=mat('Paint', paint[:3], metallic=paint[3], rough=paint[4], coat=1.0, coat_rough=0.03),
        glass=mat('Glass', (0.10, 0.12, 0.14), rough=0.03, coat=0.5, transmission=0.85, ior=1.5),
        bronze=mat('Bronze', strake, metallic=1.0, rough=0.28),
        rim=mat('Rim', rim[:3], metallic=rim[3], rough=rim[4]),
        tyre=mat('Tyre', (0.006, 0.006, 0.006), rough=0.8),
        dark=mat('Dark', (0.02, 0.02, 0.022), rough=0.6),
        chrome=mat('Chrome', (0.9, 0.9, 0.9), metallic=1.0, rough=0.08),
        lampglass=mat('LampGlass', (0.9, 0.92, 0.95), rough=0.02, transmission=1.0, ior=1.5),
        leather=mat('Leather', (0.55, 0.36, 0.20), rough=0.6),
        floor=mat('Floor', (0.22, 0.22, 0.21), rough=0.5),   # a shadow catcher: its colour only shows in the paint's reflections
    )
    car = []

    # -- body hull
    body = loft('Body', [body_ring(s) for s in STATIONS], M['paint'])
    subsurf(body, 3)
    apply_all(body)
    # wheel arches: cut only through the flanks, keep the floor
    for x in (FRONT_AXLE, REAR_AXLE):
        for side in (1, -1):
            c = prim('cylinder', 'arch_cut', None, loc=(x, side * 0.95, AXLE_Z + 0.015), rot=(math.pi / 2, 0, 0), radius=0.41, depth=0.9, vertices=96)
            boolean(body, c)
    # grille aperture + lamp recesses
    g = prim('cylinder', 'grille_cut', None, loc=(-0.02, 0, 0.40), rot=(0, math.pi / 2, 0), scale=(0.055, 0.43, 1), radius=1.0, depth=0.30, vertices=96)
    boolean(body, g)
    for side in (1, -1):
        for y in (0.30, 0.47):
            s = prim('uv_sphere', 'lamp_cut', None, loc=(0.125, side * y, 0.60), radius=0.088, segments=48, ring_count=24)
            boolean(body, s)
    body.data.materials.append(M['dark'])
    # shut lines: bonnet across the scuttle, door edges front and rear on both sides
    prof = profile_at(1.70)
    top = prof[4:8]
    groove(body, 1.70, [(y, z) for (y, z) in top] + [(-y, z) for (y, z) in reversed(top[:-1])], M['dark'])
    for x in (1.98, 3.06):
        prof = profile_at(x)
        for side in (1, -1):
            groove(body, x, [(side * y, z) for (y, z) in prof[1:5]], M['dark'])
    for p in body.data.polygons:
        c = p.center
        for ax in (FRONT_AXLE, REAR_AXLE):
            if math.hypot(c.x - ax, c.z - (AXLE_Z + 0.015)) < 0.42 and abs(c.y) > 0.45 and abs(p.normal.y) < 0.7:
                p.material_index = 1
    smooth_by_angle(body, 40)
    car.append(body)

    # -- greenhouse (a smoked canopy; the pillars read through the tint)
    gh = loft('Greenhouse', [glass_ring(s) for s in GLASS], M['glass'])
    subsurf(gh, 3)
    apply_all(gh)
    smooth_by_angle(gh, 40)
    car.append(gh)

    # -- cabin block, dash and two seats so the glass has something dark to look into
    car.append(prim('cube', 'Interior', M['dark'], loc=(3.0, 0, 0.87), scale=(0.85, 0.58, 0.08)))
    car.append(prim('cube', 'Dash', M['dark'], loc=(2.12, 0, 0.96), scale=(0.22, 0.64, 0.05)))
    for side in (1, -1):
        seat = prim('cube', 'Seat', M['leather'], loc=(2.85, side * 0.36, 1.02), scale=(0.28, 0.24, 0.1))
        b = seat.modifiers.new('bev', 'BEVEL')
        b.width = 0.06
        b.segments = 6
        apply_all(seat)
        car.append(seat)
        back = prim('cube', 'SeatBack', M['leather'], loc=(3.25, side * 0.36, 1.06), scale=(0.08, 0.24, 0.14), rot=(0, -0.3, 0))
        b = back.modifiers.new('bev', 'BEVEL')
        b.width = 0.05
        b.segments = 6
        apply_all(back)
        car.append(back)

    # -- wheels: tyre, barrel, five spokes, bronze hub
    for x in (FRONT_AXLE, REAR_AXLE):
        for side in (1, -1):
            y = side * TRACK
            tyre = prim('cylinder', 'Tyre', M['tyre'], loc=(x, y, AXLE_Z), rot=(math.pi / 2, 0, 0), radius=WHEEL_R, depth=0.27, vertices=96)
            hole = prim('cylinder', 'tyre_hole', None, loc=(x, y, AXLE_Z), rot=(math.pi / 2, 0, 0), radius=0.268, depth=0.4, vertices=96)
            boolean(tyre, hole)
            b = tyre.modifiers.new('bev', 'BEVEL')
            b.width = 0.035
            b.segments = 5
            b.limit_method = 'ANGLE'
            apply_all(tyre)
            smooth_by_angle(tyre, 40)
            barrel = prim('cylinder', 'Barrel', M['rim'], loc=(x, y, AXLE_Z), rot=(math.pi / 2, 0, 0), radius=0.268, depth=0.25, vertices=96)
            bh = prim('cylinder', 'barrel_hole', None, loc=(x, y + side * 0.03, AXLE_Z), rot=(math.pi / 2, 0, 0), radius=0.242, depth=0.25, vertices=96)
            boolean(barrel, bh)
            smooth_by_angle(barrel, 40)
            face_y = y + side * 0.07
            hub = prim('cylinder', 'Hub', M['bronze'], loc=(x, face_y, AXLE_Z), rot=(math.pi / 2, 0, 0), radius=0.075, depth=0.05, vertices=64)
            b = hub.modifiers.new('bev', 'BEVEL')
            b.width = 0.008
            b.segments = 3
            apply_all(hub)
            smooth_by_angle(hub, 40)
            car += [tyre, barrel, hub]
            for i in range(5):
                a = i * 2 * math.pi / 5 + 0.3
                cx, cz = x + math.cos(a) * 0.155, AXLE_Z + math.sin(a) * 0.155
                sp = prim('cube', 'Spoke', M['rim'], loc=(cx, face_y - side * 0.005, cz), rot=(0, -a, 0), scale=(0.105, 0.012, 0.03))
                b = sp.modifiers.new('bev', 'BEVEL')
                b.width = 0.006
                b.segments = 3
                apply_all(sp)
                smooth_by_angle(sp, 40)
                car.append(sp)
            car.append(prim('cylinder', 'Liner', M['dark'], loc=(x, side * 0.56, AXLE_Z + 0.015), rot=(math.pi / 2, 0, 0), radius=0.40, depth=0.26, vertices=96))

    # -- the bronze rubbing strake along the belt line, both sides
    pts = []
    for x in [0.09, 0.2, 0.35, 0.6, 0.9, 1.3, 1.8, 2.3, 2.8, 3.3, 3.8, 4.1, 4.3, 4.4]:
        w, z = belt_at(x)
        pts.append((x, w + 0.002, z))
    for side in (False, True):
        car.append(curve_tube('Strake', pts, 0.013, M['bronze'], mirror=side))

    # -- grille ring and dark inset, lamps with bronze bezels
    car.append(prim('torus', 'GrilleRing', M['bronze'], loc=(0.05, 0, 0.40), rot=(0, math.pi / 2, 0), scale=(0.055, 0.43, 1), major_radius=1.0, minor_radius=0.03, major_segments=96, minor_segments=16))
    car.append(prim('cylinder', 'GrilleInset', M['dark'], loc=(0.12, 0, 0.40), rot=(0, math.pi / 2, 0), scale=(0.052, 0.42, 1), radius=1.0, depth=0.05, vertices=96))
    for dz in (-0.028, 0.0, 0.028):
        car.append(prim('cylinder', 'GrilleBar', M['bronze'], loc=(0.09, 0, 0.40 + dz), rot=(math.pi / 2, 0, 0), radius=0.004, depth=0.80, vertices=16))
    for side in (1, -1):
        for y in (0.30, 0.47):
            car.append(prim('uv_sphere', 'LampBowl', M['chrome'], loc=(0.16, side * y, 0.60), radius=0.074, segments=48, ring_count=24))
            car.append(prim('uv_sphere', 'LampDome', M['lampglass'], loc=(0.135, side * y, 0.60), radius=0.082, segments=48, ring_count=24))
            car.append(prim('torus', 'LampBezel', M['bronze'], loc=(0.075, side * y, 0.60), rot=(0, math.pi / 2, 0), major_radius=0.084, minor_radius=0.007, major_segments=64, minor_segments=12))
    # -- mirrors on stalks
    for side in (1, -1):
        car.append(prim('cube', 'MirrorStalk', M['dark'], loc=(1.97, side * 0.915, 0.955), scale=(0.045, 0.07, 0.012)))
        car.append(prim('uv_sphere', 'MirrorCap', M['paint'], loc=(1.97, side * 0.995, 0.985), scale=(0.11, 0.06, 0.055), radius=1.0, segments=48, ring_count=24))

    # -- studio: shadow-catching floor, lights, world, camera
    floor = prim('plane', 'Floor', M['floor'], loc=(2.2, 0, GROUND), size=40)
    floor.is_shadow_catcher = True

    def light(name, loc, size_x, size_y, energy, look=(2.2, 0, 0.6)):
        d = bpy.data.lights.new(name, 'AREA')
        d.shape = 'RECTANGLE'
        d.size = size_x
        d.size_y = size_y
        d.energy = energy
        o = bpy.data.objects.new(name, d)
        sc.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return o

    light('Key', (2.2, -1.5, 5.5), 7.0, 3.0, 3000)          # big overhead softbox
    light('Flank', (2.4, -8.0, 2.8), 6.0, 0.45, 650)        # long thin strip for the flank highlight
    light('Fill', (-4.0, 3.0, 2.5), 4.0, 4.0, 320)
    light('Rim', (7.5, 3.5, 2.0), 3.0, 1.5, 700)
    w = bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.82, 0.81, 0.79, 1)
    bg.inputs[1].default_value = 0.12
    camd = bpy.data.cameras.new('Camera')
    camd.lens = 62
    camd.sensor_width = 36
    cam = bpy.data.objects.new('Camera', camd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.location = (-3.1, -5.9, 0.9)
    cam.rotation_euler = (Vector((2.15, 0.0, 0.55)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return car


def setup_render(w, h, samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type != 'CPU'
    sc.cycles.device = 'GPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 8
    sc.cycles.transparent_max_bounces = 12
    sc.cycles.transmission_bounces = 8
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.color_depth = '8'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = 0.0


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    mode = argv[0] if argv else 'blend'

    def col(s, d):
        return tuple(float(v) for v in s.split(',')) if s else d

    if mode == 'render':
        w, h, samples, out = int(argv[1]), int(argv[2]), int(argv[3]), argv[4]
        paint = col(argv[5] if len(argv) > 5 else '', (0.56, 0.54, 0.50, 0.7, 0.24))
        rim = col(argv[6] if len(argv) > 6 else '', (0.14, 0.14, 0.15, 0.85, 0.38))
        strake = col(argv[7] if len(argv) > 7 else '', (0.72, 0.50, 0.28))
        build(paint, rim, strake)
        setup_render(w, h, samples)
        bpy.context.scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
    elif mode == 'glb':
        car = build()
        for o in bpy.context.scene.objects:
            o.select_set(o in car)
        bpy.ops.export_scene.gltf(filepath=argv[1], export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    else:
        build()
        bpy.ops.wm.save_as_mainfile(filepath=argv[1] if len(argv) > 1 else 'carvel.blend')
