"""FIRST CRACK - crop the background-removed bag cutouts into shippable
alpha WebPs. The cutouts (tools/raw/cut-*.png) were made from the licensed
masters with Adobe's remove-background service; this script only crops
each bag out of its sheet, pads it, and exports two sizes.

    python tools/cut.py
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
os.makedirs(OUT, exist_ok=True)

# name -> (source, x-range or None for whole sheet)
BAGS = {
    'bag-gloss': ('cut-black.png', None),          # glossy black bag, three-quarter view
    'bag-matte': ('cut-gusset.png', (2200, 3550)),  # matte black flat-bottom pouch, front
    'bag-matte-side': ('cut-gusset.png', (900, 1900)),
    'bag-kraft': ('cut-kraft.png', (550, 1950)),    # kraft pouch, front
    'bag-kraft-side': ('cut-kraft.png', (2500, 3750)),
}

for name, (src, xr) in BAGS.items():
    im = Image.open(os.path.join(RAW, src)).convert('RGBA')
    if xr:
        im = im.crop((xr[0], 0, xr[1], im.height))
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 6)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    pad = int((y1 - y0) * 0.03)
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    for h in (1400, 700):
        t = im.copy()
        t.thumbnail((h * 2, h), Image.LANCZOS)
        file = f'{name}.webp' if h == 1400 else f'{name}-{h}.webp'
        t.save(os.path.join(OUT, file), 'WEBP', quality=84, method=6)
        print(file, t.size)
