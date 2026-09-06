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

## 3. The tile is the image; the words are behind the tap

⚠⚠ **REWRITTEN 6 SEPTEMBER, AMENDMENT 7, AND IT REVERSES THIS SECTION'S OWN
FOUNDING CONSTRAINT.** It opened: *THE CONSTRAINT THAT KILLS THE OBVIOUS DESIGN
— THE CORPUS CANNOT PROMISE AN IMAGE*, and built a text-first card with the
image as enrichment. **Directed instead:** *make it so that what's presented is
the image on the front page; for users to find out what each image signifies
they have to tap it, at which point the card details — the title, qualifier —
appear beneath the enlarged, almost full-screen image.* And, given as the
gate: ***any entry that doesn't have an attached image can never enter the front
page rail.***

⚠⚠ **THE GATE IS ON THE RAIL, NOT ON THE CORPUS, AND THAT IS THE WHOLE
DIFFERENCE.** A possibility with no image still exists, is still searchable, is
still what a capture resolves to and still converges. **It simply never appears
in the rail.** One term in the rail's own read; nothing else in the model knows
about it. ⚠ **And never a gate on capture** — §1 bans a forced catalogue match
before saving, and a capture has no possibility at all in the ordinary case.

**The tile:**

```
      12            ← openings. above the image, and nothing else up there
┌──────────────┐
│              │   frame — one aspect, one height, always
│    image     │   there is ALWAYS an image; that is what admission means
│              │
└──────────────┘
```

**The opened view:** the image, almost full screen, with the words beneath it —
title, qualifier, and a confidence state only when it is not the default.

**The rules:**

1. ⚠ **No image, no tile.** The rail's read carries the term. **A thin rail is
   not answered by admitting imageless tiles** — that is the design this
   replaced. §6's *silence stays silent* governs a short rail: it explains
   nothing about itself.
2. ⚠ **The image is FITTED, never cropped to fill.** A 2:3 poster survives; a
   landscape image letterboxes onto the paper that is already behind every
   screen. The reverse — a poster cropped to 16:9 — reads broken, and there is
   no bespoke art to crop to. ⚠ **Two states to judge now, not four**: an image
   that fits the frame and one that does not.
3. ⚠⚠ **THE TILE SAYS NOTHING, AND THAT IS THE POINT RATHER THAN A COST TO
   MITIGATE.** No title under it, no qualifier, no caption, **no hover** — there
   is no hover on a handset. ⚠ **Do not answer *I can't tell what these are* by
   putting the title back**; the answer is the opened view, which is one tap
   away. **The stated price: browsing is exploratory rather than scannable.**
4. ⚠ **The qualifier is still a FIELD on the possibility — Amendment 6 is
   untouched.** It moved from the tile into the opened view; it did not go back
   to being derived from a kind. **The opened view branches on nothing** either:
   image, title, qualifier, confidence state.
5. ⚠ **A confidence state shows only when it is NOT the default.** §7's states
   are *Unverified possibility*, *Corroborated by several people*, *Identified
   by a trusted source*, *Recently confirmed nearby*, *Possibly outdated*,
   *Disputed*. **Printing *Unverified* on everything is noise; *Disputed* and
   *Possibly outdated* must show.** ⚠ **Never a number** — §7 forbids an
   unexplained numeric score in the first release, and the opening count is the
   one exception §2 now carries.
6. ⚠ **No price, no call to action, no source logo.** §2's no-marketplace rule.
   A source is evidence and attribution and lives in the opened view.
7. ⚠ **A tap opens the possibility. Capturing it is a control on what opens.**
   Design rules 4 and 5, both earned by `/u/[handle]` on 4 September. **Do not
   put a capture control on the tile** — with an image-only tile there is
   nowhere for one to go that is not on top of the picture.
8. ⚠⚠ **THE OPENED VIEW BORROWS THE CONSOLE'S GRAMMAR AND IS NOT THE CONSOLE.**
   A fixed surface over a blurred page on a handset, expanding in place on the
   desk — the shape design rule 5 already permits, and the one the record
   taught. ⚠ **It must not be routed through `components/console.tsx`**, which
   acts on the viewer's **own capture** and carries cross-off, settle and the
   pencil. ⚠ **And it must not resurrect `film-screen.tsx`**, deleted in Phase
   2 step 1.

