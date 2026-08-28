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

## Build status — 25 August

> **Built, deployed, migrated and seen on a handset — 25 August.**
>
> **Everything on *Still to build* is built, and nothing is held back.**
> `origin/main` is `0942423`. Migrations `0009` and `0010` are applied to
> production.
>
> ⚠ **They were applied a day late, and production was down for it.** The three
> commits carrying them — resolution offers, the derived intention, photographs
> — were deployed while `0009` and `0010` sat applied on `development` only, so
> the page's read selected `captures.suggested_possibility_id` from a table that
> did not have it and **every signed-in request was a 500** until the morning of
> 25 August. Additive columns and no data lost; the whole cost was the outage.
> The Phase 0 runbook says *migrate production first, deploy second*, in those
> words, and this register said the same. Saying it was not enough.
>
> ⚠ **What went wrong was the register, not the runbook.** This section and the
> memory beside it both recorded the migrations as applied to production.
> Neither had asked, and both sounded certain. **`npm run migration:state`
> asks** — host first, then the applied count, then whether the columns the page
> reads exist; it writes nothing, so it is safe against any branch.
> `scripts/prod-check.sh` and `scripts/prod-migrate.sh` wrap it for production.
> Do not record what state production is in. Ask it.
>
> ⚠ **Nothing in this repository can take the production credential** — it is a
> Vercel *sensitive* value that nothing reads back, including the dashboard, and
> `vercel env pull` redacts it. It comes from `neonctl`, which is what the
> wrappers do, and every command needing it must be one shell because an
> exported variable does not outlive the command that set it.
>
> **Everything in the page has now been seen on hardware and judged good**, the
> 23 August evening's work and the 24th's alike. What is left in Phase 1 is a
> list of things not built, not a list of things unverified — with one exception,
> named below.
>
> ⚠ **The four-second capture is closed, at the user's direction on 24 August —
> and it was never stopwatched.** The register says *accepted*, not *measured*,
> because those are different claims and only one of them is true. The screen
> was used on hardware and judged good; nobody timed it. The reasoning for
> wanting the number is kept under *What hardware answered* unchanged, because
> anyone reopening Phase 1's acceptance starts there rather than from this line.
>
> ⚠ **The chrome's exit was the open UX item and it is closed.** The recede was
> judged too quick on hardware on 24 August; the exit took the return's length,
> and the two duration tokens collapsed into one `--recede`. See *The chrome's
> exit* below — including the mirrored exit curve that was built first and
> measured before it could ship.
>
> ⚠ **The three things the handset said about editing are answered, and the
> answer was to delete the field.** The rewrite happens in the pinned band now —
> see *What the handset said about editing* below, which is a record of what was
> reported and what it turned out to be. **None of it is verified on hardware
> yet**, which is the one thing outstanding on this page.
>
> ⚠ **The line's controls now actually follow the last character, which they
> did not when that was first built.** The row was made inline flow on 25 August
> so a wrapping capture would stop stranding its × and pencil at the margin —
> but the words stayed a `<button>`, and **a button cannot be inline**: every
> engine computes `inline-block` for it, so the box never fragmented and the
> tail landed after the *box*, which is the flex behaviour that change set out
> to remove. The words are a `<span role="button">` now, and the last word is
> bound to the tail in a `nowrap` box so a tight last line brings the word down
> with the glyphs rather than leaving them behind. Measured on the real page at
> 390, 1024 and 1440, then **seen and accepted on a handset and on a desktop on
> 25 August** — see *The gesture, and the door*.
>
> ⚠ **The second tap no longer edits, at the user's direction on 25 August.**
> The foot's pencil is the only door to a rewrite; a tap on a line means *pick*
> and nothing else, and a second one does nothing. It was kept as an accelerator
> when the glyph shipped on the 24th, and that is what came out — see *The gesture,
> and the door* below and `docs/decisions.md`, *The second tap stops editing,
> because the pencil is a door*.
>
> **The installed app re-enters on resume, since 25 August.** It used to never
> reload until it was force-quit, which made every report from it a question
> about which build was running. Becoming visible now reloads the page — but
> **only while it is settled**, and somebody using the page is never settled, so
> it cannot fire under their hands. Verified on a handset across all four cases:
> a line written on the desktop arrives, a half-typed line survives, the undo
> window holds, and a record paged back through is kept. See *Resume is a load*
> below.
>
> ⚠ **The handset reported three things on 26 August. Two are fixed, one is a
> decision.**
>
> - **The undo did not sit on the line, and it was two faults at once.** The
>   line's type lived on the words while the row around them was still the
>   page's body 15/1.45 — and `vertical-align: middle` centres a box on its
>   *parent's* x-height, so every glyph riding a line was aligned against the
>   wrong face. Measured 3.29px under the words' cap centre. The type moved to
>   `page-row`, `page-words` is deleted, and `line-glyph` replaces
>   `align-middle` throughout: the box is exactly the line box, top-aligned, so
>   the glyph lands on the line's own centre with **no face metric anywhere in
>   it**. Now 6.00px above the baseline, which is the line box centre to the
>   pixel. The hit area went 34px → 44px as a side effect, and every row still
>   measures 44px. Separately, `UndoGlyph` was the one drawing of eight not
>   centred in its own 20-grid — ink at 10.75 against a box centred on 10 — and
>   is redrawn. `node_modules/.probe/glyphline.mjs` and `linealign.mjs`.
> - **The blink was behind the writing pane on glass**, because `rest()` was a
>   no-op on a coarse pointer — the keyboard stayed up for a run of captures —
>   so `writing` was still true at the instant a line landed. A lift over the
>   pane shipped first and **was deleted the same day**: seen on a handset, the
>   answer came back that the line should not settle back behind the glass at
>   all. ⚠ **A commit ends the writing mode now, and on glass gives the keyboard
>   back** — `done()` in `page-screen.tsx`, taking the pane's own
>   `blur()` + `setWriting(false)` door. Once a line is submitted the person is
>   presumed done; another capture is a tap back into the live row. That removes
>   the condition, so the lift and its token are gone with it.
>   `node_modules/.probe/submitdone.mjs` shows the pane down, the field blurred
>   and the record at full strength at the instant the line lands.
> - ⚠ **The live row was left alone on the 26th and the whole design of it was
>   replaced on the 27th.** A 50-character capture overflowed the band by 92px on
>   a 390px handset while the same words land in the record as two lines, and an
>   `<input>` cannot be panned on glass. Leaving it was the answer for a day;
>   asked again, the direction was to have the scrolling, and the measurement
>   that settled *how* is `node_modules/.probe/panfield.mjs` — **Chromium already
>   pans a focused input and iOS does not**, so writing our own pan would have
>   been a second pan on Android and a platform branch everywhere. **The field is
>   summoned instead**: the foot's `+` raises a sheet on the bottom edge of the
>   glass that grows with the words, so a long capture wraps and there is nothing
>   off screen to reach. See *The field is summoned* below.
> - ⚠ **The sheet's box was tweaked on the 28th, on both surfaces at once** —
>   *too tall on the handset, too narrow on the desk*, directed after the first
>   look at it. **68px became 44px** by deleting `--sheet-lead` and
>   `--sheet-tail` rather than shrinking them: the field wears `page-line`, so
>   the row already carries a hem a side, and the sheet was buying the same gap a
>   second time. What is left is one line of the record exactly, which is also
>   `--tap-floor`. **The column became `--sheet-measure`** — `--page-measure`
>   plus the tool stack's width and inset on both sides, 54rem, which is
>   `--breakpoint-stack` by construction — so on the desk the sheet spans the
>   width the page's furniture already stands across and the field starts under
>   the `+`. On a handset the viewport is narrower than the cap, so the width
>   changes nothing there. ⚠ The sheet stopped previewing the record's line
>   breaks, and that is accepted: the report asked that a long capture wrap, not
>   that it wrap in the same places. `node_modules/.probe/sheetdesk.mjs` measures
>   both surfaces and `sheetcrop.mjs` crops the row on each.
>
> - ⚠ **One line, everywhere — the 28th, second pass.** Directed after seeing the
>   first: *all entries written on one line, never more than one*, and the same
>   for the live row. Entries `truncate` in a flex row, so the words hug their own
>   text and give up width to the tail; the field is `--leading-line` tall and
>   scrolls **vertically inside itself**. ⚠ That is not the 27 August report
>   returning — vertical overflow in a textarea is an ordinary scroll on every
>   engine, where horizontal overflow in an `<input>` is a selection gesture on
>   every engine. **Never swap that element for an `<input>`.** Deleted with the
>   wrapping: the last-word split and its nowrap binding, the two-halves a11y
>   dance, `grow-field`, and `--sheet-cap`. Given up: a long capture can no longer
>   be read in full from the record — nothing is truncated in storage, but reading
>   one takes the pencil. `node_modules/.probe/oneline.mjs` and `onepick.mjs`.
>   ⚠ **44px is the floor and it is now reached**: hem + line + hem, which is also
>   `--tap-floor` and the hit area of every control on a row. Going below it means
>   taking the record's own type down, which nobody has asked for.
>
> - ⚠ **The field slides — the 28th, third pass, and the element is an `<input>`
>   again.** Directed: *when the caret reaches the end of the row, the text
>   already written moves out of the far edge, leftwards or rightwards depending
>   on the language.* That is a one-line field's own behaviour, so nothing in the
>   CSS produces it; `dir="auto"` supplies the direction from the first strong
>   character typed. Measured on a 390px handset: `scrollLeft` +508 in Latin, −85
>   with `direction: rtl` in Arabic, the field 28px and the sheet 44px throughout,
>   the record untouched at one 44px row per entry.
>   `node_modules/.probe/slide.mjs`. ⚠ **The 27 August cost is back and was
>   accepted with it stated first**: on a handset the words that have slid off are
>   reachable by caret, selection and Home but *not by swiping the row* —
>   `panfield.mjs`. Both swaps of this element are recorded in CLAUDE.md, because
>   the next reader will assume one was a mistake.
>
> - ⚠ **The handset's writing box is the line — the 28th, fourth pass.**
>   Directed: *only tall enough to contain the one line.* 28px on glass, 44px on
>   the desk; `--sheet-hem` is zero below `--breakpoint-stack`, the row wears
>   `sheet-row`, and the type is otherwise identical to a record line. ⚠ **The
>   chips keep their 44px** — `sheet-glyph` hangs the whole overhang upward over
>   the scrim instead of splitting it, because half of `line-glyph`'s split would
>   land on the keyboard. **A hit area does not have to be inside the box it
>   belongs to**, which is why the short box and the tap floor are not in tension.
>   Hit-tested rather than reasoned: `elementFromPoint` returns the chip across
>   the whole 44px. `node_modules/.probe/shortbox.mjs` and `shorthit.mjs`; the
>   record stays at one 44px row per entry in both.
>
> ⚠ **None of the seven is verified on hardware**, which is now the one thing
> outstanding on this page.

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
| `components/keyboard-hem.ts` | the page's floor, and the band's own top edge |
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

