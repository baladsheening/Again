# Phase 2 — the console, the portal, and what a convergence looks like

⚠⚠ **THIS DOCUMENT IS A DESIGN BRIEF, NOT A REGISTER. IT IS MEANT TO DIE.**
Once a section here is built, do one of three things with it and do not leave it
standing as if it were still a plan:

1. **delete the section**, and let the code comments and `CLAUDE.md` carry the
   argument — that is where engineering rules live;
2. or **mark it built** in the status table below and strike the section, if the
   reasoning is worth keeping while the rest of the phase is still open;
3. or, when the whole phase is done, **move this file to
   `docs/re-direction/inactive/`** rather than leaving it beside the live briefs.

A design document that outlives its build is the same failure as a register that
records what state production is in: it reads as current, it is not, and the
next person believes it. See the account under *Build status* in
`phase-1-capture.md`, which cost about eighteen hours of 500s.

**What owns what.** §13 of `implementation-spec.md` owns Phase 2's deliverables
and exit criteria and is normative. This document owns only the *design* — the
shape of the screens and the reasoning behind it — recorded on 30 August from a
conversation with the product owner. Where the two disagree, the specification
wins and this file is wrong.

---

## Status

| | |
|---|---|
| The console | **BUILT — 30 August.** §1 is deleted below; the code and its argument are `components/console.tsx` and `console-sheet` in `globals.css` |
| The swipe carries the LOCK; crossing off is the console's | **BUILT — 31 August, directed.** `SwipeWay` is `'lock' | 'unlock'`; the mechanism, detent and signs are untouched. *Fifty times a week* was an assumption about cross-off and was corrected by use. A padlock in the row's tail is the gesture's only confirmation — iOS has no haptics |
| Captures are shareable on write; a lock takes one out of the pool | **BUILT — 31 August, directed**, overruling the specification's private-by-default. A copied or transferred capture stays private. Without it the whole social half was inert |
| ~~Swipe to cross off, swipe back to undo~~ — **SUPERSEDED 31 August by the row above**; every mechanical argument in §3 and §3b still governs, only the verb changed | **BUILT — 30 August, reopened and rebuilt the same day.** §3 and §3b both struck. ⚠ **Settling is NOT a swipe**: the row carries the one resolution that is its own inverse, and the console keeps the question that has two answers |
| Haptic vocabulary | **BUILT, and dead on iOS.** Three patterns in `lib/haptics.ts`, Android only. The native-shell note is in `docs/decisions.md` |
| The notification portal | **built, 30 August** — door in the FOOT, against §2 |
| The convergence mark on a line | **BUILT — 31 August.** `--color-accent` in the gutter, on every line that has ever converged, and it **does not empty**. §5's mark sub-section is struck. The code is the `converged` utility in `globals.css`, `converged` in `lib/db/captures.ts` and `getConvergence` beside the portal's read |
| A capture converges on its WORDS | ⚠⚠ **DIRECTED 5 September, NOT BUILT.** `possibility_id` and `intent` stop being conditions of a match; two captures agree on the same possibility **or on identical `normalised_text`**. **Amendment 4** to the specification is normative; §9b below carries the failure it answers |
| Push delivery | ⚠ **NOT BUILT, and it is half of the directed loop.** *Goes about their day* means reaching somebody who is not in the app. No service worker, no subscription record, no worker; the VAPID keys in `lib/env.ts` are still optional |
| ⚠ The record moves to its own surface | **DIRECTED 5 September, NOT BUILT** — Amendment 5. The console, the lock swipe, the mark, the fade and the portal's render prop **travel with it and none is rewritten**; only the route changes. `docs/re-direction/the-front-page.md`. ⚠ The foot returns to three columns and **the `+` goes away**, so the portal door's placement — granted the foot against §2 partly because column one was empty — wants re-reading rather than inheriting |
| Conversations in the console | **deliberately not designed** — see *Held back* |
| Non-friend listers | **deliberately not designed** — see *Held back* |

⚠ **The open question in §7 is answered: the console exists on BOTH surfaces and
they are genuinely different.** Directed 30 August — below `--breakpoint-stack` a
fixed rectangle over a blurred record; at and above it the console **expands the
row in place**, with no scrim and no floating box. A handset has no room to show a
capture where it lives; a desk has the width and already stands its tools beside
the column, so a takeover up there buys nothing and costs the reader their place.
One component, one mount point, the stylesheet deciding — `console-sheet` is
`fixed` on one and `static` on the other.

