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

## Where the build stands — 31 August

⚠⚠ **ONLY A SURFACE THAT RAISES A KEYBOARD REARRANGES ITSELF — 8 September,
directed, AND IT REVERSES A DECISION MADE ON 5 SEPTEMBER.** Asked: *when I tap
in the composer it expands but it also drops slightly — is that to accommodate
the band and foot being the same height? Do we need the desktop version's
composer to expand? If not, leave it as is, including leaving the strip as is,
no need even to have the bar recede.*

- ⚠ **The drop was real, and the answer to the question is yes.** The band is
  `--tap-floor` at rest **precisely so it matches the foot row**; while writing
  the foot goes and the inset becomes `--gutter-l` on all four sides. Measured at
  1440×900, `node_modules/.probe/deskstrip.mjs`: the row closes (−44), the band
  shrinks (−17.34), the card grows a line (+32) and the hem under it opens
  (+16.67) — so the strip's top landed **12.68px lower** and the card's bottom
  **27.32px lower**.
- ⚠⚠ **AND ON THE DESK THAT 44px ROW IS AN EMPTY BOX.** The `<footer>` is
  `stack:hidden` up there, so the whole rearrangement was **moving air around a
  foot nobody can see.** Measured after: every one of the nine readings is
  **+0.00**, and the strip's frame-by-frame is *one step, no transition*.
- ⚠⚠ **THE NOTE THIS REVERSES SAID: *the desk grows too, which is deliberate — a
  pointer-type branch would be a device sniff for a behaviour that reads
  correctly on both.* THE FIRST HALF WAS RIGHT AND THE SECOND WAS BACKWARDS.**
  `pointer.ts` has argued since 18 August that `(pointer: coarse)` is **a
  capability, not a device**, and it is exactly the capability at issue: every
  one of these movements exists because **a software keyboard is about to cover
  the bottom of the screen.** Asking is not sniffing; assuming was what was
  wrong.
- ⚠⚠ **A HAND, NOT A WIDTH, AND THE TWO DISAGREE HERE.** A desk window dragged
  narrow raises no keyboard and must not move; **an iPad in landscape is wider
  than `--breakpoint-stack` and does.** A width gate gets both of those wrong —
  `pointer.ts`'s founding argument arriving in a second place. ⚠ **So this is
  NOT a `stack:` variant**, and it is not design rule 6 being bent: it is not a
  breakpoint at all.
- ⚠ **What is gated is only *the screen making room*.** `writing` still means
  what it always did and the field's handlers are untouched — a desk click still
  focuses, commits and blurs. `makingRoom = writing && touch` feeds the bar's
  recede, `useKeyboardHem`, `sheet-over-keys`, the band, the hem under the card,
  the glow's tightening, the foot's close and its `inert`; the third line reads
  `touch && (writing || draft || landed)`, because a desk box that never grows
  must not grow on typing either — **that is the deleted growing box, and the
  clipping guard it exists for cannot fire on a box that is always two lines.**
- ⚠ **`false` until mount, and nothing may read it before then.** Every consumer
  is downstream of a focus, which is always after the correction — the same
  condition `page-screen.tsx` states for its own copy of this hook.
- ⚠ **The known imprecision, stated: a touchscreen laptop reports coarse** and
  will get the phone's behaviour with a physical keyboard under it. `pointer.ts`
  already records that trade — *both get the layout that suits what is in their
  hand* — and there is no better question the platform answers.
- ⚠ **`chromeink.mjs` grew a third surface and it is the point of it now:** a
  **fine-pointer desk must not recede at all**, asserted in both engines, while a
  *touch* desk at 1440 still does and is where the ink contract is measured up
  there. ⚠ **`composercap.mjs`'s "desk" is a TOUCH desk** — `open()` passes
  `hasTouch: true` to every context — so its 51/51 is not evidence about a real
  one; noted in the file.
- **Unchanged, asserted:** `stripstep.mjs` 50px and no overshoot on both handset
  insets, `sheetjolt.mjs` 16/16, `frontpage.mjs` green, `composersent.mjs` still
  36/38 on the two stale assertions.

⚠⚠ **THE INK LEAVES, THEN THE SLAB LEAVES — 8 September, AND IT IS THE ONLY
ARRANGEMENT THAT ANSWERS BOTH DIRECTIONS GIVEN ABOUT THIS FADE.** Reported from
an iPhone 12 installed: *the logo is still too bright as it slides under the
time.* The entry below had just made the fade visible at 113ms; this is what
that cost, and the two asks turned out to be **geometrically** incompatible
rather than a matter of taste.

- ⚠⚠ **5.4px. THAT IS THE WHOLE DISTANCE BETWEEN THE MARK AND THE STATUS BAR,
  AND IT DECIDES EVERYTHING.** Measured, `node_modules/.probe/inkcrossing.mjs`:
  the mark sits at top 52.4 against an inset of 47, and **crosses that line
  2.6ms into the travel, still at 0.96 opacity.** At `--ease-recede` 5.4px is a
  sixth of a frame.
- ⚠⚠ **SO NO DURATION CAN SATISFY BOTH.** *Dim by the status bar* needs the fade
  97% done inside one frame — which is the cut 57ms already was — and *a fade the
  eye can see* needs several frames. **Neither direction was wrong.** The mistake
  was trying to answer both with one number, twice.
- ⚠ **They are separated in time instead.** `chrome-ink-gone` sets
  `--recede-delay: var(--ink-out)` and the header's `delay-[…]` reads it, so the
  ink fades **in place** with nothing moving to distract from it and the slab
  does not start travelling until it is out. Measured after: the mark holds at
  top 52.42 through 1 → 0.855 → 0.708 → 0.559 → 0.412 → 0.264 → 0.119 → 0, then
  crosses the line **at 0 opacity**. ⚠ **Nothing bright passes under the clock on
  any inset**, because the mark is at zero before the bar has moved at all.
- ⚠⚠ **DECLARED ON THE EXIT STATE, SO THE RETURN IS UNTOUCHED.** A transition
  reads its timing from the after-change style: adding the class says *wait for
  the ink*, removing it says *go now*. **The bar still comes back immediately and
  its ink still arrives after it** — `--ink-in` 382.5ms against a 340ms slide,
  which is the rule `--ink-in` exists for. ⚠ **A custom property read by the
  header's own `delay-[…]`, never a second `transition-delay` rule** — the
  ordering trap `chrome-ink-gone` already records.
- ⚠ **What it costs, stated: the exit is `--ink-out` + `--recede` = 453ms end to
  end**, against 340. The extra 113ms is spent on an already-empty slab, so
  **nothing legible is on screen for longer than it was.**
- ⚠ **Both bars get it**, and `page-screen.tsx`'s recede is driven by a moving
  finger rather than a focus. **If the record's bar reads sticky on a scroll,
  `--recede-delay` is the line, and the answer is a prop rather than a smaller
  number.**
- ⚠⚠ **THE GLOW IS STILL NOT FADED BY ANY OF THIS, AND IT IS THE FIRST SUSPECT IF
  THE MARK STILL READS BRIGHT THERE.** `mark-glow` is on the header itself rather
  than in the row `chrome-ink` fades, so it slides under the clock at full
  strength — deliberate since 7 September, *reported and then clarified*, and
  unexamined against this complaint.

⚠⚠ **THE BAR'S INK FADES WHERE IT USED TO POP — 8 September, `--ink-out` GOES
`--recede / 6` → `--recede / 3`, 57ms → 113ms.** Directed: *could the logo and
profile icon fade out as they recede more quickly — **the fade out should be
noticeable to the human eye.*** **At 57ms it was not.** That is 3.4 frames at
60Hz, and the eye reads three frames as a disappearance rather than a fade.

- ⚠⚠ **THE NOTE ON THAT TOKEN PREDICTED THIS AND PUT THE BOUNDARY ONE STEP TOO
  LOW.** It said *if it still reads slow, the next step is `/ 8` (43ms) and then
  it stops being a fade.* **It had already stopped.** 57ms was on the wrong side
  of the line, not one step from it — and the measurement that chose it was of
  *where the bar is*, never of *whether a fade can be seen*, which is the
  question it was answering.
- ⚠⚠ **113ms IS SIZED TO THE WINDOW IN WHICH ANYTHING CAN BE SEEN, AND THAT
  WINDOW IS FAR SHORTER THAN THE TRAVEL.** `--ease-recede` is
  `cubic-bezier(0.22, 1, 0.36, 1)`, a hard ease-out, so the bar spends most of
  its 340ms creeping the last few pixels. Measured at 390×844 with the inset
  overridden — `node_modules/.probe/inkcurve.mjs` — the header's bottom edge runs
  **95 → 74.9 → 43.2 → 16.6px at 0 / 8 / 42 / 99ms**: it is 83% gone by 100ms and
  the remaining 240ms is invisible. ⚠ **A fade longer than ~120ms spends its tail
  off screen**, which is why this is not `/ 2`.
- ⚠ **The out rule survives and is the reason to stop at a third.** *The ink is
  out as the bar clears rather than while it is still in view* — at 113ms the
  row's bottom is ~13px, so the fade ends exactly as the row leaves. It is now
  spread across the whole of the visible slide instead of finishing before the
  slide starts. Measured after: **half gone at 58ms, out at 106ms, row off screen
  at 287ms.**
- ⚠⚠ **WHAT IS ABANDONED, STATED RATHER THAN QUIETLY DROPPED: the status-bar
  landmark.** 7 September directed *basically faded by the time the logo and
  profile icons approach the status bar*; under 113ms the letters are at ~0.88
  opacity as they cross it. **The two asks cannot both hold**, because a fade
  completed inside the 14–34px of travel before that crossing is a fade nobody
  can see. If the crossing ever matters more, this goes back to `/ 6` and the
  fade goes back to being a cut.
- ⚠ **Still a fraction of the travel, never a typed number**, so it moves if
  `--recede` does; still linear, which `chrome-ink` argues for — an ease has a
  tail or a pop and this has neither. ⚠ **`--ink-in` is untouched at 382.5ms**,
  so the bar still lands before its own ink.
- ⚠ **`page-screen.tsx`'s bar gets this too**, and its trigger is a moving finger
  rather than a focus. That is the surface to look at first if it reads wrong.
- ⚠⚠ **AND `chromeink.mjs` WAS LYING IN BOTH ENGINES, IN TWO DIFFERENT WAYS.**
  Chromium: the `ctx.route` CSP strip **breaks hydration**, so every Chromium
  assertion read a page that had never come alive — the strip is now WebKit's
  alone. WebKit: it waited **600ms** after load before calling `field.focus()`
  and had not hydrated either, so `receded` never flipped; 1500ms fixes it.
  **Both failure modes look like a passing screenshot.** 16/16 green in both
  engines on both surfaces afterwards, with 3–6 frames of interpolation where
  57ms could scrape one.

⚠⚠ **THE COMPOSER'S FOOT ROW CLOSES RATHER THAN LEAVING — 8 September, AND IT
IS THE JOLT.** For two days the strip's jolt on tapping in was put down to iOS
panning the visual viewport and dragging the `fixed` strip. **The pan is the
amplifier; the cause was ours, and it is visible on a desk browser with no
keyboard anywhere near it.**

- ⚠⚠ **MEASURED AT 1440×900, WHERE NOTHING iOS DOES CAN REACH.** The strip's top
  fell **44px in one frame** and climbed **31px back over 300ms**, settling
  12.68px lower. **The 44 is exactly the foot row**, which unmounted instantly
  while the band, the card's third line and the hem under it all eased over
  `--recede`. Reported from the desk with two screenshots — *the strip drops
  down when you tap in* — after being reported from a handset as *up, then down,
  then up again*. `node_modules/.probe/deskstrip.mjs`.
- ⚠ **On a handset the same step is 62.5px**, because `sheet-over-keys` cancels
  the notch's 18.375px clearance in the same frame. `stripstep.mjs`, at inset 34
  and at 0.
