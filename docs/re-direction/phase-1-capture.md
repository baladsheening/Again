# Phase 1 — capture: the design

Schema-free. This document decides what the landing screen is, what capturing
does, and what the words are. No migration is written here and no column is
added; the point of doing it first is that the migration which follows is a
consequence rather than a guess.

It covers the first two deliverables of §13 Phase 1 together — *Notes-like Home*
and *canonical vocabulary and status copy* — because they are one decision.

The drawings are in `design/`, and the artboards are the normative picture of
this document: `Main` (empty), `LandingTyped` (writing), `LineSelected`
(browsing), `ReadingBack` (a month), `BarStates`, `LineStates`, `LandingRail`.

---

## Build status — 24 August

> **Built, deployed and seen on a handset — 24 August, `main` at `101aa33`.**
> **No deploy in this phase has carried a migration** — no schema has moved — so
> the rollback is still a revert push and nothing else.
>
> **Everything in the page has now been seen on hardware and judged good**, the
> 23 August evening's work and the 24th's alike. What is left in Phase 1 is a
> list of things not built, not a list of things unverified — with one exception,
> named below.
>
> ⚠ **The four-second capture has been set aside, at the user's direction on 24
> August.** It is still not stopwatched and this register does not claim it is.
> It stops being *the next thing* and becomes an open question that Phase 1 can
> close around; the reasoning for wanting it is kept under *What hardware
> answered* because it is the honest statement of what the page has and has not
> proved.
>
> ⚠ **The chrome's exit was the open UX item and it is closed.** The recede was
> judged too quick on hardware on 24 August; the exit took the return's length,
> and the two duration tokens collapsed into one `--recede`. See *The chrome's
> exit* below — including the mirrored exit curve that was built first and
> measured before it could ship.
>
> ⚠ The installed app **never reloads until it is force-quit** — check which
> build is running before believing anything seen on it.

### The 23 commits this register was missing

It said `949c698` until 24 August while `main` ran 23 commits past it, so
everything below lived only in commit messages. Grouped by what it decided,
newest last; the code comments carry the full argument in every case.

**The record's light, and what a row is** — `06ecd48` `a6f5036` `df1b6f6`
`500a4f0` `13f6a79` `c7ffc3f` `9115a9a`. The live row is **lit, not filled**:
an ellipse of warm light inscribed in the row, transparent at all four sides,
**always on**. ⚠ Two flat grounds shipped and both came back "too grey" — the
value was never the problem, because *a uniform tone inside a rectangle with
edges* is what reads as grey at any value. **Do not answer "too grey", or
"brighter", with a fill.** Glass was asked for and cannot work here:
`backdrop-filter` blurring `#000000` returns black, so it can only show through
a hairline, and hairlines are out. A capture **blinks the words** when it lands,
never a ground behind them — lighting the paper says *this area* and what
happened is a *line*. The mark on a picked line spends **thickness**, not
height.

**The bars** — `67238b3` `ad3593b` `66f1f55` `ecb2cc5` `9dd3871` `80deb9b`
`423dec4`. The two bars are sized apart; they leave while the record is read and
**answer where you are, not which way you were going**. The foot is *not* held
above the keyboard — it was, and it is not wanted there. The live line is always
on screen and the chrome **thins to it**: when the bar goes, the band takes its
place at the top of the glass rather than sitting under a hole. The band clears
the notch in **both** positions, paid for in padding rather than position, or the
notch is paid for twice.

**Writing is a mode** — `22aec55` `04d9c4b` `4b2e5bd` `917ae2a`. The record goes
behind glass and stops moving while the keyboard is up. ⚠ **The mode is entered
on `click`, never `pointerdown`**: a pane that appears over the touch point takes
the click that follows on iOS, so the field never focused and the keyboard never
rose. ⚠ **The light is an invitation, so the *waiting* row is the bright one and
the row being written in steps back** — it shipped inverted; the writing pane has
already darkened everything else, and a lit ground competing with the words is
the app talking over the one thing it asked for.

**⚠ `focused` is deleted from this page and nothing may add it back**
(`917ae2a`). Four separate features were keyed to focus and all four were wrong
for one reason: the live line carries `autoFocus`, so **focus is the resting
state of this page, not an event** — it arrives without a keyboard on iOS and
before hydration on the desk. All four read `writing` now, which is a gesture: a
tap on the field or a keystroke in it, cleared on blur.

**The unsent line, the caret, and letting go** — `ef33bda` `5e89431` `5cfa899`
`d526d0b`. Covered in full under *The words that are not in the record yet* and
*The chrome's exit* below.

The instruction this was built against was narrower than the document below:
**the page and Return — no schema, no images, no suggestions.** So the design is
whole and the build is a slice of it, and the slice is named here rather than
left to be worked out from the diff.

