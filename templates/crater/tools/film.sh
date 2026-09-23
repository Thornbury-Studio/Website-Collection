#!/usr/bin/env bash
# CRATER bloom film: three licensed Pexels clips cut into one 45.0 s square film.
#   A 36841913  top-down V60: dry bed, the pour, the swell      0.0 - 10.6 s
#   B 4098417   macro: bubbles breaking through the crust      10.0 - 30.6 s
#   C 9423395   top-down: the bed settles, the foam thins      30.0 - 45.0 s
# 0.6 s dissolves at 10.0 and 30.0, which are also the phase boundaries the
# page's clock and ruler use (js/site.js PHASES). Every second plays at 1x.
#
# usage: bash tools/film.sh test   graded single frames only (tools/shots/film/)
#        bash tools/film.sh full   stabilise, encode video/bloom-{1080,720}.mp4
# Masters live in tools/raw/pexels/ (gitignored); fetch them with
#   curl -L -o tools/raw/pexels/<id>.mp4 https://www.pexels.com/download/video/<id>/
set -euo pipefail
cd "$(dirname "$0")"
RAW="raw/pexels"; OUT="shots/film"; mkdir -p "$OUT"
A="$RAW/36841913.mp4"; B="$RAW/4098417.mp4"; C="$RAW/9423395.mp4"

# one grade for all three, applied after each clip's own correction
GRADE="eq=contrast=1.04:brightness=0.012:saturation=0.92,colorbalance=rs=0.03:gs=0.0:bs=-0.03:rm=0.03:bm=-0.02"
# per-clip corrections: A tames the coral V60 ribs, B turns a magenta-lit macro
# back into coffee brown, C warms a cold steel-filter shot
FIX_A="colorbalance=rh=-0.04:bh=0.02,eq=gamma=1.04,hue=s=0.84"
FIX_B="hue=h=24:s=0.62,eq=gamma=0.96:contrast=1.06,colorbalance=rm=0.02:gm=0.03:bm=-0.05"
FIX_C="eq=gamma=1.02:saturation=1.25,colorbalance=rs=0.05:gs=0.02:bs=-0.06:rm=0.05:gm=0.01:bm=-0.05"

CROP_A="crop=1300:1300:1405:315"
CROP_B="crop=2160:2160:840:0"
CROP_C="crop=2160:2160:648:0"

if [ "${1:-test}" = "test" ]; then
  ffmpeg -v error -y -ss 0.2 -i "$A" -frames:v 1 -vf "$CROP_A,scale=720:720:flags=lanczos,$FIX_A,$GRADE" "$OUT/t-a0.png"
  ffmpeg -v error -y -ss 8   -i "$B" -frames:v 1 -vf "$CROP_B,scale=720:720:flags=lanczos,$FIX_B,$GRADE" "$OUT/t-b8.png"
  ffmpeg -v error -y -ss 10  -i "$C" -frames:v 1 -vf "$CROP_C,scale=720:720:flags=lanczos,$FIX_C,$GRADE" "$OUT/t-c10.png"
  echo test-done; exit 0
fi

# 1. stabilise A by tracking the bed of grounds (tools/track_a.py). vidstab
#    was tried first and locked onto the moving kettle spout instead.
#    CROP_A above is only the framing for the single test frame.
python track_a.py

# 2. cut, grade and dissolve into one master
ffmpeg -v error -y -i "$OUT/a-track.mp4" -i "$B" -i "$C" -filter_complex "\
[0:v]trim=0:10.6,setpts=PTS-STARTPTS,scale=1440:1440:flags=lanczos,fps=25,$FIX_A,$GRADE,format=yuv420p[a];\
[1:v]trim=0.8:21.4,setpts=PTS-STARTPTS,$CROP_B,scale=1440:1440:flags=lanczos,fps=25,$FIX_B,$GRADE,format=yuv420p[b];\
[2:v]trim=2:17,setpts=PTS-STARTPTS,$CROP_C,scale=1440:1440:flags=lanczos,fps=25,$FIX_C,$GRADE,format=yuv420p[c];\
[a][b]xfade=transition=fade:duration=0.6:offset=10.0[ab];\
[ab][c]xfade=transition=fade:duration=0.6:offset=30.0,trim=0:45,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -crf 10 -preset medium -pix_fmt yuv420p "$OUT/master.mp4"

# 3. web encodes. H.264 only: one mp4 beats webm+mp4 on high-entropy texture.
#    Verify at 1:1 against the master before shipping (crop a bubble frame).
ffmpeg -v error -y -i "$OUT/master.mp4" -vf "scale=1080:1080:flags=lanczos,cas=0.5" -an -c:v libx264 -profile:v high \
  -crf 23 -maxrate 2600k -bufsize 5200k -preset slow -pix_fmt yuv420p -movflags +faststart ../video/bloom-1080.mp4
ffmpeg -v error -y -i "$OUT/master.mp4" -vf "scale=720:720:flags=lanczos,cas=0.4" -an -c:v libx264 -profile:v high \
  -crf 25 -maxrate 1300k -bufsize 2600k -preset slow -pix_fmt yuv420p -movflags +faststart ../video/bloom-720.mp4

# 4. stills for posters and the reduced-motion fallback; tools/grade.py turns
#    them into img/bloom-*.webp
for t in 0 5 20 40; do
  ffmpeg -v error -y -ss $t -i "$OUT/master.mp4" -frames:v 1 -vf "scale=1080:1080:flags=lanczos" "$OUT/poster-$t.png"
done
echo full-done
