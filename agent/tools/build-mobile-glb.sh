#!/usr/bin/env bash
# Build the phone-sized variant of every scene GLB.
#
# The desktop GLBs are texture-bound, not geometry-bound: for Airbnb-Room the mesh is 28k Draco
# triangles (~0.5 MB) while 483 embedded 1K JPEGs account for 17.2 MB of the 17.7 MB file. Those
# JPEGs land in VRAM uncompressed (RGBA8 + mips) at roughly 3 GB, which is well past what a phone
# will hold — Safari starts evicting textures and every frame stalls.
#
# Three passes fix it, and none of them touch node names or animation tracks (the viewer's object
# panel and door/drawer articulation bind by name, so those must survive):
#   dedup   — 483 images collapse to 161 unique; only ~1/3 were distinct to begin with
#   resize  — 512x512 is plenty at phone screen size, and cuts VRAM another 4x
#   draco   — dedup decodes the existing Draco geometry, so re-apply it on the way out
#
# Result per scene: ~17.7 MB -> ~2.1 MB on the wire, ~3.0 GB -> ~0.23 GB of VRAM.
#
# Upload the output next to each scene's room.glb as room-mobile.glb; vr/app.js requests that
# variant on touch devices and falls back to room.glb if it isn't there yet.

set -euo pipefail

BASE="https://litereality-viewer.huangzhening.workers.dev/recon"
OUT="${1:-mobile-glb}"
SIZE="${MOBILE_TEX_SIZE:-512}"
GT="npx --yes @gltf-transform/cli@latest"

SCENES=(
  Airbnb-Cam-Zhening-QC
  Airbnb-Room-Zhening-QC
  Corridors-MIL-Zhening-QC
  fallside-kitchen-Zhening-QC
  fallside-office-Zhening-QC
  MIL-Meeting-Zhening-QC
  Office-Elliott-QC
  PSi_2_meeting-Zhening-QC
  Psi_2_seminar-Zhening-QC
)

mkdir -p "$OUT"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

printf '%-32s %10s %10s %7s\n' SCENE BEFORE AFTER RATIO

for s in "${SCENES[@]}"; do
  src="$tmp/$s.glb"

  # The worker serves the site's index HTML as a catch-all for unknown paths, so a missing scene
  # comes back as 200 text/html rather than a 404. Check the glTF magic instead of the status code.
  if ! curl -sfS "$BASE/$s/room.glb" -o "$src" \
     || [ "$(head -c 4 "$src")" != "glTF" ]; then
    printf '%-32s %s\n' "$s" "SKIPPED (no room.glb at $BASE/$s/)" >&2
    continue
  fi

  $GT dedup  "$src"       "$tmp/$s.1.glb"                        >/dev/null 2>&1
  $GT resize "$tmp/$s.1.glb" "$tmp/$s.2.glb" \
             --width "$SIZE" --height "$SIZE"                    >/dev/null 2>&1
  $GT draco  "$tmp/$s.2.glb" "$OUT/$s.room-mobile.glb"           >/dev/null 2>&1

  before=$(wc -c <"$src")
  after=$(wc -c <"$OUT/$s.room-mobile.glb")
  printf '%-32s %9.2fM %9.2fM %6.1fx\n' "$s" \
    "$(echo "$before/1048576" | bc -l)" \
    "$(echo "$after/1048576"  | bc -l)" \
    "$(echo "$before/$after"  | bc -l)"
done

echo
echo "Wrote $OUT/. Upload each <scene>.room-mobile.glb to recon/<scene>/room-mobile.glb"