- ⚠⚠ **THE ROW'S OWN DOCBLOCK NOMINATED THE FIX BEFORE ANYBODY MEASURED IT:**
  *it does not fade, and that is a known rough edge — `hidden` carries the
  opacity transition and cannot carry a height, so this is a hard swap where
  everything else on the bottom edge moves on `--recede`. **If it reads badly,
  the fix is a collapsing row and not a reserved gap.*** It read badly.
- ⚠ **`composer-foot` / `composer-foot-away`:** `block-size` gated on
  `--foot-open`, `overflow: clip`, transitioned on `--recede`/`--ease-recede`.
  `foot-clear`'s margin reads the same gate, so a row's height and its air can
  never disagree. ⚠ **A custom property, never a second declaration** —
  `@utility` output is ordered by Tailwind, which is the trap `chrome-ink-gone`
  records.
- ⚠ **`min-block-size` could not do it.** A minimum cannot be interpolated to
  zero, because the content holds it open. An explicit `block-size` is what makes
  the close animatable, and it is the same 44px.
- ⚠ **`overflow: clip` does a second job the row used to do by arithmetic** —
  `tap-target`'s 44px hit area, 9px past the drawing at each end, is contained by
  construction at every height including the half-closed ones. ⚠ **`clip` and not
  `hidden`**: `hidden` makes a scroll container, and a 0-height scroll container
  is one `scrollIntoView` from shifting its own contents.
- ⚠ **The glyphs' fade is `Foot`'s own `hidden` prop** — `opacity-0` on
  `--recede` and `--ease-recede`, the same duration and curve as the close.
  **No new fade was written**; the record's strip has faded its foot that way
  since the split, and this is the composer finally using it.
- ⚠⚠ **`arrived` IS GATED ON `!writing`, AND WITHOUT IT THE BOUNCE WOULD BE
  SPENT ON NOBODY.** A mounted row plays the animation behind `opacity-0` and
  `onAnimationEnd` puts the flag down — *a signal nobody could have seen is not a
  signal*, which is the guarantee the unmount used to give for free.
- ⚠ **`inert` while it is closed**, because `pointer-events: none` answers a
  thumb and not a keyboard user — and focus landing inside the strip is read by
  the field's `onBlur` guard as *not leaving*, which is a trap rather than a
  rough edge.
- ⚠ **The strip's `padding-block-end` travels too**, so the notch's clearance
  joins the one curve. ⚠ **This does not re-open the `--keyboard-height`
  mistake:** that was a *continuous measurement* answering a binary question, so
  the whole step landed at whichever frame a per-frame ramp crossed a clamp. A
  transition is deterministic and starts at the gesture. ⚠⚠ **`padding-block-end`
  BY NAME, NEVER `all` AND NEVER `bottom`** — `bottom` is `--keyboard-overlap`,
  written per frame off the visual viewport, and transitioning it would add 340ms
  of lag to a measurement that is already a frame late against a compositor pan.
- ⚠⚠ **THE ASSERTION IS MONOTONICITY, NOT A NUMBER.** The card still ends 50px
  lower than it started and that is correct — with the keys up the strip rides
  `--keyboard-overlap` back over them. **The defect was going PAST it and coming
  back**, and only a per-frame sample can see a path. `stripstep.mjs` and
  `deskstrip.mjs` fail on any overshoot; measured after, **0px on the desk and
  0.02px on both handset surfaces.**
- ⚠⚠ **A PROBE BUG THAT HAD BEEN INVALIDATING MEASUREMENTS: STRIPPING THE CSP
  THROUGH `ctx.route` BREAKS HYDRATION IN CHROMIUM.** No `__react*` props on any
  element, so `onFocus` never runs, `writing` never flips, and the page is dead
  server HTML **that still looks completely correct**. `sheetjolt.mjs` had three
  failures that were entirely its own; it is rewritten and green at 16/16.
  ⚠ **Chromium treats `http://localhost` as a secure context and needs no strip;
  it is WebKit that does** — see `keep-ios-standalone-short-viewport`. Any probe
  that DRIVES this page through a route handler is testing markup, not the app.
- ⚠ **WHAT IS NOT FIXED: iOS's reveal-pan.** It still drags the `fixed` strip on
  the taps where it happens, and whether it happens is a heuristic — the rail
  session measured *one tap in four* where it does not. **The down phase is gone;
  whether what is left still reads as a jolt is a handset question**, and the
  three approaches ruled out on 7 September are still ruled out.
- **Unchanged end state, asserted:** `bandink.mjs` still reads band 44, air below
  the card 44, the strip on the bottom edge, the notch spent at inset 34 and zero
  at inset 0. `composercap.mjs` 51/51, `traysightline.mjs` 5/5, `frontpage.mjs`
  green. `composersent.mjs` stays 36/38 on the two stale assertions recorded on
  7 September.

⚠⚠ **THE APP IS **JUCE** — 8 September, directed, AND THE RENAME MOVED SIX
NUMBERS THAT ARE NOT STRINGS.** *Change the name of the app to 'juce'.* Nine
user-facing strings, one icon glyph, and **the wordmark fence at the top of
`app/globals.css`** — which is the half a rename does not look like it touches.

- ⚠⚠ **A RENAME MOVES THAT FENCE EXACTLY AS A CHANGE OF FACE DOES, AND ONLY ONE
  OF THE TWO ANNOUNCES ITSELF.** Six of the nine `--wordmark-*` numbers are the
  inked bounds of *one word in one face*; the face did not move and six of them
  did. **A change of face is a decision about type and nobody ships one without
  opening that block; a rename reads as a sweep of strings, and `2.9351` is not
  a string.** Bricolage Grotesque 800, KEEP → JUCE at 0.08em: lead −0.2581 →
  −0.2425, tail −0.27 → −0.2544, ink 0.6719 → 0.7031, drop 0 → **0.0156**,
  slack 0.17 → 0.1544, advance 2.9351 → **2.75**. `line`, `track` and `weight`
  are the face's and did not move.
- ⚠⚠ **`--wordmark-drop-ratio` IS NOT ZERO FOR THE FIRST TIME SINCE AGAIN, AND
  THE FENCE PREDICTED IT IN THE WRONG WORDS.** It said *if the mark ever returns
  to a lowercase word this stops being zero*. **The axis is round letters, not
  case**: KEEP's K, E and P start flat at the cap line and stop flat on the
  baseline; JUCE's U and C overshoot at both ends, and `Juce` in sentence case
  reads the same 0.0156 rather than more. ⚠ **Nothing on screen moves because of
  it** — the one thing that read `--wordmark-drop` was `cinema-wall.tsx`,
  deleted with the poster wall — but the token is live rather than dormant, and
  **do not delete it on the grounds that the mark is set in capitals.**
- ⚠⚠ **THE INK RATIO REACHES THE HANDSET AND NOT THE DESK, AND THE FENCE CLAIMED
  BOTH.** `--text-mark` is `--glyph-bar / --wordmark-ink-ratio`, **but above
  `--breakpoint-rail` it is overridden to the literal `--text-mark-rail`** — so
  from 720px up the band moves on the advance alone. Measured under both fences:
  at 390 the mark's font-size goes 32.73 → 31.28 and the band 116.09 → 106.05;
  at 1440 the font-size is 34.66 either way and the band 144.41 → 137.98.
  ⚠ **`--record-floor` is the exception and reads both**, because it writes the
  below-rail band out in full rather than going through `--text-mark`: 503.36 →
  **513px**, so the desk's reading column widens.
- ⚠ **The mark's INK is unchanged and only its font-size moved.** That is the
  ratio doing its job — the mark is set so its ink is the height of the glyphs
  beside it, so a word that inks *more* of its em is set *smaller*. **Do not read
  31.28 against 32.73 as the mark shrinking.**
- ⚠ **`keepcolumn.mjs` and `markgap.mjs` were re-run and both pass** — the
  column never widens as the window narrows, the band is held from 720px up, and
  nothing steps at the rail. ⚠ **`keepcolumn.mjs` pins the advance as a literal
  and FAILED, which is exactly what it is for**; `markgap.mjs` and `logocol.mjs`
  find the mark by its text and could not see it at all.
- ⚠⚠ **THE ICON SAID `A` ALL THROUGH THE *KEEP* RENAME AND NOBODY SAW IT.**
  `app/apple-icon.tsx` draws the mark's initial as a single letter, so a rename
  that greps for the word finds nothing there to find. It is `J` now and the file
  carries the warning. **Check it by eye, not by search.**
- ⚠ **Nine strings: `metadata.title`, `appleWebApp.title`, the manifest's `name`
  and `short_name`, the bar's mark, both auth posters, the error screen's prose
  and the record's `sr-only` heading.** The posters are `Juce.` in sentence case
  and the CSS uppercases — **the word is spelled as a word in the DOM
  everywhere**, which is `wordmark`'s own rule.
- ⚠ **The case costs less than it did, because the word lost a descender.** Under
  `Keep` the two cases disagreed on drop (0.205 against 0) and slack (−0.045
  against 0.16) on the `p`'s tail. **`Juce` has no descender**, so only lead and
  ink move between the poster's sentence case and the bar's capitals.
- ⚠ **`package.json` still reads `again` and is deliberately untouched** — it is
  the npm identifier of a private package, it survived the last rename for the
  same reason, and changing it is lockfile churn nothing reads.
- ⚠ **`keep?` is still the third beat on the sign-in wall and `Keeping it?` is
  still the console's question.** Both are the product's own verb rather than the
  old name, and `lib/vocabulary.ts` owns them. **Renaming the app does not rename
  a verb.**
- **Measured by `node_modules/.probe/jucemark.mjs`**, which prints KEEP and JUCE
  side by side in the shipping face and **reproduces the KEEP column of the
  shipped fence to the digit** — the check that it is reading what ships rather
  than a canvas default. ⚠ **`zine.mjs` had 8 assertions red since the 7
  September face swap**, all of them asserting *Instrument Serif*; pre-existing,
  fixed here, and green on both surfaces.

⚠⚠ **A FILM IS NOWHERE; A SCREENING IS SOMEWHERE — 6 September, Amendment 9,
AND IT IS THE SHORTEST ROUTE TO A LOCAL RAIL.** Asked: *why isn't a film
somewhere you can go if it's in the cinema?* **It is, and the entry above this
one was wrong to say the corpus is nowhere.** §3 already had the word and its
first example is exactly this: *an occurrence — a time-bound experience
connected to a possibility: **a screening**, workshop, concert, event.*

- ⚠⚠ **THE 71 FILMS ALREADY IN THE CORPUS BECOME *THINGS TO DO NEAR ME* THE
  MOMENT OCCURRENCES EXIST.** No new possibilities, no contributed data, no
  local catalogue — **only when and where they are on.** It was missed because
  the film and the showing of it had been treated as one object.
- ⚠ **A screening inherits the film's poster**, so it clears Amendment 7's image
  gate **for free**. It is the one vertical where the picture problem solves
  itself; everywhere else the picture is the constraint.
- ⚠ **Two objects, two locations.** `possibilities.latitude/longitude` are for a
  possibility that genuinely sits somewhere — **a place**. An occurrence carries
  its own location **and a time**. ⚠ **Do not try to make the possibility's
  columns hold a screening**: a film shown in forty cinemas is forty occurrences
  and one possibility.
- ⚠ **`occurrences` and `offers` do not exist as tables** and are **deferred,
  not designed away** — shape decided (possibility, place, start, provenance,
  expiry), built when there is a source. ⚠ **Nothing is lost by waiting, which
  is the difference from the coordinates**: nobody is generating occurrence data
  today, so no unrecoverable moment is passing.
- ⚠ **Showtimes are their own supply problem** — TMDB does not carry them and
  there is no dependable free feed. **One narrow dependency rather than local
  data for the whole world**, which is the reason to prefer it.

⚠⚠ **AND THE CORPUS IS TWO LAYERS, NOT A CHOICE — asked: *why not both the free
sources and people adding it themselves?*** **Because it was put as a choice and
it is not one.**

- **The free source is the SKELETON** — OpenStreetMap and the like give names,
  coordinates and categories with **no images**.
