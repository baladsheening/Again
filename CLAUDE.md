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

## The direction — 11 September

⚠⚠ **THE PRODUCT IS A POSSIBILITY NETWORK, NOT A PRIVATE CAPTURE APP WITH A
SOCIAL FEATURE.** An outside read of the plan said the build was *a better
private capture product than a social/networking product*, and it was right.
**The central weakness named: a convergence produces a notification, not an
opportunity.** The read is kept verbatim, with nine amendments, at
`docs/re-direction/view.md`.

⚠⚠ **`docs/re-direction/product-truth.md` IS ONE PAGE AND WINS OVER EVERY
OTHER DOCUMENT IN THIS REPOSITORY, THIS FILE INCLUDED.** Read it first.
`consumer-product-strategy.md` is its long form and the consumer tiebreaker;
**Amendment 10** is the translation into the specification;
`current-code-audit.md` is the comparison with the tree in four buckets —
aligned, premature, missing, contradictory. ⚠ **The superseded briefs moved to
`docs/re-direction/inactive/` on 11 September**, the front page's among them:
a document in an active folder gets opened.

> Again turns the private things I want to do into real-world opportunities when
> someone I trust wants the same thing.

- ⚠⚠ **ALL FOUR OF AMENDMENT 10'S RELEASE 1 BLOCKERS ARE BUILT — 11
  September**: convergence on wording, the way out, the matching consent, and
  earned push. `current-code-audit.md` is the comparison in full. ⚠ **What is
  left is not code**: §6's beta in one named high-density community, and the
  three funding parameters in `consumer-product-strategy.md` §10.

⚠⚠ **THE FRONT PAGE SHOWS WHAT YOU CAN ACT ON, THEN THE RECORD — 12 September,
directed:** *we really need to redesign the front page handset home app layout.*
**Measured first, and the number is the whole argument: at 390×844 the bar ran
0–48, then NOTHING until the composer's strip at 620.** 572px — **68% of a
handset** — black.

- ⚠⚠ **THE HOLE WAS DUG FOR THE RAIL AND AMENDMENT 10 THEN BANNED IT.** 7
  September cleared this page so the keyboard could be judged with one variable
  on screen; 11 September put *a global or random browse rail, image-only tiles,
  and the opening count* in the Release 1 exclusions. **So two thirds of the
  screen were being reserved against a feature that is not coming back.** That is
  the bottom-third floor's fault exactly — *holding a third of the screen against
  nothing* — deleted the same week on the same grounds, at half the size.
- ⚠⚠ **AND THE PAYOFF WAS NOT ON THE SCREEN PEOPLE OPEN MOST.**
  `product-truth.md`: *a convergence has to produce an opportunity, not a
  notification.* It was a 26px glyph in the foot whose door is
  `router.push('/record?portal=1')` — two screens away — with 572px of black
  above it. **The band is that thing, on that screen.**
- ⚠ **Three bands, in the product's own order: the convergences, then your
  record, then the composer in the thumb.** ⚠⚠ **AN OPPORTUNITY-ONLY HOME WAS
  THE OTHER READING AND IS REFUSED: on the median day there are none, and the
  void comes back with a better excuse.** The space has to be filled by something
  that exists on an ordinary day, and only your own record qualifies.
- ⚠ **`PAGE_SIZE`, never a home-sized number**, and **no `earlier` cursor** — the
  record has a screen and the foot is one tap from it. **Home is a window on the
  record, not a second copy of it.** ⚠ `searchable` went from a `limit: 1` read
  to `rows.length > 0` and now costs nothing.
- ⚠⚠ **`PageLines` IS EXTRACTED FROM `search-screen.tsx` VERBATIM AND THAT IS
  DESIGN RULE 3 MADE TRUE BY CONSTRUCTION.** *One object has one height wherever
  it appears* — **34px on home, on search and on the record**, asserted. ⚠ **No
  `'use client'` in it**, which is what lets both have it: search pulls it into
  the bundle, home renders it to markup that never crosses the boundary. **Do not
  add a hook to that file** or home starts paying for search's interactivity.
- ⚠⚠ **A ROW ON HOME DOES NOT OPEN A CONSOLE, AND THAT IS `foot.tsx`'S OWN RULE
  RATHER THAN AN OMISSION** — *a console only exists where the record is*, which
  is why the portal's door here navigates rather than opening a box it cannot
  fill. Search sets the same precedent: *a control that cannot act is worse than
  no control, because it looks like one.* ⚠ **The alternative is a navigation on
  every row tap**, at the 0.35–1.74s this file measured the same morning.
- ⚠⚠ **`--sheet-block` WAS ALREADY THERE AND HAD NOTHING TO RESERVE FOR SINCE THE
  RAIL WENT.** The composer has measured its own **border box** with a
  `ResizeObserver` since 6 September; `<main>`'s reserve reads it. **A `calc` of
  the band, the card's padding, two lines, the foot row and the hem would be five
  numbers to keep in step** with a box that changes height when somebody writes,
  when a failure line appears and when the desk's root scale ramps. *Measure the
  thing, never re-derive it.* ⚠ **Plus `--keyboard-overlap`**, because the strip
  rides up over the keys and its height does not change when it does.
- ⚠⚠ **THE FOOT LOST ITS GROUND, AND THIS FILE'S OWN DOCBLOCK PREDICTED IT IN
  WRITING.** `compose-screen.tsx`, 5 September: *what this costs, and it is not
  payable yet: the foot loses its ground… **invisible today** — the page behind
  it is black — and the question comes back the day the browse half lands. **Do
  not pre-build a ground for it; look at it then.*** It was looked at: **record
  lines ran straight through the hem and collided with the glyphs.** ⚠ **It is
  the record rather than the browse half and the note is otherwise exact.**
