#!/usr/bin/env bash
#
# stack-down.sh — Stop the Scorepion dev stack cleanly.
#
# Stops Expo (13290), backend (13291), and MySQL container (13292).
# Keeps the Docker volume so your DB data survives restart.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log()  { echo -e "${GREEN}[stack]${NC} $*"; }
warn() { echo -e "${YELLOW}[stack]${NC} $*"; }

stop_pid_file() {
  local name="$1"; local file="$2"
  if [ -f "$file" ]; then
    local pid
    pid=$(cat "$file")
    if kill -0 "$pid" 2>/dev/null; then
      log "Stopping $name (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    else
      warn "$name PID $pid is not alive."
    fi
    rm -f "$file"
  else
    warn "$name has no PID file."
  fi
}

stop_pid_file "Expo"    "$LOG_DIR/expo.pid"
stop_pid_file "Backend" "$LOG_DIR/server.pid"

log "Stopping MySQL container..."
bash "$ROOT/scripts/start-db.sh" stop || true

log "Stack is down."