- ⚠ **Amendment 7 read as it was actually given is what makes this work:** the
  image is a gate on the **rail**, never on the corpus. Skeleton rows live in
  the corpus, are searchable, are resolvable and converge — **they simply do not
  show.**
- **A photograph is what ADMITS one.** The picture attaches to a row that
  already has the right name and the right coordinates, and that row can now
  enter the rail.
- ⚠⚠ **THE PAYOFF IS CANONICAL IDENTITY, AND IT REPAIRS A WEAKNESS RECORDED THE
  SAME DAY.** Without a skeleton, two people photographing one café make **two
  rows and never converge**. With one they attach to the **same** row, so they
  do — and §7's *Corroborated by several people* has something to corroborate
  rather than two strangers to merge.
- ⚠ **The licence is a real check, named rather than assumed.** OpenStreetMap is
  **ODbL**: attribution required, share-alike obligations on a derived database.
  §7 already requires provenance and attribution so the spirit is compatible —
  **but it is a decision to take before ingesting, not a free lunch.**
- **Nothing is built by this entry.** Amendment 9; §3's *Occurrence* and §4 of
  `docs/re-direction/the-front-page.md` carry it.

⚠⚠ **THE RAIL IS GLOBAL BY DEFAULT AND LOCATION IS A CONSTRAINT ON IT — 6
September, directed, Amendment 8. THE COORDINATES AND THE EXPLANATION SLOT ARE
BUILT; NOTHING ELSE IS.** Directed: *find things to do based on their own
record… as for location, there should be an option to constrain what the rail
shows to their current location, otherwise the default is a global presentation
of things to do, see, eat, try, buy.*

- ⚠⚠ **§7 ALREADY HELD THE ANSWER AND IT RULES OUT THE EXPENSIVE HALF.** The
  relevance ladder, in priority order: **exact active possibility match; same
  place or activity linked to an active possibility; same explicit intention or
  type; freshness and confidence; distance and time relevance** — with the copy
  mandated as *Because you saved "try pottery".* **The top three are joins on
  records the app already holds.** §7 then says in its own words that *inferred
  taste, embeddings, and opaque recommendation models are not required for the
  first release.*
- ⚠ **So semantic parsing is the fallback, not the mechanism**, and it is a
  **paid dependency** — a model, a vector index, a re-embed on every
  contribution. **Lodged beside the Blob store and the vision model**, under the
  standing direction not to build what costs money.
- ⚠ **The tension Amendment 6 left behind, named: most captures have no type.**
  A capture is words and most never resolve, so **term 3 reaches only the
  minority that did** — and deriving a type from free text *is* the inference
  being deferred. Not an argument against the ladder; the reason terms 1 and 2
  are above term 3.
- ⚠⚠ **THE RAIL MAY RANK; THE FAN-OUT MAY NOT.** §2 as amended: similarity
  *proposes to the person who wrote the line and never writes a notification to
  anybody else.* **An inferred match that wrote one would tell somebody *Sam
  wants this too* when Sam wrote something merely similar** — the app making an
  untrue claim about a third party. **This is the one failure here that damages
  trust rather than function.**
- ⚠ **The constraint is what makes the rail legal.** Amendment 5's test is *a
  rail ordered by something the reader chose, or by nothing at all, is not* a
  feed, and §2 permits recommendation only as *an explained, user-controlled*
  result. **The reader switching location on is the control half.** Distance is
  §7's weakest term, so a filter rather than a sort is what the ladder already
  asks for.
- ⚠⚠ **`RailTile.why` EXISTS, IS `null` ON EVERY TILE, AND THAT IS THE POINT.**
  §7 gives the copy and Phase 5 requires that *For you here can explain its
  relation to the user's list* — **and an explanation retrofitted onto a rail
  that already ranks is the thing that never gets done.** The field ships before
  the ranking so every consumer has to decide what an empty one looks like;
  `console.tsx` did exactly this for the convergence sentence a phase early. ⚠
  **A sentence, never a score** — *0.82 relevant* is §7's banned numeric score
  renamed. ⚠ **About the reader's own record only**: *three of your friends want
  this* is a disclosure nobody consented to make.
- ⚠⚠ **`latitude` / `longitude` ON THE POSSIBILITY — `0017`, AND IT IS THE ONE
  UNRECOVERABLE COST IN THIS AREA.** Nothing reads them and no rail is gated on
  them. **But a possibility contributed without coordinates can never be given
  them** — you cannot retroactively locate somebody else's photograph — so every
  row added between now and the day location ships would be permanently
  un-locatable.
- ⚠ **On the POSSIBILITY, never on the capture.** §1 excludes continuous
  background location tracking, and where a person was when they wrote something
  is a different fact from where the thing is. **Do not add a location to
  `captures` because this is here.**
- ⚠ **`double precision`, not PostGIS, and no index.** A geography column with a
  GiST index is what this should become, but that is an extension, an index and
  a query taken before one located row exists. ⚠ **Upgrading is a BACKFILL from
  these two columns** (`ST_MakePoint(longitude, latitude)`), not a
  re-collection — the expensive half is bought by having them at all. Whether
  the index wants a composite btree for a bounding box or a GiST for a KNN order
  is a decision that belongs **with the query**.
- ⚠ **Null is the ordinary case.** A film is nowhere, and most of the corpus
  always will be — so a rail constrained to a location removes most of it, which
  is exactly why the constraint is optional. ⚠ **A constrained rail that empties
  is §6's *silence stays silent*, not an empty state to write copy for**, and
  Phase 5's *an area without source coverage does not render a misleading rail*
  binds the default too.

⚠⚠ **THE RAIL IS IMAGES AND NOTHING ELSE, AND THE WORDS ARE BEHIND THE TAP — 6
September, directed, Amendment 7. DOCUMENTED, NOT BUILT.** *What's presented is
the image on the front page; for users to find out what each image signifies
they have to tap it, at which point the card details — the title, qualifier —
appear beneath the enlarged, almost full-screen image. Above each image is a
number showing how many openings it has received.* And the gate, given after:
***any entry that doesn't have an attached image can never enter the front page
rail.***

- ⚠⚠ **THE GATE IS ON THE RAIL, NOT ON THE CORPUS.** A possibility with no image
  still exists, is still searchable, is still what a capture resolves to, and
  still converges. **It never appears in the rail.** One term in the rail's own
  read — nothing near `lib/overlap.ts`, nothing near the capture path. ⚠ **And
  never a gate on capture**: §1 bans a forced catalogue match before saving, and
  Amendment 6 is what keeps the two apart.
- ⚠ **It reverses §3 of the brief, whose founding line was *THE CORPUS CANNOT
  PROMISE AN IMAGE*.** Three rules die with it: *no image is not an error
  state*, *the name set in the frame is the drawing*, and the imageless card as
  a thing to design. **Two states to judge now, not four** — an image that fits
  the frame and one that letterboxes.
- ⚠⚠ **THE TILE SAYS NOTHING, AND THAT IS THE DIRECTION.** No title, no
  qualifier, no caption, no hover. ⚠ **Do not answer *I can't tell what these
  are* by putting the title back** — the answer is one tap away. **Stated price:
  browsing is exploratory rather than scannable.**
- ⚠ **Amendment 6 is untouched.** The qualifier is still a field the possibility
  carries and the opened view still branches on nothing; only where it prints
  moved.
- ⚠⚠ **THE OPENED VIEW BORROWS THE CONSOLE'S GRAMMAR AND IS NOT THE CONSOLE** —
  fixed over a blurred page on a handset, expanding in place on the desk. **Not
  routed through `components/console.tsx`**, which acts on the viewer's own
  capture; **and it must not resurrect `film-screen.tsx`**, deleted in Phase 2
  step 1.
- ⚠⚠ **THE OPENING COUNT IS THE ONE ENGAGEMENT NUMBER IN THIS APP, AND IT
  NARROWS A RELEASE 1 EXCLUSION.** §2's *social without a feed* bans engagement
  loops and §1 bans engagement metrics; Amendment 5 bans a trending rail by
  name. **Directed with that stated.** What survives: it counts openings of a
  **possibility**, which belongs to nobody; it may never appear on a person, a
  capture, a track or a notification; **§5's *the portal is never given a count*
  is untouched**. ⚠⚠ **IT IS NEVER A SORT KEY — the day it orders the rail, the
  rail is a trending feed and the exclusion has been broken.** ⚠ It is
  `--color-muted`: brass means *a control*, the accent means *this converged*,
  and a count is neither.
- ⚠⚠ **THE BROWSE HALF SHRINKS WHEN SOMEBODY WRITES — *sort of parallax style*,
  and §9's last open question is closed.** ⚠ **Keyed on `writing`, NEVER on
  `--keyboard-overlap`** — that property measures a gap that also opens when a
  Safari tab's address bar collapses during a scroll, and `useKeyboardHem` says
  in writing that it is not a keyboard detector. The composer's third line
  already follows this rule; the rail follows the same one so the two halves
  cannot disagree. ⚠ **One duration and one curve** — `--recede` on
  `--ease-recede`: **parallax is a difference of distance, not of timing.** ⚠
  **It must not unmount.**
- ⚠ **`fixture` is §4's word for a thing you own** — an `EntryState` the linter
  enforces. A hand-made row for judging a tile is a **sample possibility**. The
  brief said *fixture* and has been corrected.
- ⚠⚠ **THE MIGRATION IS BUILT AND APPLIED — 6 September, `0015`, THREE
  COLUMNS ON `items` AND TWO BACKFILLS.** `qualifier`, `image_path` and
  `open_count`. **Production first, then dev**, in that order; both read 16 of
  16 afterwards. ⚠ **`0014` had never been applied to dev** and went with it —
  pre-existing, not from this work.
- ⚠⚠ **`image_path` IS A THIRD COLUMN THE BRIEF DID NOT ASK FOR, AND IT IS THE
  SAME FAULT `year` HAD.** The picture lives at `metadata->>'posterPath'` —
  **a film-shaped location for a universal thing**, exactly as `year` was a
  film-shaped qualifier. The rail's gate has to be **one term**, so it reads a
  column. ⚠ **The rail must never read `metadata->>'posterPath'`**: a JSON term
  is a branch on kind wearing a different hat.
- ⚠ **A PATH, NOT A URL, AND THAT IS LOAD BEARING.** `lib/posters.ts` picks the
  CDN size at **render** time — `rungFor` measures the viewport and multiplies
  by `devicePixelRatio` — so a URL resolved at ingest would freeze the size and
  undo that whole mechanism.
- ⚠ **Both backfills are re-runnable**, guarded on `target IS NULL`. **Measured
  on production: 71 possibilities, 71 with a qualifier, 71 with an image** — so
  the rail's gate excludes nothing that exists today, and every one of them had
  both a year and a poster to take.
- ⚠ **The ingest writes them, stated by the CALLER and never derived in
  `lib/db/`.** `PossibilityInput` gained two required fields, so the compiler
  asks at every call site — a `String(year)` inside `upsertPossibility` would
  put the film-shaped assumption back one layer down, where it is harder to see.
  Without this, only the 71 backfilled rows would ever reach the rail.
- ⚠ **`onConflictDoNothing` STAYS, and it is not an oversight to upgrade to a
  `DO UPDATE`.** A possibility is shared and canonical; letting the second
  person to resolve to a film overwrite its picture is one account editing the
  corpus every other account reads.
- ⚠⚠ **THE CORPUS HAS A READER — `listRail`, 6 September, `0016`.** The
  admission rule lives in it **and nowhere else**: `image_path is not null`.
  Keyset cursor on `id` — *by nothing at all*, which is what §2 permits — so a
  walk shows no row twice and skips none. ⚠ **A seed with no cursor starts at a
  RANDOM point and wraps**, because a stable order read from its start shows
  every reader the same 24 tiles for ever: **a shelf, not a feeder.** Paging
  onward does not wrap.
