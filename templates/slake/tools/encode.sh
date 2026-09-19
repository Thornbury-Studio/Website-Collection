#!/usr/bin/env bash
# Regenerates every web asset from the licensed masters in assets/raw/.
# Masters are gitignored; run this after replacing one. Needs ffmpeg + python/Pillow.
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=assets/raw; V=assets/video; I=assets/img
mkdir -p "$V" "$I"

# --- coals: build a seamless 12.4 s loop (tail cross-dissolves into head) ---
# body = 0.98–12.4 s, seam = xfade(tail 12.4–13.38 → head 0–0.98). Loop point is invisible.
LOOP='[0:v]trim=0.98:12.4,setpts=PTS-STARTPTS[body];[0:v]trim=12.4:13.38,setpts=PTS-STARTPTS[tail];[0:v]trim=0:0.98,setpts=PTS-STARTPTS[head];[tail][head]xfade=transition=fade:duration=0.98:offset=0[seam];[body][seam]concat=n=2:v=1:a=0,format=yuv420p[out]'
ffmpeg -v error -y -i "$RAW/coals-319007648.mov" -filter_complex "$LOOP" -map "[out]" -an \
  -c:v libx264 -preset medium -crf 22 -maxrate 14M -bufsize 28M -g 60 -movflags +faststart "$V/coals-2160.mp4"
ffmpeg -v error -y -i "$V/coals-2160.mp4" -an -vf "scale=1920:-2" \
  -c:v libx264 -preset medium -crf 23 -maxrate 5M -bufsize 10M -g 60 -movflags +faststart "$V/coals-1080.mp4"
ffmpeg -v error -y -i "$V/coals-2160.mp4" -an \
  -c:v libsvtav1 -preset 6 -crf 34 -g 60 -svtav1-params tune=0 -movflags +faststart "$V/coals-2160.av1.mp4"

# --- pour: plays once and holds; keep the full 13.5 s ---
ffmpeg -v error -y -i "$RAW/pour-588669103.mov" -an -vf format=yuv420p \
  -c:v libx264 -preset medium -crf 21 -maxrate 14M -bufsize 28M -g 60 -movflags +faststart "$V/pour-2160.mp4"
ffmpeg -v error -y -i "$V/pour-2160.mp4" -an -vf "scale=1920:-2" \
  -c:v libx264 -preset medium -crf 23 -maxrate 5M -bufsize 10M -g 60 -movflags +faststart "$V/pour-1080.mp4"
ffmpeg -v error -y -i "$V/pour-2160.mp4" -an \
  -c:v libsvtav1 -preset 6 -crf 32 -g 60 -svtav1-params tune=0 -movflags +faststart "$V/pour-2160.av1.mp4"

# --- posters (the coals poster is the LCP image; keep it light) ---
ffmpeg -v error -y -ss 0 -i "$V/coals-2160.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 4 "$I/coals-poster.jpg"
ffmpeg -v error -y -ss 0 -i "$V/coals-2160.mp4" -frames:v 1 -vf "scale=1920:-2" -c:v libwebp -quality 78 "$I/coals-poster.webp"
ffmpeg -v error -y -ss 9.5 -i "$V/pour-2160.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 4 "$I/pour-poster.jpg"
ffmpeg -v error -y -ss 9.5 -i "$V/pour-2160.mp4" -frames:v 1 -vf "scale=1920:-2" -c:v libwebp -quality 78 "$I/pour-poster.webp"

# --- people photos: 1400w + 800w, JPEG + WebP ---
python - <<'PY'
from PIL import Image, ImageOps
import glob, os
for src in glob.glob('assets/raw/*.jpg'):
    name = os.path.basename(src).rsplit('-', 1)[0]
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    for w in (1400, 800):
        r = im.copy(); r.thumbnail((w, w * 10), Image.LANCZOS)
        r.save(f'assets/img/{name}-{w}.jpg', quality=80, optimize=True, progressive=True)
        r.save(f'assets/img/{name}-{w}.webp', quality=78, method=6)
    print(name, im.size)
PY
ls -la "$V" "$I"
