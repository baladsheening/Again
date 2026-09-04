# The handshake — adding somebody becomes a request they answer

⚠⚠ **THIS IS A DESIGN BRIEF, NOT A REGISTER. IT IS MEANT TO DIE.** Same three
endings as `phase-2-convergence.md`: delete a section when it is built, or strike
it and mark it built while the rest is open, or move the file to
`docs/re-direction/inactive/` when the whole thing is done. A design document
that outlives its build reads as current and is not.

**What owns what.** §8 and §9 of `implementation-spec.md` are normative and this
document is not — where they disagree, the specification wins and this file is
wrong. Two of its clauses need amending and both are named in *Amendments* below.

**Why it exists.** §9 of `phase-2-convergence.md` — the first time Phase 2 was
exercised by a person rather than a fixture, on 4 September. Two accounts, both
holding *Scarface*, **0 tracks**, **0 notifications ever**. Directed the same
day: *if i add a friend on one account, the account i added should receive a
ping offering accept or reject.* And directed with it: **this and the QR
handshake are the same feature reached two ways — design them together.**

---

## Status — 4 September

| | |
|---|---|
| The seventh kind, `track_request`, and its delivery | **BUILT.** `lib/domain.ts`, and `trackUser`'s non-mutual branch in `lib/db/tracks.ts` — the branch that used to do nothing |
| `declineTrack` | **BUILT.** `lib/db/tracks.ts`. The one place a person deletes somebody else's row; `followed_id = viewer` is the whole safety argument and is asserted |
| `listMyRequests`, and the door answering for both kinds | **BUILT.** `lib/db/notifications.ts`. `pendingRequest` is the one owner of the predicate |
| The portal's request rows | **BUILT.** `components/portal.tsx`, reusing the console's `Ask` unchanged |
| *Add* / *Added* / *Added each other* | **BUILT.** `components/track-button.tsx`. The silent one-sided track is gone |
| A way to add somebody in the app at all | **BUILT.** `components/add-person.tsx`, in People on `/profile`. It goes to their page; it does not add anybody |
| The QR | **NOT BUILT** — §2f, and the encoder question in §5 is still open |
| Blocking | **deliberately not built** — §3, and it is the honest answer to re-asking |

**Proved:** `tests/handshake.test.ts` (8 cases, including *accepting runs the
fan-out*, which is the whole reason the feature exists and cannot be seen from a
screen) and `node_modules/.probe/handshake.mjs` (11 assertions, including that
**looking at a request does not answer it** and that the door goes dark when it
is). `scripts/seed-request.mjs` writes one locally, with the tests' production
guard.

⚠ **No migration. No schema change.** §1 is why.

---

## 1. ⚠⚠ THE FINDING THIS WHOLE DESIGN RESTS ON

**A one-sided track already IS a request. Nothing delivers it.**

A `tracks` row on its own grants nobody anything. Every consumer of the relation
asks for **both** rows, and there are only three:

| what a track is for | what it asks for | where |
|---|---|---|
| overlap fans out | `inbound.follower_id = outbound.followed_id and inbound.followed_id = outbound.follower_id` | `lib/overlap.ts:91` |
| reading somebody's record | an `outbound` join **and** an `inbound` join | `lib/db/captures.ts:367`, `listCapturesForOtherUser` |
| calling them by name (§5) | `person.mutual && person.displayName` | `lib/domain.ts:320`, `nameFor` |

So today's outbound-only row is a **latent offer**: it changes nothing, it
carries no visibility, and its single effect is that *if the other person
happens to do the same thing, both become mutual.* That is a request in every
respect except the one that matters — **it is never handed to the person it is
addressed to.**

⚠ **Which is why this needs no new table, no pending column, and no state
machine.** The pending object exists. What is missing is the delivery, and one
control to answer it. Reach in `CLAUDE.md`'s order: **the mechanism is already
there — do not build a second one beside it.**

