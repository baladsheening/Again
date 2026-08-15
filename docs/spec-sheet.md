# Screen spec

What must be true on every surface. Rules, not reasoning — `docs/decisions.md`
holds why, and where a rule here has a story behind it, that is where it is.

**Two kinds of line, marked throughout.** Most of this describes what the app
already does, and exists so that a change which breaks it is recognised as a
regression rather than discovered later. Lines marked **[unbuilt]** are targets
nobody has met yet, and each one is also in `docs/plan.md` so it can be
scheduled.

Current at `0f52dba`, 15 August 2026.

## Provenance, and what was struck

This began as a 449-line responsive specification written on 10 August, out of a
review of the code as it stood that day. It was addressed to an engineer who did
not know the project, and its architecture sections have since been overtaken —
twice, both times deliberately and both times with a measurement behind it.

**Struck: the scroll-ownership model.** The original required one scroll owner,
`#scroll-root`, with the document held at zero and no component calling
`window.scrollTo`. On 13 August that arrangement was measured unnecessary and
removed: the document scrolls, `#scroll-root` is an ordinary block in the flow,
and the clamp that held the document flat was deleted because it could not tell
iOS's scrolling from a person's. Re-imposing it would cost the address bar
receding in a tab and bring back a mechanism that fought the user 18 times out of
18. See *The document scrolls again*.

**Struck: the bottom SearchDock.** The original specified one dock pinned above
the keyboard at compact and landscape widths, with the collection row yielding to
it. On 14 August the typing moved into the masthead instead, which removed the
collision rather than correcting for it — and retired the remembered keyboard
height, the black ground under the lifted dock, and the two-mode bottom bar with
it. See *The masthead takes the typing*.

**Struck: the component ownership list.** It named `CollectionNav`, `SearchDock`,
`FeedbackToast` and `ViewportController` as separate owners. They are not
separate modules and there is no plan to make them so.

**Absorbed:** the review's eight findings. Typed search failures, serialized
paging, the removal of the diagnostic probe and the dock-clearance work were all
built between 10 and 14 August, arrived at independently. What remains of that
list is the accessibility gap in §7.

---

## 1. Viewport classes

Acceptance targets, not device assumptions.

| Class | Representative viewport | Required behaviour |
|---|---:|---|
| Compact phone | 320 × 568 | No horizontal overflow; one-line controls wrap safely; every action reachable |
| Standard phone | 360–430 × 640–932 | Search and navigation fit without clipping; keyboard state is stable |
| Landscape phone | 568–932 × 320–430 | Crosses the rail breakpoint on width while remaining a phone |
| Small tablet | 744 × 1024 | Rail only if the content column stays comfortable |
| Large tablet | 834–1024 × 1112–1366 | Rail and content balanced; touch targets full size |
| Laptop | 1280 × 720–900 | Fixed rail, readable measure, no footer occlusion |
| Desktop | 1440 × 900 and above | Centred shell, stable maximum measure |
| Short desktop | 1024–1440 × 600–720 | The final row and final poster remain readable above fixed furniture |

**[unbuilt]** Split-screen tablets, browser zoom at 200%, and increased text size
have never been checked. Right-to-left is not a target: there is no i18n and one
market, and the convention that keeps it cheap — logical properties, `text-start`
over `text-left` — is already the habit.

**Width decides navigation composition. It does not decide anything about the
keyboard.** `--breakpoint-rail: 45rem` comes from the layout — the rail costs
224px plus a 48px gap plus gutters — and that every current iPad falls the right
side of it is a consequence rather than the definition.

---

## 2. The shell

- **Masthead**, fixed, at every width below the rail. It holds the wordmark, a
  search glyph and a profile glyph. It clears the status-bar inset, stays
  readable during overscroll, and no poster paints over the mark.
- **Search opens in the masthead**, replacing the half of the row that started
  it, with a back arrow beside the field. Nothing has to dodge the keyboard,
  because nothing sits where the keyboard goes.
- **The bar at the foot is navigation**, and holds one thing: the four
  collections.
- **Both bars recede on one signal**: away on a downward scroll, back on the
  first upward movement, and always shown within 32px of the top. One listener
  drives both — a second would be a second threshold to keep in step. **The
  masthead is exempt while it holds the field**, since receding would take the
  query and the only way out of search with it, and leaving search reveals both
  bars.
- **The rail**, from `45rem`, is a fixed left column: collections with counts,
  the handle and *Sign out* anchored to the bottom, and its own search row at the
  foot of the content column. The mark is larger here than in the phone masthead
  and is the only place two sizes are deliberate.
- **One search input exists at a time**, chosen by width. Two would be two pieces
  of state and one of them always stale.

Every fixed surface reserves matching scroll clearance. No last row, last poster,
toast or dialog action may sit underneath furniture.