- ⚠⚠ **MEASURED RATHER THAN ASSERTED, AND THE SMALL TABLE LIED.** The docblock
  first claimed *an indexed range scan with no sort at any corpus size* and
  `EXPLAIN` did not support it: at 58 rows the planner takes a **Seq Scan plus
  a Sort**, and `enable_seqscan = off` only gets a **Bitmap** Index Scan, which
  does not preserve order — so the Sort stays. **Built the shape at 300,000 rows
  and asked again: plain Index Scan, no Sort, 27 buffers, 0.126 ms** for a page
  of 24 from a random start. ⚠ **A `Seq Scan` in a local `EXPLAIN` is not a
  regression** — it is what a 58-row table costs.
- ⚠ **`items_rail_idx` is PARTIAL on the gate**, so on a corpus that is mostly
  imageless — which is what Phase 4 makes it — the index stays the size of the
  rail rather than the size of the catalogue.
- ⚠ **The start uuid is generated in NODE.** `gen_random_uuid()` was tried
  first and is **a round trip to Neon spent before the read it exists to
  begin**; `crypto.randomUUID()` is built in and the same uniform 122 bits.
- ⚠ **`open_count` gets no index**, so the ordering that would break the
  never-a-sort-key rule is also the one that gets slow enough to notice.
⚠⚠ **THE RAIL IS DRAWN — 6 September, and two things only a screenshot could
have found.** `components/rail.tsx` is a **server component handed into
`ComposeScreen` as a node**, so the corpus read, the image URLs and the
markup itself stay off the client — the arrangement the portal already uses for
its console. 24 tiles, `--tile-width` 9rem, `aspect-2/3`,
`object-contain`, bleeding past the column so a tile is cut at the edge.

- ⚠⚠ **AN `sr-only` SPAN ON THE `<li>` BROKE THE ENTIRE PAGE, AND
  NOTHING BUT A PROBE SAW IT.** `sr-only` is **`position: absolute`
  with no offsets**, so with no positioned ancestor each span resolved against
  the **initial containing block** and **escaped the rail's clipping**:
  twenty-four of them at their static positions stretched the document to
  **3792px on a 390px handset**, the mobile viewport zoomed out to fit at 4×,
  and **the composer and the foot went off the bottom of the screen.** ⚠ **The
  tiles still looked correct in the screenshot**; what found it was
  `frontpage.mjs` reporting that `<main>` intercepted a click meant
  for the composer. **Typecheck, lint and build all passed.** The fix is one
  word: the span lives inside the frame, which is already `relative`.
- ⚠⚠ **THE TITLE IS NOT ON `alt`, AND PUTTING IT BACK IS THE BUG.** With
  it there, a poster path TMDB no longer serves draws **the alt text and a
  broken-image icon** — words, on a tile whose whole design is that it has none.
  Two of the first three tiles on the dev database did it. `alt=""` marks
  the image decorative so a failed one renders **nothing at all**, and the
  frame's ground is what is left. ⚠ **Not a data problem**: TMDB withdraws
  artwork, so a path that resolved at ingest can stop at any time.
- ⚠ **An empty rail draws NOTHING** — not a message, not a skeleton. §6's
  *silence stays silent*, and Phase 5's *an area without source coverage does
  not render a misleading rail* from the other end.
- ⚠ **`touch-pan-x` and no verb.** The record's rows own the horizontal
  swipe for the lock, so this is a **scroller**. **The day a swipe on a tile is
  given a verb it collides with that**, and design rule 5 is what it answers to.
- ⚠ **Nothing is drawn for a zero opening count**, and the row keeps its height
  either way so the pictures stay on one line. Mono at `--text-micro` but
  **not `stamp`** — that utility is tracked +0.22em and uppercased, which
  reads as spaced-out digits on a number. `--color-muted`: brass means a
  control, the accent means *this converged*, and a count is neither.
- ⚠ **There is no tap yet**, so a tile is not a `<button>` — a control
  that does nothing is worse than no control. The opened view is next.
- **Measured on both surfaces**: 24 tiles, first tile on the column's text edge
  at 20 and 293, `touch-action: pan-x`, no page overflow, and
  `frontpage.mjs`'s 23 assertions all green after the fix.

⚠⚠ **THE CARD BRANCHES ON NOTHING, AND STEP 0 OF THE FRONT PAGE'S SEQUENCE IS
DISSOLVED RATHER THAN ANSWERED — 6 September, Amendment 6.** The sequence said
*decide `Kind` — four values today, seven in §3 — before the card is written or
it is re-touched afterwards.* **The premise was false in the model this app
already has**, and asking it from the origin is what showed it: *I see things
that interest me and want to make a record of them — an aesthetic, a film, a
book, an object, a house, a car, even an ambition, and optionally the reason.*

- ⚠⚠ **`captures` HAS NO KIND COLUMN AND MUST NOT BE GIVEN ONE.** A type is a
  property of the **possibility** — `lib/db/captures.ts` reads it as
  `possibility?.kind ?? null` — and most captures never resolve to one. **An
  ambition never will**: no external id, no image, no year, and no catalogue
  will ever hold it. It is a complete capture today and, under Amendment 4, a
  first-class convergence, because the words are what match.
- ⚠ **A closed enumeration of *interest* grows an `other` that swallows the
  majority**, and a majority in `other` is the taxonomy saying it was never the
  right axis. §2's *capture before categorisation* is strengthened by this, not
  bent.
- ⚠⚠ **THE QUALIFIER WAS A SLOT SOLVED AS A TAXONOMY.** §3 of the brief derived
  the card's one line from the kind — year for a film, author for a paper,
  locality for a place. **That branch is what made the union look load-bearing.**
  The possibility carries a `qualifier` instead, written at ingest, and the card
  prints `title + qualifier + image?` with **no branch anywhere in it** — which
  is design rule 3, *one object has one height*, made true by construction
  rather than by care.
- ⚠ **`possibilities.year` is that column with a film's meaning welded into it**
  — superseded, not deleted, and nothing migrates away from it. The new column
  is additive and **the migration still goes before the deploy**.
- ⚠ **`Kind` stays at four and keeps two jobs, both BEHIND A RESOLUTION:** the
  console's resolve question (`VOCABULARY` / `specFor` / `DEFAULT_INTENT` /
  `landsIn`) and catalogue identity. Neither is on the card; neither is reached
  by an unresolved capture. It is widened by the ingest that needs it, with a
  real example in hand.
- ⚠⚠ **AND THE ORIGIN NAMED SOMETHING NOTHING IN THE TREE SERVES: *optionally
  the reason*.** `captures.note` exists and **has no door** — nothing in
  `components/` or `app/` writes it. ⚠ **When it gets one it stays out of
  `normalised_text`**: *learn to sail* is the common intention, *because I saw a
  boat in Greece* is not, and matching on the reason would make convergence
  **rarer the more carefully somebody wrote**. Named, unscheduled.
- **Nothing is built by this entry.** It is Amendment 6 to the implementation
  specification, §3 rule 4 and §8 item 0 of `docs/re-direction/the-front-page.md`.

⚠⚠ **A CAPTURE STOPS BEING A DRAFT AND BECOMES A STATEMENT, IN PLACE — directed
5 September, and it DELETES THE RECEIPT ABOVE THE COMPOSER.** *When writing, text
that has passed is partially dimmed, so that when the arrow is tapped it all goes
solid, blinks twice, and the optically in-line undo appears. This all stays inside
the composer, never outside.* **A capture no longer travels on being sent.**

- ⚠⚠ **THE TWO STATES OF ONE SET OF WORDS ARE TOLD APART BY WEIGHT OF INK, AND BY
  NOTHING ELSE.** A draft is `--color-muted` and provisional; what has landed is
  `--color-text` and is a statement. ⚠ **The words must not MOVE between them** —
  the sent line is absolutely positioned over the field and inherits its content
  box to the pixel, so a capture that filled three lines while it was typed does
  not settle into two the instant it lands. Asserted: same top, same left, same
  right.
- ⚠ **A layer over the field, never a replacement for it.** The `<textarea>` is
  mounted at all times — iOS raises a keyboard only for a focus inside the
  gesture that asked for it — so undo can put the words back **and focus the
  field in one handler**. ⚠ **The placeholder is emptied while a line is landed**:
  it showed *through* the words the first time this was built, which is two texts
  in one box, one of them inviting you to write while the last capture was still
  being offered back.
- ⚠⚠ **THE UNDO FOLLOWS THE WORDS, MEASURED FROM THE LAST CHARACTER.** A `Range`
  over the final character gives where the words actually stop, written through
  the CSSOM as `--undo-x`/`--undo-y` — §10 blocks inline `style` attributes, and
  this is the door the roll mark used. ⚠ **Direction is read off the element**, so
  in Arabic the control goes to the left end of the last line; one
  `getComputedStyle` rather than a locale branch. ⚠ **The gap belongs to the
  control, not to the measurement** — `--undo-x` is literally where the words
  stop, and `padding-inline-start` puts the drawing clear of them.
- ⚠ **The cap reserves the control's room** — directed: *adequate space left at
  the end of the third line if a user writes on three lines.* `composer-draft`
  puts `--undo-reserve` (the glyph plus two hems) on the field's end, and the cap
  measures against that box, so the last line always has somewhere to put it.
  **Reserved on every line, not just the last**, because a per-line reservation is
  `shape-outside` on a text field and there is no such thing; the price is a
  measure one glyph narrower throughout.
- ⚠⚠ **UNDO RE-ENGAGES RATHER THAN ERASES**, which is where it parts company with
  the record's: *if a user taps undo, s/he doesn't delete the text written but
  re-engages it so they can edit it as they please.* The row is deleted; the
  words go back into the field, the field takes focus and the caret goes to the
  end. **The record's undo leaves nothing behind; this one leaves you mid-
  sentence.**
- ⚠ **Left alone, the line LEAVES rather than being cut.** `composer-sent-leaving`
  fades and drifts a hem downward — toward the foot, where the record's door is —
  and the door bounces on the same tick. ⚠ **The component clears the line on
  `animationend`, never on a timer**, so the duration lives in the stylesheet and
  nothing in JavaScript holds a copy of it. ⚠ **It is not a literal flight to the
  glyph**, which would mean positioning against a control in another subtree and
  re-measuring on every resize.
- ⚠ **Two blinks, each at `--recede`.** One dip reads as a glitch, three is a toy,
  and the opacity never reaches zero — `line-landed`'s rule on the record — so the
  words stay legible for somebody reading what they just wrote.
- ⚠ **The failure line is the ONE thing still above the composer.** A capture that
  did not land puts its words back in the field, so there is nothing in the box to
  say it with.
- ⚠⚠ **THE ARROW BECOMES A `+` FOR AS LONG AS THE UNDO IS THERE — directed:**
  *a `+` replaces the arrow for the duration that the undo is available, so users
  can tap it if they don’t want to wait ten seconds for the transfer to happen.*
  **The two controls are the two answers to one question** — the undo says *give
  it back*, the `+` says *I meant it, let me write the next one* — and waiting
  out a countdown was the only other way to say the second.
- ⚠⚠ **`SendGlyph`’S OWN NOTE ARGUES AGAINST A `+` HERE AND DOES NOT BIND.** It
  reads: *a `+` in a composer means attach, everywhere it appears, so spending it
  on submit would put two meanings on one drawing in the one row that has both.*
  **That is about submit**, and nothing is being submitted in this state — the
  capture has already landed. `WriteGlyph`’s own note says a plus means *another
  one*, which is exactly what this is. ⚠ **So the arrow keeps submit and must not
  be replaced by a `+` in the ordinary state**, and the two can never be seen
  together: one drawing holds the slot at a time.
- ⚠ **`acceptNow` is the timer’s own ending run by hand** — the same three effects
  in the same order, so there is one description of what the end of a window is
  and two ways to reach it. **Do not let them drift apart.** ⚠ **It is lit while
  the field is empty**, because the draft test would otherwise draw the one
  control that has something to do as off.
- ⚠⚠ **IT MUST NOT RAISE THE KEYBOARD, AND IT DID FOR AN HOUR — reported:**
  *why when I press + does the keyboard pop up again?* It focused the field, on
  the reasoning that a `+` means *start another one*. **That reasoning cost the
  control the one thing it exists for:** focus raises the keyboard, the keyboard
  unmounts the foot, and the foot is where the door is — so tapping *do the
  transfer now* hid the only thing that says the transfer happened.