⚠⚠ **THE OPENING COUNT SITS ABOVE THE IMAGE, AND IT IS THE ONE ENGAGEMENT
NUMBER IN THE APP.** Directed. §2's *social without a feed* is **narrowed, not
deleted** — see Amendment 7:

- **It counts openings of a POSSIBILITY**, which belongs to nobody. It may never
  appear on a person, a capture, a track or a notification. ⚠ **§5's *the portal
  is never given a count* is untouched**, and `portal.mjs`'s no-digits
  assertion on the door still holds.
- ⚠⚠ **IT IS NEVER A SORT KEY. The day it orders the rail, the rail is a
  trending feed** — which Amendment 5 bans by name — **and the exclusion has
  been broken.** Named here so it is recognisable when it is proposed.
- **One integer on the possibility, incremented when the enlarged view opens.**
  Inflatable by anyone willing to tap, and that is accepted: it is a texture of
  interest, not a measurement, and nothing ranks on it.
- ⚠ **It is not `--color-chrome` and not `--color-accent`.** Brass means *a
  control* and the accent means *this converged*; a count is neither. It is
  `--color-muted`, which is what everything that is not those two is.

⚠ **The frame's aspect is a number to LOOK AT, not to argue.** Start at **2:3** —
posters are the only asset we get free at scale and the only one that cannot
survive a crop — but a rail of tall portraits on half a handset wants seeing
before it is committed to.

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

⚠⚠ **THE RAIL ADMITS ONLY POSSIBILITIES THAT HAVE AN IMAGE — 6 September,
Amendment 7.** One term in its read. **The corpus is not filtered anywhere else**
— an imageless possibility is still searchable, still resolvable and still
converges — so this term lives in the rail's own query and nowhere near
`lib/overlap.ts` or the capture path.

⚠⚠ **PARTLY ANSWERED — 6 September, Amendments 8 and 9.** Global by default,
with location as an **optional constraint** the reader switches on; relevance to
the reader's own record follows §7's ladder, whose top three terms are joins and
need no inference. ⚠ **And the shortest route to a local rail is the corpus we
already have**: a film is nowhere but a *screening* is somewhere, so occurrences
turn 71 existing possibilities into things to do near somebody — **and a
screening inherits the film's poster, so it clears the image gate for free.**
⚠ **The corpus is two layers**: a free source is the skeleton (names and
coordinates, no images, so it never reaches the rail) and a photograph is what
admits a row to it. **Both, and the skeleton is what makes two people
photographing one café converge on one row.**

**Still open: the SHAPE.** By kind? By recency in the corpus? One rail
or several? Half a handset screen holds one rail of ~2:3 tiles, so *several* is
probably a desk affordance. **Undecided, and it does not block the tile.**
⚠⚠ **WHAT IT MAY NEVER BE ORDERED BY IS THE OPENING COUNT** — that is a trending
feed under another name, and §2's narrowing in Amendment 7 permits the number on
the tile and nothing else.

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

~~**0. Decide `Kind`.**~~ ⚠⚠ **DISSOLVED — 6 September, Amendment 6. THERE IS
NO DECISION HERE AND THE CARD IS NOT BLOCKED.** It read: *four values today,
seven in §3; the card branches on it, so this is taken before the card is
written or it is re-touched afterwards.*

**The premise was false in the model this app already has.** `captures` has
**no kind column** — a type is a property of the **possibility**, read as
`possibility?.kind ?? null` in `lib/db/captures.ts` — so nothing about a
capture waits on this. **Asked from the origin, it is not even close:** a
picture showing an aesthetic, a house, a car, **an ambition** — none of them
resolve to a catalogue, all of them are complete captures today, and under
Amendment 4 all of them converge on their words with nothing classified
anywhere.

⚠ **A closed enumeration of *interest* grows an `other` that swallows the
majority**, and a majority sitting in `other` is the taxonomy reporting that it
was never the right axis.

**What replaces it, in build order:**

