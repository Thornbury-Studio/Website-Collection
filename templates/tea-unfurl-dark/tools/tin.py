"""UNFURL. — print the label round the tin.

    node tools/label.mjs && python tools/tin.py

Source: Adobe Stock 368133712 (a blank brushed-tin canister with a slip lid, on
white), cut out with Adobe Photoshop's background removal -> tools/raw/tin_cutout.png.
The label (tools/raw/label.png, 3890 x 1000, the front 150 degrees of the band)
is wrapped round the measured cylinder: body x 667-3629 (centre 2148, r 1481),
and the camera sits a little above, so a ring on the body draws as an ellipse
that sags 98 px at the front. The paper is lit by the tin's own light (its
luminance, blurred past the brush marks), turned away at the sides by a Lambert
term, and the metal is brought down for a dark set.
Output: img/tin.webp (1800 w), img/tin-900.webp, img/tin-og.png (for the OG card).
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
IMG = os.path.join(ROOT, 'img')

CX, R, SAG = 2148.0, 1481.0, 98.0
BAND_TOP_FRONT = 1540.0          # y of the band's top edge at the front of the tin
HALF_ARC = np.radians(75)         # label.png spans -75..+75 degrees
GROUND = np.array([11, 13, 11], np.float32) / 255


def bilinear(tex, u, v):
    h, w = tex.shape[:2]
    u = np.clip(u, 0, w - 1.001); v = np.clip(v, 0, h - 1.001)
    x0 = np.floor(u).astype(int); y0 = np.floor(v).astype(int)
    fx = (u - x0)[..., None]; fy = (v - y0)[..., None]
    a = tex[y0, x0]; b = tex[y0, x0 + 1]; c = tex[y0 + 1, x0]; d = tex[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def main():
    tin = Image.open(os.path.join(RAW, 'tin_cutout.png')).convert('RGBA')
    t = np.asarray(tin).astype(np.float32) / 255
    rgb, alpha = t[..., :3], t[..., 3:4]
    H, W = alpha.shape[:2]

    lab = np.asarray(Image.open(os.path.join(RAW, 'label.png')).convert('RGB')).astype(np.float32) / 255
    th, tw = lab.shape[:2]
    # pad the texture sideways with its own edge column (plain band + rules), so
    # the band carries on round the tin past +-75 degrees
    pad = 1400
    lab = np.concatenate([np.repeat(lab[:, :1], pad, 1), lab, np.repeat(lab[:, -1:], pad, 1)], 1)

    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    s = np.clip((xs - CX) / R, -0.9999, 0.9999)
    theta = np.arcsin(s)
    cos = np.cos(theta)
    top = BAND_TOP_FRONT - SAG + SAG * cos
    v = ys - top
    u = pad + tw / 2 + theta / HALF_ARC * (tw / 2)
    inband = (v >= 0) & (v <= th - 1) & (np.abs(xs - CX) < R - 1) & (alpha[..., 0] > 0.5)
    # soft 1.2 px edge on the band so it prints, not pastes
    edge = np.clip(np.minimum(v + 0.6, th - 1 - v + 0.6) / 1.2, 0, 1) * inband

    paper = bilinear(lab, u, v)

    # the tin's own light, past the brush marks
    lum = (rgb * [0.2126, 0.7152, 0.0722]).sum(2)
    body = (ys > 1450) & (ys < 2600) & (np.abs(xs - CX) < R - 20)
    med = np.median(lum[body])
    blur = np.asarray(Image.fromarray((np.clip(lum, 0, 1) * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(60))).astype(np.float32) / 255
    light = np.clip(blur / med, 0.45, 1.6)
    lambert = 0.3 + 0.7 * np.clip(cos, 0, 1) ** 0.8
    shade = (0.52 + 0.62 * light) * lambert
    sheen = 0.05 * np.clip(light - 1.0, 0, 1)
    printed = np.clip(paper * shade[..., None] + sheen[..., None], 0, 1)

    # metal down for a dark set, highlights kept
    metal = np.clip(rgb, 0, 1) ** 1.12 * 0.6
    out = metal * (1 - edge[..., None]) + printed * edge[..., None]

    # onto the ground, with a contact shadow under the base
    canvas = np.ones((H, W, 3), np.float32) * GROUND
    sh = Image.new('L', (W, H), 0)
    shy, shx = 2800, CX
    yy, xx = np.mgrid[0:H, 0:W]
    ell = (((xx - shx) / 1600.0) ** 2 + ((yy - shy) / 120.0) ** 2) < 1
    sh = Image.fromarray((ell * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(45))
    shadow = np.asarray(sh).astype(np.float32)[..., None] / 255 * 0.9
    canvas = canvas * (1 - shadow) + np.array([2, 2, 1], np.float32) / 255 * shadow
    comp = canvas * (1 - alpha) + out * alpha

    img = Image.fromarray((np.clip(comp, 0, 1) * 255 + 0.5).astype(np.uint8))
    img = img.crop((380, 560, 3920, 3100))           # 3540 x 2540
    img.resize((1800, round(1800 * img.height / img.width)), Image.LANCZOS).save(
        os.path.join(IMG, 'tin.webp'), quality=80, method=6)
    img.resize((900, round(900 * img.height / img.width)), Image.LANCZOS).save(
        os.path.join(IMG, 'tin-900.webp'), quality=78, method=6)
    img.resize((1400, round(1400 * img.height / img.width)), Image.LANCZOS).save(
        os.path.join(RAW, 'tin-og.png'))
    print('tin', img.size)


if __name__ == '__main__':
    main()
