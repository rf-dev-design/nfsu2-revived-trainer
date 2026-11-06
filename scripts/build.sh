#!/usr/bin/env bash
# Builds release packages into dist/: one per browser.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json;print(json.load(open('platform/chromium/manifest.json'))['version'])")
rm -rf dist build && mkdir -p dist build
for target in chromium firefox safari; do
  out="build/$target"
  mkdir -p "$out/icons"
  cp src/trainer.js "$out/"
  cp platform/$target/manifest.json "$out/"
  cp icons/icon-{16,32,48,128}.png "$out/icons/"
  cp src/fonts-OFL.txt "$out/"
  [ -f "platform/$target/README.txt" ] && cp "platform/$target/README.txt" "$out/"
  (cd "$out" && zip -qr -X "../../dist/u2-revived-trainer-$target-v$VERSION.zip" .)
done
cp "dist/u2-revived-trainer-firefox-v$VERSION.zip" "dist/u2-revived-trainer-firefox-v$VERSION.xpi"
(cd dist && sha256sum * > SHA256SUMS.txt)
ls -l dist
