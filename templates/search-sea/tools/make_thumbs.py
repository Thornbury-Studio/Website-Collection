from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "img"


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


def main():
    # hub
    im = Image.new("RGB", (960, 600), (232, 236, 240))
    d = ImageDraw.Draw(im)
    # soft signal glow
    for i in range(12):
        a = 18 - i
        d.ellipse((520 - i * 18, -40 - i * 10, 1100 + i * 10, 420 + i * 14), outline=(26, 166, 179))
    d.rounded_rectangle((420, 180, 900, 480), radius=8, fill=(247, 249, 250), outline=(197, 206, 212))
    d.rounded_rectangle((448, 250, 720, 318), radius=4, outline=(14, 26, 31), width=2)
    d.text((462, 268), "why is the sky blue?", font=font(26), fill=(90, 106, 114))
    d.rounded_rectangle((740, 250, 872, 318), radius=4, fill=(15, 107, 117))
    d.text((768, 272), "Route", font=font(24), fill=(255, 255, 255))
    d.rounded_rectangle((448, 350, 560, 390), radius=16, fill=(210, 230, 245))
    d.text((468, 358), "ChatGPT", font=font(20), fill=(30, 58, 110))
    d.text((48, 56), "SEA", font=font(110), fill=(14, 26, 31))
    d.text((56, 190), "One search box.", font=font(36), fill=(14, 26, 31))
    d.text((56, 240), "Three destinations.", font=font(36), fill=(14, 26, 31))
    im.save(OUT / "hub-thumb.webp", "WEBP", quality=90)

    og = Image.new("RGB", (1200, 630), (232, 236, 240))
    od = ImageDraw.Draw(og)
    od.text((72, 160), "SEA", font=font(140), fill=(14, 26, 31))
    od.text((80, 340), "One search box. Three destinations.", font=font(40), fill=(90, 106, 114))
    od.rounded_rectangle((80, 430, 420, 500), radius=4, fill=(15, 107, 117))
    od.text((120, 450), "Google · ChatGPT · Wikipedia", font=font(24), fill=(255, 255, 255))
    og.save(OUT / "og.jpg", "JPEG", quality=92)
    print("ok")


if __name__ == "__main__":
    main()
