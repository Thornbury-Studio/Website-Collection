"""REDLINE. — derive every served picture and film from the licensed masters.

    python tools/media.py            # everything
    python tools/media.py stills     # photographs only
    python tools/media.py films      # loops only
    python tools/media.py fan        # the stage frame sequence only

Masters live in tools/raw/ (gitignored; ids and licences in IMAGE-CREDITS.md):
    v-<pexels id>.mp4   Pexels 4K video, 3840x2160
    p-<pexels id>.jpg   Pexels photograph, full resolution

One grade for everything, so photographs from different photographers read
as one set: blacks sunk onto the page ground (#09090a), blues and cyans
pulled down so the rigs' own red light carries the colour, a little grain.
Nothing is generated; crops only remove other makers' marks and
third-party artwork on monitors (see IMAGE-CREDITS.md for each one).
"""
import os, subprocess, sys, json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
IMG = os.path.join(ROOT, 'img')
FILM = os.path.join(ROOT, 'film')
GROUND = np.array([9, 9, 10], np.float32) / 255.0

# name: (source, crop box as fractions x0,y0,x1,y1, widths)
STILLS = {
    'card':      ('p-34552809.jpg', (0.00, 0.00, 1.00, 1.00), (1800, 900)),
    'card-side': ('p-34552811.jpg', (0.22, 0.00, 1.00, 1.00), (1600, 900)),   # "RTX" wordmark cropped out, left
    'chips':     ('p-36169774.jpg', (0.00, 0.00, 1.00, 1.00), (1600, 900)),
    'fins':      ('p-6704966.jpg',  (0.00, 0.10, 1.00, 0.80), (1000, 700)),
    'red-fan':   ('p-2643596.jpg',  (0.00, 0.00, 0.72, 1.00), (1600, 900)),   # memory-module labels cropped out, right
    'blades':    ('p-6636472.jpg',  (0.00, 0.00, 1.00, 1.00), (1600, 900)),
    'sink':      ('p-3520696.jpg',  (0.15, 0.00, 0.85, 1.00), (1600, 900)),
    'stripes':   ('p-2100918.jpg',  (0.00, 0.00, 1.00, 1.00), (1600, 900), 2.2),   # lilac highlights: graded harder
    'service':   ('p-31854230.jpg', (0.00, 0.10, 1.00, 0.90), (1000, 700), 1.0, 0.5),   # daylight shot: taken down and half-desaturated to sit in the set
    'trace':     ('p-3520679.jpg',  (0.05, 0.05, 0.95, 0.95), (1600, 900)),
    'gold':      ('p-37005283.jpg', (0.00, 0.00, 1.00, 1.00), (1600, 900)),
}

# name: (source, crop px x,y,w,h on the 3840x2160 master, out w,h, start s, length s)
FILMS = {
    'rig':   ('v-30470985.mp4', (1382, 0, 2380, 1338),   (1920, 1080), 0.0, 9.3),   # monitor artwork cropped out, left
    'air':   ('v-30470981.mp4', (1459, 0, 2380, 1338),   (1920, 1080), 1.0, 12.0),
    'tower': ('v-30470983.mp4', (2112, 0, 1728, 972),    (1600, 900),  0.5, 12.0),  # tower only
    'mesh':  ('v-13549718.mp4', (0, 0, 3840, 2160),      (1920, 1080), 4.0, 12.0, 'redmono'),  # an RGB fan behind an intake mesh; its colour cycle taken to one red
    'boot':  ('v-3108007.mp4',  (1100, 1200, 2740, 960), (1920, 672),  2.0, 16.0, 'cold'),  # POST display; board model silkscreen cropped out, top
}

FAN = ('v-856084.mp4', 1.40, 2.40, 4.40)   # dark until ~1.6 s, lit and spinning from ~2.3 s


