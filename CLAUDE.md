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

## Where the build stands — 30 August

**Phase 0 is done, deployed and verified.**

**Phase 1 is built, deployed and in daily use on a handset.** `/` is the capture
page in production; the poster wall, `components/shell.tsx` and the four
collection routes are deleted. Nothing is held back. Five things are outstanding
and none of them is a screen that does not work — the vocabulary migration
(deferred, and the only non-additive one), a `kind` that is not a film, the thing
detail view, a Blob store for the photographs already built, and the
five-second acceptance criterion, which was closed by direction and never
stopwatched. `docs/re-direction/phase-1-capture.md` is the register.

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

**Phase 2's matching engine is deployed and nothing reads it.** `tracks`,
`lib/overlap.ts` on both triggers, the suppression rule and `notifications` rows
written in the same transaction all exist and run — and **no surface in the tree
reads `notifications`**, so the fan-out has never been proved end to end with two
accounts. There is no overlap list or detail, no QR handshake, and no
possible-match prompt. ⚠ **Overlap joins on `possibility_id`, so only *resolved*
captures converge, and TMDB is the only catalogue** — today two people can
converge on a film and on nothing else. See §13 of the implementation
specification, which now carries this as Phase 2's status.

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
- **A line is only as wide as its own words.** Tap the words to pick the line;
  tap the paper to let it go. ⚠ **A second tap on the words did the rewriting
  for a day and does nothing since 25 August** — the foot's pencil is the one
  door, so a tap on a line means *pick* and never two things depending on the
  tap before it.

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
August. No line of the record is ever an input. Rewriting is the foot's pencil,
and only the foot's pencil.

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
- Six notification kinds, and that is the complete set. No digests, no streaks,
  no re-engagement.

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
**`--color-accent` is used by nothing**, which is what this rule always asked of
it. The collision was removed rather than corrected for — see *How things get
fixed*.

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

**Overlap still needs a different colour in Phase 2, and picking it is Phase 2's
first visual decision.** Splitting the token did not make that easier — the
accent's job is to interrupt, and the screen is now louder than it was, so the
colour to out-shout is `--color-chrome` rather than the muted brass beside it in
the palette. Do not pick it before there is a convergence to look at.

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
