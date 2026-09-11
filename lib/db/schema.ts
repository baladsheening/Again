import { sql, type SQL } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/**
 * Domain unions live in `@/lib/domain` — they are vocabulary (§4), not schema,
 * and Client Components need them without reaching the database.
 */
import type {
  CaptureSource,
  CaptureState,
  CaptureStatus,
  CaptureVerdict,
  EntrySource,
  EntryState,
  Intent,
  Kind,
  NotificationKind,
  SwapStatus,
  Visibility,
} from '@/lib/domain'

export type {
  CaptureSource,
  CaptureState,
  CaptureStatus,
  CaptureVerdict,
  EntrySource,
  EntryState,
  Intent,
  Kind,
  NotificationKind,
  SwapStatus,
  Visibility,
} from '@/lib/domain'

/* -------------------------------------------------------------------------- */
/*  Better Auth owns these four. Do not modify them; extend via `profiles`.    */
/*  Field names mirror @better-auth/core `getAuthTables` exactly — the Drizzle */
/*  adapter resolves fields by property name, so these must not be renamed.    */
/* -------------------------------------------------------------------------- */

/**
 * `advanced.database.generateId: 'uuid'` in lib/auth.ts makes Better Auth issue
 * `values (default, ...)` and let Postgres mint the id, so these four tables
 * need `gen_random_uuid()` as a column default. Without it every insert fails
 * a not-null constraint on `id`.
 */
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