### Still to build — and nothing is, except one thing that is not this phase's

⚠ **Everything on this list is struck through as of 24 August.** Two entries
carry a qualifier rather than a tick, and the qualifiers are the point: one is
*closed without being measured* and one is *built without ever having run*. A
struck line here does not mean *seen working*.

- ~~*The chrome's exit*~~ — **done**, see that section below.
- ~~*Editing a committed line*~~ — **done**, see *Rewriting a line* below. The
  question this document left open is answered: **in place**.
- ~~*The four-second capture, with a stopwatch*~~ — **closed at the user's
  direction, and ⚠ never stopwatched.** *Accepted* and *measured* are different
  claims and this register only makes the first. It was item 1. The reasoning is
  kept under *What hardware answered*, unchanged, because it is still the honest
  account of what the page has and has not proved, and anyone reopening Phase 1's
  acceptance starts there.
- ~~*Search over captures*~~ — **done**, at `/search`. See *Search* below.
  `search-field.tsx` and `search-provider.tsx` still search TMDB and are still
  mounted by nothing; they belong to *Resolution offers*, not to this.
- ~~*An Earlier control*~~ — **done**, and it is at the **tail**: the record is
  newest-first, so earlier is downward. See *Earlier* below. ⚠ It is a **cursor**
  and not the `offset` this list predicted.
