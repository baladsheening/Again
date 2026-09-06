import 'server-only'

import { randomUUID } from 'node:crypto'

import { and, asc, eq, gt, isNotNull, lte } from 'drizzle-orm'

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

/* -------------------------------------------------------------------------- */
/*  The rail                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One tile. **This is the whole of what the front page reads from the corpus.**
 *
 * ⚠ **No `kind`, and that is Amendment 6 held rather than an omission.** The
 * tile branches on nothing and neither does the opened view — `qualifier` is
 * the one line that says which one, whatever sort of thing it is. **The day
 * something here branches on a type, the taxonomy has come back.**
 *
 * ⚠ **`title` and `qualifier` ride the tile even though the tile does not draw
 * them.** The tile is the image alone (Amendment 7); the words appear when it
 * is opened, and they are on the row that has already been fetched. A second
 * query behind the tap would be a network round trip to print two strings the
 * page is already holding.
 */
export type RailTile = {
  id: string
  /** Shown only in the opened view. */
  title: string
  /** Shown only in the opened view. `null` prints nothing, never a gap. */
  qualifier: string | null
  /**
   * ⚠ **Never null on a tile**, by construction — it is the rail's admission
   * rule. Typed non-null so no surface can grow an imageless branch.
   */
  imagePath: string
  /** ⚠ Displayed above the image. **Never a sort key.** */
  openCount: number
  /**
   * **Why this tile is in front of this person.** `null` today, on every tile,
   * and that is the honest answer: the rail is the corpus and nothing is ranked.
   *
   * ⚠⚠ **THE SLOT SHIPS BEFORE THE RANKING, AND THAT IS THE WHOLE POINT OF IT.**
   * §2 permits recommendation **only** as *an explained, user-controlled local
   * relevance result*; §7 gives the copy — `Because you saved "try pottery".` —
   * and Phase 5's exit criteria require that *For you here can explain its
   * relation to the user's list*. **An explanation retrofitted onto a rail that
   * already ranks is the thing that never gets done**, so the field exists from
   * the first tile and every consumer has to decide what to do with an empty
   * one. `console.tsx` did exactly this for the convergence sentence a phase
   * before there was one.
   *
   * ⚠ **It is a SENTENCE, never a score.** §7 forbids exposing an unexplained
   * numeric reliability score in the first release, and *0.82 relevant* is that
   * score with a different name.
   *
   * ⚠ **It says something about the READER'S OWN record and nothing about
   * anybody else's.** *Because you saved …* is safe; *three of your friends
   * want this* is a disclosure the reader never consented to make and is not
   * what this field is for.
   *
   * ⚠⚠ **AND IT IS NOT A CONVERGENCE.** The rail may rank; **the fan-out may
   * not.** §2 as amended is explicit that when similarity arrives it *proposes
   * to the person who wrote the line and never writes a notification to anybody
   * else* — an inferred match that wrote one would tell somebody *Sam wants this
   * too* when Sam wrote something merely similar, which is the app making a
   * claim about a third party that is not true.
   */
  why: string | null
}

/**
 * ⚠ **24, and it is a rail rather than a page.** The record's `PAGE_SIZE` is 50
 * because it is a column of one-line rows; this is a horizontal scroller
 * showing three or four tiles at a time, so a page is *how far ahead of the
 * thumb we read*, not *how much fits*.
 */
export const RAIL_PAGE = 24

/** Never let a client ask for the table. §10: no unbounded selects. */
const RAIL_MAX = 48

/**
 * A place in the rail. Opaque to the client, which only ever passes it back.
 *
 * ⚠ **A cursor, not an offset**, for the reason `listMyPage` gives: an offset
 * counts to a place and a cursor names one, so a row entering the corpus
 * mid-session cannot push a tile the reader has already seen into the next
 * slice.
 */