/* -------------------------------------------------------------------------- */
/*  Application tables (§5)                                                    */
/* -------------------------------------------------------------------------- */

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  /**
   * Confusable-folded form of `handle`, unique. Not in the §5 schema — added
   * because §10 requires handles be checked against homoglyph impersonation,
   * and a uniqueness check needs somewhere to compare. See `lib/handles.ts`.
   */
  handleSkeleton: text('handle_skeleton').notNull().unique(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Canonical possibilities: one row per real-world thing, shared across all
 * users. **The physical table is still `items`**, and deliberately — §12 says
 * to retain it as the starting point and migrate the film rows rather than
 * discard them, so Phase 0 recasts what the table *means* without moving a
 * single row. Renaming the relation is a later migration with nothing riding
 * on it; renaming it now would put a data move underneath a vocabulary change.
 */
export const possibilities = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').$type<Kind>().notNull(),
    /**
     * Which catalogue `external_id` came from. Not in the §5 schema — added
     * because `kind` otherwise implies the provider by convention alone
     * (film→TMDB, book→Open Library), and a convention is not something you
     * can query. If films ever move off TMDB this makes the change a backfill
     * rather than an exercise in working out what a column of integers means.
     *
     * The unique constraint below is deliberately left on (kind, external_id)
     * as §5 specifies: one canonical row per real thing. If a provider
     * migration ever happens, widening it is a decision to take then, with a
     * deduplication strategy — not a guess to bake in now.
     *
     * ⚠ **Nullable since Phase 0, and the default is gone with it.** A
     * possibility a person typed has no catalogue behind it, and §12 is
     * explicit that a fake TMDB identifier must not be used to give it one.
     * A default of `'tmdb'` on a user-created row is exactly that invention,
     * arrived at by omission rather than by decision.
     */
    externalSource: text('external_source'),
    /** TMDB id for films, when a provider resolved this. Namespaced by `kind`. */
    externalId: text('external_id'),
    title: text('title').notNull(),
    year: integer('year'),
    /**
     * The one line that says WHICH one — `1974`, `Ridley Scott`, `Hackney`,
     * `Toyota`. Amendment 6, 6 September.
     *
     * ⚠ **It exists so the card branches on NOTHING.** §3 of the front-page
     * brief derived this line from `kind` — year for a film, author for a
     * paper, locality for a place — which is **a slot solved as a taxonomy**,
     * and it was the whole reason the `Kind` union looked like a decision that
     * had to be taken before the card could be written. One field, written
     * where the row is ingested by whoever knows what it means, and the surface
     * prints it.
     *
     * ⚠ **`year` above is this column with a film's meaning welded into it.**
     * It is superseded, not deleted: it is an `integer`, so it still sorts and
     * still disambiguates two films of one title, which a string cannot do.
     * Backfilled from it, and nothing migrates away from it.
     *
     * ⚠ **Never asked of the user.** §2: *never ask the user to categorise
     * anything.* This is a property of the shared world record, not of anyone's
     * capture — and a capture has no qualifier because it has no kind.
     */
    qualifier: text('qualifier'),
    /**
     * Where this row's picture is, as a **path** rather than a URL. Amendment 7,
     * 6 September.
     *
     * ⚠⚠ **THE RAIL ADMITS NOTHING WITHOUT ONE** — directed: *any entry that
     * doesn't have an attached image can never enter the front page rail.* That
     * gate is **one term in the rail's own read**, `image_path is not null`,
     * and it lives nowhere else. ⚠ **It is not a gate on the corpus and never
     * on capture**: a possibility with no image still exists, is still
     * searchable, is still what a capture resolves to, and still converges. It
     * simply never appears in the rail.
     *
     * ⚠ **A PATH, NOT A URL, AND THAT IS LOAD BEARING.** `lib/posters.ts`
     * chooses the CDN size at **render** time — `rungFor` measures the
     * viewport and multiplies by `devicePixelRatio` — so a resolved URL stored
     * here would freeze the size at ingest and undo the whole of that
     * mechanism. Store what TMDB stores; resolve per surface.
     *
     * ⚠ **It supersedes `metadata.posterPath`, which is a film-shaped location
     * for a universal thing** — the same fault `year` had as a qualifier, and
     * it is corrected the same way. Backfilled from it. **The rail must never
     * read `metadata->>'posterPath'`**: a JSON term is a branch on kind
     * wearing a different hat.
     */
    imagePath: text('image_path'),
    /**
     * How many times the enlarged view of this possibility has been opened.
     * Amendment 7, directed: *above each image in the horizontal rail is a
     * number showing how many openings it has received.*
     *
     * ⚠⚠ **THIS IS THE ONE ENGAGEMENT NUMBER IN THE APP AND IT NARROWS A
     * RELEASE 1 EXCLUSION.** §1 excludes engagement metrics and §2's *social
     * without a feed* bans engagement loops; it was directed with that stated.
     * What is permitted is exactly this: **a count of openings of a
     * POSSIBILITY**, which belongs to nobody. It may never appear on a person,
     * a capture, a track or a notification, and §5's *the portal is never given
     * a count* is untouched.
     *
     * ⚠⚠ **IT IS NEVER A SORT KEY. The day it orders the rail, the rail is a
     * trending feed** — which Amendment 5 bans by name — **and the exclusion has
     * been broken.** There is deliberately no index on it, so the ordering that
     * would break this is also the one that gets slow enough to notice.
     *
     * It is inflatable by anyone willing to tap. Accepted: it is a texture of
     * interest, not a measurement, and nothing ranks on it.
     */
    openCount: integer('open_count').notNull().default(0),
    /**
     * Where this thing is, when it is somewhere. 6 September.
     *
     * ⚠⚠ **TAKEN NOW BECAUSE IT IS THE ONE UNRECOVERABLE COST IN THIS AREA.**
     * Nothing reads these yet and no rail is gated on them. But a possibility
     * contributed **without** coordinates can never be given them afterwards —
     * you cannot retroactively locate somebody else's photograph — so every row
     * added between now and the day location ships would be permanently
     * un-locatable. The columns are additive and cost nothing; the data they
     * hold cannot be recovered later.
     *
     * ⚠ **On the POSSIBILITY, never on the capture.** A place is somewhere; a
     * person writing about it is not the same fact, and §1 excludes continuous
     * background location tracking. **Do not add a location to `captures`
     * because this is here.**
     *
     * ⚠ **`double precision` and not PostGIS, deliberately.** A geography
     * column with a GiST index is the right answer for ordering by distance and
     * it is what this should become — but it is an extension, an index and a
     * query, taken before a single located row exists, which is §10's *do not
     * build for millions now*. ⚠ **Upgrading is a BACKFILL from these two
     * columns** (`ST_MakePoint(longitude, latitude)`), not a re-collection, so
     * the expensive half is already bought by having them at all.
     *
     * ⚠ **No index, and that is not an oversight.** There is no query and no
     * row. Whether it wants a composite btree for a bounding box or a GiST for
     * a KNN order is a decision that belongs **with the query**, and picking one
     * now is picking it blind.
     *
     * ⚠ **Null is the ordinary case, and a film is nowhere** — so a rail
     * constrained to a location is a filter that removes most of the corpus,
     * which is the point of it being optional.
     *
     * ⚠⚠ **BUT A SCREENING IS SOMEWHERE, AND THAT IS A DIFFERENT OBJECT —
     * Amendment 9.** §3's *occurrence* is a time-bound experience connected to
     * a possibility, and its first example is a screening. **The film has no
     * location; the showing of it has one and a time.** These two columns are
     * for a possibility that genuinely sits somewhere — a place — and the
     * occurrence carries its own. **Do not try to make these hold a screening**:
     * a film shown in forty cinemas is forty occurrences and one possibility.
     */
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    /** poster_path, director. ⚠ `posterPath` is superseded by `imagePath`. */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (t) => [
    /*
      Unchanged, and it still means one canonical row per real thing. Postgres
      treats NULLs as distinct in a unique index, so every user-created
      possibility is its own row while the provider-resolved ones stay unique
      per (kind, external id) — which is the behaviour this constraint was
      written for and the reason it does not need a partial predicate.
    */
    unique('items_kind_external_id_key').on(t.kind, t.externalId),
    /*
      A source without an id, or an id without a source, is a half-recorded
      provenance — and the half that goes missing is the one that says which
      catalogue the number belongs to. Both or neither.
    */
    check(
      'items_external_pair',
      sql`(${t.externalSource} is null) = (${t.externalId} is null)`,
    ),
    /*
      The rail's whole read, and the only index the front page needs from this
      table. Amendment 7.

      ⚠ **PARTIAL, on the gate.** `where image_path is not null` is the rail's
      admission rule, so the index holds exactly the rows the rail can show and
      nothing else — the filter disappears into the index rather than being
      applied after it. On a corpus that is mostly imageless (which is what
      Phase 4 makes it) the index stays the size of the rail rather than the
      size of the catalogue.

      ⚠ **Ordered by `id`, which is *by nothing at all* — deliberately.** §2
      permits a rail ordered by what the reader chose or by nothing; a v4 uuid
      is arbitrary and, crucially, **stable**, so a keyset walk over it never
      shows a row twice and never skips one. The read is two indexed range
      scans and no sort at any corpus size.

      ⚠⚠ **THERE IS DELIBERATELY NO INDEX ON `open_count`.** Ordering by it is
      what turns the rail into a trending feed, which Amendment 5 bans by name —
      so the query that breaks the rule is also the one that has to sort the
      whole table to run. **Do not add one.**

      ⚠ **A plain CREATE INDEX takes a lock that blocks writes to this table.**
      At 71 rows that is microseconds. If the corpus is ever large when an index
      here changes, it wants CONCURRENTLY — which cannot run inside drizzle's
      transaction and would need a migration written by hand.
    */
    index('items_rail_idx')
      .on(t.id)
      .where(sql`${t.imagePath} is not null`),
  ],
)

