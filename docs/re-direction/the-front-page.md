# The front page — browse above, compose below

Status: design brief, 5 September 2026. **It is meant to die.** Delete or strike
each section as it is built, and move this file to `docs/re-direction/inactive/`
when the front page is done. A design document that outlives its build reads as
current and is not.

Normative: **Amendment 5** to `docs/re-direction/implementation-spec.md`, §5
*Home / Capture* and *My things*. Where this brief and the specification
disagree, the specification governs and this file is wrong.

---

## 0. The sentence everything else answers

⚠⚠ **THIS IS A RECORD-FIRST APP. Directed 5 September, and it is the tiebreak
for every question below.** *We exist so people can make a record of the things
that interest them — things they want to do, eat, see, try, buy.*

**So the top half is a feeder, not a destination.** Browsing exists to put
things in your record. Two consequences, both load-bearing:

- **Every path through the browse half ends in a capture**, or it has wasted the
  screen.
- ⚠ **The record may never be buried.** It moves off `/`, which is a real cost —
  so it is reached in one tap from the foot, and never more than one.

The direction, as given: *the front page is a place where people can both lodge
a thought as quickly as possible and browse by swiping images of experiences and
productions — the top half a YouTube/Netflix visual mode, the bottom half a
Claude/ChatGPT mode with a box to type and attach things before submitting.
Things submitted go to a separate list on another surface, reached by a glyph in
the bottom bar.*

---

## 1. What this is NOT a reversal of

⚠ **§5 has always specified *Home / Capture* and *My things* as two surfaces.**
Phase 1 collapsed them into one page because the record *was* the product's only
screen. **This un-collapses them and lands back on the specification's own
structure** — it is not a departure from §5, it is arriving at it.

⚠ **The poster wall is deleted and must not come back.** `components/shell.tsx`
and the four collection routes went with it in Phase 1. The browse half is a
different object with a different job: the wall showed *your films*; this shows
**the corpus**. Do not resurrect the deleted components to build it.

⚠ **The console, the lock swipe, the convergence mark, the fade at the foot and
the portal's render-prop all MOVE with the record. None of them dies.** They are
the record's furniture and the record is still the record; only its route
changes. **A rewrite of any of them is a mistake** — see
`phase-2-convergence.md`, whose sequence built all four.

⚠ **Amendment 4 is untouched.** *A capture converges on its words* lives
entirely inside `lib/overlap.ts` and no surface reads it. If anything this raises
its value: a composer whose whole output is words is a machine for producing
exactly what Amendment 4 matches on.

---

## 2. Vocabulary, decided before it drifts

⚠ **They are POSSIBILITIES, never "postings".** §2 bans a feed outright, and
*post* drags likes, authorship and recency in behind it. The corpus is a set of
possibilities; a card shows one.

⚠ **"Bookmark" is on §4's banned list and the ESLint rule enforces it.** More
usefully, the concept already exists: **saving an article to read later is a
capture**, with the intention *consume*. Nothing new is needed for it but a
kind.

⚠ **`Kind` is four values and §3 specifies seven types.** Today:
`film | book | place | object`. §3: product or object, place, service, activity
or experience, media, event or occurrence, other. **The card must be written
against the seven from the start** — writing it against four and widening later
re-touches every branch — but expanding the union touches `VOCABULARY`,
`specFor`, `DEFAULT_INTENT` and `landsIn`. **See §8 item 0: this is the one
decision that has to be taken before the card is written.**

---

## 3. The card — one wrapper for every type

⚠⚠ **THE CONSTRAINT THAT KILLS THE OBVIOUS DESIGN: THE CORPUS CANNOT PROMISE AN
IMAGE.** A film has a poster. An arXiv paper has none. A user-contributed
experience has none. **If the wrapper is a poster grid, everything without a
poster is a hole — and the holes multiply exactly as Phase 4 succeeds.** The
container is therefore text-first with the image as enrichment, which is what
§11 already says this app is: *type is the entire design*.

