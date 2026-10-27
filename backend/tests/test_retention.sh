#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Testing Retention Policy Script ==="
TMP_BACKUPS="$(mktemp -d)"
trap 'rm -rf "$TMP_BACKUPS"' EXIT

# Create 10 daily backups
for i in {10..1}; do
  DAY=$(printf "%02d" "$i")
  touch "$TMP_BACKUPS/hisab-202610${DAY}T020000Z.dump.age"
  touch "$TMP_BACKUPS/hisab-202610${DAY}T020000Z.dump.age.sha256"
done

# Run dry-run retention
echo "Testing dry-run mode..."
DRY_OUTPUT="$(BACKUP_DIR="$TMP_BACKUPS" "$BACKEND_DIR/scripts/retention.sh")"
if echo "$DRY_OUTPUT" | grep -q "Mode: DRY-RUN" && echo "$DRY_OUTPUT" | grep -q "DELETE:"; then
  echo " PASS: Dry-run correctly identified files to delete without deleting."
else
  echo " FAIL: Dry-run output unexpected: $DRY_OUTPUT"
  exit 1
fi

# Ensure files were NOT deleted in dry-run
COUNT_AFTER_DRY="$(find "$TMP_BACKUPS" -name "*.dump.age" | wc -l)"
if [ "$COUNT_AFTER_DRY" -eq 10 ]; then
  echo " PASS: All 10 files preserved in dry-run."
else
  echo " FAIL: Files were deleted during dry-run!"
  exit 1
fi

# Run apply mode
echo "Testing apply mode..."
APPLY_OUTPUT="$(BACKUP_DIR="$TMP_BACKUPS" "$BACKEND_DIR/scripts/retention.sh" --apply)"
COUNT_AFTER_APPLY="$(find "$TMP_BACKUPS" -name "*.dump.age" | wc -l)"
# 7 daily + 1 weekly from prior week kept; 2 older days in same week pruned
if [ "$COUNT_AFTER_APPLY" -eq 8 ]; then
  echo " PASS: Apply mode kept 7 daily + 1 weekly for prior week, and pruned 2 redundant days."
else
  echo " FAIL: Expected 8 files, found $COUNT_AFTER_APPLY"
  exit 1
fi

# Ensure newest backup was preserved
if [ -f "$TMP_BACKUPS/hisab-20261010T020000Z.dump.age" ]; then
  echo " PASS: Newest backup was strictly preserved."
else
  echo " FAIL: Newest backup was missing!"
  exit 1
fi

echo "=== All Retention Tests PASSED ==="
