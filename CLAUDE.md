@AGENTS.md

# Again

## Product-direction precedence

The product is being redirected from a film-first diary to a private-first
intent-capture and convergence app. The normative product and build
specification is docs/re-direction/implementation-spec.md.

This file continues to own engineering invariants: the database boundary,
session handling, privacy enforcement, validation, transactionality,
responsive quality, and testing. The film-specific vocabulary, state, visual,
and scope sections below describe the legacy implementation. **Phase 1
replaces them**, not Phase 0 — Amendment 1 to the specification moved the
canonical vocabulary and status copy there, because converting the records and
changing the words on screen want the screens that display them. Do not use a legacy product rule to
block a feature required by the implementation specification.

Unless marked legacy, section references (§n) point at the film-first build
specification. The re-direction specification is the complete brief for future
product work. Where both are silent, prefer the simplest thing that works and
flag the decision rather than inventing scope.

## Where the build stands — 23 August

**Phase 0 is done, deployed and verified.** `origin/main` is at `33ff151`.

**Phase 1's page and Return are built and deployed** — `main` at `1fa2ea9`, no
migration in it. `/` is the capture page in production. `/` is the capture page; the poster wall,
`components/shell.tsx` and the four collection routes are deleted.

⚠ **Deployed is not verified.** Nothing in Phase 1 has been seen on a handset,
and the installed app never reloads until it is force-quit — so check which
build is running before believing anything reported from it.

⚠ **Read `docs/re-direction/phase-1-capture.md` before touching Phase 1.** Its
*Build status* section is the register: what is built, what is still to build in
the order it wants doing, and — the part that is easy to miss because it looks
finished — **the two things only a handset can answer**: the keyboard pin, and
the four-second capture itself. Neither can be measured on a desk, and nothing
else in Phase 1 is worth doing before them.

This file holds the engineering rules for building. Three companions:

- **docs/re-direction/implementation-spec.md** — the normative product and
  delivery specification for all new work. Read it before designing a feature
  or migration.

- **`docs/decisions.md`** — the reasoning behind these rules, the choices that
  deviate from or extend the brief, and the questions nobody has answered yet.
  Read it before changing anything that looks arbitrary; most of it is waiting
  on a trigger rather than on someone's opinion. Add to it when you make a call
  the brief did not make.
- **`docs/plan.md`** — the historical film-first build register and
  carry-forward constraints. Read it for migration context, but do not schedule
  or track re-direction phases there; the implementation specification owns
  that sequence.

## How things get fixed

**Every fix is structural, and every fix holds on every device.** A change that
makes the symptom go away on the handset in front of you is not a fix. It is a
constant waiting to be wrong on the next screen.

Ruled out by name: numbers tuned until one device looks right, thresholds and
timeouts chosen to outlast one platform's animation, branches that sniff for a
browser, and any correctness argument that reduces to "it looks fine here". A
workaround written for one engine still executes on all of them, which makes it
everyone's liability — so prefer removing the collision to correcting for it.

Reach in this order: **remove the mechanism**, then **remove the condition it
fails under**, and only then correct it. A subtraction cannot be wrong on a
device nobody has tested.

Four surfaces ship: iOS Safari installed, iOS Safari in a tab, Android, and the
desk — with iPad crossing the `rail` breakpoint into a fifth layout. Done means
right by construction on all of them, not measured right on one.

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

### Re-direction migration

The current references to entries in this section describe the legacy
film-first implementation. In the new model, one matching module remains the
single owner of convergence, classification, suppression, and notification
writing, but it is called when a capture becomes active or resolves to a
possibility, and when a track becomes mutual. Do not create a second matching
implementation for captures. Capture provenance copied or transferred from the
counterpart suppresses convergence: a received list is not an independent
common intention.

In the deployed legacy model, all of it lives in `lib/overlap.ts`, called from
the entry mutation. Phase 0 moves that caller to capture mutations while keeping
the one matching owner; do not duplicate any of it.

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

## Re-direction vocabulary

New product code and user-facing copy use: capture, possibility, claim, offer,
occurrence, intention, track, transfer, and convergence. A capture is the
user-owned record; a possibility is the shared world record it may resolve to.

Do not use review, rating, favourite, public score, or feed for either the new
or legacy product. Use of recommendation is limited to an explained,
user-controlled local relevance result; there is no recommendation feed.

The restricted-vocabulary ESLint rule enforces this list, and bans each word
as a **word**: `migrating` is not a rating and `preview` is not a review.
Two words the legacy section names are deliberately not in it. `saved` never
was, and must not be added: saving is the new product's central verb. `score`
came off, because §7 requires an internal reliability score that ranks results
without ever surfacing as a number — a linter cannot tell those apart, so the
guarantee is §7's evidence states and review, not the pattern.

