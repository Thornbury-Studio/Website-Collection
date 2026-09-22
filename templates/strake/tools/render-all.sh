#!/usr/bin/env bash
# Renders the hero and every configurator still. ~10 min on the RTX 5060.
set -e
cd "$(dirname "$0")/.."
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
RAW="$PWD/tools/raw"
declare -A PAINT=(
  [solent]="0.56,0.54,0.50,0.7,0.24"
  [sailcloth]="0.80,0.79,0.74,0.12,0.3"
  [keel]="0.006,0.006,0.007,0.05,0.3"
  [ebb]="0.008,0.05,0.05,0.1,0.3"
  [redlead]="0.28,0.04,0.025,0.08,0.3"
)
declare -A RIM=(
  [graphite]="0.14,0.14,0.15,0.85,0.38"
  [bronze]="0.72,0.50,0.28,1.0,0.3"
)
[ -f "$RAW/hero-solent.png" ] || "$B" -b --python tools/carvel.py -- render 3600 2025 256 "$RAW/hero-solent.png" "${PAINT[solent]}" "${RIM[graphite]}" 2>&1 | grep -i "saved\|error\|traceback"
for p in "${!PAINT[@]}"; do for r in "${!RIM[@]}"; do
  [ -f "$RAW/cfg-$p-$r.png" ] || "$B" -b --python tools/carvel.py -- render 2400 1350 128 "$RAW/cfg-$p-$r.png" "${PAINT[$p]}" "${RIM[$r]}" 2>&1 | grep -i "saved\|error\|traceback"
done; done
"$B" -b --python tools/carvel.py -- glb "$RAW/carvel.glb" 2>&1 | grep -i "error\|traceback" || true
echo ALL-DONE
