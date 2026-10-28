import sys
from PIL import Image
from rembg import remove, new_session
src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
print(im.size)
for name in ["u2net_human_seg", "isnet-general-use"]:
    s = new_session(name)
    out = remove(im, session=s, alpha_matting=False)
    out.save(f"{outdir}/cut-{name}.png")
    print(name, "ok")
