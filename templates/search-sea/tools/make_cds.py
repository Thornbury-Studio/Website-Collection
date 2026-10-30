"""Premium music-CD faces: full-print label + polycarbonate ring + hub."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops, ImageEnhance

OUT = Path(__file__).resolve().parents[1] / "img"
OUT.mkdir(exist_ok=True)
SIZE = 1200
CX = CY = SIZE // 2
R = 590
rng = random.Random(7)


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


def vignette(im, strength=0.45):
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.1, -h * 0.1, w * 1.1, h * 1.1), fill=int(255 * (1 - strength)))
    d.ellipse((w * 0.15, h * 0.15, w * 0.85, h * 0.85), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(80))
    dark = Image.new("RGB", (w, h), (8, 8, 8))
    return Image.composite(im, dark, mask)


def plate_ask():
    im = Image.new("RGB", (SIZE, SIZE), (6, 24, 28))
    d = ImageDraw.Draw(im)
    for y in range(SIZE):
        t = y / SIZE
        d.line((0, y, SIZE, y), fill=(6 + int(20 * t), 40 + int(55 * t), 48 + int(40 * t)))
    # soft figure / face-like light mass
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((280, 200, 980, 1050), fill=(140, 210, 220, 40))
    ImageDraw.Draw(glow).ellipse((420, 320, 820, 900), fill=(250, 250, 245, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(55))
    im = Image.alpha_composite(im.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(im)
    # abstract portrait stroke
    d.arc((360, 260, 860, 900), 200, 340, fill=(230, 240, 238), width=10)
    d.ellipse((560, 720, 640, 800), fill=(230, 240, 238))
    return vignette(im, 0.35)


def plate_define():
    im = Image.new("RGB", (SIZE, SIZE), (30, 28, 26))
    d = ImageDraw.Draw(im)
    for y in range(SIZE):
        t = y / SIZE
        d.line((0, y, SIZE, y), fill=(32 + int(8 * t), 30 + int(6 * t), 28 + int(4 * t)))
    # open book / paper
    d.polygon([(180, 260), (600, 220), (600, 980), (200, 940)], fill=(236, 230, 218))
    d.polygon([(600, 220), (1020, 270), (1000, 950), (600, 980)], fill=(245, 240, 230))
    for i in range(16):
        yy = 320 + i * 38
        d.line((240, yy - 10, 560, yy + 8), fill=(200, 192, 178), width=2)
        d.line((640, yy + 8, 960, yy - 6), fill=(205, 198, 185), width=2)
    d.rectangle((260, 340, 480, 390), fill=(25, 23, 20))
    return vignette(im, 0.4)


def plate_find():
    im = Image.new("RGB", (SIZE, SIZE), (210, 204, 194))
    d = ImageDraw.Draw(im)
    for y in range(SIZE):
        t = y / SIZE
        d.line((0, y, SIZE, y), fill=(215 - int(50 * t), 208 - int(45 * t), 196 - int(40 * t)))
    # topographic lines
    for i in range(18):
        y0 = 80 + i * 60
        pts = []
        for x in range(0, SIZE + 40, 40):
            pts.append((x, int(y0 + 28 * math.sin(x * 0.01 + i) + 18 * math.cos(i + x * 0.004))))
        d.line(pts, fill=(150, 144, 132), width=2)
    d.ellipse((420, 420, 780, 780), outline=(20, 90, 100), width=18)
    d.line((700, 700, 880, 900), fill=(20, 90, 100), width=18)
    return vignette(ImageEnhance.Contrast(im).enhance(1.05), 0.25)


def polycarb():
    """Iridescent data ring."""
    ring = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # prebuild rainbow
    strip = Image.new("RGB", (SIZE, 2), (0, 0, 0))
    sd = ImageDraw.Draw(strip)
    for x in range(SIZE):
        h = (x / SIZE + 0.15) % 1
        i = int(h * 6) % 6
        f = h * 6 - int(h * 6)
        q = 1 - f
        t = [(1, f, 0), (q, 1, 0), (0, 1, f), (0, q, 1), (f, 0, 1), (1, 0, q)][i]
        sd.point((x, 0), (int(t[0] * 255), int(t[1] * 255), int(t[2] * 255)))
    strip = strip.resize((SIZE, SIZE), Image.Resampling.BILINEAR).convert("RGBA")
    # rotate variation
    strip = strip.rotate(18, expand=False)
    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((CX - R, CY - R, CX + R, CY + R), fill=85)
    inner = int(R * 0.58)
    md.ellipse((CX - inner, CY - inner, CX + inner, CY + inner), fill=0)
    # soft edges
    mask = mask.filter(ImageFilter.GaussianBlur(1.5))
    strip.putalpha(mask)
    return strip


def make_disc(title, subtitle, plate_fn):
    base = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # aluminum rim
    ImageDraw.Draw(base).ellipse(
        (CX - R - 3, CY - R - 3, CX + R + 3, CY + R + 3), fill=(186, 182, 174, 255)
    )

    face = plate_fn().convert("RGBA")
    # quiet printed band
    band = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(band).rectangle((0, CY - 195, SIZE, CY - 125), fill=(0, 0, 0, 150))
    face = Image.alpha_composite(face, band)
    d = ImageDraw.Draw(face)
    d.text((CX, CY - 160), title.upper(), font=font(42), fill=(248, 245, 240), anchor="mm")
    d.text((CX, CY + 380), subtitle.upper(), font=font(26), fill=(248, 245, 240), anchor="mm")

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((CX - R + 5, CY - R + 5, CX + R - 5, CY + R - 5), fill=255)
    labeled = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    labeled.paste(face.convert("RGB"), (0, 0))
    labeled.putalpha(mask)
    out = Image.alpha_composite(base, labeled)
    out = Image.alpha_composite(out, polycarb())

    # hub
    hub = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hub)
    hd.ellipse((CX - 88, CY - 88, CX + 88, CY + 88), fill=(22, 20, 18, 255))
    hd.ellipse((CX - 58, CY - 58, CX + 58, CY + 58), fill=(48, 45, 42, 255))
    # stacking ring detail
    hd.ellipse((CX - 70, CY - 70, CX + 70, CY + 70), outline=(70, 66, 60, 200), width=2)
    out = Image.alpha_composite(out, hub)

    hole = Image.new("L", (SIZE, SIZE), 255)
    ImageDraw.Draw(hole).ellipse((CX - 28, CY - 28, CX + 28, CY + 28), fill=0)
    r, g, b, a = out.split()
    out = Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, hole)))

    # specular
    spec = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(spec).ellipse((CX - 380, CY - 420, CX + 60, CY - 40), fill=(255, 255, 255, 60))
    spec = spec.filter(ImageFilter.GaussianBlur(55))
    sm = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(sm).ellipse((CX - R + 5, CY - R + 5, CX + R - 5, CY + R - 5), fill=255)
    ImageDraw.Draw(sm).ellipse((CX - 28, CY - 28, CX + 28, CY + 28), fill=0)
    sr, sg, sb, sa = spec.split()
    spec = Image.merge("RGBA", (sr, sg, sb, ImageChops.multiply(sa, sm)))
    return Image.alpha_composite(out, spec)


ALBUMS = [
    ("ask", "Ask", "ChatGPT", plate_ask),
    ("define", "Define", "Wikipedia", plate_define),
    ("find", "Find", "Google", plate_find),
]


def main():
    for slug, title, sub, fn in ALBUMS:
        img = make_disc(title, sub, fn)
        img.save(OUT / f"cd-{slug}.webp", "WEBP", quality=93)
        img.resize((360, 360), Image.Resampling.LANCZOS).save(OUT / f"cd-{slug}-sm.webp", "WEBP", quality=90)
        print("wrote", slug)

    ask = Image.open(OUT / "cd-ask.webp").convert("RGBA")
    hub = Image.new("RGB", (960, 600), (228, 225, 218))
    cd = ask.resize((480, 480), Image.Resampling.LANCZOS).rotate(-12, expand=True, resample=Image.BICUBIC)
    hub.paste(cd, (430, 40), cd)
    # song list hint
    d = ImageDraw.Draw(hub)
    d.rectangle((48, 200, 360, 520), fill=(240, 237, 231), outline=(183, 178, 169))
    d.text((70, 220), "01  Ask", font=font(28), fill=(23, 21, 18))
    d.text((70, 300), "02  Define", font=font(28), fill=(110, 106, 100))
    d.text((70, 380), "03  Find", font=font(28), fill=(110, 106, 100))
    d.text((56, 48), "SEA", font=font(96), fill=(23, 21, 18))
    hub.save(OUT / "hub-thumb.webp", "WEBP", quality=90)

    og = Image.new("RGB", (1200, 630), (228, 225, 218))
    cd2 = ask.resize((560, 560), Image.Resampling.LANCZOS).rotate(8, expand=True, resample=Image.BICUBIC)
    og.paste(cd2, (580, 20), cd2)
    od = ImageDraw.Draw(og)
    od.text((72, 180), "SEA", font=font(130), fill=(23, 21, 18))
    od.text((76, 350), "One search box. Three destinations.", font=font(34), fill=(80, 76, 70))
    og.save(OUT / "og.jpg", "JPEG", quality=92)
    print("done")


if __name__ == "__main__":
    main()
