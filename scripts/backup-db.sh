#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Database Backup Script — Scorepion
# Creates a compressed dump of the MySQL database with rotation
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Load environment
if [ -f ".env" ]; then
  export $(grep -E "^DATABASE_URL=" .env | xargs)
fi

DATABASE_URL="${DATABASE_URL:-}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/scorepion_${TIMESTAMP}.sql.gz"

# Validation
if [ -z "$DATABASE_URL" ]; then
  echo "✗ Error: DATABASE_URL not set. Configure in .env or set as environment variable." >&2
  exit 1
fi

# Parse MySQL URL: mysql://user:pass@host:port/dbname
MYSQL_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
MYSQL_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
MYSQL_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@([^:]+):.*|\1|')
MYSQL_PORT=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
MYSQL_DB=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^/]+/([^?]+).*|\1|')

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# Ensure .gitignore entry (non-destructive)
if [ ! -f "$BACKUP_DIR/.gitignore" ]; then
  echo "*" > "$BACKUP_DIR/.gitignore"
fi

# Run backup
echo "→ Backing up database to $BACKUP_FILE..."
if ! mysqldump \
  -h "$MYSQL_HOST" \
  -P "$MYSQL_PORT" \
  -u "$MYSQL_USER" \
  -p"$MYSQL_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --no-tablespaces \
  "$MYSQL_DB" 2>/dev/null | gzip > "$BACKUP_FILE"; then
  echo "✗ Backup failed. Check DATABASE_URL and MySQL connectivity." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Check file size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
if [ ! -s "$BACKUP_FILE" ]; then
  echo "✗ Backup file is empty. Aborting." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Rotation: keep last 7 daily backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "scorepion_*.sql.gz" -type f | wc -l)
if [ "$BACKUP_COUNT" -gt 7 ]; then
  EXCESS=$((BACKUP_COUNT - 7))
  echo "→ Rotating backups: removing $EXCESS old files..."
  find "$BACKUP_DIR" -maxdepth 1 -name "scorepion_*.sql.gz" -type f -printf '%T+ %p\n' \
    | sort \
    | head -n "$EXCESS" \
    | cut -d' ' -f2- \
    | xargs -I {} rm -f {}
fi

# Summary
echo "✓ backup written: ${BACKUP_FILE} (${SIZE})"
exit 0
