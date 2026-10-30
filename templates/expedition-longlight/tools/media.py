"""Fetch the licensed Unsplash originals into tools/raw/ (gitignored) and
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
# CROP: explicit ffmpeg crop (w:h:x:y on the 2400 px original) for a frame whose
# centre crop puts the subject under the card's caption band.
CROP = {'guide-3': '1800:2400:150:1200'}
MANIFEST = {
    'index-hero':        ('cqbLg3lZEpk', 'photo-1544198365-f5d60b6d8190', 'hero'),
    'card-lyngen':       ('-rBb2CyPek4', 'photo-1654025634438-9c57ba84d5b7', 'tall'),
    'card-dolomites':    ('ICSRhjP1UBU', 'photo-1681210994962-f1483b0b569d', 'tall'),
    'card-paine':        ('SFubVJcCgcQ', 'photo-1708394534994-4e66c2b09e1f', 'tall'),
    'home-journal-1':    ('wXTW8mycPCM', 'photo-1771387925496-138098427717', 'wide'),
    'home-journal-2':    ('EcZtopqM4zU', 'photo-1757481743165-854a6154ef72', 'wide'),
    'expeditions-hero':  ('aeg-rkpXc24', 'photo-1759776037670-8290e9bf0524', 'hero'),
    'route-lyngen':      ('LrHwwYXnR6Y', 'photo-1641369022944-ff17797243c7', 'wide'),
    'route-lofoten':     ('SgwJ1ue1lTU', 'photo-1641255161715-1a67d0257783', 'wide'),
    'route-altavia':     ('v-o7LGC2ivA', 'photo-1699388714044-dbf0e8c20537', 'wide'),
    'route-svaneti':     ('l4CWG2AP6Bc', 'photo-1738599683897-d449c2dbb76f', 'wide'),
    'route-paine':       ('Dw3APludDpE', 'photo-1586600822178-26dec0f653a9', 'wide'),
    'route-faroe':       ('azEPUeuTKhU', 'photo-1689924285338-3930bae2064c', 'wide'),
    'expedition-hero':   ('nX8OPOeV0YY', 'photo-1723835143596-623c49909018', 'hero'),
    'stage-1':           ('l3fkqYm1_5E', 'photo-1707572387604-9beccf2c1977', 'wide'),
    'stage-2':           ('tqPcU28uUW0', 'photo-1600326188356-2bb8bc64692f', 'wide'),
    'stage-3':           ('72ouJZo2U1A', 'photo-1790019853089-fd58be4ca631', 'wide'),
    'journal-hero':      ('62W6xShDsJE', 'photo-1733528346006-a47bc1648c76', 'hero'),
    'journal-1':         ('BmAv53N_puE', 'photo-1658408200654-5d5c313840df', 'wide'),
    'journal-2':         ('Pt5sWld1FiM', 'photo-1744309327981-c362f4be4878', 'wide'),
    'journal-3':         ('tzVgy5ZAStE', 'photo-1793284933270-791bd1ee16a5', 'wide'),
    'journal-4':         ('hSVKBqIPlDI', 'photo-1681798090108-9565fdd4e861', 'wide'),
    'about-hero':        ('BxtP30g-g3c', 'photo-1529954019823-3339d1623e43', 'hero'),
    'guide-1':           ('npHNLH_xLLI', 'photo-1659346031868-86f45634e4ee', 'tall'),
    'guide-2':           ('Mv3tk3-71JM', 'photo-1629185751266-7c283272ba15', 'tall'),
    'guide-3':           ('GzcI_rMNclY', 'photo-1482961667792-d164d3e7ab3d', 'tall'),
    'enquire-hero':      ('-Noa043YDX0', 'photo-1526475742373-fb7d3f1b4b55', 'hero'),
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
        vf = f'scale={w}:-2:flags=lanczos'
        if name in CROP:
            vf = f'crop={CROP[name]},' + vf
        elif aspect:  # centre crop to aspect first (portrait cards)
            vf = f"crop='min(iw,ih*{aspect})':'min(ih,iw/{aspect})'," + vf
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
