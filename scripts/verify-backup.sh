#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Verify Backup Script — Scorepion
# Smoke-tests the latest backup by loading it into a temp database
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="./backups"
TEMP_CONTAINER_NAME="scorepion_backup_verify_$$"
TEMP_PORT=$((15306 + RANDOM % 1000))
MYSQL_USER="root"
MYSQL_PASSWORD="root_temp_$$"
MYSQL_DB="scorepion_verify"

# Find most recent backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -maxdepth 1 -name "scorepion_*.sql.gz" -type f -printf '%T+ %p\n' \
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

# Spin up temp MySQL container
echo "→ Starting temporary MySQL container on port $TEMP_PORT..."
if ! docker run -d \
  --name "$TEMP_CONTAINER_NAME" \
  -e MYSQL_ROOT_PASSWORD="$MYSQL_PASSWORD" \
  -e MYSQL_DATABASE="$MYSQL_DB" \
  -p "$TEMP_PORT:3306" \
  mysql:8.0 \
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

# Wait for MySQL to be ready
RETRY_COUNT=0
while [ "$RETRY_COUNT" -lt 30 ]; do
  if docker exec "$TEMP_CONTAINER_NAME" mysqladmin ping -h 127.0.0.1 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent > /dev/null 2>&1; then
    break
  fi
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$RETRY_COUNT" -ge 30 ]; then
  echo "✗ MySQL container failed to start within 30 seconds." >&2
  exit 1
fi

echo "→ Restoring backup into temporary database..."

# Restore backup
if ! gunzip -c "$LATEST_BACKUP" | mysql \
  -h 127.0.0.1 \
  -P "$TEMP_PORT" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASSWORD" \
  "$MYSQL_DB" 2>&1 | head -20; then
  echo "✗ Failed to restore backup. Dump file may be corrupted." >&2
  exit 1
fi

# Run smoke queries
echo "→ Running smoke queries..."

USERS_COUNT=$(mysql -h 127.0.0.1 -P "$TEMP_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -e "SELECT count(*) FROM users;" "$MYSQL_DB" 2>/dev/null | xargs)
FIXTURES_COUNT=$(mysql -h 127.0.0.1 -P "$TEMP_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -e "SELECT count(*) FROM football_fixtures;" "$MYSQL_DB" 2>/dev/null | xargs)
LATEST_MIGRATION=$(mysql -h 127.0.0.1 -P "$TEMP_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -e "SELECT max(applied_at) FROM _migrations;" "$MYSQL_DB" 2>/dev/null | xargs)

if [ -z "$USERS_COUNT" ] || [ -z "$FIXTURES_COUNT" ]; then
  echo "✗ Smoke queries failed. Database schema may be invalid." >&2
  exit 1
fi

if [ "$USERS_COUNT" -eq 0 ]; then
  echo "⚠  Warning: backup contains zero users. Expected non-empty production backup." >&2
fi

# Summary
echo "✓ backup verified: $USERS_COUNT users, $FIXTURES_COUNT fixtures, latest migration ${LATEST_MIGRATION:-unknown}"
exit 0
