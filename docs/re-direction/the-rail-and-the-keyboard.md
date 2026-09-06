# The rail and the keyboard — a failed session, recorded

**6 September 2026.** Everything below was built, deployed and then **reverted to
`1e7e329`** at the user's direction. Production and the working tree are back to
where this session started. **Nothing here is in the software.**

⚠⚠ **READ THIS BEFORE TOUCHING THE RAIL'S BEHAVIOUR WHEN THE KEYBOARD RISES.**
The point of the file is not the fixes — they are gone — it is **which of them
were wrong, which measurements lied, and the one observation that would have
settled it on the first attempt if it had been asked for.**

---

## What was being asked for

*"I just want the rail to shrink in size smoothly without the page jumping up."*

Two things, and they were confounded for the whole session:

1. **The rail's downsize should look like a resize**, not a replacement.
2. **The page must not jump up** when the composer is tapped.

---

## ⚠⚠ THE ONE FACT THAT EXPLAINS EVERYTHING, AND IT ARRIVED LAST

Reported after four rounds of work:

> *"once every 4 or so attempts, it worked — I'd tap in the composer and the rail
> would downsize perfectly smoothly, no screen jump where the logo row goes up
> and off screen and stays off screen until the user taps outside the composer."*

**Those one-in-four taps are the ones where iOS did not pan the visual viewport
at all.** When it does not pan, the whole keyboard lands in
`--keyboard-overlap`, everything anchored to the top of the page is still on
screen, and the screen behaves exactly as wanted — **with the code as it was at
the start of the session.**

⚠⚠ **SO THE DEFECT WAS NEVER THE DOWNSIZE. IT WAS THE PAN, AND ONE ELEMENT THAT
DID NOT ANSWER TO IT.** A bug that is **intermittent on a handset and absent on
a desk is a viewport bug**, and its *frequency* is the measurement.

⚠ **The process lesson, stated plainly: the intermittency was reported in the
last message of the session and would have been available in the first if it had
been asked for.** *Does it ever behave correctly, and how often* is a cheaper
question than any probe in this file.

---

## What was built, in order, and what happened

| # | Commit | What it did | Verdict |
|---|---|---|---|
| 1 | `c18f487` | `--viewport-top` = `visualViewport.offsetTop`, written from the keyboard hook's rAF loop; added to `<main>`'s **top padding** | Rail stopped leaving the screen. **The bar was left uncorrected — this is the bug that survived to the end.** |
| 2 | `fcdb005` | `scroll-snap-type: x mandatory` + `snap-start`, to stop the rail sliding when the tiles resize | **Reverted next commit.** Reported worse on the device. |
| 3 | `5d6c492` | Snap removed; `ResizeObserver` scroll preservation; overlap moved to a **transitioned margin**; first four tiles eager | Scroll and grey panels **fixed, and confirmed good by the user**. Downsize still read as a replacement. |
| 4 | `a04851c` | Split `--keyboard-rise` (= overlap + pan) from the pan; `translate` on the browse half; sheet reserve read from the **border box** | Made the eased quantity correct, but with the bar still jumping it read as *worse*. |
| 5 | `812b1a1` | Bar `top: var(--viewport-top)` | The actual fix for *the page jumps up*. Shipped last, after the user had run out of patience. |

---

## ⚠ What was TRUE and is worth keeping — none of it is in the code now

Measured in both engines. Facts about the platform, not opinions about the
design.

- ⚠⚠ **`--keyboard-overlap` HAS THE PAN SUBTRACTED OUT OF IT, BY CONSTRUCTION.**
  It is `floorAnchor.bottom − (offsetTop + vv.height)` against an anchor fixed to
  the layout viewport's bottom. **iOS pans a large part of the keyboard's height
  to reveal the field**, so the overlap is the small remainder. Anything easing on
  the overlap eases that remainder and **jumps the rest**. The keyboard's own
  height is `layout bottom − vv.height` — the overlap with the pan added back.
- ⚠⚠ **iOS REPORTS THE KEYBOARD WHEN IT ARRIVES, NOT AS IT RISES.**
  `visualViewport` **steps**. There is nothing continuous to track, so a rail
  keyed directly to it **cuts** rather than animating. ⚠ **Ramping the overlap in
  a desk browser shows a smooth shrink and is measuring something that never
  happens.**
- ⚠ **A duration of ours is right for a stepped source and wrong for a continuous
  one.** The test is not *is there a transition* but *is the source continuous* —
  continuous, track it; stepped, ease it. The pan is instantaneous, so cancelling
  it must be instantaneous too.
- ⚠ **`next.config.ts` sets `unoptimized`, so there is no srcset and NO second
  image request when a tile changes size.** Grey panels are `next/image`'s lazy
  loading and have nothing to do with the resize. Asserted in a probe.
