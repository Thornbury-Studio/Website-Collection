# CANDELA — reimport the exported GLB into an empty scene and render it,
# proving the file parses (Draco included) and materials survived export.
import bpy, math, os

BASE = r"C:\School\Personal\Sides\Website-Collection\templates\camera-candela"
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=os.path.join(BASE, "assets", "candela.glb"))
print("IMPORTED", len([o for o in scn.objects if o.type == 'MESH']), "meshes")

cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 90
cam = bpy.data.objects.new("Cam", cam_data); scn.collection.objects.link(cam)
cam.location = (0.245, -0.335, 0.135)
tgt = bpy.data.objects.new("T", None); scn.collection.objects.link(tgt)
tgt.location = (0, -0.01, 0.040)
cam.constraints.new('TRACK_TO').target = tgt
scn.camera = cam

world = bpy.data.worlds.new("W"); world.use_nodes = True
env = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
import glob
env.image = bpy.data.images.load(glob.glob(os.path.join(
    os.path.dirname(bpy.app.binary_path), "*", "datafiles", "studiolights", "world", "studio.exr"))[0])
world.node_tree.links.new(env.outputs['Color'],
                          world.node_tree.nodes['Background'].inputs['Color'])
scn.world = world

scn.render.engine = 'CYCLES'
scn.cycles.samples = 96; scn.cycles.use_denoising = True
scn.render.resolution_x = 1000; scn.render.resolution_y = 700
scn.render.filepath = os.path.join(BASE, "renders", "step5-glb-reimport.png")
bpy.ops.render.render(write_still=True)
print("VERIFY OK")
