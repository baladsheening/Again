# The build log — 4 September and earlier

⚠⚠ **THIS IS PART OF `CLAUDE.md`, NOT A COMPANION TO IT.** It was split out on
6 September because `CLAUDE.md` had passed the 150,000-character limit the
harness loads and was being truncated — **a rule that is not loaded is not a
rule.** Nothing here is superseded, archived or downgraded by the move; every
entry is verbatim, in the order it was written, and **every ⚠ and ⚠⚠ in it
still binds.**

⚠ **Read this file before touching any of:** the row swipes and their detent,
haptics and `touch-action`; the console; the writing strip, the sheet, the
glass and the fade at the record's foot; `--keyboard-overlap`, the notch
arithmetic and `env(safe-area-inset-*)`; the one-line rule and the record row's
type; the desk's ink, ground and type ramp; the mark's column and the two
clamps; and the resume/re-entry gate.

⚠ **The single most expensive rule in here, repeated so it is not missed:**
never lift an expression containing `var(--keyboard-overlap)` — or any property
script writes onto an element — into `@theme`. A custom property's `var()` is
substituted where the property is **declared**, not where it is used, so a
token on `:root` freezes on the fallback. **A browser cannot see it**; only a
notched handset can.

⚠ **A SECOND CUT WAS MADE ON 11 SEPTEMBER, ON THE SAME RULE AND IN THE SAME
ORDER — oldest out, newest kept, nothing paraphrased.** `CLAUDE.md` had come
back to within 350 characters of the limit. The four entries below this note —
*a capture is shareable when it is written*, *the mark*, *the portal*, and the
correction about the engine having no reader — moved here from *Where the build
stands* and are dated 31 August and 30 August. **They are not superseded by the
move and every ⚠ in them still binds.**

⚠ **A THIRD CUT, THE SAME DAY AS THE SECOND — 11 September**, at the 4
September boundary: *adding somebody is a request they answer*, the handshake,
moved here when `CLAUDE.md` came back to within 3,500 characters of the limit.
**Not superseded by the move; every ⚠ in it still binds, and the requests it
describes are built and deployed.**

The newer entries — 5 September onward — stay in `CLAUDE.md` under *Where the
build stands*.

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
- ⚠⚠ **A DECLINE LEAVES A STRUCK LINE IN THE OPEN CARD, AND IT IS A WINDOW
  RATHER THAN A RECORD — 4 September.** *Decline* is a plain word one tap from
  *Accept* with no confirmation, and **the request line is the only place
  `@handle` ever appears for a non-mutual** — so a mis-tap destroyed the only
  copy of it, unrecoverably, on both sides at once. The sentence stays struck
  with **Add** beside it until the card closes. ⚠ **Nothing is written and
  nothing is read back**: `declineTrack` is untouched, `DeclinedRequest` lives in
  the client, and a residue that outlived the card would be the list of people
  you turned down. ⚠ **`Add` is not an undo** — their row is gone and putting it
  back would mean writing another person's statement; it asks them, through the
  same `trackAction`, and the line then reads *Requested*. ⚠ **The
  strike-through IS the word**, so `portalSentence` is still the only author —
  `@sam — declined.` would be a second composition and reads ambiguously
  besides; the word is spoken to a screen reader, which cannot see a strike.
  ⚠ **So a decline does not close the card** where accepting the last row does:
  *an empty card closes* is about a card with **nothing** in it, and closing over
  the struck line would destroy the handle at the moment it exists to keep. The
  door goes dark above it, which is right — nobody is waiting on you any more.
- ⚠ **`declineTrack`'s claim that a decline is *indistinguishable* from an
  unanswered request on the asker's side was only ever true of the BUTTON, and
  is corrected in both places.** People reads `listMyTracks`, so unanswered is a
  row tagged *Requested* and declined is **no row at all** — the fact leaks as an
  absence while the word is withheld. Left that way deliberately: telling them
  costs an eighth notification kind (a rejection with a timestamp) or a tombstone
  column, which is the pending machine §1 removed **and** would break re-asking,
  since `onConflictDoNothing` makes a second ask over a surviving row a silent
  no-op. **Re-asking is the recovery and it works.**
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
- ⚠⚠ **THE DOOR SAYS WHICH: A DOT ABOVE THE CIRCLES WHEN SOMEBODY IS WAITING ON
  YOU — directed 4 September.** One lit glyph stood for both kinds of row, which
  made a reader open the box to find out whether anybody was waiting on them.
  Three states, one drawing: circles off, circles lit, circles lit **with a dot**.
  ⚠ **Letters over the glyph (`C`, `R`, `C/R`) were built and looked at first and
  were a SMUDGE** — the counters collide with both circles' strokes at 26px; the
  direction had anticipated it and named the dot as the fallback. A `+` was ruled
  out before either: the capture control is a `+` two cells away and this app
  cannot afford two plus-shapes side by side on the one control it has to be
  perfect at.
