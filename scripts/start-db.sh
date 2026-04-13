#!/usr/bin/env bash
#
# start-db.sh — Start a PostgreSQL container for Scorepion development
#
# Usage:
#   ./scripts/start-db.sh          # start / create the container
#   ./scripts/start-db.sh stop     # stop the container
#   ./scripts/start-db.sh reset    # destroy and recreate from scratch
#
# The container name, port, and credentials match .env defaults so
# the server can connect without any extra configuration.

set -euo pipefail

CONTAINER_NAME="scorepion-db"
PG_USER="postgres"
PG_PASSWORD="postgres"
PG_DB="scorepion"
# Port range 13290-13299 is reserved for Scorepion dev services:
#   13290 = Expo Metro web
#   13291 = Express backend
#   13292 = PostgreSQL (this script)
PG_PORT="13292"
PG_VERSION="16-alpine"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[db]${NC} $*"; }
warn()  { echo -e "${YELLOW}[db]${NC} $*"; }
error() { echo -e "${RED}[db]${NC} $*" >&2; }

# ── Pre-flight checks ──────────────────────────────────────────────────────

if ! command -v docker &> /dev/null; then
  error "Docker is not installed or not in PATH."
  echo  "  macOS:   brew install --cask docker"
  echo  "  Ubuntu:  sudo apt install docker.io"
  exit 1
fi

if ! docker info &> /dev/null; then
  error "Docker daemon is not running. Start Docker Desktop and try again."
  exit 1
fi

# ── Commands ────────────────────────────────────────────────────────────────

stop_db() {
  if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    log "Stopping $CONTAINER_NAME..."
    docker stop "$CONTAINER_NAME" > /dev/null
    log "Stopped."
  else
    warn "Container $CONTAINER_NAME is not running."
  fi
}

reset_db() {
  warn "This will destroy all data in the $CONTAINER_NAME container."
  read -rp "Are you sure? [y/N] " confirm
  if [[ "$confirm" != [yY] ]]; then
    echo "Cancelled."
    exit 0
  fi

  if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
    log "Removing existing container..."
    docker rm -f "$CONTAINER_NAME" > /dev/null
  fi

  start_db
}

wait_for_pg() {
  log "Waiting for PostgreSQL to be ready..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker exec "$CONTAINER_NAME" pg_isready -U "$PG_USER" -q 2>/dev/null; then
      return 0
    fi
    retries=$((retries - 1))
    sleep 1
  done
  error "PostgreSQL did not become ready in time."
  exit 1
}

# Inspect an existing container's published host port for 5432/tcp.
# Echoes the port number, or nothing if it can't be determined.
container_host_port() {
  docker inspect "$CONTAINER_NAME" \
    --format '{{ (index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort }}' \
    2>/dev/null || true
}

# Recreate the container with the current PG_PORT mapping, preserving the
# data volume (scorepion-pgdata) so no data is lost.
recreate_container() {
  warn "Container $CONTAINER_NAME was mapped to a different host port; recreating with -p $PG_PORT:5432 (data volume preserved)..."
  docker rm -f "$CONTAINER_NAME" > /dev/null
  create_container
}

create_container() {
  log "Creating PostgreSQL $PG_VERSION container on port $PG_PORT..."
  docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -e POSTGRES_DB="$PG_DB" \
    -p "$PG_PORT:5432" \
    -v scorepion-pgdata:/var/lib/postgresql/data \
    --restart unless-stopped \
    "postgres:$PG_VERSION" \
    > /dev/null
  wait_for_pg
  log "Container $CONTAINER_NAME created and running."
  log "PostgreSQL available at: postgresql://$PG_USER:$PG_PASSWORD@localhost:$PG_PORT/$PG_DB"
}

start_db() {
  # Container already running
  if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    local actual_port
    actual_port="$(container_host_port)"
    if [ -n "$actual_port" ] && [ "$actual_port" != "$PG_PORT" ]; then
      warn "Running container is published on host port $actual_port, but PG_PORT=$PG_PORT."
      warn "Stopping and recreating with the correct mapping..."
      docker stop "$CONTAINER_NAME" > /dev/null
      recreate_container
      return 0
    fi
    log "Container $CONTAINER_NAME is already running."
    log "PostgreSQL available at: postgresql://$PG_USER:$PG_PASSWORD@localhost:$PG_PORT/$PG_DB"
    return 0
  fi

  # Container exists but stopped — restart it (or recreate if port differs)
  if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
    local actual_port
    actual_port="$(container_host_port)"
    if [ -n "$actual_port" ] && [ "$actual_port" != "$PG_PORT" ]; then
      recreate_container
      return 0
    fi
    log "Restarting stopped container $CONTAINER_NAME..."
    docker start "$CONTAINER_NAME" > /dev/null
    wait_for_pg
    log "PostgreSQL available at: postgresql://$PG_USER:$PG_PASSWORD@localhost:$PG_PORT/$PG_DB"
    return 0
  fi

  # Create new container
  create_container
  echo ""
  log "Next steps:"
  echo "  npx drizzle-kit push        # create tables"
  echo "  npx tsx scripts/seed-dev-data.ts  # seed test data"
  echo "  npm run server:dev           # start the server"
}

# ── Main ────────────────────────────────────────────────────────────────────

case "${1:-start}" in
  stop)  stop_db  ;;
  reset) reset_db ;;
  start) start_db ;;
  *)
    echo "Usage: $0 [start|stop|reset]"
    exit 1
    ;;
esac
