# Decisions

> **Mixed status.** *The re-direction* section below is current and applies to
> new work. Everything after it records decisions for the film-first product and
> its deployed implementation. When one of those conflicts with
> docs/re-direction/implementation-spec.md, the re-direction specification
> governs future work. Reuse the technical reasoning there only where it remains
> compatible with the new model.

Why things are the way they are, and what is still open.

`CLAUDE.md` holds the rules for building. This holds the reasoning behind them,
the choices that deviate from or extend the brief, and the questions nobody has
answered yet. If a decision here looks wrong later, the "what would change this"
line is the thing to check first — most of them are waiting on a trigger, not on
someone's opinion.

---

## The re-direction — 22 August

The product moved from a film-first diary to intent capture and convergence.
`docs/re-direction/implementation-spec.md` is normative: it owns the model, the
vocabulary and the phase sequence, and none of that is restated here. These are
the calls the specification left open, taken on 22 August. Everything below this
section is the film-first record.

### Visibility becomes a column, and the state allowlist stays

Visibility is currently derived from state alone. `PUBLIC_STATES` in
`lib/domain.ts` publishes `want`, `go_back_to` and `fixture`, and any signed-in
account holding a handle reads them. The specification requires captures private
by default, with one social scope: shared with mutual tracks.

The tempting reading is that a visibility column *replaces* the state filter. It
does not. §14 still requires that done, dropped, disputed and stale states are
never exposed, so a capture scoped to mutuals and then dropped has to disappear
anyway.

**Visibility is a fourth positive term, not a replacement.** A capture reaches
someone else only when its scope is `mutuals`, the relationship is mutual, and
its state is in `PUBLIC_STATES` — three conditions, all stated positively, all
failing closed.

The allowlist is positive for the reason already recorded against it:
`ne(state, 'done')` was correct exactly until `dropped` existed, and then it was
wrong with no symptom. Retiring the allowlist in favour of a visibility column
recreates that bug in a new place, where it would again fail by publishing
rather than by hiding.

### The migration lands every existing entry private

Phase 0 migrates entries into captures, and has to choose a scope for rows
created under a regime where the owner understood them to be handle-visible.

Private is the direction that cannot leak. It is not free: every migrated row
leaves the convergence pool until its owner re-shares it, so friend convergence
effectively starts empty.

**Took private.** The cost is acceptable only because the population is the
author plus test accounts — the databases were separated and the test accounts
cleared on 17 August. **This reasoning is contingent, not principled.** The same
choice against a real userbase is a silent feature outage, and a later migration
reaching for this precedent should read this paragraph rather than the verdict.

### `/u/[handle]` stops being a browse surface

Once non-mutuals see nothing, the page cannot show them an empty list. Empty is
ambiguous between *this person has nothing* and *this person has nothing for
you*, and the first is a claim about someone else's list that the app has no
business making.

**Non-mutuals get one unconditional state: the list is not shared with you.**
Unconditional is what makes it leak-free — the same response whether the owner
holds a thousand captures or none, so it carries no information about them.

The consequence is larger than the page. The old flow was *find handle → read
the list → decide to track*. That is gone, and nothing on the page replaces it.

### Mutual-only sharing does not ship without the handshake

Which makes the QR/code contact handshake load-bearing earlier than its position
in Phase 2 suggests. It is not a convenience for two people who happen to be in
the same room; after the inversion it is close to the only way anyone becomes
connected at all.

**The handshake is a required companion to mutual-only sharing in any usable
release**, even though the migration lands first and could technically ship
without it. A release that inverts visibility and offers no working way to
create a mutual track is an app in which nobody can see anybody.

### The copy rule survives; only its justification is retired

`app/(app)/u/[handle]/page.tsx` argues that public browsing must stay open
*because* §6's suppression rule exists to suppress copying off someone's page —
if the page needed permission, the rule would have nothing to suppress.

**That justification is retired. The rule is not.** The specification keeps both
conditions by name: a match is suppressed by the existing copy/source rule, and
when either capture was transferred from the other participant. Copying does not
disappear under mutual-only visibility, it narrows. A mutual can still copy off
a mutual, and receipt is still not independent discovery.

The mechanism already has the right shape. `isSuppressed` in `lib/overlap.ts`
tests `source` against `sourceUserId` directionally, which is what the
specification means by server-owned provenance. Transfer is a third value in
that union, plus a mutation that clears the pair when a receiver makes a
transferred capture their own. `'swap'` already occupies the bulk-copy slot and
swaps were never built, so the value is available.

**Do not delete the copy rule while deleting the paragraph that defended it.**

### The film screen stays; the wall goes with the Home it belonged to

The specification demotes the film screen to one type of resolved detail, and
removes the cinema wall from Home.

**Keep `film-screen.tsx` as the detail surface for a capture resolved to a media
possibility.** That is what the specification asks for, and the geometry that
settled into it — the receded poster, the cross-off, the corner disc — would
otherwise be rebuilt worse.

**Remove `cinema-wall.tsx`, `poster-wall.tsx` and `poster-tiles.tsx` when the
capture-first Home replaces them, rather than switching them off.** No flag and
no dormant surface: *remove the mechanism* is the first reach in `CLAUDE.md`,
and the app already carries one thing living behind a constant — the wall
caption, after D1. A second one is a pattern.

### The vocabulary rule bans words, not letters (22 August)

The first change of Phase 0, and deliberately the smallest: no product
behaviour moves, and the model can be written in its own names from its first
line of code.

**The pattern was matching letters.** One unanchored alternation of seven
words, tested against the whole identifier, so it read `migrating` as a
*rating* and `preview` as a *review*. Phase 0 is a data migration and Phase 1
attaches an image; `hydrating`, `operating`, `separating` and `underscore` were
queued behind the same fault. A rule that fails this way fails as a build error
inside whatever feature was unlucky, and the person who meets it has no reason
to suspect the linter.

**A banned word must now begin a segment and end one, give or take an
inflection.** Start is the identifier, a `_` segment, or a camel hump; the
inflections keep `reviews`, `reviewer` and `bookmarked` caught. The end
constraint exists for exactly one word — `feed`, without which `feedback` is a
violation — and `feed` could not be added to the list until it existed.

**The message and the pattern had disagreed for months.** The message read
"recommendation, review, rating, score, favourite, saved, bookmark, feed"; the
pattern contained neither `saved` nor `feed`. There were two ways to reconcile
them and only one was survivable: **`saved` must never be added**, because
saving is the new product's central verb — "pressing Return saves the text",
"optimistic save and undo". Someone tidying the message into the pattern would
have banned the capture flow, and would have been reading the message as the
rule.

**`score` came off the list.** §7 requires an internal reliability score that
ranks results while the interface speaks evidence states — Unverified,
Corroborated, Disputed. A linter cannot tell a ranking value from a rendered
number, so the rule stops claiming to; the guarantee is §7's state list. Banned
copy is now the reviewer's job for this one word, which is the honest position
rather than a rule that is wrong in both directions.

**A segment ends differently in `SCREAMING_SNAKE`, and the first attempt at
this got it wrong.** In `camelCase` a capital opens a new segment, so "not
followed by a lowercase letter" is a sound ending. In all caps every letter is
a capital and the only separator is `_`, so the same test read `FEEDBACK` as
`FEED` — the exact false positive the change was made to remove, reintroduced
one casing over. The three casings are now three branches with two endings:
lower and capitalised end where lowercase stops, all-caps ends where letters
stop. ⚠ It survived the first table because that table tested one casing per
word; every word now appears in more than one.

**`recommendation` stays banned as an identifier.** CLAUDE.md permits the
*idea* narrowly — an explained, user-controlled local relevance result — but
the specification's own words for that surface are "For you here" and
"relevance". Nothing the specification asks for needs the identifier, so the
strongest available signal costs nothing to keep.

**There is now a third test, against a config that says there are two.**
`vitest.config.ts` admits only guarantees that fail with no symptom, and this
one qualifies on both of its failure modes: a pattern that stops matching
leaves lint, typecheck and every screen exactly as they were, and a pattern
that matches too much is discovered by someone else, later, as an error about
their own code. The regex is now *built* from a word list, so one edit to the
builder moves every word at once — `tests/vocabulary.test.ts` holds a table of
seventeen identifiers that must be rejected and twenty-four that must pass —
the re-direction's own vocabulary, ordinary English containing a banned word,
and both of those in more than one casing.

### Captures, possibilities, and a fourth positive term (22 August)

Phase 0's schema. Nothing the user can see moves: every legacy entry becomes a
capture, every capture lands private, and the film-first screens keep reading
the tables they always read.

**The table is `captures` and the physical relation is still `items`.** §12
says to retain the items table as the starting point for canonical
possibilities and migrate the film rows rather than discard them, so the recast
is a rename in code — `possibilities`, with `items` left as a deprecated alias
while the film-first modules still compile against it. Renaming the relation
would have put a data move underneath a vocabulary change, and the two want
separate migrations for the same reason they want separate reasoning.

**`possibility_id` and `intent` are both nullable, and that is the product.**
A person who types *try pottery* has said something complete; the specification
is explicit that no catalogue result may gate a save and that nobody is asked
to categorise anything before saving. A schema that made either column
mandatory would have re-imposed the search gate the re-direction removed.

**`external_source` lost its `'tmdb'` default at the same time it became
nullable, and that matters more than the nullability.** A default is an
invention arrived at by omission: a user-created possibility would have
acquired a provider it never came from, silently, at insert time. §12 forbids
the fake identifier; the default was the mechanism that would have produced
one. A check constraint now requires both halves or neither, because a source
without an id and an id without a source are each half a provenance, and the
half that goes missing is the one naming which catalogue the number belongs to.

**Uniqueness is carried by NULLs being distinct, not by partial indexes.** One
unique key on (user, possibility, intention) is simultaneously the §6 rule that
a resolved capture is one active record, and the §6 rule that repeated raw text
is not discarded — because a capture that resolved to nothing does not collide
with anything. The same trick keeps user-created possibilities out of the
(kind, external id) key. Neither constraint needed a predicate.

**Provenance is the input to suppression, so it has a shape and the shape is
checked.** `self` means both origin columns are empty; every other source must
name a person. A capture sourced from its own owner is refused outright — it
would suppress the convergence it should have caused. Immutability is a
`lib/db/` property: no mutation function exposes the three columns.

#### The deletion that would have aborted

`source_user_id` was first written ON DELETE SET NULL, copying the legacy
column. That is unimplementable next to the shape check: nulling the column
leaves `source = 'copy'` with nobody to name, the check refuses it, and the
referential action raises — **taking the account deletion down with it.** The
fault would have surfaced at whatever moment someone first deleted an account,
which is to say long after the decision that caused it.

**The conversion runs before the delete, and the constraint became RESTRICT
behind it.** A capture whose origin has left becomes self-sourced: the account
is gone and so are its captures, so there is nobody left to suppress a
convergence against and self is the only description still true of the row.
RESTRICT then stands behind the conversion as proof that it ran.

⚠ **The conversion is a `before delete` trigger on `profiles`, and it is the
only behaviour in this schema that does not live in `lib/db/`.** Better Auth
deletes `user` rows through its own adapter, and the cascade from `user` to
`profiles` never passes through this application's data layer — so a conversion
written in `lib/db/` would be bypassed by the code most likely to need it. This
is a deliberate exception to the rule in `CLAUDE.md`, and the argument for it is
the same argument that rule is made of: enforcement belongs where it cannot be
routed around.

Both halves were verified against the development branch rather than reasoned
about: with the trigger disabled the deletion aborts on
`captures_source_user_id_profiles_id_fk`, and with it enabled the deletion
succeeds and the capture comes back `self` with both origin columns null.

#### Still missing from §7's minimum fields

`updated_at` was missing and is now in. Three more are named in the same list
and are deliberately not here yet: **normalised text for matching**, an
**optional image asset**, and an **optional source URL**. Each wants the code
that fills it — normalisation with the capture mutation, the asset with the
media-storage decision in §6 — and a column nobody writes is a column that
lies about what the row contains.

### The normalisation lives in the column (22 August)

§7's minimum fields ask a capture to carry normalised text as well as the words
someone typed. Phase 2 needs it for the case a possibility cannot serve: two
people who both typed *try pottery* and neither of whom resolved it to anything
canonical. Exact convergence runs on `possibility_id`; this is the only handle
the possible-match path has when that column is null on both sides.

**It is a generated column, not a TypeScript function.** One implementation of
the rule, living where the rows live, so a writer cannot forget it and two
writers cannot disagree about it.

⚠ **The decisive case is the day the rule changes.** A generated column makes
that a migration that re-derives every row. A TypeScript function would leave
every existing row normalised by the old rule while new rows used the new one,
and the two would quietly stop matching each other — a failure with no symptom,
in the one part of the product whose whole job is finding that two things are
the same. It also backfilled all thirty-three migrated rows for free, because
that is what `ADD COLUMN ... GENERATED` does.

The rule is: lowercase, every run of non-alphanumerics collapsed to a single
space, trimmed. ⚠ **`[[:alnum:]]` rather than `[a-z0-9]`** — an ASCII class
would reduce a Japanese or Arabic capture to the empty string and drop it out
of matching entirely, which is not a defect anyone would see until someone
captured something in their own language.

⚠ **Accents are not folded.** `café` and `cafe` will not match. `unaccent()` is
not immutable, so it cannot appear in a generated column without wrapping it,
and folding is a lossy choice that deserves its own decision rather than
arriving as a side effect of this one.

#### The gate, and testing it in its failing configurations

`listCapturesForOtherUser` requires four positive terms: the scope is shared,
the track is mutual in *both* directions, the state is published, and the
reader is not the owner. Mutuality is two INNER JOINs rather than a flag, so a
missing track row removes every candidate rather than widening the result.

⚠ **All four are in the predicate, and the fourth one started out as an early
return.** `if (targetUserId === viewer.id) return []` is control flow, and
control flow is what gets refactored away — a test written against it passes
whether or not the query is correct, because the query never runs. It is now
`ne(captures.userId, viewer.id)` and the early return is gone: one mechanism,
and the one that can be tested.

⚠ **The joins do not stand in for that term.** Nothing stops a `tracks` row
from naming the same person twice, and a self-track satisfies both of them —
so the owner-target test seeds exactly that row, leaving the reader-is-not-the-
owner term as the only thing that can refuse the read.

The tests take the terms away one at a time. A guarantee only ever exercised in
its passing configuration is a guarantee nobody has checked — so the visibility
filter, the state filter, the second track join and the owner term were each
removed in turn and the suite confirmed to fail on exactly the assertion that
names them, and to pass again when restored.

#### Provenance is not something a caller can say

The three source columns were reachable twice over, and a comment saying
"server-supplied only" was the whole of the enforcement.

**They were optional fields on the public input type**, which is one spread of
a parsed request body away from being client-controlled — and a caller that can
name its own provenance can switch suppression off, which turns copying
somebody's list into a way of notifying them. The public input no longer has
them. The writer that does is private to the module, so the only two callers
that can supply a provenance are `addCapture`, which always supplies *self*,
and `copyCapture`, which reads it off the row being copied.

**And reviving a dropped capture rewrote it.** The legacy `addEntry`
deliberately refreshed `source` on every revive, reasoning that a stale source
would withhold a notification that should now fire. Captures invert that: a row
that came off somebody's page came off it, and if re-adding the thing erases
that, the suppression rule can be switched off from the client by anyone
willing to cross something out first.

⚠ **The one movement still allowed is `self` → sourced, and it is allowed
because it can only ever suppress more.** Add something yourself, cross it off,
then copy it from the person who had it: without this the revived row claims to
be independently yours and notifies the very person you took it from. Clearing
provenance is impossible in either direction; that belongs to a deliberate
*make this one mine* mutation, which does not exist yet.

⚠ **`/u/[handle]` must not render an empty list for a non-mutual.** *This
person has nothing* and *this person has nothing for you* are different claims,
and the first is one the app has no business making about somebody else. The
function returns nothing in both cases by design; the page has to say the list
is not shared, unconditionally.

### The callers move, and `entries` stops being written (22 August)

The Phase 0 exit criterion is that no parallel write path remains. It is met by
subtraction: `addEntry`, `copyEntry`, `resolveEntry`, `dropEntry`,
`restoreEntry`, `setEntryNote`, `undoEntry` and their shared `fireOverlap` are
**deleted**, not deprecated. `entries.ts` holds reads and nothing else, so
"read-only" is a fact about the module rather than a rule someone has to
remember.

The Server Actions keep their names. `addFilmAction`, `crossOffAction` and the
rest still say entry, and every component that calls them is untouched — the
actions file is the seam between a film-first interface and the capture model
underneath it, and renaming the seam is Phase 1's job. What matters is that
nothing in it *can* write an entry.

**Reads had to move too, and that is not optional.** A frozen table read by
live screens does not merely go stale: cross something off today and your page
would still show it as a want, which is the app showing something its owner has
retracted. Once the writes moved, the reads had no choice but to follow.

#### The one deliberate copy change

`/u/[handle]` now reads captures, so a non-mutual sees nothing — and its empty
line said *Nothing here yet*, which is a claim about the owner that the app has
no business making. It now reads *This list is not shared with you* for anyone
who is not a mutual.

⚠ **The condition is the track and only the track**, never the size of the
result, so the sentence is identical whether the owner holds a thousand
captures or none. A copy that depended on the count would leak exactly what the
scope was hiding.

#### Overlap fans out from captures, and the scope is part of the query

Both statements — the counterpart lookup and the pair fan-out — now join
`captures`, and both carry two new terms: the capture must be shared, and its
intention must not be null. A private capture is not a signal to anybody, so a
fan-out that ignored the scope would notify someone about a list its owner
never opened. `classify` decides on the pair of intents, so a capture without
one cannot be classified; it is excluded in SQL rather than filtered afterwards,
which keeps the statement one statement.

**Sharing became the third trigger.** Creation, state change, and now
`setCaptureVisibility` — because every migrated capture landed private, so
nothing converges until its owner shares it, and without this the moment a
capture became a signal would pass unobserved.

⚠ **Expect convergence to be quiet.** That is the cost of the private
migration, and it is the accepted one, not a regression.

⚠ **`= any(${array})` does not work and fails only at runtime.** Drizzle sends
a JS array as one parameter and Postgres reads it as an array literal, which
`'mutuals'` is not — `22P02`, from a statement that type-checks perfectly.
`sql.join` expands to one placeholder per value, which is what an `in` list
wants. **The test written for the visibility guard is what found it**, on its
first run, which is the argument for writing the test alongside the query
rather than after it.

### Suppression names the source that does *not* suppress (22 August)

`isSuppressed` read `source === 'copy' || source === 'swap'`. `swap` was
designed and never built; `transfer` took its slot in the capture model, and
the backfill maps the one legacy value to it. So a transferred capture looked
independent to the most important line in the app, and the person it would have
notified is the person who had just handed the list over.

⚠ **It is now the inverse: everything that is not `self` suppresses.** A source
added later suppresses until somebody decides it should not, which is the
direction this has to fail in — the cost of suppressing too much is a
notification nobody gets, and the cost of suppressing too little is telling
someone they match a list they gave you.

`Side.source` and `Counterpart.source` are `CaptureSource` rather than `string`
for the same reason, so a value that genuinely should notify has to be admitted
on purpose.

⚠ **Nothing about the old line looked incomplete**, which is why it survived
the port that renamed everything around it: a list of two values reads like a
finished thought. The regression test is the part that would have caught it —
with the old rule restored it fails on the transfer case and passes on the copy
case, which is exactly the shape of the bug.

A transfer is also the copy argument at volume: §9 hands over a selected set at
once, so a transfer that did not suppress would fire one alert per row at the
person who had just handed them over, in the minute after they did it.

### Amendment 1 to the specification — vocabulary and fixtures (22 August)

Two Phase 0 deliverables moved, one because it was mis-specified and one
because it was unsatisfiable. The specification is normative, so both moved by
a dated amendment listed at the top of it rather than by an edit to §13 that
nobody would notice.

**Unused types are not delivery.** `kind` and `intent` are plain `text`
columns — no enum, no check — so widening `Kind` to §3's seven possibility
types and `Intent` to its six intentions needs no DDL at all. It was described
here earlier as a migration, which overstated it: what needs a migration is
*converting* existing rows, not expanding the vocabulary they are checked
against.

That correction cuts both ways, and the second cut is the one that decided
this. If the expansion is nearly free, the argument for landing it in Phase 0
becomes *it is nearly free* — which is not an argument that it is finished.
Nothing constructs a `place` or a `visit` today: no screen offers enrichment,
no surface renders a possibility type, and `specFor` entries for the new pairs
would be written against nothing that could show them wrong.

⚠ **It is the same fault as a column nobody writes**, which this project
already refused twice — `image_asset` and `source_url` were held back from the
capture table for exactly this reason. A union nobody constructs is that fault
at type level, and it is worse in one respect: a column reads as empty, while a
type reads as done.

**And expanding it would not have satisfied §13 anyway.** The deliverable is
*canonical vocabulary and status copy* — the conversion of existing records and
the words on screen. Types without either leave every row saying `film` and
every heading saying *Wants*. Landing them in Phase 0 would have bought unused
surface while leaving the deviation open, which is the worst of both.

So the whole deliverable moves to Phase 1, where conversion, copy and the
screens that display them arrive together and can be checked against each
other. Phase 1 gains an exit criterion saying so.

⚠ **That criterion first said "no stored record", which Phase 1 could never
have met.** `entries` and `captures.legacy_entry_id` are retained on purpose —
they are how the migration is verified against its own source — and every one
of those rows is film-first by definition. An exit criterion that counted them
would have been unsatisfiable for as long as the thing it depends on exists,
which is the same defect as the fixtures clause it sits three paragraphs below.
It now names active product data and the interface, and exempts the read-only
comparison surface explicitly, until its own separate retirement.

**The fixtures clause was unsatisfiable rather than deferred.** §13 asked Phase
0 for fixtures covering *disputed* and *stale* — states Phase 4 and Phase 5
introduce, which this schema cannot represent. A phase cannot produce a fixture
for a state that does not exist, so those two move to the phases that create
them, and Phase 0 keeps the four it can actually build: raw, resolved, private,
shared.

⚠ **Neither change touches migrations `0004`–`0008` or the production
runbook.** That was a condition of making them, not a happy result: an
amendment that moved the verified migration set would have invalidated the
procedure written against it, and the amendment is not urgent enough to be
worth re-verifying a database migration for.

What Phase 0 is, stated plainly, so the exit criteria can be honest about it:
**a compatibility and data-safety step. It changes what the records are, not
what they say.**

### The runbook runs in the shell it will actually be typed into (22 August)

Review found it written in POSIX — `DATABASE_URL="$PROD_URL" npm run db:migrate`
— against a checkout where PowerShell is the shell. PowerShell has no inline
environment prefix at all, so that line is not merely awkward there; it is a
parse error.

⚠ **A production runbook is executable or it is decorative.** Every other kind
of document survives being approximately right, because a reader adapts. This
one gets followed literally, under time pressure, by someone who has just taken
a backup and is watching a migration they cannot undo.

So the operator shell is stated once at the top, every command is written for
it, and the two POSIX equivalents that are genuinely useful are marked as *not
the version to run*. `DATABASE_URL` is set as a session variable in §1.2 and
removed in §4.5 — PowerShell keeps it for the whole session otherwise, which
would leave a later `npm run dev` in the same window pointed at production.

#### The checks became scripts, which is the larger half of the fix

`npm run migration:preflight` and `npm run migration:verify`. Both read and
write nothing, both print the host and database name **before any check runs**,
and both end in a single line that says whether to continue.

⚠ **The SQL left the document.** Fifteen statements pasted into a console by
hand is fifteen chances to paste one wrong, and a prose copy drifts from the
real one the moment either is edited. The runbook now says what each check
means; the script says it in SQL, once. It also makes the checks testable — all
of them were run against `development` before this was written, which a
document full of SQL blocks cannot claim.

⚠ *Confirm the host* was a step, and steps get skipped. It is now the first two
lines of output from a command the operator has to run anyway.

### The film add carries no client mutation id (22 August)

§6 says every capture submission carries one. `addFilmAction` does not send one,
so every Phase 0 film addition stores `null`, and the acceptance test that
covers mutation ids calls the data layer directly — proving the layer and not
the shipped path. Review caught the gap.

**Recorded rather than closed, and the reason is that closing it properly is
Phase 1 work.** An id only does anything if it is *stable across a retry*,
which needs the client to hold one per intent-to-save rather than per call.
Generating a fresh id inside the action would satisfy the sentence and carry
nothing — the failure mode this project keeps refusing.

**What carries §10's idempotency on the only write path Phase 0 has:** a film
add resolves a possibility first, so the unique key on (user, possibility,
intent) catches a retry and returns the existing row with `created: false`, and
`fireOverlap` does not run on that conflict path, so no second
notification is written either.

⚠ **Not "only on the insert path", which is what this said first and is
slightly false.** It also runs when the conflict *revives* a crossed-off
capture — a real change of state rather than a retry, and one that can happen
only once, because a second attempt finds the row is a want again and takes the
no-op path. The accurate claim is about the retry path specifically. Both halves are now asserted in `tests/acceptance.test.ts`
rather than argued for here.

⚠ **It stops being true in Phase 1.** A raw capture has no possibility, so it
has no key to collide with, and the mutation id becomes the only thing between
a double-tap and two rows. Phase 1's exit criteria now require it, and the
action carries a comment saying what it relies on until then.

This is not an amendment. §13 never asked Phase 0 for §6's capture flow — the
action is a compatibility seam, the flow arrives in Phase 1 — so the
requirement is being scheduled, not weakened.

### A revive is not a creation (22 August)

Review of the Phase 0 branch found the fan-out and the undo window disagreeing
about what reviving a crossed-off capture is. Three defects, one cause, and the
first of them destroyed data.

**Undo was deleting rows that had existed for months.** `writeCapture`'s
conflict path revives a `dropped` capture, and it reset `created_at` to `now()`
— inherited from `addEntry`, on the reasoning that *a want which restarted
today belongs at the top of the list*. But `created_at` is also the clock
§5.1's undo window runs on. So: cross a want off, tap `+`, tap undo within ten
seconds, and the original row is gone — with its private note, its provenance,
and its `legacy_entry_id` link to the backfill. §5.1 permits exactly one
deletion and it is an undo **on creation**.

Reproduced before it was fixed, which is the only reason it is written up with
this much confidence:

    revived same row: true | created reported as: true
    undo accepted: true | row still exists: false

⚠ **The same defect is live in production today** — `addEntry` and `undoEntry`
have the identical shape, and `addEntry`'s comment says a revived row is
*indistinguishable from a fresh one* as though that were the goal. Phase 0
raises the stakes rather than creating them: the row now carries the audit link
the whole migration verification depends on.

**`created_at` is no longer reset, and that is the fix rather than a guard on
top of it.** The undo window is bounded by `created_at` in SQL, so leaving it
alone makes the deletion *impossible* rather than merely unoffered — a caller
that offers undo anyway is refused by the data layer.

⚠ It also settles an argument the two paths were having. Restoring with the ×
deliberately leaves the row where it was — *finding it somewhere else would
undo the point of striking it through in place* — while reviving with `+` sent
it to the top. Same transition, two positions, decided by which control you
used. Now neither moves.

`addCapture` returns `created: false` for a revive. `film-screen.tsx` already
says *only a real creation is undoable*; it was being told a revive was one.

#### One rule for the fan-out, replacing three separate judgements

The second and third findings were the same disagreement wearing different
clothes. `setCaptureVisibility` fired on every call, so setting `mutuals` on
something already shared wrote a second identical notification — verified:
*after first share: 1 | after redundant second: 2*. And the revive path fired
while `restoreCapture` did not, though they are the same transition.

**The fan-out runs when a capture becomes a signal it was not already, and
never merely because a writer touched the row.** Three moments qualify: a
capture created shared, a state change, and a scope moving into
`SHARED_SCOPES`. Two deliberately do not: revive and restore, because dropping
never withdrew the notification it had already sent, so coming back announces
nothing new.

⚠ **Overlap does not deduplicate**, so every avoidable re-fire is a second
identical row at somebody. That is why the rule is written once, above
`fireOverlap`, rather than decided again at each caller — which is how the
three call sites came to disagree.

The review also suggested fixing the asymmetry the other way, by firing on
restore. Firing more would have been the wrong direction: the notification the
counterpart already has is still true, and §5.1 makes dropping a resolution
rather than a delete.

#### Two findings not acted on

**The `poster.tsx` magnify race is not in this branch.** The reviewer diffed
against the stale local `main` at `68ce007` and picked up sixty-three commits
instead of this pull request's fourteen. It may well be real; it is already
deployed, and it is not Phase 0's.

**The `clientMutationId` race is real and unreachable.** Two concurrent
requests carrying the same id for an *unresolved* capture would both pass the
read and the second would raise rather than returning a typed `Result`. No
caller passes an id today, and the file already records that Phase 1 is where
that changes — so it is Phase 1's to close, alongside the stable id itself.

---

## Still open

Flagged to the client, not yet resolved. Listed first because they are the ones
that get lost otherwise.

### The mark on a crossed-off film should put it back — 22 August

Raised on the first pass through production after the Phase 0 deploy: crossing
a want off leaves the film still ticked on the wall, and the tick then does
what it does for every other listed state — it navigates to the collection the
row is in.

**The tick staying is correct and deliberate.** A crossed-off want is still on
the list: struck through, in the position it held. Unticking it would have the
wall say *not on your list* while pointing at a page where the row is plainly
sitting, which is why `COLLECTION_FOR` maps `dropped` to Wants like every
other live state.

**What is open is what a tap should do there.** The proposal: encountering the
film again is the moment the crossing-off stops being true, so the tap should
restore the row rather than send you to Wants to press an × you are already
looking at the film for.

Two things it would need, and neither is difficult:

- ⚠ **The control must look different.** Every other listed state navigates. A
  control that looks identical and does something else is the exact fault the
  note at the top of `AddControl` describes — it was a `<span>` that looked
  like the button it had been a second earlier and did nothing when pressed.
  Dimming the tick is the product's existing word for *not current*, and it
  belongs on the glyph rather than on the box, because the box is a tap target
  and dimming that would say the control is unavailable.
- ⚠ **It is a second way back**, where the notes currently say *one control, in
  one place*. That is defensible — the two sit in different places because they
  answer different moments, and the row's × stays the only way to cross
  something off — but it is a change to a stated rule rather than a gap in it.

**Deferred to the Home rebuild rather than built now.** The wall and the film
screen are Phase 1's to replace, and the tick's whole vocabulary — absent,
listed, listed-and-crossed-off, and the ten-second window — is part of what
that surface has to restate for captures that may have no possibility behind
them at all. Building a fourth state into a control that is about to be
redesigned would be answering the question twice.

The data layer already supports it: `crossOffAction(id, false)` runs
`restoreCapture`, one action for both directions, so the work is entirely in
the component.

⚠ **The strongest argument for it, found while smoke-testing the deploy: from
the film screen there is currently no way back at all.** The mark reads
`listed` whenever a capture exists for that film and intent, and a crossed-off
capture still exists — so the `+` never returns and the tick only navigates.
Un-crossing-off means going to Wants and finding the row.

⚠ It also leaves `writeCapture`'s revive path unreachable through the
interface. It is correct and covered by `tests/acceptance.test.ts`, and no
gesture reaches it: the only route is a stale `/api/film/[id]` response inside
its fifteen-second cache showing a `+` for a film that has just been crossed
off. **A path that only a race can reach is a path nobody is testing by using
the app**, which is worth knowing before that behaviour is relied on.

⚠ **What Phase 1 did to this — 23 August.** The Home rebuild it was deferred to
has landed, and it moved the question rather than answering it. The wall is
deleted and the film screen is mounted by nothing, so **the surface this was
raised on does not exist** — and on the page that replaced it, un-crossing-off
is one tap: pick the line, press the same ×, which is what *one control, in one
place* was always meant to look like.

What survives is the part about the film screen, and it comes back when the
resolution offer does: the moment a capture can open a media detail view again,
that view has to state *listed*, *crossed off* and the ten-second window for a
capture that may have no possibility behind it. **Decide it then, on the surface
that will carry it**, and the strongest argument above still holds — a screen
you can reach and cannot act from is worse than one extra control.

The revive path is still unreachable by gesture, and now for a second reason:
nothing in the interface resolves a possibility at all.

### Five notification kinds or six?

§6 says "those five kinds in the schema are the complete set." The schema lists
six — `convergence`, `guide`, `lend`, `swap_invite`, `swap_revealed`, `landed` —
and §8 says "the six kinds."

**Built six.** All six are in `NotificationKind` in `lib/domain.ts`. If five was
meant, one has to go, and it is not obvious which.

### Overlap never fires on a new mutual track

§6 runs the fan-out on insert into `entries` and on state change. Two people who
already hold matching wants and *then* start tracking each other produce
nothing: the pair exists, but no entry moved, so nothing triggers.

This bites hardest exactly at seed time, when §13's "one friend group, a dozen
people" all join in a week and backfill their lists before the graph is
complete. The app's first impression is the case it currently misses.

**Proposed fix, not yet built:** call the same `lib/overlap.ts` fan-out when a
track becomes mutual, scoped to that one pair. Second caller, same module — it
does not scatter the logic, which is what §3 cares about. Belongs in Phase 2,
when tracking is built.

### Swap landing versus the unique constraint

§7.4 lands each side's picks in the other's wants. §10 says adding the same item
twice is a no-op. `unique (user_id, item_id, intent)` enforces it.

So if B already has an entry for a swapped-in item — already wants it, already
resolved it, already archived it — the insert is a no-op, and **the giver can
never receive a `landed` for that item.** §7.5 calls `landed` the only feedback
loop in the product.

**Current intent:** on-conflict-do-nothing, existing row and its `source`
untouched. Flagged rather than decided. Belongs in Phase 4.

### Groups

Raised 8 August 2026, explicitly to be kept rather than built: *people will want
groups — one for family, one for each friend group — and members of a group
should see each other's names rather than handles.*

**Not in the brief at all.** §5 has one relation, `tracks`, and it is a mutual
pair. There is no object between a person and their people.

It is not obviously out of scope either, which is why it is here rather than
dismissed. §2 excludes group *chat*, feeds and public discovery — sociality as
content. A group as a **visibility scope** is a different thing, and §13 already
assumes the shape: *"one friend group, a dozen people who already talk about
films"*, and *"two hundred people in twelve clusters produces constant
overlap"*. The clusters are in the design; they are just implicit, expressed as
a dense mesh of mutual tracks rather than named.

**What would have to be true for this to be right:** that a group does something
tracks cannot. Two candidates, neither yet tested against a real list —

- **Scoping what is visible.** Different lists to family and to friends. This is
  the one that cannot be built out of tracks, because a track is all-or-nothing.
- **Naming a cluster** so overlap can say where it came from.

**The risk, stated plainly.** Groups are an administrative surface: creating,
naming, inviting, leaving, who can add whom. That is a lot of product for
something whose value shows up only at a density the app has never had. §12's
checkpoint for Phase 2 is *two accounts on two devices seeing each other
correctly* — one pair, not twelve. Building the group object before the pair
works is the definition of the wrong order.

**Decision for now: keep, do not build.** Revisit when there are enough real
users that a single undifferentiated list of people is visibly wrong — which is
also the first moment there is any evidence about what a group should do.

**Sharpened 15 August, to one observable request.** A track is all-or-nothing, so
the moment groups become necessary is the first time somebody wants a want kept
from a *particular* person while it stays visible to everyone else — family
against friends. Until that is asked for, tracks do the job, and there are
already two pressure valves: `done` is private from everyone, and the note will
be. Naming a cluster so a convergence can say where it came from is pleasant and
is not a reason to build an administrative surface.

**The preparation is already done, and it is §3.** Visibility scoping is the
expensive kind of feature because it changes who can see what on every read — but
every read already goes through `lib/db/` on a `SessionUser`, so a group scope is
a filter added in one layer rather than a rule hunted through the app. That rule
was written for privacy; it happens to be the groups insurance too. Nothing else
needs doing in advance.

**The identity half is separate and is happening sooner.** "Names for people who
know you, handles for strangers" needs settling in Phase 2, when `/u/[handle]`
is built, and is carried forward in `docs/plan.md`. It does not require groups:
a mutual track is already a workable definition of knowing someone.

### Notification copy for the counterpart side

§6 gives exact copy for `convergence` and for the guide-holder's side of
`guide`. It does not give the other side's line for `guide` or either line for
`lend` beyond "{name} has a copy of {title}."

**Invented, and marked as invented** in `notificationCopy` in `lib/overlap.ts`.
Worth a read-through by whoever owns the voice.

---

## Decisions taken

### Neon WebSocket driver, not `neon-http`

§10 requires that "entries plus notifications plus swap state changes never
partially apply." The HTTP driver cannot do interactive transactions. The
WebSocket driver can, and it satisfies §10's pooling requirement at the same
time.

Cost: needs a WebSocket constructor. Node 22+ ships one globally, so this adds
no dependency.

*What would change this:* nothing likely. Dropping to `neon-http` would mean
giving up transactions.

### Better Auth `generateId: 'uuid'`, and the column defaults it implies

§5 has `profiles.id uuid references "user"(id)`, but Better Auth's default id is
an opaque string. `advanced.database.generateId: 'uuid'` fixes that in one line
and keeps the schema exactly as the brief has it.

**The trap:** with that setting Better Auth emits `values (default, ...)` and
delegates id generation to Postgres. The four auth tables therefore need
`gen_random_uuid()` as a *column default*. Without it every sign-up fails a
not-null constraint on `id`. The build was clean and the schema looked right;
only an end-to-end sign-up caught it. Fixed in migration `0001`.

### `profiles.handle_skeleton`

Not in §5. §10 requires handles be checked against homoglyph impersonation, and
a uniqueness check needs somewhere to compare. Stores the confusable-folded form
of the handle, unique — see `lib/handles.ts`.

This matters more here than in most apps: the entire product is "this list
belongs to my friend," so a handle that reads as someone else's is the attack
that actually pays.

### `items.external_source`

Not in §5. `kind` otherwise implies the catalogue by convention alone
(film→TMDB, book→Open Library per §2), and a convention is not something you can
query.

The unique constraint stays on `(kind, external_id)` as §5 specifies — one
canonical row per real thing. Widening it is a decision to take at migration
time along with a deduplication strategy, not a guess to bake in now.

### The 10-second undo deletes rather than defers

§10 mandates optimistic UI on add, §6 fires overlap on insert, and §5 allows a
10-second undo for typos. The obvious reading is a race: a mistyped entry
writes, notifies both sides, and *then* gets undone.

Two ways out. Defer the insert until the window closes — but then closing the
tab within ten seconds silently loses the add, and the capture tool drops
captures. Or write immediately and let undo delete, which §5.1 already sanctions
as the one exception to "nothing is ever deleted."

**Took the second.** `undoEntry` bounds the deletion in SQL by `created_at`
rather than trusting a timestamp from the client, and will not touch anything
already resolved.

This is safe today because notifications are in-app only until Phase 3. **Phase 3
must ensure the push worker does not fire inside the undo window**, or an undone
typo will still have buzzed someone's phone. Noted in `undoEntry`.

### `lib/domain.ts` split out of the schema

The domain unions — `Kind`, `Intent`, `EntryState` — are vocabulary (§4), not
schema. Client Components need them to render a label, and `lib/db/` is
`server-only`. Keeping them separate lets a Client Component speak the domain
without being able to reach the database.

Found by the ESLint boundary rule on its first run, which is a decent sign the
rule earns its keep.

### Nonce-based CSP, and the dynamic rendering it forces

§10 requires a CSP with no `unsafe-inline`. That means nonces, and nonces mean
every page renders dynamically.

Normally a real cost. Here it is free: every page is behind auth and personal to
the viewer, so none of it was ever going to be statically cached.

Lives in `proxy.ts` — Next.js 16 renamed the `middleware` convention.

### Upstash over Vercel KV, and the fallback that had to be closed

§10 permits either. Upstash keeps rate limiting portable if the app ever leaves
Vercel; Vercel KV would not.

**This was an open question until 8 August**, and the reason is worth keeping:
`lib/rate-limit.ts` falls back to an in-process `Map` when
`UPSTASH_REDIS_REST_URL` is unset, which is fine locally and **is not protection
in production** — each serverless instance gets its own memory, so an attacker
simply lands on a different one. It mattered more once `LIMITS.auth` began
guarding sign-in, sign-up and password reset, putting the fallback in front of
the account boundary and an emailed bearer token rather than only the TMDB proxy.
Better Auth's own limiter is no help: it defaults to in-memory too, which is the
identical hole.

Closed twice over. `scripts/preflight.mjs` fails a production build without the
credentials, because the fallback is undetectable after a deploy — the app looks
healthy, responds normally and simply does not limit anything. And the
credentials now exist and were verified against the live service (a pipelined
`INCR`/`EXPIRE` in London, counter 1 → 2, TTL 60s, key removed).

⚠ **Still per IP rather than per email address**, so a distributed attacker could
fill one person's inbox with reset mail. The fix means reading the request body
in `app/api/auth/[...all]/route.ts`; deliberately not built.

### `unoptimized: true` on images

§3 says poster images are served by TMDB's CDN and to never proxy images through
the app. Without this, `next/image` routes them through `/_next/image` and the
egress becomes ours.

### Password reset, and the removal of magic link

Magic link was carried for account recovery. It never did it. It signs you *in*
but never lets you fix the password, because every route to changing one is
closed to someone who has forgotten it — `changePassword` needs the current
password, `setPassword` only applies when none exists. So the flow it was
justified by did not exist.

Reset was built (one-hour token, single use, via
`emailAndPassword.sendResetPassword` and `/reset-password`), and magic link was
then removed rather than kept as a convenience. Two reasons beyond simply being
redundant:

- `disableSignUp` was never set, so a magic link could create an account with no
  password at all — and reset cannot repair that, since `resetPassword` expects
  an existing credential to replace. It was quietly producing a second class of
  user that the recovery path could not serve.
- It was a second emailed bearer token, which is a second inbox-spam surface and
  a second thing to get right, for a convenience already covered.

One way in, one way back in.

Decisions inside the reset flow:

- **`revokeSessionsOnPasswordReset: true`.** Reset is what someone reaches for
  when they think another person is in their account. Leaving other sessions
  alive defeats the point — the attacker keeps a valid 30-day cookie while the
  owner changes a string and believes they have fixed it.
- **The form says the same thing whether or not the address is registered.**
  Better Auth is careful about this server-side, including padding the timing;
  a helpful "no such account" in the UI would hand it straight back and turn the
  sign-in page into a way to ask whether someone has an account.
- **`lib/email.ts` is the single outbound path.** It throws in production rather
  than resolving quietly: a recovery email that reports success and never arrives
  locks someone out while telling them to check their inbox. Reset is now its
  only caller, but the seam is where a provider gets wired and where the next
  caller inherits the failure behaviour instead of reinventing it.
- **Auth endpoints now go through `lib/rate-limit.ts`.** `LIMITS.auth` had been
  declared since Phase 0 with no caller. Better Auth's own limiter defaults to
  in-memory, which on Vercel is per-instance — the same hole documented about the
  Upstash fallback. Only the endpoints that cost something are listed;
  `/get-session` runs on ordinary navigation and must never be throttled.

**Still open:** limiting is per IP, not per email address, so a distributed
attacker could still fill one person's inbox. Per-email limiting means reading
the request body in the route handler; not built.

Verified end to end against the running dev server and the live database:
sign-up, request, token TTL, the redirect through Better Auth's callback, the
new password taking effect, the old one being refused, and the token refusing a
second use.

### Correct on every screen

§10 asks for 320px up. What existed was a layout that did not *overflow*, which
is not the same thing. Five utilities in `app/globals.css` carry all of it, so
the rules live in one place rather than being re-derived per component.

**`gutter`** replaces `px-5` on every page container. `max(1.25rem, env(...))`
rather than an addition: in landscape on a notched phone the safe-area inset is
larger than the design gutter and should *replace* it. Add them and content is
shoved toward the middle of the screen on exactly the devices with least room.

**`safe-bottom`** is additive, unlike the gutter, because the home indicator
sits *over* the viewport. Use `max()` there and content ends up correctly spaced
from the screen edge and underneath the indicator anyway. Each page sets
`--safe-bottom-base` to whatever its design padding was.

**`control-box`** pins line-height and vertical padding — between them the whole
of a control's height. Inputs and buttons both wear it, which is what lets them
carry different font sizes and still align in the inline sign-in row. On a coarse
pointer it grows to 48px, clearing the 44px touch floor, without either of them
being told.

**`input-text`** is 14px, and **16px on touch**. Not a style choice: iOS Safari
zooms the viewport on focus below 16px and does not zoom back out. The other fix
is `maximum-scale=1`, which disables pinch zoom for everyone and is an
accessibility failure. So the type scale now differs by input device, which is
the honest trade — 14px reads better with a mouse, 16px is the price of a
touchscreen.

**`tap-target`** gives a 44×44 minimum hit area via a transparent
pseudo-element, on touch only and **without changing layout**. The entire resolve
flow is plain text buttons around 20px tall; padding them to 44px would blow the
list spacing apart on every screen to fix a problem that exists on one. Watch the
gap when two sit side by side — the areas overlap and steal each other's taps if
the visible controls are closer than the expansion. That is why Yes/No widens to
`gap-5` on touch: it is the one place in the app where a mistap does something
you cannot undo after ten seconds.

Two layout fixes that are not utilities:

- **`my-auto` on an inner wrapper, not `justify-center` on the parent**, for
  every vertically centred page. When a phone keyboard takes half a landscape
  viewport the content is taller than the container, and centred flex content
  overflows in *both* directions — the top goes above the scroll origin and
  cannot be reached at all. Auto margins collapse to zero when there is no free
  space, degrading to top-aligned and scrollable.
- **The nav yields in one place only.** The handle is the sole variable-width
  item, so it truncates and everything else is `shrink-0`. The `/me` collection
  tabs wrap rather than scroll: the four labels come to roughly 290px, which
  overflows 320px once the gutter is off, and a scrolling strip with no
  affordance just hides a tab.

**Not verified on hardware.** All of this is reasoned from the specs and checked
in the compiled CSS. Nothing has run on a phone.

### The typographic rule (§11), stated

§11 gives two instances of the same principle without naming it. Amber marks
overlap and nothing else. Mono marks counts and timestamps and nothing else.
Both are justified with the same sentence: it stops meaning anything the second
it is used for decoration.

Generalised, that is the design philosophy for this app:

> **Every typographic signal encodes exactly one fact. If the fact cannot be
> named in four words, the signal is decoration and does not belong.**

| Signal | The fact it encodes |
|---|---|
| Ojuju | this is the name of the app |
| Plex Mono | this number is data |
| Amber `--color-accent` | overlap state |
| Plex Sans | everything else |
| Size and weight | hierarchy, and only hierarchy |

This is what decides the questions that otherwise come down to taste. The tagline
stays in Plex Sans, for instance: it is a sentence someone reads, not a name, and
setting it in Ojuju would redefine that face from "the app is called this" to
"this is the top of the page" — a layout fact, already carried by size and
position. Two signals for one fact leaves neither of them load bearing.

It also settles the sign-in page specifically. The mark is brand there and
navigation in the header, which is an argument for treating the sign-in block as
a lockup. Refused: the mark has to read identically in both places or it is not a
mark.

### A third typeface, for the wordmark only

§11 names two faces — Plex Sans for interface, Plex Mono for counts and
timestamps — and is silent on the name of the app. It was being set in Plex Sans
at `font-medium`, which is not a wordmark; it is body text that happens to say
Again.

**Ojuju**, weight 500, applied through a `wordmark` utility in
`app/globals.css` and used in exactly two places: the nav and the sign-in
heading. It carries the same scarcity rule as the accent and the mono, for the
same stated reason — a display face used twice is a signature, used everywhere it
is a theme. It is deliberately not on page headings.

The face was chosen by eye, after Instrument Serif and Newsreader were both put
on screen and rejected. Ojuju is a display sans, so unlike those two it separates
from Plex Sans by personality rather than by category.

**Set lowercase, and in CSS rather than in the JSX.** `again` reads as the word
rather than a proper noun, which suits a name that states the entry criterion —
the same argument §4 makes for keeping "go-back-to". The `text-transform` lives
in the utility because the mark must render identically in both placements, and a
transform cannot drift the way two hard-coded strings can.

**Loaded as a static single weight, not the variable font.** Only the mark uses
this face and only at one weight, so a weight range is payload nobody spends.
This was measured rather than assumed, during the Newsreader attempt: requesting
that family's `opsz` axis cost **129 KB** on the preloaded latin subset against
**22 KB** for a static cut, and `wght` alone still cost 57 KB. The general lesson
survives the specific face — **do not request variable axes for the wordmark
without measuring the subset first.** 100-odd KB to optically size five letters
at two hard-coded sizes is not a trade this app can make.

Consequence worth knowing: only one weight file is loaded, so a stray
`font-bold` on the mark would synthesise a fake bold rather than fail visibly.
The weight is pinned in the utility to keep that from happening quietly.

**If 22KB ever needs to be 3KB:** the mark is five glyphs (`a g a i n`). A
`pyftsubset` cut checked in and loaded via `next/font/local` removes the Google
fetch entirely. Not done — it adds a build dependency and a binary in the repo
for a saving nobody has asked for yet.

### Input text at 13, and no field labels

Settled by eye over several passes rather than derived from a ratio. Inputs went
14 → 15 → 14.5 → 14 → **13**; field labels went 12 → 13 → 12.5 → **gone**, into
the field as placeholders (below). The landing point matters less than the two
constraints that survived the wandering, below.

**13 arrived via the placeholder, not on its own.** The placeholder was set a
pixel under the 14px value, then the value was matched down to it, so a field
does not change size between empty and typed. That is the rule worth keeping:
**one size per field, `::placeholder` inheriting it**, with no second declaration
anywhere that can fall out of step.

**The 16px touch branch stayed.** Matching the value down briefly took the coarse
size to 15px, which is under Safari's zoom threshold and cost the guard the
branch exists for (caveat below). It went back to 16. The rule above survives it
intact — value and placeholder are still one size — because what differs is the
pointer, not the state of the field: 13/13 with a mouse, 16/16 on touch. A field
that grows when you touch it is a scale; a field that grows when you type in it
is a bug.

**Nothing is set at a half pixel any more**, but they were not a mistake when
they were: browsers lay type out at subpixel precision, and only the rasterised
glyph snaps to the pixel grid.

**The trap this scale carries**, which has already caused a visible bug once:
`text-xs` and `text-sm` set font-size **and** line-height, while `input-text` and
`control-box` set one property each on purpose — size in one, height in the
other. Swap either for a Tailwind size and the two fight over the height, which
is how a row of controls ends up at three different heights with nothing in the
diff to suggest it. `CONTROL_TEXT` in `components/sign-in-form.tsx` pairs them
and should not be inlined back. It had two siblings once — `BUTTON_TEXT` for a
submit button that carried its own size, and `FIELD_LABEL` for the label and the
button's height-matching spacer. Both are gone: one size for every control now,
and no labels to match.

**The capture results sit at 13**, which on a mouse is the input's size too. They
were a pixel under a 14px input before, and matched at 14/14 before that; the
step said the query is yours and the results are the world's, and they should not
read as one tier. At 13/13 that step is carried by the input's border and surface
instead of by size, which is enough — a field with chrome above a bare list is
not ambiguous, and it is how every search field in a browser reads. **Taking the
results to 12 to reopen the gap would be worse**: 12 is the meta tier (the year
beside each title lives there), so it would trade a distinction for a collision,
at a size that is too small for the primary label of a touch target in a
phone-first product. On touch the step is still there for free — 16px input, 13px
results.

### Sign-in and reset fields name themselves from the inside

No label above the input on either form: **Email**, **Password**, **Name**, **New
password** and **Confirm** are placeholders, same words, moved inside the field
they belong to. Asked for directly, and it suits these two forms in particular —
there are at most three fields, every one of them is a form everyone has filled
in before, and the label row was the only thing making the inline row a layout
problem. Removing it took the spacer, `FIELD_LABEL` and the button's wrapper
`<div>` with it (above).

**Each input keeps an `aria-label`.** A placeholder is presentation that happens
to read as a name: it disappears at the first keystroke, so anyone who looks away
mid-form loses it, and it is the wrong thing to leave a field's only accessible
name resting on. The `aria-label` is what a screen reader announces and it does
not depend on the field being empty.

**Password placeholders are `placeholder:font-sans`**, against the `font-mono` on
the value. The mono is there to be read character by character (below) and a
placeholder is never read that way; left in mono it made those fields look like a
different species to the email beside them.

**Onboarding went the same way**, asked for directly a moment later, so no form
in the product now labels a field from above; `components/capture.tsx` was
already placeholder-only with an `sr-only` label. Two things it does differently:

- The handle placeholder is lower case and **stays in mono**, the one exception
  to the rule above. It renders immediately after the `@` prefix, and the two
  only read as one address — `@handle` — if they agree on case and typeface. A
  sans placeholder there looked like two strings that had collided.
- **`Name (optional)`** is one flat string. As a label it was "Name" plus a
  dimmed `(optional)` span; a placeholder cannot carry two weights. The word
  stays regardless — it is the only field in that form which is not required.

The handle's rule (letters, numbers, underscores, 2–20) is a `<p>` under the
field, not the placeholder, so it survives the first keystroke. That is the part
that matters, and it was never in the label.

### Password fields: mono, and an eye inside the input

Passwords are set in **Plex Mono**, which is the second functional exception to
§11's scarcity rule after the handle field, and earns it the same way (§10,
homoglyphs). The moment a password is revealed it is read character by character,
and telling `l` from `1` from `I` is the entire job. Applied whether or not it is
currently revealed, so toggling does not reflow the text under the cursor.

The reveal control is an **eye glyph inside the input**, right-aligned,
`inset-y-0` so it matches the field height and keeps matching if the type scale
moves again. Password fields get `pr-10` and nothing else does, so text never
runs under it.

Inline SVG in `components/icon-eye.tsx` rather than an icon package: §11 permits
known icons and the eye is the known one, but two usages do not justify a
dependency, and §10 wants a reason written down before one is added. It is shared
rather than pasted into both forms because duplicated path data drifts invisibly.
`currentColor` throughout, so it inherits the muted/hover treatment of its button
— the accent is not available to it, since §11 reserves amber for overlap.

A first attempt put a Show/Hide **text** button beside the label instead, to
avoid eating width from a ~200px field in the inline row. Rejected on sight: it
read as a second label rather than a control.

**Caveat, held rather than resolved:** iOS Safari zooms the viewport on focus for
any input under 16px and does not zoom back out. `input-text` holds a 16px
coarse-pointer branch specifically to prevent it, and that branch is the only
thing standing between a phone-first product (§5) and a zoom on every field.

It has been dropped to 15px once, as a consequence of matching the value size to
the placeholder, and put back. **Anything that lowers the coarse branch under 16
reintroduces the bug**, however good the reason looks in the desktop preview
where it is invisible. The other fix, `maximum-scale=1` on the viewport, disables
pinch zoom and is an accessibility failure; it is not on the table. Still worth
confirming on a real phone — see the Phase 5 PWA work.

### The tagline

**Two lines since 16 August, directed, and set exactly as they were written:**

> things to try. things to try again.
> the things i want. the things i’d buy again.

The first is the tagline proper and is the string in the `<meta description>` and
the manifest. The second sits under it on `/sign-in` and nowhere else — a link
preview shows one sentence on its own, and the pair reads as a lockup rather than
as a description.

**It still names the two states, which is the job.** *Things to try* is a want,
*things to try again* is a go-back-to, and the second line says the same thing
again in the app's own vocabulary. The name is still the payoff rather than a
label over unrelated copy.

**Three things about it are new and are worth naming, because none is accidental:**

- **It is lower case throughout, including the `i`**, under a capitalised mark.
  Written that way and set that way.
- **It speaks in the first person.** Everywhere else the app addresses the reader;
  this is the reader talking. The line is a person describing their own list,
  which is what the product holds.
- ⚠ **It says *buy*.** §2's ban is on availability and acquisition as *features* —
  retailer links, price tracking, ownership inventory — and a word in a tagline is
  not one of those. But the line drawn in *What Again is for* is *acquisition
  makes the app a remote control; occasion makes it a diary*, and this is the
  acquisition word. Recorded rather than argued: it was asked for directly, and
  it is one string if it ever reads wrong.

**What it replaced, and why the replacement is not a downgrade of the argument.**
The old line was *What would you try, and try again?*, and this file used to
defend its question mark at length — one question with a compound verb, not two
questions joined by a comma. That reasoning was sound and it went with the draft.
Two statements need no question mark, and they buy something the question did not:
the second line is a **restatement**, so the pair works the way a headline and a
standfirst work.

⚠ **A tagline is a layout dependency on this page.** Adding the second line grew
the header by 20px and moved both optical-centring corrections — one of them
changed *side*. See *Centring the fields, not the block* below, and re-measure
rather than adjust if this copy changes again.

### The sign-in form is stacked at every width

**One column, `max-w-sm`, no breakpoint.** Asked for directly, and it settles
something that had been consuming a disproportionate share of this file. The form
used to go inline at 560px — fields and button on one line, with the container
widening to 42.5rem to give the row something to divide up. The dimensions kept
now are the stacked ones exactly: `flex flex-col gap-3`, full-width controls,
`mt-1` on the submit.

The removal took four things with it, all of which existed only to serve that
row, and each of which had already broken once: the `min-[560px]:*` variants, the
wrapper `<div>` around the fields (redundant once it was `flex flex-col gap-3`
inside a form that already was), the `min-w-0 flex-1` pair on each field, and the
container's width bump. **What is left has no alignment problem to solve**, which
is the real gain — every control is full width, so nothing can line up wrongly.

**One gap for the whole form.** The submit button had `mt-1` on top of the gap-3,
setting it slightly apart from the last field; it is gone on all three forms, so
the space between password and button is the space between the fields. It read as
an exception to a rhythm that has nothing else in it — three or four boxes in a
column — and 12px throughout is what makes that column read as one object. The
sign-in centring numbers derive from these gaps, so this is a two-file change.

**The mode switches sit `mt-4` below that**, making 28px with the form's gap —
the same `gap-7` that separates the tagline from the first field. They are the one
thing in the form that overrides the gap, and they earn it: they do not submit
anything, they change what the form *is*. Setting them at the distance that
separates the header from the form says so. The number is written as that
arithmetic, not as a loose `mt-4`.

**They lost their underlines and took a chevron instead**
(`components/icon-chevron.tsx`). Three underlined phrases at 12px is a lot of rule
for very little text, and on a page whose only real content is two boxes the
underlines were the heaviest marks on it. The chevron points right and sits on the
left, so it reads as a marker on something that leads somewhere rather than as a
back arrow; hover is carried by colour alone. It is 12px against a 16px line box
on purpose — a taller glyph would grow the switch row and invalidate the centring
numbers above.

It also puts the three auth pages on one shape: /sign-in, /onboarding and
/reset-password are now all `max-w-sm` single columns, which they were not while
one of them widened past the others at 560px.

**If an inline row is ever wanted back**, the parts to restore are listed above
and in `components/sign-in-form.tsx`; the ordering constraint is that the button
needs whatever the fields have above them, or it will not align.

Alignment of the mark and tagline uses `text-start`, not `text-left`, so it
follows writing direction. Nothing on this page uses a physical direction.

### Centring the fields, not the block (/sign-in)

`my-auto` centres the whole block — mark, tagline, fields, button, switches — but
the thing that should *look* centred is the field pair, and the block is not
symmetric about it. Padding the light side makes it symmetric, which moves the
pair by half of what you add.

**Both corrections are on the bottom since 16 August**, when the tagline became
two lines and the header grew 20px:

```
mouse  113.76px above the pair, 94px below  → 19.76 → pointer-fine:pb-[20px]
touch  113.76px above the pair, 104px below →  9.76 → pointer-coarse:pb-[10px]
```

Touch is lighter because `control-box` grows the fields and the button to 48px
there, which adds 10px below the pair while the header and the 12px switches do
not move. A device reporting neither pointer gets no correction and sits about
10px low, which is the right way to fail.

⚠ **The touch correction changed side, not merely size.** It was `pt-1` — 4px on
*top*, because on a coarse pointer the block used to be heavier below. One line of
tagline reversed that. **These numbers cannot be adjusted by reasoning about the
direction of the last change**, which is the trap this pair has now sprung twice;
measure the imbalance and pad the lighter side.

**Measured rather than compiled this time**, driving the real page at 390×780
touch, 1440×900 mouse and 320×568 touch: the pair's centre lands 0.11px from the
content box's centre at all three. The residual .76 in the table is the mark's ink
and is rounded away deliberately.

Two declarations do it, and the split between them is the point:

- **The pointer pair above, on the centred block.** Nothing renders in that
  padding; it is optical centring, not spacing.
- **`pt-[calc(3rem+env(safe-area-inset-bottom))]` on `<main>`.** The top padding
  carries the *bottom* inset deliberately. `safe-bottom` adds that inset below for
  clearance, correctly, but the same padding is what `my-auto` centres inside — an
  inset on one edge only lifts the content by half of it, so the more home
  indicator a device has, the higher the form floats. Mirroring it on top keeps
  the box symmetric on every device. It replaced `py-12`, whose only remaining job
  was that 3rem top, so there is now one declaration per edge and no override.

**This started as `--safe-bottom-base: 4rem`** — one rem of extra bottom padding,
which lifted the content by half. It measured right on a laptop and overshot by
~21px on any iPhone with an indicator, because it corrected a fixed imbalance with
a device-variable property. Two jobs on one declaration. That is the failure mode
worth remembering, not the number.

**Both numbers are derived, not chosen.** They are the header-above minus
switches-below difference at each control size, so anything that changes the
form's rhythm makes them wrong, and they have now moved three times: closing the
submit button's `mt-1` took them from 18/8 to 22/12, setting the switches `mt-4`
below the button took them to 6/4 and flipped the touch one's sign, and the
tagline's second line took them to 20/10 and flipped it back. **Two of those three
were a change to the copy or the spacing, not to the correction** — which is the
whole reason this note exists. The first two were verified by compiling
`app/globals.css` through `@tailwindcss/postcss` directly, because the dev server
serves a cached CSS chunk that can lag a source edit by several minutes and will
happily show you a class you have deleted; the third was measured in the page
itself, which is better and is what to do next time.

**It is per-page, not a token**, because the imbalance is per-page. /onboarding
has a two-line heading and a three-line paragraph over one field and would need
more; /reset-password is close to this page but not identical. Neither has been
measured, and neither is corrected.

**Landscape is deliberately not centred at all.** `my-auto` collapses when the
content is taller than the container, which is what keeps the top of the form
reachable when a keyboard takes half the viewport. The padding above stays
scrollable; a transform-based correction would not have.

**Nothing here is measured on hardware.** The numbers come from the box model —
line-height plus padding plus border, per control. The Phase 5 phone pass is where
they get confirmed or corrected.

### Resend, over its REST API

**Decided 8 August 2026.** Resend and Postmark were both acceptable and the
choice sat open for a week. Resend, for one reason that outweighed the rest:
`onboarding@resend.dev` sends with no domain, no DNS and no approval, so password
reset is live on the deployment immediately. Postmark's sender signatures need
clearing first, which would have left the deploy with reset still broken — and
reset being broken is the condition this whole phase exists to end.

⚠ **That sender only delivers to the address owning the Resend account.** It is
enough to prove the flow end to end and it is not enough for a second person, who
would hit a 403 that throws on our side and looks like silence on theirs. A
verified domain in `EMAIL_FROM` is required before anyone else signs up, and
`scripts/preflight.mjs` prints this as a notice on every build until it is set.

**Called over `fetch`, not the `resend` package** — the same trade as
`lib/rate-limit.ts` and Upstash. §10 wants a written reason for every dependency;
this is one POST with three headers against a stable API, and the SDK's whole
contribution would be `await resend.emails.send`.

**It does not fail open, and `lib/rate-limit.ts` does.** The two sit next to each
other and look alike, so the difference is worth stating. A limiter outage should
not take the app down — failing open costs a few minutes of lapsed limits. An
email failure has no equivalent: swallow it and Better Auth returns success, the
UI says check your inbox, and the account is gone. So `sendEmail` throws.

**What would change this:** volume, or deliverability trouble. Postmark remains
the stronger transactional reputation, and moving is one function.

### True black, over the note that said not to

**Decided 8 August 2026.** `--color-bg` was `#0e0e10`, carrying a comment that
read *"near-black, not #000 — pure black reads as glass and pulls too hard on
OLED"*. That reasoning is sound and it was overruled by looking at the thing: on
an iPhone 12, which is precisely the OLED panel the note was written about,
`#0e0e10` read as grey rather than as black.

The note was a general principle. It lost to the specific screen, which is the
right order — the same order that produced the intent-sheet bug, the landscape
dropdown and the upscaled thumbnail, all found by use rather than by reasoning.

**What it was guarding against, in case it shows up later:** black smear. OLED
pixels switching from fully off are slower than pixels switching between two lit
values, so a pure-black background can trail slightly during a fast scroll. If
that appears, the fix is a step back towards `#08080a` rather than all the way
to `#0e0e10` — the complaint was that the old value was visibly grey, and
`#08080a` is not.

`themeColor` in `app/layout.tsx` moved with it. iOS tints the status-bar strip
from that value, so a mismatch shows as a lighter band across the top of every
screen — which is also why `components/poster.tsx` no longer swaps it: the
expanded poster and the app now share one ground, and the swap became a no-op.

`--color-surface` stayed at `#16161a` at the time, further from the ground than
it had been, which suited it. It has since become the warm `#20201d` — see
*An editorial palette* below.

### An editorial palette: warm ink, warm charcoal, brass

**Decided 8 August 2026**, from a proposed set aimed at "classy, magazine-like".
Adopted with one change and one rejection.

| token | was | now |
|---|---|---|
| `--color-bg` | `#000000` | unchanged |
| `--color-surface` | `#16161a` | `#20201d` |
| `--color-text` | `#e8e8e6` | `#eae6da` |
| `--color-rule` | `#26262b` | `#30302b` |
| `--color-accent` | `#e0a458` | `#b49a62` |

**The background was rejected.** The set proposed `#171715` — `rgb(23,23,21)`,
lighter than the `#141414` ruled out earlier the same day and much lighter than
the `#0e0e10` rejected before that. It also worked against itself: the warm
charcoal surface separates from it by only **1.10:1**, where against pure black
it manages **1.29** — better than the cool `#16161a` ever did at 1.16. Warm
surfaces read as raised, and they need a black ground to do it.

**The muted tier was lifted.** The set's ladder is one ink faded — secondary at
0.689, muted at 0.436, to within 1–2 of exact — which is the structure this
codebase had just adopted, so it dropped straight in. But 0.436 measures
**3.69:1**, under AA's 4.5 for body text, and muted is where timestamps and
metadata live. Kept at 0.6, which measures 6.08. The same 0.42-ish step appears
in the Gide palette and fails there too; it is a recurring instinct worth
distrusting.

**Warmth is the point of the whole change.** The ink goes from +2 to +16 on
R−B. Neutral off-white reads as *screen* — print ink is never neutral, and that
warmth is most of what makes a thing look printed rather than rendered.

**What it cost: the accent got quieter.** `#b49a62` is the better colour and
`#e0a458` was the louder signal. §11 gives the accent exactly one duty — marking
overlap, "the one moment the app exists for" — and that duty is to interrupt.
Brass is classier and less alarming, which is a real trade on the one colour
meant to be alarming.

**What would change this back:** overlap failing to catch the eye in Phase 3,
which is the first time the accent appears against real notifications rather
than in a palette. If it does, the value moves and the rule around it does not.

### The return count is removed, and §11 loses its signature element

**Decided 8 August 2026**, against the brief and knowingly. §11: *"The signature
element is the return count beside each go-back-to — mono numeral, quiet weight,
large enough to read as the point."* There is no longer a return count.

It went in stages over an hour, and the stages matter because each one was
reasonable and the destination was not obviously where they led. The count was
moved off the live list, because a bare numeral beside an unwatched film explains
nothing. The increment button followed it, because an action that changes a
number you cannot see is a tap into the void. Then: *"still not sure about it.
Don't think it has a purpose."* Renamed first — *Seen it again* rather than *Been
back again* — and that did not rescue it. Removed.

**The case for removing it.** Nobody was going to tap it. It is self-reporting
about something you did somewhere else, weeks earlier, with nothing prompting
you and no consequence if you do not. §8 made that manual deliberately — the
alternative is check-ins, which is a different product — but deliberate is not
the same as used, and a number that only ever reads `1` is worse than no number:
it looks like data and is an artefact of the resolve step.

**What it cost, itemised, because none of it is free:**

- **The go-back-tos tab lost its sort key.** It ranked by how many times you had
  been back — the one ordering in the app that reflected the strength of a
  preference rather than its recency. It now falls back to most recently
  resolved.
- **`guide` lost its evidence.** §6 specifies the copy *"{name} wants to see
  {title}. You've been back n times."* That sentence cannot be written. It now
  reads *"…You would go back to it."* — the same claim without the weight behind
  it. `guide` exists to say *you are the person to talk to about this*, and the
  number was the reason it was true of you and not of someone else. **This is
  the sharpest cost and it is unresolved**, carried into Phase 3.
- **The mono face lost its main job.** §11 gave IBM Plex Mono to return counts
  and timestamps. It keeps timestamps and the handle input; it is no longer the
  type of anything that matters.
- **A go-back-to is now binary.** Been back once and been back eleven times are
  the same row. §1's distinction between *liked it* and *returns to it* survives
  only as the state itself.

**What was kept.** The `go_back_to` state, which was never the same thing as the
count — it says *I would return to this*, and that is intact. The `return_count`
column also survives, unread and unwritten, holding whatever it held. §5's
"nothing is ever deleted" is about entries rather than columns, but dropping it
would destroy the only counts anyone recorded, for tidiness. Restoring the
feature means restoring three files and a CSS utility; restoring the data means
nothing, if the column is gone.

**What would change this back:** evidence that people do record returns when
asked — or `guide` proving unconvincing in Phase 3 without a number behind it,
which is the first place the absence will actually be felt rather than reasoned
about.

### The want label leaves the row once the want is resolved

`components/entry-row.tsx` renders `spec.wantLabel` unconditionally in the
metadata line, and one `EntryRow` serves all four `/me` tabs. So "Want to see"
appears under a go-back-to that already has a return count of 1 and a *Been back
again* button, and under an archived `done` — a film that was seen, that nobody
is going back to, and that nobody wants.

**Decided 8 August 2026: render it only while `state = 'want'`.**

The defence for the current behaviour is real but narrow. §5.2 says a go-back-to
is still a want, which is why the live view is `state in ('want','go_back_to')`
— so the label is not *false* on a go-back-to. It is false on `done` and on
`fixture`, where nothing is wanted at all, and on the live list it is redundant
with the thing beside it.

Nothing replaces it, because two things already carry the state. The tab names
the collection on three of the four views. And on the live list — the only view
that mixes `want` with `go_back_to` — the return count is the difference, which
is precisely the load §11 puts on it when it calls the count the signature
element of the product. A word saying "want" next to a numeral saying "you have
been back once" is the label competing with the signature.

**What would change this:** the live list gaining a third state, or the count
being cut. Neither is planned.

This is a label, not a state change. `done` stays archived and owner-only,
`fixture` stays reachable only from the `own` intent, and §5.2 is untouched.

### A private one-line note, and why it is not a review

**Decided 8 August 2026:** an entry may carry a short note written by its owner,
readable by nobody else.

§4 bans the word `review` outright and `no-restricted-syntax` fails the build on
the identifier. §2 puts comments, scores and stars out of scope. The question was
whether this is that thing under another name.

It is not, and the test is not the length of the text but who it is for. A review
is addressed to an audience: it is published, it accumulates, it ranks, and its
existence changes what other people pick. This note is addressed to the person
who wrote it — *the one with the long tracking shot*, *saw this with Dad* — and
it is invisible to everyone else, so none of that machinery can start. Nothing is
published, nothing is scored, nothing is aggregated, and no one else's decision
can be moved by it. Remove the audience and the objection goes with it.

It also serves the state the product otherwise says least about. `done` is a
private archive nobody can see; a note is the only reason to open it.

**Constraints, all of which are the point:**

- **The identifier is `note`.** Not `review`, not `comment`. The lint rule is
  correct and stays.
- **Owner only, enforced in `lib/db/`** (§3). Never in
  `listEntriesForOtherUser`, never in overlap, never in an aggregate. Carried
  forward to Phase 2 in `docs/plan.md`, because the shared projection gets
  written there and a leaked column is exactly the failure §5 cannot detect.
- **One nullable text column on `entries`**, bounded by Zod at the boundary
  (§10). Bounded because an unbounded text field is how a note becomes an essay
  and an essay becomes a review with an audience of one, then two.

**What would change this:** any request to show a note to anyone but its author.
That is not an extension of this decision, it is the reversal of it — the whole
argument above is the privacy.

### The redesign, 9 August: scale contrast, one navigation, and a rail

**Trigger:** the person who commissioned the app looked at it and said it was
neither instinctive nor attractive, and that the desktop view was "compact and
bare". That is the second time in three days that looking at the thing produced
findings that reasoning about it had not, and the pattern is now worth naming
rather than re-learning.

Four separate faults, and only one of them was taste.

**1. Nothing was ever big.** The largest type in the signed-in app was the 21px
nav wordmark. A film title — the subject of the entire product — was 15px, the
same size as the year beside it, the label under it, and the button under that.
§11 says type is the entire design, and that had been read as *small type only*.
It is the opposite: editorial design is violent contrast between one large thing
and everything else, and the app had only the "everything else". Fixed by
`--text-title` (22px, 28px from `lg`) against `--text-micro` (11px), a little
over 2:1, where it used to be 15 against 12.

**2. Nearly everything was muted.** `--color-muted` was on the year, the want
label, the resolve button, the tick, the tabs, the handle, sign out, every empty
state, and the only error message in the product. Roughly four glyphs in five on
a given screen sat at 60% opacity, which does not read as restraint — it reads as
disabled. The palette did not change (it is three days old and correct); its
application did. Contrast is now carried by size, which frees colour to mean
something.

**3. The 32px poster was decoration that failed at decorating.** Too small to
recognise a film by, and cropped square so it was not even poster-shaped, on the
one screen §11 wants type to carry. Removed from every list. It survives where it
is *functional* — the search dropdown and the intent sheet, where telling two
films of the same title apart is the actual task — and tapping a title now opens
the artwork full-bleed at TMDB's largest size. The trade: no poster anywhere you
did not ask for one, a real poster when you did, instead of a thumbnail
everywhere that was neither.

**4. Half the navigation was a duplicate, and that is what "not instinctive"
meant.** A header offered *Add* and *Me*; `/me` then offered four collection tabs
beneath it. And `/` listed the `live` view while `/me` **defaulted to the `live`
view** — two top-level destinations onto one list. There is one axis of
navigation in this product (which collection am I looking at) and it was being
expressed as two, one of them a second door onto one room.

So: the collections are routes — `/`, `/go-back-tos`, `/fixtures`, `/archive` —
named once, in one place. `/me` `permanentRedirect`s, translating its old
`?view=` values rather than dropping everyone on Wants, because a bookmarked
`?view=archive` was a bookmark of the archive. Adding happens on Wants, which is
where a new want lands, and is a better answer than a tab called *Add* that had
to explain itself.

**The rail answers the desktop question, and it is not primarily a visual fix.**
`docs/plan.md` recorded the browser view as sparse and cramped at once: a 576px
column of phone-sized type in a 1440px window. The obvious repair was to widen
the measure and step the type up, and that would have fixed *cramped* while
making *sparse* worse — a longer line of bigger text is still one column in a
void. Putting the four collections in a persistent left rail spends the width on
navigation that was previously stacked vertically above the content, so the wide
layout gains something the narrow one cannot have instead of being the narrow one
stretched. It also happens to dissolve fault 4, which is the argument for doing
both at once rather than in sequence.

**The desktop question itself is now settled: a browser is a target.** It had
been open since 8 August, on the reasoning that §12 ends at a home-screen PWA and
§13 seeds by text message. That reasoning still holds for where people will *use*
the app; it did not survive the observation that a browser is what a link opens,
and a link is how §13 seeds. Deciding it deliberately was the point.

**Two reversals worth flagging, both of earlier entries in this file.**

- **Hairlines are back between rows.** They were removed on 8 August because "a
  border under every item drew a horizontal line every three lines of text and
  turned a short list into a table". True at the spacing it was written about:
  12px of padding, so the rule sat closer to the text than the text sat to
  itself, and read as a cell boundary. At 28px it inverts — the space separates
  and the rule measures, which is what a hairline does on a printed page. §11's
  own palette calls `--color-rule` an editorial divider; this is that use.
- **The capture field no longer wears `input-text`.** That utility exists to sit
  at 13px with a mouse and 16px on touch, and its whole argument was that a form
  should be set in one size throughout. The capture box is not in a form. It
  takes `text-base` — 16px at every pointer, which clears iOS Safari's zoom
  threshold for the same reason `input-text` does, without taking a compromise
  made for a consistency it is not part of.

**What was deliberately not touched:** the auth pages. `plan.md` had already
concluded a narrow sign-in form is correct at any width, and `/sign-in`'s optical
centring is arithmetic derived from the current control heights and gaps — the
one place in the app where changing a gap silently invalidates a recorded
calculation. It is also the most-worked screen in the project and was not what
anyone was complaining about.

**What would change this:** the title size is the load-bearing number. If real
lists turn out to be full of long titles that wrap to three lines at 22px, the
answer is a smaller title rather than truncation — the ellipsis was removed on
8 August because it promised an expansion that did not exist, and that is still
true.

### A second colour: lacquer red for "you are here"

**Directed 9 August.** `--color-active: #c1483c` marks whichever of the two
header glyphs — Home or Profile — you are currently on, and nothing else.

This is the first colour added to the palette since it was set, and the palette
being small is most of §11. Three things make it defensible rather than drift:

- **It does not touch the amber rule.** §11 reserves `--color-accent` for overlap
  state, and brass is still spoken for, still unused until Phase 3, still the
  only thing that will mark a convergence. Two colours, two meanings, neither
  borrowed from the other.
- **It inherits the same scarcity discipline.** The moment red appears on
  something that is not a current-page marker it stops meaning anything, and the
  header glyphs stop being readable at a glance. The rule around it is the rule
  around amber, word for word.
- **An unlabelled glyph has no word to carry its state.** That is why the two
  icons get colour and the collection labels in the bottom bar do not — a word
  can say where it is by getting brighter, and `text-text` on the current
  collection still does. The inconsistency is deliberate and is about labels
  versus glyphs, not about two ideas of "active".

**⚠ It is not the error colour, and spending it on one would cost this.**
`docs/plan.md` has wanted a red for failure messages since 8 August and
deliberately did not add one — those are full-strength text instead, for exactly
this reason. If a red is ever wanted there it has to be a *different* red, or
this stops being a position and starts being an alarm.

Measured 4.26:1 against the true-black ground, past the 3:1 WCAG 1.4.11 asks of
a graphical control. `aria-current="page"` is on both links regardless, so
nothing depends on seeing the colour.

### The poster wall, and the largest deviation from the brief so far

**Directed on 9 August**, and it needs stating plainly rather than buried: the
home screen is now a wall of posters for films in cinemas or about to be, and
that is imagery well beyond what §11 allows. §11 says "no imagery beyond small
poster thumbnails"; §2 rules out public discovery and algorithmic
recommendation; and the same day this landed, the thumbnails were being removed
from the lists for being decoration that failed at decorating. Both moves are
defensible together, but only if the argument is written down.

**The argument is that this is a capture prompt, not a catalogue.** Again is a
capture tool first (§8), and the thing it was worst at was the moment before
capture — you have to already know what you want in order to type it. A wall of
what is on is the answer to *what have I been meaning to see*, which is the
question the app exists to catch. Three tests it passes, and each one is a line
that must not be crossed later:

- **It is not availability.** §2 calls "where to get it" the most tempting wrong
  feature in the whole design. Nothing here says where to watch anything, and
  nothing may be added that does — no streaming lookup, no cinema times, no
  booking link. That is the line, and it is close.
- **It is not recommendation.** No algorithm, no personalisation, no ranking by
  anything about you. Everyone signed in sees the same wall. It is ordered by
  **release date rather than TMDB's popularity score**, deliberately: popularity
  order would make it a chart, and a chart is the discovery feature §2 rules
  out. `inCinemas` in `lib/tmdb.ts` does that sort for this reason alone.
- **It is not a feed.** One page from each of two endpoints, no infinite scroll,
  no accumulation, and nothing about it responds to what you did yesterday.

**Tapping a poster starts an add**, which is what keeps it a capture surface
rather than something to look at. A wall you cannot act on would be decoration,
and decoration is exactly what §11 is guarding against.

**Where it is still wrong, if it is:** the §13 test — "if a feature request
makes the app more useful to a stranger, it is probably wrong". This one does.
A stranger with no friends on Again gets a browsable wall of new releases. The
counter is that it makes the app more useful to a *member* in the same motion,
by removing the blank screen §8 warned about; but the test is failed, not
passed, and that is the thing to weigh if this ever feels like the wrong product.

### The wall is regional, and its sort was backwards — 15 August

Two changes, both directed, and the first is the one with an argument in it.

**"In cinemas" is a claim about a place, and it was being made about the United
States to everybody.** TMDB defaults `now_playing` and `upcoming` to the US when
no `region` is given, so a London wall opened on American release dates that run
weeks or months out of step with the ones down the road. The region now comes off
the request — `x-vercel-ip-country`, validated, in `lib/region.ts` — and rides in
the URL, so Next's data cache fragments by country rather than by person.

**It is a guess and it is allowed to be.** An IP is wrong for a traveller and for
anyone on a VPN. Nothing stores it, nothing filters a query by it, and the worst
case is somebody seeing another country's release dates — which is exactly what
everybody saw before. A setting would be right rather than usually right, and it
costs a column, a screen and a question asked of someone who opened the app to
look at posters. The deferred user-context model in *What Again is for* is the
same judgement.

⚠ **This does not move the §2 line, and it is worth being explicit about why,
because it looks like it might.** Regionalising does not add a claim — it makes
the claim already on screen true. The wall still says nothing about which cinema,
at what time, for how much, or how to get in, and none of those may be added. An
incorrect claim is not the safer side of that boundary.

**Region, not language**, and the reason is in `items`. `language` decides the
title TMDB returns, and the title on the wall is the title copied into `items`
when somebody taps a poster — so localising it would write a French name into a
row that a mutual track reads in English, and `lib/overlap.ts` joins on `items`.
Dates are regional; the canonical name is not.

**The sort was newest-first, which is `upcoming` descending** — so the wall
opened on the film furthest from being watchable and what is actually on was
below the fold. The comment above the function had claimed *"what is on now, then
what is coming"* since 9 August; the code had never done it. It sorts by distance
from today now, in both directions, which is one comparator and puts "out last
week" beside "out next week".

### Country is the ceiling, not a stage on the way to something better

Asked immediately afterwards: *how regional is the regionalisation?* Country
only, and it is worth writing down why that is the end of the road rather than
the first step of it.

`region` filters **release dates in a country**. It knows nothing about screens.
A film released here six weeks ago stays in `now_playing` after it has left every
cinema, and tonight's repertory screening of something from 1974 is not in the
listing at all, because it has no new release date. So the wall is right about
the country and blind to everything below it.

**Below country there is nothing but venues and showtimes**, which is the
acquisition side of the line drawn earlier the same day in *What Again is for*.
There is no intermediate granularity to want. If the wall ever looks
approximate, that is the data being honest rather than a setting missing.

### The wall says what it is, and the app finally has headings

Reported in the same breath: *there is still no indicator to users that these are
on-now and on-soon movies where they are*, and *how soon are the on-soon films?*
Both were true, and the second had an answer the app was throwing away.

**TMDB sends the window in every list response** — a `dates` object beside
`results` — and the Zod schema parsed `page`, `total_pages` and `results` only.
The wall knew its own span and never said it. It is one optional field now,
optional for the same reason the paging fields are: a caption that quietly loses
a clause beats a wall that throws because an envelope was reshaped.

**One line, not two section headings.** Headings for *On now* and *Coming soon*
would mean splitting the wall back into two blocks, and the sort deliberately
fans outward from today in both directions so that "out last week" sits beside
"out next week". The caption describes the whole thing instead, at the `micro`
tier — whose own note already describes this use: *the app's own words about
someone else's content*.

⚠ **The tempting clause is the false one.** *Showing near you* is what a reader
wants it to say and it cannot be said, for the reason above. The line states
where and when and claims nothing about a venue.

**Naming the country is not decoration.** The region is a guess from an IP, so it
is occasionally wrong — and when it is, this line is the only thing that turns a
strange-looking wall into a legible one. `Intl.DisplayNames` is in the runtime,
so it costs no table of country names and no dependency. A preposition is avoided
on purpose: *in the United Kingdom* wants an article that *in France* does not,
and that is a list of exceptions to maintain for no gain over a dash.

**And it turned out the app had no `<h1>` anywhere at all.** Not on `/`, not on
the four collections, not on `/profile` — while `docs/spec-sheet.md` asked for
one meaningful heading per page. Three answers, and none of them adds anything
visible except the first:

- `/` takes the caption, which was going to exist anyway.
- The four collections take an `sr-only` heading reading `COLLECTIONS`, because
  the bar at the foot and the rail already name each one on screen — a visible
  heading would name it twice, which is the duplication the 9 August redesign
  removed when `/` and `/me` were two doors onto one list.
- `/profile` promotes the display name from `<p>` to `<h1>`. It was already the
  largest type on that screen; only the tag was wrong. An account with no display
  name gets an `sr-only` fallback, since a heading that disappears with its data
  is the same fault one layer down.

### Two words, and they change as you scroll — later the same day

Directed after seeing it: the caption should read **In cinemas**, and then
**Coming soon** once you reach the first row of films that are not out yet. No
country, no date.

**It is not a shorter caption. It is a different wall**, and that is the part
worth recording. A label that changes at the first row of *coming soon* needs
such a row to exist, and a wall that fans outward from today has none — released
and unreleased alternate all the way down. So the fan-out ends and the two groups
come back, each ordered towards the present: newest release at the top of one,
soonest arrival at the top of the other.

**Three orderings in one day**, which is the useful thing here rather than the
destination. Newest-first (wrong, and contradicting its own comment since
9 August), then distance-from-today (right for an unlabelled wall), then two
groups (right for a labelled one). Each was correct for the screen it was built
against, and what changed underneath them was whether the wall speaks.

**The `dates` parse went with the caption that read it.** It had one reader,
which is now two fixed words, and unread parsing is the kind of thing that
survives for a year because nobody is sure. The one-line restoration is written
at the point it was removed from.

⚠ **What the shorter caption costs, stated once so it is not rediscovered.** The
country was there because the region is guessed from an IP: when it is wrong — a
traveller, a VPN — that word was the only thing that turned a strange-looking
wall into a legible one. Without it a wrong guess is silent, and looks like the
app being broken rather than the app being wrong about where you are. Putting it
back is one string in `app/(app)/page.tsx`.

**Sticky, and the first attempt at it was wrong.** Each section got its own
heading, pinning and being pushed out by the next — list-section behaviour, pure
CSS, no listener and no state. It shipped and was rejected on sight, for the
reason that is obvious once seen: **the second heading is a permanent band in the
document.** *Coming soon* existed on the page whether or not you had reached it,
and scrolling past it read as passing a divider rather than as one label changing
its mind.

**One slot, one label.** The caption sticks for the whole scroll and swaps its
text at the seam; between the grids there is nothing but the row gap, so the two
halves read as one wall with a change of subject.

That costs the CSS-only property, and buys the thing that was asked for. An
`IntersectionObserver` watches a 1px seam, with the root's top edge pulled down
by the caption's own measured height — which is what makes the swap happen when
the seam reaches *the label* rather than when it reaches the top of the screen.
Still nothing per frame, and nothing reading `scrollY`.

Both directions come out of one reading: `isIntersecting` goes false at the top
of the root *and* at the bottom, so the sign of `boundingClientRect.top` is what
separates them. Scrolling back up restores the label without a second observer.

⚠ **And it pinned under the status bar.** At `top: 0` the label sat beneath the
clock on the handset, reported within minutes. The masthead has cleared
`env(safe-area-inset-top)` since the first week; a second pinned surface needed
telling separately, because the inset is a property of the screen and not of the
element that happened to learn about it first.

> **Every new pinned surface re-opens the safe area.** Nothing inherits it, and
> the failure is invisible on any device without a notch — which is every device
> this project builds on.

⚠ **It sits *below* the masthead on purpose**, `z-10` against `z-20`, with `main`'s
`isolate` making that ordering a guarantee rather than a coincidence of two
numbers. So the label is hidden while the masthead is up and appears as the
masthead recedes — which is to say it is present exactly while you are scrolling
down through posters, and hands the top strip back to the mark when you scroll
up. The two behaviours were designed hours apart and this is the only place they
meet.

> ⚠ **The last sentence of that paragraph was false, and was reported on
> 16 August.** The z-order holds only while the two elements move together, and an
> overscroll at the top separates them — so the caption slid out from under the
> mark on the opening screen. It reads `data-masthead` now rather than relying on
> being covered, and the negative margin is the whole of `--masthead-clearance`
> rather than the notch. See *The caption becomes the masthead's other half*.

`/`'s `<h1>` is `sr-only` as a result. The visible caption names whichever half
you are looking at and changes as you scroll, so it describes a moment rather
than a page — which is the one thing a page heading may not do.

⚠ **The country being absent from the caption is not the region being absent from
the request**, and the two were confused within the hour. `viewerRegion()` still
goes to TMDB and the wall is still filtered to the viewer's country. What was cut
is the word on screen. The cost is only that a wrong guess is now silent.

### Four more from the handset, and the label had never once changed

#### The swap never fired, and the reason generalises

> ⚠ **Superseded 16 August, by a second bug in the same observer.** The
> `rootBounds` comparison this entry arrives at is gone — the observer watches a
> *half* rather than the seam, so nothing asks where anything is. The rule below
> survives intact and is the reason both bugs took a report. See *A boundary
> cannot report a jump*.

The observer was given a `rootMargin` pulling the root's top edge down to the
caption's lower edge, so that the label would change when the seam reached *it*
rather than the top of the screen. The callback then tested
`boundingClientRect.top < 0`.

**Those are two different lines.** `boundingClientRect` is viewport-relative; the
margin moved the root's edge to 38px. So the callback fired as the seam crossed
38 — at which moment `top` was about +38, and the test was false. And that is the
only moment it ever runs:

> **An observer reports crossings, not positions.** A test that is false at the
> crossing is false forever, because nothing calls back to ask again.

It read as the feature being absent rather than broken, which is what took a
report to find. `rootBounds` already carries the margin and is the honest source
for that line; the measured height stands in where a browser leaves it null.

#### The bar goes to the top of the screen, and the inset is given back

Three requirements meet on one element, and only one spelling satisfies all
three. Pinned at the inset, a strip of screen sits above it with posters running
through — reported. Pinned at zero without padding, the label is drawn under the
clock — reported an hour earlier. So the box starts at zero and carries the inset
as padding, which is what the masthead has always done.

That would then spend the inset again as dead space *in flow*, where the bar sits
below a masthead that has already cleared it — about 47px of nothing before the
first poster. A negative top margin of the same inset gives it back: the box is
pulled up behind the masthead, which is opaque and one layer above, so the space
it takes is space already covered. On a screen with no inset both values are zero
and nothing about it exists.

> ⚠ **The margin was the wrong quantity, and it took until 16 August to see it.**
> Cancelling the inset alone leaves the box in flow *below* a masthead that has
> already cleared the notch, so the label hung under the mark from the first paint
> instead of waiting behind it. It is `--masthead-clearance` now — the masthead's
> whole box and its hem — which lands the caption's band exactly on the
> masthead's painted one. The `top-0`-with-padding spelling above is unchanged and
> still correct.

#### A second red, and glass

Both directed. `--color-live` is documented at the token, including the cost: it
is the **second** red in a palette whose argument is scarcity, and it is brighter
than `--color-active` on purpose, since two reds a viewer cannot tell apart would
be worse than one red doing two jobs. They are never adjacent — the active red
marks Search or Profile and neither is current on `/`. It is still not the error
colour, and there being two reds now makes that refusal more important rather
than less.

The caption is the app's **first and only translucent surface**: `bg-bg/60` over a
backdrop blur, so artwork passing underneath reads as movement without the
letters sitting on it. §11's matte black is otherwise unbroken, and a second such
surface would make this a theme rather than a bar.

> ⚠ **It is three layers as of 16 August**, because the blur ramps up the band and
> an element cannot hold two strengths of one. The 60% survives as the ground's
> value at the band's foot. *Coming soon* also left `--color-muted` that day: a
> token tuned for text on ground is a different value on glass. See *The glass is
> three layers* and *The one marginal thing in the band*.

⚠ **All five new utilities were checked in the compiled CSS, not inferred from a
green build.** Tailwind emits nothing for a class it does not recognise and the
markup keeps the attribute, so an unknown utility is inert rather than an error —
`text-live`, `backdrop-blur-xl`, `bg-bg/60` and both `env()` calcs were confirmed
as real rules in the output.

#### Bigger, a blink, and a tick where there is one

**13px against the tier's 11**, set by overriding `--text-micro` on the element
rather than adding a second size class. `micro` reads that token for its size, so
one arbitrary property scales this caption alone — no duplicated tracking and
transform, and no two size declarations racing to win on emission order, which is
the trap the `input-text` note describes.

**The blink is a remount, not an animation state.** A CSS animation runs when an
element is inserted and not when its text changes, so the span carrying the word
is keyed by the word: a new label is a new element and the animation replays. It
also blinks on first mount, which costs nothing, because at rest the masthead is
up and the caption is behind it.

> ⚠ **That is half the mechanism, and the missing half meant one of the two words
> never blinked at all** — reported 16 August. A remount fires on a change of
> *word*, which is the only way *Coming soon* ever arrives; *In cinemas* is
> already mounted when the mark recedes. The animation hangs on `data-masthead`
> now and the key covers a crossing while the band is already up. The blink also
> moved onto the band and the word rises into place, because a word is 2.57% of
> the band's area and too small to be seen out of the corner of an eye. See *The
> blink had never fired for one of the two words*.

⚠ **The last keyframe is `opacity: 1` on purpose.** The reduced-motion block runs
every animation once at 0.01ms, so the final keyframe is what the element is left
showing — a blink written as `0% { opacity: 0 }` alone would leave the caption
permanently invisible for anyone who asked for less movement. The caret's note
records the same trap from the other side.

**A haptic at the crossing, and ⚠ it does nothing on the device this is installed
on.** There is no Vibration API in Safari, in a tab or standalone. It is written
as `navigator.vibrate?.(12)` — a capability check rather than a platform check,
per `CLAUDE.md`, so it simply does not run where the method is absent and needs
no change if it ever arrives. On Android it also stays quiet until the page has
sticky user activation, so the first crossing of a session can be silent there
too. Offered and kept because Android is one of the four shipping surfaces; if
that stops being true, this is three lines to delete.

#### A film missing from the wall, and two causes behind it

Reported by checking the wall against UK cinema listings: mostly right, with one
title on in cinemas and absent. Both causes are structural and neither was
visible from here, since TMDB's host is unreachable from this environment.

**It only ever asked for page one.** Twenty from `now_playing`, twenty from
`upcoming`. A national listing runs well past that, so the wall was not *what is
on* but *the twenty most popular things that are on* — and nothing on screen said
so, which is the part that makes it a fault rather than a limit.

**Depth is nearly free here, and that is the whole difference from search.**
`searchFilms` pages lazily because a query runs on a debounce of tens of
milliseconds, so an eagerly-fetched page is fetched again for every letter typed
on the way to a word. This is one fixed set behind a six-hour cache keyed by URL
and shared by everyone in a region: a five-page listing costs five upstream calls
per region per six hours however many people open the app. The argument that
made search lazy is the argument that makes this eager, and they only look
contradictory.

**The second cause is wrong however the first turns out.** Which half a film
belonged in was inferred by comparing `release_date` to today — after merging the
two lists, which threw away the one piece of ground truth in the response.
`now_playing` *means* showing and `upcoming` *means* not yet. Worse, the field it
inferred from is not reliably the regional date, so a film out here now but
released later in the United States reads as unreleased and lands under *Coming
soon*: a wrong claim, made confidently, on the one screen whose labels are the
whole point.

> Where a source already states a fact, do not re-derive it from a field that
> merely correlates with it.

The date now orders each group and classifies nothing, which is a job where being
approximate costs a poster two rows out of place rather than a false label.

⚠ **"Accurate always everywhere" has a ceiling, and it is worth naming before it
disappoints.** What this buys is completeness *within TMDB* for the viewer's
country. It cannot buy: a film TMDB has no regional release date for, a
long-running title that has aged out of the `now_playing` window while still
being on, or a repertory screening of an old film, which has no new release date
and is therefore in neither list. The wall is honest about *releases*, not about
*screens* — the same boundary the caption may never cross, recorded above under
*Country is the ceiling*.

#### And paging did not fix it, because it was the wrong question

Checked against a real venue's programme the same day: films under *In cinemas*
showing nowhere in the UK, films on at Picturehouse Central missing from the wall
entirely, and a major release absent from both halves. **The fix above was not
the fix.**

⚠ **Correct the record on one thing said here hours earlier.** The suspicion that
`release_date` might not be the regional date was wrong — TMDB uses the regional
release date when `region` is set. The provenance change stands on its own merits;
the diagnosis attached to it did not.

**The real cause is that the data does not exist.** `now_playing` is a `discover`
call behind the scenes, over **release dates**, and TMDB's own forum states the
limit: *"it may not be very accurate, as TMDB has the premiered release date but
doesn't have the date that ended in the cinema."* There is no record of a film
leaving a cinema and no cinema programming at all. So a film that opened five
weeks ago and has closed is still listed; one still running has aged out of the
window; and repertory screenings, which are much of an independent cinema's
programme, have no new release date and can never appear.

**No endpoint fixes this.** `/discover` with theatrical release types is the same
data through the same door. Depth was never the problem.

> **The label created the fault.** Until the caption existed the wall made no
> checkable claim, and nobody could catch it being wrong. Adding *In cinemas*
> turned a prompt into a statement about the world.

Which leaves exactly two honest moves: support the sentence, or stop saying it.
`docs/plan.md` carries both as *Pre-phase 2*, with the provider prices as
evaluated, and the decision is open.

The architectural conclusion is sound: either change the label to `New releases`, or pay for and integrate genuine showtime data.

**Two things found in that evaluation that are worth keeping whatever is
decided:**

- **TMDB id matching is the integration**, not the showtimes. `items` is keyed on
  TMDB ids and `lib/overlap.ts` joins on `items`, so a provider returning titles
  means building a matching layer — which is where this class of integration
  usually fails. One provider advertises native TMDB ids; that is worth more than
  its price difference.
- **"Accurate where the user is" needs to know where the user is.** All the app
  has is a country, from an IP. Cinemas are local, so showtimes imply a location
  permission or a stored postcode — user context, deferred deliberately in *What
  Again is for*, and needing a `/settings` that does not exist. The data source is
  the visible cost; this is the one that gets underestimated.

#### Tailwind reads comments, and compiled one

> **Do not spell a class's own syntax into a comment.** The scanner treats the
> file as text and has no idea what a comment is.

A sentence explaining the `--text-micro` override wrote the arbitrary-property
syntax out as an example, and a rule with a literal ellipsis for a value appeared
in the production stylesheet. Harmless, unused, and only found because the
compiled CSS was being read rather than trusted — which is the second thing that
check caught in one session.

**Unverified:** `inCinemas()` has never run against the real API. TMDB's API host
is unreachable from the environment this was built in, so the call is checked
only by types and by sharing its Zod schema with `searchFilms`, which does work
in production. Both list endpoints return the same `results[]` shape as
`/search/movie`, so the parse should hold — but should is not does, and an empty
wall with search still working is the designed failure.

### The search field moved into the phone's bottom bar

Same instruction. The bar now holds one of two things and a chevron swaps them:
search by default, the collections one tap behind it. They cannot both be shown
— the collection line already runs to within about 15px of a 375px screen, and
there is no width left for a field beside it.

**Search is the default**, because on a phone the bar is now the only route to
the field, and adding is what the app is for. The chevron points right at a
field waiting to be typed into and flips to point back once the collections
show: one glyph doing one job in both directions, rather than two icons to learn.

**A caret blinks while the field is empty and unfocused**, at the 1.06s interval
terminals use. It stops on focus, because the browser draws the real one and two
carets is a bug rather than an effect. WCAG 2.2.2 governs blinking content and
exempts a text cursor, which is what this is.

**Results open upward.** There is nothing below the bar but the edge of the
screen, and this also puts them where the keyboard is not: the viewport is
`interactiveWidget: 'resizes-content'`, so an open keyboard shrinks the layout
viewport and the list opens into what remains. This is a better arrangement than
the one it replaces — the old top-of-page dropdown is what produced the
landscape bug on 8 August.

**The bar stops receding while search is in use.** A bar that slid away
mid-search would take the field, the results and the keyboard's anchor with it,
and the scroll that triggered it would usually be someone reaching for a result.

**At rail widths none of this applies** — the field stays at the top of the home
screen, above the wall. Two fields in two places would mean two pieces of state
and one of them always stale, so it is one or the other by width, never both.

**The add flow moved above both surfaces.** There are two ways to start an add
now — a poster in the wall and the search field — and both end in the same
intent sheet, server action and ten-second undo window. `CaptureProvider` owns
that once; duplicating it would have meant two undo timers and a second intent
sheet free to drift from the first. The sheet became an overlay in the process,
because the thing that starts an add may be a 110px poster halfway down a grid
or a field pinned to the bottom of the screen, and neither has room to answer in.

### Space Grotesk, capitalised — and the old face kept

> ⚠ **Superseded 15 August: the face is Ojuju again, at 1.75rem.** Every
> measurement in this entry describes Space Grotesk and none of it is current.
> Kept for the two things that outlived it — why the capitalisation is a deletion
> rather than a string, and why the losing face is left declared and lazy. See
> *The masthead takes the typing*.

**Directed 9 August.** `--font-display` is Space Grotesk and the mark reads
*Again* rather than *again*.

The capitalisation is a deletion rather than an addition: `wordmark` carried
`text-transform: lowercase`, and the JSX string has always said "Again". The
transform existed so the mark could not drift between the two places it appears;
removing it keeps that guarantee and renders the string that was written.

**Ojuju is still in the code, deliberately, and costs nothing.** The declaration
stays in `app/layout.tsx` with `preload: false`, so switching back is one line in
`globals.css`. `@font-face` is lazy — a browser fetches a font only when text
actually uses the family — so the only thing that would have downloaded it
anyway is next/font's preload hint, and that is the thing turned off.

**Every trim constant had to be re-measured**, because they describe a typeface
rather than a size. Space Grotesk at 36px: declared ascent 35, descent 11, so a
46px content area against Ojuju's 51px; the ink of "Again" runs 26px above the
baseline and 8px below. `MARK_LINE_HEIGHT` went 1.4167 → 1.2778 and the trims
with it. The inked height came out at **34px either way**, which is the only
reason `HEADER_HEIGHT`'s 3.375rem did not have to move — a coincidence worth
knowing about rather than relying on.

### One character is a search, and the cap comes off

Both were dropdown-shaped decisions that stopped making sense when results
became a wall.

**The two-character minimum is now one.** A single letter would have dropped a
list of noise over the page; the same letter produces a different wall of
posters, which is a thing you can look at. The floor lives in three places and
all three moved together: `MIN_QUERY` in `components/search-provider.tsx`, the
Zod schema in `app/api/search/route.ts`, and `searchFilms` in `lib/tmdb.ts`.

**The eight-result cap is gone.** Eight rows is as much list as anyone reads
before retyping; eight posters is two thirds of a screen with the rest empty. It
is the whole page now — twenty, which is TMDB's page size.

⚠ **TMDB has no prefix search, and there is no endpoint that does.**
`/search/movie?query=b` is a relevance match ranked by popularity, not "films
beginning with b". A single letter therefore returns TMDB's twenty best guesses
for that letter, not an alphabetical run, and no amount of paging changes what
kind of answer it is. Whole pages *could* be chained to go deeper — at one
upstream request each, on every keystroke, behind a rate limiter, for a wall
nobody scrolls to the four hundredth poster of.

### The phone shell, and a breakpoint named for the layout

All directed on 9 August, after the redesign was looked at. Recorded for the two
places where carrying out the instruction required a call nobody made.

**`--breakpoint-rail: 45rem`, rather than `md`.** The trigger was "make iPads
show the rail" — the rail had been at `lg` (64rem), so every iPad in portrait
except the 12.9" Pro was getting the phone layout. `md` at 48rem would have
fixed three of the four and still missed the mini at 744px. So the number comes
from the layout instead of from the device: the rail costs 224px plus a 48px gap
plus gutters, and below about 720px the reading column is squeezed harder than
the navigation is worth. That it catches every current iPad is a consequence
rather than the definition, which is what keeps it correct when the device
landscape moves.

**It is deliberately not the same breakpoint as the type step.** Titles go to
28px at 64rem, and the entry row moves its action to the right at 64rem. So a
tablet gets the rail with phone-sized rows and a laptop gets both. One
breakpoint doing both jobs would have forced a choice between a cramped tablet
and no rail on one at all.

**The counts came off the phone collection row.** Not asked for, and it is what
makes the dotted line fit: the labels are ~240px at the caption size, the dots
bring it to 295px and the home icon to ~320px, against the ~335px a 375px
handset leaves after the gutter. Four counts add another ~80px and put it over
the edge on *every* phone, so the row would have wrapped to two lines and undone
the reason for the dots. The rail has two edges to hang a label and a numeral
from; a single line has one, so the count is the thing that gives.

**The collection row moved to the foot of the phone screen.** Directed, and the
reason it is better is not style: that row is the only thing on a phone reached
for repeatedly, and the top of a handset is the part a thumb cannot get to. What
stays in the header — the mark, the way to your profile — is looked at rather
than pressed, so the two halves separate cleanly by how often they are touched.

`fixed`, not `sticky`. Sticky sounds like it saves the padding underneath by
staying in flow, and does not: a sticky element pulled to the viewport edge still
overlays whatever is beneath it. The padding is needed either way, so `fixed` is
the honest spelling of it.

**The padding under `main` is 6rem below the rail breakpoint and 2rem above**,
set as an arbitrary property rather than the inline style it used to be, because
it now has to differ by width. 6rem clears a bar that has wrapped to two lines at
320px, which is more than the ~48px it normally occupies — deliberately, because
overshooting costs dead space below the last row and undershooting costs a row
you cannot read.

**Home and Wants became different screens, and §8 pays for it.** Directed late
on 9 August: *the input field should be on the home screen, not the Wants.* So
`/` is the capture box alone and `/wants` is the list.

This resolves the awkwardness flagged earlier the same day — a house glyph
pointing at the collection sitting next to it — in the other direction from the
one that was defended. It is the better answer: capture is now a place rather
than the top of a list, which suits a product §8 calls a capture tool first and
a browsing tool second.

**What it costs is §8's "it is never blank underneath."** That requirement was
written when the list *was* the home screen and there was nowhere else for it to
be; with the list one tap away, a home screen showing only its field is the
honest shape rather than a regression. But it is a real deviation and the first
thing to revisit if a new account finds nothing to do on the screen it lands on.
The cheapest remedy, if so, is the last two or three additions under the field —
recent captures, not the collection, so it does not become the duplicate the
shell was rebuilt to remove.

**The optimistic row went with it.** Adding used to appear instantly as a row in
the list underneath — `useOptimistic` over the entries, reverting on its own if
the action failed, which is what §10 asks for. With no list on the route there is
no row to insert, so the acknowledgement is a sentence: *Adding {title}…* set on
the same tick the film is picked, replaced by *Added {title}. Undo* when the
server answers. The undo window is unchanged.

**`/profile` exists.** The second of
those looks like the exact fault this shell was built to remove, and is not. The
old fault was two *named* destinations onto one list, which made you choose
between two words for the same thing. A glyph at the head of the line is not a
fifth collection — it is the way back to the top of the app from anywhere, which
on a phone is the one move worth an icon.

`/profile` carries the handle and *Sign out* in the **bottom-left corner**,
because that is where the rail already puts them. The same two things in the
same corner at every width, so moving between a phone and a laptop does not move
them; a centred block would have been a different composition that happened to
contain the same words. It also renders `profiles.display_name`, which has been
collected at onboarding since Phase 0 and rendered nowhere — showing your own
name to yourself pre-empts nothing, since the open Phase 2 question is what
*other* people see.

**This is where `/settings` will grow.** Three things are already waiting on it
in `docs/plan.md` — TMDB attribution (a licence condition), the iOS install
note, and changing a password you *do* know. None is built and none was asked
for, so the page holds two items and no heading.

---

## Search goes deep, and the mark changes case twice — 10 August

Four instructions in one pass, after the first look at real search results on the
deployed app. Two were settled by looking and needed no code: **one letter does
give a usable wall**, so `MIN_QUERY` stays at 1, and **the 300ms slide on the
phone's collection bar is right**, so it stays. Space Grotesk stays too.

### As many results as possible, in real time

Both halves were asked for together and they pull against each other, which is
most of what the design here is about: *deeper* means more upstream requests and
*faster* means more of them again, and the budget is one TMDB quota.

**Depth is pulled, not pushed.** `searchFilms` takes a page number and returns
one page; the wall asks for the next twenty as its foot comes into view, up to
TMDB's own ceiling of 500 pages. The alternative on the table was fetching three
or four pages per query, which is simpler and wrong: the request runs on a
debounce measured in tens of milliseconds, so every eagerly-fetched page is
fetched again for every letter typed on the way to a word — quadrupling the bill
for posters three screens below the fold. First paint still costs exactly one
request.

⚠ **This does not make search complete, and no amount of paging would.**
`/search/movie?query=b` is a relevance match ranked by popularity. Page 5 is the
81st–100th most popular match for "b"; it never becomes an alphabetical run,
because TMDB has no prefix-search endpoint. Depth buys more matches, not all of
them, and that distinction should survive any future request to "show
everything".

**Real time is 90ms, down from 220.** A fast typist is at 100–150ms between
letters, so 220 waited out the ordinary gaps as well as the deliberate ones and
the wall always arrived a beat after you stopped. It cannot go to zero: a request
per keystroke is mostly requests for prefixes nobody meant, and their answers
race each other back. A `generation` counter makes late answers safe to drop —
`AbortController` alone does not, since an abort races the response rather than
beating it.

**A client-side cache is what actually makes it feel immediate.** Every query
typed this session keeps its pages in a `Map`. Backspacing out of `matrix` is not
a new question, and correcting a typo — the most common thing anyone does in a
search field — now costs a render rather than a round trip.

**`LIMITS.search` went 30/min → 120/min.** Thirty was sized for a four-times
longer debounce and a single page; one unlucky minute of typing and scrolling now
passes it, and a 429 mid-search reads as the app being broken rather than as a
limit working. The limit exists to stop a script draining the quota, and 120 does
that as well as 30 did.

**The four fields of a loaded query are one piece of state.** Held separately, a
keystroke could leave `results` describing the old query while `page` described
the new one, and *load more* would append page 2 of what you are typing onto the
results of what you typed a moment ago. Carrying the query string alongside them
makes that unrepresentable.

**A new query returns to the top.** It did not matter at twenty posters; at
several hundred, typing another letter three screens down would leave you three
screens into a wall that had been replaced under you.

**No spinner at the foot.** The wall is silent artwork, and a caption every
twenty posters would be the loudest thing on screen — announcing a mechanism
whose job is not to be noticed. Posters simply continue.

⚠ Still unverified against the live API: that a page is twenty and that
`total_pages` says what it is documented to say. TMDB's host is unreachable from
the build environment. Nothing depends on the figure — `hasMore` reads
`total_pages` off the response rather than assuming a page size — but the number
in these notes is still documented behaviour rather than one anyone has read.

### The blinking caret was wrong twice over

A hand-drawn 1px caret blinked in the search field while it was **empty and
unfocused**, and unmounted on focus so the browser's real one could take over.
Deleted, along with `--animate-caret`.

A blinking cursor means *this is where your typing goes*, and it was making that
claim at a field nobody had touched — falling silent at the exact moment it
became true. Asked for the right way round on 10 August: it should blink when you
tap in, which the browser does for free, in the platform's own rhythm.

The same element caused the second fault. At 1px wide with 6px of the row's `gap`
beside it, unmounting on focus moved the placeholder and everything typed after
it 7px left, and 7px back on blur — a prompt that flinched when you tapped it.
One deletion answers both, and there is nothing to put in its place: the word
"search" is the affordance and the caret is the browser's.

The original was defensible, which is why it was built. It is recorded here so
the argument for it is not made again.

### The mark's case: caps, then back to lower — both on 10 August

> ⚠ **Superseded 15 August.** The mark is capitalised, in Ojuju, at 1.75rem, and
> the numbers below are Space Grotesk at 36px. **The mechanism this entry
> describes is also gone**: the trims and paddings no longer have to be moved by
> hand, because `--wordmark-ink` and `--wordmark-slack` express them against
> `--text-wordmark`. Kept for the argument that a `text-transform` beats four
> literals, and for the record of a decision that has now moved five times.

Directed twice in one day. The mark went `Again` → `AGAIN` in the morning and
`AGAIN` → `again` in the afternoon, and it is now set in lower case.

**The record is kept because the round trip is the useful part**, not the
destination. Case is a taste decision settled by looking, it has now been all
three values in two days, and it will very likely move again. What matters is
that the cost of moving it stays near zero and that nobody re-derives these
measurements a third time.

**One declaration, not four strings.** `text-transform` on the `wordmark`
utility, where it was before 9 August. The mark appears in the phone header, the
rail, `/sign-in` and `/reset-password`; four literals are four things that can
drift, and a transform keeps them one thing. It also keeps the DOM text as
"Again" at every call site, so `<title>`, prose and the accessible name all
spell the app's name as a word whatever the CSS is doing — which is the
accessibility argument too, since a screen reader may spell out a five-letter
literal in caps.

**`letter-spacing` follows the case.** −0.005em for lower case; it was raised to
+0.03em for the caps pass, because caps at display size are drawn expecting to be
tracked, and put back with them. The same value on a lowercase mark reads loose.

**Every case measured, so the next change is two lines.** `TextMetrics.
actualBoundingBox*` at 36px in Space Grotesk:

| | ink above baseline | ink below | inked height | `MARK_TRIM_BOTTOM` | `main` padding |
|---|---|---|---|---|---|
| `again` (**current**) | 26px | 8px (the `g`) | 34px | −0.0833em | 3.375rem |
| `Again` | 26px | 8px | 34px | −0.0833em | 3.375rem |
| `AGAIN` | 26px | 1px | 27px | −0.2778em | 2.9375rem |

**Lower case and capitalised measure identically**, which is why going back cost
nothing but restoring the old numbers: the `g` sets the bottom either way, and
the top is 26px in all three — the dot of the `i` reaches as high as the capital
A. Only caps differ, and only at the bottom, where the descender is missing. Its
1px is the `G`'s overshoot, not noise: round letters are drawn a hair past the
baseline so they do not read short beside a flat one, and trimming it would clip
the curve.

`MARK_LINE_HEIGHT` and `MARK_TRIM_TOP` did not move through any of it. They
describe the typeface and a height the case does not change.

Both headers were measured against the real thing rather than computed: 47.00px
in caps, 54.02px in lower case, each with both visible gaps landing on 10px of
ink. The 0.02 is subpixel rounding on the em-based margins.

**The auth pages carry the same dependency.** The h1's box is 36px but its ink is
not centred in it — the baseline lands 30px down, so the mark's `g` hangs 2px
*below* its own box, and `gap-4` therefore shows 14px of visible air rather than
16. In caps the ink stopped 5px *above* the box instead and the same `gap-4` read
as 21px, the tagline visibly drifting off the mark; it was cut to `gap-[9px]` for
those few hours and restored with the lower case.

That correction was spent on the gap rather than on the mark deliberately, and
the reasoning survives the revert: a negative margin on the h1 would shorten the
column, and the column is centred by `my-auto` with two optical corrections
measured against its current height. Moving what sits *between* two elements
changes nothing else; moving the mark's own box would re-open all of it.

---

## The keyboard, and why the iOS counter-measures are still portable — 11 August

The phone's search bar with a keyboard open took two days and eleven commits.
The mechanisms are documented where each fix lives, in `components/shell.tsx`
and `app/globals.css`. This entry is about the shape of the result, because a
reader meeting that file for the first time will see a stack of
platform-specific workarounds and reasonably ask whether the app has been built
for one handset.

**It has not, and the reason is a rule worth stating on its own: every
counter-measure arms off a measured symptom, never off a platform identity.**
There is no user-agent sniffing anywhere in it, and no `isIOS`.

### What is in the stack

Five things, each answering a mechanism that was measured on the device rather
than reasoned about:

1. **The document is held at zero** — a clamp on positive `window.scrollY`, plus
   `overflow: hidden` and a fixed body. iOS scrolls the document by the
   keyboard's exact height to reveal a focused field.
2. **The pin re-measures every frame while the keyboard moves**, rather than
   once per viewport event. A correction scheduled from an event is a frame
   behind an animation.
3. **The bar is lifted at `pointerdown`**, using a keyboard height remembered
   from last time. The native reveal is decided before the DOM focus event
   fires, so a lift written at focus is always one verdict late.
4. **Focus is called at `pointerup`.** iOS grants a keyboard to a completed tap,
   not to a focus arranged while the finger is still down — arrange it at
   `pointerdown` and you get focus with no keys.
5. **The tap's aftermath is swallowed.** The synthesized mouse burst is
   hit-tested at the touch point, where the bar no longer is; `preventDefault`
   on `pointerdown` kills mousedown/mouseup, and a 300ms document-level capture
   handler kills the `click`, which the spec deliberately spares.

### Why this is not an iOS build

Items 3, 4 and 5 all live behind one early return: `rememberedOverlap() > 0`.
Overlap is *measured*, as the distance between the shell's scroller and the
bottom of the visible area. On a platform that shrinks the layout viewport for
its keyboard — which is what `interactiveWidget: 'resizes-content'` asks for and
what Chromium implements — that distance is zero, nothing is ever remembered,
and none of the three ever runs. The tap takes the plain native path from end to
end.

Item 2 is a thermostat: it corrects the error it measures, and on a platform
where `fixed` behaves the error is zero and it writes nothing. Item 1's clamp
fires only on a non-zero offset, which such a platform never produces.

The pointer handlers return immediately for `pointerType === 'mouse'`, so no
desktop browser sees any of it.

⚠ **One part is not gated, and it is the one to revisit.** The `overflow:
hidden` document lock in `globals.css` is unconditional CSS, so it costs
pull-to-refresh in *any* browser tab, not only Safari's. It was left broad
deliberately while the mechanism was unproven — a
`@media (display-mode: standalone)` wrapper would narrow it, at the risk of the
query being unsupported and the fix silently doing nothing. The mechanism is now
proven, so narrowing it is live work rather than a gamble. See "Still open".

⚠ **It was narrowed once, on 11 August, and put back.** Loosening the lock to a
single pixel of range on coarse pointers was how the status-bar gesture was
given something to listen to, and it cost ordinary scrolling twice on the
handset before being reverted whole. If this is narrowed again it should be for
pull-to-refresh's sake alone, and with no detector reading the result — see
"What was tried for the status bar, and removed" below.

⚠ **And the want behind it is now served elsewhere.** Asked on 12 August what
bringing pull-to-refresh back would cost, the answer was this range and the
fault that comes with it — for a gesture iOS does not give a standalone app at
all. Freshness on return is built in `components/shell.tsx` instead, and needs
no scroll range. Read "Pull-to-refresh, and what was actually being asked for"
before narrowing anything here.

### Is there a better way?

**On today's iOS, no.** A standalone web app gets no keyboard contract from the
platform: `interactive-widget` is ignored, there is no `VirtualKeyboard` API and
no `keyboard-inset` environment variable, and the reveal decision happens in
native focus machinery before any script runs. Chromium offers all three, which
is exactly why none of this fires there. Every production web app with a
bottom-docked input on iOS carries some version of this; the difference here is
that ours is measured and documented rather than copied.

Two genuine alternatives exist, neither of them a refactor:

- **A thin native wrapper** (Capacitor and similar) receives UIKit's real
  keyboard-frame callbacks, including the animation curve, and would delete most
  of this. That is a platform decision, not a code cleanup, and it buys a great
  deal of other cost.
- **The decoy-field pattern** — the visible bar becomes a facade that never
  moves, and the real input lives permanently above the keyboard line. It would
  collapse items 3, 4 and 5 into one structure. It is the designed fallback if a
  future iOS release breaks any link in the tap chain, and is not worth churning
  a working stack for before then.

**What would change this:** iOS Safari implementing `interactive-widget` or the
VirtualKeyboard API, at which point items 1 and 3–5 all fall dormant on their
own measurements and can be deleted rather than disabled; or a decision to ship
a native wrapper; or a report of the tap chain breaking, which is the trigger for
the decoy-field rewrite.

**What is not verified:** none of this has been seen on Android or an iPad. The
gating above says they take the native path untouched, and that is a prediction.
This project's own record is that predictions about layout lose to five minutes
of looking — see the note at the end of this file, and every entry dated
10 August.

---

## Three reports from one handset — two answered, one withdrawn — 11 August

Directed, in one line: *tapping outside the keyboard should collapse it without
opening the intent sheet; tapping the status bar should return users to top;
tapping the × should clear the field.* The first and third are built and live in
comments beside their code. **The second was built, shipped, broke scrolling
twice, and was removed entirely at the client's instruction** — that account is
at the end of this entry, because what it cost is worth more than what it did.

This section is for the decisions that are not local to any one mechanism, and
for the trap that connects the first and the third.

### Dismissal swallows the tap that dismissed

One rule, applied to the whole page: **the first tap with a keyboard up puts the
keyboard away and does nothing else.** The alternative — dismiss, but let the
tap through — is precisely the reported fault, since what fills the screen
during a search is a wall of posters and every one of them opens the intent
sheet.

What it costs is a second tap on the header's two glyphs, which are the only
controls inside the page rather than in the furniture. A list of exemptions
would have bought them back and would need extending by hand for every control
added afterwards, which is how a rule stops being one. The collection bar, the
field and the × are unaffected: they are in the docks, and a tap on the keyboard
side of the argument is not a tap outside it.

### React events do not follow the DOM, and that broke the ×

Both docks are `createPortal`ed into `document.body` from inside `#scroll-root`'s
JSX. The dismissal handler was scoped to that element on the reasoning that the
docks are not in its subtree — **true of the DOM and false of React**, which
propagates a synthetic event through the component tree. So every tap on the
field and on the × arrived at the dismissal handler, which blurred the field and
swallowed the click that was meant to clear it.

That is one of the three reported faults, reproduced exactly, and caused by the
fix for another of them. It was found by driving the real app in Chromium under
touch emulation, five minutes after the change looked finished and typechecked
clean. Containment is now asked of the DOM, where the portals actually are.

**The wider point is the file's own rule, restated:** a passing build says
nothing about whether a screen works, and this is the second time this project
has had a fault that only a browser could see.

### Measured, not preferred

**Cancelling `pointerdown` spares the `click` in Chromium too**, which the
keyboard stack had only measured in WebKit. The × relies on it: the cancellation
is what stops the focus moving, and the click is what clears.

**What is not verified:** the handset mechanism behind the × — the fix removes
the movement that best explains the report, but the report was never reproduced
on hardware. Everything else is covered by browser assertions at phone, tablet
and desk widths.

### What was tried for the status bar, and removed

**Do not rebuild this without reading the whole of this subsection.** It shipped
twice and was withdrawn at the client's instruction with the gesture still never
observed working once.

iOS scroll-to-top acts on the main frame's scroll view, and this app
deliberately has none: the page scrolls in `#scroll-root` and the document is
locked flat. There is no event for the gesture — UIKit scrolls the view and
reports nothing else — so the only way to hear it is to have somewhere to be
sent *from*. The attempt gave the root one pixel of range on coarse pointers,
parked the document at the far end of it, and read an arrival at zero as the tap.

It cost ordinary scrolling twice:

1. **First version.** The guard asked whether a finger was on the glass or had
   lately left. With the keyboard down, an ordinary swipe threw the page back to
   the top; with the keyboard up it behaved, because a focused input was a
   separate guard and the only one still standing.
2. **Second version.** The guard asked whether anything had *moved* —
   `#scroll-root` reports every frame of a flick and of the momentum after it —
   and required 600ms of stillness before an arrival at zero counted. The
   reported fault was reproduced in a browser before the change and covered
   after it. **The client reported it still made things worse**, and the whole
   mechanism came out.

Two things are worth carrying forward from it.

**On iOS, a finger is not a proxy for motion.** The first version's premise is
the one this file had already written down when `USER_SCROLL_GRACE_MS` was
removed the same day — touch events are not reliably delivered while momentum is
running — and it was rebuilt three commits later, in a different function, for a
different purpose. A flick hands the page to iOS and the finger leaves; the
scroll runs for a second or more afterwards, and a parked document reaches zero
in the elastic settle at the end of it, long after any touch-based grace has
expired.

**`min-height`, not `height`, if a range is ever wanted on the root.** `height:
calc(100% + 1px)` from a stylesheet does nothing at all — the root keeps a used
height of exactly the viewport — while the identical declaration set from
JavaScript produces the range. `min-height` composes with the `height: 100%`
already there instead of arguing with it. It fails silently, which is how it
cost an hour.

**What would make this worth attempting again:** evidence that a standalone web
app on iOS receives the status-bar tap at all. That was never established, and
without it the whole design is a detector for an event that may never arrive —
which is the real reason to leave it out, ahead of any argument about guards. A
deliberate control in the app is the honest alternative: the wordmark is already
a link home, and a tap on the masthead is a gesture this app can actually
observe.

---

## Pull-to-refresh, and what was actually being asked for — 12 August

Asked in one line: *what happens if we bring back the pull to refresh?*

### Three things were blamed for costing it. One of them does

This is worth stating plainly because the record contains two wrong answers,
both of them written down confidently at the time:

- **The container scroll (`413c1d9`) — did not.** It claimed the cost and never
  charged it; the document was still scrolling, which was the bug rather than
  the price.
- **The document clamp in `components/shell.tsx` — does not.** It pushes back
  *positive* offsets only, and an overscroll past the top reads zero or
  negative, so the gesture passes through untouched.
- **The `overflow: hidden` document lock in `app/globals.css` — does.** A
  document that cannot scroll cannot overscroll, so there is nothing for the
  gesture to happen in. Unconditional CSS, so it costs pull-to-refresh in every
  browser tab.

`overscroll-behavior` is deliberately unset and is moot while the lock holds —
that argument is kept in place in `globals.css` for whenever it stops holding.

### Why it was not brought back

Two reasons, and the second is the one that settles it.

**Restoring the gesture means restoring document scroll range**, and that range
is precisely the 271px iOS invents to reveal a focused field — the whole subject
of the 11 August keyboard entry above. The lock is what makes the clamp's error
zero; without it the clamp goes back to correcting a fault instead of preventing
one. That is a real trade rather than a free win.

**And it buys nothing where the app is used.** iOS gives a standalone web app no
pull-to-refresh. The app is installed (`0f8419a`), so on the handset there is
none to restore. Building the mechanism anyway would be the status-bar tap over
again: a structure serving a gesture that never arrives.

Two costs that would *not* be paid, for the record, because they were paid
already: the header is `fixed` rather than `sticky` specifically so it holds
through the rubber-band, and `isolate` on `main` exists because pull-to-refresh
was when iOS tore down and rebuilt layers and the posters climbed over the
wordmark.

### What was built instead

**Returning to the app is what a person means by refreshing**, it is observable
installed and in a tab alike, and it needs no scroll range at all. So
`components/shell.tsx` now calls `router.refresh()` when the app comes back
after `STALE_AFTER_MS` away — 10 seconds.

The reasoning that is not local to the code:

- **The measure is how long you were gone, not how recently we last asked.** A
  banner glanced at and a call declined in one tap are not returns, and they are
  exactly the sub-threshold case — so one number both defines staleness and
  stops app-switching becoming a request per switch. A rate limit on top would
  be a second answer to a question already answered.
- **It is in the shell, so it is one listener for the whole signed-in app**, and
  the refresh re-runs layouts as well as the page — which is what brings the
  collection `counts` up to date, not only the list under them.
- **`Date.now()`, not `performance.now()`.** How much time passed in the world
  while the app was not running is a wall-clock question. Every other timing in
  that file is a frame question and correctly uses the other instrument.
- **`pageshow` alongside `visibilitychange`**, because a back gesture in a tab
  can thaw the whole frame out of the bfcache rather than merely revealing it.
  Whichever fires first clears the timestamp and the other finds nothing to do,
  so the reset is the de-duplication and there is no second timer to keep in
  step.

⚠ **This does not narrow the lock, and it is not an argument for narrowing it
later.** If pull-to-refresh is ever wanted in a tab for its own sake, the note
under "Still open" applies unchanged — and it should be narrowed with nothing
listening to the result, which is what broke scrolling twice on 11 August.

⚠ **If it is narrowed, invert the failure the old note worried about.** The
concern recorded in `globals.css` was that `@media (display-mode: standalone)`
would silently do nothing where the query is unsupported, dropping the lock
everywhere — the worst of the three outcomes. Detect standalone in script
instead (`matchMedia` plus `navigator.standalone`), stamp the root, and key the
lock off the *absence* of a proven browser tab. Then an unanswered question
keeps the lock rather than losing it.

**Not verified in a browser.** It typechecks and lints; the signed-in shell
needs an account to reach, and none was created for this. See "Verified, versus
assumed" — this file's own record is that a passing build says nothing about
whether a screen behaves.

---

## The document scrolls again, and the lock was never needed — 13 August

Asked in one line: *why can we not have the address bar recede when scrolling
down? It happens on other sites.*

### The answer, and why it is one cause and not three

Safari collapses its address bar in response to the **document** scrolling. This
app's document could not scroll: the page lived in `#scroll-root`, which was
`fixed inset-0`, behind an `overflow: hidden` lock in `app/globals.css`. So the
bar was never told anything had happened.

Measured in Chromium at phone width, document scroll range:

| as shipped | the lock lifted, nothing else | the lock lifted **and** `#scroll-root` un-pinned |
|---|---|---|
| 0px | 0px | 1229px |

⚠ **The middle column is the one worth keeping.** Lifting the lock on its own
changes nothing, because the content was in a box stapled to the glass and the
document had no height to scroll whether or not it was permitted to. Anyone who
tries the one-line CSS fix will see no difference and conclude the diagnosis was
wrong. Scroll ownership had to move with it.

### What made it safe, and the method lesson underneath

The lock existed for a real fault, measured on 11 August: tapping the search
field made iOS scroll the document by the keyboard's height — 271px in a tab,
333 standalone — to reveal the focused field, dragging every `position: fixed`
element in the app up with it, the header included.

**But the lock and the real fix were built in the same week, and the lock was
never taken off to see whether the fix stood on its own.** It does. The dock
lifts clear of the keyboard at `pointerdown` now, before iOS decides whether it
needs to reveal anything, so there is nothing left to reveal.

Measured on the handset through a temporary probe, with the document unlocked
and the clamp stood down — six keyboard openings, three installed and three in a
Safari tab, nothing left to put the document back: **`scrollY` peaked at 0 every
time.** In the tab, the address bar receded on scroll and stopped receding again
the moment the lock went back on.

> **A defence built beside a cure hides whether the cure works.** The two of them
> together look exactly like the cure alone, and the guard gets kept forever on
> the strength of the bug never recurring. When a guard and a fix land together,
> take the guard off once and look.

That is the transferable part. The CSS is incidental.

### The clamp could never have been narrowed

It reset any positive `window.scrollY` from a scroll listener, every frame for
the length of a keyboard animation. Measured in Chromium against one deliberate
400px scroll of the unlocked document, **it fired 18 times and won every time.**
It could not tell iOS's scrolling from a person's, because it never asked — so
every surviving version of it is a version that fights the user. Deleting was
the only move available, which is exactly why the handset measurement had to
come first.

### What it cost to build, against what it looked like it would cost

The part that looked riskiest needed nothing. **The masthead and the search dock
are `position: fixed`, which is viewport-relative, so document scrolling leaves
them alone** — measured before the change, unchanged after it.

Four things did need moving, and all four were mechanical:

- The bar's recede logic now watches the window rather than `#scroll-root`. Its
  old note leaned on "the only scrolls this element receives are ones a person
  made", which is no longer true — the settle window written for the 271px case
  is what carries it instead.
- `useKeyboardPin`'s `floor()` measures `--keyboard-overlap` against a new
  zero-height fixed twin on the viewport's bottom edge. It used to read
  `#scroll-root`'s own bottom, which meant the viewport's bottom **only because
  that element was pinned**; in the flow it is the bottom of the content, and the
  overlap would have come out as most of the page.
- `scrollSearchRootToTop` in `search-provider.tsx` scrolls the window. Silent
  when wrong: the wall would simply have stayed where it was on the next
  keystroke.
- The per-route scroll reset was **deleted rather than repointed**, which is the
  one judgement call here. It existed only because a nested scroller broke Next's
  own handling on 10 August. Repointing it at `window` would have been strictly
  worse than nothing: Next restores the previous offset on Back, and a reset
  keyed on `pathname` cannot tell a Back from a tap, so it would have forced the
  top on both. The restoration that the old note recorded as already lost is not
  lost any more.

`floor()` is still needed, which reads as though it should not be. What used to
supply that distance was the range iOS *invented* to reveal a focused field, and
iOS no longer invents it; a flowing document's real range is content minus layout
viewport, and iOS does not shrink the layout viewport for a keyboard either way.

### What came back with it

The address bar recedes in a tab. Pull-to-refresh works in a tab again — the
`overscroll-behavior` note in `globals.css` stops being moot after eight days.
Neither exists installed, where the app is actually used, so this is for arrival
before install. Refresh-on-return (`ef1a909`) is unaffected and remains the
freshness mechanism in both modes.

**Verified in a browser**: 34 assertions across phone, tablet and desk widths —
scroll range, the lock's absence, the wall tracking the scroll exactly, the
masthead holding its place, the bar receding and returning, routes starting at
their top, the search wall resetting on a keystroke, and tap-to-dismiss still
blurring without opening the intent sheet.

⚠ **Not verified on the handset after the change.** The measurement that
authorised it was taken there; the result of it has not been looked at yet.

⚠ **Playwright screenshots under `isMobile: true` capture from the layout
viewport origin and ignore document scroll.** A screenshot showed the wall
standing still while `scrollY` read 400; the bounding rect showed it had moved
the full 400. Measure rects, not screenshots, when the question is whether
something moved — this nearly produced a wrong conclusion in the other direction.

---

## The masthead takes the typing, and three mechanisms retire — 14–15 August

Directed across one evening in several passes: the house glyph becomes a search
glyph, search and profile swap sides, the field leaves the bottom bar and opens
across the top of the masthead, a back arrow sits beside it, and the mark goes
back to Ojuju — capitalised, and smaller. `db0a207` through `0f52dba`.

The mechanisms are documented where each one lives; `components/shell.tsx` and
`app/globals.css` carry the measurements and the warnings. This entry is for what
is not local to any of them.

### Moving the typing to the top is the fix the whole keyboard stack stood in for

The field went into the phone's bottom bar on 9 August because the collection
line already ran to within about 15px of a 375px screen and there was no width
left for a field beside it. The bar then held one of two things with a chevron
swapping them, and the rest of the shell had to ask which. **All of that is
gone** — the bar holds one thing, `barMode` went with the field, and the
argument the mode existed to settle stopped existing rather than being won.

The larger cost it removed is the keyboard. A field at the bottom of a phone is a
field the keyboard covers, and everything built for it between 11 and 14 August
was an attempt to answer one question: *how tall is a keyboard that has not
appeared yet.* It is not answerable — iOS decides the reveal before any script
runs — so the app estimated it from last time's measurement, kept the maximum
ever seen, and painted black under the lifted bar to hide the error.

> A number that cannot be known in time is not a number to estimate. It is a sign
> that something is in the wrong place.

Retired by name, and all three are recorded at their sites rather than here:
`lastKeyboardOverlap` and `rememberedOverlap()`, and `groundFor` for the second
and final time — its own note now says do not build a third one. `--keyboard-overlap`
survives, because `floor()` measures it *while* the keyboard is up, needs no
prediction, and is what keeps the last row of a long list reachable.

**This is `CLAUDE.md`'s rule in its cleanest instance so far.** Remove the
mechanism, then the condition it fails under, and only then correct it. Three
mechanisms came out and the symptom left with them, on every device at once.

### One fault, three times: a control that removes its own surface

The × on 11 August, the search button that is unmounted between its own
`pointerdown` and `pointerup`, and the back arrow that blurs the field it lives
in — the same fault arrived at from three directions, and each was found
separately.

> A control that removes its own surface has to be listened to from something
> that outlives the gesture, and has to hold focus until its click has landed.

The header outlives both halves of the masthead, so the gesture is heard there.
The arrow prevents its own blur on both pointers. Neither is a workaround for a
platform; both are consequences of asking an element to survive its own
disappearance.

### The mark: Ojuju again, capitalised, and the size is a knob now

Space Grotesk set the mark from 9 August until this session, on the instruction
that it did not work for it. Ojuju is back, setting `Again` at 1.75rem, down from
2.25. The mark also read `Need` for a few hours (`ece1113`) before being reverted
— recorded for the same reason the case changes of 10 August are: **the round
trip is the useful part**, and this one has now happened three times.

The part that matters is not the face. Every previous change of face, case or
size needed hand edits in three places, because the trims were measurements taken
at 36px of a specific face setting a specific word, and the masthead's height and
`main`'s top padding were px and rem derived from them. They read
`--wordmark-ink` (0.92) and `--wordmark-slack` (−0.135) now, both expressed
against `--text-wordmark`, so the size is one line and the numbers cannot fall
out of step with it.

**`docs/plan.md` carried a table called *Numbers that must move together*, and
most of it described exactly this coupling. It is retired with the coupling**,
which is the honest way for that table to end — not by being maintained, but by
the mechanism it warned about being removed.

⚠ **The two ratios are properties of the face *and* the word.** Ojuju hangs
`Again`'s `g` below its own box, which is why the slack is negative where Space
Grotesk setting `need` was positive. A new face or a new word re-opens both.

### A third colour, added and taken back the same evening

`--color-caret: #3fbfae` gave the search chevron a turquoise blink, argued at the
token: a caret reports a *system state* — the app is listening — which is neither
of the two claims the palette already makes, and platforms tint their own carets
for that reason. Measured 9.27:1 on the true-black ground, and deliberately cool
against a palette that is warm throughout.

**Reverted within the hour, on instruction.** The chevron is `text-muted` again
and the token stays defined and unused, the way `--font-ojuju` outlived its own
replacement and was there when it was wanted back. What the revert restores is
§11's position that this palette carries two meaningful colours — amber for
overlap, lacquer red for *you are here* — and the point that decided it: on a
matte black screen the blink was already the only thing moving.

### The caret came back, turned the right way round

Deleted on 10 August for blinking while the field was *unfocused* — making its
claim at the one moment it was false, and shifting the placeholder 7px when it
unmounted. It is back as a state on a glyph that is drawn anyway, keyed to focus,
so nothing mounts, unmounts or moves. Only the midpoint keyframe is declared, so
the reduced-motion block leaves the chevron visible rather than hidden.

The entry recording its deletion stands. The argument against the old one was
correct and is not the argument against this one.

### Focus decides the keyboard; the query decides the bar

Typing `alien` and then tapping the page used to take the bar away and leave a
wall of matches with nothing on screen saying what was matched, and no way to
amend the query except opening search again to find the word still in it. The bar
now survives the keyboard, and both ways out already pass through an empty field,
so nothing else had to learn the rule.

⚠ **A tap with nothing to dismiss is an ordinary tap.** The first version of that
swallowed unconditionally whenever the bar was up, which ate a tap aimed at a
poster — a dropped tap, which is the exact failure the whole dismissal design is
about, arrived at from the other side. Suppression has to be earned by something
actually being put away.

### And then the masthead recedes too — 15 August

Directed, and it reverses a position this file's own code held in a comment: the
header stayed put while the bar at the foot slid, *because it is the only thing
on screen that says where you are, and a mark that comes and goes reads as a
rendering fault rather than as a gesture*.

**That reasoning was right, and it is now carried by two rules instead of by an
exemption.** The masthead does not recede while it is holding the search field —
sliding it away mid-search would take the query, the caret and the only way out
with it — and leaving search reveals both bars, so the mark cannot return to a
header that is about to slide away on the same frame.

⚠ **The first of those two rules is narrower since 17 August: it is the caret,
not the row.** Directed — search something, start scrolling, and the bar holding
the query should recede the way the collections do. The exemption was written
against `searchAtTop`, which is the row being *in* the masthead, and that row
deliberately outlives the keyboard (`onDockBlur` keeps it up over a non-empty
query) — so it pinned the masthead for the whole time a wall of results was being
read, which is exactly when the screen is wanted back. It reads `searchFocused`
now. The clause above says what it was always protecting: *the query, the caret
and the only way out* — a caret is focus, and a query on screen with no caret in
it is a label rather than an input. The second rule is untouched and is what
keeps the mark from returning into a header that is about to leave.

On touch this is a smaller change than it sounds, because focused-and-scrolling
is very nearly unrepresentable: since 14 August a drag aimed at the page blurs
the field before the scroll gets going. So the first drag folds the keyboard, the
500ms settle window swallows the scroll that folding produces, and both surfaces
leave together on the same gesture — which is the point of one signal.

⚠ **The recede costs more at the top than at the foot, and only since 14 August.**
With the house glyph gone the wordmark is the only route to `/` on a phone, and
the search glyph is the only route to the field, so both leave with the masthead.
The 32px floor and the return on the first upward movement are what make that
affordable; they are the numbers to reach for if it ever reads as a trap rather
than a gesture.

**One signal, two surfaces.** The existing scroll listener already computes
`receded`, stamped with the route it was hidden on, and the masthead derives from
it. A second listener measuring the same scroll would be a second threshold to
keep in step, and the two would disagree on the frame a flick reverses.

The one number that is not shared: the masthead moves by its own height **plus
the `0.5rem` of its shadow**, which paints ground below the element so posters
pass under the mark. Moving it by 100% alone leaves that strip behind, clipping
the top of the wall against a ground it happens to match — invisible in a
screenshot and wrong.

⚠ **Not verified anywhere.** Typecheck, lint and a production build pass, and by
this file's own standard that says nothing about whether a screen behaves. This
one is a gesture, so it wants a phone.

### What is verified, and what is not

Driven against the running app at 390×780 and at desk width: 30 assertions for
`ea1f914`, 35 for `e6d972b`, 42 plus 8 for `0f52dba`. Typecheck, lint and a
production build are clean throughout.

The handset was not silent this week — three reports came off it on 13 and
14 August (a black sheet over the posters, flicker while scrolling with the
keyboard up, and a slither of a gap under the bar), and all three are answered
above. ⚠ **What has not been looked at on hardware is the result**: the masthead
field itself, on the device that produced the reports.

---

## What Again is for, and the map it is not — 15 August

Asked directly, after a read-through of every document in the project: what is
the long-term aim even if we start with movies, and is the *living map of things
you could do* in the expansion reference really a different product, or a sharp
distinction drawn where there is none?

### The aim is the convergence graph

Again is a private record of what someone would try and what they would return
to, held by people who track each other, where the event that matters is two of
them independently wanting the same thing. It improves as the graph gets denser
and degrades as it gets wider — §13's two hundred people in twelve clusters
against a million spread evenly. The asset is `entries` × `tracks` × `items` in
our own Postgres, which *Third-party dependencies* below already identifies as
the one thing that cannot be replaced.

Films are the first kind, not the shape. §2 has always allowed a second one.

### The living map is not a different aim — it is the same mechanism, second trigger

This was first framed as two different products, and that was too strong. Both
are the same proposition: an intent you have already expressed becomes
actionable. Convergence is one trigger — someone you track wants it too. A
screening on Saturday is another — the world makes it possible. Neither is
discovery, and the expansion reference was right to say the personal layer should
*"prefer explicit intent over inferred taste"*.

**What separates them is truth decay, and that is the whole of it.** A
convergence is computed from rows we own and cannot be wrong. An occurrence is a
claim about the world that rots — the screening moves, the price changes, it
sells out. It would be the first thing in the product capable of lying to
someone, in a product whose entire proposition is that what it says is true. That
is a reason to sequence it late and build it with provenance, not a reason to
call it a different company.

### The line, stated better than §2 states it

§2 bans *"availability, acquisition or where to get it"*, and every example on
its list — streaming lookup, library availability, retailer links, price
tracking, ownership inventory — is about acquiring a thing to consume alone. A
screening is not that. It is an occasion, at a time and a place, that two people
can attend together, which is the thing this app says it exists to produce.

> **Acquisition makes the app a remote control. Occasion makes it a diary.**

That is the line to hold, and it is sharper than "availability" because it
explains *why* a streaming deep-link is wrong where "the Prince Charles has it on
Saturday" might not be.

Even under it, **no booking link.** The moment there is a checkout the incentive
to become a listings product starts pulling on everything else in the design.

### Decided: not now, and the order matters more than the rule

If occurrences are ever built, they fire only against a want already held, shared
with someone who already tracks you back — no browse, no availability filter, no
surface a stranger can use. And not before Phase 4, because the answer to *the
app feels inert* is other people, and other people do not exist in it yet.

### The passivity question, which is the same question

Asked in the same session: with no browse and no discovery, does the app reduce
to typing in things you happened to walk past? Three things are true.

- **It already isn't.** The poster wall answered exactly this on 9 August — *"the
  thing it was worst at was the moment before capture"* — and it carries three
  tests it must keep passing: not availability, not ranked or personalised, not a
  feed.
- **The designed supply is other people.** The README's founding line is that a
  go-back-tos list *is* the recommendation, the way a bookshelf tells you more
  than a list someone writes for you. Phase 2 gives `/u/[handle]` and copying with
  `source='copy'`. The proof that browsing a friend's shelf is designed behaviour
  rather than tolerated is §6's suppression rule: nobody writes a suppression rule
  for an activity they do not expect people to perform.
- **None of it is built.** Phases 2 to 4 are the supply, and §13 puts 100% of the
  value there.

> The app is not too passive by design. It is passive because the half that
> supplies it has not been built yet.

### The database is not being prepared for this, and the reasoning is already in this file

*What not to build* argues it under third-party dependencies: the insurance is
the schema, not the code, and a provider abstraction is speculative generality.
Three things make the wait safe:

- **An `occurrences` table is additive.** New table, foreign key to `items`;
  `entries`, `tracks` and `notifications` do not change shape. Building it later
  costs one migration and touches nothing that exists.
- **Identity is the one expensive retrofit** — what counts as the same thing when
  a film arrives from TMDB and from a cinema's feed. `items.external_source`
  exists for it and is deliberately not in the unique constraint.
- **And even that is cheap while there is one source**, because duplicates cannot
  exist. It becomes expensive on the day a second source lands.

**So the preparation is due when the second source arrives, and not before.** The
trigger belongs in the table at the end of *When to revisit*, where the provider
migration row already says to settle the constraint and deduplication together.

### The shape that was sketched, kept in one paragraph

`docs/product-reference_for expansion.md` held this and has been removed, since
everything else in it either duplicated this file or was overtaken. Worth
keeping in case the trigger ever fires: the category-neutral concepts were a
**thing** (film, exhibition, concert), an **occurrence** (a specific screening or
performance), a **place**, a **source**, an **availability** state backed by
evidence, the person's **context** (location, travel tolerance, budget,
accessibility — all optional and user-controlled), their **intent**, and
**provenance** on every field: source, timestamp, extraction confidence, last
verification. Category specifics belong in adapters rather than in the core, and
the product must never imply complete coverage — *"12 opportunities found from
the sources currently covered in your area"*, never *all* of them.

That paragraph is the whole of what a future version needs to start from. The
529 lines around it were a plan for building it now, which is the part that was
declined.

**What would change all of this:** a dozen real people using the app with their
shelves visible to each other, and it still feeling like there is nothing to open
it for. That is evidence. A roadmap wanting it is not.

---

## The caption becomes the masthead's other half — 16 August

Fifteen passes over one screen, `f5cb915` through `d1e8117`, directed throughout.
`main` deploys on every push, so each change was on the handset within a minute of
landing and most of what follows was **reported rather than reasoned** — eight
reports came off the device between them, and two of those contradicted notes this
file had already written.

The mechanisms live where they run: `components/cinema-wall.tsx` holds the caption
and its layers, `app/globals.css` the tokens and the two keyframe sets,
`components/shell.tsx` the state the caption reads. This entry is for what is not
local to any of them.

### One slot occupied at two moments

The mark and the wall's caption are the same corner of the screen at different
times — the masthead slides off on a downward scroll and the caption pins in the
strip it vacates. That was already the arrangement on 15 August, and the two were
*matched* rather than shared: two elements that happened to agree.

They now share three terms, none of which is a number written at either site:
`masthead-box` (the air above and below, the notch cleared), the row at
`h-[var(--wordmark-ink)]` with its contents centred, and `--type-indent` for the
horizontal fraction. A change of size, face or gap moves both surfaces or neither.

**The failure that argues for sharing is not a misalignment, it is a movement.**
Two placements that agree today show up, when one of them drifts, as the top-left
corner of the app stepping sideways or up during a scroll — a movement with no
cause a person can name, which is the worst kind. Alignment is the visible half;
the invisible half is that there is nothing left to keep in step.

⚠ **The letters still start 1px apart and that is deliberate.** Both text origins
land at 26px; Ojuju's `A` carries a side bearing at 28px that 13px capitals do
not. Correcting it needs a per-face, per-*glyph* nudge, and the caption is two
words with no one glyph to correct against. Where the text is set *from* is the
stable thing to align.

### Covering is not hiding

⚠ Reported: a pull-down at the top of the wall showed the caption. It was hidden
by sitting underneath the masthead — `z-10` against `z-20`, opaque, one layer
above — and an overscroll rubber-bands the document while a `fixed` header stays
with the viewport, so the two came apart and the label slid out from under the
mark on the opening screen.

> **Covering is not hiding.** It holds only while the two elements move together,
> and overscroll is exactly the case where the platform moves them apart.

So the caption stopped asking to be covered and reads the mark's state instead:
`data-masthead` on `#scroll-root`, which the shell already computes for the
masthead's own recede. An attribute rather than context, because one boolean is
the whole of what has to travel — no provider, no subscription, and `main` is a
sibling of the header, so it arrives at the caption in CSS alone. The fade is the
masthead's own 300ms, so the two are one movement rather than two.

⚠ **And it settled a claim two notes had been making since 15 August that neither
had checked.** Both said the label was hidden at rest. It was not: the negative
margin cancelled `env(safe-area-inset-top)` and nothing else, which left the box
in flow *below* a masthead that had already cleared the notch — so the label hung
under the mark from the first paint, and `sticky` had nothing to pin until you had
scrolled past it. The pull is `--masthead-clearance` now, the whole of what the
masthead claims, which lands the band exactly on the masthead's painted band.

### One token retires a row of the coupling table

Asked in the same breath: why does the mark's banner run 8px deeper than the
caption's? The boxes were already identical. The difference is the `box-shadow`
the header paints below itself, which fills the gap it keeps from the wall so that
posters do not show through it.

Deleting that gap is the thing not to do — it has been tried, and collapsing the
space under the mark made the `g`'s descender look met by the posters. So the band
with no hem grows one instead, as a margin on its row, and the two banners paint
to one line.

That number is `--masthead-hem`, and `--masthead-clearance` is the box and the hem
together. It had been `0.5rem` written out in the shadow, in `main`'s top padding
and in the recede's extra travel, with a row in `docs/plan.md` asking whoever
changed one to remember the rest. **Four sites read one token now, and that row is
retired** — the second coupling this month to leave that table by being removed
rather than by being maintained.

### A boundary cannot report a jump

⚠ Reported from the handset: in *Coming soon*, tapping the status bar to fly to
the top left the caption reading *Coming soon* over the first row of what is on
now, and only scrolling back down through the crossing put it right.

The observer watched the ten-pixel seam between the two grids, and the seam's two
states are one state to an observer — out of view above and out of view below are
both `isIntersecting: false`. Going from one to the other without stopping in
between is not a change, so nothing calls back. The label was never stale; it was
never told.

> **An observer holds a state, and can only report the states its subject can
> distinguish.** If a subject can be on both sides of the root between two frames,
> the subject is wrong — no amount of correcting the callback reaches it.

So the subject is a **half** rather than the boundary. *In cinemas* is precisely
"some of what is on now is still below the caption", which is a state the two
answers differ on, so every crossing raises a callback whatever route it takes, at
any speed, including none. The swap point does not move — the grid's bottom edge
*is* the seam's top edge — and the comparison against `rootBounds.top` that
15 August added disappears with it, since it only existed because the boolean
could not tell above from below.

**That is two bugs in one observer in two days, and they are the same bug.** The
first tested a position at the only moment the position was never right; this one
watched a subject that could not tell two situations apart. Both read as the
feature being absent rather than broken, which is why both took a report from a
person holding a phone.

⚠ **Still an observer rather than a scroll listener, and now for a better reason
than cheapness.** iOS withholds events during momentum — this shell has been
bitten by that once already, where `USER_SCROLL_GRACE_MS` used to be — while
intersections are recomputed from layout on every rendering opportunity, delivered
events or not. A scroll listener would answer the jump correctly and reopen that.

### `svh` is not the screen

⚠ Reported: installed, tapping *Go-back-tos*, *Fixtures* or *Archive* moved the
collection bar up the screen and left it there. *Wants* — nineteen entries — and
the home wall did not. The three are the same component with the same props; the
only difference between them is whether the content overflows.

Measured off three screenshots, 1170×2532 on a 390×844 handset: the bar's labels
sit 35.0 CSS px above the foot of the screen on the wall and on Wants, and 81.7 on
Go-back-tos. The difference is 47.0 exactly, which is that device's
`env(safe-area-inset-top)` — confirmed in the same images by the mark, which lands
at the inset plus `--masthead-gap`.

> **`viewport-fit=cover` lets the page paint into the status-bar band. `100svh`
> does not grow to include it.** So a page whose content does not overflow ends
> one inset above the foot of the glass, and anything measured against the page
> box lands on that line rather than on the screen's.

`min-h-[calc(100svh_+_env(safe-area-inset-top))]` states the thing that is true —
the page box is the screen — and is a no-op everywhere else, since the inset reads
0 in a Safari tab, on Android and on the desk. `/profile` gains the same 47px,
which is the identical fault seen from the other end: that page is composed around
its own bottom-left corner and was landing above the foot.

⚠ **The number was already written in the file from another day's measuring, and
nobody had subtracted it.** The note where `lastKeyboardOverlap` used to be calls
this "an 797px handset"; 844 − 797 is the 47. A measurement recorded during one
investigation is evidence in the next one only if somebody goes back and reads it.

### The tail is a stroke, not mass

⚠ Reported: the caption sits on the mark's line and looks low against it. It was
centred honestly, and that was the fault.

`--wordmark-ink` is cap-to-tail, so the centre of that box is not the centre
anybody sees — a reader takes a word between its cap line and its baseline and
discounts the `g`'s tail, which is a stroke rather than mass. The two centres are
exactly half a descender apart, and the caption was sitting on the lower one.

`--wordmark-drop` (0.21 of the type size, the same 0.21 the ink's own note has
recorded since the face changed back) is now named, because something subtracts
it: the caption's row takes it as padding at the foot, leaving exactly the band
the eye reads to centre in. **A subtraction rather than a nudge** — no lift is
written anywhere, nothing is tuned against a screenshot, and a change of size or
face moves it through the same tokens that move everything else about the mark.

Measured at 390px with both real faces: the capitals now centre 0.27px from the
mark's cap-to-baseline centre, where they were 2.7px below it.

### The glass is three layers, and two of them had to be measured first

Directed: the band's blur should double from its foot to its head, linearly; and
the ground should be darker at the top, where the clock and the battery sit, and
should accentuate the row the caption is in.

**`backdrop-filter` is one strength over a whole element**, so a ramp is two blurs
stacked with the upper one masked to fade in toward the top. Three things had to
be measured before any of it could be written, and each changed the answer:

- ⚠ **They must be siblings, not nested.** An element carrying a
  `backdrop-filter` *is* a backdrop root, so a child of it has no page left to
  blur — stacked inside, the second layer changed a hard edge's softening by
  0.0px. That is also why the `h2` gives up the blur it used to carry.
- ⚠ **Blurs compose in quadrature, so the upper layer is not the target.** To land
  on `2b` over a base of `b` it must be `b√3` — 41.57 against 24, not 48. The two
  stacked read 125.0 in edge widths where a flat `blur(48)` reads 124.0; a top
  layer of 48 overshoots to 134.
- ⚠ **The reveal cannot sit on the box that holds them.** An element below full
  opacity forms a backdrop root too, so a fade on the parent leaves both layers
  blurring nothing for the length of it — 0.8px of softening under a parent at
  0.5, against 40.5 for the same blur on the element carrying the opacity. The
  three layers fade together and separately, off one string.

**The ground then had to stop sharing the blur's mask.** The blur is depth and
should ramp the whole way up the band; the ground is emphasis, and its job is to
make the label read as a label. One mask forces one curve on both, and the curve
that suits either is wrong for the other. So the tint became a third layer above
both blurs, where nothing filters it.

⚠ **Its first shape was flat through the row, and that was rejected on sight.**
Holding full strength down to where the letters end puts the flat region's edge at
84% of the band's height, leaving 16px for the fall.

> A band that is flat for most of its height is not a gradient. It is a bar with a
> soft lip.

`--band-solid` is `env(safe-area-inset-top)` instead — the one strip of the band
the page can name, and the one with a reason to be solid, since iOS draws the
clock, the signal and the battery over it and gives the page no say in how. Below
that line the ground eases away through everything else, the caption's row
included, which gives the ramp fifty pixels to happen in rather than sixteen. 88%
at the top against the 60% glass at the foot. Where there is no inset — a tab,
Android, the desk — the flat region is zero and it is a plain linear fade, which
is what it should be when there is no status bar to sit under.

### The blink had never fired for one of the two words

⚠ Reported: *Coming soon* blinks when it appears and *In cinemas* does not.

The animation was applied outright and replayed by the span remounting on a
changed key, so it fired on a **change of word** — which is the only way *Coming
soon* ever arrives. *In cinemas* is usually mounted already when the mark recedes;
it has been sitting behind it since the page loaded, so the band appeared and the
word just sat there. It had fired once on load, behind an opaque masthead, and
never again.

An animation starts when `animation-name` goes from none to a name, which is
exactly the moment `data-masthead` flips — so the animation hangs on the state
now, and the key stays for a crossing that happens while the band is already up.
**Two triggers, two different events, neither doing the other's job.** Applied
unconditionally it could never have done the first: the property is already set,
and a value that does not change restarts nothing.

**Then the blink was moved onto something big enough to see.** Measured off a
rendered band, the label's ink is **2.57% of the band's area**, so a full swing on
it moves as much light as a 2.6% change across the whole bar — against a wall of
artwork in motion, which is the only time it ever fires.

> Peripheral vision reads luminance transients over **area**, and is nearly blind
> to colour and to detail. A word is not a cue; neither is a colour.

So a sheet of plain ground sits above the glass and below the label, steps solid
on the first frame, holds 80ms and eases out — a step because what gets detected
is the rate of change, and an eased onset of the same depth reads as half of one.

⚠ **And that flash changed nothing anybody noticed, which is the arithmetic that
should have been done before it was built.** A black flash can only subtract the
light the artwork is still contributing, and at the caption's row the ground has
already taken 76–88% of it: in perceptual terms 12 → 0 over a dark poster (5% of
the scale), 36 → 0 over a middling one (14%), 59 → 0 over a bright one (23%). A
light flash is uniform and no stronger — 8, 7 and 6% — because there is only so
far a black app can move without reading as a flashbang.

> **Movement has no such ceiling and no dependence on what is behind it.**

So the word rises into place: `0.8em` over the first 126ms, measured at 10.4px and
about 80px a second — a roll rather than a jump. The blink follows it unchanged
once the word has landed, so it is still one gesture and still one event. The
band's flash stays, because it is worth most over bright artwork, which is exactly
where the caption is hardest to read, and costs nothing where it is worth least.

**The word stopped fading out in the same pass.** ⚠ Reported: flying to the top
from *Coming soon* showed a glimpse of a red *In cinemas* on the way — the glass
fading over 300ms while the observer, watching the wall come back up, flipped the
word underneath it. A label announcing itself on its way out, during transit
nobody reads. The glass keeps its fade, because a band that vanishes on the frame
the mark starts sliding back leaves the top strip bare; the word does not need
one, since **its entrance is the blink and its exit should be the moment it stops
being true.**

### Four pixels, and a corner taken back

`--masthead-gap` is 8px, from 10. It is the only air in a banner — the rest is the
mark's own ink and the notch — so it is the only honest place to take height from,
and `masthead-box` is worn by both surfaces, so both lose the same 4px and the
wall comes up by it.

⚠ **The token's note had argued for 10 over 8, and that argument had expired
without anyone noticing.** It was measured under Space Grotesk, before the trims
were re-measured for Ojuju on 15 August. Re-measured with the face that ships, at
8px the ink clears by 7.25 above and 8.5 below. **A measurement written as a rule
outlives the thing it measured**, which is the same failure as the two notes that
claimed the caption was hidden.

Both banners took the posters' own corner on their lower edge, by
`--radius-artwork` rather than by two `rounded`s that agree because Tailwind's
default is the same number twice. It lasted one commit and was reverted on the
caption, directed; the mark keeps it. ⚠ **The curve only ever read on one of
them** — the caption's band is the width of the wall, so its corners land over the
first and last column of posters, while the mark's runs to the screen's edges
where there is only ground behind it and a curve cut into black shows nothing.

### The one marginal thing in the band

Directed: *Coming soon* is too muted. `--color-muted` is `--color-text` at 60% and
it is tuned for text **on ground**; this text is on glass over artwork that is
moving, so 40% of every letterform was the wall showing through it.

Measured at the caption's row with the wall through the letters: 6.07:1 over a
dark poster, 5.61 over a middling one, and **4.49 over a bright one** — which is
the 4.5:1 floor for text this size. So it was not merely quiet, it was sitting on
the line. `text-text/80` reads 10.43 / 8.91 / 6.63 and lets half as much wall
through.

It stays brighter than the live red, which measures 5.79:1 on the same band, as
the muted value already did. **The red has never carried by being lighter** — it
carries by being the only colour on the screen and by naming the half that is on.

> A token tuned against one background is not a value, it is a measurement of that
> background. The first translucent surface in the app is where every one of them
> gets re-opened.

### What is verified, and what is not

Every change was measured in a browser at 390px before it shipped, several against
a simulated 47px notch, and the observer rewrite was run against both mechanisms
on one page. Typecheck, lint and a production build are clean.

**The handset carried this session rather than checking it afterwards**, which is
new: eight of the findings above are reports, and each fix was back on the device
minutes later.

⚠ **What has not been looked at:** the last change — the 80% ink — has not been
reported back on. The band's ground ramp has been measured only against a
simulated inset, never against a real notch. And nothing today was seen above the
`rail` breakpoint, where the caption is an ordinary sticky heading and every
`data-masthead` variant is bypassed by a `rail:` — reasoned, and not looked at.

---

## D1 is answered `no`, and the caption is switched off rather than cut — 16 August

**Again does not become cinema-aware now.** That is the gate `docs/plan.md` names
as D1, and it is answered the same evening the caption was finished — which is
the awkward order, and the right one.

**It is a "not yet" rather than a "no".** Directed: showtimes come back as a
**paid feature**. So D2 (which provider) and D3 (how the app learns where someone
is) are not answered, they are parked, and the prices evaluated on 15 August stand
as the starting point for whenever that is.

### Why no, on the evidence already in this file

- **It fails §13's test outright**, and it is the only thing on the roadmap that
  does. Cinema listings make the app more useful to a stranger with no friends on
  it.
- **It would be the first thing in the product that decays.** A convergence is
  computed from rows we own and cannot be wrong; a showtime is true for a day.
  *The line, stated better than §2 states it* permits an occasion, and permitting
  is not the same as being ready to be wrong in public.
- **It needs a location, which needs `/settings`, which does not exist.** All the
  app has is a country from an IP, and cinemas are local. That is the cost this
  class of integration gets wrong, not the data.
- **€149/mo per market, or £49 UK-only, for one user with nobody to converge
  with.** Phases 2 to 4 are unbuilt, and §13 puts 100% of the value there.

The recommendation recorded in `docs/plan.md` on 15 August — Stage 0 now,
showtimes after the product exists — is therefore the position again, and the ⚠
noting that it had been argued and not taken can rest.

### Stage 0 is resolved as **no label**

`docs/plan.md` offered three: *New releases*, *Just released*, or no label.
Directed: no label. The wall carries no caption at all, which is what it was until
14 August.

**That is the cheapest correct answer and it is not a retreat.** The label created
the fault — until it existed the wall made no checkable claim and nobody could
catch it being wrong. Take the words away and the posters are a capture prompt
again. **A prompt cannot be wrong; a statement about the world can.**

⚠ **It also saves the second red, which relabelling would have quietly spent.**
`--color-live` was argued as marking *the half that is on now* — a fact about
screens. Under *New releases* it would have been colouring a release date, which
is not a fact worth a colour under §11's one-signal-one-fact rule, and the token
would have been re-purposed rather than kept. Switched off, its argument survives
intact: when showtimes are bought, *In cinemas* is true again and the red means
what it always meant.

### Switched off as live code, not commented out

Directed: keep everything, comment it out. Offered two spellings and the second
was taken —

- **(a) Comment the JSX and CSS out in place.** Easy to read, and it rots:
  commented code is not type-checked, not linted, and drifts with everything
  around it until the day somebody uncomments it and it does not work.
- **(b) Keep it as live code and stop rendering it.** One annotated constant,
  `CAPTION`, in `components/cinema-wall.tsx`. The band, the observer, the haptic
  and the blink all hang off it; the two halves do not, and still ship.

> **A feature that is waiting should stay in the checker's sight. A feature that
> is commented out is a promise nobody is keeping.**

⚠ **`const CAPTION: boolean = false`, and the annotation is load-bearing.** As a
bare literal the compiler narrows it and treats everything behind it as
unreachable, which is the same rot in a different spelling. Annotated, both
branches stay live: the JSX is type-checked, the classes are still scanned by
Tailwind, and turning it back on is that one word.

**What that costs, stated so nobody is surprised by it:** the band's rules are
still emitted into the stylesheet, unused, and `data-masthead` is still written
onto `#scroll-root` with nothing reading it. Both are the price of the restoration
being one line, and both are small.

**This project already keeps things this way and has been repaid for it.**
`--color-caret` was measured, argued, reverted within the hour and left defined;
`--font-ojuju` outlived its own replacement and was wanted back four days later.
The tokens the caption owns — `--color-live`, `--wordmark-drop`, `--blur-band`,
`--animate-caption`, `--animate-band` — stay defined for the same reason.

### The heading went with the words

⚠ `/`'s `sr-only` `<h1>` read *In cinemas and coming soon*. Removing a sentence
from the screen while leaving it in the accessibility tree is **hiding the claim
rather than dropping it**, and it is the same claim TMDB cannot support. It reads
*New releases and coming soon* now: the first half is TMDB's recent-release window
for the viewer's country and the second is dated but unreleased, both of which are
release-date facts.

That the visible surface says nothing and the heading says something is not an
inconsistency. A page needs one meaningful heading, and the wall needs no caption
to be a wall.

**Two halves are kept**, directed. They exist because a label had to change
between them, so with no label they are ordering rather than structure — and they
are the structure the caption returns into. `inCinemas` is untouched.

### What would change this

Paying for showtime data, which is the stated intent. When that happens, the
conditions in *What Again is for* still hold and are not re-opened by this entry:
only against a want already held, shared with someone who already tracks you back,
provenance on every screening, an honest coverage line, and **no booking link.**

**Verified in a browser** at 390×780, signed in, against the real listing: no
caption in the DOM at rest or after scrolling, both grids present, 303 posters, the
first poster's top at 49.75 against `main`'s 49.76 of padding — so the wall begins
exactly where content begins on every other screen and nothing was left behind by
the element that used to pull itself up over it. No console errors. Typecheck, lint
and a production build are clean.

---

## Phase 2: the other person — 17 August

Tracks, `/u/[handle]`, copying, and the identity question that had to be settled
before the route existed. §13 calls the multiplayer half 80% of the work and 100%
of the value; this is the first of it.

### Names for people who know you, handles for everyone else

One function, `nameFor` in `lib/domain.ts`. A mutual track shows the display
name; everything else shows `@handle`.

**Knowing someone is a mutual track**, which is the whole reason this needed no
new object: the condition was already in the schema because §6 requires it for
overlap. The identity rule is a *read* of a relation that had to exist anyway, so
it does not wait on groups (see *Groups* above, where the identity half is
explicitly separated from the group question).

It returns the handle **with its `@`**, so no call site decides whether to add
one. A caller that branches on `mutual` itself is a second copy of the rule and
will drift from it — which is also why `listMyTracks` computes `mutual` in the
data layer rather than handing callers two booleans.

⚠ **Inbound-only is deliberately not announced.** Somebody tracking you with no
track back sees the same page a stranger does, and the control still reads
*Track*. Announcing it would be a follower notification — the §2 shape this
design avoids — and it would publish a one-sided interest the other person never
chose to make visible. The value is not lost: pressing *Track* is exactly the
moment the pair becomes mutual, which is what the notification would have been
prompting.

### The app was asking for a name twice, and the wrong one won

Found by driving the rule against real rows, not by reading it: `nameFor` fell
back to `@collateralflora` for the only real account, because
`profiles.display_name` was null.

Sign-up collects a name into Better Auth's `user.name`
(`components/sign-in-form.tsx`). Onboarding then collects an **optional**
`profiles.display_name`. §5's rule reads the second one, so anyone who typed
their name at sign-up and skipped the optional field was shown to their friends
as a handle. **The rule never fired for the account that had already given its
name.**

`createProfile` now falls back to `user.name` when the optional field is blank,
and the optional field survives as an override — the name you go by is not always
the name on the account.

⚠ **The fallback has to refuse an address.** Sign-up does `name: name || email`,
so `user.name` can *be* the account's email. Seeding a display name from it
unchecked would have put people's email addresses in front of their friends,
which is worse than having no name. `usableAsDisplayName` rejects anything
containing `@` — which covers that case by construction rather than by comparing
against one particular address, and is right on its own terms, since `@` is how
this app writes a handle.

The existing row was backfilled on both databases, rehearsed on `development`
first, with assertions that nobody who already had a name could lose or change
one and that nothing could end up holding an address.

### Overlap's second trigger, and what it cost to find

The carry-forward item, open since §6 was first read: the fan-out ran on entry
insert and on state change, so two people who already held matching wants and
*then* tracked each other produced nothing. No entry moved. That is §13's
seed-time case exactly — a dozen friends joining in a week and backfilling their
lists before the graph is complete — so **the case it missed was the app's first
impression.**

`runOverlapForNewMutual` is a second **caller** of `lib/overlap.ts`, not a second
copy of it: same `classify`, same writer, scoped to the one pair, and still one
set-based statement (`entries` joined to itself on `item_id`).

It fires only on the transition into mutuality, and `onConflictDoNothing` on the
composite primary key is what decides that — a constraint rather than a check
someone has to remember. An already-mutual pair pressing *Track* again cannot
reach it.

`writeNotifications` came out of this. Both entry points go through it, and it
takes **the item per match rather than per batch** — which is what lets the pair
fan-out stay one INSERT while spanning many items. A writer that assumed one item
would have forced a query per item, the exact per-row shape §6 rules out.

⚠ **The burst is uncapped, and that is a decision with a date on it.** Two people
with forty items in common produce forty matches each at the moment they connect.
While notifications are in-app that is the *value* of connecting arriving at once
— the app has nowhere else to say it. It stops being obviously right when push
exists, and `docs/plan.md` carries it into Phase 5, where the worker is written.

⚠ **Untracking and re-tracking legitimately fires again**, because mutuality is
genuinely re-established. The durable answer is remembering what has already been
said, which is Phase 3's problem; the interim guard is `LIMITS.track`, a bucket of
its own because tracking is the only mutation whose cost lands on somebody else.

### Untracking deletes its row, and §5 is not violated

*Nothing is ever deleted* is a rule about **entries**: resolving one changes its
state because having wanted something remains true, and the history is the point.

A track is not a record of an event. It is a live statement about who may see your
list, and a statement you cannot withdraw is not a statement. There is also no
state a withdrawn track could sit in that would not amount to *a list of people
you stopped following*, which is a worse thing to keep than the row.

No fan-out on the way out. §6 fires on convergence, never on its loss, and should
not gain a notification for a match going away.

### Their page is visible without tracking

A stranger who knows the handle sees the same two lists a mutual does. §5 makes
`done` the private state and nothing else, and **§6's suppression rule is the
proof this is intended** — it exists precisely because browsing someone's page
and copying off it is expected behaviour. If the page needed permission, that
rule would have nothing to suppress.

What a track changes is overlap and naming, not access.

`state = 'done'` never appears there, and the page does not filter for it:
`listEntriesForOtherUser` does, unconditionally, and `PublicView` cannot express
the archive. The guarantee stays one layer down, because a regression would not be
visible on the page.

### Copying always lands as a want

`copyEntry` takes **the entry id the caller was already shown**, never an item id,
so a client cannot name a row it was never given. Three properties fall out of
that shape rather than out of instructions:

- **A `done` entry cannot be copied** — the same unconditional exclusion as the
  list, spelled again because this is a second door onto the same rows. It answers
  `not_found` rather than `forbidden`, deliberately: *that exists but is private*
  is itself the leak.
- **It always lands as `want`.** Copying someone's fixture must not assert that
  you own the thing, and copying a go-back-to must not claim you have been. The
  intent carries over; the state does not.
- **`sourceUserId` is read from the row, never taken from the caller**, because it
  is the input to §6's suppression rule. A caller that could name its own source
  could switch suppression off — which would turn copying somebody's list into a
  way of pinging them.

The button says *Add to wants* rather than *Copy*: what happens is that it joins
your wants, and the copying is an implementation detail only §6 cares about. The
idempotent path reports *Already in your wants*, because a button that silently
does nothing reads as broken.

### `PersonRow` is not `EntryRow` with a flag

The two rows differ by which actions they may offer, and that is exactly the
difference §5 cares about. A public row must be **structurally incapable** of
rendering *Seen it*, and the way to guarantee that is for the component not to
import the action at all.

A shared row with a `mine` prop would put the owner's resolve flow one boolean
away from a page it must never appear on, and that boolean would be passed by a
page whose author had forgotten why it mattered. The type ratio, the hairline and
the poster reveal are shared — by being the same classes, not the same component.

### A way in, or the route does not exist

`/u/[handle]` was unreachable: §2 rules out discovery and search for strangers, so
the only route to a person is a handle someone gave you. `TrackedPeople` on
`/profile` is a list of people you have already reached, not a directory.

It sits **above** the identity block, because that block is anchored to the
bottom-left corner at every width on purpose.

⚠ **Whether a track is mutual is legible there without being labelled**: `nameFor`
shows a name for a mutual and `@handle` for everyone else, so a row wearing a
handle is a track that has not been returned. That is the identity rule doing the
work rather than a badge repeating it — and the reason not to add a *mutual* tag,
which would state the same fact twice and give the weaker version its own weight.

### Verified through the product, 37 assertions

Driven in a real browser at 390×780 against the `development` branch — the real
button, the real Server Action, the real data layer — with the assertions about
what was *written* read straight out of the database. That combination is the
point: a screen that looks right says nothing about whether the fan-out wrote
anything.

The relationship was walked through all three states, stranger → tracking →
mutual → stranger again, and the naming followed it in both directions. All six
notifications appeared on the transition into mutuality, and the three cases that
must produce **silence** did: the pair sharing only an intent, the resolved `done`
entry, and the entry copied off the other person.

⚠ **Two things this did not cover**, both recorded in `docs/plan.md`: a *populated*
Fixtures section on somebody's page (the account under test holds none, and an
empty section renders nothing by design), and any of it on hardware.

⚠ **Three lessons from the probe itself**, all of which cost time:

1. **The shell's masthead is a `<header>` too**, so `header button` matched the
   search glyph and the probe waited twenty seconds for a label that was never
   coming. Scope into `main`.
2. **Never index into a list that the thing under test mutates.** Adding replaces
   that row's button with a report, so every later index shifts by one — an
   earlier run clicked `nth(1)` after the first add and silently exercised a
   different film. Address rows by title.
3. **Assert a 404 on the status, not the words.** Next's own error page reads
   empty via `innerText` before hydration; the status is the contract.

⚠ **TMDB is unreachable from this machine again** —
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`, TLS interception on the local network — so `/`
wedges in development and the probe signs in over the API and injects the cookie
rather than driving the form. The note in the memory file saying TMDB *is*
reachable from the dev server was true on 11 August and is not now. Nothing about
the deployed app is affected.

---

## `/profile`, the private note, and two tests — 17 August

Six commits on `/profile` and one on the note. The reasoning that has to survive:

### The foot stops jumping, and both feet read one number

`/profile` is the only route with the collections bar hidden, so its *Sign out* sat
wherever content ended and the foot of the screen moved as you entered and left.
The bar's geometry is `--collections-inset` and `--collections-row` now, read by
both screens. ⚠ **The inset is the home-indicator band *less a centimetre*** — the
whole band is right in a Safari tab and wrong installed. Measured 0px drift:
21.01px above the foot on a phone, 47.15px above `rail`, which is the rail's own
line.

⚠ **`foot-collections` / `foot-bare` are `@utility` blocks, not arbitrary
properties in a class string.** Two declarations of one custom property at equal
specificity are resolved by stylesheet order, which a class attribute cannot state;
`@variant rail` nested inside `@utility` can.

### The name came off, and the pill went quiet

Nobody needs telling their own name, and the rail carries `@handle` alone — so the
two corners now agree. `display_name` still feeds `nameFor` for people who track
you back, which is the audience it was collected for.

Removing it exposed an outline defect this session had introduced: with People above
and identity pinned to the foot, the handle as `<h1>` gave *h2 then h1*. The page's
`<h1>` is `sr-only` in the page, where it can precede the `<h2>`.

The pill is the **first surface in the app with a fill and no hairline**. Full
strength `bg-surface` was rejected on sight — it is 1.29:1 against black, which is
what a card wants and far too much for grouping two lines of quiet text. `/40`
composites to `#0d0d0c`, about 1.09:1. ⚠ **Use opacity, never a hand-picked
near-black:** a tint of the same charcoal cannot drift out of the palette's warmth.

### Nothing at that screen's edges moves

Handle and *Sign out* are a fixed foot below `rail`; `main` reserves their height
through `--profile-foot`, written as *handle font size + `--collections-row`* rather
than as 56px. Verified across a real scroll — 253px on a phone, 147px on a desk —
mark and identity unmoved at both.

⚠ **Above `rail` the block is hidden, not repositioned.** The rail already carries
the same two things in the same corner, fixed, so this was a duplicate — and it was
the thing scrolling, 184px of travel while the rail's copy held still. The
alternative was a second set of coupled numbers to hold a second copy of what was
already on screen.

⚠ **The masthead never could recede here** — the recede listener returns early on
`!showCollections` and `receded` is stamped with the route it hid on. Nothing was
broken; `mastheadHidden` now states `showCollections` outright so the guarantee is a
property of the masthead rather than a consequence of two things elsewhere.

### The private note, and why the projection changed shape

One nullable column, bounded at 140 by `NOTE_MAX`, written through
`setEntryNote(SessionUser, …)` filtered on `userId` as well as `id`. Empty clears to
`null`, so "no note" has one representation.

⚠ **`listEntriesForOtherUser` no longer selects `entries`.** It selects
`PUBLIC_ENTRY_COLUMNS` by name. `select({ entry: entries })` returns whatever the
table happens to hold, so the day a private column is added it is already in every
public read — nothing fails, nothing looks wrong, and the guarantee is gone. Listing
the public columns means a new private field is excluded **by default rather than by
memory**. Adding one to that object is a decision to publish it.

**Where the note is offered in the UI is still not decided**, and `plan.md` always
said it was the small part. The column, the bound, the mutation and the exclusion
are done and tested.

### A test file, and deliberately not a suite

`npm test` — Vitest, one file, six assertions, three guarantees: another person's
`done` never returned, the note never in a public projection, `getSwap` blind until
both commit.

⚠ **The argument against a real suite still stands.** Every fault that has mattered
in this project was found by driving the app and looking at it, and no unit test
would have caught any of them. What is here is the opposite case — guarantees that
fail with **no symptom**, where a passing build and a screen that looks right are
both consistent with the guarantee being gone.

Three things worth knowing about the setup:

- ⚠ **It writes, and it refuses to run against production** — the same
  `PRODUCTION_DB_HOST` check `preflight` uses.
- ⚠ **`server-only` is not an installed package**; Next resolves it. Vitest aliases
  it to a stub, which removes nothing — the rule exists to stop a *client bundle*
  importing `lib/db/`, and a test process is not one.
- **Fixtures are written with the raw driver**, and `tests/**` is exempt from the
  §3 import ban for that reason: a test that inserted a note *through* the layer
  would be asking the layer whether it agrees with itself. `SessionUser` is cast
  there and nowhere else.

---

## The databases are two — 17 August

The last thing in pre-phase 2, and the only one that could not be retrofitted.

### What was wrong

One Neon database served both jobs. `DATABASE_URL` in `.env.local` and
`DATABASE_URL` in the Vercel project were the same string, and Vercel held it as
**one record targeting Production and Preview together** — a shape that is easy
to miss, because the dashboard lists a variable once and shows the targets in a
column nobody reads. Three consequences:

- `npm run dev` wrote to the database the live site reads.
- Every preview deployment did too.
- `npm run db:migrate` migrated production. There was no rehearsal anywhere.

None of it had cost anything, because there was one user and every row was his.
"Development data" and "real data" were the same rows.

### Why it had to be now rather than during Phase 2

Phase 2's checkpoint is §12's, taken literally: two accounts on two devices
seeing each other correctly. Reaching it means making, breaking and remaking a
track between two accounts, repeatedly — and Phase 2 is also where the two
functions carrying **silent** guarantees arrive, `listEntriesForOtherUser`
excluding `done` and the private `note` staying out of the shared projection.
Those want exercising against rows that can be thrown away, because the whole
property of that class of bug is that nothing looks wrong when it breaks.

And the cost curve only goes one way. Splitting while every row belongs to one
person is an ops task. Splitting after a second person's rows are interleaved
with test rows is a data migration with a judgement call per row.

### The shape

A Neon branch, which is copy-on-write, so a clone of the data costs no storage
and takes seconds:

| | |
|---|---|
| `production` (default branch) | the live site. Untouched |
| `development` (`br-lingering-union-zasig3cn`) | this machine **and** preview deployments |

No code changed. `lib/db/client.ts` reads one variable and does not care which
database answers, which is the property that made this an hour rather than a
refactor.

The branch came up as a true copy — 13 tables, all three migrations in
`drizzle.__drizzle_migrations`, and the real data — so `npm run dev` works on
the first run with a real signed-in account rather than an empty schema. That is
also the argument for branching **with** data rather than taking a schema-only
branch: a migration rehearsed against an empty database does not rehearse the
half that goes wrong, which is the backfill.

⚠ **Preview points at `development`, not at a third database.** A preview is a
rehearsal, and giving it its own database would mean a third migration target
and a third set of accounts for no gain. The rule it enforces is the one that
matters: **nothing but production writes to production.**

### Two hazards worth knowing about

⚠ **`vercel env pull` overwrites `.env.local`** and would silently undo the
repoint. The file already carries a `# Created by Vercel CLI` line, so it has
been pulled at least once. Do not run it. Recover the development string with

```
npx neonctl connection-string development --project-id crimson-paper-70987817 --pooled
```

which is why the branch is named in this file and the string is not.

⚠ **Vercel cannot narrow a record's targets in place.** Splitting one record
into two is remove-then-add-twice, so there is a window with no `DATABASE_URL`
on the project. It is harmless — environment variables bind when a deployment is
built, so the running site keeps the value it already has — and production was
re-added with the identical string, so even an immediate redeploy is a no-op.

### The test accounts are gone from production

Production held five users: one real, and four left by test harnesses — a
`reset-test-…@example.com` from proving password reset on 7 August, and three
`probe-…@example.com` from the browser-driven sessions on 11 August, one of them
with 114 sessions behind it. None held an entry and none was the `source_user_id`
of anyone else's, so removing them changed nothing but their own graph: −4 users,
−4 accounts, −117 sessions, −1 profile, with **entries 22 → 22 and items 23 → 23**.

⚠ **This is not a hole in §5.** *Nothing is ever deleted* is a rule about the
product — resolving an entry changes its state, it never removes the row, and
there is no delete action anywhere in the UI. It says nothing about fixtures left
behind by a test harness, and leaving them would have meant a stranger's first
sight of Again being a database with four fake people in it.

Done in one transaction with the survivor's id, handle and entry counts asserted
before and after, and `items` asserted unchanged because they are shared TMDB
rows rather than anyone's data. **Rehearsed on `development` first, which is the
first thing the split paid for** — the numbers above were read off the copy
before production was touched.

⚠ **The stored probe credential is dead.** `probe-msove4za@example.com` was the
account previous sessions were told to reuse rather than making more. It is gone
from both databases, and that is the right end state: probe accounts belong on
`development`, where making one costs nothing. A future probe signs itself up.

### What is still not split

`BETTER_AUTH_SECRET`, Upstash and Resend are one instance each across both
environments. None of them stores rows that belong to a person — a shared rate
limiter is one counter, and the same auth secret across environments only means a
session cookie would validate in either. Revisit if a second person ever holds a
session.

---

## The film screen, and a fifth colour — 17 August

Directed, with a layout: tapping a poster opens the film — artwork edge to edge
across the top half of the screen, synopsis below it, a `+` on the artwork, and a
luminescent green tick when it is on your list.

It replaces **two** surfaces. The intent sheet asked *see or a copy?* as a modal
over the wall, and the acknowledgement band answered from the foot of the screen
a second later. Neither exists now.

### Why it is better, in one sentence

The sheet asked which want you meant before saying what the film was, and the
moment that matters is a poster on the wall you do not recognise. The screen
answers *what is this* first and makes the add a control on the answer.

That also retires the band: there is no longer a moment where something has been
added and the thing you added is not in front of you, which is the gap the band
was covering. §5.1's ten seconds survive as the tick itself — while the window is
open the mark is the way back out, and after it the mark is a state rather than a
control. A button that silently stopped working would be worse than one that was
never a button.

### The colour, and the terms it arrives on

`--color-listed` is the **fifth** meaningful colour in a palette whose whole
argument was that it had two. The terms matter more than the value:

- **It marks a state, not an event.** `listMyEntriesForExternalId` asks before you
  touch anything, so a film added last month opens green. A colour that only
  appeared for a second after a tap would be a flourish, and §11 does not spend
  colours on flourishes. This was the condition the colour was agreed under.
- ⚠ **It is not the tick in `entry-row.tsx`, and that was the original plan.**
  Proposed as "one green for both ticks", and wrong on inspection: that tick marks
  a want that has been *satisfied* — watched — which is a different claim from
  *listed*. Everything in a list is on the list. Tinting both would have given
  green two meanings on its first day, which is how a palette stops meaning
  anything.
- ⚠ **Quieter than the accent, measured: 6.0:1 against the ground, against amber's
  7.7:1.** Amber marks overlap, the one moment the product exists for; adding a
  film is the most routine thing anybody does here. If the routine action were the
  brightest thing on the screen the important one would stop being where the eye
  goes. Any change to the value has to keep that gap — green also has the hue
  advantage, peaking near 555nm, so parity in contrast would already read louder.

### What it costs against §2

⚠ **It is a step past "images beyond poster thumbnails".** The home wall took the
first step and this is the second, taken deliberately rather than discovered
later. What it does *not* do is add a second **kind** of image: this is the
poster, cropped, not the backdrop still the reference layout used. One image type
in the app, at three sizes, all from TMDB's CDN and never proxied (§10).

Also refused, and worth naming because the reference layout leads with it: **no
rating, no score, no stars.** The metadata line is director, year, runtime — the
three things that decide whether you want a film tonight.

### Both intents survive

Intent is a property of the entry (§4), and a `+` alone would have collapsed it to
whichever default it happened to carry. The primary is the circle on the artwork;
*Want a copy* is a quiet control under the synopsis. That is §8's shape — one
prominent action, the rarer one beneath it — and it is the only part of the sheet
worth keeping.

### Two things that would have shipped broken

- **`next/image`'s `fill` renders its positioning as a `style` attribute**, and
  the CSP drops style attributes in production while `next dev` allows them. It
  would have laid out perfectly in development and collapsed on the deployed site
  — the same divergence that cost a masthead and a wordmark on 10 August. Explicit
  `width`/`height` with classes doing the layout.
- **The controls were `black/50` and the green measured 1.7:1 over a bright
  poster** — invisible on exactly the films most likely to have one. At 80% it is
  4.0:1 and the plus is 11:1. No `backdrop-blur` on them either: a blur clipped to
  a rounded border is the combination WebKit has a history of rendering wrong, and
  these are buttons rather than glass.

### Haptics: wanted, and not possible on iOS today

Directed on 17 August — a light haptic when a film is added — and then, the same
afternoon, **removed**: it was never felt on the handset.

**Android has it and keeps it.** `navigator.vibrate(10)` in `lib/haptics.ts`,
called as the first statement in the `+`'s handler. Ten milliseconds is the
conventional light tap; longer is a buzz, and a buzz for an add is the phone
asking to be noticed rather than answering.

**iOS Safari implements no Vibration API on any version** — not behind a prefix,
not behind a permission. That is the whole of the problem and nothing in the app
can route around it.

**What was tried, so nobody tries it twice.** Safari 17.4 added the `switch`
attribute for checkboxes, and toggling one through its label is widely reported to
play the system's own light haptic. It was built as a hidden pair mounted once for
the app and clicked from the tap handler. Two variants:

1. Hidden with `sr-only` — a 1px box clipped with `clip-path: inset(50%)`.
2. Hidden with `opacity: 0` on a real 44px box, laid out and painted, on the
   theory that the haptic rides the switch's *animation* and an engine may skip
   animating something clipped out of existence.

Neither produced anything perceptible. **The call was never in doubt** — it is the
first statement in the handler, before any state change — so the failure is
downstream of the app in every version.

⚠ **Deleted rather than left in place, and that is the part to keep.** A mechanism
that does nothing is worse than no mechanism: it reads as a working feature to
whoever finds it next, it costs a hidden interactive element in every signed-in
page, and it makes the *absence* of haptics look like a bug in this code rather
than a gap in the platform. The want does not go with it — it is open in
`docs/plan.md`.

**What would reopen it:** Safari shipping the Vibration API, or a specified web
haptics API, or a first-hand demonstration that the checkbox trick works in a PWA
context this project can reproduce. Two things outside the app produce the same
symptom and were never ruled out from here — System Haptics being off in Settings,
and Low Power Mode — so a future attempt should start by confirming a haptic on
*any* web page on the device before touching this code.


#### ⚠⚠ CARRY THIS INTO A NATIVE APP — the vocabulary is designed and waiting

**Directed 30 August: keep the haptic idea somewhere so it can be implemented
when Again becomes a native app.** This is that place. **Nothing below is
blocked on design work** — the vocabulary is decided, it is written into
`lib/haptics.ts`, and the three web patterns already run on Android. What a
native shell adds is the one surface that matters: **iOS, which is where this app
is actually used.**

**The vocabulary, from the Phase 2 design brief §4:**

| event | feel | web today |
|---|---|---|
| a capture lands | one light tap | `vibrate(10)` — `haptic()` |
| settled | a firmer double | `vibrate([14, 40, 14])` — `hapticSettled()` |
| crossed off | one heavier thud | `vibrate(26)` — `hapticCrossedOff()` |
| a convergence arriving while the app is open | the only pattern unlike the others | **unbuilt — nothing fires it yet** |

**Silent, and this half is as load bearing as the other:** opening the console,
dismissing it, the keyboard rising, the chrome receding. Those are things the
person *did*, not things that happened.

> **Every haptic corresponds to something that just became true in the database.
> Never to a UI transition.**

⚠ **Otherwise the hand learns noise and stops reading it** — which is also why
the three must be *tellable apart*. The web patterns separate them by length and
by count, because a `vibrate()` duration is the only axis that API controls. **A
native shell should re-map them to the platform's own vocabulary rather than
porting the milliseconds**: on iOS that is `UIImpactFeedbackGenerator` (light for
a capture, medium or a `.success` notification for settled, heavy for a cross
off), and the convergence pattern is the one that should be unlike the rest
because it is the only event the *app* originates rather than the hand.

⚠ **The call site rule survives any shell: synchronously, inside the handler for
the gesture.** Not after an `await`, not from an effect, not when the server
answers. Every platform that has a haptic grants it for a live gesture and
refuses it afterwards. Because every write on this page is optimistic, *became
true* means *became true on the record* — see the note at the top of
`lib/haptics.ts`.

⚠ **And the design consequence, which is the thing most worth carrying: NOTHING
IN THE APP MAY BE DESIGNED TO BE CONFIRMED BY THE HAND ALONE**, for as long as
iOS has no haptics on the web. The swipes are the case in point — a gesture meant
to be usable without looking, on the one surface where it would be confirmed by
nothing. What confirms them instead is the row travelling its own height and
stopping dead, and both outcomes being visible where they happened. **When a
native shell lands, the haptic becomes a second channel rather than the first
one**, and none of that visual work should be taken back out.
### ⚠ Open: should there be a synopsis at all?

Raised 17 August, as a question rather than a change. **It is not settled and
nothing below is a decision.**

**What it is doing there.** The screen exists to answer *what is this* for a
poster on the wall you do not recognise, and title, director, year and runtime may
not answer it for an unfamiliar film. That is the whole case, and it is a real
one.

**What is uncomfortable about it.**

- §2's closing test is *if a feature request makes the app more useful to a
  stranger, it is probably wrong* — and **a synopsis is the most stranger-facing
  thing on any screen in this product.** It is precisely what you need if you know
  nothing about the film and precisely what you skip if a friend has already told
  you about it, which is the case this app is built around.
- It is the most catalogue-like element in an app that is deliberately not a
  catalogue. Every listings product leads with it.
- §11 says type is the entire design, and this is the only place where the type on
  screen is **somebody else's prose** rather than the app's own words or a
  person's.
- It costs a third of the screen for something read once.

**The question underneath the question: what is the bottom third for?** If the
synopsis goes, the honest candidates are:

1. **Nothing** — artwork to the foot, with the title and the `+` over it. The
   screen becomes a poster and an action, which is the smallest thing that answers
   the tap.
2. **Who else has it.** Overlap is the one moment the product exists for, and *two
   people you know want this* is a better reason to add something than a plot
   summary. That is Phase 3 material and does not exist yet — **which raises the
   possibility that the synopsis is standing in the space overlap is meant to
   occupy**, and that the right time to answer this is when there is something to
   put there.
3. **The private note**, which has a column, a bound, a mutation and a test, and
   still has nowhere in the UI to be offered.

⚠ **Do not resolve this by deleting the synopsis and leaving a gap.** The question
is what the bottom third is for; removing its current occupant without answering
that is how a screen ends up with a third of itself unaccounted for.

### The synopsis is fetched, never stored

`/api/film/[id]` answers both halves in one round trip — what the film is, from
TMDB, and whether it is already yours, from `lib/db/`. Two requests would mean a
`+` that lies for as long as the second one takes.

The synopsis and runtime are not written to `items`. §5's schema is a canonical
row for a real thing, not a copy of somebody's catalogue; a stored synopsis goes
stale and the app then has to decide whether to trust it.

⚠ `Cache-Control: private` is load-bearing here rather than cautious. `/api/search`
says private because the request is authenticated even though the answer is the
same for everyone; **half of this answer is one person's own list.**

### Unseen on hardware

Built and deployed the same afternoon it was asked for. Nothing in it has been
looked at on a phone.

---

## Third-party dependencies

### Where TMDB actually sits

`items` is *our* table. Title, year, poster path and director are copied into
Postgres at add time; TMDB's id is stored as a string. Overlap — the thing the
app exists for — is a join between `entries`, `tracks` and `items`, all local.
TMDB appears nowhere in `lib/overlap.ts` and cannot, because that query never
leaves the database.

If TMDB went dark: every entry, go-back-to, fixture, return count, convergence,
swap and notification keeps working. Posters break, since they are hotlinked.
**The only thing that stops is adding films not already in the table.**

This is a property of §5's design. The version of this app that *is* critically
dependent is the one that stores a TMDB id and fetches titles at render time.

### The rest, ranked

- **Neon** — looks like the biggest exposure, is among the smallest. Plain
  Postgres, no extensions, standard Drizzle migrations. `pg_dump` walks out the
  door. Neon-specific code is `lib/db/client.ts` and `drizzle.config.ts`.
- **Better Auth** — owns four tables *in your database*, sessions in Postgres.
  If the project were abandoned you would still hold every user, credential hash
  and session. Contrast Clerk or Auth0, where users live in someone else's
  system and leaving is a migration you do not fully control.
- **Vercel** — moderate. Next.js runs anywhere Node runs, and image optimization
  is already off.
- **Web Push** — a W3C standard, not a vendor.
- **Upstash** — rate limiting only.

The asset that cannot be replaced is the entries-and-tracks graph, and it
depends on nothing but Postgres.

### What not to build

- **A film-provider abstraction layer.** Speculative generality. The insurance
  is the schema, not the code: `external_source` costs one column and makes a
  migration mechanical. An interface hierarchy costs ongoing complexity and buys
  nothing the column does not.
- **Mirroring poster images.** Violates §3's never-proxy rule, turns on an
  egress bill, and protects decoration in a design where §11 says type is the
  entire design.
- **Defensive metadata caching beyond §10.** Already required, already planned
  for Phase 1, already doubles as outage resilience.

### When to revisit

Triggers, so this is not a standing worry:

| Trigger | What to do |
|---|---|
| Books get added (§2's second kind) | Nothing — `external_source` starts earning immediately |
| TMDB changes free-tier terms or rate limits | Cost out an alternative; the column means you can |
| Again starts earning money | Commercial TMDB licence. No public pricing; contact `sales@themoviedb.org` with your country. A third-party figure of ~$149/mo under $1M revenue circulates but is not TMDB-published |
| Neon's free tier stops fitting | `pg_dump`, restore elsewhere, change one file |
| A provider migration actually happens | Revisit the `(kind, external_id)` unique constraint *and* decide deduplication at the same time |

### Licence obligations on the free TMDB key

Attribution is required and not yet implemented — belongs in `/settings`:

> This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
> otherwise approved by TMDB.

Plus their logo, displayed less prominently than your own branding. It is a
licence condition, not a feature, so it does not collide with §2's ban on
imagery beyond poster thumbnails.

Incidentally, §2 ruling out streaming availability also avoids TMDB's
watch-provider data, which carries separate JustWatch attribution requirements.
A licence surface avoided as a side effect of a product decision.

---

## Verified, versus assumed

Phase 0 was checked against the live Neon database, not just compiled:

- All twelve tables, the three §6 indexes, and the `(user_id, item_id, intent)`
  unique constraint
- Duplicate entry under one intent rejected; the same item under a *second*
  intent allowed, so the two wants stay independent — the property the
  dual-intent architecture exists to prove
- Sign-up creates a uuid user, persists the session to Postgres, and stores a
  hashed credential account

Phase 1 was checked through a temporary route handler driving the real
data-access layer in the real Next runtime — 21 assertions, all passing.
Browser tooling was unavailable, so the React layer is **not** verified; the
harness covered everything behind it:

- `upsertItem` idempotent; `addEntry` twice is a no-op, not a second row
- The same item under a second intent is allowed, so the two wants stay
  independent — the property the dual-intent architecture exists to prove
- *Seen it → Go back? Yes* lands `go_back_to` with `return_count` 1; *Been back
  again* increments; a second resolve is rejected
- *Got it → Keeping it? Yes* lands `fixture` with no return count
- A go-back-to appears in live (§5.2) and a fixture does not (§5)
- *Go back? No* lands `done`, which is absent from live and present in the
  owner's archive (§5.3)
- The undo window deletes; `toEntryCard` exposes no `user_id`

Password reset was checked end to end against the running dev server and the
live database, driving the real HTTP endpoints rather than the library:

- Requesting a reset returns the same body for a registered and an unregistered
  address
- The token is stored with a one-hour expiry, matching
  `resetPasswordTokenExpiresIn`
- Better Auth's callback validates the token and redirects to
  `/reset-password?token=…`
- Setting the new password succeeds; the **same token is refused on replay**
- The **old password is refused** afterwards and the new one is accepted
- `LIMITS.auth` returns 429 on the eleventh request in the window

The React layer has since been driven end to end in a real browser (Edge, via
`playwright-core`): sign-up, onboarding, the capture box, TMDB search, the intent
sheet, optimistic add, undo, the resolve flow, return counts and the `/me` tabs.
No console errors, no overflow at 320px, no stray use of the accent.

That run found the one bug nothing else could have: the intent sheet rendered
behind the search dropdown and could not be clicked, so nothing could be added
at all. Typecheck, lint, build and all 21 server assertions passed throughout.
Fixed in `a4bd90b` — **a passing data layer says nothing about whether the
product works.**

**All three of the things that paragraph used to end on have since happened**, and
they are kept here as the shape of the gap rather than as the gap itself: there
was no deployment (there is one, from 8 August, in `lhr1` beside Neon in
`eu-west-2`), there was no account (there is, and the signed-in app has been
judged repeatedly since), and nothing had run on hardware (it has, and the
handset has produced findings on 8, 11, 13 and 14 August that nothing else
could).

What is still unverified is smaller and more specific, and it is listed in
`docs/plan.md` rather than duplicated here. The standing lesson is the one this
section exists for:

> A passing data layer says nothing about whether the product works, and a
> passing build says nothing about whether a screen does. Every fault that
> mattered in this project was found by looking at it.

### Looking at it means looking at the build you actually made — 18 August

**An installed web app on iOS does not reload.** It keeps its document alive
across switching away, and standalone has no address bar to reload from, so a
home-screen Again keeps running whatever JavaScript it launched with until it is
force-quit from the app switcher.

That cost an afternoon. The scrollbar over the artwork was diagnosed, fixed and
deployed, and came back reported *still there* — from an app that had never
picked the fix up. A probe was designed, built, shipped and reverted on the
strength of that report. The same build in a Safari tab, which fetches fresh
every time, was right on the first look.

> **Force-quit the installed app before trusting a negative result from it**, and
> when a fix looks dead, open the same URL in a tab before touching the code. If
> the tab is right and the app is wrong, suspect the bundle. It is the same
> mistake as a guard beside a cure: something that looks exactly like the code
> being wrong, and is not.

Two smaller versions of the same trap, both met the same day. Production tracks
`main`, so a fix pushed to a branch is on a preview URL and not on the bookmark
anyone actually opens. And a report is worth naming its surface — *installed*,
*tab*, *Android*, *desk* — because the answer to "which of the four is this on"
turned out to be the whole of this one.

Re-verify with:

```
npm run typecheck && npm run lint && npm run build
```

## Three surfaces, two rules: what the desk and the tablet get — 18 August

Asked, before the last parked report was closed: give due consideration to the
different versions' needs — the installed app, and the wider landings on tablets,
laptops and desktops — and treat them differently.

**The answer is not three designs.** Two layouts that can drift are two places for
the same bug, and this project has been caught by that twice in a week (the CSP
divergence between `next dev` and production; the installed app running a
different bundle from the tab). What was actually wrong was subtler:

> **The app branched on width and used it as a proxy for what kind of thing it was
> running on.** On a tablet that proxy breaks — `--breakpoint-rail` catches every
> tablet in portrait, so a tablet was getting the desk's *layout* by accident of
> being 744px wide.

So there are two rules, and everything falls out of them:

- **Room follows width.** Columns, the reading measure, the rail, and whether a
  screen can stand beside the page or has to cover it.
- **Controls follow pointer.** Hit areas, hover, and anything about a finger.

**The tablet decision, made under those rules and naming no device:** a tablet is
a touch device with a desk's amount of room. It keeps the rail, keeps 44px
targets, and its posture decides itself — portrait falls below `--breakpoint-pane`
and takes the takeover, landscape falls above it and takes the panel. This holds
for any tablet, which matters more for Android than for iPad: those run from about
7" to 13", so a device assumption would have had to guess and a column measurement
does not.

⚠ **An audit of the pointer axis found it already right, and the case made for
changing it was built on a bad example.** `hover:` is framework-gated by Tailwind
into `@media (hover: hover)`, `tap-target` is already `@media (pointer: coarse)`,
and the handful of `pointer-coarse:` uses are doing their job. **No width query was
standing in for an input question.** The claim is recorded here because it was
made confidently and was wrong, and the next person to reach for that work should
know it has been looked at.

**What was actually wrong on both the desk and the tablet was one thing: the
takeover.** A 448px card blacking out a 1440px screen. That is `--breakpoint-pane`
and the panel, and the reasoning is in `film-screen.tsx`.

### Local development works again, and it is worth knowing how

TMDB is blocked on this network — not TLS interception this time but a 451 block
page for the host, so the dev server had no films and every screen that mattered
was empty locally. That is why the film screen had a bug nobody could see: React's
development double-invoke made it impossible to open, and the only way to reach it
was a handset running a production build.

The unblock is a Node-level stub of `globalThis.fetch` for `api.themoviedb.org`,
preloaded with `NODE_OPTIONS=--require`, living in `node_modules/.probe` so it
cannot be committed and no application code knows it exists. With it, the whole
app drives in a real browser at any width. **Both of this session's layout
findings — the panel's geometry and the 82px posters just above `rail` — came from
measuring in that browser, not from reading the code.**

⚠ Two traps met while building it, both of which will recur. A preloaded module
must print nothing: npm shells out to `node -p` and parses the output, so one
banner line breaks `npm run` itself. And every click on a server-rendered control
must be retried until it takes effect — the button exists and is "actionable"
before React has hydrated it, and a click inside that window does nothing at all,
silently.

## A stamp is mono, and §11 does not name that use — 18 August

*Synopsis* on the film screen was `micro`: small, capitals, a little tracking —
the same label register as every other small heading in the app. Directed:
set it as a **stamp**.

The `stamp` utility in `globals.css` is mono, wider tracking and one step of
weight. All three do work. Mono alone reads as a filename, tracking alone reads
as a fashion caption, and weight alone just reads as a heavier label; together
they read as something pressed onto the page rather than typeset on it.

**The call this records: §11 reserves IBM Plex Mono for return counts and
timestamps — for data — and a section heading is not data.** The extension is
made deliberately and on one argument: mono's other quality is *impression*.
Even widths and blunt terminals are what a rubber stamp has, and nothing in the
sans does that. The alternative was a fourth typeface for a single word, which
§11 would like considerably less than this, and which would have to be loaded,
subset and paid for on every route to serve eight characters.

It is scoped to one utility rather than applied as a class list, so the day
this is regretted it is one block to delete and one class to change back. If a
second thing ever wants to be stamped, it wears `stamp` — and if a third does,
the question stops being about a heading and becomes a real change to §11.

⚠ The trap it comes with: letter-spacing puts space after the **last** letter
too, so a stamp's box is 0.22em wider than its ink on the right. Left-aligned
to a gutter that is invisible. Centred, it will sit visibly off to the left.

Two smaller calls made in the same pass, neither of which needed a decision but
both of which have a reason worth keeping:

- **The heading belongs to the synopsis, not to the screen.** A film TMDB has no
  write-up for used to get *Synopsis* over the words *No synopsis for this one*
  — a heading introducing its own absence. Both are gone; it is the title, the
  credit line, and then black. Nothing shows while the answer is still unknown
  either, which is the rule the `+` already follows.
- **Only the two states that are buttons get a hover.** `CONTROL` is also the
  settled tick and the empty box for *not yet known*; lifting those under a
  cursor would promise a press that does nothing. `hover:` is not a desktop
  branch — Tailwind wraps it in `(hover: hover)`, verified in the compiled
  stylesheet — so a finger cannot leave a control stuck lit.

## The film screen asks what is pointing at it, not how wide the window is — 18 August

**The complaint that produced this: everything built for the phone was arriving
in a maximally narrowed desk window.** The glass panel, the chevron, the
full-screen poster and the mono synopsis were all asked for as *the phone
experience*, and a narrow window was getting all four — because a narrow window
and a phone were the same thing to `film-screen.tsx`. It had one signal,
`--breakpoint-pane`, and used it for two different questions.

⚠ **This section was written with the wrong answer and is corrected below. Both
wrong versions are kept, because the shape of the mistake is the same each time
and it is the useful part.**

There are two questions, and they are answered by different signals:

- **Shape decides the ARRANGEMENT.** `overlay` is *is this a tall narrow screen
  where a poster nearly fills the width, so the words have nowhere to go but over
  it.* The glass panel, the chevron, the full-screen picture and the recede are a
  response to that, and **a maximally narrowed desk window has exactly that
  shape** — so it gets them. `overlay` is `!pane`: a width.
- **The pointer decides the TYPOGRAPHY.** `touch` is *is this being handled with a
  thumb.* The mono synopsis was asked for on the phone and the printing on the
  desk, and neither is a fact about how tall a window is. `(pointer: coarse)`.
- **`pane` — is there room to stand beside the wall?** Unchanged, still
  `--breakpoint-pane`, and it is what `overlay` is derived from.

**The one place the two axes meet is the poster's size.** `original` is asked for
only when `overlay && touch` — a full-screen poster on a 3x handset, ~1170 real
pixels, where `w780` would be an upscale. A narrowed desk window has the same
layout at 1x or 2x and takes `w780`; a large touchscreen at `pane` widths has a
384px column and takes `w780`. Either axis alone would fetch megabytes for a box
that cannot show them.

### Both wrong versions, and why they were wrong the same way

1. **Width decides everything** (before this section existed). The phone's
   typography landed on any narrow desk window — which is the complaint that
   started this.
2. **The pointer decides everything** (the first version of this section). Fixed
   that, and took the *arrangement* away from a narrowed window along with the
   typography: **five things moved when two had been asked for.** The report was
   immediate and exact — a narrowed browser no longer had the presentation it had
   the day before.

**Both are the same error: one signal answering two questions.** That error is
what this file already records under *the film screen's height stopped being a
decision* and under the search dock's three-times-repeated containment bug. When a
rule has to distinguish two things, check whether it is really distinguishing one.

⚠ **`(pointer: coarse)` is a capability query, and that is what makes it
allowed.** *How things get fixed* rules out "branches that sniff for a browser",
and this is the opposite: it does not ask what the device is called, it asks what
the person is pointing with — which is the thing the design actually depends on.
A poster you push out of the way with your thumb is a different object from one
you click past with a cursor. Two other places already ask the same question: the
sign-in page's optical padding and the entry rows' spacing.

⚠ **It stays testable, and better than before.** A browser can be told it has a
coarse pointer — `hasTouch: true, isMobile: true` in Playwright — so the phone's
typography is driven and measured here rather than only on glass. And because the
*arrangement* is a width, **narrowing a window is a real preview of the phone's
layout again**: valid for the chevron and the poster's geometry, not for how the
synopsis reads. `recede.mjs` asserts both halves — a coarse 390×844 that must have
the chevron and mono, and a *fine* 390×844 that must have the chevron and **not**
mono, at `w780`.

⚠ **The edges are real and are accepted.** An iPad with a trackpad reports fine
and gets the stacked layout; a touchscreen laptop reports coarse and gets the
overlay. Neither is wrong for the question being asked — both get what suits what
is in the hand — but it does mean the answer is never "is this a phone", and
nothing downstream should be written as though it were.

**What a narrow desk window gets:** the overlay's layout and the desk's
typography — full-screen poster, glass panel, chevron, and a sans synopsis that
prints. The stacked arrangement (artwork a share of the column, words under it,
*See the poster*) is the panel's alone again.

### The surround: blurred under a cursor, black under a thumb

The question has no third answer — a 2:3 poster and a 0.46 screen are different
shapes, so *whole* and *full-bleed* are mutually exclusive for the picture, and the
chevron exists to make it whole. With the words away there is room left over and
something has to be in it. **The two surfaces are ruled differently, and this is
the only pixel they disagree about:**

- **Under a thumb: black.** The poster centred, gaps split evenly above and below,
  read as deliberately framed. `calc(50% - 75cqw)`.
- **Under a cursor: the same image out of focus.** Cover-scaled, `blur-2xl`, at 70%
  so the sharp one in front stays the subject, so the screen is full.

It went on everywhere first, was rejected, came back, and the resolution is that it
was only ever wrong on the phone. Worth stating plainly, since the code now carries
both and a future reader will otherwise assume one of them is a leftover.

⚠ **`w342`, deliberately** — the size the wall already fetched, so the surround
costs no request at all, and there is no resolution left to see after that blur.

⚠ **`scale-110` is not decoration.** A blur samples past the element's edges, where
there is nothing, so an unscaled copy fades out on all four sides and reads as a
vignette nobody asked for.

⚠ **It has no bearing on the panel's contrast floor.** At rest the sharp poster
covers the screen and the surround is invisible; it is only uncovered once the words
have gone, so nothing is ever read against it.

⚠ **A probe that wants the poster must not take `querySelector('img')`** — the
surround is also an `img` and comes first. Select the one whose computed `filter`
has no blur. Two assertions failed this way the moment it was added back.

⚠ **The stacked branch is still reached by only one condition, and that is worth
keeping.** It is the same JSX for the panel as it ever was; the two axes cost two
booleans and no third layout.

### Mono reaches the synopsis, on one surface

The `stamp` note above records mono arriving on a heading. It then went on the
synopsis body everywhere, and came off the desk within the hour: **the
instruction was to leave it as it is for the phone home app.** So the overlay's
synopsis agrees with the stamp above it and the panel's stays sans.

This is the larger of the two extensions to §11's reservation of mono for return
counts and timestamps — a heading is eight characters, this is the longest run of
prose in the app — and it now applies on exactly one of the three surfaces. The
argument is the stamp's: impression rather than data, against a fourth typeface.

⚠ **`printing` and `mono` are passed to `PrintedSynopsis` separately even though
they are complements today.** The printing was asked for on the desk and the mono
on the phone; folding them into one prop would mean that the day either moves,
both move.

## The type changes: Jost in capitals, Fira Sans under it — 21 August

Two decisions on one day, and only the second one deviates from the brief.

### The mark is Jost, set in AGAIN

Directed after looking at eleven faces set in capitals. Futura's geometry
redrawn: a circular G, a sharp-apex A and one stem width. §11 is silent on the
mark's own face — it governs interface, mono and the accent — so this replaces
Ojuju without extending anything.

**Capitals are the substantive half of it.** The word gains a tracking
requirement it did not have (a lone `I` between an `A` and an `N` disappears set
solid) and loses a descender, and losing the descender is what moved every
number the mark drives: the ink ratio falls 0.92 → 0.775, `--wordmark-drop` goes
to zero because there is no tail for a row to take back, and `--wordmark-slack`
**changes sign** — Ojuju hung the `g` below its own box, capitals stop short of
it.

That sign change is the best evidence the machinery was built right. Three
places consume the slack — the masthead, `/sign-in` and `/reset-password` —
each as `14px − slack`, and none of them branches on the case. The gap under the
mark on the auth pages went from about 17.8px of box to 10.7px, in both
directions, for the same 14px of visible air, with nothing edited at any call
site.

⚠ **The numbers are now fenced with the face they describe.** They were in three
separate places, so "switching the face is one line plus a flag" was true of the
line and false of everything else: a switch moved the family and left seven
measurements describing the previous typeface. There is one block in
`globals.css` now — face, tracking, the three trim numbers and the three ratios —
and the reserve's complete set sits beside it, already measured.

⚠ **Bebas Neue is the reserve, held deliberately** at the user's request, for a
refresh later. `preload: false` keeps it declared and not downloaded. Seven of
its eight numbers are measured; its tracking is a starting point rather than a
reading, and the note says so.

### The interface is Fira Sans, and this one deviates from §11

**§11 names IBM Plex Sans, and this replaces it.** Recorded here because it is a
change to the brief rather than a choice inside it.

Directed: the menus and the collection rows should go with Jost, be readable, and
not get boring or overwhelming. The argument for moving is that **Plex Sans is
engineered in the same rational way Jost is** — two constructed faces next to
each other read as one slightly inconsistent voice rather than as a pairing.
Fira Sans is humanist where Jost is geometric, which is the contrast that was
missing, and it was drawn for small text on screens, which is the only thing this
app asks of it: 11px uppercase labels in the rail, and lists of film titles.

Longevity was the stated criterion and it is why the shortlist ended where it
did. Libre Franklin and Work Sans were the other two considered; Inter is ruled
out by §11 and stays ruled out.

⚠ **The cost lands on the mono, and it is real.** Plex Sans and Plex Mono are one
superfamily — shared skeletons, so a return count sat inside a sentence
invisibly. Plex Mono stays, because §11 names it for counts and timestamps and
nothing asked for it to move, but it is now a *contrast* against the text rather
than a sibling of it. **If that ever reads as a mismatch the answer is Fira
Mono**, which is Fira Sans's actual sibling, and it is one line in
`app/layout.tsx` plus `--font-mono`.

⚠ **Three families is the same count as before**, not one more: Ojuju, Plex Sans
and Plex Mono became Jost, Fira Sans and Plex Mono. Ojuju and Space Grotesk are
deleted rather than left declared — a font nothing points at is a font the next
person reapplies without knowing why it was there.

### What was measured, and how

`node_modules/.probe/metrics.mjs` loads the real self-hosted faces and reads
`TextMetrics`; `mark.mjs` then checks the result on all three surfaces the mark
appears on. Fifteen assertions, production build: the ink is as tall as
`--wordmark-ink` claims, the masthead row is exactly that ink, the letters land
inside it at both ends, the header is `gap + hem + ink + gap` to within a
rounding, and the auth pages' gap resolves to 10.71px.

⚠ **The search field is outside the row again, and it is expected.**
`shell.tsx` says to re-measure this whenever the mark changes: the field's line
box is 24px against a row that is now 21.69px, so it overhangs 1.15px at each
end into 8px of `--masthead-gap`. Nothing clips, and — the thing that actually
matters — **the header measures 45.69px resting and 45.69px with the field
open**, so tapping the field still cannot resize the masthead.

## A want has a third exit — 21 August

**A lapsed want had nowhere to go, and the only door out of one was a lie.**
Asked whether entries should be removable. The answer is no, and the question
turned out to be two questions.

*That's wrong* — the wrong film, a mistapped poster, a row that should never have
existed — is what §5.1's ten-second undo is for, and ten seconds is the whole of
it.

*I've gone off it* — the row was right and the intention has lapsed — had no
exit at all. The only way out was the resolve flow: **Seen it → Go back? → no**,
which files the entry in the archive. Correcting a true change of mind therefore
required making a false statement: you had to claim you watched something you
did not.

⚠ **The argument for changing anything here is not that people want to delete
things.** It is that the absence of an exit was quietly corrupting a state the
app treats as meaningful. The archive is the record of what you actually tried;
if mistakes and lapsed intentions land there too, `done` stops meaning done and
the archive becomes a bin. That is a loss that compounds silently, which is the
kind this project takes seriously.

### What was built: a fourth state, not a delete

`dropped`. §5.1 says resolving changes state and never removes the row, and this
obeys that completely — it is a resolution that happens to be the honest one.
Private like `done`, out of the live pool, out of overlap, out of everyone
else's view.

**The control is an ×, and the row does not leave the list.** It shipped as a
text control reading *Not any more*, then as *Remove*, then as neither: directed
the same afternoon, *make it an x in fact, no 'remove'* — and, before that,
*when removed don't actually delete from the list, dim and put a strikethrough*.
What survives of the naming argument is that nothing is named at all. A crossed-
off row says what it is by being crossed off, which is the one label that cannot
be the wrong word.

⚠ **The strikethrough is not decoration on top of a resolution — it is the
resolution's whole interface**, and three things follow from it that would each
have needed inventing otherwise. There is no confirmation, because nothing
disappears. There is no toast, because the row is the acknowledgement. There is
no undo window, because the way back is the same × in the same place. That last
one is the reason this is the only resolution in the product with no ten-second
clock attached: it does not need one.

**`want` only.** The guard is the same clause `resolveEntry` uses, so the set of
droppable entries is exactly the set of resolvable ones: a want has three exits
and nothing else has any.

⚠ **A go-back-to is deliberately not droppable, and the temptation is real.** You
saw it, you said you would return, you would not now. But you *did* see it, and
dropping it would take that out of the record. The honest destination is `done`,
which already means *tried, and not going back* — getting there needs a resolve
on an already-resolved entry, which is a gap this did not close. **Open**, and
small; see the register in `docs/plan.md`.

### Two ways back, and they are deliberately different

`restoreEntry` is the ×, tapped again: `dropped` → `want`, **`created_at`
untouched**, so the strikethrough lifts and the row does not move. Restoring
something and finding it somewhere else would undo the point of striking it
through in place.

`addEntry` also revives a `dropped` row rather than colliding with it —
`onConflictDoUpdate` with `setWhere: state = 'dropped'`, writing exactly what the
insert would have written, `created_at` included. That path is a want that
*started again* — through the `+`, or through a copy off someone's page — so it
takes a new clock, sorts to the top, and is inside §5.1's undo window. Without it
the unique index on (user, item, intent) would answer *already yours* for a film
sitting crossed off in front of you.

⚠ **`listMyEntriesForExternalId` includes `dropped`, and briefly did not.** While
a crossed-off entry lived in the archive it was fair to call it *not on your list*
and let the film screen offer the `+`. It lives in Wants now, in plain sight, so
the screen saying *not on your list* would contradict the page its own tick points
at. The tick links to Wants, the row is there, and the way back is the × on that
row — one control, in one place.

⚠ **The ten-second undo was left exactly as it was, and an earlier suggestion to
widen it was wrong.** The idea was to bound it by the film screen being open
rather than by a clock. It cannot be: the window is `created_at > now() -
interval` **in SQL**, specifically so the client cannot lie about it, and *the
screen is still open* is a client claim the server cannot check. It also stops
mattering — past ten seconds, overlap has already written notification rows to
other people, and a row that has caused effects elsewhere should change state
rather than vanish. The mistap and the lapsed intention converge on the same
honest exit once the window closes.

### The guarantee this touched, and the shape of the fix

`listEntriesForOtherUser` excluded one state **by name**: `ne(state, 'done')`.
That is correct exactly as long as `done` is the only private state, and adding a
second one made it wrong in the way §13 exists to warn about — nothing throws,
nothing looks broken, and somebody's abandoned wants are on their page.

⚠ **The fix inverts the filter rather than extending it.** `PUBLIC_STATES` in
`lib/domain.ts` lists what may be seen, and both public doors — that function and
`copyEntry`, which carried its own copy of the same clause — filter on it. A
state that is added and not listed there disappears from public views. The
mistake now produces a missing row, which someone reports, instead of a leak,
which nobody sees. §13 gained two cases: the dropped equivalent of the archive
test, and the copy door.

### Where it lives: in Wants, crossed off — and the archive stays one list

**A crossed-off want stays on the page it was on, struck through and dimmed, in
the position it held.** `stateFilter('live')` selects `dropped`; the archive is
one list again.

⚠ **This was built as a second band in `/archive` first, and that version is
gone.** It was the right answer to a question nobody had asked: *where do these
rows go?* The answer is that they do not go anywhere. What the band cost was the
one thing the strikethrough gives for free — being able to see what you crossed
off, next to what you did not, without navigating. Both bands, the `band` prop on
`EntryList`, the fifth `OwnerView` and the `first-of-type` separator that came
with them were all removed the same day. Nothing of it survives except this
paragraph, which is here so it is not rebuilt.

Three things had to move so the row could sit still:

- **`orderFor('live')`'s CASE names `go_back_to`, not `want`.** It was
  `when state = 'want' then 0 else 1`, which put `dropped` in the sinking half —
  crossing something off made it jump down the page and putting it back made it
  jump up. Naming the one state that is *meant* to sink leaves every other row
  where it is.
- **`countMyEntries` counts `dropped` nowhere**, so the rail's *Wants* number is
  deliberately not the number of rows on the Wants page. The rail says how many
  things you want; a film you crossed off is not one. Counting it would put the
  strikethrough back into the total it was struck out of.
- **The row is a flex *row* at every width**, where it used to be a column that
  became a row at `lg`. The × belongs beside the title on all four surfaces, and
  in the old shape it would have been a fourth stacked line on a phone. Measured
  at 390px with a coarse pointer: no two hit areas in a row intersect, and the ×
  carries a full 44×44.

⚠ **The strikethrough and the title's underline are one CSS property.** Passing
`line-through` alongside `PosterReveal`'s `underline` put two
`text-decoration-line` utilities on one element and the stylesheet quietly kept
the underline — a crossed-off title rendered identically to a live one, and the
build was green. The fix is a `struck` prop on `PosterReveal` so the component
writes one decoration or the other, never both: the collision is removed rather
than won. Struck, the underline goes and does not return on hover — between an
affordance that is deliberately almost invisible at rest and a state that has to
read across the room, the state wins.

### What was considered and not built

**A general delete.** Not much technically; what it costs is the claim. *Nothing
is ever deleted* is why the list is a record rather than a feed, and why the
archive is worth reading back. Once entries can vanish the archive becomes
curated, and a curated archive is a list of things you are happy to admit to.
Scoping a delete to `want` only — an intention never acted on is the one row
whose disappearance rewrites nothing — would have worked and buys nothing the
fourth state does not.

**Retracting notifications on a drop.** A convergence that fired was true when it
fired. §5.1 is about entries rather than notification rows, but withdrawing one
later would make the six kinds in §6 less trustworthy, not more.

**Firing overlap from `dropEntry`.** Every predicate in `classify` is positive
and `dropped` appears in none of them, so the fan-out would run two queries to
write nothing. `resolveEntry` fires because one of *its* outcomes creates a
match; this one has a single outcome and creates none.

**A general "removed" section under the live list.** Never seriously, but worth
naming: it is the band again with a shorter walk. The whole value of the
strikethrough is that the row keeps its place among the things it was listed
beside.

### Verified

Production build, driven in a browser at 1440px and at 390px with touch. The ×
crosses a row off and the list does not reorder; the strikethrough and the
dimming survive a reload; the same × reads *Put {title} back* and restores the
row without moving it; the rail's *Wants* count drops while the row stays on the
page; `text-decoration-line` computes to `line-through` on a crossed-off title
and the live rows keep their underline. No two hit areas intersect on the
handset, and the × measures 44×44. Console clean.

`npm run typecheck`, `npm run lint`, and the §13 suite (8 tests) pass. The suite's
dropped case now asserts the owner sees the row in their **live** view while
`listEntriesForOtherUser` still returns nothing — which is the case that makes
the positive filter earn its keep, because the view a stranger asks for now
selects the private state and the guarantee holds anyway.

---

## The poster paints in from the top (21 August)

Reported at the desk: tapping a title in Wants opens the artwork and you watch
it arrive in strips, top to bottom. Reported on the handset: not that, but still
noticeably slow sometimes.

Three separate causes, and the difference between the two devices was the first
one — the handset was already fetching roughly the size it needed and the desk
was not.

### 1. One size cannot be right on two screens, so we stopped choosing one

`lib/posters.ts` picks every other poster size by arithmetic: rendered CSS px x
the pixel ratio of the screen it renders on. That works for a 32px square and a
24rem column, and it cannot work here, because the revealed poster's box is *the
viewport* on a device whose pixel ratio is not knowable from the server. The two
defensible answers contradicted each other and the file records both: `w780` is
a downscale on a 1x desk display and an upscale on a 3x phone, and the note
rejecting `w780` twice is right about the phone and wrong about the desk.

So this one caller names no size. It offers a `srcSet` of every width TMDB
publishes with the box stated in `sizes`, and the browser — the only party that
knows the pixel ratio — resolves it. Measured: a 1440x900 desk screen at 1x
fetches `w780`, the same screen at 2x fetches `original`, a 390px handset at 3x
fetches `original`. Nothing in the markup differs between them.

Measured off TMDB for one film, so the sizes are not guesses: `w342` 62KB,
`w500` 121KB, `w780` 358KB, `original` 1.87MB at 2000x3000. Most originals are
2000 wide; some are 1000, which is why `original` is declared `2000w` — over-
declaring only ever means the browser reaches for it slightly later, and there
is nothing above it to reach for instead.

That is not a bandwidth optimisation dressed up. It is the rule in CLAUDE.md
applied literally: **remove the condition** — here, the condition that one
number has to be right everywhere — rather than tune the number until one device
looks acceptable.

`sizes` is `min(100vw, 67vh)`, which is the arithmetic of a 2:3 poster contained
in a full-bleed ground and not a constant anybody chose. If a browser cannot
parse `min()` there the attribute is invalid and the spec falls back to `100vw`,
which is to say it fetches `original` — the behaviour this replaced. The failure
mode is the old code, not a broken screen.

> ⚠ **Superseded within the hour — the `srcSet` is gone.** The reasoning above
> about *which file* is still the reasoning the code follows; the mechanism it
> chose could not carry it, because a `w` descriptor is also a promise about
> layout and `original`'s width is not knowable here. See *And the `srcSet`
> lasted about an hour* at the end of this file before touching any of it.

### 2. An `<img>` paints as it arrives, so it is not shown until it has

A baseline JPEG decodes progressively; displaying one before it is complete is
what draws it in strips. There is nothing to time out and nothing to cover with
a spinner — the element is transparent until `load` and fades in over 200ms. No
engine can paint bands of something it is not showing, which is why this is
stated at the display and not at the encoding, where it would be TMDB's to fix
and ours to guess at.

### 3. The lazy loader was load-bearing by accident

`next/image` lazy-loads by default, and this image lives inside a closed
`<dialog>`. `display: none` never intersects the viewport, so the lazy loader
was the only thing standing between a forty-row Wants list and forty full-size
posters fetched on arrival — which nobody had written down. It also meant the
request could not start until the dialog was *shown* and an IntersectionObserver
had noticed it, which is latency bought with nothing.

The image is now mounted on first open instead. That buys the same protection
outright — there is no element, so there is no request — and the fetch starts
eagerly in the same tick as the tap. Verified: zero requests to `image.tmdb.org`
while the list sits there, one request on the press, none on a reopen.

The press, not the click: `pointerdown` warms the exact URL the ladder will pick
by running the same selection on a detached image. Deliberately **not** on
hover. `lib/posters.ts` records that these bytes are spent on a deliberate tap,
and a cursor crossing a title on its way somewhere else is not one.

### The cursor says which of two clicks you are about to spend

Asked for at the desk, and it is the thing that makes the rest legible: a
magnifying glass over the artwork, an ordinary arrow over the ground. Clicking
the ground closes. Clicking the artwork magnifies it to `original` at its own
pixel size, with the ground becoming the scroll container; the cursor turns to
`zoom-out` and a second click comes back.

- **The magnified size is `original`, fetched on the click and swapped in on
  arrival.** Swapping first and waiting after would blank the poster at the
  exact moment somebody asked to see more of it. Whenever the ladder had already
  chosen `original` for the fitted view — every high-DPR screen — it is already
  in the cache and the swap is instant.
- ⚠ **A `srcSet` leaves a pixel density behind that removing the attribute does
  not take away.** Choosing from a `srcSet` stamps the element with the ratio
  between the file's real width and the width `sizes` claimed for the box, and
  from then on the element lays itself out — and reports `naturalWidth` — at the
  corrected size. Swapping in `original` and deleting both attributes measured
  **603px for a 2000px file**: 2000 / 3.32, the density from a ladder that was
  no longer there. Each mode now gets its own element via a `key`, so the one
  that means *at its own pixel size* was never told a box. A state removed
  rather than a state cleared.
- **`touch-none` becomes `pan-x pan-y` when magnified**, which is the exact
  subtraction: dragging comes back, `pinch-zoom` stays withheld. The reason
  `touch-none` is there at all is that an unhandled pinch zooms the *page* and
  iOS offers no way to put page zoom back, so a pinch on a poster used to strand
  the list behind it magnified. Panning must not reopen that.
- **The artwork centres with `m-auto`, not `justify-center`.** A centred flex
  child that overflows its scroll container is clipped at the start edge, which
  would make the top-left corner of a magnified poster unreachable. The scroll
  position is centred on the swap for the same reason — auto margins resolve to
  zero when the child overflows, so it would otherwise land on the one part of a
  poster nobody magnified to read.

### Then undone in the hand, the same day

Shipped, looked at, and pulled back on the handset within the hour. The reason
was visible before it went out and is worth stating plainly rather than as a
caveat: **on a phone the fitted artwork takes the full width**, so the ground it
is dismissed from is two ~130px bands at 390x844 rather than a margin all round
— and the tap that used to close it started zooming instead. A gesture arrived
where a dismissal used to be, and the dismissal retreated to the thinnest part
of the screen. Under a finger the whole surface is a dismissal again, which is
what this screen did for its first two weeks.

⚠ **This is not the device branch CLAUDE.md rules out, and the difference is the
whole of why it is allowed to exist.** A banned branch asks *what browser is
this* and then corrects for it: a guess about a class of machine, made once, and
wrong on the next machine in that class. This asks the event that actually
arrived — `pointerType` off the `pointerdown` — what kind of input made it. That
is neither a guess nor a class. A touchscreen laptop magnifies under its mouse
and dismisses under a finger, in the same session, on the same element, and
nothing had to know which laptop it was. **A media query cannot do that**,
because `(pointer: coarse)` describes the device and the question here is about
the gesture. The probe checks the touch path on all three profiles for exactly
this reason — a desk screen touched on its glass must dismiss too.

Anything that is not a mouse dismisses, including a click with no pointer behind
it. The fallback is the older behaviour, which is the safe direction to fail in.

It also puts a guarantee back rather than complicating one. `touch-none` gives
way to `pan-x pan-y` only when magnified, and magnifying is now a cursor's
gesture — so under a finger this element is `touch-none` for the whole of its
life and the iOS page-zoom trap has one state, not two.

**What this leaves as a real question:** whether magnifying is worth having at
all on a surface whose primary device cannot reach it. It stays because the desk
asked for it and the desk is where a 2000px master is legible. If it turns out
nobody uses it, the subtraction is one `pointer` ref and two class strings.

### What was considered and not built

**A low-resolution first paint.** Show `w342` immediately, swap in the real one
behind it. It removes the blank rather than the strips, at the cost of two
fetches on every open and a visible sharpening. With the press warming the fetch
and the desk now pulling a fifth of the bytes it used to, there is not much
blank left to fill.

**Hover prefetch.** A real win at the desk and a real cost on mobile data, and
it contradicts a rule already written down. Pointerdown gets most of the
distance for none of the argument.

**Zooming toward the click point.** The classic magnifier behaviour, and it
would mean a focal-point calculation on every screen shape. Centred is
predictable and was not what anybody asked for.

**The film screen's own artwork.** The same progressive paint is possible there,
and it has its own sizing note and its own reveal. Out of scope for a report
about the list, and it should be looked at with that screen's animation in hand.

### Verified

Driven against a production build in a browser at 1440x900 at 1x and 2x and at
390x844 at 3x, with `image.tmdb.org` answered by real rasters at each rung's
true pixel size — `node_modules/.probe/reveal.mjs`, 23 checks per profile, all
clear. Every profile is given a touchscreen as well as a mouse, and both paths
are driven on each: a tap on the artwork dismisses, a click on it magnifies. ⚠ The first version of that probe served SVGs and was theatre: an SVG has
no fixed pixel size, Chromium reported `naturalWidth` 603 for a stub declaring
2000, and `width === naturalWidth` passed while measuring nothing. A poster is a
JPEG; the stub had to be a raster before the magnify claim meant anything.

`reveal-nested.mjs` covers the hazard `film-screen.tsx` records — the poster
opened from inside the film screen at pane width, magnified, returned and
dismissed, with the film screen still standing afterwards. The takeover has no
`PosterReveal` in it; below `--breakpoint-pane` the film screen recedes its own
artwork instead.

`npm run typecheck`, `npm run lint` and the §13 suite (8 tests) pass.

### And the `srcSet` lasted about an hour (21 August)

Reported from the phone: *some posters open small*. They did, and the cause was
the mechanism this entry opened by recommending.

**A `w` descriptor is a promise about the file, and the browser spends it
twice.** Once to choose a candidate — the part everybody means by responsive
images — and once to compute the image's *intrinsic size*, as `naturalWidth /
(descriptor / the width sizes claimed)`. Every rung below `original` keeps that
promise exactly, because TMDB resizes to the number in the path. `original` is
whatever the distributor supplied, and `2000w` was a guess. Measured against a
stub serving each real master width, on a 390px phone at 3x:

| master | fetched | rendered | should be |
| --- | --- | --- | --- |
| 2000px | `original` | 390px | 390px |
| 1400px | `original` | **273px** | 390px |
| 1000px | `original` | **195px** | 390px |

Shrunk by exactly the ratio the promise was wrong by. Most TMDB masters are
2000 wide, which is why it was *some* posters and not all of them — and the desk
never showed it at all, because a 1x desk screen picks `w780`, whose descriptor
is exact. The bug lived entirely on the surface it was hardest to see on, in the
half of the mechanism nobody thinks about.

⚠ **Do not put the `srcSet` back, and in particular not with a "safer"
descriptor.** There is no safe number. Under-promise and the browser reaches
past a file that would have done; over-promise and the poster shrinks. The
descriptor cannot be right without knowing each master's width, and nothing on
the client knows it — `items.metadata` holds a path, and TMDB gives dimensions
only from a separate `/images` call this app does not make.

So the arithmetic moved back into the app, but to **the moment the box exists**
rather than to `lib/posters.ts`, where it does not: `rungFor` measures the
viewport and multiplies by `devicePixelRatio` when the poster is asked for. The
rungs it lands on are the same ones the browser was landing on — `w780` on a 1x
desk, `original` at 2x and on a 3x phone — so nothing about the first entry's
bandwidth argument changes.

**What changed is that the choice stopped touching the geometry.** With one
`src` and no descriptor, the intrinsic size is the file's true size, and
`object-contain` lays out whatever actually arrived. That is the difference
between the two designs and the whole of the lesson: the old one made a
guessable number load-bearing for layout, so being wrong about it was silent and
visible at the same time.

Three things fell out of it, all subtractions:

- **The `key` went.** It existed to escape the pixel density a `srcSet` leaves
  behind; with no `srcSet` there is no density to inherit. One element for both
  modes is also the better swap — the browser holds the old frame until the new
  one decodes instead of blanking between them.
- **The detached `Image` used to warm the cache went.** Naming a rung mounts the
  `<img>`, in a dialog that is still `display: none`, where an eagerly-loaded
  image fetches anyway. The press starts the bytes from the same element that
  will show them, so there is no second URL to keep in step with the first.
- **`mounted` went.** The rung being non-null *is* "has been opened" — the
  element and the size it wants come into existence at the same moment.

**The aspect ratio is the one thing still assumed**, and only to guess at the box
before there is a file to measure it from. It is asked again on `load`, from the
artwork itself, and the rung ratchets up if the guess was mean. That is not
belt-and-braces: *contained, never enlarged* means a file narrower than its box
renders at its own width, so under-picking a rung costs the poster **size**, not
just sharpness. Measured — a square master on a 1440x900 desk came back at 780px
where the box allowed 900, until it was asked a second time. The same ratchet
handles a phone rotating from landscape to portrait, and only ever moves up:
coming back down would swap a sharp file for a soft one to save bytes already
spent, and it is what stops `load` and `reconsider` chasing each other.

**Verified** with `node_modules/.probe/small.mjs`, which serves masters at 2000,
1400 and 1000 wide and at 2:3, 1:1 and 1:2, on a 3x phone and a 1x desk. Ten
cases, every one rendering the width `object-contain` owes it. `reveal.mjs` and
`reveal-nested.mjs` still all clear; typecheck, lint and the §13 suite pass.

### The poster fills the phone, and grows a door (21 August)

Asked for: on the phone, tile the poster so it fills the screen, and close it
with an × in the top right instead of by tapping the picture.

The two halves are one decision. Tiling leaves nowhere to tap that is not the
picture, so the × is not a preference about affordances — it is the door to a
room that has just been sealed. Building either without the other gives you an
× nobody would look for, or a screen with no way out.

**The tiles are the same file continuing off the top and bottom edges**, not a
grid of smaller copies and not the artwork cropped to fill. One copy sits where
it always did, and the bands above and below carry the tail of the previous copy
and the head of the next.

#### Flush, not "the handset"

The condition is not a width and not a device. It is **does the artwork already
reach both side edges** — `aspect(image) > aspect(viewport)` — which is true of
a 2:3 poster on a phone held upright and of very little else.

That is the exact condition under which the technique works, rather than an
approximation of the machine it was asked for. `background-size: <width> auto`
with `repeat-y` only repeats seamlessly along an axis the artwork already spans;
tile a height-bound poster and you get columns of it side by side, which is a
wallpaper and not a poster. So a phone upright tiles, a phone on its side does
not, a 1440x900 desk does not, and a narrow browser window does — because it is
the same shape as a phone and the same treatment is the right one there.

It also means the rule needs no maintenance when a new screen shape appears.
Nothing is enumerated.

#### One rule for what a tap does

**A tap closes wherever there is no control saying how to close.** Flush, the
picture and the tiles are inert and the × is the way out. Not flush, a finger
tapping anywhere still closes — which is what this surface has always done — and
a cursor still gets the ground for closing and the artwork for magnifying.

Nothing was taken away. The affordance appears exactly where the gesture stops,
so a phone rotating between the two states is telling you which one it is in.

#### Details that are load-bearing

- **The tile is sized from the picture's measured box, not `100%`.** The centre
  tile has to land exactly under the `<img>` or the poster is drawn twice a
  pixel apart and the seam is a bright line across the middle of it. `100%`
  would usually be right; *contained, never enlarged* is what makes "usually"
  not good enough, because a master narrower than the screen renders at its own
  width and `100%` would be wider than the thing it sits under.
- **The tiles are painted only once the picture has loaded**, on a layer that
  fades in with it. A background paints in from the top exactly like an `<img>`
  does — gating one without the other would put the strips straight back into
  the two bands, in the one place nobody would think to look for them.
- **Never tiled while magnified.** A magnified poster is larger than the screen
  and pans; a fixed backdrop behind it would slide under the picture as it
  moves, which reads as the artwork coming apart.
- **The tile layer is `pointer-events-none`** so a tap on a tile is a tap on the
  ground, which keeps the one decision about what a tap does in the one place
  that makes it.
- **The picture needs `relative`.** The tiles are absolutely positioned, and a
  positioned element paints above a static one whatever the document order says.
- **The × is `fixed`, not `absolute`.** The ground becomes a scroll container
  when magnified, and a control that scrolls off the top of the artwork is a
  control that is not there.
- **It carries its own disc.** It sits on artwork nobody has seen, and a bare
  glyph is legible or invisible depending on the film. 44px, matte black at 55%,
  offset by `env(safe-area-inset-top)` so it clears the status bar on an
  installed app.

#### What was considered and not built

**A grid of smaller copies**, and **one poster cropped to fill**. Both were put
to the person who asked; the repeat won. Cropping would have been the smallest
change and it loses artwork off both sides, which is the one thing this screen
exists to show.

**Keeping the ground dismissive as well as the ×.** Belt and braces, and it
would have made the × unfindable: a control nobody needs is a control nobody
learns. If the × turns out to be missed in the hand, the answer is to make it
larger, not to make the whole screen dismiss again.

**A width breakpoint.** It would have been shorter to write and wrong on the
first screen nobody had thought of.

#### Verified

`node_modules/.probe/tiles.mjs`, driven against a production build on four
shapes — a phone upright at 3x, the same phone on its side, a 1440x900 desk, and
a 520x1000 window. Each one tiles or does not as its own shape dictates; where it
tiles, the tile is the picture's measured width, centred, repeating down, from
the same file, faded in with it, and the repeat meets the picture's top edge at
130px on the phone, which is exactly the band. The × is 44x44 in the top right,
tapping the picture and tapping a tile both do nothing, and the × closes.
Where it does not tile there is no × and a tap still closes.

`reveal.mjs` now reads which rule to expect off the layout rather than off the
profile's name, and is all clear on all three profiles; `small.mjs` and
`reveal-nested.mjs` unchanged and clear. Typecheck, lint and the §13 suite pass.

### The surround becomes one thing, in two places (21 August)

Three asks, and they turned out to be one: take the outline off the ×, blur the
tiles the way the panel's backdrop is blurred, and put the same treatment behind
the receded film screen.

#### The disc was the outline

There was no focus ring — checked, because that was the obvious suspect and it
was wrong: `showModal()` leaves focus on the `<dialog>` itself, whose outline
computes to `none`. What read as an outline around the × **was** the ×'s disc,
`bg-black/55` and `rounded-full`, which is a second shape drawn around a mark
that is already a shape.

What the disc was for is still real: this control sits on artwork nobody has
seen, and a bare mark is legible or invisible depending on the film. **A drop
shadow does that job without drawing anything of its own** — it is the mark's
own edge darkened rather than a plate behind it. The 44px hit area stays and is
now invisible, which is the point: a target the thumb finds and the eye does
not.

⚠ The shadow was not asked for. It is there because this project has a standing
rule that legibility must not be a function of which film you tapped — the same
argument that derives the panel's 80% glass. If it reads as too much, the
subtraction is one class.

#### One surround, two rooms

`film-screen.tsx` has filled the room left by the receded poster since 20 August
— on a narrowed desk window — with one cover-scaled copy of the artwork at
`blur-2xl` and 70%. That is the reference. The poster reveal's tiles now carry
**the same two numbers**, and `components/poster-tiles.tsx` holds them once so
the two surfaces are out of focus by the same amount and neither can drift.

And the film screen's own handset surround, which that file's comment described
as *black — the poster centred and deliberately framed*, is now tiled too. That
ruling is reversed here deliberately; the comment has been rewritten rather than
left to contradict the code.

**Why the two surrounds still differ in fill.** It is the shape of the room, not
the machine. A narrowed desk window leaves the poster short of the screen's
height, so there is room to crop *to* and one cover-scaled copy fills it. On a
handset the picture already spans the width: there is nothing to crop to, only
bands to continue into, so the fill has to be the same picture repeating or it
is a second image nobody asked for.

#### What is load-bearing in `PosterTiles`

- **Two elements.** The outer clips; the inner overhangs by `8rem` on every side
  and carries the paint. A blur samples past its element's edges, where there is
  nothing, so an exactly-sized copy fades out at all four sides and reads as a
  vignette — the same reason `film-screen.tsx` gives its `scale-110`. 8rem is
  `blur-2xl`'s own radius three times over, which is where a Gaussian has
  nothing left to give.
- ⚠ **The overhang is symmetric and must stay symmetric.** It is what keeps the
  layer's centre on the clip's centre, which is what keeps the centre tile under
  the sharp poster. `scale-110` would vignette-proof it just as well and is the
  wrong tool: scaling resizes the tiles with it, and the tile size is the one
  thing that has to agree with something else.
- **The overhang is why the clip exists.** Without `overflow-hidden` around it, a
  layer larger than the dialog grows a scrollbar on it.
- **`background-repeat: repeat`, not `repeat-y`.** The tile is the poster's
  width, which is narrower than the overhanging layer, so a vertical-only repeat
  would leave transparent columns for the blur to sample at the left and right
  edges — dimming the bands exactly where they meet the screen.
- **`align` is measured, not assumed.** The poster reveal passes its `<img>`,
  because *contained, never enlarged* means the picture can be narrower than the
  box it is centred in. The film screen passes nothing, because there the
  artwork spans the column by construction.

#### Verified

`tiles.mjs` extended: the layer is out of focus at `blur(40px)` and 70%, the
tile is the picture's measured width, centred, repeating, from the same file —
on a phone upright and a 520x1000 window, and absent on a phone on its side and
at the desk. The × is asserted to have no background, no border, no outline and
no box-shadow, and to keep a drop shadow.

`recede.mjs` is new: it opens a film from the wall and presses the down chevron.
Under a thumb the surround tiles at the column's width, centred, at the same
blur and the same 70%, with the poster whole and centred (measured 390x585 at
top 130 on a 390x844 screen); under a cursor it is still the single cover copy
and no tiles. At rest, before the chevron, the sharp poster covers the column
and the surround is invisible — which is why neither surround needs any state.

`reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and `arrive.mjs` all clear;
typecheck, lint and the §13 suite pass.

⚠ **One unexplained event, recorded rather than dismissed.** A single run of
`reveal-nested.mjs` reported `Minified React error #441` as a page error. Five
subsequent runs of that probe and four of `tiles.mjs` and `recede.mjs` did not
reproduce it, and neither new component is even mounted in that scenario — the
nested case is a 1440x900 pane, where nothing is flush and `touch` is false. It
is noted here so that the next person to see it knows it is the second sighting
and not the first.

### The recede was animating the wrong properties (21 August)

Reported from the handset: press the chevron and the panel drops away, then the
poster follows late and resizes in two stuttering steps; tap the poster and the
panel pops back before the picture has finished. It has to be smooth.

**It was not a tuning problem. The two halves of one gesture were animating
different kinds of property.** The panel moves with a transform, which the
compositor runs on its own thread. The artwork animated `height` and `top`,
which are layout: every frame relaid the box and re-`object-cover`-ed a 2000x3000
master into a different-sized hole. Perceived as lag because half the gesture was
smooth and the other half was not.

#### Measured, twice, because the first measurement was of the wrong thing

`node_modules/.probe/jolt.mjs` samples the box every frame with the CPU
throttled 6x: the poster got **13 frames of a 300ms move with a 57ms gap** in the
middle. Useful, but it cannot prove the diagnosis — its own
`getBoundingClientRect()` every frame is main-thread work, so it competes with
what it measures and partly reports on itself.

`composited.mjs` asks the only question that separates the two mechanisms:
**does the picture keep moving while the main thread is busy?** It presses the
control, waits two frames for React to commit, jams the main thread with a
synchronous loop for 250ms, and counts distinct frames arriving over CDP's
screencast — which is what the compositor put on the glass, not what the page
believes it drew.

| | frames while the main thread was jammed | distinct frames over the whole move |
| --- | --- | --- |
| `height` + `top` | **1** — frozen solid | 4–5 |
| `transform` | 9–16 | 14–20 |

⚠ **That probe was wrong twice before it was right, and both mistakes flattered
the code.** First it blocked in the same task as the click and reported FROZEN
for everything including the panel — React's `setState` is asynchronous, so the
loop ran before the transform was ever written and measured a transition that had
not started. Then it hashed the whole frame and reported *composited* for the old
animation too — the panel is composited beyond suspicion and covers half the
screen, so something moved whatever the picture did. It only discriminates with
the panel made invisible, which is what isolation means here. **A probe that
agrees with you is not evidence until it can also disagree**: the control run
against the old code is what makes the table above worth reading.

#### The shape of the fix

The box no longer changes size. It is laid out once at the **resting** geometry
and scaled *down* to recede.

That direction is deliberate. The other way round was available — lay out at the
receded size and scale up — and it would leave the state you are looking at
almost all of the time rasterised for a smaller box. At rest the transform is now
`none`, so the picture is drawn at its own layout scale and nothing is resampled
at all.

⚠ **It is JavaScript rather than `cqw` because the geometry is a ratio of two
measured lengths, and CSS cannot express one.** A scale is a number, and `calc()`
cannot divide a length by a length to produce a number. Everything else is still
arithmetic and none of it is a chosen number: the resting box is the poster at
cover size — `max` of the two axes, so it is right upright and on its side — and
receding scales it to the column's width, which is what *whole* means here. The
transform is written through the CSSOM, which the CSP permits; the ban is on the
`style` attribute.

⚠ **A `ResizeObserver`, and a `window` resize listener will not do.** The first
version measured on mount and listened for resizes, and measured **zero** — this
screen is a `<dialog>` its own effect opens a tick later, and until it does the
column is `display: none` with no size at all. Nothing resizes the window when a
dialog opens, so nothing would have corrected it; it happened to be re-measured
by an unrelated re-render, which is luck and not a mechanism. The observer asks
the question the code actually has — *what size is this box now* — and answers it
on the first layout, on the dialog opening and on a rotation, without naming any
of the three.

#### Verified

The geometry is unchanged, which is the claim that matters most: `recede.mjs`
measures the receded poster at **390x585 at top 130** on a 390x844 screen, the
same numbers the old `calc(50% - 75cqw)` and `150cqw` produced, and the resting
screenshot is unchanged. Both orientations were checked against the old
expressions before they were deleted.

`tiles.mjs`, `reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and `arrive.mjs` all
clear; typecheck, lint and the §13 suite pass.

### The film screen stops being rebuilt every time (21 August)

Two changes, both aimed at the part of the pathway that is not an animation: the
time between tapping a poster on the wall and the screen being there. The
backdrop blur stays — its cost while sliding is real (~50ms of worst-case gap,
measured) but it is not what this is about, and its recipe is derived.

#### The poster starts on the tap, not on the mount

`Artwork` asks for its file in a `useEffect`, so the fetch waits for React to
mount the whole film screen first. `capture-provider.tsx` knows which film was
chosen a render and a commit earlier, and on a handset that file is `original` —
0.8–1.9MB. `choose` and `present` now start it.

⚠ **On the click, not on `pointerdown`.** `lib/posters.ts` records that these
bytes are spent on a deliberate tap, and on the wall a press is how *scrolling*
starts — warming there would spend a megabyte on every flick past a poster. This
is the same rule `PosterReveal` follows and the opposite conclusion, because the
surfaces differ: a title in a list is not scrolled by pressing it.

⚠ **The rung comes from `filmPoster`, exported from `film-screen.tsx` and called
by both.** A copy of `overlay && touch ? 'original' : 'w780'` in the provider
would be free to drift, and the drift shows as either a wasted megabyte or a soft
poster — neither of which announces itself. The media queries are read
imperatively rather than through their hooks: subscribing in the provider would
re-render every route in the app on a breakpoint change.

#### Mounted is no longer the same as open

`chosen` used to be cleared on close, which unmounted the screen: every open then
rebuilt the tree, re-rastered two blurs and re-decoded a poster. Measured on a
throttled phone profile, tap → a picture on screen: **237ms, then 140ms, then
92ms.** The screen was throwing that warmth away on every close.

It stays mounted now, with an `open` prop saying whether it is showing.

⚠ **Four things read *mounted* and meant *open*, and every one of them is a bug
that would not have looked like this change:**

- **The scroll lock**, which pins `body` behind the takeover. Left on after a
  close, the wall is dead and the bug looks like the wall's.
- **The Escape listener**, which the panel adds because `show()` gets no
  dismissal from the platform. Left attached, a key pressed anywhere in the app
  closes a screen that is not there.
- **The recede.** Unmounting used to forget it; without a reset the next film
  opens with its words already pushed off the bottom. It resets in the `close`
  handler rather than an effect on `open` — that is the event that *means* it,
  and the reopening case returns before it, which is right, because a mode
  switch is not a close.
- ⚠ **The close itself, which is the one the probe caught.** The takeover is
  modal and the platform dismisses it, so `open` goes false as a *consequence*
  of the dialog closing. The panel is `show()`, which the platform never
  dismisses — `onClose` closed it by unmounting it. With nothing unmounting, the
  desk panel stayed on screen with `open` false: the whole feature failing, in
  the one mode where it is least visible. The effect closes it now, flagged as
  ours so the `close` it fires is not read as a person's.

#### What it bought, honestly

Measured at 4x CPU throttle, and **the single-run variance on these is ±60ms**,
which is larger than most of the differences:

| step | before | after |
| --- | --- | --- |
| tap a poster on the wall | 402ms worst gap, 666ms settled | 350ms, 662ms |
| tap the chevron | 119ms, 382ms | 175ms, 422ms |
| tap the poster (words back) | 62ms, 388ms | 53ms, 372ms |
| tap the poster (the wall) | 113ms, 126ms | **77ms, 90ms** |

The close is the one clear win — there is no teardown any more. Reopening moved
from 140/92ms to 128/79ms for the second and third opens. The chevron's apparent
regression is inside the noise; its median across seven runs is ~42ms.

**So this is a modest change and it should be recorded as one.** The decay from
237 to 92ms turned out to be mostly JIT and raster warmth rather than the mount,
which is not what the mount hypothesis predicted, and the honest reading is that
the second point in that series was never worth much.

#### What was measured and not built

**`will-change: transform` on the artwork**, and **`translateZ(0)` on the tiles.**
Both were tried and both measured, median of seven, at 4x throttle:

| | recede worst gap | back |
| --- | --- | --- |
| as shipped | 42ms | 30ms |
| tiles cached | 37ms | 31ms |
| artwork promoted | 45ms | **47ms** |
| both | 46ms | 37ms |

`will-change` makes it *worse*; the tiles cache is inside the noise. Neither was
applied — a class that does not help is just a class.

**Turning the backdrop filter off while the panel is in motion.** Held at the
author's request, not rejected. It is the largest remaining lever (109ms → 60ms
on the recede, 51 → 35 on the way back) and the open question is whether the flip
is visible: `bg-bg/80` means only 20% of the blurred image shows through, so it
may not be, but that has to be seen before it is relied on.

#### Verified

`mounted.mjs` is new and covers the four hazards above on both surfaces: closing
closes, the screen stays mounted, the document is unlocked, Escape reaches
nothing, it reopens, and it reopens with the words up. It caught the panel bug.

`recede.mjs`, `tiles.mjs`, `reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and
`arrive.mjs` all clear; typecheck, lint and the §13 suite pass.

### The white ring around the × (21 August)

Reported as a shadow around the ×. It was not: the drop shadow is half a pixel
of black. It was a **focus ring** — `outline: solid 2px` in `--color-text`, drawn
by the browser because `showModal()` had focused the ×.

⚠ **It appeared only sometimes, and the "sometimes" is the interesting part.** A
`<dialog>` focuses its first focusable descendant, or itself if it has none. The
× exists only when `flush` is true, and `flush` is not known until the artwork's
shape is — so opening a poster for the first time landed focus on the dialog, and
opening one already in the cache landed it on the ×. **The same code produced two
behaviours, decided by whether a file had been fetched before.** That is the kind
of difference that reads as random and gets chased as a rendering fault.

Focusing the dialog outright removes it: the focus target stops depending on what
had mounted by the time the screen opened.

⚠ **`outline-none` on the dialog is the other half, and without it the fix is
worse than the fault** — taking the ring off the × by focusing the dialog just
draws it around the dialog, which is the whole screen. A ring belongs on
something you can Tab to; this is focused programmatically and is not in the tab
order.

Nothing is taken from a keyboard. Measured on both surfaces, opened by tap, by
keyboard and by mouse: focus lands on the dialog every time with no ring, and one
Tab reaches the × with `solid 2px` — which is correct, because that is what a
ring is for.

### Crossed off is inert, and the ring hugs the mark (21 August)

**A struck title no longer answers a tap.** It was a button that merely stopped
advertising itself, on the reasoning that a crossed-off film is `dropped` rather
than deleted (§5) and its artwork is still its artwork. Directed otherwise.

⚠ **A `span`, not a disabled button, and not the children handed back bare.**
The strikethrough is drawn by `PosterReveal` — that is the whole reason `struck`
is a prop rather than a class from the caller — so returning `<>{children}</>`
would take the crossing-off with it and a dropped row would read as live. A
disabled button would keep the decoration and still be a control: announced,
tab-reachable, and doing nothing. There is no control there any more, so there
should be no element claiming to be one. `struck.mjs` checks both halves, and
that restoring the row makes it a button again.

**The focus ring around the × is smaller, and it is smaller by construction.**
The button was `size-11` — 44px of box around a 20px glyph — and a ring traces
the box, so a keyboard drew a rounded square twice the size of the thing it
pointed at. The alternative was a negative outline offset: a number tuned against
one glyph at one size, wrong the moment either changed.

Instead the element is the size of the mark and `tap-target` gives the hit area
back — the app's own utility for exactly this, used the same way by the resolve
flow: a transparent 44px pseudo-element under a coarse pointer. The ring hugs the
mark, and the target is still 44px where a target matters. The position moved
from `right-3`/`top-…+0.75rem` to `right-6`/`+1.5rem` so the *mark* stays where
it was rather than the box.

⚠ **The probe had to stop measuring the box.** `boundingBox()` reports the
element, which is now 20px, and would call a perfectly good target a failure.
`tiles.mjs` hit-tests four corners at ±21px through `elementFromPoint` instead,
which is the question that was always meant.

#### The ring at 32px, one pixel thick (21 August)

Directed. The box is what a focus ring traces, so the box is the size the ring
should be: 32px, which sits it 6px clear of a 20px mark on every side. 32 is
under 44, so `tap-target` still carries the thumb.

⚠ **The insets are derived from the box rather than chosen.** The mark has sat
34px in from the top-safe and right edges since it was a 44px box at 12px, and
`34 − 16` is what keeps it there at 32. Change the size and that number changes
with it — it is arithmetic, not a position.

⚠ **The width was written as 1.5px and Chromium reported 1.** It floors
sub-pixel outline widths, at 3x as well as at 1x, so this is not device-pixel
rounding — 1.5 would have drawn as 1 there and as 1.5 in Safari. A hairline is
the one thing that cannot afford to differ by engine, so it is written as 1px:
what it actually draws.

And `focus-visible:outline-solid` rather than `focus-visible:outline`, because
the latter sets a width of its own and quietly won.

#### The tiles appeared seemingly at random (21 August)

Reported: the blurred bands are missing on the handset, and when they do appear
they appear at random. They were not random. `flush` was set in one place —
`reconsider`, which runs from the image’s `load` event and from a resize — and
**a cached image fires no `load`**: the element is already `complete` before
React attaches a handler. So a film opened for the first time tiled and the same
film opened again did not.

⚠ **The same shape of fault as the ring around the ×, in the same file, on the
same day.** Both were state that only a late event could set, describing
something knowable at the tap: this screen’s shape is the viewport’s shape, and
the viewport is right there. It is now decided in `choose`, beside the rung,
and `load` still refines it with the artwork’s true aspect rather than being
the only source of an answer.

⚠ **The probe could not have caught it**, and that is the more useful lesson.
`tiles.mjs` opened each poster once, from cold, in a fresh context — a cache
state the app almost never meets in use. It now opens the same poster twice and
asserts the two agree, which is the assertion that would have failed on the
shipped build.

## Phase 1: the page and Return — 23 August

The landing screen is the record now: a blank page you type down, one line per
capture, Return committing the line and dropping to a fresh one. The design is
`docs/re-direction/phase-1-capture.md` and the artboards in `design/`; this
records the calls that document did not make, and the two it made that were
narrowed.

**Scope, as instructed: the page and Return. No schema, no images, no
suggestions.** What that ruled out, and what it cost, is below.

### The stored state values did not move, and the words did

The specification's table renames `want` to `active` and `go_back_to` to
`again`. Those are Postgres enum values with every row in the product behind
them, so renaming them is a migration and this phase is schema-free by
instruction. **`STATE_WORD` in `lib/vocabulary.ts` is the words; the identifiers
follow in the migration.**

⚠ **`PUBLIC_STATES` was not touched, which is the point of saying so.** The
specification warns that renaming its members in place without re-reading the
array against the new set is the one edit in this phase that can leak somebody's
private rows. Nothing here renames anything, so the array is the one it was.

### Settle asks one question, and the word is *Again?*

The design's foot has one settle glyph and no question drawn. `resolveCapture`
needs an answer, because the two outcomes are different claims — *I would do
this again* against *that is dealt with* — and nothing about a raw capture can
supply one: `specFor` needs a type and an intention, which is exactly the empty
case this phase had to answer for.

Three options, and the argument for the one taken:

- **Everything settles to `done`.** Simplest, and it retires `go_back_to`
  quietly — which retires *Again*, which is the app's name and, in the
  specification's own words, "the argument".
- **Everything settles to `go_back_to`.** Asserts something nobody said.
- **Ask.** One word, two answers, and the word generalises where the film-first
  *Go back?* did not — a film you would watch again, a place you would go again,
  a class you would take again.

So the picked line opens a Yes/No pair, which is the pair `LineStates` already
draws for the resolution offer. It costs one tap on an action that is not on the
four-second path.

⚠ **Nothing lands in `fixture` — *Have* — any more.** That distinction is
`landsIn`, which is a property of a kind and an intention, and a raw capture has
neither. The tray shows the word for rows that already carry the state; nothing
new reaches it until types and intentions do.

### The camera and search ship off

Both are in the foot, at full shape, dimmed at every state — including the
camera, which the design's table has lit on an empty page.

That is scope rather than a change of mind. Images are a storage layer, not a
button: §6 wants object storage outside Postgres, size and type limits, EXIF
stripping, an access-controlled media path, retained provenance, and reportable
removable assets. Search over captures is a surface of its own, and the search
that exists today searches TMDB rather than the page.

⚠ **This is the design's own device being honest, not a deviation from it.** The
whole of "controls go off; they do not disappear" is that a bar keeps its shape
and dims what cannot act — and neither of these can act. The table in the
specification is what they go back to, and each is one prop away.

### Return does not wait, and nothing calls `refresh()`

`app/actions/captures.ts` is the first action file in the app that does not
refresh the router, and the omission is the feature. A refresh per Return puts a
server round trip between somebody and their next word, and then tells the page
its own list a second time — a flicker on a screen whose promise is that it
behaves like paper.

**So the client owns the list for the length of the session and the server is
the seed.** There is exactly one list on screen and no reconciliation, which is
also why cross off, settle and undo are optimistic and revert on failure rather
than waiting on success.

Measured on the desk against `next start`, first key to the line being on the
page: **34–152ms across nine captures**, which is the render and not the
network — the save is still in flight when the line lands.

⚠ **A line in flight looks exactly like a line that landed.** It was dimmed to
`opacity-40` for one pass and measured wrong: Server Actions queue per client,
so fourteen Returns left the last six pale for a second or two — the app
doubting lines it had already promised. Failure is worth saying, and is said on
the line it happened to; anything short of that is the app narrating its own
network.

### The stable client mutation id, and where `randomUUID` is not

§13's exit criterion. Phase 0 could not ship it: its idempotency was the unique
key on (user, possibility, intent), and **a raw capture has no such key** — two
captures of the same words are legitimately two captures. The id is minted once
per line, held with the line, and re-sent unchanged by a retry.

It costs no column. `captures.client_mutation_id` and its unique key have been
in the schema since Phase 0, waiting for a writer.

⚠ **`crypto.randomUUID()` is gated on a secure context, and the place it is
missing is exactly where this gets tested.** It exists on https and on localhost
and is `undefined` on `http://192.168.x.x` — which is how a handset reaches a
`next start` running on the desk. `lib/mutation-id.ts` assembles the UUID from
`crypto.getRandomValues`, which carries no such gate, and uses the native call
when it is there. Verified: v4 shape, 20 000 unique, accepted by
`z.string().uuid()`.

### The day stamps are computed on the server, and only there

Grouping by day depends on a timezone. The server's is UTC on Vercel and the
handset's is not, so a page that formatted on both sides would disagree about
**how many groups there are** for anything written after 23:00 local — a
structural hydration mismatch, in a list, which is the shape React cannot patch
quietly.

So `lib/day.ts` runs server-side only and stamps every line with the two strings
the page needs, and the client is handed `todayKey` for the one line it creates
itself. The zone comes from `x-vercel-ip-timezone` (`viewerTimeZone` in
`lib/region.ts`), validated because it is handed to `Intl`, which throws
`RangeError` on an unknown zone and would take the page down with it.

⚠ **Absent in development**, where no edge sets it — so `Intl` falls back to the
machine's own zone, which on a laptop is the right answer anyway. The failure
this arrangement cannot see is therefore production-only.

### The second tap does not edit yet — superseded 24 August

The design says tap picks and a second tap edits, and leaves *where* that edit
happens — in place or in a detail view — explicitly open. A second tap therefore
holds the pick rather than teaching a gesture that has to be taken back.
Unpicking is a tap on the page, which is also how you get back to writing.

It also needs a mutation that does not exist: `setCaptureNote` writes the note,
not the text.

⚠ **Both halves of this are now false and it is kept for the question it left
open.** `setCaptureText` exists, and *where* the edit happens was answered twice
in two days — in place, then in the band. See *The rewrite happens in the band*
below.

⚠ **The heading came true again on 25 August, for a different reason.** The
second tap does not edit — not because the mutation is missing but because the
foot carries a pencil, and one act does not get two doors. See *The second tap
stops editing, because the pencil is a door*.

### `--color-caret` is deleted, by its own terms

Its note said: *if it is ever used for anything other than the caret, delete it
instead*, on the reasoning that a third meaningful colour is only defensible for
a claim the other two cannot make. The page colours the chrome brass — bar,
foot, caret, and the mark on a picked line — so the caret is the accent now and
teal makes no claim any more.

⚠ **That brass spends `--color-accent`, which §11 reserves for overlap.** The
cost was stated in the design and is restated here because it is the one place
Phase 1 breaks a rule in CLAUDE.md rather than extending it. **Overlap needs a
different colour in Phase 2**, and the ladder back is §11's own argument: the
accent's job is to interrupt, so its replacement has to out-shout brass on a
screen that is now full of it.

### The tray is one surface, and it has no foot

`/settled` holds *Again*, *Have* and *Done* in one list, each row carrying its
own word. Whether they want a surface each is still open in the specification;
one here means splitting it later is a routing change and nothing that reads
`WHERE_IT_IS` moves.

⚠ **No foot on it.** The foot's four controls act on the line the caret is on,
and nothing in the tray is live. Bringing a settled capture back is not built,
and until it is, the honest surface is a list rather than a row of controls that
do nothing.

### The bar spans the window; the foot holds the measure

Above `rail` they part company, and the artboards draw it: the bar is page-level
machinery and sits on the window's own edges, while the foot's glyphs act on the
column of text and stay over it rather than being stranded at the window's
corners. Below `rail` the two coincide, because the measure is wider than the
screen.

`--bar-gutter` is a token rather than a `gutter` plus a `rail:px-8`, because two
declarations of one property at equal specificity are resolved by their order in
the compiled sheet and a class attribute has no way to state that order — the
same reason `foot-collections` and `foot-bare` are in CSS.

### What survived that the specification says should die

**`toLegacyEntryCards` is still here, and still drops every capture with no
possibility.** Its remaining caller is `/u/[handle]`, the Phase 2 shared page,
which renders `EntryCard`. Rewriting that surface for captures is Phase 2's
work, not this instruction's.

⚠ **The risk it carries is contained rather than removed.** A raw capture on
somebody's shared page would silently not appear. Nothing in Phase 1 shares a
capture — every capture in production is private and this phase exposes no
control that changes it — so the exposure is zero today and becomes real the
moment sharing does. The specification's rule stands: **nothing may add a
caller**, and the read to replace it is `toCaptureCard`, which already exists
and carries text.

`film-screen.tsx`, `poster.tsx`, `search-field.tsx`, `search-provider.tsx` and
`capture-provider.tsx` are on disk and mounted by nothing. The specification
keeps the film screen deliberately, as the media-resolved detail surface; the
rest come back when resolution offers and capture search do. Nothing imports
them, so nothing ships them.

### What went

`components/shell.tsx` (2 989 lines), `cinema-wall.tsx`, `poster-wall.tsx`,
`entry-list.tsx`, `entry-row.tsx`, `icon-home.tsx`, the four collection routes,
`V1_KINDS`, `COLLECTION_FOR` and `--color-caret`. `/me` still translates the old
`?view=` parameter, now onto the page and the tray.

`useKeyboardPin` was extracted from the shell to `components/keyboard-pin.ts`
and reduced from two docks to one: the shell chose between a phone bar and a
rail dock by asking the DOM which was laid out, and the page has the same foot
at every width. The thermostat, the anchors and the frame loop are unchanged —
they are the record of five wrong versions and none of that reasoning changed.

### Measured, and what is not

At 390×844 against `next start`: bar 46px, foot 68px, **every line exactly 44px
whether or not it carries a year**, live line 44px, and the page and foot boxes
meeting at 0.1px of clearance at maximum scroll — which is right, because the
foot's own 26px of top padding is the air.

At 1440: the column 680px centred, the foot 72px, the bar full width.

⚠ **The year needed `leading-none` to hold 44px.** A 13px span inheriting the
line's 28px line-height gets its own half-leading — (28 − 15.6)/2 against the
18px strut's (28 − 21.6)/2 — so its inline box hung about 2px below the strut
and grew the line box under it. Resolved lines measured 46px beside raw ones at
44 until it was pinned. **One line is one line** is a measurement, not a
sentiment.

⚠ **Nothing here is measured on hardware, and two things can only be measured
there.** The keyboard pin has no keyboard to hold in a desktop Chromium, and the
four-second capture is a claim about a thumb. Both are the next thing.

⚠ **The keyboard cannot be raised on a cold open on iOS**, and no arrangement of
this code changes it: focus without a gesture does not open a keyboard there.
`autoFocus` is on the field and answers the desk; what answers the handset is
the filler under the live line — **a tap anywhere on the page starts writing**,
so the gesture iOS insists on is the one somebody was going to make anyway.

⚠ **Both paragraphs above were superseded the same day** — see *The handset
answered, and reversed two decisions* below. The live line is no longer at the
bottom, so the keyboard has nothing to cover; and the filler is no longer what
answers the cold open, because the paper of every row does. They are kept
because the reasoning that produced them is what the reversal had to argue
against.

### The chrome stops borrowing the colour that means overlap (23 August)

The muted brass read as correct and not as present on a handset, and the chrome
is what a thumb aims at. Directed: *more in your face.*

The obvious move was to brighten `--color-accent`, and it was wrong. The chrome
was already spending that token, which is the one place this build broke a rule
in `CLAUDE.md` rather than extending it — §11 gives brass to overlap and nothing
else. Brightening it would have deepened the deviation and dragged Phase 3's
convergence mark along with it, because the two would still have been one value.

So the token was split instead. `--color-chrome` is `#e8b34a` — the same hue
carried up in lightness and chroma, not a new colour, so the page stays one warm
family and only the controls gain voice. It takes the mark, the live glyphs in
both bars, the caret and the mark on a picked line. `--color-accent` keeps
`#b49a62` and is now used by **nothing**, which is what §11 always asked of it.

That is the ladder in `CLAUDE.md` taken in order: the collision was removed
rather than corrected for.

**Measured.** 10.98:1 against the true-black ground, against the muted brass's
7.73:1 — about half again the luminance. Past the 3:1 WCAG 1.4.11 asks of a
graphical control, and past 4.5:1 for the mark, which is text. The off state is
untouched at `--color-text` 28%, so the gap between a live glyph and a dead one
widened for free.

**The mark moved too, and that was not asked for.** Leaving the wordmark at the
muted value while the glyphs beside it got louder would have read as a bug on
the same bar. The chrome is one thing.

⚠ **This does not make Phase 2 easier, and the note on the token says so.**
Overlap still needs a colour that out-shouts a brass screen, and the screen is
louder than it was. The candidate to beat is `--color-chrome`, not the muted
brass sitting beside it in the palette.

### The handset answered, and reversed two decisions (23 August)

The page was opened on a handset and it works. Two things came out of the first
real use of it, and both reverse a decision made on a desk.

#### The newest line is the first one

The read always ran newest-first; `app/(app)/page.tsx` reversed it so the page
could be written downward like a notebook. It is not reversed any more.

This is the third position the design has held. An early draft of
`docs/re-direction/phase-1-capture.md` specified newest-first; it was reversed to
*oldest at the top* on the reasoning that you do not write a note upwards. That
is true of a note, and it turned out not to be the point.

Two things a desk could not produce argued it back:

1. **What you just wrote is on screen without a scroll.** Under written order the
   newest line was at the end of the document, which is why arrival needed a
   `useLayoutEffect` scroll-to-end before paint and every Return needed another
   scroll behind it.
2. **A caret pinned under the bar cannot be covered by a keyboard.** The keyboard
   rises from the bottom of the glass. This is the one that decided it: it does
   not solve the problem, it deletes the condition — the order `CLAUDE.md` asks
   for, and a subtraction cannot be wrong on a device nobody has tested.

Three mechanisms went with the order rather than being adjusted to it: the
layout scroll before paint, the `requestAnimationFrame` scroll after each Return,
and the scroll-to-end helper itself. What is left is one call to the top of the
page, and it exists for a case the old order did not have — see below.

**What it cost.** The page metaphor, and it is a real cost: you no longer type
down a page. The document that specified writing downward now carries the loop
in full rather than quietly agreeing with the code.

#### The words are the record, the paper is the page

A line's hit area was the whole row, so a tap on a line always meant *pick*. The
only place a tap could start writing was the filler at the end of the page —
`grow` inside the page's minimum height, with no minimum of its own. That
resolves to **zero** the moment the lines fill the viewport. The write target
disappeared exactly when the record got long enough to need one, and every pixel
on screen became a line.

A line is now as wide as its own words, and the rest of the row is a second
button that starts a capture. One rule with no modifier and no hidden gesture:
tap the words to pick the line, tap the paper to write. On a 390 screen a short
capture leaves about 275px of a 350px row as paper; on the desk, 565 of 640.

**Why not a guaranteed band instead.** The first proposal was to give the filler
a real minimum so it could never collapse. It was the right answer to the old
layout and the wrong one to the new: with the caret at the top, a band at the end
of the document is at the far end of the record from the place writing happens.
It would also have been a second mechanism doing the paper's job — a corrector
posted next to the collision rather than the collision removed.

**Scroll first, then focus.** A tap on the paper can land anywhere in the record,
and the caret is at the top. Focusing an off-screen input hands the scrolling to
the browser, which on iOS does it again when the keyboard comes up, and with a
fixed bar overhead either pass can leave the caret underneath it. Arriving at the
caret *before* focusing leaves nothing to scroll into view, which removes the
race rather than timing against it. Verified: scrolled 1810px down a record,
tapped paper beside a line, and the page came back to `scrollY 0` with the
textarea focused, the caret at 66px against a bar ending at 46px, and nothing
picked.

⚠ **A line that wraps to the full measure leaves no paper**, and that is accepted
rather than corrected. The alternative is `display: inline` on a button, so
hit-testing follows the text fragments rather than one box — which renders
differently on every engine, and a workaround written for one engine still
executes on all of them. Captures are short; a screen on which no row has paper
is not a screen this record produces.

⚠ **The paper is hidden from the accessibility tree**, `aria-hidden` and out of
the tab order. It is a pointer convenience for a rule the pointer can see and the
tree cannot: a record of two hundred lines would announce "Write" two hundred
times. The named Write button at the tail of the page is kept and is the only one
of the page's write targets that is reachable and announced — which is now the
reason it exists at all.

⚠ **A tap just right of a short word writes instead of picking.** Recoverable in
one tap, and so is the reverse. Neither destroys anything, which is what made the
trade acceptable.

### The rewrite happens in the band, and the second field is deleted (24 August)

In-place editing shipped and a handset reported the page moving under it: the
band descending far enough to cover entries, and the bar receding with no scroll
to explain it. The register's hypothesis named the right suspect —
`useKeyboardHem` had been widened to `writing || editing !== null` the same day —
and the diagnosis is one sentence longer than that.

**Every instrument on the capture page is built on one premise: there is one
field and it is pinned.** A field in normal flow breaks it three ways at once.
iOS over-scrolls the layout viewport to reveal a focused in-flow field, so
`useChromeRecede` — which watches a mark in that document — reads a keyboard's
arithmetic as a reader scrolling. The band's thermostat then puts the band on the
*visible* top edge, which with the layout viewport over-scrolled is well down the
glass and on top of the record. And a keyboard can cover a line in flow, which is
the exact defect pinning the live line was built to remove.

**Correcting each is three corrections and a race.** The over-scroll unwinds
while the keyboard closes, so the instant a line is let go the observers
reconnect and read a position that is about to stop being true. There is no
threshold that survives that; it is the same shape as the flicker
`chrome-recede.ts` records, where the false movement is as large as the real one.

**So the second field is deleted and the rewrite happens in the pinned band.**
Both hooks go back to exactly what they were before the feature existed, and the
widened flag has nothing left to widen. `CLAUDE.md`: remove the condition rather
than correct for it — a subtraction cannot be wrong on a device nobody has
tested, and this one is not tested on a handset yet.

⚠ **It does not reopen *a record is not a text buffer*; it closes it harder.** No
line of the record is ever an input now, not even briefly. The question the
design left open was *in place or in a detail view* — the answer is neither, and
nothing navigates. The band is the page's one writing line and always was.

⚠ **`draft` and `editDraft` were already separate state, which is why this costs
nothing.** The field renders one or the other. There is no stash and nothing to
keep in sync: a half-typed capture is simply not on screen while a line is open,
and it is handed back untouched.

⚠ **The pick survives an open rewrite, so `onFocus` stopped clearing it — the
fifth thing on this page to come off focus.** The field carries `autoFocus`, so
focus is the resting state of the page rather than an event; and now that a
rewrite focuses the field *on purpose*, a pick cleared by focus would throw away
the line whose words are in it. The two gestures that mean *I am starting a new
capture* carry that job instead.

**What was considered and rejected:** `focus({ preventScroll: true })` on the
in-flow field. It only suppresses the scroll the focus call makes; iOS still
scrolls when the keyboard rises over the field, which is the case that matters.
It corrects rather than removes, and it leaves the keyboard able to cover the
line being written.

### Rewriting gets a glyph, because the question was consistency (24 August)

*How would anybody know a second tap edits?* Nothing on the page said so, and a
legend, an icon with copy and a hint are all ruled out on this screen — which is
what made it look like a hard question. It was not. **Cross off and settle are
controls in the foot and rewriting was a secret, when all three are the same kind
of thing: something you do to the line you have picked.** The inconsistency was
the discoverability problem, so rewrite joins them as a fifth glyph and the
second tap survives as the accelerator.

⚠ **That last clause is reversed on 25 August** — see *The second tap stops
editing, because the pencil is a door*. The glyph stands; the accelerator does
not, on this entry's own consistency argument.

It goes third rather than first: cross off and settle keep the slots they have
had since the foot existed — muscle memory is not worth a tidier reading order —
and the split that falls out is the honest one, the three that can act and then
the two that are not built.

⚠ **A drawn caret at the end of the picked line was the other candidate, and it
is rejected on its own terms.** The page has taught that a caret means *writing
happens here*; on a picked line the next keystroke does not go there, because it
takes another tap. A caret that lies about where typing goes is worse than none.

⚠ **The pencil goes dark while a line is open.** Re-opening would replace what is
in the field with what is saved — a discard nobody asked for — and a control that
cannot act goes off, which is the rule the camera and search already follow.

### A line is editable, and the argument is not "the design said so" (24 August)

The design always said a second tap edits, and the handset reopened whether that
was right. ⚠ **The gesture is gone since 25 August and this conclusion is not** —
what is argued here is that a line is editable, never that a tap is how. It is,
and for reasons that do not depend on the design saying it: a
capture is one line typed fast and one-handed with autocorrect on, so typos are
certain; §5.1's ten-second undo already concedes exactly that at creation and
leaves a typo found later with no repair at all; and *Resolution offers* matches
capture **text** against a provider, so a mangled line can never resolve. Not
editable means a permanently wrong record.

⚠ **This does not weaken *nothing is ever deleted*.** A rewrite changes words. The
× is still the only way a capture leaves the live view, and it crosses off rather
than removing.

### The four-second capture is closed, and was never measured (24 August)

Closed at the user's direction. **Accepted and measured are different claims and
only the first is true** — the screen was used on hardware and judged good, and
nobody has stopwatched it. The reasoning for wanting the number stays in the
register under *What hardware answered*, unchanged, because anyone reopening
Phase 1's acceptance starts there rather than from the line that closed it.

### *Earlier* is a cursor, because the record has a live head (24 August)

The register predicted "one more `offset` and no new read". An offset is the
wrong instrument here and the reason is specific to this page: `offset: 50` means
*skip fifty rows as they are ordered now*, and this record's head moves while you
look at it. Every capture typed since the page loaded pushes one seeded line back
into the next slice, so *Earlier* would hand back lines already on screen;
crossing a line off does the same in the other direction.

A cursor names a place instead of counting to it, and an insertion at the head
cannot move a place. It is the `(created_at, id)` pair the ordering already
tie-breaks on, so the predicate and the sort cannot disagree about where a slice
ends. It is opaque to the client, which passes it back and never reads it, and a
malformed one reads the first page rather than throwing — a cursor arrives from a
client, so it is input.

**One row past the slice answers *is there more*** with no count and no second
query, and `null` is the only thing that makes the tail control exist.

⚠ **It is the one place on the capture page that waits.** Every mutation there is
optimistic and sends behind the screen; a read has no result until the server
answers.

### The word *Earlier*, on a page that refuses copy (24 August)

Everywhere else the page refuses copy because a gesture already carries the
meaning: the caret is the instruction, italic is the state, the mark is the pick,
and the empty page says nothing on purpose. At the end of fifty lines there is no
gesture that says *there is more* — scrolling has already stopped. So a door has
to be drawn, and the smallest honest door is the word for what is behind it.

Set in the day stamps' mono, because it is the same furniture rather than a
fourth use of a scarce face: the stamps are how the record is navigated by
*roughly when*, and this reaches the days below the ones on screen.

⚠ **The box is the target, and that is not a detail.** It shipped as a bare word
with `tap-target`, whose 44px pseudo-element is centred on the text — so half of
it hung below the word, and at the bottom of a scroll that half is under the
foot. Measured: the word's box ended at 799.9 and the foot began at 800.
`page-hem` reserves the foot's height so a *line* comes to rest above the glyphs,
and a line is 44px because `page-line` gives it a hem. A 14px word needs the same
thing said its own way — a box a thumb's height with the word centred in it —
and then the page's existing arrangement holds it clear with no special case.

### Search is a surface, not a filter (24 August)

The foot's magnifier now goes somewhere: `/search`, reading across **live,
crossed-off and settled** captures. That union is why it cannot be a filter over
anything already on screen — the page's list is `PAGE_STATES` and the tray's is
the settled three — and it is not a preference: a line you are trying to find
again is usually one you already dealt with, which is the case the surface exists
for.

⚠ **`done` is private (§5.3) and it is in this read.** Safe for exactly one
reason: `searchMyCaptures` filters on the session user. Nothing derived from it
may be handed to anybody else; there is no shared search and adding one is not a
parameter on that function.

**The normalising rule is written once.** `normalised()` in `schema.ts` generates
`normalised_text` and is applied to the query string in SQL on its way in. A
TypeScript copy of it would be exactly the drift the generated column exists to
prevent — rows normalised by one rule, queries written in another, matches
quietly not happening, and no symptom. ⚠ The extraction produced **no migration**:
`db:generate` reports the DDL unchanged, so Phase 1 still carries none.

**A substring match**, not a prefix and not full text. People remember a word
from the middle of a line as readily as the first, so `LIKE 'q%'` answers the
wrong question; Postgres full-text brings stemming and a dictionary, which are
language choices this product has not made and which mis-serve every capture
written in a script the dictionary does not cover.

⚠ **Punctuation alone must not mean everything.** Normalising a query of pure
punctuation gives the empty string and `LIKE '%%'` matches every row. The guard
is a deliberately loose *is there a letter or a digit in this at all* — not a
second copy of the rule, because the whole point is that there is one copy and it
is in SQL.

**Nothing on the surface acts on a line.** No pick, no ×, no settle: a result is
a line seen from somewhere else, and a surface that could act on it would need
the foot, the undo window and the page's whole state machine carried into a
second place. What a found line does next is a decision this does not have to
make to be useful.

**Typed, not submitted, and Return does nothing.** On the capture page Return
commits a line; a key that means two things across two screens is how somebody
files a search query as a want. The answer is held together with the question it
answers — one piece of state carrying `{ q, lines, earlier }`, compared against
the field — so a list can never appear under a query it does not belong to.
Clearing the results from an effect was written first and removed: it is a second
writer racing the one that fills them, and comparing is free where clearing has
to be timed.

⚠ **`type="text"`, not `type="search"`.** The engine paints its own clear button
inside a search field, and on a matte black page that is a bright blue × — the
browser talking in a palette §11 does not have. Seen on screen. Hiding it with
`::-webkit-search-cancel-button` corrects for one engine's decoration on every
engine; removing the type removes it, and `role="searchbox"`, `inputMode` and
`enterKeyHint` carry everything the type was doing.

⚠ **The magnifier is the foot's one link, so it is an `<a>`.** Everything else
there acts on the line in hand; this goes somewhere, and a button with a
`router.push` looks identical while losing the middle-click, the long press and
the back button. Its off state is a `<span>`, because there is no disabled state
for a link.

**The foot's table deviates in row two.** The design lights search while a line is
being typed with nothing saved. It is lit here whenever there is a record and
dark when there is not: searching an empty record can only answer *Nothing.*, and
*a control that cannot act goes off* is the rule the rest of that bar already
follows.

**The heading is visible, set as the tray sets its own.** A glyph is not a name.
Arriving at a caret in a field with no word for where you are is how a search
field gets typed into as though it were the capture line, and the tray answered
this question first.

⚠ **The route reads nothing.** It asked for a count to decide whether to say
*nothing captured yet* before anybody typed — removed with the state it fed. A
person with an empty record types and gets *Nothing.*, by the same path as every
other answer; a query whose only job is to pre-empt an answer the page already
gives is a second opinion about the same fact.

### The shared page was hiding every raw capture (24 August)

`toLegacyEntryCards` dropped every capture that resolved to nothing, because an
`EntryCard` has a `kind` and a `title` and no way to say *the words somebody
typed*. Its own note said the filter removed nothing "today", because every write
still came through the film flow and resolved a TMDB row first — and that stopped
being true the day raw capture shipped.

**So since Phase 1 went live, a mutual opening `/u/[handle]` saw none of what
that person had written.** Not an empty list and not a partial one: the rows were
absent, with no symptom on either side. The register had it filed as a cleanup —
*item 9, `toLegacyEntryCards` dies* — and it was the only correctness bug on the
Phase 1 list. Worth noting how it stayed invisible: the projection was written
with the failure documented and dated to a future phase, and nothing re-read the
note when that phase arrived.

`toCaptureCard` carries the text, so a raw capture is an ordinary row, and
`toLegacyEntryCards` is deleted.

⚠ **The words are the row, and the title is not shown.** A capture that resolved
to *Jaws* still reads as the words its owner typed. A shared page substituting a
canonical title would show somebody's friends something that person did not
write, which is the same reason §6 keeps `text` unreplaced in the column. The
title names the poster for a screen reader and does nothing else.

⚠ **They are set as lines, not titles.** The row was `title` — the largest type in
the app — because every row used to be a film. A one-line capture at that size is
a headline made out of a note.

⚠ **`specFor` throws on `(null, null)` and it is right to**, so it is asked only
when there is something to ask about. The sub-line renders nothing at all when
nothing is known: the old row printed `—` for a missing year, which was fine when
a missing year was the exception and would be a column of em dashes on a page of
raw captures. The state's word wins over the want label, because it is the one a
raw capture can also carry.

### Resolution offers, and the first Phase 1 migration (24 August)

Saved → line → then a quiet offer. Additive only, at the user's direction: two
nullable columns on `captures` — `suggested_possibility_id` and
`resolution_declined_at` — plus one FK. Old code ignores a column it does not
select, so **a revert push is still a rollback**, which is the property the rest
of the phase has kept. ⚠ **The migration has to reach production before the code
does**: the page's read selects the new column, so deploying first is a broken
page rather than a degraded one.

**The question is written on the row rather than recomputed.** That is what lets
an offer stand *forever, quietly*. Recomputing would be a provider call per line
per page open, answered differently each time — and a question that disappears
when you reload has quietly answered itself, which is the failure the design
names.

**Ignoring is not No**, which is why the timestamp exists at all. *No* records
that this possibility is not the one and takes the `?` away; ignoring leaves the
mark standing indefinitely. The suggestion is kept beside the timestamp rather
than cleared, so what was refused stays known.

⚠ **The confidence rule is exact-match on the reduced words, and it is
deliberately blunt.** TMDB is a relevance match ranked by popularity and answers
something for almost any string, so the top result would put a film under every
capture — *try pottery* offered a thriller called *Pottery*, forever, on a line
that was never about a film. **A wrong offer costs more than no offer**: it asks
a question somebody has to dismiss. The bar is that somebody typed the title and
nothing else. The misses are silent and cost nothing, which is the right way
round, and widening it is a decision with evidence behind it rather than a
loosened constant.

⚠ **`looksLikeTheSameTitle` is not the normalising rule and must never be used
for matching.** `normalised()` in `schema.ts` is the one implementation of what
the words reduce to, it lives in SQL, and rows and queries have to agree forever.
This decides only whether to ask a question: if the two drift, an offer is made
or not made, and nothing is stored under the wrong reduction. Naming them apart
is what keeps that true — a shared helper would invite the second use.

**Provider failure is the absence of an offer, logged and invisible**, and both
halves are built. The invisible half was easy; the logged half is the one that
matters, because a provider quietly answering nothing for a week looks exactly
like a product where captures do not resolve, and without a line in the log there
is no way to tell those apart. ⚠ **The words are never logged.** The reason is
operational; the text that would make the log useful for debugging is the text
that would make it a copy of everybody's diary.

**The Yes/No pair is shared by being the same component.** The design asks the
offer to reuse the settle flow's pair rather than invent an accept control, so
`Question` is that pair and *Again?* renders through it too. They are the same
kind of thing: one line of the record asking the person who wrote it to decide
something, both answerable by ignoring.

⚠ **`intent` stays null on an accepted offer, so the unique key cannot bite.**
(user, possibility, intent) with NULLs distinct in Postgres means two captures of
the same film are allowed — correct, since two captures on different days are two
intentions until something says otherwise. The day intent is set on a resolution,
`acceptSuggestion` has to answer for the collision. It does not today.

⚠ **No overlap trigger.** §6 keys convergence on the possibility, so accepting an
offer is exactly where `fireOverlap` belongs when Phase 2's second trigger is
wired to captures. It is not called because this phase ships no convergence
surface, and a notification nobody can look at is noise with a delivery cost.

**`upsertPossibility` is the one writer**, and `upsertItem` now delegates to it.
Two copies of one upsert over one table is how two callers come to disagree about
what a canonical row is — and `items` and `possibilities` are one table.

### *Have* is unreachable, and the fix is a kind rather than a button (24 August)

`STATE_WORD.fixture` is **Have**, it is in the tray and in `WHERE_IT_IS`, and
nothing in the product can put a capture there. It needs `landsIn`, which needs a
kind and an intention.

**The intention is now derived.** `resolveCapture` reads
`capture.intent ?? DEFAULT_INTENT[kind]` — see a film, read a book, try a place,
own an object — which is §4's rule exactly: derive from kind + intent, never ask.
⚠ **It changes nothing today**, because the only kind that exists is `film`,
whose default is `see`, which lands in `go_back_to` — the same answer the
hard-coded fallback gave. What it removes is the constant. The day a capture can
be about an object it lands in `fixture` because the vocabulary table says so,
rather than in `go_back_to` because someone typed it in a function.

**The kind is the part that cannot be supplied here.** A capture acquires a kind
by resolving to a possibility, and the only catalogue is TMDB, so every
possibility is a film. What is missing is a kind that is not a film — user
contributed possibilities or a second catalogue, a later sourced layer with its
own provenance requirements.

⚠ **The tempting wrong fix is a third settle answer.** *Again?* has two, and a
raw capture genuinely cannot answer *have you got one now*. A third button would
make the page ask a categorisation question, which §13 forbids, and would put
`fixture` on captures with no kind — the state meaning *a thing you possess*,
applied to a line of text. **A state nobody can reach is a smaller problem than a
state that means nothing.**

⚠ **The other tempting wrong fix is asking at capture**, which §13 forbids
outright. The specification's own answer is that an intention can be refined
later, and where that refinement lives is undesigned: the foot is full at five
glyphs and no artboard draws one. That is the decision this waits on, not an
implementation.

### Photographs: a private store and a door of our own (24 August)

Vercel Blob, at the user's direction, with `access: 'private'`. ⚠ **An
unguessable public URL is not an access-controlled media path** (§6): it is a
secret that leaks the first time somebody shares a link and cannot be revoked
without deleting the file. The difference matters most for exactly what this
stores — a photograph somebody took of something they want.

**The row holds a pathname, never a URL, and the client is given neither.**
`/api/media/[captureId]` is the one door, and what it checks is whose capture
this is: `getMyCaptureImagePath` filters on the session user and there is
deliberately no parameter that widens it. 404 for both *no such capture* and
*not yours*, because a 403 confirms the id exists.

⚠ **The camera is dark until a Blob store exists**, which makes deploying
without one a deploy without photographs rather than a broken one. The preflight
says so as a notice, not a failure — that is what stops a dark camera being
investigated as a bug.

**EXIF is stripped structurally, not by re-encoding.** A handset photo carries
GPS to a few metres, and `CLAUDE.md` puts continuous location outside Release 1 —
storing a co-ordinate that arrived inside a JPEG would be that, by accident, with
no consent step near it. The three containers keep metadata in named blocks, so
dropping blocks is exact and needs no decode. ⚠ **Re-encoding is worse**: a
native codec, quality lost on every save, and every photograph silently rotated
by the tag being removed. ⚠ **Orientation goes with the GPS and that is
accepted** — between a sideways photo and a stored location, the sideways photo
wins.

⚠ **HEIC is refused and the `accept` attribute is what makes that work.** Safari
hands over HEIC for `image/*`; naming three types makes iOS transcode on the way
out, putting the conversion before the photograph rather than a failure after it.

**One call, not an upload then a save.** An upload that returns a pathname before
the capture exists leaves an unreferenced object the moment somebody changes
their mind. The idempotency check comes *before* the upload, so a retried
submission does not store a second copy on its way to finding the row.

⚠ **A line that carried a photograph cannot retry.** The `File` went to the
upload and the page keeps only an object URL, which is a view of bytes the
browser owns. Holding every photograph of a session in memory against a failure
that may not come is worse, on the device least able to afford it.

⚠ **What is verified and what is not.** The strippers have four tests, in
`guarantees.test.ts` rather than `acceptance.test.ts` because a surviving GPS tag
has no symptom: the picture looks identical, the save succeeds, the page is
right. One of them caught a real bug — the WebP reader took the chunk size at the
name's offset, which drops every chunk after the first. **The upload, the media
route and the camera have never run**, because there is no store to run them
against. They typecheck and build; nothing about them has been seen working.

## The push keys come out, because the phase they were for moved — 25 August

Three VAPID variables — `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` — were provisioned into Vercel's production and
preview environments on 8 August and read by nothing for seventeen days. They
are removed.

**The reason is not tidiness, it is that the numbering under them went stale.**
`docs/plan.md`'s film-first sequence made push Phase 5 — "PWA + push: manifest,
service worker, VAPID, subscriptions, install prompt" — and `lib/env.ts`
carried a `// Phase 5` comment beside the keys to say so. The re-direction
renumbered every phase. Push delivery is now a **Phase 6** deliverable, the
last one, listed beside adult eligibility, consent, blocking, reporting and
moderation; and §"Notifications" says notifications are **in-app first**. So
the comment pointed at a schedule that no longer exists, and the keys sat in a
live environment against a phase that had moved months out.

That staleness had a cost before it was found: reading `// Phase 5` next to
`push_subscriptions`, an empty `public/`, and `lib/overlap.ts` writing
`notifications` rows, the state reads as *half-built* — credentials with no
receiver. It is not. It is a designed intermediate: overlap records what
happened, the app shows it in-app, and delivery is a later phase's problem. The
comment now says which phase and why, because the next person to look will make
the same misreading otherwise.

**Nothing was bound to the pair.** `push_subscriptions` cannot hold a row
without a service worker to create one, and there is no service worker. So the
keys were not a credential protecting anything — they were an unused secret,
which is liability with no asset behind it.

⚠ **The removal is irreversible and that is the interesting part.** Vercel's
*Sensitive* values are write-only: nothing, including the dashboard, can read
one back. This is the same property that made this morning's migration need
Neon rather than Vercel — `vercel env pull` redacts `DATABASE_URL`, so the
production connection string had to come from `neonctl`. Restoring a deleted
sensitive value therefore means knowing it independently, which for a VAPID
pair means generating a new one. That is free here — `npx web-push
generate-vapid-keys`, one command, nothing to migrate — but it is the reason
this was a decision rather than a cleanup.

Phase 6 generates a fresh pair and promotes both server variables to required
in the same commit. They stay `.optional()` until then so the app boots without
them, which is the rule the whole of `lib/env.ts` is built on.

## Photographs wait for a store, and the store waits for a decision — 25 August

**Deferred at the user's direction: nothing that costs money gets built for
now.** Vercel Blob is a paid add-on beyond its free allowance, and creating one
is the only thing standing between the photograph path and its first execution.

**What is built and has never run.** The camera input, `storeImage`, the three
metadata strippers, `/api/media/[captureId]`, the thumbnail on the line and the
full-size view. They typecheck, they build, they ship. `imagesAvailable()` reads
`BLOB_READ_WRITE_TOKEN`, the project has no such variable, so `imagesOn` is
false and the control is off. **Nothing about the round trip has been seen
working.**

⚠ **The strippers have four unit tests and the round trip has none**, and the
distinction is the useful part of this entry. `guarantees.test.ts` covers the
JPEG, PNG and WebP readers because a surviving GPS tag has no symptom — the
picture looks identical, the save succeeds, the page is right. What no test
covers is upload → store → read back → render, because there is nothing to run
it against. **The first photograph anybody attaches is also the first test of
three files.** Expect to find something.

### What to do when it is time

Vercel → Storage → Create → Blob, connected to `again-msaef`. Vercel writes
`BLOB_READ_WRITE_TOKEN` into the project itself, so **there is no code change
and no migration** — the glyph lights on the next deploy. Nothing needs to be
remembered beyond that.

⚠ **`imagesOn` is a server fact and must stay one.** It is decided in the route
and passed down, because the token is a server value; a client that decided this
for itself would be guessing, and the guess would be wrong in exactly the
direction that offers somebody an upload with nowhere to put it.

### The cost of it being off

⚠ **A permanently inert control on the live row was read as a bug within minutes
of it moving there.** It sat among five glyphs in the foot for a day without
comment; alone on the row somebody is always looking at, the first question
asked was *what does it do, it can't be pressed?* — which is the app's own rule,
*controls go off; they do not disappear*, meeting a surface it was not written
for. The rule exists to keep a **bar's** shape stable so a blank page does not
read as unfinished. The live row is not a bar.

That is not resolved here. It is written down because the next person to look at
a dark paperclip will ask the same question, and the answer is *there is no
store*, not *it is broken*.

## The second tap stops editing, because the pencil is a door — 25 August

**A tap on a line means *pick*, and now it means nothing else.** The second tap
that lifted the words into the band is removed at the user's direction. The
foot's rewrite glyph is the one door to a rewrite.

### Why the accelerator did not survive the control

The 24 August entry above — *Rewriting gets a glyph, because the question was
consistency* — argued that cross off, settle and rewrite are the same kind of
thing, something you do to the line you have picked, and that rewriting being a
secret gesture was the inconsistency. It then kept the gesture "as the
accelerator". ⚠ **That last clause is the one this reverses, and it fails on the
entry's own argument.** With a pencil in the foot, a tap on a line answers *pick*
or *rewrite* depending on what the tap before it was — a gesture whose meaning
depends on history, which is precisely the modifier gesture `page-screen.tsx`'s
header rules out. Two doors to the rare act cost the common act its single
meaning, and the common act is the one every thumb performs.

It is also the cheaper half to lose. The pencil is announced, is dark when it
cannot act, and cannot be triggered by a thumb that lands twice; the gesture is
none of those things.

### It is a no-op, not a release

⚠ **A second tap on the words does nothing at all**, and that is deliberate
rather than an omission. Letting go stays a tap on the paper, or `Escape` on the
desk, because *the paper is the inverse of picking* is a rule the page already
holds. Making the words release as well would give one target two readings again
— and the failure mode is worse than the one just removed: a thumb that
double-taps a line it meant to settle would un-pick it and darken the very
control it was aiming for.

### What did not change

The band is still the one field, the pick is still kept while a line is open,
and the pencil still goes dark while it is. **A line is still editable** — the
24 August argument for that (typos are certain, and *Resolution offers* matches
capture text) is untouched; only the way in is.

## A button cannot be inline, and that is why the glyphs kept dropping — 25 August

**Reported:** the × and pencil that are meant to sit after a line's last
character sometimes appear under it, on their own line. **Two causes, and the
big one is that the fix for this earlier the same day never took effect.**

### The words were a `<button>`, so they never fragmented

The row was made inline flow that afternoon on the argument that *a flex
container has no notion of after the text ends*. That argument is right and the
change was not enough: the words carried `display: inline` on a `<button>`, and
**an engine will not honour it**. Measured side by side on identical markup and
styles — `node_modules/.probe/inlinebutton.mjs`:

| element | computed display | fragments | tail lands at |
|---|---|---|---|
| `<button>` | **`inline-block`** | 1, filling the 358px column | x=12, next line |
| `<span>` | `inline` | 2 | x=186, after the last character |
| `<a>` | `inline` | 2 | x=186, after the last character |

So the words were one atomic box as wide as the column and the tail went after
the *box* — the flex behaviour again, reached by another road. For any capture
that wrapped this was not intermittent, it was total.

⚠ **The commit that introduced it said so.** Its last line was *`display: inline`
on a `<button>` is the load-bearing part and wants a look on hardware.* The look
came back the same day. A claim flagged as unverified is not a claim that holds
until someone disproves it.

**The fix is the element**: `<span role="button" tabIndex={0}>` with an
Enter/Space handler. This is a subtraction and it is right by construction on
every surface — a span is an inline box in every engine, so nothing here depends
on which of them coerce buttons. `text-start` went with it: it existed to undo a
`<button>`'s centred UA text, and a span has nothing to undo. `cursor-default`
and `select-none` came in for the opposite reason — they are what a button gave
for free, and an I-beam over a line that cannot be typed into is the same lie as
a caret on it.

### The tail is an atomic inline, so it can still be left behind

Even with the words fragmenting properly, everything after them — thumbnail,
link, controls — is an atomic inline that cannot break. The cluster is 56px
(two glyphs at `--glyph-line`, their gap, and the `ms-3` lead), so it drops to
its own line whenever the last line ends with less than that remaining: about
one line in six, and it lands at the **left margin**, where it reads as a
separate entry rather than as this line's controls.

⚠ **Three cheaper mechanisms were built and measured, and none of them works.**
Written down because each looks obviously correct until it is run:

- **`padding-inline-end` on the words, pulled back by a negative margin.** Inline
  end padding does not participate in line breaking — it *hangs* past the line.
  Measured: 407px of box on a 358px column, the break unmoved.
- **The same padding on an empty spacer after the words.** An empty inline
  contributes nothing to the line at all; identical results with and without it.
- **A `U+2060` word joiner between the words and the tail.** It does not suppress
  the break across an element boundary; identical results.
- **A `white-space: nowrap` wrapper around both, with `normal` restored on the
  words** so their own text still wraps. The inner `normal` re-opens the boundary
  break; identical results.

**What works is binding the last word to the tail** in one `nowrap` box: when the
pair will not fit, the *word* comes down with the glyphs and they are still
immediately after the last character. `node_modules/.probe/keepwith.mjs`, then
`rowtail.mjs` on the real page — 18 captures at a spread of last-line widths, all
with the tail 12px after the last character and nothing spilling past the column.

### The split must not reach the accessibility tree

Binding the last word means the words are two elements, and two controls per line
would double the tab stops on a two-hundred-line record. ⚠ **One half carries
`role="button"` and is labelled with the whole capture; the other is
`aria-hidden` with the same click.** A thumb sees one target, a reader sees one
control, and the label is now *better* than the button's was — it carries the
year, or spells out the standing question that used to reach a reader as a bare
`?`. Verified on the page: one `role="button"` per line, Enter picks, a tap on
the paper still lets go, and the strike runs unbroken across the split.

⚠ **Hardware answered on 25 August and the answer was yes**, on a handset and on
a desktop, for both halves — the element and the binding. That closes the claim
the commit that caused this left open, which is the point: the earlier fix was
flagged as wanting a look and shipped anyway.

### What this cost, and the rule it pays for

Two mechanisms where the design wanted one, and a text split that the record has
to carry. The alternative was a permanent 56px control gutter down the right of
every line — which is the other honest answer, and it loses because it charges
every capture for a control that appears on one.

## Three things a handset said about the page — 26 August

Reported after using it: the undo does not sit optically on the line it belongs
to, the live row cannot be scrolled horizontally, and on glass the blink that
marks a capture landing is behind the writing pane's blur. Two are defects with
one cause each; the third is a decision, and it was taken to leave it.

### The undo sat low because the row was the wrong type

⚠ **`vertical-align: middle` centres a box on the *parent's* x-height**, and the
parent was not the line. The words carried `page-words` — 18/28 with the line's
tracking — and the row around them was still the page's body 15/1.45, because
`page-row` had been given nothing but the hem when the two were split apart on
25 August. So every inline that rides a line of the record — the undo, the cross
off, the pencil, the link, the photograph — was being centred on a 15px
lowercase `x` while sitting beside 18px words.

Measured on the real page with `node_modules/.probe/glyphline.mjs`: the tail
glyph's centre sat **3.29px below the words' cap centre**, of which 0.68px was
the drawing's own fault (below) and the rest was the wrong reference.

**The row is the line, so the row carries the line's type.** `page-words` is
deleted and its three declarations moved to `page-row`; the words are
`display: inline` and inherit, and so does everything that has to align against
them. One declaration where there were two, and nothing left that can align
against the wrong face.

### `middle` is the wrong middle even when the type is right

That leaves 1.8px, and it is not a bug in the parent — it is what `middle`
means. The keyword is *baseline plus half the x-height*, which says nothing
about the capitals and ascenders a line of running text is mostly made of, so it
always lands below where the eye puts the centre of a line, and further below
the larger the type is next to the glyph.

⚠ **The answer is the line box, and it needs no face metrics at all.** A line
box is the strut's leading split evenly above and below its content, so its
centre **is** the text's own centre by construction — whatever the face, the
size, or the leading. `line-glyph` makes the box exactly `--leading-line` tall,
top-aligns it to the line box it sits in, and centres the glyph inside. Nothing
in it is tuned and nothing reads a font, which is the difference between this and
a `vertical-align: -3px` derived from Fira Sans' ascent and descent — that
version was written first and thrown away, because it would have been a number
waiting to be wrong on the next face.

Measured after: the glyph's centre is **6.00px above the baseline, which is the
line box centre to the pixel**, and 0.5px under the cap centre.

⚠ **It also buys the hit area rather than borrowing it.** `box-sizing:
content-box` means the height is the *content* box, so the hem adds outside it
and the border box comes to `--leading-line` plus two hems — 44px, which is
`--tap-floor`. The negative margin takes the same hem straight back, so the
margin box is the line box again and the row is not one pixel taller for it. The
old arrangement (`-my-2 py-2`) reached 34px. Every row still measures 44px, all
twelve of them, before and after.

⚠ **The struck line's link deliberately keeps `middle`.** A strikeout is drawn
near the x-height, which is the one place `middle` is the right answer — it is
what puts the line *through* the glyph rather than under it. The 1.3px it now
sits below its live twin is on a line that is struck and at half strength, and
the two can never appear together.

### The undo glyph was the one of eight not centred on its own grid

Independently of the row: `UndoGlyph`'s ink ran y 4.25 → 17.25 and x 3.25 →
15.75 inside a box centred on 10, so the drawing sat three quarters of a unit low
and half a unit left of every glyph it appears beside. The seven others are
within a third of a unit of centre. The two arcs are moved by (+0.5, −0.75) and
the ink now spans 3.5 → 16.5 in both axes.

⚠ **A glyph off its own centre cannot be corrected from outside it.** A row
aligns the *box*. A drawing that is not centred in its box is wrong at every size
and in every bar it is ever put in — so it is redrawn on the grid, and the box is
never nudged.

### The receipt comes through the glass

The writing pane blurs the record and sinks it a stop while a line is being
written, so the words in hand are the only sharp thing on screen. On the desk
that is invisible: `rest()` ends the writing mode on Return and the pane fades as
the line arrives. **On glass it does not and must not** — the keyboard stays up
because a session of captures is a run of them — so `writing` is still true at
the instant the line lands, and the blink that is the only receipt on the page
happens behind the blur.

Both halves were checked for removal first, in the order `CLAUDE.md` asks for.
The pane's whole job is to blur the record, so the mechanism cannot go. The
condition is *the keyboard is up when a line lands*, which is the design. So it
is a correction, stated as a rule: **the receipt is exempt — the one thing the
record is allowed to say through the glass** — and it is exempt for exactly the
length of the saying.

⚠ **The animation owns the duration; there is no timer.** `landed` is a property
of the line and never clears, so a class keyed on it would leave every capture
made this session floating above the pane forever. `surfaced` is an animation
with `both`, so it holds `z-index: auto` the moment it is over — the same
argument that keeps `landed` off a piece of state with a `setTimeout`. Both read
one token, `--landed`, because the blink and the lift are one event: two
durations would be a line that finishes winking and then sinks, or sinks and then
finishes winking, and neither is a thing that happened.

⚠ **`z-index: 6`, and it cannot be touched while it is up.** The pane is `z-5`,
the band `z-10`, the bars `z-20` — a receipt must never come up over the line
being written. And the pane's other job is to take the tap that puts the keyboard
away, which a row sitting over it would steal, so the row is `pointer-events:
none` for the same instant. A control at 15% opacity mid-blink is not armed yet.

Verified with `node_modules/.probe/receipt.mjs`, which stretches `--landed` so
the lift can be looked at: the row paints sharp and unblurred while the lift is
on and blurred and sunk when it is over, `z-index` reads `6` then `auto`, and the
pane takes the tap at both ends.

### The live row stays one row, at the user's direction

**Measured first.** A fifty-character capture overflows the band by 92px on a
390px handset — about eleven characters off the left edge — and a single-line
`<input>` cannot be panned on glass, so there is no gesture that brings them
back. The same words land in the record as a two-line row, so the page shows the
whole capture the moment it is committed and less than the whole of it while it
is being written. `node_modules/.probe/bandwidth.mjs` has the numbers.

The only real fix is a band that wraps, which is what the record already does.
It was put as a question with its costs — `--band-height` stops being a constant,
so `main`'s top padding and `useKeyboardHem` both have to read a measured height
instead — and **the answer on 26 August was to leave it one row.**

⚠ **Recorded so nobody re-derives it.** This is a decision, not an oversight: the
band is one row and stays one row, which is the whole reason the live line is an
`<input>` rather than a growing textarea, and the head of a long line scrolling
away while it is typed is the price. Reopening it needs the numbers above and a
new answer to the same question.

## Submitting a line ends the writing — 27 August

**Directed, on seeing the blink work:** *it shouldn't settle back behind the
glass. Once submitted, the user should be presumed to be done. If the user wants
to add another entry, they can tap in the live row again.*

### What it reverses

`rest()` carried a coarse-pointer guard with two justifications, and the second
of them is now wrong. The first stands: neither deleting the last character nor
anything else dismisses an on-screen keyboard, so clearing `writing` there would
drop the hem and the chrome's hold while the glass was still half covered, and
`useKeyboardHem` reads that exact flag. **The second was that a session of
captures is a run of Returns**, so after a commit the keyboard staying up was
the point.

That rule is what put the record behind glass at the one moment it has something
to say. It also made a run the default case, when one capture is the common one —
the whole design is *open, type, close*, and a page that holds the keyboard after
a line has landed is holding the screen for a second capture most people are not
going to make.

**A commit now calls `done()`**, which is `blur()` then `setWriting(false)` — the
same pair, in the same order, that a tap on the writing pane already performs. It
is deliberately not a new exit: that pair is the only way out of the mode on
glass, it is proven, and blurring a field that is not focused fires no event,
which is why the flag has to be cleared directly as well.

### What it costs, stated

A run of captures is now Return, tap, type, rather than Return, type. One tap per
extra line, on a target that is pinned and never off screen — which is the same
tap iOS already insists on for the first line of a cold open, since focus without
a gesture cannot raise a keyboard there.

### The lift over the pane is deleted, one day after it shipped

`surfaced` lifted a just-landed row to `z-6` and made it untouchable for exactly
the blink, so the receipt could be seen through the pane. It was the right answer
to *the pane is up when a line lands*, and the direction above removes that
condition outright. **So the correction goes with it**, per *How things get
fixed*: a subtraction cannot be wrong on a device nobody has tested. The
`--landed` token goes too — it existed to keep the blink and the lift on one
number, and with one consumer left the duration belongs in the utility that
spends it.

⚠ **Putting a lift back would mean the commit had stopped ending the mode**,
which is the thing to fix instead. Nothing else on the page produces a `landed`
line: `retry` does not set it and `commitEdit` does not, so `commit` is the only
producer and it now always takes the pane down first.

### Verified

`node_modules/.probe/submitdone.mjs` on the built page: the pane is up and
blurred while typing; at the instant the line lands the pane is down, the blur is
gone, the field is blurred and the record is at full strength; the hem and the
band's correction are unset throughout, because `commit` scrolls to the caret
first and at `scrollY` 0 the visual viewport starts where the layout one does; and
a tap on the live row puts the mode back. **Not yet seen on a handset**, which is
where the keyboard itself can be watched leaving.

## The field is summoned, and the live line stops being pinned — 27 August

**Directed**, after the 26 August answer to leave the live row alone was
reopened: *I want the horizontal scrolling. What would we need to change to make
it possible. We can change everything, get rid of the glass, the light, make it
so the row appears when a user taps a '+' glyph in the bottom row/vertical
column, whatever.* And, in the same session: *this is for handset/phone app
only.*

### What the measurement said, and why the literal thing was not built

A horizontal drag inside a focused single-line `<input>` is a text interaction
on every engine — caret placement and selection — not a pan. That is the
platform's contract for editable text, not a bug, and it is the same on all of
them.

⚠ **But it is not uniform in practice, and the measurement is the point.**
`node_modules/.probe/panfield.mjs` drives a real touch drag through CDP across
four cells — focused/not × `touch-action: pan-x`/auto — and in Chromium the
focused, overflowing input **pans the full range and leaves the caret alone**,
with `pan-x` making no difference either way. So Android already scrolls. What
was reported is an iOS behaviour, and nothing on this machine can test iOS.

That kills the obvious build. A hand-written pan would run on both engines: a
second pan fighting the native one on Android, and a platform branch if gated to
iOS. *How things get fixed* rules out both by name.

### So the row stops being a row

⚠ **The fix is not to scroll the field; it is to stop the field being one line.**
The band was one row because it had to be — the record's top padding read
`--band-height`, so a band that grew would have pushed the record down under
somebody's thumb. A **sheet is not in the record's flow**, so its height answers
to the words in it. A long capture wraps and there is nothing off screen to
reach. The condition is removed rather than corrected.

⚠ **This said "wraps, exactly as it will in the record" until 28 August**, when
the sheet took a measure of its own and the two columns stopped agreeing. See
*The sheet's box, on both surfaces at once* below. Nothing about the report is
reopened by it: what was asked for is that the words wrap rather than run off
the side, and they do.

### The `+` costs nothing on a handset, which is what made this affordable

iOS raises a keyboard only for a gesture. Starting a capture therefore *already*
took one tap — on the pinned live row — and it is a tap on the `+` now. The same
gesture, a different target, and the page gets its screen back: what sits above
the record is the bar and `--page-lead`, where it was the bar, the band, and the
air between them.

⚠ **What it costs is the caret on arrival.** The app used to say *type* before
anybody had done anything; it says *here is your record* now, and you ask for
the field. That was named as the one thing to weigh before this was chosen, and
it was chosen with it named.

### The one non-negotiable

⚠ **The field is mounted at all times, and the `+` focuses it synchronously
before any state is set.** iOS raises a keyboard only for a focus that happens
*inside* the gesture that asked for it; a field mounted by a state change is
focused a tick too late and the keys stay down. So the sheet exists from the
first paint, translated off the bottom of the glass, and `openSheet` calls
`focus({ preventScroll: true })` as its first statement. `startEdit` does the
same, from the pencil's own click. **Never make the textarea conditional, and
never move its focus into an effect.**

### The field grows without measuring anything

`grow-field` is a one-cell grid holding the `<textarea>` and a `::after` carrying
the same text from `data-value`; the invisible ghost sizes the cell and the
field stretches to it. No `scrollHeight` read, no `el.style` write, no resize
loop, no engine feature to wait for.

⚠ **A `scrollHeight`-driven textarea shipped on this page in August and was
deleted**, and this is deliberately not that mechanism returning. `field-sizing:
content` is the declarative answer and is still not in every engine this ships
to; the ghost needs neither. The trailing space in the content is load-bearing —
a value ending in a newline measures one line short without it.

⚠ **The hem is the row's, not the field wrapper's.** It is the same arrangement
`page-row` uses in the record, and it is what lets `line-glyph` centre the
photograph and the link chip on the field's **first** line by the same
arithmetic. Put the hem on the wrapper and every chip sits a hem too high; that
was built, seen and moved.

### What went, and why none of it should drift back

- **`--band-height`, `--band-lead`, `--band-ground`, `--band-tint`,
  `--band-tail`, `--bar-visible`.** All described a band pinned under the bar.
  `--band-height` was the load-bearing one: it is why the field could never grow.
- **`live-band`'s idle layer and `band-dim`.** A summoned sheet is never
  *waiting* — it exists because somebody asked for it — so there is one light and
  no fade between two.
- **`unsent` and `record-held`.** Both described a draft sitting uncommitted in a
  row on the page. The sheet's two thumb-reachable exits both commit, so there is
  no such state. The italic face stays wired in `app/layout.tsx` in reserve, as
  Bebas Neue is; `preload: false` means a face nothing names is a face nothing
  fetches.
- **The scrim's `backdrop-blur`.** It existed so the words in hand would be the
  only sharp thing while the record sat *directly under them* in the same size
  and face. The sheet has its own opaque ground and its own light, so the
  separation is made by an object rather than by a filter — and a full-viewport
  `backdrop-filter` was a compositing layer the page paid for on every keystroke.
  `--scrim-blur` survives for the photograph opened full size.
- **`head()` in `useKeyboardHem`.** It held the *top*-pinned band on the visible
  viewport's top edge against iOS dragging fixed elements. The field is on the
  bottom edge and reads `--keyboard-overlap` for its `bottom`, so the correction
  and the position are one number instead of two. ⚠ If a top-pinned field ever
  returns, so does this — the symptom it answered was real and reported.
- **`live()` and `rest()`.** They inferred a writing *mode* from gestures,
  because the field was always on screen and there was no other way to tell
  writing from resting. **The sheet is the mode.** Every instrument that read
  `writing` now reads a fact instead of an inference. Do not reintroduce a
  gesture that opens it implicitly.

### What is kept

- **The drawn caret**, and it earned its return within the hour: the empty sheet
  screenshotted as a black rectangle, because a field's own caret is a platform
  behaviour rather than a promise. It lost its `picked === null` half — the sheet
  cannot be open while the record is being browsed.
- **Return commits and never inserts a newline**, which a textarea has to be told
  rather than being told by its own nature. The field *wraps*, which is the
  browser laying one sentence over several lines; a newline would be the person
  doing it, and that is what is refused.
- **The foot recedes while the sheet is up.** Not a stacking fix: the sheet rests
  on `--keyboard-overlap`, which is zero wherever there is no on-screen keyboard,
  so the two would share the bottom edge. None of the foot's three is wanted while
  somebody writes, and the `+` least of all.

### Verified

`node_modules/.probe/sheet.mjs` on the built page at 390×844: at rest the sheet
is off the glass and the record's first line is 68px from the top; the `+` brings
it to the bottom edge focused with the scrim up; a 65-character capture makes the
field **two lines with zero horizontal overflow**, which is the whole point;
Return commits and closes, and a tap on the scrim commits and closes.

⚠ **Not seen on hardware**, and three things can only be answered there: whether
the `+` raises the keyboard, whether the sheet sits on the keys, and whether the
caret is where it should be while typing.

## The sheet's box, on both surfaces at once — 28 August

**Directed, after the first look at the summoned sheet:** *the height of the row
needs to be reduced significantly on the handset; on the desktop the row needs
widening, and it need not match the width of the entries column.*

Two complaints, one object, and they resolve into one subtraction and one new
token rather than into two device branches. Measured before and after with
`node_modules/.probe/sheetdesk.mjs`, which reads the sheet's box, the inner
column and the field on a 390×844 handset and a 1440×900 desk; `sheetcrop.mjs`
crops the row itself on each.

### 68px was one gap bought twice

The sheet's empty height was `--sheet-lead` + `--line-hem` + `--leading-line` +
`--line-hem` + `--sheet-tail` — 12 + 8 + 28 + 8 + 12 = 68px of glass for one
18/28 line. The middle three are the row: the field wears `page-line`, exactly as
a committed line does, and that is what puts the chips beside it on the right
arithmetic. The outer two were the sheet's own air, added on top of air that was
already there.

⚠ **So they are deleted, not reduced.** *How things get fixed* asks for the
mechanism to be removed before it is corrected, and a smaller number typed into
`--sheet-lead` would have been the correction — a constant chosen because 44
looked better than 68 on the screen in front of me, waiting to be wrong on the
next one. What is left is not a chosen number at all: **the sheet is exactly one
line of the record**, which is 44px, which is also `--tap-floor`, which is also
the hit area of the chips already sitting in it. Three things that had to agree
now agree by construction.

`env(safe-area-inset-bottom)` stays on the sheet. It is clearance for a notch,
not spacing, and it varies by device — the one thing in that box that should.

⚠ **This applies on the desk too, and was not asked for there.** The height was
never width-dependent: the sheet was 68px on both surfaces, and it is 44 on both.
A handset is where a wasted 24px is noticed, not where it is uniquely wrong. A
height that shrank on one surface and not the other would have been the device
branch this file rules out.

### The desk's width is a derivation, not a taste

`--sheet-measure` is the record's column plus the tool stack's width and its
inset **on both sides**, because the column is centred:

    42.5rem  --page-measure
  +  2.75rem --stack-width
  +  3rem    --stack-inset
  ────────── x2
    54rem

⚠ **That is `--breakpoint-stack`, and not by coincidence** — it is the same sum,
because that breakpoint exists to guarantee the stack fits beside the column. So
the sheet is as wide as the page's furniture already stands: measured at 1440px,
the sheet's inner box starts at x=288, which is the tool stack's own left edge,
and the field starts at 308 — inside the stack's 44px column, under the `+` that
summoned it. The number is checkable rather than chosen, and it moves on its own
if `--stack-inset` moves again, as it did on 25 August.

⚠ **Below `--breakpoint-stack` nothing changes.** The viewport is narrower than
the cap, so `gutter` puts the field on the glass exactly where it was: measured
at 390px, the field is at x=20 and 324 wide before and after. The width is a
desk-only change without a desk-only rule in it.

### What this gives up

⚠ **The sheet no longer previews the record's line breaks.** Both columns were
`--page-measure`, so a capture wrapped in the sheet exactly where it would wrap
once committed. That was a pleasant consequence of one number doing two jobs, not
a guarantee anybody asked for — the report that built the sheet asked that a long
capture **wrap at all** rather than scroll sideways out of reach, and it still
does, at six lines' worth of growth before the field scrolls.

The alternative was to widen the record's column to match, which is a change to
the reading measure of the whole product to protect a preview nobody named. It
was not taken.

### Not verified on hardware

Chromium at two viewports, on `next start`. The handset height in particular
wants a thumb on it: 44px is the tap floor, and the question a screenshot cannot
answer is whether a 44px sheet still reads as *the place you are writing* once a
keyboard is under it.

## One line, everywhere — 28 August

**Directed, on seeing the previous change:** *the height of the row was only
reduced by pushing up the cursor; on the desktop, better, but I want all entries
to be written on one line, never more than one* — and, immediately after, *the
one-line rule applies to the handset live row, too.*

So it is a rule about the page rather than a fix to one row: **nothing on this
screen occupies more than one line.** The record's entries, and the field they
are written in.

### What it took away, which is the interesting half

The 27 August sheet existed to let a capture **wrap**. That was the answer to a
single-line `<input>` whose overflow ran sideways and could not be got back —
`panfield.mjs` measured why: a horizontal drag inside a focused field is
caret-and-selection on every engine, Chromium already pans one and iOS does not.
So the obvious reading of this direction is that it reopens that report.

⚠ **It does not, and the reason is the direction of the overflow.** The field is
still a `<textarea>`, still wrapping internally, and it is now `--leading-line`
tall with `overflow-y: auto`. The words above the caret are off the **top** of a
28px box rather than off the right of it — and vertical overflow in a textarea is
an ordinary scroll box on every engine, with the caret kept in view by the engine
rather than by us. One flick away instead of unreachable.

⚠ **The scroll is on the field itself, not on an ancestor.** `grow-field`'s
wrapper could have been capped at one line and left to be scrolled by
scroll-into-view; that relies on the engine walking up to find a scroll container.
A textarea scrolling its own content to show its own caret is what textareas are.

⚠ **`grow-field` and `--sheet-cap` are deleted rather than pinned at 1.** Capping
would have left the ghost `::after` re-rendering `attr(data-value)` on every
keystroke to compute a constant. The mechanism's condition — *the height varies* —
is what the rule removed, so the mechanism goes. That is the order in *How things
get fixed*, and it is the third time this week the same order has applied to this
page.

### Flex, again, and why that is not a reversal

On 25 August the row was flex, a wrapped capture left its × and pencil at the
right margin level with the middle of the entry, and the row was made inline flow
with the note that **a flex container has no notion of *after the text ends***.
That note is still correct. It is also no longer about anything: with one
unbroken line there is no "after the text ends" distinct from "after the box",
because the box ends where the text does.

⚠ **And flex is now the only layout that can do the job.** One line means the
words have to **give up width** when the tail needs it, or the tail is pushed off
the row and clipped by the same `overflow: hidden` that draws the ellipsis.
`flex: 0 1 auto` with `min-width: 0` is exactly that, and inline layout has no
equivalent — an inline-block capped at `max-width: 100%` cannot know how much
room the glyphs after it want. The two decisions are mirrors of each other, taken
under opposite conditions.

⚠ **What went with the wrapping:** the last-word split, the `white-space: nowrap`
box binding it to the tail, and the two-halves a11y arrangement that split needed
— one `role="button"` labelled with the whole capture, one `aria-hidden` carrying
the same click. `keepwith.mjs` is kept: it is still a true measurement of wrapped
text, and this page has reversed itself twice in four days.

The year and the standing `?` moved **out** of the words span for a new reason,
not an old one: it is a clipping box now, so anything inside it is the first
thing an ellipsis eats. They are flex items of their own, `shrink-0`, carrying
the same silent click so a tap on the year still picks the line.

### What is given up, said plainly

⚠ **A long capture cannot be read in full from the record.** It shows what fits
and ends in an ellipsis. **Nothing is truncated in storage** — `aria-label` still
names the whole capture, the rewrite pencil opens all of it in the field, and the
matching path has never looked at the row. But *reading* a long one now takes a
gesture where it used to take none.

That is the cost of the density the direction asked for, and it was asked for
after seeing the alternative. The measurement: 50 rows, one height, 44px, on both
surfaces — `node_modules/.probe/oneline.mjs`.

### The height floor, which is now reached

⚠ **44px is where a row stops, and it is not a chosen number.** It is
`--line-hem` + `--leading-line` + `--line-hem`, which is also `--tap-floor`, which
is also the border box of `line-glyph` — the hit area of every control that rides
a line. Anything below it either takes the record's rows down with it or drops
the line's controls under 44px, and the second is a §11 guarantee.

**So the live row cannot be made shorter on its own.** The lever that remains is
the record's own density — `--text-line` and `--leading-line` together, which
would shrink every row of the record and the field with it. That is a product
decision about the page rather than a fix to the sheet, and it has not been taken.

## The line slides — 28 August

**Directed, and confirmed before a line was written:** *when a user is typing an
entry and reaches the end of the input row, the text already in the row should
move leftwards/rightwards (depending on user language)* — and, in the same
breath, *keep every published entry on one line only as is the case now.*

So: the record is untouched, and the field stops stacking and starts sliding.

### The element goes back to `<input>`

A `<textarea>` wraps by nature. Making one behave as a single line means
`wrap="off"` — a legacy attribute value — plus `white-space: pre`, propping a
multi-line element up in a role it was not built for. An `<input>` *is* the
element for a line, and sliding the value under the caret is what it already
does: the engine keeps the caret in view and scrolls the content, in the writing
direction, with no CSS and no script.

⚠ **So `page-input` declares nothing that produces the behaviour.** No
`white-space`, no `overflow-x`, no `text-overflow`. Everything left in it takes
away chrome the element came with — the UA border, padding, font and background —
and names the height so the field is exactly `--leading-line`, one row of the
record, rather than nearly it. A declaration that *caused* the sliding would be a
mechanism that could be wrong on an engine nobody has tested; there isn't one.

Deleted with the textarea: `resize`, `overflow-y`, `overscroll-behavior`,
`scrollbar-width` and the `::-webkit-scrollbar` rule. All five existed to make a
multi-line element show one line and scroll downwards.

### Twice in two days, and both reasons stand

This element was `<input>`, became `<textarea>` on the 27th, and is `<input>`
again on the 28th. Neither swap was a mistake and the register has to say so, or
somebody will "fix" it back.

- **27 August.** Reported: a capture longer than the column ran off the side and
  could not be got back. `panfield.mjs` measured why — a horizontal drag inside a
  focused field is caret-and-selection on every engine, Chromium pans one anyway
  and iOS does not, so a hand-written pan would have been a second pan on Android
  and a platform branch everywhere. Wrapping removed the condition.
- **28 August.** The wrap was replaced by the one-line rule for the whole page,
  which left the field showing its *last* line with the earlier words off the
  top. That was then rejected in favour of the line sliding — **asked for with
  the cost stated first**, in these terms: the words that have slid off stay
  reachable by caret, by selection and by Home, but not by swiping the row on a
  handset. Accepted at that price.

⚠ **The rule that said *never swap this for an `<input>`* was written the same
morning, under the opposite condition.** It is not being broken; its condition is
gone. That is the order *How things get fixed* asks for, applied to a rule rather
than to code, and it is the fourth time this week on this one page.

### `dir="auto"` is the whole of "depending on user language"

The direction is not read from a locale, a setting or `navigator.language`. The
field carries `dir="auto"`, so it takes its direction from the first strong
character **typed into it**: the value slides left under an English caret and
right under an Arabic one, and a person who writes in both gets both without ever
telling the app which. One standard attribute, no branch.

Measured on a 390px handset, same field, same session:

    Latin   overflow 508px   scrollLeft  +508   direction ltr
    Arabic  overflow  85px   scrollLeft   −85   direction rtl

A negative `scrollLeft` is how an RTL scroll offset is reported, so that pair is
the behaviour, not a coincidence. `node_modules/.probe/slide.mjs`.

⚠ **The drawn caret is `start-0` and never `left-0`.** It only appears while the
field is empty, and an empty `dir="auto"` field falls back to the page's own
direction — so the caret has to sit at the end the writing *begins* at, whichever
that is, rather than at the physical left.

⚠ **What is not done: the row itself does not flip.** The chips beside the field
and the record's own furniture stay on the physical right, because the document
is `lang="en"` with no `dir`. Making the page RTL is a page-level decision and
this is not it — what was asked for is that the writing slide the right way, and
it does.

## The writing box is the line — 28 August

**Directed:** *make the input box on the handset only tall enough to contain the
one line* — and, when the reply came back weighing it against the paperclip's tap
target, *I don't get why we can't simply have a row with just enough height to
contain the text and the paperclip; it would still be a lot shorter.*

**That objection was right and the reply that prompted it was wrong.** It had
been put as a trade-off — a 28px box or a 44px target, pick one — and it is not
one. The box has to *contain* the drawing; the target is invisible padding and
does not have to be inside the box at all.

### The height is the line box, and nothing in the row is taller

18px on `--leading-line`. The paperclip, the link chip and the photograph are all
`--glyph-line` or `--thumb`, and both are the height of the text by derivation —
`line-glyph`'s own rule is *larger than the drawing without being larger than the
row*. So there is nothing in that row asking for more than 28px, and 44 was the
row's hem, twice.

`--sheet-hem` is `0px`, with `--line-hem` restored above `--breakpoint-stack`. The
row wears `sheet-row` instead of `page-line` — identical in face, size, leading
and tracking, because a line being written and a line already written have to be
the same words in the same box, and different in exactly one property.

⚠ **A width rule, not a device rule.** The desk keeps its hem at the user's
direction; the switch is `@media (min-width: 54rem)` on `:root`, which is
`--breakpoint-stack` spelled out because a media query cannot resolve a `var()`.
No browser sniff, which *How things get fixed* rules out by name.

### `sheet-glyph`: the same 44px, hung where there is room

`line-glyph` splits its hem evenly above and below the line. In the record that
is exactly right — the overhang lands inside each row's own `--line-hem`, so two
rows' targets meet and never overlap. In a sheet with no hem there is nothing for
the lower half to land in: below the sheet is the top of the keyboard, so 8px of
every chip's target would be on the keys. 44px measured, 36px reachable.

⚠ **So the whole hem goes on top and nothing is given up.** Border box still
`--leading-line` + two hems = 44px = `--tap-floor`; negative margin still takes
all of it back, so the row is not a pixel taller. Only the side the invisible half
hangs off has changed, and it now reaches up over the scrim — a full-viewport
element with nothing behind it but a record already out of reach.

⚠ **Hit-tested, not reasoned.** `elementFromPoint` down the chip's centre line
returns the chip at the very top, the quarter, the middle and the very bottom of
its box; `shortbox.mjs` measures 16px of overhang above the row and **0px below
the sheet**. Both on a 390×844 handset.

⚠ **One rule on every surface.** Above the breakpoint the sheet has a hem again
and the upward hang is simply harmless — a pointer needs none of it. A `sheet-glyph`
that split its hem on the desk and stacked it on glass would be two behaviours
where one does.

### Measured

    handset   sheet 28   row 28   field 28   chip 44   above 16   below sheet 0
    desk      sheet 44   row 44   field 28   chip 44   above  8   below sheet −8
    record    one 44px row per entry, both surfaces, unchanged

## The notch's clearance, and when it stops being clearance — 28 August

**Reported from a handset**, and the first thing on this page to come back from
hardware rather than from a screenshot: *why is there a significant gap between
the top of the keyboard and the bottom of the characters? It's not the same
distance as between the top of the characters and the top of the row.*

### Traced by elimination before anything was proposed

Every box from the `<input>` up to the sheet's own edge, on a 390px handset:

    input.page-input     pad 0 / 0    margin 0 / 0    28px
    div.relative         pad 0 / 0    margin 0 / 0    28px
    div.sheet-row        pad 0 / 0    margin 0 / 0    28px
    div.gutter           pad 0 / 0    margin 0 / 0    28px
    div.writing-sheet    pad 0 / 0    margin 0 / 0    28px

Zero everywhere, and every box exactly `--leading-line`. So there was exactly one
declaration in the chain that could contribute anything — `padding-bottom:
env(safe-area-inset-bottom)` on the sheet — and it is also why the gap is
invisible on a desk: Chromium resolves the inset to zero.
`node_modules/.probe/gapcheck.mjs`.

⚠ **34px, under a 28px line.** The padding was taller than the thing it padded,
against nothing at all above it since `--sheet-hem` went to zero on glass. The
asymmetry was the whole complaint and it was arithmetic, not perception.

### The inset was right; the moment was wrong

`env(safe-area-inset-bottom)` keeps content off the home indicator, and that is
correct while the sheet is on the bottom edge of the glass. **With a keyboard up
the sheet is not on that edge** — it is parked at `--keyboard-overlap`, and the
keyboard is already covering the indicator. iOS goes on reporting 34px because
the inset describes the *display*, not what is drawn over it.

    padding-bottom: max(
      0px,
      calc(env(safe-area-inset-bottom) - var(--keyboard-overlap, 0px))
    );

Keyboard up: the overlap dwarfs the inset, the term is zero, the line sits on the
keys. Keyboard down: the overlap is zero and the full inset applies. No branch, no
device check, and it says the true thing — *clear the indicator only while the
indicator is what you are on top of* — rather than correcting for the false one.

⚠ **`max()` rather than a bare subtraction.** A negative padding is not a thing,
and the clamp is what makes this safe where the inset is zero to begin with:
Android, the desk, a home-button iPhone. All of them reach zero from both
directions.

⚠ **A pleasant side effect worth not breaking.** Mid-animation, while the
keyboard is rising, `bottom` is the overlap and the padding is `34 − overlap`, so
the *content's* distance from the bottom of the glass is constant at 34px until
the keys pass it and then rides them. The line never dips below where it sat at
rest.

### ⚠ The notch is testable on this machine after all

Two entries in `CLAUDE.md` and one in this file have said that nothing here can
test an iOS inset. **`Emulation.setSafeAreaInsetsOverride` over CDP works** in the
Edge build the probes drive. It does not make this machine able to test iOS
*behaviour* — the keyboard, the pan, the focus rules are all still unanswerable —
but any arithmetic that reads `env(safe-area-inset-*)` can be driven here now.

Measured, keyboard up at a 336px overlap, inset forced to 34px:

    before — env(safe-area-inset-bottom)              pad 34px   below row 34   above 0
    after  — max(0, inset − overlap)                  pad  0px   below row  0   above 0

and across all four cells, `notch.mjs`:

    inset 34, keyboard down    pad 34   sheet 62   the indicator cleared, correctly
    inset 34, keyboard up      pad  0   sheet 28   the reported bug, closed
    no inset, keyboard up      pad  0   sheet 28   unchanged
    no inset, keyboard down    pad  0   sheet 28   unchanged

The reported bug was reproduced before it was fixed, which is the first time that
has been possible for anything on this page that involved a notch.

### A tad more, on both — the same afternoon

**Directed, immediately after the notch fix:** *let's have a tad more space
between the top of the keyboard and the bottom of the characters* — and, in the
next breath, *apply a tad more space to the desktop version, too.*

⚠ **This is not the short box being undone; it is the first time the box could
be judged.** Until the inset came out, 34px of dead padding sat under the line on
a handset, so *tight* and *roomy* could not be told apart there. With it gone,
zero read as a shade tight. Both surfaces went up by the same quarter of a rem.

    --sheet-hem   glass   0        →  calc(var(--line-hem) / 2)     4px
                  desk    8px      →  calc(var(--line-hem) * 1.5)  12px

⚠ **Scaled from `--line-hem`, not typed.** The record owns the one hem this page
has; the sheet says how much of it to spend. Two literals here would be two
numbers to keep in step with a third.

⚠ **Above and below, never below alone.** The obvious reading of *space between
the keyboard and the characters* is to buy it on the keyboard's side — which is
the complaint that had just been fixed, in miniature: *a gap under the characters
that is not matched above*. The line sits in the middle of its own box, as every
other row on this page does.

Measured, with the notch emulated so the handset's keyboard-up case is the real
one — `node_modules/.probe/tad.mjs`:

    handset, keys up      sheet 36   above 4    below 4     chip 44, ends 4px inside
    handset, keys down    sheet 70   above 4    below 38    the 34px indicator, cleared
    desk                  sheet 52   above 12   below 12    chip 44, ends 12px inside
    record                one 44px row per entry, both surfaces, untouched

⚠ **`sheet-glyph`'s upward hang stays right at 4px.** Half a hem does not hold
half a 44px target: split evenly, 4px of every chip would still be on the keys.
The probe checks the chip's box ends *inside* the sheet rather than past it.

## One strip on the bottom edge — 28 August

**Directed, and it closed four rounds at once:** *the row at the bottom that
contains the glyphs should simply swap out the glyphs for the live row.*

⚠ **Every question asked about the sheet's height that afternoon was really this
one.** Too tall; only as tall as the line; a tad more; a tad more on the desk
too. The thing being noticed was not a wrong number — it was that **the bottom
edge of the screen changed shape when writing started**: 44px of foot bar became
36px of writing sheet, in a different ground, with the contents at a different
height. One strip with two states removes the question instead of answering it a
fifth time.

### The height was never chosen

    --line-hem  +  --leading-line  +  --line-hem   =  44px

which is `--tap-floor`, and a row of the record, and **exactly what the handset's
foot bar already measured** — 9 + 26 + 9, a number arrived at on 24 August from
the thumb rather than the look. Three constraints that had to agree turned out to
already agree. Nothing new was introduced.

⚠ **It undoes the 36px, knowingly.** That was the tighter box and it is the thing
being traded for a strip that does not move.

### What one strip forced, and what it deleted

- ⚠ **It still has to lift to the keyboard.** The foot deliberately never did —
  `useKeyboardPin` was deleted after five wrong versions of holding a bar on the
  keys — and the field always must. One object in two positions does both: idle
  on the glass, writing on `--keyboard-overlap`. The notch expression written an
  hour earlier already covers both ends, clearing the home indicator on the glass
  and collapsing to zero on the keys.
- ⚠ **A one-cell grid, not a conditional render.** Both rows sit at `1 / 1`, so
  the cell is as tall as the taller of them and swapping cannot resize anything.
  **Neither may be unmounted or given `display: none`** — that would let the
  strip resize again, and a hidden field cannot take the synchronous focus iOS
  requires to raise a keyboard.
- ⚠ **Two grounds, one box.** Idle is glass, because the record dissolving under
  the glyphs is what the foot has always been. Writing is opaque and lit, because
  the strip then holds body text at the record's own size and a line showing
  through would read as a second line of the capture. Both rules survive intact;
  the ground is what says which state it is in.
- ⚠ **The glyphs' 44px stopped being a warning and became a construction.**
  `--glyph-foot` is 26px centred in a 28px cell, so `tap-target`'s pseudo-element
  reaches 9px each way — 1px of cell, 8px of hem — and lands flush with the
  strip's edges. The old `--foot-lead` note said the next pixel would push that
  hit area out over the record. There is no next pixel to take; the box is a row
  of the record and the row is the floor.
- **Deleted:** `--foot-lead`, `--foot-tail`, their 45rem overrides (48px was a
  third box for the same strip), `Foot`'s `fixed inset-x-0 bottom-0`, its glass,
  its safe-area padding, its `will-change`, and its `receded` prop.
  `--foot-height` is now `--leading-line` between two `--sheet-hem`s.

### Above the breakpoint, nothing

There is no foot bar at or above `--breakpoint-stack` — the tools stand beside
the reading column — so there is nothing to swap with and nothing to match. The
strip is the field alone up there, at a hem and a half, translated off the glass
when idle, exactly as the sheet always was. Untouched, at the user's direction.

### Measured

`node_modules/.probe/strip.mjs`, distances from the bottom of the window; the
notch emulated on the handset:

    phone   idle          strip 78   row 44   glyphs 70→42   field faded
    phone   writing       strip 78   row 44   field  70→42   glyphs faded
    phone   writing, keys strip 44   row 44   field 372→344, riding a 336px keyboard
    narrow  idle          strip 44   row 44   glyphs 36→8
    narrow  writing       strip 44   row 44   field  36→8
    desk    idle          strip 52, off the glass          no glyph row at all
    desk    writing       strip 52   row 52   field  40→12

**The row is 44px in every state on both narrow surfaces, and the field and the
glyphs occupy the same 28px.** `striprecede.mjs` confirms the strip still leaves
while the record is read and comes back: 44 → off the glass → 44.

## The desk is the same design, four-thirds the size — 28 August

**Directed:** *now for an overall aesthetic redesign for the desktop version.
Make the text bigger. I want it in your face, pretty much. Adjust everything as a
whole, i.e. so everything stays in keeping.*

The last clause is the design. A 680px column of 18px text floating in the middle
of a 1440px window, with 26px glyphs stranded beside it, does not read as
restraint — it reads as small. But every proportion on this page has been argued
into place over three weeks, and a redesign that re-picked fifteen numbers by eye
would have broken most of them silently and none of them visibly.

### So nothing was re-picked

Every token in `globals.css` is a `rem`. One declaration moves all of them:

    @media (min-width: 72rem) { html { font-size: 133.3333% } }

The record's line goes **18/28 → 24/37.33** in a column that goes **680 →
906.67px**. The strip on the bottom edge goes 44 → 58.67. The wordmark 24 → 32.
The glyphs, the gutters, the two bars, the tool stack, the caret and the day
stamps all follow in exact proportion. **The desk is not a second design to keep
in step with the first; it is the same design at a different size**, and it
cannot drift because there is nothing to drift from.

⚠ **This is deliberately a scale and not a re-proportioning.** A redesign that
made the text grow *faster* than the chrome was the obvious alternative and was
not taken: the ratios between the line, its hem, its glyphs and its tap targets
are the accumulated output of a dozen decisions in this file, several of them
measured on hardware. Multiplying them all by one number preserves every one; a
new set of ratios would have to earn each of them again.

### Three things that make it safe

⚠ **`133.3333%`, never `21.3333px` and never a `rem`.** A percentage is relative
to the size the *browser* was told to use, so somebody who has set their default
to 20px gets 26.67px here instead of being overridden back down to ours. On the
root element a `rem` resolves against the **initial** value rather than the
inherited one, so it would ignore that preference exactly as a px would.

⚠ **A media query's `rem` is always the initial font size, never the root's
computed value.** That is the only reason this is expressible at all: the query
stays anchored at 1152px while everything it gates grows, so the scale cannot
feed back into the width that triggers it. The scale and `--breakpoint-stack` are
set to the same figure so the desk's type and the desk's layout arrive on the
same pixel.

⚠ **4/3 is a ratio this file already spends** — `--pane-corner` and `--pane-glyph`
are the same step. It puts the record's line on 24px, a whole step rather than a
half, and it lands `--breakpoint-stack` on a round 72rem.

### The two breakpoints had to be recomputed by hand

A media query cannot resolve a `var()`, so neither could follow on its own.

- **`--breakpoint-stack` 54 → 72rem.** The sum is unchanged:
  `--page-measure + 2 × (--stack-width + --stack-inset)` is still 54rem, just
  measured at a bigger rem. 54 × 4/3 = 72. ⚠ **Between 54 and 72rem the tools go
  back to the foot** — the same guarantee honestly recomputed, because a 907px
  column does not leave room for a stack on a 900px window. Those widths get the
  strip, which is a complete layout and not a degradation.
- **`--breakpoint-pane` 74.6667 → 99.5556rem.** It exists so that no part of the
  film screen's `+` can ever be obscured, and the disc it measures grew with
  everything else. A desk under 1593px now gets the takeover rather than the
  panel — the guarantee holding, not breaking. It is the sixth time that number
  has moved and the first that was not about the disc's size.

### What must not scale, and does not

`--tap-floor` stays `44px`: it is a thumb, not a type size.
`env(safe-area-inset-*)` is the device's own geometry. `--keyboard-overlap` is
measured in px by `useKeyboardHem`. `input-text`'s coarse `16px` is the threshold
under which iOS Safari zooms on focus, not a design value. **Hardware does not
get bigger because a window did.**

⚠ **Two px type values were converted so they would not be left behind** —
`body`'s 15px and `input-text`'s fine 13px, now `0.9375rem` and `0.8125rem`. Both
are identical below the breakpoint, where the root is the browser's default. If a
third px type value ever appears it will silently stay small on the desk; there
should not be a third.

### Measured

`node_modules/.probe/scale.mjs`, across both boundaries:

    390px    root 16      15 body   18/28    row 44   column 390   mark 20
    864px    root 16      15 body   18/28    row 44   column 680   mark 24
    1151px   root 16      15 body   18/28    row 44   column 680   mark 24
    1152px   root 21.33   20 body   24/37.33 row 59   column 907   mark 32
    1440px   root 21.33   20 body   24/37.33 row 59   column 907   mark 32

**Below 72rem nothing moves at all**, which is the check that matters most: the
handset is untouched. At 1152px exactly, the tool stack's left edge measures 27px
— on screen, so the breakpoint's own guarantee holds at the pixel it is made.

### The notch's clearance is split, so the glyphs sit on the bar's centre line

**Reported from a handset, the same evening:** *in the handset version, move the
glyphs in the bottom bar so they sit more centrally in the bar, i.e. lower than
their current position.*

They were high by **17px**, which is `34 / 2` and not a coincidence: all of
`env(safe-area-inset-bottom)` was below the row, so on a Face-ID iPhone the strip
is 78px of visible ground with its contents centred in the top 44.

⚠ **`padding-block`, halved, rather than a nudge.** The same clearance split
evenly above and below puts the row on the centre line **at any inset**, and the
strip's total height does not change by a pixel — so `page-hem`'s reserve and
everything else reading `--foot-height` are untouched. On a surface with no inset
it is zero on both sides and nothing moves; with a keyboard up the term is
already zero, so the writing state is unaffected.

⚠ **The drawing stays clear of the indicator, which is the rule this could have
broken.** Half the clearance leaves the glyph's lowest pixel 26px off the bottom
of the glass, against a home-indicator pill inside the bottom 13. What reaches
into the gesture area is the invisible half of the 44px hit box, where a *tap*
still lands on the page — only an edge swipe belongs to the system.

`node_modules/.probe/glyphsit.mjs`:

    before   inset 34   strip 78   row 78→34   drawing 69→43   17px high
    after    inset 34   strip 78   row 61→17   drawing 52→26   centred
    after    inset  0   strip 44   row 44→0    drawing 35→9    centred

## The mark's column, and what may not cross into it — 28 August

**Directed, for the desk:** *never allow the entries column to overlap the logo
'column'. And never allow the vertical glyphs to go past midpoint of the logo
'column'.*

The mark is anchored to the bar's left gutter, so it holds a fixed vertical band
down the left of the window at every desk width — measured **43 → 157px**,
midpoint 100. Two things were crossing it, at two different widths:

- **The record column, below 1221px.** At 1152 its left edge is 123 — 34px inside
  the band. The bar is *glass*, so lines scrolling under it pass behind the
  letters.
- **The tool stack, below 1299px.** It sits a fixed 96px left of the column and
  therefore tracks the column outward; at 1280 its left edge was 91 against a
  midpoint of 100, and at 1152 it was 27.

### Clamped, not answered with a breakpoint

⚠ **Raising `--breakpoint-stack` to 1299px was the one-number fix and was put to
the user against the clamp, with the cost stated.** The type scale is tied to
that breakpoint, so every window under 1299 would have lost the desk layout *and*
the larger type — 1280×800 laptops included. The clamps hold at **every** width
instead of above a line, and above about 1300px they change nothing, because the
unclamped term wins.

    --mark-column       --bar-gutter + --text-mark × --wordmark-advance-ratio
    --mark-column-mid   the same, half the advance
    --record-measure    --page-measure, or the space between the band and its
                        mirror on the right, whichever is smaller (desk only)
    stack left          max(mid + stack width, its old column-tracking term)

⚠ **The column narrows rather than shifting.** A column nudged right to clear the
mark would be off-centre against the bar's right-hand glyphs and against the
writing strip below it, both of which are centred on the window. Losing width is
the honest cost of a window too narrow to hold the mark and the measure at once —
838px at 1152, back to the full 906.67 by 1221.

⚠ **The `100%` in `--record-measure` resolves per element**, which is what lets
`main` and the tool stack agree without either being told the window's width.
Both have the viewport for a containing block.

### The seventh number in the fence

⚠ **Every measured number for the mark was vertical until now**, because nothing
had needed to know how *wide* AGAIN sets. `--wordmark-advance-ratio` is how wide
it sets per 1px of font-size, measured by `node_modules/.probe/markwidth.mjs` at
four sizes to prove it is a ratio and not a size — 3.5695 / 3.5690 / 3.5693 /
3.5691. It has to be constant: the tracking is in `em`.

It is the **advance**, including the trailing 0.08em after the final N, not the
ink. A band reserved for the mark should err wide, and the alternative is a
second number describing the same word.

⚠ **Bebas Neue measures 2.8875 and it is written into the reserve block.** Nearly
a fifth narrower, which would give the record column back about 45px on the desk.
As with the other six: do not reason one face's set into another's.

### Measured

`node_modules/.probe/logocol.mjs`, before and after:

    width   column left  (was)   stack left  (was)   column width
    1152        157      (123)       100      ( 27)      838
    1280        187      (187)       100      ( 91)      907
    1366        230      (230)       134      (134)      907
    1440        267      (267)       171      (171)      907
    1728        411      (411)       315      (315)      907

Both rules hold at every desk width, and at 1152 both land exactly flush — the
column's left edge on the mark's right, the stack's left edge on the mark's
midpoint. Below the desk nothing changed: at 800px the column is still 680px at
x=60.

### The glyphs sit *on* the midpoint, not beside it

**Directed, an hour later:** *almost what I want, but I want the vertical glyphs
to be at the midpoint of the logo column at the point the transition happens.*

The floor was `--mark-column-mid + --stack-width`, which put the stack's **left
edge** on the midpoint. The glyph drawings are `--glyph-foot` centred in a
`--stack-width` box, so at 1152 they sat 112 → 146.67 — twelve pixels to the
right of a midpoint of 100. **The box was on the midpoint and the marks were
not.**

⚠ **`+ --stack-width / 2`, and the half is the whole correction.** It puts the
box's *centre* on the midpoint, and since the glyphs are centred in the box, what
lands on the mark's midpoint is the drawing.

⚠ **It also moves the handover, which is the other half of what was asked for.**
The `max()` switches where its terms are equal:

    (V − 906.67)/2 + 26.67 − 64  =  100 + 58.67/2  =  129.33
    V = 1240px

Below 1240 the stack is parked with its centre on the mark's midpoint; at 1240
exactly the parked position *is* the tracking position, so the glyphs are on the
midpoint at the moment the clamp engages and nothing jumps through it. Above it
the tracking term wins and nothing has changed at all. It was 1299px while the
floor was a whole stack-width.

`node_modules/.probe/logocol.mjs`, with the assertion changed to the new rule —
the stack's centre is never left of the mark's midpoint:

    width   column left   column width   stack centre
    1152        157           838            100      parked, on the midpoint
    1200        157           886            100      parked
    1240        167           907            100      the handover, exact
    1280        187           907            120      tracking
    1366        230           907            163      tracking
    1440        267           907            200      tracking

## The column and the mark jumped backwards at the desk threshold — fixed

**Reported and fixed on 28 August. The scale is a ramp now, not a step.** What
shipped is the approach this section had already worked out; everything below is
kept, including what it got wrong, because the measurement is the argument. *One particular problem I have is the
adjustment that happens at the threshold, namely the jump that the logo and the
entry column make when resizing. I'd rather the entry column continues moving in
the same direction it was moving when the browser was narrowing, instead of
jumping back in the other direction before restarting in its previous shift
leftwards. This has to be designed and managed with the other elements in mind.*

**What shipped**, in one place, so nobody has to reconstruct it from the walk:

- `html`'s `font-size` is `clamp(100%, calc(100% + (100vw − 57.207rem) ×
  0.0225339), 133.3333%)`, inside `@media (min-width: 57.207rem)`.
- `--record-measure`'s clamp moved into **that same media query**, down from
  `--breakpoint-stack` where it was written.
- `--breakpoint-scale` was written as a token and then **deleted**: it lives in
  `@theme`, Tailwind prunes theme variables no class uses, and a
  `--breakpoint-*` name also mints a variant nothing wants. It could not be a
  `var()` at either site anyway — a media query cannot resolve one, and on the
  root element a custom property carrying a `rem` into `font-size` is a cycle.
  So the number lives where it is spent, with its derivation beside it, and
  `threshold.mjs` reads both literals back out of the **shipped** stylesheet.

The rest of this section is the map, the measurement, and the approach, written
down while it was fresh — and then the three checks it asked for, answered.

### What actually happens, measured

`node_modules/.probe/threshold.mjs` walks the viewport across every regime
boundary and reads the column, the mark and the stack. Narrowing from 1440:

    width   root    column left + width    mark left @ size   stack centre
    1440    21.33   266.7 + 906.7          42.7 @ 32          200
    1300    21.33   196.7 + 906.7          42.7 @ 32          130
    1241    21.33   167.2 + 906.7          42.7 @ 32          100.5
    1240    21.33   166.7 + 906.7          42.7 @ 32          100    stack parks
    1221    21.33   157.2 + 906.7          42.7 @ 32           99.8  column clamp on
    1200    21.33   156.9 + 886.3          42.7 @ 32           99.8
    1152    21.33   156.9 + 838.3          42.7 @ 32           99.8
    1151    16      235.5 + 680            32   @ 24          —     ⚠ JUMP
    1100    16      210   + 680            32   @ 24          —
     720    16      20    + 680            32   @ 24          —
     719    16      19.5  + 680            20   @ 20          —     rail step

⚠ **The column's left edge moves left continuously from 1440 down to 1152 — and
then leaps 78.6px to the RIGHT in one pixel of window.** The mark jumps the other
way, 42.7 → 32, and shrinks 32px → 24px. That reversal is the whole report.

⚠ **The two clamps added earlier that day are NOT the cause, and the walk proves
it.** The stack's handover at 1240 is continuous by construction — the terms are
equal there — and the column clamp at 1221 is continuous in position (157.2 →
156.9); only the *rate* changes as the column starts narrowing instead of moving.
Both were designed to be smooth and both are.

### The cause is one declaration

`html { font-size: 133.3333% }` at `min-width: 72rem`. **Every rem in the app
snaps by a factor of 0.75 in a single pixel of window**, and the column's left
edge is `(V − measure)/2` with `measure` in rem, so it jumps by half the change
in measure: `(906.7 − 680)/2 = 113.4`, less the 34.8 the clamp had already taken
out. The strength of the root-scale approach — one number moves everything — is
exactly what makes its boundary violent.

### What looks right: make the scale fluid, ending at 72rem

Interpolate the root size over a range instead of stepping it, so nothing snaps:

    html { font-size: clamp(100%, calc(100% + (100vw − Wmin) × k), 133.3333%) }

with the ramp **ending at 1152px**, where the stack appears. Then at and above
`--breakpoint-stack` the scale is at maximum and every piece of arithmetic
already written stays exactly true — `--breakpoint-stack: 72rem` is still the
same sum measured at the same rem, and `--breakpoint-pane` with it.

⚠ **Where the ramp should START is the interesting part, and it is calculable
rather than a matter of taste.** The `--record-measure` clamp must switch on
where it changes nothing, or it introduces a second jump of its own. The clamp is
a no-op where

    V − 2 × --mark-column  =  --page-measure
    --mark-column = (2 + 1.5 × 3.569) rem = 7.3535rem = 117.66px at s = 1
    V = 680 + 2 × 117.66 = 915.3px

So **ramp from ≈915px to 1152px**. Below 915 the layout is exactly what ships
today; at 915 the clamp engages as a no-op and the type begins to grow; by 1152
the type is at 4/3 and the column is 838 at left 156.9. Checked for monotonicity:

- **915 → 1152**: the clamp binds throughout, so the column's left edge *is*
  `--mark-column` = 117.66 × s(V), which rises with V — i.e. moves left as the
  window narrows. ✓
- **below 915**: left = (V − 680)/2, which also falls as V narrows, and meets
  117.5 at 915 against the clamp's 117.66. ✓ Continuous to a rounding.
- **the mark**: left = `--bar-gutter` = 2rem × s, and size = 1.5rem × s. Both
  continuous through the whole ramp. ✓

### What that leaves, and what it does not fix

- ⚠ **The stack still appears at 1152 and the bottom strip still disappears.**
  That is an element arriving, not a position jumping, and it arrives already
  parked on the mark's midpoint. Probably fine; look at it before deciding.
- ⚠ **The rail step at 720px survives** — the mark goes 24 → 20px and
  `--bar-gutter` 2rem → 1.25rem. The column is continuous through it (20 → 19.5)
  because the gutter has taken over by then, so only the mark twitches. Same
  class of problem, much smaller, pre-existing.
- **Everything else on the page follows the root**, so the strip, the row
  rhythm, the glyphs and the caret all become continuous for free — which is the
  same reason the step is violent today.

### The three things to verify, answered

All three are now assertions inside `node_modules/.probe/threshold.mjs`, so they
are re-checked rather than remembered.

1. **`calc()` mixing a percentage with `vw`, and zoom.** Accepted. The build
   folds it — lightningcss rewrites `(100vw − 57.207rem) × 0.0225339` into
   `2.25339vw − 1.2891rem` — which is why the probe recovers the start as
   *rem term ÷ slope* out of the shipped sheet instead of trusting the source.
   **Zoom is measured at 50 / 100 / 200%** on a 1440px window: at 200% the CSS
   viewport is 720px and the root is back at the reader's own 16px; at 50% it is
   2880px and the root is at the 4/3 ceiling. The `clamp()` endpoints are what
   make both ends legal.

   ⚠ **One correction to the note above: the two ends of the ramp are `rem`, and
   deliberately.** The worry was that a `rem` would override a reader's default
   — true of a *fixed* one, false of one measuring the window. The initial value
   of `font-size` is `medium`, which **is** the reader's default, so `57.207rem`
   on the root is 57.207 × their size, exactly as a media query's `rem` is. That
   is what keeps the ramp's end and `--breakpoint-stack` on one pixel for every
   reader rather than only for a 16px one. Only the *slope* is unitless.
2. **The scrollbar does not oscillate, and it is measured rather than argued.**
   At 1034px with a real 15px classic scrollbar, `100vw` is 1034 whether the bar
   is drawn or not — it is `innerWidth`, the window including the bar's channel —
   and the root does not move. ⚠ **That check needs its own browser**: headless
   Chromium passes `--hide-scrollbars`, so every other measurement here runs at a
   0px scrollbar and could not tell a stable `100vw` from an oscillating one. The
   probe launches a second Edge with `ignoreDefaultArgs: ['--hide-scrollbars']`
   and **fails if no bar was drawn**, because a check that proves nothing must not
   pass.

   ⚠ **The mismatch that remains is spent on the safe side.** `100vw` counts the
   bar and a media query's width does not, so the ramp reaches its ceiling at
   `100vw = 1152` — about 1137px of query width — and never after 1152. Late
   would mean the type still climbing at `--breakpoint-stack`, and 72rem would
   stop being the 54rem sum it claims to be. Early is invisible.
3. **The walk is monotonic and both of the mark's rules still hold.** 34 widths
   from 1440 to 390, no `← COLUMN MOVED RIGHT` row: the column's left edge goes
   266.7 → 156.9 → 117.5 → 20 → 0 without ever reversing, and the 78.6px leap at
   1152 is gone (156.9 → 156.7). `logocol.mjs` now walks from **916**, not 1152,
   because the record's clamp moved down with the ramp — the rule *the entries
   column may never overlap the logo's column* is claimed at every width from 916
   up. 915 is walked to show what it does **not** claim.

### Closed: the residual jump was a stale build

**Reported after the ramp shipped, then withdrawn — 28 August.** *There is still
a discontinuity at the point we resize*, described as the entry column being
thrown back rightwards where the logo shrinks. That is the shape of the ORIGINAL
symptom, and at the time it was reported the ramp existed only on
`phase-1-capture`: production was two commits behind. Once deployed, the user
confirmed it fixed.

⚠ **The lesson is cheap and worth keeping: establish which build is on screen
before measuring anything.** Two rounds of measurement went into a page that did
not have the fix on it.

⚠ **One real finding survives, unreported and NOT a bug anyone has complained
about:** at 1152 the strip does not resize, it **leaves** — `stripTop` +58.56,
`stripHeight` +10.74, `colPadBottom` +5.39, and the tool stack arriving, all on
one pixel. Below `--breakpoint-stack` the strip sits on the bottom edge with its
glyphs; above it there is no foot and the idle strip is translated off the glass.
`node_modules/.probe/stillsteps.mjs` walks it. Leave it alone until somebody says
it reads badly.

### What it cost, and what to look at

- ⚠ **915–1152 is a layout nobody had seen.** The desk's type at part of its
  growth, the record narrowed by the mark's band, and the foot's glyph strip
  still under it because the tool stack does not arrive until
  `--breakpoint-stack`. It reads as coherent in `scale-ramp-1034.png` and it has
  **not been looked at on hardware**; an iPad in landscape lands in it.
- ⚠ **The strip still steps at 1152, 58.67 → 69px**, because `--sheet-hem` is a
  hem and a half above `--breakpoint-stack` and a hem below it. That step was
  always there; it was hidden inside the bigger one. It is the same class as the
  stack arriving, and it is deliberately not ramped — the strip is a different
  object on each side of that line.
- **`scale.mjs` lost 1151 and gained 915, 916 and 1034.** 1151 used to be the
  pixel proving *below the breakpoint nothing moves*; it is inside the scale now,
  and 915 carries that claim. 1034 is the new one: mid-ramp, every proportion
  intact — root 18.67, line 21.01 on 32.68, rows 51, mark 28.01.

### Alternatives considered and why they were worse

- **Move the step to where the column is continuous.** The two positions coincide
  at V = 994px, so a threshold there makes the *column* smooth — but the mark,
  the row heights and the strip all still snap by 0.75. It fixes one element of
  the report and not the other.
- **Raise or lower the breakpoint.** Moves the jump; does not remove it.
- **Left-align the column to the mark's band instead of centring it.** Removes
  the jump by removing the centring, and the column would then disagree with the
  bar's right-hand glyphs and the writing strip, which are centred on the window.

## The record column stopped clearing the mark below 915px — 29 August

**Reported:** *when the desktop browser is narrowed to the point the font size
reaches its minimum, the entry column stops moving closer to the logo column even
if the narrowing of the browser continues.* Stated as the behaviour wanted, and
it was not the behaviour shipped.

### What was actually happening

`--record-measure`'s clamp — the rule *the entries column may never overlap the
logo's column* — lived inside `@media (min-width: 57.207rem)`, and it was put
there on 28 August for a good reason: **57.207rem is by construction the width at
which that clamp is a no-op**, so switching it on there is free and switching it
on anywhere else is a jump.

The consequence nobody drew at the time is that *the width where a clamp costs
nothing is the width where it starts to matter*. The gate was on the exact pixel
the rule began to bite. Measured by `node_modules/.probe/markgap.mjs` on the
build before the fix:

| window | column's left edge | mark's band ends | gap |
| --- | --- | --- | --- |
| 1221 → 916 | tracks the band exactly | 156.8 → 117.8 | **0, welded** |
| 915 | 117.5 | 117.7 | −0.2 |
| 900 | 110 | 117.7 | −7.7 |
| 800 | 60 | 117.7 | −57.7 |
| 720 | 20 | 117.7 | −97.7 |
| 660 and below | 0 | 91.4 | −91.4 |

So from 1221 down the column's left edge is welded to the mark's right edge, and
at 915 it comes off and dives. The bar is glass, so what is under the letters is
the record scrolling behind them.

### The fix

**The gate was removed, not moved** — *How things get fixed* reaches for removing
the mechanism before correcting it, and a clamp that is right at every width does
not need a media query. `--record-measure` is now unconditional:

    min(--page-measure, max(--record-floor, 100% − 2 × --mark-column))

### Why there has to be a floor, and why it is 33.5775rem

Unbounded, the clamp goes on narrowing the column until the record is a ribbon —
207px on a 390px handset. It also runs into the mark's own step: at
`--breakpoint-rail` the mark shrinks (`--text-mark` 1.5 → 1.25rem,
`--bar-gutter` 2 → 1.25rem), so the band it holds steps 7.3535 → 5.71125rem in
one pixel and a column derived from the band alone would step **up 51px at 719**.
That is the same violent boundary the desk's ramp had just been built to remove,
relocated to a narrower window.

`--record-floor` is **the measure the narrower band hands back at the breakpoint
itself**:

    --breakpoint-rail − 2 × (--bar-gutter + --text-mark × --wordmark-advance-ratio)
  = 45rem − 2 × (1.25rem + 1.25rem × 3.569)  =  33.5775rem  =  537.24px

At 720 the clamp wants 484.7 and at 719 it wants 536.2; both are under the floor,
so the floor is what is chosen on both sides and **the step cannot surface**. Any
lower floor lets it back through; any higher one protects the mark across less of
the range. It is the lowest floor that stays continuous, which makes it derived
rather than picked.

⚠ **The two `1.25rem` are written out instead of read through `var()`**, and
that is deliberate: custom properties resolve at use, so `var(--bar-gutter)`
inside the floor would pick up the rail's *override* and derive the floor from
the wrong band — the one that does not apply below the breakpoint the floor is
measured at. It is the same situation as the ramp's two `57.207rem` literals, and
it is handled the same way: `markgap.mjs` recomputes the floor from the live
below-rail tokens and asserts the expression against it.

### What it costs, stated rather than discovered later

- **773 → 1221px: the column's left edge does not move.** It is pinned on the
  mark's right edge for 448px of window travel. That is what was asked for.
- **537 → 772px: the record is a fixed 537px measure** rather than growing back
  to 680. Roughly 60 characters at 18px — a better measure than the full 680, and
  more usefully a *stable* one across the whole band.
- **Below 772.55px the column resumes sliding under the mark**, from zero,
  continuously. The rule is not claimed there and cannot be: something has to
  give when the window cannot hold the mark's band twice over plus a readable
  measure, and below the floor the honest answer is the band.
- ⚠ **Below 537px nothing changed at all.** The window is narrower than the
  floor, `w-full` wins, and the handset is byte-for-byte what it was. Verified
  at 390, 393, 430 and 500.

### The ramp kept its number and lost a reason

57.207rem used to be justified twice over — the width at which the record's clamp
is a no-op, *and* the width at which the record has its full measure. Those were
the same number, which is why the two shared one media query. With the clamp
ungated only the second reason survives, and it is still the right one: type that
grows while the measure is still short is growing into a column that has not
finished arriving. **The number did not move**, the sum is the same, and
`threshold.mjs` still derives it from the same fence and reads it back out of the
shipped stylesheet.

### Alternatives considered and why they were worse

- **Move the gate down to `--breakpoint-rail`.** Corrects rather than removes,
  and it is worse than doing nothing: the clamp would hand back 484.7px at 720
  and 680px at 719, a **195px jump** in one pixel.
- **Extend the clamp with no floor.** A 51px jump at 719 from the mark's own
  step, and a 207px reading column on a handset. Rejected on both.
- **Shift the column right to clear the mark instead of narrowing it.** Already
  ruled out when the rule was written and still ruled out: the column would then
  be off-centre against the bar's right-hand glyphs and the writing strip, which
  are centred on the window.
- **Remove the mark's 720px step so the band is continuous, then floor lower.**
  Genuinely tempting and deliberately not done — it is a change to the bar on
  every surface in service of a 235px band of desktop window. If that step is
  ever removed for its own reasons, the floor can come down with it.

### Not addressed, and visible in the same range

Between 773 and 1152 the writing strip is `--sheet-measure` capped by the
gutter — the whole glass — while the record is now 537–680px. The strip has been
wider than the record since 28 August by decision, but this widens the
difference. Nobody has looked at it on a screen. It is one line of CSS to cap the
strip at `--record-measure` below `--breakpoint-stack` if it reads badly.

## OPEN QUESTION — colour-coding an entry by its type

**Raised 28 August, unbuilt, nobody has decided it.** *The possibility of
colour-coding each entry based on its type, so movie entries are 'red', for
example, sporting events 'green', or whatever.*

Recorded as asked. It is a genuine idea and it is **not** free, because this
page already spends colour under two scarcity rules that a third system would
break. Whoever picks this up should read the tension before drawing a palette.

### What it collides with

- ⚠ **`--color-accent` marks overlap state and nothing else, and
  `--color-chrome` means a control and never a state.** Both rules say the same
  thing from opposite sides: the page has exactly one colour a thumb can aim at
  and one colour that will mean *convergence*, and each stops meaning anything
  the moment it is spent on decoration. A per-kind palette is a **third** colour
  system, sitting on the record's body text, which is the largest surface on the
  screen. The risk is not that red is wrong; it is that after it, amber on a
  converged line reads as one more category.
- ⚠ **Phase 2's first visual decision is still unmade** — the colour overlap gets
  when there is a convergence to look at. It is already recorded that the screen
  got louder when the chrome took `#e8b34a`, so the colour to out-shout is the
  chrome rather than the muted brass. **Kind-colours would raise that floor
  again**, and they would be chosen before the thing they have to lose to. If
  both are wanted, overlap's colour should be picked **first**, and the kind
  palette built to stay under it.
- **Type is the entire design** (§11), matte black and legible text. That is not
  a veto — it is the reason a kind-colour has to be small: a tick, a rule, a
  stamp, the day-stamp's own colour, rather than the capture's words.

### What it needs from the data, which is the harder half

⚠ **A capture does not have a kind at the moment it is written, and that is the
whole product.** The re-direction makes the capture the private, user-owned
record — free text, saved without a forced catalogue match — which *may later*
resolve to a possibility. So:

- **Most lines on the record have no type to colour.** A palette keyed to kind
  colours the minority and leaves the majority in `--color-text`, which reads as
  *these ones are special* rather than *these ones are films*.
- ⚠ **It must not become a categorise-first flow.** Never ask the user to
  categorise anything is a standing rule, and Release 1 explicitly excludes *a
  forced search or catalogue match before a person can save a capture*. A colour
  that appears only after resolution is honest; a colour that asks the writer to
  pick one is the excluded flow wearing a palette.
- **So the real question is not which colours.** It is: **what does an unresolved
  capture look like beside a resolved one, and is a kind-colour the right way to
  show that a line found its possibility?** That framing may be more useful than
  the palette — the colour would then be carrying *resolution*, which is
  information the page currently has no way to show, and kind would just be
  which colour it happens to be.

### If it is built anyway, the cheap version first

Put it on the **furniture, not the words**: the existing day-stamp row, or a rule
in the line's own glyph column, both of which already exist and neither of which
is body text. That keeps §11's *type is the design*, keeps the capture's words in
one inherited colour, and can be switched off behind one constant if it reads as
noise — the wall's caption is the precedent for building something and leaving it
dark rather than deleting it.

⚠ **Accessibility is a hard floor, not a polish pass.** Colour may never be the
only carrier of a distinction, so whatever the palette says must also be said by
a word or a shape, and every colour must clear contrast on matte black — the
brass pair is 10.98:1 and 7.73:1, which is the bar this page has set itself.

## The desk's ink is lifted — raised as a note, CLOSED the same day — 30 August

**Raised by the user as a note rather than a task: "we changed the background
colour of the desktop version so it's less oppressive but may need to tweak the
logo and text colours so they're brighter."** It was left alone deliberately,
with the measurements written down, because the only thing that could settle it
was the real desk.

**The real desk answered: "the text on the desktop looks dull ever since we
changed the background colour."** So this section is now the record of a closed
decision. The note's own instruction — *lift the ink and not the ground* — is
what was built, and the table below is what the ground cost rather than what the
page now measures.

### What actually happened to the numbers

Lifting `--color-bg` from `#000000` to `#14140f` above `--breakpoint-stack` cost
every ratio in the palette about 12%, because contrast is a ratio and the
denominator moved:

| | on black | on `#14140f` |
|---|---|---|
| text `--color-text` | 16.83 | **14.81** |
| chrome `--color-chrome` (the mark, the glyphs) | 10.98 | **9.66** |
| the lacquer red | 4.26 | **3.75** |
| the live red | 5.92 | **5.21** |
| the listed green | 15.69 | **13.80** |

Every floor in the palette's own notes still holds — the mark is text and clears
4.5, both reds clear the 3:1 that WCAG 1.4.11 asks of a graphical control — so
**this is a perception question, not an accessibility failure.** Nothing here is
out of spec. `node_modules/.probe/deskpalette.mjs` renders the alternatives and
`deskground.mjs` asserts the ratios.

### What was built: the ink and the chrome, holding their ratios

**`--color-text` `#eae6da` → `#f9f4e8`, `--color-chrome` `#e8b34a` → `#f7bf4f`,
inside the desk's own `@media` block.** Both are the same colour carried up in
luminance with its chromaticity held — the linear RGB scaled by one factor, which
is the move `--color-chrome` itself made out of `--color-accent`.

⚠ **Not a mix toward white.** An sRGB `color-mix` is a gamma-space lerp, so
mixing the ink with white to reach the same luminance would have pulled its
warmth from R−B 16 down to about 5 — and warmth is most of what makes this page
read as printed rather than rendered, which is the whole argument in
`--color-text`'s own note. The scaled ink measures **17**.

⚠ **The target is the ratio the palette was picked at, never the pigment.** The
ink holds **16.832:1** against `#14140f` where the base ink holds 16.830:1
against `#000000`; the chrome **11.01** against 10.98. That is what makes this a
restoration rather than a taste: the desk reads as the handset reads, which is
what *the desk is the same design, four-thirds the size* asks of a colour exactly
as it asks it of a size.

⚠ **The chrome went with the text although only the text was reported, and the
reason is a relationship rather than a preference.** On black the chrome was
pitched at 65% of the ink's ratio, deliberately — loud enough to aim at, quiet
enough not to be the page. Lifting the ink alone drops it to 57% and re-pitches
the one colour a thumb aims at, as a side effect of a change to the text. **If
the lit brass reads too loud on the desk, that one line comes out and the ink
stays.**

### The two mixes had to move, and that is the derivation working

`--color-rule` and `--color-surface` on the desk are `color-mix`es **of the
ink**, so a brighter ink made both heavier: at their old percentages the hairline
would have read 1.644 against its 1.583 and the card 1.316 against its 1.286.
They are now **16.3%** and **10%**, holding 1.588 and 1.285.

⚠ **The hairline's hex barely changed — `#393933` → `#393932`.** That is what a
token that is mostly ground looks like when its ratio is held through a change at
the other end: a percentage point of arithmetic, and nothing on the glass. It is
also why this is worth doing rather than eyeballing — the number that moved is
not the number anybody would have looked at.

### What was NOT lifted, and why the tension resolved

The lacquer red stays at **3.75** on this ground, the live red at **5.21**, the
listed green at **13.80**. All three clear the floors their own notes name.

The note below framed this as the actual decision: lift the red and it stops
being the same red as the handset's; leave it and the gap to the ink widens.
**It resolved by noticing the two groups are different kinds of colour.** The ink
and the chrome are the page's *materials* — everything is drawn in one or the
other, and both are pitched against the ground, so when the ground moved they
were the things that lost. The reds and the green are scarce **state** colours
whose absolute value was chosen and whose floor is a WCAG threshold, not a
relationship to the ink. Restoring their ratios means picking three colours
nobody has looked at on the real desk, to close a gap nobody has reported.

### The ground still does not move

⚠ **The ground was chosen by looking at three candidates on the real page at
1440, and two lighter ones were refused** — *paper* (the palette inverted, the
handset's aged-paper ink as the ground) and *newsprint* (the same onto manila).
That is a record of what was considered, not a ladder to climb later: reopening
either means re-picking the brass, the lacquer red and the tool stack's glass
edge, all of which they measured out. **A dull desk is not answered by lifting
`--color-bg` a second time** — that re-opens the decision and drops every ratio
again.

### The original note, kept because the rule in it still holds

⚠ **The ground was chosen by looking at three candidates on the real page at
1440, and two lighter ones were refused** — *paper* (the palette inverted, the
handset's aged-paper ink as the ground) and *newsprint* (the same onto manila).
That is a record of what was considered, not a ladder to climb later: reopening
either means re-picking the brass, the lacquer red and the tool stack's glass
edge, all of which they measured out. So the thing to move is `--color-text` and
`--color-chrome`, inside the desk's own `@media` block, where the ground already
lives.

⚠ **It has to stay inside that query.** The handset is untouched *by
construction* — there is one palette and one override — and the whole point of
the 30 August change was that the phone keeps its true black. A lift applied at
the base would reach the one surface it was told not to.

⚠ **The lacquer red is the tightest and is the first thing to re-measure**, at
3.75 against a 3:1 floor — still true, and still the first thing to look at if
the ground ever moves again.

⚠ **Measured by `node_modules/.probe/deskink.mjs`.** It reads the ratios off the
live page rather than recomputing the source: the handset's palette is the
reference and is asserted untouched, the boundary is walked at 1152 and 1151, and
`--color-muted` is checked to have followed the ink with nothing declared — which
is its own note paying off. **It resolves `color-mix()` by painting it**, because
a custom property comes back from `getPropertyValue` as source text. ⚠ **And it
parses both `rgb()` and `color(srgb …)`**: the first version read only the first
form, and the two mixed tokens came back as eight-digit ratios rather than
failing in a recognisable way. A wrong number that cannot be read as wrong is
worse than a failure. `deskinklook.mjs` renders the before/after pair.

### The half nobody has looked at, and the lift made it a third thing

⚠ **915–1152px is part-grown type on the handset's BLACK ground**, because the
colour boundary is the layout's (72rem) and the type ramp's is 57.207rem. An iPad
in landscape lands there. **The desk's ink is now lifted, so that band is a third
combination nobody has seen** — handset ground, handset ink, desk-ish type size.
`CLAUDE.md` already flags the band as never having been on hardware, and this
does not make it worse than it was: the band was always the handset's palette,
and it still is, whole.

## The console, and what a tap on a line means now — 30 August

**Phase 2 step 1.** Tapping a line opens a box holding the whole capture. The
design is `docs/re-direction/phase-2-convergence.md`, whose §1 is deleted now
that the code carries it; this entry records the calls the brief did not make.

### The one question the brief left open, and the answer

⚠ **Directed: the console exists on the desk, and it EXPANDS THE ROW IN PLACE.**
The alternative was one design at four-thirds — the same floating card on both
surfaces — which is cheaper, cannot drift, and is what *the desk is the same
design, four-thirds the size* would have predicted. It was refused, and the
reason is not consistency: **a desk has the width to open the line where it
lives**, and a takeover up there costs the reader their place in the record to
show them something that could have appeared beneath it.

So the two surfaces are genuinely two, and this is one of the few places in the
app where that is true. What keeps it from being two designs is that **one
component mounts in one place and the stylesheet decides**: `console-sheet` is
`fixed` below `--breakpoint-stack` and `static` at and above it. The contents and
their order are identical, which is the part that would actually rot if it were
duplicated.

### Settle moved, and `foot.tsx` had said it would

The brief puts `×` and `✎` on the console and says nothing about settle. With the
pick gone, settle had no door left until the swipes land, so it went onto the
console with the other two. That is not an invention: `foot.tsx`'s own docblock
read *settle is the last asymmetry… if the grouping is revisited, settle is the
thing to move — onto the line, where the other two that act on it already are,
which would leave search alone and this file with nothing to be.*

**The foot is `+` and search.** §3 of the brief has it ending there once the
swipes arrive; it arrives one step early because the console, not the swipes,
took the pick's job. ⚠ The bar became a **three-column grid** in the same move,
because three glyphs under `justify-around` put the `+` in the middle *by there
happening to be three* — removing one would have drifted it to a quarter, moving
a control that is supposed to be the one fixed thing on the bottom edge.

### Three things a screenshot caught that the probe did not

⚠ **This is the entry's most useful half.** All three passed a measurement pass
and were wrong on sight, which is the *look at it before judging it* rule earning
its keep again.

1. **The card was content-sized, so the `×` was not in a fixed place.** The
   *positioner* was fixed and identical every time — which is what the probe was
   asserting — while the visible box was as tall as the capture in it. A
   three-word line put its controls 500px above where a long one did. **The box a
   thumb learns is the one it can see.** Fixed with `flex: 1 1 auto`, never
   `flex: 1`: the shorthand's `0%` basis would let the desk's auto-height
   container collapse to nothing.
2. **The glass was invisible.** It wore `--sheet-tint` on the reasoning that the
   console and the writing strip are the same object — a glass surface holding
   body text over the record. On a true-black page a card floating mid-screen has
   **no borrowed edge**, and the record behind it is already darkened by the
   scrim, so a ground mixed toward black had nothing left to be darker than.
   `globals.css` had written the lesson down about the strip — *the strip is on a
   true-black page, so an opaque ground is INVISIBLE* — and glass was the answer
   there **because the strip has the screen's own edge**. The sign is reversed
   here: `--console-tint` mixes toward `--color-surface`. Still glass, still
   see-through, and it re-grounds on the desk for free.
3. **The paper did not answer.** The positioner spans the glass and its gutter
   sat over the scrim at `z-10`, swallowing taps on 20px strips that look exactly
   like blurred record. `pointer-events: none` on the box and `auto` on its child
   hands them back — removing the collision rather than adding a handler to catch
   it.

### The clearance is `--tap-floor`, and that is a thumb

It was `--page-lead` for an hour, on the neat reading that the console's top
should land where the record's first line does. **The paper is the console's only
exit on a handset**, so the paper has to be a target, and 20px bands are not. The
clearance is the app's existing hardware constant — which deliberately does not
scale with the root, correctly here twice over: a thumb does not get bigger
because a window did, and the desk does not read these tokens at all.

### What was deliberately not built

- ⚠ **No origin memory.** The brief says the console remembers whether it was
  opened from the record or the portal, so paper-tap returns there. **There is no
  portal**, and a name bought for a second consumer that does not exist yet is
  exactly the mistake `--sheet-clearance` was — extracted for a light that was
  then deleted. The portal adds it.
- ⚠ **No *who else*, and no empty state for it.** The slot is a comment. *Silence
  stays silent*: nothing is the correct rendering of nothing, and an absence
  explained is an absence the copied-provenance suppression rule worked to keep
  quiet.
- **No haptics.** §4's rule is that every haptic marks something that became true
  in the database, and opening a console is a thing the person did.
- **No network.** Everything in the box is on the `Line` the record was already
  drawing, which is what lets it render instantly with no spinner.

### The cost, stated

⚠ **On the desk a short capture reads twice** — the row says *A third* and the
card under it says *A third* again. It is right for a long capture, which is what
the row truncates and the card completes, and it is what the chosen sketch
showed. The cheap fix is hiding the row while its console is open, above
`--breakpoint-stack` only; the cost is that the control carrying `aria-expanded`
vanishes from under a reader who just used it. Recorded in §7 of the brief,
unbuilt, and it wants a look on a real desk first.

⚠ **The `picked` utility is still in `globals.css` and nothing applies it.** Kept
deliberately: §11 reserves `--color-accent` for **convergence**, and the gutter is
where a state may live rather than a control. The mark's next tenant is Phase 2's
own. Do not put a pick mark back there.

### The console, seen and corrected — 30 August, the same evening

**Three directions after the first deploy: *too grey*, *too big — it has to adapt
to the size of the entry*, and *a glass see-through effect with the relevant blur,
not far from the banner treatment*. Plus: nothing may scroll behind it.**

⚠ **The ground took three attempts and the lesson is that the card was never the
problem.**

1. `--sheet-tint`, the writing strip's 38% — **invisible**. Diagnosed as a
   floating card having no borrowed edge, unlike the strip, which has the
   screen's.
2. A lifted mix of `--color-surface` at 88% — visible, and **grey**. The
   diagnosis was right and the prescription was wrong.
3. `--glass-tint` over `--glass-blur`, the bars' own recipe — **invisible
   again**, which is what finally located the fault.

**The bars read as glass because the record passes under them at full strength.**
The scrim had already darkened *and* blurred everything, so by the time the
card's glass got there, there was nothing left for it to darken and no edge for
it to make. So the tint came off the **scrim** and the card kept it: bright,
heavily blurred record behind, a darker pane over it, which is exactly the
difference the bars have. ⚠ **The writing sheet's branch keeps its tint** — it
has no blur, so the tint is the only thing sinking the record under a field
somebody is typing into.

⚠ **`--glass-blur` and not `--scrim-blur` on that scrim** — 18px against 5. Five
was picked for a photograph opened full size, where the blur backs one picture;
this has to make a page of prose unreadable while leaving it present, which is
the job the bars' number was chosen for.

⚠ **The fixed-height card is reversed and the cost is accepted.** It filled the
rectangle so the `×` could never move — *the box a thumb learns is the one it can
see* — and the price was a 616px box holding three words. The **bounds** are
untouched: same top edge, same sides, still never reaching the bar or the strip.
So the constant is now the gap between the last line of the capture and the
controls, rather than the controls' position on the glass. That is a different
constant and a defensible one — the thumb tracks the words instead of the screen
— but it *is* a reversal and the next person should not rediscover the first
argument and think it was an oversight.

⚠ **Nothing scrolls behind it.** The scrim already refused a pan; the hole was a
drag starting on the **card**, because `touch-action` does not inherit across an
element boundary and the card found no scroll container of its own. `touch-action:
none` on `console-sheet` closes it at the console's edge, and the body inside
takes it back as `pan-y` with `overscroll-behavior: contain` so a long capture is
still readable and reaching its end is not the page's turn. **On the desk this
does nothing and should not**: the console is in flow inside the record, so there
is no "behind" — scrolling moves it with the lines it sits between, which is the
whole point of expanding in place.

### The console's text lands on the record's first line — 30 August

**Asked as a choice between two: position the console so its entry overlays the
record's top entry, or centre the console always.** The first was taken.

⚠ **Centring was argued against and refused.** The card is content-sized, so
centring would make **both** edges move with the length of the capture, where
top-anchoring keeps one of them still. It also reads wrong: a short card floating
in the vertical middle of a black screen is the shape of a **modal**, and this
page has spent a great deal of effort establishing that *a sheet is not a route*.
Top-anchored reads as the page lifted; centred reads as something on top of it.
It fights the rise animation too, which comes up from the tapped line.

⚠ **The reason for the alignment is better than "the top entry".** Aligning the
console's text to where the record's first line sits means **the words of
whatever you opened always appear where the eye already reads** — not just for
the newest line, for every one. The eye never travels to find them. For the top
line specifically it becomes a true expansion in place: tap it and the words do
not move at all, a card materialises around them, which is precisely what the
rise animation has been gesturing at.

**Derived, not offset.** The record's first words sit at `--bar-height` +
`--page-lead` + `--stamp-block` + `--line-hem`; the card's text sits at
`--console-top` + `--page-lead`. The two leads cancel, so
`--console-top = --bar-height + --stamp-block + --line-hem`. Measured **0.00px**
at 390. Change the stamp, the bar or the row's hem and this follows rather than
breaking silently — which is the answer to the coupling this introduces between
two things that used to be independent: the coupling is explicit and it moves.

⚠ **It pays for itself by moving the console's day stamp below the capture.** The
words must be the first thing in the card or the alignment is off by whatever
sits over them — and the stamp had been sitting directly on top of the record's
own, saying *Today* twice, once behind the glass and once in front. One change,
two problems, and it closes the duplication noted on the desk the same day.

⚠ **The top paper band went from `--tap-floor` to about 32px, and that is only
affordable because the card is now the size of its entry.** The 44 was chosen
when the card FILLED the rectangle, so the four thin bands were the whole of the
paper and one of them had to carry the console's only exit. A content-sized card
leaves hundreds of pixels of paper below it. **If the card ever fills the box
again the 44 has to come back.** The foot is still `--tap-floor` and is not the
same question: it is the bound a long capture stops at.

⚠ **The alignment holds at rest only, and that is understood rather than
unfinished.** Scroll and the bars recede, so the console's top is measured
against a bar that is not on screen. It stays where it is, which is right; there
is simply nothing behind it to align to any more.

## Tap thinks, swipe does — 30 August, Phase 2 step 2

**Swipe a line: left crosses off, right asks *Again?*** The two verbs used fifty
times a week become directional gestures on the row itself, and the console
becomes what it should be — the once-a-week question. **A gesture that can be
made anywhere on a row is the only kind of target that survives being used while
walking.**

⚠ **That first sentence lasted a day. The settle swipe is deleted** — see
*Reopened the same day* and *And it was built by subtraction* below. What is live
is: **away crosses off, back puts it back, settling is the console's.** The
sections between here and there are still true of the gesture that remains.

### The scroll question, answered by the browser rather than by a thermostat

The brief asked for this to be **checked rather than assumed**. It is checked by
being impossible: `touch-action: pan-y` on `page-row` tells the engine *vertical
panning is yours, horizontal is mine* before a single event reaches
`row-swipe.ts`. The browser separates a scroll from a swipe with its own gesture
recogniser — the one that already knows what a scroll feels like on that platform
— and when it decides the gesture is a scroll it sends `pointercancel`, which is
the signal to let go. **A hand-written axis lock would be the thermostat
`keyboard-hem.ts` needed five wrong versions to get right, rebuilt on a second
axis.**

The small activation in the hook (6px, dominant axis) is for a **pointer**, not
for touch: a mouse has no `touch-action` arbitration, so a click that drifts two
pixels would otherwise arm a swipe.

### The row travels its own height, and stops

⚠ **The threshold is the row's own height, read off the row** — not a token, not
a fraction, not a number tuned until one device felt right. A row of the record is
`--tap-floor` tall on a handset by design and four-thirds of that on the desk, so
**measuring the thing being swiped gets both surfaces right by derivation** and
follows the density if it ever changes. Measured: it clamps at 44 on a handset and
58.67 on a desk, from one line of code with no breakpoint in it.

⚠ **Clamping there makes it a DETENT rather than a threshold you have to guess
at.** The row tracks the finger, stops dead when the action is armed, and stays
stopped however much further you push. There is no glyph and no colour to say
*this is far enough* — §11 spends colour on overlap and chrome and nothing else —
so the row stopping is the signal.

### ⚠ The gesture is confirmed by the EYE, and that is forced

**iOS Safari implements no Vibration API, and the installed app is a handset.** A
swipe designed to be confirmed by the hand would be confirmed by nothing at all on
the one surface this app is used on. So the visual response is the mechanism
rather than a nicety: the row's travel and detent while it happens, and both
outcomes visible where they happened afterwards — crossing off strikes the line
where it stands, settling puts a question on it. See *Haptics*, above, which now
carries the vocabulary for a native shell.

### Why settling ASKS instead of settling

⚠ **A swipe cannot settle a line, because settling has two answers.** *I would do
this again* and *that is dealt with* are genuinely different claims — it is the
app's own name on one of them — and one direction cannot carry both. So the
settle swipe puts *Again?* on the row and the two answers are a tap each, which is
exactly what the console's settle glyph does through a longer door.

**It is still much cheaper than the console**: one swipe and one tap, against a
tap, a read, a glyph and a tap. And it inherits the console's safety — nothing
leaves the page until somebody answers, so a swipe made by accident costs a
question rather than a row. That matters because **settling has no undo** and
crossing off is its own inverse. The asymmetry between the two directions is the
asymmetry between the two resolutions, not an inconsistency.

⚠ **A struck line refuses the settle swipe, silently.** `resolveCapture` guards on
`want`, so the settleable set is exactly the resolvable one; the console does the
same thing by not drawing the glyph, and a gesture cannot be *not drawn*.

⚠ **`askAgain` is the one owner of that question**, called by the swipe and by the
console's glyph alike — and the record only draws it while no console is open,
because the console asks it from the same `asking` state. Without that guard one
swipe would put *Again?* in two places and answering either would settle the line.

### Physical, not logical, and the RTL question is deliberately held

Rightward settles and leftward crosses off, written against the **screen** rather
than the writing direction, so on an Arabic page the gestures do not mirror. The
field mirrors because `dir="auto"` reads the first strong character somebody
typed; **a row has no such signal, and a record can hold both languages at once**
— so mirroring per row would mean two rows on one screen answering the same swipe
differently, which is worse than not mirroring at all. Revisit it when there is
somebody reading the record right-to-left to ask.

### What the probe learned about itself

⚠ **`swipe.mjs` passed once and failed on its second run, against the state its
own first run had left behind.** It counted struck lines across the whole record;
a cleanup step used a row index that had shifted when an earlier assertion settled
a line off the page. **Every assertion is now scoped to a row this run seeded, by
its text**, and it is run twice to prove it. A probe that is not idempotent will
eventually report a bug that is its own, and this one nearly did.

### ⚠⚠ Reopened the same day: one beat, and an undo both ways — 30 August

**Directed after using the swipes.** ⚠ **It is BUILT — see *And it was built by
subtraction* at the end of this entry, which is what shipped and where it departs
from the recommendation below.** The design brief is §3b of
`docs/re-direction/phase-2-convergence.md`; this records the reasoning, including
the option that was recommended and not taken.

**Two directions, which are one change:**

1. **Settling must cost ONE beat.** It costs two — swipe, then answer *Again?*
   with a tap — and that is the swipe failing its own argument. The case for a
   gesture is that it is cheaper than the console; one swipe plus one aimed tap is
   barely cheaper than a tap plus an aimed tap.
2. **Both directions must afford an UNDO**, left-to-right and right-to-left.

⚠ **The dependency is the whole point.** The only reason settling asks a question
is that settling has two answers *and no undo* — so a wrong swipe would put a line
in the tray with no way back, and the question was the safety. **An undo removes
that objection, and with it the question, and with it the second beat.** Build them
together or neither works. This entry exists so nobody later reads "the swipe asks
a question" as a design preference and removes it on its own.

⚠ **The question was the right answer to the constraint that existed, and the
direction changed the constraint.** That is the pattern *How things get fixed*
asks for, arriving from the user rather than from the code: **remove the condition
rather than correct for it.**

**What removing the question does not remove:** settling still has two answers.
The recommendation in §3b is a **default plus a correction in the undo band** —
*Settled. Undo · Not again.* — which costs one beat, keeps both claims reachable,
and needs no aiming unless somebody wants the non-default. Deciding *which* answer
is the default is open; *again* is the app's own name and is the likelier reading
of a line somebody kept.

⚠ **Distance-decides was ruled out on sight.** A short swipe meaning one answer
and a long one the other is a modifier gesture, which this page has refused three
times — see `pick`'s note in `page-screen.tsx`. A gesture that means two things
depending on how far it went cannot be made without looking, which is the entire
purpose of the swipe.

⚠ **The hard half is that a settled row LEAVES the page**, so there is nowhere
beside the line to put an undo — unlike the capture undo, which exists precisely
because *the undo belongs beside the line it takes back*. Holding the row in place
for the window and removing it when the window closes is the suggested answer, and
it reuses §5's already-decided ten seconds rather than picking a second number.
**No toast**: the page has no such surface, and a second vocabulary for an act that
already has a glyph on a row is how a page stops being learnable.

⚠ **Crossing off is its own inverse and still needs the affordance**, because a
gesture nobody knows is reversible reads as destructive.

### And it was built by subtraction — 30 August, later the same day

**What shipped is one swipe, not two: away crosses a line off, back puts it
back, and settling has no gesture at all.** Directed, and it takes the second of
the three options above — *the console keeps the distinction* — rather than the
default-plus-correction band that was recommended.

⚠ **The recommendation was answering the wrong question, and this is worth
recording because it was mine.** *Settled. Undo · Not again* is a design for a
settle swipe that costs one beat. But **the demand did not require a settle
swipe to exist** — it required settling to cost one beat, and the cheapest way to
stop a two-answer act costing two beats on a row is to stop putting it on a row.
*How things get fixed* asks for **remove the mechanism** before *remove the
condition* before *correct it*, and the undo band is the third of those wearing
the clothes of the second: a second vocabulary, a default nobody had picked, and
a band to design, all to keep a gesture whose own argument had failed.

**What the subtraction buys, item by item, against what §3b was going to need:**

- **No ten-second window and no held row.** A crossed-off row stays on the page,
  so the undo is **unbounded in time** and lives beside the line it takes back —
  which is `LineUndo`'s own principle satisfied rather than worked around. The
  settled-but-reversible third state, the SQL bound against `created_at` and the
  resume gate's new term all evaporate.
- **No default answer to pick.** Both of settling's answers stay drawn side by
  side in the console, which is the surface that has room for them.
- **No toast**, which §3b was right to forbid and which the undo band was
  edging toward.
- ⚠ **The record's inline *Again?* is deleted**, and with it the `!isOpen` guard
  that kept one question from being drawn in two places. `asking` and `askAgain`
  survive as the console's alone — the two surfaces that could disagree are one.

⚠ **The direction now carries the meaning, where the toggle used to.** Left
crossed off *and* uncrossed until today: the same gesture meaning two things
depending on a state the hand cannot feel, which is the modifier gesture this
page has refused three times, arrived at from the other side. A row affords
exactly one swipe and its state decides which.

⚠ **THE INERT DIRECTION DOES NOT MOVE THE ROW, and this is the one thing in the
change that had to be got right.** The first instinct — let it travel and spring
back, so the row never feels dead — is wrong, and reading the code is what showed
it: the travel **clamps at the row's height**, so a swipe the wrong way would
reach a detent, feel *armed*, and then do nothing. **The detent is the entire
confirmation this gesture has on iOS**, which implements no Vibration API, so a
detent that lies costs more than a row that does not move. `Math.max(0, …)` on
the travel is the whole mechanism.

⚠ **The invisible undo is made safe by something that already existed.** A
crossed-off line's console offers exactly one control and it is *Put it back* —
built with the console, before any of this. So the reverse swipe is a learnt
shortcut rather than the only door, and §5's *nothing is ever deleted* is what
makes a hidden undo a convenience rather than a trap.

**What it costs, stated:** settling goes back through the console — a tap, a
read, an aimed tap — where the swipe cost a swipe and an aimed tap. That is close
to a wash, and it is spent on the once-a-week act rather than the fifty-times-a-
week one.

⚠ **No fourth haptic.** Putting a line back fires `haptic()`, the capture's light
tap, rather than a signal of its own: *a line is on the live record* is the fact
both callers state, and the rule at the top of `lib/haptics.ts` is about facts
rather than about which gesture caused one. A fourth pattern would have to be
tellable from three others on the one axis `vibrate()` controls, to say something
the page already says by un-striking the words.

**Measured by the rewritten `node_modules/.probe/swipe.mjs`** — 30 assertions on
a 390 handset, 9 on a 1440 desk. ⚠ **It holds the drag at full extension to read
the transform**, because the row springs back on release and *did it move* is the
question the inert direction turns on; a probe that only looked at the outcome
could not tell a row that refused to move from a row that moved and did nothing.

## No scrollbar — 30 August, and a written rule overridden

**Reported: *any way to get rid of the side scroll bar?* There is, and it is
gone.** Two findings and a decision.

### It was not a horizontal scrollbar, and there is no overflow

Measured at 390, 1000, 1152 and 1440 before touching anything:
`scrollWidth === clientWidth` at every width, `canScrollX: false`, and nothing in
the tree sticking out past the layout viewport. **Nothing runs off the side of
this page.** What was being seen was the browser's own **vertical** bar at the
right edge — 15px on the desk, **0px on a handset**, because iOS and Android both
use overlay bars that take no layout width.

### It was light because the page had never said it was dark

⚠ **`color-scheme` computed `normal`**, which is not *unset*: it tells the engine
to paint its **light** widget set, whatever colour the document paints itself. So
a white track and a grey thumb sat against `--color-bg`. **Painting a page black
is not telling the engine anything** — the fact has to be declared.

`color-scheme: dark` on `html` was the first fix and **it stays**, because the
scrollbar was the smallest part of what it does: the caret's own default, the
selection colour, the form controls and the canvas behind the page all become the
dark set with it, and it is what stops a bar from being a light one anywhere one
is ever drawn again. It is the same reach as `touch-action: pan-y` — **state the
truth to the engine rather than draw a replacement for what it does with it.**

### And then it was removed outright, which overrides a rule this repo stated

**Directed, after the dark bar: *I want it gone. I don't want the scrollbar.***

⚠ **The rule that was overridden was mine and is worth recording as overridden
rather than quietly deleted.** The `scrollbar-none` utility's docblock said, in
writing: *do not reach for this anywhere content is primarily navigated by
scrolling — the lists — where the bar is the only thing saying how much is left.*
The record is exactly that. The argument was put and the direction stands.

**What it costs, stated and unchanged by the direction:** the record gives no
sign of how long it is or where in it you are. ⚠ **Scrolling itself is untouched
on every surface** — wheel, trackpad, keyboard and touch all behave exactly as
before; only the indicator is gone.

### ⚠⚠ The fade at the record's foot — directed and BUILT, 30 August

**It is the replacement for what the bar said, and it is on every surface**, not
only the desk. The handset's case is the same one arrived at differently: CSS
never removed a bar there — iOS draws the page indicator natively and cannot be
reached (see below) — but the handset never had a *length* cue either, so one
fade answers both.

⚠ **Do not answer any of this by putting a scrollbar back**, on any surface.

**What it is:** a gradient one line of the record tall, hanging off the top edge
of the writing strip, transparent at its head and the ground at its foot. A line
leaving the page dissolves over exactly its own height instead of being sliced by
an edge, and that dissolving *is* the statement that there is more below.

The direction left three questions open — which surfaces, what height, and
whether it hides once the record ends. All three are answered by construction
rather than by a number:

- **Every surface, with no override anywhere.** It hangs off the strip
  (`bottom: 100%` on `writing-sheet::before`), and the strip is the one object
  that is already in the right place on all four: on the glass on a handset,
  translated off the glass when the chrome recedes *and* whenever the desk is
  idle, and riding `--keyboard-overlap` while somebody writes. **Its foot is
  therefore the bottom of the visible record in every state, and there is no
  token to keep in step and no gap that can open** — measured at a 0px and a 34px
  inset, where the strip is 54px and 75px and the fade's foot is on both.
- **Its height is `--leading-line`: one line.** The same derivation as the
  swipe's detent — *measure the thing being acted on* — so a line dissolves over
  its own height and the desk gets 37.33px against the handset's 28 for free,
  from one declaration.
- ⚠ **It hides at the end BY CONSTRUCTION, which is why it is a gradient and not
  an instrument.** The ramp ends on `--color-bg`, so over an empty foot it is the
  ground drawn on the ground and there is nothing to see. **No observer, no
  state, no second reader of `endMark`** — two readers of one mark is how a page
  starts disagreeing with itself, and the resume-at-top gate was written the same
  week to avoid exactly that.

⚠ **It ends on the ground and not on `--glass-tint`, and the receded state is
why.** Landing on the strip's own tint would be perfectly continuous into the
glass — but only while the strip is *there*, and the state this exists for is the
one where it is not: reading back is when the chrome has gone. Ending on the
ground is right in every state and leaves one small step in one of them, where
the record goes from fully sunk at the strip's top edge to the 26% the glass lets
through, blurred. **If that ever reads badly the answer is `--glass-tint` here
and a fade of its own on the desk, not a number tuned between the two.**

**Measured by `node_modules/.probe/recordfade.mjs`** — 29 assertions across the
handset at both insets and the desk. `fadelook.mjs` renders the before/after
pair, switching the pseudo-element off through the CSSOM because the app's
nonce-based CSP refuses an injected `<style>`; a gradient of the ground over the
ground is not something an "after" on its own can show anybody.

**The utility is deleted into the `html` rule** rather than applied from a class.
It had one caller, the film screen's synopsis pane, and that screen was deleted
into the console — so a name for *hide a pane's bar* on a page that has none at
all is a name for nothing.

⚠ **Both spellings, and neither is a browser sniff.** `scrollbar-width` is the
standard and WebKit does not implement it; `::-webkit-scrollbar` is WebKit's and
nothing else honours it. Each is the property its own engine reads, and an engine
that reads neither simply keeps its bar.

### The 15px, which simplifies rather than threatens

⚠ **A suppressed classic bar hands its width back to the layout**, so the desk
gains 15px at every width. Nothing needed adjusting: every width on this page is
derived, so the record's column, the mark's band and the tool stack all followed —
`markgap.mjs`, `logocol.mjs` and `scale.mjs` re-run unchanged.

**It also closes a mismatch rather than opening one.** `100vw` counts a classic
scrollbar and `clientWidth` does not, which is the discrepancy the type ramp's
`clamp()` is written around and `threshold.mjs` exists to prove harmless. With no
bar the two are one number at every width and there is nothing left to oscillate.

### ⚠⚠ The handset still shows one, and CSS cannot reach it

**Reported after deploying: the indicator is still there in the installed app and
in the handset browser. It is, and none of the above touches it.** iOS Safari
draws the *main document's* scroll indicator with the native scroll view;
`scrollbar-width` and `::-webkit-scrollbar` do not apply to it. They do work on
scrollable **elements** inside an iOS page — the page itself is the exception.

⚠ **The 0px I measured on a 390 viewport was not evidence of no bar, and reading
it as such was the mistake.** `innerWidth − clientWidth` measures **layout width
taken**, which is zero for every *overlay* scrollbar whether it is drawn or not.
The measurement was structurally incapable of seeing the thing being reported, on
that surface, before or after the change. **A number that cannot distinguish the
two states is not a measurement of them** — the same lesson as the safe-area
expression a browser could not tell apart.

**The only way to remove it is to stop the document scrolling and scroll an inner
element instead**, where `::-webkit-scrollbar` is honoured on iOS. That is
expensive here and was not done: `useChromeRecede`, `useKeyboardHem`, the
browser's scroll restoration and the resume-at-top gate all read the document
scroller, and an `overflow: hidden` lock on the document was tried and removed
once already (see the `html` rule). **Left alone at the user's direction.**

⚠ **That probe's scrollbar check had to be rebuilt, and the reason is a good
one.** It failed the run when it measured a 0px bar, on the reasoning that *a
hidden bar proves nothing* — which is still right, and which the app itself now
causes. So the question *can this browser draw a classic bar* is asked of **a
tall blank page in the same browser**, where our CSS cannot answer for it, and
the app's page is then asserted to draw none. Measured: **15px on the blank page,
0px on ours.**

## The portal — Phase 2 step 3, 30 August

**The first surface in this app that reads `notifications`.** The engine had been
deployed and running for a week with no reader; this is what reads it, and
`tests/portal.test.ts` is the first end-to-end proof of the fan-out with two
accounts.

### The door is in the bottom bar, and that is against §2

⚠⚠ **Directed, with the conflict stated first, and it stands.** §2 of
`phase-2-convergence.md` is a law the whole layout falls out of:

> The bottom edge is for what you do without looking. The top edge is for what
> you go to on purpose. The record is what is in between.

…and it names the portal explicitly: *it is visited once, deliberately, at the
start of a session, and must never be given a reflex's real estate.* Three doors
were put — the wordmark (§5's own *interesting option*), a fourth glyph at the
top, and the tray — and the answer was a fifth: **the foot.**

⚠ **The law is not amended and this is not a precedent.** What it costs, stated
rather than argued: the portal now sits beside the one control this app has to be
perfect at, and a thumb reaching for `+` has a neighbour it did not have. **If
the `+` is ever mis-hit, this is the first suspect, and the answer is the top
edge — not a bigger gap.**

**It cost no layout, which is the one thing in its favour.** The foot has been a
three-column grid since settle left on 30 August — the `+` names column two so it
holds the centre *by construction* rather than by there happening to be three
glyphs — and column one was empty. The `+` is still on the window's centre line
to under 2px, asserted.

### A list of lines, and the join that makes it one

⚠ **`listMyPortal` joins each notification to the viewer's own capture for the
same possibility, and groups by that capture.** So two people converging on one
line is **one row naming both** — §5's *a list of lines, not a list of events*,
enforced in the read rather than in a component.

⚠ **The join is `payload->>'itemId'`, and a notification carries no capture id
because it cannot.** `lib/overlap.ts` writes one row per *match*, and a match is
about a possibility that two people's captures both point at. The viewer's own
capture is found at read time — which also means every payload written before the
portal existed works unchanged, with no backfill.

⚠ **`eq(captures.userId, …)` in that join is the privacy term, not a filter.** A
notification names a counterpart; it must never be a door to the counterpart's
row. Both sides get their own notification, so each person's portal is built
entirely out of their own captures. `tests/portal.test.ts` asserts exactly this,
because it is the class of thing that is invisible when broken.

### It empties, and the column was already there

⚠ **`notifications.read_at` has been in the schema since the engine landed and is
exactly the seen-state §7 said the portal would need.** So that item is closed
**with no migration** — and the deferred vocabulary migration, which §7 suggested
batching it with, is not waiting on anything.

**Opening a line is the only thing that empties it. There is no *mark all read*,**
which §5 rules out by name: a portal you can clear in one gesture is a count with
extra steps.

⚠ **It empties on the NEXT arrival, not under the finger.** The row stays on
screen while its console is open, because a list that reflowed at the moment of
the tap would move the thing being opened. The portal re-reads every time it
opens, so caching would make the emptying a client-side filter — a second place
that knows what is unread.

### An empty portal has no door

⚠ **Off is the drawing without the door, exactly as search's is.** *An empty
portal is the resting state and the honest signal that there is nothing to know*
is not a surface to build; it is a surface that **cannot be opened**. The first
version rendered a live `<button>` whatever the bit said, and the probe caught
it — a lit-looking control that opens an empty box is the one thing this bar's
*controls go off; they do not disappear* device exists to prevent.

⚠ **Never a count, and the probe asserts the absence of digits on the door.**
`hasPortalLines` returns a boolean rather than a number for the same reason: a
counting function is one refactor away from displaying one, and a badge is an
engagement metric under a different name — excluded by `CLAUDE.md` under *Release
1 exclusions*.

### The console is handed down, not rebuilt

⚠ **A render prop: the portal decides where a console goes, the page decides what
it does.** Every control on it — cross off, rewrite, settle — is the record's own
handler acting on the same capture through the same action. A portal that built
its own set would be a second implementation of every mutation on this screen,
which is the drift §6 warns about applied to the surface layer.

⚠ **`crossedOff` is read off the portal's own line and never off `lines`.** The
capture may be from March and outside the fifty this page loaded, so a lookup
that fell back to `false` would draw a crossed-off capture as live in the one
place somebody was told to come and look at it.

⚠ **The rewrite closes the portal on the way out.** Its words go to the writing
strip, which is *behind* this box.

### The scrim's third occupant

⚠ **The portal keeps the scrim on the desk, where the console suppresses it.**
The console expands a row in place up there, so the record around it is exactly
what a reader wants to keep seeing. **The portal is not a line** — it is a
different list from a different table, and there is no row for it to expand into
— so it is a floating card at every width, and a floating card has to sink what
is behind it or it reads as pasted on. *The desk is the same design, four-thirds
the size* is the default, and it applies here unchanged.

⚠ **`dismiss` asks about the portal first**, because a console inside it is the
innermost thing open; asking about `opened` first would close the console and
leave the box up, which is a tap that appears to do nothing. `Escape` steps the
same way — console, then box.

⚠ **`portal-sheet` is `pointer-events: none` with its child taking them back**,
which the console already knew and this did not inherit. Without it, the gutter
and the empty band under a short card swallow the tap meant for the scrim, and
the box appears not to close. Found by the probe in one run.

### Three sentences, not four

⚠⚠ **§5's fourth sentence cannot fire, and it must not be added to complete the
table.** *Sam has too.* is the both-done case, and `classify` produces **no match
at all** for `go_back_to × go_back_to` — *both know*. The sentence would be true
and the event would still not exist. If it is ever wanted it is a row in
`classify` and a new `NotificationKind`, decided there.

**`lend` has no row in the table and was given one** — *Sam has one.* — flagged in
the code the way `notificationCopy`'s unspecified lines are. It is the strongest
notification in the app and the portal cannot be the one surface that stays
silent about it.

⚠ **`portalSentence` lives beside `notificationCopy` in `lib/overlap.ts`,
deliberately.** §6 says that module is the single owner of everything about a
match and warns that the payload is what drifts hardest **because it is what the
UI reads**. Two registers of one event in two files is the drift; adjacent, a new
kind fails to compile in both at once.

⚠ **Everyone is named, with no cut-off.** §10's scale note is the reason: the
mechanic assumes small clusters, so *Sam and Ali too.* is right and *Sam and 4
others* is a metric. The day a line carries eleven names, the honest reading is
that the app has grown a shape this design did not predict — not that the
eleventh person is noise.

### How it is tested, and why in two places

**A browser cannot be driven into a convergence quickly** — it needs two
accounts, a mutual track and two captures resolved to one possibility — so the
halves are tested where each can be. `tests/portal.test.ts` proves the chain
against the database: the seed-time trigger firing, each side's portal built from
their own capture, two counterparts as one row, emptying that reaches nobody
else's rows, and **the suppression rule holding, seen from a surface for the first
time.** `node_modules/.probe/portal.mjs` measures the door and the box on both
surfaces. `scripts/seed-portal.mjs` writes one locally and carries the tests' own
production guard.

## The mark — Phase 2 step 4, 31 August

**A bar in the record's gutter, `--color-accent`, on every line that has ever
converged with somebody — and it does not go away.** §11 reserved that colour and
that column for overlap on 23 August and nothing had spent it since.

**The division that decides everything else** is §5 of
`docs/re-direction/phase-2-convergence.md`: *the portal is arrival, the mark is
memory.* The portal answers *what happened while I was away* and **empties**; the
mark answers *why is this line special* when you meet it again in March.

⚠⚠ **So the mark's read has no `read_at` term, and that absence IS the mark.**
`listMyPortal` filters unread because the portal empties; `converged` in
`lib/db/captures.ts` does not, because the mark is what is left when it has.
**Adding an unread filter there deletes the only durable record that a
convergence ever happened.** `tests/mark.test.ts` has a case named for exactly
that, and it is the one assertion in the file that could not be made from a
browser.

**A bit rides the record; the sentence is a read behind the tap.** One `exists`
per line on the page's own query — the screen whose whole promise is that Return
lands in under a frame — and `getConvergence` for the one line somebody opened.
The bit gates the read, so a record with no convergences in it issues nothing on
any tap. The portal action's own note argues the rows must *not* ride the page
because nobody is looking at them until they ask; this is the same argument
answered the other way, because a mark has no *until they ask*.

**The sentence lands in the slot `console.tsx` was built leaving.** Its docblock
predicted it in writing: *when who else arrives it has to arrive into a space
that is already there — never a spinner over the whole box.* It sits under the
words and above the day stamp. `portalSentence` remains its one author, so the
portal's row and the console's line cannot say one event two ways. The portal's
own console is handed `null` — the portal already draws the sentence above the
box, and the mark exists for a record where nothing else says so.

⚠ **A colour in a gutter is invisible to a reader, so the row says it.** The
record's row carries *Also on someone else's page.* in its label; the tray and
search carry it as hidden text, because neither has a control to hang a label on.
**It names nobody** — the record knows *whether*, the console knows *who* — and
inventing a second sentence beside `portalSentence` is the drift §6 warns about.

**The colour question §11 left open is answered, and the worry did not apply.**
The fear was that the accent would now have to out-shout a louder chrome. It does
not, because **they never appear in the same place**: `--color-chrome` is a
*control* and lives in the bars, the foot and the caret; `--color-accent` is a
*state* and lives in the gutter, where no control ever goes. Measured **6.77:1**
on the desk's `#14140f` and **7.70:1** on the handset's true black — past the 3:1
WCAG 1.4.11 asks of a graphical object on both, with the glow on top of that.

⚠ **Recorded and not changed: `--mark-width` is `2.5px`, like `--caret-width`.**
So the mark is the same hairline on the desk as on the handset while everything
around it is four-thirds the size. That is the caret's rule inherited; it is
**not** one of the four exceptions the desk's scale names, and it has not been
looked at on a real desk. If it reads thin up there, that token is the thing to
move — and the caret moves with it.

## The gate nobody could see — captures were private, nothing could converge — 31 August

**The whole social half of the product was inert, and had been since Phase 0.**
Found while trying to see the mark on a real handset.

`addCapture` never set `visibility`; the column defaults to `private`;
`runOverlap` requires `SHARED_SCOPES`; and **`setCaptureVisibility` had no caller
outside `tests/`**. *Share visibility* is a named Phase 2 deliverable in §13 of
the implementation specification and was simply never built — the surfaces that
carried sharing went with the poster wall and the four collection routes in Phase
1, and nothing replaced them. Production on 31 August: **79 captures, all
private, 0 tracks, 0 notifications.**

⚠ **The engine, the portal and the mark were all correct.** They were downstream
of a gate that was shut. **Do not diagnose an empty portal as a bug in any of
them.**

### What was directed

**A self-written capture is shareable when it is written; a per-capture lock
takes it out of the pool.** This overrules the specification's private-by-default
and is recorded there as **Amendment 2**, in the open, because that document is
normative.

Three readings were put and the third was chosen:

1. **Keep the per-capture share act and build the control.** Rejected: a beat
   *after* the capture, which the four-second criterion cannot afford, and its
   failure is **silent** — you never converge with anybody and never learn why.
   On a 79-line record it is 79 taps of admin, and nobody does that.
2. **An opt-in default at onboarding, with a per-capture exception.** Offered and
   not taken; it costs a migration and a screen.
3. **Shareable on write, lock as the only control.** Directed. One line in
   `writeCapture`, no migration, and the consent is the mutual track.

⚠ **The consent is the MUTUAL TRACK.** Deliberate, two-directional, given by
handle to somebody the user chose. What a convergence discloses is one overlap on
one possibility, to one such person — never a list.

⚠ **Reading is untouched.** `listCapturesForOtherUser` keeps all four of its
terms. This changed what may *match*, never what may be *read*.

⚠⚠ **A capture that came from somebody else stays private**, and that is now a
guarantee rather than a leftover default — `tests/guarantees.test.ts` names it,
and it went red when the default was first made uniform, which is what turned it
into a decision. **Same reasoning as §6's suppression rule: a received list is
not an independent common intention.** If a copy is not independent enough to
notify the person it was taken from, it is not independent enough to be
republished onward to *my* mutuals without my touching it.

**The cost, stated plainly and accepted.** After this, writing something down
does tell a mutual you wrote it — *if they wrote the same thing too*. That is the
product. It is also **asymmetric in time**: you write a thing in March, a friend
writes it in August and learns you have it. ⚠ **Ask-before-telling is illusory**
and was rejected on that ground: to ask you, the app must first tell you about
them, so one side always learns first.

**The existing 79 captures were backfilled to `mutuals`** — a default only
touches new rows, so without it the record would have stayed inert. Self-written
only, and the script refused to run if any tracks existed, because a plain UPDATE
would skip the fan-out `setCaptureVisibility` performs.

## The swipe changes its verb: tap thinks, swipe LOCKS — 31 August

⚠⚠ **The swipe carries the lock and crossing off is the console's ×.** Directed:
*people will rarely cross off items; locking is far more valuable a function.*

**`row-swipe.ts` had argued the swipe belonged to cross off because it was "the
verb used fifty times a week".** That was an assumption about usage written into
a docblock, and it was wrong — corrected by the person using the app daily on a
handset. ⚠ **The rule did not change; the frequencies did, and the gesture
followed them.** The reflex gesture carries the frequent verb and the console
carries the considered one, which is the same rule applied to better information.

**Four earlier proposals were refused before this one, and the record of why is
the useful part:**

- **A lock on right-to-left.** That is already the cross-off direction —
  `SIGN.crossOff` was `-1` — so it collided with the verb used most.
- **A lock on left-to-right, keeping cross off.** On a struck row that is
  *restore*, so one direction would have meant *lock* and *bring back*:
  semantically opposite, which is worse than a plain collision.
- **A lock on the console only.** Right while locking was rare, and it is where
  the control began; it lost when the frequencies were corrected.
- **An in-line `×` on every row, freeing the swipe.** Refused: a permanent glyph
  costs ~26px of text width on **every** line in a column that already truncates,
  and *a row of dark glyphs beside every line of the record would be the density
  device inverted* is a rule this project had already written down. Withdrawn by
  the product owner in the same message that settled the rest.

⚠ **Lock fits the hook better than cross off ever did.** Cross off and restore
share one gesture between two *states of the record*; lock and unlock are one
property with two values, so the two directions are the property's own halves.
**Nothing about the mechanism changed** — the same `SwipeWay`, the same signs,
the same detent at the row's own height, the same `touch-action: pan-y`, the same
physical-not-logical direction. Away from the reader is out of the pool, back is
in, which fits *out of the pool* more exactly than it ever fitted *dealt with*.

⚠⚠ **The locked state is drawn on the row, and that reverses a call made an hour
earlier.** The argument for showing nothing was that locking is rare and an
invisible state fails safe — true while it was a console act. **It died the
moment locking became the row's own gesture:** crossing off confirmed itself by
striking the line, iOS implements no Vibration API, and a swipe whose outcome is
invisible is confirmed by nothing at all. **The padlock is the gesture's only
confirmation and must not be removed while the swipe carries the lock.**

- **The tail, not the gutter.** `--color-accent` and that column belong to the
  convergence mark, and one thing per column is what makes either of them mean
  anything. In the tail it costs width on locked lines only.
- **A padlock is right as a *state* and would have been wrong as a control
  label.** On a button it says *security*; this is *scope*, and nothing about a
  lock stops anybody reading a record they can already reach. As a mark on a line
  it is the known icon for *held back*, which is what §11 permits known icons
  for. Eleventh glyph on the one 20-grid, drawn shorter than the rest because it
  rides a line rather than standing in a bar.
- **No fourth haptic.** Locking borrows the crossed-off thud, unlocking borrows
  the capture's tap — the precedent already set for putting a line back.

⚠ **Unlocking is a fan-out trigger and locking is not.** `setCaptureVisibility`
runs overlap on the private→shared transition only, so **a line locked in March
converges the day it comes back**, and the same swipe twice writes nothing twice.
⚠ **A line that already converged keeps its mark after it is locked** — the mark
is memory, the event happened, and a notification already sent cannot be
recalled.

**Asserted for the first time, and the design now leans on it:** a crossed-off
line converges with nobody. It falls out of `classify` being an allowlist of
three pairs rather than out of any rule written down, so a fourth pair added one
day would put struck lines back in the pool silently. `tests/mark.test.ts`.

## There was no way to sign out on a desktop — 31 August

**Reported from a desktop, and it was true.** `components/profile-panel.tsx`
carried `rail:hidden` on the block holding `@handle` and *Sign out*. The variant
was correct when written: above `--breakpoint-rail` the rail in
`components/shell.tsx` carried the same two things in the same corner, fixed,
while this copy scrolled — measured at 184px of travel on a 1440×600.

⚠ **Phase 1 deleted the rail and the correction stayed.** Nothing replaced it,
`authClient.signOut()` is called from that file and nowhere else, and so at 720px
and up there was no way out of the account for a fortnight.

**This is *How things get fixed* read backwards: the condition went, so the
correction had to go with it, and it did not.** The fix is the deletion of one
variant — nothing was added and no second layout exists.

Deleted with it: **`foot-collections` and `foot-bare`** in `globals.css`, two
orphans of the same rail that `Screen` never wore. The rule they existed to
demonstrate is kept in prose where they were: **two declarations of one custom
property at equal specificity are resolved by their order in the compiled
stylesheet, and a class attribute cannot state that order** — so the responsive
half of a custom property belongs in CSS, in one place.

⚠ **A warning now stands at the top of `globals.css`** saying every mention of
`shell.tsx` or the rail below it is history. That file is full of them, they are
kept because they record why numbers are what they are, and **one of them was a
live bug for a fortnight.**

**Recorded, not fixed: the sign-out pill is ~30px against `--tap-floor`'s 44** —
40px on the desk, where the root scale reaches it. It has been that since 18
August, when the pill was directed and squared to the People pill, so it is a
pre-existing gap rather than a regression. It is the only way out of an account.
**The fix, if it is wanted, is `tap-target`'s pseudo-element**, which buys the 44
without changing the drawing by a pixel. Do not make the pill bigger.

**Measured by `node_modules/.probe/signout.mjs`** at 390, 719, 720, 1152 and
1440: the bar's door to `/profile`, the control present and visible, in the
bottom-left corner, and a tap at its centre reaching it.

---

## The first run says something, and a stated decision is reversed — 31 August

**Reported from a second account, on the day there was one to report from.** A
new account opens on the capture page and there is nothing on it: a bar, a strip
of glyphs, and the whole of the space between them empty. Directed: it should
say what to do, *kind of how we have a message in the profile screen about
adding friends*.

⚠ **The rule it reverses was written down in `page-screen.tsx` and was right when
it was written.** *Nothing is said about an empty page, deliberately. The caret
is the instruction, and a line of prose explaining that this is where you type
would be the app talking over the one gesture it wants.*

⚠ **The caret was ON the page when that was written, and it is not any more.** It
belonged to the pinned live line — an empty first run showed a brass caret
blinking in a field, which really was an instruction with no copy in it. **The
field has been summoned by the `+` since 27 August**, so the instruction the rule
leaned on was deleted with the band and the rule outlived it. *How things get
fixed* read backwards, exactly as the rail's `rail:hidden` did on the sign-out
block eight hours earlier — **the condition went and the correction stayed**, and
this is the second one of those found in a day.

⚠⚠ **THIS IS NOT §6'S *SILENCE STAYS SILENT*, WHICH IS UNTOUCHED.** That rule
forbids explaining an **absence** — no *no matches yet*, no empty state for
convergence on a line — for two reasons that both still hold: nothing is the
correct rendering of nothing, and an absence there is somebody else's business to
disclose. **A first run is not an absence.** What this explains is two mechanisms
a person cannot discover by looking:

1. **Lines are matched against the people you track.** Nothing on the screen says
   so, and until it fires there is nothing to see. Silence about *a* match costs
   nothing; silence about *matching* costs the whole app.
2. **A swipe takes a line out of that pool.** ⚠ **This became something that has
   to be said on 31 August**, when captures became shareable on write. Before
   that the default was private and an undiscovered lock cost nobody anything.
   The scope now moves on write, so the control over it belongs in front of the
   person **before** the first capture rather than after it.

⚠ **`empty` cannot recur, and that is what makes this a first-run screen rather
than an empty state.** Nothing is ever deleted (§5) — a crossed-off line stays in
the record, struck — so `lines.length === 0` means *nothing has ever been written
on this account*. It goes for good on the first Return, and it goes on the
**optimistic** line rather than on the write, because the pending row is already
in `lines`. There is no state to design for it coming back.

**It is not a line of the record and is not set like one.** The record's type is
`--text-line`; this is the page's body size, muted, at the profile's `max-w-sm`
measure — the shape of *Nobody yet* in `components/tracked-people.tsx`, which is
the precedent that was asked for. **A paragraph in the record's type would read
as the first capture.** It takes no `bg-surface/40` pill either: that container
exists to group the People list, and there is nothing here to group.

⚠ **Three numbered steps, and centred on both axes — directed after the first
look at it.** It shipped as two muted paragraphs at the head of the record and is
now *Write a line / Find a match / Keep it private*, which is the product's whole
loop in three lines.

- **`m-auto` in `<main>`'s flex column is the whole centring mechanism, and no
  height is typed anywhere.** That box is already exactly the space the record
  lives in: `100svh + env(safe-area-inset-top)` is the full screen, `--bar-height`
  carries the same inset back out, `page-hem` reserves the strip. Its **content**
  box is therefore the gap between the bar's bottom edge and the strip's top edge
  on all four surfaces, and auto margins centre the block in it. The desk follows
  for free, which a typed height could not have done.
- ⚠ **It works because nothing else in that column has height when the record is
  empty** — *Earlier* renders only when there is more, `readFailed` only on a
  failure, `endMark` is `h-0`, and the `<h1>` is `sr-only` and out of flow. The
  moment a line exists the block is gone, so the two can never compete for the
  space.
- ⚠ **Centred text, and it stops here.** The record is left-aligned and must stay
  so: a capture is prose, and a centred column of two hundred lines has no edge
  for the eye to return to. **This is the one block on the page that is not a
  record and cannot recur**, which is the whole of why it may be centred. Not a
  precedent for anything that appears more than once.
- ⚠ **The step headings are `micro` — the interface label — and deliberately NOT
  `stamp`.** Mono would have echoed the day stamps that appear in this very
  column the moment there is a record, and mono is scarce here for the reason the
  accent is: timestamps, the handle input and the day stamps, and on every other
  label it is texture rather than signal. Full ink on the heading, muted on the
  sentence, is the only hierarchy in the block; the numbers are in the text rather
  than an `<ol>`'s markers so a reader hears each one once.

⚠ **The `+` in the sentence is NOT `text-chrome`, and that is §11 held rather
than forgotten.** Brass means *a control*; a `+` in a paragraph is a reference to
one. Painting it puts a second brass `+` on the one screen whose whole
instruction is *aim at the brass one*, which is the drift the scarcity rule
exists to prevent. The strip has exactly one and the sentence names it.

**The sr-only *Nothing captured yet.* at the foot of the page is deleted.** It
was the whole of what a screen reader got from an empty page, because the sighted
instruction was a caret and a caret says nothing to one. The note is real text at
the head of the record, read in its place and in the right order; two of them
would be one fact announced twice, once out of position.

**Recorded, not decided: *buy* is in the copy**, directed. It reads as a kind of
intent rather than a purchase prompt, so it clears the Release 1 exclusion on
checkout and price comparison — but it is the closest any user-facing string
comes to that line, and §13's sourced-offers layer will one day sit beside the
word. **If the exclusion is ever tested, this is the string to look at.**
