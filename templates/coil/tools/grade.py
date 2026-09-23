"""Grade and export COIL's photographs from tools/raw/ into img/.

Every photo goes through one pass so the set reads as one shoot:
  - a gentle tone curve (lifted blacks, soft shoulder),
  - saturation pulled toward the page's olive palette,
  - product shots on white are multiplied into the page ground (--porcelain),
    so their white sweep *is* the page and nothing sits in a box.

Run from templates/coil/:  python tools/grade.py
Sources (see IMAGE-CREDITS.md) are gitignored in tools/raw/.
"""
import os
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "..", "img")
GROUND = np.array([0xF4, 0xF4, 0xEF], dtype=np.float32) / 255.0  # --porcelain


def load(name):
    return Image.open(os.path.join(RAW, name)).convert("RGB")


def crop(im, box):
    """box = (x0, y0, x1, y1) as fractions of the frame."""
    w, h = im.size
    x0, y0, x1, y1 = box
    return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))


def tone(a, lift=0.02, shoulder=0.96, sat=0.9, warm=0.0):
    """a: float32 HxWx3 in 0..1."""
    a = lift + (shoulder - lift) * a                     # lift blacks, soften whites a touch
    a = np.clip(a, 0, 1)
    a = a * a * (3 - 2 * a) * 0.35 + a * 0.65            # gentle S for body
    grey = (a * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
    a = grey + (a - grey) * sat
    if warm:
        a = a + np.array([warm, warm * 0.4, -warm], dtype=np.float32)
    return np.clip(a, 0, 1)


def flat_field(a, size=300, reach=41):
    """Divide out an uneven, tinted paper sweep (the teabag shot is lit blue-grey
    and falls off at the corners). The background is estimated on a small copy
    with a max filter wider than the subject, then blurred and scaled back up,
    so the subject itself doesn't darken the estimate."""
    h, w = a.shape[:2]
    small = Image.fromarray((a * 255).astype(np.uint8)).resize((size, round(size * h / w)), Image.BILINEAR)
    bg = small.filter(ImageFilter.MaxFilter(reach)).filter(ImageFilter.GaussianBlur(reach / 2))
    bg = np.asarray(bg.resize((w, h), Image.BILINEAR)).astype(np.float32) / 255.0
    return np.clip(a / np.maximum(bg, 0.2), 0, 1)


def white_balance(a, border=0.04):
    """Scale each channel so the paper at the frame's edge reads neutral white
    (the spoon shot is lit cold blue). For frames the subject mostly fills,
    where flat_field would read the subject as background."""
    h, w = a.shape[:2]
    b = int(min(h, w) * border)
    edge = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    white = np.percentile(edge, 90, axis=0)
    return np.clip(a / np.maximum(white, 0.5), 0, 1)


def on_ground(a, white_point=0.985):
    """Multiply a product-on-white photo into the page ground.
    Pixels at or above white_point become exactly the ground colour."""
    a = np.clip(a / white_point, 0, 1)
    return a * GROUND


def save(a, name, widths, q=82):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    for w in widths:
        r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        if w < im.width:
            r = r.filter(ImageFilter.UnsharpMask(radius=0.6, percent=40, threshold=2))
        path = os.path.join(OUT, f"{name}-{w}.webp")
        r.save(path, "WEBP", quality=q, method=6)
        print(f"{path}  {r.size[0]}x{r.size[1]}  {os.path.getsize(path) // 1024} KB")


def arr(im):
    return np.asarray(im).astype(np.float32) / 255.0


SLOTS = {
    # name: (source, crop box, tone kwargs, on white?, output widths)
    "pellets": ("u-pellets-bowl.jpg", (0.02, 0.02, 0.98, 0.98), dict(sat=0.86), True, (1400, 820)),
    "open-leaf": ("u-open-leaves.jpg", (0.0, 0.0, 1.0, 1.0), dict(sat=0.86), True, (1400, 820)),
    "lugu": ("u-lugu-fog.jpg", (0.0, 0.0, 0.62, 1.0), dict(lift=0.05, sat=0.72), False, (1600, 900)),
    "pile": ("u-pellets-pile.jpg", (0.02, 0.08, 0.98, 1.0), dict(sat=0.86), True, (900, 520)),
    "teabag": ("a-teabag-246885859.jpg", (0.14, 0.12, 0.86, 0.84), dict(sat=0.86), True, (1200, 700)),
    "liquor": ("u-liquor-glass.jpg", (0.08, 0.14, 0.92, 0.98), dict(lift=0.03, sat=0.74), False, (1100, 640)),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    only = os.environ.get("ONLY")
    for name, (src, box, tk, white, widths) in SLOTS.items():
        if only and name not in only.split(","):
            continue
        if white:
            tk = {**tk, "shoulder": 1.0}  # paper white must stay 1.0 or the sweep shows as a box
        a = arr(crop(load(src), box))
        if white == "flat":
            a = flat_field(a)
        elif white == "wb":
            a = white_balance(a)
        a = tone(a, **tk)
        if white:
            a = on_ground(a)
        save(a, name, widths)


if __name__ == "__main__":
    main()
