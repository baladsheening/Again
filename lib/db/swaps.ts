import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db } from './client'
import { items, swapItems, swaps, type Item, type Swap } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'

/** Both timestamps set means the swap is revealed. Nothing else does. */
function isRevealed(swap: Swap): boolean {
  return swap.initiatorCommittedAt !== null && swap.recipientCommittedAt !== null
}

function isParticipant(swap: Swap, userId: string): boolean {
  return swap.initiatorId === userId || swap.recipientId === userId
}

export type SwapView = {
  swap: Swap
  /** Always visible — they are the caller's own picks. */
  mine: Item[]
  /** `null` until both sides have committed. Not an empty array — null. */
  theirs: Item[] | null
}

/**
 * Neither side sees the other's picks until both have committed (§7.3).
 *
 * The check lives here, in the data-access function, and not in the component.
 * A leak here is invisible in the UI — the page would look correct while
 * serving the counterparty's picks in the payload — and it ruins the mechanic,
 * because trading in the open lets people pander to taste. The surprise is the
 * point. This is the second of the two places where a silent bug damages trust
 * rather than function (§13).
 */
export async function getSwap(
  sessionUser: SessionUser,
  swapId: string,
): Promise<Result<SwapView>> {
  const [swap] = await db.select().from(swaps).where(eq(swaps.id, swapId)).limit(1)

  if (!swap) return err('not_found', 'No such swap.')
  if (!isParticipant(swap, sessionUser.id)) {
    return err('forbidden', 'Not a participant in this swap.')
  }

  const mine = await itemsFrom(swapId, sessionUser.id)

  if (!isRevealed(swap)) {
    return ok({ swap, mine, theirs: null })
  }

  const counterpartyId =
    swap.initiatorId === sessionUser.id ? swap.recipientId : swap.initiatorId

  return ok({ swap, mine, theirs: await itemsFrom(swapId, counterpartyId) })
}

async function itemsFrom(swapId: string, fromUserId: string): Promise<Item[]> {
  const rows = await db
    .select({ item: items })
    .from(swapItems)
    .innerJoin(items, eq(items.id, swapItems.itemId))
    .where(and(eq(swapItems.swapId, swapId), eq(swapItems.fromUserId, fromUserId)))

  return rows.map((r) => r.item)
}
