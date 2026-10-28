import sys
from PIL import Image
out = sys.argv[1]
def save(im, name, size, **kw):
    im = im.resize(size, Image.LANCZOS)
    im.save(f"{out}/{name}", "WEBP", exif=b"", icc_profile=None, method=6, **kw)   # fresh encode, no EXIF/XMP carried
save(Image.open("subject-orig.jpg").convert("RGB"), "waiting-portrait.webp", (720, 1280), quality=82)
save(Image.open("portrait-cutout.png").convert("RGBA"), "waiting-portrait-cutout.webp", (810, 1440), quality=88, alpha_quality=100)
save(Image.open("portrait-backdrop.png").convert("RGB"), "waiting-portrait-backdrop.webp", (720, 1280), quality=80)
save(Image.open("portrait-depth.png").convert("L"), "waiting-portrait-depth.webp", (450, 800), lossless=True)