- ~~*Resolution offers*~~ — **done**, and ⚠ **it is the first Phase 1 deploy to
  carry a migration.** Additive only: two nullable columns, so a revert push is
  still a rollback. See *Resolution offers* below. `film-screen.tsx` is still
  kept — it is the media-resolved detail surface and nothing on the page opens
  it yet.
- ~~*Images*~~ — **built**, and ⚠ **the upload path has never run**: there is no
  Blob store on the project, so the camera ships dark and lights the day one
  exists. See *Photographs* below for what is verified and what is not.
- **The words, in the schema** — ⚠ **deferred at the user's direction, 24
  August, and it is the one item nothing here has touched.** `STATE_WORD`
  carries the words on screen; the Postgres enum still reads `want`,
  `go_back_to`, `fixture`. It is deferred because it is the **one migration
  that is not additive**: renaming enum values ends the revert-push rollback
  permanently, where the two that shipped are nullable columns old code ignores.
  It wants a phase that plans a down migration. ⚠ When it runs, **`PUBLIC_STATES`
  is re-derived rather than renamed** — see the warning under *The words*.
- ~~*The types and intentions of §3*~~ — **half done, and the other half is not
  this phase's to ship.** The intention is derived now and `'go_back_to'` is no
  longer a constant in `resolveCapture`; the kind is still only ever `film`. See
  *Have is still not reachable* below, which names what is missing rather than
  leaving it to be rediscovered.
- ~~*`toLegacyEntryCards` dies*~~ — **done, and it was hiding rows.** See
  *What the shared page was not showing* below. It was filed as a cleanup and it
  was a correctness fix.

### What hardware answered, and what it did not

The page was opened on a handset on 23 August and it works. Two things were
waiting on that, and they came back differently.

**1. The keyboard pin — the dangerous half is gone by construction.** The worry
was the live line ending up behind the keys on a long page. It cannot: the caret
is the first thing in the document now, pinned under the bar, so a keyboard
rising from the bottom of the glass has nothing to cover. That is a subtraction
rather than a fix, which is the order `CLAUDE.md` asks for — the condition was
removed, not corrected for.

`components/keyboard-hem.ts` still holds the page's floor clear of the keys and
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

### Photographs — 24 August

**A storage layer, not a button**, which is what the list said. Vercel Blob, at
the user's direction.

⚠ **The second additive migration**: `captures.image_path`, nullable. Old code
ignores it, so a revert push is still a rollback — and like `0009` it has to
reach production **before** the code does.

⚠ **The camera is dark until a Blob store exists.** `imagesAvailable()` reads
`BLOB_READ_WRITE_TOKEN`, and without it the glyph goes off — a control that
cannot act, which is the foot's own rule. **So deploying with no store is a
deploy without photographs rather than a broken one**, and the preflight says so
as a *notice* rather than a failure, which is what stops a dark camera being
investigated as a bug.

⚠ **The store is DEFERRED at the user's direction, 25 August: nothing that costs
money gets built for now.** Vercel Blob is a paid add-on past its free
allowance, and it is the only thing between this path and its first execution.
The intention is lodged rather than dropped — see *Photographs wait for a store*
in `docs/decisions.md` for what to do when it is time (a dashboard action, no
code change, no migration) and for the warning that matters:

> **The first photograph anybody attaches is also the first test of three
> files.** The strippers have four unit tests because a surviving GPS tag has no
> symptom; the round trip — upload, store, read back, render — has none, because
> there has never been anything to run it against.

⚠ **The glyph moved to the live row on 25 August and was read as a bug within
minutes.** It sat among five in the foot for a day without comment; alone on the
row somebody is always looking at, the first question was *what does it do, it
can't be pressed?* That is *controls go off; they do not disappear* meeting a
surface it was not written for — the rule exists to hold a **bar's** shape so a
blank page does not read as unfinished, and the live row is not a bar. Left as
it is, and recorded, because the next person to see a dark paperclip will ask
the same thing and the answer is *there is no store*.

**What is stored, and where.**

- ⚠ **`access: 'private'`.** An unguessable public URL is **not** an
  access-controlled media path (§6): it is a secret that leaks the first time
  somebody shares a link and cannot be revoked without deleting the file. The
  store refuses anonymous reads; the token never leaves the server.
- ⚠ **The row holds a pathname, never a URL**, and the client is never given
  either. `/api/media/[captureId]` is the one door and what it checks is *whose
  capture this is* — `getMyCaptureImagePath` filters on the session user, and
  there is deliberately no parameter that widens it. Images on somebody else's
  page are a later question and that is not where it gets answered.
- **404 for both *no such capture* and *not yours*.** A 403 would confirm the id
  exists, which is the one fact the route must not hand out.
- **`Cache-Control: private`**, because a shared cache holding one person's
  bytes under a URL another session could ask for would undo the check without
  touching the code that makes it.

⚠ **EXIF is stripped structurally, not by re-encoding.** A handset photo
routinely carries GPS to a few metres — and `CLAUDE.md` puts continuous location
outside Release 1, so storing a co-ordinate that arrived inside a JPEG would be
that by accident, with no consent step anywhere near it. The three containers
keep metadata in named blocks: JPEG `APPn` and `COM`, PNG `eXIf`/`tEXt`/`zTXt`/
`iTXt`/`tIME`, WebP `EXIF`/`XMP `. Dropping blocks is exact and has no decode
step. **Re-encoding was the alternative and is worse**: a native codec, quality
lost on every save, and every photograph silently rotated by the tag being
removed. ⚠ **Orientation goes with the GPS, and that is accepted** — between a
sideways photo and a stored location, the sideways photo wins.

⚠ **HEIC is refused, and the `accept` attribute is what makes that work.**
Safari hands over HEIC for `image/*`; naming the three types makes iOS transcode
on the way out, which puts the conversion *before* the photograph rather than a
failure after it. No `capture` attribute either — forcing the camera would take
away the library, and *the poster I saw last week* is at least as likely as the
thing in front of you.

⚠ **One call, not an upload then a save.** An upload that returns a pathname
before the capture exists leaves an object in the store the moment somebody
changes their mind — invisible, unreferenced, unattributable. And **the
idempotency check comes before the upload**, so a retried submission does not put
a second megabyte in the store on its way to finding the row. A failed write
takes the object back out, best effort.

