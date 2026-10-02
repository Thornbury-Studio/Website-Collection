"""Score every visible text element against the brightest 5% of the film behind it.
    python tools/contrast.py tools/shots/<label>/contrast-<kind>
WCAG AA: 4.5:1 for body text, 3:1 for large text (>= 24px, or >= 18.66px bold)."""
import json, re, sys, pathlib
from PIL import Image

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def lum(rgb):
    r, g, b = rgb[:3]
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

d = pathlib.Path(sys.argv[1])
rows, fails = [], []
for stop in json.loads((d / 'items.json').read_text()):
    im = Image.open(d / stop['file']).convert('RGB')
    sx = im.width / max(1, max(i['box'][2] for i in stop['items']) if stop['items'] else im.width)
    for it in stop['items']:
        x0, y0, x1, y1 = [int(round(v)) for v in it['box']]
        if x1 - x0 < 2 or y1 - y0 < 2: continue
        reg = im.crop((x0, y0, x1, y1))
        reg.thumbnail((120, 120))
        ls = sorted(lum(p) for p in reg.getdata())
        bg = ls[min(len(ls) - 1, int(len(ls) * 0.95))]
        rgb = [int(v) for v in re.findall(r'[\d.]+', it['color'])[:3]]
        fg = lum(rgb)
        cr = (max(fg, bg) + 0.05) / (min(fg, bg) + 0.05)
        large = it['size'] >= 24 or (it['size'] >= 18.66 and it['weight'] >= 700)
        need = 3.0 if large else 4.5
        row = (stop['f'], it['tag'], it['text'][:34], round(it['size']), round(cr, 1), need)
        rows.append(row)
        if cr < need: fails.append(row)
worst = sorted(rows, key=lambda r: r[4] - r[5])[:8]
print('checked', len(rows), 'text boxes;', len(fails), 'below AA')
for r in (fails or worst): print('  ', r)
