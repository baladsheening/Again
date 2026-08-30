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
| Swipe to cross off, swipe back to undo | **BUILT — 30 August, reopened and rebuilt the same day.** §3 and §3b both struck. ⚠ **Settling is NOT a swipe**: the row carries the one resolution that is its own inverse, and the console keeps the question that has two answers |
| Haptic vocabulary | **BUILT, and dead on iOS.** Three patterns in `lib/haptics.ts`, Android only. The native-shell note is in `docs/decisions.md` |
| The notification portal | **built, 30 August** — door in the FOOT, against §2 |
| The convergence mark on a line | designed, not built |
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

⚠ **Phase 2's matching engine is deployed and nothing reads it.** `tracks` with
mutuality, `lib/overlap.ts` as the one matching owner on both triggers, the
suppression rule, and `notifications` rows written in the same transaction as
the write that caused them — all of it runs. **No surface in the tree reads the
`notifications` table**, which also means the fan-out has never been proved end
to end with two accounts.

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

## ~~5a. The portal~~ — BUILT, 30 August. The mark is still ahead of it

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

## ~~5. The portal AND the mark — different lifetimes~~ — the portal half is BUILT

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

### The mark, and the colour question §11 left open

⚠ **`--color-accent` `#b49a62`, unchanged, on the gutter mark only** — the colour
§11 reserved for overlap and nothing else, which has been used by nothing since
23 August.

⚠ **This answers the worry that the accent now has to out-shout a louder
chrome.** It does not, because **they never appear in the same place**:
`--color-chrome` is a control and lives in the bars and the foot;
`--color-accent` is a state and lives in the gutter, where no control ever goes.
The two brasses finally mean their two things on one screen. Re-measure it
against the desk's `#14140f` ground before shipping — it is 7.73:1 on true black.

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
- **Where an intention is refined after capture** is still undesigned, and it is
  the other half of why **Have** is unreachable. See *Have is still not
  reachable* in `phase-1-capture.md`.

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
4. **The mark**, last, once there is a real convergence to look at and it is
   known what one looks like to a person.
