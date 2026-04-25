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
  echo "Example: bash scripts/restore-db.sh backups/scorepion_2026-04-21_153000.dump" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "✗ Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# Confirmation prompt
echo "⚠  This will DESTROY the current database and replace it with the backup."
echo "   Backup file: $BACKUP_FILE"
read -p "Type 'restore' to continue: " CONFIRM

if [ "$CONFIRM" != "restore" ]; then
  echo "✗ Restore cancelled."
  exit 0
fi

echo "→ Restoring database from $BACKUP_FILE..."

if ! pg_restore "$DATABASE_URL" \
  --clean \
  --if-exists \
  --verbose \
  --no-owner \
  --no-privileges \
  "$BACKUP_FILE" 2>&1; then
  echo "✗ Restore failed. Check DATABASE_URL, Postgres connectivity, and dump file integrity." >&2
  exit 1
fi

echo "✓ database restored successfully"
exit 0