- ⚠ **What it skips is the WAIT, not the next capture** — confirmed: *the `+` is
  for users to short circuit the ten second undo wait.* The box is left empty and
  lit and writing again is the tap it has always been. ⚠ **The label went with
  the behaviour**: it said *Write another* while it focused the field, and a
  control promising a keyboard that does not arrive is the button that lies. The
  pair reads as a pair now — *Undo the last capture* against *Keep it*.
- **Proved by `node_modules/.probe/composersent.mjs`** — 38 assertions, including
  that the sent line is the field's own box, that the drawing sits on the last
  line's centre, that undo re-engages with the caret at the end, and that the
  capture is really gone from the record afterwards. ⚠ **Its text is stamped at
  the FRONT**, because the cap trims from the end and a probe searching the record
  for text an earlier run also wrote reports its own leftovers as a bug. It did.
- ⚠ **`frontpage.mjs` was reading the composer's card as `field.parentElement`**
  and silently began measuring the new positioning wrapper — reporting the
  composer as having no glass, no radius and no padding. It finds the card by name
  now.

⚠⚠ **THREE REPORTS FROM A HANDSET, AND ONE OF THEM WAS ANSWERED BY A RULE THIS
SCREEN NEVER INHERITED — 5 September.** *The bounce of the record glyph cannot be
seen when the keyboard is up; is the undo icon optically in-line with the line?;
add a home glyph to the left of the bottom bar.*

- ⚠⚠ **A COMMIT ENDS THE WRITING MODE HERE TOO, WHICH IT SHOULD HAVE DONE ON DAY
  ONE.** Directed 27 August for the record's strip — *once a line is submitted
  the person is presumed done* — and the front page was written without it. **The
  foot is unmounted while somebody writes**, so the door that acknowledges the
  capture was not on screen at the moment it had something to say. `commit`
  calls `field.current?.blur()`, and the receipt, its undo, the window closing
  and the bounce all now happen on a screen that is showing them. **Nothing new
  is drawn.** ⚠ **What it costs, stated: a run of captures is a tap back into the
  field between each** — the 27 August trade exactly, and the reason the field is
  mounted at all times.
- ⚠ **`blur()`, never `setWriting(false)`.** The mode has one exit and it is the
  field losing focus; setting the state directly leaves a focused field on a
  screen that thinks nobody is writing, which is the state iOS's own *Done* used
  to produce.
- ⚠⚠ **THE UNDO WAS FIVE PIXELS HIGH, AND `items-baseline` WAS DOING IT.** A
  flex item is aligned on **its** baseline, and a box holding only an `<svg>` has
  no text baseline — so the engine used its bottom margin edge and put the
  drawing's centre at 662.5 against the words' ink centre at 667.5. `items-start`
  lets `line-glyph` do the job it exists for: the holder is exactly one line box
  tall, so top-aligned against a line of the same leading **the drawing lands on
  the line's own centre with no face metric anywhere in it.** Measured 0.00px
  after. ⚠ **It reads ~2px above the CAP-ink centre and that is correct**, not a
  residue: it is the relationship every glyph on a record row has, and
  `UndoGlyph` was redrawn on its own grid for it. **Do not nudge a glyph from
  outside the glyph.**
- ⚠⚠ **A HOME GLYPH ON THE FAR LEFT, AND IT TOOK THE BAR FROM FOUR COLUMNS TO
  FIVE.** `HomeGlyph` is a house — deliberately the most conventional drawing in
  the file, because §11 permits *known* icons and the leftmost slot of a bottom
  bar is where nobody should have to learn anything. Drawn on the one grid,
  viewBox 20, stroke 1.25. Off on the composer, lit on the record: **the mirror
  of `record`**, so the app is two surfaces each holding a lit door to the other
  and a dark drawing of itself.
- ⚠ **It duplicates the wordmark, which is the stated cost.** `foot.tsx` has said
  since the split that *the way back to the composer is the wordmark — no new
  control for it*. This is a second door to the same place, at the bottom edge
  because that is where reflexes live.
- ⚠⚠ **AND IT MOVED THE TRAY, SO THE CONSOLE'S SETTLE MOVED WITH IT.** `foot.tsx`
  has warned since 2 September that *moving this glyph out of column four breaks
  something that is not written yet, so move the console's with it* — the settle
  glyph sits on the tray's x centre as a sight line for a reaction that is not
  built. Both are column **five** of a five-column grid now, measured equal at
  **335** on a 390 handset. ⚠ **The composer's own control row stayed FOUR
  columns**: send is aligned to nothing, so there was nothing for a fifth column
  to keep in step with.
- ⚠⚠ **THE RECEIPT IS CENTRED IN ITS BAND, AND ON THE INK RATHER THAN THE BOX
  — directed:** *when the line lands in the area above the composer, it has to be
  centred between the top of the composer and the top of the sheet behind it.* It
  was not: the strip is content-sized, so the receipt sat hard on its top edge —
  **0px above the line box and 5px below it.** ⚠ **Equal padding would not have
  fixed it**, which is `sheet-writing`’s own lesson said twice: at 18/24 the ink
  sits 5.8px below the box’s top and 1.8px above its bottom, so equal padding
  leaves the words 4px high in their own band. `receipt-line` spends one optical
  gap on both sides, less what the line box already provides, using the derived
  `--line-ink-lead`/`--line-ink-foot` — **no pixel in it**, so it follows the
  desk’s root scale and any change of leading. Measured **7.49 above, 7.49
  below**. ⚠ **The gap is `--line-hem × 1.5`, which the strip already spends
  between the card and the foot** — not a new number. ⚠ **The composer does not
  move**: the strip is anchored to the bottom edge, so the 2.4px it grows moves
  its top. ⚠ **The failure line wears it too**, because the two are alternatives
  in one slot and the strip must not change shape between them.
- **Proved by `node_modules/.probe/traysightline.mjs`** (5 assertions, and it
  exists so the next person to add a glyph finds out immediately) and by
  `composerundo.mjs`, now 21, which asserts the commit lets go, the door is on
  screen to be bounced, and the undo is on the line's centre.
- ⚠⚠ **`console.mjs` HAD BEEN RED SINCE THE SPLIT AND IS FIXED.** It opened
  `/` — which has been the composer since Amendment 5 — and seeded through
  `button[aria-label="Write a capture"]`, the `+` the split deleted, so it timed
  out **before a single assertion ran**. It writes its seed on the composer and
  reads it on `/record` now, and clicks back into the field between lines
  because a commit ends the writing mode. ⚠ **Its foot block was anchored on the
  `+` too**, and asks about even spacing rather than that control’s distance
  from the centre; it counts `children` rather than `button, a`, because a glyph
  drawn OFF is a `<span>` and a query for controls reports a five-cell bar as
  four and the grid as uneven. **All assertions pass on both surfaces.**
- ⚠ **`portal.mjs` and `handshake.mjs` still need their local seeds** —
  `scripts/seed-portal.mjs` and `scripts/seed-request.mjs` — and are red without
  them. Not a regression from this work.

⚠⚠ **A CAPTURE IS AS LONG AS THE BOX, AND THE BOX GROWS A LINE TO WRITE IN —
5 September, two directions, built and measured. THE COMPOSER NO LONGER SCROLLS
AT ALL.** Directed: *limit the number of
characters to the number that can fit in the given space so we have no need for
scrolling in the composer.* The field asks itself on every keystroke and refuses
the one that would not fit. **Deleted with the scroll: the roll-under,
`roll-mark`, `composer-bar` and `readRoll`**; the field is `overflow-y-hidden`
and there is a tombstone in `globals.css`. The account is §10 of
`docs/re-direction/the-front-page.md`.

- ⚠⚠ **THE CAP IS MEASURED AND MUST NEVER BECOME A NUMBER.** *"The number of
  characters that fit"* is not one — measured on the live page it is **73 in
  Latin, 92 in Arabic, 38 of `m`, 142 of `i` on a 390 handset and 146 on the
  desk**, five answers from one rule. A `maxLength` would be a constant tuned
  until one handset looked right, which *How things get fixed* rules out by name.
  It is `readRoll`'s own rule — **read off the element, never computed from the
  text** — kept after `readRoll` went.
- ⚠ **The measurement is synchronous, and that was checked rather than assumed.**
  `readRoll` ran in a `requestAnimationFrame` because `scrollHeight` is not right
  until the new text is laid out; a cap has to refuse a keystroke *during* it, a
  frame later being a character that appears and then vanishes. Measured in
  Chromium and WebKit: **at the boundary the two reads agree**, because reading
  `scrollHeight` forces the layout it needs. They differ only deep inside an
  overflow, which the cap makes unreachable.
- ⚠⚠ **THE CAP IS STICKY, AND THAT IS THE DIFFERENCE BETWEEN STOPPING AND
  SIEVING.** *Does this exact string fit* is right about every string and wrong
  about typing: at the cap a wide letter does not fit and a narrow one does, so
  `mike` arrived as `m` refused, `i` **accepted**, `k` and `e` refused —
  **62 letters kept out of a prefix of 74, in no order a reader could explain.**
  A full field stops taking input rather than sieving it. The latch is the length
  at which the box first said no, in a `useRef`; a deletion clears it, and it is
  also what closed a leak where a trailing space fitted for ever.
- ⚠ **A paste is TRIMMED, not refused** — refusing it would be silent, which is
  this screen's own recorded failure. It keeps a prefix, so a paste into the
  middle loses the tail; stated rather than solved.
- ⚠ **What it costs, and it is the one hole:** a capture that fitted when it was
  typed can stop fitting if the type reflows under it — a rotation, a desk window
  narrowed — and is then **clipped rather than scrolled to**. The alternative was
  trimming somebody's words on a resize. **The cap governs what can be written,
  not every width it is later read at.**
- ⚠ **Do not answer *the composer feels short* by putting the scroll back.** That
  asks for a taller box or a shorter rule, both one number in
  `compose-screen.tsx`. The scroll brings the readout back, and the readout is
  what the cap was chosen over.
- ⚠⚠ **THE SWIPE-ANYWHERE FIX IS DEAD RATHER THAN DEFERRED, AND SO IS THE `ance`
  MIRROR.** Both were open questions about a scroll that no longer exists. **A
  transparent border on the field was built for the swipe and deleted the same
  hour**: it put every point of the card on the field by hit-test in both
  engines — and **a hit-test is not a gesture**. Measured: Chromium starts a
  touch scroll only from inside the **padding box**; a drag beginning in a
  border scrolls nothing. If a scroller in a padded card ever needs its air to be
  swipeable again, that is the finding to start from.
- ⚠⚠ **TWO LINES AT REST, THREE WHILE IT IS BEING WRITTEN IN — directed the
  same day: *when a user taps in the composer and the keyboard rises, the
  composer itself should increase in size just enough to add one extra line of
  writing.*** Measured: field 48 → 72, card 130 → 154 on a handset; 64 → 96 on
  the desk, which is the same one line at the desk's root scale. **The cap reads
  the box, so the third line is a third line of writing** — 106 characters of
  Latin where two lines took 73.
- ⚠⚠ **THIS IS NOT THE GROWING BOX THAT WAS DELETED, AND THE DIFFERENCE IS THE
  TRIGGER.** That one measured `scrollHeight` and grew two lines to six **as the
  words arrived**, moving the card, the glow and the strip on every keystroke.
  This moves **once, when you tap in**, and never again while you type. *The box
  does not follow the words* is the rule that survived; *the box has one height*
  was never the point of it.
- ⚠⚠ **IT STAYS TALL WHILE THERE IS A DRAFT IN IT — `writing || draft !== ''` —
  AND THAT IS NOT A THIRD STATE.** The field is `overflow-y-hidden`, so three
  lines of draft in a box that shrank to two is a line of somebody's words
  **clipped with nothing saying so**. The short box is only ever the empty one.
  ⚠ **Do not tidy this to `writing` alone.**
