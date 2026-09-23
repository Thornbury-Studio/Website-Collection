"""Asset pipeline for BLOOM.

Pulls the licensed Pexels source frames, crops them, runs every editorial
frame through ONE grade, and writes the webp set the site loads.
Re-runnable: sources are cached under tools/raw/ (gitignored), so a re-run
costs nothing.

  roast — the house grade. Blacks land on the page ground (#0F0D0B), not
          on 0; highlights roll off to the paper tone (#F2EBE0), not to
          white. Greens are pulled hard toward olive so foliage never
          fights the page; reds and oranges keep most of their chroma,
          because a ripe cherry is the one colour this site lets a
          photograph shout.
  (the bag itself — img/bag-front.webp — is not graded here: it is
  printed and lit by tools/bag.py.)
  bed   — the bloom plate. Not graded to taste: the shader does its own
          wetting, darkening and foam on top of it, so the plate stays
          near-neutral with headroom, cropped square and centred on the
          dry grounds. GROUNDS_R below is the grounds radius as a
          fraction of the plate width; js/bloom.js reads the same number.

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

GROUND = np.array([15, 13, 11], np.float32) / 255.0
PAPER = np.array([242, 235, 224], np.float32) / 255.0

# The plate is cropped so the grounds circle has this radius as a fraction
# of the plate's width. Keep in sync with GROUNDS_R in js/bloom.js.
GROUNDS_R = 0.30

# name -> (pexels id, crop l,t,r,b as fractions, exposure, widths[, sky burn])
# sky burn: the top fraction of the frame that is darkened, so a landscape
# sky never becomes the brightest thing on a dark page
PLAN = {
    # index.html
    "foam":      ("28298184", (0.00, 0.16, 1.00, 0.86), 0.92, [1400, 900]),
    "hands":     ("36040333", (0.00, 0.00, 1.00, 1.00), 0.88, [1600, 900]),
    "beans":     ("31890566", (0.00, 0.12, 1.00, 0.88), 0.96, [1400, 900]),
    # lot.html
    "valley":    ("13807913", (0.00, 0.14, 1.00, 0.96), 0.86, [2400, 1400], 0.55),
    "branch":    ("7125698",  (0.00, 0.08, 1.00, 0.84), 0.90, [1200, 800]),
    "pick":      ("6152430",  (0.00, 0.00, 1.00, 1.00), 0.92, [1600, 900]),
    "basket":    ("7125739",  (0.00, 0.14, 1.00, 0.90), 0.90, [1200, 800]),
    "wash":      ("7125590",  (0.00, 0.10, 1.00, 0.80), 0.90, [1200, 800]),
    "beds":      ("17366133", (0.00, 0.00, 1.00, 1.00), 0.86, [2400, 1400], 0.30),
    "slope":     ("32419583", (0.00, 0.00, 1.00, 1.00), 0.86, [2400, 1400], 0.34),
    # monday.html
    "discharge": ("31890552", (0.00, 0.06, 1.00, 0.94), 0.98, [1800, 1000]),
    "panel":     ("4820811",  (0.00, 0.00, 1.00, 1.00), 0.84, [1600, 900]),
    "cooling":   ("12088958", (0.00, 0.45, 1.00, 1.00), 0.94, [2400, 1400]),
    "scoop":     ("29873454", (0.00, 0.00, 1.00, 1.00), 1.00, [1600, 900]),
    "sacks":     ("18053128", (0.00, 0.16, 1.00, 0.86), 0.94, [1200, 800]),
    "bagging":   ("22679458", (0.00, 0.14, 1.00, 0.86), 0.92, [1400, 900]),
    # bag.html
    "origami":   ("34386686", (0.00, 0.10, 1.00, 1.00), 0.86, [1200, 800]),
    "cup":       ("8250943",  (0.02, 0.00, 0.54, 0.80), 1.00, [1200, 800]),
    "kettle":    ("12100693", (0.06, 0.30, 1.00, 0.96), 0.78, [1200, 800]),
}

QUALITY = 80


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
    weight = 1.0 - np.abs(a.mean(axis=2) - 0.5) * 1.6
    return a + (n * np.clip(weight, 0.0, 1.0))[..., None]


def roast(im, ev, seed, burn=0.0):
    # chroma first, in HSV: greens to olive, reds kept, the rest held back
    hsv = np.asarray(im.convert("HSV")).astype(np.float32)
    h, s = hsv[..., 0], hsv[..., 1]
    deg = h / 255.0 * 360.0
    green = np.clip(1.0 - np.abs(deg - 110.0) / 60.0, 0.0, 1.0)
    red = np.clip(1.0 - np.minimum(np.abs(deg - 8.0), np.abs(deg - 368.0)) / 30.0, 0.0, 1.0)
    mult = 0.70 - 0.34 * green + 0.24 * red
    hsv[..., 1] = np.clip(s * mult, 0, 255)
    hsv[..., 0] = (h - green * 9.0) % 256          # green -> olive
    a = np.asarray(Image.frombytes("HSV", im.size, hsv.astype(np.uint8).tobytes()).convert("RGB"))
    a = a.astype(np.float32) / 255.0

    # tone: exposure, deeper shadows, a quarter of an S
    a = np.clip(a * ev, 0.0, 1.0)
    a = a ** 1.10
    ss = a * a * (3.0 - 2.0 * a)
    a = a * 0.72 + ss * 0.28

    # vignette — edges settle into the page ground
    hgt, wid = a.shape[:2]
    yy, xx = np.mgrid[0:hgt, 0:wid].astype(np.float32)
    q = ((xx / wid - 0.5) ** 2 + (yy / hgt - 0.5) ** 2)
    a = a * (1.0 - np.clip(q * 0.55, 0.0, 0.3))[..., None]

    if burn:
        t = np.clip(1.0 - (yy / hgt) / burn, 0.0, 1.0)
        a = a * (1.0 - 0.62 * t * t)[..., None]

    # map 0..1 onto ground..paper, so black is roasted, white is paper
    a = GROUND + a * (PAPER - GROUND)
    return np.clip(grain(a, 0.010, seed), 0.0, 1.0)


def find_grounds(im):
    """Centre and radius of the dry grounds in the Kalita frame: the only
    warm-brown, saturated disc in a black-and-white photograph."""
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    brown = (r > g * 1.18) & (g > b * 1.02) & (r > 40) & (r < 215)
    h, w = brown.shape
    yy, xx = np.mgrid[0:h, 0:w]
    # restrict to the central band, where the dripper sits
    box = (xx > w * 0.25) & (xx < w * 0.80) & (yy > h * 0.35) & (yy < h * 0.70)
    m = brown & box
    cy, cx = yy[m].mean(), xx[m].mean()
    # the rim of the disc, not its area: dark grounds fail the brown test,
    # so an area-derived radius comes out ~30% short
    d = np.hypot(xx[m] - cx, yy[m] - cy)
    rad = float(np.percentile(d, 97.0))
    return cx, cy, rad


def bed():
    im = source("30349807")
    cx, cy, rad = find_grounds(im)
    half = rad / (2.0 * GROUNDS_R)
    box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))
    sq = im.crop(box)
    a = np.asarray(sq).astype(np.float32) / 255.0
    # near-neutral: keep the grounds' own colour, pull the paper off white
    # so the shader has headroom to wet it, and sink the counter
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    a = a * 0.86 + lum[..., None] * 0.14
    a = np.clip((a - 0.5) * 0.96 + 0.47, 0.0, 1.0)
    out = Image.fromarray((a * 255 + 0.5).astype(np.uint8))
    for size, suffix in ((2048, ""), (1024, "-1024")):
        o = out.resize((size, size), Image.LANCZOS)
        path = os.path.join(IMG, f"bed{suffix}.webp")
        o.save(path, "WEBP", quality=90, method=6)
        print(f"  {os.path.basename(path):22s} {size}x{size} "
              f"{os.path.getsize(path)//1024} KB  (grounds r={rad:.0f}px @ {cx:.0f},{cy:.0f})")


def run():
    bed()
    for i, (name, spec) in enumerate(PLAN.items()):
        pid, box, ev, widths = spec[:4]
        burn = spec[4] if len(spec) > 4 else 0.0
        im = source(pid)
        w, h = im.size
        im = im.crop((int(w * box[0]), int(h * box[1]),
                      int(w * box[2]), int(h * box[3])))
        graded = Image.fromarray((roast(im, ev, 2000 + i * 11, burn) * 255 + 0.5).astype(np.uint8))
        for width in widths:
            out = graded
            if out.width > width:
                out = out.resize((width, max(1, round(out.height * width / out.width))),
                                 Image.LANCZOS)
            suffix = "" if width == widths[0] else f"-{width}"
            path = os.path.join(IMG, f"{name}{suffix}.webp")
            out.save(path, "WEBP", quality=QUALITY, method=6)
            print(f"  {os.path.basename(path):22s} {out.width}x{out.height} "
                  f"{os.path.getsize(path)//1024} KB")


if __name__ == "__main__":
    run()
