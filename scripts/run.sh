#!/usr/bin/env bash
#
# Start Podforge (backend :8080 + UI :5173) for local development.
# Run ./scripts/setup.sh first if you haven't.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f backend/config.yaml ]; then
  echo "backend/config.yaml not found — run ./scripts/setup.sh first." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Dependencies not installed — run ./scripts/setup.sh first." >&2
  exit 1
fi

exec pnpm dev
