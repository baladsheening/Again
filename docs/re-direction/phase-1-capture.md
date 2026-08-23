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
- **You type downward.** Oldest at the top, newest above the caret. This
  reverses the newest-first ordering an earlier draft of this document
  specified, and it follows from the page: you do not write a note upwards.
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

- **Tap picks.** One meaning, no modifier, no hidden gesture.
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
3. **The page groups by the day it was written.** Oldest at the top, newest
   under the caret, each day announced by a quiet mono stamp — `stamp` in
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

- **The stable client mutation id.** Phase 0 ships none — the unique key on
  (user, possibility, intent) carries idempotency, and a raw capture has no
  such key. §13's exit criterion requires one, so it is Phase 1's to introduce,
  and it is the one place this phase is not schema-free.
- **Whether the settled tray is one surface or three** (Again / Have / Done).
  The states stay distinct either way; this is only how they are reached.
- **Whether editing a committed line happens in place or in a detail view.**
  The second tap has to turn a rendered record back into an input either way.
