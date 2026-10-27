#!/usr/bin/env bash
# Hisab Mezgeb Restore Verification Script
# Restores the latest dump into a scratch database, verifies counts & sums,
# prints a clear PASS/FAIL table, and drops the scratch database.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

# Load DATABASE_URL from .env if available, without echoing
if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  DATABASE_URL="$(grep -v '^[[:space:]]*#' "$PROJECT_ROOT/.env" | grep -E '^[[:space:]]*DATABASE_URL=' | head -n1 | sed -E 's/^[[:space:]]*DATABASE_URL=["]?([^"]*)["]?/\1/' || true)"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set." >&2
  exit 1
fi

# Find the latest backup (prefer .dump, then .age)
LATEST_BACKUP=""
if [ -d "$BACKUP_DIR" ]; then
  LATEST_BACKUP="$(ls -t "$BACKUP_DIR"/hisab-*.dump 2>/dev/null | head -n1 || true)"
  if [ -z "$LATEST_BACKUP" ]; then
    LATEST_BACKUP="$(ls -t "$BACKUP_DIR"/hisab-*.dump.age 2>/dev/null | head -n1 || true)"
  fi
fi

if [ -z "$LATEST_BACKUP" ]; then
  echo "Error: No backup found in $BACKUP_DIR to verify." >&2
  exit 1
fi

echo "=== Verifying Backup Restore ==="
echo "Selected backup: $(basename "$LATEST_BACKUP")"

# Generate unique scratch database name
TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
SCRATCH_DB="hisab_scratch_verify_${TIMESTAMP}"

# Determine execution mode: host psql vs docker
USE_DOCKER=false
DOCKER_CONTAINER="hisab_mezgeb_postgres"

if command -v psql >/dev/null 2>&1; then
  PSQL_CMD="psql"
elif command -v docker >/dev/null 2>&1 && docker ps --filter "name=$DOCKER_CONTAINER" --filter "status=running" -q | grep -q .; then
  USE_DOCKER=true
else
  echo "Error: 'psql' is not installed, and Docker container '$DOCKER_CONTAINER' is not running." >&2
  exit 1
fi

# Cleanup Scratch Database on Exit
drop_scratch_db() {
  echo ""
  echo "Cleaning up: Dropping scratch database '$SCRATCH_DB'..."
  if [ "$USE_DOCKER" = "true" ]; then
    docker exec -i "$DOCKER_CONTAINER" dropdb -U postgres --if-exists "$SCRATCH_DB" >/dev/null 2>&1 || true
  else
    MAINT_URL="$(echo "$DATABASE_URL" | sed -E 's/\/[^\/\?]+(\?.*)?$/\/postgres\1/')"
    psql "$MAINT_URL" -c "DROP DATABASE IF EXISTS \"$SCRATCH_DB\";" >/dev/null 2>&1 || true
  fi
  echo "Scratch database dropped."
}
trap drop_scratch_db EXIT

# Run restore into scratch DB
echo "Restoring backup into scratch database '$SCRATCH_DB'..."
"$SCRIPT_DIR/restore.sh" "$LATEST_BACKUP" "$SCRATCH_DB"

# Query runner helper
run_query() {
  local db_target="$1"
  local sql="$2"
  if [ "$USE_DOCKER" = "true" ]; then
    docker exec -i "$DOCKER_CONTAINER" psql -U postgres -d "$db_target" -t -A -c "$sql" 2>/dev/null | tr -d '\r' | xargs
  else
    local target_url
    if [[ "$db_target" == postgresql://* ]] || [[ "$db_target" == postgres://* ]]; then
      target_url="$db_target"
    else
      target_url="$(echo "$DATABASE_URL" | sed -E "s/\/[^\/\?]+(\?.*)?$/\/$db_target\1/")"
    fi
    psql "$target_url" -t -A -c "$sql" 2>/dev/null | tr -d '\r' | xargs
  fi
}

echo ""
echo "=== Running Data Integrity Comparisons ==="

OVERALL_PASS=true
RESULTS=()

TABLES=(
  "accounts"
  "app_settings"
  "daily_incomes"
  "expense_categories"
  "daily_expenses"
  "funding_entries"
  "debt_customers"
  "debt_borrow_records"
  "debt_payments"
  "refresh_tokens"
)

# 1. Compare Row Counts
for table in "${TABLES[@]}"; do
  CHECK_NAME="Count: hisab.$table"
  SQL="SELECT count(*) FROM hisab.\"$table\";"
  
  SRC_VAL="$(run_query "$DATABASE_URL" "$SQL" || echo "ERR")"
  REST_VAL="$(run_query "$SCRATCH_DB" "$SQL" || echo "ERR")"

  if [ "$SRC_VAL" != "ERR" ] && [ "$SRC_VAL" = "$REST_VAL" ]; then
    STATUS="PASS"
  else
    STATUS="FAIL"
    OVERALL_PASS=false
  fi
  RESULTS+=("$CHECK_NAME|$SRC_VAL|$REST_VAL|$STATUS")
done

# 2. Compare Financial Sums (only active rows: deletedAt IS NULL)
FINANCIAL_CHECKS=(
  "Sum: DailyIncome.amount|SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM hisab.daily_incomes WHERE \"deletedAt\" IS NULL;"
  "Sum: DailyExpense.amount|SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM hisab.daily_expenses WHERE \"deletedAt\" IS NULL;"
  "Sum: DebtBorrowRecord.amount|SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM hisab.debt_borrow_records WHERE \"deletedAt\" IS NULL;"
  "Sum: DebtPayment.amount|SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM hisab.debt_payments WHERE \"deletedAt\" IS NULL;"
)

for check_def in "${FINANCIAL_CHECKS[@]}"; do
  CHECK_LABEL="$(echo "$check_def" | cut -d'|' -f1)"
  CHECK_SQL="$(echo "$check_def" | cut -d'|' -f2)"

  SRC_VAL="$(run_query "$DATABASE_URL" "$CHECK_SQL" || echo "ERR")"
  REST_VAL="$(run_query "$SCRATCH_DB" "$CHECK_SQL" || echo "ERR")"

  if [ "$SRC_VAL" != "ERR" ] && [ "$SRC_VAL" = "$REST_VAL" ]; then
    STATUS="PASS"
  else
    STATUS="FAIL"
    OVERALL_PASS=false
  fi
  RESULTS+=("$CHECK_LABEL|$SRC_VAL|$REST_VAL|$STATUS")
done

# Print Output Table
echo ""
printf "%-32s | %-16s | %-16s | %-8s\n" "Verification Check" "Source Database" "Restored Scratch" "Status"
printf "%-32s-+-%-16s-+-%-16s-+-%-8s\n" "--------------------------------" "----------------" "----------------" "--------"

for row in "${RESULTS[@]}"; do
  NAME="$(echo "$row" | cut -d'|' -f1)"
  SRC="$(echo "$row" | cut -d'|' -f2)"
  REST="$(echo "$row" | cut -d'|' -f3)"
  STAT="$(echo "$row" | cut -d'|' -f4)"
  printf "%-32s | %-16s | %-16s | %-8s\n" "$NAME" "$SRC" "$REST" "$STAT"
done

printf "%-32s-+-%-16s-+-%-16s-+-%-8s\n" "--------------------------------" "----------------" "----------------" "--------"

if [ "$OVERALL_PASS" = "true" ]; then
  echo ""
  echo ">>> VERIFICATION RESULT: PASS (All source and restored metrics match 100%) <<<"
  exit 0
else
  echo ""
  echo ">>> VERIFICATION RESULT: FAIL (One or more discrepancies detected!) <<<" >&2
  exit 1
fi
