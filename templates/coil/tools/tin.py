"""The COIL tin: a printed paper label wrapped onto one licensed photograph of a
plain brushed-steel tea tin (Adobe Stock 368133712, see IMAGE-CREDITS.md).

No generation, no hand-drawn tin: the tin, its rims, its brushed metal and its
light are the photograph. Only the paper band is ours.

  1. tools/label.html is rendered flat by headless Chrome at 2x (4200 x 1080).
  2. Each row of the tin body is a cylinder of radius R about cx (measured from
     the silhouette), so screen x maps to angle theta = asin((x - cx) / R) and
     the label column is u = theta / 160 deg + 0.5 (the label spans +-80 deg).
  3. Paper is lit by a broad key from front-left (the same side the steel is
     brightest), falls off toward the silhouette, and takes a little of the
     metal's own light so it sits in the same room.
  4. The white sweep is multiplied into the page ground, and a soft contact
     shadow is laid under the base.

Run from templates/coil/:  python tools/tin.py   (re-render the label first if
the harvest on it changes:  see DESIGN.md, "Do's and Don'ts").
"""
import os
import subprocess
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
SHOTS = os.path.join(HERE, "shots")
OUT = os.path.join(HERE, "..", "img")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
GROUND = np.array([0xF4, 0xF4, 0xEF], np.float32) / 255.0

BAND = (1432, 2492)       # label rows on the tin body (full-res source)
SPAN = np.radians(80.0)    # label half-angle


def render_label():
    os.makedirs(SHOTS, exist_ok=True)
    out = os.path.join(SHOTS, "label.png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--allow-file-access-from-files", "--force-device-scale-factor=2",
                    "--window-size=2100,540", f"--screenshot={out}",
                    "file:///" + os.path.join(HERE, "label.html").replace("\\", "/")],
                   check=True, capture_output=True)
    return np.asarray(Image.open(out).convert("RGB")).astype(np.float32) / 255.0


def bilinear(img, u, v):
    h, w = img.shape[:2]
    u = np.clip(u, 0, w - 1.001)
    v = np.clip(v, 0, h - 1.001)
    x0, y0 = np.floor(u).astype(int), np.floor(v).astype(int)
    fx, fy = (u - x0)[..., None], (v - y0)[..., None]
    a, b = img[y0, x0], img[y0, x0 + 1]
    c, d = img[y0 + 1, x0], img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def grain(shape, sigma, seed):
    rng = np.random.default_rng(seed)
    n = rng.normal(0.0, 1.0, shape[:2]).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 32) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)
    return (n - 128) / 32 * sigma


def main():
    label = render_label()
    # paper, not a screen: a faint fibre texture and ink that has sat into it a little
    label = np.asarray(Image.fromarray((label * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.0
    label = np.clip(label * (1 + grain(label.shape, 0.022, 7))[..., None], 0, 1)
    lh, lw = label.shape[:2]
    tin = np.asarray(Image.open(os.path.join(RAW, "a-tin-368133712.jpg")).convert("RGB")).astype(np.float32) / 255.0
    h, w = tin.shape[:2]
    lum = tin @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    mask = lum < 0.94

    # the steel's broad light along x, averaged over the body and blurred
    y0, y1 = BAND
    metal = lum[y0:y1].mean(0)
    k = np.exp(-0.5 * (np.arange(-240, 241) / 80.0) ** 2)
    metal = np.convolve(metal, k / k.sum(), mode="same")

    out = tin.copy()
    for y in range(y0, y1):
        xs = np.where(mask[y])[0]
        xl, xr = xs.min() + 3, xs.max() - 3
        cx, r = (xl + xr) / 2.0, (xr - xl) / 2.0
        x = np.arange(xl, xr + 1)
        s = np.clip((x - cx) / r, -0.9995, 0.9995)
        th = np.arcsin(s)
        u = (th / (2 * SPAN) + 0.5) * (lw - 1)
        v = np.full_like(u, (y - y0) / (y1 - y0 - 1) * (lh - 1))
        paper = bilinear(label, u, v)
        key = np.maximum(0.0, np.cos(th + np.radians(24)))        # key light from front-left
        fall = np.cos(th) ** 0.35                                  # rolls off at the silhouette
        m = metal[x] / metal[xl:xr].max()
        shade = (0.70 + 0.24 * key + 0.10 * m) * (0.82 + 0.18 * fall)
        # paper edge: a hairline of shadow at the top and bottom of the band
        t = min(y - y0, y1 - 1 - y)
        if t < 5:
            shade = shade * (0.86 + 0.028 * t)
        out[y, xl:xr + 1] = paper * shade[:, None]

    # the steel just under the label edge catches the paper's shadow
    for y in range(y1, y1 + 10):
        xs = np.where(mask[y])[0]
        out[y, xs.min():xs.max() + 1] *= 0.80 + 0.02 * (y - y1)

    # white sweep -> page ground, then a soft contact shadow under the base
    out = np.clip(out / 0.985, 0, 1)
    yy, xx = np.mgrid[0:h, 0:w]
    base_y, cxm, rx = 2735, 2150, 1640
    d = ((xx - cxm) / rx) ** 2 + ((yy - base_y) / 70.0) ** 2
    shadow = 1 - 0.40 * np.exp(-d * 2.6)
    out = out * np.where(mask[..., None], 1.0, shadow[..., None])
    # sensor grain on the tin only (the sweep has to stay flat or it shows as a box)
    out = out + (grain(out.shape, 0.012, 11) * mask)[..., None]
    out = np.clip(out, 0, 1) * GROUND

    im = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
    im = im.crop((380, 620, 3900, 2980))          # tin with air around it
    for width in (1400, 820):
        r = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        r = r.filter(ImageFilter.UnsharpMask(radius=0.6, percent=35, threshold=2))
        path = os.path.join(OUT, f"tin-{width}.webp")
        r.save(path, "WEBP", quality=84, method=6)
        print(path, r.size, os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    main()
