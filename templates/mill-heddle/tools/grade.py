"""HEDDLE — crop, grade and export the fourteen licensed plates.

The range is photographed cloth, so the eight cloth plates are graded as
little as possible: a centred crop to 3:2 (tighter where the pattern is
small enough to vanish at card size), a light unsharp, nothing done to the
colour. The two plates shot on a white sweep have their white mapped onto the
page ground, so the product sits on the page rather than in a white box.

The six mill and shop plates are pulled a fifth of the way towards grey and
warmed slightly, so a blue creel and a blue warp read as the same mill as an
undyed-cloth page.

    python tools/grade.py

Raw JPEGs live in tools/raw/ on the build machine and are not shipped.
"""
import os
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
CLOTH = (236, 230, 216)   # --cloth

def crop_ratio(im, ratio, zoom=1.0, cx=0.5, cy=0.5):
    """Centred crop to `ratio` (w/h), keeping `zoom` of the possible area."""
    w, h = im.size
    if w / h > ratio:
        ch = h; cw = int(round(h * ratio))
    else:
        cw = w; ch = int(round(w / ratio))
    cw = int(cw * zoom); ch = int(ch * zoom)
    x0 = int((w - cw) * cx); y0 = int((h - ch) * cy)
    return im.crop((x0, y0, x0 + cw, y0 + ch))

def white_to_cloth(im):
    """Map the bright end of the plate onto the page ground: pixels near
    white take the ground colour, the product itself is left alone."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = (r * 299 + g * 587 + b * 114) // 1000
            if lum < 200:
                continue
            t = min(1.0, (lum - 200) / 45.0)
            f = 1 - 0.85 * t * t
            px[x, y] = (int(r * f + CLOTH[0] * (1 - f)), int(g * f + CLOTH[1] * (1 - f)), int(b * f + CLOTH[2] * (1 - f)))
    return im

def mill_grade(im):
    im = ImageEnhance.Color(im).enhance(0.8)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.03)))
    b = b.point(lambda v: int(v * 0.96))
    return Image.merge('RGB', (r, g, b))

def export(im, name, widths, ratio, quality=80):
    for i, wd in enumerate(widths):
        ht = int(round(wd / ratio))
        out = im.resize((wd, ht), Image.LANCZOS)
        out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        suffix = '' if i == 0 else '-' + str(wd)
        path = os.path.join(OUT, name + suffix + '.webp')
        out.save(path, 'WEBP', quality=quality, method=6)
        print(name + suffix, out.size, os.path.getsize(path) // 1024, 'KB')

PLATES = [
    # name,        raw id,        ratio, zoom, cx,  cy,  treatment
    ('cloth-kirkbrae',  '403180461',  3/2, 0.82, 0.5, 0.5, 'white'),
    ('cloth-ettrick',   '393922799',  3/2, 0.9,  0.5, 0.5, 'cloth'),
    ('cloth-hound',     '410957032',  3/2, 0.62, 0.5, 0.5, 'cloth'),
    ('cloth-check',     '731341555',  3/2, 1.0,  0.5, 0.5, 'cloth'),
    ('cloth-glen',      '269790050',  3/2, 0.7,  0.5, 0.5, 'cloth'),
    ('cloth-minchmoor', '1004108433', 3/2, 1.0,  0.5, 0.5, 'cloth'),
    ('cloth-yarrow',    '1839319011', 3/2, 1.0,  0.55, 0.5, 'cloth'),
    ('cloth-hopsack',   '1363206840', 3/2, 1.0,  0.5, 0.5, 'cloth'),
    ('mill-warping',    '247143456',  3/2, 1.0,  0.5, 0.5, 'mill'),
    ('mill-threading',  '415208523',  3/2, 1.0,  0.5, 0.5, 'mill'),
    ('mill-weaving',    '634321794',  3/2, 1.0,  0.5, 0.5, 'mill'),
    ('mill-finishing',  '480915499',  3/2, 1.0,  0.35, 0.5, 'mill'),
    ('hero',            '182899738',  4/5,  1.0, 0.5, 0.5,  'mill'),
    ('order',           '615231335',  3/2, 0.9,  0.5, 0.5, 'white'),
]

def main():
    os.makedirs(OUT, exist_ok=True)
    for name, rid, ratio, zoom, cx, cy, treat in PLATES:
        im = Image.open(os.path.join(RAW, rid + '.jpg')).convert('RGB')
        im = crop_ratio(im, ratio, zoom, cx, cy)
        # work at a sane size before any per-pixel pass
        if im.width > 2400:
            im = im.resize((2400, int(round(2400 / ratio))), Image.LANCZOS)
        if treat == 'white':
            im = white_to_cloth(im)
        elif treat == 'mill':
            im = mill_grade(im)
        if name == 'hero':
            export(im, name, [1000, 600], ratio, 80)
        elif name == 'order':
            export(im, name, [1000, 600], ratio, 80)
        else:
            export(im, name, [1400, 700], ratio, 74 if name.startswith('cloth-') else 80)

if __name__ == '__main__':
    main()
