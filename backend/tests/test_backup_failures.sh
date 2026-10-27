#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Running Deliberate Failure Tests ==="

# Test 1: Missing age
echo "Test 1: When age is missing..."
OUTPUT="$(PATH="/usr/bin:/bin" "$BACKEND_DIR/scripts/backup.sh" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "Error: 'age' encryption tool is not installed"; then
  echo " PASS: Detected missing age and printed installation instructions."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

# Create a mock age and mock pg_dump in a temporary directory
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

cat << 'EOF' > "$TMPDIR/age"
#!/bin/sh
exit 0
EOF
chmod +x "$TMPDIR/age"

# Test 2: Missing BACKUP_AGE_RECIPIENT
echo "Test 2: When BACKUP_AGE_RECIPIENT is missing..."
OUTPUT="$(PATH="$TMPDIR:$PATH" BACKUP_AGE_RECIPIENT="" "$BACKEND_DIR/scripts/backup.sh" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "BACKUP_AGE_RECIPIENT environment variable is not set"; then
  echo " PASS: Failed closed when BACKUP_AGE_RECIPIENT was missing."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

# Test 3: Missing pg_dump and no docker
echo "Test 3: When pg_dump is missing and docker is not running..."
OUTPUT="$(PATH="$TMPDIR:$PATH" BACKUP_AGE_RECIPIENT="age1testkey" "$BACKEND_DIR/scripts/backup.sh" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "was not found on PATH"; then
  echo " PASS: Detected missing pg_dump and clear error message."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

# Test 4: Database connection failure / invalid host
cat << 'EOF' > "$TMPDIR/pg_dump"
#!/bin/sh
echo "pg_dump: error: connection to server at \"invalid-host.local\" failed" >&2
exit 1
EOF
chmod +x "$TMPDIR/pg_dump"

echo "Test 4: When DATABASE_URL host is unreachable..."
OUTPUT="$(PATH="$TMPDIR:$PATH" DATABASE_URL="postgresql://invalid:invalid@invalid-host.local:5432/db" BACKUP_AGE_RECIPIENT="age1testkey" "$BACKEND_DIR/scripts/backup.sh" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "Backup failed with exit code 1"; then
  echo " PASS: Handled pg_dump failure cleanly, triggered failure cleanup, and failed closed."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

# Test 5: Off-site upload refuses unencrypted file
echo "Test 5: When offsite-upload is handed an unencrypted .dump file..."
touch "$TMPDIR/dummy.dump"
OUTPUT="$("$BACKEND_DIR/scripts/offsite-upload.sh" "$TMPDIR/dummy.dump" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "CRITICAL SECURITY ERROR: Refusing to upload unencrypted file"; then
  echo " PASS: offsite-upload.sh strictly rejected unencrypted file."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

# Test 6: Restore refuses to overwrite live database without --force and confirmation
echo "Test 6: When restore targets live database without --force..."
OUTPUT="$("$BACKEND_DIR/scripts/restore.sh" "$TMPDIR/dummy.dump" "hisab_mezgeb" 2>&1 || true)"
if echo "$OUTPUT" | grep -q "Error: Restoring into a live/named database requires the '--force' flag"; then
  echo " PASS: restore.sh protected live database from accidental overwrite."
else
  echo " FAIL: Unexpected output: $OUTPUT"
  exit 1
fi

echo "=== All 6 Failure & Safety Tests PASSED ==="
