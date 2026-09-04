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

## Where the build stands — 31 August

⚠⚠ **ADDING SOMEBODY IS A REQUEST THEY ANSWER — 4 September, directed, and it is
built.** Until this, a mutual track was **two independent one-sided acts**: I add
you, then *you* must separately remember my handle, go to my page and add me
back. Nothing told you I had asked. The first time Phase 2 was used by a person
rather than a fixture the result was **2 accounts, both holding *Scarface*, 0
tracks, 0 notifications ever written** — the engine, the portal and the mark were
all correct and all downstream of an introduction that never arrived. The design
is `docs/re-direction/the-handshake.md`; it is a brief and it is meant to die.

- ⚠⚠ **A ONE-SIDED TRACK ALREADY *WAS* A REQUEST AND NOTHING DELIVERED IT.** All
  three consumers of the relation demand both rows — the §6 fan-out's self-join,
  `listCapturesForOtherUser`'s two joins, and `nameFor` — so an outbound-only row
  grants **nothing**. **So there is no pending column, no requests table and no
  state machine, and no migration.** The pending object existed; what was missing
  was the delivery and one control to answer it. *Remove the mechanism* read from
  the other end: do not build a second one beside the one that is already there.
- ⚠ **Accept is `trackUser`, unchanged, fan-out included.** There is deliberately
  no `acceptAction` — a second entry point would be a second place deciding what
  mutuality means, and mutuality is what runs the fan-out.
- ⚠⚠ **`declineTrack` IS THE ONLY PLACE ONE PERSON DELETES ANOTHER PERSON'S ROW,
  AND `followed_id = viewer` IS THE WHOLE SAFETY ARGUMENT.** There is no
  parameter that can widen it — the `includeArchive` rule, applied to a delete —
  and `tests/handshake.test.ts` asserts a bystander cannot reach a row that does
  not point at them.
- ⚠ **A decline remembers nothing and the asker is never told.** `untrackUser`'s
  own reasoning: any state a declined request could sit in is a list of people
  you turned down. **The price, stated: a declined person can ask again**, and
  the honest answer is a block list, which does not exist — Phase 6 owns it, and
  **a lower rate limit is not the fix.**
- ⚠⚠ **A REQUEST DOES NOT EMPTY ON OPEN, WHICH GENERALISES §5's *IT EMPTIES*
  RATHER THAN BREAKING IT.** A row leaves when it has been **dealt with**; for a
  convergence, reading it *is* dealing with it, because there is nothing to
  answer. **A request that emptied on being looked at would be a request
  destroyed by being read** — asserted from the screen by
  `node_modules/.probe/handshake.mjs`.
- ⚠ **It lands in the PORTAL because that is the only surface that says something
  arrived.** On `/profile` it would have been as silent as the bug it fixes. The
  cost is real and is paid in three places: the line read is a second query
  (`listMyRequests`), the door answers for both kinds inside `hasPortalLines`
  rather than being OR'd by a page, and the box now holds a row that is a
  **person** rather than a line. ⚠ **`listMyPortal`'s join on
  `payload->>'itemId'` carries the privacy term — do not relax it to let a
  request through.** A request has no `itemId`, and that absence is what keeps it
  out.
- ⚠ **ONE LINE: *`@handle` wants to track you.* Accept / Decline** — directed,
  replacing a borrowed `Ask` that spent two. `Ask`'s shape exists because the
  console's questions are about a line already above them, so they must name what
  they ask about; **this sentence already names it**. The answers are **plain
  words, not boxed buttons** — a bordered control is a block and cannot sit in a
  run of words — and the 44px is untouched because `tap-target` hangs its hit
  area off a pseudo-element. ⚠ **It cannot fit on one line on a 390 phone**
  (~394px of content into ~310px) and wraps there; one line from 430px up.
- ⚠⚠ **THE DOOR SAYS WHICH — `C`, `R`, `C/R`, directed 4 September.** It was one
  lit glyph for both kinds of row, which made a reader open the box to find out
  whether anybody was waiting on them. **The two circles stay for the resting
  state**: the slot is a drawing while it is quiet and becomes type when it has
  something to say. ⚠ **A `+` was the first suggestion and is ruled out** — the
  capture control is a `+` two cells away, and this app cannot afford two
  plus-shapes side by side on the one control it has to be perfect at; a dot
  would be a notification badge under another name. ⚠ **It is still not a
  count**: three states, no digits, and two people asking is the same `R` as one.
  `portal.mjs`'s assertion is the digits and only the digits, which is what it
  should always have been. ⚠ **The door has three accessible names** — *Who
  else*, *Requests*, *Requests, and who else* — because `C` and `R` are legible
  on sight and meaningless to a reader who cannot see them. A probe pinned to one
  string is a probe that reports a missing door.
- ⚠ **THE SCREEN SAYS *ADD* AND THE CODE SAYS *TRACK* — directed, and it is the
  first deliberate split of §4's vocabulary rule.** The **relation** is a track;
  only the **act of asking for one** is called adding. `tracks`, `trackUser`,
  `TrackState` and `track_request` all keep their names. ⚠ *Add* is not on the
  banned list, so **the linter cannot hold this and it has to be held by hand.**
- ⚠ **`Tracking` was a lie and is gone.** *Add* → **Requested** → *Added each
  other*. The middle state used to claim a live relationship where there was an
  offer nobody had been told about. ⚠ **It was *Added* for an hour and fell to
  the same flaw**, which had been written down when it was chosen: it claims
  something happened. *Add* is the verb; *Requested* is the state it leaves
  behind, **and it is the same word on the row in People** so a relationship
  reads the same in both places it appears.
- ⚠⚠ **THE HANDLE FIELD SENDS THE REQUEST, AND IT SENT YOU TO THEIR PAGE FOR ITS
  FIRST HOUR — reported and rebuilt the same day.** The detour existed so a
  mistyped handle could be seen before being asked; **the destination could not
  tell you anything**, because a non-mutual sees nothing of a record — so it was
  the handle you had just typed, an *Add* button and *This list is not shared
  with you*. **It read as done and nothing had been sent.** Production said so: 0
  tracks, 0 notifications. *A typo is answered in place now* — **No such
  person.** under the field — **and the confirmation is the row**, not a message.
- ⚠ **A non-mutual is shown NO LISTS on `/u/[handle]`.** A heading and *This list
  is not shared with you.* was two thirds of a screen explaining an absence over
  the one control worth being there for. §6's *silence stays silent*, applied to
  a surface; the four terms are untouched and are still the data layer's.
- ⚠ **A pending request is named `@handle` and the handle is read LIVE from
  `profiles`** — the one place this app departs from *the payload is the record*.
  A convergence's name is history; a request is **a live question about a person
  you are about to let in**, and a handle that has changed since would name
  somebody you do not recognise and address somebody who is gone.
- ⚠ **There was no in-app way to add anybody at all**, which is half the bug:
  `/u/[handle]` was reached by typing the URL. `components/add-person.tsx` is a
  handle field in People on `/profile`, and ⚠ **it goes to their page rather than
  adding them** — a typo can reach a real person, and asking is what puts a
  question in somebody's portal. **It is not search and must not become one.**
- **Proved:** `tests/handshake.test.ts` — 8 cases, and the one that matters is
  **accepting runs the fan-out**, which is the whole reason the feature exists
  and cannot be seen from a screen. `node_modules/.probe/handshake.mjs` for the
  surface; `scripts/seed-request.mjs` seeds one locally with the production
  guard.
- **Still open:** the QR, which is §2f of the brief and reduces to *a handle in a
  URL, scanned by the phone's own camera* — `BarcodeDetector` is not in Safari,
  so an opaque token would mean shipping a decoder to do what iOS does from the
  lock screen. **The encoder is a tenth dependency or ~300 lines, and that is
  undecided.** ⚠ **Blocking is also still open**, and it is named rather than
  quietly deferred.

⚠⚠ **A CAPTURE IS SHAREABLE WHEN IT IS WRITTEN, AND THE SWIPE IS THE LOCK — 31
August, directed. This overrules the specification's private-by-default and it
was directed with that stated.** Until this, **the entire social half of the
product was inert**: `captures.visibility` defaulted to `private`, `runOverlap`
requires `SHARED_SCOPES`, and **nothing anywhere called
`setCaptureVisibility`** — the scope existed, *share visibility* was a named
Phase 2 deliverable in §13 of the implementation specification, and the control
was never built. Production on 31 August: **79 captures, all private, 0
notifications, 0 tracks.** The engine, the portal and the mark were all correct
and all downstream of a gate that was shut.

- ⚠ **The argument that won is the four-second capture.** A per-capture share act
  is a beat *after* the capture, one you have to remember to come back for, and
  its failure is **silent** — you never converge with anybody and never learn
  why. **The consent is the mutual track**, which is deliberate, two-directional
  and given by handle to somebody you chose. What a convergence discloses is one
  overlap on one possibility, to one such person.
- ⚠ **It is NOT a change to who can read a record.** `listCapturesForOtherUser`
  keeps all four of its terms. Browsing still needs sharing; only *matching*
  moved.
- ⚠⚠ **A CAPTURE THAT CAME FROM SOMEBODY ELSE STAYS PRIVATE**, and that is now a
  guarantee rather than a leftover default — `tests/guarantees.test.ts` names it.
  Same reasoning as §6's suppression rule: **a received list is not an
  independent common intention.** If a copy is not independent enough to notify
  the person it was taken from, it is not independent enough to be republished to
  *my* mutuals without my touching it. `writeCapture` branches on
  `provenance.source`.
- ⚠ **The revive path does not touch the scope.** A crossed-off capture written
  again keeps whatever its owner last chose; re-sharing on revive would be a
  control changing under somebody who did not touch it.
- ⚠⚠ **THE SWIPE CARRIES THE LOCK AND CROSSING OFF IS THE CONSOLE'S — directed,
  and it reverses `row-swipe.ts`'s own founding argument.** That file said the
  swipe belonged to cross off because it was *the verb used fifty times a week*.
  **That was an assumption about usage and it was wrong** — told by the person
  using the app daily that lines are rarely crossed off. The rule did not change;
  the frequencies did, and the gesture followed them. **`SwipeWay` is
  `'lock' | 'unlock'`, the signs and the detent are untouched**, because the
  mechanism was always right and the verb was not.
- ⚠ **Lock fits the hook better than cross off did.** Cross off and restore share
  one gesture between two *states of the record*; lock and unlock are one
  property with two values. Away from the reader is out of the pool, back is in —
  the same physical metaphor, fitting more exactly than before.
- ⚠⚠ **THE PADLOCK IS NOT DECORATION AND MUST NOT BE REMOVED.** It was going to
  show nothing, on the reasoning that locking is rare and an invisible state
  fails safe. **That died the moment locking became the row's own gesture**:
  crossing off confirmed itself by striking the line, iOS has no Vibration API,
  and a swipe whose outcome is invisible is confirmed by nothing at all. It is in
  the row's **tail** and not the gutter — `--color-accent` and that column belong
  to the convergence mark, one thing per column — so it costs width on locked
  lines only.
- ⚠ **A padlock is right as a STATE and would have been wrong as a control
  label.** On a button it says *security*; this is scope, and nothing about a
  lock stops anybody reading a record they can already reach. As a mark on a line
  it is the known icon for *held back*, which is what §11 permits known icons
  for. It is the eleventh glyph on the one grid, drawn shorter than the rest
  because it rides a line rather than standing in a bar.
- ⚠ **No fourth haptic.** Locking borrows the crossed-off thud, unlocking borrows
  the capture's tap — the precedent `lib/haptics.ts` already set for putting a
  line back.
- ⚠ **Unlocking is a fan-out trigger and locking is not.** `setCaptureVisibility`
  runs overlap on the private→shared transition only, so **a line locked in March
  converges the day it comes back**, and the same swipe twice writes nothing
  twice. ⚠ **A line that already converged keeps its mark after it is locked** —
  the mark is memory, the event happened, and a notification already sent cannot
  be recalled.
- ⚠ **`shared` is derived from `SHARED_SCOPES`, never compared to `'private'`.**
  The question is *can this converge*, which is the same predicate `runOverlap`
  applies; `= 'private'` would be a second definition, right today and wrong the
  day a third scope exists. One expression, three reads — the page, the tray and
  search — so the padlock travels with the line.
- ⚠ **The action takes a boolean and names the scope itself.** A `Visibility` at
  that boundary would let a client pick one, and the day a third exists that is a
  way to publish a capture from a request body.
