"""Fetch the licensed Unsplash originals (HOLLIN) into tools/raw/ (gitignored) and
re-derive every served file under img/ with ffmpeg (WebP + AVIF, two widths).

    python tools/media.py            # fetch what is missing, encode everything
    python tools/media.py index-hero # one entry only

The manifest below is the source of truth for CREDITS.md: id, CDN path,
role, and how the frame is cropped. Nothing here is generated."""
import os, sys, subprocess, urllib.request, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw'); IMG = os.path.join(HERE, '..', 'img')
os.makedirs(RAW, exist_ok=True); os.makedirs(IMG, exist_ok=True)

# name: (unsplash id, cdn path, kind)   kind: hero | wide | tall
# CROP: explicit ffmpeg crop (w:h:x:y on the 2400 px original) where a centre
# crop would lose the subject.
# rounds-hero / rounds-hot: cropped so the heater maker's mark (on the heater and on the stone basket) is out of frame.
# visit-hero: the portrait original cut to a 3:2 band around the lamps, so the page's OG image is landscape.
CROP = {'rounds-hero': '2400:1350:0:760', 'rounds-hot': '2400:1900:0:700', 'visit-hero': '2400:1600:0:900'}
# QADJ: quality offsets for frames whose fine texture (condensation beads) balloons the file.
QADJ = {'home-turn': (-14, 8)}
# PRE: a light blur on that same frame; at display size the beads stay sharp enough and the file drops ~4x.
PRE = {'home-turn': 'gblur=sigma=1.6'}
MANIFEST = {
    # Home: one photograph per stage of the ritual, plus the street outside
    'home-heat':      ('6eTBDTexZpM', 'photo-1741601274134-fa98352f1c95', 'wide'),
    'home-turn':      ('SW8sKEBvbts', 'photo-1522841147685-ec3230fd52f9', 'wide'),
    'home-cold':      ('0fN21zv8yYo', 'photo-1548236339-55676e0726e0', 'wide'),
    'home-street':    ('Jh8vI2ubVgg', 'photo-1676363707718-eabe464ca9ae', 'hero'),
    # The Rounds
    'rounds-hero':    ('XSpVeZvDg_w', 'photo-1741601273168-04934064889f', 'hero'),
    'rounds-hot':     ('tYVKTELSptU', 'photo-1749561532113-80b8e0f918bd', 'wide'),
    'rounds-cold':    ('U9NE20ql_io', 'photo-1734117928667-c7f943a27e80', 'wide'),
    'rounds-rest':    ('Yr27GeesjZU', 'photo-1757940556610-a114be4733bf', 'wide'),
    # Sessions & prices
    'sessions-hero':  ('IXHVsu6n5vA', 'photo-1757940661240-f2e8d2ff93bf', 'hero'),
    'sessions-room':  ('DeYbNYGucjk', 'photo-1717356495389-6ab1e5ff9d84', 'wide'),
    # Visit
    'visit-hero':     ('OpkZfKoYHFE', 'photo-1609650793481-55b352ac866a', 'hero'),
    'visit-towel':    ('yCWXIm26SFA', 'photo-1761621711779-faf78317babd', 'tall'),
    # Guest book
    'guestbook-hero': ('zBS1TDsPwIw', 'photo-1780639732395-806e12f2d907', 'hero'),
}

# kind -> list of (suffix, width, crop aspect or None, webp q, avif crf)
SIZES = {
    'hero': [('1920', 1920, None, 72, 34), ('1080', 1080, None, 74, 32)],
    'wide': [('1400', 1400, None, 76, 32), ('800', 800, None, 78, 30)],
    'tall': [('900', 900, 3 / 4, 78, 30), ('600', 600, 3 / 4, 80, 28)],
}

def fetch(name):
    _, path, _ = MANIFEST[name]
    out = os.path.join(RAW, name + '.jpg')
    if os.path.exists(out) and os.path.getsize(out) > 50_000: return out
    req = urllib.request.Request(f'https://images.unsplash.com/{path}?w=2400&q=90&fm=jpg&fit=max',
                                 headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=120) as r: open(out, 'wb').write(r.read())
    return out

def encode(name):
    src = fetch(name); kind = MANIFEST[name][2]
    for suffix, w, aspect, q, crf in SIZES[kind]:
        dq, dc = QADJ.get(name, (0, 0)); q += dq; crf += dc
        vf = f'scale={w}:-2:flags=lanczos'
        if name in CROP:
            vf = f'crop={CROP[name]},' + vf
        elif aspect:  # centre crop to aspect first (portrait cards)
            vf = f"crop='min(iw,ih*{aspect})':'min(ih,iw/{aspect})'," + vf
        if name in PRE: vf += ',' + PRE[name]
        base = os.path.join(IMG, f'{name}-{suffix}')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-c:v', 'libwebp',
                        '-quality', str(q), '-compression_level', '6', base + '.webp'], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-c:v', 'libaom-av1',
                        '-still-picture', '1', '-crf', str(crf), '-cpu-used', '6', '-pix_fmt', 'yuv420p',
                        base + '.avif'], check=True)
    sizes = {f: os.path.getsize(os.path.join(IMG, f)) // 1024 for f in os.listdir(IMG) if f.startswith(name + '-')}
    print(name, sizes, flush=True)

if __name__ == '__main__':
    names = sys.argv[1:] or list(MANIFEST)
    with cf.ThreadPoolExecutor(6) as ex: list(ex.map(fetch, names))
    with cf.ThreadPoolExecutor(4) as ex: list(ex.map(encode, names))
