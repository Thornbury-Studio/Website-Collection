"""Asset pipeline for TALLOW DARK.

Pulls the licensed Pexels source frames, crops them, applies one of three
grades, and writes the webp set the site loads. Re-runnable: sources are
cached under tools/raw/ so a re-run costs nothing.

  cold  — documentary black and white, cool shadow lift, film grain.
          The raw half of the story.
  warm  — ivory/tallow duotone, lifted blacks, soft roll-off.
          The rendered half.
  plate — near-neutral, low-clip. This one is NOT graded on disk; the
          render-pass shader grades it live on both sides of the melt line,
          so it has to stay honest.

  python tools/grade.py
"""

import os
import urllib.request

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")
IMG = os.path.join(ROOT, "img")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

os.makedirs(RAW, exist_ok=True)
os.makedirs(IMG, exist_ok=True)

# name -> (pexels id, crop as fractions l,t,r,b or None, grade, widths)
PLAN = {
    "plate":   ("20444768", (0.250, 0.315, 0.790, 0.665), "plate", [1800, 1100]),
    "arch":    ("39180001", (0.00, 0.00, 1.00, 1.00),   "cold",  [1800, 1100]),
    "hall":    ("38303941", (0.00, 0.02, 1.00, 0.94),   "cold",  [1800, 1100]),
    "hands":   ("37634572", (0.00, 0.10, 1.00, 0.90),   "cold",  [1400, 900]),
    "grind":   ("39152970", (0.00, 0.14, 1.00, 0.86),   "cold",  [1400, 900]),
    "glass":   ("1366942",  (0.00, 0.00, 1.00, 1.00),   "cold",  [1600, 1000]),
    "bottles": ("7191393",  (0.00, 0.00, 1.00, 1.00),   "cold",  [1600, 1000]),
    "field":   ("15203362", (0.00, 0.06, 1.00, 0.94),   "cold",  [1800, 1100]),
    "rack":    ("4912164",  (0.00, 0.00, 1.00, 1.00),   "warm",  [1600, 1000]),
}

# webp quality per grade — grain is expensive to encode, and the wide cold
# frames are the only ones that get big enough to matter
QUALITY = {"cold": 76, "warm": 82, "plate": 86}


def source(pid, want=3200):
    p = os.path.join(RAW, f"{pid}.jpg")
    if not os.path.exists(p):
        url = (f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}"
               f".jpeg?auto=compress&cs=tinysrgb&w={want}")
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=120) as r:
            open(p, "wb").write(r.read())
        print("  fetched", pid)
    return Image.open(p).convert("RGB")


def grain(a, amount, seed):
    rng = np.random.default_rng(seed)
    n = rng.normal(0.0, amount, a.shape[:2]).astype(np.float32)
    # grain rides the midtones, not the blacks — keeps shadows clean
    weight = 1.0 - np.abs(a.mean(axis=2) - 0.5) * 1.6
    return a + (n * np.clip(weight, 0.0, 1.0))[..., None]


def cold(im, seed):
    g = np.asarray(im.convert("L")).astype(np.float32) / 255.0
    g = np.clip((g - 0.5) * 1.30 + 0.435, 0.0, 1.0)
    g = g ** 1.12
    out = np.stack([g * 0.955 + 0.014, g * 0.975 + 0.017, g * 1.000 + 0.034], -1)
    return np.clip(grain(out, 0.016, seed), 0.0, 1.0)


def warm(im, seed):
    g = np.asarray(im.convert("L")).astype(np.float32) / 255.0
    g = np.clip((g - 0.5) * 1.06 + 0.455, 0.0, 1.0)
    g = g ** 1.00
    out = np.stack([g * 0.990 + 0.052, g * 0.885 + 0.031, g * 0.660 + 0.018], -1)
    return np.clip(grain(out, 0.013, seed), 0.0, 1.0)


def plate(im, seed):
    a = np.asarray(im).astype(np.float32) / 255.0
    g = a.mean(axis=2)
    # desaturate hard but keep a whisper of the original cast, and pull the
    # highlights off the ceiling so the shader has headroom on the warm side
    a = a * 0.18 + g[..., None] * 0.82
    a = np.clip((a - 0.5) * 0.94 + 0.475, 0.0, 1.0)
    return np.clip(grain(a, 0.008, seed), 0.0, 1.0)


GRADES = {"cold": cold, "warm": warm, "plate": plate}


def run():
    for i, (name, (pid, box, kind, widths)) in enumerate(PLAN.items()):
        im = source(pid)
        w, h = im.size
        if box:
            im = im.crop((int(w * box[0]), int(h * box[1]),
                          int(w * box[2]), int(h * box[3])))
        arr = GRADES[kind](im, seed=1000 + i * 7)
        graded = Image.fromarray((arr * 255.0 + 0.5).astype(np.uint8))
        for width in widths:
            out = graded.copy()
            if out.width > width:
                out = out.resize(
                    (width, max(1, round(out.height * width / out.width))),
                    Image.LANCZOS)
            suffix = "" if width == widths[0] else f"-{width}"
            path = os.path.join(IMG, f"{name}{suffix}.webp")
            out.save(path, "WEBP", quality=QUALITY[kind], method=6)
            print(f"  {os.path.basename(path):24s} {out.width}x{out.height}"
                  f" {os.path.getsize(path)//1024} KB")

    # share card, built from the melt subject so the card carries the idea
    card = Image.open(os.path.join(IMG, "plate.webp")).convert("RGB")
    card = card.resize((1200, round(card.height * 1200 / card.width)),
                       Image.LANCZOS)
    top = card.crop((0, max(0, (card.height - 630) // 2),
                     1200, max(0, (card.height - 630) // 2) + 630))
    a = np.asarray(top).astype(np.float32) / 255.0
    g = a.mean(axis=2)
    y = np.linspace(0.0, 1.0, top.height, dtype=np.float32)[:, None]
    mix = np.clip((y - 0.46) * 9.0 + 0.5, 0.0, 1.0)[..., None]
    c = np.stack([g * 0.955 + 0.014, g * 0.975 + 0.017, g * 1.000 + 0.034], -1)
    wme = np.stack([g * 0.990 + 0.052, g * 0.885 + 0.031, g * 0.660 + 0.018], -1)
    both = c * (1.0 - mix) + wme * mix
    Image.fromarray((np.clip(both, 0, 1) * 255).astype(np.uint8)).save(
        os.path.join(IMG, "og.webp"), "WEBP", quality=84, method=6)
    print("  og.webp                  1200x630")


if __name__ == "__main__":
    run()