/**
 * @deprecated The legacy name for the same table. It exists so the film-first
 * modules keep compiling through Phase 0 verification, and it goes when they
 * do. New code says `possibilities`.
 */
export const items = possibilities

/** One user's relationship to one item, under one intent. */
export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id),
    intent: text('intent').$type<Intent>().notNull(),
    state: text('state').$type<EntryState>().notNull(),
    /** Experiences only; rewatches, revisits. Objects have no return count. */
    returnCount: integer('return_count').notNull().default(0),
    /**
     * A private one-line note on your own entry (§4-adjacent, decided 8 August).
     *
     * ⚠ **Owner only, forever.** It is why you added the thing, not what you
     * thought of it — the distinction that keeps it on the right side of §4's ban
     * on review, rating, score and favourite. It is unstructured and nobody else
     * can read it, so there is nothing to aggregate and nothing to compare.
     *
     * ⚠ **It must never appear in `listEntriesForOtherUser`'s projection**, which
     * is why that function selects columns by name instead of the whole row. See
     * the note there — this is the third guarantee in the product that fails
     * without a symptom.
     *
     * The identifier is `note`. `no-restricted-syntax` fails the build on
     * `review`, correctly.
     */
    note: text('note'),
    source: text('source').$type<EntrySource>().notNull().default('self'),
    sourceUserId: uuid('source_user_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    // Idempotency (§10): adding the same item twice is a no-op, not a second row.
    unique('entries_user_item_intent_key').on(t.userId, t.itemId, t.intent),
    // The overlap fan-out drives off this one (§6).
    index('entries_item_intent_state_idx').on(t.itemId, t.intent, t.state),
    index('entries_user_state_idx').on(t.userId, t.state),
  ],
)