- ⚠ **Animating a margin that resizes 24 aspect-ratio tiles is affordable** —
  **30ms a frame in WebKit against 26ms for a pure-opacity control**, 16.7ms flat
  in Chromium.
- ⚠ **`ResizeObserver`'s default box is `content-box`, so a change that is purely
  `padding` fires no callback at all.** `writing-sheet` spends the notch's
  clearance as `padding-block`, so a `--sheet-block` measured from `contentRect`
  under-reserves by that padding on a notched handset — the last pictures sit
  under the strip. Both halves must change together: `borderBoxSize` **and**
  `observe(box, { box: 'border-box' })`.

---

## ⚠⚠ WHAT NOT TO DO

1. ⚠⚠ **Do not correct one element for the pan and leave another.** The pan moves
   **everything** anchored to the layout viewport — the bar as much as the rail.
   Correcting half of it is worse than correcting none, because the remaining
   half then looks like a fault in whatever was just changed. **Three subsequent
   rounds were judged against a screen that was still jumping.**
2. ⚠⚠ **Do not use `scroll-snap` to hold a scroller's place across a resize.** It
   works in a desk browser and fails on a phone for two reasons a desk cannot
   show: **mandatory snap takes the free flick off a browsing surface**, and
   **re-snapping is best-effort** — which target the engine resolves to depends
   on where the offset sat when the relayout began. *"Sliding the rail feels
   worse, less intuitive"*; *"after repeated taps it occurs randomly."* **Right
   most times and wrong some is worse than wrong every time, because it cannot be
   learnt.**
3. ⚠⚠ **Do not sample an animating layout in `requestAnimationFrame`.** rAF runs
   **before** the frame's `ResizeObserver` callbacks, so it pairs this frame's new
   size with last frame's uncorrected scroll offset. **It reported 137px of drift
   that is never painted**, and a redesign was nearly built on it. Sample in a
   `ResizeObserver` registered after the app's.
4. ⚠ **Do not instrument a frame-timing measurement with `getBoundingClientRect`
   on two dozen elements.** It reported **95–127ms frames** — the probe's own
   cost — and nearly bought a FLIP animation that was not needed.
5. ⚠ **Do not scale a scroll offset by its current value on every resize.** It
   compounds: **6.3px per downsize in WebKit, always the same direction**, which
   walks the rail off its place over a run of taps. Capture the fraction once and
   re-apply it.
6. ⚠ **Do not bound the size of a single animation step in a probe.** It depends
   on how many frames the machine delivered. Assert that the change is spread
   over time instead.
7. ⚠ **Do not put a `translate` on the browse half without changing the margin
   beside it.** With the margin on the overlap, a translate counts the pan twice
   and drives the rail `offsetTop` px into the composer — measured exactly. The
   two only work together.
8. ⚠⚠ **Do not ship four rounds of change against one unverified report.** Every
   round cost a full docblock pass, and the user's verdict on the session was
   that it was spent breaking things. **One question — *does it ever work, and how
   often* — was worth more than every probe written here.**

---

## The probes that were written

They were left in `node_modules/.probe/` and are **not** part of the repository.
Listed so nobody writes them a second time: `viewporttop.mjs`, `raildownsize.mjs`
(steps the keyboard the way iOS does), `railsnap.mjs`, `railhold.mjs` (samples in
a `ResizeObserver`, and says why), `railframes.mjs` (bare frame timing),
`railease.mjs` (three pan splits), `sheetreserve.mjs` (emulates a notch through
CDP), `panpin.mjs` (nothing leaves the screen at any pan).

---

## Where the three open items actually stand

**None of them is done.** The session-start position is restored.

1. **The centre-tile scale is inert on iOS 18.** `@keyframes rail-focus` +
   `animation-timeline: view(x)` behind an `@supports` guard; iOS 18 has no
   `animation-timeline`, so the guard correctly makes it do nothing. Directed:
   rebuild it without scroll-driven animation, and **comment the `view()` version
   out rather than delete it** for iOS 26 and later. The replacement likely costs
   JavaScript in a tile that is currently server-rendered — **state that cost, do
   not slip it in.** Amplitude `0.92` carries over.
2. **The rail pans off screen when the composer is tapped.** The fix is written
   and **uncommitted in the working tree**: `keyboard-hem.ts` writes
   `--viewport-top` from the same rAF loop as `--keyboard-overlap`, and the
   browse half translates down by it. ⚠ **Unverified on the device, and this
   file's whole argument is that the BAR needs the same term** — see *What not to
   do*, item 1.
3. **The rail must go under the composer's sheet where they collide.** Not built.
   A stacking question, not a sizing one — and **not** the thing `rail.tsx`
   already ruled out (filling the space *behind* the glass is arithmetically
   impossible at 2:3 on a 390px screen; passing *beneath* it is not).
