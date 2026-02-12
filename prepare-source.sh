#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

OUT=source-for-review.zip
echo "Creating source package: $OUT"

if command -v zip >/dev/null 2>&1; then
  rm -f "$OUT"
  zip -r "$OUT" src package.json webpack.config.js README.md build.sh prepare-source.sh pnpm-lock.yaml 2>/dev/null || \
    zip -r "$OUT" src package.json webpack.config.js README.md build.sh prepare-source.sh  
  echo "Created $OUT"
else
  echo "zip not found, creating tarball source-for-review.tar.gz"
  rm -f source-for-review.tar.gz
  tar -czf source-for-review.tar.gz src package.json webpack.config.js README.md build.sh prepare-source.sh || true
  echo "Created source-for-review.tar.gz"
fi