- ⚠ **Keyed on `writing`, NEVER on `--keyboard-overlap`.** The direction says
  *the keyboard rises*, but that property measures a gap that also opens when a
  Safari tab's address bar collapses during a scroll — `useKeyboardHem` says in
  writing that it is not a keyboard detector. ⚠ **So the desk grows too**, which
  is deliberate: a pointer-type branch would be a device sniff for a behaviour
  that reads correctly on both.
- ⚠ **The latch is cleared by `commit`, and that was a bug for an hour.**
  `fullAt` is a *length*, and a length outlives the words it measured: left
  behind, a capture that filled the box at 106 characters made the **next**
  capture stop dead at 106 — including 106 narrow ones the box had room for.
  The deletion path clears it because the field is getting shorter; a commit is
  the other way the field empties.
- ⚠⚠ **THE BOX BUMPS WHEN IT SAYS NO, AND A COUNTER WAS ASKED FOR FIRST AND
  REFUSED — 5 September.** Asked: *can there be a counter that appears as the
  user is about to approach the last allowed character?* **There is no such
  number.** The cap is measured, so *characters remaining* is 106 in Latin, 213
  of `i`, 57 of `m`, 214 on the desk — it depends on which ones you type next,
  and a digit in that corner would have to pick one and lie. ⚠ **Do not add one.**
- ⚠ **What was real in the question is that the cap is SILENT** — a keystroke
  past the end simply does not appear. `composer-refused` is the answer: the card
  moves down half a hem and back, over half of `--recede`, once per refused
  keystroke. **Down rather than sideways** — a shake says *rejected as invalid*,
  and what happened is that the words reached the bottom of the box.
- ⚠ **No colour, and that is forced rather than restrained.** `--color-accent` is
  a convergence, `--color-chrome` is a control, `--color-decline` is the one
  dismissal in the app, and `docs/decisions.md` has twice refused to make red the
  error colour. §11's scarcity rule takes all three; **motion is what is left.**
- ⚠ **It fires only when NOTHING landed**, which is both the honest case and the
  safe one: a refusal changes no state, so the class survives the animation,
  where after a `setDraft` React reconciles it away mid-bump. A trimmed paste put
  words in and can be seen to have done so.
- ⚠ **Restarted through `classList` — remove, force a reflow, add.** A counter in
  state would be re-rendering the screen in order to say *nothing happened*.
- **Proved by `node_modules/.probe/composercap.mjs`** — 50 assertions, two
  surfaces, three scripts, both heights.

⚠⚠ **THE UNDO IS BACK ON THE FRONT PAGE, AND A CONTROL IN THE COMPOSER'S STRIP
COULD NOT BE CLICKED AT ALL UNTIL IT WAS — 5 September.** §5's *nothing is ever
deleted* has exactly one exception, a ten-second undo on creation for typos, and
it lived on the record's own row. **The record moved to `/record` and the front
page kept the receipt without it**, so for a day the only way to take back a
mistyped capture was to navigate to another screen and find it there. It is
beside the receipt now, in the record's own slot geometry.

- ⚠⚠ **THE BUG THIS UNCOVERED IS THE IMPORTANT HALF.** `onBlur` was
  unconditional, so a click on the undo blurred the field → `writing` went false
  → **the composer shrank three lines to two** → the button moved ~20px out from
  under the pointer between mousedown and mouseup → **no click event was ever
  dispatched.** The control was lit, correctly placed, hit-tested to itself, and
  dead. ⚠ **It took the send arrow with it**, which had been failing the same way
  and was written off as a probe artefact. **Any control in that strip would
  have been.**
- ⚠ **The fix is the record's own guard, arriving a day late:** `relatedTarget`
  inside the strip is not leaving. `page-screen.tsx` has said so in writing since
  30 August, for its own chips; this screen was written without it and the cost
  stayed invisible until the box learnt to change height. ⚠ **iOS never had the
  bug and still needs the guard** — it does not focus a button on tap at all, so
  the field never blurs there; the desk and Android do.
- ⚠ **The window is a PROP, not a second `10_000`.** `undoCapture` bounds the
  delete in SQL against `created_at`, so a number typed in the client is a clock
  that can disagree with the one that decides — and the disagreement shows as a
  control that is lit and refuses. `app/(app)/page.tsx` hands `UNDO_WINDOW_MS`
  down exactly as the record's page does.
- ⚠⚠ **THE RECEIPT GOES WITH THE WINDOW, AND THAT REVERSES WHAT WAS WRITTEN
  HERE THE SAME MORNING — directed.** This entry read: *the receipt stays until
  the next capture replaces it; a confirmation that vanished after ten seconds
  would be the toast this screen refuses to be.* The direction is that it should
  go, **and the reasoning survives because something takes its place**: the
  record's own door bounces at that instant, so the screen stops saying *here is
  what you wrote* and starts saying *it is in there*. **A toast leaves nothing
  behind; this hands over.** One timer fires all three — two clocks on one moment
  is two clocks to keep in step.
- ⚠ **The bounce is STATE, not an event, because the foot is unmounted while
  somebody writes.** A capture committed with the keyboard up has no door to
  animate when its window closes; `arrived` survives until the foot is on screen
  and plays on mount. **A signal nobody could have seen is not a signal.** It is
  put down by `onAnimationEnd`, never by a second timer holding a copy of
  `--recede`. ⚠ **An undo clears it** — a door announcing an arrival at the
  moment one is taken back is the screen contradicting itself.
- ⚠ **UP, where the composer's refusal bump is DOWN**: same family, opposite
  reading — down is *the words hit the bottom of the box*, up is *it went
  somewhere*. ⚠ **It is not a badge and must not become one**; §5 forbids the
  portal a count and the same reasoning holds here.
- ⚠⚠ **THE WORDS COME BACK INTO THE COMPOSER, WHICH THE RECORD'S UNDO DOES NOT
  DO.** Same act, finished on a surface that can finish it: the undo exists *for
  a typo*, and on the record there is no field to put the words back into. ⚠
  **Only into an EMPTY composer** — if something is already being written the
  words stay taken back, and **appending is not the fix**: a capture is one line
  and two run together are neither.
- ⚠ **A refusal puts the receipt back.** `undoCapture` bounds itself in SQL, so
  the clock here and the clock there can disagree; the honest answer to *too
  late* is the capture still being there. The record says this in the same words.
- ⚠⚠ **AND THE `relatedTarget` GUARD WAS NOT ENOUGH — reported from a handset
  within the hour: *tapping the undo only collapses the keyboard; I have to press
  it again to actually undo.*** The tap blurred the field, iOS took the keyboard
  down, **the strip travelled from the top of the keyboard to the bottom of the
  glass**, and the button was no longer under the finger when the tap completed.
  The second tap worked because by then nothing was moving.
- ⚠⚠ **THE GUARD COULD NOT REACH IT, AND THE REASON IS WORTH KEEPING.**
  `relatedTarget` says *where the focus went*, and **on iOS a tap on a button
  focuses nothing at all** — it simply blurs the field, so `relatedTarget` is
  `null` and the guard reads it as leaving. **A fix had to stop the blur, not
  classify it.** `onMouseDown={keepFocus}` on every control in the strip:
  `preventDefault` on the compatibility `mousedown` every engine synthesises
  from a tap cancels the focus change and leaves the click alone. ⚠ **The guard
  stays** — it is still what a keyboard user tabbing to a control needs.
- ⚠ **Every control in the strip needs it, not just the one that was reported.**
  Send and attach sit in the same box and move the same way.
- **Proved by `node_modules/.probe/composerundo.mjs`** — 19 assertions,
  including that pressing a control **does not move the focus**, that ONE tap
  undoes, that the capture is really gone from the record, that a full composer
  keeps its draft, that the receipt goes with the window, and that the door
  bounces once and leaves no mark.

⚠⚠ **ADDING SOMEBODY IS A REQUEST THEY ANSWER — 4 September, directed, and it is
built.** Until this, a mutual track was **two independent one-sided acts**: I add
you, then *you* must separately remember my handle, go to my page and add me
back. Nothing told you I had asked. The first time Phase 2 was used by a person
rather than a fixture the result was **2 accounts, both holding *Scarface*, 0
tracks, 0 notifications ever written** — the engine, the portal and the mark were
all correct and all downstream of an introduction that never arrived. The design
is `docs/re-direction/the-handshake.md`; it is a brief and it is meant to die.

- ⚠⚠ **A ONE-SIDED TRACK ALREADY *WAS* A REQUEST AND NOTHING DELIVERED IT.** All
  three consumers of the relation demand both rows — the §6 fan-out's self-join,
  `listCapturesForOtherUser`'s two joins, and `nameFor` — so an outbound-only row
  grants **nothing**. **So there is no pending column, no requests table and no
  state machine, and no migration.** The pending object existed; what was missing
  was the delivery and one control to answer it. *Remove the mechanism* read from
  the other end: do not build a second one beside the one that is already there.
- ⚠ **Accept is `trackUser`, unchanged, fan-out included.** There is deliberately
  no `acceptAction` — a second entry point would be a second place deciding what
  mutuality means, and mutuality is what runs the fan-out.
- ⚠⚠ **`declineTrack` IS THE ONLY PLACE ONE PERSON DELETES ANOTHER PERSON'S ROW,
  AND `followed_id = viewer` IS THE WHOLE SAFETY ARGUMENT.** There is no
  parameter that can widen it — the `includeArchive` rule, applied to a delete —
  and `tests/handshake.test.ts` asserts a bystander cannot reach a row that does
  not point at them.
- ⚠ **A decline remembers nothing and the asker is never told.** `untrackUser`'s
  own reasoning: any state a declined request could sit in is a list of people
  you turned down. **The price, stated: a declined person can ask again**, and
  the honest answer is a block list, which does not exist — Phase 6 owns it, and
  **a lower rate limit is not the fix.**
- ⚠⚠ **A DECLINE LEAVES A STRUCK LINE IN THE OPEN CARD, AND IT IS A WINDOW
  RATHER THAN A RECORD — 4 September.** *Decline* is a plain word one tap from
  *Accept* with no confirmation, and **the request line is the only place
  `@handle` ever appears for a non-mutual** — so a mis-tap destroyed the only
  copy of it, unrecoverably, on both sides at once. The sentence stays struck
  with **Add** beside it until the card closes. ⚠ **Nothing is written and
  nothing is read back**: `declineTrack` is untouched, `DeclinedRequest` lives in
  the client, and a residue that outlived the card would be the list of people
  you turned down. ⚠ **`Add` is not an undo** — their row is gone and putting it
  back would mean writing another person's statement; it asks them, through the
  same `trackAction`, and the line then reads *Requested*. ⚠ **The
  strike-through IS the word**, so `portalSentence` is still the only author —
  `@sam — declined.` would be a second composition and reads ambiguously
  besides; the word is spoken to a screen reader, which cannot see a strike.
  ⚠ **So a decline does not close the card** where accepting the last row does:
  *an empty card closes* is about a card with **nothing** in it, and closing over
  the struck line would destroy the handle at the moment it exists to keep. The
  door goes dark above it, which is right — nobody is waiting on you any more.
- ⚠ **`declineTrack`'s claim that a decline is *indistinguishable* from an
  unanswered request on the asker's side was only ever true of the BUTTON, and
  is corrected in both places.** People reads `listMyTracks`, so unanswered is a
  row tagged *Requested* and declined is **no row at all** — the fact leaks as an
  absence while the word is withheld. Left that way deliberately: telling them
  costs an eighth notification kind (a rejection with a timestamp) or a tombstone
  column, which is the pending machine §1 removed **and** would break re-asking,
  since `onConflictDoNothing` makes a second ask over a surviving row a silent
  no-op. **Re-asking is the recovery and it works.**
- ⚠⚠ **A REQUEST DOES NOT EMPTY ON OPEN, WHICH GENERALISES §5's *IT EMPTIES*
  RATHER THAN BREAKING IT.** A row leaves when it has been **dealt with**; for a
  convergence, reading it *is* dealing with it, because there is nothing to
  answer. **A request that emptied on being looked at would be a request
  destroyed by being read** — asserted from the screen by
  `node_modules/.probe/handshake.mjs`.
