#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Database Restore Script — Scorepion
# Restores the database from a backup dump file
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Load environment
if [ -f ".env" ]; then
  export $(grep -E "^DATABASE_URL=" .env | xargs)
fi

DATABASE_URL="${DATABASE_URL:-}"
BACKUP_FILE="${1:-}"

# Validation
if [ -z "$DATABASE_URL" ]; then
  echo "✗ Error: DATABASE_URL not set. Configure in .env or set as environment variable." >&2
  exit 1
fi

if [ -z "$BACKUP_FILE" ]; then
  echo "✗ Error: no backup file specified." >&2
  echo "Usage: bash scripts/restore-db.sh <backup-file>" >&2
  echo "Example: bash scripts/restore-db.sh backups/scorepion_2026-04-21_153000.sql.gz" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "✗ Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# Parse MySQL URL: mysql://user:pass@host:port/dbname
MYSQL_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):.*|\1|')
MYSQL_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
MYSQL_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@([^:]+):.*|\1|')
MYSQL_PORT=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
MYSQL_DB=$(echo "$DATABASE_URL" | sed -E 's|mysql://[^/]+/([^?]+).*|\1|')

# Confirmation prompt
echo "⚠  This will DESTROY the current database and replace it with the backup."
echo "   Backup file: $BACKUP_FILE"
read -p "Type 'restore' to continue: " CONFIRM

if [ "$CONFIRM" != "restore" ]; then
  echo "✗ Restore cancelled."
  exit 0
fi

echo "→ Restoring database from $BACKUP_FILE..."

if echo "$BACKUP_FILE" | grep -q '\.gz$'; then
  # Gzipped SQL file
  if ! gunzip -c "$BACKUP_FILE" | mysql \
    -h "$MYSQL_HOST" \
    -P "$MYSQL_PORT" \
    -u "$MYSQL_USER" \
    -p"$MYSQL_PASS" \
    "$MYSQL_DB" 2>&1; then
    echo "✗ Restore failed. Check DATABASE_URL, MySQL connectivity, and dump file integrity." >&2
    exit 1
  fi
else
  # Plain SQL file
  if ! mysql \
    -h "$MYSQL_HOST" \
    -P "$MYSQL_PORT" \
    -u "$MYSQL_USER" \
    -p"$MYSQL_PASS" \
    "$MYSQL_DB" < "$BACKUP_FILE" 2>&1; then
    echo "✗ Restore failed. Check DATABASE_URL, MySQL connectivity, and dump file integrity." >&2
    exit 1
  fi
fi

echo "✓ database restored successfully"
exit 0
