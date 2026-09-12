import 'server-only'

import { and, eq, ne, sql } from 'drizzle-orm'
import { after } from 'next/server'

import { db } from '@/lib/db/client'
import { captureAkin, captures, EMBEDDING_DIMENSIONS } from '@/lib/db/schema'
import { canEmbed, embed } from '@/lib/embed'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Akin — 12 September, directed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *If it's semantically similar enough, it should be added but with an
 * asterisk, and when the user taps the semantically similar entries, they see a
 * grouping of them in the console.*
 *
 * This is the half that runs when a capture is written: embed the words, find
 * the owner's other captures near them, and write the pairs. **Everything a
 * screen reads is `capture_akin`** — see its docblock in `schema.ts` for why
 * the grouping is pairs and not a group id, and why it is computed here rather
 * than at read time.
 *
 * ⚠⚠ **IT LIVES BESIDE `lib/overlap.ts` AND `lib/push.ts`, NOT IN `lib/db/`,
 * AND THE REASON IS §3's OWN.** Every function in that layer takes the
 * authenticated `SessionUser` first and filters on it. This is called from an
 * `after()`, where the request is already gone and there is no session to take
 * — its subject is a capture id and the owner is read off the row. **A
 * `lib/db/` function whose first argument is not a session is the one shape §3
 * forbids**, so it is not put in there wearing a disguise.
 *
 * ⚠ **The owner is read from the capture, never passed in.** A caller that
 * could name the owner is a caller that could name the wrong one, and every
 * query below is scoped by what that read returns.
 */

/**
 * ⚠⚠ **THE ONE TUNED NUMBER IN THIS FEATURE, AND IT IS NAMED RATHER THAN
 * BURIED.** Cosine distance, `0` identical and `2` opposite; Voyage's vectors
 * are unit length, so this is `1 − cosine similarity`.
 *
 * **CLAUDE.md rules out numbers tuned until one device looks right**, and this
 * is a threshold, so the terms have to be stated. What makes it admissible is
 * what it decides: **it is about your own record and nobody else's.** The rule
 * it must not break — *never a cosine threshold at match time* — is about the
 * app making a social claim about a third party. Nothing here crosses between
 * people.
 *
 * ⚠⚠ **0.35 IS A STARTING POINT AND HAS NOT BEEN MEASURED AGAINST REAL
 * CAPTURES, BECAUSE MEASURING IT NEEDS THE KEY.** Stated plainly rather than
 * dressed up: with `VOYAGE_API_KEY` set, `scripts/akin-threshold.mjs` prints
 * the distance between pairs you give it, and **that** is how this number
 * should be chosen. Until then it is a default, and the failure it produces is
 * visible and cheap — an asterisk on two lines that are not really alike, or
 * no asterisk on two that are.
 *
 * ⚠ **One constant, one meaning.** It must not grow a second value for a
 * second surface: the asterisk and the console's grouping are the same claim
 * seen twice, and two thresholds would let a line wear a mark whose group was
 * empty.
 */
export const AKIN_DISTANCE = 0.35

/**
 * How many neighbours one capture may be akin to.
 *
 * ⚠ **A bound because §10 forbids an unbounded select**, and a small one
 * because the console draws these as a list a person reads. Somebody who has
 * written twenty near-identical lines has a problem an asterisk does not solve.
 */
const AKIN_LIMIT = 8

/**
 * **Embed one capture and write what it is akin to.**
 *
 * ⚠⚠ **CALLED FROM AN `after()` AND NEVER FROM INSIDE THE CAPTURE'S
 * TRANSACTION.** `lib/push.ts` carries the full argument; it is the same one
 * twice. A third-party HTTP call inside the write would put Voyage's latency in
 * front of the four-second promise, and a Voyage outage would roll back
 * somebody's line. **The capture is committed before this runs** — what is at
 * risk is an asterisk, which is a copy of a fact and never the record of one.
 *
 * ⚠ **`db`, not the caller's `tx`.** The transaction is closed by the time this
 * runs; holding one open across a network call to another company is the thing
 * a connection pool is destroyed by.
 *
 * ⚠ **It never throws.** Same contract as `embed` and for the same reason: an
 * unhandled rejection in a request that has already flushed is noise nobody
 * sees, and every failure here means one thing — this line has no asterisk yet.
 */