```
┌──────────────┐   frame — one aspect, one height, always
│              │   image FITTED inside it, never cropped to fill
│  image  or   │   no image → the name, set in type, on the paper
│    type      │
└──────────────┘
  Name            ← the only mandatory field. one line, truncates
  qualifier       ← the one line that says WHICH one
  state           ← only when it is not the default
```

**The rules:**

1. ⚠ **The name is the only required field.** Every other slot may be empty and
   the card still measures the same — design rule 3, *one object has one height
   wherever it appears*. A rail whose tiles ripple has already failed.
2. ⚠ **The image is FITTED, never cropped to fill.** A 2:3 poster survives; a
   landscape article image letterboxes onto the paper that is already behind
   every screen. The reverse — a poster cropped to 16:9 — reads broken, and
   there is no bespoke art to crop to.
3. ⚠ **No image is not an error state.** The name set in the frame **is** the
   drawing. **No placeholder icon**: it says nothing at full cost, and it would
   become the app's most repeated glyph.
4. **The qualifier is derived from `kind`, never asked.** Year for a film,
   author for a paper, locality for a place, date for an event, brand for a
   product. The same move `lib/vocabulary.ts` already makes deriving labels from
   `kind + intent`. §2: *never ask the user to categorise anything.*
5. ⚠ **A confidence state shows only when it is NOT the default.** §7's states
   are *Unverified possibility*, *Corroborated by several people*, *Identified
   by a trusted source*, *Recently confirmed nearby*, *Possibly outdated*,
   *Disputed*. **Printing *Unverified* on every user-contributed card is noise;
   *Disputed* and *Possibly outdated* must show.** Design rule 2 applied to
   state. ⚠ **Never a number** — §7 forbids an unexplained numeric score in the
   first release.
6. ⚠ **No price, no call to action, no source logo.** §2's no-marketplace rule.
   A source is evidence and attribution and lives on the detail surface.
7. ⚠ **A tap opens the possibility. Capturing it is a control on what opens, not
   on the card.** Design rules 4 and 5, both earned by `/u/[handle]` on 4
   September, where *Add to wants* printed once per row was louder than the
   content it belonged to. **Do not put a capture control on the tile.**

**Four states to draw and judge together:** a poster that fills the frame; a
landscape article image letterboxed; **no image at all**; and one carrying
*Disputed*.

⚠ **The frame's aspect is a number to LOOK AT, not to argue.** Start at **2:3** —
posters are the only asset we get free at scale and the only one that cannot
survive a crop — but a rail of tall portraits on half a handset screen wants
seeing before it is committed to.

---

## 4. The browse half

**It reads the corpus** — one set of possibilities with mixed provenance. TMDB
today; user contributions from Phase 4. ⚠ **They are not two lists**: what tells
them apart is evidence, not location.

⚠ **§5 already anticipates horizontal rails on Home** — *Here* and *For you
here*. This is not a new shape; it is that shape arriving before Phase 5's
location work, filled from the corpus instead of from proximity.

⚠⚠ **IT MUST NOT BECOME A RECOMMENDATION FEED.** §2 permits recommendation only
as *an explained, user-controlled local relevance result*, and bans a
recommendation feed outright. **A "popular now" or "trending" rail is a feed
under another name.** A rail ordered by something the reader chose, or by
nothing at all, is not.

⚠ **`touch-action` is `pan-x` on the rail and `pan-y` on a record row**, which is
what keeps design rule 5 (*one gesture means one thing*) intact: the rail is a
**scroller**, not a gesture with a verb. **The day a swipe on a card is given a
verb it collides with the record's lock swipe, and this rule is what it has to
answer to.**

**Open: what the rail is a rail OF.** By kind? By recency in the corpus? One rail
or several? Half a handset screen holds one rail of ~2:3 tiles, so *several* is
probably a desk affordance. **Undecided, and it does not block the card.**

---

## 5. The composer half