⚠ **The preview stays on the line after the save is sent.** There is no id to
ask `/api/media` for until the upload returns — seconds, on a handset — and an
empty slot in the meantime is the app looking like it lost the photograph. The
object URLs are held in a set and revoked on unmount.

⚠ **A line that carried a photograph cannot retry.** The `File` went to the
upload and the page keeps only the object URL, which is a view of bytes the
browser owns. A failed photo capture says so on the line and stops. The
alternative is holding every photograph of a session in memory against a failure
that may not come, on the device least able to afford it — named rather than
hidden.

⚠ **The thumbnail is its own button, beside the words rather than inside them.**
The words are the pick target and the design says tapping the picture opens it;
two targets, two meanings, no modifier. It rides the line in the year's slot at
`--thumb`, which is `--text-line` — **derived from the line, not chosen**, so a
row with a picture is not taller than a row without one.

**What is verified and what is not.** The strippers are covered in
`tests/guarantees.test.ts` — four cases, including one that caught a real bug:
the WebP reader took the chunk size at the *name's* offset, which drops every
chunk after the first. That test is in the guarantees file rather than the
acceptance one because a surviving GPS tag has **no symptom at all**: the picture
looks identical, the save succeeds, the page is right.

⚠ **The upload, the media route and the camera have never run**, because there
is no store to run them against. They typecheck, they build, and the route is
registered. **Nothing about them has been seen working.**

### Have is still not reachable, and this is what is missing — 24 August

`STATE_WORD.fixture` is **Have**, it is in the tray, it is in `WHERE_IT_IS`, and
nothing in the product can put a capture there. That was item 8 on this list,
filed as *the types and intentions of §3*. Half of it is now done and the other
half cannot be done here, so this section says which is which.

**What `fixture` needs is `landsIn`, and `landsIn` needs a kind and an
intention.**

- ⚠ **The intention is derived, since 24 August.** `resolveCapture` reads
  `capture.intent ?? DEFAULT_INTENT[kind]` — see a film, read a book, try a
  place, own an object — which is §4's rule exactly: *derive the label from
  kind + intent, never ask*. **It changes nothing today**, because the only kind
  that exists is `film`, whose default is `see`, which lands in `go_back_to` —
  the same answer the hard-coded fallback gave. What it removes is the constant:
  the day a capture can be about an object, it lands in `fixture` because the
  vocabulary table says so rather than because someone typed `'go_back_to'` in a
  function.
- ⚠ **The kind is not available and cannot be made available here.** A capture
  acquires a kind by resolving to a possibility, and the only catalogue in the
  product is TMDB. Every possibility is a film. **So the missing piece is a kind
  that is not a film**, which means user-contributed possibilities or a second
  catalogue — a later sourced layer with its own provenance requirements, named
  in `CLAUDE.md` under *Release 1 exclusions* as out of scope for now.

⚠ **The tempting wrong fix is a third settle answer.** *Again?* has two, and a
raw capture genuinely cannot answer *have you got one now* — but adding *Have* as
a third button would make the page ask a categorisation question, which §13
forbids, and would put `fixture` on captures with no kind, which is the state
meaning *a thing you possess* applied to a line of text. **Do not do it to make
the word reachable.** A state nobody can reach is a smaller problem than a state
that means nothing.

⚠ **The other tempting wrong fix is asking at capture.** §13 is explicit: the UI
must not ask the user to choose an intention before saving. The specification's
own answer is that an intention *can be refined later*, and **where that
refinement lives is undesigned** — the page's foot is full, and no artboard draws
one. That is the decision this is waiting on, not an implementation.

### Resolution offers — 24 August

**Saved → line → then a quiet offer, if there is one.** A capture is complete
when it is saved (§13); a suggestion may arrive afterwards, may be wrong, and
may never arrive at all.

⚠ **This is the first Phase 1 deploy with a migration, and it is additive.** Two
nullable columns on `captures` — `suggested_possibility_id` and
`resolution_declined_at` — plus one FK. Old code ignores a column it does not
select, so **a revert push is still a rollback**, which is the property the rest
of this phase has kept. ⚠ **The migration has to reach production *before* the
code does**: the page's read selects the new column, so deploying first is a
broken page rather than a degraded one.

**How the question stands.** It is written on the row, not recomputed. That is
what lets an offer stand *forever, quietly* — a record of fifty lines would
otherwise be fifty provider calls per open, answered differently each time, and
a question that disappears when you reload has answered itself.

- **Shown in full while its line is live or picked.** *Live* is the moment of
  capture, so a question arrives visibly rather than as a mark to notice; only
  the newest is held open, or a session of captures ends with ten open questions
  down the page.
- **Otherwise a trailing muted `?`**, in the same slot a resolved line's year
  takes. One character, no glyph, no colour, no new vocabulary — a resolved line
  carries a year there and an offered one carries a `?`, which is exactly the
  difference between them. They cannot collide: an offer exists only on a
  capture that has not resolved, and one that has not resolved has no year.
- **Ignoring is not No.** *No* stamps `resolution_declined_at` — it records that
  this possibility is not the one, the `?` goes, and nothing asks again.
  Ignoring leaves the mark standing indefinitely, which is correct.

⚠ **The suggestion is kept when No is said**, rather than cleared. What was
refused stays known, so a future offer path can ask *has this capture already
been offered this?* and get a true answer.

⚠ **The confidence rule is exact-match on the reduced words, and it is
deliberately blunt.** TMDB is a relevance match ranked by popularity and answers
*something* for almost any string, so taking the top result would put a film
under every capture — *try pottery* offered a thriller called *Pottery*, forever,
on a line that was never about a film. **A wrong offer costs more than no offer**,
because it asks a question somebody has to dismiss. So the bar is that somebody
typed the title and nothing else: *jaws*, *Jaws!*, *  JAWS  * all offer *Jaws*;
*watch jaws tonight* offers nothing. The misses are silent and cost nothing.

⚠ **`looksLikeTheSameTitle` is NOT the normalising rule and must never be used
for matching.** `normalised()` in `schema.ts` is the one implementation of *what
the words reduce to* and it lives in SQL, because rows and queries have to agree
forever. This decides only whether to *ask*: if the two drift, an offer is made
or not made, and nothing is stored under the wrong reduction. Naming them apart
is what keeps that true.