- ~~**`possibilities.qualifier`, additive.**~~ **DONE, `0015`.** A nullable `text` column,
  written at ingest. **Migration first, deploy second** — the runbook's
  ordering, and the one this repository has already paid ~18h of 500s for
  inverting. ⚠ **`year` stays**: superseded, not migrated away from.
- **Write the card against `title + qualifier + image?`.** No `kind` branch
  anywhere in it. That is what makes design rule 3 — *one object has one height*
  — true by construction rather than by care.
- ⚠ **Leave `Kind` at its four values.** It is widened by the ingest that needs
  it, with a real example in hand. It keeps exactly two jobs, both **behind a
  resolution**: the console's resolve question through `VOCABULARY` /
  `specFor` / `DEFAULT_INTENT` / `landsIn`, and catalogue identity. Neither
  is on the card; neither is reached by an unresolved capture. ⚠ **Still not a
  migration when it does move** — every vocabulary column is plain `text` with
  a compile-time-only `$type<>`; see Amendment 4's correction of the enum
  claim.

⚠⚠ **AND ONE THING THE ORIGIN NAMED THAT NOTHING IN THE TREE SERVES: *optionally
the reason for finding them interesting*.** `captures.note` exists and **has no
door** — no component in `components/` or `app/` writes it. ⚠ **When it gets
one it must stay out of `normalised_text`**: *learn to sail* is the common
intention, *because I saw a boat in Greece* is not, and matching on the reason
would make convergence **rarer the more carefully somebody wrote**. Unscheduled
and named rather than quietly deferred.

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

**2. The tile and the opened view** — 6 September, Amendment 7. This read *the
card, against TMDB and against a fixture with no image; four states*. ⚠ **Both
halves of that are wrong now**: there is no imageless state to judge, and
**`fixture` is §4's own word for a thing you own** — an `EntryState` the
linter enforces — so a sample row must never be called one. **Say sample
possibility.**

- **The tile**, against a real TMDB poster and against a sample possibility
  whose image is landscape. **Two states**: an image that fits the frame, one
  that letterboxes.
- **The opened view** beneath it — the enlarged image, title, qualifier, and a
  sample carrying *Disputed*, which the corpus cannot produce today.
- ~~**`possibilities.qualifier` comes first.**~~ **DONE — `0015`, 6
  September: `qualifier`, `image_path` and `open_count` on `items`, with
  two re-runnable backfills. Applied to production first, then dev.** ⚠ **A
  third column the brief did not ask for**: the picture lived at
  `metadata->>'posterPath'`, **a film-shaped location for a universal thing** —
  the same fault `year` had as a qualifier — and the rail's gate has to be one
  term. Measured on production: **71 possibilities, 71 with a qualifier, 71 with
  an image.** The ingest writes both, stated by the caller.
- ~~**A way to read the corpus.**~~ **DONE — `listRail`, `0016`.** The
  admission rule lives in it and nowhere else. Keyset cursor on `id`; a seed
  with no cursor starts at a random point and wraps. **Measured at 300,000 rows:
  plain Index Scan, no Sort, 0.126 ms** — and at 58 rows the planner takes a Seq
  Scan, which is a small-table artefact rather than a regression.
- ⚠ **`open_count` has no index, deliberately** — the ordering that would break
  *never a sort key* is also the one that gets slow enough to notice.
- ~~**The tile.**~~ **DRAWN — 6 September.** `components/rail.tsx`, a
  server component handed down as a node. ⚠ **Two bugs a screenshot found and a
  build did not**: an `sr-only` span on the `<li>` escaped the
  scroller's clipping (it is `position: absolute` with no offsets) and
  stretched the document to 3792px, zooming the handset out 4× and pushing the
  composer off screen; and the title on `alt` drew **words and a
  broken-image icon** on a wordless tile whenever TMDB no longer served the
  poster. **See CLAUDE.md.**
- **What is left: the opened view** — a tap enlarging the image with the words
  beneath it, and the `open_count` increment that goes with it.

**3. The browse half** arrives above the composer. `/` becomes two halves, and
the rail **shrinks** when somebody writes — keyed on `writing`, never on
`--keyboard-overlap`.

**4. Attach** — the billing switch, then the control.

**5. The camera**, if and when the vision dependency is bought.

⚠ **Steps 1–3 need no paid service and no new dependency.** That is the whole
front page except attachment.

