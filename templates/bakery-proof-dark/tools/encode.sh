#!/usr/bin/env bash
# PROOF.: cuts and grades the licensed Pexels masters into the video ladder.
#   usage: RAW=<folder of masters> bash tools/encode.sh [name ...]
#   WORK (default $RAW/../work) receives the poster frames.
#   masters are saved as <pexels id>.mp4 and are never committed (see IMAGE-CREDITS.md).
# One grade for every clip (a touch of warmth, a touch more contrast); the
# rolling-pin clip is near-monochrome in the original so it also gets a warm
# split-tone to sit beside the others.
set -euo pipefail
cd "$(dirname "$0")/.."
RAW="${RAW:?set RAW to the folder holding the Pexels masters}"
WORK="${WORK:-$RAW/../work}"; mkdir -p video img "$WORK"
G_BASE="eq=contrast=1.04:saturation=0.96:brightness=-0.01,colorbalance=rs=0.02:bs=-0.02:rh=0.01:bh=-0.01"
G_MONO="eq=contrast=1.06:saturation=1.0:brightness=-0.02,colorbalance=rs=0.07:gs=0.02:bs=-0.06:rm=0.06:gm=0.025:bm=-0.05:rh=0.03:bh=-0.03"

# name  pexels-id  in   len  fps  rungs        grade
CLIPS=(
 "mix      7405924  3.0  9.0  24 2160,1080,720 BASE"
 "knead    7405930  2.0  9.0  24 2160,1080,720 BASE"
 "roll     8626678  1.0  10.0 25 2160,1080,720 MONO"
 "oven     7405932  3.0  12.0 24 2160,1080,720 BASE"
 "rack     7405923  0.3  9.0  24 2160,1080,720 BASE"
 "flour    7405921  2.0  6.0  24 1080,720      BASE"
 "baguette 7405936  0.5  7.0  24 1080,720      BASE"
 "tray     30596349 0.0  4.3  25 1080,720      BASE"
 "display  3119255  2.0  10.0 25 2160,1080,720 BASE"
 "espresso 6769788  3.0  9.0  24 1080,720      BASE"
)
want=("$@")
for row in "${CLIPS[@]}"; do
  read -r name id ss len fps rungs grade <<<"$row"
  if [ ${#want[@]} -gt 0 ] && [[ ! " ${want[*]} " =~ " $name " ]]; then continue; fi
  G="$G_BASE"; [ "$grade" = MONO ] && G="$G_MONO"
  for r in ${rungs//,/ }; do
    case $r in 2160) W=3840; CRF=28;; 1080) W=1920; CRF=26;; 720) W=1280; CRF=28;; esac
    ffmpeg -v error -y -ss "$ss" -t "$len" -i "$RAW/$id.mp4" \
      -vf "fps=$fps,scale=$W:-2:flags=lanczos,$G,format=yuv420p" \
      -an -c:v libx264 -preset slow -crf $CRF -profile:v high -movflags +faststart \
      "video/$name-$r.mp4"
    echo "$name-$r $(stat -c %s video/$name-$r.mp4)"
  done
  # poster: the first frame, graded, same size as the 1080 rung
  ffmpeg -v error -y -ss "$ss" -i "$RAW/$id.mp4" -frames:v 1 -vf "scale=1920:-2:flags=lanczos,$G" "$WORK/poster-$name.png"
done
echo ENCODE-DONE
