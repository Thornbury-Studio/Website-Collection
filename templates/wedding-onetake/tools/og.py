"""Share card and touch icon. usage: python tools/og.py <WORK folder>
Sets the site's own Archivo instance (wdth 62, wght 700) on the film's first
frame, so the card is the hero, not a new picture."""
import io, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

WORK = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')


def face(wght, wdth, size):
    f = TTFont(os.path.join(ROOT, 'fonts', 'archivo-wdth-wght.woff2'))
    f = instancer.instantiateVariableFont(f, {'wght': wght, 'wdth': wdth})
    f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return ImageFont.truetype(buf, size)


INK, MARK, BLACK = (239, 231, 218), (238, 93, 60), (13, 11, 9)

# 1200 x 630 card
im = Image.open(os.path.join(WORK, 'still-first.png')).convert('RGB')
im = im.resize((1200, 675), Image.LANCZOS).crop((0, 22, 1200, 652))
shade = Image.new('L', (1200, 1))
for x in range(1200):
    shade.putpixel((x, 0), int(235 * max(0.0, 1 - x / 760) ** 1.2))
im = Image.composite(Image.new('RGB', im.size, BLACK), im, shade.resize(im.size))
d = ImageDraw.Draw(im)
big = face(700, 62, 118)
d.text((64, 214), 'You only get', font=big, fill=INK)
d.text((64, 318), 'one take.', font=big, fill=INK)
small = face(600, 70, 30)
d.text((66, 92), 'CIRCLE TAKE', font=small, fill=INK)
w = d.textlength('TAKE', font=small); x0 = 66 + d.textlength('CIRCLE ', font=small)
d.ellipse((x0 - 12, 82, x0 + w + 12, 134), outline=MARK, width=3)
d.text((66, 470), 'Wedding films in Singapore', font=face(400, 100, 30), fill=(177, 167, 150))
im.save(os.path.join(ROOT, 'img', 'og.jpg'), quality=84, optimize=True, progressive=True)

# 180 x 180 touch icon, the favicon's mark
ic = Image.new('RGB', (720, 720), BLACK)
d = ImageDraw.Draw(ic)
num = face(700, 62, 420)
d.text((360, 372), '1', font=num, fill=INK, anchor='mm')
d.ellipse((150, 120, 570, 600), outline=MARK, width=34)
ic.resize((180, 180), Image.LANCZOS).save(os.path.join(ROOT, 'img', 'icon-180.png'), optimize=True)
print('og.jpg', os.path.getsize(os.path.join(ROOT, 'img', 'og.jpg')))
