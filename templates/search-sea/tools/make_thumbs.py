from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parents[1] / "img"


def disc(draw, cx, cy, r, fill, rim):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rim)
    draw.ellipse((cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6), fill=fill)
    hole = int(r * 0.14)
    draw.ellipse(
        (cx - hole * 2, cy - hole * 2, cx + hole * 2, cy + hole * 2),
        fill=(23, 21, 18),
    )
    draw.ellipse((cx - hole, cy - hole, cx + hole, cy + hole), fill=(234, 231, 225))


def main():
    w, h = 960, 600
    im = Image.new("RGB", (w, h), (216, 212, 204))
    d = ImageDraw.Draw(im)
    d.rectangle((520, 70, 900, 530), fill=(234, 231, 225), outline=(184, 179, 169))
    for y in (140, 250, 360):
        d.line((560, y + 40, 870, y + 40), fill=(184, 179, 169), width=1)
    disc(d, 620, 160, 34, (26, 95, 106), (197, 192, 182))
    disc(d, 620, 270, 28, (35, 33, 30), (197, 192, 182))
    disc(d, 620, 380, 28, (200, 196, 188), (168, 163, 154))

    big = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    bd = ImageDraw.Draw(big)
    disc(bd, 160, 160, 150, (26, 95, 106), (197, 192, 182))
    big = big.rotate(16, expand=True, resample=Image.BICUBIC)
    im.paste(big, (40, 120), big)

    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 120)
        small = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
        small = font
    d.text((56, 48), "SEA", font=font, fill=(23, 21, 18))
    d.text((60, 520), "One search box. Three destinations.", font=small, fill=(106, 102, 96))
    im.save(out / "hub-thumb.webp", "WEBP", quality=88)

    og = Image.new("RGB", (1200, 630), (216, 212, 204))
    od = ImageDraw.Draw(og)
    big2 = Image.new("RGBA", (420, 420), (0, 0, 0, 0))
    bd2 = ImageDraw.Draw(big2)
    disc(bd2, 210, 210, 195, (26, 95, 106), (197, 192, 182))
    big2 = big2.rotate(-12, expand=True, resample=Image.BICUBIC)
    og.paste(big2, (680, 80), big2)
    try:
        f1 = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 160)
        f2 = ImageFont.truetype(r"C:\Windows\Fonts\georgia.ttf", 44)
        f3 = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 28)
    except OSError:
        f1 = f2 = f3 = ImageFont.load_default()
    od.text((72, 150), "SEA", font=f1, fill=(23, 21, 18))
    od.text((76, 340), "Search Engine Adapter", font=f2, fill=(23, 21, 18))
    od.text((76, 420), "One box. Google · ChatGPT · Wikipedia.", font=f3, fill=(106, 102, 96))
    og.save(out / "og.jpg", "JPEG", quality=90)
    print("ok", out / "hub-thumb.webp", out / "og.jpg")


if __name__ == "__main__":
    main()
