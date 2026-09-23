"""CRATER image pipeline: crop, grade and export every raster the page ships.

    python tools/grade.py            # all slots
    python tools/grade.py bag fuego  # just these

Masters live in tools/raw/ (gitignored): Unsplash originals in raw/unsplash/,
the Higgsfield bag render in raw/higgsfield/, film stills in shots/film/
(written by tools/film.sh). Missing masters are skipped, so a fresh clone can
re-run whatever it has. Every photograph goes through the same grade so the
set reads as one light: blacks lifted a touch, highlights warmed toward the
page's pumice ground, blue skies pulled down so they sit on a warm page.
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
SHOTS = os.path.join(HERE, "shots", "film")
IMG = os.path.join(HERE, "..", "img")


def grade(im, warmth=1.0, sky=1.0, lift=0.022, sat=0.9):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    # lift blacks, keep whites
    a = lift + a * (1.0 - lift)
    # saturation around luma
    luma = (a * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    a = luma + (a - luma) * sat
    # blue-dominant pixels (sky) lose a little chroma and gain warmth
    if sky != 1.0:
        blue = np.clip((a[..., 2:3] - a[..., 0:1]) * 4.0, 0, 1)
        a = a * (1 - blue) + (luma + (a - luma) * sky) * blue
    # warm highlights toward pumice (#F2ECE3), keep shadows neutral-brown
    hi = np.clip((luma - 0.45) / 0.55, 0, 1)
    tint = np.array([1.0 + 0.020 * warmth, 1.0 + 0.004 * warmth, 1.0 - 0.030 * warmth], np.float32)
    a = a * (1 - hi) + a * tint * hi
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def crop_frac(im, x0, y0, x1, y1):
    w, h = im.size
    return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))


def save(im, name, widths, q=80):
    os.makedirs(IMG, exist_ok=True)
    for w in widths:
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS) if w < im.width else im
        path = os.path.join(IMG, f"{name}-{w}.webp")
        out.save(path, "WEBP", quality=q, method=6)
        print(f"  {os.path.relpath(path, os.path.join(HERE, '..'))}  {out.width}x{out.height}  {os.path.getsize(path) // 1024} KB")


def src(*parts):
    p = os.path.join(*parts)
    if not os.path.exists(p):
        print(f"  skip: {os.path.relpath(p, HERE)} missing")
        return None
    return Image.open(p)


# slot -> (master, crop fractions, grade kwargs, export widths)
SLOTS = {
    # origin, desktop: Fuego venting ash, seen from Acatenango (Unsplash KRttQCXUjNI)
    "fuego": ("unsplash/KRttQCXUjNI.jpg", (0, 0.0, 1, 0.7625), dict(sky=0.82), (2400, 1600, 1000)),
    # origin, phones: the same cone at dawn (Unsplash 7ifAlWtYULs), already 4:5
    "fuego-dawn": ("unsplash/7ifAlWtYULs.jpg", (0, 0, 1, 1), dict(sky=0.9), (1200, 800)),
    # origin: Fuego's rust-red flank from Acatenango (Unsplash HbYVjIiRrBU)
    "slope": ("unsplash/HbYVjIiRrBU.jpg", (0.04, 0.08, 1, 1), dict(sky=0.82), (1600, 1000)),
    # origin: coffee cherries, Guatemala (Unsplash W1VqcpcnSHk); crop out the leaf blur
    "cherries": ("unsplash/W1VqcpcnSHk.jpg", (0.02, 0.0, 0.62, 1.0), dict(sat=0.86), (1200, 800)),
    # why: two roasted beans on cream (Unsplash mQrhnVh9ALk)
    "beans": ("unsplash/mQrhnVh9ALk.jpg", (0, 0.5, 1, 0.97), dict(warmth=0.0, sat=0.8), (1200, 800)),
    # the bag (Higgsfield nano_banana_pro, job 17ddd7fb); already on the page's ground
    "bag": ("higgsfield/bag-17ddd7fb.png", (0.08, 0.14, 0.92, 0.94), dict(lift=0.0, sat=1.0, warmth=0.0), (1400, 900, 480)),
}

FILM = {
    # the dry bed before the pour: the hero poster
    "bloom-0": ("poster-0.png", (1080,)),
    # one still per phase for the reduced-motion ruler
    "bloom-5": ("poster-5.png", (480,)),
    "bloom-20": ("poster-20.png", (480,)),
    "bloom-40": ("poster-40.png", (480,)),
}


def main(only):
    for name, (master, box, kw, widths) in SLOTS.items():
        if only and name not in only:
            continue
        print(name)
        im = src(RAW, master)
        if im is None:
            continue
        im = crop_frac(im.convert("RGB"), *box)
        save(grade(im, **kw), name, widths)
    for name, (master, widths) in FILM.items():
        if only and name not in only:
            continue
        print(name)
        im = src(SHOTS, master)
        if im is None:
            continue
        # the film is already graded by film.sh; only resize
        save(im.convert("RGB"), name, widths, q=82)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