Everything under *Still to build* is Phase 1 work that has not started.
*What hardware answered* is the other list, and it is the one worth reading
twice: a screen that has been used is not the same as a claim that has been
measured, and only one of those is now true.

### What is built

| | |
|---|---|
| `app/(app)/page.tsx` | the read, the day stamps, the seed |
| `components/page-screen.tsx` | the page: lines, live line, picking, Return |
| `components/bar.tsx` · `foot.tsx` · `glyphs.tsx` | the two bars and the seven glyphs |
| `components/keyboard-pin.ts` | the foot held on the keyboard's top edge |
| `components/screen.tsx` | the bar and a column, for every route that is not the page |
| `app/actions/captures.ts` | capture · rewrite · cross off · settle · undo |
| `lib/db/captures.ts` | `listMyPage`, `listMySettled`, `setCaptureText` |
| `lib/day.ts` · `lib/region.ts` | the stamps, and the viewer's timezone |
| `lib/mutation-id.ts` | the stable submission id, and its non-secure-context fallback |
| `lib/vocabulary.ts` | `STATE_WORD`, `WHERE_IT_IS` |
| `app/(app)/settled/page.tsx` | the tray |

Removed, and **not to be rebuilt**: `components/shell.tsx`, `cinema-wall.tsx`,
`poster-wall.tsx`, `entry-list.tsx`, `entry-row.tsx`, `icon-home.tsx`, the four
collection routes, `V1_KINDS`, `COLLECTION_FOR`, `--color-caret`.

### Still to build, in the order it wants doing

**Three items came off this list on 24 August, and one of them was not built.**

- ~~*The chrome's exit*~~ — **done**, see that section below.
- ~~*Editing a committed line*~~ — **done**, see *Rewriting a line* below. The
  question this document left open is answered: **in place**.
- ~~*The four-second capture, with a stopwatch*~~ — ⚠ **set aside at the user's
  direction, and not done.** This register does not claim it is. It was item 1.
  The reasoning is kept under *What hardware answered*, unchanged, because it is
  still the honest account of what the page has and has not proved, and anyone
  reopening Phase 1's acceptance starts there.
1. **Search over captures.** The foot's fourth glyph. The existing
   `search-field.tsx` and `search-provider.tsx` search TMDB, not the page; they
   are on disk and mounted by nothing.
4. **An *Earlier* control at the head of the page.** `listMyPage` reads the most
   recent 50 and nothing reaches past them. One more `offset` and no new read —
   but until it exists, a record longer than about a month has lines that cannot
   be scrolled to.
5. **Resolution offers.** *Suggestions never gate the save*, above: saved →
   line → then a quiet offer. The trailing muted `?`, the Yes/No pair while the
   line is picked, and provider failure as the absence of an offer rather than
   an error. `film-screen.tsx` is kept for this — it is the media-resolved
   detail surface.
6. **Images.** The heaviest item, and a storage layer rather than a button —
   §6's object storage outside Postgres, size and type limits, EXIF stripping,
   an access-controlled media path, retained provenance, reportable and
   removable assets. The camera glyph is drawn and dark, waiting.
7. **The words, in the schema.** `STATE_WORD` carries them on screen; the
   Postgres enum still reads `want`, `go_back_to`, `fixture`. ⚠ When that
   migration runs, **`PUBLIC_STATES` is re-derived rather than renamed** — see
   the warning under *The words*.
8. **The types and intentions of §3**, which is what makes *Have* reachable
   again: `landsIn` is a property of a kind and an intention, and a raw capture
   has neither, so nothing new lands in `fixture` today.
9. **`toLegacyEntryCards` dies.** Its last caller is `/u/[handle]`, the Phase 2
   shared page. **Nothing may add a caller.** The read that replaces it is
   `toCaptureCard`, which already exists and carries text.

### What hardware answered, and what it did not

The page was opened on a handset on 23 August and it works. Two things were
waiting on that, and they came back differently.

**1. The keyboard pin — the dangerous half is gone by construction.** The worry
was the live line ending up behind the keys on a long page. It cannot: the caret
is the first thing in the document now, pinned under the bar, so a keyboard
rising from the bottom of the glass has nothing to cover. That is a subtraction
rather than a fix, which is the order `CLAUDE.md` asks for — the condition was
removed, not corrected for.

`components/keyboard-pin.ts` still holds the foot on the keyboard’s top edge and
still writes `--keyboard-overlap`, and **that part is still only ever exercised
on hardware** — a desktop Chromium has no software keyboard. What is left to
watch, installed and in a Safari tab: the foot arriving *with* the keys rather
than after them. It is no longer on the critical path, because nothing
important is behind it any more.

