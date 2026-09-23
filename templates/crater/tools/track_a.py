"""Stabilise shot A (Pexels 36841913) by tracking the coffee bed itself.

vidstab locked onto the moving kettle spout and let the dripper wander ~300 px,
so this follows the one thing that should stay put: the bed of grounds. It is
the only region that is both dark and brown (the counter is grey, the V60 ribs
through the paper are bright), so its centroid per frame is a clean track.
The track is smoothed over ~1 s and a fixed-size square is cropped around it.

    python tools/track_a.py   ->  tools/shots/film/a-track.mp4 (1300x1300, 25 fps, 11.2 s)
"""
import os
import subprocess

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "raw", "pexels", "36841913.mp4")
OUT = os.path.join(HERE, "shots", "film", "a-track.mp4")
W, H = 3840, 2160
SW, SH = 480, 270           # tracking resolution
SIZE = 1300                 # crop square at full resolution
OFFSET = (90, 0)            # the pile sits left-heavy; nudge the frame so the bed reads centred
DUR, FPS = "11.2", "25"


def frames(w, h):
    cmd = ["ffmpeg", "-v", "error", "-t", DUR, "-i", SRC, "-vf", f"fps={FPS},scale={w}:{h}:flags=area",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    p.wait()


def track():
    pts = []
    for f in frames(SW, SH):
        a = f.astype(np.int16)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        lum = (r * 2126 + g * 7152 + b * 722) // 10000
        bed = (lum < 105) & (r - b > 18) & (r >= g)
        ys, xs = np.nonzero(bed)
        if len(xs) < 50:
            pts.append(pts[-1] if pts else (SW / 2, SH / 2))
        else:
            pts.append((xs.mean(), ys.mean()))
    return np.array(pts)


def smooth(p, k=13):
    pad = np.pad(p, ((k // 2, k // 2), (0, 0)), mode="edge")
    ker = np.ones(k) / k
    return np.stack([np.convolve(pad[:, i], ker, mode="valid") for i in range(2)], 1)


def main():
    raw = track()
    c = smooth(raw) * (W / SW)
    print(f"frames {len(c)}; centre x {c[:,0].min():.0f}-{c[:,0].max():.0f}, y {c[:,1].min():.0f}-{c[:,1].max():.0f}")
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SIZE}x{SIZE}",
                            "-r", FPS, "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "fast",
                            "-pix_fmt", "yuv420p", OUT], stdin=subprocess.PIPE)
    half = SIZE // 2
    for i, f in enumerate(frames(W, H)):
        cx, cy = c[min(i, len(c) - 1)] + np.array(OFFSET)
        x0 = int(round(min(max(cx - half, 0), W - SIZE)))
        y0 = int(round(min(max(cy - half, 0), H - SIZE)))
        enc.stdin.write(np.ascontiguousarray(f[y0:y0 + SIZE, x0:x0 + SIZE]).tobytes())
    enc.stdin.close()
    enc.wait()
    print("wrote", os.path.relpath(OUT, HERE))


if __name__ == "__main__":
    main()