⚠ **The composer WRAPS; the record's rows stay one line — directed 5
September.** This reverses half of the 28 August one-line rule, deliberately and
with the cost stated. **What the rule protects is untouched**: the record's rows
are still one line and still truncate, which is what fits twenty-four of them on
a handset, and design rule 3 is unharmed. **Only the live input grows** — because
reading back what you typed, and attaching something to it, needs a box.

⚠ **The `<input>` becomes a `<textarea>` again, and this is the THIRD swap.**
Both previous reasons are recorded in CLAUDE.md and both stand as history: it
went to `<textarea>` on 27 August for wrapping, and back to `<input>` on 28
August for the sliding one-line field. **The condition changed again, so the
element follows.** Do not read any of the three as a mistake.

⚠⚠ **THE FIELD IS MOUNTED AT ALL TIMES AND ITS FOCUS IS SYNCHRONOUS.** iOS
raises a keyboard only for a focus that happens *inside* the gesture that asked
for it. **Never make the field conditional and never move its focus into an
effect.** This survived every previous redesign of the writing strip and it
survives this one.

⚠ **Losing focus is leaving** — `onBlur` is an exit, because iOS's own *Done*
takes the focus and says nothing else. The `open` latch and its ordering rules
(`done` clears the latch *above* its `blur()`) must travel: **two exits in one
tick is two captures**, and §10's idempotency key protects a retry, not this.

**Attach.** A photograph from the library, a photograph from the camera, a link.
⚠ **`lib/media.ts` is built and dark** — `@vercel/blob`, 8MB, EXIF stripped,
access-controlled path, provenance retained — gated on `BLOB_READ_WRITE_TOKEN`,
which is unset. **Attach needs the billing switch and no new storage code.**

---

## 6. The record's own screen

**Everything about the record is unchanged except its route.** Newest-first, one
line per capture, 34px rows, the console on a tap, the lock on a swipe, the
convergence mark in the gutter, the fade at the foot, and the portal's console
handed down as a render prop.

⚠ **`crossedOff` is read off the portal's line and never off `lines`** — the
capture may be from March and outside the fifty this page loaded. That rule
travels with the portal wherever the record lives.

~~**The foot returns to three columns.**~~ ⚠ **WRONG, AND CORRECTED BY READING
THE CODE — 5 September.** This said the foot was three columns (portal, `+`,
search) on the strength of a stale paragraph in CLAUDE.md. **It is four**:
search, `+`, convergence, tray, since 31 August. So the change is smaller than
this brief claimed — **the `+`'s slot becomes the record's glyph** and nothing
else moves: **search, record, convergence, tray.**

⚠ **The tray may not leave column four.** The console's settle glyph is aligned
to it as a sight line for a reaction that is not built yet (2 September, measured
at 326.25 on a 390) — *moving this glyph out of column four breaks something that
is not written yet.*

⚠ **What the change buys outright: the first-run shift is gone.** The foot was
three columns on a first run and four ever after, because the `+` was null on an
empty record, and the stated price was *the glyphs MOVE when the first line
lands* — from the sixth marks to the eighth. The record glyph is never absent, so
the grid is four from the first paint of a new account and nothing ever moves.

⚠ **`foot.tsx`'s founding argument was that the `+` is the one control this app
has to be perfect at. That control is gone**, so the reasoning around it should
be re-read rather than inherited — including the portal door's placement, granted
the foot against §2 partly because a column was empty.

---

## 7. The camera — lodged, not scheduled

**Directed: point the phone at the thing, take the image, parse it, and present
it in the app's own format, taking the most salient words and images.**

⚠⚠ **THE RULE THAT GOVERNS THE WHOLE FEATURE: §2's *suggestions resolve; they do
not gate*.** The photograph saves as a capture **immediately**; parsing is
enrichment that arrives afterwards and lands in
`captures.suggested_possibility_id`, which already exists for exactly this — *a
provider's answer to "is this a thing?", offered and not applied.* **A camera
flow that waits on a model before it will save anything is the four-second
capture broken by a network call.**