**2. The four-second capture is still a claim.** ⚠ **And it has been set aside
at the user's direction on 24 August — everything in this item still stands, and
none of it has been answered.** The screen was used and judged good; it was not
stopwatched. The desk figure stands and is the wrong instrument: first key to the
line on the page, **34–152ms** against `next start` — a render, not a thumb.

⚠ **The keyboard cannot be raised on a cold open on iOS**, and no arrangement of
this code changes it: focus without a gesture does not open a keyboard there.
⚠ **What answered it when this was written no longer exists.** The answer was the
paper — *every other pixel of the page starts a capture* — and `04d9c4b` removed
that. What answers it now is that **the live line is pinned and on screen at
every scroll position**, so the gesture iOS insists on is one tap on a target
that is never more than a thumb's reach away, wherever the record is scrolled to.
Whether that is fast enough is what a stopwatch has to say. If it is not, the
honest next move is a share-sheet or shortcut entry point, not a hack on focus.

⚠ **Two snags before testing over the LAN.** `crypto.randomUUID` is undefined on
`http://192.168.x.x` — a secure-context gate — which `lib/mutation-id.ts`
already works around; and `BETTER_AUTH_URL` still points at localhost, so
signing in over the LAN may not complete. Deploying is the shorter route to a
real handset test.

### The chrome's exit — asked and answered, 24 August

**Judged on hardware: the arrival was right and the leaving was not** — too
quick, reading as the bar *vanishing* rather than leaving. **The exit now takes
the return's length, and the two duration tokens collapsed into one `--recede`
at 340ms.** One curve, one duration, four movers.

⚠ **The desk's argument for the asymmetry is what hardware overruled**, and it is
kept in `--recede` because it is the thing that was wrong:

> Going is quicker than coming back, which is the opposite of what looks right
> written down. Leaving is a reply to a gesture the finger is still making, and
> anything slower reads as the chrome hesitating over whether it was asked.

The hesitation 240ms was protecting against never turned up; the abruptness it
bought did. ⚠ **The tokens collapsed rather than being set equal** — two names
that have to stay the same number are a drift waiting to happen — and
**re-splitting them needs a hardware reason, stated in the token.** If the recede
now reads sluggish, that is one number and it moves both directions together.

⚠ **The obvious fix was built first and the measurement is why it did not ship.**
The reading *arrival good, exit bad* looks like a curve problem, since an ease-out
decelerates into its own disappearance — so the exit got the mirror of the
arrival's quintic, to accelerate away instead. Measured, that covers **0% of the
travel by 80ms and 2% by 160ms** of a 240ms exit: the same hesitation the old note
feared, arriving from the other side. `node_modules/.probe/exitcurves.mjs` has the
table for linear, material accelerate, quad, cubic and quintic.

⚠ **Every curve measures 0% at 40ms**, and that number belongs to no curve: it is
the frame or two a scroll needs to reach a render. Read any of these figures from
the *gesture*, not from the transition, or the latency is charged to the easing.

`node_modules/.probe/motion.mjs` is the instrument for any future change — it
samples the bar frame by frame in both directions. After the collapse: **66.7% of
the travel by 120ms going, 54.6% by 116ms coming back**, both of 340.

### Rewriting a line — 24 August

**In place, and that answers the question this document left open.** *In place or
in a detail view* was undecided; a detail view loses to the page's own argument —
it behaves like paper, and paper does not navigate to be written on. Exactly one
line is borrowed as a field for as long as somebody is rewriting it, so the
load-bearing premise is untouched: **lines are still records, and a record is
still not an input.**

**The gesture.** First tap picks, second tap opens the words. The pick is the
common act — settle it, cross it off — so the rare one pays the second tap. While
a line is open, a tap on its own words places a caret rather than resetting the
draft.

**Three exits, and only one discards.** Return and a tap on the paper commit;
blur commits too, because the words on screen are the words somebody meant.
`Escape` alone discards, and it leaves the line *picked* rather than releasing —
so `Escape` steps rather than jumping. ⚠ **Unchanged words write nothing at all**:
opening a line to look at it costs no round trip and no rate-limit token.

⚠ **`Escape` must not call `blur()`, and this is the trap that was caught in
review rather than on screen.** `blur()` fires `onBlur` synchronously, inside the
key handler, where the commit still closes over the draft the discard has only
*queued* — so the one exit meant to throw the words away would have saved them.
Clearing the open id unmounts the field on the next render and React fires no
blur on unmount, which is what makes the discard the whole of what happens.

⚠ **The page-level `Escape` listener does not exist while a line is open**, for
the same class of reason: `release()` commits an open edit on its way out, so it
holds the draft, and a document listener that mounted a keystroke ago would hold
an old one. The field handles its own `Escape` because the field is where the
focus is.

