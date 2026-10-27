#!/usr/bin/env bash
# Hisab Mezgeb Backup Freshness Monitor
# Alerts if no backup exists or if the latest backup is older than 36 hours.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
MAX_AGE_HOURS=36
ALERT_LOG="/var/log/hisab-backup-alert.log"

send_alert() {
  local msg="$1"
  local subject="[HISAB MEZGEB BACKUP ALERT] Backup Freshness Warning"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%d %H:%M:%SZ")"
  
  # Log alert locally
  echo "[$timestamp] ALERT: $msg" >&2
  if [ -w "$(dirname "$ALERT_LOG")" ] || [ -w "$ALERT_LOG" ]; then
    echo "[$timestamp] ALERT: $msg" >> "$ALERT_LOG"
  fi

  # Attempt system mail if mail command is installed
  if command -v mail >/dev/null 2>&1; then
    echo "$msg" | mail -s "$subject" root || true
  elif command -v sendmail >/dev/null 2>&1; then
    printf "Subject: %s\nTo: root\n\n%s\n" "$subject" "$msg" | sendmail root || true
  fi
}

if [ ! -d "$BACKUP_DIR" ]; then
  send_alert "Backup directory '$BACKUP_DIR' does not exist! No backups have been created."
  exit 1
fi

LATEST_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "hisab-*.dump" -o -name "hisab-*.dump.age" \) -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | cut -d' ' -f2- || true)"

# Fallback for systems without GNU find -printf (e.g. macOS / BSD)
if [ -z "$LATEST_BACKUP" ]; then
  LATEST_BACKUP="$(ls -t "$BACKUP_DIR"/hisab-*.dump "$BACKUP_DIR"/hisab-*.dump.age 2>/dev/null | head -n1 || true)"
fi

if [ -z "$LATEST_BACKUP" ]; then
  send_alert "CRITICAL: No backup files found in '$BACKUP_DIR'! Database is unprotected."
  exit 1
fi

NOW_SEC="$(date +%s)"
FILE_SEC="$(date -r "$LATEST_BACKUP" +%s 2>/dev/null || stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP" 2>/dev/null)"
DIFF_SEC=$((NOW_SEC - FILE_SEC))
DIFF_HOURS=$((DIFF_SEC / 3600))

echo "Latest backup: $(basename "$LATEST_BACKUP")"
echo "Age: $DIFF_HOURS hours (Threshold: $MAX_AGE_HOURS hours)"

if [ "$DIFF_HOURS" -ge "$MAX_AGE_HOURS" ]; then
  send_alert "CRITICAL: Latest backup '$(basename "$LATEST_BACKUP")' is $DIFF_HOURS hours old (exceeds 36-hour maximum threshold)!"
  exit 1
fi

echo "Status: OK (Backup is fresh)"
exit 0