- ⚠ **It lands in the PORTAL because that is the only surface that says something
  arrived.** On `/profile` it would have been as silent as the bug it fixes. The
  cost is real and is paid in three places: the line read is a second query
  (`listMyRequests`), the door answers for both kinds inside `hasPortalLines`
  rather than being OR'd by a page, and the box now holds a row that is a
  **person** rather than a line. ⚠ **`listMyPortal`'s join on
  `payload->>'itemId'` carries the privacy term — do not relax it to let a
  request through.** A request has no `itemId`, and that absence is what keeps it
  out.
- ⚠ **ONE LINE: *`@handle` wants to track you.* Accept / Decline** — directed,
  replacing a borrowed `Ask` that spent two. `Ask`'s shape exists because the
  console's questions are about a line already above them, so they must name what
  they ask about; **this sentence already names it**. The answers are **plain
  words, not boxed buttons** — a bordered control is a block and cannot sit in a
  run of words — and the 44px is untouched because `tap-target` hangs its hit
  area off a pseudo-element. ⚠ **It cannot fit on one line on a 390 phone**
  (~394px of content into ~310px) and wraps there; one line from 430px up.
- ⚠⚠ **THE DOOR SAYS WHICH: A DOT ABOVE THE CIRCLES WHEN SOMEBODY IS WAITING ON
  YOU — directed 4 September.** One lit glyph stood for both kinds of row, which
  made a reader open the box to find out whether anybody was waiting on them.
  Three states, one drawing: circles off, circles lit, circles lit **with a dot**.
  ⚠ **Letters over the glyph (`C`, `R`, `C/R`) were built and looked at first and
  were a SMUDGE** — the counters collide with both circles' strokes at 26px; the
  direction had anticipated it and named the dot as the fallback. A `+` was ruled
  out before either: the capture control is a `+` two cells away and this app
  cannot afford two plus-shapes side by side on the one control it has to be
  perfect at.
- ⚠⚠ **THE DOT IS GREEN, AND IT IS THE ONLY THING IN THE BAR THAT IS NOT
  `currentColor`.** It is `--color-accept` — the colour of the *Accept* one tap
  behind it, so the mark on the door and the action behind it say one thing
  twice. ⚠ **A red one was raised for the convergence side and is refused**: red
  is *no*, and on a mark reporting an event nobody has to answer it reads as an
  alarm. **A convergence is not a problem.** ⚠ **And a convergence gets no dot at
  all** — its colour is `--color-accent`, which already means *this converged* on
  the line itself in the gutter, and a second tenant saying the same thing beside
  a control is what the one-tenant rule exists to prevent.
- ⚠⚠ **ANSWERING RE-READS THE PORTAL; IT DOES NOT PATCH THE ROW OUT LOCALLY.**
  Removing it from state was wrong in a way only *accepting* shows: **accepting
  runs the fan-out**, so the same tap can write convergences into the box being
  looked at, and a local patch left the door dark over rows it had just created.
  One read answers the rows, the door and the emptiness together. ⚠ **An empty
  card then CLOSES** — directed: a card standing with nothing in it is §5's
  *empty portal* reached from the other side, a surface you could not have
  opened.
- ⚠ **The lock's sentence — *swipe a line away and it stays out of matching* — is
  DELETED, 4 September, directed.** It fired at a record length of exactly one,
  which every existing account has passed forever. ⚠ **What it costs: nothing now
  teaches the lock swipe.** Judged affordable rather than free — locking is a rare
  verb and a person's *first* capture is not where a gesture they want months
  later is learnt. **If the lock proves undiscoverable, this is what was removed,
  and it should come back where a reader is actually looking.** It also said
  *matching*, which is not a word in §3's vocabulary.
- ⚠ **A margin that separates two things must belong to the thing that may not be
  there.** The request row wore `mb-4`; with no convergence under it the card
  measured 20px of air above the row and 36 below, so the one thing in the box
  sat 16px high in it. The gap is the heading's `mt-4` now, and the space
  *between* requests is a `gap` on their own container. Measured 20/20.
- ⚠ **The dot's clearance is measured against the INK, not the bounding box, and
  the first attempt got it wrong.** At the dot's x the two circles are crossing
  near their tops, so the ink is at y 4.09 rather than 4.25 — a dot ending at 4.1
  read as a **stem**. It is cy 1.75 r 1.15 now, 1.2 units clear. **Filled: the one
  filled shape in the eleven**, because a ring that size is a grey blur.
- ⚠ **Still not a count** — one dot however many people are asking, and
  `portal.mjs`'s no-digits assertion holds. ⚠⚠ **It is nonetheless the closest
  this app has come to a notification badge. If a second dot is ever proposed for
  a second kind of row, the answer is that the door has run out of what it can
  say and the surface behind it is where the distinction belongs.**
- ⚠ **The door has three accessible names** — *Who else*, *Requests*, *Requests,
  and who else* — because a dot is meaningless to a reader who cannot see it. **A
  probe pinned to one of those strings reports a missing door** the first time the
  account under test holds the other kind of row; both probes match the control
  by prefix, and `seed-request.mjs` empties the account's other unread rows so
  *a request alone* is a state the probe can actually reach.
- ⚠⚠ **ACCEPT IS GREEN AND DECLINE IS RED — directed, and they are the FIRST
  COLOURED CONTROLS IN THIS APP.** §11 gives every other control `--color-text`
  or a fade of it and reserves `--color-accent` for a state. `--color-accept`
  `#4f9860` and `--color-decline` `#cf5a4c` are the palette's own values
  re-pitched — the lacquer red opened up because `#c1483c` measures 4.31:1 and
  fails AA at 18px, and the green's own recorded ladder-back rather than
  `--color-listed`'s neon, which was chosen to be *the loudest mark in the app*.
  **5.95 and 5.25 on true black; 5.2 and 4.6 on the desk's charcoal.** ⚠ **The
  scarcity rule binds them from day one: the moment green appears on a second
  affirmative or red on a second dismissal, both stop meaning anything — and
  neither is the error colour**, which `docs/decisions.md` has refused twice.
- ⚠ **The handle is full ink, the rest of the sentence muted** — a request is
  about a person. It is a **split of the one authored string** at the handle's own
  length, never a second composition: `portalSentence` stays the only author.
- ⚠ **THE SCREEN SAYS *ADD* AND THE CODE SAYS *TRACK* — directed, and it is the
  first deliberate split of §4's vocabulary rule.** The **relation** is a track;
  only the **act of asking for one** is called adding. `tracks`, `trackUser`,
  `TrackState` and `track_request` all keep their names. ⚠ *Add* is not on the
  banned list, so **the linter cannot hold this and it has to be held by hand.**
- ⚠ **`Tracking` was a lie and is gone.** *Add* → **Requested** → *Added each
  other*. The middle state used to claim a live relationship where there was an
  offer nobody had been told about. ⚠ **It was *Added* for an hour and fell to
  the same flaw**, which had been written down when it was chosen: it claims
  something happened. *Add* is the verb; *Requested* is the state it leaves
  behind, **and it is the same word on the row in People** so a relationship
  reads the same in both places it appears.
- ⚠⚠ **THE HANDLE FIELD SENDS THE REQUEST, AND IT SENT YOU TO THEIR PAGE FOR ITS
  FIRST HOUR — reported and rebuilt the same day.** The detour existed so a
  mistyped handle could be seen before being asked; **the destination could not
  tell you anything**, because a non-mutual sees nothing of a record — so it was
  the handle you had just typed, an *Add* button and *This list is not shared
  with you*. **It read as done and nothing had been sent.** Production said so: 0
  tracks, 0 notifications. *A typo is answered in place now* — **No such
  person.** under the field — **and the confirmation is the row**, not a message.
- ⚠ **A non-mutual is shown NO LISTS on `/u/[handle]`.** A heading and *This list
  is not shared with you.* was two thirds of a screen explaining an absence over
  the one control worth being there for. §6's *silence stays silent*, applied to
  a surface; the four terms are untouched and are still the data layer's.
- ⚠ **A pending request is named `@handle` and the handle is read LIVE from
  `profiles`** — the one place this app departs from *the payload is the record*.
  A convergence's name is history; a request is **a live question about a person
  you are about to let in**, and a handle that has changed since would name
  somebody you do not recognise and address somebody who is gone.
- ⚠ **There was no in-app way to add anybody at all**, which is half the bug:
  `/u/[handle]` was reached by typing the URL. `components/add-person.tsx` is a
  handle field in People on `/profile`, and ⚠ **it goes to their page rather than
  adding them** — a typo can reach a real person, and asking is what puts a
  question in somebody's portal. **It is not search and must not become one.**
- **Proved:** `tests/handshake.test.ts` — 8 cases, and the one that matters is
  **accepting runs the fan-out**, which is the whole reason the feature exists
  and cannot be seen from a screen. `node_modules/.probe/handshake.mjs` for the
  surface; `scripts/seed-request.mjs` seeds one locally with the production
  guard.
- **Still open:** the QR, which is §2f of the brief and reduces to *a handle in a
  URL, scanned by the phone's own camera* — `BarcodeDetector` is not in Safari,
  so an opaque token would mean shipping a decoder to do what iOS does from the
  lock screen. **The encoder is a tenth dependency or ~300 lines, and that is
  undecided.** ⚠ **Blocking is also still open**, and it is named rather than
  quietly deferred.

⚠⚠ **A CAPTURE IS SHAREABLE WHEN IT IS WRITTEN, AND THE SWIPE IS THE LOCK — 31
August, directed. This overrules the specification's private-by-default and it
was directed with that stated.** Until this, **the entire social half of the
product was inert**: `captures.visibility` defaulted to `private`, `runOverlap`
requires `SHARED_SCOPES`, and **nothing anywhere called
`setCaptureVisibility`** — the scope existed, *share visibility* was a named
Phase 2 deliverable in §13 of the implementation specification, and the control
was never built. Production on 31 August: **79 captures, all private, 0
notifications, 0 tracks.** The engine, the portal and the mark were all correct
and all downstream of a gate that was shut.

- ⚠ **The argument that won is the four-second capture.** A per-capture share act
  is a beat *after* the capture, one you have to remember to come back for, and
  its failure is **silent** — you never converge with anybody and never learn
  why. **The consent is the mutual track**, which is deliberate, two-directional
  and given by handle to somebody you chose. What a convergence discloses is one
  overlap on one possibility, to one such person.
- ⚠ **It is NOT a change to who can read a record.** `listCapturesForOtherUser`
  keeps all four of its terms. Browsing still needs sharing; only *matching*
  moved.
- ⚠⚠ **A CAPTURE THAT CAME FROM SOMEBODY ELSE STAYS PRIVATE**, and that is now a
  guarantee rather than a leftover default — `tests/guarantees.test.ts` names it.
  Same reasoning as §6's suppression rule: **a received list is not an
  independent common intention.** If a copy is not independent enough to notify
  the person it was taken from, it is not independent enough to be republished to
  *my* mutuals without my touching it. `writeCapture` branches on
  `provenance.source`.
- ⚠ **The revive path does not touch the scope.** A crossed-off capture written
  again keeps whatever its owner last chose; re-sharing on revive would be a
  control changing under somebody who did not touch it.
- ⚠⚠ **THE SWIPE CARRIES THE LOCK AND CROSSING OFF IS THE CONSOLE'S — directed,
  and it reverses `row-swipe.ts`'s own founding argument.** That file said the
  swipe belonged to cross off because it was *the verb used fifty times a week*.
  **That was an assumption about usage and it was wrong** — told by the person
  using the app daily that lines are rarely crossed off. The rule did not change;
  the frequencies did, and the gesture followed them. **`SwipeWay` is
  `'lock' | 'unlock'`, the signs and the detent are untouched**, because the
  mechanism was always right and the verb was not.
- ⚠ **Lock fits the hook better than cross off did.** Cross off and restore share
  one gesture between two *states of the record*; lock and unlock are one
  property with two values. Away from the reader is out of the pool, back is in —
  the same physical metaphor, fitting more exactly than before.
