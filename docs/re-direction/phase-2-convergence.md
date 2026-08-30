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
| Swipe to cross off / settle | **BUILT, then REOPENED the same day** — §3 struck, §3b is the new direction. ⚠ **Settling must cost ONE beat and BOTH directions need an undo.** Not built |
| Haptic vocabulary | **BUILT, and dead on iOS.** Three patterns in `lib/haptics.ts`, Android only. The native-shell note is in `docs/decisions.md` |
| The notification portal | designed, not built |
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

**Left crosses off, right asks *Again?*, a tap still opens the console.** The
argument that was here is carried in `components/row-swipe.ts` and in the
`touch-action` note on `page-row` in `globals.css`, beside the code each governs.

Three things the design did not say, decided in the building and recorded in
`docs/decisions.md`, *Tap thinks, swipe does*:

1. ⚠ **A swipe cannot SETTLE, because settling has two answers.** *Again?* and
   *done* are different claims and one direction cannot carry both, so the settle
   swipe puts the question on the row. That is also what makes it safe — settling
   has no undo, and nothing leaves the page until somebody answers.
2. ⚠ **The threshold is the row's own height, read off the row**, so a handset
   and a desk are both right by derivation: 44 and 58.67 from one line with no
   breakpoint in it. It clamps there, which makes it a **detent** rather than a
   threshold to guess at.
3. ⚠ **Physical, not logical.** Right settles, left crosses off, against the
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

## ⚠⚠ 3b. THE SWIPES ARE REOPENED — directed 30 August, NOT BUILT

**Two directions, given after using the swipes:**

1. ⚠ **Settling must cost ONE BEAT.** It costs two today — swipe, then answer
   *Again?* with a tap — and that is the swipe failing its own argument. The
   whole case for a gesture is that it is cheaper than the console; one swipe
   plus one aimed tap is barely cheaper than a tap plus an aimed tap.
2. ⚠ **Both directions must afford an UNDO.** Left-to-right and right-to-left
   alike: after a swipe, the person must be able to take the decision back.

**These two are one change, not two.** The only reason settling asks a question
is that settling has two answers and no undo — *I would do this again* against
*that is dealt with* — so a wrong swipe would put a line in the tray with no way
back. **An undo removes that objection**, and with it the question, and with it
the second beat. Build them together or neither works.

### What has to be decided when this is built

⚠ **Settling still has two answers, and one swipe cannot carry both.** Removing
the question does not remove the fact. The options, and none is chosen:

- **A default plus a correction.** The swipe settles with one answer and the undo
  band carries both the way back *and* the other answer — *Settled. Undo · Not
  again.* That gets one beat, keeps both claims reachable, and costs no aiming
  unless somebody wants the non-default. **This is the recommendation.** Which
  answer is the default is itself open; *again* is the app's own name and is the
  likelier reading of a line somebody kept.
- **The console keeps the distinction** and the swipe always settles the same
  way. Cheapest to build; loses the second claim for anyone who never opens a
  console.
- **Distance decides.** A short swipe means one and a long one the other. Ruled
  out on sight: it is a modifier gesture, which this page has refused three times
  — see `pick`'s note in `page-screen.tsx`.

### What the undo has to be

⚠ **There is already an undo on this page and it is the pattern to follow, not to
copy.** `LineUndo` gives ten seconds after a capture lands, in the line's own
slot, and it exists because *the undo belongs beside the line it takes back*.

- **Crossing off is its own inverse and still needs the affordance**, because a
  gesture nobody knows is reversible reads as destructive. The row stays on the
  page struck through, so the undo has somewhere to live.
- ⚠ **Settling is the hard one: the row LEAVES the page.** There is nowhere
  beside the line to put an undo, because there is no line. Either the row is
  held in place for the window and removed when it closes, or the undo goes
  somewhere that is not the row. Holding it in place is more honest and matches
  `undoCapture`'s own precedent — the delete is bounded in SQL against
  `created_at`, so the client's clock is never trusted.
- ⚠ **Do not reach for a toast.** The page has no such surface and §11 spends no
  colour on one; the existing undo is a glyph on a row, and a second vocabulary
  for the same act is how a page stops being learnable.
- ⚠ **The ten-second window is already a decided number** (§5's one exception to
  *nothing is ever deleted*). Reuse it rather than picking a second one.

### What it costs, stated before it is built

- **`settle` currently removes the row optimistically** and puts it back only on
  a server failure, by the index it held. An undo window means the row is held
  deliberately, which is a third state for that row — settled-but-reversible —
  and the resume gate must treat it as unsettled, exactly as it already treats an
  open undo window.
- **`asking` and `askAgain` may be deleted with the question**, and with them the
  record's inline *Again?*. The console's settle glyph would then settle directly
  too, or keep the question — **they must not disagree**, which is the rule that
  put `askAgain` in one place to begin with.
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

## 5. The portal AND the mark — different lifetimes

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
- **Seen-state for the portal** needs a column (`notifications.seen_at` or
  equivalent). It is the first schema move since the deferred vocabulary
  migration; **consider batching them**, since that one wants a phase that plans
  a down migration anyway.
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
   **REOPENED the same day and NOT finished: settling must cost one beat, and
   both directions must afford an undo. See §3b, which is the next thing to
   build.**
3. **The portal**, reading `notifications` — which also proves the fan-out end to
   end with two accounts for the first time.
4. **The mark**, last, once there is a real convergence to look at and it is
   known what one looks like to a person.
