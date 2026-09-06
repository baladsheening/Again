import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db, type Executor } from './client'
import { possibilities, type Possibility } from './schema'
import type { SessionUser } from './session'
import type { Kind } from '@/lib/domain'

/**
 * **A possibility is the shared world record a capture may resolve to** — one
 * canonical row per real thing, which is what makes convergence possible at
 * all (§6).
 *
 * ⚠ **This is the same table `lib/db/items.ts` writes**; `items` is an alias
 * for `possibilities` in the schema. `upsertItem` delegates here rather than
 * repeating the insert, so there is **one writer** and the legacy film flow and
 * the resolution path cannot disagree about how a canonical row is minted.
 */

/**
 * ⚠ **Provider-resolved only, and the pair is required.** A possibility
 * somebody typed has no catalogue behind it and §12 is explicit that a fake
 * TMDB identifier must not be invented to give it one — so a user-contributed
 * possibility is a different write, with its own provenance, and it belongs to
 * the phase that ships it rather than to a `null` slipping through here.
 */
export type PossibilityInput = {
  kind: Kind
  externalSource: string
  externalId: string
  title: string
  year: number | null
  /**
   * The one line that says WHICH one. Amendment 6.
   *
   * ⚠ **Stated by the CALLER, never derived here.** The whole point of the
   * column is that the surface branches on nothing, and a `String(year)` in
   * this function would put the film-shaped assumption back one layer down —
   * where it would be harder to see and would silently be wrong for the first
   * catalogue that is not TMDB. **Whoever ingests the row knows what its
   * qualifier means; nobody else does.**
   *
   * ⚠ **Required rather than optional, so a new catalogue cannot forget it.**
   * A missing qualifier is a blank line under a picture, which nothing in the
   * app would report.
   */
  qualifier: string | null
  /**
   * The picture's path, as a path. Amendment 7.
   *
   * ⚠ **A row without one never enters the front page rail** — that gate is one
   * term in the rail's read. It is not a gate on the corpus: the row still
   * exists, still resolves and still converges.
   *
   * ⚠ **A path, not a URL.** `lib/posters.ts` picks the CDN size at render
   * time against the viewport and the pixel ratio; a URL resolved here would
   * freeze it at ingest.
   */
  imagePath: string | null
  metadata: Record<string, unknown>
}

/**
 * Possibilities are canonical and shared across all users, so unlike every
 * other function in `lib/db/` this one does not filter by the session user.
 *
 * It still takes one: the convention is not decoration, and an unauthenticated
 * caller has no business minting canonical rows.
 *
 * Idempotent (§10). Two people resolving to the same film race to the same row
 * and both get it; neither gets a duplicate.
 *
 * ⚠ **A row that already exists is returned UNCHANGED, qualifier and image
 * included.** `onConflictDoNothing` is deliberate and this is not an oversight
 * to fix by upgrading it to a `DO UPDATE`: a possibility is a shared canonical
 * record, and letting the second person to resolve to a film overwrite its
 * picture is one account editing the corpus every other account reads. **The
 * 71 rows backfilled on 6 September keep what the backfill gave them.** If a
 * bad or stale image ever needs correcting, that is an enrichment path with its
 * own provenance — §7 — and not a side effect of somebody capturing something.
 */
export async function upsertPossibility(
  _sessionUser: SessionUser,
  input: PossibilityInput,
  tx: Executor = db,
): Promise<Possibility> {
  const [inserted] = await tx
    .insert(possibilities)
    .values(input)
    .onConflictDoNothing({ target: [possibilities.kind, possibilities.externalId] })
    .returning()

  if (inserted) return inserted

  // Lost the race, or it already existed. Either way the row is there now.
  const [existing] = await tx
    .select()
    .from(possibilities)
    .where(
      and(eq(possibilities.kind, input.kind), eq(possibilities.externalId, input.externalId)),
    )
    .limit(1)

  if (!existing) {
    throw new Error(`upsertPossibility: no row for ${input.kind}/${input.externalId}`)
  }

  return existing
}
