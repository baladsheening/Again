import 'server-only'

import { env } from '@/lib/env'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  What a capture means, as numbers — 12 September, directed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Directed:** *if it's semantically similar enough, it should be added but
 * with an asterisk.* **Semantic** is the word, and it rules out everything this
 * repository can do for free. `normalised_text` answers *the same string*;
 * Postgres's stemmer answers *shares a word* — which groups *learn to sail*
 * with *sailing lessons* and, with the same rule, with *learn French*. The
 * three candidates were put to the user with that cost stated and this is the
 * one chosen.
 *
 * ⚠⚠ **ANTHROPIC HAS NO EMBEDDINGS ENDPOINT.** Their own documentation says so
 * and points at Voyage AI, which is why a Claude-shaped app is calling
 * somebody else's API here. `voyage-4-lite` is the model Voyage names for
 * latency and cost, which is what a capture wants: a handful of words, embedded
 * once, on a path a person is waiting at the other end of.
 *
 * ⚠⚠ **THIS IS THE FIRST THING IN THE APP THAT COSTS MONEY PER ROW**, against
 * a standing direction since 25 August not to build what costs money. It was
 * put to the user as the decision it is, with the free alternative and its
 * failure mode beside it. **Fractions of a cent per capture**, and CLAUDE.md
 * already costs a whole beta's model spend at under ten dollars.
 *
 * ⚠ **HTTP, not a package.** Voyage ships a Python client and no first-party
 * TypeScript one; the endpoint is one POST with one JSON body, and a dependency
 * that wraps that is a dependency to keep up to date for nothing.
 *
 * ⚠ **NO `input_type`.** Voyage's parameter picks between *query* and
 * *document* and exists for asymmetric retrieval — a short question against
 * long passages. Two captures are the same kind of thing as each other, so
 * this is a symmetric comparison and either value would prepend an instruction
 * to only one side of it.
 *
 * ⚠ **THE WIDTH IS NOT CHECKED HERE, AND THAT IS THE BOUNDARY RATHER THAN AN
 * OVERSIGHT.** The expected number lives in `captures.embedding`'s column type,
 * and reaching it from this module meant importing `lib/db/schema`, which §3's
 * lint rule refuses — correctly. **A module that only needs the boundary
 * relaxed to read a constant does not need the boundary relaxed**, so the check
 * moved to `lib/akin.ts`, which already has the exemption and is where the
 * insert it protects actually happens. What this file guarantees is narrower
 * and is its own business: **an array of finite numbers, or nothing.**
 */

/** Voyage's HTTP endpoint. One POST, one JSON body. */
const ENDPOINT = 'https://api.voyageai.com/v1/embeddings'

/**
 * **The model, and it is the cheap one on purpose.**
 *
 * `voyage-4-lite` is Voyage's latency-and-cost option in the current
 * generation. A capture is a few words and the comparison is between two of
 * them; the quality the larger models buy is retrieval quality over long
 * documents, which is not this.
 *
 * ⚠ **A change of model here may be a change of WIDTH**, and the width is in
 * `captures.embedding`'s column type — so swapping this is a migration and a
 * re-embed of every row, not an edit to a string.
 */
const MODEL = 'voyage-4-lite'

/**
 * How long to wait for it. **Nothing is waiting on the other end** — this runs
 * in an `after()` after the response has flushed — but an unbounded fetch in a
 * serverless invocation is an invocation that is billed until it is killed.
 */
const TIMEOUT_MS = 10_000

type VoyageResponse = {
  data?: { embedding?: unknown; index?: number }[]
}

/**
 * **The words in, a vector out, or `null`.**
 *
 * ⚠⚠ **IT NEVER THROWS, AND THAT IS THE CONTRACT THE CALLER IS BUILT ON.**
 * Every failure here — no key, a 500 from Voyage, a timeout, a body that is not
 * the shape promised — is the same fact from the app's point of view: *this
 * capture has no vector today.* The line is already committed and on the
 * person's record; what is lost is an asterisk. **A thrown error inside an
 * `after()` is an unhandled rejection in a request that has already returned**,
 * which is noise in the logs and nothing on screen.
 *
 * ⚠ **No key is not an error.** `VOYAGE_API_KEY` is optional in `lib/env.ts`
 * for the same reason the VAPID keys are: the app has to be whole without it.
 * Until it is set the feature is dark — nothing is grouped, no asterisk is
 * drawn, and no screen says anything is missing (§6, *silence stays silent*).
 */
export async function embed(text: string): Promise<number[] | null> {
  if (!env.VOYAGE_API_KEY) return null

  const trimmed = text.trim()
  if (trimmed === '') return null

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ input: [trimmed], model: MODEL }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) return null

    const body = (await response.json()) as VoyageResponse
    const vector = body.data?.[0]?.embedding

    /*
      ⚠ **An array of finite numbers, and nothing further.** A `NaN` or an
      `Infinity` in a vector poisons every distance computed against it — and
      unlike a wrong length, Postgres accepts it. **The WIDTH is checked by the
      caller**, for the boundary reason in the docblock above.
    */
    if (!Array.isArray(vector) || vector.length === 0) return null
    if (!vector.every((n) => typeof n === 'number' && Number.isFinite(n))) return null

    return vector as number[]
  } catch {
    return null
  }
}

/** Whether the app can embed anything at all. Read by `lib/akin.ts` to skip early. */
export const canEmbed = () => Boolean(env.VOYAGE_API_KEY)
