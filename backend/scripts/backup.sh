#!/usr/bin/env bash
# Hisab Mezgeb Database Backup Script
# Fail closed: exit immediately on error, unset variable, or pipe failure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

# 1. Dependency Checks: age
if ! command -v age >/dev/null 2>&1; then
  echo "Error: 'age' encryption tool is not installed." >&2
  echo "Age is required to encrypt backups before they leave the machine." >&2
  echo "" >&2
  echo "How to install age:" >&2
  echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y age" >&2
  echo "  macOS:         brew install age" >&2
  echo "  Windows:       winget install FiloSottile.age (or download from https://github.com/FiloSottile/age/releases)" >&2
  echo "  Go:            go install filippo.io/age/cmd/...@latest" >&2
  exit 1
fi

# 2. Check Encryption Key
if [ -z "${BACKUP_AGE_RECIPIENT:-}" ]; then
  echo "Error: BACKUP_AGE_RECIPIENT environment variable is not set." >&2
  echo "A public age recipient key (starts with 'age1...') is required." >&2
  echo "Example: export BACKUP_AGE_RECIPIENT=\"age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p\"" >&2
  echo "The private key must never be kept on the server or in the repo." >&2
  exit 1
fi

# 3. Check DATABASE_URL (never printed)
if [ -z "${DATABASE_URL:-}" ]; then
  # Check if .env file exists in PROJECT_ROOT and source DATABASE_URL if present
  if [ -f "$PROJECT_ROOT/.env" ]; then
    # Safely extract DATABASE_URL without echoing
    DATABASE_URL="$(grep -v '^[[:space:]]*#' "$PROJECT_ROOT/.env" | grep -E '^[[:space:]]*DATABASE_URL=' | head -n1 | sed -E 's/^[[:space:]]*DATABASE_URL=["]?([^"]*)["]?/\1/' || true)"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set in the environment or backend/.env." >&2
  exit 1
fi

# 4. Check for pg_dump: host vs docker container
USE_DOCKER=false
DOCKER_CONTAINER="hisab_mezgeb_postgres"

if command -v pg_dump >/dev/null 2>&1; then
  PG_DUMP_CMD="pg_dump"
elif command -v docker >/dev/null 2>&1 && docker ps --filter "name=$DOCKER_CONTAINER" --filter "status=running" -q | grep -q .; then
  USE_DOCKER=true
else
  echo "Error: 'pg_dump' was not found on PATH, and local Docker container '$DOCKER_CONTAINER' is not running." >&2
  echo "Please install postgresql-client (e.g. 'sudo apt-get install -y postgresql-client') or start Docker." >&2
  exit 1
fi

# Utility for SHA256 hashing
hash_file() {
  local target_file="$1"
  local output_hash_file="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target_file" > "$output_hash_file"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$target_file" > "$output_hash_file"
  else
    echo "Error: Neither sha256sum nor shasum is available for checksum verification." >&2
    exit 1
  fi
}

mkdir -p "$BACKUP_DIR"

# Timestamp in UTC: YYYYMMDDTHHMMSSZ
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
DUMP_FILE="$BACKUP_DIR/hisab-$TIMESTAMP.dump"
ENC_FILE="$DUMP_FILE.age"
SHA_FILE="$DUMP_FILE.sha256"
ENC_SHA_FILE="$ENC_FILE.sha256"

echo "=== Hisab Mezgeb Backup Started [UTC: $TIMESTAMP] ==="
echo "Destination directory: $BACKUP_DIR"
echo "Creating database dump..."

# Cleanup partial files on failure
cleanup_on_failure() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "Backup failed with exit code $exit_code! Cleaning up incomplete files..." >&2
    rm -f "$DUMP_FILE" "$ENC_FILE" "$SHA_FILE" "$ENC_SHA_FILE" 2>/dev/null || true
  fi
}
trap cleanup_on_failure EXIT

# Run pg_dump without printing connection details
if [ "$USE_DOCKER" = "true" ]; then
  echo "Using Docker container '$DOCKER_CONTAINER' for dump..."
  docker exec -i "$DOCKER_CONTAINER" pg_dump \
    -U postgres \
    --format=custom \
    --no-owner \
    --no-privileges \
    hisab_mezgeb > "$DUMP_FILE"
else
  pg_dump \
    "$DATABASE_URL" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file="$DUMP_FILE"
fi

if [ ! -s "$DUMP_FILE" ]; then
  echo "Error: Dump file was created but is empty." >&2
  exit 1
fi

echo "Database dump created: $(basename "$DUMP_FILE") ($(du -h "$DUMP_FILE" | cut -f1))"

# Generate SHA256 for the unencrypted dump
hash_file "$DUMP_FILE" "$SHA_FILE"
echo "Dump SHA256 generated: $(basename "$SHA_FILE")"

# Encrypt using age with public recipient key
echo "Encrypting dump with age public key..."
age --recipient "$BACKUP_AGE_RECIPIENT" --output "$ENC_FILE" "$DUMP_FILE"

if [ ! -s "$ENC_FILE" ]; then
  echo "Error: Encrypted file is empty." >&2
  exit 1
fi

# Generate SHA256 for the encrypted dump
hash_file "$ENC_FILE" "$ENC_SHA_FILE"
echo "Encrypted dump created: $(basename "$ENC_FILE") ($(du -h "$ENC_FILE" | cut -f1))"
echo "Encrypted SHA256 generated: $(basename "$ENC_SHA_FILE")"

# Disarm trap since backup succeeded
trap - EXIT

echo "=== Backup Completed Successfully ==="
echo "Raw dump:       $DUMP_FILE"
echo "Encrypted dump: $ENC_FILE"
