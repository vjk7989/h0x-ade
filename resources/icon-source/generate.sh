#!/bin/bash
# Generate app icons from Icon Composer .icon project
# Produces the macOS ICNS after synchronizing the cross-platform brand assets.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
ICON_SOURCE="$SCRIPT_DIR/icon.icon"
BUILD_DIR="$PROJECT_DIR/resources/build"
TMP_DIR=$(mktemp -d)

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Compiling icon from $ICON_SOURCE..."

node "$PROJECT_DIR/config/scripts/generate-h0x-brand-assets.mjs"

# Generate .icns using actool (requires Xcode)
xcrun actool \
  --compile "$TMP_DIR" \
  --platform macosx \
  --minimum-deployment-target 10.12 \
  --app-icon icon \
  --output-partial-info-plist "$TMP_DIR/partial.plist" \
  "$ICON_SOURCE" >/dev/null

if [ ! -f "$TMP_DIR/icon.icns" ]; then
  echo "Error: actool failed to produce icon.icns" >&2
  exit 1
fi

cp "$TMP_DIR/icon.icns" "$BUILD_DIR/icon.icns"

echo "  -> resources/build/icon.icns"

node "$PROJECT_DIR/config/scripts/generate-h0x-brand-assets.mjs" --check

echo "Done! Brand assets are synchronized and resources/build/icon.icns is regenerated."