⚠ **The caret is placed at the end, in writing.** Where a focused field puts its
caret is an engine's choice and the four surfaces do not agree — one selects the
whole value, which turns the next keystroke into *replace everything* and loses
the line somebody opened to fix one word of.

**What `setCaptureText` refuses to touch, each for its own reason:**

- **Provenance** — the input to §6's suppression rule. Editing the words of a
  copied capture does not make it yours.
- **State** — a line's words and a line's fate are separate facts, and an edit is
  not a revival.
- **`possibilityId`** — so an edit cannot silently un-resolve *or* re-resolve.
  ⚠ **This leaves a real question for *Resolution offers*:** a capture resolved to
  *Jaws* and edited to read *pottery class* still matches as *Jaws*. It cannot
  happen today because nothing on the page resolves anything yet, and that path
  must decide it deliberately rather than inherit it.

⚠ **No overlap trigger, and that is a finding rather than an omission.**
`fireOverlap` returns early without a `possibilityId`, so **convergence keys on
the possibility and never on raw text** — an edit cannot change what a capture
matches. Do not add a `fireOverlap` call on the assumption that a changed line is
a changed signal.

⚠ **`normalised_text` re-derives itself**, being a generated column over `text`,
so Phase 2's possible-match path stays correct after an edit with no second write
and no chance of the two disagreeing. That is the column comment's own argument
for generating it, arriving where it was predicted to.

⚠ **No client mutation id, unlike creation.** A raw capture has no natural key, so
a retried Return needs one to avoid writing a second line; an edit names the row
it is editing, so a retry writes the same words to the same row and §10's
idempotency comes free.

`node_modules/.probe/edit.mjs` drives all of it at 390px and checks the words
survive a reload. ⚠ **It waits 4s before reloading**: the save is fire-and-forget
by design, and a reload that races it reads the row before the write lands, which
looks exactly like an edit that never persisted. It did, at 900ms.

### The deviations now standing

- **The chrome has its own colour, and no longer spends `--color-accent`.** It
  did until 23 August, and that was the one place this build broke a rule in
  `CLAUDE.md` rather than extending it. `--color-chrome` is `#e8b34a`, lit brass
  — the same hue carried up in lightness and chroma, 10.98:1 on black against
  the muted brass’s 7.73:1 — and it took the mark, both bars’ live glyphs, the
  caret and the mark on a picked line. `--color-accent` is now used by nothing,
  which is what §11 always asked of it. **This does not make Phase 2 easier**:
  overlap still needs a colour that out-shouts a brass screen, and the screen is
  louder than it was, so the candidate to beat is `--color-chrome` rather than
  the muted brass beside it.
- **The record is newest-first, and the caret is at the top.** This document
  specified writing downward and the build shipped it that way; a handset
  reversed it. See *The shape* below, which now carries the reasoning.
- **A line is only as wide as its own words.** The rest of every row is paper.
  The hit area was the whole row, which meant the only place a tap could start
  writing was the leftover space at the end of the page — and leftover space is
  zero the moment the record fills the screen.
- **The paper releases the picked line, and does nothing else.** ⚠ **This
  reverses the second half of the rule above, which said tapping paper starts a
  capture** — it did, for a day. `04d9c4b` removed it: the live line is pinned
  and on screen at every scroll position, so a second way to reach it was a
  second way to reach something already in reach, and a large invisible target
  beside every line collides with the record's own gesture. `d526d0b` then gave
  the paper the job it was actually missing. Picking had **no inverse**: `pick`
  is not a toggle, so re-tapping the words re-picks them, and the only exits
  were Return, crossing off, settling, or reaching back up to the live line.
  Tapping beside a selection to drop it is the one gesture everybody already
  has. ⚠ **It must not raise the keyboard** — picking blurs the field on purpose
  (*the keyboard follows liveness*), so the gesture that undoes a pick lands
  back in the browsing state it came from rather than overshooting into writing.
  `Escape` does the same on the desk, which has no *tap beside it*.
- **The words that are not in the record yet are italic, and the record steps
  back behind them.** Italic is a rule rather than a badge — *italic is not in
  the record, roman is* — so Return turns one into the other and the vocabulary
  teaches itself with no legend, no icon and no copy. It is type because §11 says
  type is the entire design, and because every other channel is spent: colour is
  held (`--color-chrome` means *a control*, `--color-accent` is held for
  overlap), and a rule, box or badge are ruled out where `picked` is defined.
  ⚠ **Dimming the live line was asked for twice and refused twice** — a
  crossed-off line is already struck *and* dimmed and the live line sits directly
  above it. `5e89431` inverted it instead: the **record** holds its recede for as
  long as the draft is unsent, which buys the identical contrast with no
  collision and leaves the words being typed the brightest thing on the page.
  ⚠ The objection recorded against dimming — *it reads as the app doubting what
  it has already promised* — was measured on lines **in flight**, committed and
  waiting on the network. Nothing is promised about an unsent draft, so that
  finding does not transfer; the collision is the reason.
