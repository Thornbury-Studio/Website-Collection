"""
HOLLOWGATE — image grade.

Four licensed Adobe Stock photographs are pulled toward one palette so they sit
in the same room as the authored diagrams: oiled graphite ground, box-interior
cream, and the lever colour code (signal red, distant amber) left alone wherever
it is doing a job. Nothing here is generative; every operation is a curve, a
channel scale or a resize on the full-resolution licensed original.

Run:  python tools/grade.py <dir-of-originals>
"""
import sys, os
from PIL import Image, ImageEnhance

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')

NIGHT = (15, 20, 22)


def lut(fn):
    return [max(0, min(255, int(fn(i)))) for i in range(256)]


def channels(im, r=1.0, g=1.0, b=1.0):
    """Per-channel gain — the whole grade, no filters."""
    return im.point(lut(lambda i: i * r) + lut(lambda i: i * g) + lut(lambda i: i * b))


def toward(im, rgb, amount):
    """Pull the shadows toward one colour so the photo shares the page ground."""
    base = Image.new('RGB', im.size, rgb)
    return Image.blend(im, base, amount)


def lift(im, gamma, black):
    def f(i):
        v = (i / 255.0) ** gamma
        return (black + v * (255 - black))
    g = lut(f)
    return im.point(g * 3)


def save(im, name, widths):
    im = im.convert('RGB')
    for i, w in enumerate(widths):
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS)
        suffix = '' if i == 0 else '-%d' % w
        path = os.path.join(OUT, '%s%s.webp' % (name, suffix))
        out.save(path, 'WEBP', quality=74, method=6)
        print('%-28s %4dx%-4d %6.1f kB' % (os.path.basename(path), w, h,
              os.path.getsize(path) / 1024.0))


# --- hero: the pannier at the junction -------------------------------------
# Green summer foliage is the loudest thing in the frame and it fights the
# cream. Cooled, desaturated a third, shadows pulled to the page ground.
im = Image.open(os.path.join(SRC, '460058692.jpg'))
im = ImageEnhance.Color(im).enhance(0.62)
im = channels(im, r=0.95, g=0.99, b=1.06)
im = ImageEnhance.Contrast(im).enhance(1.08)
im = toward(im, NIGHT, 0.17)
save(im, 'hero', [1600, 900])

# 1.91:1 social crop, taken from the graded hero rather than re-graded
w, h = im.size
ch = round(w / 1.91)
top = round(h * 0.16)
save(im.crop((0, top, w, min(h, top + ch))), 'og', [1200])

# --- arm: the semaphore ----------------------------------------------------
# The red is the one colour on this site that must not move — it is the same
# red as a stop-signal lever. So the sky is taken down instead, into dusk.
im = Image.open(os.path.join(SRC, '356179405.jpg'))
im = ImageEnhance.Color(im).enhance(0.82)
im = channels(im, r=1.0, g=0.87, b=0.76)
im = lift(im, 1.55, 3)
im = toward(im, (14, 24, 30), 0.26)
save(im, 'arm', [1100, 640])

# --- shed: steam under a trainshed roof ------------------------------------
# Already near-monochrome; only needs to stop being neutral grey and start
# being box green.
im = Image.open(os.path.join(SRC, '511251791.jpg'))
im = ImageEnhance.Color(im).enhance(0.55)
im = channels(im, r=0.94, g=1.0, b=0.96)
im = toward(im, (18, 26, 24), 0.14)
save(im, 'shed', [1200, 700])

# --- wheel: motion and coupling rod ----------------------------------------
# Shot with a heavy sunset grade. Stripped back to near-monochrome and
# re-tinted cream, so it reads as a plate rather than a postcard.
im = Image.open(os.path.join(SRC, '274849422.jpg'))
im = ImageEnhance.Color(im).enhance(0.16)
im = channels(im, r=1.02, g=0.99, b=0.90)
im = lift(im, 1.15, 4)
im = toward(im, (16, 22, 22), 0.22)
save(im, 'wheel', [1200, 700])

print('done')
