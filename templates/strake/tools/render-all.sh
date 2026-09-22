#!/usr/bin/env bash
# Renders the hero master and its three 2.5D layers. ~8 min on the RTX 5060.
# The configurator's colourways are NOT rendered here — they are produced from these layers by
# tools/recolour.py through the Adobe image tools, so every paint is the same photograph.
set -e
cd "$(dirname "$0")/.."
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
RAW="$PWD/tools/raw"
SILVER="0.56,0.54,0.50,0.7,0.24"
GRAPHITE="0.14,0.14,0.15,0.85,0.38"
[ -f "$RAW/hero-master.png" ] || "$B" -b --python tools/carvel.py -- render 3200 1800 224 "$RAW/hero-master.png" "$SILVER" "$GRAPHITE" "" all 2>&1 | grep -iE "saved|error"
for p in body wheels shadow; do
  [ -f "$RAW/hero-$p.png" ] || "$B" -b --python tools/carvel.py -- render 3200 1800 160 "$RAW/hero-$p.png" "$SILVER" "$GRAPHITE" "" "$p" 2>&1 | grep -iE "saved|error"
done
"$B" -b --python tools/carvel.py -- glb "$RAW/carvel.glb" 2>&1 | grep -iE "error" || true
echo ALL-DONE