- **The drawn caret is the size of the face, not the size of the line.** It was
  26px, picked as "almost a line" off the 28px line box. A native caret is drawn
  to **ascent + descent at the font size**, which for Fira Sans at 18px is 22px —
  so the drawn caret on an empty line and the real one that replaced it on the
  first keystroke were never the same object. ⚠ **Face-dependent: measure again
  if the interface face changes**, never scale it. ⚠ **A native caret cannot be
  screenshotted** — it is composited outside the captured surface, so Playwright
  never sees it headed or headless. The two carets cannot be matched by eye or by
  pixel on any one engine, which leaves one face metric feeding both as the only
  way they agree on four surfaces.
- **The camera and search are present and off at every state**, including the
  camera the table above has lit on an empty page. Neither is built; a control
  that cannot act goes off. The table is what they go back to.
- **Settle asks one question and the word is *Again?*** — the design drew none,
  and nothing about a raw capture can answer it. Yes → `go_back_to`, No →
  `done`.
- **The tray is one surface**, `/settled`, with each row carrying its own word.
- **A second tap opens the words, in place** — see *Rewriting a line* above.

The full reasoning for each is in `docs/decisions.md`, *Phase 1: the page and
Return — 23 August*.

---

## Why the vocabulary is not a later step

The agreed order was: design Home, then settle the vocabulary, then build. The
first two are the same artefact, and the code says so.

`COLLECTIONS` in `lib/vocabulary.ts` — Wants, Go-back-tos, Fixtures, Archive —
is the app's single navigation axis. `COLLECTION_FOR` derives it from
`CaptureState`, and `lib/domain.ts` aliases `CaptureState` to the five
film-first `EntryState` values with a note saying exactly when the alias should
stop being one:

> when the outcomes do generalise, this is the line that stops being an alias,
> and `PUBLIC_STATES` is the line that has to be re-derived beside it.

So *what are the lists* and *what are the lists called* cannot be answered in
either order.

## The shape: the page is the app

**The landing screen is a blank page you type down.** Not a capture field
pinned above a list — the page itself is the record, empty on first run and
filling as you write.

- **One line is one capture.** Return commits the line and drops to a fresh
  one, so a run of captures is a run of Returns and nothing else.
- **The newest line is the first one.** The caret sits under the bar and the
  record runs back in time beneath it.

  ⚠ **This is the third position this document has held**, and the loop is
  worth stating plainly. An early draft specified newest-first. It was reversed
  to *you type downward, oldest at the top*, on the reasoning that you do not
  write a note upwards — which is true of a note and turned out not to be the
  point. It went back to newest-first on 23 August, on a handset, for two
  reasons a desk could not produce: what you just wrote is on screen without a
  scroll to the end of the record, and **a caret pinned under the bar cannot be
  covered by a keyboard rising from the bottom of the glass.** The second one
  removed a whole class of problem rather than solving it, which is why the
  metaphor was the thing that gave way.
- **No rules between lines.** 18px on 28px leading, 8px of padding each side to
  reach a 44px target without anything visible saying so. A page, not a table.
- **Four routes go away with it** — `/wants`, `/go-back-tos`, `/fixtures` and
  `/archive`. Everything active is on the page; everything settled is behind
  the tray.

⚠ **Nothing in the app can cause an open.** No feed, no notification in
Phase 1, no streak. Every open is caused by something in the world — a shelf, a
poster, a sentence at a party — so the whole design answers one requirement:
**open, typed into, and closed in under five seconds, one-handed.** Until
convergence exists in Phase 2, the app has to win on capture speed alone, which
sets the bar precisely: if typing into Again is not faster than typing into
Notes, there is no reason to use it.

## Liveness, and the difference between picking and editing

**The page is not a text buffer.** Only the bottom line is live. Every line
above it is a *record*, not an input — which is already true and was being
pretended otherwise: a committed line can be struck through, carry a year, or
carry a thumbnail, and none of that is text.

Once that is admitted, the collision disappears:

- **Tap the words and the line is picked.** One meaning, no modifier, no hidden
  gesture. ⚠ The words, not the row: a line’s hit area is the width of its own
  text, and the paper beside it **releases the picked line** — it does not start
  a capture, which it did for one day in August. See *The deviations* above.