- ⚠⚠ **ONE BACKDROP FILTER, MOVED FROM THE CARD TO THE STRIP — WHICH KEEPS THE 5
  SEPTEMBER ARGUMENT RATHER THAN BREAKING IT.** That day said *a backdrop filter
  filters what is behind it including the outer one's result… a glass card inside
  a glass box is not the console.* **The nesting argument still holds; what
  changed is what is behind the strip.** The strip is the lens (`--glass-tint`
  over `--glass-blur`, byte for byte the record's idle strip) and the card is a
  **tint on it with no filter of its own** — so the card reads **darker** than it
  did, the hem and foot get the ground the record's foot already has, and there is
  still exactly one filter. ⚠ **No `stack:translate-y-full`**: the record's strip
  hides on the desk because it has nothing to rewrite; this one is the composer.
- ⚠ **The band has no cap, no count and no heading**, and draws **nothing at all**
  when nothing is waiting — §5 forbids the portal a number, §6 forbids explaining
  an absence, density rule 2 forbids a heading over a list that reads as one. ⚠
  **Requests stay behind the door**: `Accept` and `Decline` act on a relationship
  rather than on a line. ⚠ **Nothing is marked read by being seen here** —
  `readPortalLine` is the portal's alone, so the band is the unread queue and
  self-bounding.
- ⚠ **The portal's rows are read only when the cheap bit says there are any.**
  `listMyPortal` is a join the record's page refuses to put in front of every
  capture. **Stated cost: whoever HAS a convergence pays a second, serial round
  trip before first paint** — it cannot join the `Promise.all`, being conditional
  on its answer. ⚠ **The lever if it shows is one `Promise.all` and everybody
  pays the join** — not a cache, and not a client fetch after paint, which would
  make the band arrive late on the screen whose content must not move.
- ⚠⚠ **FOUR PROBES WERE ALREADY RED BEFORE THIS SESSION TOUCHED ANYTHING, AND
  THAT IS THE MOST IMPORTANT LINE HERE.** `sheetjolt.mjs` and `frontpage.mjs`
  pinned `--tap-floor` for a foot row that became **42.25px that same morning** —
  the entry that changed it re-ran footparity, bandink, stripstep and
  traysightline, and **those two were not in the list**; `frontpage.mjs` also
  compared the composer's padding to a console whose horizontal inset had moved
  to its scroller hours earlier; `recordfade.mjs` clicked
  `button[aria-label="Write a capture"]` — **the `+` the 5 September split
  deleted** — and had timed out before a single assertion for seven days, the
  third instance of the rot `swipe.mjs` and `console.mjs` carried; `askthem.mjs`
  clicked **row one** and expected a convergence there, which twenty probe seeds
  had pushed off the top. ⚠ **A probe that pins what another seed left at the top
  is asserting what other seeds do.** All four fixed against derivations and
  states rather than literals.
- ⚠ **`recordfade.mjs`'s desk half drove `/` while asserting the RECORD's
  translate-off** — it moved to `/record`, which is where that claim lives.
- **Measured by `node_modules/.probe/homerecord.mjs`** — 12 assertions: the
  record is drawn, the page scrolls, a line is the same object on all three
  surfaces, the reserve **is** the measurement, the last line clears the strip,
  the strip is the lens and the card declares no filter, and the band is asserted
  **both ways**. ⚠ **Its first run read `.page-row` and reported the record as
  five lines long** — that is the band's box, the portal's own; the record's is
  `.page-line`. **168 tests green**, typecheck, lint and build clean; `frontpage`
  all ok, `footparity` 13/13, `traysightline` 8/8, `sheetjolt`, `askthem`,
  `recordfade`, `matchingconsent`, `console`, `akin`, `dupe`, `reenter` and
  `navpending` all green.
- ⚠⚠ **AND THE BAND IS A CARD — 12 September, directed:** *some separation from
  the list below, maybe by positioning the textbox inbetween the two?* **The
  instinct was right and the mechanism is refused by a tombstone.** They did run
  together: a convergence line and a record line are the same type at the same
  size, so the only thing parting them was `TODAY` in tracked mono.
- ⚠⚠ **THE TEXTBOX CANNOT BE THE DIVIDER, TWO WAYS.** In flow it is the 7
  September revert — `writing-sheet`'s tombstone: *it landed too high, sometimes
  VANISHED ON TAP and never came back, and doubled on the way out.* Kept `fixed`
  but moved up, **the composer's position becomes a function of how many
  convergences you have: measured at 62.84px each**, so the send arrow sits at
  y=198 with none and y=512 with five, and on the ordinary day it is at the top
  of the screen, out of the thumb. ⚠ **Everything keyed to the bottom edge goes
  with it** — `--keyboard-overlap`, `sheet-over-keys`, the band's close, the
  foot's close, the recede — and those exist because a software keyboard is about
  to cover the bottom of the screen.
- ⚠⚠ **A CARD IS WHAT THIS APP ALREADY SAYS FOR *THIS IS NOT THE RECORD*, TWICE**
  — the console is one, the portal is one on a scrim, the composer is one. So the
  screen reads **[opportunities] · TODAY · your lines · [composer]**: the two
  cards are the two things that are not your record. ⚠ **It also bounds a long
  band**, which a run of loose lines could not.
- ⚠⚠ **`--color-surface` AND NO FILTER, WHICH IS THE ONE DETAIL THAT IS NOT
  OPTIONAL.** The console and the composer are glass because the record passes
  under them at full strength; **this card is in flow with nothing behind it but
  the page**, and 38% black over black is black — the 5 September bug exactly,
  and the console's own answer: *its ground lifts toward `--color-surface`
  rather than sinking toward the page, because a floating card has no borrowed
  edge.* ⚠ **`1rem` and `--page-lead`, which is what `portal-card` declares** —
  but **not that utility**, whose `flex: 0 1 auto`, `min-height: 0` and own
  measure are all about living inside a fixed positioner.
- ⚠ **One number on all four edges — measured 20 / 20 / 20 / 20**: the lead under
  the bar, the card's padding head and foot, and the gap down to the record's
  first stamp. ⚠ **`last:mb-0` on the sentence**, or the row gap lands inside the
  card's own padding and the foot reads 30 against the head's 20. ⚠ **Stated
  cost: the band's words are inset 20px from the record's**, which is the card
  being a card. ⚠ **It scrolls away rather than pinning**, because the portal is
  arrival.
- ⚠⚠ **AND TWO MORE PROBES WERE DEPENDING ON WHAT OTHER SEEDS LEFT BEHIND.**
  `askthem.mjs` needed a converged line on the record and **there were 0 in a
  page of 50**; `akin.mjs` carried *seed first: `node scripts/seed-akin.mjs`* in
  its header and timed out the moment a portal seed added three rows, an hour
  after passing 10/10. **Both run their own seed now** — a seeded line is the
  newest capture and therefore on page one by construction. ⚠ **A precondition a
  person has to remember is one that quietly stops holding.** ⚠ **And the
  portal's console was the wrong route to test**: `page-screen.tsx` passes it
  `convergence={null}` deliberately, *so a console inside the portal would not
  say the sentence twice*. `reenter.mjs` has the same dependency but **reports
  its skip out loud** (9/9, not 11/11), which is why it is left alone.
- ⚠⚠ **THREE FAULTS IN THE FIRST MESSAGE BACK, AND ALL THREE WERE MINE — 12
  September:** *the console is grey. Why did you give it a different aesthetic?
  And why on the home page can I scroll horizontally unlike on the record page?
  And why should crossed out entries have locks?*
- ⚠⚠ **THE GREY WAS THE CONSOLE'S DESK BRANCH ON A PHONE.** `console-card` is
  `--glass-tint` over `blur(--glass-blur)` on a handset — measured
  `rgba(0,0,0,0.38)` / `blur(18px)` — and `--color-surface` arrives only above
  `--breakpoint-stack`. **The note quoted in support of the fill (*its ground
  lifts toward `--color-surface`*) is about that branch**, and an opaque grey
  plane is a surface this app does not otherwise have. ⚠ **Glass could not
  simply go back**: this card is in flow with nothing behind it but the page, and
  38% black over black is black. **So the boundary is drawn rather than filled —
  `border-rule`, the ink `add-person.tsx` and the console's own footer button
  already use.** The page's ground runs straight through the card.
- ⚠⚠ **THE HORIZONTAL SCROLL WAS `page-lines.tsx` MISSING `truncate`, AND THE
  ROOT IS THAT SEARCH'S ROW HAD NEVER BEEN MEASURED AGAINST THE RECORD'S.** It
  was extracted verbatim from `search-screen.tsx` — `min-w-0 flex-1`, no
  truncation — so a capture with one long unbroken token had nothing to wrap at
  and **took the document's width with it**. The record's rule is from 28
  August: *the record is an index, not a document. Every line truncates to one
  line.* ⚠ **Two further divergences went with it**: `flex-1` pushed the year and
  the padlock to the far right where the record draws them beside the words, and
  **the year sat INSIDE the truncating span**, so a long line ate its own year
  first. ⚠⚠ **EXTRACTING A COMPONENT FOR DESIGN RULE 3 AND THEN TAKING THE
  LOOSER OF THE TWO ROWS IS THE WHOLE MISTAKE** — the point was one object, and
  the object was the record's.
- ⚠⚠ **NO PADLOCK ON A CROSSED-OFF LINE, ON THE RECORD TOO.** `lib/overlap.ts`
  names no `dropped` row, so **a struck line converges with nobody** and being
  held out of the pool can have no consequence while it is struck. **It is 12
  September's own ruling about the mark arriving at the other glyph in the same
  row** — the akin asterisk two blocks down was already gated on `crossedOff`;
  the padlock was the last thing there claiming something the engine has refused.
  ⚠ **Nothing is destroyed** — `shared` is untouched, so the same `×` brings it
  back. ⚠ **The `sr-only` note takes the term too**: *what the screen shows, the
  label says* cuts both ways.
- **Measured by `node_modules/.probe/rowparity.mjs`** — 9 assertions on all three
  surfaces. ⚠⚠ **ITS SEED IS ONE 90-CHARACTER UNBROKEN TOKEN, AND THAT IS THE
  POINT OF THE FILE**: a long *sentence* wraps at its spaces and widens nothing,
  so **a probe seeded with ordinary words passes on the broken build** — the
  first diagnosis found no overflow at all, because every seeded capture was
  three short words. ⚠ **It reads `whiteSpace`/`textOverflow` off the computed
  style, never the class attribute**, and it **drives** the lock and the
  cross-off rather than seeding them, then puts the line back and proves the
  padlock returns. **168 tests green; every probe green.**
- ⚠⚠ **THE BOX IS GONE AND SO IS THE DATE — 12 September, reported: *still looks
  crap. And why do you have the date alongside any home page entry?*** Both
  answered, and the first one is the third attempt at the same question.
- ⚠⚠ **A DAY STAMP IS THE ARCHIVE'S FURNITURE.** It earns its place on `/record`,
  where it organises everything ever written and is the only thing that does, and
  on search, where a result from June is meaningless without its day. **Home is
  neither**: it shows the newest end of the record beside a box you are about to
  type in, *when* is the one question nobody is asking there, and the answer is
  nearly always today. ⚠ **`TODAY` in tracked mono caps is the loudest thing the
  record's type scale has**, spent on the least informative line on the screen —
  density rule 2 at its clearest. `PageLines` takes a `stamps` prop; **the
  grouping is untouched in the data and only the heading is withheld.**
- ⚠⚠ **THE BAND'S BOX WAS WRONG TWICE AND THE FAULT WAS THE SHAPE, NOT THE
  FILL.** It shipped as `--color-surface` — *grey*, and that is the console's
  **desk** branch — then as a `border-rule` outline, and that was reported too.
  **§11: *matte black, legible text… type is the entire design.* This app has no
  static boxes.** Every box in it is a surface that floats over the record for a
  moment — the console, the portal, the composer's card, which is a box because
  you type into it. **A bordered rectangle in the flow is the one thing on the
  page that is chrome for its own sake**, and it read as a settings panel in an
  app whose identity is not having one.
- ⚠ **Offering *a card like the console* as an option was the mistake upstream of
  both attempts**: the console is not a card **in flow**, and that could have
  been checked before two versions of it were looked at.
- ⚠ **The separation is air, and the band parts itself typographically anyway** —
  every row there carries a muted sentence under it and no row of the record
  does, which is a bigger difference than a rule. **`--page-lead` × 1.6 below,
  against `--page-lead` above**: a boundary has to read as a boundary rather than
  as the next row's breathing. ⚠ **Compact — the capture and the sentence on one
  line — was rendered and refused on evidence**: it truncated to *portal see…*,
  and the thing you both wanted is the worst word on the screen to cut, which is
  `portal.tsx`'s own argument for the sentence going underneath.
- ⚠⚠ **AND THE GLOW BEHIND THE MARK IS DELETED — directed: *get rid of the
  lobes.*** Nine radial lobes under a two-gradient mask, `--mark-glow-a` … `-i`
  plus a reach, width, lift, drop and bleed, and about 400 lines of `globals.css`
  arguing them. **Built and approved on 2 September; this is a later direction
  and it replaces that one.**
- ⚠ **Removed, not switched off** — *How things get fixed* reaches for removing
  the mechanism first, so there is no token at zero and no dormant utility to
  rediscover. ⚠ **Nothing else read any of it**: the tokens were the utility's
  alone and the utility had one caller. **`--mark-column` stays** — it is the
  mark's band on the desk and `--record-measure` derives from it.
- ⚠⚠ **TWO DOCBLOCKS NAMED THE GLOW AS A LIVE EXCEPTION AND BOTH ARE CORRECTED
  RATHER THAN LEFT.** `chrome-ink` carved the ink rule around it (*the ink is the
  wordmark and the profile glyph, and NOTHING else*) and `chrome-ink-gone` called
  it **the first suspect if the mark reads bright under the clock**. With no
  glow, what crosses the status bar is the ink alone, which that delay already
  takes to zero. **A comment describing a mechanism that is not there is worse
  than no comment.**
- ⚠⚠ **AND `chromeink.mjs` HAD AN ASSERTION THAT WOULD HAVE PASSED FOREVER
  MEASURING NOTHING.** It read `getComputedStyle(bar, '::before').opacity` and
  checked the glow did not fade with the ink — **with no pseudo-element that
  still answers `1`.** Deleted with the read behind it. ⚠ **A vacuous assertion
  is worse than a failing one, because it reads as coverage.** `glowremix.mjs`
  and `glowspreadbefore.mjs` went too; `git log` has the whole of it.
- **168 tests green**, and `homerecord.mjs` now asserts the **absence** of a
  container — no ground, filter, border, radius or padding — which is the only
  way a third one cannot quietly arrive. `chromeink.mjs` is 31/31 in Chromium
  and fails only on a WebKit binary this machine does not have, as `bandink.mjs`
  does; **pre-existing and environmental.**


⚠⚠ **`Lock` IS RED — 12 September, directed:** *put `lock` in an appropriate
red.* `--color-decline`, widened, and **a second red is refused on the green's
own argument** — that token's note reads *the moment green appears on a second
affirmative both stop meaning anything*, and answered it by widening rather than
copying. **Red takes the symmetric widening: *the withdrawing act on offer***,
which is decline a request and lock a line out of the pool.

- ⚠⚠ **IT REVERSES THE RULE THIS FILE SET THE SAME MORNING**: *only the locked
  face is loud; `Lock` on an ordinary line stays sentence-case chrome… an
  ordinary capture gains nothing.* **What survives is the distinction, moved off
  colour and onto CASE** — `Lock` sentence, `UNLOCK` capitals, so the locked line
  is still the loud one and the exception is still marked. **Colour now says
  which way the tap goes**, red out of the pool and green back into it.
- ⚠ **Three reds are declared and two are DORMANT** — `--color-active`'s lacquer
  and `--color-live` are read by nothing, which is the strongest argument
  available against declaring a fourth. ⚠ **The composer's failure line keeps
  `--color-decline` too, and that is the same register rather than a third
  meaning:** a capture that did not land is the app declining it.
- ⚠ **Cost, stated: `--color-chrome` no longer reaches this control**, so the
  console's one brass word is gone and colour there is now entirely a statement
  about consequence. **A third tenant is refused on both tokens.**
- ⚠⚠ **MEASURED ON THE CARD, WHICH IS A GROUND NEITHER TOKEN HAD EVER BEEN
  MEASURED AGAINST — AND THE DESK FAILS AA.** On the handset the console is
  `--glass-tint` over near-black: **red 5.22:1, green 5.99:1.** On the desk it is
  the opaque `--color-surface`, `rgb(43,42,37)`: **red 3.56:1 and green 4.09:1,
  both under 4.5 at 14.67px.** ⚠ **The green has been failing there since 11
  September and this did not cause it** — the tokens' own note measured them
  against the page ground (5.25 and 4.6), and the console card is a lighter
  surface sitting on it. ⚠⚠ **FLAGGED, NOT SILENTLY RE-PITCHED**: opening either
  one moves the portal's `Accept`/`Decline` and the composer's failure line with
  it, which is a palette decision rather than a fix to this control. **Nothing
  depends on seeing the colour** — the two words say it in full, which is the
  term both tokens arrived on.

⚠⚠ **WHY THE SCREEN TAKES SO LONG TO CHANGE — 12 September, reported:**
*investigate why it takes so long for the screen to change after tapping a glyph
in the bottom bar, more noticeable on the handset phone app.* **Two causes, one
of them free to fix and one of them structural.**

- ⚠⚠ **EVERY ROUTE IS DYNAMIC AND THERE IS NO `loading.tsx` IN THIS TREE.**
  Next's own guide, read at `node_modules/next/dist/docs`: *without Cache
  Components… a dynamic route is skipped [for prefetch] unless it has a
  `loading.js` boundary*, and *when navigating to a dynamic route, the client
  must wait for the server response before showing the result. This can give the
  users the impression that the app is not responding.* **So a foot tap
  prefetches nothing and paints nothing until the whole render lands.** Measured
  against production: **0.35s to 1.74s to first byte**, and that is the static
  sign-in page — an authed screen adds the layout's queries and its own.
- ⚠⚠ **`getMyProfile` WAS RUNNING TWICE ON EVERY SCREEN AND IS NOW REQUEST-
  SCOPED.** `app/(app)/layout.tsx` is an auth gate that reads it and **renders no
  UI at all**; every page under it reads it again for the handle. **Two identical
  Neon round trips per render**, serial, in front of the first paint. `cache()`
  is the mechanism `getSessionUser` has used all along, three lines away — **the
  asymmetry was the oversight.** ⚠ **Proved rather than assumed: a counter in the
  query, one `/record` load, 2 before and 1 after.**
- ⚠ **It dedupes because `SessionUser` is the same object.** `cache()` keys on
  argument identity and `getSessionUser` is itself cached, so every caller in a
  request is handed the same reference. ⚠ **A caller that built its own would
  miss silently** — which §3 makes impossible: the brand's constructor is private
  to `session.ts`. **That rule is what makes this safe rather than lucky.**
- ⚠⚠ **THE REST OF THE WAIT CANNOT BE REMOVED, SO WHAT IS REMOVED IS THE
  SILENCE.** `Pending` in `foot.tsx` reads `useLinkStatus` — Next documents it
  for exactly this case, *the destination route is dynamic and doesn't include a
  `loading.js` file* — and `glyph-pending` pulses the tapped glyph's opacity
  while the route is in flight.
- ⚠ **Opacity and nothing else — no colour, no element, no size.**
  `--color-chrome` means *a control* and `--color-accent` means *this converged*;
  §11's scarcity rule refuses a third reading of either, so **motion is what is
  left**, the same answer `composer-refuse` reached. ⚠⚠ **AND NOTHING MAY MOVE
  THE ROW**: the five columns are `traysightline.mjs`'s measured sight line and
  the bar's position is now asserted equal on every screen. Next's guide warns
  about the same thing — *inline indicators can easily introduce layout shifts.*
- ⚠ **120ms of delay is what stops it being a flicker**, the debounce the docs
  suggest: a navigation that lands inside it never shows anything. ⚠ **It never
  reaches zero** — `line-landed`'s rule, because a control that vanishes and
  comes back reads as a fault.
- ⚠⚠ **`loading.tsx` IS THE REMAINING LEVER AND IT IS NOT BUILT, DELIBERATELY.**
  It would enable partial prefetch and make the navigation itself immediate — but
  the fallback **replaces the destination's content**, so the screen a person
  left goes before the one they asked for arrives, and what it draws is a design
  decision this repository has strong views about (§6, and *an empty rail draws
  NOTHING — not a message, not a skeleton*). ⚠ **It would want the chrome per
  route, or the chrome hoisted into the layout** — which today renders `children`
  and nothing else. **Named, costed, not taken.** ⚠ **When it is taken the pulse
  retires itself**, because a prefetched route skips the pending state.
- **Measured by `node_modules/.probe/navpending.mjs`** — 8 assertions, with the
  RSC response **held open by a route handler**, because on localhost the render
  lands in ~40ms and the debounce correctly shows nothing. ⚠ **A probe that
  measured the fast case would assert the hint does not exist.**

⚠⚠ **THE BAR IS IN THE SAME PLACE ON EVERY SCREEN — 12 September, directed:**
*make it so the bottom bar doesn't drop a bit when toggling between the home
screen and any other screen; have the home screen landing page bottom bar be
positioned such that it's exactly where the bottom bar is when users are on the
record or convergence screens.* **Two causes, and the probe that should have
caught both was excusing them.**

- ⚠⚠ **18.5px OF IT WAS `foot-clear`, WHICH IS NOW DELETED.** That margin was
  added on 7 September so the band above the composer card and the air below its
  foot read equal in a Safari tab. **It did that by lifting this screen's bar off
  the bottom edge every other screen's bar sits on.** ⚠ **The two asks cannot
  both hold**: *the band looks bigger than the foot* is a judgement inside one
  screen, *the bar must be where it is on the record* is a judgement across two —
  and it is the one a person makes on every tap. **Stated cost: the band reads
  bigger than the foot again, in a tab. The lever if that returns is the BAND,
  not the bar** — it belongs to this screen alone and moves nothing shared.
- ⚠⚠ **THE LAST 0.875px WAS NEVER THE INSET'S TO PAY**, which is why even the
  installed app measured 1px rather than 0. The composer's foot row was
  `--tap-floor`; the record's is a `sheet-row`, `--sheet-air` around a
  `--glyph-foot` — **1.75px shorter, so its centre sat half of that higher.**
  `composer-foot` reads the record's own terms now:
  `calc((var(--glyph-foot) + var(--sheet-air)) * var(--foot-open, 1))`. ⚠ **A
  derivation, never the literal 42.25**, or the next change to either token is a
  number to keep in step. ⚠ **Still an explicit `block-size` and not
  `sheet-row`'s padding**, because a padding cannot be animated to zero from
  content — the explicit height is what makes the close a transition rather than
  the 44px hard swap this file records as the jolt.
- ⚠ **What it costs, stated:** with `overflow: clip` the composer's glyphs now
  have 42.25px hit areas rather than 44. On the record the same pseudo-elements
  overhang into the strip's hem uncllipped. **1.75px of a thumb, against a 19px
  jump on three of the four surfaces.**
- ⚠⚠ **THE PROBE IS WHY THIS SHIPPED, AND IT IS THE MOST IMPORTANT LINE HERE.**
  `footparity.mjs` asserted y **only at INSET=34 and only to within 1px**, with
  the note *at inset 0 the composer's row sits ~19px higher, and all of it is
  `foot-clear`'s margin, which the notch spends.* ⚠ **INSET 0 IS NOT ONLY THE
  DESK** — it is iOS Safari in a tab, where the bottom toolbar takes the area and
  `env(safe-area-inset-bottom)` reports zero, and it is Android. **The probe was
  excusing three of the four shipping surfaces, and the 1px it did allow was the
  second fault.** It asserts `=== 0` at every inset now.
- ⚠ **`bandink.mjs` had two assertions about `foot-clear` and both flipped.**
  They said the notch pays on one surface and `foot-clear` on the other and *they
  land on the same number* — which is exactly the agreement that caused this. It
  asserts the strip now, which is where the air actually is.
- **Measured 0.00 at inset 0 and at inset 34** — `footparity.mjs` 13/13 twice,
  `bandink.mjs` all green, `stripstep.mjs` and `traysightline.mjs` unchanged.

⚠⚠ **THE NAME IS ALWAYS IN THE MARK'S FACE AND THE MARK'S CASE — 12 September,
directed twice within the hour:** *wherever is 'juce', it should be in the font
used for the logo*, and then *make all instances capitalised, except user-made
entries.* Four places already had both — the bar, the two auth posters, the
icon's initial. **Two had neither**, and both are prose: the error screen's
*This is a bug in JUCE* and the push offer's *JUCE can tell you when this
happens*. `name-mark` is the one declaration.

- ⚠⚠ **THE EXCEPTION IS THE SECOND HALF OF THE DIRECTION AND IT COSTS NOTHING
  TO HONOUR: nothing a person wrote is ever transformed.** `page-line` declares
  no `text-transform` and never will — *what somebody typed survives* is §6's
  rule and a change of case is an edit. The utility is applied **by hand, to
  four letters the app is saying about itself**, and reaches nothing else. ⚠ **A
  blanket uppercase on the interface was the other reading of the direction and
  was put to the user rather than guessed at** — it would have reversed the
  lock's rule from the same morning, where `Lock` stays sentence-case chrome
  precisely so `UNLOCK` can be loud.
- ⚠⚠ **THE DOM STILL SPELLS IT AS A WORD AND THE CAPITALS ARE CSS**, which is
  `wordmark`'s rule and the week's most expensive lesson: `UNLOCK` is uppercased
  in the stylesheet, so `innerText` returns the shouting where `textContent`
  returns the word, and two probes read the wrong one. **The probe asserts both
  ends** — `textContent` `Juce`, `innerText` `JUCE`.
- ⚠⚠ **THREE STRINGS ARE THE DELIBERATE EXCEPTION AND THEY ARE CAPITALS IN THE
  SOURCE.** `metadata.title`, `appleWebApp.title` and the manifest's
  `name`/`short_name` are drawn by the operating system — a tab, a task
  switcher, the label under a home-screen icon — and **no stylesheet reaches
  any of them**, so the case cannot come from a transform. ⚠ **The record's
  `sr-only` heading is NOT capitalised**: it is never seen, so capitals buy
  nothing there and risk a screen reader spelling the word out. **Capitals
  where the name is seen; the word spelled as a word where it is only heard.**
- ⚠⚠ **NOT `wordmark`, AND THAT IS THE WHOLE REASON A SECOND UTILITY EXISTS.**
  That one carries the fence — `--wordmark-line` and `wordmark-trim`'s two
  negative margins — **measured for the mark set in its own box at its own
  size**. Inline, the line box belongs to the paragraph, so a trim sized against
  a 32px mark would subtract from a 13px sentence and pull the line off its
  leading. **The face and the case are shared; the box is not.** ⚠ **Nor
  `zine-command`**, the same face in the same case, which also sets
  `line-height: 0.86` and tracks −0.015em: a sentence is not a poster.
- ⚠⚠ **NO SIZE CORRECTION, AND THE MEASUREMENT THAT MATTERS CHANGED WHEN THE
  CASE DID.** The sentence-case build was licensed by the two faces having **the
  same x-height — 0.53 both**; in capitals the reading the screen shows is
  **the cap against the sentence's own capitals, and the mark's is 0.66 against
  the body face's 0.705 — 6.4% shorter than the `T` it follows.** That is the
  direction a correction would have gone anyway, because inline capitals read
  larger than the lower case around them. The x-height stays in the probe as
  the number that says the two faces are one size. ⚠ **Both are pairwise
  readings**: move the interface face and neither survives alone.
- ⚠⚠ **THE FACE HAS ONE CUT AND IT IS 800, SO THE WEIGHT IS NOT A CHOICE.**
  `layout.tsx` loads Bricolage at `weight: '800'` and nothing else; asking for
  400 renders the same file. **Five weights measuring an identical advance is
  the evidence**, and it is in the probe so it cannot later be mistaken for a
  broken reading. ⚠ **A lighter name inline is a second font file, not a
  declaration.**
- ⚠ **The tracking is `--wordmark-track`, and the END MARGIN takes it back.**
  `wordmark` records that CSS puts the letter-space after the last letter too,
  and calls it trailing air nobody sees **because every placement of the mark is
  start-aligned**. Inline it is seen: the next character on the error screen is
  a comma, and 0.08em in front of one reads as a typing mistake.
  `margin-inline-end: calc(var(--wordmark-track) * -1)` — the same token, so the
  two can never disagree.
- ⚠ **What it costs, stated: the name reads heavier than the sentence around
  it**, because the only cut is a black one and capitals are louder again. That
  is the name being the name. ⚠ **The icon is the one place still in a foreign
  face and is untouched**: `app/apple-icon.tsx` draws the initial in Satori's
  bundled face, because `ImageResponse` needs real font bytes and that means
  committing a TTF. Its docblock has called itself a placeholder since it was
  written. **Named, not fixed.**
- **Measured by `node_modules/.probe/namemark.mjs`** — 13 assertions, including
  the utility as the sheet compiled it, because a Tailwind `@utility` nothing
  references is never emitted and a screenshot of that failure looks exactly
  like the body face. **168 tests green**, typecheck, lint and build clean.

⚠⚠ **THE LOCK STANDS ON THE TRAY'S SIGHT LINE AND SAYS THE STATE ITSELF — 12
September, directed.** *The lock/unlock button should be vertically optically
in-line with the tray glyph. The `UNLOCK` word next to `today/[date]` is
superfluous — `Lock` becomes `Unlock` so it's obvious if an entry is locked or
not, just make `UNLOCK` all capitals, and a suitable green colour.*

- ⚠⚠ **THE ALIGNMENT IS THE GLYPH ROW'S OWN GRID, NOT A MEASUREMENT.** The words'
  row is now `grid-cols-5` bled to the card's edges, with the control at
  `col-start-5 justify-self-center` — **the settle glyph's exact declaration**,
  so the two centres are the same number by construction. Measured: **335 = 335
  at 390, 1061.32 against 1061.33 at 1440.** A `text-end` or a tuned inset would
  be a constant waiting to be wrong the next time the foot's columns move, which
  they did on 5 September.
- ⚠⚠ **`UNLOCK` RENDERED AS `UNLOC` FOR ONE BUILD, AND THE FIX IS A CONDITION
  REMOVED.** `overflow-y: auto` **forces `overflow-x` to `auto`**, so the
  scrolling half clipped the bleed at its own padding box — scroller 40→350
  against a card of 20→370, `scrollWidth 330` / `clientWidth 310`. **The
  horizontal inset moved from `console-card` to the scroller** (`padding-block`
  only on the card, `px-[var(--page-lead)]` on the scroller), so the clip edge
  **is** the card's inner edge and a bled child lands exactly on it. ⚠ **No
  `overflow-clip-margin`, no reserved gap, no number.**
- ⚠⚠ **AND THAT MOVE BROKE THE SIGHT LINE FOR ONE BUILD TOO — caught by
  measuring, not by looking.** Padding the glyph row shrank its grid to the
  content box and the settle glyph went **335 → 319**, off the foot's tray. With
  the card's sides gone the row needs *neither* a bleed nor a padding: it is
  already the card's full width. `traysightline.mjs` is what said so.
- ⚠⚠ **THE GREEN IS `--color-accept`, WIDENED BY DIRECTION, AND ITS DOCBLOCK
  FORBADE EXACTLY THIS**: *the moment green appears on a second affirmative…
  both stop meaning anything*, and *nothing borrows an existing token: a colour
  with two tenants is the failure the rule above describes.* **A second green
  was the alternative and is worse** — two greens meaning two things is what
  this palette exists to avoid, and a new one would need its own contrast
  measurement to say what this one already says. **Green is now *the affirmative
  act on offer*: accept a request, unlock a line.** ⚠ **Cost, stated: the
  portal's request is no longer the only place a decision is offered in colour**,
  and the console's green reads as a state as much as a verb. **A third tenant
  is refused.**
- ⚠ **Only the locked face is loud.** `Lock` stays sentence-case chrome; the
  exception is marked and the rule stays quiet, which is the stamp row's own
  grammar. **An ordinary capture gains nothing.** ⚠ **Capitals in the INTERFACE
  face with 0.08em of tracking, not `stamp`** — that utility is the voice of the
  facts below, and 11 September's control/stamp distinction survives the caps.
- ⚠ **`LOCKED` is deleted from the stamp row**, which overrides 11 September's
  *the state is marked only as the exception and the verb is always a verb* and
  design rule 1's *say the state and say the verb, as two things*. **What
  replaces it is not nothing**: the control says the state three ways — word,
  case and colour — in the one place a reader is already looking. ⚠ **The
  `aria-label` is untouched**, because neither capitals nor colour reach a reader
  who cannot see them.
- ⚠⚠ **`innerText` vs `textContent` COST FIVE PROBE ASSERTIONS ACROSS TWO
  FILES.** The locked face is uppercased **in CSS**, so `innerText` returns the
  rendered `UNLOCK` where the DOM says `Unlock` — `matchingconsent.mjs` picked
  the wrong read and reported the app as having neither capitals nor colour while
  a direct dump showed both, and `swipe.mjs` failed on the shouting. **Read what
  the component wrote; assert the capitals through `textTransform`, which is
  where they actually are.** ⚠ Same rule as the wordmark's: **spell the word as
  a word in the DOM.**
- **168 tests green.** `traysightline.mjs` 8/8 — it now pins the lock as well as
  the settle glyph, **and that it is not clipped**; `matchingconsent.mjs`,
  `console.mjs`, `swipe.mjs`, `akin.mjs`, `reenter.mjs`, `dupe.mjs` all green.

⚠⚠ **THE CONSOLE IS REORGANISED — 12 September, directed, AND A SCREENSHOT IS
WHAT SETTLED IT.** Asked: *how do we reorganise the console's contents so it's
easily understandable and not too jampacked? Maybe move `lock` so it's optically
in-line with the entry? Maybe `previously` should be `prev`, and both it and its
dates in a smaller font than `today`?* **Both instincts were right and the
screenshot said why.** `scripts/seed-console-full.mjs` writes the dense case —
converged, with kin, resolved, locked, and moved twice — because it cannot be
reached by hand and **a console with two facts in it cannot be judged.**

- ⚠⚠ **WHAT THE DENSE CASE ACTUALLY LOOKED LIKE at 390:** `TODAY · PREVIOUSLY
  03/09/26,` / `14/07/26 1983 LOCKED` with `Unlock` **stranded mid-line**. The
  row wrapped, and the year fell below where it read as **one more date**. Four
  facts and a control in one run of micro mono.
- ⚠⚠ **THE REAL FAULT WAS A CONTROL IN A ROW OF FACTS.** The stamp answers
  *what is known about this capture* — today, the year, `LOCKED`. **A verb is
  not one of those.** `Lock` / `Unlock` now rides the words' line, right-aligned
  and baseline-aligned to the first line of a capture that wraps: *a control
  belongs where its effect appears*.
- ⚠ **11 September's placement had a PRECONDITION and it expired.** That entry
  read: *the stamp row, not a line of its own — it already says what is known
  about this capture **and had room at its end**.* The prior dates took the room
  the same week. ⚠ **The `justify-between` finding still stands** and is why the
  control did not simply move right within the row: on the desk the word ended
  ~800px from its stamp.
- ⚠ **`LOCKED` stays below and the verb goes up, which is 11 September's rule
  rather than a break with it** — *the state is marked only as the exception and
  the verb is always a verb.* Two things, said in two places.
- ⚠⚠ **THE WORDS ARE STILL THE FIRST THING IN THE BOX.** The alignment to the
  record's first line depends on it, so the control is a flex row **around** the
  same `<p>`, never a row above it. Words `flex-1 min-w-0`, control `shrink-0`.
- ⚠ **The history gets its own line**, which reverses that block's own morning
  note (*in the stamp row, because it is the same fact — reuse a row before
  adding a block*). **Reuse a row that has room**: density rule 2's precondition
  failed, which is the one thing that licenses a second line.
- ⚠⚠ **QUIETER, NOT SMALLER, AND THAT IS THE TYPE SCALE'S ANSWER RATHER THAN A
  REFUSAL OF THE DIRECTION.** `--text-micro` is **0.6875rem — 11px — and it is
  the floor**; its own note calls it *the caption tier* and nothing in
  `globals.css` goes below it. A tracked, uppercased mono under 11px stops being
  readable, and a step below the scale for one line is the fourth-breakpoint
  problem in a type face. **What makes the stamp loud is its 0.22em tracking,
  not its size** — so the history keeps the size and drops the tracking, and
  reads markedly quieter beside the row above. ⚠ **If it must genuinely be
  smaller, that is a new token and a decision about the floor.**
- ⚠ **`Prev`, directed**, and it is the grammar the row was already speaking:
  `TODAY`, `1983`, `LOCKED` are all telegraphic.
- **The result:** `[words] … Unlock` / `Sam too. Ask them` / `You also wrote
  "…"` / `TODAY 1983 LOCKED` / `PREV 03/09/26, 14/07/26` / `[× ✎ … ⌂]` —
  **six rows, each one kind of thing.**
- ⚠⚠ **THREE PROBES WENT RED AND NONE OF THEM WAS THE APP.** `dupe.mjs` and
  `reenter.mjs` anchored their failure-line match on `$`, and the refusal's
  paragraph now carries *Update* **inside** it; `reenter.mjs` read only the
  stamp `<p>` where the history is now its own; `akin.mjs` asserted an exact
  count of marked lines on a record a second seed had added to. ⚠ **A probe
  that pins another seed's wording, or counts everything on a shared record, is
  asserting what other seeds do.** `console.mjs` 18/18 and `matchingconsent.mjs`
  all green untouched — including its 2px scan for a shared band between the two
  controls.

⚠⚠ **A LINE WRITTEN AGAIN MOVES TO TODAY — 12 September, directed, AND IT
REPLACES THE REFUSAL SHIPPED FOUR HOURS EARLIER.** Asked what happens when
somebody types `scarface`, crosses it off and types it again a week later; the
answer then was *Crossed off on your record.* and three steps to undo it.
**Directed: it should be accepted, the previous entry deleted, the date of the
previous entry preserved — and a line that is NOT crossed off should offer an
*update* that brings it into today, with the earlier dates in the console.**
Migration `0019`, production then dev.

- ⚠⚠ **NOTHING IS DELETED AND THE DIRECTION IS ANSWERED IN FULL.** Read
  literally it is two rows and then one, and **that loses more than a date**: the
  note, the photograph, the link, the possibility, and decisively the
  **provenance**. A lapsed `copy` destroyed and reborn as `self` is independently
  yours — so it converges and **notifies the very person it was taken from**,
  which is §6's suppression rule inverted and the hole this same file closed at
  the door that morning. **One row throughout, and it moves.**
  `guarantees.test.ts` asserts exactly that case.
- ⚠⚠ **`captured_at` IS THE DATE THE RECORD SHOWS AND `created_at` DOES NOT
  MOVE.** §5.1 allows one deletion — ten seconds, **on creation** — and
  `undoCapture` bounds itself in SQL on the row's age. **Reset that clock and a
  line from March becomes deletable**, with its note, its photograph, its
  provenance and its whole history on it. Two columns is how *a revive is not a
  creation* survives a line that moves. ⚠ **A probe caught the test that only
  aged one of them** and asserted a refusal the undo correctly gave — the
  guarantee needs an old `created_at` to be about anything.
- ⚠⚠ **THE BACKFILL IS HAND-ADDED AND WITHOUT IT THE MIGRATION MOVES EVERY LINE
  EVER WRITTEN TO TODAY.** `ADD COLUMN … DEFAULT now() NOT NULL` fills existing
  rows with the default; drizzle-kit cannot know the column is a copy of another.
  **Measured after: 93 of 93 production captures kept their real dates**, oldest
  7 August.
- ⚠⚠ **NO FAN-OUT ON A RE-ENTRY, AND A TEST CAUGHT THIS.** It looked obvious
  that a line coming back is trigger 1. `acceptance.test.ts` says otherwise in
  its own name — *announces nothing, because dropping never withdrew the first
  notification*: the counterpart was told when the line was first written and
  crossing it off never un-told them. **The same act through the × fires nothing
  either**, and two answers to one question is what that would have been. ⚠
  **Cost, stated: a convergence that arose WHILE the line was struck stays
  silent** — `restoreCapture`'s gap too, older than this, and the fix belongs
  there for both doors at once.
- ⚠⚠ **ONE FLOW FOR BOTH, AND IT DELETED A CONTROL, AN ERROR CODE AND TWO
  FUNCTIONS — directed:** *the same flow should apply when a user inputs an
  entry that is the same as a previous entry even when not crossed out.* For an
  afternoon the cases were asymmetric — a struck twin came back on its own and a
  live one was refused with *Already on your record.* and an **Update** beside
  it, on the reasoning that re-typing a live line is as likely to be forgetting
  you had it. **The person typed the line, which is the same act either way**,
  and an offer to do what they already asked for is a question with one answer.
- ⚠ **What went with it:** `Update` in the composer, `updateCaptureDateAction`,
  `recaptureWords`, and the `already` `ErrorCode` that existed only so a control
  could hang off one message. **Removed rather than left stranded** — *How
  things get fixed*'s order is to remove the mechanism, and an unreachable
  control is the mechanism still there. ⚠ **`revive` is now the only difference
  between the two cases**, and it is a lifecycle need rather than a branch in the
  flow: a struck line has a status and a `resolved_at` to clear.
- ⚠ **The whole signal is the field emptying**, which is what every ordinary
  capture already does. A refusal put the words back; an acceptance clears them.
  **No message, no control, no undo.**
- ⚠⚠ **NO UNDO ON A LINE THAT CAME BACK.** `created: false`, and the composer
  reads it: undo **deletes**, and `undoCapture` would refuse anyway on the old
  `created_at` — **a control that is lit and refuses** is the exact failure this
  file already records about client clocks. The landing is otherwise unchanged.
- ⚠ **The earlier days go in the STAMP ROW** — density rule 2, reuse a row
  before adding a block. **An ordinary capture gains no copy at all**, the same
  test the lock's stamp passed on 11 September.
- ⚠⚠ **IN NUMBERS, WITH A WORD IN FRONT — directed:** *the date of the previous
  entry should read in numbers and should have wording that provides context for
  the date.* **`TODAY · PREVIOUSLY 05/09/26, 03/08/26`.** ⚠ **This reverses what
  this block said four hours earlier** — *no label; `Previously:` would be a
  heading over a list that reads as a list* — and the reversal is design rule 1
  beating rule 2: **a bare second date does not read as itself.** Beside today's
  it could as easily be when the line was settled, when somebody converged on it,
  or when a photograph was attached.
- ⚠ **One word for the whole run** (design rule 4 — the matching rule's own
  precedent), and **the `·` marks the group once, never each date**: without it
  a screenshot read `TODAY PREVIOUSLY 05/09/26`, two facts running into one
  phrase, because `ms-2`'s space is not enough between a word and a word. The
  dates inside take commas.
- ⚠ **`numeric` is a second FACE for a date in `lib/day.ts`, not a second rule
  about days** — same timezone, same instant as `stamp`, so the two can never
  disagree about which day something happened on. ⚠⚠ **THE YEAR IS ALWAYS
  THERE, REVERSING `stamp`'s RULE ON PURPOSE**: that rule says *a date carrying
  a year every time reads as a filing reference*, and **a numeric date IS a
  filing reference** — `05/09` with no year is the lie that rule is about.
- ⚠ **A long history wraps and is not truncated.** `items-baseline` keeps `Lock`
  on the first line, which is right — it acts on the line, not the dates.
- ⚠⚠ **REDUCED TO DISTINCT DAYS AND THE ROW'S OWN DAY DROPPED, AND A PROBE
  FOUND BOTH** — it read back *Today· Today· Today*, three re-entries in one
  afternoon each filing a genuine instant of the same day. **The table is right
  to hold instants and the console is right to show days**, so the reduction is
  the action's, between them. ⚠ **Keyed on the timezone-resolved DAY, never on
  the printed label** — two instants twelve hours apart can print the same
  numbers and be different days depending on where the reader is. ⚠ **That is
  also why `getPriorDates` returns the line's own `captured_at`**: the client
  may not decide what day something happened on.
- ⚠ **`PageLine.createdAt` is renamed `capturedAt` and the keyset cursor walks
  it**, with `captures_user_captured_idx` replacing the old index — the record,
  search and the cursor all order by the date on screen, or a moved line would
  sort where it used to be.
- **168 tests green**, `reenter.mjs` 12/12 on the real page. ⚠ **That probe's
  first run disagreed with itself** — it reported the live twin unrefused while
  the next assertion found the *Update* the refusal had drawn, because the
  control lives **inside** the `<p>` and its text runs on after the sentence.
  **Two assertions disagreeing about one state is the probe being wrong.**

⚠⚠ **AKIN — 12 September, directed, AND IT IS THE FIRST THING IN THIS APP THAT
COSTS MONEY PER ROW.** *If it's semantically similar enough, it should be added
but with an asterisk, and when the user taps the semantically similar entries,
they see a grouping of them in the console.* **Semantic** is the word, and it
rules out everything this repository can do for free — so the three candidates
were put to the user with their costs, and **embeddings via `after()` was
chosen**. Migration `0018`, applied to production then dev.

- ⚠⚠ **ANTHROPIC HAS NO EMBEDDINGS ENDPOINT.** Their own documentation says so
  and points at **Voyage AI**, which is why a Claude-shaped app calls somebody
  else's API. `voyage-4-lite`, 1024 wide, one POST over HTTP — **no package**,
  because the endpoint is one JSON body and a wrapper is a dependency to keep up
  to date for nothing. ⚠ **No `input_type`**: that parameter picks query against
  document for asymmetric retrieval, and two captures are the same kind of thing.
- ⚠⚠ **`VOYAGE_API_KEY` IS OPTIONAL AND PRODUCTION IS DARK UNTIL IT IS SET** —
  the VAPID keys' precedent exactly. With no key nothing is embedded, no pair is
  written, no asterisk is drawn, and **no screen says anything is missing** (§6).
  ⚠ **Adding the key turns it on for captures written from then on**; rows
  already in the record have no vector and stay ungrouped until something
  re-embeds them.
- ⚠⚠ **THE "WORKER" IS `after()` AGAIN, AND THE ARGUMENT IS `lib/push.ts`'S
  TWICE.** A third-party call inside the capture's transaction puts Voyage's
  latency in front of the four-second promise, and a Voyage outage would roll
  back somebody's line. **The capture is committed before this runs** — what is
  at risk is an asterisk. ⚠ **`db`, never the caller's `tx`**: holding a
  transaction open across a network call to another company is what destroys a
  pool.
- ⚠⚠ **PAIRS, NEVER A GROUP ID, AND THAT IS THE WHOLE SHAPE.** A `group_id` is
  single-link clustering: *learn to sail* → *sailing lessons* → *lessons in
  French* land in one group **nobody chose**. This file already bans that on the
  convergence side — *never transitive*. **A pair is a fact about two lines**, so
  the grouping is always *what is akin to THE LINE YOU TAPPED* and is different
  for each member of a loose cluster. ⚠ **Both directions stored**, so the read
  is `capture_id = $1` and not a two-legged `or` no index serves.
- ⚠⚠ **WRITTEN ONCE AT EMBED TIME, NEVER COMPUTED AT READ TIME.** A distance
  against every other capture for every line of the record is O(n²) per page read
  on the one screen whose promise is that Return lands in under a frame. The bit
  is one indexed `exists` — the mark's own shape — and the grouping behind the
  tap is one indexed lookup.
- ⚠⚠ **`AKIN_DISTANCE` 0.35 IS A STARTING POINT AND HAS NOT BEEN MEASURED,
  BECAUSE MEASURING IT NEEDS THE KEY.** Said plainly rather than dressed up.
  `scripts/akin-threshold.mjs` prints the distance for ten pairs — five that
  should group and five that must not — and **that** is how the number gets
  chosen. ⚠ **What makes a threshold admissible here at all is that it is about
  YOUR OWN RECORD**: the banned rule is *a cosine threshold at match time*,
  which is the app making a social claim about a third party. Nothing in
  `capture_akin` crosses between people.
- ⚠⚠ **THE OWNER TERM IN `lib/akin.ts` IS THE PRIVACY OF THE WHOLE FEATURE**, and
  it must never be read as an optimisation: without it the table would say *your
  line is like a stranger's*. ⚠ **And `getAkin` puts the session on BOTH ends of
  the join** — the capture id arrives from a client, so a join without the second
  term is a door onto a stranger's *words*. `tests/akin.test.ts` writes the
  forbidden pair by hand and asserts the read refuses it.
- ⚠ **`lib/akin.ts` joins `lib/overlap.ts` and `lib/push.ts` in the lint
  exemption** — same shape by a different route: inside an `after()` there is no
  session left to take, so a `lib/db/` home would mean a function whose first
  argument is not a `SessionUser`. ⚠ **`lib/embed.ts` is deliberately NOT
  exempt**: the width check that made it import the schema moved to `lib/akin.ts`,
  beside the insert it protects. **A module that needs the boundary relaxed only
  to read a constant does not need the boundary relaxed.**
- ⚠ **The asterisk is a footnote mark in the YEAR's slot**, not a second thing in
  the gutter — §11 gives that column and `--color-accent` to overlap state.
  `--color-muted`, `ms-1`, `quiet` so tapping it picks the line. **Measured: a
  marked row is 34px and so is an unmarked one** — design rule 3, one object has
  one height.
- ⚠ **The console's grouping HAS a three-word lead-in where the convergence
  sentence needs none**, and that is design rule 1 beating rule 2: *Sam too.*
  explains itself by naming somebody; a bare list of your own lines does not.
  **The words are quoted**, `ask-them.tsx`'s rule — a sentence frame breaks on
  arbitrary text. ⚠ **Not buttons**: swapping a fixed card's subject under a
  reader is a second way to open a console (design rule 5). ⚠ **No count.**
- ⚠ **The portal asks for none of it** — `akin: false` there is *not asked*
  rather than *known false*, because the portal is arrival and this is a fact
  about the record. Stated cost: a portal line never shows an asterisk.
- ⚠ **A struck line is neither marked nor listed**, both ends, on the same rule
  the mark took that day.
- **166 tests green** (`tests/akin.test.ts`, 5 — ⚠ **with vectors written BY
  HAND**: driving Voyage would make the suite cost money and depend on somebody
  else's uptime to go green; what is Voyage's job is producing numbers and what
  is ours is everything after them) and `node_modules/.probe/akin.mjs` 10/10 on
  the real page. ⚠ **That probe first failed on its own bug** — it measured
  `li` heights, and an `<li>` carries the day stamp above its first line, so it
  reported 58.3 against 34 and called it a regression. **`.page-row` is the
  object design rule 3 is about.**

⚠⚠ **THE SAME WORDS TWICE IS NOT TWO CAPTURES — 12 September, directed, AND IT
REVERSES `writeCapture`'S OWN DOCBLOCK.** *Maybe the app shouldn't accept an
entry if it's exactly the same as a previous entry, instead alerting a user to
the same previous entry.* That block read: *raw text is never deduplicated — two
captures of the same words are two captures, because the same words can mean a
different thing on a different day.*

- ⚠⚠ **THE SECOND HALF OF THAT SENTENCE IS WHY IT HAD TO GO.** It ended *and the
  unique key does not constrain rows whose possibility is null* — **which is
  almost every capture** — so nothing anywhere stopped one record holding the
  same line four times. `schema.ts` names the consequence at the far end: a
  notification matches by SUBJECT, so **two live captures of the same words both
  list in the portal and both wear a mark off one event.** This closes it at the
  door, where the person can still see what they meant.
- ⚠⚠ **AFTER THE MUTATION-ID CHECK, NEVER BEFORE IT.** That check is what makes a
  retry idempotent (§10); ahead of it, the retry of a capture that landed would
  be answered *you already wrote this*. **A duplicate check is not an
  idempotency**, and `acceptance.test.ts` keeps one case of each to say so.
- ⚠⚠ **`normalised_text`, THE APP'S ONE DEFINITION OF *THE SAME WORDS*.**
  `Learn to sail!` and `learn  to  sail` are the same intention — that is what
  the generated column says, what search compares against and what a convergence
  joins on. ⚠ **The empty normalisation is excluded**, for the reason
  `tests/words.test.ts` already proves: `???` and `...` both normalise to
  nothing, so without the guard the second punctuation-only capture anybody wrote
  would be refused as a duplicate of the first.
- ⚠ **ON THE RECORD — `PAGE_STATUSES`, not a fourth spelling of it.** A settled
  line is history and wanting a thing again next year is a new capture; a
  crossed-off one is still on the page, struck, and is found and **reported as
  struck**. Two sentences, because they ask for two different acts: *Already on
  your record.* means there is nothing to do, *Crossed off on your record.* means
  go and put it back.
- ⚠ **What it costs, stated: retyping a crossed-off line no longer revives it.**
  The unique key used to do that silently for a resolved capture. The revive is
  still reached the way it always was — same possibility and intention,
  **different words** — which is how `acceptance.test.ts` and
  `guarantees.test.ts` enter it now.
- ⚠⚠ **`self` ONLY, AND A COPY IS DELIBERATELY EXEMPT.** `copyCapture` carries
  the one provenance movement §6 allows — *add something yourself, cross it off,
  then copy it from the person who had it* — and refusing that copy would leave
  the row claiming `self` for ever. ⚠ **And the rule CLOSES A SUPPRESSION HOLE
  on the self path**: an unresolved lapsed copy has a null possibility, so the
  unique key never constrained it and retyping its words wrote a second `self`
  row that then notified the person it was taken from. `guarantees.test.ts`
  asserts the refusal first and the revive second.
- ⚠ **The words go back into the field**, which is the existing failure contract
  — *a capture that failed is a capture somebody still means to make* — and it is
  what makes a refusal answerable rather than a dead end.
- **161 tests green**, and `node_modules/.probe/dupe.mjs` — 7 assertions on the
  real page, both sentences, the normalisation and that the record holds one.
  ⚠ **Its first run failed twice on its own bug**: a refused capture puts its
  words back, so the next `type()` appended to them and submitted a string that
  was nobody's duplicate. **Clear the field between writes.**

⚠⚠ **AND THE FOOT'S GLYPHS SIT IN THE SAME PLACES ON BOTH SCREENS — 12
September, directed:** *position the glyphs on the home screen, the landing
page, identically to how they're positioned when users are on the recorder
page.* `Foot` is one component with one set of classes, so the difference could
only ever have been its container — and it was.

- ⚠⚠ **THE COMPOSER'S FOOT ROW WAS THE ONLY FULL-BLEED THING ON THAT SCREEN.**
  The record's footer sits inside `gutter mx-auto w-full
  max-w-[var(--record-measure)]`; the composer puts that same wrapper round its
  own card six hundred lines up and had nothing round the foot. **Measured at
  390×844, `node_modules/.probe/footparity.mjs`: the footer ran 0→390 against
  the record's 20→370**, so its five columns were 78px where the record's are 70
  and the outer glyphs sat **20px further out** — the home glyph on the screen's
  edge under a card held off by `--gutter-l`. After: every centre equal to the
  pixel, 55 / 125 / 195 / 265 / 335 on both.
- ⚠ **The same three classes as the card, never a `px-` of its own.**
  `--gutter-l` holds every other box on that screen off the edge; a second
  spelling of it is a number to keep in step.
- ⚠⚠ **THE VERTICAL WAS ALREADY RIGHT WHERE IT MATTERS AND IS NOT TOUCHED.** At
  inset 0 the composer's row sits 19.38px higher, and **all of it is
  `foot-clear`'s `margin-block-end`** — `max(0px, … − --sheet-clearance)` — so
  **the notch spends it and the two rows land 1px apart on a handset.** Measured
  at `INSET=34` through `Emulation.setSafeAreaInsetsOverride`. That margin tops
  the air under the row up to the band above the card (8 September,
  `bandink.mjs`), and the record has no band to answer to. ⚠ **A desk browser
  reports inset 0 and would have sent the next person to delete it.**
- ⚠ **The probe pairs cells by POSITION, never by label.** Column one is the home
  glyph and it is the one cell whose label differs by design — lit on the record,
  drawn off on the composer, so a `<span>` with no `aria-label`. Matching on the
  label reported a 140px difference between a glyph and itself.

⚠⚠ **A CROSSED-OFF LINE WEARS NO MARK — 12 September, directed, AND IT REVERSES
WHAT `mark.test.ts` HAD ASSERTED SINCE 31 AUGUST.** Reported: *any crossed off
item should also not have an amber vertical line next to it.* The mark was §5's
*memory* and survived everything — settling, crossing off, the portal emptying.
**It now goes when a line is struck, and only then.**

- ⚠⚠ **THE ENGINE HAD REFUSED THOSE LINES SINCE 31 AUGUST AND THE RECORD WAS
  STILL FLAGGING THEM.** `lib/overlap.ts`'s allowlist names three pairs and **no
  row names `dropped`** — so a crossed-off line converges with nobody, and the
  bar on one was the record claiming a state the pool cannot produce. **A
  disagreement removed, not a preference applied**, which is the difference
  between this and a taste change.
- ⚠⚠ **ONE FRAGMENT, FOUR READS NOW.** `notificationMatchesLiveCapture()` —
  the two portal reads since 11 September, `converged` and `getConvergence`
  since 12. ⚠ **All four or none of them**: 11 September is the day two of them
  disagreed and the door stayed dark, and a term added to one rebuilds that bug.
  ⚠ **The subject join now has exactly one caller and must not be inlined** —
  folded together it would be written once and the state opinion four times.
- ⚠⚠ **NOTHING IS DESTROYED, AND THAT IS WHAT MAKES IT CHEAP.** The bit is
  computed at read time and a cross-off writes nothing to `notifications`, so
  **putting the line back restores the mark and its sentence whole.** Asserted in
  `mark.test.ts`. §5's *nothing is ever deleted* is untouched: a struck line is
  un-flagged, not erased.
- ⚠ **The SETTLED line keeps its mark, and that is the distinction rather than an
  inconsistency.** `listMySettled` reads `status = 'completed'` and never sees a
  `dropped` row. *A resolution is not an erasure* still holds — **a rule through
  a line is an answer**, which is the judgement the portal made on 11 September.
  ⚠ **`<> 'dropped'`, never `= 'active'`**: a go-back-to is `completed` with
  verdict `again` and keeps everything.
- ⚠⚠ **THE TERM IS ON THE ROW AS WELL, AND THAT IS NOT A SECOND DEFINITION.**
  The record deliberately does not refresh on a cross-off — `router.refresh()`
  is argued against twice in `page-screen.tsx` — so the server's `converged`
  **stays true on the client for the rest of the session**. Without
  `&& !crossedOff` the bar would sit beside the line you just struck until a
  navigation. It is the same optimistic mirror the strike-through is. ⚠ **The
  `sr-only` note carries it too** — *what the screen shows, the label says* cuts
  both ways. ⚠ **`search-screen.tsx` gets NO term**: nothing there acts on a
  line, so there is no optimistic state and the read is the whole answer.
- ⚠ **What it costs, stated: the console on a struck line says nothing about
  who, and `Ask them` is unreachable on it.** `askWhoElse` is gated on the bit
  by design, so the sentence follows the bar. Tap the × again and both return.
- ⚠ **It also closed half of an open item**: a struck line can no longer wear a
  live twin's mark. **What survives is two LIVE captures of the same words**,
  which still list twice and mark twice off one event — that needs identity on
  the payload, a migration and a change to what a notification *is*.
- **158 tests green**, typecheck, lint and build clean. `mark.test.ts` case 4 and
  `words.test.ts`'s crossed-off pair are the two that flipped.

⚠⚠ **EARNED PUSH — 11 September, AND THE "BACKGROUND WORKER" IS `after()`.**
§6 has said since it was written that *push delivery happens in a background
worker, never inline*, and there has never been one. **What that rule forbids is
a third-party HTTP call inside the capture's transaction** — latency on the
four-second promise, and a failed push able to roll back a written line.
`after` runs once the response has flushed: outside the transaction, off the
critical path, **with no queue, no cron and no second service to operate.**

- ⚠ **The cost, stated: a killed invocation loses the send.** The notification
  row is already committed, so the portal and the mark still show it; what is
  lost is the buzz. **A push is a copy of a row, never the record of one.** A
  durable queue is the upgrade if that ever proves wrong.
- ⚠⚠ **SCHEDULED INSIDE `writeNotifications`, THE ONE PLACE THAT ALREADY KNOWS
  WHAT WAS WRITTEN.** Every path that produces a notification goes through it,
  so no caller has to remember and a fifth trigger gets delivery free. The
  alternative was plumbing rows back out through five signatures. ⚠ **The
  `try` around `after` is for the TESTS** — it throws when there is no
  request to be after — and the catch must stay that narrow.
- ⚠⚠ **THE PERMISSION IS ASKED AT THE FIRST CONVERGENCE, NEVER AT LAUNCH.**
  Amendment 10 asks for push that is *earned*; that has a specific moment, and
  it is the only one at which the browser's dialogue can be truthful, because
  the thing it will deliver is on screen behind it. **Asking at launch spends
  the one request a browser ever gives you on somebody with nothing to be
  notified about, and a denial is permanent.** `components/turn-on-push.tsx`
  renders in the portal and nowhere else, gated on there being a line.
- ⚠ **Four silences, all §6's *silence stays silent*:** no support, already
  granted, already denied, and the first paint. **On iOS the no-support case is
  everybody reading in a tab** — web push there needs the installed app.
- ⚠⚠ **`useSyncExternalStore`, NOT AN EFFECT THAT SETS STATE.** The value
  decides whether the component renders at all, so unlike `AskThem` — where
  the flag was deleted because the label was the same either way — the branch
  really is in the markup and has to be hydration-safe.
- ⚠ **`proxy.ts` ALREADY EXCLUDED `sw.js` and the CSP already carried
  `worker-src 'self'`.** Neither was touched. **Do not put the worker behind
  the proxy.**
- ⚠ **The worker does one thing and must not learn to cache.** An offline shell
  is a separate decision, and a worker that caches will one day serve a stale
  build to somebody who cannot work out why. ⚠ **`tag` collapses a burst** —
  `runOverlapForNewMutual` is deliberately uncapped, and forty notifications
  is the flood this product exists not to be.
- ⚠⚠ **A GONE ENDPOINT IS PRUNED AND NOTHING ELSE IS.** `404`/`410` means the
  browser dropped it; **a `500` is the push service having a bad minute, and
  deleting somebody's device over one would silently unsubscribe them.**
- ⚠ **`lib/push.ts` joins `lib/overlap.ts` in the lint exemption**, and for
  the identical reason: delivery reads the **recipient's** endpoints, and a
  `lib/db/` function whose first argument is somebody else is the one shape §3
  forbids. **The two writes are ordinary session-filtered functions** in
  `lib/db/push.ts`.
- ⚠⚠ **THE KEYS ARE NOT ON VERCEL YET, SO PRODUCTION IS DARK.** Generated and in
  `.env.local`; `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
  `VAPID_SUBJECT` all stay **optional** in `lib/env.ts` so the app is whole
  without them and simply does not buzz. Promoting them is
  `scripts/preflight.mjs`'s call when the beta needs delivery.
- ⚠⚠ **A HEADLESS BROWSER CANNOT MAKE A SUBSCRIPTION.**
  `pushManager.subscribe()` fails with *AbortError: Registration failed —
  permission denied* because headless Chromium ships no push-service backend.
  **Asserting an endpoint in a probe would assert what no run can satisfy.** ⚠
  **Nor is `permissions: []` "default" in Playwright — it is DENIED**, and a
  denied browser correctly hides the offer; that looked like a broken component
  for three runs.
- **Measured two ways.** `node_modules/.probe/push.mjs` — 10 assertions: where
  the offer is and is not, the worker's scope, the permission, and that the line
  retires itself. `tests/push.test.ts` — 7, driving `deliver` against a
  **self-signed TLS stand-in** for a push service, because `web-push` refuses
  a plain endpoint. ⚠ **It asserts the body is CIPHERTEXT**: a shape test passes
  on plaintext, which is the one outcome that would mean every push is readable
  by the push service.
- ⚠ **`npm install` PRUNED `playwright-core`**, which was never in
  `package.json` — every probe died until it was restored with `--no-save`.
  **It will happen again on the next install.**

⚠⚠ **THE MATCHING CONSENT AND A FINDABLE LOCK — 11 September, AND IT REVERSES A
DECISION TAKEN ON 4 SEPTEMBER.** That day the lock's teaching sentence was
deleted for firing at a record length of one, and the entry stated the cost:
*nothing now teaches the lock swipe… if the lock proves undiscoverable, this is
what was removed, and it should come back **where a reader is actually
looking.*** Amendment 10 made it binding — a hidden gesture cannot carry the one
disclosure that a private capture may become a social event.

- ⚠⚠ **THE SWIPE IS UNTOUCHED.** `SwipeWay`, the detent, the signs, the
  padlock confirmation and both haptics are exactly what they were. **Two doors,
  one `toggleLock`** — the console is the considered door and the swipe the
  reflex one, which is the arrangement `console.tsx`'s own docblock predicted
  before the swipes existed. Amendment 10 asks for the control *as well as* the
  gesture, in those words.
- ⚠ **The stamp row, not a line of its own.** It already says *what is known
  about this capture* and had room at its end, so **an ordinary capture gains no
  copy at all.** Density rule 2: reuse a row before adding a block.
- ⚠⚠ **THE STATE IS MARKED ONLY AS THE EXCEPTION AND THE VERB IS ALWAYS A
  VERB.** `LOCKED` is a stamp in the row's mono; `Lock` / `Unlock` is a
  control in the interface face. Design rule 1, and it is the record's existing
  grammar — a live line says nothing where a crossed-off one is struck.
- ⚠ **NO PADLOCK ON A BUTTON**, which this file settled when the mark was
  chosen: *on a button it says security, and this is scope.* The padlock stays a
  mark in the row's tail.
- ⚠ **`justify-between` was tried and is wrong on the desk**, where the console
  expands across the reading column: the word floated ~800px from its stamp and
  did **not** align with the settle glyph below it either. It runs on from the
  stamp instead.
- ⚠⚠ **`onLock` IS `null` IN THE PORTAL AND THAT IS NOT TIDINESS.**
  `listMyPortal` sets `shared: true` **by construction** — a locked capture
  cannot have produced the notification that put the row there — so a control
  that changed it would make the read's own assumption false.
- ⚠⚠ **THE RULE IS SAID WHERE CONSENT IS GIVEN: under the requests, and under
  the handle field.** `MATCHING_RULE` in `lib/vocabulary.ts` is the one
  author. ⚠ **The second clause does as much work as the first** — *Nobody can
  read your record* — because the likeliest misreading of the first is *they can
  see my list*, which is false and is the boundary Amendment 2 drew.
- ⚠ **NOT at onboarding**, and that is a decision. The harm needs both a
  sensitive capture and a mutual connection; at onboarding neither exists, so
  the sentence describes something that cannot yet happen — and a sentence you
  cannot act on is a sentence you do not read. **The first request is the first
  moment the rule can bite.**
- ⚠ **Once for the group, never once per row** — design rule 4. Three requests
  do not want three copies of one rule. ⚠ **No `mt-3` on it**: the requests'
  own `gap-4` already owns that space, and declaring it twice measured ~49px.
- ⚠ **It does not say *matching*** — flagged on 4 September as not being in §3's
  vocabulary. *Write the same thing* is plainer than any term this app could
  coin.
- ⚠⚠ **AND `swipe.mjs` HAD BEEN RED SINCE THE FRONT-PAGE SPLIT ON 5 SEPTEMBER
  — SIX DAYS, UNNOTICED.** It seeded through `button[aria-label="Write a
  capture"]`, the `+` the split deleted, so every run timed out **before a
  single assertion**. `console.mjs` had the identical rot and was fixed that
  day; this is the same fix, a week late. Green now, and it pins **both** doors.
- **Measured by `node_modules/.probe/matchingconsent.mjs`** — 17 assertions,
  both surfaces, including a **2px scan of the band between `Ask them` and the
  lock**: they sit 12px apart with 44px hit areas each, so the areas overlap and
  what had to be shown is that every point belongs to exactly one of them.

⚠⚠ **THE WAY OUT — 11 September, AND IT IS THE ONE CONTROL THE WHOLE RESET WAS
ABOUT.** *A convergence produces a notification, not an opportunity.* The
engine, the portal and the mark were all correct and all stopped at the
coincidence. `components/ask-them.tsx` is the step that was missing: **Ask
them**, a word in the run of the convergence sentence, on both surfaces the
sentence appears — the portal's row (arrival) and the console's slot (memory).

- ⚠⚠ **THE SYSTEM SHARE SHEET, NEVER A CHANNEL THIS APP PICKS.** Naming WhatsApp
  or SMS means asking for the contacts permission, which contradicts the privacy
  stance the strategy spends a section protecting. **The sheet needs no
  permission and no contact data**, and the person picks the recipient in their
  own app. ⚠ **So the control does not know who it is messaging and does not need
  to** — the counterpart is named in the sentence above it.
- ⚠⚠ **A CANCELLED SHARE IS NOT A FAILURE.** Dismissing the sheet rejects with
  `AbortError`; it is swallowed by name, and **only a real fault falls through
  to the clipboard** — a cancelled share that silently copied would leave the
  draft on the clipboard of somebody who decided against sending it.
- ⚠ **The fallback is the clipboard and it says so.** `navigator.share` is
  absent on Firefox; a control that did nothing there is the button that lies.
  **`Copied` for two seconds** — a silent copy reads as a control that did
  nothing, where the sheet is its own receipt.
- ⚠⚠ **NOTHING RENDERS OFF `navigator`, SO THERE IS NO CAPABILITY STATE.** The
  first draft read it in a `useEffect` and `react-hooks/set-state-in-effect`
  refused it — **the lint rule was right and the real fault was upstream**: the
  label is *Ask them* either way, so the capability decides only what the handler
  does, and a handler runs in a browser by definition. **Do not reintroduce a
  `canShare` flag.**
- ⚠ **A word in the sentence, not a fourth glyph in the row.** `Accept` and
  `Decline` are the precedent two lists up. The glyph row is the wrong home:
  cross off, rewrite and settle act on **your line**, this acts on **the
  overlap** — and that row is a measured sight line (`traysightline.mjs`) a
  conditional fourth glyph would move.
- ⚠ **`askDraft` is in `lib/vocabulary.ts`, not beside `portalSentence`**,
  which is where §6's drift rule would put it — `lib/overlap.ts` is
  `server-only` and this is read by a client component. **If a fourth register
  is written, move all of them together.**
- ⚠⚠ **IT DOES NOT BRANCH ON `NotificationKind`, AND THAT IS FORCED.**
  `listMyPortal` groups every notification about one capture into one row, so
  **a line can be a `convergence` and a `guide` at once** — there is no single
  kind to read. ⚠ **The cost: for a `lend` the right question is *could I
  borrow it*, not *want to?*** Affordable because `lend` and `guide` both need
  a non-null intention and nothing has written one since 22 August. **If either
  becomes reachable, this is the line to branch — and the branch needs a kind
  the grouped line does not carry.**
- ⚠ **The words are quoted, never injected into a sentence frame.** *Want to
  `text` together?* breaks on *a trip to Japan*; quoting is what makes it total
  over arbitrary text, and §6 requires that what somebody typed survives.
  **Measured: `We both saved “portal seed 10:33:35”. Want to?`**
- ⚠ **It does not name the app.** Both people are notified, so the recipient
  already knows why it arrived; a sentence explaining Juce would be the product
  talking inside somebody else's message.
- **Measured by `node_modules/.probe/askthem.mjs`** — 13 assertions, both
  surfaces, both placements, and the draft read back off the clipboard.
- ⚠ **The worker is the gate on the other three.** Push needs one, and so does
  the LLM canonicalisation that would let *learn to sail* and *sailing lessons*
  converge — one piece of infrastructure, two blockers. **Costed 11 September:
  the embedding and model spend for a whole beta is under ten dollars; the
  worker is what is actually missing.** Canonicalisation happens at CAPTURE
  time so matching stays an exact join — ⚠ **never a cosine threshold at match
  time**, which is a tuned number deciding a social claim about a third party,
  and never transitive.
- ⚠⚠ **THE BROWSE RAIL AND THE OPENING COUNT ARE OUT OF RELEASE 1 — Amendment
  10 — AND THE ENTRIES THAT DESCRIBE THEM PREDATE IT.** The rail's rules from 6
  September are historically accurate and are **not Release 1 requirements**;
  they moved to `docs/build-log.md` on 12 September. The rail was already off
  Home from 7 September, and `listRail`,
  `image_path`, `open_count` and `items_rail_idx` are dormant. ⚠ **Do not
  delete them** — the discovery question is deferred, not answered.
- ⚠ **Discovery returns only when every item can carry one of three
  explanations**: the person's own record, a sourced current local opportunity,
  or the trusted-relationship layer. ⚠⚠ **The third may restate ONLY overlaps
  both people have already been told about** — computed from the other person's
  unconverged captures it is *three of your friends want this*, which discloses
  what somebody else wrote to somebody who was never told.
- ⚠ **The loop is never paywalled** — capture, the record, adding a person,
  convergence and the action after it, free permanently. A priced connection is
  a connection that does not get made, and density is what this product is short
  of. Funding is `consumer-product-strategy.md` §9; the research mission's
  publication conditions are §10, and **revenue rather than profit**, because a
  share of profit is not verifiable from outside.
- ⚠ **Success is an offline consequence.** Opens, notification clears and time
  spent are not measures. Craft still matters, and **no visual experiment
  outranks proving the capture-to-real-world-action loop with real people.**

## Where the build stands — 8 September

**Phase 0 is done, deployed and verified.**

**Phase 1 is built, deployed and in daily use on a handset.** `/` is the capture
page in production; the poster wall, `components/shell.tsx` and the four
collection routes are deleted. Nothing is held back. **Four** things are
outstanding and none of them is a screen that does not work — the vocabulary
migration (deferred, and the only non-additive one), a `kind` that is not a film,
a Blob store for the photographs already built, and the five-second acceptance
criterion, which was closed by direction and never stopwatched. ⚠ **This said
five and named the thing detail view; the console closed it on 30 August.**
`docs/re-direction/phase-1-capture.md` is the register.

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

⚠⚠ **A CAPTURE CONVERGES ON ITS WORDS — directed 5 September, Amendment 4,
AND IT IS BUILT AS OF 11 SEPTEMBER.** `tests/words.test.ts` is the account —
13 cases, and the build notes are at the top of this file under *The direction*.
**No migration:** `normalised_text` was already a generated, indexed column,
put there for exactly this. The five pieces: a fourth row in `classify`, a
second predicate in `findMutualCounterparts`, a `union all` in the pair
fan-out, `normalisedText` in the payload beside an untouched `itemId`, and
`notificationMatchesCapture()` — **one fragment now read by all three of the
mark, the portal and `getConvergence`**, where three literals of the same join
used to sit in two files.

- ⚠⚠ **THE WORDS PATH REQUIRES `possibility_id is null` ON BOTH SIDES, AND A
  MUTATION TEST PROVED IT IS LOAD BEARING.** Removing it, a pair that resolved
  to one possibility *and* typed one string is announced **four times instead of
  two** — both legs of the union see them, and this module deliberately does not
  deduplicate.
- ⚠⚠ **`normalised_text = ''` IS EXCLUDED, AND IT IS NOT A NICETY.** The
  normaliser strips everything non-alphanumeric, so `???` and `...` both
  normalise to the empty string — without the guard **every punctuation-only
  capture in the app would converge with every other one.**
- ⚠ **An edit is the FOURTH moment**, gated on the *normalised* text changing.
  `setCaptureText`'s docblock used to say *do not add a `fireOverlap` call
  here* and gave a reason Amendment 4 falsified word for word. The stated cost:
  editing away and back announces twice.
- ⚠ **Either side's intent being null is enough**, not both — the amendment says
  so in those words, and a both-null gate silently drops a real match. The three
  intent rules still pick the richer sentence when both sides have one.
- ⚠ **Each person is told their OWN words** in the payload's `title`; the two
  normalise alike and may not be spelled alike. `portalSentence` does **not**
  branch — *Sam too.* either way, because the row already shows the capture.
  `notificationCopy` does, because it is the standalone register and *both want
  to see learn to sail* is not English.

This paragraph said *overlap joins on
`possibility_id`, so only resolved captures converge, and TMDB is the only
catalogue — today two people can converge on a film and on nothing else.* This paragraph said *overlap joins on
`possibility_id`, so only resolved captures converge, and TMDB is the only
catalogue — today two people can converge on a film and on nothing else.* **That
is the bug, not the design.** Two conditions come out of `lib/overlap.ts`: the
join on `possibility_id` and the non-null `intent`. Two captures agree when they
resolve to the same possibility **or when their `normalised_text` is identical**,
and `classify`'s three pairs choose **which** sentence to write rather than
**whether** to write one. ⚠ **The possible-match PROMPT is withdrawn with it** —
identical text is a convergence, with no confirmation step. ⚠⚠ **And do not build
an intention control in the console: that was the proposal this replaced.** The
normative statement is Amendment 4 in the implementation specification; §9b of
`phase-2-convergence.md` is the account of the failure and `docs/decisions.md`
holds the costs and the reopen points. See §13 of the implementation
specification, which now carries this as Phase 2's status.

⚠⚠ **THE LOG FROM 8 SEPTEMBER BACK IS IN `docs/build-log.md`, AND IT IS PART
OF THIS FILE — 6 September, cut twice on 11 September and twice on 12
September.** `CLAUDE.md` had reached 182,000 characters against a
150,000-character limit, so the harness was **truncating it**: the oldest
entries were being silently dropped from every session. **A rule that is not
loaded is not a rule**, so the split is the fix — every word moved is verbatim
and **every ⚠ in it still binds.** Nothing was compressed, superseded or
archived.

- ⚠ **Read it before touching any of:** the row swipes, their detent, the
  haptics and `touch-action`; the console; the writing strip, the sheet, the
  glass, and the fade at the record's foot; `--keyboard-overlap`, the notch
  arithmetic and `env(safe-area-inset-*)`; the one-line rule and the record
  row's type; the desk's ink, ground and type ramp; the mark's column and its
  two clamps; the resume/re-entry gate; and — since 12 September — **the
  composer's measured cap, the sent line and its undo, the front page's two
  halves, and the rail.**
- ⚠ **Restated here because it is the most expensive one in the file and a
  browser cannot see it:** never lift an expression containing
  `var(--keyboard-overlap)` — or any property script writes onto an element —
  into `@theme`. A `var()` is substituted where the property is **declared**,
  so a token on `:root` takes the fallback and freezes. Only a notched handset
  can tell.
- ⚠ **Do not fix a future overflow by deleting entries.** The next cut is
  another date boundary, in the same order these went: newest stays here, oldest
  moves out, nothing is paraphrased. ⚠ **The second and third cuts were both 11
  September** — the 4 September boundary took the handshake across, and before it
  the 31 August boundary — *a capture is shareable when it is written*, *the
  mark*, *the portal* and the engine-had-no-reader correction went across, and
  **every ⚠ in them still binds from there.** ⚠ **The fourth was 12 September,
  at the 6 September boundary**, when the file had reached 170,985: the whole of
  6 and 5 September in one block — Amendments 6 to 9, the rail as it was drawn,
  the capture that becomes a statement in place, the three handset reports, the
  composer's cap and the undo's return to the front page. **122,106 characters
  afterwards.**
- ⚠⚠ **THE FIFTH WAS THE SAME DAY, AT THE 8 SEPTEMBER BOUNDARY, AND IT IS THE
  ONLY ONE MADE WITH THE FILE ALREADY OVER.** Every cut before it was taken at
  a measured warning; this one was taken at **150,741 against 150,000**, after
  three fixes were written up on top of a file that had been flagged twice in
  the same session as having under 3,000 characters left. ⚠ **A limit that is
  announced and then walked into is worse than one nobody saw**, because the
  truncation is silent and it eats the OLDEST rules — the ones nothing in the
  session will remind you of. **Everything dated 8 September went across in one
  block:** `black-translucent` and the installed app's 46px, the keyboard-only
  rearrangement, the ink leaving before the slab, the bar's ink fade, the
  composer's foot row learning to close, and the rename to **JUCE** with the six
  wordmark numbers it moved. **125,470 afterwards.**
- ⚠ **Budget the entry against the file before writing it, not after.**
  `wc -c CLAUDE.md` is the whole discipline, and the next boundary is 11
  September.

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

## Two questions every design decision answers

**Directed 4 September, standing, and they apply to every element on every
screen.**

**1. Will a reader understand what this means, or what it does?** Ask it of each
element, not of the screen as a whole. A control whose label states a *status*
fails it — there is no hover on a handset, so a button reading *Added each
other* that removes somebody when tapped is a button that lies. Say the state
and say the verb, as two things.

**2. Minimalism and maximum density: the finite space, used optimally.** Cut
anything the screen already says. A second sentence saying what the first said,
a heading over a list that reads as a list, copy explaining a control — each one
pushes the content down. Reuse an existing row before adding a block; use a
column that is already there before adding a line. **Fewer words at the same
size, never the same words at a smaller size.**

⚠ **When they conflict, comprehension wins** — question 1 is the tiebreak, and
the second word is usually free: a state beside a verb is one line either way.
The precedents are all here already: *Add them back?* deleted because *Accept*
said it, *This list is not shared with you* deleted for spending a screen on an
absence, the lock's teaching sentence deleted, and §6's *silence stays silent*.

⚠ **Screens, not docblocks.** The comments in this repository and this file are
deliberately dense with reasoning; that is not what these govern.

**Four more, earned by `/u/[handle]` on 4 September — the two above passed it
and it was still wrong, which is what showed they were not enough.**

**3. One object has one height wherever it appears.** A capture is a line of the
record; it measures the same on somebody else's page as on your own. Measured
that day: **34px on the record, 111–134px there**, so three of somebody's lines
filled a handset where the record fits twenty-four. Take the row's geometry from
`page-row` rather than choosing padding locally — that is what makes one app out
of several screens, and it carries the separation with it: **the record parts
lines by rhythm, so a list of lines draws no rules between them.**

**4. A control that repeats on every row does not belong on the row.** *Add to
wants* was printed once per line, underlined — louder than the capture it
belonged to, and the most repeated string on the screen. The record settled this
already: `×` and `✎` came off the row into the console because three controls
for a line whose words the row could not show was too many. **Put it behind the
tap.**

**5. One gesture means one thing across the app.** Tapping the words opened the
console on your record and revealed a poster on somebody else's, with the acting
done by a separate underlined word — two grammars in one app. **A tap on a row
opens that row, everywhere.** How it opens may differ by surface, and already
does: the console is a fixed card on a handset and expands in place on the desk.

**6. A screen may not invent a breakpoint.** `person-row.tsx` switched layout at
Tailwind's `lg:` (64rem), which is not one of this app's three —
`--breakpoint-rail`, `--breakpoint-stack`, `--breakpoint-pane` — so that page
changed shape at a width nothing else in the app responds to. The three are
derived sums (§11); a fourth taken from a framework's defaults is a number
nobody chose.

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
- ⚠ **SEVEN notification kinds since 4 September, and that is the complete set.**
  It said six. `track_request` is the seventh and the first that is **not about a
  convergence** — Amendment 3 to the implementation specification, and
  `docs/re-direction/the-handshake.md` for why it earned the exception. No
  digests, no streaks, no re-engagement; the bar for an eighth is unchanged.
- ⚠ **A request is the one notification `lib/overlap.ts` does not write**, and
  the single-owner rule is not broken: that rule owns everything about a
  **match**, and a request has no possibility, no intent pair and nothing to
  suppress. **The sentence is still `portalSentence`'s**, beside the six it must
  not drift from.

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
- ⚠ **a global or random browse rail, image-only tiles, and the opening count —
  added 11 September by Amendment 10.** A count of openings is neither social
  proof nor a decision aid, and it is the engagement metric this list already
  bans wearing a different word. Discovery returns only with a bounded, sourced,
  actionably explained reason for every item
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

⚠⚠ **THERE IS NO SCROLLBAR ON THIS PAGE — directed 30 August, and it OVERRIDES a
rule this repository used to state.** Reported as *the side scroll bar*; the
answer asked for was that it go, not that it be restyled.

- **It was a LIGHT bar on a black page, and the cause was a missing fact rather
  than a missing style.** `color-scheme` computed `normal`, which tells the engine
  *use the light widgets* whatever colour the page paints itself.
  **`color-scheme: dark` stays** even now the bar is gone — it also owns the
  caret, the selection and the form controls, and it is what stops a hidden bar
  from being a light one the day something else scrolls.
- **`scrollbar-width: none` and `::-webkit-scrollbar` are both needed**, and
  neither is a browser sniff: each is the property its own engine reads.
- ⚠ **The `scrollbar-none` utility is DELETED into the `html` rule.** Its docblock
  said *do not reach for this anywhere content is primarily navigated by
  scrolling — the lists — where the bar is the only thing saying how much is
  left*. That rule was argued directly and overridden; **the cost is stated in
  the code and stands**: the record gives no sign of its length or where you are
  in it. ⚠ **That cost is now partly paid: the fade at the foot is built** — see
  below. It says *there is more below*; **how much** and **where you are** are
  still not said by anything, and the bar is still not the way to say them.
- ⚠ **Desk-only, and it hands 15px of window back.** Measured 15px at 1000, 1152
  and 1440. Scrolling itself is untouched on every surface.
- ⚠⚠ **THE HANDSET STILL SHOWS AN INDICATOR AND CSS CANNOT REACH IT.** iOS draws
  the *main document's* indicator with the native scroll view; `scrollbar-width`
  and `::-webkit-scrollbar` reach scrollable **elements** on iOS, never the page.
  ⚠ **The 0px measured at 390 was not evidence of no bar** — `innerWidth −
  clientWidth` is layout width taken, which is zero for every *overlay* bar drawn
  or not, so the number could not tell the two states apart. Removing it means
  moving the scroll off the document, which four instruments read. **Left alone
  at the user's direction.**
- ⚠⚠ **THE FADE AT THE RECORD'S FOOT IS BUILT, AND IT IS ON EVERY SURFACE — 30
  August.** A gradient one line of the record tall, hanging off the top edge of
  the writing strip: a line dissolves over its own height as it leaves the page,
  which is *there is more below* said without an indicator. **Do not answer any
  of this by putting a scrollbar back.**
  - ⚠ **It hangs off the STRIP, and that is what makes it right in every state
    with no token and no override.** `bottom: 100%` on `writing-sheet::before`.
    The strip is already in the right place on all four surfaces — on the glass
    on a handset, translated off it when the chrome recedes *and* whenever the
    desk is idle, riding `--keyboard-overlap` while somebody writes — so the
    fade's foot is the bottom of the visible record wherever that is. Measured
    at a 0px and a 34px inset: the strip 54px and 75px, the fade's foot on both.
  - ⚠ **Height is `--leading-line`, one line** — the swipe detent's derivation
    (*measure the thing being acted on*), so the desk gets 37.33 against the
    handset's 28 from one declaration.
  - ⚠ **It hides at the end BY CONSTRUCTION**, which is why it is a gradient and
    not an instrument: the ramp ends on `--color-bg`, so over an empty foot it is
    the ground on the ground. **No observer, no state, and deliberately no second
    reader of `endMark`.**
  - ⚠ **It ends on the ground and not on `--glass-tint`** because the state it
    exists for is the receded one, where there is no glass under it. The price is
    a small step at the strip's top edge when the strip *is* there — fully sunk
    against the 26% the glass lets through. If that reads badly the answer is
    `--glass-tint` here and a fade of its own on the desk, not a number between.
  - **Measured by `node_modules/.probe/recordfade.mjs`** (29 assertions);
    `fadelook.mjs` renders the before/after, switching the pseudo-element off
    through the CSSOM because the nonce CSP refuses an injected `<style>`.
- ⚠ **It SIMPLIFIES the type ramp rather than threatening it.** `100vw` counts a
  classic bar and `clientWidth` does not; with no bar they are one number, so the
  mismatch `threshold.mjs` was written around is gone. That probe now proves the
  browser *could* draw a bar — on a blank page, since ours can no longer answer
  for it — and that ours draws none. `markgap.mjs`, `logocol.mjs` and `scale.mjs`
  confirm the column, the mark's band and the stack all followed the 15px.

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
**`--color-accent` was then used by nothing**, which is what this rule always
asked of it. The collision was removed rather than corrected for — see *How
things get fixed*.

⚠ **And on 31 August it is used, by one thing: the convergence mark in the
record's gutter.** Eight days reserved and unspent, then spent on exactly what it
was reserved for. **`--color-accent` now means *this line converged* and nothing
else** — the scarcity rule is unchanged, it simply has a tenant.

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

⚠ **This said overlap still needed a colour and that picking it was Phase 2's
first visual decision. ANSWERED 31 August, and the answer was the token that was
already there.** The worry it recorded — that the accent would have to out-shout
a louder chrome — **turned out not to apply, because the two never appear in the
same place**: `--color-chrome` is a *control* and lives in the bars, the foot and
the caret; `--color-accent` is a *state* and lives in the gutter, where no
control ever goes. The instruction *do not pick it before there is a convergence
to look at* is what made that visible: the portal put one on screen first.
Measured **6.77:1** on the desk's charcoal and **7.70:1** on true black.

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
