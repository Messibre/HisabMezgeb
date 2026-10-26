#!/usr/bin/env bash
# Hisab Mezgeb Off-Site Upload Script
# Copies ENCRYPTED backups (.age) to S3-compatible remote storage (e.g. Cloudflare R2 / Backblaze B2).
# Security: NEVER uploads unencrypted files. Credentials read strictly from environment.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-encrypted-backup.age>" >&2
  exit 1
fi

ENC_FILE="$1"

if [ ! -f "$ENC_FILE" ]; then
  echo "Error: File '$ENC_FILE' does not exist." >&2
  exit 1
fi

# SECURITY GATE: Strictly refuse unencrypted files
if [[ "$ENC_FILE" != *.age ]]; then
  echo "CRITICAL SECURITY ERROR: Refusing to upload unencrypted file '$ENC_FILE'!" >&2
  echo "Only .age encrypted backups are permitted to leave the server." >&2
  exit 1
fi

# Check credentials from environment
if [ -z "${S3_BUCKET_NAME:-}" ]; then
  echo "Error: S3_BUCKET_NAME environment variable is required for off-site upload." >&2
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in environment." >&2
  exit 1
fi

FILENAME="$(basename "$ENC_FILE")"
SHA_FILE="$ENC_FILE.sha256"
ENDPOINT_FLAG=""

if [ -n "${S3_ENDPOINT_URL:-}" ]; then
  ENDPOINT_FLAG="--endpoint-url $S3_ENDPOINT_URL"
fi

echo "=== Uploading Encrypted Backup Off-Site ==="
echo "Target Bucket: s3://$S3_BUCKET_NAME/"
echo "File: $FILENAME"

# 1. AWS CLI
if command -v aws >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  aws s3 cp $ENDPOINT_FLAG "$ENC_FILE" "s3://$S3_BUCKET_NAME/$FILENAME"
  if [ -f "$SHA_FILE" ]; then
    # shellcheck disable=SC2086
    aws s3 cp $ENDPOINT_FLAG "$SHA_FILE" "s3://$S3_BUCKET_NAME/$(basename "$SHA_FILE")"
  fi
# 2. Rclone
elif command -v rclone >/dev/null 2>&1; then
  rclone copyto "$ENC_FILE" ":s3,endpoint='$S3_ENDPOINT_URL':$S3_BUCKET_NAME/$FILENAME"
  if [ -f "$SHA_FILE" ]; then
    rclone copyto "$SHA_FILE" ":s3,endpoint='$S3_ENDPOINT_URL':$S3_BUCKET_NAME/$(basename "$SHA_FILE")"
  fi
else
  echo "Error: Neither 'aws' CLI nor 'rclone' is installed on this system." >&2
  echo "Please install awscli or rclone to enable off-site cloud sync." >&2
  exit 1
fi

echo "=== Off-Site Upload Completed Successfully ==="
