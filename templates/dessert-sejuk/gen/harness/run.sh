#!/usr/bin/env bash
# SEJUK verification runner.
#   run.sh measure          -> overflow/AR/reveal JSON for all pages x widths
#   run.sh shots            -> screenshots for eyeballing
# Fresh copy per run (Chrome caches CSS/JS hard across runs).
set -euo pipefail
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
TDIR="$(cd "$(dirname "$0")/../.." && pwd)"
SCRATCH="$HOME/AppData/Local/Temp/claude/C--School-Personal-Sides-Website-Collection/e210d636-fee2-48ea-9c07-09c0925b6ce7/scratchpad"
TS=$(date +%s)
RD="$SCRATCH/render-$TS"
mkdir -p "$RD"
cp -r "$TDIR/." "$RD/t"
rm -f "$RD/t/gen/"*.png "$RD/t/gen/"*.jpg 2>/dev/null || true
UD="$RD/profile"
mkdir -p "$UD"

PAGES="index.html menu.html house.html visit.html pickup.html"
WIDTHS="320 375 414 768 1024 1440"

measure() {
  for p in $PAGES; do
    for w in $WIDTHS; do
      "$CHROME" --headless=new --disable-gpu --mute-audio \
        --allow-file-access-from-files \
        --user-data-dir="$(cygpath -w "$UD")" \
        --virtual-time-budget=20000 \
        --dump-dom \
        "file:///$(cygpath -m "$RD/t/gen/harness/wrapper.html")?page=$p&w=$w&mode=measure" 2>/dev/null \
        | grep -o 'HARNESS_JSON {.*}' | head -1 || echo "NO_RESULT $p $w"
    done
  done
}

shots() {
  local outdir="$RD/shots"
  mkdir -p "$outdir"
  for p in $PAGES; do
    for w in 375 1280; do
      local name="${p%.html}-$w"
      local target
      target="$(cygpath -w "$outdir/$name.png")"
      "$CHROME" --headless=new --disable-gpu --mute-audio \
        --allow-file-access-from-files \
        --user-data-dir="$(cygpath -w "$UD")" \
        --virtual-time-budget=25000 \
        --window-size="$((w + 40)),9500" \
        --screenshot="$target" \
        "file:///$(cygpath -m "$RD/t/gen/harness/wrapper.html")?page=$p&w=$w&mode=shot" 2>/dev/null
      echo "shot $name -> $([ -f "$outdir/$name.png" ] && echo OK || echo MISSING)"
    done
  done
  echo "SHOTDIR $outdir"
}

case "${1:-measure}" in
  measure) measure ;;
  shots) shots ;;
esac
