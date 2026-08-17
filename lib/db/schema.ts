import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Domain unions live in `@/lib/domain` — they are vocabulary (§4), not schema,
 * and Client Components need them without reaching the database.
 */
import type {
  EntrySource,
  EntryState,
  Intent,
  Kind,
  NotificationKind,
  SwapStatus,
} from '@/lib/domain'

export type {
  EntrySource,
  EntryState,
  Intent,
  Kind,
  NotificationKind,
  SwapStatus,
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

/** Canonical, shared across all users. One row per real-world thing. */
export const items = pgTable(
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
     */
    externalSource: text('external_source').notNull().default('tmdb'),
    /** TMDB id for films. Namespaced by `kind`. */
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    year: integer('year'),
    /** poster_path, director */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (t) => [unique('items_kind_external_id_key').on(t.kind, t.externalId)],
)

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

export type Profile = typeof profiles.$inferSelect
export type Item = typeof items.$inferSelect
export type Entry = typeof entries.$inferSelect
export type Swap = typeof swaps.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type PushSubscription = typeof pushSubscriptions.$inferSelect
