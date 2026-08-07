import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db, type Executor } from './client'
import { items, type Item } from './schema'
import type { SessionUser } from './session'
import type { Kind } from '@/lib/domain'

export type ItemInput = {
  kind: Kind
  externalSource: string
  externalId: string
  title: string
  year: number | null
  metadata: Record<string, unknown>
}

/**
 * Items are canonical and shared across all users — there is one row per real
 * thing, and that is what makes overlap possible at all. So unlike every other
 * function here, this one does not filter by the session user.
 *
 * It still takes one: the convention is not decoration, and an unauthenticated
 * caller has no business minting canonical rows.
 *
 * Idempotent (§10). Two people adding the same film race to the same row and
 * both get it; neither gets a duplicate.
 */
export async function upsertItem(
  _sessionUser: SessionUser,
  input: ItemInput,
  tx: Executor = db,
): Promise<Item> {
  const [inserted] = await tx
    .insert(items)
    .values(input)
    .onConflictDoNothing({ target: [items.kind, items.externalId] })
    .returning()

  if (inserted) return inserted

  // Lost the race, or it already existed. Either way the row is there now.
  const [existing] = await tx
    .select()
    .from(items)
    .where(and(eq(items.kind, input.kind), eq(items.externalId, input.externalId)))
    .limit(1)

  if (!existing) {
    throw new Error(`upsertItem: no row for ${input.kind}/${input.externalId}`)
  }

  return existing
}