---

## 3. Collection lists

The list design, unchanged since 9 August and none of it accidental.

- The film title is the primary visual element and the largest type in the
  signed-in app.
- Year and intent are secondary metadata at the caption tier, roughly half the
  title's size. The intent label renders only while the entry is a want; a
  resolved entry does not claim to want anything.
- Long titles wrap. They are never truncated and never force horizontal overflow
  — an ellipsis promises an expansion that does not exist.
- Resolve actions stack below the title on narrow screens and move to a stable
  right-hand column from `lg`.
- Rows keep comfortable vertical spacing, a hairline rule between them, and 44px
  touch targets. Where two controls sit side by side their hit areas must not
  meet — *Yes*/*No* widens on touch for exactly this reason, and it is the one
  mistap in the app that cannot be undone after ten seconds.
- Empty states name the action that fills the collection rather than reporting
  that it is empty. They are the only writing a new account is guaranteed to
  read.
- No poster in any list. It survives where it is functional — search results and
  the intent sheet — and tapping a title opens the artwork full-bleed.

---

## 4. The wall

Home is artwork-led capture, not a catalogue.

- Three poster columns on compact phones, five from the rail breakpoint, six from
  `xl`, and six only while each poster stays recognisable.
- Every poster holds a fixed 2:3 ratio, reserved before the image loads.
- Poster buttons have a minimum 44px activation area.
- The first six images are prioritised; everything after them is lazy.
- Missing artwork gets a deliberate neutral placeholder.
- Catalogue failure leaves search working and gives an actionable state rather
  than a silently broken wall.

**It carries three constraints that are the whole argument for it existing**, and
each is a line rather than a preference: it shows no availability, it is ordered
by release date rather than popularity so that it cannot become a chart, and it
does not accumulate or respond to anything you did yesterday.

**The wall is in two halves under one caption**: films already released, newest
first; then films not yet out, soonest first. The caption is a single sticky
element reading *In cinemas*, which changes to *Coming soon* as the seam between
the halves reaches it. There is no second heading and no divider — nothing
between the grids but the row gap.

It sits below the masthead in z-order, so it appears as the masthead recedes and
yields the top strip back to the mark when it returns. **It clears
`env(safe-area-inset-top)` in its own right**: every pinned surface must, because
nothing inherits the inset and the failure is invisible on any screen without a
notch. The bar reaches the top edge of the screen — no strip of artwork above it
— and gives the inset back in flow with a negative margin, so it costs no space
under the masthead.

*In cinemas* is set in recording red (`--color-live`) and *Coming soon* in muted;
the colour is a second signal for a distinction the two words already carry in
full, so nothing depends on seeing it. The bar is translucent over a backdrop
blur, and is **the only translucent surface in the app** — a second one makes it
a theme rather than a bar.

**Whatever a label says must be true of the data.** TMDB filters by release dates
in a country and knows nothing about screens: a film released weeks ago stays in
the listing after it has left every cinema, and a repertory screening of an old
film is not in it at all. **The wall may never claim anything is showing near
anybody.** Country is the finest the data goes, and below it there is nothing but
venues and showtimes, which are out of scope by §2.

---

## 5. Search

**Search is a mode over the current route, not a route of its own**, so the
collection you were in and your place in it survive cancelling.

Data states, which are distinct and must stay distinct: `idle`, `loading`,
`ready`, `empty`, `error`, `loading-more`, `more-error`.

Interaction states are orthogonal to them and must be modelled separately:
focused, keyboard open, keyboard closed, intent sheet open. **Never infer
keyboard visibility from `onBlur`** — Android back and iOS dismissal both close
the keyboard while the input keeps focus.

Behaviour:

- Debounce enough to avoid a request per keystroke while keeping typing
  responsive. A generation counter makes late answers safe to drop; an abort
  alone does not, since it races the response rather than beating it.
- Completed query pages are cached for the session, which is what makes
  correcting a typo cost a render rather than a round trip.
- Page requests are serialized per query. A failed page does not advance the page
  or start an automatic retry loop, and existing results stay on screen.
- A new query returns the wall to the top.
- The four fields of a loaded query are one piece of state, so results and page
  can never describe different queries.

Presentation: results are the same wall of posters as Home, one column count per
width. **[unbuilt]** Duplicate titles a year apart are not yet distinguishable
without opening the poster, and skeletons do not yet reserve exact final
geometry.

Copy — and the rule underneath it is that **a failure never says "Nothing by that
name."**

| State | Text |
|---|---|
| Empty | `Nothing by that name.` |
| Rate limited | `That is a lot of searching at once. Give it a moment.` |
| Signed out | `You have been signed out.` |
| Unreachable | `Search is unreachable just now.` |

Retry is offered on everything except `signed-out`, where trying again does the
same thing again.

---

## 6. Intent and add

Selecting a film opens one intent sheet — a bottom sheet on a phone, a centred
dialog at desk width, same content and order in both.

- Poster, title and year at the top; primary intent first and visually strongest;
  secondary below it; cancel always reachable.
- It dismisses the keyboard before opening, traps focus, returns focus to the
  originating result on close, closes on Escape and on the backdrop, and prevents
  background scrolling.
- Duplicate submission is disabled during the request, and the query survives a
  successful add.

After adding: a short confirmation, and Undo for exactly ten seconds. It must
never sit behind the keyboard, the safe area or any fixed furniture, and success,
duplicate and failure must read differently.

---

## 7. Accessibility

- One meaningful heading per page; every navigation region labelled; current
  routes carry `aria-current="page"`. On the four collections the heading is
  `sr-only`, because the bar and the rail already name them on screen and a
  visible one would name each twice.
- Icon-only controls have accessible names.
- State is never carried by colour alone.
- Dialogs trap focus, close on Escape and backdrop, and return focus.
- Keyboard-only users reach every action in the same order as touch users.
- Text and controls meet WCAG contrast against both the ground and surfaces.
  Where a colour is added to the palette its ratio is measured and recorded at
  the token.
- Reduced motion is honoured globally; animations run once at 0.01ms rather than
  being suppressed in a way that hides state.

**[unbuilt] There are no live regions and no `aria-busy` anywhere in the app.**
Two moments are announced to nobody: the add confirmation, whose Undo is the only
reversible action in the product and expires on a ten-second timer, and the
search wall, which replaces itself after a keystroke and renders its failure
strings into silence.

---

## 8. Interaction rules

- No text-only control smaller than 44px on touch.
- No fixed surface without matching scroll clearance.
- No breakpoint may hide the currently focused input.
- Rotation while focused preserves the query and keeps the input reachable.
- A keyboard-open layout stays usable at 320 × 320.
- Reduced-motion users get state changes without sliding transitions.
- Zoom and large text grow content rather than clipping it.
- Horizontal scrolling is reserved for intentional navigation strips — never for
  titles, controls or buttons.
- **A tap that dismisses the keyboard does nothing else.** And a tap with nothing
  to dismiss is an ordinary tap: suppression is earned by something actually
  being put away.

---

## 9. Performance and reliability

- One scheduler for keyboard and dock measurement; no diagnostic animation loops
  in production.
- No state update per raw viewport event.
- Poster ratios reserved before load; only above-the-fold images prioritised.
- Obsolete searches aborted and stale responses dropped by generation.
- The UI stays responsive while an add performs server work.
- Upstream failures are logged server-side without exposing credentials or
  internal error text.
- The production CSP is tested, not only development. Inline `<script>` is
  blocked, which is why measurement harnesses use a client component.

---

## 10. Acceptance checks

Run before handing the app to anyone else, and after any change to the shell.
This is verification, not design work, and it is not a programme to grind
through — `docs/plan.md` carries the ones that are currently outstanding.

**Keyboard and scrolling.** Tap search at 320px and the field is reachable with
the keyboard open. Type and the layout does not jump. Scroll a long wall with the
keyboard up. Dismiss the keyboard with the system control while focus stays in
the field. Rotate while focused and keep the query, the position and reachability.
Repeat on iOS Safari installed, iOS Safari in a tab, Android Chrome and iPad.

**Navigation and layout.** Move between all four collections after scrolling
deeply; each route starts at its top and Back restores where you were. Leaving
search reveals the destination immediately. No unintended horizontal overflow at
320, 360, 430, 507, 744, 1024, 1280, 1440 and 1920px. At short desktop heights
the final row and final poster are fully visible.

**Data and failure.** A slow first search shows loading without blanking
unrelated content. Out-of-order responses cannot replace the current query. Pages
render in order, never duplicating or skipping. A failed page preserves results
and offers one retry. 401, 429, 503 and empty each produce their own state.
Adding the same film twice is idempotent. Undo is reachable for ten seconds in
every viewport class.

**Accessibility and build.** Complete search and add with the keyboard only, then
with a screen reader. Verify focus return after cancelling and after completing
the intent sheet. Verify 200% zoom and reduced motion. Confirm no production CSP
violations. `npm run lint`, `npm run typecheck`, `npm run build`.

---

## 11. Out of scope

Unchanged, and part of the product rather than a temporary omission: streaming or
availability information; public discovery or search for strangers; reviews,
ratings, scores, feeds, likes, comments or recommendations; kinds beyond film;
group chat, calendars, scheduling or retailer links; decorative imagery beyond
functional poster artwork.

The long-term direction, and the one line that governs whether an occurrence may
ever exist, is in `docs/decisions.md` under *What Again is for, and the map it is
not*.
