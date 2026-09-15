"""YORIMICHI — crop, grade and export the eighteen licensed plates and two clips.

The site is night indigo with one vermilion, and stock travel photography
arrives saturated and cheerful, so every plate gets the same treatment: the
black point is lifted into the page's indigo (so a photograph's shadows and
the page ground read as one surface), saturation comes down a fifth, and a
gentle S-curve puts the contrast back. The torii vermilion survives the
desaturation on purpose — it is the accent colour of the whole site.

Each plate is exported at the crops the pages actually use: a wide 16:9 for
the hero slider and tour headers, a portrait 3:4 for the tour cards, and a
narrower 4:5 hero crop for phones, where the slide is a taller composition
rather than a squeezed desktop frame.

    python tools/grade.py            # plates
    python tools/grade.py --video    # the two clips (needs ffmpeg on PATH or FFMPEG env)

Full-resolution originals live in tools/raw/ on the build machine and are
not shipped.
"""
import os
import sys
import subprocess
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, '..', 'img')
VID = os.path.join(HERE, '..', 'video')
os.makedirs(OUT, exist_ok=True)
os.makedirs(VID, exist_ok=True)

INK = (11, 15, 26)          # --ink-900, the page ground


def lut_lift(black, gamma=0.96, white=255):
    """Per-channel curve: black point lifted to `black`, mild gamma, S-curve."""
    table = []
    for x in range(256):
        t = x / 255.0
        t = t ** gamma
        # soft S: push midtones a touch either side of 0.5
        s = t + 0.06 * (t - 0.5) * (1 - abs(2 * t - 1))
        s = min(1.0, max(0.0, s))
        table.append(int(round(black + (white - black) * s)))
    return table


def grade(im, sat=0.82, contrast=1.04, lift=INK, sharpen=True):
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    lut = lut_lift(lift[0]) + lut_lift(lift[1]) + lut_lift(lift[2])
    im = im.point(lut)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=3))
    return im


def crop_ratio(im, ratio, cx=0.5, cy=0.5, zoom=1.0):
    """Crop to `ratio` (w/h) around the anchor (cx, cy), keeping `zoom` of the area."""
    w, h = im.size
    if w / h > ratio:
        ch = h
        cw = int(round(h * ratio))
    else:
        cw = w
        ch = int(round(w / ratio))
    cw = int(cw * zoom)
    ch = int(ch * zoom)
    x0 = int((w - cw) * cx)
    y0 = int((h - ch) * cy)
    return im.crop((x0, y0, x0 + cw, y0 + ch))


def export(name, src, ratio, width, q=72, cx=0.5, cy=0.5, zoom=1.0, sat=0.82, contrast=1.04):
    path = os.path.join(RAW, src)
    im = Image.open(path)
    im.draft('RGB', (width * 2, width * 2))
    im = crop_ratio(im, ratio, cx, cy, zoom)
    im = im.resize((width, int(round(width / ratio))), Image.LANCZOS)
    im = grade(im, sat=sat, contrast=contrast)
    dest = os.path.join(OUT, name + '.webp')
    im.save(dest, 'WEBP', quality=q, method=6)
    print(f'{name}.webp  {im.size[0]}x{im.size[1]}  {os.path.getsize(dest) // 1024} KB')


# ---- hero slider: wide 16:9 at 1920, phone 4:5 at 900 -------------------
HERO = {
    # Fushimi Inari tunnel — dark, the text sits in the black of the path
    'hero-kyoto':      ('241334776.jpg', dict(cx=0.5, cy=0.5), dict(cx=0.5, cy=0.5)),
    # Shibuya from above — the headline goes over the dark rooftops at left
    'hero-tokyo':      ('335263778.jpg', dict(cx=0.5, cy=0.45), dict(cx=0.55, cy=0.5)),
    # Miyajima's floating torii — the gate stays right of centre, text left
    'hero-miyajima':   ('66949015.jpg',  dict(cx=0.55, cy=0.5), dict(cx=0.6, cy=0.5)),
    # Shirakawa-go at dusk — the lit farmhouses under the words
    'hero-shirakawa':  ('301061444.jpg', dict(cx=0.5, cy=0.5), dict(cx=0.45, cy=0.5)),
    # Chureito pagoda and Fuji — pagoda right, Fuji centre, words left
    'hero-fuji':       ('270204267.jpg', dict(cx=0.5, cy=0.5), dict(cx=0.62, cy=0.5)),
}
for name, (src, wide, tall) in HERO.items():
    export(name, src, 16 / 9, 1920, q=70, **wide)
    export(name + '-tall', src, 4 / 5, 900, q=70, **tall)