export async function writeAkin(captureId: string): Promise<void> {
  if (!canEmbed()) return

  try {
    const [row] = await db
      .select({ userId: captures.userId, text: captures.text })
      .from(captures)
      .where(eq(captures.id, captureId))
      .limit(1)

    if (!row) return

    const vector = await embed(row.text)
    if (!vector) return

    /*
      ⚠⚠ **THE WIDTH IS CHECKED HERE, BESIDE THE INSERT IT PROTECTS.** A vector
      of the wrong length reaches Postgres as a type error **thrown inside an
      `after()`**, where nothing is watching and the only symptom is captures
      quietly ceasing to group. It is not in `lib/embed.ts` because the expected
      number is `captures.embedding`'s column type and that module may not
      import the schema (§3) — see `eslint.config.mjs`, which says why the
      exemption stops at this file.
    */
    if (vector.length !== EMBEDDING_DIMENSIONS) return

    /*
      ⚠ **The literal is built here rather than handed to Drizzle as an array.**
      pgvector's input syntax is `[1,2,3]` — a string cast to `vector` — and
      passing a JS array binds a Postgres array, which is a different type and
      fails at the cast. One `::vector` and no client-side driver mapping.
    */
    const literal = `[${vector.join(',')}]`

    await db
      .update(captures)
      .set({ embedding: sql`${literal}::vector` })
      .where(eq(captures.id, captureId))

    /*
      ⚠⚠ **THE NEIGHBOURS ARE THE OWNER'S OWN, AND THAT TERM IS THE PRIVACY OF
      THIS WHOLE FEATURE.** `eq(captures.userId, row.userId)` is what keeps a
      pair from ever naming somebody else's line. It is not an optimisation and
      it must never become one: without it this table would say *your line is
      like a stranger's*, which is a disclosure nobody consented to and a
      product decision nobody took.

      ⚠ **`<=>` is cosine distance**, which is what the threshold is expressed
      in. `<->` is Euclidean and `<#>` negative inner product; on unit vectors
      they rank identically but they do not read identically, and the constant
      above is a cosine number.

      ⚠ **`ne(captures.id, captureId)` as well as the table's own CHECK.** The
      nearest neighbour of any vector is itself, so this is the one mistake the
      query shape invites; the constraint is the backstop and this is the fix.

      ⚠ **`embedding is not null` is written out.** A null distance sorts first
      in Postgres, so without it every capture written before the key existed
      would be everybody's nearest neighbour.
    */
    const near = await db
      .select({
        id: captures.id,
        distance: sql<number>`${captures.embedding} <=> ${literal}::vector`,
      })
      .from(captures)
      .where(
        and(
          eq(captures.userId, row.userId),
          ne(captures.id, captureId),
          sql`${captures.embedding} is not null`,
          sql`${captures.embedding} <=> ${literal}::vector < ${AKIN_DISTANCE}`,
        ),
      )
      .orderBy(sql`${captures.embedding} <=> ${literal}::vector`)
      .limit(AKIN_LIMIT)

    if (near.length === 0) return

    /*
      ⚠ **Both directions, written together.** Akin-ness is symmetric and the
      console asks *what is akin to the line I tapped*; one row per pair would
      make that a two-legged `or` that no index serves.

      ⚠ **`onConflictDoNothing`, because this can run twice for one capture.**
      An edit re-embeds, and the pair may already be there — the row that
      matters is the one that exists, not which run wrote it.
    */
    await db
      .insert(captureAkin)
      .values(
        near.flatMap((n) => [
          { captureId, akinId: n.id, distance: n.distance },
          { captureId: n.id, akinId: captureId, distance: n.distance },
        ]),
      )
      .onConflictDoNothing()
  } catch {
    /*
      ⚠ **Deliberately silent, and the scope is *this line has no asterisk*.**
      Nothing downstream of a failure needs undoing: the capture is committed,
      the record draws it, and the only thing missing is a mark that says there
      are others like it. §6 — silence stays silent.
    */
  }
}

/**
 * **Hang the embedding off the end of the response.**
 *
 * ⚠⚠ **TWO CALLERS, AND THERE IS DELIBERATELY NO SINGLE FUNNEL LIKE
 * `writeNotifications`.** The obvious one was `fireOverlap`, which both write
 * paths already call — and it is the wrong one: **its first guard is
 * `SHARED_SCOPES`**, so routing through it would mean a locked line never got
 * an asterisk. A lock is about who else may converge on a line; being reminded
 * that you wrote something twice is about your own record, and the lock has
 * nothing to say about it.
 *
 * ⚠ **An edit re-embeds unconditionally**, where `fireOverlap` is gated on the
 * normalised text changing. Punctuation does not change what a capture means to
 * a matcher; it can change what it means to a model, and the pairs are cheap to
 * rewrite.
 *
 * ⚠⚠ **THE `try` IS FOR THE TESTS AND THE CATCH MUST STAY THAT NARROW.**
 * `after` throws when there is no request to be after — which is every test in
 * `tests/`, where the data layer is driven straight against the database.
 * **Not embedding in a test is correct**; a bare call would turn every capture
 * test red for a reason that has nothing to do with captures. This is
 * `lib/overlap.ts`'s own note, one file over, for the identical reason.
 */
export function scheduleAkin(captureId: string): void {
  try {
    after(() => writeAkin(captureId))
  } catch {
    /* No request to be after — a test, or a script. */
  }
}