- **A second tap edits**, turning that record back into an input. Picking is
  the common act — settle it, cross it off — and editing a captured line is
  rare, so the rare one pays the second tap.
- **The keyboard follows liveness.** Up on a cold open, because capture is why
  the app was opened. Gone the moment a saved line is picked.

The picked line is marked by a short brass bar **in the gutter, not in the
text** — the caret's own width and colour, so it borrows a vocabulary the page
has already taught, but outside the line rather than claiming a character
position. No highlight, no box.

⚠ Without this, tapping a line to settle it would place a caret and start an
edit instead. The fix is not a modifier gesture on an always-editable page; it
is removing the premise that every line is a live input.

## The two bars

**Bar — the page and where you go:** the wordmark, undo, the settled tray, you.

**Foot — the tools:** cross off, settle, camera, search. **The same four at
every width**, including the desk.

The split decides placement, and it is worth stating because it was got wrong
twice. Search is not per-line: it answers *where is that thing I wrote in June*.
The camera is not per-line either — it *starts* a capture. Neither belongs in a
group hung off the line the caret is in, and on the desk that error was visible
as a magnifying glass sitting inside an active input, which reads as a search
box.

### Controls go off; they do not disappear

**The bar keeps its full shape and dims what cannot act.** This is what stops a
blank page reading as an unfinished one, and it is the whole of the density
device — seven controls on an empty first run, five of them off.

Off is `--color-text` at 28%, a fade like `--color-muted` rather than a new hex.

Three foot states, and they are the app's honest answer to what is available:

| state | cross off | settle | camera | search |
|---|---|---|---|---|
| empty page | off | off | **on** | off |
| mid-line, nothing saved | off | off | **on** | **on** |
| a saved line picked | **on** | **on** | **on** | **on** |

The camera is the odd one because a photograph starts a capture rather than
acting on one.

⚠ **No rule above the foot.** `shell.tsx` carries no `border-t` or `border-b`
anywhere, and Notes has none either — space does the separating, 26px on the
handset and 28px on the desk. A rule was correcting for a collision that
padding prevents outright.

⚠ **The scrolling area needs bottom padding equal to the foot's height**, so a
line always comes to rest above the glyphs rather than sliding under them. That
is the reason the rule is not needed, and it is the thing to build rather than
reinstating one.

## Undo and the ×, which are not the same gesture

They both make a line stop being current, they sit in different bars, and the
difference is load-bearing:

- **Undo deletes.** `undoCapture` removes the row — the single exception to
  §5.1's *nothing is ever deleted* — bounded in SQL against `created_at` and
  refusing anything already resolved. For a line that should never have
  existed. Afterwards there is no record that it did.
- **The × writes `dropped`.** A resolution, not a delete. The row stays where
  it is, struck through and dimmed, and the same × puts it back. For an
  intention that lapsed. `dropped` is deliberately not in `PUBLIC_STATES`, so
  it is private but preserved.

The bar's undo glyph carries the ten-second window: brass while live, off once
past. That is Notes' own undo/redo grammar doing real work, and it replaces
both the inline undo control and the retreating hairline an earlier draft
proposed.

⚠ **The confusable moment is narrow and real.** For ten seconds after a line
lands, both controls are lit and both act on it, and nothing says one erases
while the other strikes through. Undo being dark almost always is most of what
keeps them apart. If that proves too thin on hardware, the fix is a word rather
than a glyph on the undo — not a new colour.

## Every capture carries text

**A photograph is not a capture until it is captioned.** The camera opens a
fresh line with the image already on it and the caret waiting; Return commits
the caption, and until then there is no record.

This is a product rule with two engineering consequences worth having:

- **Nothing is inert.** A photo with no text would resolve to nothing and match
  nothing — legal under the spec, which lets unmatched captures persist, but
  dead weight for the whole convergence mechanic. The rule removes that case.
- **The matching path never handles a textless capture**, which is a real
  simplification for Phase 2.

**The image rides the line**, in the same slot a resolved capture's year takes,
so a picture never costs the page its rhythm — one line is still one line, and
tapping it opens the picture.

⚠ It also means the camera cannot be a one-tap capture: shoot, type, Return.
Worth checking on hardware that the caption step does not make photographing
slower than simply typing the thing.

⚠ §6's requirements for user images are the heaviest item on the Phase 1 list —
object storage outside Postgres, size and type limits, EXIF stripping, an
access-controlled media path, retained provenance, reportable and removable
assets. A storage layer, not a button. Schedule it accordingly.

## Suggestions never gate the save

A capture is complete when it is saved. A provider suggestion may arrive
afterwards, may be wrong, and may never arrive at all.