⚠ **Three things were decided in the building that this document did not say, and
all three are recorded in the code:**

1. **Settle moved onto the console** with `×` and `✎`. §1 names only those two,
   and with the pick gone settle had no door left until the swipes land.
   `foot.tsx` had predicted the move in writing. **The foot is now `+` and
   search**, which is where §3 has it ending up anyway.
2. **The console clears the bar and the strip by `--tap-floor`, not by the page's
   lead.** The paper is the only exit on a handset, so the paper has to be a
   target; 20px bands were not.
3. **Its ground lifts toward `--color-surface` rather than sinking toward the
   page.** The strip's glass recipe made the card *invisible* on a true-black
   page — a floating card has no borrowed edge, and the record behind it is
   already darkened by the scrim.

**Measured by `node_modules/.probe/console.mjs`** — 33 assertions on a 390
handset and 21 on a 1440 desk, including the one that matters most: the same
rectangle whichever line was tapped.

---

## What this inherits

⚠ **This paragraph said the engine was deployed and unread, and it is corrected
rather than deleted — 31 August.** `tracks` with mutuality, `lib/overlap.ts` as
the one matching owner on both triggers, the suppression rule, and
`notifications` rows written in the same transaction as the write that caused
them — all of it runs, and **two surfaces read it now**: the portal since 30
August, the mark since 31. The fan-out is proved end to end with two accounts —
`tests/portal.test.ts` and `tests/mark.test.ts`. What every section below was
designed against is therefore built rather than pending; the sentence is kept
because it is what §5's whole division was answering.

⚠ **Overlap joins on `possibility_id`, so only *resolved* captures can
converge** — and TMDB is the only catalogue. Today two people can converge on a
film and on nothing else. Everything below is designed against that limit and
gets wider for free when Phase 4 lands a contributed catalogue.

---

## ~~1. The console~~ — BUILT, 30 August, and this section is deleted

**The design that was here is now the thing itself.** Every argument it made —
the fixed rectangle and why growing from the tapped line is wrong, the edge
grammar, no outline, read from the top and act at the bottom, one exit gesture,
`✎` handing the words to the strip rather than opening a second field, and
rendering instantly with the space for *who else* left empty — is carried
verbatim in the docblocks of `components/console.tsx` and in `console-sheet`,
`console-card`, `--console-tint` and `--console-top` in `app/globals.css`, beside
the code each one governs.

⚠ **Deleted rather than struck, which is this file's own first option.** *Let the
code comments and `CLAUDE.md` carry the argument — that is where engineering
rules live.* A design section left standing after its build reads as current and
is not.

What the build added that the design did not have is in *Status* above: settle
moving onto the console, the `--tap-floor` clearance, and the ground that lifts
rather than sinks.

---

## 2. The law that falls out of it

> **The bottom edge is for what you do without looking. The top edge is for what
> you go to on purpose. The record is what is in between.**

It explains the layout that already exists — the `+` bottom-centre, the wordmark
and profile at the top — and it decides where every future thing goes without
reopening the argument. It is also why the notification portal goes at the
**top**: it is visited once, deliberately, at the start of a session, and must
never be given a reflex's real estate.

---

## ~~3. Tap thinks, swipe does~~ — BUILT, 30 August, and this section is deleted

**A row swipes one way and back the other, and a tap still opens the console.**
The argument that was here is carried in `components/row-swipe.ts` and in the
`touch-action` note on `page-row` in `globals.css`, beside the code each governs.

⚠ **This section shipped a settle swipe and §3b took it away the same day** —
what is built is below. Two things decided in the first building survive it
unchanged, and are recorded in `docs/decisions.md`, *Tap thinks, swipe does*:

1. ⚠ **The threshold is the row's own height, read off the row**, so a handset
   and a desk are both right by derivation: 44 and 58.67 from one line with no
   breakpoint in it. It clamps there, which makes it a **detent** rather than a
   threshold to guess at.
2. ⚠ **Physical, not logical.** Away from the reader crosses off, against the
   screen rather than the writing direction — a *row* has no `dir="auto"` signal
   and a record can hold both languages at once. Held deliberately until there is
   somebody reading the record right-to-left to ask.