/**
 * The durable, user-owned record of an intention — and from Phase 0 on, the
 * only thing new writes create.
 *
 * A capture is valid with nothing but its words. `possibility_id` is nullable
 * because the specification is explicit that a person who types *try pottery*
 * has said something complete, and that no catalogue result is required before
 * it can be saved. `intent` is nullable for the same reason: the interface must
 * not ask anyone to categorise anything before they have saved it.
 *
 * ⚠ **`text` is what the person typed, and it survives resolution.** Selecting
 * a suggestion links the capture to a possibility; it does not overwrite the
 * words. That is a §6 requirement, and it is also the only record of what
 * someone meant when the match turns out to be wrong.
 */
/**
 * **The normalising rule, written once.**
 *
 * `normalised_text` is generated by it and search compares against it, so the
 * two have to be the same rule — and the whole argument for generating the
 * column is that there is one implementation of it. Two literals of this
 * expression in two files would be exactly the drift the column exists to
 * prevent, with the same symptomless failure: rows normalised by one rule,
 * queries written in another, and matches quietly not happening.
 *
 * ⚠ **It takes a SQL fragment rather than a column**, so the same rule applies
 * to a query string on its way in. See `searchMyCaptures`.
 *
 * ⚠ **`[[:alnum:]]` rather than `[a-z0-9]`.** The product is not English-only
 * and a capture is any intention in any script; an ASCII class would normalise a
 * Japanese or Arabic capture to the empty string and silently exclude it from
 * matching altogether.
 */
export function normalised(input: SQL) {
  return sql`btrim(regexp_replace(lower(${input}), '[^[:alnum:]]+', ' ', 'g'))`
}