def grade(a, strength=1.0, grain=0.018, seed=0):
    """a: float32 HxWx3, 0..1."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    # blue/cyan cast out: where blue leads red, pull chroma toward luminance
    cool = np.clip(np.clip((b - r) * 2.2, 0, 1) * 0.55 * strength, 0, 1)[..., None]
    a = a * (1 - cool) + lum[..., None] * cool
    # sink blacks onto the page ground, a touch of contrast
    a = np.clip((a - 0.03) / 0.97, 0, 1) ** 1.08
    shadow = np.clip(1 - lum * 5, 0, 1)[..., None]
    a = a * (1 - 0.6 * shadow) + GROUND * 0.6 * shadow
    if grain:
        rng = np.random.default_rng(seed)
        a = a + rng.normal(0, grain, a.shape[:2])[..., None].astype(np.float32)
    return np.clip(a, 0, 1)


def stills():
    os.makedirs(IMG, exist_ok=True)
    for i, (name, spec) in enumerate(STILLS.items()):
        src, box, widths = spec[:3]
        strength = spec[3] if len(spec) > 3 else 1.0
        night = spec[4] if len(spec) > 4 else 0.0
        im = Image.open(os.path.join(RAW, src)).convert('RGB')
        W, H = im.size
        im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
        big = widths[0]
        im = im.resize((big, round(im.size[1] * big / im.size[0])), Image.LANCZOS)
        a = np.asarray(im, np.float32) / 255.0
        if night:   # darker and less saturated, before the shared grade
            lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
            a = (a * (1 - night) + lum * night) * (1 - 0.45 * night)
        a = grade(a, strength=strength, seed=i)
        out = Image.fromarray((a * 255 + 0.5).astype(np.uint8))
        out.save(os.path.join(IMG, name + '.webp'), quality=80, method=6)
        small = out.resize((widths[1], round(out.size[1] * widths[1] / out.size[0])), Image.LANCZOS)
        small.save(os.path.join(IMG, name + '-%d.webp' % widths[1]), quality=78, method=6)
        print('still', name, out.size, small.size)


def ffmpeg(*args):
    subprocess.check_call(['ffmpeg', '-loglevel', 'error', '-y'] + list(args))


# the same grade as grade(), in ffmpeg terms, for the films
FILM_GRADE = ('huesaturation=hue=0:saturation=-0.55:colors=b+c:strength=1,'
              'eq=contrast=1.1:brightness=-0.035:saturation=1.02,'
              'curves=all=0/0 0.08/0.03 0.5/0.47 1/1,'
              'noise=alls=5:allf=t')


def films():
    os.makedirs(FILM, exist_ok=True)
    for name, spec in FILMS.items():
        src, (x, y, w, h), (ow, oh), t0, dur = spec[:5]
        # the boot clip is lit blue end to end: take it almost to monochrome,
        # which leaves the red POST digits as the only colour in it
        g = FILM_GRADE.replace('saturation=-0.55:colors=b+c', 'saturation=-0.92:colors=b+c+m') if spec[5:] == ('cold',) else FILM_GRADE
        if spec[5:] == ('redmono',):
            g = ('format=gbrp,hue=s=0,colorchannelmixer=rr=1.05:gg=0.2:bb=0.09,'
                 'eq=contrast=1.25:brightness=-0.05,noise=alls=4:allf=t')
        path = os.path.join(RAW, src)
        fade = 1.0
        # seamless loop: the last second dissolves into the first
        vf = ('[0:v]trim=start={t0}:duration={d},setpts=PTS-STARTPTS,crop={w}:{h}:{x}:{y},scale={ow}:{oh}:flags=lanczos,setsar=1,{g},format=yuv420p,split[a][b];'
              '[a]trim=start={f}:duration={body},setpts=PTS-STARTPTS[main];'
              '[b]trim=start=0:duration={f},setpts=PTS-STARTPTS[head];'
              '[main][head]xfade=transition=fade:duration={f}:offset={off}[v]').format(
            t0=t0, d=dur, w=w, h=h, x=x, y=y, ow=ow, oh=oh, g=g, f=fade,
            body=dur - fade, off=dur - 2 * fade)
        out = os.path.join(FILM, name + '.mp4')
        ffmpeg('-i', path, '-filter_complex', vf, '-map', '[v]', '-an', '-c:v', 'libx264',
               '-preset', 'slow', '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
               '-movflags', '+faststart', out)
        small = os.path.join(FILM, name + '-s.mp4')
        ffmpeg('-i', out, '-vf', 'scale=%d:-2:flags=lanczos' % (ow // 2), '-an', '-c:v', 'libx264',
               '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', small)
        ffmpeg('-ss', '0.2', '-i', out, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78',
               os.path.join(FILM, name + '-poster.webp'))
        print('film', name, os.path.getsize(out) // 1024, 'KB', os.path.getsize(small) // 1024, 'KB')


def fan():
    """The stage: one fan, off and dark, powering up to lit and spinning.

    Frames 0..W-1 are the power-up (indexed by fan speed 0..start RPM);
    frames W.. are the lit fan turning (cycled at a rate set by RPM).
    """
    src, a, b, c = FAN
    path = os.path.join(RAW, src)
    tmp = os.path.join(ROOT, 'tools', 'shots', 'fan-tmp')
    os.makedirs(tmp, exist_ok=True)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    # square crop centred on the hub (the fan's hub sits at x≈1860 of 3840x2160; it overfills the height)
    ffmpeg('-ss', str(a), '-i', path, '-t', str(c - a),
           # the fan's LED segments are yellow-green in the master: turned 22° toward
           # orange so the lit fan stays in the one colour family (red → amber)
           '-vf', 'crop=2160:2160:780:0,scale=1000:1000:flags=lanczos,' + FILM_GRADE.replace(',noise=alls=5:allf=t', '') +
           ',huesaturation=hue=-22:saturation=-0.05:colors=y+g',
           os.path.join(tmp, '%03d.png'))
    frames = sorted(os.listdir(tmp))
    fps = 25
    wake = int(round((b - a) * fps))
    out = {}
    for size, q in (('l', 74), ('s', 72)):
        d = os.path.join(FILM, 'fan', size)
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            os.remove(os.path.join(d, f))
        px = 1000 if size == 'l' else 560
        for i, f in enumerate(frames):
            im = Image.open(os.path.join(tmp, f)).convert('RGB')
            if px != 1000:
                im = im.resize((px, px), Image.LANCZOS)
            im.save(os.path.join(d, '%03d.webp' % i), quality=q, method=6)
        out[size] = px
    # mean brightness per frame: the stage maps fan speed onto the frames
    # where the light actually comes up, not onto identical dark ones
    lum = [round(float(np.asarray(Image.open(os.path.join(tmp, f)).convert('L'), np.float32).mean()) / 255, 3)
           for f in frames]
    dark = max(i for i in range(wake) if lum[i] <= lum[0] * 1.15)
    meta = {'count': len(frames), 'dark': dark, 'wake': wake, 'fps': fps, 'sizes': out, 'lum': lum}
    with open(os.path.join(ROOT, 'js', 'fan-data.js'), 'w', newline='\n') as fh:
        fh.write('/* generated by tools/media.py — do not edit */\n')
        fh.write('globalThis.FAN = ' + json.dumps(meta) + ';\n')
    print('fan', meta)


if __name__ == '__main__':
    what = sys.argv[1:] or ['stills', 'films', 'fan']
    if 'stills' in what: stills()
    if 'films' in what: films()
    if 'fan' in what: fan()