**Both things this section asked to be checked were checked.** The record's row
is `--tap-floor` tall and `--tap-floor` is 44px and does not scale; and a
horizontal swipe cannot be read as a scroll, because `touch-action: pan-y` hands
the vertical axis to the browser's own gesture recogniser before an event reaches
this app. `node_modules/.probe/swipe.mjs` asserts both, with real CDP touch
events.

---


---

## ~~3b. The swipes are reopened~~ — BUILT, 30 August, by SUBTRACTION

**Directed after use: settling must cost one beat, and both directions must
afford an undo.** What was built is **one swipe, not two**:

> **Away from the reader crosses a line off. Back toward the reader puts it
> back. Settling is the console's, and has no gesture.**

**The demand was met by deleting the settle swipe rather than by making it
one-beat**, which is *How things get fixed*'s first reach — remove the mechanism
— and it answers both halves at once. Settling never cost one beat and could not
be made to: the swipe put *Again?* on the row because settling has two answers,
and a gesture that asks rather than acts is the second beat the swipe existed to
save. Give it an undo and the question goes, but the *other answer* still has
nowhere on a row to live. **So the row keeps the one resolution that is its own
inverse, and the two-answer question stays where there is room to state it.**

**That is the second option this section listed** — *the console keeps the
distinction* — and the objection recorded against it turned out to be weak:
settling is the once-a-week act, the console is where it already lives with both
answers drawn, and it costs a tap and an aimed tap where the swipe cost a swipe
and an aimed tap.

**What was built, and what each thing answers:**

- **One live direction per row, decided by the row's state.** `bind` is told
  which; a live line goes away, a struck one comes back. It is no longer the same
  swipe toggling on a state the hand cannot feel.
- ⚠ **The inert direction does not move the row at all.** A row that travelled
  and clamped in a direction that does nothing would feel *armed* and then do
  nothing — a worse lie than a row that does not move, and it would destroy the
  detent, which is the only confirmation iOS can give (§4: Safari has no
  Vibration API). One `Math.max(0, …)` is the whole mechanism.
- ⚠ **The undo is unbounded in time**, which is better than the ten seconds this
  section was going to reuse. A crossed-off row stays on the page, so the way
  back is on the page for as long as the row is: nothing is held, nothing
  expires, no clock is trusted on either side, and there is no
  settled-but-reversible third state for the resume gate to learn.
- ⚠ **The invisible reverse swipe is made safe by the console, not by a
  toast.** A crossed-off line's console offers exactly one control and it is
  *Put it back* — already built, before this change. So the gesture is the
  shortcut for somebody who has learnt it and never the only door. No toast was
  reached for, as this section asked.
- ⚠ **The record's inline *Again?* is DELETED**, and with it the `!isOpen` guard
  that kept one question from being drawn twice. `asking` and `askAgain` survive
  and are the console's alone — the two surfaces cannot disagree, because there
  is only one left.
- ⚠ **No fourth haptic.** Putting a line back fires the capture's light tap:
  *a line is on the live record* is the fact both state, and a fourth buzz would
  have to be tellable from three others on the one axis `vibrate()` controls.

**Measured by `node_modules/.probe/swipe.mjs`** — 30 assertions on a 390 handset
and 9 on a 1440 desk, rewritten around the half that is not there: a live row
held still against a restore swipe, a struck row held still against a second
cross-off, both clamping at their own height in the direction they do go, and
nothing anywhere saying *Again?* after any swipe.

---

## ~~4. Haptics are the eyes-free channel~~ — BUILT, and DEAD ON iOS

**The three patterns are in `lib/haptics.ts` and they run on Android only.** A
capture landing is one light tap, settled a firmer double, crossed off a heavier
thud — separable by length and by count, because a `vibrate()` duration is the
only axis that API controls. Silent, as designed: opening the console, dismissing
it, the keyboard rising, the chrome receding. The rule survives verbatim at the
top of that file:

> **Every haptic corresponds to something that just became true in the database.
> Never to a UI transition.**

⚠ **The fourth pattern — a convergence arriving while the app is open — is
unbuilt, because nothing fires it yet.** It arrives with the portal.

⚠⚠ **iOS Safari implements no Vibration API, and the installed app is a
handset**, so on the surface this product is actually used the whole vocabulary
is inert. **The consequence is a design rule, not a shrug: nothing in this app
may be designed to be confirmed by the hand alone.** The swipes were the first
thing that would have been, and what confirms them instead is the row travelling
its own height and stopping dead, plus both outcomes being visible where they
happened.

