#!/usr/bin/env bash
#
# Build litereality-agent-post/litereality-agent.pdf from the post itself.
#
# The PDF exists for Google Scholar. Scholar prefers PDF full text, will only
# take a file under 5 MB, and wants the title set 24pt or larger on page one —
# the @media print block in assets/css/blog.css is what satisfies the layout
# half of that, and this script is what turns it into a file.
#
# Two things happen before Chrome prints:
#   1. Each video gets a poster frame pulled from its own first second, so a
#      clip prints as a picture instead of a hole. Posters are build output,
#      not source; they live in a scratch dir and are thrown away after.
#   2. The images are downscaled into that same scratch dir. Printing the
#      originals lands around the 5 MB ceiling; 1600px JPEGs land nowhere near
#      it and look identical at print size.
#
# Usage:  tools/build-post-pdf.sh
# Needs:  Google Chrome, ffmpeg, sips (macOS).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POST="$ROOT/litereality-agent-post"
BUILD="$POST/.pdfbuild"
OUT="$POST/litereality-agent.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

MAX_BYTES=$((5 * 1024 * 1024))   # Scholar rejects PDFs larger than this
IMG_WIDTH=1600                   # plenty for a 170mm-wide print column

for tool in ffmpeg sips; do
  command -v "$tool" >/dev/null || { echo "error: $tool not found" >&2; exit 1; }
done
[ -x "$CHROME" ] || { echo "error: Chrome not found at $CHROME" >&2; exit 1; }

rm -rf "$BUILD"
mkdir -p "$BUILD/posters" "$BUILD/images"

# --- 1. Poster frames -------------------------------------------------------
# 0.3s in, not 0.0s: several clips fade up from black.
echo "==> poster frames"
for v in "$POST"/assets/videos/*.mp4; do
  name="$(basename "${v%.mp4}")"
  ffmpeg -loglevel error -y -ss 0.3 -i "$v" -frames:v 1 \
         -vf "scale='min($IMG_WIDTH,iw)':-2" -q:v 4 \
         "$BUILD/posters/$name.jpg"
done

# --- 2. Downscaled figures --------------------------------------------------
echo "==> figures"
for img in "$POST"/assets/images/*; do
  name="$(basename "$img")"
  sips -s format jpeg -s formatOptions 72 -Z "$IMG_WIDTH" \
       "$img" --out "$BUILD/images/${name%.*}.jpg" >/dev/null
done

# --- 3. A print copy of the post -------------------------------------------
# Same HTML, three substitutions: assets resolve one level up, figures point at
# the downscaled copies, and every <video> carries its poster.
echo "==> print HTML"
python3 - "$POST/index.html" "$BUILD/print.html" <<'PY'
import re, sys, os

src, dst = sys.argv[1], sys.argv[2]
html = open(src, encoding="utf-8").read()

# Videos: rewrite to the build-local poster, keep the src pointing at the real
# clip so a browser opening print.html can still play it.
def video(m):
    path = m.group(1)
    stem = os.path.splitext(os.path.basename(path))[0]
    return f'<video src="../{path}" poster="posters/{stem}.jpg"'

html = re.sub(r'<video src="(assets/videos/[^"]+)"', video, html)

# Figures: the downscaled JPEGs, whatever the original extension was.
def image(m):
    stem = os.path.splitext(os.path.basename(m.group(1)))[0]
    return f'src="images/{stem}.jpg"'

html = re.sub(r'src="(assets/images/[^"]+)"', image, html)

# Everything else (the stylesheet, the script) sits one level up.
html = html.replace('href="assets/', 'href="../assets/')
html = html.replace('src="assets/', 'src="../assets/')

open(dst, "w", encoding="utf-8").write(html)
PY

# --- 4. Print ---------------------------------------------------------------
echo "==> printing"
"$CHROME" \
  --headless \
  --disable-gpu \
  --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=30000 \
  --print-to-pdf="$OUT" \
  "file://$BUILD/print.html" 2>/dev/null

rm -rf "$BUILD"

# --- 5. Report --------------------------------------------------------------
bytes=$(stat -f%z "$OUT")
printf '==> %s  (%s)\n' "${OUT#$ROOT/}" "$(du -h "$OUT" | cut -f1)"
if [ "$bytes" -gt "$MAX_BYTES" ]; then
  echo "warning: over Google Scholar's 5 MB limit — lower IMG_WIDTH and rerun" >&2
  exit 1
fi
