# Deploy and rollback

## Before each batch

1. Tag the commit that is live now: `git tag pre-batch-A <live-commit> && git push origin pre-batch-A`.
2. Take a backup and run the restore check (`backend/scripts/backup.sh`, then `backend/scripts/verify-restore.sh <file>`). Write the file name here.
3. Deploy in the evening, after dad's nightly entry.
4. After the deploy, make one test entry and check the three numbers on Home.

| Batch | Tag before | Backup file | Deployed | Checked by |
|---|---|---|---|---|
| A (WP1–WP3) | | | | |
| B (WP4–WP9) | | | | |
| C (WP10–WP11) | | | | |

## Migrations

- Existing: `20260902072355_firstgeneration` (creates all tables; nothing drops data).
- Pending on this branch: **none**. Schema changes are held until a backup is verified (see `docs/security-and-data-audit.md`).
- When one is added: test it on a restored copy first, deploy with `npx prisma migrate deploy` only. Never `migrate reset`, never `db push`, never drop or rename columns.

## Rolling back

Code-only batches (A, B and C as built on this branch have no migrations): redeploy the `pre-batch-*` tag on Render and Vercel. No data step is needed.

If a migration was applied and must be undone: restore the backup taken before the batch into a new database, check it with `verify-restore.sh`, then point `DATABASE_URL` at it. Entries made after the backup must be re-entered from dad's notes.
