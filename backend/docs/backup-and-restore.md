# Hisab Mezgeb Database Backup and Restore Runbook

This runbook describes how database backups, encryption, verification tests, and disaster recovery restores work for the Hisab Mezgeb PostgreSQL database.

---

## 1. Why We Backup and What It Protects

The Hisab Mezgeb database contains critical financial records:
- Family money records (`daily_incomes`, `daily_expenses`, `funding_entries`)
- Customer credit and debt records (`debt_customers`, `debt_borrow_records`, `debt_payments`)
- User accounts and authentication tokens

### What Backups Protect Against
- Accidental server or disk loss
- Database corruption or damaged storage volumes
- Catastrophic human mistakes or hostile actions

### What Backups Do NOT Do
- A backup does not fix incorrect numbers entered by business logic bugs.
- Application soft-delete behavior (`deletedAt IS NOT NULL`) remains intact inside the database.

---

## 2. Recovery Point Objective (RPO)

- **RPO: ~24 hours**
- The scheduled backup runs once every 24 hours at **02:00 Africa/Addis_Ababa time** (**23:00 UTC**).
- **The risk window:** Any records entered between the most recent 02:00 EAT backup and a failure incident cannot be recovered from the daily snapshot (maximum 24 hours of data loss).

---

## 3. Architecture & Key Decisions

| Decision | Selected Strategy | Rationale / Detail |
|---|---|---|
| **DECISION 1: Production Database** | Managed cloud database (e.g. Supabase / Neon / AWS RDS) | Cloud provider provides automated point-in-time recovery. Our scripts provide independent, portable, off-site snapshots as a second layer of defense. |
| **DECISION 2: Off-Site Storage** | Cloudflare R2 (or Backblaze B2) | **100% Free**: Cloudflare R2 includes 10 GB free permanent storage with **$0 egress fees** (unlike AWS S3 which charges for downloads). Uses standard S3-compatible API. |
| **DECISION 3: Key Custody** | Offline Master Machine / Cold Storage | Only the **public key** (`BACKUP_AGE_RECIPIENT`) is present on the server. The **private identity key** is never stored on the server or in Git. |
| **Alerting Channel** | Local cron alert log & system mail | Alerts logged to `/var/log/hisab-backup-alert.log` and dispatched to local root mail. |

---

## 4. Prerequisites

To run backups and restores, the following command-line tools are required:

1. **PostgreSQL Client Tools (`pg_dump`, `pg_restore`, `psql`)**:
   - Ubuntu/Debian: `sudo apt-get install -y postgresql-client`
   - macOS: `brew install libpq`
   - Windows: Install PostgreSQL or Docker Desktop
