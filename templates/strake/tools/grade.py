# Exports every image the site uses from the licensed masters in tools/raw/ (gitignored).
# Crops are stated here so the provenance in IMAGE-CREDITS.md can be checked against the code.
#   python tools/grade.py
import os
from PIL import Image, ImageChops, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
os.makedirs(OUT, exist_ok=True)
CLOTH = (242, 241, 237)


def load(name):
    im = Image.open(os.path.join(RAW, name))
    return ImageOps.exif_transpose(im)


def crop_ratio(im, ratio, fx=0.5, fy=0.5):
    """largest crop at width/height = ratio, anchored at (fx, fy) in 0..1"""
    w, h = im.size
    if w / h > ratio:
        cw, ch = int(h * ratio), h
    else:
        cw, ch = w, int(w / ratio)
    x = int((w - cw) * fx)
    y = int((h - ch) * fy)
    return im.crop((x, y, x + cw, y + ch))


def save(im, name, widths, quality=82, alpha=False):
    for w in widths:
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        path = os.path.join(OUT, f'{name}-{w}.webp')
        if alpha:
            r.save(path, 'WEBP', quality=quality, method=6, exact=False)
        else:
            r.convert('RGB').save(path, 'WEBP', quality=quality, method=6)
        print(name, w, h, os.path.getsize(path) // 1024, 'KB')


def fade_bottom(im, frac=0.22):
    """The studio floor's shadow is still dark where the crop ends, which reads as a hard
    horizontal edge on the page. Ramp the alpha out over the last `frac` of the crop."""
    im = im.convert('RGBA')
    a = im.split()[3]
    w, h = im.size
    n = int(h * frac)
    ramp = Image.linear_gradient('L').resize((1, n)).transpose(Image.FLIP_TOP_BOTTOM).resize((w, n))
    mask = Image.new('L', (w, h), 255)
    mask.paste(ramp, (0, h - n))
    a = ImageChops.multiply(a, mask)
    im.putalpha(a)
    return im


def photo(src, name, ratio, widths, fx=0.5, fy=0.5):
    save(crop_ratio(load(src), ratio, fx, fy), name, widths)


# --- the car (Cycles renders with alpha; the page's own ground shows through)
hero = load('hero-solent.png')
# the studio frame has air above and below the car; the page supplies its own
save(fade_bottom(hero.crop((0, 390, 3600, 1900)), 0.2), 'hero-carvel', [2400, 1600, 1000], quality=86, alpha=True)
flat = Image.new('RGBA', hero.size, (*CLOTH, 255))
flat.alpha_composite(hero)
save(crop_ratio(flat, 1200 / 630, 0.5, 0.55), 'og', [1200], quality=84)
# detail crop: the strake crossing the front door, from the 3600 px master
save(fade_bottom(hero.crop((850, 560, 1850, 1810)), 0.16), 'd-strake', [1000, 600], quality=86, alpha=True)
# heritage chapter for 2019: the whole car, 4:3
save(crop_ratio(flat, 4 / 3, 0.5, 0.5), 'h-2019', [1200, 600])

# configurator stills
for p in ('solent', 'sailcloth', 'keel', 'ebb', 'redlead'):
    for r in ('graphite', 'bronze'):
        f = f'cfg-{p}-{r}.png'
        if os.path.exists(os.path.join(RAW, f)):
            save(fade_bottom(load(f).crop((0, 260, 2400, 1270)), 0.2), f'cfg-{p}-{r}', [1600, 1000], quality=84, alpha=True)

# --- heritage, 4:3
photo('604839569.jpg', 'h-1921', 4 / 3, [1200, 600], 0.5, 0.5)     # scull carried to the water at dawn
photo('214376332.jpg', 'h-1929', 4 / 3, [1200, 600], 0.5, 0.5)     # eights on still water
photo('541845545.jpg', 'h-1934', 4 / 3, [1200, 600], 0.5, 0.55)    # float plane on the lake
photo('635976127.jpg', 'h-1952', 4 / 3, [1200, 600], 0.5, 0.45)    # varnished runabout, reflected
photo('431900872.jpg', 'h-1968', 4 / 3, [1200, 600], 0.55, 0.5)    # the yawl at sea
photo('619449328.jpg', 'h-1979', 4 / 3, [1200, 600], 0.5, 0.5)     # a propeller, black and white
photo('516877061.jpg', 'h-2014', 4 / 3, [1200, 600], 0.5, 0.5)     # ribs on the bucks
photo('546849280.jpg', 'h-2026', 4 / 3, [1200, 600], 0.5, 0.5)     # the new shed, empty

# --- details, 4:5
photo('542481759.jpg', 'd-bucks', 4 / 5, [1000, 600], 0.45, 0.5)   # a hull being planked
photo('223283429.jpg', 'd-bronze', 4 / 5, [1000, 600], 0.5, 0.5)   # bronze propeller

# --- materials, 1:1
photo('420883852.jpg', 'm-bronze', 1, [800, 400], 0.5, 0.5)        # hammered bronze
photo('509705313.jpg', 'm-mahogany', 1, [800, 400], 0.5, 0.5)
photo('309233242.jpg', 'm-sailcloth', 1, [800, 400], 0.5, 0.5)
photo('307314752.jpg', 'm-hide', 1, [800, 400], 0.5, 0.5)          # tan hide
photo('325779682.jpg', 'm-peat', 1, [800, 400], 0.5, 0.5)          # dark hide
photo('127141697.jpg', 'm-bronze-fine', 1, [800, 400], 0.5, 0.5)   # polished bronze, wheel option

# --- press, 3:2
photo('659465069.jpg', 'p-v8', 3 / 2, [1200, 600], 0.5, 0.5)
photo('440034312.jpg', 'p-coast', 3 / 2, [1200, 600], 0.5, 0.5)
photo('159224995.jpg', 'p-hammer', 3 / 2, [1200, 600], 0.5, 0.5)

# --- the yard, 3:2 and 1:1
photo('269507635.jpg', 'y-hands', 3 / 2, [1200, 600], 0.5, 0.5)
photo('381121587.jpg', 'y-rope', 1, [800, 400], 0.5, 0.5)
photo('530007638.jpg', 'y-builder', 1, [800, 400], 0.45, 0.5)

# --- the coast band, 12:5
photo('523360026.jpg', 'band-coast', 12 / 5, [2400, 1200], 0.5, 0.55)
print('done')
