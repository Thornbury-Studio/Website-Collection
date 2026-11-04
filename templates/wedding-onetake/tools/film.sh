#!/usr/bin/env bash
# CIRCLE TAKE: "the edit". Seven licensed Pexels clips from one wedding
# (Alexander Mass, @rebornfilmes) cut into one 34.0 s film at 24 fps.
# Each shot is one section of the page; the cut points below are mirrored in
# js/edit.js (SHOTS) and must move together.
#
#   shot  clip       in    out   len  section
#   00    34506424   0.4   3.9   3.5  Slate        the dress, waiting
#   01    34506423   0.9   5.9   5.0  Films        shutters open
#   02    34506432   0.5   6.0   5.5  Coverage     the walk to the aisle
#   03    34506426   2.5   7.5   5.0  No retakes   the first look
#   04    34506422   2.0   7.0   5.0  Packages     the recessional
#   05    34506427   1.0   6.0   5.0  Delivery     the toast
#   06    34506431   2.4   7.4   5.0  Enquire      through the car window
#
# usage: RAW=<folder of masters> bash tools/film.sh [test|full]
#   masters are the Pexels originals saved as <id>.mp4 (never committed):
#   curl -L -o "$RAW/<id>.mp4" https://www.pexels.com/download/video/<id>/
#   WORK (default: $RAW/../work) holds the graded master and test frames.
set -euo pipefail
cd "$(dirname "$0")/.."
RAW="${RAW:?set RAW to the folder holding the Pexels masters}"
WORK="${WORK:-$RAW/../work}"; mkdir -p "$WORK"

IDS=(34506424 34506423 34506432 34506426 34506422 34506427 34506431)
INS=(0.4 0.9 0.5 2.5 2.0 1.0 2.4)
LENS=(3.5 5.0 5.5 5.0 5.0 5.0 5.0)
# where the subject sits across the frame, 0..1, for the 9:16 phone crop
PX=(0.49 0.48 0.50 0.47 0.44 0.47 0.44)

# one grade over the whole reel: a touch darker and warmer in the shadows so
# ivory type reads on top, highlights kept clean for the dress
GRADE="eq=brightness=-0.025:contrast=1.05:saturation=0.9:gamma=0.97,colorbalance=rs=0.025:bs=-0.02:rh=0.01:bh=-0.015"

if [ "${1:-test}" = "test" ]; then
  for i in "${!IDS[@]}"; do
    t=$(awk "BEGIN{print ${INS[$i]} + ${LENS[$i]}/2}")
    ffmpeg -v error -y -ss "$t" -i "$RAW/${IDS[$i]}.mp4" -frames:v 1 -vf "scale=960:-2,$GRADE" "$WORK/test-$i.jpg"
  done
  echo test-done; exit 0
fi

# 1. cut + grade into one 4K master (near-lossless intermediate)
inputs=(); chain=""; cat=""
for i in "${!IDS[@]}"; do
  inputs+=(-ss "${INS[$i]}" -t "${LENS[$i]}" -i "$RAW/${IDS[$i]}.mp4")
  chain+="[$i:v]fps=24,setpts=PTS-STARTPTS,scale=3840:2160:flags=lanczos,$GRADE,format=yuv420p[s$i];"
  cat+="[s$i]"
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${chain}${cat}concat=n=${#IDS[@]}:v=1:a=0[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p "$WORK/master.mp4"

# 2. the phone master: each shot cropped to 9:16 around its subject
chain=""; cat=""
for i in "${!IDS[@]}"; do
  x=$(awk "BEGIN{v=int(3840*${PX[$i]} - 1215/2); if(v<0)v=0; if(v>3840-1215)v=3840-1215; print v}")
  chain+="[$i:v]fps=24,setpts=PTS-STARTPTS,scale=3840:2160:flags=lanczos,crop=1215:2160:$x:0,scale=1080:1920:flags=lanczos,$GRADE,format=yuv420p[s$i];"
  cat+="[s$i]"
done
ffmpeg -v error -y "${inputs[@]}" -filter_complex "${chain}${cat}concat=n=${#IDS[@]}:v=1:a=0[v]" \
  -map "[v]" -an -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p "$WORK/master-portrait.mp4"

# 3. the web ladder. Short GOPs on purpose: the page seeks the film on every
#    scroll frame, and a seek costs up to one GOP of decoding. No B-frames, so
#    every decoded frame is a frame shown.
enc() { # in out vf crf keyint maxrate
  ffmpeg -v error -y -i "$1" -vf "$3" -an -c:v libx264 -profile:v high -preset slow \
    -crf "$4" -g "$5" -keyint_min "$5" -sc_threshold 0 -bf 0 -maxrate "$6" -bufsize "$6" \
    -pix_fmt yuv420p -movflags +faststart "$2"
}
enc "$WORK/master.mp4"          video/edit-2160.mp4 "scale=3840:2160:flags=lanczos"            31 4  12M
enc "$WORK/master.mp4"          video/edit-1080.mp4 "scale=1920:1080:flags=lanczos,cas=0.35"   27 8  4M
enc "$WORK/master.mp4"          video/edit-720.mp4  "scale=1280:720:flags=lanczos,cas=0.3"     28 8  2M
enc "$WORK/master-portrait.mp4" video/edit-p720.mp4 "scale=720:1280:flags=lanczos,cas=0.3"     29 8  1600k

# 4. one still per shot (posters, the loading fallback and the reduced-motion
#    page); tools/stills.py turns them into img/shot-*.{avif,webp}
for i in "${!IDS[@]}"; do
  t=$(awk -v i="$i" 'BEGIN{split("3.5 5.0 5.5 5.0 5.0 5.0 5.0",L," "); s=0; for(k=1;k<=i;k++) s+=L[k]; print s + L[i+1]*0.5}')
  ffmpeg -v error -y -ss "$t" -i "$WORK/master.mp4" -frames:v 1 "$WORK/still-$i.png"
  ffmpeg -v error -y -ss "$t" -i "$WORK/master-portrait.mp4" -frames:v 1 "$WORK/still-p$i.png"
done
# the first frame, exactly as the film opens, for the hero poster
ffmpeg -v error -y -i "$WORK/master.mp4" -frames:v 1 "$WORK/still-first.png"
ffmpeg -v error -y -i "$WORK/master-portrait.mp4" -frames:v 1 "$WORK/still-pfirst.png"
echo full-done