2. **`age` Encryption Tool**:
   - Ubuntu/Debian: `sudo apt-get install -y age`
   - macOS: `brew install age`
   - Windows: `winget install FiloSottile.age` or download from [age GitHub Releases](https://github.com/FiloSottile/age/releases)
3. **AWS CLI or Rclone** (for off-site upload):
   - `sudo apt-get install -y awscli` or `sudo apt-get install -y rclone`

---

## 5. Key Generation (One-Time Setup)

On your **offline master machine** (not the server):

```bash
# Generate a new keypair using age
age-keygen -o hisab-backup-key.txt
```

This outputs:
```text
# created: 2026-10-26T22:30:00Z
# public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p
AGE-SECRET-KEY-1...
```

- **Public Key** (`age1...`): Set as `BACKUP_AGE_RECIPIENT` in the server environment / `.env`.
- **Secret Key** (`AGE-SECRET-KEY-1...`): Store in your offline password manager or encrypted USB drive. **NEVER commit it or place it on the production server.**

---

## 6. How to Take a Backup

Run `backup.sh`:

```bash
export BACKUP_AGE_RECIPIENT="age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"
export DATABASE_URL="postgresql://user:password@host:port/dbname?schema=hisab"

./backend/scripts/backup.sh
```

### What `backup.sh` Does:
1. Validates that `age` and `pg_dump` exist.
2. Reads `DATABASE_URL` safely without printing or logging credentials.
3. Runs `pg_dump --format=custom --no-owner --no-privileges`.
4. Writes `backups/hisab-<UTC_TIMESTAMP>.dump`.
5. Computes `hisab-<UTC_TIMESTAMP>.dump.sha256`.
6. Encrypts the dump into `hisab-<UTC_TIMESTAMP>.dump.age`.
7. Computes `hisab-<UTC_TIMESTAMP>.dump.age.sha256`.
8. Fails closed (exits non-zero and cleans up partial files on any error).

---

## 7. How to Verify a Backup (`verify-restore.sh`)

A backup that has never been restored is not a backup. The verification script tests recovery automatically:

```bash
./backend/scripts/verify-restore.sh
```

### What `verify-restore.sh` Does:
1. Picks the latest backup file in `backups/`.
2. Creates a temporary scratch database (e.g. `hisab_scratch_verify_20261026_230000`).
3. Restores the dump into the scratch database.
4. Compares the source database vs. the scratch database:
   - Row count of every table in the `hisab` schema (`accounts`, `daily_incomes`, `debt_customers`, etc.)
   - Financial sums of active records (`deletedAt IS NULL`):
     - `DailyIncome.amount`
     - `DailyExpense.amount`
     - `DebtBorrowRecord.amount`
     - `DebtPayment.amount`
5. Prints a formatted `PASS`/`FAIL` comparison table.
6. Automatically drops the scratch database upon completion.
7. Exits with code `0` if all metrics match, or code `1` if any discrepancy exists.

---

## 8. How to Restore Step-by-Step

### Scenario A: Testing in a Scratch Database (Default / Safe)

By default, `restore.sh` never touches your live database. It generates or targets a scratch database:

```bash
# Restores into a newly generated scratch database
./backend/scripts/restore.sh backups/hisab-20261026T230000Z.dump
```

If the dump is encrypted (`.age`), supply your offline private key:

```bash
export BACKUP_AGE_IDENTITY="/path/to/hisab-backup-key.txt"
./backend/scripts/restore.sh backups/hisab-20261026T230000Z.dump.age
```

### Scenario B: Restoring into Production / Live Database (Disaster Recovery)

To prevent accidental data loss, restoring into a named production database requires:
1. An explicit database name or connection string.
2. The `--force` flag.
3. Interactive typed confirmation (`RESTORE_TO_LIVE_DATABASE`).

```bash
./backend/scripts/restore.sh backups/hisab-20261026T230000Z.dump hisab_mezgeb --force
```

When prompted:
```text
======================================================================
ATTENTION: You are requesting a restore into NON-SCRATCH DATABASE:
Target: hisab_mezgeb
======================================================================
To confirm destructive restore to this database, type:
  RESTORE_TO_LIVE_DATABASE
Confirmation: RESTORE_TO_LIVE_DATABASE
```

---

## 9. Retention Policy (`retention.sh`)

Backups are pruned according to the standard GFS (Grandfather-Father-Son) rule:
- **7 Daily backups** (one per day for the last 7 active backup days)
- **4 Weekly backups** (one per week for the last 4 weeks)
- **6 Monthly backups** (one per month for the last 6 months)
- **Safety guarantee:** The newest backup is **NEVER** deleted, regardless of age.

```bash
# Preview what would be kept and deleted (dry-run, default)
./backend/scripts/retention.sh

# Apply changes permanently
./backend/scripts/retention.sh --apply
```

---

## 10. Automated Schedule & Monitoring

### Cron Schedule
- Target Local Time: **02:00 Africa/Addis_Ababa** (EAT, UTC+3)
- Converted UTC Time: **23:00 UTC** (previous evening)
- Cron entry:

```cron
# Run daily at 02:00 EAT (23:00 UTC)
0 23 * * * /path/to/hisabmezgeb/backend/scripts/run-scheduled-backup.sh >> /var/log/hisab-backup.log 2>&1

# Check freshness every 6 hours
0 */6 * * * /path/to/hisabmezgeb/backend/scripts/check-freshness.sh >> /var/log/hisab-freshness.log 2>&1
```

### 36-Hour Freshness Alert
`backend/scripts/check-freshness.sh` inspects the timestamps of all backups in `backups/`. If the newest backup is older than 36 hours, it triggers an alert and logs to `/var/log/hisab-backup-alert.log`.

---

## 11. Off-Site Cloud Upload Setup (Cloudflare R2 Free Tier)

1. Sign up for a free Cloudflare account and create an **R2 Bucket** named `hisab-mezgeb-backups`.
2. Generate an **R2 API Token** with `Object Read & Write` permissions.
3. Configure the following environment variables on the backup runner:

```bash
export S3_BUCKET_NAME="hisab-mezgeb-backups"
export S3_ENDPOINT_URL="https://<YOUR_CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="<YOUR_R2_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<YOUR_R2_SECRET_ACCESS_KEY>"
export AWS_DEFAULT_REGION="auto"
```

4. Run `offsite-upload.sh`:
```bash
./backend/scripts/offsite-upload.sh backups/hisab-20261026T230000Z.dump.age
```
*Note: `offsite-upload.sh` strictly refuses to upload unencrypted `.dump` files.*

---

## 12. Troubleshooting Checklist (When a Backup Fails)

If an alert triggers:
1. **Check alert logs**:
   ```bash
   tail -n 50 /var/log/hisab-backup-alert.log
   tail -n 50 /var/log/hisab-backup.log
   ```
2. **Verify database connectivity**:
   - Check if database host/port is reachable.
   - Verify that credentials in `DATABASE_URL` have not expired.
3. **Verify disk space**:
   ```bash
   df -h
   ```
4. **Verify tools & keys**:
   - Check `age --version` and `pg_dump --version`.
   - Ensure `BACKUP_AGE_RECIPIENT` is set and valid.
5. **Run a manual backup**:
   ```bash
   ./backend/scripts/backup.sh
   ```