- **Measured by `node_modules/.probe/swipe.mjs`** — rewritten for the lock, and
  every mechanism assertion is the one it always was. It asserts the padlock is
  **drawn** on the swipe, that crossing off does not touch the scope, and that
  the console's × is the only door to crossing off. `tests/mark.test.ts` proves
  the data half, including the case this design now leans on: **a crossed-off
  line converges with nobody**, which falls out of `classify` being an allowlist
  of three pairs and had never been asserted before.
- ⚠ **Production's existing 79 captures were backfilled to `mutuals`** — a
  default only touches new rows, so without it the record would have stayed
  inert. Directed. Nothing else was touched, and no schema changed.

**Phase 0 is done, deployed and verified.**

**Phase 1 is built, deployed and in daily use on a handset.** `/` is the capture
page in production; the poster wall, `components/shell.tsx` and the four
collection routes are deleted. Nothing is held back. **Four** things are
outstanding and none of them is a screen that does not work — the vocabulary
migration (deferred, and the only non-additive one), a `kind` that is not a film,
a Blob store for the photographs already built, and the five-second acceptance
criterion, which was closed by direction and never stopwatched. ⚠ **This said
five and named the thing detail view; the console closed it on 30 August.**
`docs/re-direction/phase-1-capture.md` is the register.

⚠⚠ **This paragraph used to name which migrations were applied to production,
and that sentence is deleted rather than corrected — 30 August.** It is exactly
the class of statement the warning below is about: it was written confidently,
it was wrong, and it cost roughly eighteen hours of 500s. **Ask instead** —
`npm run migration:state`, or `scripts/prod-check.sh` for production. A number
that is right when it is typed and silently wrong an hour later is worse than no
number, which is also why this section no longer names a commit.

⚠ **The design for the surface that will read it is
`docs/re-direction/phase-2-convergence.md`** — the console, the swipes, the
haptic vocabulary, the portal and the mark, recorded 30 August. **It is a brief
and it is meant to die**: delete or strike each section as it is built, and move
the file to `docs/re-direction/inactive/` when the phase is done. A design
document that outlives its build reads as current and is not — the same failure
as a register that records what state production is in.

⚠ **Phase 2 step 4 is built — THE MARK, 31 August, and the sequence is
complete.** *The portal is arrival; the mark is memory.* A convergence can land
on a line hundreds back, and once the portal has emptied **the record now says it
happened**: a bar in the gutter, `--color-accent`, on every line that has ever
converged. §11 reserved that colour and that column for this since 23 August and
it is spent on it at last — `--color-accent` is used by exactly one thing.

- ⚠⚠ **THE READ HAS NO `read_at` TERM, AND THAT ABSENCE IS THE MARK.**
  `listMyPortal` filters unread because the portal empties; `converged` in
  `lib/db/captures.ts` does not, because the mark is what is left when it has.
  **Adding an unread filter there deletes the only durable record that a
  convergence ever happened** — it is asserted in `tests/mark.test.ts` in the one
  case named for it, and from the screen by `node_modules/.probe/mark.mjs`.
- ⚠ **A BIT rides the record; the SENTENCE is a read behind the tap.** One
  `exists` per line on the page's own query — the screen whose whole promise is
  that Return lands in under a frame — and `getConvergence` for the one line
  somebody opened. ⚠ **The bit gates the read**, so a record with no convergences
  in it issues nothing on any tap. The portal action's own note says why the rows
  do not ride the page; this is the same argument answered the other way, because
  a mark has no *until they ask*.
- ⚠ **The sentence lands in the slot `console.tsx` was built leaving.** Its
  docblock predicted it in writing — *when who else arrives it has to arrive into
  a space that is already there, never a spinner over the whole box.* It sits
  directly under the words and above the day stamp. `portalSentence` is still its
  one author, so the portal's row and the console's line cannot say one event two
  ways.
- ⚠ **The portal's console is handed `null` deliberately.** The portal draws the
  sentence above the box already; the mark answers *why is this line special* on
  a record where nothing else does, and in the portal everything else does.
- ⚠ **A colour in a gutter is invisible to a reader, so the row says it.** The
  record's row carries *Also on someone else's page.* in its `aria-label`; the
  tray and search carry it as hidden text, because neither has a control to hang
  a label on. **It names nobody** — the record knows *whether*, the console knows
  *who* — and inventing a second sentence beside `portalSentence` is the drift §6
  warns about.
- ⚠ **One expression, three reads.** The page, the tray and search all select it,
  so a settled or crossed-off line keeps its mark: **a resolution is not an
  erasure**, and nothing about `state` is in that read.
- ⚠ **It is on the ROW, so it travels with a swipe** — a mark that stayed put
  while its line slid away would be marking whatever was underneath.
- ⚠ **`--mark-width` is `2.5px`, like `--caret-width`, so the mark is the same
  hairline on the desk as on the handset** while everything around it is
  four-thirds the size. That is the caret's own rule inherited, it is **not** one
  of the four exceptions the desk's scale names, and it has not been looked at on
  a real desk. If it reads thin up there, that token is the thing to move — and
  the caret moves with it.
- **Measured: 6.77:1 on the desk's `#14140f`, 7.70:1 on the handset's true
  black**, past the 3:1 WCAG 1.4.11 asks of a graphical object on both. The brief
  asked for the re-measurement against the charcoal before shipping; it needed no
  change. ⚠ **`mark.mjs` asserts the mark is `--color-accent` and NOT
  `--color-chrome`** — the colour it wore for the eight days it was a pick — and
  that no unconverged line draws anything at all.

⚠ **Phase 2 step 3 is built — THE PORTAL, 30 August, and the engine finally has
a reader.** For a week `lib/overlap.ts` has been deployed, running, and writing
`notifications` rows that **no surface in the tree read**. One does now, and the
fan-out is proved end to end with two accounts for the first time —
`tests/portal.test.ts`, five cases including the suppression rule seen from a
surface at last.

- ⚠⚠ **THE DOOR IS IN THE BOTTOM BAR AND THAT IS AGAINST §2 OF THE BRIEF —
  directed.** §2 reads: *the bottom edge is for what you do without looking, the
  top edge is for what you go to on purpose… which is why the notification portal
  goes at the top: it must never be given a reflex's real estate.* **The
  direction was given with that stated and it stands; the law is not amended and
  this is not a precedent.** The cost is written beside the control in
  `foot.tsx`: the portal now sits next to the one control this app has to be
  perfect at. ⚠ **If the `+` is ever mis-hit, this is the first suspect, and the
  answer is the top edge — not a bigger gap.** It cost no layout: the foot's grid
  has been three columns since settle left, so the `+` holds the centre by
  construction and column one was empty.
- ⚠ **A list of LINES, not events, and it is enforced in the READ.** `listMyPortal`
  joins each notification to *the viewer's own capture for the same possibility*
  and groups by that capture — so two people converging on one line is **one row
  naming both**. ⚠ **The join is `payload->>'itemId'`, because a notification
  carries no capture id and cannot**: a match is about a possibility, and the
  viewer's own capture is found at read time. Every payload written before the
  portal existed works unchanged.
- ⚠ **`eq(captures.userId, …)` in that join is the privacy term.** A notification
  names a counterpart; it must never be a door to the counterpart's row. Both
  sides get their own notification, so each person's portal is built entirely out
  of their own captures. Asserted.
- ⚠ **It empties, and `notifications.read_at` was already in the schema** — so
  Phase 2's *seen-state needs a column* is closed **with no migration**, and the
  deferred vocabulary migration is not waiting to be batched with anything.
- ⚠ **AN EMPTY PORTAL HAS NO DOOR.** Off is the drawing without the door, exactly
  as search's is — *an empty portal is the resting state* is not a surface to
  build, it is a surface that cannot be opened. The first version made it a live
  `<button>` whatever the bit said and a probe caught it.
- ⚠ **Never a count, and `portal.mjs` asserts the ABSENCE OF DIGITS on the
  door.** `hasPortalLines` is an `exists` rather than a count for the same
  reason: a counting function is one refactor from displaying one, and a badge is
  an engagement metric under another name.
- ⚠ **The console is handed down as a RENDER PROP.** The portal decides where a
  console goes; the page decides what it does. Every control on it is the
  record's own handler acting on the same capture through the same action — a
  portal that built its own would be a second implementation of every mutation on
  this screen. ⚠ **`crossedOff` is read off the portal's line and never off
  `lines`**: the capture may be from March and outside the fifty this page
  loaded.
- ⚠ **The portal is the SCRIM'S THIRD OCCUPANT, and it is the only one that keeps
  the scrim on the desk.** The console suppresses it up there because the record
  around an expanded row is what a reader wants to keep seeing; the portal is a
  floating card at every width — it is not a line, so there is no row for it to
  expand into — and a floating card must sink what is behind it. `dismiss` asks
  about the portal **first**, because a console inside it is the innermost thing
  open.
- ⚠ **`portal-sheet` is `pointer-events: none` with the card taking them back**,
  which the console already knew and the portal did not inherit. Without it the
  gutter and the band under a short card swallow the tap meant for the scrim, and
  the box appears not to close. Found by the probe in one run.
- ⚠ **Three sentences, not four.** *Sam too.*, *Sam has.*, *Sam wants to.* — and
  §5's fourth, *Sam has too.*, **cannot fire**: `go_back_to × go_back_to`
  produces no match at all, because both know. **Do not add the sentence to
  complete the table** — it is a row in `classify` and a new `NotificationKind`,
  decided there. `lend` had no row in the table and was given one, flagged in
  the code the way `notificationCopy`'s unspecified lines are. `portalSentence`
  lives beside `notificationCopy` in `lib/overlap.ts` deliberately: §6 warns
  that the payload is what drifts, *because it is what the UI reads*.
- **Measured by `node_modules/.probe/portal.mjs` on both surfaces**, and proved
  by `tests/portal.test.ts` against the database — a browser cannot be driven
  into a convergence quickly, and the two halves are tested where each can be.
  `scripts/seed-portal.mjs` writes one locally, with the tests' production guard.

⚠ **This paragraph said the engine had no reader and is corrected rather than
deleted — 30 August.** It was true for a week and it is what the portal above
answers: `tracks`, `lib/overlap.ts` on both triggers, the suppression rule and
`notifications` rows written in the same transaction all exist, run, **and are
now read**. The fan-out is proved end to end with two accounts —
`tests/portal.test.ts`, and `tests/mark.test.ts` for the mark's side of it.
**What is still not built:** no QR handshake and no possible-match prompt. ⚠ **The
convergence mark was in this list until 31 August and is built** — see Phase 2
step 4 above. ⚠ **Overlap joins on `possibility_id`, so only *resolved*
captures converge, and TMDB is the only catalogue** — today two people can
converge on a film and on nothing else. See §13 of the implementation
specification, which now carries this as Phase 2's status.

⚠ **Phase 2 step 2 is built — TAP THINKS, SWIPE DOES, 30 August.** Swipe a line
**away, and back**. A tap still opens the console.

⚠⚠ **THE SWIPE'S VERB CHANGED ON 31 AUGUST AND THIS SECTION IS THE OLD ONE.**
It read *away to cross it off, back to put it back — the verb used fifty times a
week is a gesture on the row now*. **The swipe carries the LOCK**; crossing off
is the console's; and *fifty times a week* was an assumption about usage that the
person using the app corrected. **The section is kept because every mechanical
argument in it is unchanged and still governs** — the detent, the inert
direction, `touch-action`, the physical rather than logical direction, the
haptics. Read it as being about the gesture, not about the verb. The verb's own
entry is at the top of this file.

⚠⚠ **IT WAS REOPENED AND REBUILT THE SAME DAY, AND THE ANSWER WAS A SUBTRACTION
— read this before touching the swipes.** It shipped as *left crosses off, right
asks* Again?, and the direction after use was: **settling must cost ONE beat**,
and **both directions must afford an undo**. **The settle swipe is deleted**, and
that answers both at once.

- **Settling never cost one beat and could not be made to.** The swipe asked
  *Again?* because settling has two answers — *I would do this again* against
  *that is dealt with* — and a gesture that asks rather than acts IS the second
  beat. An undo removes the *safety* argument for the question, but the other
  answer still has nowhere on a row to live. ⚠ **So settling keeps the console,
  which has room to state two answers, and the row keeps the one resolution that
  is its own inverse.**
- ⚠ **The undo is the opposite direction, and it is unbounded in time.** A
  crossed-off row stays on the page, so the way back is on the page for as long
  as the row is. **This is why there is no ten-second window, no held row, no
  settled-but-reversible third state and no toast** — all of which §3b of
  `docs/re-direction/phase-2-convergence.md` was going to need. It records what
  was built and why the second option won.