Saved → line → *then* a quiet offer, if there is one. Answering it resolves the
capture; ignoring it leaves the capture raw, permanently and legitimately —
§13 requires that an unresolved capture can be offered a resolution "without
being silently converted or matched", and that provider failure does not lose a
capture.

Provider failure is therefore not an error state. It is the absence of an
offer, logged and invisible.

The offer reuses the resolve flow's existing Yes/No pair rather than inventing
an accept control. Ignoring it is simply not answering.

## Colour, and what colouring the chrome cost

The chrome is brass — the bar, the foot, the caret, the picked-line mark.

⚠ **This spends `--color-accent`, which §11 reserves for overlap and nothing
else.** It was chosen deliberately with that cost stated, and it is the one
place this design breaks a rule in CLAUDE.md rather than extending it.
**Overlap needs a different colour in Phase 2**, and the ladder back is §11's
own argument: the accent's job is to interrupt, so its replacement has to
out-shout brass on a screen that is now full of it. Pick it when Phase 2 has
something to show, not now.

⚠ **`--color-caret` (teal `#3fbfae`) can be deleted.** Its own note says: *if
it is ever used for anything other than the caret, delete it instead* — a third
colour is only defensible for a claim the other two cannot make. With a
coloured chrome the caret is brass, and teal makes no claim any more.

One accent on the screen. `--color-active`, `--color-live` and `--color-listed`
belong to surfaces this design replaces and go with them.

## The glyph set

**Seven glyphs, one grid: `viewBox="0 0 20 20"`, rendered at 20px,
`stroke-width="1.25"`.** That is the geometry `ProfileIcon` and the masthead
`SearchIcon` already ship with, so the effective stroke is 1.25px on every one
and the set matches the app's real icons rather than only matching itself.

⚠ **Do not scale a glyph from another viewBox into this one.** The earlier
draft mixed viewBoxes 12, 16, 20 and 22 at a single rendered size, which put
four different effective stroke weights in one bar — the cross-off came out at
2.29px beside a 1.25px camera. Redraw on the grid instead.

Two of them are a deliberate pair:

- **The tray** (bar) is a plain tray: a *place* you go.
- **Settle** (foot) is the same tray, identical in width and height, with an
  arrow dropping into it: an *action*.

The arrow is the only difference between the noun and the verb.

⚠ **The settle glyph replaced a tick, and the tick was wrong.** A tick beside a
line someone is typing reads as *submit* — which Return does — not as *I have
done this thing*. It was read that way on first sight, which is the evidence.

⚠ **The tray glyph replaced three horizontal lines**, which is the hamburger
menu everywhere on earth. §11 permits *known* icons; that one is known for
something else.

## The words

| today | becomes | on screen |
|---|---|---|
| `want` | `active` | no label — it is the page |
| `go_back_to` | `again` | **Again** |
| `fixture` | `have` | **Have** |
| `done` | `done` | **Done** |
| `dropped` | `dropped` | struck through, in place |

*Again* is the argument. `go_back_to` was chosen because it states the entry
criterion, and the criterion generalises perfectly — a film you would watch
again, a place you would go again, a class you would take again — while being
the app's own name.

*Have* is the generic of `fixture`. The distinction `landsIn` encodes is real:
an experience you can repeat versus a thing you now possess.

⚠ **`PUBLIC_STATES` is re-derived here, not renamed.** It is currently
`want, go_back_to, fixture` and must stay a positive list of three:
`active, again, have`. The failure direction is the point — a state added and
not listed is invisible rather than published. Renaming the array's members in
place without re-reading it against the new set is the one edit in this phase
that can leak someone's private rows.

### Types and intentions

§3's possibility types and intentions replace `Kind` and `Intent`:

| today | §3 |
|---|---|
| `film`, `book` | media |
| `place` | place |
| `object` | product or object |
| — | service, activity or experience, event or occurrence, other |
| `see`, `read` | consume |
| `try` | experience or try |
| `own` | buy or acquire |
| — | visit, learn, other |

`see` and `read` both collapse to `consume`, and that is fine: the label they
drove was never a property of the intention alone. `VOCABULARY[kind][intent]`
becomes `VOCABULARY[type][intention]` — media + consume reads *watch* for a
film and *read* for a book — so the table generalises rather than being thrown
away.

⚠ **The new requirement is the empty case.** Every label is currently reachable
only through a known `kind` and a known `intent`, and `specFor` throws when the
pair is missing. A raw capture has neither, and raw captures are the point of
the phase. Every derivation must answer for `(undefined, undefined)` — and the
answer is usually to say nothing at all, because a capture with no type and no
intention is just its own text. A resolved line says the little it can: a
trailing muted year, and nothing else.

`V1_KINDS` has nothing left to guard once any text is capturable, and it goes.

## What the data layer must stop doing

