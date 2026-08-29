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

## Where the build stands — 25 August

**Phase 0 is done, deployed and verified.**

**Phase 1 is built, deployed, migrated and seen on a handset.** `origin/main` is
`0942423`. `/` is the capture page in production; the poster wall,
`components/shell.tsx` and the four collection routes are deleted. Migrations
`0009` and `0010` are applied to production. Nothing is held back.

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

- **The box never changes; the contents and the ground do.** The strip is
  `--line-hem` + `--leading-line` + `--line-hem` = **44px** — a row of the
  record, `--tap-floor`, and exactly what the handset's foot already measured
  (9 + 26 + 9). Nothing new was chosen. Idle it is glass with the record
  dissolving under the glyphs; writing it is `sheet-lit`, opaque, because it
  holds body text at the record's own size and a line showing through would read
  as a second line of the capture. ⚠ **The light on that ground is a handset's
  only, and the desk has none — directed 29 August.** `--sheet-light` is
  `--row-light` on glass and `none` above `--breakpoint-stack`; the opacity is
  `--sheet-tint`'s job — `--color-bg`, the page's own black — so the guarantee in
  this sentence is untouched by the glow going. It is a token that differs by
  surface, the same shape as `--sheet-hem` and `--text-mark`, rather than a rule
  the desk overrides.
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

⚠ **`--sheet-hem` is a hem on glass and a hem and a half on a desk**, both
`--line-hem` scaled and neither typed. It was `0px` for an hour — the box as
literally the line — then half a hem, and it is a whole one because a strip with
two states can only have one height. ⚠ **Air goes above and below, never below
alone**: bought only on the keyboard's side it is the *gap under the characters
that is not matched above* all over again, in miniature.

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
- **`--sheet-measure`, and it is not `--page-measure`.** The column plus the tool
  stack's width and its inset on **both** sides — 54rem, the same sum as
  `--breakpoint-stack` and for the same reason — so the sheet spans exactly the
  width the page's furniture already stands across, its left edge on the stack's
  left edge and the field starting under the `+` that summoned it. Below that
  width there is no stack, the viewport is narrower, and `gutter` caps the sheet
  at the glass, so **nothing about a handset changes**.
- ⚠ **The sheet no longer previews the record's line breaks, and that is
  accepted.** One measure used to do both jobs. What the report asked for is that
  a long capture *wrap at all* rather than scroll out of reach, and it still does.

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
