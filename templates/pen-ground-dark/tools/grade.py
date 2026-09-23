"""Asset pipeline for GROUND.

Reads the licensed source frames cached under tools/raw/ (Unsplash and
Pexels, ids in IMAGE-CREDITS.md), crops them, applies one of three grades,
and writes the webp set the site loads. Re-runnable and deterministic.

  nib   — near-monochrome with the metal kept: everything desaturated hard
          except the yellow/orange band the gold tipping and nib live in,
          blacks pulled down to the page ground, film grain. The one
          grade that is allowed any colour on the dark pages.
  steel — full monochrome, cool shadow lift, grain. Frames where no gold
          is in shot, or where colour would compete with the type.
  paper — the light register. Warm off-white lift, blacks kept honest,
          used only inside the paper-white "test sheet" sections.

  python tools/grade.py            # all
  python tools/grade.py tip slit   # a subset
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")
IMG = os.path.join(ROOT, "img")
os.makedirs(IMG, exist_ok=True)

# name -> (raw file, crop as fractions l,t,r,b, grade, widths)
PLAN = {
    # index
    "tip":     ("u-pZJfBG9I2Z0.jpg", (0.00, 0.06, 0.66, 0.78), "nib",   [2200, 1400, 900]),
    "point":   ("p-19875634.jpg",    (0.00, 0.00, 1.00, 1.00), "steel", [1800, 1100]),
    "stamped": ("p-31553891.jpg",    (0.00, 0.12, 1.00, 0.88), "steel", [1400, 900]),
    "slit":    ("p-18452256.jpg",    (0.00, 0.06, 1.00, 0.94), "nib",   [1200, 800]),
    # the notebook's edge runs diagonally; this crop keeps the nib mid-frame and leaves
    # the right half as black leather so the ledger can sit on it
    "pen":     ("u-H-o28jg1mjw.jpg", (0.00, 0.34, 1.00, 0.90), "nib",   [1800, 1100]),
    "hand":    ("u-HBYRS5S8edg.jpg", (0.00, 0.00, 1.00, 1.00), "steel", [1800, 1100]),
    "sheet":   ("u-egEuzZNpjvE.jpg", (0.00, 0.00, 1.00, 1.00), "paper", [1800, 1100]),
    # grinds
    "write":   ("u-y02jEX_B0O0.jpg", (0.00, 0.30, 1.00, 1.00), "steel", [1800, 1100]),
    "draw":    ("u-nXhKyFQ6Uyg.jpg", (0.00, 0.00, 1.00, 1.00), "steel", [1600, 1000]),
    "script":  ("u-vu96Jx7rNfQ.jpg", (0.00, 0.00, 1.00, 1.00), "paper", [1600, 1000]),
    "drop":    ("u-SXn-fWj0Ht4.jpg", (0.00, 0.00, 1.00, 1.00), "paper", [1600, 1000]),
    # order
    # second crop of the same photograph as "pen" — one pen, shown twice on purpose (DESIGN.md §1)
    "penend":  ("u-H-o28jg1mjw.jpg", (0.34, 0.30, 0.82, 0.78), "nib",   [1200, 800]),
    "kraft":   ("u-bLkxCCtxB3I.jpg", (0.00, 0.00, 1.00, 1.00), "steel", [1600, 1000]),
    "grid":    ("p-7153019.jpg",     (0.00, 0.00, 1.00, 1.00), "steel", [1600, 1000]),
}

QUALITY = {"nib": 82, "steel": 78, "paper": 82}
GROUND = np.array([0x0B, 0x0B, 0x0A], dtype=np.float32) / 255.0
PAPER = np.array([0xED, 0xE7, 0xDA], dtype=np.float32) / 255.0


def grain(a, amount, seed):
    rng = np.random.default_rng(seed)
    n = rng.normal(0.0, amount, a.shape[:2]).astype(np.float32)
    weight = 1.0 - np.abs(a.mean(axis=2) - 0.5) * 1.6
    return a + (n * np.clip(weight, 0.0, 1.0))[..., None]


def luma(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def tone_dark(g):
    # lift contrast, sink the floor toward the page ground, keep highlights
    g = np.clip((g - 0.5) * 1.22 + 0.44, 0.0, 1.0)
    return g ** 1.10


def steel(im, seed):
    a = np.asarray(im).astype(np.float32) / 255.0
    g = tone_dark(luma(a))
    out = np.stack([g, g, g], -1)
    # cool tint in the shadows only
    shadow = (1.0 - g)[..., None]
    out = out * (1.0 - shadow * 0.06) + shadow * np.array([0.00, 0.01, 0.03], dtype=np.float32)
    out = out * (1.0 - GROUND) + GROUND
    return np.clip(grain(out, 0.014, seed), 0.0, 1.0)


def nib(im, seed):
    a = np.asarray(im).astype(np.float32) / 255.0
    g = tone_dark(luma(a))
    mono = np.stack([g, g, g], -1)
    # keep the gold: mask by hue in the yellow/orange band and by saturation
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    r, gg, b = a[..., 0], a[..., 1], a[..., 2]
    warm = (r >= gg) & (gg >= b * 1.05) & (sat > 0.18)
    keep = np.clip((sat - 0.18) / 0.25, 0.0, 1.0) * warm
    keep = keep[..., None]
    # the kept colour is the original, re-toned to the same luma curve
    ratio = (tone_dark(luma(a)) / np.maximum(luma(a), 1e-4))[..., None]
    colour = np.clip(a * ratio, 0.0, 1.0)
    # nudge toward the site gold so every nib reads as the same alloy
    gold = np.array([0.79, 0.64, 0.36], dtype=np.float32)
    colour = colour * 0.80 + (gold * luma(colour)[..., None] / 0.62) * 0.20
    out = mono * (1.0 - keep) + colour * keep
    out = out * (1.0 - GROUND) + GROUND
    return np.clip(grain(out, 0.012, seed), 0.0, 1.0)


def paper(im, seed):
    a = np.asarray(im).astype(np.float32) / 255.0
    g = luma(a)
    g = np.clip((g - 0.5) * 1.12 + 0.52, 0.0, 1.0) ** 0.96
    # warm duotone: ink black to paper cream
    ink = np.array([0.08, 0.07, 0.06], dtype=np.float32)
    out = ink + (PAPER - ink) * g[..., None]
    return np.clip(grain(out, 0.010, seed), 0.0, 1.0)


GRADES = {"steel": steel, "nib": nib, "paper": paper}


def run(name):
    src, crop, grade, widths = PLAN[name]
    im = Image.open(os.path.join(RAW, src)).convert("RGB")
    w, h = im.size
    l, t, r, b = crop
    im = im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
    seed = sum(ord(c) for c in name)
    for i, width in enumerate(widths):
        wi = im.copy()
        if wi.width > width:
            wi = wi.resize((width, round(wi.height * width / wi.width)), Image.LANCZOS)
        out = GRADES[grade](wi, seed + i)
        pil = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8))
        suffix = "" if i == 0 else f"-{width}"
        path = os.path.join(IMG, f"{name}{suffix}.webp")
        pil.save(path, "WEBP", quality=QUALITY[grade], method=6)
        print(f"  {name}{suffix}.webp {pil.width}x{pil.height} {os.path.getsize(path)//1024} KB")


if __name__ == "__main__":
    names = sys.argv[1:] or list(PLAN)
    for n in names:
        print(n)
        run(n)