## Legacy vocabulary (§4)

Use these exact words in the UI **and** in code identifiers: want, intent,
go-back-to, fixture, track, swap, convergence. The naming is load bearing —
"go-back-to" states the entry criterion, which is why it stays the label.

Never use: recommendation, review, rating, favourite, bookmark, feed. Enforced
by `no-restricted-syntax` in `eslint.config.mjs`. This list used to name
`score` and `saved` as well; see "Re-direction vocabulary" above for why the
rule does not, and why adding them back would break the specification.

Intent is a property of the **entry**, never of the item. Never infer it from
`items.kind`. Never ask the user to categorise anything — derive the label from
`kind + intent` via `lib/vocabulary.ts`.

## Legacy entry state (§5)

This state machine describes existing film entries. It remains in force for
legacy rows until they are migrated. In the new model, captures are the
user-owned record and use the lifecycle and visibility rules in the
implementation specification. Nothing in this section authorises deleting a
user's historical data during migration.

- **Nothing is ever deleted.** There is no delete action anywhere in the
  product. Resolving changes state, never removes the row. The only exception is
  a 10-second undo on creation, for typos.
- **A go-back-to is still a want.** The live view is
  `state in ('want','go_back_to')`, not `state = 'want'`.
- **`state = 'done'` is private.** Owner only, never in anyone else's view or in
  any aggregate.
- Fixtures are deliberately *not* in the live pool. They still participate in
  overlap — that is the `lend` match.

## Release 1 exclusions

The re-direction deliberately permits kinds beyond film, user-contributed
possibilities, sourced local offers, and later opt-in stranger matching. The
following are still out of scope for Release 1:

- payments, checkout, price comparison, affiliate optimisation, and retailer
  ranking
- a claim to complete local or worldwide coverage
- likes, comments, public activity feeds, streaks, or engagement metrics
- a forced search or catalogue match before a person can save a capture
- continuous background location tracking
- public stranger discovery or distal matching before Phase 6's adult,
  consent, blocking, reporting, and moderation requirements exist
- group chat, scheduling, calendars, and RSVPs

Local offers and occurrences are a later sourced layer. They require
provenance, freshness, and an approved location launch contract before they can
be shown. A source link is evidence and attribution, not a purchase prompt.

## Legacy visual (§11)

These tokens and components describe the deployed film-first interface. Preserve
its accessibility and responsive guarantees while the re-direction is built,
but do not treat its poster wall, return count, or cinema imagery as required
for the new Home surface. The new interface follows the text-first,
Notes-like requirements in implementation-spec.md.

Matte black, legible text, known icons. Text-first. Type is the entire design.
Tokens are in `app/globals.css`.

**Amber (`--color-accent`) marks overlap state and nothing else.** Not on
buttons, not on links, not on the active tab. It stops meaning anything the
second it is used for decoration.

⚠ **Phase 1's capture page breaks this deliberately, and it is the one place a
build has been allowed to.** The chrome is brass — bar, foot, caret, and the
mark on a picked line — which is the design's own decision with the cost stated
in `docs/re-direction/phase-1-capture.md`. It is not a licence to spend the
accent elsewhere: everything else on the page is `--color-text` or a fade of it.

**So overlap needs a different colour in Phase 2, and picking it is Phase 2's
first visual decision.** The ladder is this rule's own argument — the accent's
job is to interrupt, so its replacement has to out-shout brass on a screen that
is now full of it. Do not pick it before there is a convergence to look at.

⚠ `--color-caret` is deleted, by its own terms: a third meaningful colour was
only defensible for a claim the other two could not make, and with a coloured
chrome the caret is the accent.

IBM Plex Sans for interface, IBM Plex Mono for return counts and timestamps.
Avoid Inter.

⚠ **Both halves of that sentence are out of date and are kept for the rule
inside them.** The interface face is **Fira Sans** since 21 August, a stated
deviation written up in `docs/decisions.md`; the mark is **Jost** in full caps.
The return count was removed on 8 August, so there is no signature element and
the sentence that named one is gone. Mono survives for what it was always for —
timestamps, the handle input, and the page's day stamps — and it stays scarce
for the reason the accent does: on every label it is texture rather than signal.

## Non-negotiables (§10)

Zod at every boundary. Mutations are idempotent: retrying the same client
capture submission cannot create a duplicate row or notification. Every
multi-write operation is one transaction. Paginate every list; no unbounded
selects. Provider credentials remain server-side only, proxied and cached.
TMDB images continue to come from TMDB's CDN; user-contributed images follow
the media-storage and provenance rules in implementation-spec.md. Typed
`Result` returns from `lib/db/` rather than thrown exceptions for expected
failures. Transfer-session claim, acceptance, cancellation, and replay handling
follow the same transaction and idempotency rules.

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