- **Pending, from the answerer's side:** an unread `track_request` notification,
  whose requester's row still exists, and the viewer has not written the reverse
  one.
- **Accept** = write the reverse row. That is `trackUser`, unchanged, **including
  its fan-out on the transition into mutuality** — the trigger §8 requires is
  already wired and already tested.
- **Decline** = delete the requester's row.
- **Withdraw** = `untrackUser`, unchanged.

⚠ **Pending is read off the NOTIFICATION, never derived from `tracks` alone.**
Derived, a mutual pair that later breaks (B untracks A, leaving A→B) would
resurface in B's portal as a fresh request B already answered once. The
notification is the arrival; `tracks` is the truth; **both terms are required and
neither is sufficient.**

---

## 2. What gets built

### 2a. ⚠ A seventh notification kind — `track_request`

§6 says six kinds is the complete set. This is a seventh and it is a
**specification amendment, not an oversight** (see *Amendments*). It is also the
first notification in the product that is **not about a convergence**, which is
what makes §2c's portal question real.

Written by `trackUser`, in **the same transaction as the track row** (§10), on
the branch that already exists and currently does nothing:

```
if (inserted && mutual)  → runOverlapForNewMutual(...)   // today
if (inserted && !mutual) → notify the target             // this
```

⚠ **Idempotency is the constraint, not a check.** `onConflictDoNothing` on the
composite primary key means `inserted` is null on a re-track, so asking twice
writes **no second ping**. Same guarantee that already stops a second fan-out.

⚠ **The payload names the requester as `@handle`, not as a name.** §5: a
non-mutual is a handle. `nameFor({...them, mutual: false})` is the one author of
that, and the payload is the record — the name at the moment it fired, exactly
as `listMyPortal` already argues. It also carries the bare `handle`, because
every action in `app/actions/tracks.ts` addresses a person by handle and **never
by a uuid a client could iterate**.

### 2b. ⚠ Decline is the one genuinely new mutation

`declineTrack(viewer, handle)` deletes the row `requester → viewer`, and its
`where` is scoped so it **can only ever delete a row pointing at the viewer**.
That is a person deleting somebody else's row, which nothing in this app does
yet; the scope is the whole safety argument and it belongs in `lib/db/` (§3).

- ⚠ **It deletes and remembers nothing, on `untrackUser`'s own reasoning:** *there
  is no state a withdrawn track could sit in that would not also be a list of
  people you stopped following, which is a worse thing to keep than the row.* A
  declined-requests table is a list of people you rejected. Worse again.
- ⚠ **The requester is not told.** A declined ask and an unanswered one look
  identical from their side — their button simply reads *Ask* again. §6's
  silence rule, and the kind reading of the same rule.
- **What it costs, stated: a declined person can ask again.** The only thing
  standing in front of that is `LIMITS.track` (30/minute, per user and per IP).
  ⚠ **The honest answer is a block list, and there is not one** — §8 names block,
  report and unmatch as Phase 6 gates, and §9's receiver flow already wants
  *block the sender*. **Do not answer repeat-asking with a lower rate limit**;
  that is a number tuned until one case looks right. It is a real gap and it is
  written down here rather than closed cheaply.

### 2c. ⚠⚠ Where it lands — THE PORTAL, and it costs the portal something

**It has to be the portal, because the portal is the only surface in this app
that tells you something arrived.** Anywhere else — a section on `/profile`, a
mark on the People pill — and the failure this whole feature exists to fix stays
exactly as silent as it is now: you would have to go and look.

Three things have to move, and each is a real cost:

1. ⚠ **`listMyPortal` and `hasPortalLines` both inner-join the viewer's captures
   on `payload->>'itemId'`, so a request is invisible to both.** That is not a
   filter to relax — it is `eq(captures.userId, …)`, the privacy term. **Leave it
   alone.** A request is a second read (`listMyRequests`) and the door's bit
   becomes the disjunction of two `exists`. ⚠ **One owner for that predicate**:
   the list and the door must never disagree about whether there is anything
   behind it, which is what `hasPortalLines` was written for.
