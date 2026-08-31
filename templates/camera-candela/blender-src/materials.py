# CANDELA — materials + HDRI light pass. Opens candela.blend (built by build.py),
# creates the four material families, assigns by the scene's candela_parts map,
# lights with Blender's built-in studio HDRI, renders a Cycles check frame.
# Run:  blender --background --python materials.py
import bpy, math, os, glob

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
# built-in studio HDRI, wherever this Blender version keeps it
_hits = glob.glob(os.path.join(os.path.dirname(bpy.app.binary_path),
                               "*", "datafiles", "studiolights", "world", "studio.exr"))
HDRI = _hits[0]

bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE, "candela.blend"))
scn = bpy.context.scene
PARTS = dict(scn["candela_parts"])

def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    return m, nt, bsdf

# ---- brushed silver metal (top/bottom plates, dials) ----
m_metal, nt, b = new_mat("CandelaMetal")
b.inputs['Base Color'].default_value = (0.80, 0.80, 0.83, 1)
b.inputs['Metallic'].default_value = 1.0
b.inputs['Roughness'].default_value = 0.30
b.inputs['Anisotropic'].default_value = 0.85
# brushed micro-line roughness variation: noise stretched hard along X
tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 900
tex.inputs['Detail'].default_value = 2
mapn = nt.nodes.new('ShaderNodeMapping'); mapn.inputs['Scale'].default_value = (0.02, 1, 1)
coord = nt.nodes.new('ShaderNodeTexCoord')
ramp = nt.nodes.new('ShaderNodeMapRange')
ramp.inputs['To Min'].default_value = 0.22; ramp.inputs['To Max'].default_value = 0.38
nt.links.new(coord.outputs['Object'], mapn.inputs['Vector'])
nt.links.new(mapn.outputs['Vector'], tex.inputs['Vector'])
nt.links.new(tex.outputs['Fac'], ramp.inputs['Value'])
nt.links.new(ramp.outputs['Result'], b.inputs['Roughness'])

# ---- dark anodised metal (lens rings) ----
m_mdark, nt, b = new_mat("CandelaMetalDark")
b.inputs['Base Color'].default_value = (0.035, 0.035, 0.038, 1)
b.inputs['Metallic'].default_value = 1.0
b.inputs['Roughness'].default_value = 0.42

# ---- matte black interior ----
m_black, nt, b = new_mat("CandelaBlackMatte")
b.inputs['Base Color'].default_value = (0.015, 0.015, 0.015, 1)
b.inputs['Roughness'].default_value = 0.9

# ---- leatherette (body wrap) — procedural grain bump ----
m_leather, nt, b = new_mat("CandelaLeather")
b.inputs['Base Color'].default_value = (0.028, 0.026, 0.025, 1)
b.inputs['Roughness'].default_value = 0.52
vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 700
noi = nt.nodes.new('ShaderNodeTexNoise'); noi.inputs['Scale'].default_value = 120
noi.inputs['Detail'].default_value = 4
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'FLOAT'
mix.inputs['Factor'].default_value = 0.35
bump = nt.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = 0.35
bump.inputs['Distance'].default_value = 0.0004
nt.links.new(vor.outputs['Distance'], mix.inputs['A'])
nt.links.new(noi.outputs['Fac'], mix.inputs['B'])
nt.links.new(mix.outputs['Result'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
# subtle sheen variation in roughness
rr = nt.nodes.new('ShaderNodeMapRange')
rr.inputs['To Min'].default_value = 0.45; rr.inputs['To Max'].default_value = 0.60
nt.links.new(vor.outputs['Distance'], rr.inputs['Value'])
nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])

# ---- optical glass ----
m_glass, nt, b = new_mat("CandelaGlass")
b.inputs['Base Color'].default_value = (1, 1, 1, 1)
b.inputs['Transmission Weight'].default_value = 1.0
b.inputs['Roughness'].default_value = 0.03
b.inputs['IOR'].default_value = 1.517

# ---- dark cover glass (VF/RF windows) ----
m_bglass, nt, b = new_mat("CandelaBlackGlass")
b.inputs['Base Color'].default_value = (0.006, 0.006, 0.008, 1)
b.inputs['Roughness'].default_value = 0.05

# ---- rubber (shutter button) ----
m_rubber, nt, b = new_mat("CandelaRubber")
b.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1)
b.inputs['Roughness'].default_value = 0.82
noi = nt.nodes.new('ShaderNodeTexNoise'); noi.inputs['Scale'].default_value = 2500
bump = nt.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = 0.12
bump.inputs['Distance'].default_value = 0.0001
nt.links.new(noi.outputs['Fac'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])

# ---- red enamel badge ----
m_badge, nt, b = new_mat("CandelaBadge")
b.inputs['Base Color'].default_value = (0.55, 0.02, 0.03, 1)
b.inputs['Roughness'].default_value = 0.15
b.inputs['Coat Weight'].default_value = 1.0

FAMILY = {"metal": m_metal, "metal_dark": m_mdark, "black_matte": m_black,
          "leather": m_leather, "glass": m_glass, "black_glass": m_bglass,
          "rubber": m_rubber, "badge": m_badge}

for name, fam in PARTS.items():
    ob = scn.objects.get(name)
    if ob is None:
        print("MISSING PART", name); continue
    ob.data.materials.clear()
    ob.data.materials.append(FAMILY[fam])
    # UVs for anisotropy / later bakes (bmesh slabs have none)
    if not ob.data.uv_layers:
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
        ob.select_set(False)

# ---- world: built-in studio HDRI ----
world = bpy.data.worlds.new("CandelaWorld")
world.use_nodes = True
wnt = world.node_tree
env = wnt.nodes.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load(HDRI)
bg = wnt.nodes['Background']
bg.inputs['Strength'].default_value = 1.3
wnt.links.new(env.outputs['Color'], bg.inputs['Color'])
scn.world = world

# soften the old key light, HDRI does the heavy lifting now
if "Key" in scn.objects:
    scn.objects["Key"].data.energy = 12

# dark ground card for grounding shadow (NOT exported — delete before GLB export)
bpy.ops.mesh.primitive_plane_add(size=1.5, location=(0, 0, -0.0002))
gnd = bpy.context.active_object; gnd.name = "Ground"
mg, nt, b = new_mat("GroundMat")
b.inputs['Base Color'].default_value = (0.04, 0.04, 0.045, 1)
b.inputs['Roughness'].default_value = 0.6
gnd.data.materials.append(mg)

# ---- Cycles check render ----
scn.render.engine = 'CYCLES'
scn.cycles.samples = 96
scn.cycles.use_denoising = True
scn.cycles.device = 'CPU'
scn.render.resolution_x = 900; scn.render.resolution_y = 650
scn.render.filepath = os.path.join(BASE, "renders", "step3-materials.png")
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("STEP3 OK")
