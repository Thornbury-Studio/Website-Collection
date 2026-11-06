"""PROOF.: resizes the licensed Pexels stills and the graded video posters
into the page's images.
usage: python tools/stills.py <folder of originals (<id>.jpg)> <folder of poster PNGs>
Writes img/*.avif + img/*.webp and prints a size table. Originals are never committed."""
import os, sys
from PIL import Image

RAW, POSTERS = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'img')
os.makedirs(IMG, exist_ok=True)
rows = []

# role name -> Pexels photo id (see IMAGE-CREDITS.md)
STILLS = {
    'bread-country': '8633662', 'croissant-tray': '30853716', 'crust': '39174410',
    'baguette': '30926138', 'cooling': '30350350', 'croissant-rack': '20002837',
    'oven-loaves': '10481790', 'deck-oven': '30918889', 'peel': '36445123',
    'shaping': '30918892', 'flour-burst': '11605271', 'flour-hands': '20800900',
    'window': '30667452', 'shelves': '29380155', 'counter': '40407949',
    'cafe': '39047893', 'espresso': '4349840',
}
# graded first frames of the A clips and the insets
# top fraction cut off before resizing (the window still carries another business's lettering on boxes)
CROP = {'window': 0.18}
POSTER = ['mix', 'knead', 'roll', 'oven', 'rack', 'flour', 'baguette', 'tray', 'display', 'espresso']


def save(im, name, fmts=('avif', 'webp')):
    for ext, kw in (('avif', dict(quality=50, speed=5)), ('webp', dict(quality=72, method=6))):
        if ext not in fmts:
            continue
        p = os.path.join(IMG, f'{name}.{ext}')
        im.save(p, **kw)
        rows.append((f'{name}.{ext}', im.size, os.path.getsize(p)))


def fit(path, w, top=0.0):
    im = Image.open(path).convert('RGB')
    if top:
        im = im.crop((0, int(im.height * top), im.width, im.height))
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


ONLY = set(sys.argv[3:])
for name, pid in STILLS.items():
    if ONLY and name not in ONLY:
        continue
    for w in (800, 1600):
        save(fit(os.path.join(RAW, pid + '.jpg'), w, CROP.get(name, 0.0)), f'{name}-{w}')
for name in ([] if ONLY else POSTER):
    big = name in ('mix', 'knead', 'roll', 'oven', 'rack', 'display')
    for w in ((1920, 960) if big else (960, 480)):
        save(fit(os.path.join(POSTERS, f'poster-{name}.png'), w), f'p-{name}-{w}')
for n, (w, h), b in rows:
    print(f'{n:30s} {w}x{h} {b/1024:7.1f} KB')
