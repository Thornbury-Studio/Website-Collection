"""Album-style music CDs: photographic mood faces, small rim type, real hub."""
from pathlib import Path
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance

OUT = Path(__file__).resolve().parents[1] / "img"
OUT.mkdir(exist_ok=True)
SIZE = 1024
CX = CY = SIZE // 2
R = 498
rng = random.Random(42)


def font(size):
    for p in (
        r"C:\Windows\Fonts\georgia.ttf",
        r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def noise(w, h, scale=1.0):
    im = Image.new("L", (w, h))
    px = im.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = int(rng.randint(0, 255) * scale)
    return im.filter(ImageFilter.GaussianBlur(1.2))


def mood_plate(kind):
    """Painted photographic-ish plate (no stock photos)."""
    im = Image.new("RGB", (SIZE, SIZE), (20, 20, 20))
    d = ImageDraw.Draw(im)

    if kind == "ask":
        # deep teal night + soft window glow
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(8 + int(18 * t), 28 + int(40 * t), 36 + int(30 * t)))
        # glow orb
        glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((220, 180, 820, 780), fill=(90, 200, 210, 55))
        glow = glow.filter(ImageFilter.GaussianBlur(70))
        im = Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB")
        # faint question silhouette
        d = ImageDraw.Draw(im)
        d.arc((340, 280, 680, 720), 200, 100, fill=(230, 240, 240), width=18)
        d.ellipse((480, 700, 540, 760), fill=(230, 240, 240))
    elif kind == "define":
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(28 + int(10 * t), 26 + int(8 * t), 24 + int(6 * t)))
        # paper stack / book edge
        d.rectangle((180, 220, 840, 820), fill=(232, 226, 214))
        d.rectangle((200, 240, 820, 800), fill=(245, 240, 230))
        for i in range(14):
            yy = 280 + i * 36
            d.line((240, yy, 780, yy), fill=(200, 192, 180), width=2)
        d.rectangle((240, 300, 520, 340), fill=(40, 38, 34))
    elif kind == "find":
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(210 - int(40 * t), 205 - int(35 * t), 195 - int(30 * t)))
        # map-ish folds
        for i in range(8):
            x0 = rng.randint(40, 400)
            d.line((x0, 0, x0 + 180, SIZE), fill=(170, 164, 152), width=3)
        d.ellipse((360, 360, 660, 660), outline=(26, 95, 106), width=22)
        d.line((580, 600, 720, 760), fill=(26, 95, 106), width=22)
    elif kind == "compile":
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(22 + int(20 * t), 32 + int(30 * t), 48 + int(40 * t)))
        for i, line in enumerate(("{", "  map $q $dest;", "  ? -> chatgpt;", "}")):
            d.text((220, 320 + i * 70), line, font=font(36), fill=(180, 200, 220))
    elif kind == "endpoint":
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(60 + int(20 * t), 22 + int(10 * t), 28 + int(8 * t)))
        d.ellipse((300, 300, 720, 720), outline=(240, 220, 220), width=16)
        d.ellipse((440, 440, 580, 580), fill=(240, 220, 220))
    else:  # map
        for y in range(SIZE):
            t = y / SIZE
            d.line((0, y, SIZE, y), fill=(18 + int(20 * t), 40 + int(35 * t), 28 + int(22 * t)))
        pts = [(160, 700), (300, 420), (480, 560), (640, 300), (820, 480)]
        d.line(pts, fill=(160, 210, 180), width=8)
        for p in pts:
            d.ellipse((p[0] - 12, p[1] - 12, p[0] + 12, p[1] + 12), fill=(230, 240, 230))

    # film grain
    g = noise(SIZE, SIZE, 0.35).convert("RGB")
    im = Image.blend(im, g, 0.08)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    return im


def sheen_ring():
    strip = Image.new("RGB", (SIZE, 4), (0, 0, 0))
    sd = ImageDraw.Draw(strip)
    for x in range(SIZE):
        h = x / SIZE
        i = int(h * 6) % 6
        f = h * 6 - int(h * 6)
        q = 1 - f
        table = [(1, f, 0), (q, 1, 0), (0, 1, f), (0, q, 1), (f, 0, 1), (1, 0, q)]
        r, g, b = table[i]
        sd.point((x, 0), (int(r * 255), int(g * 255), int(b * 255)))
    strip = strip.resize((SIZE, SIZE), Image.Resampling.BILINEAR).convert("RGBA")
    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((CX - R, CY - R, CX + R, CY + R), fill=70)
    md.ellipse((CX - int(R * 0.52), CY - int(R * 0.52), CX + int(R * 0.52), CY + int(R * 0.52)), fill=0)
    strip.putalpha(mask)
    return strip


