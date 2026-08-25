#!/usr/bin/env bash
# Temporary. Reads production's migration state. Writes nothing.
set -euo pipefail
export DATABASE_URL="$(npx neonctl connection-string production \
  --project-id crimson-paper-70987817 --org-id org-fragrant-leaf-64006258 \
  --database-name neondb --role-name neondb_owner --pooled | tr -d '\r\n')"
node scripts/check-migration-state.mjs
