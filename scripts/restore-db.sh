#!/usr/bin/env bash
# ==============================================================================
# TezuKitchen — PostgreSQL Restore Script
#
# Restores a compressed pg_dump backup into the postgres container.
# Requires an interactive confirmation prompt before overwriting the database.
#
# Usage:
#   ./scripts/restore-db.sh backups/tezukitchen_20260916_020000.sql.gz
#
# Environment variables (read from .env if present):
#   DATABASE_USERNAME  — PostgreSQL user   (default: tezukitchen)
#   POSTGRES_CONTAINER — container name    (default: tezukitchen-postgres)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if it exists
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Configuration
DB_USER="${DATABASE_USERNAME:-tezukitchen}"
DB_NAME="tezukitchen"
CONTAINER="${POSTGRES_CONTAINER:-tezukitchen-postgres}"

# --- Argument validation ---
if [[ $# -lt 1 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Restores a TezuKitchen database backup."
    echo ""
    echo "Arguments:"
    echo "  backup-file.sql.gz   Path to the compressed backup file"
    echo ""
    echo "Example:"
    echo "  $0 backups/tezukitchen_20260916_020000.sql.gz"
    exit 0
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "ERROR: Backup file is empty: $BACKUP_FILE" >&2
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "========================================"
echo " TezuKitchen Database Restore"
echo "========================================"
echo " Container : $CONTAINER"
echo " Database  : $DB_NAME"
echo " User      : $DB_USER"
echo " Backup    : $BACKUP_FILE ($BACKUP_SIZE)"
echo "========================================"
echo ""
echo "WARNING: This will DROP and RECREATE the '$DB_NAME' database."
echo "All current data will be permanently lost."
echo ""

# --- Confirmation prompt ---
read -rp "Type 'yes' to proceed: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Verify the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container '$CONTAINER' is not running." >&2
    echo "Start it with: docker compose up -d postgres" >&2
    exit 1
fi

echo ""
echo "Step 1/3: Stopping backend to release database connections..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" stop backend 2>/dev/null || true

echo "Step 2/3: Dropping and recreating database..."
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Step 3/3: Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --quiet

echo ""
echo "Restore complete."
echo ""
echo "Restart the backend with:"
echo "  docker compose up -d backend"