- ⚠⚠ **THE PADLOCK IS NOT DECORATION AND MUST NOT BE REMOVED.** It was going to
  show nothing, on the reasoning that locking is rare and an invisible state
  fails safe. **That died the moment locking became the row's own gesture**:
  crossing off confirmed itself by striking the line, iOS has no Vibration API,
  and a swipe whose outcome is invisible is confirmed by nothing at all. It is in
  the row's **tail** and not the gutter — `--color-accent` and that column belong
  to the convergence mark, one thing per column — so it costs width on locked
  lines only.
- ⚠ **A padlock is right as a STATE and would have been wrong as a control
  label.** On a button it says *security*; this is scope, and nothing about a
  lock stops anybody reading a record they can already reach. As a mark on a line
  it is the known icon for *held back*, which is what §11 permits known icons
  for. It is the eleventh glyph on the one grid, drawn shorter than the rest
  because it rides a line rather than standing in a bar.
- ⚠ **No fourth haptic.** Locking borrows the crossed-off thud, unlocking borrows
  the capture's tap — the precedent `lib/haptics.ts` already set for putting a
  line back.
- ⚠ **Unlocking is a fan-out trigger and locking is not.** `setCaptureVisibility`
  runs overlap on the private→shared transition only, so **a line locked in March
  converges the day it comes back**, and the same swipe twice writes nothing
  twice. ⚠ **A line that already converged keeps its mark after it is locked** —
  the mark is memory, the event happened, and a notification already sent cannot
  be recalled.
- ⚠ **`shared` is derived from `SHARED_SCOPES`, never compared to `'private'`.**
  The question is *can this converge*, which is the same predicate `runOverlap`
  applies; `= 'private'` would be a second definition, right today and wrong the
  day a third scope exists. One expression, three reads — the page, the tray and
  search — so the padlock travels with the line.
- ⚠ **The action takes a boolean and names the scope itself.** A `Visibility` at
  that boundary would let a client pick one, and the day a third exists that is a
  way to publish a capture from a request body.
- **Measured by `node_modules/.probe/swipe.mjs`** — rewritten for the lock, and
  every mechanism assertion is the one it always was. It asserts the padlock is
  **drawn** on the swipe, that crossing off does not touch the scope, and that
  the console's × is the only door to crossing off. `tests/mark.test.ts` proves
  the data half, including the case this design now leans on: **a crossed-off
  line converges with nobody**, which falls out of `classify` being an allowlist
  of three pairs and had never been asserted before.
- ⚠ **Production's existing 79 captures were backfilled to `mutuals`** — a
  default only touches new rows, so without it the record would have stayed
  inert. Directed. Nothing else was touched, and no schema changed.

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

⚠ **Phase 2 step 4 is built — THE MARK, 31 August, and the sequence is
complete.** *The portal is arrival; the mark is memory.* A convergence can land
on a line hundreds back, and once the portal has emptied **the record now says it
happened**: a bar in the gutter, `--color-accent`, on every line that has ever
converged. §11 reserved that colour and that column for this since 23 August and
it is spent on it at last — `--color-accent` is used by exactly one thing.

- ⚠⚠ **THE READ HAS NO `read_at` TERM, AND THAT ABSENCE IS THE MARK.**
  `listMyPortal` filters unread because the portal empties; `converged` in
  `lib/db/captures.ts` does not, because the mark is what is left when it has.
  **Adding an unread filter there deletes the only durable record that a
  convergence ever happened** — it is asserted in `tests/mark.test.ts` in the one
  case named for it, and from the screen by `node_modules/.probe/mark.mjs`.
- ⚠ **A BIT rides the record; the SENTENCE is a read behind the tap.** One
  `exists` per line on the page's own query — the screen whose whole promise is
  that Return lands in under a frame — and `getConvergence` for the one line
  somebody opened. ⚠ **The bit gates the read**, so a record with no convergences
  in it issues nothing on any tap. The portal action's own note says why the rows
  do not ride the page; this is the same argument answered the other way, because
  a mark has no *until they ask*.
- ⚠ **The sentence lands in the slot `console.tsx` was built leaving.** Its
  docblock predicted it in writing — *when who else arrives it has to arrive into
  a space that is already there, never a spinner over the whole box.* It sits
  directly under the words and above the day stamp. `portalSentence` is still its
  one author, so the portal's row and the console's line cannot say one event two
  ways.
- ⚠ **The portal's console is handed `null` deliberately.** The portal draws the
  sentence above the box already; the mark answers *why is this line special* on
  a record where nothing else does, and in the portal everything else does.
- ⚠ **A colour in a gutter is invisible to a reader, so the row says it.** The
  record's row carries *Also on someone else's page.* in its `aria-label`; the
  tray and search carry it as hidden text, because neither has a control to hang
  a label on. **It names nobody** — the record knows *whether*, the console knows
  *who* — and inventing a second sentence beside `portalSentence` is the drift §6
  warns about.
- ⚠ **One expression, three reads.** The page, the tray and search all select it,
  so a settled or crossed-off line keeps its mark: **a resolution is not an
  erasure**, and nothing about `state` is in that read.
- ⚠ **It is on the ROW, so it travels with a swipe** — a mark that stayed put
  while its line slid away would be marking whatever was underneath.
- ⚠ **`--mark-width` is `2.5px`, like `--caret-width`, so the mark is the same
  hairline on the desk as on the handset** while everything around it is
  four-thirds the size. That is the caret's own rule inherited, it is **not** one
  of the four exceptions the desk's scale names, and it has not been looked at on
  a real desk. If it reads thin up there, that token is the thing to move — and
  the caret moves with it.
- **Measured: 6.77:1 on the desk's `#14140f`, 7.70:1 on the handset's true
  black**, past the 3:1 WCAG 1.4.11 asks of a graphical object on both. The brief
  asked for the re-measurement against the charcoal before shipping; it needed no
  change. ⚠ **`mark.mjs` asserts the mark is `--color-accent` and NOT
  `--color-chrome`** — the colour it wore for the eight days it was a pick — and
  that no unconverged line draws anything at all.

⚠ **Phase 2 step 3 is built — THE PORTAL, 30 August, and the engine finally has
a reader.** For a week `lib/overlap.ts` has been deployed, running, and writing
`notifications` rows that **no surface in the tree read**. One does now, and the
fan-out is proved end to end with two accounts for the first time —
`tests/portal.test.ts`, five cases including the suppression rule seen from a
surface at last.

- ⚠⚠ **THE DOOR IS IN THE BOTTOM BAR AND THAT IS AGAINST §2 OF THE BRIEF —
  directed.** §2 reads: *the bottom edge is for what you do without looking, the
  top edge is for what you go to on purpose… which is why the notification portal
  goes at the top: it must never be given a reflex's real estate.* **The
  direction was given with that stated and it stands; the law is not amended and
  this is not a precedent.** The cost is written beside the control in
  `foot.tsx`: the portal now sits next to the one control this app has to be
  perfect at. ⚠ **If the `+` is ever mis-hit, this is the first suspect, and the
  answer is the top edge — not a bigger gap.** It cost no layout: the foot's grid
  has been three columns since settle left, so the `+` holds the centre by
  construction and column one was empty.
- ⚠ **A list of LINES, not events, and it is enforced in the READ.** `listMyPortal`
  joins each notification to *the viewer's own capture for the same possibility*
  and groups by that capture — so two people converging on one line is **one row
  naming both**. ⚠ **The join is `payload->>'itemId'`, because a notification
  carries no capture id and cannot**: a match is about a possibility, and the
  viewer's own capture is found at read time. Every payload written before the
  portal existed works unchanged.
- ⚠ **`eq(captures.userId, …)` in that join is the privacy term.** A notification
  names a counterpart; it must never be a door to the counterpart's row. Both
  sides get their own notification, so each person's portal is built entirely out
  of their own captures. Asserted.
- ⚠ **It empties, and `notifications.read_at` was already in the schema** — so
  Phase 2's *seen-state needs a column* is closed **with no migration**, and the
  deferred vocabulary migration is not waiting to be batched with anything.
- ⚠ **AN EMPTY PORTAL HAS NO DOOR.** Off is the drawing without the door, exactly
  as search's is — *an empty portal is the resting state* is not a surface to
  build, it is a surface that cannot be opened. The first version made it a live
  `<button>` whatever the bit said and a probe caught it.
- ⚠ **Never a count, and `portal.mjs` asserts the ABSENCE OF DIGITS on the
  door.** `hasPortalLines` is an `exists` rather than a count for the same
  reason: a counting function is one refactor from displaying one, and a badge is
  an engagement metric under another name.
- ⚠ **The console is handed down as a RENDER PROP.** The portal decides where a
  console goes; the page decides what it does. Every control on it is the
  record's own handler acting on the same capture through the same action — a
  portal that built its own would be a second implementation of every mutation on
  this screen. ⚠ **`crossedOff` is read off the portal's line and never off
  `lines`**: the capture may be from March and outside the fifty this page
  loaded.
- ⚠ **The portal is the SCRIM'S THIRD OCCUPANT, and it is the only one that keeps
  the scrim on the desk.** The console suppresses it up there because the record
  around an expanded row is what a reader wants to keep seeing; the portal is a
  floating card at every width — it is not a line, so there is no row for it to
  expand into — and a floating card must sink what is behind it. `dismiss` asks
  about the portal **first**, because a console inside it is the innermost thing
  open.
- ⚠ **`portal-sheet` is `pointer-events: none` with the card taking them back**,
  which the console already knew and the portal did not inherit. Without it the
  gutter and the band under a short card swallow the tap meant for the scrim, and
  the box appears not to close. Found by the probe in one run.
- ⚠ **Three sentences, not four.** *Sam too.*, *Sam has.*, *Sam wants to.* — and
  §5's fourth, *Sam has too.*, **cannot fire**: `go_back_to × go_back_to`
  produces no match at all, because both know. **Do not add the sentence to
  complete the table** — it is a row in `classify` and a new `NotificationKind`,
  decided there. `lend` had no row in the table and was given one, flagged in
  the code the way `notificationCopy`'s unspecified lines are. `portalSentence`
  lives beside `notificationCopy` in `lib/overlap.ts` deliberately: §6 warns
  that the payload is what drifts, *because it is what the UI reads*.
- **Measured by `node_modules/.probe/portal.mjs` on both surfaces**, and proved
  by `tests/portal.test.ts` against the database — a browser cannot be driven
  into a convergence quickly, and the two halves are tested where each can be.
  `scripts/seed-portal.mjs` writes one locally, with the tests' production guard.

⚠ **This paragraph said the engine had no reader and is corrected rather than
deleted — 30 August.** It was true for a week and it is what the portal above
answers: `tracks`, `lib/overlap.ts` on both triggers, the suppression rule and
`notifications` rows written in the same transaction all exist, run, **and are
now read**. The fan-out is proved end to end with two accounts —
`tests/portal.test.ts`, and `tests/mark.test.ts` for the mark's side of it.
**What is still not built:** no QR handshake, no push delivery, and **the words**
— see below. ⚠ **The convergence mark was in this list until 31 August and is
built** — see Phase 2 step 4 above.

⚠⚠ **A CAPTURE CONVERGES ON ITS WORDS — directed 5 September, Amendment 4,
DOCUMENTED AND NOT YET BUILT.** This paragraph said *overlap joins on
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

⚠⚠ **THE LOG FROM 30 AUGUST BACK IS IN `docs/build-log.md`, AND IT IS PART OF
THIS FILE — 6 September.** `CLAUDE.md` had reached 182,000 characters against a
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
  two clamps; and the resume/re-entry gate.
- ⚠ **Restated here because it is the most expensive one in the file and a
  browser cannot see it:** never lift an expression containing
  `var(--keyboard-overlap)` — or any property script writes onto an element —
  into `@theme`. A `var()` is substituted where the property is **declared**,
  so a token on `:root` takes the fallback and freezes. Only a notched handset
  can tell.
- ⚠ **Do not fix a future overflow by deleting entries.** The next cut is
  another date boundary and another companion file, in the same order this one
  went: newest stays here, oldest moves out, nothing is paraphrased.

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
