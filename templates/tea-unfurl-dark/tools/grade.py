"""UNFURL. — one identical grade for every editorial still, plus the two loops.

    python tools/grade.py            # stills + loops
    python tools/grade.py stills     # stills only

Sources are cached in tools/raw/ (gitignored); IMAGE-CREDITS.md lists every one.
The grade: floor lifted to the page ground, highlights capped at the paper tone,
a gentle S-curve, saturation pulled to 0.86 (greens to 0.78, so the garden reads
as leaf, not lawn), and warm shadows — the colour of the roast.
"""
import os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
IMG = os.path.join(ROOT, 'img')

GROUND = np.array([11, 13, 11], np.float32) / 255
PAPER = np.array([239, 230, 215], np.float32) / 255

# name: (source, crop box as fractions l,t,r,b or None)
PLAN = {
    'fog':      ('p_fog.jpg', None),
    'pour':     ('p_pour.jpg', (0, 0.06, 1, 0.94)),
    'ridge':    ('p_ridge.jpg', None),
    'bush':     ('p_bush.jpg', None),
    'terraces': ('p_terraces.jpg', (0, 0.34, 1, 1)),   # the sky is cropped: its saturated blue broke the set
    'pick':     ('p_pick.jpg', None),
    'basket':   ('p_basket.jpg', None),
    'shade':    ('p_shade.jpg', None),
    'drum':     ('p_drum.jpg', None),
    'ball':     ('p_ball.jpg', None),
    'press':    ('p_press.jpg', None),
    'trays':    ('p_trays.jpg', None),
    'amber':    ('p_amber.jpg', None),
    'pitcher':  ('p_pitcher.jpg', None),
    'tray':     ('p_tray.jpg', None),
    'cup':      ('p_cup.jpg', None),
    'scoop':    ('f_scoop.png', (0.3385, 0.3426, 0.7031, 1.0)),   # Pexels video 6540435 at 0.5 s
    'gaiwan':   ('f_gaiwan.png', (0.1875, 0.1111, 0.9375, 1.0)),  # the same clip at 10.2 s
    'wet':      ('f_wet2.png', None),  # Pexels video 5404501 at 3.3 s, amber-corrected first (see AMBER)
}
WIDTHS = (1600, 900)


def curve(x):
    # gentle S about 0.45
    return np.where(x < 0.45, 0.45 * (x / 0.45) ** 1.12, 1 - 0.55 * ((1 - x) / 0.55) ** 1.08)


def grade(a):
    lum = (a * [0.2126, 0.7152, 0.0722]).sum(axis=2, keepdims=True)
    # saturation: greener pixels lose more
    g_dom = np.clip((a[..., 1:2] - np.maximum(a[..., 0:1], a[..., 2:3])) * 4, 0, 1)
    sat = 0.86 - 0.08 * g_dom
    a = lum + (a - lum) * sat
    a = curve(np.clip(a, 0, 1))
    # warm shadows
    shadow = np.clip(1 - lum * 2.2, 0, 1)
    a = a + shadow * np.array([0.018, 0.006, -0.012], np.float32)
    # floor to ground, ceiling to paper
    a = GROUND + np.clip(a, 0, 1) * (PAPER - GROUND)
    return np.clip(a, 0, 1)


# The one video frame shot under yellow light gets a colour correction to the
# amber of the stage before the house grade: green pulled down, red kept.
AMBER = {'wet': np.array([1.0, 0.84, 0.72], np.float32)}


def still(name, src, box):
    im = Image.open(os.path.join(RAW, src)).convert('RGB')
    if name in AMBER:
        im = Image.fromarray((np.clip(np.asarray(im).astype(np.float32) / 255 * AMBER[name], 0, 1) * 255 + .5).astype(np.uint8))
    if box:
        W, H = im.size
        im = im.crop((round(box[0] * W), round(box[1] * H), round(box[2] * W), round(box[3] * H)))
    a = grade(np.asarray(im).astype(np.float32) / 255)
    g = Image.fromarray((a * 255 + 0.5).astype(np.uint8))
    for w in WIDTHS:
        h = round(g.height * w / g.width)
        suffix = '' if w == WIDTHS[0] else '-%d' % w
        g.resize((w, h), Image.LANCZOS).save(os.path.join(IMG, name + suffix + '.webp'),
                                             quality=74 if w > 1000 else 72, method=6)
    print(name, g.size)


def ffmpeg(*args):
    subprocess.check_call(['ffmpeg', '-loglevel', 'error', '-y'] + list(args))


def loops():
    film = os.path.join(ROOT, 'film')
    os.makedirs(film, exist_ok=True)
    # Garden: fog over a tea slope, Alishan (Pixabay 125841). Seamless: the last
    # 1.5 s cross-dissolves into the first 1.5 s. Graded darker in the same spirit.
    src = os.path.join(RAW, 'px125841_fog.mp4')
    look = 'eq=contrast=1.06:brightness=-0.07:saturation=0.8,colorbalance=rs=0.03:bs=-0.03'
    ffmpeg('-i', src, '-filter_complex',
           '[0:v]trim=1.5:13.5,setpts=PTS-STARTPTS[a];'
           '[0:v]trim=0:1.5,setpts=PTS-STARTPTS[b];'
           '[a][b]xfade=transition=fade:duration=1.5:offset=10.5,' + look + ',scale=1600:-2[v]',
           '-map', '[v]', '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
           '-crf', '25', '-maxrate', '2.4M', '-bufsize', '4.8M', '-movflags', '+faststart',
           os.path.join(film, 'fog.mp4'))
    ffmpeg('-ss', '1.5', '-i', os.path.join(film, 'fog.mp4'), '-frames:v', '1',
           os.path.join(RAW, 'f_fogposter.png'))
    im = Image.open(os.path.join(RAW, 'f_fogposter.png')).convert('RGB')
    im.save(os.path.join(film, 'fog-poster.webp'), quality=72, method=6)
    print('fog loop', os.path.getsize(os.path.join(film, 'fog.mp4')))


def extract_wet():
    ffmpeg('-ss', '3.3', '-i', os.path.join(RAW, '5404501-uhd_3840_2160_30fps.mp4'),
           '-frames:v', '1', os.path.join(RAW, 'f_wet2.png'))
    ffmpeg('-ss', '0.5', '-i', os.path.join(RAW, '6540435.mp4'), '-frames:v', '1', os.path.join(RAW, 'f_scoop.png'))
    ffmpeg('-ss', '10.2', '-i', os.path.join(RAW, '6540435.mp4'), '-frames:v', '1', os.path.join(RAW, 'f_gaiwan.png'))


if __name__ == '__main__':
    os.makedirs(IMG, exist_ok=True)
    extract_wet()
    for name, (src, box) in PLAN.items():
        still(name, src, box)
    if len(sys.argv) < 2 or sys.argv[1] != 'stills':
        loops()