export const captures = pgTable(
  'captures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    /** The words, as typed. Never replaced by a suggestion's title (§6). */
    text: text('text').notNull(),
    /**
     * The words reduced to what matching can compare: lowercased, every run of
     * non-alphanumerics collapsed to one space, trimmed.
     *
     * §7 asks for it, and Phase 2 needs it for the case a possibility cannot
     * serve — two people who both typed *try pottery* and neither of whom
     * resolved it to anything canonical. Exact convergence runs on
     * `possibility_id`; this is the only handle the possible-match path has
     * when that column is null on both sides.
     *
     * ⚠ **Generated, and deliberately not computed in TypeScript.** There is
     * one implementation of the rule and it lives where the rows live, so a
     * writer cannot forget it and two writers cannot disagree about it. The
     * decisive case is the day the rule changes: a generated column makes that
     * a migration which re-derives every row, where a TypeScript function
     * would leave every existing row normalised by the old rule and quietly
     * stop matching them. That failure has no symptom.
     *
     * ⚠ **`[[:alnum:]]` rather than `[a-z0-9]`.** The product is not
     * English-only and a capture is any intention in any script; an ASCII
     * class would normalise a Japanese or Arabic capture to the empty string
     * and silently exclude it from matching altogether.
     */
    normalisedText: text('normalised_text')
      .notNull()
      .generatedAlwaysAs(normalised(sql`"text"`)),
    /** Null until this resolves to something canonical. Most captures start here. */
    possibilityId: uuid('possibility_id').references(() => possibilities.id),
    /**
     * **A provider's answer to *is this a thing?*, offered and not applied.**
     *
     * A capture is complete when it is saved; a suggestion may arrive
     * afterwards, may be wrong, and may never arrive at all (§13). This column
     * is what lets an offer **stand** rather than being recomputed: without it
     * the trailing `?` would need a provider call per line per page open, and
     * a question that disappears when you reload has answered itself.
     *
     * ⚠ **It is never read as a resolution.** Everything that means *this
     * capture resolved to something canonical* reads `possibility_id`, and
     * accepting an offer is the one path that moves the id from here to there.
     * Nothing may join to this column for matching, convergence or display of a
     * title — a suggestion is a question, and §6 keys convergence on the
     * possibility a capture actually has.
     */
    suggestedPossibilityId: uuid('suggested_possibility_id').references(
      () => possibilities.id,
    ),
    /**
     * **When somebody said the suggestion was not the one.**
     *
     * ⚠ **Ignoring is not No, and this column is the difference.** An
     * unanswered offer stands indefinitely — the design is explicit that a
     * question expiring on its own has quietly answered itself. *No* is an
     * answer: it records that this particular possibility is not the one, the
     * `?` goes, and nothing offers it again.
     *
     * ⚠ **The suggestion is kept beside it rather than cleared**, so what was
     * refused stays known. A future offer path has to be able to ask *has this
     * capture already been offered this?* and get a true answer.
     */
    resolutionDeclinedAt: timestamp('resolution_declined_at', { withTimezone: true }),
    /** Optional at capture, refined later. Never asked for before saving (§3). */
    intent: text('intent').$type<Intent>(),
    /**
     * **Where the photograph is**, as a blob pathname — never as a URL.
     *
     * ⚠ **The blob is private and the pathname is not a capability.** §6 asks
     * for an access-controlled media path, and an unguessable public URL is not
     * one: it is a secret that leaks the first time somebody shares a link, and
     * it can never be revoked without deleting the file. The store holds these
     * with `access: 'private'`, so the bytes are reachable only by a token that
     * lives on the server, and `/api/media/[captureId]` is the one door — it
     * checks the session against the owner of *this row* before it opens.
     *
     * ⚠ **A pathname rather than a URL, and the difference is what happens on a
     * store migration.** A URL bakes the host in; a pathname is what the app
     * asked to be stored, so moving stores is a config change rather than a
     * rewrite of every row.
     *
     * ⚠ **A photograph is not a capture until it is captioned**, so this is
     * never the only thing on a row: `text` is `NOT NULL` and the camera opens
     * a line with the caret waiting. That rule is what keeps a textless capture
     * out of the matching path entirely.
     */
    imagePath: text('image_path'),
    /**
     * **Where this came from**, when a link was pasted into the line that
     * became it. §"Optional images" names it beside the image as one of the
     * three things a capture is: text, optionally a picture, optionally a link.
     *
     * ⚠ **It is lifted out of the words, not copied from them.** Pasting a URL
     * into the live row takes it off the line and onto it — a chip beside the
     * caret — so the text stays the sentence somebody wrote rather than a
     * sentence with a URL in the middle of it. That is why this column has to
     * exist: once the link is out of `text`, `text` is no longer where it lives.
     *
     * ⚠ **Private, like `note`.** §"Sender flow" excludes source URLs from a
     * transfer by default, alongside private notes — so no projection built for
     * anybody but the owner may select it. `listCapturesForOtherUser` does not,
     * and there is deliberately no parameter that would let it.
     *
     * ⚠ **Never rendered as anything but a link with the host on it.** A URL is
     * user input that arrives looking like chrome; showing it as a title or a
     * label is how a capture starts claiming something the app did not check.
     * §7's evidence rules are what would have to be satisfied first.
     */
    sourceUrl: text('source_url'),
    /**
     * ⚠ **NULLABLE since step C2a, and that is a step on the way out rather than
     * a loosening.** `state` is the legacy vocabulary's column. It is still
     * written — the dual-write is what keeps every deploy in this migration
     * revertible — but the code that stops writing it cannot deploy against a
     * `NOT NULL`, so the constraint comes off one migration ahead of the deploy
     * that stops filling it.
     *
     * ⚠ **This is the subtractive ordering, and it is `CLAUDE.md`'s rule
     * INVERTED:** an additive change goes to production before the code, a
     * subtractive one after it. Dropping a constraint is the first half of
     * dropping a column, so it goes first; dropping the column itself goes last,
     * once nothing has read or written it for a whole deploy.
     *
     * ⚠ **Nothing is lost when it goes.** `state` is a pure function of
     * `status` and `verdict` — `legacyState` in lib/domain.ts is the bijection,
     * and `tests/state-split.test.ts` proves it round-trips on all five values.
     * The column is redundant, not merely unused.
     */
    state: text('state').$type<CaptureState>(),
    /**
     * ─────────────────────────────────────────────────────────────────────────
     *  The vocabulary migration, stage 1 — STEP A. Added, backfilled, unread.
     * ─────────────────────────────────────────────────────────────────────────
     *
     * `status` and `verdict` are the two axes `state` conflates. The mapping is
     * exactly:
     *
     *     want        -> active,    null
     *     done        -> completed, null
     *     go_back_to  -> completed, 'again'
     *     fixture     -> completed, 'have'
     *     dropped     -> dropped,   null
     *
     * ⚠⚠ **NOTHING READS EITHER COLUMN YET, AND NOTHING MAY UNTIL STEP B.** They
     * are nullable here for one reason: an additive migration old code ignores
     * is a migration a revert push still rolls back, and that is what makes step
     * A safe to run against production on its own. `status` becomes `NOT NULL`
     * in step D, once every writer has been writing it for a deploy.
     * `docs/re-direction/vocabulary-migration.md` is the order.
     *
     * ⚠ **`state` is NOT dropped here and must not be.** It is still the column
     * every reader and every writer uses; dropping it in the same migration that
     * adds these would be the 25 August failure exactly — a schema the deployed
     * code cannot read — with the difference that this one would 500 on every
     * page rather than on some.
     *
     * ⚠⚠ **ADDING A COLUMN HERE CHANGES THE SQL OF QUERIES THAT NEVER NAME IT,
     * so this migration goes to production BEFORE this code does.** There are
     * three bare `select().from(captures)` in `lib/db/captures.ts` — 986, 1101,
     * 1457 — plus nine `.returning()` and a `getTableColumns(captures)`, and
     * Drizzle expands every one of them from this object. Measured with the
     * project's own driver: a bare select emits `"status"` and `"verdict"`. So
     * a deploy that lands first would 500 on every capture write and every
     * idempotency check. **`schema.ts` is not a description of the database; it
     * is the source of the column list every query is built from.**
     */
    /**
     * ⚠ **`NOT NULL` since step C1.** It was nullable for exactly as long as it
     * had to be — step A added it to a populated table, which cannot be done
     * with a constraint. Step B made every writer set it; this is the database
     * saying so permanently, and it is what lets `lifecycleOf`'s null branch go.
     *
     * ⚠ **`state` is still here and still written.** Tightening this is not the
     * same act as dropping that — see the note on `state` above.
     */
    status: text('status').$type<CaptureStatus>().notNull(),
    /**
     * ⚠ **Null is a value here, not an absence** — a capture completed with no
     * opinion attached. See `CaptureVerdict`, and the check constraint below
     * that ties a non-null verdict to a completed capture.
     */
    verdict: text('verdict').$type<CaptureVerdict>(),
    /** Experiences only; revisits, rewatches, second attempts. */
    returnCount: integer('return_count').notNull().default(0),
    /**
     * A private one-line note. **Owner only, forever** — the same guarantee the
     * legacy column carries, and the same reason it must never reach a
     * projection built for anyone else.
     */
    note: text('note'),
    /**
     * ⚠ **Private is the default, in the column.** A capture that is written
     * without an opinion about who can see it is private, so the failure mode
     * of a forgetful writer is a capture nobody else can read.
     */
    visibility: text('visibility').$type<Visibility>().notNull().default('private'),
    /* ---------------------------------------------------------------------- */
    /*  Provenance. Server-owned, and immutable once written.                  */
    /* ---------------------------------------------------------------------- */
    /**
     * ⚠ **Never accept these three from a client, and never update them.**
     * They are the input to the §6 suppression rule, which is the difference
     * between *we both independently want this* and *I took this off your
     * page*. A client that can set its own provenance can make the second look
     * like the first, and the person it notifies is the one person who already
     * knew.
     *
     * Immutability is enforced in `lib/db/` — no mutation function exposes
     * them — for the reason every other guarantee is: `lib/db/` is the only
     * boundary this product has, and a second enforcement point is a second
     * thing that can disagree.
     */
    source: text('source').$type<CaptureSource>().notNull().default('self'),
    /**
     * The capture this one was taken from, when there is one. Nullable
     * forever: a transfer can outlive the record it came from, and the legacy
     * backfill has only a user to point at for rows copied before captures
     * existed.
     */
    sourceCaptureId: uuid('source_capture_id').references((): AnyPgColumn => captures.id, {
      onDelete: 'set null',
    }),
    /**
     * Who it came from. The directional test `isSuppressed` already performs.
     *
     * ⚠ **`restrict`, not `set null`, and the difference is a deletion that
     * aborts.** Nulling this column leaves `source = 'copy'` with nobody to
     * name, which `captures_provenance_shape` refuses — so the referential
     * action would have raised on the constraint and taken the account
     * deletion down with it, at whatever moment someone first tried to delete
     * an account.
     *
     * The conversion runs first instead, in a `before delete` trigger on
     * `profiles` (migration 0007). A capture whose origin has left becomes
     * self-sourced: there is no longer anyone to suppress a convergence
     * against, and self is the only description still true of it. `restrict`
     * then stands behind the trigger as proof it ran.
     *
     * ⚠ **It is a trigger and not a function in `lib/db/` for one reason:
     * Better Auth deletes `user` rows through its own adapter**, which never
     * passes through this layer. A conversion written here would be bypassed
     * by the code most likely to need it.
     */
    sourceUserId: uuid('source_user_id').references(() => profiles.id, {
      onDelete: 'restrict',
    }),
    /* ---------------------------------------------------------------------- */
    /**
     * §6: every capture submission carries one, so a retried save cannot
     * create a second row. Nullable because the backfill has no client and no
     * submission to be idempotent about.
     */
    clientMutationId: text('client_mutation_id'),
    /**
     * The entry this capture was backfilled from, and nothing else writes it.
     *
     * It is what makes the migration re-runnable: a second pass inserts
     * nothing, because the unique index below already holds the row. It is
     * also the only way to verify the backfill against its source while the
     * legacy tables are still there to compare against.
     */
    legacyEntryId: uuid('legacy_entry_id').references(() => entries.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /**
     * §7's minimum fields ask for both timestamps, and they answer different
     * questions: `created_at` is when the intention was captured, this is when
     * the record last moved. Enrichment after the fact is the whole shape of
     * the product — resolve it, name the intention, write the note — so a
     * capture's last change is not derivable from its creation.
     *
     * ⚠ **Maintained by `$onUpdate`, which is Drizzle-side.** That is sound
     * only because every write goes through `lib/db/`, and it is one more
     * reason no second write path may exist. A statement issued outside
     * Drizzle leaves this stale rather than wrong-by-constraint, which is the
     * quiet failure — so migrations that touch captures set it explicitly.
     */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    /*
      One active record per user, possibility and intention (§6) — and no
      constraint at all on captures that have resolved to nothing, because
      Postgres treats NULLs as distinct. That is exactly the behaviour the
      specification asks for in the same paragraph: repeated raw text is not
      automatically discarded, since the same words can mean a different thing
      on a different day, but two captures of the *same possibility* under the
      same intention are one intention.
    */
    unique('captures_user_possibility_intent_key').on(t.userId, t.possibilityId, t.intent),
    /* Retry idempotency (§10). Null for anything the server wrote itself. */
    unique('captures_user_client_mutation_key').on(t.userId, t.clientMutationId),
    /* One capture per legacy entry, which is what makes the backfill re-runnable. */
    unique('captures_legacy_entry_key').on(t.legacyEntryId),
    /* The convergence fan-out drives off this one (§6). */
    index('captures_possibility_intent_state_idx').on(t.possibilityId, t.intent, t.state),
    index('captures_user_state_idx').on(t.userId, t.state),
    /* Home is reverse-chronological and paginated (§10), not a poster wall. */
    index('captures_user_created_idx').on(t.userId, t.createdAt),
    /*
      The possible-match path (Phase 2) joins on this, for the captures that
      resolved to nothing and have only their words in common.
    */
    index('captures_normalised_text_idx').on(t.normalisedText),
    /*
      Provenance has a shape, and half of one is worse than none: a capture
      that says it came from somewhere but cannot say from whom is a capture
      whose suppression cannot be decided. `self` means both are empty; every
      other source must name a person.
    */
    check(
      'captures_provenance_shape',
      sql`case when ${t.source} = 'self'
            then ${t.sourceUserId} is null and ${t.sourceCaptureId} is null
            else ${t.sourceUserId} is not null
          end`,
    ),
    /*
      You cannot take something off your own page. A capture sourced from its
      own owner would suppress the convergence it should have caused.
    */
    check(
      'captures_source_is_not_owner',
      sql`${t.sourceUserId} is null or ${t.sourceUserId} <> ${t.userId}`,
    ),
    /*
      A verdict is an opinion about a finished thing, so there is nothing for it
      to be an opinion about on a capture that is still active or was dropped.
      Written as a constraint for the same reason `captures_provenance_shape`
      is: the shape is a fact about the record, and a fact enforced only in
      `lib/db/` is a fact a backfill or a psql session can walk straight past.

      ⚠ **It tolerates a null `status`, which is what makes it safe in step A.**
      Every existing row has `status IS NULL` until the backfill lands, and a
      constraint that refused those could not be added to a populated table.
      Step D tightens `status` to NOT NULL and this reads as the real rule from
      then on.
    */
    check(
      'captures_verdict_shape',
      sql`${t.verdict} is null or ${t.status} = 'completed'`,
    ),
  ],
)

