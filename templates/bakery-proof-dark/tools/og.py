"""PROOF.: share card, hub thumbnail and touch icon, drawn on the graded first frame.
usage: python tools/og.py <folder holding poster-mix.png>
Sets the site's own Fraunces (wght 800) so the card is the page, not a new picture."""
import io, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

WORK = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
INK, AMBER, NIGHT = (242, 232, 213), (238, 159, 69), (18, 14, 10)


def face(wght, size):
    f = TTFont(os.path.join(ROOT, 'fonts', 'fraunces-wght.woff2'))
    f = instancer.instantiateVariableFont(f, {'wght': wght})
    f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return ImageFont.truetype(buf, size)


def shaded(im, w, h):
    im = im.convert('RGB').resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    top = (im.height - h) // 2
    im = im.crop((0, top, w, top + h))
    shade = Image.new('L', (w, 1))
    for x in range(w):
        shade.putpixel((x, 0), int(225 * max(0.0, 1 - x / (w * .8)) ** 1.15))
    return Image.composite(Image.new('RGB', im.size, NIGHT), im, shade.resize(im.size))


src = Image.open(os.path.join(WORK, 'poster-mix.png'))

# 1200 x 630 share card
im = shaded(src, 1200, 630); d = ImageDraw.Draw(im)
d.text((64, 56), 'PROOF', font=face(760, 54), fill=INK); d.text((64 + d.textlength('PROOF', font=face(760, 54)), 56), '.', font=face(760, 54), fill=AMBER)
d.text((64, 330), '02:00', font=face(820, 190), fill=INK)
d.text((68, 205), 'Bread is made', font=face(640, 62), fill=INK); d.text((68, 272), 'while you sleep.', font=face(640, 62), fill=INK)
d.text((70, 540), 'A neighbourhood bakery in Singapore. Doors at 07:00.', font=face(500, 28), fill=INK)
im.save(os.path.join(ROOT, 'img', 'og.jpg'), quality=86, optimize=True)

# hub thumbnail 480 x 300
th = shaded(src, 480, 300); d = ImageDraw.Draw(th)
d.text((22, 20), 'PROOF', font=face(760, 24), fill=INK); d.text((22 + d.textlength('PROOF', font=face(760, 24)), 20), '.', font=face(760, 24), fill=AMBER)
d.text((20, 168), '02:00', font=face(820, 112), fill=INK)
th.save(os.path.join(ROOT, 'img', 'hub-thumb.webp'), quality=80, method=6)

# 180 touch icon
ic = Image.new('RGB', (180, 180), NIGHT); d = ImageDraw.Draw(ic)
f = face(780, 120); w = d.textlength('P', font=f)
d.text((90 - (w + 22) / 2, 22), 'P', font=f, fill=INK); d.ellipse((90 - (w + 22) / 2 + w + 4, 118, 90 - (w + 22) / 2 + w + 22, 136), fill=AMBER)
ic.save(os.path.join(ROOT, 'img', 'icon-180.png'))
print('ok')