- ⚠⚠ **THE DOT IS GREEN, AND IT IS THE ONLY THING IN THE BAR THAT IS NOT
  `currentColor`.** It is `--color-accept` — the colour of the *Accept* one tap
  behind it, so the mark on the door and the action behind it say one thing
  twice. ⚠ **A red one was raised for the convergence side and is refused**: red
  is *no*, and on a mark reporting an event nobody has to answer it reads as an
  alarm. **A convergence is not a problem.** ⚠ **And a convergence gets no dot at
  all** — its colour is `--color-accent`, which already means *this converged* on
  the line itself in the gutter, and a second tenant saying the same thing beside
  a control is what the one-tenant rule exists to prevent.
- ⚠⚠ **ANSWERING RE-READS THE PORTAL; IT DOES NOT PATCH THE ROW OUT LOCALLY.**
  Removing it from state was wrong in a way only *accepting* shows: **accepting
  runs the fan-out**, so the same tap can write convergences into the box being
  looked at, and a local patch left the door dark over rows it had just created.
  One read answers the rows, the door and the emptiness together. ⚠ **An empty
  card then CLOSES** — directed: a card standing with nothing in it is §5's
  *empty portal* reached from the other side, a surface you could not have
  opened.
- ⚠ **The lock's sentence — *swipe a line away and it stays out of matching* — is
  DELETED, 4 September, directed.** It fired at a record length of exactly one,
  which every existing account has passed forever. ⚠ **What it costs: nothing now
  teaches the lock swipe.** Judged affordable rather than free — locking is a rare
  verb and a person's *first* capture is not where a gesture they want months
  later is learnt. **If the lock proves undiscoverable, this is what was removed,
  and it should come back where a reader is actually looking.** It also said
  *matching*, which is not a word in §3's vocabulary.
- ⚠ **A margin that separates two things must belong to the thing that may not be
  there.** The request row wore `mb-4`; with no convergence under it the card
  measured 20px of air above the row and 36 below, so the one thing in the box
  sat 16px high in it. The gap is the heading's `mt-4` now, and the space
  *between* requests is a `gap` on their own container. Measured 20/20.
- ⚠ **The dot's clearance is measured against the INK, not the bounding box, and
  the first attempt got it wrong.** At the dot's x the two circles are crossing
  near their tops, so the ink is at y 4.09 rather than 4.25 — a dot ending at 4.1
  read as a **stem**. It is cy 1.75 r 1.15 now, 1.2 units clear. **Filled: the one
  filled shape in the eleven**, because a ring that size is a grey blur.
- ⚠ **Still not a count** — one dot however many people are asking, and
  `portal.mjs`'s no-digits assertion holds. ⚠⚠ **It is nonetheless the closest
  this app has come to a notification badge. If a second dot is ever proposed for
  a second kind of row, the answer is that the door has run out of what it can
  say and the surface behind it is where the distinction belongs.**
- ⚠ **The door has three accessible names** — *Who else*, *Requests*, *Requests,
  and who else* — because a dot is meaningless to a reader who cannot see it. **A
  probe pinned to one of those strings reports a missing door** the first time the
  account under test holds the other kind of row; both probes match the control
  by prefix, and `seed-request.mjs` empties the account's other unread rows so
  *a request alone* is a state the probe can actually reach.
- ⚠⚠ **ACCEPT IS GREEN AND DECLINE IS RED — directed, and they are the FIRST
  COLOURED CONTROLS IN THIS APP.** §11 gives every other control `--color-text`
  or a fade of it and reserves `--color-accent` for a state. `--color-accept`
  `#4f9860` and `--color-decline` `#cf5a4c` are the palette's own values
  re-pitched — the lacquer red opened up because `#c1483c` measures 4.31:1 and
  fails AA at 18px, and the green's own recorded ladder-back rather than
  `--color-listed`'s neon, which was chosen to be *the loudest mark in the app*.
  **5.95 and 5.25 on true black; 5.2 and 4.6 on the desk's charcoal.** ⚠ **The
  scarcity rule binds them from day one: the moment green appears on a second
  affirmative or red on a second dismissal, both stop meaning anything — and
  neither is the error colour**, which `docs/decisions.md` has refused twice.
- ⚠ **The handle is full ink, the rest of the sentence muted** — a request is
  about a person. It is a **split of the one authored string** at the handle's own
  length, never a second composition: `portalSentence` stays the only author.
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
**What is still not built:** no QR handshake, no push delivery, and **the words**
— see below. ⚠ **The convergence mark was in this list until 31 August and is
built** — see Phase 2 step 4 above.

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
