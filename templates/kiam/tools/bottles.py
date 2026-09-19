"""Five real bottles from one photograph.

Source: assets/raw/bottle-cutout.png — Adobe Stock 525762808 (a clear glass soda bottle
of red drink, crown cap, front-lit) with the background removed. Every variant keeps that
frame's lighting, refraction and highlights; only three things change:

  1. the liquid is re-coloured to the soda's range token, preserving the photo's own
     brightness and saturation structure (HSV remap, not a flat tint);
  2. the silver crown cap is re-tinted plum from its luminance;
  3. the printed label (rendered from tools/label.html by tools/labels.mjs) is wrapped
     onto the body as a cylinder and shaded by the glass's own light — including the
     specular streak, softened, the way a paper label picks it up.

Output: assets/img/bottle-<soda>-{1400,800}.webp (RGBA).   Run from templates/kiam.
"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "raw", "bottle-cutout.png")
LBL = os.path.join(ROOT, "assets", "raw", "labels")
OUT = os.path.join(ROOT, "assets", "img")

PLUM = np.array([0x3D, 0x1A, 0x1B]) / 255.0

# hue (deg), sat, val of the range token, plus how much of the photo's shading to keep
# (gamma < 1 lifts the shadows so pale sodas stay pale) — tokens from css/style.css
# "liquid" is the colour the drink reads as through glass — a touch paler and less acid than
# the print token, which is what the label and the bands use.
SODAS = {
    "calamansi":  dict(rgb="#D8D54F", liquid="#E7D468", gv=0.50, gs=0.85),
    "grapefruit": dict(rgb="#F08A80", liquid="#F49A8C", gv=0.55, gs=0.80),
    "pineapple":  dict(rgb="#F2C24B", liquid="#F3C65E", gv=0.55, gs=0.80),
    "roselle":    dict(rgb="#A81B36", liquid="#A81B36", gv=0.95, gs=0.90),
    "watermelon": dict(rgb="#EE5A73", liquid="#F06A80", gv=0.65, gs=0.85),
}

def hex_rgb(h):
    h = h.lstrip("#"); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)]) / 255.0

def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-9), 0)
    h = np.zeros_like(mx)
    m = d > 1e-9
    rc = np.where(m, (mx - r) / np.maximum(d, 1e-9), 0); gc = np.where(m, (mx - g) / np.maximum(d, 1e-9), 0); bc = np.where(m, (mx - b) / np.maximum(d, 1e-9), 0)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2.0 + rc - bc, 4.0 + gc - rc))
    h = np.where(m, (h / 6.0) % 1.0, 0)
    return h, s, mx

def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)

def feather(mask, px):
    """Box-blur a boolean mask into a soft 0..1 edge."""
    m = mask.astype(np.float32)
    for _ in range(2):
        k = np.ones(px) / px
        m = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, m)
        m = np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), 0, m)
    return np.clip(m, 0, 1)

def bilinear(img, yy, xx):
    """Sample float image img[H,W,C] at fractional coords (vectorised)."""
    H, W = img.shape[:2]
    x0 = np.clip(np.floor(xx).astype(int), 0, W - 2); y0 = np.clip(np.floor(yy).astype(int), 0, H - 2)
    fx = np.clip(xx - x0, 0, 1)[..., None]; fy = np.clip(yy - y0, 0, 1)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

def build(soda, spec, src, alpha, H_s, S_s, V_s, geo):
    y0, y1, cap_bottom, liquid_top = geo["y0"], geo["y1"], geo["cap_bottom"], geo["liquid_top"]
    Hh, Ww = alpha.shape
    out = src.copy()
    A = alpha > 0.5
    ys = np.arange(Hh)[:, None]

    # ---- 1. liquid: per-row span of saturated pixels below the liquid line
    red = A & (S_s > 0.30) & (ys >= liquid_top)
    liquid = np.zeros_like(A)
    rows = np.where(red.any(1))[0]
    for y in rows:
        xs = np.where(red[y])[0]; liquid[y, xs.min():xs.max() + 1] = True
    liquid &= A
    lm = feather(liquid, 5)
    tgt = hex_rgb(spec.get("liquid", spec["rgb"])); th, ts, tv = rgb_to_hsv(tgt[None, None, :]); th, ts, tv = float(th), float(ts), float(tv)
    v_ref = np.percentile(V_s[liquid], 92); s_ref = np.median(S_s[liquid])
    t = np.clip(V_s / v_ref, 0, 1.15); sf = np.clip(S_s / s_ref, 0, 1.3)
    ns = np.clip(ts * sf ** spec["gs"], 0, 1); nv = np.clip(tv * t ** spec["gv"], 0, 1)
    nh = np.full_like(ns, th)
    recol = hsv_to_rgb(nh, ns, nv)
    out = out * (1 - lm[..., None]) + recol * lm[..., None]
    # the glass rim beside the liquid carries a faint red cast: swap only its hue so no pink line survives
    rim = A & (ys >= liquid_top) & (lm < 0.99) & (S_s > 0.06)
    rimcol = hsv_to_rgb(np.full_like(S_s, th), S_s * 0.8, V_s)
    rw = rim.astype(np.float32) * (1 - lm)
    out = out * (1 - rw[..., None]) + rimcol * rw[..., None]

    # ---- 2. cap: plum from luminance, keep the crown's facets
    cap = A & (ys < cap_bottom)
    L = 0.2126 * src[..., 0] + 0.7152 * src[..., 1] + 0.0722 * src[..., 2]
    l_ref = np.percentile(L[cap], 90)
    capcol = PLUM[None, None, :] * np.clip(0.30 + 1.0 * (L / l_ref), 0, 1.6)[..., None]
    cm = feather(cap, 3)
    out = out * (1 - cm[..., None]) + np.clip(capcol, 0, 1) * cm[..., None]

    # ---- 3. label: cylinder-wrap the printed label onto the front, shaded by the glass
    label = np.asarray(Image.open(os.path.join(LBL, soda + ".png")).convert("RGB")).astype(np.float32) / 255
    Lh, Lw = label.shape[:2]
    by0, by1 = geo["label_y0"], geo["label_y1"]
    phi = np.arcsin(0.72)
    band = np.zeros((Hh, Ww), np.float32)
    paper = np.zeros_like(out)
    for y in range(by0, by1):
        xs = np.where(A[y])[0]
        if len(xs) == 0: continue
        xl, xr = xs.min(), xs.max(); cx = (xl + xr) / 2.0; R = (xr - xl) / 2.0
        half = R * np.sin(phi)
        xa = int(np.ceil(cx - half)); xb = int(np.floor(cx + half))
        xx = np.arange(xa, xb + 1)
        theta = np.arcsin(np.clip((xx - cx) / R, -1, 1))
        u = (theta / phi + 1) / 2
        lx = u * (Lw - 1); ly = np.full_like(lx, (y - by0) / (by1 - by0) * (Lh - 1))
        paper[y, xa:xb + 1] = bilinear(label, ly, lx)
        band[y, xa:xb + 1] = 1
    # paper edge: a hair darker inside the last 6px so it reads as a cut edge
    inner = feather(band > 0.5, 13)
    edge = np.clip((0.999 - inner) * 6, 0, 1) * (band > 0.5)
    # shading from the photograph itself
    vb = np.percentile(V_s[band > 0.5], 90)
    shade = np.clip(V_s / vb, 0, 1) ** 0.6
    shade = 0.58 + 0.42 * shade
    lit = paper * shade[..., None]
    spec = np.clip((V_s - 0.86) / 0.12, 0, 1) * np.clip(1 - S_s / 0.35, 0, 1)
    lit = lit * (1 - 0.45 * spec[..., None]) + 1.0 * 0.45 * spec[..., None]
    lit = lit * (1 - 0.10 * edge[..., None])
    bm = band * feather(band > 0.5, 3)
    bm = np.clip(bm, 0, 1)
    out = out * (1 - bm[..., None]) + lit * bm[..., None]
    return np.clip(out, 0, 1)

def save_webp(rgba, path, height):
    im = Image.fromarray((rgba * 255).round().astype(np.uint8), "RGBA")
    w = round(im.width * height / im.height)
    # premultiply before resizing so transparent pixels never bleed dark fringes
    arr = np.asarray(im).astype(np.float32); a = arr[..., 3:4] / 255
    pm = np.concatenate([arr[..., :3] * a, arr[..., 3:4]], -1)
    pm_im = Image.fromarray(pm.round().astype(np.uint8), "RGBA").resize((w, height), Image.LANCZOS)
    arr2 = np.asarray(pm_im).astype(np.float32); a2 = arr2[..., 3:4] / 255
    rgb = np.where(a2 > 0, arr2[..., :3] / np.maximum(a2, 1e-6), 0)
    final = Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), arr2[..., 3:4]], -1).round().astype(np.uint8))
    final.save(path, "WEBP", quality=88, method=6)
    return final.size

def main(only=None):
    im = Image.open(SRC).convert("RGBA")
    arr = np.asarray(im).astype(np.float32) / 255
    src, alpha = arr[..., :3], arr[..., 3]
    A = alpha > 0.5
    ys = np.where(A.any(1))[0]; y0, y1 = int(ys.min()), int(ys.max()); Hb = y1 - y0
    widths = np.array([np.ptp(np.where(A[y])[0]) if A[y].any() else 0 for y in range(y0, y0 + 400)])
    cap_bottom = y0 + int(np.argmax(widths[60:] < 0.92 * widths[60:].max())) + 60
    H_s, S_s, V_s = rgb_to_hsv(src)
    redhue = (H_s < 0.06) | (H_s > 0.90)
    red_rows = np.where((A & (S_s > 0.3) & redhue).sum(1) > 0.3 * np.maximum(A.sum(1), 1))[0]
    liquid_top = int(red_rows[red_rows > cap_bottom + 200].min())
    geo = dict(y0=y0, y1=y1, cap_bottom=cap_bottom, liquid_top=liquid_top,
               label_y0=y0 + int(0.47 * Hb), label_y1=y0 + int(0.64 * Hb))
    print("geometry", geo)
    xs = np.where(A.any(0))[0]; x0, x1 = int(xs.min()), int(xs.max())
    m = 60   # side/top margin; the base keeps 6 px so the bottle stands on the shelf line
    crop = (slice(max(0, y0 - m), min(alpha.shape[0], y1 + 6)), slice(max(0, x0 - m), min(alpha.shape[1], x1 + m)))
    os.makedirs(OUT, exist_ok=True)
    for soda, spec in SODAS.items():
        if only and soda not in only: continue
        rgb = build(soda, spec, src, alpha, H_s, S_s, V_s, geo)
        rgba = np.concatenate([rgb, alpha[..., None]], -1)[crop]
        for h in (1400, 800):
            size = save_webp(rgba, os.path.join(OUT, f"bottle-{soda}-{h}.webp"), h)
        print(soda, size)

if __name__ == "__main__":
    main(sys.argv[1:] or None)