---

## 9. Open, and blocking nothing yet

- ⚠⚠ **BOTH COMPOSER QUESTIONS ARE CLOSED, AND THE ANSWER TO BOTH WAS THE SAME
  SUBTRACTION — 5 September, directed: *limit the number of characters to the
  number that can fit in the given space so we have no need for scrolling in the
  composer.*** The overflow does not print above the composer, and the swipe does
  not scroll anywhere in it, **because there is nothing to scroll**. See §10.

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
- ~~**How the composer and the browse half share the screen when the keyboard
  is up.**~~ ⚠⚠ **CLOSED 6 September, directed: THE BROWSE HALF SHRINKS,
  *sort of parallax style*.** It is not covered and it does not scroll away —
  it compresses, moving at its own rate rather than the composer's, so the two
  halves read as two planes.
  - ⚠⚠ **KEYED ON `writing`, NEVER ON `--keyboard-overlap`.** That property
    measures a gap that also opens when a Safari tab's address bar collapses
    during a scroll, and `useKeyboardHem` says in writing that **it is not a
    keyboard detector**. **The composer's own third line already follows this
    rule** — see CLAUDE.md — and the rail follows the same one, so the two
    halves cannot disagree about whether somebody is writing.
  - ⚠ **So the desk shrinks too**, exactly as the composer's third line grows
    there. A pointer-type branch would be a device sniff for a behaviour that
    reads correctly on both.
  - ⚠ **One duration and one curve: `--recede` on `--ease-recede`.** The app
    has one, collapsed from two on 24 August precisely so nobody sets a second
    one equal to it. **Parallax is a difference of DISTANCE, not of timing** —
    two travels over one duration. Two durations is two clocks to keep in step,
    which this repository has refused three times.
  - ⚠ **It must not unmount.** A rail that unmounted would resize the strip and
    lose its scroll position; §5's one-cell grid lesson, applied a floor up.

---

## 10. A capture is as long as the box, and the box grows a line to write in

**Directed 5 September**, and it closes both of the composer questions §9 used to
carry. The field measures itself on every keystroke and **refuses the one that
would not fit**. Nothing rolls under, so nothing scrolls, so there is no scroll
area to swipe on and no overflow to print anywhere.

⚠⚠ **DELETED WITH THE SCROLL:** the roll-under, `roll-mark`, `composer-bar` and
`readRoll`. The field is `overflow-y-hidden`. There is a tombstone in
`globals.css` holding the argument, because all four will look like missing
features to somebody reading the composer cold.

⚠⚠ **THE CAP IS MEASURED AND IS NEVER A NUMBER.** *"The number of characters that
fit"* is not one: measured on the live page it is **73 in Latin, 92 in Arabic, 38
of `m`, 142 of `i` on a 390 handset, and 146 on the desk** — five different
answers from one rule. A `maxLength` would be a constant tuned until one handset
looked right, which this repository rules out by name.

⚠ **The measurement is synchronous, and that was checked rather than assumed.**
`readRoll` ran in a `requestAnimationFrame` because `scrollHeight` is not right
until the new text is laid out — but a cap has to refuse a keystroke *during* it,
a frame later being a character that appears and then vanishes. Measured in
Chromium and WebKit: **at the boundary the synchronous read and the post-frame
read agree**, because reading `scrollHeight` forces the layout it needs. They
part company only deep inside an overflow, which the cap makes unreachable.

⚠⚠ **THE CAP IS STICKY, AND THAT IS NOT A DETAIL — IT IS THE DIFFERENCE BETWEEN
STOPPING AND SIEVING.** Asking only *does this exact string fit* is right about
every string and wrong about typing: at the cap a wide letter does not fit and a
narrow one still does, so `mike` arrived as `m` refused, `i` **accepted**, `k`
and `e` refused. Measured before the latch: **62 letters kept out of a prefix of
74, in no order a reader could explain.** A full field has to stop taking input,
not sieve it. The latch is the length at which the box first said no, held in a
`useRef`; a deletion clears it.

⚠ **A paste is TRIMMED, not refused.** Refusing it outright would be silent, and
silent failure is this screen's own recorded failure mode. It keeps a prefix, so
a paste into the middle loses the tail — stated rather than solved.

