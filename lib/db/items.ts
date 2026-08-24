import 'server-only'

import type { Executor } from './client'
import { upsertPossibility, type PossibilityInput } from './possibilities'
import type { Item } from './schema'
import type { SessionUser } from './session'

/**
 * The legacy film flow's name for a possibility.
 *
 * ⚠ **`items` is an alias for `possibilities` in the schema, and this is an
 * alias for `upsertPossibility`.** The insert used to live here and was moved
 * on 24 August when the resolution path needed it under the re-direction's own
 * vocabulary — two copies of one upsert over one table is how two callers come
 * to disagree about what a canonical row is. See `lib/db/possibilities.ts`.
 *
 * It stays because the legacy film flow still calls it, and it goes when that
 * does. **Nothing new may call it.**
 */
export type ItemInput = PossibilityInput

export async function upsertItem(
  sessionUser: SessionUser,
  input: ItemInput,
  tx?: Executor,
): Promise<Item> {
  return upsertPossibility(sessionUser, input, tx)
}