⚠ **The wall is the one the QR hit: there is no OCR in Safari.** `TextDetector`
is Chrome-only and abandoned; iOS Live Text is OS-level and not web-reachable —
the same shape as *`BarcodeDetector` is not in Safari* in §2f of the handshake
brief, except there is no lock-screen fallback to hand it to. So it is ship an
engine (tesseract.js, multi-MB wasm) or call a server.

⚠ **And *most salient* is not OCR anyway.** OCR on a product box returns the
barcode, the ingredients and the recycling symbol. Choosing the salient thing is
**understanding** — a vision model, per call, server-side.

⚠ **Three costs at once, against the standing *lodge it, do not build it*
direction of 25 August:** Blob billing, a vision call per photographed capture,
and the moderation surface user images require — reportable, removable,
auditable (§6, §7).

⚠ **What it unlocks, and it is the answer to §3's constraint.** TMDB serves
posters for **one** of seven types. **The camera is how the other six get
pictures.** ⚠ **But a photograph strengthens a CANDIDATE, not a CORROBORATION** —
§7 discounts near-identical images as independent evidence, and a private capture
never becomes public evidence without its owner's consent.

---

## 8. Sequence

**0. ⚠ Decide `Kind`.** Four values today, seven in §3. The card branches on it,
so this is taken **before** the card is written or it is re-touched afterwards.
Expanding the union touches `VOCABULARY`, `specFor`, `DEFAULT_INTENT` and
`landsIn`. ⚠ **It is not a migration** — every vocabulary column is plain `text`
with a compile-time-only `$type<>`; see Amendment 4's correction of the enum
claim.

~~**1. The split.**~~ **BUILT — 5 September.** `/record` is the record,
unchanged but for its route; `/` is `components/compose-screen.tsx`; the foot's
second slot is `RecordGlyph`, drawn off on the record itself. Measured by
`node_modules/.probe/frontpage.mjs` — 19 assertions on a 390 handset and a 1440
desk. **Four things were decided in the building that this brief did not say:**

- ⚠⚠ **THE CONFIRMATION IS THE ROW, AND THE ROW IS NOW ONE LINE IN THE
  COMPOSER.** The brief never answered *what tells you a capture landed* once
  the record is on another screen, and it is the exact failure this repository
  has hit twice — the handshake's handle field **read as done when nothing had
  been sent**, and production held 0 tracks. So the words stay where they were
  typed until the next capture replaces them. ⚠ **It is not a toast**: it does
  not time out and it carries no tick, because a timed message is an absence
  again a second later.
- ⚠⚠ **THE PORTAL'S DOOR IS ON `/` AND THE PORTAL IS NOT.** Its rows open
  **consoles**, and a console only exists where the record is — so the door
  navigates to `/record?portal=1` and the record opens the box on arrival
  (`portalOpen`). **A door that landed you on a page where you had to find the
  door again would be worse than no door.** It has to be lit on the landing page
  whatever it costs: a portal reachable only from a screen you choose to visit
  is §9's silent failure rebuilt.
- ⚠⚠ **THE FOOT IS THE STRIP'S SECOND ROW, AND THE FIRST BUILD PUT IT OUTSIDE.**
  `Foot` carries `col-start-1 row-start-1`, which places it in the record
  strip's **one-cell grid**; outside any grid it has no positioning at all and
  fell to the end of a full-height document. **The front page had no navigation
  on it, and typecheck, lint and seventeen passing assertions all said nothing.
  The screenshot said it immediately.** ⚠ **Two ROWS here, where the record has
  two STATES in one cell** — so the foot may be unmounted here, and must not be
  there. ⚠ **It does not fade, which is a known rough edge**: `hidden` carries
  an opacity and cannot carry a height. **If it reads badly the fix is a
  collapsing row, never a reserved gap.**
- ⚠ **`openSheet` stayed on the record.** The strip is still there for the one
  job it has left — **rewriting**, from the console's pencil. What went is the
  *second* door to it, which was the `+`.

