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
| The console | designed, not built |
| Swipe to cross off / settle | designed, not built |
| Haptic vocabulary | designed, not built |
| The notification portal | designed, not built |
| The convergence mark on a line | designed, not built |
| Conversations in the console | **deliberately not designed** — see *Held back* |
| Non-friend listers | **deliberately not designed** — see *Held back* |

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

## 1. The console

**Tapping a line opens a console: rounded, glass, see-through, no outline, over
a blurred record.** It holds the capture — the whole text, the photograph, the
link, the year, its resolution, and who else — with `×` and `✎` on its bottom
edge.

### Why, in the strongest terms

**The record is an index, not a document.** Every line truncates to one line, so
everything about a capture past its first forty characters currently has nowhere
to exist. The row is a spine label; the console is the only place a capture is
actually *shown*.

⚠ **The console is the thing detail view**, which is item 3 of Phase 1's
outstanding list. `film-screen.tsx` has been kept for a surface nothing opens.
**Replace it; do not build the console beside it.**

⚠ **It is not navigation, and that is what the logo-row rule protects.**
Directed: the console never encroaches on the mark, so the bar stays visible if
it was visible when the line was tapped. You are always visibly still on your
page. The same argument the writing sheet won — a sheet is not a route.

### The edge grammar

⚠ **The top edge belongs to the mark. The bottom edge belongs to the writing
strip. The console lives strictly between them and touches neither.** Reaching
the bottom edge would put two current objects on the strip's edge, which is the
collision the one-strip rule of 28 August removed.

### ⚠ It always opens in the same rectangle

**The first instinct was to have it grow from the line you touched. That is
wrong.** If the box lands in a different place every time, its `×` is in a
different place every time, and a thumb can never learn it. **Fixed rectangle,
always.** Let the *animation* carry the spatial link — rise from the tapped
line's y and settle into the fixed box — so it reads as the line opening while
resting somewhere the hand already knows.

**Read from the top, act at the bottom.** The entry text at the top; the
controls along the console's bottom edge, because that is the only part of a
handset a thumb reaches without a regrip.

### No outline

Directed, and the reason is already in `globals.css`: **glass is a surface and
has an edge by being one.** An outline would be a second edge drawn over the
first. See `--sheet-tint` and the `--row-light` tombstone for the whole argument
against painting an edge onto a surface that has one.

### Dismissal — and what it means

⚠ **It dismisses by tapping the blurred paper, confirmed 30 August.** So there
is **one exit gesture in the entire app**: tap the paper, on the writing strip
and on the console alike, with `Escape` as the desk's discard. The scrim stops
belonging to the writing sheet and becomes the app's one *something is open*
surface — **one scrim, one occupant, always.**

Three consequences, resolved:

- ⚠ **Tapping the paper COMMITS.** That is what it means on the writing strip, so
  it must mean the same over the console. The console's edit is not a modal with
  a cancel. Thumb-tap commits, `Escape` discards. A gesture that means *save* on
  one surface and *abandon* on another cannot be learned by a hand.
- ⚠ **`✎` closes the console and hands the words to the strip.** **Not** an
  editable field inside the console. *The page has exactly one field and it is
  the strip* is load-bearing and already works: a field in the console would be a
  second one, would have to dodge the keyboard, and would put two occupants on
  one scrim. Reached this way, rewriting from the console **is the rewrite path
  that already exists**, entered through a different door.
- ⚠ **The console remembers where it opened from.** Paper-tap from a console
  opened on the record returns to the record; opened from the portal, returns to
  the portal. It is the only place the console is stack-like, and it has to be,
  or the portal is a dead end.

### It must render instantly

The console becomes the main interaction, and its social half needs the network.
**Render the line and its controls immediately from what the page already
holds**, and let *who else* arrive into a space that is already there. **Never a
spinner over the whole box.**

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

⚠ **It pays for itself: `picked` disappears.** With the console owning
consideration and the swipes owning action, the pick state goes, and with it the
gutter mark, the foot's settle glyph, and the twice-defended argument that *a tap
means pick and never two things depending on the tap before it*. The foot drops
to `+` and search.

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

- ⚠ **Does the console exist on the desk, or is it a handset object?** Above
  `--breakpoint-stack` the tools stand beside the column and there is room to
  show a capture in place. One design at four-thirds is cheaper and more
  consistent with everything else on this page; expanding the line inline on the
  desk is the alternative. **Undecided — this was the last question asked and it
  was not answered.**
- **Seen-state for the portal** needs a column (`notifications.seen_at` or
  equivalent). It is the first schema move since the deferred vocabulary
  migration; **consider batching them**, since that one wants a phase that plans
  a down migration anyway.
- **Where an intention is refined after capture** is still undesigned, and it is
  the other half of why **Have** is unreachable. See *Have is still not
  reachable* in `phase-1-capture.md`.

---

## 8. Sequence

1. **The console**, page-side only — full text, `×`, `✎`, photo, link. No
   network. Delete `film-screen.tsx` into it.
2. **Swipes**, and delete `picked`.
3. **The portal**, reading `notifications` — which also proves the fan-out end to
   end with two accounts for the first time.
4. **The mark**, last, once there is a real convergence to look at and it is
   known what one looks like to a person.
