"""The BLOOM. bag, from one licensed photograph of a blank kraft pouch.

A label printer's mock-up, done honestly: the pouch is a real photograph
(Pexels 12039675, a plain stand-up kraft pouch on a grey sweep); the label
is tools/label.html in the site's own fonts, rendered by tools/label.mjs.
This script
  1. cuts the pouch out of its sweep by chroma (kraft is warm, the sweep
     and its shadow are neutral grey),
  2. prints the label INTO the kraft — ink multiplies the paper, so every
     wrinkle and fibre shows through the print — with a slight horizontal
     bulge, because a filled pouch is not flat,
  3. relights it for a dark set (one soft key from the upper left),
  4. stands it on the page ground with a contact shadow,
and writes img/bag-front.webp (+ -900) and tools/raw/bagmap.json: where
the "Roasted on" and "Batch" boxes landed, as percentages of the image,
which is what css/style.css uses to lay the live red date stamp on the
bag. No date is printed here on purpose — the site stamps it.

  node tools/label.mjs && python tools/bag.py
"""

import json
import os

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")
IMG = os.path.join(ROOT, "img")

GROUND = np.array([15, 13, 11], np.float32) / 255.0


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def main():
    src = np.asarray(Image.open(os.path.join(RAW, "12039675.jpg")).convert("RGB")).astype(np.float32) / 255.0
    H, W = src.shape[:2]

    # 1 — the cut. Saturation separates warm kraft from the neutral sweep.
    mx, mn = src.max(2), src.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    soft = smooth(0.05, 0.11, sat)
    hard = sat > 0.08
    filled = np.zeros_like(hard)
    for y in range(H):                       # a pouch is convex along each row
        xs = np.nonzero(hard[y])[0]
        if len(xs) > 40:
            filled[y, xs.min():xs.max() + 1] = True
    fill_im = Image.fromarray((filled * 255).astype(np.uint8))
    interior = np.asarray(fill_im.filter(ImageFilter.MinFilter(9))) > 127
    alpha = np.maximum(interior.astype(np.float32), soft * filled)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255.0
    ys, xs = np.nonzero(alpha > 0.5)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()

    # 2 — the print. Label is 1600×2360 (2× of 800×1180 CSS px).
    lab = np.asarray(Image.open(os.path.join(RAW, "label.png")).convert("RGBA")).astype(np.float32) / 255.0
    info = json.load(open(os.path.join(RAW, "label.json")))
    lw_css, lh_css = info["label"][2], info["label"][3]
    cx = (bx0 + bx1) / 2.0
    target_w = (bx1 - bx0) * 0.80
    scale = target_w / lab.shape[1]
    target_h = lab.shape[0] * scale
    top = by0 + (by1 - by0) * 0.175
    # inverse map every pouch pixel in the label box back into the label,
    # with the bulge: the print is compressed toward the pouch edges
    X0, X1 = int(cx - target_w / 2) - 4, int(cx + target_w / 2) + 4
    Y0, Y1 = int(top), int(top + target_h) + 1
    yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32)
    k = 0.92                                   # sin of the half-angle of the bulge
    u = (xx - cx) / (target_w / 2) * k
    u = np.clip(u, -k, k)
    lu = (np.arcsin(u) / np.arcsin(k) + 1.0) * 0.5          # 0..1 across the label
    lv = (yy - top) / target_h
    inside = (lv >= 0) & (lv <= 1) & (np.abs((xx - cx) / (target_w / 2)) <= 1)
    li = np.clip((lu * (lab.shape[1] - 1)).astype(np.int32), 0, lab.shape[1] - 1)
    lj = np.clip((lv * (lab.shape[0] - 1)).astype(np.int32), 0, lab.shape[0] - 1)
    ink = lab[lj, li, 3] * inside
    ink_im = Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    ink = np.asarray(ink_im).astype(np.float32) / 255.0 * 0.9
    patch = src[Y0:Y1, X0:X1]
    printed = patch * (1.0 - ink[..., None]) + patch * np.array([0.15, 0.115, 0.095], np.float32) * ink[..., None]
    out = src.copy()
    out[Y0:Y1, X0:X1] = printed

    # 3 — a dark set: one soft key from the upper left, falling away right
    # and down, and a little warmth in the shadow side of the kraft
    gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (gx - bx0) / (bx1 - bx0)
    ny = (gy - by0) / (by1 - by0)
    key = 0.88 - 0.42 * smooth(0.1, 1.1, nx) - 0.26 * smooth(0.25, 1.05, ny)
    key *= 0.93 + 0.07 * (1.0 - smooth(0.0, 0.2, np.abs(nx - 0.08)))
    lit = out * key[..., None]
    lit = lit * np.array([1.0, 0.975, 0.94], np.float32)

    # 4 — onto the ground, with a contact shadow
    CW, CH = 1500, 1800
    s = (CH * 0.84) / (by1 - by0)
    pw, ph = int(W * s), int(H * s)
    lit_im = Image.fromarray((np.clip(lit, 0, 1) * 255).astype(np.uint8)).resize((pw, ph), Image.LANCZOS)
    a_im = Image.fromarray((alpha * 255).astype(np.uint8)).resize((pw, ph), Image.LANCZOS)
    ox = int(CW / 2 - cx * s)
    oy = int(CH * 0.07 - by0 * s)

    canvas = np.ones((CH, CW, 3), np.float32) * GROUND
    # contact shadow: a flat, soft ellipse under the base
    sy, sx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    base_y = oy + by1 * s
    ex = (sx - CW / 2) / ((bx1 - bx0) * s * 0.62)
    ey = (sy - base_y) / 26.0
    shadow = np.exp(-(ex * ex + ey * ey) * 1.6) * 0.8
    canvas *= (1.0 - shadow)[..., None]
    # a faint pool of light on the floor, behind the bag
    glow = np.exp(-(((sx - CW * 0.46) / 700.0) ** 2 + ((sy - CH * 0.46) / 820.0) ** 2)) * 0.035
    canvas += glow[..., None] * np.array([1.0, 0.86, 0.68], np.float32)

    lit_a = np.asarray(lit_im).astype(np.float32) / 255.0
    aa = np.asarray(a_im).astype(np.float32)[..., None] / 255.0
    cy0, cy1 = max(0, oy), min(CH, oy + ph)
    cx0, cx1 = max(0, ox), min(CW, ox + pw)
    region = canvas[cy0:cy1, cx0:cx1]
    sub = lit_a[cy0 - oy:cy1 - oy, cx0 - ox:cx1 - ox]
    subA = aa[cy0 - oy:cy1 - oy, cx0 - ox:cx1 - ox]
    canvas[cy0:cy1, cx0:cx1] = region * (1 - subA) + sub * subA

    rng = np.random.default_rng(7)
    canvas += rng.normal(0, 0.006, canvas.shape[:2]).astype(np.float32)[..., None]
    # the frame must vanish into the page: every edge lands on the exact
    # ground colour, so the image never shows as a rectangle
    # (an elliptical window: a rectangular one leaves a rectangle of glow)
    rad = np.sqrt(((sx / CW - 0.5) / 0.5) ** 2 + ((sy / CH - 0.5) / 0.5) ** 2)
    win = (1.0 - smooth(0.62, 0.97, rad))[..., None]
    canvas = GROUND + (canvas - GROUND) * win
    img = Image.fromarray((np.clip(canvas, 0, 1) * 255 + 0.5).astype(np.uint8))
    img.save(os.path.join(IMG, "bag-front.webp"), "WEBP", quality=84, method=6)
    img.resize((900, int(CH * 900 / CW)), Image.LANCZOS).save(os.path.join(IMG, "bag-front-900.webp"), "WEBP", quality=84, method=6)

    # where the boxes landed, in percent of the output image (flat-mapped
    # through the bulge at each box's own centre, which is close enough
    # for a stamp that is itself rotated a few degrees)
    def place(box):
        x, y, w, h = box
        def to_px(ux, vy):
            u = (ux / lw_css) * 2 - 1
            px = cx + np.sin(u * np.arcsin(k)) / k * (target_w / 2)
            py = top + (vy / lh_css) * target_h
            return ox + px * s, oy + py * s
        x0, y0 = to_px(x, y)
        x1, y1 = to_px(x + w, y + h)
        return {"left": round(x0 / CW * 100, 2), "top": round(y0 / CH * 100, 2),
                "width": round((x1 - x0) / CW * 100, 2), "height": round((y1 - y0) / CH * 100, 2)}
    bagmap = {"size": [CW, CH], "roasted": place(info["roasted"]), "batch": place(info["batch"])}
    json.dump(bagmap, open(os.path.join(RAW, "bagmap.json"), "w"), indent=2)
    print(json.dumps(bagmap))
    for n in ("bag-front.webp", "bag-front-900.webp"):
        print(" ", n, os.path.getsize(os.path.join(IMG, n)) // 1024, "KB")


if __name__ == "__main__":
    main()
