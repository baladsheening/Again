@AGENTS.md

# Again

Section references (§n) point at the build spec, which is the complete brief.
Where it is silent, prefer the simplest thing that works and flag the decision
rather than inventing scope.

## The rule that holds everything up (§3)

**The database is never reachable from the client.** Every query goes through
`lib/db/`, and every function in there takes the authenticated `SessionUser` as
its first argument and filters on it. No Server Component, Server Action or
route handler may query Drizzle directly.

There is no Row Level Security, so there is no backstop. The privacy guarantees
in §5 and §7 are enforced in `lib/db/` and nowhere else. Three things hold it up:

1. `import 'server-only'` at the top of every module in `lib/db/`.
2. `SessionUser` is branded; its constructor is private to `lib/db/session.ts`,
   so a caller cannot fabricate one.
3. `no-restricted-imports` in `eslint.config.mjs` bans `drizzle-orm`,
   `lib/db/client` and `lib/db/schema` outside the layer.

Two functions carry guarantees that are invisible when broken:

- `listEntriesForOtherUser` — never returns `state = 'done'`. The exclusion is
  unconditional and there is deliberately no parameter that can turn it off.
  **Do not add an `includeArchive` flag.**
- `getSwap` — withholds the counterparty's picks until both
  `initiator_committed_at` and `recipient_committed_at` are set.

Both are covered by tests (§13). They are the only two places where a silent
bug damages trust rather than function.

## Overlap (§6)

All of it lives in `lib/overlap.ts`, called from the entry mutation. It is the
thing most likely to drift if it gets scattered — do not duplicate any of it.

- The fan-out is **one set-based SQL statement**, joining `tracks` to itself for
  mutuality and then to `entries`. Never loop over a user's mutual tracks
  issuing a query each. Retrofitting this is a rewrite, not an optimisation.
- The mutation writes `notifications` rows and returns. Push delivery happens in
  a background worker, never inline.
- The suppression rule is the most important line in the app. Without it,
  copying something off someone's page pings them that you match, which is
  noise — they are the source.
- Six notification kinds, and that is the complete set. No digests, no streaks,
  no re-engagement.

## Vocabulary (§4)

Use these exact words in the UI **and** in code identifiers: want, intent,
go-back-to, fixture, track, swap, convergence. The naming is load bearing —
"go-back-to" states the entry criterion, which is why it stays the label.

Never use: recommendation, review, rating, score, favourite, saved, bookmark,
feed. Enforced by `no-restricted-syntax` in `eslint.config.mjs`.

Intent is a property of the **entry**, never of the item. Never infer it from
`items.kind`. Never ask the user to categorise anything — derive the label from
`kind + intent` via `lib/vocabulary.ts`.

## State (§5)

- **Nothing is ever deleted.** There is no delete action anywhere in the
  product. Resolving changes state, never removes the row. The only exception is
  a 10-second undo on creation, for typos.
- **A go-back-to is still a want.** The live view is
  `state in ('want','go_back_to')`, not `state = 'want'`.
- **`state = 'done'` is private.** Owner only, never in anyone else's view or in
  any aggregate.
- Fixtures are deliberately *not* in the live pool. They still participate in
  overlap — that is the `lend` match.

## Out of scope (§2) — do not build these even if they seem natural

Kinds beyond `film`. **Availability, acquisition or "where to get it"** — no
streaming lookup, no library availability, no retailer links, no price tracking,
no ownership inventory; this is the most tempting wrong feature in the whole
design because it looks helpful. Provider dashboards. Maps, images beyond poster
thumbnails, feeds, likes, comments, scores, stars. Scheduling, calendars, RSVPs,
group chat. Public discovery, search for strangers, algorithmic recommendation.

If a feature request makes the app more useful to a stranger, it is probably
wrong.

## Visual (§11)

Matte black, legible text, known icons. Text-first. Type is the entire design.
Tokens are in `app/globals.css`.

**Amber (`--color-accent`) marks overlap state and nothing else.** Not on
buttons, not on links, not on the active tab. It stops meaning anything the
second it is used for decoration.

IBM Plex Sans for interface, IBM Plex Mono for return counts and timestamps.
Avoid Inter. The signature element is the return count beside each go-back-to —
mono numeral, quiet weight, large enough to read as the point.

## Non-negotiables (§10)

Zod at every boundary. Mutations idempotent — adding the same item twice is a
no-op, not a duplicate row and not a second notification. Every multi-write
operation in one transaction. Paginate every list; no unbounded selects. TMDB
key server-side only, proxied and cached. Poster images come from TMDB's CDN —
**never proxy images through the app.** Typed `Result` returns from `lib/db/`
rather than thrown exceptions for expected failures.

## Scale (§10)

Build so nothing *prevents* scale; do not build *for* millions now. The mechanic
requires density inside friend groups — two hundred people in twelve clusters
produces constant overlap, a million strangers spread evenly produces none.

## Commands

```
npm run dev          # Turbopack, default in Next 16
npm run typecheck
npm run lint
npm run db:generate  # after any change to lib/db/schema.ts
npm run db:migrate
```