⚠ **Provider failure is the absence of an offer — logged and invisible**, and
both halves are implemented. An outage, a rate limit, a query that matched
nothing and a row that moved all return *no offer* and write one line to the log
saying which. **The words are never logged**: the reason is operational, and the
text that would make the log useful for debugging is the text that would make it
a copy of everybody's diary.

⚠ **Only a real creation is offered anything.** A retry that found the submission
already written is the same line arriving twice; asking again would either write
the same suggestion or overwrite an answer somebody has already given.

⚠ **The Yes/No pair is shared by being the same component.** The design asks for
the offer to reuse the settle flow's pair rather than invent an accept control;
`Question` is that pair, and *Again?* now renders through it too. They are the
same kind of thing — one line of the record asking the person who wrote it to
decide something, both answerable by ignoring.

⚠ **The words never change when an offer is accepted.** §6: the text is what
somebody typed and is never replaced by a suggestion's title. What appears is the
year, in the slot the `?` was in.

⚠ **`intent` stays null on an accepted offer, so the unique key cannot bite.**
The key is (user, possibility, intent) and Postgres treats NULLs as distinct, so
two captures of the same film are allowed — correct, since two captures on
different days are two intentions until something says otherwise. The day intent
is set on a resolution, `acceptSuggestion` has to answer for the collision. It
does not today, and that is stated rather than discovered.

⚠ **No overlap trigger, and that is deliberate.** §6 keys convergence on the
possibility, so accepting an offer is exactly where `fireOverlap` belongs when
Phase 2's second trigger is wired to captures. It is not called because this
phase ships no convergence surface, and a notification nobody can look at is
noise with a delivery cost.

⚠ **No offer on the tray or in search.** A settled capture is one somebody is
done deciding about, and search rows act on nothing — a `?` on either is a
question with no way to answer it. Both reads select a literal `null` rather
than omitting the field, so the shape is one thing everywhere.

**`upsertPossibility` is the one writer**, in `lib/db/possibilities.ts`.
`upsertItem` was the same insert under the legacy name and now delegates to it —
two copies of one upsert over one table is how two callers come to disagree about
what a canonical row is.

`node_modules/.probe/offer.mjs` drives all six claims. ⚠ **It waits for the
question rather than for a duration.** A fixed 3.5s made it lie once: the offer
runs behind the save and takes a provider round trip, so reading the row early
makes a working offer look exactly like a capture the provider had nothing for.
The only case that still needs a duration is proving there is **no** question,
which no event announces.

### What the shared page was not showing — 24 August

**`toLegacyEntryCards` dropped every capture that resolved to nothing**, because
an `EntryCard` has a `kind` and a `title` and no way to say *the words somebody
typed*. Its own note said so, and said the filter removed nothing "today"
because every write still came through the film flow — and that stopped being
true the day raw capture shipped.

⚠ **So since Phase 1 went live, a mutual opening `/u/[handle]` saw none of what
that person had actually written.** Not an empty list and not a partial one: the
rows were absent, with no symptom on either side of the connection. It was filed
in this register as a cleanup — *item 9, `toLegacyEntryCards` dies* — and it was
the only correctness bug on the list.

`toCaptureCard` carries the text, so a raw capture is now an ordinary row.

⚠ **The words are the row, and the title is not shown.** A capture that resolved
to *Jaws* still reads as the words its owner typed. A shared page substituting a
canonical title would be showing somebody's friends something that person did
not write, which is the same reason §6 keeps `text` unreplaced in the column.
The title does the one job only it can: naming the poster for a screen reader.

⚠ **And they are set as lines, not titles.** The row was `title` — the largest
type in the app — because every row used to be a film. A one-line capture at that
size is a headline made out of a note.

⚠ **`specFor` throws on `(null, null)` and it is right to.** Intent is a property
of the entry and `kind` comes from a possibility; a capture with neither has no
want label. It is asked only when there is something to ask about, and the
sub-line renders nothing at all when nothing is known — the old row printed `—`
for a missing year, which was fine when a missing year was the exception and
would be a column of em dashes on a page of raw captures.

⚠ **The state's word wins over the want label**, because it is the one a raw
capture can also carry: *Again* for `go_back_to`, *Have* for `fixture`, and
nothing for a plain want — the same silence the owner's own page keeps.

### Search — 24 August

**`/search`, reached from the foot's magnifier.** *Where is that thing I wrote
in June.*

⚠ **A surface of its own, and it has to be.** It reads across **live,
crossed-off and settled** captures — the page's list is `PAGE_STATES` and the
tray's is the settled three, so search is their union and cannot be a filter over
either. That is not a preference: a line you are trying to find again is usually
one you already dealt with, which is the case the surface exists for.

⚠ **`done` is private (§5.3) and it is in this read.** Safe for exactly one
reason: `searchMyCaptures` filters on `sessionUser.id`. **Nothing derived from
it may be handed to anybody else** — there is no shared search, and adding one is
not a parameter on that function.

⚠ **The normalising rule is written once.** `normalised()` in `schema.ts`
generates `normalised_text` **and** is applied to the query string in SQL on its
way in, so a change to the rule moves the rows and the queries together. A
TypeScript copy of it would be exactly the drift the generated column exists to
prevent, with the same symptomless failure. The refactor that extracted it
produced **no migration** — `db:generate` says the DDL is unchanged.

⚠ **A substring match, not a prefix and not full text.** People remember a word
from the middle of a line as readily as the first, so `LIKE 'q%'` answers the
wrong question; Postgres full-text brings stemming and a dictionary, which are
language choices this product has not made and which mis-serve every capture
written in a script the dictionary does not cover. The cost is carried by
`captures_user_created_idx` — the user's own rows, newest first, bounded by
`limit` (§10).

⚠ **Punctuation alone is not everything.** Normalising a query of pure
punctuation gives the empty string and `LIKE '%%'` matches every row. The action
refuses it with a loose *is there a letter or a digit in this at all* — **not** a
second copy of the rule, which is why the guard is deliberately not the matcher.

**Typed, not submitted**, on a 200ms debounce, and **Return does nothing** — on
the capture page Return commits a line, and a key that means two things across
two screens is how somebody files a search query as a want. Out-of-order answers
are settled by a ticket, not by arrival.

