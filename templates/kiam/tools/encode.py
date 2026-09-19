"""Encode the licensed masters in assets/raw/ into the web sizes the pages use.

Usage:  python tools/encode.py            (run from the project root)

One identical grade for every frame (a touch of contrast, saturation pulled
back 5%, light sharpening), then crop to the aspect the layout uses around a
focal point, then WebP + JPEG at two widths for srcset. The masters are
gitignored; this script is what regenerates assets/img/ from them.
"""
import os, sys
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")
OUT = os.path.join(ROOT, "assets", "img")
os.makedirs(OUT, exist_ok=True)

# name: (stock id, aspect w:h or None for native, focal x, focal y, widths)
SPEC = {
    # home
    "salt-bowl":    ("288832452", (4, 5),  0.50, 0.50, (1000, 600)),
    "two-glasses":  ("328009746", (4, 5),  0.50, 0.45, (1000, 600)),
    # sodas page — one photo per band
    "calamansi":    ("638782676", (4, 5),  0.50, 0.50, (1000, 600)),
    "grapefruit":   ("482686928", (4, 5),  0.50, 0.50, (1000, 600)),
    "pineapple":    ("270475996", (4, 5),  0.45, 0.50, (1000, 600)),
    "roselle":      ("985317278", (4, 5),  0.55, 0.50, (1000, 600)),
    "watermelon":   ("515221112", (4, 5),  0.40, 0.55, (1000, 600)),
    # story page
    "caps":         ("255124587", (3, 1),  0.50, 0.50, (2000, 1000)),
    "crates":       ("582753045", (3, 2),  0.50, 0.50, (1400, 800)),
    "squeeze":      ("140904409", (4, 5),  0.50, 0.40, (1000, 600)),
    # reviews page — candid moments
    "r-dinner":     ("399702389", (3, 2),  0.45, 0.45, (1400, 800)),
    "r-pinkwall":   ("682013586", (4, 5),  0.35, 0.40, (1000, 600)),
    "r-hands":      ("316541972", (3, 2),  0.55, 0.45, (1400, 800)),
    "r-table":      ("443421080", (3, 2),  0.50, 0.50, (1400, 800)),
    "r-market":     ("1526227328",(4, 5),  0.45, 0.45, (1000, 600)),
    "r-toast":      ("585702790", (3, 2),  0.50, 0.45, (1400, 800)),
    "r-laugh":      ("661394893", (4, 5),  0.55, 0.35, (1000, 600)),
    "r-stairs":     ("625498132", (3, 2),  0.50, 0.50, (1400, 800)),
    "r-lunch":      ("252898932", (3, 2),  0.55, 0.50, (1400, 800)),
}


def grade(im):
    im = ImageEnhance.Contrast(im).enhance(1.04)
    im = ImageEnhance.Color(im).enhance(0.95)
    return im


def crop_to(im, aspect, fx, fy):
    if aspect is None:
        return im
    W, H = im.size
    aw, ah = aspect
    target = aw / ah
    if W / H > target:            # too wide — trim width
        nw = int(H * target); x0 = int((W - nw) * fx); return im.crop((x0, 0, x0 + nw, H))
    nh = int(W / target); y0 = int((H - nh) * fy); return im.crop((0, y0, W, y0 + nh))


def main(only=None):
    for name, (sid, aspect, fx, fy, widths) in SPEC.items():
        if only and name not in only:
            continue
        src = os.path.join(RAW, sid + ".jpg")
        if not os.path.exists(src):
            print("missing master", name, sid); continue
        im = Image.open(src); im = ImageOps.exif_transpose(im).convert("RGB")
        im = crop_to(im, aspect, fx, fy)
        im = grade(im)
        for w in widths:
            h = round(im.height * w / im.width)
            r = im.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
            r.save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=82, method=6)
            r.save(os.path.join(OUT, f"{name}-{w}.jpg"), "JPEG", quality=80, optimize=True, progressive=True)
        print(f"{name:14s} {sid}  {im.width}x{im.height} -> {widths}")


if __name__ == "__main__":
    main(sys.argv[1:] or None)