⚠ **What it costs, and it is the one hole:** a capture that fitted when it was
typed can stop fitting if the type reflows under it — a rotation, or a desk
window narrowed — and what does not fit is then **clipped rather than scrolled
to**. The alternative was trimming somebody's words on a resize, which is worse.
**The cap is about what can be written, not a promise about every width it is
later read at.**

⚠ **So do not answer *the composer feels short* by putting the scroll back.**
That is a request for a taller box or a shorter rule, and both are one number in
`compose-screen.tsx`. Restoring the scroll restores the readout, and the readout
is what the cap was chosen over.

## The third line

**Directed the same day:** *when a user taps in the composer and the keyboard
rises, the composer itself should increase in size just enough to add one extra
line of writing.* Two lines at rest, three while it is being written in.
Measured: field **48 → 72**, card **130 → 154** on a handset, **64 → 96** on the
desk — the same one line at the desk's root scale. **The cap reads the box**, so
the third line is a third line of *writing*: 106 characters of Latin where two
lines took 73.

⚠⚠ **NOT THE GROWING BOX THAT WAS DELETED — the difference is the trigger.** That
one measured `scrollHeight` and grew from two lines to six *as the words
arrived*, moving the card, the glow and the strip on every keystroke past the
second line. This moves **once, when you tap in**. *The box does not follow the
words* is the rule that survived; *the box has one height* was never the point of
it.

⚠⚠ **IT STAYS TALL WHILE THERE IS A DRAFT IN IT, AND THAT IS WHAT STOPS THE THIRD
LINE BEING HIDDEN.** The field is `overflow-y-hidden`, so three lines of draft in
a box that shrank back to two is a line of somebody's words clipped with nothing
saying so. `writing || draft !== ''` costs no measurement and cannot get it
wrong: **the short box is only ever the empty one.** Do not tidy it to `writing`
alone.

⚠ **Keyed on `writing`, never on `--keyboard-overlap`** — that property measures
a gap that also opens when a Safari tab's address bar collapses during a scroll,
and `useKeyboardHem` says in writing that it is not a keyboard detector. ⚠ **The
desk grows too**, deliberately: a pointer-type branch would be a device sniff for
a behaviour that reads correctly on both.

⚠ **The latch is cleared by `commit`, which was a bug for an hour.** `fullAt` is
a *length*, and a length outlives the words it measured: left behind, a capture
that filled the box at 106 characters made the next one stop dead at 106 —
including 106 narrow characters the box had room for.

## The box says no

**Asked 5 September:** *can there be a counter that appears as the user is about
to approach the last allowed character?*

⚠⚠ **A COUNTER CANNOT BE HONEST HERE, AND THAT IS THE WHOLE ANSWER.** The cap is
measured, so *characters remaining* has no value: it is **106 in Latin, 213 of
`i`, 57 of `m`, 214 on the desk**. A digit in that corner would have to pick one
and lie, and the lie would be worst exactly where it mattered — at the end. **Do
not add one.**

⚠ **What was real in the question is that the cap is SILENT.** A keystroke past
the end simply does not appear: nothing is drawn, nothing moves, and *silent
failure* is this screen's own recorded failure. So the box answers instead —
`composer-refused`, the card down half a hem and back over half of `--recede`,
once per refused keystroke.

⚠ **Down rather than sideways.** A shake is the borrowed idiom for refusal and it
is the wrong sentence: nothing was rejected as invalid, the words reached the
bottom of the box.

⚠ **No colour, and it is forced rather than restrained.** `--color-accent` means
a convergence, `--color-chrome` means a control, `--color-decline` is the one
dismissal in the app, and `docs/decisions.md` has twice refused to make red the
error colour. §11's scarcity rule takes all three. **Motion is what is left, and
it is enough.**

⚠ **It fires only when nothing landed** — the honest case and the safe one. A
refusal changes no state, so the class survives the animation; after a
`setDraft` React would reconcile it away mid-bump. A trimmed paste put words in
and can be seen to have done so.