**The answer is held with the question it answers.** One piece of state carrying
`{ q, lines, earlier }`, compared against the field, so a list can never appear
under a query it does not belong to. Clearing by effect was written first and
removed: it is a second writer racing the one that fills them.

⚠ **Nothing here acts on a line.** No pick, no ×, no settle — a surface that
could would need the foot, the undo window and the whole state machine of the
page carried into a second place. Reading is the whole promise.

⚠ **`type="text"`, not `type="search"`, and the widget is why.** The engine
paints its own clear button inside a search field — a bright blue × on a matte
black page, seen on screen. Hiding it with `::-webkit-search-cancel-button` would
be correcting for one engine's decoration on every engine; removing the type
removes it, and `role="searchbox"`, `inputMode` and `enterKeyHint` carry
everything the type was doing.

**The heading is visible, set as the tray sets its own.** A glyph is not a name,
and arriving at a caret in a field with no word for where you are is how a search
field gets typed into as though it were the capture line.

⚠ **The magnifier is the foot's one link**, so it is an `<a>`: everything else
there acts on the line in hand, and a button with a `router.push` looks the same
while losing the middle-click, the long press and the back button. Its off state
is a `<span>` — there is no disabled state for a link.

⚠ **The foot's table deviates in row two.** The design lights search while a line
is being typed with nothing saved; it is lit whenever there is a **record** and
dark when there is not, because searching an empty record can only answer
*Nothing.* and *a control that cannot act goes off* is the rule the rest of that
bar follows. The page's own list is the test, which is not quite the whole record
— a person whose every line is settled has an empty page — and that is named in
the code rather than left to be found: to have settled a line you had to write it
there first.

`node_modules/.probe/search.mjs` drives it: the link, a find with no Return, a
**settled** line found after it left the page, *Nothing.*, punctuation, clearing,
and Return committing nothing. ⚠ It waits on the **undo glyph lighting** rather
than on a duration — a line is not pickable while it is in flight, and a fixed
wait makes the probe a stopwatch on Neon's first connection.

### Earlier — 24 August

**The first read is fifty lines and nothing reached past them.** Fifty is roughly
a month of this, so the gap was never going to be found on the handset in a week
— and a record that keeps growing has lines that cannot be scrolled to, which is
the app losing something quietly.

⚠ **A cursor, not an offset, and this list predicted the wrong one.** `offset:
50` means *skip fifty rows as they are ordered now*, and this record has a live
head: every capture typed since the page loaded pushes one seeded line back into
the next slice, so *Earlier* would hand back lines already on screen. Crossing a
line off does the same in the other direction. A cursor names a place — the
`(created_at, id)` pair the ordering already tie-breaks on — and an insertion at
the head cannot move a place. It is opaque to the client, which passes it back
and never reads it.

⚠ **One row past the slice is how the page knows there is more.** The read asks
for `PAGE_SIZE + 1`, drops the extra, and the fiftieth becomes the cursor. No
count, no second query, and `null` — the record ending — is the only thing that
makes the control exist.

⚠ **The one place on this page that waits.** Every mutation here is optimistic
and sends behind the screen; a read has no result until the server answers, so
there is nothing to be optimistic about. `reading` is what stops a second tap
asking for the same slice twice. **Nothing scrolls** — the lines arrive below the
last one, under a thumb already at the bottom.

**A word, on a page that says nothing.** Everywhere else the page refuses copy
because a gesture carries the meaning: the caret is the instruction, italic is
the state, the mark is the pick. At the end of fifty lines there is **no** gesture
that says *there is more* — scrolling has already stopped — so a door has to be
drawn, and the smallest honest door is the word for what is behind it. It is set
in the day stamps' own mono, because that is the same furniture: the stamps are
how the record is navigated by *roughly when*, and this reaches the days below.

⚠ **The box is the target, and that is what keeps it off the foot.** It shipped
as a bare word with `tap-target`, whose 44px pseudo-element is centred on the
text — so half of it hung below the word, and at the bottom of a scroll that half
is under the foot. Measured: the word's box ended at 799.9 and the foot began at
800. `page-hem` reserves the foot's height so a *line* rests above the glyphs,
and a line is 44px because `page-line` gives it a hem; a 14px word needs the same
thing said its own way. `node_modules/.probe/earlier.mjs` checks the clearance,
that nothing scrolls, and — with a capture typed *after* the page loaded — that
no line comes back twice.

⚠ **`PageLineView` moved to `lib/page-line.ts` with the mapper that builds it.**
Two things produce it now, the route's first read and the action, and a view
shape with two producers drifts. One mapper means a column added to the query
reaches both or neither.

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

**The words come to the writing line, and that answers the question this document
left open.** *In place or in a detail view* was undecided; the answer is neither.
A detail view loses to the page's own argument — it behaves like paper, and paper
does not navigate to be written on — and **in place shipped for a day and was
deleted**, because a field in normal flow breaks every instrument on this screen
at once. See *What the handset said about editing*.

**The page has exactly one field, always.** It is the pinned band, and it holds
either a new capture or the words of the line being rewritten. That makes the
load-bearing premise stronger rather than merely untouched: **no line of the
record is ever an input**, not even briefly.

⚠ **`draft` and `editDraft` are separate state, so nothing is stashed and
nothing can drift.** Opening a line does not clobber a half-typed capture; the
capture is simply not on screen while the line is, and it is handed back
untouched when the line closes. The one that is not displayed is not displayed —
there is no copy to keep in sync.

⚠ **The pick is kept while the line is open**, so the record still carries the
mark on the row the words came from, the foot is still that line's toolbar, and
*let go* still has something to let go of. That is why the field's `onFocus` no
longer clears the pick — **the fifth thing on this page to come off focus** — and
why the two gestures that mean *I am starting a new capture* (a tap on the field,
a keystroke in it) carry that job instead.

**The gesture, and the door.** A tap picks the line; **the foot's pencil is the
one door to a rewrite** — see *The glyph set* and the note in `foot.tsx` for why
the discoverability question was really a consistency question. The pencil goes
dark while a line is open: re-opening it would replace what is in the field with
what is saved, which is a discard nobody asked for.

⚠ **A second tap lifted the words too, for a day, and that is removed (25
August).** Once the pencil existed the accelerator was a second answer to *what
does tapping a line do* — the gesture meant *pick* or *rewrite* depending on what
the previous tap had been, which is the modifier gesture this page rules out
wearing a different coat. **The control won**, because it is the discoverable one
and because a control cannot be triggered by a thumb that lands twice.