- ⚠ **A row affords exactly ONE swipe and its state says which** — live goes
  away, struck comes back. It is no longer the same direction toggling on a state
  the hand cannot feel. **The inert direction does not move the row at all**: a
  row that travelled and clamped where nothing happens would feel armed and then
  do nothing, and the detent is the only confirmation iOS can give.
- ⚠ **The record's inline *Again?* is deleted** with the swipe that put it there,
  along with the `!isOpen` guard that stopped one question being drawn twice.
  `asking` and `askAgain` survive as the console's alone.
- ⚠ **The reverse swipe was invisible and the console was what made that safe** —
  a crossed-off line's console offers one control and it is *Put it back*, and
  the gesture was a learnt shortcut rather than the only door. ⚠ **31 August
  changed which half of that still applies:** the console is now the *only* door
  to crossing off, and the reverse swipe unlocks instead — **which is not
  invisible any more**, because a padlock leaves the row's tail. That was
  forced: a gesture nothing confirms is a gesture on a surface with no haptics.

- ⚠ **`touch-action: pan-y` on `page-row` IS the scroll question, and it is the
  whole answer.** *Vertical panning is yours, horizontal is mine*, said to the
  engine before a single event reaches `row-swipe.ts`; when the browser decides a
  gesture is a scroll it sends `pointercancel`, which is the signal to let go. **A
  hand-written axis lock would be `keyboard-hem.ts`'s five-version thermostat
  rebuilt on a second axis.** The brief asked for this to be checked rather than
  assumed; it is checked by being impossible.
- ⚠ **The threshold is the ROW'S OWN HEIGHT, read off the row** — not a token and
  not a fraction. A row is `--tap-floor` on a handset and four-thirds of that on
  the desk, so measuring the thing being swiped is right on both by derivation:
  measured 44 and 58.67 from one line with no breakpoint in it. It **clamps**
  there, which makes it a detent rather than a threshold to guess at — the row
  stops dead when the action is armed.
- ⚠ **A SWIPE CANNOT SETTLE, because settling has two answers**, and that is why
  there is no settle swipe rather than why it asks a question. *Again?* and *done*
  are different claims and one direction cannot carry both. Crossing off needs no
  question because it is its own inverse, which is the whole reason it is the
  resolution the row got. `askAgain` is the one owner of that question and the
  console is its only door.
- ⚠⚠ **THE GESTURE IS CONFIRMED BY THE EYE, AND THAT IS FORCED.** iOS Safari
  implements no Vibration API and the installed app is a handset, so a swipe
  designed to be confirmed by the hand would be confirmed by nothing at all on the
  one surface this app runs on. The travel, the detent and the visible outcome are
  the mechanism. **Nothing in this app may be designed to be confirmed by the hand
  alone** until a native shell exists — see `lib/haptics.ts` and the *CARRY THIS
  INTO A NATIVE APP* note in `docs/decisions.md`, which holds the vocabulary.
- ⚠ **The haptic vocabulary is wired and Android-only:** a capture lands is one
  light tap, settled a firmer double, crossed off a heavier thud. **Three
  patterns, tellable apart** — the same buzz twice is the noise the rule against
  UI haptics exists to prevent. Silent: opening the console, dismissing it, the
  keyboard, the chrome. ⚠ **Putting a line back borrows the capture's tap and
  there is deliberately no fourth pattern**: *a line is on the live record* is the
  fact both callers state, and a fourth buzz would have to be tellable from three
  others on the one axis `vibrate()` controls.
- ⚠ **Physical, not logical.** Away from the reader crosses off, back restores,
  against the screen rather than the writing direction — a *row* has no
  `dir="auto"` signal and a record can hold both languages at once, so mirroring
  per row would have two rows answering one swipe differently. Held deliberately.
- **Measured by `node_modules/.probe/swipe.mjs`**, which drives real CDP touch
  events because the thing under test is the browser's own arbitration. ⚠ **It
  failed on its second run against the state its first run left**, and every
  assertion is now scoped to a row it seeded by text — a probe that is not
  idempotent will eventually report a bug that is its own. ⚠ **It holds the drag
  at full extension to read the transform**, because the row springs back on
  release and *did it move* is the question the inert direction turns on.

⚠ **Phase 2 step 1 is built — the CONSOLE, 30 August.** A tap on a line opens a
box holding the whole capture, its photograph, its link, its year, its standing
question and its three controls. **It reads no network and no `notifications`**,
so the paragraph above is unchanged — what it gives Phase 2 is the surface
everything later hangs on, since the portal is *a list of things that open
consoles* and the convergence sentence lands in a slot this box already leaves
empty. It also closes Phase 1's thing detail view: **`film-screen.tsx` and the
unreferenced `capture-provider.tsx` are deleted.**

- ⚠ **A tap on a line no longer picks it, and `picked` is gone as state.** The
  pick lit the foot's settle glyph and put `×` and `✎` in the row's own slot —
  three controls for a line whose words the row could not show. All three are on
  the console now, which is *a control belongs where its effect appears* applied
  once more. **The record's slot keeps the undo** — for the ten seconds after a
  line lands, because that is a window and not a considered act — **and, since 31
  August, the lock's padlock**, which is a *state* rather than a control and is
  the only thing that confirms the row's swipe.
- ⚠ **The foot is `+` and search**, and `foot.tsx` had predicted the move in
  writing. Its bar is a **three-column grid** so the `+` holds the centre by
  construction rather than by there happening to be three glyphs.
- ⚠ **Two surfaces and they are genuinely two — directed.** A fixed rectangle
  over a blurred record below `--breakpoint-stack`; the row **expanding in place**
  at and above it. One component, one mount point, the stylesheet deciding.
- ⚠ **The `picked` utility survived in `globals.css` applied to nothing, and on
  31 August it became the MARK.** It was kept deliberately — §11 reserved
  `--color-accent` for **convergence** and the gutter is where a state may live —
  and it is now `@utility converged`, the same drawing in the accent instead of
  the chrome. **Do not put a pick mark back in that column**: there is something
  in it, and a second thing there means neither of them says anything.
- ⚠ **One scrim, one occupant.** The console takes the writing sheet's scrim
  rather than bringing a second — the two can never be open together, because
  `✎` closes the console and hands the words to the strip, and the `+` closes it
  the other way. **Tapping the paper is now the one exit gesture in the app.**
- ⚠ **The card is the BARS' glass, and what made it visible was taking the tint
  off the SCRIM.** Directed: *a glass see-through effect with the relevant blur,
  not far from the banner treatment.* Three grounds were tried on the card and
  two of them were invisible and one was grey — because **the card was never the
  problem**. The bars read as glass because the record passes under them at full
  strength; the scrim had already darkened everything, so the card's glass had
  nothing left to darken. The scrim now **blurs at `--glass-blur` and does not
  tint** while a console is open, and the card is `--glass-tint` over the same
  blur. ⚠ **The writing sheet's branch keeps its tint** — it has no blur, so the
  tint is the only thing sinking the record under a field. Two occupants, two
  needs, written separately rather than reconciled.
- ⚠ **The card is as tall as the entry in it — directed, and it reverses the
  fixed-height box built an hour earlier.** That box existed so the `×` could
  never move; the price was a 616px card holding three words. The **bounds** are
  still fixed — same top edge, never touching the bar or the strip — so what is
  constant now is the gap between the last line and the controls rather than
  their position on the glass. `flex: 0 1 auto`, never `flex: 1`, whose `0%`
  basis collapses the desk's auto-height container.
- ⚠ **Nothing scrolls behind an open console.** `touch-action: none` on
  `console-sheet` — the scrim already had it, and a drag starting on the *card*
  was the hole, since `touch-action` does not inherit across an element boundary.
  The body inside takes it back as `pan-y` with `overscroll-behavior: contain`.
  On the desk this does nothing and should not: the console is in flow *inside*
  the record, so there is no "behind" to hold still.
- ⚠ **THE CONSOLE'S TEXT LANDS ON THE RECORD'S FIRST LINE — directed, and it is
  exact.** Measured 0.00px on a 390 handset. **The payoff is not the top line, it
  is every line:** the words of whatever you opened always appear where the eye
  already reads. For the top line it is a true expansion in place — the words do
  not move at all and a card materialises around them, which is what the rise
  animation was gesturing at. `--console-top` is **derived**, not offset:
  `--bar-height + --stamp-block + --line-hem`, because the two `--page-lead`s —
  the record's and the card's padding — cancel. Change the stamp, the bar or the
  row's hem and it follows.
- ⚠ **Which is why the console's day stamp is BELOW the capture.** The words have
  to be the first thing in the card or the alignment is off by whatever sits over
  them — and with the console open on the newest line, its stamp had been sitting
  directly on top of the record's own, saying *Today* twice through the glass.
  One change, two things answered.
- ⚠ **The top clearance went from `--tap-floor` to ~32px and that is affordable
  ONLY because the card is content-sized.** The 44 was picked when the card
  filled the box and the four thin bands were the whole of the paper, one of
  which had to carry the only exit. There are hundreds of pixels of paper below a
  short card now. **If the card ever fills the box again, put the 44 back.** The
  FOOT is still `--tap-floor` and is a different question: it is the bound a long
  capture stops at, keeping the strip clear whatever the record does. The
  positioner is `pointer-events: none` for the same family of reasons — its
  gutter would otherwise swallow taps meant for the scrim.
- **Measured by `node_modules/.probe/console.mjs`** on both surfaces, including
  the rule the whole design rests on: **the same rectangle whichever line was
  tapped**, so the `×` is somewhere a thumb can learn.

⚠ **The desk's ink is LIFTED, and the open note above it is closed — 30 August.**
It was raised the same day the ground went to `#14140f`: every ratio in the
palette had dropped by about 12% with no colour changed, the feeling was that the
type and the mark may want to come back up, and the note said *nothing moves
until it has been looked at on the real desk*. It was, and it was **reported
dull**. The note also said what the answer would have to be, and that is what was
built: **lift the INK, never the ground.**

- ⚠ **`--color-text` `#eae6da` → `#f9f4e8` on the desk, and `--color-chrome`
  `#e8b34a` → `#f7bf4f` with it.** Same chromaticity, more of it — the linear RGB
  scaled by one factor, which is the move `--color-chrome` itself made out of
  `--color-accent`. **Not a mix toward white**: an sRGB mix is a gamma-space lerp
  and would take the warmth out (R−B from 16 to about 5), and warmth is most of
  what makes this page read as printed rather than rendered. It measures **17**.
- ⚠ **The target is the RATIO and never the pigment.** 16.832:1 for the ink
  against the charcoal, against the base ink's 16.830:1 against black; 11.01
  against 10.98 for the chrome. **The desk now reads as the handset reads**,
  which is what *the desk is the same design, four-thirds the size* asks of a
  colour as much as of a size.
- ⚠ **The chrome went because a palette moves as a palette.** What was reported
  was the text; on black the chrome was pitched at 65% of the ink's ratio *by
  choice*, and lifting only the ink drops it to 57% and quietly re-pitches the one
  colour a thumb aims at. **If the lit brass now reads too loud, that one line
  comes out and the ink stays.**
- ⚠ **`--color-rule` and `--color-surface` are mixes of the ink, so their
  percentages had to come down** — 17.5% → 16.3% and 10.5% → 10%, holding 1.588
  and 1.285 against the handset's 1.583 and 1.286. Left alone they would have been
  drawn heavier than the handset's for no reason but the ink behind them moving.
  The hairline's hex barely changes (`#393933` → `#393932`), which is what a
  token that is mostly ground looks like when its ratio is held.
- **Nothing else moved, and the numbers are stated in the code so nobody
  re-derives them:** the lacquer red sits at **3.75** on this ground (4.26 on
  black), the live red **5.21** (5.92), the listed green **13.80** (15.69). All
  three clear their own floors, and all three are scarce *state* colours whose
  value was chosen rather than derived — restoring them means picking three
  colours nobody has looked at. ⚠ **The lacquer red is still the tightest and the
  first to re-measure if the ground moves again.**
- **Measured by `node_modules/.probe/deskink.mjs`**, which reads the ratios off
  the live page — the handset's palette is the reference and is asserted
  untouched, the boundary is walked at 1152/1151, and `--color-muted` is checked
  to have followed the ink with nothing declared. ⚠ **It resolves `color-mix()`
  by painting it**, because a custom property comes back as source text, and it
  parses **both** `rgb()` and `color(srgb …)` — the first version read only the
  first form and turned two tokens into eight-digit ratios instead of failing
  honestly. `deskinklook.mjs` renders the before/after.