**Measured by `node_modules/.probe/composercap.mjs`** — 50 assertions across two
surfaces and three scripts, including that the cap differs in all five cases
above, that the kept text is a **strict prefix** of what was typed, that tapping
in adds **exactly one line**, that leaving a full composer **keeps** it, that a
refused keystroke leaves the caret where it was and **bumps the box**, that the
bump animates `translate` and paints nothing, and that Return still commits.

## 11. The undo, and the control that could not be clicked

**Asked 5 September:** *when I submit, where does it land? previously it would
land and a user would have the option to undo it.* It lands in the record at
`/record`; the front page shows the receipt. **The undo did not come with it** —
step 1 moved the record and left its one exception behind.

⚠ **It is beside the receipt now**, in the record's own slot geometry:
`line-glyph`, `--glyph-line`, immediately after the words rather than out at the
margin — which is the record's finding, reported the hour it was built the other
way.

⚠⚠ **THE BUG IT UNCOVERED IS THE IMPORTANT HALF, AND IT WAS NOT ABOUT THE UNDO.**
`onBlur` was unconditional, so a click on the undo blurred the field, `writing`
went false, **the composer shrank three lines to two**, the button moved ~20px
out from under the pointer between mousedown and mouseup, and **no click event
was ever dispatched.** Lit, correctly placed, hit-tested to itself, and dead.
⚠ **The send arrow had been failing the same way and it was written off as a
probe artefact.** Any control in that strip would have been.

⚠ **The fix is the record's own guard, a day late:** *`relatedTarget` inside the
sheet is not leaving*, which `page-screen.tsx` has said in writing since 30
August for its own chips. This screen was written without it and the cost stayed
invisible until the box learnt to change height. ⚠ **iOS never had the bug and
still needs the guard** — it does not focus a button on tap, so the field never
blurs there; the desk and Android do.

⚠ **The window is handed down, not retyped.** `undoCapture` bounds the delete in
SQL against `created_at`, so a `10_000` in the client is a clock that can
disagree with the one that decides, and the disagreement shows as a control that
is lit and refuses.

⚠ **The receipt outlives the control.** It stays until the next capture replaces
it — it is the confirmation, and a confirmation that vanished after ten seconds
would be the toast this screen refuses to be.

⚠⚠ **THE WORDS COME BACK INTO THE COMPOSER, WHICH THE RECORD'S UNDO DOES NOT
DO.** The same act finished on a surface that can finish it: the undo exists *for
a typo*, and on the record there is no field to put the words back into. ⚠ **Only
into an empty one** — appending is not the fix, because a capture is one line and
two run together are neither.

## What the window closing looks like

**Directed 5 September**, and it reverses what this section said that morning:
**the receipt goes when the undo does**, and the record's own door bounces at the
same instant. One event, two things — the screen stops saying *here is what you
wrote* and starts saying *it is in there*. A toast leaves nothing behind; this
hands over.

⚠ **The bounce is state, not an event.** The foot is unmounted while somebody
writes, so a capture committed with the keyboard up has no door to animate when
its window closes; `arrived` survives until the foot is on screen and plays on
mount. **A signal nobody could have seen is not a signal.** An undo clears it.

⚠ **Up, where the composer's refusal bump is down.** Same family, opposite
reading: down is *the words hit the bottom of the box*, up is *it went
somewhere*. ⚠ **Not a badge, and it must not become one.**

## The two-tap bug, and why the first guard missed it

**Reported from a handset within the hour:** *tapping the undo only collapses the
keyboard; I have to press it again to actually undo.*

The tap blurred the field, iOS took the keyboard down, **the strip travelled from
the top of the keyboard to the bottom of the glass**, and the button was no
longer under the finger when the tap completed.

⚠⚠ **THE `relatedTarget` GUARD COULD NOT REACH IT.** That property says *where
the focus went*, and **on iOS a tap on a button focuses nothing at all** — it
simply blurs the field, so `relatedTarget` is `null` and the guard reads it as
leaving. **The fix had to stop the blur, not classify it:**
`onMouseDown={keepFocus}` on every control in the strip, because
`preventDefault` on the compatibility `mousedown` cancels the focus change and
leaves the click alone. The guard stays for keyboard users tabbing in.

⚠ **The lesson generalises past this screen:** a control beside a focused field
must not take the focus, on any surface where losing it moves the layout.