**The target, and where the controls land.** ⚠ **The words are a
`<span role="button">`, never a `<button>`.** A button cannot be inline — every
engine computes `inline-block` for it whatever the declaration says — so as a
button the words did not fragment, the box filled the column, and the tail landed
after the *box*: the margin behaviour that inline flow was adopted to remove.
That shipped for a day on 25 August and every wrapping capture wore it. See
`docs/decisions.md`, *A button cannot be inline*.

⚠ **The last word is split off and bound to the tail in a `nowrap` box.**
Everything after the words is an atomic inline that cannot break, so a last line
ending with less than the tail's width remaining would drop the glyphs to the
left margin of a new line, where they read as a separate entry. Bound, the
**word** comes down with them instead. Three cheaper mechanisms were built and
measured and all three fail — inline end padding hangs past the column instead of
forcing a break, the same padding on an empty spacer contributes nothing, and a
word joiner does not suppress a break across an element boundary.

⚠ **The split is layout only.** One half carries `role="button"` labelled with
the whole capture, the other is `aria-hidden` with the same click — one target
for a thumb, one control for a reader, one tab stop per line.

⚠ **The second tap is a no-op rather than a release**, deliberately: letting go
stays a tap on the paper (or `Escape`), the *inverse* of picking. Making the
words release as well would mean a thumb that double-taps a line it meant to
settle un-picks it and darkens the foot it was aiming for.

⚠ **The keyboard is raised by `focus()` inside the tap**, which works because
picking blurred the field on purpose. Nothing about it can move to an effect.

**Three exits, and only one discards.** Return commits, and so does a tap on the
writing pane — which is what the paper is while a keyboard is up. Blur commits
too, because the words on screen are the words somebody meant. `Escape` alone
discards, and it leaves the line *picked* **and leaves you writing**, so it steps
back one state rather than jumping out of all of them: the band goes back to
holding the capture that was in it, with the keyboard still up. A second
`Escape` releases the pick. ⚠ **Unchanged words write nothing at all**: opening a
line to look at it costs no round trip and no rate-limit token.

⚠ **`Escape` must not call `blur()`, and this is the trap that was caught in
review rather than on screen.** `blur()` fires `onBlur` synchronously, inside the
key handler, where the commit still closes over the draft the discard has only
*queued* — so the one exit meant to throw the words away would have saved them.
Clearing the open id is the whole of what happens.

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
survive a reload. It now also checks the three things the band model is for:
**the field is inside `live-band`, `scrollY` does not move when a line opens,
and the band carries no `transform`** — plus that the record holds no `<input>`
at all, and that a half-typed capture comes back untouched.

⚠ **It waits 4s before reloading**: the save is fire-and-forget by design, and a
reload that races it reads the row before the write lands, which looks exactly
like an edit that never persisted. It did, at 900ms.

⚠ **Nothing in it counts taps against a fixed number any more.** A line is not
pickable while it is still in flight, so "one tap picks" was timing the network;
each step drives the page until it is in the state it wants and reports how many
gestures that took. ⚠ **And the release taps the paper *beside* the first line,
not below the last one** — below the record is the foot, and a tap that lands on
a dark glyph does nothing, which reads exactly like a release that did not work.
That cost a debugging pass.

### What the handset said about editing — 24 August, answered

**Reported minutes after `0d72b1d` deployed.** Three things, and the report is
kept verbatim below because the diagnosis turned on a detail of it.

**1. Without scrolling first, double-tapping a line moves the row.** It shifts —
down, probably. Then tapping *outside* the line that was double-tapped makes **the
top banner recede**, with no scroll to explain it.

**2. After scrolling down, double-tapping a line makes the row descend** far
enough to obscure some of the entries. Tapping elsewhere returns it to the top.

**3. Two design questions:** how would anybody know a second tap edits, and
should a line be editable at all.

#### 1 and 2 are one bug, and the hypothesis in the register was right

**The register's first suspect was this phase's own change, and it was.**
`useKeyboardHem` had been given `writing || editing !== null` so a record line
being rewritten would get the band held off the status bar — and the band's
correction is a thermostat that puts it on the **visible** top edge. With iOS
having over-scrolled the layout viewport to reveal a focused in-flow field, the
visible top edge is well down the glass, so the band went down there and covered
the record. That is both reports: a small shift at the top of the page, where
there is little room to over-scroll, and a descent after scrolling, where there
is a lot.

The second half of report 1 is the same over-scroll reaching the other
instrument: `useChromeRecede` watches a mark in the document, so it read the
keyboard's arithmetic as a reader scrolling and took the bar away — "with no
scroll to explain it" is exactly what a transient looks like when something
believes it.

⚠ **The fix is not three corrections, it is one deletion.** Every instrument on
this page is built on one premise: **there is one field and it is pinned.** A
field in normal flow breaks it three ways — the recede is lied to, the band is
corrected for a field that is not it, and a keyboard can cover the line being
written, which is the exact defect pinning the live line was built to remove.
Correcting each leaves a race at the moment the line is let go, while the
keyboard is still closing and the over-scroll has not unwound. **So the second
field is gone and the rewrite happens in the band**, which returns both hooks to
what they were before this feature existed. `CLAUDE.md`: remove the condition
rather than correct for it.

⚠ **What is verified and what is not.** `edit.mjs` shows `scrollY` unmoved, no
`transform` on the band, and no `<input>` anywhere in the record — on the desk,
which has no software keyboard. **The handset has not seen it.**

#### 3 — both answered

**Should a line be editable at all? Yes.** A capture is one line typed fast and
one-handed with autocorrect on, so typos are certain; §5.1's ten-second undo
already concedes exactly that at creation and leaves a typo found later with no
repair at all. And *Resolution offers* matches capture **text** against a
provider — a mangled line can never resolve. Not editable means a permanently
wrong record. ⚠ Nothing here is *nothing is ever deleted* being weakened: a
rewrite changes words, and the × is still the only way a capture leaves the
live view.