2. ⚠ **A portal row that is a PERSON, not a line.** *A list of lines, not events*
   was a rule about convergences — two rows about one capture become one row
   naming both. A request is genuinely not about a capture, and drawing it as one
   would be a lie about what it is. It is a handle and two controls.
3. ⚠⚠ **IT DOES NOT EMPTY ON OPEN, AND THAT GENERALISES THE RULE RATHER THAN
   BREAKING IT.** §5: *the portal empties; a row you have opened leaves.* The
   true statement underneath is **a row leaves when it has been dealt with** —
   and for a convergence, reading it *is* dealing with it, because there is
   nothing to answer. A request has an answer, so it leaves when it is answered.
   ⚠ **A request that emptied on being looked at would be a request destroyed by
   being read.**

**Order: requests first, above the convergences.** They are the only rows on that
surface that are waiting on the reader. The convergences keep *Who else*.

⚠ **Still no count, anywhere.** `portal.mjs` asserts the absence of digits on the
door and that assertion must go on holding. A pending request is a row, not a
badge.

### 2d. The asker's side — ⚠ *Tracking* is a lie and has to go

`TrackButton` reads *Track* → *Tracking* → *Tracking each other*. The middle
state claims something happened. Nothing did: the offer is sitting undelivered.

- Neither → **Add**
- Outbound only → **Added** — a state, not a control, exactly as *Tracking* is
  drawn today. Undoing it is `untrackAction`, which already exists.
- Mutual → **Added each other**.
- Inbound only → ⚠ **still not announced.** The button reads *Ask* for a stranger
  and for someone who has asked you, and the reason is unchanged: being told who
  follows you is a follower notification, the §2 shape this design refuses. **The
  request arrives in the portal, addressed to you — that is not the same thing as
  a page telling you who is watching.**

### 2e. ⚠ There is no in-app way to add anybody, and that is half the bug

`/u/[handle]` is reachable only by typing the URL, and People on `/profile` only
lists people you already track. **A handle field on `/profile`, next to People**
— the smallest thing that closes it, and the same shape §2 already permits: you
are here because someone gave you their handle. No directory, no stranger
search, no suggestions.

### 2f. The QR — ⚠ it is a transport for the handle, and it is NOT the fix

Once §1 holds, the contact handshake needs **no transfer session at all**. The
code carries the handle; the acceptance is what grants everything; and the
acceptance is already two-sided and by hand.

- ⚠⚠ **A QR that is a URL is scanned by the phone's own camera, and that is
  decisive on the one surface this app ships on.** `BarcodeDetector` is not in
  Safari. An in-app scanner means `getUserMedia` plus a JS decoder — a dependency
  and a permission prompt — to do what iOS does from the lock screen. **The
  scanner is the phone.**
- **So: `https://<host>/u/<handle>`, rendered as an SVG in a Server Component, on
  `/profile` beside your handle.** Scanning opens their page; the visitor presses
  *Ask*; the presenter answers in their portal. Two people, two deliberate acts,
  no new server object.
- ⚠ **This deviates from §9's platform contract** — *the QR code and pairing code
  contain only an opaque, expiring session token* — and the deviation is argued
  rather than assumed: that clause exists so a photographed code cannot claim a
  **list**. A contact code grants nothing on its own; reusing one produces an ask
  that gets declined. **The session machinery stays where it earns its keep:
  Phase 3's list transfer, where a snapshot is claimed exactly once.** If this is
  refused, the cost is an in-app scanner on a browser that has no decoder.
- ⚠ **A QR encoder is a real dependency decision.** Nine runtime dependencies
  today, all load-bearing. Either add one, or write ~300 lines of byte-mode
  encoder (Reed–Solomon and masking) for a URL short enough to fit a version-4
  code. **Decide before building, not during.**