export type RailCursor = { id: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The place *after* a tile — where the next slice starts. */
export function railCursor(tile: RailTile): string {
  return tile.id
}

/**
 * ⚠ **Returns `null` rather than throwing on anything malformed.** A cursor
 * arrives from a client, so it is input: a bad one is a read of the first
 * slice, never a 500 and never an unbounded scan. `parsePageCursor` says the
 * same about the record's.
 */
export function parseRailCursor(raw: string): RailCursor | null {
  return UUID.test(raw) ? { id: raw } : null
}

/**
 * **The corpus, as the front page reads it.** Amendment 7.
 *
 * ⚠⚠ **THE ADMISSION RULE IS ONE TERM AND IT LIVES HERE AND NOWHERE ELSE** —
 * `image_path is not null`, directed: *any entry that doesn't have an attached
 * image can never enter the front page rail.* ⚠ **It is not a gate on the
 * corpus and never on capture**: an imageless possibility still exists, is
 * still searchable, is still what a capture resolves to, and still converges.
 * Nothing in `lib/overlap.ts` and nothing on the capture path knows about it.
 *
 * ⚠ **Never `metadata->>'posterPath'`.** A JSON term is a branch on kind
 * wearing a different hat, and it is the film-shaped location `image_path`
 * exists to replace.
 *
 * ⚠ **Like `upsertPossibility`, this does not filter by the session user** — a
 * possibility is canonical and shared, so there is no per-user row to filter
 * to. It still takes one, because an unauthenticated caller has no business
 * reading the corpus and §3's convention is not decoration.
 *
 * ### Order, and why there is no sort
 *
 * ⚠ **Ordered by `id`, which is *by nothing at all*.** §2 permits a rail
 * ordered by what the reader chose or by nothing, and bans a *popular now* or
 * *trending* rail as a feed under another name. A v4 uuid is arbitrary and,
 * crucially, **stable** — so a keyset walk over it shows no row twice and skips
 * none. `order by random()` and a seeded `order by md5(id || seed)` both sort
 * the entire table per page: fine at 71 rows, fatal at a million, which is
 * §10's *build so nothing prevents scale*.
 *
 * ⚠⚠ **MEASURED RATHER THAN ASSERTED, AND THE SMALL TABLE LIED.** This said
 * *an indexed range scan with no sort at any corpus size*, which `EXPLAIN` on
 * the dev database did not support: at 58 rows the planner takes a **Seq Scan
 * plus a Sort**, and forcing `enable_seqscan = off` only gets a **Bitmap**
 * Index Scan — which does not preserve order, so the Sort stays. Both are
 * small-table artefacts and neither is a fault in the design.
 *
 * **Built the shape at 300,000 rows (200,000 of them with an image) and asked
 * again:** a plain `Index Scan using rail_scale_idx`, **no Sort node**, 27
 * buffers, **0.126 ms** for a page of 24 from a random start. That is the claim
 * this docblock is allowed to make. ⚠ **So a `Seq Scan` in a local `EXPLAIN`
 * is not a regression** — it is what a 58-row table costs, and the index is
 * there for the corpus this is going to have rather than the one it has.
 *
 * ⚠⚠ **AND IT MUST NEVER BE ORDERED BY `open_count`.** That is the trending
 * rail Amendment 5 bans. There is deliberately no index on that column, so the
 * query that breaks the rule is also the one that gets slow enough to notice.
 *
 * ### The random start, which is a call the brief did not make
 *
 * ⚠ **A seed with no cursor starts at a random point, not at the beginning.**
 * *What the rail is a rail of* is open in the brief; what is **not** open is
 * that the rail is a feeder — §0: *every path through the browse half ends in a
 * capture, or it has wasted the screen.* A stable order read from its start
 * shows every reader the same first 24 tiles for ever, which is a shelf rather
 * than a feeder. One random uuid costs nothing and is not a ranking.
 *
 * ⚠ **It wraps, and only on the seed.** A random start near the end of the
 * order would otherwise hand back two tiles and call it a page — so a short
 * first slice is topped up from the beginning, and the two halves are disjoint
 * by construction (`id > start` against `id <= start`). **Paging onward does
 * not wrap:** a short slice there means the corpus is exhausted, which is the
 * honest signal, and an endlessly circling rail is an engagement pattern
 * nobody asked for.
 */
export async function listRail(
  sessionUser: SessionUser,
  { limit = RAIL_PAGE, after }: { limit?: number; after?: RailCursor } = {},
): Promise<RailTile[]> {
  void sessionUser
  const size = Math.min(Math.max(1, Math.trunc(limit)), RAIL_MAX)

  /*
    ⚠ **Generated in NODE, and `gen_random_uuid()` was tried first.** Postgres
    has it and it is this table's own `id` default, but asking for one is a
    **round trip to Neon** — remote, and spent before the read it exists to
    start. `crypto.randomUUID()` is built in, needs no dependency, and is the
    same uniform 122 bits. **It is not a seed and nobody keeps it**; its only
    job is to be compared against a column once.
  */
  const start = after?.id ?? randomUUID()

  const slice = await readSlice(start, size, 'after')
  if (after || slice.length >= size) return slice

  /* Seed only: top up from the beginning so a late start still fills a page. */
  const rest = await readSlice(start, size - slice.length, 'upTo')
  return [...slice, ...rest]
}

/**
 * The one query, run at most twice. `upTo` is the wrap's second half and is
 * disjoint from `after`'s, so the two can never return the same row.
 */
async function readSlice(
  start: string,
  size: number,
  half: 'after' | 'upTo',
): Promise<RailTile[]> {
  if (size <= 0) return []

  const rows = await db
    .select({
      id: possibilities.id,
      title: possibilities.title,
      qualifier: possibilities.qualifier,
      imagePath: possibilities.imagePath,
      openCount: possibilities.openCount,
    })
    .from(possibilities)
    .where(
      and(
        isNotNull(possibilities.imagePath),
        half === 'after' ? gt(possibilities.id, start) : lte(possibilities.id, start),
      ),
    )
    .orderBy(asc(possibilities.id))
    .limit(size)

  /*
    `imagePath` is `text | null` on the table and non-null on a tile: the
    predicate above is what makes that true, and this is the one place the two
    facts meet. Not a cast of convenience — a row without one cannot be here.

    `why` is `null` because nothing is ranked: **the corpus in an arbitrary
    order owes the reader no explanation**, and inventing one would be the
    "because" of a decision nobody took. It becomes a sentence when the rail
    starts choosing — §7's ladder, top term first — and not before.
  */
  return rows.map((row) => ({ ...row, imagePath: row.imagePath as string, why: null }))
}
