#!/usr/bin/env bash
# The films page: one six-second, muted preview per film, under the same
# grade as the edit, plus one poster still each (tools/stills.py converts).
#   key        clip       creator                 in    len
#   garden     34506429   Alexander Mass          0.6   6.0   (same wedding as the edit, unused shot)
#   dusk       28830717   Bruno Goes              0.4   6.0
#   forehead   31139763   anandu mohan mr         0.0   5.3
#   chapel     37690789   Alexander Mass          1.0   6.0
#   temple     34125402   Agung Pandit Wiguna     0.0   5.6
# usage: RAW=<folder of masters> bash tools/previews.sh
set -euo pipefail
cd "$(dirname "$0")/.."
RAW="${RAW:?set RAW to the folder holding the Pexels masters}"
WORK="${WORK:-$RAW/../work}"; mkdir -p "$WORK"
GRADE="eq=brightness=-0.025:contrast=1.05:saturation=0.9:gamma=0.97,colorbalance=rs=0.025:bs=-0.02:rh=0.01:bh=-0.015"

KEYS=(garden dusk forehead chapel temple)
IDS=(34506429 28830717 31139763 37690789 34125402)
INS=(0.6 0.4 0.0 1.0 0.0)
LENS=(6.0 6.0 5.3 6.0 5.6)

for i in "${!KEYS[@]}"; do
  ffmpeg -v error -y -ss "${INS[$i]}" -t "${LENS[$i]}" -i "$RAW/${IDS[$i]}.mp4" \
    -vf "fps=24,scale=960:540:flags=lanczos:force_original_aspect_ratio=increase,crop=960:540,$GRADE,format=yuv420p" \
    -an -c:v libx264 -profile:v high -preset slow -crf 27 -maxrate 1500k -bufsize 3000k -g 48 \
    -movflags +faststart "video/film-${KEYS[$i]}.mp4"
  t=$(awk "BEGIN{print ${INS[$i]} + ${LENS[$i]}*0.45}")
  ffmpeg -v error -y -ss "$t" -i "$RAW/${IDS[$i]}.mp4" -frames:v 1 \
    -vf "scale=1920:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1920:1080,$GRADE" "$WORK/film-${KEYS[$i]}.png"
done
echo previews-done
