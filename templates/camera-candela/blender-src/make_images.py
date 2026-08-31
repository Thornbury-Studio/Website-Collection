# CANDELA — derive the static imagery from the transparent hero render.
# The inline fallback keeps its alpha so it sits on the page exactly as the
# live canvas does; the og card gets the same frame composited onto the
# site's ground colour, because social platforms do not honour alpha.
# Run:  python blender-src/make_images.py     (from the template folder)
from PIL import Image
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INK = (11, 12, 14)

src = Image.open(os.path.join(BASE, "renders", "hero-alpha.png")).convert("RGBA")
os.makedirs(os.path.join(BASE, "img"), exist_ok=True)

def resized(w):
    return src.resize((w, int(w * src.height / src.width)), Image.LANCZOS)

# inline fallback — alpha preserved
resized(1400).save(os.path.join(BASE, "img", "candela-hero.webp"), "WEBP", quality=88, method=6)
resized(760).save(os.path.join(BASE, "img", "candela-hero-sm.webp"), "WEBP", quality=86, method=6)

# og card — 1200x630 centre crop, flattened onto the page ground
target_ar = 1200 / 630
w, h = src.size
if w / h > target_ar:
    nw = int(h * target_ar)
    box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
else:
    nh = int(w / target_ar)
    box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
card = Image.new("RGB", (1200, 630), INK)
crop = src.crop(box).resize((1200, 630), Image.LANCZOS)
card.paste(crop, (0, 0), crop)
card.save(os.path.join(BASE, "img", "og.jpg"), "JPEG", quality=88, optimize=True)

for f in ("candela-hero.webp", "candela-hero-sm.webp", "og.jpg"):
    p = os.path.join(BASE, "img", f)
    print(f, round(os.path.getsize(p) / 1024), "KB")
