#!/usr/bin/env bash
#
# stack-up.sh — Start the full Scorepion dev stack on ports 13290-13299.
#
#   13290 = Expo Metro web dev server
#   13291 = Express backend API
#   13292 = PostgreSQL 16 (Docker)
#
# Usage:
#   npm run stack:up
#   or: bash scripts/stack-up.sh
#
# Logs are written to ./logs/{db,server,expo}.log
# PIDs are written to ./logs/{server,expo}.pid (db is a Docker container)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[stack]${NC} $*"; }
warn()  { echo -e "${YELLOW}[stack]${NC} $*"; }
error() { echo -e "${RED}[stack]${NC} $*" >&2; }
step()  { echo -e "${BLUE}══>${NC} ${BLUE}$*${NC}"; }

# Load env so we pick up DATABASE_URL, PORT, EXPO_METRO_PORT, EXPO_PUBLIC_DOMAIN
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

# ─────────────────────────────────────────────────────────────
# 1. Database (Docker, port 13292)
# ─────────────────────────────────────────────────────────────
step "1/4  Starting PostgreSQL on port 13292 (Docker)"
bash "$ROOT/scripts/start-db.sh"

# ─────────────────────────────────────────────────────────────
# 2. Schema push + seed (idempotent)
# ─────────────────────────────────────────────────────────────
step "2/4  Pushing schema + seeding dev data"
if [ ! -f "$LOG_DIR/.seeded" ]; then
  npx drizzle-kit push > "$LOG_DIR/db-push.log" 2>&1 || { error "drizzle-kit push failed — see $LOG_DIR/db-push.log"; exit 1; }
  npx tsx scripts/seed-dev-data.ts > "$LOG_DIR/db-seed.log" 2>&1 || warn "seed-dev-data.ts exited non-zero (may already be seeded)"
  touch "$LOG_DIR/.seeded"
  log "Schema pushed and seeded."
else
  log "Already seeded (delete logs/.seeded to re-run)."
fi

# ─────────────────────────────────────────────────────────────
# 3. Backend (Express, port 13291)
# ─────────────────────────────────────────────────────────────
step "3/4  Starting Express backend on port 13291"
if [ -f "$LOG_DIR/server.pid" ] && kill -0 "$(cat "$LOG_DIR/server.pid")" 2>/dev/null; then
  log "Backend already running (PID $(cat "$LOG_DIR/server.pid"))."
else
  NODE_ENV=development nohup tsx server/index.ts > "$LOG_DIR/server.log" 2>&1 &
  echo $! > "$LOG_DIR/server.pid"
  sleep 2
  if kill -0 "$(cat "$LOG_DIR/server.pid")" 2>/dev/null; then
    log "Backend started (PID $(cat "$LOG_DIR/server.pid")) — http://localhost:13291"
  else
    error "Backend failed to start — see $LOG_DIR/server.log"
    exit 1
  fi
fi

# ─────────────────────────────────────────────────────────────
# 4. Expo web (Metro, port 13290)
# ─────────────────────────────────────────────────────────────
step "4/4  Starting Expo Metro web on port 13290"
if [ -f "$LOG_DIR/expo.pid" ] && kill -0 "$(cat "$LOG_DIR/expo.pid")" 2>/dev/null; then
  log "Expo already running (PID $(cat "$LOG_DIR/expo.pid"))."
else
  CI=1 nohup npx expo start --port 13290 --web > "$LOG_DIR/expo.log" 2>&1 &
  echo $! > "$LOG_DIR/expo.pid"
  sleep 3
  if kill -0 "$(cat "$LOG_DIR/expo.pid")" 2>/dev/null; then
    log "Expo started (PID $(cat "$LOG_DIR/expo.pid")) — http://localhost:13290"
  else
    error "Expo failed to start — see $LOG_DIR/expo.log"
    exit 1
  fi
fi

echo ""
log "Stack is up:"
printf "  ${BLUE}%-10s${NC} →  %s\n" "Expo web" "http://localhost:13290"
printf "  ${BLUE}%-10s${NC} →  %s\n" "Backend"  "http://localhost:13291"
printf "  ${BLUE}%-10s${NC} →  %s\n" "Postgres" "postgresql://postgres:postgres@localhost:13292/scorepion"
echo ""
echo "  Logs:   tail -f $LOG_DIR/{db,server,expo,db-push,db-seed}.log"
echo "  Stop:   npm run stack:down"
echo "  Status: npm run stack:status"