⚠ **Production was a 500 for every signed-in request on the morning of 25
August, and the cause is the rule this file states.** Three commits selecting
`captures.suggested_possibility_id` were deployed while `0009` and `0010` sat
applied on `development` only. The runbook says *migrate production first,
deploy second*, in those words, and the ordering was inverted. Additive columns,
no data lost, and the fix was to run the migration — but every authenticated
page was down until it was.

⚠ **A register that is confident and stale is what caused it.** Both this
section and the memory beside it recorded the migrations as applied to
production. Neither had asked. **`npm run migration:state` asks** — it prints the
host first, then the applied count, then whether the columns the page reads
exist, and it writes nothing, so it is safe against any branch.
`scripts/prod-check.sh` and `scripts/prod-migrate.sh` wrap it for production,
which needs one shell per command because an exported variable does not outlive
the command that set it. Production's `DATABASE_URL` is a Vercel *sensitive*
value that nothing can read back, including the dashboard, so it comes from
`neonctl` — never from `vercel env pull`, which redacts it. Do not write down
what state production is in. Ask.

**The whole page has been seen on hardware and judged good.** The first real use
of it reversed two decisions the desk had made:

- **The record is newest-first and the caret sits under the bar.** Nothing
  scrolls on arrival or after a Return, and a keyboard rising from the bottom of
  the glass has no way to cover the line being written.
- **A line is only as wide as its own words.** ⚠ **Tap the words to OPEN THE
  CONSOLE since 30 August; it picked the line before that.** Tap the paper to
  close it. A second tap on the words did the rewriting for a day and stopped on
  25 August, and the rule that killed it is the rule that still holds: **a tap on
  a line means one thing** and never two depending on the tap before it.

⚠ **The words of a record line are a `<span role="button">`, and nothing may
make them a `<button>` again.** The original reason was that a button cannot be
inline — every engine computes `inline-block` for it whatever the declaration
says — so on the inline row the words did not fragment, the box filled the
column, and the controls landed after the *box*. That shipped for a day on 25
August and every wrapping capture wore it; `node_modules/.probe/inlinebutton.mjs`
is the measurement. ⚠ **That reason expired on 28 August with the wrapping and
the rule did not** — the words are a flex item now, so display is the container's
to decide, but a `<button>` still brings a UA font, a centred text alignment and
a baseline of its own into a row built out of one inherited type.

⚠ **The last word used to be split off and bound to the tail, and that is
deleted — 28 August.** It existed because everything after the words is an atomic
inline: on a line that *fragmented*, a last line with less room than the tail
needed put the controls at the left margin, reading as a separate entry. Three
cheaper mechanisms were built and measured and none works —
`padding-inline-end` hangs past the column rather than forcing a break, the same
padding on an empty spacer contributes nothing, and a word joiner does not
suppress a break across an element boundary; `node_modules/.probe/keepwith.mjs`
holds all of it and is still true **of wrapped text**. Nothing wraps now, so
there are no fragments and nothing to keep together — the words are one span
again, which is one control by being one thing, and the two-halves a11y dance
went with it.

⚠ **A row of the record carries the line's type, and nothing else may.** It was
on the words until 26 August, and `vertical-align: middle` centres a box on its
*parent's* x-height — so every glyph riding a line was aligned against the page's
body 15/1.45 instead of the line's 18/28, and read as sitting low. Measured
3.29px under the words' cap centre. `page-words` is deleted and `line-glyph`
replaces `align-middle` on the line's furniture: the box is exactly the line box,
top-aligned, so the glyph lands on the line's own centre with **no face metric
anywhere in it**. Do not reach for `vertical-align: middle` beside 18px text
again, and do not correct a glyph's position from outside the glyph —
`UndoGlyph` was drawn off its own grid and was redrawn on it.

⚠ **A commit ends the writing mode on every surface, and on glass it gives the
keyboard back.** Directed 27 August: **once a line is submitted the person is
presumed done**, and another capture is a tap back into the live row. It
reverses the older rule that a session of captures is a run of Returns, which is
why the keyboard used to stay up — and that rule is what left the record behind
glass at the one moment it has something to say. `commit` calls `done()`, which
takes the same `blur()` + `setWriting(false)` door the writing pane's own tap
opens. An empty line is still just an empty line and still takes `rest()`, which
keeps its coarse-pointer guard: deleting the last character must not dismiss a
keyboard.

⚠ **A lift that carried the blink over the pane was built and deleted inside a
day.** It was right while the pane outlived the commit; the commit ends the mode
now, so the pane is down before the line arrives and there is nothing to see
through. **The condition went, so the correction went** — putting a lift back
means the commit has stopped ending the mode, and that is the thing to fix
instead.

⚠ **The live line is not pinned any more. The field is summoned — 27 August.**
The record has the whole screen; the foot's `+` raises a **writing sheet** on
the bottom edge of the glass, above the keyboard, and it grows with the words in
it. It reverses the 26 August decision to leave the row alone, at the user's
direction, after that decision was measured and found to cost more than it saved.

The reported bug is closed **by construction, not by correction**: a capture
longer than the column wraps in the sheet rather than running off the side of
it, so there is nothing off screen to scroll to. That matters because there was no
honest way to scroll it — **a drag inside a focused single-line field means
caret-and-selection on every engine**, and Chromium already pans one while iOS
does not, so a hand-written pan would have been a second pan on Android and a
platform branch everywhere. `node_modules/.probe/panfield.mjs` is the
measurement.

⚠ **Every line on this page is one line, and nothing may wrap — 28 August.**
Directed: *all entries written on one line, never more than one*, and the same
rule for the live row. It holds on every surface, because it is a rule and not a
device correction.

- **A record entry truncates.** The words are `min-w-0 truncate` in a flex row,
  so they hug their own text while there is room and give up width to the tail
  when there is not. `aria-label` still carries the whole capture — an ellipsis
  takes text off the screen and must never take it off a reader.
- **The row is `display: flex` again, and that does not reopen the 25 August
  bug.** That day flex left a wrapped line's × and pencil at the right margin
  because *flex has no notion of after the text ends*. There is no "after the
  text ends" any more — the words are one unbroken box that ends where they do.
  And flex is the only layout that can *shrink the words to make room for what
  follows*, which is what one line requires. The two decisions are mirrors, not
  a reversal.
- ⚠ **The last-word split is deleted**, with the `white-space: nowrap` binding
  and the two-halves a11y dance it needed. All of it kept an atomic tail on the
  same line as the last character of a *fragmenting* line.
  `node_modules/.probe/keepwith.mjs` is still true of wrapped text; there is
  none. The year and the `?` moved **out** of the words for the same reason —
  inside a clipping box they would be the first thing an ellipsis ate.
- **The field is one line and it slides.** `grow-field` and `--sheet-cap` are
  deleted; `page-input` is `--leading-line` tall and the element is an
  **`<input>`**. When the caret reaches the end of the row the words already
  written move out of the far edge — the engine's own behaviour for a one-line
  field, with nothing in the CSS producing it.
- ⚠ **`dir="auto"` on the field, which is the whole of *depending on user
  language*.** Direction comes from the first strong character typed, so the
  value slides left under English and right under Arabic with no branch and no
  locale lookup. Measured: `scrollLeft` +508 on a 390px handset in Latin, −85 in
  Arabic, `direction` computed `rtl`. The drawn caret is `start-0`, never
  `left-0`, for the same reason.
- ⚠ **A capture is still stored whole.** Nothing truncates the text; the row
  shows what fits. Rewriting opens the full capture in the field.

Measured on both surfaces by `node_modules/.probe/oneline.mjs` — 50 rows, one
height, 44px — `onepick.mjs` for a picked line's tools, and `slide.mjs` for the
field.

⚠ **The glyph row and the writing line are ONE STRIP on the bottom edge — 28
August, and it supersedes four rounds of arguing about the sheet's height.**
Directed: *the row at the bottom that contains the glyphs should simply swap out
the glyphs for the live row.* They were two objects sharing that edge — a 44px
foot bar and a 36px sheet — so starting a capture changed the shape of the bottom
of the screen, and every *a tad more* / *a tad less* was really that.

- **The box never changes between the two STATES; the contents and the ground
  do.** ⚠ **On the handset it is `--leading-line` and nothing else — 28px, the
  line, `--sheet-air: 0px` — since 30 August.** It was 44px (a hem, the line, a
  hem), then 41, and it is the line alone because the strip became glass and
  glass has edges: an opaque black strip on a black page showed only the soft
  core of the glow inside it, so 41px read as about 20, and the day it was drawn
  as a surface it was reported as *much taller than it was*. **The box was never
  taller. It was never visible.** The desk keeps its two hems. ⚠ **28px is under
  `--tap-floor` and that is fine**: `sheet-glyph` hangs the whole 44px overhang
  upward, measured — a hit area does not have to be inside the box it belongs to.
  Idle it is the bars' glass with the
  record dissolving under the glyphs; writing it is `sheet-lit`, **also glass**,
  at a lower tint over a heavier blur.
- ⚠ **THERE IS NO LIGHT ON THIS PAGE — 29 August, and this reverses four moves
  made the same day.** Directed: *get rid of the light on the handset and
  desktop/browser.* `--sheet-light`, `--row-light`, `--row-light-idle` and
  `sheet-lit`'s `::before` are all **deleted** — the mechanism, not a `none`.
  The day's sequence is the tell and is worth keeping: the glow went off on the
  desk, then off from `rail` up, then its box shrank to the line, then its peak
  went 8% → 7%. **Every step was somebody answering "less", and the answer was
  "none".** Do not reintroduce a glow without reading the `--row-light`
  tombstone in `globals.css`, which holds the "too grey" argument it was built
  on.
- ⚠ **The writing ground is GLASS on every surface, and that is what replaced
  the light.** Directed: *make the handset writing row have the exact same
  see-through glass blur effect as the desktop.* `--sheet-tint` is
  `color-mix(--color-bg 38%, transparent)` and `--sheet-blur` is 24px, stated
  once at the base with **no surface override** — the desk's copy is deleted
  rather than mirrored. It went opaque → glass → opaque → glass in a day; the
  middle reversal was mine, on the reading that the record smearing through was
  the "light on the desktop" being reported, and the correction was to want the
  glass on both rather than on neither.
- ⚠ **The strip is on a true-black page, so an opaque ground is INVISIBLE.**
  That one fact explains the whole day. A black strip on a black page has no
  edge, so the row had to be drawn by a glow inscribed in it, and every question
  about that glow was really a question about a surface that was not there.
  Glass is a surface: it has an edge, it carries the record's light through it,
  and it needs nothing painted on top. **38% and not the bars' `--glass-tint`** —
  74% of an already-black ground leaves nothing to come through, which was
  reported on the first attempt; the number is low because what is behind it is
  dark. 24px and not the bars' 18px, because what passes behind this is prose at
  the same size and face as the prose in front of it.
- ⚠ **Reported: *the writing row used to be closer to the keyboard*. The row
  never moved.** It was the glow that reached the keys — it filled the whole
  strip, so its bottom edge was the strip's — and it stopped when its box became
  the line, leaving 6.5px of invisible ground below it. Measured on a notched
  390: the field's bottom went from 30px to **23.5px** above the strip's bottom,
  which is 6.5px *closer* to the keys, while the lit band went the other way.
  **The glass restores that edge by being the strip** — the bottom of the
  visible row is the bottom of the strip, which is the top of the keyboard. ⚠
  **Do not answer that report by moving the air**: the air is what puts the
  glyphs on the strip's centre line, which was itself directed the same day.
- ⚠ **A one-cell grid holds both rows, and neither may be unmounted or set to
  `display: none`.** They fade in place. Unmounting either lets the strip resize,
  which is the whole thing this removed — and a hidden field cannot take the
  synchronous focus iOS requires.
- ⚠ **It moves between two positions and that is all it moves.** Idle on the
  glass, writing on `--keyboard-overlap`. The foot deliberately never rode the
  keys — see `keyboard-hem.ts` and its five wrong versions — and the field always
  must; one strip does both because it is the same object relocated. The notch
  expression covers both ends.
- ⚠ **The glyphs' 44px is now bounded by construction.** `--glyph-foot` is 26px
  centred in a 28px cell, so `tap-target`'s pseudo-element reaches 9px each way
  and stops **flush with the strip's edges**. The old note warning that the next
  pixel would push that hit area out over the record is retired.
