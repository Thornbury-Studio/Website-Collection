#!/usr/bin/env bash
# The pour for the "Cold" section: Adobe Stock 605543896 (4K ProRes, 32 s slow motion) →
# the pour at 2x (1–27 s → 13 s) followed by the settled fizz at 1x (27–31.6 s), then the
# last 1.2 s dissolved into the first so the loop point reads as "again", not a cut.
# 3:2 crop, graded like the stills, H.264 at two widths, poster from the first frame.
# Run from templates/kiam:  bash tools/encode-video.sh
set -e
SRC=assets/raw/605543896.mov
GRADE="crop=3240:2160:300:0,eq=contrast=1.04:saturation=0.95"
for W in 1600 1000; do
  ffmpeg -v error -y -i "$SRC" -filter_complex \
    "[0:v]trim=1:27,setpts=(PTS-STARTPTS)/2,${GRADE},scale=${W}:-2,fps=25[pour];
     [0:v]trim=27:31.6,setpts=PTS-STARTPTS,${GRADE},scale=${W}:-2,fps=25[fizz];
     [pour][fizz]concat=n=2:v=1:a=0,split[x][y];
     [y]trim=16.4:17.6,setpts=PTS-STARTPTS[tail];
     [x]trim=0:16.4,setpts=PTS-STARTPTS[body];
     [tail][body]xfade=transition=fade:duration=1.2:offset=0[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -tune film \
    assets/video/pour-${W}.mp4
done
ffmpeg -v error -y -i assets/video/pour-1600.mp4 -frames:v 1 -q:v 3 assets/video/pour-poster.jpg
ffmpeg -v error -y -i assets/video/pour-1600.mp4 -frames:v 1 -c:v libwebp -quality 82 assets/video/pour-poster.webp
ls -la assets/video | awk '{print $5, $9}'
