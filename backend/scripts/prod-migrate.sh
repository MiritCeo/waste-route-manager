#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/.."

cd "${BACKEND_DIR}"

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ".env"
  set +a
fi

echo "Running schema fixes (idempotent)..."
npx prisma db execute --file "${SCRIPT_DIR}/prod-migrate.sql"

echo "Marking migration as applied (safe to re-run)..."
npx prisma migrate resolve --applied 20260122210510_add_issue_config || true

echo "Applying pending migrations (if any)..."
npx prisma migrate deploy

echo "Done."