- ⚠ **Build the request flow FIRST.** The QR is an accelerant for people standing
  in the same room; the request is what makes either path arrive. Designed
  together as directed — sequenced apart, because one of them is the fix.

---

## 3. What is deliberately not built

- **A pending/declined table, or any column on `tracks`.** §1.
- **Blocking.** Named as the honest answer to repeat-asking, above; Phase 6 owns
  it, and §9's receiver flow will want it for transfers.
- **Push.** §8: in-app first, delivery is a background worker and never inline.
- **Telling the asker they were declined.** §6.
- **A count on the door.** §5.
- **List transfer.** Phase 3. This document is the *contact* handshake only.

---

## 4. Amendments this needs

1. ⚠ **§6's notification budget — six kinds is stated as the complete set.**
   `track_request` is a seventh, and the first that is not about a convergence.
   The budget's *purpose* is untouched: no digests, no streaks, no
   re-engagement. This one is addressed to a person by another person and is
   answerable, which is the opposite of the thing that rule exists to stop.
2. ⚠ **§9's contact handshake — *on successful confirmation, create both existing
   track rows atomically*.** Under §1 the first row is written when the ask is
   made and the second on acceptance, so the two are not written together. What
   the clause protects is intact and should be restated as what it actually
   means: **no half-state grants anything, and mutuality arrives in one
   transaction with its fan-out.** A pending row grants nothing (§1's table).

---

## 5. ~~Needs direction~~ — DIRECTED, 4 September

1. ⚠ **The screen says ADD; the code goes on saying TRACK.** Directed: the
   button is **Add** / **Added**, the mutual state is **Added each other**, and
   the portal row reads ***`@sam` added you.*** §4 makes the vocabulary
   load-bearing *in UI and in code identifiers* and this splits the two for the
   first time — so it is written down rather than left to be noticed: `tracks`,
   `trackUser`, `TrackState` and `track_request` all keep their names, because
   the **relation** is a track and only the **act of asking for one** is called
   adding. ⚠ *Add* is not on the banned list (§4 bans recommendation, review,
   rating, favourite, bookmark, feed), so the linter has nothing to say here and
   this rule has to be held by hand.
   - ⚠ **Watch *Added* for the flaw §2d names in *Tracking*** — a middle state
     that claims something happened. It survives the objection from the asker's
     side (*you did add them; they have not answered*) and it has not been seen
     on a screen. **If it reads as done, that is the word to move, not the
     model.**
2. ⚠ **A silent one-sided track does not survive. Every ask is a request.**
   Directed. It never granted anything (§1's table), so keeping both would be
   two controls for one act. **This overrules §9's *one-sided tracking remains
   available elsewhere in the product*** — a third amendment, and the reason is
   §1: the thing that clause protects does not exist in this product.
3. ⚠ **The QR carries the handle as a URL.** Directed. §2f's argument stands as
   written, including the deviation from §9's platform contract.
4. **Still open — the QR encoder**, §2f: a tenth dependency, or ~300 lines. It
   is step 6 and nothing before it depends on the answer.

---

## 6. Sequence

1. **The seventh kind and its delivery** — `trackUser`'s non-mutual branch, in
   the same transaction. Nothing on screen yet; a row in `notifications`.
2. **`declineTrack`** in `lib/db/tracks.ts`, scoped to rows pointing at the
   viewer, with the test that it cannot delete any other row.
3. **`listMyRequests`** and the door's second `exists`, one owner for the
   predicate.
4. **The portal's request rows** — a person, two controls, leaving on answer.
5. **`TrackButton` → Ask / Asked**, and the handle field on `/profile`.
6. **The QR**, last, once the request it transports exists.

**Proved where each half can be proved**, exactly as Phase 2 was: the flow
against the database in `tests/`, the surface by a probe in
`node_modules/.probe/`. ⚠ **The one case that must be a test rather than a
screen: accepting a request runs the fan-out**, because that is the whole reason
this feature exists and it is invisible from the portal.
