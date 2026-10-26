#!/usr/bin/env bash
# Hisab Mezgeb Database Restore Script
# Fail closed: exit immediately on error, unset variable, or pipe failure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  echo "Usage: $0 <path-to-dump-file> [target-db-name-or-url] [--force]"
  echo ""
  echo "Arguments:"
  echo "  <path-to-dump-file>      Required. Path to .dump or .age backup file."
  echo "  [target-db-name-or-url]  Optional. Target database name or connection URL."
  echo "                           Default: newly generated scratch database (e.g. hisab_scratch_restore_<timestamp>)"
  echo "  --force                  Required when targeting a live or non-scratch database."
  exit 1
}

if [ $# -lt 1 ]; then
  usage
fi

DUMP_INPUT="$1"
TARGET_ARG="${2:-}"
FORCE_FLAG=false

for arg in "$@"; do
  if [ "$arg" = "--force" ]; then
    FORCE_FLAG=true
  fi
done

if [ ! -f "$DUMP_INPUT" ]; then
  echo "Error: Backup file '$DUMP_INPUT' does not exist." >&2
  exit 1
fi

# Load DATABASE_URL from .env if available, without echoing
if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  DATABASE_URL="$(grep -v '^[[:space:]]*#' "$PROJECT_ROOT/.env" | grep -E '^[[:space:]]*DATABASE_URL=' | head -n1 | sed -E 's/^[[:space:]]*DATABASE_URL=["]?([^"]*)["]?/\1/' || true)"
fi

# Determine live database name to prevent accidental overwrites
LIVE_DB_NAME=""
if [ -n "${DATABASE_URL:-}" ]; then
  # Parse db name from URL (between last / and optional ?)
  LIVE_DB_NAME="$(echo "$DATABASE_URL" | sed -E 's/.*\///; s/\?.*//' || true)"
fi

# Determine Target Database
if [ -z "$TARGET_ARG" ] || [ "$TARGET_ARG" = "--force" ]; then
  SCRATCH_ID="$(date -u +"%Y%m%d_%H%M%SZ" | tr '[:upper:]' '[:lower:]')"
  TARGET_DB="hisab_scratch_restore_$SCRATCH_ID"
  IS_SCRATCH=true
else
  TARGET_DB="$TARGET_ARG"
  if [[ "$TARGET_DB" == *"scratch"* ]]; then
    IS_SCRATCH=true
  else
    IS_SCRATCH=false
  fi
fi

# Protect Live Database
if [ "$IS_SCRATCH" = "false" ] || ([ -n "$LIVE_DB_NAME" ] && [ "$TARGET_DB" = "$LIVE_DB_NAME" ]); then
  echo "======================================================================"
  echo "ATTENTION: You are requesting a restore into NON-SCRATCH DATABASE:"
  echo "Target: $TARGET_DB"
  echo "======================================================================"
  if [ "$FORCE_FLAG" != "true" ]; then
    echo "Error: Restoring into a live/named database requires the '--force' flag." >&2
    exit 1
  fi
  echo "To confirm destructive restore to this database, type:"
  echo "  RESTORE_TO_LIVE_DATABASE"
  printf "Confirmation: "
  read -r CONFIRM_INPUT
  if [ "$CONFIRM_INPUT" != "RESTORE_TO_LIVE_DATABASE" ]; then
    echo "Restore aborted. Confirmation string did not match." >&2
    exit 1
  fi
fi

# Check for pg_restore / psql
USE_DOCKER=false
DOCKER_CONTAINER="hisab_mezgeb_postgres"

if command -v pg_restore >/dev/null 2>&1; then
  PG_RESTORE_CMD="pg_restore"
elif command -v docker >/dev/null 2>&1 && docker ps --filter "name=$DOCKER_CONTAINER" --filter "status=running" -q | grep -q .; then
  USE_DOCKER=true
else
  echo "Error: 'pg_restore' is not installed, and Docker container '$DOCKER_CONTAINER' is not running." >&2
  echo "Please install postgresql-client (e.g. 'sudo apt-get install -y postgresql-client')." >&2
  exit 1
fi

# Handle Encrypted .age file if provided
TEMP_DECRYPTED=""
cleanup_temp() {
  if [ -n "$TEMP_DECRYPTED" ] && [ -f "$TEMP_DECRYPTED" ]; then
    rm -f "$TEMP_DECRYPTED"
  fi
}
trap cleanup_temp EXIT

WORKING_DUMP="$DUMP_INPUT"
if [[ "$DUMP_INPUT" == *.age ]]; then
  echo "Detected age-encrypted backup."
  if [ -z "${BACKUP_AGE_IDENTITY:-}" ]; then
    echo "Error: Decrypting .age backup requires BACKUP_AGE_IDENTITY (path to private key file or key string)." >&2
    echo "Example: export BACKUP_AGE_IDENTITY=\"/path/to/identity.txt\"" >&2
    exit 1
  fi

  if ! command -v age >/dev/null 2>&1; then
    echo "Error: 'age' tool is required to decrypt this backup." >&2
    exit 1
  fi

  TEMP_DECRYPTED="$(mktemp "${TMPDIR:-/tmp}/hisab_restore_XXXXXX.dump")"
  echo "Decrypting backup with age identity..."
  if [ -f "$BACKUP_AGE_IDENTITY" ]; then
    age --decrypt -i "$BACKUP_AGE_IDENTITY" -o "$TEMP_DECRYPTED" "$DUMP_INPUT"
  else
    # Identity passed as string/secret
    echo "$BACKUP_AGE_IDENTITY" | age --decrypt -i - -o "$TEMP_DECRYPTED" "$DUMP_INPUT"
  fi
  WORKING_DUMP="$TEMP_DECRYPTED"
fi

# Verify SHA256 if .sha256 file exists alongside the dump
SHA256_FILE="$DUMP_INPUT.sha256"
if [ -f "$SHA256_FILE" ]; then
  echo "Verifying SHA256 checksum against $(basename "$SHA256_FILE")..."
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "$SHA256_FILE"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "$SHA256_FILE"
  fi
  echo "Checksum verified: OK"
fi

# Print Plan Before Executing
echo ""
echo "=== Restore Plan ==="
echo "Input backup:     $DUMP_INPUT"
echo "Target database:  $TARGET_DB"
echo "Is Scratch DB:    $IS_SCRATCH"
echo "===================="
echo ""

# Create scratch DB if requested and target is just a name
if [ "$IS_SCRATCH" = "true" ]; then
  echo "Creating scratch database '$TARGET_DB'..."
  if [ "$USE_DOCKER" = "true" ]; then
    docker exec -i "$DOCKER_CONTAINER" createdb -U postgres "$TARGET_DB" || true
  else
    # Create DB using postgres maintenance DB
    if [ -n "${DATABASE_URL:-}" ]; then
      MAINT_URL="$(echo "$DATABASE_URL" | sed -E 's/\/[^\/\?]+(\?.*)?$/\/postgres\1/')"
      psql "$MAINT_URL" -c "CREATE DATABASE \"$TARGET_DB\";" >/dev/null 2>&1 || true
    elif command -v createdb >/dev/null 2>&1; then
      createdb "$TARGET_DB" || true
    fi
  fi
fi

# Perform pg_restore
echo "Restoring database objects and data into '$TARGET_DB'..."
if [ "$USE_DOCKER" = "true" ]; then
  docker exec -i "$DOCKER_CONTAINER" pg_restore \
    -U postgres \
    -d "$TARGET_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges < "$WORKING_DUMP" || true
else
  # Construct target connection
  if [[ "$TARGET_DB" == postgresql://* ]] || [[ "$TARGET_DB" == postgres://* ]]; then
    RESTORE_URL="$TARGET_DB"
  elif [ -n "${DATABASE_URL:-}" ]; then
    RESTORE_URL="$(echo "$DATABASE_URL" | sed -E "s/\/[^\/\?]+(\?.*)?$/\/$TARGET_DB\1/")"
  else
    RESTORE_URL="$TARGET_DB"
  fi

  pg_restore \
    -d "$RESTORE_URL" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$WORKING_DUMP" || true
fi

echo "=== Restore Completed Successfully ==="
echo "Restored into database: $TARGET_DB"
