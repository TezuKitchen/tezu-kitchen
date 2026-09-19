#!/usr/bin/env bash
# ==============================================================================
# TezuKitchen — PostgreSQL Backup Script
#
# Runs pg_dump inside the postgres container, compresses the output with gzip,
# and saves it to the backups/ directory with a timestamped filename.
#
# Usage:
#   ./scripts/backup-db.sh
#   ./scripts/backup-db.sh --keep 7    # delete backups older than 7 days
#
# Environment variables (read from .env if present):
#   DATABASE_USERNAME  — PostgreSQL user   (default: tezukitchen)
#   POSTGRES_CONTAINER — container name    (default: tezukitchen-postgres)
#   BACKUP_DIR         — output directory  (default: ./backups)
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
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/tezukitchen_${TIMESTAMP}.sql.gz"

# Parse arguments
KEEP_DAYS=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --keep)
            KEEP_DAYS="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--keep DAYS]"
            echo ""
            echo "Options:"
            echo "  --keep DAYS   Delete local backups older than DAYS days"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "========================================"
echo " TezuKitchen Database Backup"
echo "========================================"
echo " Container : $CONTAINER"
echo " Database  : $DB_NAME"
echo " User      : $DB_USER"
echo " Output    : $BACKUP_FILE"
echo "========================================"

# Verify the container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container '$CONTAINER' is not running." >&2
    echo "Start it with: docker compose up -d postgres" >&2
    exit 1
fi

# Run pg_dump inside the container and compress
echo "Running pg_dump..."
docker exec "$CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges \
    | gzip > "$BACKUP_FILE"

# Verify the backup file is not empty
if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "ERROR: Backup file is empty. Something went wrong." >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup complete: $BACKUP_FILE ($BACKUP_SIZE)"

# Prune old backups if --keep was specified
if [[ -n "$KEEP_DAYS" ]]; then
    echo "Pruning backups older than $KEEP_DAYS days..."
    DELETED=$(find "$BACKUP_DIR" -name "tezukitchen_*.sql.gz" -mtime +"$KEEP_DAYS" -print -delete | wc -l)
    echo "Deleted $DELETED old backup(s)."
fi

echo "Done."
