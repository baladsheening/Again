#!/usr/bin/env bash
# Temporary. Applies pending migrations to production, printing the host and
# the column state either side of the write.
set -euo pipefail
export DATABASE_URL="$(npx neonctl connection-string production \
  --project-id crimson-paper-70987817 --org-id org-fragrant-leaf-64006258 \
  --database-name neondb --role-name neondb_owner --pooled | tr -d '\r\n')"
echo "===== BEFORE ====="
node scripts/check-migration-state.mjs
echo
echo "===== MIGRATING ====="
npx drizzle-kit migrate
echo
echo "===== AFTER ====="
node scripts/check-migration-state.mjs