**The vocabulary is written down for a native shell** — including how to re-map
it to `UIImpactFeedbackGenerator` rather than porting the milliseconds — in
`docs/decisions.md`, under *Haptics*, in the section headed **CARRY THIS INTO A
NATIVE APP**. Directed 30 August: keep the idea somewhere so it can be
implemented when Again becomes an app.

⚠ **The corollary stands and is untouched by any of this: the capture loop must
be completable with the screen dark.** `+`, type, Return — four beats, one thumb,
one place. **Every feature that adds a beat to that loop is a tax on the only
thing this app has to be perfect at.** The console adds none, the swipes add
none, and the portal must add none either.

## ~~5a. The portal~~ — BUILT, 30 August. ~~The mark is still ahead of it~~ — and it is built too, 31 August

⚠ **The portal is built and the sub-section below it is struck; the MARK is
not.** This section's own division survives the build intact and is the reason
the two were never one thing:

> **The portal is arrival. The mark is memory.**

⚠⚠ **THE DOOR IS IN THE BOTTOM BAR, WHICH IS AGAINST §2 — directed, 30
August.** §2 says the portal goes at the top: *the bottom edge is for what you do
without looking, the top edge is for what you go to on purpose… it must never be
given a reflex's real estate.* The direction was given knowing that. **The law is
not amended and the deviation is not a precedent** — the cost is written beside
the control in `foot.tsx`, and the first symptom to watch for is a mis-hit `+`.
The three options put were the wordmark (§5's own *interesting option*), a fourth
glyph at the top, and the tray; a fifth — the foot — was the answer.

**What was built, and what each thing answers:**

- **A list of lines, not events**, enforced in the read: `listMyPortal` joins each
  notification to *the viewer's own capture for the same possibility* and groups
  by that capture, so two people on one line is **one row naming both**.
- ⚠ **The join is `payload->>'itemId'`, because a notification carries no capture
  id and cannot.** A match is about a *possibility*; the viewer's own capture is
  found at read time, which also means every payload written before the portal
  existed works unchanged.
- **It empties**, and `read_at` was already in the schema — so the *seen-state
  needs a column* item in §7 is closed without a migration, and the vocabulary
  migration it suggested batching with is unblocked.
- ⚠ **An empty portal has no door.** Off is the drawing without the door, as
  search's is. *An empty portal is the resting state* is not a surface to build;
  it is a surface that cannot be opened.
- ⚠ **Never a count, and the probe asserts the absence of digits on the door.** A
  badge is the most natural thing in the world to add later and it is an
  engagement metric under another name.
- **Tapping a row opens the same console** — the brief's own prediction, and it
  held: the console is handed down as a render prop, so every control on it is
  the page's own handler acting on the same capture through the same action.
- ⚠ **The sentences are three, not four.** *Sam has too.* cannot fire:
  `go_back_to × go_back_to` produces no match at all — *both know* — so the
  fourth row of the table below is unreachable by `classify` rather than
  unwritten. **Do not add the sentence to complete the table**; it is a row in
  `classify` and a new `NotificationKind`, decided there. `lend` had no row and
  was given one, flagged.
- **Proved end to end with two accounts for the first time** — `tests/portal.test.ts`,
  five cases: the seed-time trigger firing, each side's portal built from their
  own capture, two counterparts as one row, emptying that reaches nobody else's
  rows, and **the suppression rule holding**, seen from a surface at last.
  `node_modules/.probe/portal.mjs` measures the door and the box.

---

## ~~5. The portal AND the mark — different lifetimes~~ — BOTH BUILT, and the different lifetimes are the design that survived

⚠ **A gutter mark alone fails**, and this is the product owner's objection, which
is correct: a convergence can land on an entry hundreds of lines back, and
nothing should require scrolling to find it.

⚠ **A portal alone fails too**, for the mirror reason: once you have read it, the
fact vanishes from the record forever — and the record is the only durable thing
in this app.

> **The portal is arrival. The mark is memory.**
> The portal answers *what happened while I was away* and **empties**.
> The mark answers *why is this line special* when you meet it again in March.

### The portal

- **A list of lines, not a list of events.** Each row is the capture exactly as
  it reads in the record, plus one sentence.
- **Tapping a row opens the same console.** This is the payoff of building the
  console first — the portal is nearly free, because it is a list of things that
  open consoles.
- **It empties.** A row you have opened leaves. No *mark as read*. An empty
  portal is the resting state and the honest signal that there is nothing to
  know.
- ⚠ **Never a count.** One bit at most — something is there, or nothing is. A
  number is a thing to clear, and engagement metrics are excluded by name in
  `CLAUDE.md` under *Release 1 exclusions*.

⚠ **The interesting option, undecided: make the portal the wordmark.** Tap AGAIN
to see who else — the app's name is literally the thing that happens when two
people converge, and it is the largest, most fixed target on the screen. **The
cost is that the one element which is pure identity becomes a control**, which is
protected everywhere else. Worth taking, but it is a trade and it has not been
made.

### The sentence, and why the tense is the product

| their state | what it says | what it means |
|---|---|---|
| both still want it | **Sam too.** | go together |
| they have done it | **Sam has.** | ask them about it |
| you have done it, they want to | **Sam wants to.** | take them |
| both done | **Sam has too.** | *again* |

Four sentences, no vocabulary to learn, and the fourth is the name of the app.

**Name everyone.** The mechanic assumes small clusters — §10's *two hundred
people in twelve clusters* — so *Sam and Ali too.* is right and *Sam and 4
others* is a metric.

### ~~The mark, and the colour question §11 left open~~ — BUILT, 31 August

⚠ **`--color-accent` `#b49a62`, unchanged, on the gutter mark only** — the colour
§11 reserved for overlap and nothing else, and as of 31 August it is spent on it.

⚠ **The worry that the accent would have to out-shout a louder chrome did not
apply, and the build confirms why**: they never appear in the same place.
`--color-chrome` is a control and lives in the bars, the foot and the caret;
`--color-accent` is a state and lives in the gutter, where no control ever goes.
The two brasses mean their two things on one screen. ⚠ **Re-measured against the
desk's `#14140f` before shipping, as this section asked: 6.77:1 there and 7.70:1
on the handset's true black** — past the 3:1 WCAG 1.4.11 asks of a graphical
object on both, and it needed no change.

**What was built, beyond the drawing:**

- ⚠ **The read has no `read_at` term, and that absence IS the mark.**
  `listMyPortal` filters unread because the portal empties; `converged` in
  `lib/db/captures.ts` does not, because the mark is what is left when it has.
  **Adding an unread filter there deletes the only durable record that a
  convergence happened** — asserted in `tests/mark.test.ts` and, from the screen,
  in `node_modules/.probe/mark.mjs`.
- ⚠ **A bit rides the record; the sentence is a read behind the tap.** One
  `exists` per line on the page's own query — the screen whose promise is that
  Return lands in under a frame — and `getConvergence` for the one line somebody
  opened. **A record with no convergences in it issues no second read at all**,
  because the bit is what gates it.
- ⚠ **The sentence lands in the console, in the slot `console.tsx` was built
  leaving.** Its docblock predicted it in writing: *when who else arrives it has
  to arrive into a space that is already there — never a spinner over the whole
  box.* `portalSentence` is still its one author, so the portal's row and the
  console's line cannot say the same event two ways.
- ⚠ **The portal's console is handed `null` deliberately.** The portal already
  draws the sentence above the box; the mark answers *why is this line special*
  on a record where nothing else does, and in the portal everything else does.
- ⚠ **A colour in a gutter is invisible to a reader, so the row says it.** The
  record's row carries *Also on someone else's page.* in its label and the tray
  and search carry it as hidden text — the ellipsis rule applied to a drawing.
  It names nobody, because the record knows *whether* and the console knows
  *who*.
- ⚠ **It travels to the tray and to search**, which is one expression in three
  reads. A settled or crossed-off line keeps its mark: a resolution is not an
  erasure.
- **Observed, not changed:** `--mark-width` is `2.5px` like `--caret-width`, so
  the mark is the same hairline on the desk as on the handset while everything
  around it is four-thirds the size. That is the caret's own rule and it has not
  been looked at on a real desk. **If the desk's mark reads thin, that token is
  the thing to move** — and the caret is what moves with it.

---

## 6. Held back on purpose

⚠ **Conversations.** Floated for the console, and it is the single biggest jump
in the product: **the first time another person can put content on your page.**
It needs blocking, reporting and moderation, which the specification gates behind
Phase 6. **Build the console with the space for it and leave the space empty.**

⚠ **"Other listers."** Safe only within mutual tracks. Any count or hint of people
the viewer does not track is distal matching, gated on adult verification and
consent. ⚠ **This must be enforced in `lib/db/`, not in a component** — it is
exactly the class of guarantee that is invisible when broken, like
`listEntriesForOtherUser` and `getSwap`.

⚠ **Silence stays silent.** Copied-provenance suppression is already built. The
interface must **never explain an absence** — no *no matches yet*, no empty state
for convergence on a line. Nothing is the correct rendering of nothing.

---

## 7. Open, and blocking nothing yet

- ⚠ **ANSWERED 30 August: it exists on the desk, and it expands the row in
  place.** The alternative — one design at four-thirds, a floating card on both —
  was cheaper and was refused: a desk has the width to open the line where it
  lives, and a takeover up there costs the reader their place in the record for
  nothing. See *Status*.
- ⚠ **Raised by the build and not yet answered: on the desk the row's own words
  stay above the console, so a short capture reads twice** — the row says *A
  third* and the card underneath says *A third* again. It is correct for a long
  capture, which is what the row truncates and the card completes, and it is what
  the chosen sketch showed. The cheap fix is to hide the row while its console is
  open, above `--breakpoint-stack` only; the cost is that the control carrying
  `aria-expanded` vanishes from under a reader who just used it. **Not built, not
  urgent, and it wants a look on a real desk before either.** The same is true of
  the day stamp, which the console repeats from the group above it.
- ~~**Seen-state for the portal** needs a column.~~ **CLOSED, and it needed no
  migration — 30 August.** `notifications.read_at` has been in the schema since
  the engine landed and is exactly this; the portal writes it and reads
  `is null`. **The vocabulary migration is therefore not waiting to be batched
  with anything.**
- **Where an intention is refined after capture** is still undesigned. ⚠ **It
  stopped blocking convergence on 5 September — see §9b and Amendment 4** — and
  it is still the other half of why **Have** is unreachable. See *Have is still
  not reachable* in `phase-1-capture.md`.

---

## 9. FOUND BY USING IT — two accounts, 4 September

**The first time Phase 2 was exercised by a person rather than a fixture.** Two
real accounts, a line on each that resolves to the same film, on a production
database. **Nothing converged**, and the reasons are the two entries below.
Neither is a bug in the engine: the engine was never reached.

The diagnosis is reproducible — `scripts/why-no-convergence.mjs`, and
`scripts/prod-why.sh` for production. It prints which of the four terms is
false, because **all four fail identically from inside the app: in silence.**
That is the product working as designed and it is why the script exists.

What it found: 2 accounts, **0 tracks**, 54 resolved captures, one possibility
(*Scarface*) held by both people, and **0 notifications ever written**.

### 9a. ~~ADDING SOMEBODY MUST BE A REQUEST THEY ANSWER~~ — **BUILT, 4 September**

⚠⚠ **DESIGNED AND BUILT THE SAME DAY IT WAS RAISED. The whole of it now lives in
`docs/re-direction/the-handshake.md`, which is where to read and to edit.** What
follows is kept only because it is the account of the failure that caused it —
and one prediction in it was wrong in a way worth keeping: **a request/accept
flow needed no `tracks` change at all.** A one-sided track already *was* a
request; nothing delivered it. There is no pending state, no new table and no
migration.

⚠ **The QR half is still unbuilt** — §2f of the brief, where it reduces to a
handle in a URL scanned by the phone's own camera.

**A mutual track is two independent one-sided acts, and that is the whole
problem.** Today: I open `/u/your-handle` and track you; then *you* must
separately remember my handle, go to my page, and track back. Until you do,
nothing converges — **and nothing tells either of us why.**

**Directed, 4 September:** *if i add a friend on one account, the account i
added should receive a ping offering accept or reject.*

- ⚠ **This is a real change to `tracks`, not a UI addition.** The table is two
  rows and mutuality is their conjunction (`lib/db/tracks.ts`:
  `mutual: outbound && inbound`). A request/accept flow needs a **pending**
  state that is not yet a track, and an acceptance that writes **both** rows in
  one transaction — which is what §9's contact handshake already specifies for
  the QR path: *on successful confirmation, create both existing track rows
  atomically.*
- ⚠ **So this and the QR handshake are the same feature reached two ways**, and
  they should be designed together rather than sequentially. QR is the
  in-person transport; a handle request is the remote one. Both end in the same
  two-sided confirmation and the same atomic write, and §9 already says the
  transport is never the authority.
- ⚠ **It needs a notification kind, and §6 says there are six and that is the
  complete set.** A track request is a seventh. That is a specification
  amendment, not an oversight to fix quietly — and it is the first
  notification in the product that is **not** about a convergence.
- ⚠ **One-sided tracking must survive it.** §9 is explicit that a handshake means
  *add each other*, where following is one-directional and stays available.
  Whether a plain one-sided track remains reachable in the UI is the product
  question to answer first.
- **What it fixes beyond convenience:** the failure stops being silent. A
  request that is never accepted is a visible pending state, where today it is
  an absence indistinguishable from having no matches.

### 9b. ~~NOTHING WRITTEN ON THE CURRENT APP CAN EVER CONVERGE~~ — ANSWERED 5 September

⚠⚠ **THE ANSWER WAS TO REMOVE TWO CONDITIONS, NOT TO ADD A CONTROL. This section
prescribed an intention control in the console and that is WITHDRAWN — do not
build it.** Directed, 5 September: *a user opens the app and starts writing,
submits, goes about their day, maybe gets a notification later of someone or
others who've matched with him.* **There is no resolving step, no categorising
step and no confirming step in that sentence.**

**So a capture converges on its words.** `possibility_id` and `intent` both stop
being conditions of a match: two captures agree when they resolve to the same
possibility **or when their `normalised_text` is identical**, and the intent pair
selects which sentence to write rather than whether to write one. The normative
statement is **Amendment 4** to the implementation specification, which carries
what it costs and what it leaves untouched. ⚠ **The consent is still the mutual
track and reading is still untouched** — this changes what may *match*, never
what may be *read*.

⚠ **The half that is not built: push.** *Goes about their day* means reaching
somebody who is not in the app, and delivery is in-app only — no service worker,
no subscription record, no worker. Until it exists the loop ends at *opens the
app again and finds it*.

**What follows is the account of the failure, kept because it is what the change
answers. The prescriptions inside it are superseded.**

⚠⚠ **THIS SECTION SAID *2 OF 54 CAPTURES* AND THAT BADLY UNDERSTATED IT —
measured against production on 4 September.** The real shape:

| captures | intent | first | last |
|---|---|---|---|
| **48** | set | 7 August | **22 August** |
| **34** | **null** | **22 August** | 2 September |

**The split is the day Phase 1's capture page replaced the film flow**, and the
cause is exact: **`addFilm` is the only writer that ever set an intent, and
nothing references it any more.** `writeCapture` takes `input.intent ?? null`
and no surface supplies one; `DEFAULT_INTENT` is *derived* at settle to choose a
landing state and **is never written to the column**. So the 48 are relics of a
deleted flow, and **every capture written since 22 August has `intent = null`
and is permanently unmatchable.**

⚠ **The handshake (§9a) is necessary and it is not sufficient.** Two people can
now find each other, become mutual, and still converge on nothing — which is the
same silence, reached one step later. ~~**This is the next thing to build.**~~
**It was — and what got built is Amendment 4, not what this section proposed.**

⚠⚠ **THIS PARAGRAPH WAS WRONG IN BOTH HALVES AND IS KEPT TO SAY SO.** It read:
*it is not a matching bug and the fix is not in `lib/overlap.ts`; the rule below
is right; what is missing is any way for a live capture to acquire an intention,
and the console is where a capture is already opened and reconsidered.* **The
fix is exactly in `lib/overlap.ts`, and the rule below is what changed.** A
control in the console would have answered *intent* and left the larger wall
standing: **both fan-outs join on `possibility_id`**, so a capture that resolves
to nothing could never converge with anything whatever its intention — and that
is most of what anybody writes.

Both *Scarface* captures resolved to the film and carry `intent = null`. **A
null intention is excluded in SQL before `classify` sees it** (`lib/overlap.ts`,
both fan-outs), so those two lines cannot match each other or anybody, ever, and
no surface says so.

- ~~**The matching rule is right and is not what to change.**~~ ⚠ **It is what
  changed.** The argument it rested on is real and is now a **cost rather than a
  rule**: §6 made intent part of the match deliberately — two people wanting to
  *see* a film is a plan, one wanting to see it and one wanting to own a disc is
  not — and under Amendment 4 that pair matches and writes the plain sentence.
  The three pairs (`see×see`, `see×again`, `own×have`) survive as the chooser of
  the richer sentence. ⚠ **For a text match the words carry the distinction; for
  a possibility match nothing does. If it proves noisy, that is the clause to
  reopen — not the text rule.**
- ⚠ **There is still no way to give a live capture an intention, and it no longer
  blocks anything.** §13 forbids asking before saving, and `DEFAULT_INTENT` is
  derived at **settle** to choose a landing state and never written. Under
  Amendment 4 a null intention matches, so the *"where an intention is refined
  after capture"* entry in §7 above is a **refinement** question rather than a
  blocking one. It is still the other half of why **Have** is unreachable.
- ⚠ **It is the same gap that makes Have unreachable**, from the other end. See
  *Have is still not reachable* in `phase-1-capture.md`.
- **Do not answer it by defaulting the intent at capture time.** That would make
  every raw capture claim an intention nobody stated, which is the categorising
  §13 exists to prevent. ⚠⚠ **And do not answer it in the console either — that
  was this section's own proposal, and Amendment 4 replaced it.** A control there
  is still a beat after the capture that somebody has to come back for, and its
  failure is silent, which is the shape of every failure §9 records. **The
  intention is in the words.**

---

## 8. Sequence

1. ~~**The console**, page-side only — full text, `×`, `✎`, photo, link. No
   network. Delete `film-screen.tsx` into it.~~ **DONE, 30 August.**
   `film-screen.tsx` and the dead `capture-provider.tsx` beside it are deleted,
   which also closes item 3 of Phase 1's outstanding list — **the thing detail
   view**.
2. ~~**Swipes**, and delete `picked`.~~ **DONE, 30 August** — the state was
   already gone with the console; the gesture is `components/row-swipe.ts`. ⚠
   **Reopened and rebuilt the same day**: settling had to cost one beat and both
   directions had to afford an undo, and the answer was to **delete the settle
   swipe**. One swipe, its own inverse, unbounded undo. §3b.
3. ~~**The portal**, reading `notifications` — which also proves the fan-out end
   to end with two accounts for the first time.~~ **DONE, 30 August.** The
   fan-out is proved: `tests/portal.test.ts`. ⚠ **Its door is in the FOOT and
   not the bar, directed, against §2** — see §5a.
4. ~~**The mark**, last, once there is a real convergence to look at and it is
   known what one looks like to a person.~~ **DONE, 31 August**, and the
   sequencing paid: the portal had already put a real convergence on screen, so
   what the mark had to be was known rather than guessed. §5's sub-section above
   is struck.
5. ⚠⚠ **THE WORDS — added 5 September, directed, and it is the first item here
   that is not a surface.** Everything above reads a convergence; **nothing has
   ever produced one from a line somebody wrote on this app.** Two conditions
   come out of `lib/overlap.ts` — the join on `possibility_id` and the non-null
   intent — and normalised-equal text becomes an agreement. **Amendment 4** is
   normative; §9b is the account. ⚠ **The whole of it is in the matching owner
   and no surface changes**, which is why it is one item and comes after four
   that were all screens.
6. ⚠ **PUSH — named, not scheduled.** Until it exists a convergence waits in the
   app, and *goes about their day* is not delivered.

⚠⚠ **THE SEQUENCE IS COMPLETE AND THIS FILE IS NOT YET FOR THE BIN — read this
before moving it.** All four steps are built, so the instruction at the head of
this document points at `docs/re-direction/inactive/`. **What holds it here is
§7 and §6**, which are not sections about work that has been done:

- §7's *the row's own words stay above the console on the desk* is raised, unanswered
  and wants a look on real hardware.
- §7's *where an intention is refined after capture* is undesigned, and is the
  other half of why **Have** is unreachable.
- §6 holds three things back on purpose — conversations, other listers, and the
  silence rule — and those are the notes a Phase 6 reader will need.
- ~~§13 of `implementation-spec.md` still names the possible-match prompt for
  unresolved normalised-equal captures.~~ ⚠ **Amendment 4 withdrew the prompt on
  5 September and made the match itself the deliverable** — normalised-equal text
  converges with no confirmation step. §13 is still normative for the exit
  criteria and **this document has never owned that item**; what it now owns is
  step 5 of the sequence, which is unbuilt.

**The call is the product owner's**: move this file when those are answered
elsewhere, not because the sequence ran out.
