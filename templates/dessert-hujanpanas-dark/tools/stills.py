"""Hujan Panas: resizes the licensed Pexels stills and the graded video posters into the page's images.
usage: python tools/stills.py <folder of originals (<pexels id>.jpg)> <folder of poster PNGs> [name ...]
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
    'tangyuan': '36865965', 'tangyuan-spoon': '36865956', 'pulut': '1204228', 'tauhuay': '5652186',
    'greenbean': '36211530', 'chengtng': '9656084', 'akk': '38085663',
    'akk-steamer': '38085666', 'akk-green': '37025302', 'ondeh': '35685622', 'kueh-plate': '37866295',
    'pandan-kueh': '16734292', 'rain-street': '39523506',
}
LANDSCAPE = ['sun', 'leaves', 'street', 'steam']
PORTRAIT = ['sunv', 'railv', 'skyv', 'vatv', 'coconutv', 'housesv']


def save(im, name):
    for ext, kw in (('avif', dict(quality=48, speed=5)), ('webp', dict(quality=70, method=6))):
        p = os.path.join(IMG, f'{name}.{ext}')
        im.save(p, **kw)
        rows.append((f'{name}.{ext}', im.size, os.path.getsize(p)))


def fit(path, w):
    im = Image.open(path).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


ONLY = set(sys.argv[3:])
for name, pid in STILLS.items():
    if ONLY and name not in ONLY:
        continue
    for w in (640, 1280):
        save(fit(os.path.join(RAW, pid + '.jpg'), w), f'{name}-{w}')
for name in LANDSCAPE:
    if ONLY and name not in ONLY:
        continue
    for w in (960, 1920):
        save(fit(os.path.join(POSTERS, f'poster-{name}.png'), w), f'p-{name}-{w}')
for name in PORTRAIT:
    if ONLY and name not in ONLY:
        continue
    for w in (540, 1080):
        save(fit(os.path.join(POSTERS, f'poster-{name}.png'), w), f'p-{name}-{w}')
for n, (w, h), b in rows:
    print(f'{n:30s} {w}x{h} {b/1024:7.1f} KB')
