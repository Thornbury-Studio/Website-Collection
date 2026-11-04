"""Turn the graded stills from tools/film.sh and tools/previews.sh into the
page's images. usage: python tools/stills.py <WORK folder>
Writes img/*.avif + img/*.webp and prints a size table."""
import os, sys
from PIL import Image

WORK = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'img')
os.makedirs(IMG, exist_ok=True)
rows = []


def save(im, name, q_avif=52, q_webp=74, fmts=('avif', 'webp')):
    for ext, kw in (('avif', dict(quality=q_avif, speed=4)), ('webp', dict(quality=q_webp, method=6))):
        if ext not in fmts:
            continue
        p = os.path.join(IMG, f'{name}.{ext}')
        im.save(p, **kw)
        rows.append((f'{name}.{ext}', im.size, os.path.getsize(p)))


def fit(src, w):
    im = Image.open(src).convert('RGB')
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


# hero: the film's own first frame, so the poster and frame 0 are the same picture
for w in (1280, 1920):
    save(fit(f'{WORK}/still-first.png', w), f'hero-{w}')
save(fit(f'{WORK}/still-pfirst.png', 760), 'hero-p760')

# one still per shot, for the loading fallback and the reduced-motion page
for i in range(7):
    save(fit(f'{WORK}/still-{i}.png', 1280), f'shot-{i}-1280', fmts=('webp',))
    save(fit(f'{WORK}/still-p{i}.png', 760), f'shot-{i}-p760', fmts=('webp',))

# film posters for the films page and the films list on the edit
for k in ('garden', 'dusk', 'forehead', 'chapel', 'temple'):
    for w in (320, 640, 800, 1280):
        save(fit(f'{WORK}/film-{k}.png', w), f'film-{k}-{w}', fmts=('webp',))

for name, (w, h), b in rows:
    print(f'{name:28s} {w}x{h} {b/1024:7.1f} KB')