⚠⚠ **AND TWO MORE FOUND BY LOOKING AT IT ON A HANDSET, the same day.** Both
were invisible to seventeen passing assertions, a typecheck and a lint.

- ⚠⚠ **THE COMPOSER IS A BOX WITH A LIFTED GROUND, NOT GLASS.** Reported: *the
  composer itself isn't especially visible.* It wore the bars' glass, which is
  what the record's strip wears — and **that is exactly why it disappeared**:
  glass reads as a surface because the record passes under it at full strength,
  and **there is no record under it on this screen.** ⚠ **This repository had
  already answered this once, for the console**: *its ground lifts toward
  `--color-surface` rather than sinking toward the page — the strip's glass
  recipe made the card invisible on a true-black page, because a floating card
  has no borrowed edge.* Same problem, same answer, found the same way — by
  looking. ⚠ **The direction said *box* twice**, so this is what was asked for
  and the bug is only what made it obvious. ⚠ **The strip keeps its glass behind
  the box** — inert on a black page today, right the day cards scroll under it.
- ⚠⚠ **THE FOOT'S ROW IS `--tap-floor` TALL.** Reported: *it says 'Anything'
  but it's partially obscured by the bottom bar.* Nothing was drawn over the
  words — **the box over them was the one you cannot see.** The glyph is
  `--glyph-foot` (26px) and `tap-target` hangs 44px off it, **9px past the
  drawing at each end**, so the foot's invisible targets reached up over the
  composer's last line and took its taps. ⚠ **On the record this cannot happen
  and the reason is structural**: there the foot and the field are two states of
  **one cell**, never both present, which is why `sheet-glyph` hangs its whole
  target upward on purpose. Two rows means the row must contain its own reach.
- ⚠ **A hem under the box, doing two jobs**: idle it is the air between the box
  and the foot; writing it is the air between the box and the keyboard's top
  edge. **A rounded box needs it where a bare line did not** — the record's
  field is a line and can sit hard on the keys; a surface with a corner radius
  reads as cut off when it meets an edge.

⚠⚠ **AND A THIRD, WHICH CHANGED THE SHAPE — directed 5 September: *it is not
a composer like Claude's; it should have the same aesthetic as the console that
opens when a user taps an item in their list.*** The box was a thin pill with a
field in it. **It is a card now: the words at the top, a row of controls along
its bottom edge inside it.**

- ⚠ **The console's own row, to the pixel.** `-mx-[--page-lead]` to cancel the
  card's padding, `grid-cols-4` with the left controls at `col-span-3` and one
  at `col-start-4`, `--glyph-foot` throughout, `rounded-2xl` and
  `p-[--page-lead]` on the card. **That is what *the same aesthetic* has to mean
  if it is to be checkable rather than a feeling.**
- ⚠ **The two answers agreed**, which is why this was one change and not two: a
  composer on a phone *is* words above a control row inside a box, and so is the
  console.
- ⚠ **Attach is in the row from the first build, drawn OFF** — the foot's rule,
  *controls go off; they do not disappear*, and the same one the record's camera
  follows while there is no Blob store. **A row that arrives empty and grows a
  control later is a row whose shape nobody could judge.**
- ⚠ **`SendGlyph` is a new eleventh-and-twelfth glyph, and it is NOT the `+`.**
  The plus came free when the foot lost it and was the obvious thing to reach
  for — but **a `+` in a composer means attach**, everywhere it appears, and
  this is the one row that has both. Return still sends; the arrow is what tells
  a box that wraps that Return does not open a line.
- ⚠ **`col-start-4` is inherited from the console and means nothing here.**
  There it is the settle glyph, on the foot tray's x centre as a sight line for
  an unbuilt reaction. **If a sight line is ever wanted for a capture going to
  the record, the column to aim at is TWO** — that is where the record's glyph
  now is.
