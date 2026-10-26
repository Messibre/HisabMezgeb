#!/usr/bin/env bash
# Hisab Mezgeb Scheduled Daily Backup Runner
# Scheduled: 02:00 Africa/Addis_Ababa time (UTC+3) -> 23:00 UTC (previous day)
# Cron format (UTC): 0 23 * * * /path/to/backend/scripts/run-scheduled-backup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ALERT_LOG="/var/log/hisab-backup-alert.log"

send_alert() {
  local msg="$1"
  local subject="[HISAB MEZGEB BACKUP ALERT] Scheduled Backup Failure"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%d %H:%M:%SZ")"
  
  echo "[$timestamp] FAILURE: $msg" >&2
  if [ -w "$(dirname "$ALERT_LOG")" ] || [ -w "$ALERT_LOG" ]; then
    echo "[$timestamp] FAILURE: $msg" >> "$ALERT_LOG"
  fi

  if command -v mail >/dev/null 2>&1; then
    echo "$msg" | mail -s "$subject" root || true
  elif command -v sendmail >/dev/null 2>&1; then
    printf "Subject: %s\nTo: root\n\n%s\n" "$subject" "$msg" | sendmail root || true
  fi
}

echo "=== Starting Scheduled Backup at $(date -u +"%Y-%m-%d %H:%M:%SZ") (UTC) ==="

# 1. Execute Backup
if ! "$SCRIPT_DIR/backup.sh"; then
  send_alert "Database backup step failed at $(date -u)!"
  exit 1
fi

# 2. Enforce Retention Policy
echo "Applying retention policy..."
"$SCRIPT_DIR/retention.sh" --apply || echo "Warning: retention script reported errors." >&2

# 3. Off-site Upload (Encrypted only)
LATEST_ENC="$(ls -t "$PROJECT_ROOT"/backups/hisab-*.dump.age 2>/dev/null | head -n1 || true)"
if [ -n "$LATEST_ENC" ]; then
  echo "Uploading encrypted backup off-site..."
  if ! "$SCRIPT_DIR/offsite-upload.sh" "$LATEST_ENC"; then
    send_alert "Off-site upload failed for $(basename "$LATEST_ENC")!"
    exit 1
  fi
fi

# 4. Check Freshness
"$SCRIPT_DIR/check-freshness.sh" || echo "Warning: freshness check failed." >&2

echo "=== Scheduled Backup Finished Successfully ==="
