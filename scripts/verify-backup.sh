#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Verify Backup Script — Scorepion
# Smoke-tests the latest backup by loading it into a temp database
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="./backups"
TEMP_CONTAINER_NAME="scorepion_backup_verify_$$"
TEMP_PORT=$((15432 + RANDOM % 1000))
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres_temp_$$"
POSTGRES_DB="scorepion_verify"

# Find most recent backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -maxdepth 1 -name "scorepion_*.dump" -type f -printf '%T+ %p\n' \
  | sort -r | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_BACKUP" ]; then
  echo "✗ No backup files found in $BACKUP_DIR" >&2
  exit 1
fi

echo "→ Verifying backup: $(basename "$LATEST_BACKUP")"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "✗ Docker not found. Install Docker to verify backups." >&2
  exit 1
fi

# Spin up temp Postgres container
echo "→ Starting temporary Postgres container on port $TEMP_PORT..."
if ! docker run -d \
  --name "$TEMP_CONTAINER_NAME" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -p "$TEMP_PORT:5432" \
  postgres:16-alpine \
  > /dev/null 2>&1; then
  echo "✗ Failed to start Docker container. Ensure Docker daemon is running." >&2
  exit 1
fi

# Cleanup trap
cleanup() {
  echo "→ Cleaning up temp container..."
  docker rm -f "$TEMP_CONTAINER_NAME" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# Wait for Postgres to be ready
RETRY_COUNT=0
while [ "$RETRY_COUNT" -lt 30 ]; do
  if docker exec "$TEMP_CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
    break
  fi
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$RETRY_COUNT" -ge 30 ]; then
  echo "✗ Postgres container failed to start within 30 seconds." >&2
  exit 1
fi

echo "→ Restoring backup into temporary database..."

# Restore backup
TEMP_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${TEMP_PORT}/${POSTGRES_DB}"

if ! pg_restore "$TEMP_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$LATEST_BACKUP" 2>&1 | head -20; then
  echo "✗ Failed to restore backup. Dump file may be corrupted." >&2
  exit 1
fi

# Run smoke queries
echo "→ Running smoke queries..."

USERS_COUNT=$(psql "$TEMP_DATABASE_URL" -t -c "SELECT count(*) FROM users;" 2>/dev/null | xargs)
FIXTURES_COUNT=$(psql "$TEMP_DATABASE_URL" -t -c "SELECT count(*) FROM football_fixtures;" 2>/dev/null | xargs)
LATEST_MIGRATION=$(psql "$TEMP_DATABASE_URL" -t -c "SELECT max(applied_at) FROM _migrations;" 2>/dev/null | xargs)

if [ -z "$USERS_COUNT" ] || [ -z "$FIXTURES_COUNT" ]; then
  echo "✗ Smoke queries failed. Database schema may be invalid." >&2
  exit 1
fi

if [ "$USERS_COUNT" -eq 0 ]; then
  echo "⚠  Warning: backup contains zero users. Expected non-empty production backup." >&2
fi

# Summary
echo "✓ backup verified: $USERS_COUNT users, $FIXTURES_COUNT fixtures, latest migration $(date -d "@${LATEST_MIGRATION:0:10}" +%Y-%m-%d 2>/dev/null || echo "unknown")"
exit 0
