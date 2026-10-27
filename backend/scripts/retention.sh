#!/usr/bin/env bash
# Hisab Mezgeb Backup Retention Policy Script
# Policy: Keep 7 daily, 4 weekly, 6 monthly.
# Safety: NEVER delete the newest backup. Defaults to DRY-RUN mode.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

APPLY=false
for arg in "$@"; do
  if [ "$arg" = "--apply" ]; then
    APPLY=true
  fi
done

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Backups directory does not exist: $BACKUP_DIR"
  exit 0
fi

echo "=== Backup Retention Evaluation ==="
echo "Directory: $BACKUP_DIR"
if [ "$APPLY" = "true" ]; then
  echo "Mode: APPLY (unneeded files will be permanently deleted)"
else
  echo "Mode: DRY-RUN (no files will be deleted; use --apply to enforce)"
fi
echo ""

# Find all base backup timestamps
# Format: hisab-YYYYMMDDTHHMMSSZ.dump[.age]
mapfile -t BACKUP_FILES < <(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "hisab-*.dump" -o -name "hisab-*.dump.age" \) | sort -r || true)

if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
  echo "No backup files found."
  exit 0
fi

declare -A KEPT_FILES
declare -A KEEP_REASONS

# 1. Protect the newest backup unconditionally
NEWEST="${BACKUP_FILES[0]}"
KEPT_FILES["$NEWEST"]=1
KEEP_REASONS["$NEWEST"]="newest backup"

DAILY_COUNT=0
WEEKLY_COUNT=0
MONTHLY_COUNT=0

declare -A SEEN_DAYS
declare -A SEEN_WEEKS
declare -A SEEN_MONTHS

for file in "${BACKUP_FILES[@]}"; do
  # Extract timestamp from filename: hisab-YYYYMMDDTHHMMSSZ...
  BASE_NAME="$(basename "$file")"
  TIMESTAMP_STR="$(echo "$BASE_NAME" | sed -E 's/^hisab-([0-9]{8}T[0-9]{6}Z).*/\1/' || true)"

  if [ -z "$TIMESTAMP_STR" ] || [ ${#TIMESTAMP_STR} -lt 15 ]; then
    # If filename format doesn't match standard timestamp, keep it safely
    KEPT_FILES["$file"]=1
    KEEP_REASONS["$file"]="non-standard name (safe keep)"
    continue
  fi

  YYYY="${TIMESTAMP_STR:0:4}"
  MM="${TIMESTAMP_STR:4:2}"
  DD="${TIMESTAMP_STR:6:2}"
  DAY_KEY="$YYYY-$MM-$DD"

  # Convert day to week number (using date utility)
  WEEK_KEY="$(date -u -d "$DAY_KEY" +%Y-W%U 2>/dev/null || date -u -j -f "%Y-%m-%d" "$DAY_KEY" +%Y-W%U 2>/dev/null || echo "$YYYY-W$(( 10#$DD / 7 ))")"
  MONTH_KEY="$YYYY-$MM"

  REASON=""

  # Check Daily (up to 7 days)
  if [ -z "${SEEN_DAYS[$DAY_KEY]:-}" ] && [ $DAILY_COUNT -lt 7 ]; then
    SEEN_DAYS["$DAY_KEY"]=1
    SEEN_WEEKS["$WEEK_KEY"]=1
    SEEN_MONTHS["$MONTH_KEY"]=1
    DAILY_COUNT=$((DAILY_COUNT + 1))
    REASON="daily #$DAILY_COUNT ($DAY_KEY)"
  fi

  # Check Weekly (up to 4 weeks)
  if [ -z "$REASON" ] && [ -z "${SEEN_WEEKS[$WEEK_KEY]:-}" ] && [ $WEEKLY_COUNT -lt 4 ]; then
    SEEN_WEEKS["$WEEK_KEY"]=1
    SEEN_MONTHS["$MONTH_KEY"]=1
    WEEKLY_COUNT=$((WEEKLY_COUNT + 1))
    REASON="weekly #$WEEKLY_COUNT ($WEEK_KEY)"
  fi

  # Check Monthly (up to 6 months)
  if [ -z "$REASON" ] && [ -z "${SEEN_MONTHS[$MONTH_KEY]:-}" ] && [ $MONTHLY_COUNT -lt 6 ]; then
    SEEN_MONTHS["$MONTH_KEY"]=1
    MONTHLY_COUNT=$((MONTHLY_COUNT + 1))
    REASON="monthly #$MONTHLY_COUNT ($MONTH_KEY)"
  fi

  if [ -n "$REASON" ]; then
    KEPT_FILES["$file"]=1
    KEEP_REASONS["$file"]="$REASON"
  fi
done

TO_DELETE=()

echo "--- Retained Backups ---"
for file in "${BACKUP_FILES[@]}"; do
  if [ -n "${KEPT_FILES["$file"]:-}" ]; then
    printf "KEEP:   %-35s  [%s]\n" "$(basename "$file")" "${KEEP_REASONS["$file"]}"
  else
    TO_DELETE+=("$file")
  fi
done

echo ""
echo "--- Backups to Purge ---"
if [ ${#TO_DELETE[@]} -eq 0 ]; then
  echo "None. All backups fall within the retention policy."
else
  for file in "${TO_DELETE[@]}"; do
    printf "DELETE: %-35s  [exceeds 7d/4w/6m retention]\n" "$(basename "$file")"
    
    if [ "$APPLY" = "true" ]; then
      # Delete data file and any related sha256 or unencrypted dump
      BASE_NO_EXT="${file%.age}"
      rm -f "$file" "$file.sha256" "$BASE_NO_EXT" "$BASE_NO_EXT.sha256"
      echo "  -> Deleted."
    fi
  done
fi

echo ""
if [ "$APPLY" = "false" ] && [ ${#TO_DELETE[@]} -gt 0 ]; then
  echo "Reminder: Run '$0 --apply' to permanently remove the marked files."
fi
