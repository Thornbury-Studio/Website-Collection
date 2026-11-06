"""Hujan Panas: turns two captures of the live page into the share image and the hub thumbnail,
and draws the 180px touch icon (two half-discs, the same as img/favicon.svg).
usage: python tools/og.py <capture 1200x630 png> <capture 1440x900 png>"""
import os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'img')
og = Image.open(sys.argv[1]).convert('RGB').resize((1200, 630), Image.LANCZOS)
og.save(os.path.join(IMG, 'og.jpg'), quality=84, optimize=True, progressive=True)
hub = Image.open(sys.argv[2]).convert('RGB').resize((480, 300), Image.LANCZOS)
hub.save(os.path.join(IMG, 'hub-thumb.webp'), quality=78, method=6)

S = 4 * 180
ic = Image.new('RGB', (S, S), '#0c100e')
d = ImageDraw.Draw(ic)
r = int(S * 0.31); c = S // 2
d.pieslice((c - r, c - r, c + r, c + r), 90, 270, fill='#86cdbd')
d.pieslice((c - r, c - r, c + r, c + r), 270, 90, fill='#f2a24a')
ic.resize((180, 180), Image.LANCZOS).save(os.path.join(IMG, 'icon-180.png'), optimize=True)
for n in ('og.jpg', 'hub-thumb.webp', 'icon-180.png'):
    print(n, os.path.getsize(os.path.join(IMG, n)))
