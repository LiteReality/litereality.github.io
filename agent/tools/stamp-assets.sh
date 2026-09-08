#!/usr/bin/env bash
# Stamp vr/app.js and vr/app.css with a content hash in every scene page's URL.
#
# GitHub Pages serves these with `cache-control: max-age=600`, so for ten minutes after a deploy a
# browser that already has the page will keep running the previous app.js. That reads exactly like a
# change that failed to work, and costs a round of "it's still doing the old thing" every time.
# A hash in the query string makes each build a distinct URL, so a changed file is fetched at once
# and an unchanged one still comes from cache.
#
# Run this after editing vr/app.js or vr/app.css, and commit the result.

set -euo pipefail
cd "$(dirname "$0")/.."

hash_of() { md5 -q "$1" 2>/dev/null || md5sum "$1" | cut -d' ' -f1; }

JS="$(hash_of vr/app.js  | cut -c1-8)"
CSS="$(hash_of vr/app.css | cut -c1-8)"

n=0
for f in vr/*-QC.html; do
  # Match the file with or without an existing ?v= stamp, so this is safe to re-run.
  perl -0pi -e "s{href=\"app\.css(\?v=[0-9a-f]+)?\"}{href=\"app.css?v=$CSS\"}g;
                s{src=\"app\.js(\?v=[0-9a-f]+)?\"}{src=\"app.js?v=$JS\"}g" "$f"
  n=$((n + 1))
done

echo "stamped $n scene pages   app.js?v=$JS   app.css?v=$CSS"
grep -h 'app\.\(js\|css\)?v=' vr/*-QC.html | sort -u | sed 's/^/   /'