- **Deleted:** `--foot-lead`, `--foot-tail`, their 45rem overrides, `Foot`'s
  `fixed` box, its glass, its safe-area padding and its `receded` prop.
  `--foot-height` is now the strip's own arithmetic.
- **Above `--breakpoint-stack` nothing changes**, at the user's direction: there
  is no foot bar up there — the tools stand beside the column — so the strip is
  the field alone at `--sheet-hem` = a hem and a half, translated off the glass
  when idle, exactly as before.

⚠⚠ **THE STRIP IS SHORTER WRITING THAN IDLE, AND THAT REVERSES THE ONE-STRIP
RULE ABOVE — 30 August.** Directed: *reduce the height of the writing row, the row
that appears when we press the plus sign; leave some padding between the top of
the keyboard and the bottom of the characters, and make the gap between the top of
the characters and the top of the row the same size as the bottom padding.* The
handset's writing row is **54px → 40.5px**, with **12.1px of glass above the
capitals and 12.1px below the descenders**. The idle strip is untouched at 75px
and the glyphs have not moved.

- ⚠ **The two rows stopped being the same object, which is what the one-cell grid
  assumed.** The glyph row is a **26px drawing** in a 28px line box — 1px of slack
  a side. The writing row is **16.3px of ink** in the same box — 7.6px above the
  capitals, 4.1px below the descenders. One air cannot serve both: the air that
  centres the characters leaves the glyph drawings 5.5px from the strip's top edge
  and 9px from its bottom, which is the *glyphs sit high in the bottom bar* report
  of 29 August rebuilt deliberately. **Two boxes, because there are two objects.**
- ⚠ **What the 28 August rule protected is untouched: the strip does not change
  shape ON THE GLASS.** By the time it is the writing row it has *moved* to the top
  of the keyboard. On a notched handset the two states already measured 75 and 54.
  ⚠ **On a browser handset they were both 54 and are now 54 and 40.5** — that is a
  real change to the surface the rule was written for, and it is the price.
- ⚠ **Equal padding is what put the text low; equal gaps to the INK is what was
  asked for.** The row's air is `--line-hem` under the descenders and, above, the
  same optical gap **less the slack the line box already provides over the
  capitals** — 4.5px of lead against 8px of foot. Two numbers that are deliberately
  not equal.
- ⚠ **There is now an INTERFACE-FACE FENCE, and it is separate from the
  wordmark's seven.** `--face-em` 1.2, `--face-cap-drop` 0.24444, `--face-ink-rise`
  0.05 — Fira Sans 400, measured by `node_modules/.probe/inkfence.mjs`, which
  renders at 10× and **scans the pixels** because canvas rounds
  `actualBoundingBox*` to whole pixels and at 18px that is a 4% error on a cap
  height. `--line-ink-lead` and `--line-ink-foot` derive the 7.6/4.1 from them and
  the type, so both follow the desk's root scale for free. **Do not scale one
  face's set into another's** — the display fence's rule, applied to a second face.
  Change `--font-sans` and these are wrong until the probe is re-run.
- ⚠ **The state is carried by two custom properties, not by a second utility
  declaring `padding-block`.** Two utilities setting one property on one element
  are resolved by their order in the compiled sheet and a class attribute cannot
  state that order — the trap `--bar-gutter` is a token to avoid. `sheet-row`
  reads `var(--sheet-row-lead, …)`; `sheet-writing` sets it, and `initial` above
  `--breakpoint-stack` hands the fallback back.
- ⚠ **The desk WAS held out of this and is not any more — 30 August, later the
  same day.** Directed: *the desktop’s writing row a little shorter.* The
  `@media (min-width: 72rem)` block that handed `sheet-row` its fallback back is
  **deleted rather than re-tuned** — no desk number was picked, and there is one
  air on this page again instead of two. Every term is a `rem`, so the desk gets
  it at 4/3 and nothing else: lead 6px against 4.5, foot 10.667 against 8, the box
  **54px against 40.5**, the glass above the capitals and below the descenders
  **16.13 against 12.1**. Four ratios, all exactly 4/3, none of them written down
  — *the desk is the same design, four-thirds the size*, applied to the one row
  that had been left out of it. It was 69.33px of symmetric `--sheet-air / 2`, so
  the desk gains the optical centring with the height. Nothing up there has a
  second box to disagree with: the strip is the field alone and is translated off
  the glass when idle, and `--foot-height` is re-pointed to `3rem` and reads none
  of it.
- ⚠ **The sheet's notch clearance still subtracts `--sheet-air / 2`, the IDLE
  row's foot**, because a parent cannot read a property declared on its child.
  Keyboard down *and* writing is not a state a handset can be in, so nothing rides
  on it.
- **Measured by `node_modules/.probe/writingrow.mjs`** — the strip shorter writing
  than idle, the two ink gaps equal, real padding over the keys, the idle strip and
  the desk unmoved, and a chip beside the field still answering a tap top to bottom
  with its 44px ending inside the strip. `notchkeys.mjs` clicks the `+`, so it
  measures the writing row and is re-pointed at it.

⚠ **`--sheet-hem` is a hem on glass and a hem and a half on a desk**, both
`--line-hem` scaled and neither typed. It was `0px` for an hour — the box as
literally the line — then half a hem, and it is a whole one because a strip with
two states can only have one height. ⚠ **Air goes above and below, never below
alone**: bought only on the keyboard's side it is the *gap under the characters
that is not matched above* all over again, in miniature.

⚠ **And on 29 August the strip started obeying that sentence. `--sheet-lead` and
`--sheet-foot` are collapsed into `--sheet-air`.** They were `0px` above and
1.625 hems below, so the glyph row sat hard against the strip's top edge with all
13px of the air under it — reported from a handset browser as *the glyphs sit
high in the bottom bar*, and they were, by 6.5px on **every** surface. An
installed app hides it: `writing-sheet` splits the notch's 34px evenly, so the
same 6.5px is 6.5 of a 75px strip rather than 6.5 of a 41px one. The offset was
never the browser's; the browser is only where it shows.

- **The total is untouched, which is what the direction protected** — *lower the
  glyphs without changing the height of the bar*. 1.625 hems is what the strip
  already spent; `sheet-row` halves it, so the box is still 41px on glass and 69
  on the desk, `--foot-height` reads the same sum, and `page-hem`'s reserve does
  not move. Only the side it is spent on changed.
- ⚠ **One token, not two set equal.** The desk was already `--sheet-hem` on both
  sides, which is `--sheet-air: 2 × --sheet-hem` written once. Two names that can
  only ever hold the same number are the drift `--recede` was collapsed to avoid.
- **Centred is the only place it could stop.** Any other split is a number tuned
  until one screen looks right. Measured by `glyphsit.mjs` at both insets — the
  drawing's centre on the strip's centre line at 0 and at 34, strip heights 41 and
  75, unchanged; `tad.mjs` reads 7px above the text and 7 below.
- ⚠ **It reverses two directions and neither was a mistake.** The top hem went to
  zero on 28 August for *a shorter bottom bar with the glyphs left exactly where
  they are* — 44px to 40, and the only side that could pay was the top — then the
  bottom grew a pixel for *a tad higher*, 40 to 41. Both held the glyphs still and
  moved the height. This holds the height still and moves the glyphs. Same 41px
  box, asked about from the other end.
- ⚠ **And on 30 August the handset's air went to `0px`, so all of the above is
  desk-only arithmetic now.** Directed, once the glass made the strip's real
  height visible for the first time. The handset's strip is 28px — the line, no
  air — and the glyphs went down another 6.5px with it: **31px above the glass at
  the start of 29 August, 24.5 after the air was evened, 18 now.** That descent
  is not a bug and cannot be separated from the height, which is the thing to
  understand before touching either: **a glyph sitting higher needs air under it,
  and air under it IS the height.** One box, two questions, opposite answers.
  Measured by `sessionstart.mjs`, which reads both states at both insets.

⚠ **It costs the chips nothing, because a hit area does not have to be inside the
box it belongs to.** `line-glyph` splits its 44px evenly above and below the
line; with barely a hem to land in, the lower half would sit on the keyboard and be
untappable — 44px measured, 36px reachable. `sheet-glyph` hangs the whole
overhang **upward**, over the scrim, where there is nothing behind it but a
record under glass. Same 44px, same invisible box, somewhere a thumb can reach
it. Verified by hit-test, not by arithmetic: `elementFromPoint` returns the chip
at the very top, the quarter, the middle and the very bottom of its box, and
`node_modules/.probe/shortbox.mjs` measures 16px of overhang above the row and
**0px below the sheet**. One rule on every surface — above the breakpoint the
upward hang is simply harmless. It stays right now that the hem is 4px rather
than 0: half a hem does not hold half a target, and `tad.mjs` still measures the
chip's box ending 4px *inside* the sheet's bottom edge rather than past it.
⚠ **That figure is 6px since the air was balanced on 29 August** and the rule is
unharmed: the target is still exactly 44px, still hangs entirely upward, and
still ends *inside* the strip. What the 6.5px of matched air costs is 6px of the
strip's very bottom edge that the chips no longer claim — measured, not derived:
`shortbox.mjs` reads `clipTargetHeight` 44 and `clipBelowSheet` −6, and the
record's rows stay 44.

⚠ **The record keeps its 44px rows.** This is the sheet's box, not the page's
density. Both probes assert it.

⚠ **The notch's clearance is spent only while the notch is what is underneath —
28 August.** Reported from a handset: a large gap between the bottom of the
characters and the top of the keyboard, with nothing matching it above. It was
`padding-bottom: env(safe-area-inset-bottom)` on the sheet — 34px on a Face-ID
iPhone in portrait, **taller than the 28px line it was padding**. The inset is
not wrong; it was being spent at the wrong moment. With a keyboard up the sheet
is parked at `--keyboard-overlap`, not on the bottom edge, and the keyboard is
already covering the home indicator — but iOS goes on reporting 34px, because
the inset describes the display and not what is drawn over it. So the term is
now `max(0px, calc(env(safe-area-inset-bottom) - var(--keyboard-overlap, 0px)))`:
one expression, no branch, and it states the true thing instead of correcting
for the false one.

⚠ **And the clearance goes BELOW ONLY, less the air the row already stands off —
30 August.** Directed: *the bottom bar on the home app only reduced in height, and
the glyphs slightly higher.* Written down those are the same box asked about from
opposite ends — **a glyph sitting higher needs air under it, and air under it IS
the height** — and on glass, where the strip is 13 + 28 + 13 and nothing else,
they cannot both be had. **On a notched handset they can, because there is dead
height up there to reclaim**, which is why the change is invisible on every other
surface and why *the home app only* needed no branch, no device check and no
display-mode query.

- **Nothing above the row, because there is no home indicator above the row.**
  The even split of 29 August was a correction, not a principle: it answered *the
  glyphs sit high in the bottom bar* by pushing the row to the strip's centre
  line, and it paid 17px of a Face-ID iPhone's strip for clearance that keeps
  nothing off anything.
- **The row's own air counts toward the clearance, so the gap is not bought
  twice.** `--sheet-air / 2` is exactly what `sheet-row` already puts under the
  characters — same gap, same edge — so what the inset is owed is the part of it
  the row does not already provide. The term is
  `max(0px, calc(env(safe-area-inset-bottom) − var(--keyboard-overlap,0px) − var(--sheet-air)/2))`,
  spent as `padding-block: 0 <that>`.
- **Measured at a 34px inset, keyboard down: the strip 88px → 75px and the glyph
  35px above the glass where it was 31.** Keyboard up it is the 54px it already
  was, the term being zero either way. At a 0px inset — a browser, an Android, the
  desk — **nothing moves at all**: 54px, glyph at 14, `highBy` still 0.
  `node_modules/.probe/homeappstrip.mjs`; `notchkeys.mjs` is re-numbered and
  derives its expectations rather than typing them.
- ⚠ **The price, stated: on a notched handset the row is no longer on the strip's
  centre line** — 13px of glass above the glyphs and 34 below, `glyphsit.mjs`
  reading `highBy: 11`. That is the 29 August complaint in miniature (it was
  6.5:40.5 that day), and it is what *shorter and higher together* costs. If it
  reads badly the thing to move is this term, **not `--sheet-air`**, which is what
  the other two surfaces are made of.
