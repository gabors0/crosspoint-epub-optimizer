#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-4175}"
BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"

cd "$SCRIPT_DIR"
echo "CrossPoint EPUB Optimizer: http://$BIND_ADDRESS:$PORT/"
exec python3 -m http.server "$PORT" --bind "$BIND_ADDRESS"
