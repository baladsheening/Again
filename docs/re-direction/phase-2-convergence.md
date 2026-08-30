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
| Swipe to cross off / settle | designed, not built — **next** |
| Haptic vocabulary | designed, not built |
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

## 3. Tap thinks, swipe does

- **Tap a line → the console.** Deliberate, considered, everything is there.
- **Swipe a line → cross off one way, settle the other.** No console, no glyph,
  no aiming, no looking.

The two verbs used fifty times a week become directional gestures on the row
itself; the console is for the once-a-week question. **A gesture that can be made
anywhere on a row is the only kind of target that survives being used while
walking.**

⚠ **It pays for itself: `picked` disappears — and most of that bill was already
settled by the console on 30 August.** The pick state is gone (`opened` is the
line whose console is up), the gutter mark is off the row, the foot's settle
glyph is on the console, and the foot is already `+` and search. **What the
swipes still buy is the gesture**, not the clean-up: the two verbs used fifty
times a week stop costing a tap-and-aim. ⚠ The `picked` **utility** survives
unapplied in `globals.css`, deliberately — §11 reserves `--color-accent` for
convergence and the gutter is where a state may live, so the mark's next tenant
is §5's, not a pick's. Do not put a pick mark back there.

⚠ **Check `--tap-floor` and the record's 44px rows before drawing this**, and
check that a horizontal swipe on a row cannot be read as a scroll. Neither is a
new problem on this page, but both are measured facts rather than assumptions.

---

## 4. Haptics are the eyes-free channel, and they are barely used

`lib/haptics.ts` exists. **One rule:**

> **Every haptic corresponds to something that just became true in the database.
> Never to a UI transition.**

Otherwise the hand learns noise and stops reading it.

| event | feel |
|---|---|
| a capture lands | one light tap |
| settled | a firmer double |
| crossed off | one heavier thud |
| a convergence arriving while the app is open | the only pattern unlike the others |

**Silent:** opening the console, dismissing it, the keyboard rising, the chrome
receding. Those are things the person did, not things that happened.

⚠ **Corollary, and it is the acceptance test for the whole design: the capture
loop must be completable with the screen dark.** `+`, type, Return — four beats,
one thumb, one place. **Every feature that adds a beat to that loop is a tax on
the only thing this app has to be perfect at.** The console adds none, because it
is off the capture path; the portal must add none either.

---

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
2. **Swipes**, and delete `picked`. ⚠ **The state is already gone** — see §3;
   what is left to build is the gesture itself.
3. **The portal**, reading `notifications` — which also proves the fan-out end to
   end with two accounts for the first time.
4. **The mark**, last, once there is a real convergence to look at and it is
   known what one looks like to a person.