⚠ **`toLegacyEntryCards` drops every capture with no possibility.** It is
`rows.flatMap(...)` returning `[]` when `!possibility || !capture.intent`.
Harmless today because every write still resolves a film. The moment raw
captures exist, anything reading through it loses them silently — the worst
failure shape available, because the row is in the database and not on the
screen.

It dies with the legacy screens. Nothing in Phase 1 may add a caller.

## Removed when the page lands

No flag, no dormant surface:

- `components/cinema-wall.tsx`
- `components/poster-wall.tsx`
- `components/poster-tiles.tsx`
- `app/(app)/wants`, `go-back-tos`, `fixtures`, `archive`
- `toLegacyEntryCards`, `V1_KINDS`
- `--color-caret`

Kept: `film-screen.tsx` as the media-resolved detail surface, `entry-row.tsx`'s
cross-off treatment, the search field and provider, `shell.tsx` reduced to the
two bars.

## Not in Phase 1

Mutual tracks, sharing, overlap and the QR handshake are Phase 2. The page is
built private: a capture's visibility is whatever the migration left it, and
nothing in this phase changes it or exposes a control that does.

⚠ Every capture in production today is private, and that was contingent on the
population being the author plus test accounts — not a principle. Phase 1 does
not get to rely on it.

## Reading back

**A capture app nobody reads back is a diary**, so this is the difference
between the product and a worse Notes. After three months the page is two
hundred lines in the order they were typed.

⚠ **Nothing the app knows in Phase 1 can answer *what could I do tonight*.**
Possibility type exists only for resolved lines, and most lines are raw.
Location is Phase 5. Offers and occurrences are a later sourced layer.
Manufacturing the signal means asking somebody to categorise, which §2 forbids
at capture — so the question is deferred honestly rather than answered badly.

**Reading back is narrowing, not sorting.** Three parts, and two of them exist
already:

1. **The tray does the heavy lifting.** Settled captures leave the page, so
   what remains is only live intention. That is the largest single reduction
   available and it costs nothing new.
2. **Search** finds the thing you can name.
3. **The page groups by the day it was written.** Newest under the caret,
   running back in time, each day announced by a quiet mono stamp — `stamp` in
   `app/globals.css`, which is §11's own reserved use for mono. It asks nothing
   of anybody, it uses a column the record already has, and it makes two
   hundred lines navigable by *roughly when* rather than by scrolling.

⚠ **Not a sort control and not a filter chip.** A page you wrote does not
reorder itself, and a row of filters would be the organisation §2 says happens
after capture — being demanded before it.

⚠ Browsing by kind, place or time-of-day waits for the signal to exist. When
types and location arrive, this is the section that gets revisited, and the
constraint that governs it is Release 1's: an explained, user-controlled local
relevance result, never a recommendation feed.

## How long an offer stands

**Forever, quietly.** No expiry — any number would be a constant tuned to
nothing, and an unanswered question is not wrong, it is unanswered.

Instead the offer uses picking:

- **Shown in full while its line is live or picked** — so it arrives visibly at
  the moment of capture, and comes back whenever the line is pointed at.
- **Otherwise the line carries a trailing muted `?`**, in the same slot a
  resolved line's year takes. One character, no glyph, no new vocabulary.

⚠ **Ignoring is not No.** *No* is an answer: it records that this possibility
is not the one, and the `?` goes. Ignoring leaves the mark standing
indefinitely, which is correct — §13 requires that an unresolved capture can be
offered a resolution without being converted, and a question that expires on
its own has quietly answered itself.

## Still open

- ~~**The stable client mutation id.**~~ **Answered, and it cost no column.**
  `captures.client_mutation_id` and its unique key on (user, id) have been in
  the schema since Phase 0, waiting for a writer — so the one place this phase
  was not going to be schema-free turned out to be schema-free after all. The id
  is minted once per line in `lib/mutation-id.ts`, held with the line, and
  re-sent unchanged by a retry. ⚠ `crypto.randomUUID` is gated on a secure
  context and is missing on `http://192.168.x.x` — which is how a handset
  reaches a `next start` on the desk — so it falls back to
  `crypto.getRandomValues`.
- **Whether the settled tray is one surface or three** (Again / Have / Done).
  The states stay distinct either way; this is only how they are reached.
  **Built as one**, `/settled`, with each row carrying its own word — so
  splitting it later is a routing change and nothing that reads `WHERE_IT_IS`
  moves.
- ~~**Whether editing a committed line happens in place or in a detail view.**~~
  **Answered 24 August: in place.** A detail view loses to the page's own
  argument — it behaves like paper, and paper does not navigate to be written on.
  `setCaptureText` exists now. See *Rewriting a line*.
