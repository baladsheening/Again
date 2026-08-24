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
