#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Installing dependencies..."
if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  npm ci
fi

echo "Running production build..."
npm run build

echo "Build finished. dist/ contains build outputs."