## 12. A commit lets go, the undo comes down a line, and home joins the bar

**Three reports from a handset, 5 September.**

⚠⚠ **THE BOUNCE COULD NOT BE SEEN WITH THE KEYBOARD UP, AND THE ANSWER WAS A RULE
THIS SCREEN NEVER INHERITED.** *A commit ends the writing mode* was directed 27
August for the record's strip; the front page was written without it. The foot is
unmounted while somebody writes, so the door had nothing to say on a screen it
was not on. `commit` blurs the field now, and the receipt, its undo, the window
closing and the bounce all happen where they can be seen. **Nothing new is
drawn.** ⚠ **Cost: a run of captures is a tap back into the field between each** —
the 27 August trade, taken again.

⚠⚠ **THE UNDO WAS FIVE PIXELS HIGH.** `items-baseline` aligns a flex item on
**its** baseline, and a box holding only an `<svg>` has none, so the engine used
its bottom margin edge. `items-start` lets `line-glyph` do its job — the holder
is one line box tall, so the drawing lands on the line's own centre. **Measured
0.00px after.** It reads ~2px above the cap-ink centre, which is the relationship
every glyph on a record row has and is what `UndoGlyph` was redrawn for.

⚠⚠ **HOME, FAR LEFT — AND THE BAR IS FIVE COLUMNS.** A house: the most
conventional drawing in the file, on purpose. Off on the composer, lit on the
record — the mirror of the record glyph, so the app is two surfaces each holding
a lit door to the other and a dark drawing of itself. ⚠ **It duplicates the
wordmark**, which `foot.tsx` had ruled out; the cost is stated rather than
hidden.

## 13. The line stays in the box

**Directed 5 September, and it deletes §11's receipt outright.** *When writing,
text that has passed is partially dimmed, so that when the arrow is tapped it all
goes solid, blinks twice, and the optically in-line undo appears. This all stays
inside the composer, never outside.*

**A capture no longer travels on being sent.** It stops being a draft and becomes
a statement, in place: the words hold their box to the pixel, go from
`--color-muted` to `--color-text`, blink twice, and the undo appears at the end
of the last line. The keyboard retracts. Left alone for ten seconds the line fades
and drifts toward the foot while the record's door bounces; tapped, the undo
deletes the row and **puts the writer back mid-sentence** — words in the field,
field focused, caret at the end.

⚠ **The cap reserves the control's room**, because the last line has to have
somewhere to put it: `--undo-reserve` on the field's end, on every line, since a
per-line reservation is `shape-outside` on a text field and there is no such
thing.

⚠ **The undo's position is measured from the last character**, not from the box —
a control parked at the end of the box is stranded after a short capture, which
the record reported the hour it was built that way.

**Measured by `node_modules/.probe/composersent.mjs`** — 27 assertions.

---

⚠⚠ **IT MOVED THE TRAY, SO THE CONSOLE'S SETTLE MOVED WITH IT** — `foot.tsx` has
warned since 2 September that moving the tray out of column four breaks the
unbuilt reaction the sight line is for. Both are column five now, measured equal
at **335** on a 390 handset by `node_modules/.probe/traysightline.mjs`, which
exists so the next person to add a glyph finds out immediately. ⚠ **The
composer's own control row stayed four columns**: send is aligned to nothing.

**Measured by `node_modules/.probe/composerundo.mjs`** — 19 assertions, including
that pressing a control does not move the focus, that ONE tap undoes, that the
capture is really gone from the record, that a full composer keeps its draft,
that the receipt goes with the window, and that the door bounces once and leaves
no mark.

⚠ **The `ance` mirror was read and refused, and the reasoning is worth keeping.**
It is not "overflow printed above" — it is a **full mirror**: past 40 characters
the whole body re-renders as a centred, faded, tappable block above the field,
which keeps the caret. Three things ruled it out here: **the text is on screen
twice** (density rule 2), **its precondition is a permanently empty top half**
which §4 is committed to filling, and it is an addition where this was a
subtraction. ⚠ **One idea in it is still worth having and is NOT built**: tapping
a word in the mirror moves the caret to it. If the cap is ever loosened, that is
the thing to take.