- **`--foot-height` carries the same subtraction** so `page-hem` reserves what the
  strip occupies. It omits the overlap term, which a `@theme` token cannot read —
  see below — and does not need to: the reserve is the idle strip, and `page-hem`
  adds the overlap itself.

⚠⚠ **THAT EXPRESSION MUST BE WRITTEN ON `writing-sheet` AND NEVER IN A TOKEN. It
was lifted into `@theme` as `--sheet-clearance` on 29 August and that was a bug
— fixed 30 August.** **A custom property's `var()` is substituted where the
property is DECLARED, not where it is used.** `--keyboard-overlap` is written by
`useKeyboardHem` onto an element inside `<body>`; a token declared on `:root`
resolves it against `:root`, where it does not exist, takes the `0px` fallback
and **freezes**. The value inheriting down was literally
`max(0px, calc((34px − 0px) / 2))`.

- **On the device: the installed app's strip stayed 62px with a keyboard up** —
  the 28px line plus two 17px bands of clearance for an indicator the keyboard
  was already covering. Reported as *still too tall*, twice.
- ⚠⚠ **A BROWSER CANNOT SEE IT.** With no notch the inset is `0px`, so the broken
  expression and the working one both compute zero, and every desk reading, every
  emulator reading and every screenshot agrees. **Only a notched handset can tell
  them apart**, which is why it survived a day of measurement — and why *right by
  construction on all four surfaces* is not the same as *measured right here*.
- **The rule:** never lift an expression containing `var(--keyboard-overlap)` —
  or any property script writes onto an element — into `@theme`. It has to live
  on the element that inherits the value.
- `node_modules/.probe/hostvar.mjs` reproduces the bug by setting the overlap the
  way the hook does; `notchkeys.mjs` asserts the fix at both insets — 62px with
  the keyboard down at a 34px inset, **28px with it up**, and 28/28 with no notch.
- **It was extracted for a light that no longer exists**, which is the other half
  of the lesson: a name bought for a second consumer, then the consumer deleted
  and the name kept.

⚠ **CDP can emulate the safe-area insets, and this file has said twice that
nothing here can.** `Emulation.setSafeAreaInsetsOverride` works in the Edge build
the probes drive, so a notch is now testable on this machine — not iOS
*behaviour*, but any arithmetic that reads `env(safe-area-inset-*)`. Measured
four cells, keyboard up at a 336px overlap: the old expression gives 34px under
the row and 0 above (the reported bug, reproduced), the new one gives 0 and 0,
and with no inset nothing changes in either direction — Android, the desk and a
home-button iPhone all land on zero from both sides.
`node_modules/.probe/notch.mjs` and `notchbefore.mjs`.

⚠ **This element has been swapped twice in two days and both reasons are
recorded, because the next reader will assume one of them was a mistake.**

- **27 August, `<input>` → `<textarea>`.** Reported: a capture longer than the
  column ran off the side and could not be got back.
  `node_modules/.probe/panfield.mjs` measured why — a horizontal drag inside a
  focused field is caret-and-selection on every engine, and Chromium pans one
  anyway while iOS does not. Wrapping removed the condition.
- **28 August, back to `<input>`.** The wrap was replaced by the one-line rule,
  and the sliding line was then asked for directly **with the consequence stated
  first**: on a handset the words that have slid off are reachable by caret, by
  selection and by Home, but *not by swiping the row*. Accepted at that price.
  The rule saying *never swap this for an `<input>`* was written the same morning
  under the opposite condition. **The condition is what changed, so the rule
  went** — see *How things get fixed*.
- ⚠ **Not a `<textarea>` with `wrap="off"`.** That is a legacy attribute value
  propping a multi-line element up in a role it was not built for. An `<input>`
  is the element for a line.

⚠ **The sheet is one row tall and wider than the record — 28 August.** Directed
after the first look at it: too tall on the handset, too narrow on the desk.

- **44px, not 68.** `--sheet-lead` and `--sheet-tail` are **deleted**, not
  reduced. The field wears `page-line`, so the row already has a hem above the
  words and a hem below them; the sheet was adding 12px more on each side and
  paying for the same gap twice. What is left is exactly one line of the record,
  which is also `--tap-floor` and also the hit area of the chips beside the
  field. A number typed smaller would have been the thing *How things get fixed*
  rules out; the second helping of air being removed is not. `env(safe-area-inset-bottom)`
  survives, because a notch is clearance rather than spacing.
- ⚠ **`--sheet-measure` was that width and is DELETED — 29 August. The writing
  line and the record are one column.** It was the column plus the tool stack's
  width and inset on both sides — 54rem, the same sum as `--breakpoint-stack` —
  which put the sheet's left edge on the stack's and started the field **under
  the `+`**, 123px left of the first character of every line it was being added
  to. Measured at 1440: field at x=171, record text at x=294. Directed: *the
  start of the writing line always aligns with the entry column.* The sheet wears
  `--record-measure` now, with the same `gutter` and the same `mx-auto`, so the
  two cannot disagree and they narrow together against the mark's band — which
  two numbers could never have been made to do. **This is the field's width,
  never the ground's**: the strip spans the window and always did. Verified at
  1440, 1240, 1000, 800, 719 and 390 — the field's left edge on the record
  column's text edge at every one, and nothing about a handset changed.
- ⚠ **The sheet does not preview the record's line breaks, and the reason
  changed.** It was two measures disagreeing; it is now that nothing wraps on
  either of them. What the report asked for is that a long capture not scroll out
  of reach, and it does not.

⚠ **On a handset the `+` costs nothing, which is why this was affordable.** iOS
raises a keyboard only for a gesture, so starting a capture always took one tap
— on the pinned row before, on the `+` now. What the page gets back is the
screen: what sits above the record is the bar and `--page-lead`, where it was
the bar, the band and the air between.

⚠ **The field is mounted at all times and the `+` focuses it synchronously.**
That is the one non-negotiable in this design: iOS raises a keyboard only for a
focus that happens *inside* the gesture that asked for it, and a field mounted
by a state change is focused a tick too late. Never make the sheet's field
conditional, and never move its focus into an effect. That holds whatever the
element is — it has been a `<textarea>` and it is an `<input>`.

⚠ **Deleted with the band, and none of it should come back on its own:**
`--band-height` and its siblings, `--bar-visible`, `live-band`'s idle layer and
`band-dim`, `unsent`, `record-held`, the pane's `backdrop-blur`, the hem's
`head()` correction, and `live()`/`rest()`. The mode is no longer inferred from
gestures — the sheet is open or it is not — and every instrument that read
`writing` now reads a fact instead of an inference.

⚠ **Two exits on a handset and both commit**; `Escape` is the third and the only
one that discards, and a thumb never reaches it. There is no unsent draft, which
is what took `unsent` and `record-held` with it.

⚠ **LOSING FOCUS IS LEAVING, AND THAT IS NOW THE WHOLE OF HOW THE SHEET CLOSES —
30 August.** Reported on both handset surfaces: tap the field, then *Done* on the
keyboard's accessory bar — the keys go and the row stays, sitting on the bottom
edge with the drawn caret still blinking in it.

- **Every exit was wired to a gesture the page could see** — Return to the field's
  `onKeyDown`, a tap outside to the scrim's `onClick`, `Escape` to the key.
  **iOS's own dismiss is none of those.** It takes the focus and says nothing
  else, so `writing` stood with no keyboard under it and the sheet dropped to the
  bottom edge as `--keyboard-overlap` went to zero. Same wrong state a resume used
  to leave behind, reached a different way.
- **So the mode is tied to the one fact true of all four: the field has focus.**
  `onBlur` calls `leave`, which is what the scrim already called. Three doors, one
  exit. ⚠ **There is no keyboard detector in this and there must not be** —
  `--keyboard-overlap` measures a gap that opens and closes while a Safari tab's
  address bar collapses during a scroll, and reading it as *a keyboard is up* is a
  bug this page shipped on 24 August. See `useKeyboardHem`, which says so.
- ⚠ **`relatedTarget` inside the sheet is not leaving.** The chips beside the
  field take focus on a desk click, and losing the sheet because somebody reached
  for attach would be worse than the bug this fixes. iOS does not focus a button
  on tap at all, so there the field never blurs for one. A blur with
  `relatedTarget` `null` **is** the dismiss.
- ⚠⚠ **`open` — a ref saying, synchronously, whether the sheet is still open —
  and every exit returns on it.** Sharing one exit means every exit can now be
  reached twice in one gesture: a tap on the scrim blurs the field and *then*
  clicks the scrim, and `done` blurs a field whose `onBlur` is itself an exit.
  `writing` cannot arbitrate either — it is state, so both halves of the pair read
  the value they were rendered with. **Two exits in one tick is two captures**:
  `commit` mints a fresh client id each time, so §10's idempotency key protects a
  retry and does not protect this.
- ⚠ **`done` clears the latch on the line ABOVE its `blur()`, and the resume does
  too — for opposite reasons.** `done` so that its own blur cannot call it again;
  the resume so that its blur does **not** reach an exit, because the draft is
  deliberately kept across a resume and closing the sheet is not writing the line.
  Do not reorder either pair.
- ⚠ **Both doors into the sheet go through `raise`, which focuses the field and
  sets the latch in one act.** `startEdit` does not call `openSheet` — it has its
  own state to set — and it focused the field itself until now. **A door that
  raises the field without the latch opens a sheet no exit can close**: Return,
  the scrim and Done all return on their first line. The pencil had exactly that
  for ten minutes; the probe is what found it.
- **Measured by `node_modules/.probe/doneexit.mjs`**, at a 34px inset and at 0 —
  the home app and the handset browser. Done closes the row, leaves nothing
  focused and lands **exactly one** capture; the scrim lands one and not two;
  Return lands one; focus moving to a chip does not close the sheet; `Escape`
  still discards; an empty sheet still writes nothing; and the pencil's rewrite
  closes on Done, adds no row and keeps its new words.

⚠ **The foot receded while the sheet was up, and it does not any more — it
fades in place.** The rule it served is untouched: *none of the foot's three is
wanted while somebody writes*, and the `+` least of all, since it is a second
door to the thing already open. What went is the *movement* — the two were never
really sharing the bottom edge, they were two boxes on it, and they are one strip
now. See the one-strip entry above.

⚠ **The page has exactly one field and it is the pinned band.** It holds a new
capture, or the words of the line being rewritten. **Every instrument on that
screen is built on this** — the recede, the keyboard hem, the band's own
correction — and an `<input>` mounted in the record broke all three at once on 24
August. No line of the record is ever an input. ⚠ **Rewriting is the CONSOLE's
pencil since 30 August, and only that pencil** — it was the foot's until the foot
stopped carrying line-actions. One door, moved; not two.

⚠ **The paper does not start a capture.** It did for a day and that was removed:
the live line is pinned and always on screen, so a second way to reach it was a
second way to reach something already in reach. The paper's job is the *inverse*
of picking, and it must not raise the keyboard — picking blurs the field on
purpose. `Escape` does the same on the desk.

⚠ **`focused` is deleted from the capture page and nothing may add it back.**
Four features were keyed to focus and all four broke for one reason: the live
line carries `autoFocus`, so **focus is the resting state of that page, not an
event**. Everything reads `writing`, which is a gesture.

⚠ **The chrome recedes and returns on one duration and one curve** —
`--recede` at 340ms on `--ease-recede`. It was 240ms out against 340ms in, on a
desk argument that leaving must not hesitate; a handset judged the exit too quick
on 24 August, so the tokens **collapsed into one rather than being set equal**.
Re-splitting them needs a hardware reason, stated in the token. A mirrored exit
curve was built first and measured before it could ship — it covers 0% of the
travel by 80ms, which is the same hesitation from the other side.

⚠ **The four-second capture is closed at the user's direction (24 August) and
was never stopwatched.** *Accepted* and *measured* are different claims and only
the first is true. The register keeps the reasoning intact for whoever reopens it.

⚠ **The installed app used to never reload until it was force-quit, and since 25
August it re-enters on resume.** Becoming visible reloads the page, but **only
while it is settled** — no draft, nothing picked or being rewritten, no
photograph awaiting a caption, the undo window closed, *Earlier* unused, and no
line `pending` or `failed`. Somebody using the page is never settled, so it
cannot fire under their hands. Verified on a handset across all four cases.

The reason is not freshness. The client owns the list and the server is only the
seed, so a document that resumes for days shows a record that is **silently
short** — you check it, fail to find something you wrote on another device, and
write it twice. `router.refresh()` cannot fix that: it hands down a new seed
that the mount-time `useState` initialiser ignores, and making it work means
teaching the page to merge two lists. A re-entry re-seeds instead, so there is
still exactly one list and nothing to reconcile.