# ---- tour plates: portrait card 3:4 at 720, wide 3:2 at 1600 ------------
TOURS = {
    'golden-route':  ('309757748.jpg', dict(cx=0.5, cy=0.45), dict(cx=0.5, cy=0.35)),
    'kyoto-autumn':  ('312548943.jpg', dict(cx=0.22, cy=0.5), dict(cx=0.4, cy=0.5)),
    'sakura':        ('316939084.jpg', dict(cx=0.5, cy=0.55), dict(cx=0.5, cy=0.5)),
    'snow-country':  ('323976191.jpg', dict(cx=0.42, cy=0.5), dict(cx=0.5, cy=0.5)),
    'onsen':         ('1027066035.jpg', dict(cx=0.42, cy=0.5), dict(cx=0.5, cy=0.5)),
    'tokyo-dark':    ('611202634.jpg', dict(cx=0.5, cy=0.5), dict(cx=0.5, cy=0.5)),
    'inland-sea':    ('66949015.jpg',  dict(cx=0.6, cy=0.5), dict(cx=0.55, cy=0.5)),
    'fuji-lakes':    ('270204267.jpg', dict(cx=0.62, cy=0.5), dict(cx=0.5, cy=0.5)),
}
for name, (src, card, wide) in TOURS.items():
    export('tour-' + name + '-card', src, 3 / 4, 720, q=74, **card)
    export('tour-' + name + '-wide', src, 3 / 2, 1600, q=70, **wide)

# ---- supporting plates (itineraries, about, gallery) ----------------------
SUPPORT = {
    'plate-torii-umbrella': ('203493494.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-nara-deer':      ('322528078.jpg', 3 / 2, 1600, dict(cx=0.45, cy=0.55)),
    'plate-toji-pagoda':    ('394064502.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-private-onsen':  ('417120402.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-shirakawa':      ('301061444.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-fushimi':        ('241334776.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-shibuya':        ('335263778.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-kyoto-lane':     ('281660858.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-travellers':     ('356015840.jpg', 3 / 2, 1600, dict(cx=0.5, cy=0.5)),
    'plate-milkyway':       ('249311815.jpg', 21 / 9, 1920, dict(cx=0.5, cy=0.45)),
}
for name, (src, ratio, width, anchor) in SUPPORT.items():
    export(name, src, ratio, width, q=70, **anchor)

# ---- square thumbs for the film chapters and the about page ---------------
export('thumb-travellers', '356015840.jpg', 1, 640, q=72, cx=0.5, cy=0.5)
export('thumb-kyoto-lane', '281660858.jpg', 4 / 5, 640, q=72, cx=0.5, cy=0.5)

# ---- og image, 1.91:1 from the Kyoto hero ---------------------------------
export('og', '241334776.jpg', 1.91, 1200, q=76, cx=0.5, cy=0.5)

# ---- the two clips ---------------------------------------------------------
if '--video' in sys.argv:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
    CLIPS = {
        # Fushimi Inari, 9 s ProRes 4K -> 1280x720 H.264
        'film-fushimi': '340124809.mov',
        # Fuji over Kawaguchiko at sunrise, 8 s H.264 4K -> 1280x720 (audio dropped)
        'film-fuji': '239698022.mov',
    }
    for name, src in CLIPS.items():
        inp = os.path.join(RAW, src)
        out = os.path.join(VID, name + '.mp4')
        vf = 'scale=1280:720:flags=lanczos,eq=contrast=1.05:saturation=0.84,format=yuv420p'
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', inp,
                        '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25',
                        '-movflags', '+faststart', out], check=True)
        poster = os.path.join(OUT, name + '-poster.jpg')
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1.5', '-i', out,
                        '-frames:v', '1', '-q:v', '4', poster], check=True)
        pim = Image.open(poster).convert('RGB')
        pim.save(os.path.join(OUT, name + '-poster.webp'), 'WEBP', quality=72, method=6)
        os.remove(poster)
        print(f'{name}.mp4  {os.path.getsize(out) // 1024} KB')