def make_disc(title, brand, kind):
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse((CX - R - 2, CY - R - 2, CX + R + 2, CY + R + 2), fill=(188, 184, 176, 255))

    face = mood_plate(kind).convert("RGBA")
    # quiet title — small, top arc band, not dominating
    band = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(band).rectangle((0, CY - 210, SIZE, CY - 150), fill=(0, 0, 0, 140))
    face = Image.alpha_composite(face, band)
    d = ImageDraw.Draw(face)
    d.text((CX, CY - 180), f"{title}  ·  {brand}", font=font(28), fill=(245, 242, 236), anchor="mm")

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((CX - R + 6, CY - R + 6, CX + R - 6, CY + R - 6), fill=255)
    labeled = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    labeled.paste(face.convert("RGB"), (0, 0))
    labeled.putalpha(mask)
    im = Image.alpha_composite(im, labeled)
    im = Image.alpha_composite(im, sheen_ring())

    hub = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hub)
    hd.ellipse((CX - 78, CY - 78, CX + 78, CY + 78), fill=(30, 28, 26, 255))
    hd.ellipse((CX - 52, CY - 52, CX + 52, CY + 52), fill=(55, 52, 48, 255))
    im = Image.alpha_composite(im, hub)

    hole = Image.new("L", (SIZE, SIZE), 255)
    ImageDraw.Draw(hole).ellipse((CX - 26, CY - 26, CX + 26, CY + 26), fill=0)
    r, g, b, a = im.split()
    im = Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, hole)))

    spec = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(spec).ellipse((CX - 320, CY - 360, CX + 40, CY - 20), fill=(255, 255, 255, 55))
    spec = spec.filter(ImageFilter.GaussianBlur(48))
    sm = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(sm).ellipse((CX - R + 6, CY - R + 6, CX + R - 6, CY + R - 6), fill=255)
    ImageDraw.Draw(sm).ellipse((CX - 26, CY - 26, CX + 26, CY + 26), fill=0)
    sr, sg, sb, sa = spec.split()
    spec = Image.merge("RGBA", (sr, sg, sb, ImageChops.multiply(sa, sm)))
    return Image.alpha_composite(im, spec)


ALBUMS = [
    ("ask", "Ask", "SEA", "ask"),
    ("define", "Define", "SEA", "define"),
    ("find", "Find", "SEA", "find"),
    ("compile", "Compile", "SEA", "compile"),
    ("endpoint", "Endpoint", "SEA", "endpoint"),
    ("map", "Map", "SEA", "map"),
]


def main():
    for slug, title, brand, kind in ALBUMS:
        img = make_disc(title, brand, kind)
        img.save(OUT / f"cd-{slug}.webp", "WEBP", quality=92)
        img.resize((320, 320), Image.Resampling.LANCZOS).save(OUT / f"cd-{slug}-sm.webp", "WEBP", quality=88)
        print("wrote", slug)

    ask = Image.open(OUT / "cd-ask.webp").convert("RGBA")
    hub = Image.new("RGB", (960, 600), (228, 225, 218))
    cd = ask.resize((460, 460), Image.Resampling.LANCZOS).rotate(-14, expand=True, resample=Image.BICUBIC)
    hub.paste(cd, (450, 50), cd)
    d = ImageDraw.Draw(hub)
    d.text((56, 90), "SEA", font=font(120), fill=(23, 21, 18))
    d.text((60, 240), "One search box. Routes by how you ask.", font=font(28), fill=(80, 76, 70))
    hub.save(OUT / "hub-thumb.webp", "WEBP", quality=88)

    og = Image.new("RGB", (1200, 630), (228, 225, 218))
    cd2 = ask.resize((560, 560), Image.Resampling.LANCZOS).rotate(10, expand=True, resample=Image.BICUBIC)
    og.paste(cd2, (580, 10), cd2)
    od = ImageDraw.Draw(og)
    od.text((72, 190), "SEA", font=font(140), fill=(23, 21, 18))
    od.text((76, 370), "One search box. Three destinations.", font=font(32), fill=(80, 76, 70))
    og.save(OUT / "og.jpg", "JPEG", quality=90)
    print("done")


if __name__ == "__main__":
    main()