⚠ **AND ONLY WHILE THE PAGE IS AT THE TOP — 30 August.** Reported from the
installed app: scroll down until the bars recede, background it, come back, and
**the bars drop and then recede again**. They do, and no amount of work on the
chrome could stop it.

- **The flash IS the reload.** The browser restores the scroll before the first
  frame — measured, `y=900` on the very frame the bar exists — but the server
  cannot know the reader is 900px down, so the document arrives with the bars in
  it. Measured on a 390 handset: **257ms of bars fully down** while it hydrates,
  then the 340ms recede, still travelling at 452ms.
  `node_modules/.probe/resumechrome.mjs`.
- ⚠ **So the licence had a condition in it, and the condition is now in the
  gate.** The re-entry was affordable because *the page comes back in its resting
  state and loses no position* — which is false of somebody reading the past. **A
  scrolled page does not re-enter.** Removing the condition rather than
  correcting the symptom, in the order *How things get fixed* asks for.
- ⚠ **What it costs, stated: a reader who leaves the app scrolled down gets no
  re-seed on that resume.** The record is newest-first, so what a re-seed brings
  is at the **top** — off the screen of the one person this withholds it from —
  and the next resume at the top does it. **Silently short is still the harm to
  beat**, so where this cannot tell, it re-enters: no mark means no measurement,
  and no measurement takes the old path exactly as before.
- ⚠ **Measured off the mark, never off `window.scrollY`.** In a Safari tab the
  address bar collapses and `scrollY` moves backwards while the page is still
  going down — `chrome-recede.ts` learned that expensively. The gate reads the
  same mark the chrome reads, so the two can never disagree about whether the
  page is at the top.
- ⚠ **Do not answer this inside `useChromeRecede` instead.** `atTop` starts
  `true` on the premise that *the page opens at the top*, and a scroll-restoring
  load breaks it — but an initial measurement there fixes nothing, because the
  **server's HTML is painted before any effect of ours runs**. The bars are on
  the glass whatever that value says. What stays reachable is a manual reload of
  a scrolled tab, where what is seen is the browser's own restore.
- **Asserted by the same probe** — a scrolled resume keeps the token, the scroll
  and the bars all three; a resume at the top still mints a new document and
  arrives with the bars where they were; and a draft still holds it off.

⚠ **This does not cover two screens open at once** — nothing became hidden, so
nothing becomes visible. Closing that costs a real merge, and a timer is not the
cheap version of it: a clock fires while somebody is looking, and re-entry is
precisely what must never happen to a page in somebody's hands.

⚠ **Read `docs/re-direction/phase-1-capture.md` before touching Phase 1.** Its
*Build status* section is the register: what is built, what is still to build in
the order it wants doing, and what hardware has and has not answered.

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
- ⚠ **SEVEN notification kinds since 4 September, and that is the complete set.**
  It said six. `track_request` is the seventh and the first that is **not about a
  convergence** — Amendment 3 to the implementation specification, and
  `docs/re-direction/the-handshake.md` for why it earned the exception. No
  digests, no streaks, no re-engagement; the bar for an eighth is unchanged.
- ⚠ **A request is the one notification `lib/overlap.ts` does not write**, and
  the single-owner rule is not broken: that rule owns everything about a
  **match**, and a request has no possibility, no intent pair and nothing to
  suppress. **The sentence is still `portalSentence`'s**, beside the six it must
  not drift from.

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

⚠⚠ **THERE IS NO SCROLLBAR ON THIS PAGE — directed 30 August, and it OVERRIDES a
rule this repository used to state.** Reported as *the side scroll bar*; the
answer asked for was that it go, not that it be restyled.

- **It was a LIGHT bar on a black page, and the cause was a missing fact rather
  than a missing style.** `color-scheme` computed `normal`, which tells the engine
  *use the light widgets* whatever colour the page paints itself.
  **`color-scheme: dark` stays** even now the bar is gone — it also owns the
  caret, the selection and the form controls, and it is what stops a hidden bar
  from being a light one the day something else scrolls.
- **`scrollbar-width: none` and `::-webkit-scrollbar` are both needed**, and
  neither is a browser sniff: each is the property its own engine reads.
- ⚠ **The `scrollbar-none` utility is DELETED into the `html` rule.** Its docblock
  said *do not reach for this anywhere content is primarily navigated by
  scrolling — the lists — where the bar is the only thing saying how much is
  left*. That rule was argued directly and overridden; **the cost is stated in
  the code and stands**: the record gives no sign of its length or where you are
  in it. ⚠ **That cost is now partly paid: the fade at the foot is built** — see
  below. It says *there is more below*; **how much** and **where you are** are
  still not said by anything, and the bar is still not the way to say them.
- ⚠ **Desk-only, and it hands 15px of window back.** Measured 15px at 1000, 1152
  and 1440. Scrolling itself is untouched on every surface.
- ⚠⚠ **THE HANDSET STILL SHOWS AN INDICATOR AND CSS CANNOT REACH IT.** iOS draws
  the *main document's* indicator with the native scroll view; `scrollbar-width`
  and `::-webkit-scrollbar` reach scrollable **elements** on iOS, never the page.
  ⚠ **The 0px measured at 390 was not evidence of no bar** — `innerWidth −
  clientWidth` is layout width taken, which is zero for every *overlay* bar drawn
  or not, so the number could not tell the two states apart. Removing it means
  moving the scroll off the document, which four instruments read. **Left alone
  at the user's direction.**
- ⚠⚠ **THE FADE AT THE RECORD'S FOOT IS BUILT, AND IT IS ON EVERY SURFACE — 30
  August.** A gradient one line of the record tall, hanging off the top edge of
  the writing strip: a line dissolves over its own height as it leaves the page,
  which is *there is more below* said without an indicator. **Do not answer any
  of this by putting a scrollbar back.**
  - ⚠ **It hangs off the STRIP, and that is what makes it right in every state
    with no token and no override.** `bottom: 100%` on `writing-sheet::before`.
    The strip is already in the right place on all four surfaces — on the glass
    on a handset, translated off it when the chrome recedes *and* whenever the
    desk is idle, riding `--keyboard-overlap` while somebody writes — so the
    fade's foot is the bottom of the visible record wherever that is. Measured
    at a 0px and a 34px inset: the strip 54px and 75px, the fade's foot on both.
  - ⚠ **Height is `--leading-line`, one line** — the swipe detent's derivation
    (*measure the thing being acted on*), so the desk gets 37.33 against the
    handset's 28 from one declaration.
  - ⚠ **It hides at the end BY CONSTRUCTION**, which is why it is a gradient and
    not an instrument: the ramp ends on `--color-bg`, so over an empty foot it is
    the ground on the ground. **No observer, no state, and deliberately no second
    reader of `endMark`.**
  - ⚠ **It ends on the ground and not on `--glass-tint`** because the state it
    exists for is the receded one, where there is no glass under it. The price is
    a small step at the strip's top edge when the strip *is* there — fully sunk
    against the 26% the glass lets through. If that reads badly the answer is
    `--glass-tint` here and a fade of its own on the desk, not a number between.
  - **Measured by `node_modules/.probe/recordfade.mjs`** (29 assertions);
    `fadelook.mjs` renders the before/after, switching the pseudo-element off
    through the CSSOM because the nonce CSP refuses an injected `<style>`.
- ⚠ **It SIMPLIFIES the type ramp rather than threatening it.** `100vw` counts a
  classic bar and `clientWidth` does not; with no bar they are one number, so the
  mismatch `threshold.mjs` was written around is gone. That probe now proves the
  browser *could* draw a bar — on a blank page, since ours can no longer answer
  for it — and that ours draws none. `markgap.mjs`, `logocol.mjs` and `scale.mjs`
  confirm the column, the mark's band and the stack all followed the 15px.

⚠ **THE DESK'S GROUND IS NOT BLACK — 30 August, and the sentence above is the
handset's now.** Directed: *the desktop version is too oppressive because of its
darkness; it needs an aesthetic related to the handset versions but different.*
`--color-bg` is **`#14140f`** above `--breakpoint-stack`, a warm charcoal at the
hue the palette already runs warm at. Nothing is inverted, nothing moves, no type
changes: the page reads as a dark **surface** rather than an absence, which is
what a full-bleed true black does wrong at 27 inches — it is a hole, and a hole is
what *oppressive* describes.

- ⚠ **Two lighter candidates were rendered on the real page and refused, and that
  is a record rather than a ladder.** **Paper** — the palette inverted, the
  handset's aged-paper ink as the ground with warm near-black text and the brass
  darkened to 4.62:1 — and **newsprint**, the same onto a manila ground.
  Reopening either means re-picking the brass, the lacquer red and the tool
  stack's glass edge, all of which they measured out.
  `node_modules/.probe/deskpalette.mjs` renders all three.
- ⚠ **The handset is untouched by construction, not by care.** Everything is
  inside the desk's own query, so there is no second palette and nothing to keep
  in step. Asserted at 390: ground `#000000`, hairline `#30302b`, surface
  `#20201d`, brass `#e8b34a`, all byte-identical.
- ⚠ **`themeColor` and the manifest stay `#000000`, deliberately.** They paint the
  installed app's splash and the system furniture around it, and **the installed
  app is the handset**. A desk ground in the phone's status bar would be this
  override reaching the one surface it was told not to.
- **Almost nothing needed a value, and that is the palette paying off.**
  `--color-muted`, `--glass-tint`, `--sheet-tint` and `--scrim-tint` are all
  `color-mix`es of the ground or the ink, so both bars' glass, the writing strip
  and the scrim over the record re-ground themselves from one line. Nothing was
  touched per component.