- ⚠⚠ **THE GROUND IS GLASS — directed 5 September, with the cost stated and
  accepted.** `--glass-tint` over `blur(--glass-blur)` on a handset,
  `--color-surface` and no blur at and above `--breakpoint-stack`. **Measured
  byte for byte against a real open console**: `color(srgb 0 0 0 / 0.38)`,
  `blur(18px)`, 16px, 20px — the probe opens a console on the record and
  compares, rather than typing the numbers.
- ⚠⚠ **AND IT IS NEARLY INVISIBLE ON AN EMPTY PAGE, WHICH IS THE POINT OF THE
  CHOICE.** 38% black over black is black. **What makes a console read as an
  object is not its own edge — it is a sharp card against a blurred record**, and
  the browse half that will be behind this is not built. The alternative offered
  was to keep a solid `--color-surface` until the rail lands and switch then;
  **glass now was chosen deliberately**, so that when the rail arrives the
  composer already *is* the lens rather than becoming one. ⚠ **If it reads as
  *the composer disappeared again*, that is the known price and not a
  regression. The fix is the browse half, not a ground.**
- ⚠⚠ **THE STRIP LOST ITS OWN GROUND, AND IT HAD TO.** A backdrop filter filters
  what is behind it **including an outer one's result**, so a glass card inside
  the glass strip was 38% over 38% under 24px of blur plus 18 more. **A glass
  card inside a glass box is not the console** — the console is a transparent
  positioner over a blurred scrim holding **one** glass surface. ⚠ **What it
  costs is not payable yet: the foot loses its ground.** On the record the foot
  rides inside the strip's glass because the record scrolls under it; here it
  sits on the page, invisible today because the page is black. **The question
  comes back the day the rail lands and depends on whether it scrolls under the
  foot or stops above the composer. Do not pre-build a ground for it.**

⚠ **What is not built and is the next thing on this screen: attach acting.** The
control is drawn and dark; it needs the Blob billing switch.

**2. The card**, against TMDB and against a fixture with no image. Four states,
no rail yet — one component, judged on its own.

**3. The browse half** arrives above the composer. `/` becomes two halves.

**4. Attach** — the billing switch, then the control.

**5. The camera**, if and when the vision dependency is bought.

⚠ **Steps 1–3 need no paid service and no new dependency.** That is the whole
front page except attachment.

---

## 9. Open, and blocking nothing yet

- ⚠⚠ **Colour-by-type is PARKED, not answered — directed 5 September: *leave
  colour by type for now; keep it in mind for later.*** It stays written up in
  `docs/decisions.md` as a product question with an engineering cost.
  `--color-accent` is spent on convergence and is the only colour left.
  **Until it is decided, kind is carried by the qualifier's words and not by a
  colour, and no palette is picked inside this work.**
- **An etch-a-sketch aesthetic for the cards — raised 5 September, kept in
  mind.** Held here rather than in `docs/decisions.md` because it is an idea and
  not yet a decision with a cost attached. ⚠ **Note what it would answer if it
  were taken up:** it is a *drawing* treatment, so it is one possible answer to
  §3's hardest constraint — **the imageless card** — and it would apply to every
  type at once rather than needing seven treatments. ⚠ **And what it would
  collide with:** §11's *type is the entire design* and *known icons*, and the
  fact that a poster inside an etched frame is two visual languages in one tile.
  **Look at it against the four states in §3 before deciding anything.**
- **The frame's aspect** — 2:3 to start; wants a look on hardware.
- **What the rail is a rail of** — §4.
- **Whether the browse half survives an empty corpus.** Today the catalogue is
  TMDB and one kind. §6's *silence stays silent* forbids explaining an absence,
  so a browse half with nothing in it is a design question rather than an empty
  state to write copy for.
- **How the composer and the browse half share the screen when the keyboard is
  up.** The keyboard covers roughly half a handset; the browse half is the half
  it covers. `--keyboard-overlap` and `useKeyboardHem` already measure it —
  ⚠ **and `useKeyboardHem` says explicitly that the gap it measures is not a
  keyboard detector**, so do not read it as one here either.
