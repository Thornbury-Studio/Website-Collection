#!/usr/bin/env bash
# Hujan Panas: cuts and grades the licensed Pexels masters into the video ladder.
#   usage: RAW=<folder of masters> bash tools/encode.sh [name ...]
#   WORK (default $RAW/../work) receives the poster frames (stills.py turns them into avif/webp).
#   Masters are saved as <pexels id>.mp4 and are never committed (see IMAGE-CREDITS.md).
# Rungs are named by the SHORT side of the frame, so a vertical clip's "1080" rung is 1080 x 1920.
set -euo pipefail
cd "$(dirname "$0")/.."
RAW="${RAW:?set RAW to the folder holding the Pexels masters}"
WORK="${WORK:-$RAW/../work}"; mkdir -p video "$WORK"
G_WARM="eq=contrast=1.05:saturation=1.02:brightness=-0.02,colorbalance=rs=0.03:bs=-0.03:rh=0.02:bh=-0.02"
G_RAIN="eq=contrast=1.06:saturation=0.92:brightness=-0.03,colorbalance=rs=-0.01:gs=0.01:bs=0.02"
G_NONE="eq=contrast=1.03:saturation=1.0:brightness=-0.01"

# name     pexels-id  in   len   fps  orient rungs           grade
CLIPS=(
 "sun      33894516  0.5  8.0   30   L      2160,1080,720   WARM"
 "leaves   4926166   0.0  8.0   30   L      2160,1080,720   RAIN"
 "street   14744294  1.0  8.0   30   L      2160,1080,720   RAIN"
 "steam     9694805   2.0  12.0  25   L      2160,1080,720   NONE"
 "sunv     36828507  2.0  8.0   25   P      2160,1080,720   WARM"
 "railv    27590740  0.0  8.0   30   P      2160,1080,720   RAIN"
 "skyv      34909100  4.0  10.0  30   P      1080,720        RAIN"
 "vatv      34705708  0.0  8.0   30   P      1080,720        WARM"
 "coconutv  27811423  0.0  5.4   30   P      1080,720        NONE"
 "housesv   32548044  0.0  8.4   30   P      1080,720        NONE"
)
want=("$@")
for row in "${CLIPS[@]}"; do
  read -r name id ss len fps orient rungs grade <<<"$row"
  if [ ${#want[@]} -gt 0 ] && [[ ! " ${want[*]} " =~ " $name " ]]; then continue; fi
  case $grade in WARM) G="$G_WARM";; RAIN) G="$G_RAIN";; *) G="$G_NONE";; esac
  for r in ${rungs//,/ }; do
    case $r in 2160) S=2160; CRF=31; P=medium;; 1080) S=1080; CRF=29; P=slow;; 720) S=720; CRF=31; P=slow;; esac
    if [ "$orient" = L ]; then SC="scale=-2:$S:flags=lanczos,crop=trunc(ih*16/9/2)*2:ih"; else SC="scale=$S:-2:flags=lanczos,crop=iw:trunc(iw*16/9/2)*2"; fi
    ffmpeg -v error -y -ss "$ss" -t "$len" -i "$RAW/$id.mp4" \
      -vf "fps=$fps,$SC,$G,format=yuv420p" \
      -an -c:v libx264 -preset $P -crf $CRF -profile:v high -movflags +faststart \
      "video/$name-$r.mp4"
    echo "$name-$r $(stat -c %s video/$name-$r.mp4)"
  done
  if [ "$orient" = L ]; then PS="scale=-2:1080:flags=lanczos,crop=1920:1080"; else PS="scale=1080:-2:flags=lanczos,crop=1080:1920"; fi
  ffmpeg -v error -y -ss "$ss" -i "$RAW/$id.mp4" -frames:v 1 -vf "$PS,$G" "$WORK/poster-$name.png"
done
echo ENCODE-DONE