- ⚠ **The two that did need one are mixes of the desk's ground, not typed hexes**,
  and they hold **the ratio** rather than the pigment: the hairline is the ink at
  17.5% (`#393933`, **1.59:1**, against the base's 1.583 on black) and the card
  surface at 10.5% (`#2a2a24`, **1.28:1**, against 1.286). A fixed hex would have
  kept its ink and lost its job — the same rule on a ground 8% off the floor reads
  as drawn heavier than the one on the phone. Move `--color-bg` again and both
  follow.
- ⚠ **The boundary is the LAYOUT's, not the type ramp's.** It could have started
  at 57.207rem so scale and colour arrive together; it starts at 72rem, where the
  foot bar becomes a tool stack and the app genuinely stops being a handset, and
  where the desk already has exactly one block of overrides. **What it costs:
  915–1152px is part-grown type on the handset's black ground** — the iPad-
  landscape band this file already flags as never having been on hardware. One
  query to move if it reads badly there.
- **Measured, black → charcoal:** text 16.83 → **14.81**, chrome 10.98 → **9.66**
  (past 4.5 for the mark, which is text), the lacquer red 4.26 → **3.75** and the
  live red 5.92 → **5.21** (both past the 3:1 WCAG 1.4.11 asks of a graphical
  control), the listed green 15.69 → **13.80**. Every floor in the palette's notes
  still holds. ⚠ **The lacquer red is the tightest and is the first thing to
  re-measure if the ground is lifted again.**
- **It also answers the OLED note in `--color-bg` for free, on one surface.** That
  comment names a step toward `#08080a` if black smear ever shows on a fast
  scroll; this takes the same ladder further, for a different reason, and leaves
  the question open where it actually applies.
- **Asserted by `node_modules/.probe/deskground.mjs`** — the desk's ground, both
  derived mixes and their ratios, the glass following, the handset unchanged, and
  the boundary walked at 1152 / 1151 / 1000 / 720.


**Amber (`--color-accent`) marks overlap state and nothing else.** Not on
buttons, not on links, not on the active tab. It stops meaning anything the
second it is used for decoration.

⚠ **Phase 1's capture page broke this, and on 23 August it stopped.** The chrome
— bar, foot, caret, and the mark on a picked line — spent `--color-accent` for a
day. It now has `--color-chrome`, lit brass at `#e8b34a`: the same hue carried up
in lightness and chroma, 10.98:1 on black against the muted brass’s 7.73:1.
**`--color-accent` was then used by nothing**, which is what this rule always
asked of it. The collision was removed rather than corrected for — see *How
things get fixed*.

⚠ **And on 31 August it is used, by one thing: the convergence mark in the
record's gutter.** Eight days reserved and unspent, then spent on exactly what it
was reserved for. **`--color-accent` now means *this line converged* and nothing
else** — the scarcity rule is unchanged, it simply has a tenant.

`--color-chrome` inherits the same scarcity rule from the other side: it means
**a control**, never a state. The moment it appears on something that is not
chrome, the chrome stops being chrome and the page loses the only colour a thumb
can aim at. Everything else on the page is `--color-text` or a fade of it.

⚠ **Colour-coding entries by their type was raised on 28 August** — films red,
sporting events green, or whatever. **Unbuilt and undecided**, and it is written
up in `docs/decisions.md` rather than here because it is a product question with
an engineering cost: it would be a **third** colour system on the largest surface
of the screen, it should be picked *after* overlap's colour rather than before,
and its harder half is that **a capture has no kind at the moment it is written**
— so a kind-colour may really be carrying *resolution*, which the page currently
cannot show at all. Read that entry before drawing a palette.

⚠ **This said overlap still needed a colour and that picking it was Phase 2's
first visual decision. ANSWERED 31 August, and the answer was the token that was
already there.** The worry it recorded — that the accent would have to out-shout
a louder chrome — **turned out not to apply, because the two never appear in the
same place**: `--color-chrome` is a *control* and lives in the bars, the foot and
the caret; `--color-accent` is a *state* and lives in the gutter, where no
control ever goes. The instruction *do not pick it before there is a convergence
to look at* is what made that visible: the portal put one on screen first.
Measured **6.77:1** on the desk's charcoal and **7.70:1** on true black.

⚠ `--color-caret` is deleted, by its own terms: a third meaningful colour was
only defensible for a claim the other two could not make, and with a coloured
chrome the caret is the chrome.

⚠ **The desk is the same design, four-thirds the size — 28 August.** Directed:
*an overall aesthetic redesign for the desktop; make the text bigger, in your
face — and adjust everything as a whole so it stays in keeping.*

**Nothing was re-picked.** Every token in `globals.css` is a `rem`, so the whole
design is scaled by one declaration on `html`. The record goes 18/28 → 24/37.33
in a column that goes 680 → 906.67px; the strip goes 44 → 58.67; the wordmark
24 → 32; the glyphs, gutters, bars, stack and caret all follow **in exact
proportion**. The desk is not a second design to keep in step with the first, and
it cannot drift, because there is nothing to drift from.

⚠ **That declaration is a RAMP and was a step for a few hours — 28 August.** It
is `clamp(100%, calc(100% + (100vw − 57.207rem) × 0.0225339), 133.3333%)` inside
`@media (min-width: 57.207rem)`: the root grows from the reader's own size at
915px to 4/3 of it at 1152px, and is pinned at both ends. **At and above
`--breakpoint-stack` the scale is at its maximum, so every number below is
untouched** — 72rem is still 54rem measured at the desk's rem. Below 915px
nothing changes at all.

- ⚠ **`133.3333%`, never a `px` or a fixed `rem`.** A percentage is relative to
  the size the *browser* was told to use, so a reader who set 20px gets 26.67
  rather than being overridden back to ours. A `rem` fixed at ours would ignore
  that preference exactly as a px would.
- ⚠ **The ramp's two ends ARE `rem`, and that is not a contradiction.** The
  initial value of `font-size` is `medium`, which **is** the reader's default —
  so a `rem` measuring the *window* is their size, not ours, and it is the same
  figure a media query uses. Only the slope, 0.0225339, is unitless.
- ⚠ **A media query's `rem` is the initial font size, never the root's** — which
  is the only reason this is expressible. The query stays anchored while
  everything it gates grows, so there is no feedback loop. The scale **ends** on
  `--breakpoint-stack`, so the desk's type and the desk's layout arrive on the
  same pixel and the sum that breakpoint claims stays true.
- ⚠ **57.207rem is derived, not chosen: it is where the record first has its
  whole `--page-measure`** — `--page-measure + 2 × --mark-column`. Below it the
  column is still giving width up to the mark's band, and type growing into a
  column that has not finished arriving is type growing against the measure. The
  ramp starts where the record is whole. ⚠ **That number used to carry a second
  job and stopped on 29 August**: `--record-measure`'s clamp shared this media
  query because 57.207rem is also where *it* is a no-op. The clamp is
  unconditional now, so there is nothing left to switch on — **the number is
  unchanged and still the same sum**. There is deliberately **no
  `--breakpoint-scale` token**: `@theme` prunes what no class uses, and neither a
  media query nor the root's own `font-size` can resolve a `var()` anyway.
- ⚠ **`--breakpoint-stack` moved 54rem → 72rem and the sum did not change.** It
  is still `--page-measure + 2 × (--stack-width + --stack-inset)` = 54rem,
  measured at a bigger rem. `--breakpoint-pane` moved 74.6667 → 99.5556rem by the
  same 4/3, for the same reason — it exists to keep the film screen's `+` on
  screen, and the disc grew.
- ⚠ **What must NOT scale, and does not:** `--tap-floor` (44px — a thumb, not a
  type size), `env(safe-area-inset-*)`, `--keyboard-overlap`, and
  `input-text`'s coarse `16px` (the iOS focus-zoom threshold). **Hardware does
  not get bigger because a window did.** Two px type values were converted so
  they would not be left behind — `body`'s 15px and `input-text`'s fine 13px. A
  third would silently stay small; there should not be a third.
- **Below 915px no TYPE moves at all.** Verified at 390, 864 and 915: root 16px,
  18/28, 44px rows — and mid-ramp at 1034 every proportion holds, root 18.67,
  line 21.01 on 32.68, rows 51, mark 28.01. `node_modules/.probe/scale.mjs`.
  ⚠ **1151 used to carry that claim and cannot any more**; it is inside the
  scale now. ⚠ **The word TYPE became load bearing on 29 August** — the sentence
  said *nothing moves* and named a 680px column, and the column moves below 915
  since the record's clamp was ungated. 864 now reads 629. Nothing about the
  scale changed; the claim was always about proportion and had a width in it.

⚠ **The column and the mark jumped backwards at the desk threshold, and that is
fixed — reported and closed 28 August.** Narrowing the window moved the record
column left continuously from 1440 to 1152, then **leapt 78.6px to the right** in
one pixel while the mark jumped the other way and shrank. The cause was the step
above: every rem in the app snapping by 0.75 at once, which is the strength of
one-number scaling turned into a violent boundary. ⚠ **The two clamps below were
not the cause** — the walk showed both handovers continuous. **The fix was to
remove the mechanism, not correct for it:** the number stopped jumping.

- **Measured after, by `node_modules/.probe/threshold.mjs`** — 34 widths from
  1440 to 390 with no reversal, 156.9 → 156.7 across 1152 where the leap was.
  It also asserts the two literals against the fence they are derived from, reads
  them out of the **shipped** stylesheet because the build rewrites the
  expression, and checks zoom at 50 / 100 / 200%.
- ⚠ **The scrollbar check needs its own browser and fails if it gets no
  scrollbar.** Headless Chromium passes `--hide-scrollbars`, so a 0px bar cannot
  tell a stable `100vw` from an oscillating one. With a real 15px bar, `100vw` is
  `innerWidth` either way and the root does not move.
- ⚠ **A residual jump was reported and then withdrawn — it was a stale build.**
  The fix was on the branch only when it was looked at, so production still had
  the original reversal. ⚠ **Establish which build is on screen before measuring**
  — two rounds of measurement went into a page that did not have the fix on it.
  One measured fact survives and nobody has complained about it: at 1152 the
  strip does not resize, it **leaves** — `stripTop` +58.56, `stripHeight` +10.74,
  `colPadBottom` +5.39, and the tool stack arriving, all on one pixel.
  `node_modules/.probe/stillsteps.mjs` walks it. Leave it until somebody says it
  reads badly.
- ⚠ **915–1152 is a layout nobody had seen and it has not been on hardware** —
  desk type part-grown, the record narrowed by the mark's band, the foot's glyph
  strip still under it. An iPad in landscape lands in it.
  `node_modules/.probe/scale-ramp-1034.png`.

⚠ **The mark holds a column on the desk, and nothing may cross into it — 28
August.** Directed: *the entries column may never overlap the logo's column, and
the vertical glyphs may never go past that column's midpoint.* The mark is
anchored to the bar's left gutter, so its band is fixed at every desk width —
43 → 157px, midpoint 100.

- **`--record-measure`** is `--page-measure`, or the space between the band and
  its mirror on the right, whichever is smaller. The column **narrows rather than
  shifting**: nudged right it would be off-centre against the bar's right-hand
  glyphs and the writing strip, which are centred on the window. 838px at 1152,
  full 906.67 by 1221. ⚠ **It is unconditional since 29 August, floored at
  `--record-floor`, and the rule holds from 773px up.** Reported: narrow the
  window past the point where the type stops shrinking and the column comes
  unstuck from the mark and dives under it. It did — the clamp lived inside the
  ramp's media query, and 57.207rem is *by construction* the width at which that
  clamp is a no-op, so the rule was gated on the one width where it stopped
  costing nothing. Welded to the mark from 1221 down, off at 915, 8px under the
  letters by 900 and 98px under by 720. **The gate was removed rather than
  moved** — a clamp right at every width does not need one, and with nothing to
  switch on there is nothing to jump.
- ⚠ **`--record-floor` = 33.5775rem = 537.24px, and it is the LOWEST floor that
  stays continuous.** The mark steps down at `--breakpoint-rail` — `--text-mark`
  1.5→1.25rem, `--bar-gutter` 2→1.25rem — so its band steps 7.3535→5.71125rem in
  one pixel, and a column derived from the band alone would step **up 51px at
  719**: the same violent boundary the desk's ramp exists to remove, moved to a
  narrower window. The floor is the measure the *narrower* band hands back at the
  breakpoint itself — `--breakpoint-rail − 2 × (1.25rem + 1.25rem × 3.569)` — so
  the step is under it on both sides of 720 and can never surface. Any lower
  floor brings the step back; any higher one protects the mark for less of the
  range. ⚠ **The two `1.25rem` are written out, not `var()`d** — a `var()` picks
  up the rail's override and derives the floor from the wrong band.
- **What it costs, stated:** below 772.55px the column stops giving up width and
  starts sliding under the mark again, from zero, continuously. Between 773 and
  537 the record is a fixed 537px measure rather than growing back to 680 — about
  60 characters at 18px, a better measure than the full 680 and, more to the
  point, a **stable** one across that whole band. ⚠ **Below 537px nothing
  changed**: the window is narrower than the floor, so `w-full` wins and the
  handset is exactly what it was. Verified at 390, 393, 430 and 500.
- **Measured by `node_modules/.probe/markgap.mjs`** — 44 widths from 1440 to 390,
  the floor recomputed from the live below-rail tokens, no reversal anywhere, the
  band held from the derived handover up, and nothing stepping at the rail.
  `logocol.mjs` walks from 773 instead of 916 and asserts both of the mark's
  rules there.
- **The stack's `left` has a floor, and it is CENTRED on the mark's midpoint
  there** — the floor is that midpoint plus **half** its own width. It sits a
  fixed 96px left of the column, so it tracked the column outward: 91 against a
  midpoint of 100 at 1280. ⚠ **The half is the correction, and it was directed.**
  With the whole width the stack's *left edge* landed on the midpoint, which put
  the glyph drawings 12px to the right of it — the box was on the midpoint and
  the marks were not. Half puts the box's centre there, and the glyphs are
  centred in the box, so what sits on the midpoint is the drawing. It also moves
  the handover to **1240px**, where the two terms are equal: at the width the
  clamp engages the glyphs are exactly on the midpoint and nothing jumps.
- ⚠ **Clamped, not answered with a breakpoint.** Raising `--breakpoint-stack` to
  1299px was the one-number fix and was rejected *with the cost stated*: the type
  scale is tied to that breakpoint, so every window under 1299 — 1280×800
  laptops included — would have lost the desk layout and the larger type. These
  hold at every width, and above ~1300px change nothing.
- ⚠ **`--wordmark-advance-ratio` is the seventh number in the face fence and the
  first horizontal one.** How wide AGAIN sets per 1px of font-size, measured at
  four sizes to prove it is a ratio: 3.569 in Jost, 2.8875 in the Bebas reserve.
  The band is derived from it, so it follows the mark's size, its tracking and
  the desk's root scale for free. `node_modules/.probe/markwidth.mjs`;
  `logocol.mjs` checks both rules across twelve widths from 915 up, and asserts
  rather than prints. It also treats a `display: none` stack as absent — below
  `--breakpoint-stack` it is in the DOM at 0×0 on the origin, which would fail
  the midpoint rule for a stack that is not on screen to break it.

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
