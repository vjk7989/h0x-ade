#!/bin/bash
# Generate app icons from Icon Composer .icon project
# Produces the macOS ICNS after synchronizing the cross-platform brand assets.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BUILD_DIR="$PROJECT_DIR/resources/build"
TMP_DIR=$(mktemp -d)

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Compiling icon from the canonical PNG..."

node "$PROJECT_DIR/config/scripts/generate-h0x-brand-assets.mjs"

ICONSET="$TMP_DIR/icon.iconset"
mkdir -p "$ICONSET"
SOURCE_PNG="$BUILD_DIR/icon.png"
for spec in \
  '16 icon_16x16.png' \
  '32 icon_16x16@2x.png' \
  '32 icon_32x32.png' \
  '64 icon_32x32@2x.png' \
  '128 icon_128x128.png' \
  '256 icon_128x128@2x.png' \
  '256 icon_256x256.png' \
  '512 icon_256x256@2x.png' \
  '512 icon_512x512.png' \
  '1024 icon_512x512@2x.png'; do
  read -r size name <<< "$spec"
  sips -z "$size" "$size" "$SOURCE_PNG" --out "$ICONSET/$name" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$TMP_DIR/icon.icns"

cp "$TMP_DIR/icon.icns" "$BUILD_DIR/icon.icns"

echo "  -> resources/build/icon.icns"

node "$PROJECT_DIR/config/scripts/generate-h0x-brand-assets.mjs" --check

echo "Done! Brand assets are synchronized and resources/build/icon.icns is regenerated."