/** Following is asymmetric. Mutuality is two rows, and it is what overlap requires. */
export const tracks = pgTable(
  'tracks',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followedId: uuid('followed_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followedId] }),
    // Reverse direction, for the self-join that establishes mutuality (§6).
    index('tracks_followed_follower_idx').on(t.followedId, t.followerId),
  ],
)

export const swaps = pgTable('swaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  initiatorId: uuid('initiator_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').$type<SwapStatus>().notNull().default('pending'),
  initiatorCommittedAt: timestamp('initiator_committed_at', { withTimezone: true }),
  recipientCommittedAt: timestamp('recipient_committed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Blind until both sides commit. The visibility check lives in the data-access
 * function for this table (§7.3) — never in a component.
 */
export const swapItems = pgTable(
  'swap_items',
  {
    swapId: uuid('swap_id')
      .notNull()
      .references(() => swaps.id, { onDelete: 'cascade' }),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id),
  },
  (t) => [primaryKey({ columns: [t.swapId, t.fromUserId, t.itemId] })],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<NotificationKind>().notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_created_idx').on(t.userId, t.createdAt)],
)

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    keys: jsonb('keys').$type<{ p256dh: string; auth: string }>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.endpoint] })],
)

/* -------------------------------------------------------------------------- */

/**
 * **Is this notification about this capture?** — the rule, written once.
 *
 * Three reads ask it: the mark's `converged` bit on every line of the record,
 * the portal's join, and `getConvergence` behind a console. ⚠ **They must not
 * each spell it out.** A notification carries no capture id and cannot — a
 * match is about a *subject* that two people's captures both point at, so the
 * viewer's own capture is found at read time — and the day a third subject
 * exists, three literals of this expression in two files is the drift that
 * leaves the mark right on one surface and missing on another. Same argument
 * `normalised()` makes above, applied to a join.
 *
 * ⚠⚠ **TWO TERMS SINCE AMENDMENT 4, AND `itemId` IS UNTOUCHED.** A possibility
 * match carries `itemId`, a words match carries `normalisedText`, and neither
 * carries both — so every notification written before the words path existed
 * is still found by the first term, with no migration and no backfill.
 *
 * ⚠ **A missing key is `null`, and `null = anything` is not true**, so each
 * term is self-excluding on rows of the other kind. That is arithmetic rather
 * than a guard, which is why there is no `payload ? 'itemId'` test here.
 *
 * ⚠ **The privacy term is NOT in here.** Every caller adds its own — the mark
 * correlates `notifications.user_id` to `captures.user_id`, the portal reads
 * pin both to the session. A notification names a counterpart and must never be
 * a door to the counterpart's row (§3); leaving that at the call sites keeps it
 * visible at each one rather than buried in a shared fragment.
 */
export function notificationMatchesCapture() {
  return sql`(
    ${notifications.payload} ->> 'itemId' = ${captures.possibilityId}::text
    or ${notifications.payload} ->> 'normalisedText' = ${captures.normalisedText}
  )`
}

export type Profile = typeof profiles.$inferSelect
export type Possibility = typeof possibilities.$inferSelect
/** @deprecated The legacy name for {@link Possibility}. */
export type Item = Possibility
export type Capture = typeof captures.$inferSelect
export type Entry = typeof entries.$inferSelect
export type Swap = typeof swaps.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type PushSubscription = typeof pushSubscriptions.$inferSelect
