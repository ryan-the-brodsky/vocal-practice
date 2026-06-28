#!/usr/bin/env bash
# Wrapper for scripts/yt-extract.py — bootstraps a local venv with
# youtube-transcript-api on first run, then runs the tool. Key-free.
#   bash scripts/yt-extract.sh search "vocal coach <artist> vocal range" --n 8
#   bash scripts/yt-extract.sh transcript <url|id> [--segments] [--json]
#   bash scripts/yt-extract.sh batch <id> <id> ... [--json]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HERE/.ytvenv"
PY="$VENV/bin/python"

if [ ! -x "$PY" ]; then
  echo "[yt-extract] first-run setup: creating venv + installing youtube-transcript-api…" >&2
  python3 -m venv "$VENV" >&2
  "$VENV/bin/pip" install -q --upgrade pip youtube-transcript-api >&2
fi

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "[yt-extract] note: yt-dlp not on PATH — 'search' won't work; 'transcript'/'batch' on explicit URLs still do." >&2
fi

exec "$PY" "$HERE/yt-extract.py" "$@"
