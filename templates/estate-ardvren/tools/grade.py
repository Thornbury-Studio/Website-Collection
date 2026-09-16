"""ARDVREN — crop, grade and export the nineteen licensed plates.

The site is Scots-pine dark with one larch accent, and stock photography of
forests and cabins arrives either cheerful-green or steel-blue, so every
plate gets the same treatment: the black point is lifted into the page
ground (#14201f) so a photograph's shadows and the panels around it read as
one surface, saturation comes down a sixth, and a gentle S-curve puts the
contrast back. Cabin larch and the two faces keep their warmth on purpose —
larch is the accent colour of the whole site.

Each plate is exported at the crops the pages actually use: a wide hero, a
tall 4:5 hero for phones, 20:9 bands, 4:5 and 4:3 tiles, 4:3 lodge cards
and 4:5 portraits.

    python tools/grade.py

Full-resolution originals live in tools/raw/ on the build machine and are
not shipped.
"""
import os
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
os.makedirs(OUT, exist_ok=True)

GROUND = (20, 32, 31)      # --ground, the page surface


def lut_lift(black, gamma=0.97, white=252):
    """Per-channel curve: black point lifted to `black`, mild gamma, soft S."""
    table = []
    for x in range(256):
        t = (x / 255.0) ** gamma
        s = t + 0.05 * (t - 0.5) * (1 - abs(2 * t - 1))
        s = min(1.0, max(0.0, s))
        table.append(int(round(black + (white - black) * s)))
    return table


def grade(im, sat=0.84, contrast=1.03, lift=GROUND, warm=False):
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    if warm:
        # faces and larch: keep the red channel from sinking into the pine
        lut = lut_lift(lift[0] + 6) + lut_lift(lift[1]) + lut_lift(lift[2] - 4)
    else:
        lut = lut_lift(lift[0]) + lut_lift(lift[1]) + lut_lift(lift[2])
    im = im.point(lut)
    return im


def crop_ratio(im, ratio, cx=0.5, cy=0.5, zoom=1.0):
    """Largest `ratio` (w/h) window in `im`, scaled by 1/zoom, centred on (cx, cy)."""
    w, h = im.size
    if w / h > ratio:
        cw, ch = h * ratio, h
    else:
        cw, ch = w, w / ratio
    cw, ch = cw / zoom, ch / zoom
    x0 = min(max(cx * w - cw / 2, 0), w - cw)
    y0 = min(max(cy * h - ch / 2, 0), h - ch)
    return im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch)))


def export(src, name, width, height, cx=0.5, cy=0.5, zoom=1.0, q=82, **kw):
    im = Image.open(os.path.join(RAW, src + '.jpg'))
    im = crop_ratio(im, width / height, cx, cy, zoom)
    im = im.resize((width, height), Image.LANCZOS)
    im = grade(im, **kw)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=3))
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=q, method=6)
    print('%-28s %dx%d  <- %s' % (name + '.webp', width, height, src))


PLATES = [
    # home
    ('449691027', 'hero-forest',       2560, 1200, dict(cx=0.5, cy=0.62)),
    ('449691027', 'hero-forest-tall',  1080, 1350, dict(cx=0.45, cy=0.6)),
    ('449691027', 'og',                1200,  630, dict(cx=0.5, cy=0.62)),
    ('1442873552', 'band-river',       2000,  900, dict(cx=0.55, cy=0.5)),
    ('1442873552', 'band-river-tall',  1000, 1000, dict(cx=0.6, cy=0.5)),
    ('556571655', 'tile-pine',         1200, 1500, dict(cx=0.42, cy=0.5)),
    ('654228867', 'tile-owners',       1200, 1500, dict(cx=0.5, cy=0.55, warm=True)),
    ('403233677', 'band-aerial',       2000,  900, dict(cx=0.5, cy=0.55)),
    ('403233677', 'band-aerial-tall',  1000, 1000, dict(cx=0.5, cy=0.55)),
    # lodges
    ('541577575', 'lodge-bothy',       1400, 1050, dict(cx=0.52, cy=0.63, zoom=2.0, warm=True)),
    ('447487886', 'lodge-pine',        1400, 1050, dict(cx=0.45, cy=0.5, warm=True)),
    ('982533832', 'lodge-ridge',       1400, 1050, dict(cx=0.55, cy=0.5, warm=True)),
    ('1169072572', 'lodge-winter',     1400, 1050, dict(cx=0.5, cy=0.5, warm=True)),
    ('536497028', 'lodge-interior',    1400, 1050, dict(cx=0.5, cy=0.5, warm=True)),
    ('1550187324', 'lodge-sauna',      1400, 1050, dict(cx=0.5, cy=0.5)),
    ('321301016', 'tile-coffee',       1200, 1500, dict(cx=0.55, cy=0.45, warm=True)),
    ('622840542', 'head-lodges',       2560, 1000, dict(cx=0.5, cy=0.55)),
    ('622840542', 'head-lodges-tall',  1080, 1080, dict(cx=0.5, cy=0.55)),
    # plots
    ('403233677', 'head-plots',        2560, 1000, dict(cx=0.5, cy=0.5)),
    ('403233677', 'head-plots-tall',   1080, 1080, dict(cx=0.5, cy=0.5)),
    ('330710261', 'plot-woodland',     1200,  900, dict(cx=0.5, cy=0.55)),
    ('322590478', 'plot-ridge',        1200,  900, dict(cx=0.5, cy=0.5)),
    ('331163795', 'plot-lochside',     1200,  900, dict(cx=0.5, cy=0.55)),
    # visit
    ('305418681', 'head-visit',        2560, 1000, dict(cx=0.5, cy=0.55)),
    ('305418681', 'head-visit-tall',   1080, 1080, dict(cx=0.5, cy=0.55)),
    ('283568656', 'person-fiona',       800, 1000, dict(cx=0.57, cy=0.5, zoom=1.0, warm=True)),
    ('425530290', 'person-callum',      800, 1000, dict(cx=0.5, cy=0.5, warm=True)),
]

if __name__ == '__main__':
    for src, name, w, h, kw in PLATES:
        export(src, name, w, h, **kw)