**How would anybody know? The foot.** ⚠ **The discoverability question was really
a consistency question.** Cross off and settle are controls in the foot;
rewriting was a secret gesture — and all three are the same kind of thing,
something you do to the line you have picked. So rewrite joins them as a fifth
glyph. A legend, an icon with copy, or a hint are all still ruled out; none of
them was needed.

⚠ **The second tap survived as the accelerator for a day and then did not (25
August).** Consistency was the argument for the glyph and it is the argument
against keeping both: with a pencil in the foot, a tap on a line answered *pick*
or *rewrite* depending on the tap before it, and a gesture whose meaning depends
on history is the modifier gesture the section above rules out. One control, one
meaning. See *The gesture, and the door*.

⚠ **A drawn caret on the picked line was the other candidate and it is rejected
on its own terms.** The page has already taught that a caret means *writing
happens here* — but on a picked line the next keystroke does **not** go there,
because it takes another tap. A caret that lies about where typing goes is worse
than no caret at all.

### Resume is a load — 25 August

The component header has always said this page *"owns the page for the length of
the session and reads the server again on the next load"*, and that is the right
design: Return has to land in under a frame, so the client owns the list, there
is exactly one list, and there is no reconciliation. **An installed app has no
next load.** It resumes the same document for days.

**The harm is not staleness, it is silence.** A capture written on the desktop
never appears on the handset, so the record there is *short and does not say so*
— you check it, fail to find what you wrote, and write it twice. That is the
same class as the two guarantees in `lib/db/`: a bug that costs trust rather
than function. Freshness for its own sake would not have been worth a mechanism.

**`router.refresh()` does nothing here**, which is what decided the shape. It
hands down a new `seed` prop that `useState`'s initialiser, having run once on
mount, ignores. Making it work means teaching the page to merge two lists —
which rows are server truth, which are optimistic and unacknowledged, which are
locally deleted but inside their undo window — and that is precisely what the
header says this component does not do.

So the condition is removed rather than corrected. On becoming visible, and only
while the page is **settled**, it re-enters. A re-entry re-seeds; it does not
merge, so there is still exactly one list.

**Settled**, and the list is the strictest term:

- no draft, and not `writing`
- nothing `picked`, no open rewrite, no `asking`
- no photograph waiting for its caption, no picture open full size
- the undo window closed
- no read in flight, and *Earlier* unused this session
- **no line `pending` or `failed`** — the first has not been saved and the
  second exists nowhere else, so re-entering over either destroys work

Somebody using the page is never settled, so this cannot fire under their hands.
Somebody who put it down is settled by definition, which is when they wanted it.

⚠ **Re-entry is cheap here by construction, and that is the argument for it.**
The live line carries `autoFocus`, so the page returns in its resting state; the
caret is at the top and the record beneath it, so scrolling to the top loses no
position. This page was built to be re-entered. It picks up new code as well,
which is the same stale-document problem wearing its other hat.

⚠ **`paged` is new state because `earlier` could not answer the question.** It
is non-null on arrival for anybody with more than a page of record, so it says
there *is* more, never that anybody went and got it — and a record paged back
through is a view built a tap at a time that a re-entry would throw away.

⚠ **`offering` is deliberately not in the gate.** An open offer is shown in full
while its line is *live or picked*, and live means the moment of capture, which
a resume has already ended; it returns as the trailing `?`, like every other
line's question. Gating on it would mean the one path that most needs a
re-entry — capture on the phone, put it down, come back — is the one path that
never gets one.

⚠ **No timer, and the reason is not battery.** That was the first argument made
against one and it was the weak one. The real one: a clock fires while somebody
is looking, and re-entry is exactly what must never happen to a page in
somebody's hands. Visibility cannot do that — by construction it fires when they
were not looking.

⚠ **Two screens open at once is not covered, and that is accepted.** Nothing
became hidden, so nothing becomes visible; a line written on the desktop while
the handset is awake and showing the page appears the next time the page is
returned to. Covering it properly costs the merge above. It is bounded by the
handset's own auto-lock in the meantime, and a person looks at one screen at a
time.

**Verified on a handset, all four cases**: a desktop line arrives on return, a
half-typed line survives backgrounding, a capture inside its ten seconds keeps
its undo, and a record paged back through is kept.

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
- **The foot's pencil lifts the words into the band, and it is the only door** —
  see *Rewriting a line* above. ⚠ **In place shipped for a day and is deleted.**
  The page has exactly one field and it is the pinned one; that is what every
  instrument on the screen is built on, and it is what the day of in-place
  editing broke. ⚠ **The second tap shipped for a day too and is deleted (25
  August)**: with a control in the foot it made a tap on a line mean two things
  depending on the tap before it.

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
- **A tap on the words means *pick* and never anything else.** A second tap edited
  for a day in August and does not since the 25th: the foot's pencil is the one
  door to a rewrite, so a tap on a line cannot also be one. A second tap does
  nothing at all — releasing stays a tap on the paper.
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

**Eight glyphs, one grid: `viewBox="0 0 20 20"`, rendered at 20px,
`stroke-width="1.25"`.** ⚠ **It was seven until 24 August**, when the foot took
a pencil — see *What the handset said about editing* for why the door had to be
visible. That is the geometry `ProfileIcon` and the masthead
`SearchIcon` already ship with, so the effective stroke is 1.25px on every one
and the set matches the app's real icons rather than only matching itself.

⚠ **Do not scale a glyph from another viewBox into this one.** The earlier
draft mixed viewBoxes 12, 16, 20 and 22 at a single rendered size, which put
four different effective stroke weights in one bar — the cross-off came out at
2.29px beside a 1.25px camera. Redraw on the grid instead.

⚠ **The camera is a paperclip since 25 August, and it is one glyph rather than
one per surface.** The control opens a file picker: on the desk that is a hard
disk with no camera near it, and on glass the input carries no `capture`
attribute *on purpose*, so the library is offered beside the lens. The camera
promised the lens and only the lens on both. The obvious reading of the report
— paperclip on the desk, camera on glass — would have been a platform branch
bought to keep a drawing that was wrong either way.

⚠ **It still takes pictures and only pictures.** `accept` names JPEG, PNG and
WebP, and the strippers in `lib/media` know those three containers. A paperclip
is the honest drawing for *choose a file from your disk*; it is not a promise
that this has become a place to put documents. Widening it is a media-storage
decision with provenance and rendering behind it, not a change of glyph.

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
