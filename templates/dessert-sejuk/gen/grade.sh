#!/usr/bin/env bash
# SEJUK grade pass — ONE identical grade for every frame, stock and generated,
# so the whole site reads as a single cold shoot.
# Grade: whisper of desaturation, gentle contrast, cool balance toward frost.
#
# Source frames live in ../src/ (gitignored): licensed stock originals and
# the generated PNGs. Exports land in ../img/ (committed).
set -euo pipefail
cd "$(dirname "$0")"
SRC="../src"
OUT="../img"
mkdir -p "$OUT"

GRADE="eq=saturation=0.97:contrast=1.03,colorbalance=rs=-0.02:bs=0.02"

# item(src, name): square generated 4K frame -> centre-crop to 92% -> 800 + 400
item() {
  local src="$1" name="$2"
  ffmpeg -v error -y -i "$src" \
    -vf "crop=iw*0.92:ih*0.92,${GRADE},scale=800:800:flags=lanczos,unsharp=5:5:0.35:5:5:0.0" \
    -c:v libwebp -q:v 82 "$OUT/${name}-800.webp"
  ffmpeg -v error -y -i "$src" \
    -vf "crop=iw*0.92:ih*0.92,${GRADE},scale=400:400:flags=lanczos,unsharp=5:5:0.3:5:5:0.0" \
    -c:v libwebp -q:v 80 "$OUT/${name}-400.webp"
}

# wide(src, name, w1, w2...): 16:9 frame -> widths at native AR
wide() {
  local src="$1" name="$2"
  shift 2
  for w in "$@"; do
    ffmpeg -v error -y -i "$src" \
      -vf "${GRADE},scale=${w}:-2:flags=lanczos,unsharp=5:5:0.3:5:5:0.0" \
      -c:v libwebp -q:v 82 "$OUT/${name}-${w}.webp"
  done
}

stock() {
  # ice block (portrait) — house + home
  for w in 800 1600; do
    ffmpeg -v error -y -i "$SRC/stock-iceblock.jpg" \
      -vf "${GRADE},scale=${w}:-2:flags=lanczos,unsharp=5:5:0.3:5:5:0.0" \
      -c:v libwebp -q:v 82 "$OUT/iceblock-${w}.webp"
  done
  # condensation streaks — ink band underlay (heavily dimmed on page, q can drop)
  ffmpeg -v error -y -i "$SRC/stock-streaks.jpg" \
    -vf "${GRADE},scale=1600:-2:flags=lanczos" \
    -c:v libwebp -q:v 62 "$OUT/streaks-1600.webp"
  # powder snow — spare band ground
  ffmpeg -v error -y -i "$SRC/stock-powder.jpg" \
    -vf "${GRADE},scale=1600:-2:flags=lanczos" \
    -c:v libwebp -q:v 72 "$OUT/powder-1600.webp"
}

gen() {
  for id in gunung-pandan bandung-monsoon malt-avalanche chendol-glacier \
            soursop-squall mango-sticky-peak kopi-tarik-summit lychee-kacang \
            ondeh-mochi gula-waffle tang-yuan syrup-bottles; do
    [ -f "$SRC/${id}.png" ] && item "$SRC/${id}.png" "$id" && echo "graded $id"
  done
  [ -f "$SRC/hero-pour.png" ] && wide "$SRC/hero-pour.png" hero-pour 800 1600 2560 && echo "graded hero"
  [ -f "$SRC/sharing-spoons.png" ] && wide "$SRC/sharing-spoons.png" sharing 800 1600 && echo "graded sharing"
  [ -f "$SRC/ice-texture.png" ] && wide "$SRC/ice-texture.png" ice-texture 800 1600 && echo "graded texture"
}

# contact sheet on the page's own frost ground
sheet() {
  local files=("$OUT"/*-400.webp)
  ffmpeg -v error -y $(printf -- "-i %s " "${files[@]}") \
    -filter_complex "$(n=0; for f in "${files[@]}"; do printf "[%d]scale=300:300[a%d];" "$n" "$n"; n=$((n+1)); done; for i in $(seq 0 $((${#files[@]}-1))); do printf "[a%d]" "$i"; done; printf "xstack=inputs=%d:layout=" "${#files[@]}"; cols=4; for i in $(seq 0 $((${#files[@]}-1))); do x=$(( (i % cols) * 300 )); y=$(( (i / cols) * 300 )); printf "%d_%d|" "$x" "$y"; done | sed 's/|$//'; printf ":fill=0xf2f5f6")" \
    contact-sheet.png
}

case "${1:-all}" in
  stock) stock ;;
  gen) gen ;;
  sheet) sheet ;;
  all) stock; gen ;;
esac
echo done
