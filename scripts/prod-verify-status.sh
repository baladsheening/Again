#!/usr/bin/env bash
# Temporary, and it goes with `state` at step C.
#
# Reads production and checks that 0012's backfill said exactly what `state`
# says, for every row. Writes nothing — the same guarantee prod-check.sh gives,
# and for the same reason: this is the thing you run either side of a migration,
# so it must be safe to run at any moment against any branch.
#
# One shell per command, because an exported variable does not outlive the
# command that set it.
set -euo pipefail
export DATABASE_URL="$(npx neonctl connection-string production \
  --project-id crimson-paper-70987817 --org-id org-fragrant-leaf-64006258 \
  --database-name neondb --role-name neondb_owner --pooled | tr -d '\r\n')"
node scripts/verify-status-backfill.mjs
