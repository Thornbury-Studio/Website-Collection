"""Re-derive every served film and still from the two masters in tools/raw/.

    python tools/media.py            # film sequences + stills

Masters (gitignored, see IMAGE-CREDITS.md):
  raw/descent-master.mp4   Kling 3.0, 3852x2152, 24 fps, 193 frames: a tilt UP from the lodge
  raw/keyframe-master.png  Nano Banana Pro, 2752x1536: the lodge, the frame the clip starts on
  raw/{table,room,sauna}-master.png  Nano Banana Pro, 2752x1536, keyframe as reference: the inside

The site plays the clip REVERSED, so scroll position 0 is the sky and 1 is the lodge.

The film is served as an image sequence, not a video: every second frame of the
reversed clip, 97 frames, film/l/ (1600x894) and film/s/ (720x1280, the 9:16 cut
centred on the lodge). js/main.js draws them on a canvas, blending neighbours.
A scrubbed <video> has to seek on every scroll frame, which waits on the browser's
decoder and on the file having arrived; on a busy laptop that is what stuttered
(DESIGN.md section 7).
"""
import subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
RAW = HERE / "raw"
MASTER = RAW / "descent-master.mp4"
KEY = RAW / "keyframe-master.png"
FILM = ROOT / "film"
IMG = ROOT / "img"

# The lodge sits at x = 0.59 of the frame; the portrait cut is centred on it.
LODGE_X = 0.59
SRC_W, SRC_H = 3852, 2152
PORTRAIT_W = round(SRC_H * 9 / 16 / 2) * 2          # 1210
PORTRAIT_X = round(SRC_W * LODGE_X - PORTRAIT_W / 2)  # 1668

# One grade for everything: a touch darker in the shadows so type sits on the sky,
# highlights (window light, aurora core) left alone.
GRADE = "eq=gamma=0.94:saturation=1.04"


def run(args):
    print(" ".join(str(a) for a in args))
    subprocess.run([str(a) for a in args], check=True)


FRAMES = 97      # every second frame of the 193
QUALITY = 72    # WebP; 70 starts to lose the faint stars, 80 adds ~25% for no visible gain


def sequence(folder, vf):
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob("*.webp"):
        old.unlink()
    run(["ffmpeg", "-v", "error", "-y", "-i", MASTER,
         "-vf", rf"reverse,select=not(mod(n\,2)),{vf},{GRADE}", "-fps_mode", "vfr",
         "-c:v", "libwebp", "-quality", QUALITY, "-compression_level", 6, "-start_number", 0,
         folder / "%03d.webp"])
    n = len(list(folder.glob("*.webp")))
    assert n == FRAMES, f"{folder}: {n} frames, expected {FRAMES}"


def still(out, vf, frame_from_end=None, src=None, q=82):
    if src is not None:
        run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"{vf},{GRADE}", "-frames:v", 1, "-q:v", q, out])
        return
    # reversed clip: frame 0 of the site = last frame of the master
    run(["ffmpeg", "-v", "error", "-y", "-i", MASTER, "-vf",
         f"reverse,select=eq(n\\,{frame_from_end}),{vf},{GRADE}", "-frames:v", 1, "-q:v", q, out])


def main():
    FILM.mkdir(exist_ok=True)
    IMG.mkdir(exist_ok=True)
    wide = "scale=1920:-2:flags=lanczos"
    tall = f"crop={PORTRAIT_W}:{SRC_H}:{PORTRAIT_X}:0,scale=720:1280:flags=lanczos"

    sequence(FILM / "l", "scale=1600:-2:flags=lanczos")
    sequence(FILM / "s", tall)

    # Posters: sky (scroll 0), ridge (scroll ~0.5), lodge (scroll 1). Same frames
    # the film shows at those points, so the no-video state tells the same story.
    for name, n in (("sky", 0), ("ridge", 96), ("lodge", 192)):
        still(FILM / f"{name}.webp", wide, n)
        still(FILM / f"{name}-s.webp", tall, n)

    # Inside the lodge: three Nano Banana Pro stills made with the keyframe as the
    # reference (IMAGE-CREDITS.md), so the larch, the windows and the light match the
    # outside. Same grade as the film; phones get a 9:16 cut centred on the subject.
    for name, cx in (("table", 0.5), ("room", 0.6), ("sauna", 0.68)):
        src = RAW / f"{name}-master.png"
        still(IMG / f"{name}.webp", "scale=1920:-2:flags=lanczos", src=src)
        still(IMG / f"{name}-s.webp", rf"crop=ih*9/16:ih:max(0\,min(iw-ih*9/16\,iw*{cx}-ih*9/32)):0,scale=720:1280:flags=lanczos", src=src)

    # Open Graph card: the keyframe itself, 1200x630.
    run(["ffmpeg", "-v", "error", "-y", "-i", KEY, "-vf",
         f"crop=2752:1445:0:60,scale=1200:630:flags=lanczos,{GRADE}", "-frames:v", 1, "-q:v", 3, IMG / "og.jpg"])


if __name__ == "__main__":
    main()
