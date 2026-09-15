"""PELAGIA — crop, grade and export the twenty-three licensed plates and two clips.

The site is abyss blue with ice-cyan light, and every photograph was taken
through glass or under water, so the grade is light: the black point is
lifted into the page ground (#050B18) so a tank's shadows and the page read
as one surface, saturation comes down a tenth, and a gentle S-curve puts the
contrast back. The reef plates keep their colour — that is the point of a
reef hall.

Each plate is exported at the crops the pages use: 16:9 for the home hero
(and a 4:5 crop for phones, a taller composition rather than a squeezed
one), 3:2 for hall headers and the gallery, 3:4 for the experience cards.
Everything that fills the viewport also ships a 2 560 px export for
high-density screens, offered through srcset.

    python tools/grade.py            # plates
    python tools/grade.py --video    # the two clips (ffmpeg on PATH or FFMPEG env)

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

ABYSS = (5, 11, 24)          # --abyss, the page ground


def lut_lift(black, gamma=0.97, white=255):
    table = []
    for x in range(256):
        t = (x / 255.0) ** gamma
        s = t + 0.05 * (t - 0.5) * (1 - abs(2 * t - 1))
        s = min(1.0, max(0.0, s))
        table.append(int(round(black + (white - black) * s)))
    return table


def grade(im, sat=0.9, contrast=1.04):
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = im.point(lut_lift(ABYSS[0]) + lut_lift(ABYSS[1]) + lut_lift(ABYSS[2]))
    return im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=42, threshold=3))


def crop_ratio(im, ratio, cx=0.5, cy=0.5, zoom=1.0):
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


def export(name, src, ratio, width, q=72, cx=0.5, cy=0.5, zoom=1.0, sat=0.9, contrast=1.04):
    im = Image.open(os.path.join(RAW, src))
    im.draft('RGB', (width * 2, width * 2))
    im = crop_ratio(im, ratio, cx, cy, zoom)
    im = im.resize((width, int(round(width / ratio))), Image.LANCZOS)
    im = grade(im, sat=sat, contrast=contrast)
    dest = os.path.join(OUT, name + '.webp')
    im.save(dest, 'WEBP', quality=q, method=6)
    print(f'{name}.webp  {im.size[0]}x{im.size[1]}  {os.path.getsize(dest) // 1024} KB')


# ---- home hero: the silhouette at the 36-metre window -----------------------
export('hero-window', '470743772.jpg', 16 / 9, 1920, q=72, cx=0.5, cy=0.5)
export('hero-window-2560', '470743772.jpg', 16 / 9, 2560, q=72, cx=0.5, cy=0.5)
export('hero-window-tall', '470743772.jpg', 4 / 5, 900, q=72, cx=0.42, cy=0.5)
export('hero-window-tall-1400', '470743772.jpg', 4 / 5, 1400, q=72, cx=0.42, cy=0.5)

# ---- hall headers and page headers: 3:2 at 1600 and 2560 ---------------------
WIDE = {
    'hall-open-ocean':  ('324426305.jpg', dict(cx=0.5, cy=0.5)),
    'hall-jellies':     ('283556952.jpg', dict(cx=0.5, cy=0.5)),
    'hall-reef':        ('715480698.jpg', dict(cx=0.5, cy=0.5)),
    'hall-seagrass':    ('307545555.jpg', dict(cx=0.5, cy=0.5)),
    'hall-penguins':    ('767065301.jpg', dict(cx=0.55, cy=0.5)),
    'head-tunnel':      ('98593678.jpg',  dict(cx=0.5, cy=0.5)),
    'head-nettles':     ('244083439.jpg', dict(cx=0.5, cy=0.5)),
    'head-crowd':       ('355618012.jpg', dict(cx=0.5, cy=0.55)),
    'head-manta':       ('237269797.jpg', dict(cx=0.5, cy=0.45)),
    'plate-jelly-window': ('359782110.jpg', dict(cx=0.5, cy=0.5)),
    'plate-two-kids':   ('194979177.jpg', dict(cx=0.5, cy=0.5)),
    'plate-couple':     ('698075768.jpg', dict(cx=0.5, cy=0.5)),
    'plate-sharks':     ('481863313.jpg', dict(cx=0.5, cy=0.5)),
    'plate-rays':       ('245369785.jpg', dict(cx=0.5, cy=0.5)),
    'plate-touch':      ('274189038.jpg', dict(cx=0.5, cy=0.5)),
    'plate-lilac':      ('253618291.jpg', dict(cx=0.5, cy=0.5)),
    'plate-reef-tank':  ('157134933.jpg', dict(cx=0.5, cy=0.5)),
    'plate-clownfish':  ('472535607.jpg', dict(cx=0.5, cy=0.5)),
    'plate-mandarin':   ('397882008.jpg', dict(cx=0.5, cy=0.5)),
    'plate-seadragon':  ('768871856.jpg', dict(cx=0.5, cy=0.5)),
    'plate-turtle':     ('702291460.jpg', dict(cx=0.5, cy=0.5)),
    'plate-single-jelly': ('274963144.jpg', dict(cx=0.5, cy=0.42)),
}
for name, (src, anchor) in WIDE.items():
    export(name, src, 3 / 2, 1600, q=70, **anchor)
for name in ('hall-open-ocean', 'hall-jellies', 'hall-reef', 'hall-seagrass', 'hall-penguins',
             'head-tunnel', 'head-nettles', 'head-crowd', 'head-manta'):
    src, anchor = WIDE[name]
    export(name + '-2560', src, 3 / 2, 2560, q=72, **anchor)

# ---- portrait cards: 3:4 at 720 --------------------------------------------
CARD = {
    'card-shark-dive':   ('481863313.jpg', dict(cx=0.5, cy=0.5)),
    'card-sleepover':    ('698075768.jpg', dict(cx=0.55, cy=0.5)),
    'card-backstage':    ('274189038.jpg', dict(cx=0.6, cy=0.5)),
    'card-ray-feed':     ('245369785.jpg', dict(cx=0.5, cy=0.5)),
    'card-jelly-window': ('359782110.jpg', dict(cx=0.5, cy=0.5)),
}
for name, (src, anchor) in CARD.items():
    export(name, src, 3 / 4, 720, q=74, **anchor)

# ---- square thumb for the deck row ------------------------------------------
export('thumb-window', '470743772.jpg', 1, 480, q=72, cx=0.42, cy=0.5)

# ---- og image, 1.91:1 --------------------------------------------------------
export('og', '470743772.jpg', 1.91, 1200, q=76, cx=0.5, cy=0.5)

# ---- the two clips ------------------------------------------------------------
if '--video' in sys.argv:
    ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
    CLIPS = {
        # moon jellies, 18 s at 60 fps 4K -> a 12 s 720p loop at 30 fps
        'loop-jellies': ('377511324.mov', '12'),
        # bull shark passing the window, 12 s 4K -> 10 s 720p
        'loop-shark': ('526482179.mov', '10'),
    }
    for name, (src, secs) in CLIPS.items():
        inp = os.path.join(RAW, src)
        out = os.path.join(VID, name + '.mp4')
        vf = 'scale=1280:720:flags=lanczos,fps=30,eq=contrast=1.04:saturation=0.92,format=yuv420p'
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', inp, '-t', secs,
                        '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
                        '-movflags', '+faststart', out], check=True)
        poster = os.path.join(OUT, name + '-poster.jpg')
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '1', '-i', out,
                        '-frames:v', '1', '-q:v', '4', poster], check=True)
        Image.open(poster).convert('RGB').save(os.path.join(OUT, name + '-poster.webp'), 'WEBP', quality=72, method=6)
        os.remove(poster)
        print(f'{name}.mp4  {os.path.getsize(out) // 1024} KB')
