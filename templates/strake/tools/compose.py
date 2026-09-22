# Turns the Blender layer renders and the Adobe recolours into the site's car layers.
#
# The Adobe image tools return a flat image on white, so the alpha is re-applied here from the
# matching Blender render — the geometry never moved, so the mattes line up exactly.
#   python tools/compose.py
import os
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
os.makedirs(OUT, exist_ok=True)


def alpha_of(name):
    return Image.open(os.path.join(RAW, name)).convert('RGBA').split()[3]


def fade_bottom(im, frac=0.2):
    """The studio floor's shadow is still dark where the crop ends, which reads as a hard
    horizontal edge on the page. Ramp the alpha out over the last `frac` of the crop."""
    im = im.convert('RGBA')
    a = im.split()[3]
    w, h = im.size
    n = int(h * frac)
    ramp = Image.linear_gradient('L').resize((1, n)).transpose(Image.FLIP_TOP_BOTTOM).resize((w, n))
    mask = Image.new('L', (w, h), 255)
    mask.paste(ramp, (0, h - n))
    im.putalpha(ImageChops.multiply(a, mask))
    return im


def save(im, name, widths, quality=86):
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, f'{name}-{w}.webp'), 'WEBP', quality=quality, method=6, exact=False)
        print(name, w, h, os.path.getsize(os.path.join(OUT, f'{name}-{w}.webp')) // 1024, 'KB')


# the render frame is 16:9 with air all round; crop to the car and let the page own the margins
CROP = (170, 560, 3030, 1615)
WIDTHS = [2400, 1600, 1000]


def layer(flat_png, render_png, matte_png, name, widths=WIDTHS):
    """Blend an Adobe recolour into its render through the matte Adobe was masked with.

    The Adobe tools hand back a flat image on white, so the alpha comes from the render. Only
    the masked region is taken from Adobe, which means a later change to the parts Adobe never
    touched — the arch interiors, say — carries into every colourway without re-running it."""
    render = Image.open(os.path.join(RAW, render_png)).convert('RGBA')
    flat = Image.open(os.path.join(RAW, flat_png)).convert('RGB').resize(render.size, Image.LANCZOS)
    matte = Image.open(os.path.join(RAW, matte_png)).convert('L').resize(render.size, Image.LANCZOS)
    im = render.copy()
    im.paste(flat, mask=matte)
    im.putalpha(render.split()[3])
    save(im.crop(CROP), name, widths)


# --- bodies: Solent silver is the render itself; the other four are the Adobe recolours
body = Image.open(os.path.join(RAW, 'hero-body.png')).convert('RGBA').crop(CROP)
save(body, 'car-solent', WIDTHS)
for flat, name in (('ad-sailcloth.png', 'car-sailcloth'), ('ad-keel.png', 'car-keel'),
                   ('ad-ebb.png', 'car-ebb'), ('ad-redlead.png', 'car-redlead')):
    layer(flat, 'hero-body.png', 'hero-matte.png', name)

# --- wheels: the graphite render, and the Adobe bronze recolour of it
wheels = Image.open(os.path.join(RAW, 'hero-wheels.png')).convert('RGBA').crop(CROP)
save(wheels, 'car-wheels-graphite', WIDTHS)
layer('ad-wheels-bronze.png', 'hero-wheels.png', 'wheel-matte.png', 'car-wheels-bronze')

# --- the cast shadow, faded out where the crop ends
shadow = Image.open(os.path.join(RAW, 'hero-shadow.png')).convert('RGBA').crop(CROP)
save(fade_bottom(shadow, 0.24), 'car-shadow', [2400, 1600])

# --- social card and the "strake" detail, both from the master
CLOTH = (242, 241, 237, 255)
master = Image.open(os.path.join(RAW, 'hero-master.png')).convert('RGBA')
flat = Image.new('RGBA', master.size, CLOTH)
flat.alpha_composite(master)
w, h = flat.size
og = flat.crop((int(w * 0.04), int(h * 0.20), int(w * 0.96), int(h * 0.20) + int(w * 0.92 * 630 / 1200)))
og.convert('RGB').resize((1200, 630), Image.LANCZOS).save(os.path.join(OUT, 'og-1200.webp'), 'WEBP', quality=84, method=6)
print('og 1200 630')
det = master.crop((820, 700, 1820, 1950))
save(fade_bottom(det, 0.14), 'd-strake', [1000, 600])
her = flat.crop((300, 620, 2900, 2570)).convert('RGB')
her.resize((1200, 900), Image.LANCZOS).save(os.path.join(OUT, 'h-2019-1200.webp'), 'WEBP', quality=84, method=6)
her.resize((600, 450), Image.LANCZOS).save(os.path.join(OUT, 'h-2019-600.webp'), 'WEBP', quality=84, method=6)
print('h-2019 done')
