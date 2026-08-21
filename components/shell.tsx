'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { authClient } from '@/lib/auth-client'
import type { OwnerView } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'
import { ArrowLeftIcon } from './icon-arrow-left'
import { ChevronIcon } from './icon-chevron'
import { HomeIcon } from './icon-home'
import { ProfileIcon } from './icon-profile'
import { SearchIcon } from './icon-search'
import { PosterWall } from './poster-wall'
import { SearchField } from './search-field'
import { useSearch, type SearchFailure } from './search-provider'

/**
 * The signed-in shell: one navigation, at every width.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What this replaced, and why (9 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There were two navigations stacked on each other. A header offered *Add* and
 * *Me*; `/me` then offered four collection tabs underneath it. And the two
 * header items landed on the same content — `/` listed the `live` view and
 * `/me` defaulted to the `live` view, so half the top-level navigation was a
 * second door onto one room.
 *
 * That is most of what "not instinctive" meant. There is one axis of navigation
 * in this product — which collection am I looking at — and it was being
 * expressed as two, one of which was a duplicate.
 *
 * So: four collections, named once, in one place. Adding happens on Wants
 * because that is where a new want lands, which is a better answer than a tab
 * called *Add* that had to explain itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two shapes, one list
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * From `rail` (45rem — see the token in globals.css, and note it is not `md`)
 * the collections are a sticky column down the left. Below it they are a single
 * dotted line under the wordmark, and identity moves behind the profile icon
 * because a phone header has no room to spend on telling you your own handle.
 *
 * §11 still holds throughout: the accent marks overlap state and nothing else,
 * so the active collection is distinguished by text colour alone.
 */

const COLLECTION_LINKS = [
  { href: '/wants', label: COLLECTIONS.wants, view: 'live' },
  { href: '/go-back-tos', label: COLLECTIONS.goBackTos, view: 'go_back_tos' },
  { href: '/fixtures', label: COLLECTIONS.fixtures, view: 'fixtures' },
  { href: '/archive', label: COLLECTIONS.archive, view: 'archive' },
] as const satisfies ReadonlyArray<{ href: Route; label: string; view: OwnerView }>

/**
 * How far the page must move before the collection bar reacts, and how close to
 * the top it is always shown regardless.
 *
 * The threshold exists because momentum scrolling on iOS emits a stream of
 * one- and two-pixel events, and a bar that answered every one of them would
 * flicker rather than recede. It accumulates: a slow drag still crosses 8px
 * eventually, because `last` is only reset when the bar actually acts.
 */
const SCROLL_THRESHOLD = 8
const ALWAYS_SHOWN_ABOVE = 32

/**
 * How far a finger may travel and still be a tap.
 *
 * One number for every gesture this shell arbitrates, because they all ask the
 * same question of the same finger: the dock's pre-lift asks it to know whether
 * a keyboard was really wanted, and the page asks it to tell a tap-to-dismiss
 * from a scroll. Two values would let two handlers reach opposite verdicts about
 * one movement, which is a class of bug rather than a number to get right.
 */
const TAP_SLOP = 12

/**
 * How long the app must have been away before coming back to it is worth
 * re-fetching.
 *
 * Every signed-in screen is server-rendered out of `lib/db/` — the collection
 * counts in this component's own props, the return counts, every convergence —
 * so the page you come back to is exactly as old as the moment you left it. On
 * the phone that is the common case rather than the rare one: the app is
 * installed, and an installed app is left by switching to another one, not by
 * closing anything.
 *
 * **The measure is how long you were gone, not how recently we last asked.** A
 * banner glanced at and a call declined in one tap are not returns, and they are
 * precisely the sub-threshold case — so the number that decides what counts as
 * stale is the same number that stops app-switching becoming a request per
 * switch. A rate limit on top of it would be a second answer to a question
 * already answered.
 */
const STALE_AFTER_MS = 10_000

/**
 * How long after the keyboard opens or closes to stop believing the scroll
 * position.
 *
 * A keyboard opening is not a scroll, but it produces one: the viewport
 * changes size and the browser scrolls the focused field into view. Both land
 * as `scroll` events with a positive delta, indistinguishable from a downward
 * flick — so tapping the field opened the keyboard and hid the bar in the same
 * gesture.
 *
 * ⚠ **Timed from focus, never from a viewport resize.** The first version of
 * this listened for `visualViewport` resize, on the reasoning that a keyboard
 * is a viewport change. So is Safari's own toolbar collapsing, which happens
 * *continuously while you scroll* — so every scroll re-armed this window and
 * snapped the bar back, which cancelled the receding it was meant to protect.
 * Focus changes exactly when a keyboard opens or closes and at no other time.
 *
 * Long enough to cover the keyboard's animation and the scroll that follows it.
 * The cost is that a flick within half a second of tapping the field will not
 * recede the bar.
 */
const KEYBOARD_SETTLE_MS = 500

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  There was a `USER_SCROLL_GRACE_MS` here. It is gone — 11 August.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The bar only reacted while a `touchmove` or `wheel` was recent, so that "a
 * scroll with no finger behind it moves the baseline and nothing else"
 * (`8124684`). Its purpose was to tell the keyboard's scroll apart from a flick
 * without having to infer it from a delta and a clock.
 *
 * **The premise was false, and the probe is what showed it.** Through an entire
 * focus-type-scroll run on the handset, `sTop` never left 0 — the shell's own
 * scroller does not move when the keyboard opens. What moves is the *document*,
 * by 271px, and this handler reads `scroller.scrollTop`. The keyboard's scroll
 * therefore raises no event it could ever have seen. The window was guarding a
 * door onto a wall.
 *
 * What it cost is the gesture: touch events are not reliably delivered while
 * momentum is running — the first touch is spent arresting the scroll — so
 * catching a gliding page and dragging the other way was measured against a
 * window that had already shut. Reported twice from the handset, and predicted
 * in `8124684`'s own message, which shipped marked *"untested on a handset,
 * like the two attempts before it"*.
 *
 * The settle window below stays, and is now the only line rather than the
 * second. It is keyed to focus and to viewport resizes — the events that
 * actually mark a keyboard — rather than to a proxy the platform withholds
 * exactly when it is needed.
 */

/**
 * How long to hold the document down by hand after anything that moves it.
 *
 * **The clamp works and used to be visible doing it.** iOS does not stream the
 * scroll it performs to reveal a focused field; it delivers one large event when
 * the movement has finished — which the settle window above already relies on.
 * A correction driven by that event is therefore a correction applied *after*
 * the whole animation has been painted, so tapping the field pushed the page up
 * and dropped it back, and the drop was this working rather than failing.
 *
 * So for the length of the keyboard's arrival the document is put back on every
 * frame instead, which corrects it within the frame it moves and shows nothing.
 *
 * Longer than `KEYBOARD_SETTLE_MS` on purpose: that window is about when to stop
 * *believing* the scroll position, and this one has to outlast the animation
 * that produces it, including the second, smaller move iOS makes when the
 * predictive-text strip appears.
 */
const KEYBOARD_ARRIVAL_MS = 700

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  There was a remembered keyboard height here — 15 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `lastKeyboardOverlap`, mirrored to `localStorage` under `again:keyboard-overlap`
 * and read back by `rememberedOverlap()`. It existed to answer an impossible
 * question: **how tall is a keyboard that has not appeared yet.**
 *
 * The question was forced by where the field was. The bump on tapping it was
 * UIKit lifting the whole web view to reveal a field the keyboard was about to
 * cover — measured on the handset, installed, with every quantity the page can
 * see holding still (`scrY 0`, `docT 0`, `vv.t 0`, `sTop 0`) while the wordmark,
 * the icons and the wall all moved together. Nothing on this side could observe
 * or undo it, so the only move left was to leave iOS nothing to reveal: get the
 * bar clear of the keyboard *at the instant of focus*, which is before the
 * keyboard can be measured. The one number available that early was last time's.
 *
 * ⚠ **It only ever grew, and that is what the user saw on 14 August.** The two
 * directions of error cost differently — remembering too little reproduced the
 * bump, remembering too much parked the bar a touch high — so it kept the
 * maximum ever measured. The gap under a bar parked high is the overshoot, and
 * `groundFor` had been painting black over it since 11 August. Delete the
 * decoration and the overshoot is simply visible. **Reported as "a slither of a
 * gap between the top of the keyboard and the bottom of the search bar",
 * installed only** — a Safari tab hides it in the toolbar band, and the keyboard
 * there is 271 against 333 standalone.
 *
 * **The question is gone rather than answered better.** The field no longer goes
 * anywhere near the keyboard: on a tap it docks at the masthead — see
 * `searchAtTop` — so nothing needs to know a keyboard's height before it arrives,
 * and no gap can open under anything. A number that cannot be known in time is
 * not a number to estimate; it is a sign that something is in the wrong place.
 *
 * ⚠ `--keyboard-overlap` is a different quantity and is **still measured**, by
 * `floor()`. That one is taken while the keyboard is up, needs no prediction,
 * and is what keeps the last row of a long list reachable.
 */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  There was a `groundFor` here, and this is the second time it has gone
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It returned a `box-shadow` painting black from the lifted dock's top edge down
 * by the height of the lift, so that the keys rose over ground rather than over
 * artwork instead of showing a strip of poster under the bar for the three
 * hundred milliseconds a keyboard takes to arrive.
 *
 * **Removed 14 August, and the strip is accepted.** Two handset reports came in
 * on 13 August and this was both of them:
 *
 * 1. *A black sheet over the posters when the keyboard opens.* The depth came
 *    from `rememberedOverlap()` — which only ever grows, and persists across
 *    launches — and the dock had already jumped that same distance up the
 *    screen, so the band began wherever the remembered number put it. At an
 *    honest 333 on an 797px handset that is the bottom half of the display going
 *    black on every tap of the field, before any keyboard exists to cover it.
 * 2. *Flicker while scrolling with the keyboard up.* `measure()` rewrote this
 *    every frame from a live `lift` that changes sign, and `groundFor` returned
 *    `''` the instant `lift` went non-negative — so a keyboard-tall band of
 *    black switched off and on once a frame for the length of a scroll.
 *
 * ⚠ **Do not build a third one.** The screen-tall panel was removed on 10 August
 * for making a small fault into a large one, and its removal note asked for
 * precisely what replaced it: the same panel, bounded to a plausible keyboard
 * height, so that the worst case stays small. `6fadfa8` built that on 11 August
 * and it failed the same way — because bounding the ground to `lift` only bounds
 * it as far as `lift` can be trusted, and `lift` is a live measurement taken off
 * a `position: fixed` anchor, which is the one thing iOS withdraws while a
 * keyboard is open. The bound was never the fix.
 *
 * **A strip of poster under the bar for a third of a second is a blemish. A
 * mechanism that can black out half the screen is not a proportionate insurance
 * against it**, and that is now twice. If the gap is ever worth answering again,
 * answer it by not putting the field where the keyboard goes — see the note on
 * `useKeyboardPin`. Nothing needs dressing if nothing has to move.
 */

/**
 * Swallow the synthesized mouse burst that follows a handled tap.
 *
 * Installed at `pointerup`, at the document, capture phase — ahead of React's
 * root, so the poster's own handlers never see the events either.
 * `preventDefault` stops the native activation and `stopPropagation` stops the
 * delivery; between them nothing behind the moved bar can be pressed by a tap
 * that was aimed at the bar.
 *
 * 300ms outlives the burst, which follows `pointerup` within a frame or two,
 * and is shorter than any deliberate second tap. Removed early is fine; firing
 * on a real tap is the failure to keep rare, which is why this is not a second
 * longer.
 */
function suppressTapAftermath() {
  const swallow = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }
  const types = ['mousedown', 'mouseup', 'click'] as const
  for (const type of types) document.addEventListener(type, swallow, true)
  window.setTimeout(() => {
    for (const type of types) document.removeEventListener(type, swallow, true)
  }, 300)
}

/**
 * The id of the field that the masthead holds while a search is being typed.
 *
 * Named rather than reached for through a ref, because the element it points at
 * does not exist when the tap that needs it begins — see `onBarPointerDown`. The
 * three `SearchField`s each carry their own id for the reason that component's
 * note gives: they are all in the document at once and a shared id would give two
 * `<label for>` one target.
 */
const TOP_FIELD_ID = 'search-top'

/**
 * The smallest viewport change worth treating as a keyboard.
 *
 * The settle window cannot be armed by *any* resize — Safari's toolbar
 * collapses and expands continuously while you scroll, and re-arming on that
 * cancels the receding entirely, which is a fault this has already had once
 * today. But it cannot be armed by focus alone either: focus fires when the
 * field is tapped and the keyboard finishes arriving a few hundred milliseconds
 * later, so the window had closed before the browser's own scroll landed.
 *
 * The two are far apart in size. A toolbar is tens of pixels; the keyboard
 * measured 271 against a 660 viewport on the handset. 100 sits between them
 * with room either side.
 */
const KEYBOARD_MIN_HEIGHT = 100

/**
 * The three halves of "has this hydrated yet" — see `portalReady` in `Shell`.
 *
 * At module scope rather than inline because `useSyncExternalStore` resubscribes
 * whenever `subscribe` changes identity, and an arrow written in the component
 * body is a new function on every render.
 *
 * Nothing ever changes, so `subscribeToNothing` returns an unsubscribe that has
 * nothing to undo. The store is not a store; it is a way of saying "the server
 * and hydration get this answer, and every render after gets that one".
 */
const subscribeToNothing = () => () => {}
const onClient = () => true
const onServer = () => false

/**
 * What a search that did not work says.
 *
 * **None of these is "Nothing by that name."**, which is what all three used to
 * say — see `SearchFailure`. Each states what happened and what to do about it,
 * in that order, because the second is the only part anyone reads. No apology
 * and no error code: a person looking for a film is not debugging the app.
 */
const SEARCH_FAILURE_TEXT: Record<SearchFailure, string> = {
  'rate-limited': 'That is a lot of searching at once. Give it a moment.',
  'signed-out': 'You have been signed out.',
  unavailable: 'Search is unreachable just now.',
}

/**
 * The same sentence, with the wait in it when the limiter named one.
 *
 * The route sends `Retry-After` and this is the only place it can be read by the
 * person it concerns. "Give it a moment" is what you say when you do not know;
 * saying it over a number we were handed is the difference between waiting and
 * pressing the button again to find out.
 */
function failureText(failure: SearchFailure, retryAfter: number | null) {
  if (failure === 'rate-limited' && retryAfter) {
    return `That is a lot of searching at once. Try again in ${retryAfter} second${
      retryAfter === 1 ? '' : 's'
    }.`
  }
  return SEARCH_FAILURE_TEXT[failure]
}

/**
 * The masthead's spacing and the wordmark's trims used to be four constants
 * here, applied as inline styles. **They now live in `app/globals.css`** as
 * `--masthead-gap` and the `wordmark-trim` utility, and that is a
 * Content-Security-Policy constraint rather than a preference: a style
 * *attribute* cannot carry a nonce, so every one of them was silently dropped in
 * production. The measurements and the case table moved with them — see the
 * comment on `wordmark-trim`.
 */

export function Shell({
  handle,
  counts,
  children,
}: {
  handle: string
  counts: Record<OwnerView, number>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  /*
    `/profile` is the one signed-in screen with no collection bar. It is not a
    collection, so the bar would be pointing at four places you are not — and it
    is the only screen composed around its own bottom-left corner, which a fixed
    bar sits directly on top of. The wordmark is still a link home, so nothing
    is stranded.
  */
  const showCollections = pathname !== '/profile'

  /*
    **Both bars recede as you scroll down and come back the moment you scroll
    up**, which is the behaviour the browser's own address bar has — the three of
    them now move together rather than one sitting still while the others slide.

    ⚠ **The masthead was excluded from this until 15 August, and the note here
    argued for excluding it**: it is the only thing on screen that says where you
    are, and a mark that comes and goes reads as a rendering fault rather than as
    a gesture. Directed otherwise. What that reasoning was protecting is carried
    by two rules instead — the masthead never recedes while the caret is in the
    field (`mastheadHidden`), and leaving search reveals both bars
    (`onDockBlur`) — so the mark is gone only while a wall is being scrolled
    past, and never at a moment when something is being asked of it.

    ⚠ **It costs more here than it does at the foot, which is worth knowing
    before anything about it is tuned.** Since search became a glyph in the
    masthead, the wordmark is the only route to `/` on a phone and that glyph is
    the only route to the field — so both leave with it. `ALWAYS_SHOWN_ABOVE` and
    the return on the first upward movement are what keep that affordable, and
    they are the numbers to reach for if it ever feels like a trap rather than a
    gesture.

    **One signal drives both surfaces.** A second listener measuring the same
    scroll would be a second threshold to keep in step, and the two would
    disagree on the frame a flick reverses.

    Read through `requestAnimationFrame` rather than on the event: `scrollY`
    forces layout, and doing that on every scroll event of a momentum flick is
    how a list starts dropping frames while it is being read.

    **Stamped with the route it receded on, so navigation always shows it again.**
    It was a plain boolean, revealed by the scroll event that the reset below
    fires — which is true nearly always and not quite always: the handler ignores
    scrolls inside the settle window, and blurring the field on the way to a link
    opens one. A bar stuck off-screen on arrival is a screen with no navigation
    on it, which is too expensive to hold with an argument about event ordering
    when the alternative is to make it unrepresentable. Same device as `failed`
    in the search provider: write down what the state is about instead of
    remembering to clear it.
  */
  const [receded, setReceded] = useState({ route: pathname, hidden: false })
  const collectionsHidden = receded.route === pathname && receded.hidden

  /*
    Focus arrives before React's effect can re-arm the keyboard settle window.
    Keep that first window synchronous, so the browser's own scroll-to-reveal
    cannot be mistaken for a deliberate downward scroll.
  */
  const keyboardOpeningRef = useRef(false)
  const keyboardFocusAtRef = useRef(0)

  /*
    Whether the masthead is currently holding the search field rather than the
    wordmark — see the note on `onBarPointerDown`.

    **Below the `rail` breakpoint only**, because it is the phone's bar that
    rests where a keyboard lands. Above it the field is at the foot of the
    content column, there is no masthead to move it into, and the dock keeps the
    thermostat pin in `useKeyboardPin` that it has always had.

    Set from a touch `pointerdown` and cleared when the field gives up focus, so
    the row is up before iOS decides whether anything needs revealing and gone
    the moment the keyboard is.
  */
  const [searchAtTop, setSearchAtTop] = useState(false)

  /* `mastheadHidden` is below, with the search state it reads. */

  /*
    ───────────────────────────────────────────────────────────────────────────
     The field docks at the masthead to be typed in — 15 August
    ───────────────────────────────────────────────────────────────────────────

    **The bar rests at the foot of the screen and the field is typed in at the
    top of it.** Tapping the resting bar puts a search row in the masthead and
    focuses that, so the keyboard rises over the wall with nothing underneath it
    to dodge.

    This replaces a pre-lift: the bar used to jump upward by a remembered
    keyboard height at `pointerdown`, land in mid-air, and wait about three
    hundred milliseconds for the keys to arrive under it. Both of the things
    reported on 14 August came from that — the jump itself, and a sliver of gap
    wherever the remembered height overshot the real one. Neither is
    representable now: the field's position no longer depends on a keyboard's
    height, so there is no number to be wrong and no gap for it to be wrong by.

    ⚠ **What carries over, and it is the load-bearing part: the field has to be
    out of the keyboard's way *before* iOS decides whether to reveal it.**
    Measured on `51d9b16`: the bar was in position through the whole arrival —
    peak `ERR` read 0 — and iOS still scrolled the document by the full keyboard
    height (`clmp 1 max 333`). The verdict is reached in native focus machinery
    before any DOM handler runs, so anything arranged at focus is a verdict late.

    `pointerdown` is before all of it. The masthead row is put up there, and by
    the time anything computes what needs revealing, the field being focused is
    at the top of the screen where no keyboard will ever reach.

    ⚠ **The focus itself happens at `pointerup`, and that split is load-bearing.**
    The first version called `focus()` in the same handler that moved things —
    and on the handset the bump was gone *and no keyboard ever arrived*. iOS
    does not grant a keyboard for a focus arranged while the finger is still
    down; it grants one for a focus made by a completed tap. So the move takes
    the earliest moment and the focus takes the latest, which is also the order
    the two need anyway: React has long flushed the masthead row by the time the
    tap ends, so the field is really there to be focused and the verdict reads it
    where it really is.

    The pair stays matched across the change because touch pointers have
    **implicit pointer capture**: every pointer event after `pointerdown` is
    delivered to the element that received it, whatever has happened to the
    layout in between. A `click` could not be trusted for that; this can.

    ⚠ **The tap lands on the resting bar and the focus goes somewhere else** —
    `TOP_FIELD_ID`, not the input under the finger. Focusing the one that was
    touched is what used to put a field at the foot of the screen and start the
    whole avoidance problem. The fallback is the touched input, and it exists
    only for the case where React has somehow not flushed: a rare bump beats a
    tap that does nothing.

    `preventScroll` covers the separate scroll `focus()` itself can request; the
    keyboard reveal is not that scroll, which is why the option alone never
    fixed anything.

    A gesture can end somewhere other than a tap — a drag, or a cancel — and
    that would leave a search row in the masthead with no keyboard coming.
    `pointerup` treats real movement as "not a tap" and puts the masthead back,
    and `pointercancel` puts it back unconditionally.

    ⚠ **The tap's aftermath is silenced twice, and both are needed.** For
    touch, the mouse events are dispatched *after* `pointerup`, hit-tested at
    the touch point. They land on whatever sits behind: first observed as the
    keyboard being granted and taken back a beat later, then — with `pointerdown`
    cancelled — as the intent sheet opening for the poster that happened to be
    under the finger.

    Cancelling `pointerdown` suppresses the *compatibility* events, mousedown
    and mouseup, and the blur their defaults carry. But `click` is deliberately
    not one of them — the spec keeps it device-independent, firing regardless —
    so it reached the poster on its own and opened the sheet, whose arrival
    blurred the field and folded the keyboard anyway. `suppressTapAftermath`
    swallows the whole burst at the document, capture-phase, for just longer
    than it takes to arrive.

    ⚠ **The handlers sit on the `header`, not on the button that starts this.**
    The button is inside the half of the masthead that `searchAtTop` replaces, so
    it is unmounted between `pointerdown` and `pointerup` — and a capture target
    removed from the document releases its implicit capture, after which the
    `pointerup` hit-tests wherever the finger now is, which is the field that has
    taken the button's place. The header survives both, so it hears the whole
    gesture whichever way the browser resolves it. **Anything that swaps itself
    out mid-gesture has to be listened to from something that does not.**

    **Touch only.** A mouse needs none of this — no keyboard, no reveal, no
    bump — and cancelling its pointerdown would break click-to-place-caret in a
    field that still holds text. A mouse takes the plain `onClick` on the button
    instead, and `pendingFocusRef` below is what gets the caret into a field that
    does not exist yet at the moment of the click. It is also why a desk never
    sees the masthead row: nothing there ever calls for one.
  */
  const pendingTapRef = useRef<{ y: number } | null>(null)

  /**
   * A focus owed to a field that has not rendered yet — the mouse path only.
   *
   * Touch cannot use this. iOS grants a keyboard for a focus made *inside* a
   * completed tap and refuses one arranged from an effect a frame later, which
   * is measured and is the whole reason `pointerup` calls `focus()` by hand. A
   * click has no keyboard to be refused, so it can afford to wait a render.
   */
  const pendingFocusRef = useRef(false)

  /** Where the caret goes when the masthead takes the field. */
  function focusTopField() {
    const field = document.getElementById(TOP_FIELD_ID)
    if (field instanceof HTMLInputElement) field.focus({ preventScroll: true })
    return field instanceof HTMLInputElement
  }

  useEffect(() => {
    if (!searchAtTop || !pendingFocusRef.current) return
    pendingFocusRef.current = false
    focusTopField()
  }, [searchAtTop])

  /** Whether a gesture landed on the control that opens search. */
  function onSearchTrigger(target: EventTarget | null) {
    return target instanceof Element && !!target.closest('[data-opens-search]')
  }

  function onMastheadPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') return
    if (searchAtTop) return
    if (!onSearchTrigger(event.target)) return

    /* See the note above — this is what stops the synthesized mouse events
       landing on the row that replaces the button and blurring the focus
       arranged there. */
    event.preventDefault()

    setSearchAtTop(true)
    pendingTapRef.current = { y: event.clientY }
  }

  function onMastheadPointerUp(event: React.PointerEvent<HTMLElement>) {
    const pending = pendingTapRef.current
    pendingTapRef.current = null
    if (!pending) return

    /* A finger that travelled was scrolling, not tapping. */
    if (Math.abs(event.clientY - pending.y) > TAP_SLOP) {
      setSearchAtTop(false)
      return
    }

    suppressTapAftermath()
    focusTopField()

    /* If the keyboard is refused anyway, do not leave a search row in the
       masthead with nothing typing into it. */
    window.setTimeout(() => {
      if (document.activeElement?.id !== TOP_FIELD_ID) setSearchAtTop(false)
    }, 400)
  }

  function onMastheadPointerCancel() {
    if (pendingTapRef.current) setSearchAtTop(false)
    pendingTapRef.current = null
  }

  /** The mouse and keyboard route in, where no gesture timing is at stake. */
  function openSearch() {
    if (searchAtTop) return
    pendingFocusRef.current = true
    setSearchAtTop(true)
  }

  /*
    Out of search and back to the screen underneath — the arrow at the left of
    the field.

    **It does not navigate.** Search replaces the content of whatever route you
    are on rather than taking you to one of its own, so the way back is to stop
    searching; sending you to `/` instead would lose your place in a collection
    to a search you abandoned, which is the thing the note on the wall says this
    design exists to avoid. The wordmark is the way home and is back on screen
    the moment this runs.

    Same three steps as Escape, which has always done this from the keyboard.
  */
  function exitSearch() {
    clear()
    const field = document.getElementById(TOP_FIELD_ID)
    if (field instanceof HTMLInputElement) field.blur()
    setSearchAtTop(false)
  }

  /*
    ───────────────────────────────────────────────────────────────────────────
     A tap on the page puts the keyboard away, and does nothing else (11 August)
    ───────────────────────────────────────────────────────────────────────────

    The keyboard covers half the screen and the only ways out of it were Escape,
    which a phone does not have, and emptying the field. So the first tap
    anywhere in the page was landing on whatever it hit — and what it usually hit
    was a poster, because a wall of results is what is on the screen while
    searching. Asked for on the handset: **collapse it, and do not open the
    intent sheet on the way.**

    Both halves matter. Dismissing without swallowing the tap would mean the
    keyboard folds *and* the sheet opens, which is the complaint. Swallowing
    without dismissing would be a dropped tap.

    ⚠ **A React handler on `#scroll-root` hears the docks too, and that cost the
    × its tap.** The scoping argument was "both docks are portalled to
    `document.body`, so they are not in this subtree" — true of the DOM and
    false of React, which propagates a synthetic event through the *component*
    tree. The docks are `createPortal`ed from inside this element's JSX, so
    every tap on the field, the chevron and the clear button arrived here as
    well.

    What that looked like: pressing × blurred the field and swallowed the very
    click that was supposed to clear it, so the control did nothing at all —
    which is one of the three things reported on 11 August, reproduced in a
    browser and caused by the fix for another of them.

    So containment is asked of the DOM, where the portals really are. It is one
    line and it is the whole difference between "the page" and "the app".

    The header and the wordmark *are* in here, and they cost a second tap while
    the keyboard is up. That is the trade: one rule, stated once — the first tap
    puts the keyboard away — rather than a list of exceptions that has to be
    maintained against every control added later.

    **The tap has to be a tap**, and since 14 August a drag is the other half of
    the same rule rather than the exception to it — see `onContentPointerMove`.
    Both dismiss; only the tap is swallowed, because only the tap would otherwise
    land on a poster. `TAP_SLOP` is the line between them, and it is the dock's
    line too.

    **Touch only.** A mouse click outside a field already blurs it, for free and
    with no keyboard involved; swallowing desktop clicks to reproduce that would
    break every control on the page.
  */
  const dismissTapRef = useRef<{ y: number } | null>(null)

  /**
   * Whether a tap landed in the page itself, rather than on a surface that is
   * holding the field.
   *
   * ⚠ **The masthead becomes such a surface, and forgetting that killed the ×
   * for the second time.** The docks are portalled to `document.body`, so DOM
   * containment answers for them by itself — that was the fix on 11 August. The
   * masthead is *not* portalled: it is inside `#scroll-root`, so once it holds
   * the field, every tap on the field and on its × was arriving here as a tap on
   * the page, dismissing the keyboard and swallowing the very click that was
   * meant to clear the query. Reproduced in a browser within minutes of the
   * change, which is the only reason it is not a third handset report.
   *
   * The exemption is conditional rather than permanent, and that is the whole of
   * the argument for it: **the surface holding the field is never "the page"**.
   * While the masthead holds the wordmark it is page like anything else, and a
   * tap on it dismisses — the deliberate second tap the note above describes.
   */
  function inThePage(event: React.PointerEvent<HTMLElement>) {
    if (!(event.target instanceof Node)) return false
    if (!event.currentTarget.contains(event.target)) return false
    if (searchAtTop && event.target instanceof Element && event.target.closest('header')) return false
    return true
  }

  function onContentPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') return
    if (!inThePage(event)) return
    /* Asked of the DOM rather than of `searchFocused`, because the question is
       "is a keyboard up", and the answer is whichever field holds the caret. */
    const caret = document.activeElement instanceof HTMLInputElement
    /*
      ⚠ **Also armed for a bar standing over an empty field with no caret in
      it.** That state is three taps away — type, tap the page to put the
      keyboard down, press the × — and until 15 August nothing here could reach
      it, because arming required a focused input and there was none. The bar
      would sit there empty with the arrow as its only exit. A gesture aimed at
      the page puts away whatever search furniture has nothing in it, caret or no
      caret; see `onDockBlur` for the rule this is the other half of.
    */
    if (!caret && !(searchAtTop && query === '')) return
    dismissTapRef.current = { y: event.clientY }
  }

  /**
   * Put away whatever the gesture was aimed past — the keyboard if one is up,
   * and the search bar if there is nothing in it.
   *
   * Shared by the tap and the drag so the two cannot drift: they are one rule
   * about gestures meant for the page, and it took a fix to each of them
   * separately on 14 August before that was written down.
   */
  function dismissForPageGesture(swallowTap: boolean) {
    const field = document.activeElement
    const hasCaret = field instanceof HTMLInputElement
    const closesBar = searchAtTop && query === ''

    /*
      ⚠ **Nothing to put away means nothing to swallow.** A bar standing over a
      query with no caret in it is not furniture in the way — it is the label on
      the results you are looking at — so a tap past it is an ordinary tap and
      the poster under it should open. Swallowing unconditionally here ate that
      tap, which is a dropped tap: the exact failure the two notes above are
      about, arrived at from the other direction. The suppression is only ever
      earned by something actually being dismissed.
    */
    if (!hasCaret && !closesBar) return

    /* The same swallow the dock uses, for the same burst: `click` is not a
       compatibility event and arrives whatever is done to the pointer. Not on a
       drag — the scroll it started is the thing that was asked for. */
    if (swallowTap) suppressTapAftermath()
    if (hasCaret) field.blur()
    if (closesBar) setSearchAtTop(false)
  }

  /*
    ───────────────────────────────────────────────────────────────────────────
     Scrolling the page puts the keyboard away as well (14 August)
    ───────────────────────────────────────────────────────────────────────────

    The same rule as the tap above, extended to the other gesture a person aims
    at the page rather than at a control: **a gesture meant for the page
    dismisses the keyboard.** The tap is swallowed on its way out because it
    would otherwise land on a poster; the drag is not, because the scroll it
    starts is the thing that was asked for.

    ⚠ **This is what stops the bar travelling and the screen flickering while a
    wall of results is scrolled**, reported from the handset on 13 August.
    `useKeyboardPin` holds the dock on the keyboard's edge by measuring a
    `position: fixed` anchor every frame, and iOS stops honouring `fixed` while a
    keyboard is open *and the document scrolls* — which is the premise this whole
    shell was once built around, and which the 13 August change reopened by
    giving the document its scroll range back. The drift is not a theory: the
    note on `lift` records it measured on the handset, and the clamp there was
    removed precisely so the pin could chase it.

    **So the two halves of the condition are kept apart instead of the chase
    being made better.** The keyboard goes as the scroll begins, so the pin is
    never running while the page moves, so there is nothing to measure wrong.
    That holds on every engine, because it is a rule about gestures rather than
    a correction for one browser's idea of `fixed`.

    ⚠ **Driven by the gesture, never by the `scroll` event.** A scroll listener
    would be shorter and would blur the field on scrolls nobody made with a
    finger: `search-provider.tsx` puts the window back to the top on every new
    query, so typing a second word would fold the keyboard mid-search. A pointer
    is the only thing that says a person did it.

    One movement past the threshold is all this needs, and that one is delivered.
    The events iOS withholds are the ones during *momentum*, after the finger has
    gone — the `USER_SCROLL_GRACE_MS` lesson, which does not reach a handler that
    has already decided by then.

    **Touch only**, like the rest of the trio. A wheel or a trackpad has no
    keyboard behind it, and dropping focus because the page moved would be
    hostile on a desk.
  */
  function onContentPointerMove(event: React.PointerEvent<HTMLElement>) {
    const pending = dismissTapRef.current
    if (!pending) return
    if (Math.abs(event.clientY - pending.y) <= TAP_SLOP) return

    /* Cleared before the dismissal, so the `pointerup` ending this drag finds
       nothing pending and cannot swallow a tap that was never made. */
    dismissTapRef.current = null
    dismissForPageGesture(false)
  }

  function onContentPointerUp(event: React.PointerEvent<HTMLElement>) {
    const pending = dismissTapRef.current
    dismissTapRef.current = null
    if (!pending) return
    if (!inThePage(event)) return
    if (Math.abs(event.clientY - pending.y) > TAP_SLOP) return

    dismissForPageGesture(true)
  }

  function onContentPointerCancel() {
    dismissTapRef.current = null
  }

  /*
    A keyboard is being asked for. Both surfaces that can hold a field wear this
    — the masthead below `rail`, the dock above it — because what it records is
    "a keyboard is on its way", which is true wherever the field happens to be.

    ⚠ **There was a pre-lift written here, and it is gone.** It raised the dock by
    a remembered keyboard height so iOS would find nothing to reveal. The field is
    not down there any more; see `onBarPointerDown` and the note where
    `lastKeyboardOverlap` used to be.

    The settle window it feeds is still needed, and for its original reason: the
    keyboard's arrival lands as one large scroll event, indistinguishable from a
    hard flick, and the collection bar must not recede for it.
  */
  function onDockFocus(event: React.FocusEvent<HTMLElement>) {
    if (!(event.target instanceof HTMLInputElement)) return
    keyboardOpeningRef.current = true
    keyboardFocusAtRef.current = performance.now()
    setReceded({ route: pathname, hidden: false })
  }

  /*
    The masthead gives the wordmark back when the field gives up focus — a tap on
    the page, a drag, Escape, the keyboard's own dismiss key, a navigation. **One
    exit for every way out**, rather than a list of the ways in that has to be
    kept complete.

    ⚠ **Except while there is something in the field, and that exception is the
    point.** Losing focus and losing the search are different events, and this
    treated them as one: type "alien", tap the page to put the keyboard away, and
    the bar vanished while a wall of results for "alien" stayed on screen. A
    screen full of matches with nothing on it saying what was matched — and no
    way to amend the query except opening search again to find the word still
    there. Reported 15 August.

    So focus decides the *keyboard* and the query decides the *bar*. The two ways
    out both go through an empty field: the arrow clears before it blurs, and the
    × clears while holding focus so the next blur closes it. Nothing else has to
    know.

    The blink follows focus rather than the row, so a bar left standing over a
    query sits quiet — which is now a distinction worth drawing, and was not when
    the row only ever existed while focused.
  */
  function onDockBlur(event: React.FocusEvent<HTMLElement>) {
    if (!(event.target instanceof HTMLInputElement)) return
    keyboardOpeningRef.current = false
    if (query !== '') return

    setSearchAtTop(false)

    /*
      **Leaving search is an arrival, so both bars come back.** Same argument as
      stamping `receded` with the route it was hidden on: a bar off-screen on
      arrival is a screen with no navigation on it, and that is too expensive to
      hold with an argument about which gesture counts as upward.

      It is load-bearing for the masthead rather than merely tidy. Scroll a wall
      of results, then close search: `searchAtTop` goes false and the mark comes
      back into a header that `collectionsHidden` would slide away on the same
      frame — the way out of search taking the way home with it.
    */
    setReceded({ route: pathname, hidden: false })
  }

  /*
    ───────────────────────────────────────────────────────────────────────────
     There was a `barMode` here, and a chevron that toggled it — 15 August
    ───────────────────────────────────────────────────────────────────────────

    The bar at the foot held either a search field or the four collections, and
    the chevron swapped them. **The bar no longer holds a field at all**, so
    there is one thing left in it and nothing to toggle: search moved to a glyph
    in the masthead, where it is one tap rather than two and where it does not
    have to share a 375px line with four labels.

    That also retires the argument this state existed to settle — that the
    collection line and a field could not both fit — along with a whole mode the
    rest of the shell had to ask about.
  */

  /*
    Whether hydration has finished, which is when a portal may be opened.

    **Not `typeof document !== 'undefined'`**, which is the obvious spelling and
    the broken one. That is false on the server and true on the client's *first*
    render — and the first client render is hydration, which has to produce
    exactly what the server sent. Measured with a temporary route and a real
    browser: it throws `Hydration failed because the server rendered HTML didn't
    match the client`, and React answers by throwing the whole tree away and
    building it again on the client. The shell would be rebuilt on every load.

    `useSyncExternalStore` is the version that holds, because it is the one API
    that gets to answer the server and the client differently on purpose:
    `onServer` is used for the server render *and* for hydration, `onClient`
    takes over on the render after. Verified the same way — no mismatch, and the
    portalled nodes still land in `document.body`.
  */
  const portalReady = useSyncExternalStore(subscribeToNothing, onClient, onServer)

  const {
    query,
    active: searchActive,
    focused: searchFocused,
    results,
    searching,
    failure,
    retryAfter,
    loadMore,
    retry,
    clear,
  } = useSearch()

  /*
    The masthead recedes on the same signal as the bar at the foot — **except
    while the caret is in the field.** A masthead that slid away mid-type would
    take the query and the caret with it, and the scroll that moved it would not
    be a scroll anybody made: it would be Safari revealing the focused field, or
    `search-provider.tsx` putting the window back to the top for a new query.

    That exception is the whole difference between the two surfaces, which is why
    it is spelled here rather than folded into `receded`: the signal is about the
    page moving, and this is about what the masthead is currently doing.

    ─────────────────────────────────────────────────────────────────────────────
     `searchFocused`, not `searchAtTop` — 17 August
    ─────────────────────────────────────────────────────────────────────────────

    Directed: search something, start scrolling, and the bar holding the query
    should recede upward the way the collections recede down. It could not,
    because the exception was written against `searchAtTop` — the row being *in*
    the masthead — and that row deliberately outlives the keyboard. `onDockBlur`
    keeps it up over a non-empty query, so the whole time a wall of results was
    being read the masthead was pinned, which is exactly the time the screen is
    wanted back.

    **Focus is the honest spelling of what the exception was always protecting.**
    Its own note said "the query, the caret and the only way out" — a caret is
    focus, and a query on screen with no caret in it is a label, not an input.
    The way out is one upward flick, which is the same way out the wordmark has
    had since the masthead started receding at all.

    ⚠ **On touch, focused-and-scrolling is very nearly unrepresentable anyway**,
    which is why this is a small change rather than a new behaviour: since
    14 August a drag aimed at the page blurs the field before the scroll gets
    going (`onContentPointerMove`). So the first downward drag over results puts
    the keyboard away, and the bar goes with the next one — the settle window
    swallows the scroll the folding keyboard itself produces, exactly as it does
    for the collections bar today. Both surfaces answer the same gesture on the
    same frame, which is the whole point of one signal.

    ⚠ **It has to be declared after `useSearch()`**, which is the only reason it
    sits down here rather than with `searchAtTop`. `searchFocused` is a `const`
    read during render, so a reference above that call is a temporal dead zone
    error rather than a stale value — the compiler catches it, but the reason is
    worth stating so it does not get moved back for tidiness.
  */
  /*
    ⚠ **`showCollections` is stated here rather than relied on.** The recede
    listener already returns early on a route without collections, and `receded`
    is stamped with the route it hid on — so the masthead could not recede on
    `/profile` anyway. Saying it in the expression makes it a property of the
    masthead instead of a consequence of two things elsewhere, either of which
    could be changed by someone with a different problem in front of them. That
    screen's whole point is that nothing at its edges moves.
  */
  const mastheadHidden = showCollections && collectionsHidden && !searchFocused

  /*
    The element the page lives in — see the note on it in the render.

    **It is no longer a scroller.** Since 13 August the document scrolls, and
    this is an ordinary block in the flow. It is kept, and kept referenced,
    because it is what `--keyboard-overlap` is written onto and what the
    tap-to-dismiss handlers are scoped to.
  */
  const scrollRef = useRef<HTMLDivElement>(null)

  /*
    Keeps the rail's search dock on the keyboard's top edge — see `useKeyboardPin`.

    ⚠ **The phone's bar left this on 15 August, and only the rail's dock is
    pinned now.** Below `rail` the field is not at the foot of the screen while it
    is being typed in; it is in the masthead, where no keyboard reaches, so there
    is nothing to hold anywhere. Above `rail` the field really is at the foot of
    the content column — that is every iPad, since 45rem is 720px and the
    narrowest of them is 768 — and that surface still needs the thermostat.

    The dock carries a zero-height twin with its own positioning and nothing else.
    That is what the hook measures: see the note on `useKeyboardPin`.
  */
  const railRef = useRef<HTMLDivElement>(null)
  const railAnchorRef = useRef<HTMLDivElement>(null)
  /* The bottom of the layout viewport — see the element itself, and `floor`. */
  const floorAnchorRef = useRef<HTMLDivElement>(null)

  /*
    Memoised because the hook subscribes against it: a fresh array literal every
    render would tear down and rebuild the listeners on each keystroke. Refs are
    stable for the life of the component, so there is nothing for this to depend
    on.
  */
  const docks = useMemo<SearchDock[]>(() => [{ el: railRef, anchor: railAnchorRef }], [])

  useKeyboardPin(searchFocused, scrollRef, floorAnchorRef, docks)

  /*
    The bar recedes on every screen, search included.

    It used to freeze while search was in use, on the reasoning that a bar
    sliding away mid-search would take the field and the results' anchor with
    it. Directed otherwise on 10 August, and the new answer is better: the bar is
    a fixed surface over a wall being read, and reading is when the screen is
    wanted back. It returns on the first upward movement, so the field is never
    more than a flick away.

    ⚠ **The reason given here used to be the keyboard** — that the bar and the
    keys together take half the screen, and a scroll is exactly when that half is
    wanted back. Since 14 August the drag itself puts the keyboard away, so that
    case lasts one gesture and the recede is no longer what answers it. The
    behaviour is unchanged; the justification is now the plain one, which is that
    this is what the browser's own address bar does and the two move together.
  */
  useEffect(() => {
    if (!showCollections) return

    /* The document, since 13 August — see the note on `#scroll-root`. */
    let last = window.scrollY
    let frame = 0

    /*
      **The shape of the thing being measured, so a change of shape is not read
      as movement across it.** See `onScroll`.
    */
    let range = document.documentElement.scrollHeight

    /*
      Armed at focus — the effect re-runs then, `searchFocused` being a
      dependency — and re-armed when the keyboard actually turns up.

      **Both are needed, and neither is enough.** Focus is the moment the
      keyboard is *asked* for; it lands a few hundred milliseconds later, and
      Safari's scroll-to-reveal lands with it. iOS delivers that scroll as one
      large event when the movement finishes rather than as a stream, so by the
      time it arrives the window opened at focus has closed, and a single 271px
      positive delta is indistinguishable from a hard flick. The bar receded
      just as the keyboard settled.
    */
    let settleUntil = performance.now() + KEYBOARD_SETTLE_MS
    let lastViewport = window.visualViewport?.height ?? 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = Math.max(0, window.scrollY)
        const now = performance.now()

        /*
          ─────────────────────────────────────────────────────────────────────
           A change of range is not a scroll — 18 August
          ─────────────────────────────────────────────────────────────────────

          **When the document's scroll range changes, every offset measured
          against it changes with it, and none of that is movement.** The bar
          reads one number against the last one, so a range that collapses to
          nothing reports the whole page as a flick upward and reports it again,
          downward, when the range comes back.

          The case that found it: the film screen takes `body` out of the flow
          while a poster is open, which is how it gets a document with no range
          rather than one that has been asked not to scroll — see the note there.
          `scrollY` is forced to zero on the way in and restored on the way out,
          and without this the bar would be *hidden* on close whenever it had
          been showing, from two events nobody made.

          ⚠ **It is not a special case for that screen, and it must not become
          one.** Anything that changes the height of the page does this: content
          arriving below the fold, a section collapsing, an image settling into
          its own aspect. Reacting to those was always wrong and this is where it
          stops — the same move `onViewport` makes when the *visual* viewport
          changes size, one line lower down and for the same reason.

          `scrollHeight` is an integer, so subpixel reflow does not trip it, and
          it is read once a frame inside the `requestAnimationFrame` that already
          throttles this handler.
        */
        const height = document.documentElement.scrollHeight
        if (height !== range) {
          range = height
          last = y
          return
        }

        /*
          This ref is set by the focus event itself, before the effect keyed by
          `searchFocused` can run. It closes the race between focus and the
          keyboard's scroll-to-reveal event.
        */
        if (keyboardOpeningRef.current) {
          if (now < Math.max(settleUntil, keyboardFocusAtRef.current + KEYBOARD_SETTLE_MS)) {
            last = y
            return
          }
          keyboardOpeningRef.current = false
        }

        /*
          Follow the page without reacting to it. Everything the keyboard moves
          arrives as scroll, so during the settle window the baseline is kept
          current and the bar is left alone — which means the flick that comes
          after is measured from where the page actually is, rather than from
          wherever it was before the keyboard shoved it.
        */
        if (now < settleUntil) {
          last = y
          return
        }

        const delta = y - last
        // `last` deliberately does not move until the threshold is crossed, so
        // slow scrolling accumulates instead of never registering.
        if (Math.abs(delta) < SCROLL_THRESHOLD) return

        /*
          **Every scroll counts, whoever made it.**

          Nothing is asked here about fingers — see the note where
          `USER_SCROLL_GRACE_MS` used to be. Momentum therefore keeps the bar
          reacting for as long as the page is moving, in both directions, which
          is what the gesture always looked like it should do.

          ⚠ **This used to lean on "the only scrolls this element receives are
          ones a person made", and since 13 August that is no longer true** — it
          watches the document, which is also what a keyboard would move. The
          settle window above is what carries it instead, and it was written for
          exactly this case: 271px arriving in one event, indistinguishable from
          a hard flick. It is not a new risk, it is the old one, now guarded in
          one place rather than avoided by construction.
        */
        last = y
        setReceded({ route: pathname, hidden: y > ALWAYS_SHOWN_ABOVE && delta > 0 })
      })
    }

    /*
      A keyboard, not a toolbar — see `KEYBOARD_MIN_HEIGHT`. Anything smaller is
      Safari's own chrome moving as the page scrolls, and re-arming on that
      would stop the bar ever receding.
    */
    const onViewport = () => {
      const height = window.visualViewport?.height ?? 0
      if (Math.abs(height - lastViewport) < KEYBOARD_MIN_HEIGHT) return
      lastViewport = height
      settleUntil = performance.now() + KEYBOARD_SETTLE_MS
      last = window.scrollY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('resize', onViewport)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('resize', onViewport)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [showCollections, searchFocused, pathname])

  /*
    ─────────────────────────────────────────────────────────────────────────
     There was a document clamp here, and removing it is the point (13 August)
    ─────────────────────────────────────────────────────────────────────────

    It reset any positive `window.scrollY` on every scroll event, every frame
    for the length of a keyboard animation. It existed because on 11 August iOS
    scrolled the document by the keyboard's height to reveal the focused field —
    271px in a tab, 333 standalone — dragging every `position: fixed` element in
    the app up with it.

    **It was measured unnecessary and deleted.** The dock lifts clear of the
    keyboard at `pointerdown` now, before iOS decides whether it needs to reveal
    anything, so there is nothing left to reveal. Six keyboard openings on the
    handset with the document unlocked and this stood down, installed and in a
    Safari tab: `scrollY` peaked at 0 every time.

    ⚠ **It could not tell iOS's scrolling from a person's** — it reset positive
    offsets whoever asked. Measured in Chromium against one deliberate 400px
    scroll of the unlocked document, it fired 18 times and won. So it was never
    narrowable: any version of it that survives is a version that fights the
    user. Deleting was the only move, which is why the measurement mattered.

    If a keyboard ever moves the document again, **do not rebuild this.** The
    backstop in `useKeyboardPin` reads the dock's real position and corrects
    whatever displaced it without needing to know what did, and the decoy-field
    pattern in docs/decisions.md is the designed rewrite. A correction scheduled
    from an event is always a frame behind the paint; that is what made this one
    visible as a jump-and-drop in the first place.
  */

  /*
    A new route starts at the top of itself, and **nothing here does that any
    more — Next does, again, for free.**

    There was an effect here that scrolled `#scroll-root` to zero on every
    pathname change. It was written on 10 August because moving the page into a
    nested scroller broke Next's own handling, which moves the *document*: three
    screens into Wants, tapping Archive put you three screens into Archive.

    The document scrolls again since 13 August, so that handling works, and this
    is deleted rather than repointed at `window` — **repointing it would have
    been strictly worse than nothing.** Next restores the previous offset on
    Back, and an unconditional reset keyed on `pathname` cannot tell a Back from
    a tap: it would force the top on both, costing the restoration the old note
    here recorded as already lost. It is not lost any more.

    The bar comes back on its own, and not because of anything here — see
    `receded` above, which is scoped to the route it was hidden on.
  */

  /*
    ─────────────────────────────────────────────────────────────────────────
     Coming back to the app is the thing that asks for fresh data
    ─────────────────────────────────────────────────────────────────────────

    Built 12 August, answering *what happens if we bring back pull-to-refresh*.
    Three things had been blamed for costing that gesture and only one of them
    does: not the container scroll, not the clamp above — which pushes back
    *positive* offsets, and an overscroll past the top is zero or negative — but
    the `overflow: hidden` document lock in `globals.css`, which leaves nothing
    to overscroll in.

    Bringing it back therefore means handing the document its scroll range, and
    that range is the 271px iOS invents to reveal a focused field. It would trade
    a gesture for the fault the whole of that comment exists about. And it would
    buy nothing where the app is actually used: **iOS gives a standalone web app
    no pull-to-refresh**, so installed there is none to restore.

    So the gesture is not the mechanism. *Returning to the app* is what a person
    means by refreshing, it is observable installed and in a tab alike, and it
    needs no scroll range at all.

    `router.refresh()` re-runs the Server Components for this route, layouts
    included — which is what brings `counts` up to date, not only the page. The
    payload is merged rather than remounted, so client state, focus and scroll
    position all survive it: this may fire under an open intent sheet or a live
    search without taking either away. What changes is the content behind them.

    ⚠ **`Date.now()`, not `performance.now()`.** The question is how much time
    passed in the world while the app was not running, which is wall clock. The
    frame timings elsewhere in this file ask the opposite question and correctly
    use the opposite instrument.

    Two pairs of events, because the two ways back are not the same. Switching
    away and returning fires `visibilitychange`. A back gesture in a tab may
    instead thaw the whole frame out of the bfcache, from however long ago, and
    `pageshow` is what says so. Whichever arrives first clears `awayAt` and the
    other finds nothing to do — the reset is the de-duplication, so there is no
    second timer to keep in step.
  */
  useEffect(() => {
    let awayAt = 0

    const leave = () => {
      awayAt = Date.now()
    }

    const arrive = () => {
      if (document.visibilityState !== 'visible') return
      const left = awayAt
      awayAt = 0
      if (left && Date.now() - left >= STALE_AFTER_MS) router.refresh()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leave()
      else arrive()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', leave)
    window.addEventListener('pageshow', arrive)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('pageshow', arrive)
    }
  }, [router])

  async function signOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    /*
      `max-w-6xl` caps the shell as a unit — rail and column together — rather
      than centring a column inside an uncapped page. At 1440 that leaves the
      pair centred with equal air either side; without it the rail pins to the
      left edge of a wide monitor and the list drifts away from it.
    */
    /*
      ─────────────────────────────────────────────────────────────────────────
       The page scrolls in the document, like every other page (13 August)
      ─────────────────────────────────────────────────────────────────────────

      **This was `fixed inset-0 overflow-y-auto` from 10 to 13 August, and it is
      an ordinary block again.** The page scrolled in here because iOS stops
      honouring `position: fixed` while the keyboard is open *and the document
      scrolls* — so the document was stopped from scrolling, here and with an
      `overflow: hidden` lock in globals.css.

      What that cost was invisible until someone asked for it: Safari collapses
      its address bar in response to the *document* scrolling, and a document
      with no scroll range never asks. Pull-to-refresh went the same way.
      Measured at phone width, document scroll range in three states — as
      shipped 0px, the lock lifted 0px, the lock lifted **and** this un-pinned
      1229px. **Which is why lifting the lock alone reads as no change**: the
      content was in a box stapled to the glass, so the document had no height
      to scroll whether or not it was allowed to.

      ⚠ **The reason it is safe to undo is that the real fix outgrew it.** The
      dock lifts clear of the keyboard at `pointerdown` now, before iOS decides
      whether to reveal the field, so the reveal never happens: `scrollY` peaked
      at 0 across six keyboard openings on the handset, installed and in a tab,
      with nothing left to put the document back. That fix and the lock were
      built the same week and the lock was never taken off to check — **a guard
      built beside a cure hides whether the cure works.**

      This element is kept for three things that are not scrolling:
      `--keyboard-overlap` is written onto it and inherits down; the
      tap-to-dismiss handlers are scoped to it; and `search-provider.tsx` finds
      it by id. The docks and their measuring anchors stay portalled to
      `document.body`, which was always correct.
    */
    <div
      id="scroll-root"
      ref={scrollRef}
      /*
        ─────────────────────────────────────────────────────────────────────
         Whether the mark is on screen, said out loud — 16 August
        ─────────────────────────────────────────────────────────────────────

        **The home wall's caption is the mark's absence, and this is how it
        knows.** It used to be hidden by being underneath the masthead, which is
        opaque and one layer above — and that works for as long as the two move
        together. They do not: a pull-down at the top rubber-bands the document
        while a `fixed` header stays with the viewport, so the caption slid out
        from under the mark and was visible on the opening screen. Reported.

        **Covering is not hiding.** Anything that depends on one element sitting
        over another depends on the two never moving apart, and overscroll is
        exactly the case where the platform moves them apart. So the caption
        stops asking to be covered and reads the state instead: it is painted
        when the mark is away and not otherwise, whatever the scroller is doing.

        An attribute rather than context, because that is the whole of what has
        to travel: one boolean, from here to a component two levels down, with no
        provider, no subscription and no re-render of anything that does not care.
        `main` is a sibling of the header and an ancestor of the caption, so a
        class on this element reaches it in CSS alone.

        **Not a `style` attribute**, which the CSP forbids outright — see the
        note on `wordmark-trim` in globals.css.
      */
      className="group/masthead"
      data-masthead={mastheadHidden ? 'gone' : 'up'}
      onPointerDownCapture={onContentPointerDown}
      onPointerMoveCapture={onContentPointerMove}
      onPointerUpCapture={onContentPointerUp}
      onPointerCancelCapture={onContentPointerCancel}
    >
    {/*
      ─────────────────────────────────────────────────────────────────────────
       The page box is the screen, and `svh` is not the screen — 16 August
      ─────────────────────────────────────────────────────────────────────────

      **The top inset is added back to `min-h-svh`, and it is the fix for a
      reported fault.** Installed, tapping *Go-back-tos*, *Fixtures* or *Archive*
      moved the collection bar 47px up the screen and left it there. *Wants* —
      nineteen entries — and the home wall did not. The pages are the same
      component with the same props; the only difference between them is whether
      the content overflows.

      **Measured off three screenshots**, 1170×2532 on a 390×844 handset: the
      bar's labels sit 35.0 CSS px above the foot of the screen on the home wall
      and on Wants, and 81.7 on Go-back-tos. The difference is 47.0 exactly, and
      47 is this device's `env(safe-area-inset-top)` — confirmed in the same
      images by the masthead, whose mark lands at 57.3, the inset plus
      `--masthead-gap`. The top of the page is identical on all three, so
      nothing above moved.

      **`100svh` in an installed app is the screen less the status-bar band.**
      `viewport-fit=cover` lets the page paint into that band — which is what
      every `env(safe-area-inset-top)` in this file is spending — but the
      viewport unit does not grow to match it. This file already had the number
      written down from another day's measuring and nobody had subtracted it:
      the note where `lastKeyboardOverlap` used to be calls this "an 797px
      handset", and 844 − 797 is the 47.

      So a page whose content does not overflow ends 47px above the foot of the
      glass. Whatever iOS then does with `position: fixed` in that state, the bar
      lands on *that* line rather than on the screen's — and a page with enough
      in it to scroll never shows it, which is why every screen this was built
      against looked right.

      Adding the inset back states the one thing that is actually true: **the
      page box is the screen.** It is a no-op everywhere else — the inset reads 0
      in a Safari tab, where the toolbar occupies that band, and 0 on Android and
      on the desk — so nothing outside the installed app moves by a pixel.

      The cost, installed, is that a page with two entries in it can now be
      dragged by those 47px. That is what a page which reaches the bottom of the
      screen costs, and every page with content in it already pays it.

      ⚠ **If this ever stops holding, measure `innerHeight` against
      `screen.height` on the device before touching anything else.** The whole
      fault is the difference between those two numbers, and it is invisible in
      every browser on a desk.
    */}
    {/*
      `pane-inset` is the room the film panel stands in — see the utility in
      globals.css.

      ⚠ **It is held open by the route, not by a film — 20 August.** The room used
      to arrive with the panel and leave with it, which re-laid the wall from six
      columns to four under the tap that opened it. Now the wall's route reserves
      it from the first paint and the panel drops into a column that is already
      there, so tapping a poster moves nothing.

      ⚠ **`pathname === '/'` is the whole condition, and it is the same test two
      other things in this file already make.** The wall is the only page a film
      panel opens on — search swaps the wall's contents in place and stays here —
      so every other route would be paying 27rem of dead space for a panel that
      never comes. Above `pane` only; the utility carries that variant itself.
    */}
    <div
      /*
        ⚠ **The room is given back over 300ms, not at once — 20 August.**
        Reported: closing the panel by tapping the poster should return to five
        columns smoothly. The padding is the only thing that changes, so it is
        the only thing that animates, and the wall unfolds as it shrinks: the
        container query re-answers continuously on the way, so the count steps
        3 → 4 → 5 as the box passes each threshold rather than jumping.

        **300ms because that is the panel's own travel** — `duration-300` on the
        film screen's chevron — so the two read as one movement rather than as a
        panel that leaves and a wall that then notices.

        ⚠ It also animates on a route change to and from `/`, which is the same
        room arriving and leaving and looks like what it is. There is nothing to
        animate on first paint: the reserved column is the default, so no value
        changes when the page arrives.

        ⚠ **`padding-right`, not `padding`, and the difference was a bug I
        shipped.** `transition-[padding]` also animates `rail:pl-68` — so the
        rail's 17rem eased in and out as a window crossed that breakpoint, and
        the wall's width *lagged the pointer* through a drag instead of tracking
        it. Measured mid-drag at 719px: `padding-left` read 263.098px on its way
        to 0. **One side of this box is a panel that comes and goes; the other is
        a rail that either exists or does not.** Only the first is a movement.
      */
      className={`rail:pl-68 mx-auto flex min-h-[calc(100svh_+_env(safe-area-inset-top))] w-full max-w-6xl flex-col transition-[padding-right] duration-300 ${
        pathname === '/' ? 'pane-inset' : ''
      }`}
    >
      {/*
        The references for `useKeyboardPin`. Each carries its dock's positioning
        and nothing else — no transform, no recede, no padding — so it reports
        where an untransformed fixed element actually lands on this device. Zero
        size, no paint, no hit area: they exist to be measured.

        ⚠ **There were two of these until 15 August.** The phone's bar had a twin
        at `bottom-0` wearing `rail:hidden`; it went with the pre-lift, because
        the bar is no longer moved to meet a keyboard and so nothing needs to
        know where it rests. The rail's twin hangs off `top-0` and `h-svh` rather
        than `bottom-0` — see the rail dock itself for why.

        **Portalled with its dock**, or it would be measuring a box the dock is
        no longer in.
      */}
      {portalReady &&
        createPortal(
          <>
            <div
              ref={railAnchorRef}
              aria-hidden
              className="rail:block pointer-events-none fixed top-0 hidden h-svh w-0"
            />
            {/*
              **The bottom of the layout viewport, as a thing that can be
              measured** — see `floor` in `useKeyboardPin`.

              Needed since 13 August. `floor` used to read the bottom edge of
              `#scroll-root`, which meant the viewport's bottom only because that
              element was `fixed inset-0`; in the flow its bottom is the bottom
              of the *content*, which is a different line and usually far below
              the screen. Measuring the overlap against that would report a
              keyboard the size of the whole page.

              Unlike the one above it wears no breakpoint: the floor is the floor
              at every width, and `safe-bottom` needs it at all of them — a
              keyboard still covers the foot of a phone's results wall even
              though nothing is docked down there any more.

              Measured rather than derived from `innerHeight` or `clientHeight`,
              which is the same choice `floor` and the pin already make — those
              numbers mean different things to different browsers with a keyboard
              open, and a rendered box does not.
            */}
            <div
              ref={floorAnchorRef}
              aria-hidden
              className="pointer-events-none fixed inset-x-0 bottom-0 h-0"
            />
          </>,
          document.body,
        )}
      {/* --- the rail, from 45rem up ------------------------------------- */}
      <aside
        /*
          The collections stay put while the list scrolls past them. That is the
          whole reason a rail beats a header on a large screen: the navigation
          stops being something you scroll back up to find.

          **`fixed`, not `sticky` — and for the same reason the header is.** A
          sticky element only holds position while the scroll offset is inside
          its range. At either limit the document rubber-bands past it, sticky
          disengages, and the rail rides up and down with the posters. Fixed is
          anchored to the viewport and sits the bounce out.

          **The left edge is the shell's own centring, restated.** Out of flow,
          the rail can no longer be the first item in a centred row, so it has to
          find that column itself: `max(0px, 50% - 36rem)` is the left edge of a
          72rem box centred in the viewport, which is exactly what `mx-auto
          max-w-6xl` produces on the shell. `max()` handles the narrow case,
          where the box is the full width and the edge is zero. `main` is held
          off it by `rail:pl-68` — 14rem of rail plus the 3rem that used to be
          the flex gap — so the column lands where it always did.

          **`h-svh`, not `h-dvh`** — the *small* viewport height rather than the
          dynamic one. `dvh` is defined to track the viewport as browser chrome
          shows and hides, which on a tablet happens continuously while you
          scroll. The rail's height followed it, and because identity is pinned
          to the foot with `mt-auto`, the whole column drifted a few pixels the
          entire way down the page. `svh` does not change. The cost is that when
          the toolbar retracts the foot sits a little above the true bottom of
          the window — invisible on a black ground, and cheap against a column
          that never settles.
        */
        className="gutter rail:fixed rail:top-0 rail:left-[max(0px,calc(50%_-_36rem))] rail:z-10 rail:flex rail:h-svh rail:w-56 rail:flex-col rail:py-10 hidden shrink-0"
      >
        <Link href="/" className="wordmark text-wordmark-rail">
          Again
        </Link>

        <nav aria-label="Main" className="mt-12 flex flex-col gap-4">
          {/*
            Home is a destination in its own right now that the capture box
            lives there rather than at the top of Wants — and on a desk it is
            the *only* way to add anything, so it cannot rest on the wordmark
            being a link. Set as a word rather than the house glyph the phone
            bar uses: the icon is there because a bottom bar has no room for
            five labels, and a column has room for all of them.

            `mb-2` on top of the gap, because Home is not one of the four. It is
            the smallest separation that says so without a rule.
          */}
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`micro tap-target mb-2 transition-colors ${
              pathname === '/' ? 'text-text' : 'text-muted hover:text-text'
            }`}
          >
            Home
          </Link>

          {COLLECTION_LINKS.map((link) => (
            <CollectionLink
              key={link.href}
              {...link}
              count={counts[link.view]}
              active={pathname === link.href}
              layout="rail"
            />
          ))}
        </nav>

        {/*
          `mt-auto` rather than a fixed offset: identity and sign-out belong at
          the foot of the rail whatever the height of the screen, and pinning
          them to the bottom is what keeps the collections as the top-weighted
          thing in the column.

          The phone gets the same pair in the same corner, one tap away behind
          the profile icon — see `app/(app)/profile/page.tsx`.
        */}
        <div className="mt-auto flex flex-col items-start gap-3">
          {/* Sans, not mono: a displayed handle is a name, not data (§11). */}
          <span className="text-muted w-full truncate text-xs">@{handle}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-muted hover:text-text micro transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/*
        --- search, at the foot of the content column (rail widths) ----------

        Left-justified with the posters and level with *Sign out*, so the two
        ends of the shell's foot read as one line rather than as two things that
        happen to be near the bottom.

        **It mirrors the rail's own box to get there.** `top-0`, `h-svh` and
        `py-10` are the aside's three, so the last thing in this column and the
        last thing in that one land on the same y whatever the browser chrome is
        doing. Anchoring to `bottom` instead would have been simpler and wrong:
        `bottom` follows the *actual* viewport, `h-svh` does not, and on a tablet
        with a retracted toolbar the two drift apart.

        The left edge is the shell's centring plus the rail's column — 17rem of
        `rail:pl-68` and 1.25rem of `gutter` — which is exactly where `main`'s
        content starts, and therefore where the first poster does.

        `w-72` because the results open off this and 288px is a list you can read
        a title in; the field itself needs a fraction of that. `direction="up"`
        for the same reason as the phone: there is nothing below it.

        **It stands on a ground, or the posters run through it.** The wall
        scrolls past this the way it scrolls past the phone's bar, and text over
        moving artwork is unreadable — so the row sits on an opaque band that
        runs from the content column's left edge to the right of the window.
        Posters disappear behind it at a clean horizontal edge instead of
        crossing the word.

        The band deliberately stops short of the rail. Full width would paint
        over *Sign out* and the handle, which sit at the same height in the
        aside — and this element comes later in the document, so it would win.

        `pointer-events-none` on the full-height column, restored on the band —
        an opaque bar should absorb the clicks it covers, and the empty column
        above it should not.

        **`pb-9` where the rail has `py-10`, and the 4px is the point.** Matching
        the two boxes is not the same as matching the two lines: the search sets
        16px on a 24px line, *Sign out* sets 11px on a 14.3px one, so their
        baselines sit 6.0px and 3.15px above their own bottoms. Level boxes left
        the search reading 3.85px high. Four pixels of bottom padding removed
        drops it onto the same line, measured at 0.15px apart — which is the
        difference between level and *looking* level.
      */}
      {/*
        `transition-[translate]` for the same reason the phone's bar has it:
        `useKeyboardPin` writes `transform` here and it must be instant, so the
        two properties are kept apart even though nothing animates this one yet.

        ⚠ **No pointer handlers here since 15 August.** It carried the three that
        arranged the pre-lift, and there is no pre-lift: this dock is held on the
        keyboard by measurement alone, which is what it had before the phone's
        problems were ever brought to it. A tap on the field focuses the field,
        the way it does anywhere else on the web.
      */}
      {portalReady &&
        createPortal(
          <div
            ref={railRef}
            onFocusCapture={onDockFocus}
            onBlurCapture={onDockBlur}
            className="rail:flex pointer-events-none fixed top-0 right-0 left-[calc(max(0px,50%_-_36rem)_+_17rem)] z-10 hidden h-svh flex-col justify-end transition-[translate]"
          >
            <div className="bg-bg pointer-events-auto pt-6 pb-9">
              <div className="gutter flex max-w-3xl items-center gap-1.5">
                <span className="text-muted shrink-0">
                  <ChevronIcon />
                </span>
                <SearchField id="search-foot" />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/*
        --- the header, below 45rem ---------------------------------------

        No rule under it. A hairline here drew a line across the screen directly
        beneath the one piece of display type in the app, which boxed the mark in
        rather than letting it sit at the top of the page — and there is nothing
        for it to divide, since the row below is the content itself. The bar at
        the foot keeps its rule, where it is doing real work: separating a fixed
        surface from the list scrolling underneath it.

        **It does not move — including through the overscroll bounce**, which is
        why it is `fixed` rather than `sticky`.

        Sticky was the better answer while the only requirement was "stays at the
        top": it keeps the header in flow, so content below starts in the right
        place by itself. But a sticky element is only stuck while the scroll
        offset is positive. Rubber-band at the top drives it negative, the header
        stops being stuck, and it rides down the screen with the posters. Fixed
        is anchored to the viewport and sits out the bounce — the same reason the
        collection bar at the foot does not move with it.

        What that costs is the thing sticky was chosen to avoid: out of flow, the
        header holds no space open, so `main` has to carry the header's height in
        its own padding. See `HEADER_HEIGHT`.

        `bg-bg` is what makes the pass-under work at all: without a ground the
        list would show through the mark.

        **The mark sits the same distance from the status bar as the content sits
        from the mark**, and that is why the two paddings here are one constant.
        It was 16px above and 48px below — the header's own 16 plus 32 from
        `main` — which read as a mark pushed down into the page rather than one
        heading it.

        The number is spent in one place: `MASTHEAD_GAP`, above the mark and
        below it, equal because the mark's box is trimmed to its own letters —
        see `MARK_LINE_HEIGHT` and the trims. The notch inset is added to the top
        separately, because it is clearance rather than spacing.

        Two earlier versions of this compensated for the type inside the padding
        here instead, which meant the header carried a number describing a fact
        about a font. Correcting the box rather than the space around it is what
        lets both paddings be the same constant again.

        ─────────────────────────────────────────────────────────────────────
        **The shadow is why a poster never reaches the mark.**

        The header is `fixed`, so content passes under it and is cut off at its
        bottom edge — which sits only `MASTHEAD_GAP` below the letters. At rest
        the first poster is another 0.5rem down again, from the `+ 0.5rem` in
        `main`'s padding; the moment you scroll, that 8px slides away and the cut
        edge arrives 10px under the mark. The gap was never constant, it just
        looked it until something moved.

        So the header paints 8px further than it measures: a hard-edged
        box-shadow, offset down by exactly the distance `main` holds open, with
        no blur and no spread. It adds no height and joins no layout — it only
        extends the ground the mark sits on, so the cut edge lands where the
        resting gap already was. **The `0.5rem` in this shadow and the `0.5rem`
        in `main`'s padding must stay equal**, and that is the whole trick — the
        distance from the mark to the first poster is then the same number
        whether the page is scrolled or not.

        **A shadow rather than the `::after` this started as.** A positioned
        pseudo-element is painted *above* its parent's in-flow content, so if its
        top edge lands even slightly high it covers the very letters it exists
        to protect — which is exactly what happened. An outer box-shadow is
        painted *behind* the element's own background and text, so it cannot
        reach the mark however it is positioned. It also cannot swallow a tap,
        which the pseudo-element needed `pointer-events-none` to avoid.

        Black is spelled out rather than taken from the token, for the same
        reason `poster.tsx` spells its backdrop: this has to match the header's
        ground exactly, and a shadow that is one shade off reads as a band across
        the screen. If `--color-bg` ever moves, this moves with it by hand.
      */}
      {/*
        ─────────────────────────────────────────────────────────────────────
         It holds the search field while one is being typed in (15 August)
        ─────────────────────────────────────────────────────────────────────

        **This is where the field goes, and the whole point is that a keyboard
        never reaches here.** See `onBarPointerDown` for what it replaced and
        why the swap has to happen at `pointerdown`.

        ⚠ **The row sets its own height and neither state is allowed to** — see
        the note on `min-h-[1.6875rem]` at the row itself. Matching two states to
        each other is what failed here once already: they agreed at 24px while
        the mark read `again`, and the rename to `need` broke the agreement in
        one edit without touching either of them.

        Getting it wrong does not misalign the header — it resizes the masthead
        under the tap, and would shift the entire poster wall if `main`'s top
        padding were not a fixed literal.

        The wordmark and the two glyphs are gone for as long as the field is up.
        That is deliberate: a masthead has one job at a time, and while you are
        typing the field is it. They come back on blur, which is every way out —
        see `onDockBlur`.

        Focus and blur are captured here for the same reason the rail's dock
        captures them: this is now one of the two surfaces that can hold a field.
      */}
      <header
        onPointerDownCapture={onMastheadPointerDown}
        onPointerUpCapture={onMastheadPointerUp}
        onPointerCancelCapture={onMastheadPointerCancel}
        onFocusCapture={onDockFocus}
        onBlurCapture={onDockBlur}
        /*
          `transition-[translate]` and 300ms, matching the bar at the foot
          exactly — the two are one gesture and any difference between them would
          read as one of them lagging.

          ⚠ **The recede is `100% + the hem`, not `100%`.** The shadow paints
          `--masthead-hem` of ground *below* the element so posters pass under
          the mark without showing through it; move the header by its own height
          alone and that strip stays behind, clipping the top of the wall by 8px
          on a ground it happens to match.

          **All four sites read the token now** — this, the shadow, `main`'s top
          padding and the caption's own band. It was `0.5rem` written out three
          times with a row in docs/plan.md asking whoever changed one to remember
          the rest.
        */
        /*
          ⚠ **`masthead-box` is the two paddings, and it is shared** — the home
          wall's caption wears the same utility, because it pins to this strip of
          screen as this slides off it. See the utility in globals.css; the pair
          used to be spelled out here, which meant one file's idea of the
          masthead and another's could disagree by an edit.
        */
        /*
          `rounded-b-artwork` — the posters' own corner, directed 16 August, and
          the shadow takes it too: a `box-shadow` follows the border radius, so
          the hem is the same shape 8px lower and the banner's painted silhouette
          is one rectangle with two rounded feet. The radius is half the hem, so
          the curve is covered rather than clipped.

          ⚠ **It will not read at this width.** The corners sit at the screen's
          own edges, and the wall is inset by the `gutter` — so there is black
          behind them and a curve cut into black shows nothing. The caption's
          band is the wall's width, so its corners land over posters and its
          curve does read. Bringing this ground in to the column would make the
          pair identical; that is a change to the masthead's shape rather than to
          its corners, so it is not made here.
        */
        className={`bg-bg rail:hidden masthead-box rounded-b-artwork fixed inset-x-0 top-0 z-20 shadow-[0_var(--masthead-hem)_0_0_#000] transition-[translate] duration-300 ${
          mastheadHidden ? 'translate-y-[calc(-100%_-_var(--masthead-hem))]' : 'translate-y-0'
        }`}
      >
        {/*
          ⚠ **`h-[var(--wordmark-ink)]` — a height, not a minimum — and the row
          owns it rather than either state (15 August).** That token is the mark's
          inked height, measured, as a fraction of `--text-wordmark` — see
          globals.css.

          ⚠ **`h`, because a minimum does not do this job, and finding that out
          took two goes.** A floor is only binding while the mark is the tallest
          thing in the row, and it stopped being so the moment the type shrank:
          in Space Grotesk at 2.25rem the ink was 27px and the field's 24px line
          box fitted inside it; at 1.75rem the ink was 21px and the field pushed
          the row back out to 24, resizing the masthead under the tap exactly as
          before. **The masthead's height is a property of the masthead, not of
          whatever is currently inside it.**

          The margin it has is a property of the face, so it is not to be relied
          on, and **since 21 August there is no margin — the mark is in capitals
          and the row is smaller than the field again.** Jost sets AGAIN at an ink
          of 0.775, which is 21.69px at 1.75rem against the field's 24px line box,
          so the field overhangs by 1.15px at each end. Ojuju's `Again` inked 0.92
          — 25.75px — and had room; Space Grotesk's `need` inked 0.75 and
          overhung by 1.5px. **Either way nothing clips**: there is no `overflow`
          here and an overhang is spent into the header's own `--masthead-gap`,
          which is 8px a side.

          ⚠ **Measured after the change, because this is the thing this note
          exists to make somebody check:** the header is 45.69px resting and
          45.69px with the field open — **the same height, which is the claim
          below and the reason the row is `h` rather than `min-h`.** A row sized
          from its tallest child would have grown to 24 under the tap.

          Everything else follows from putting the number here:

          - **Both states are the same height by construction**, so tapping the
            field cannot resize the masthead. They were left to match each other
            for one commit and immediately drifted: the rename cut the wordmark's
            trimmed box to 17px, the two header glyphs became the tallest thing
            in the row at 20px, and the field's 24px line box made the search
            state 4px taller than the resting one.
          - **The header is `--masthead-gap` + the ink + `--masthead-gap`**, which
            is exactly what `main` pads for below, because that padding is now
            the same expression. It used to run about 10px generous, because the
            row's height was whatever its tallest child happened to be.
          - **The visible air is `--masthead-gap` at both ends.** The trimmed mark
            is exactly its own ink, so it fills the row and the paddings mean what
            they say — which is what that token's own note claims and, until this,
            was not true. Re-measured at 1.75rem in Jost capitals: a 45.69px
            header against `gap + hem + ink + gap` of 45.69, the row exactly the
            21.69px of `--wordmark-ink`, and the letters landing inside it at
            both ends. It was 45.75 in Ojuju, where the mark inked 4px more; the
            header follows the ink because it is written from it.

          ⚠ **The bottom `--masthead-gap` moved from this row up to the `header`,
          and it had to.** `min-height` on a border box is satisfied by padding,
          so 27px of minimum against 10px of padding left only 17px for content
          and never bound — the row stayed 20px tall, set by the glyphs, exactly
          as before. This file has the same lesson written on the bar's row
          (`min-h-6` against `py-3.5`, a no-op), which is twice now. Padding and
          a minimum height on one element do not compose; put them on different
          ones. The geometry is identical either way.

          If the mark's word or case changes, this changes with it.
        */}
        <div className="gutter flex h-[var(--wordmark-ink)] items-center justify-between">
          {searchAtTop ? (
            <div className="caret-deferred flex w-full min-w-0 items-center gap-1.5">
              {/*
                The way out, and the only control in this row that is not the
                field. See `exitSearch` — it leaves search rather than navigating,
                because search replaced the page you were on rather than taking
                you to one of its own.

                ⚠ **The blur is prevented on both pointers, and it has to be.**
                Focus leaving the field runs `onDockBlur`, which puts the masthead
                back — so without this the row would unmount between the press and
                the `click`, and the arrow would do nothing at all. That is
                exactly how the × died on 11 August, and again on the 15th by a
                different route; a control that removes its own surface has to
                hold focus until its click has landed.

                ⚠ **`size-[var(--wordmark-ink)]`, so the circle is the row.** A
                literal would be a fourth number tied to the type size, and this
                one has to fit inside a row whose height is already that token —
                a 26px pill in a 25.75px row overflows by a hair at this size and
                by more at the next. Reading the token makes the circle exactly as
                tall as the line it sits on, at any size, and `aspect-square` on
                its own would not: the button's width is content-driven, so it
                would size to a 12px glyph.

                `bg-surface` rather than a border. The surface token exists to
                read as raised against the black ground — its own note says warm
                surfaces need that ground to do it — which is what a chip around a
                control is for. A hairline ring would be a second boundary drawn
                where the fill already draws one.

                **`/60`, directed 15 August: a tad more see-through.** At full
                strength the chip sits at 1.29:1 against the ground, which is the
                separation that token was chosen for; at 60% it comes to about
                1.17:1 — present enough to read as a surface, quiet enough not to
                announce itself next to a wordmark. It is one number, so more or
                less subtle is one character.

                `tap-target` still applies: 25.75px is well under the 44px floor.
                Its expansion reaches about 9px past the circle, which clears the
                chevron and stops well short of the input — see the warning on
                that utility about neighbours stealing each other's taps.
              */}
              <button
                type="button"
                onPointerDown={(event) => event.preventDefault()}
                onMouseDown={(event) => event.preventDefault()}
                onClick={exitSearch}
                aria-label="Leave search"
                className="bg-surface/60 text-muted hover:text-text tap-target flex size-[var(--wordmark-ink)] shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <ArrowLeftIcon />
              </button>

              {/*
                The chevron points at the field, and blinks while the field has
                the caret — directed 15 August. See `--animate-caret` in
                globals.css for why a blink deleted on 10 August is defensible
                here and was not there: nothing mounts, unmounts or moves, and it
                makes its claim at the one time the claim is true.

                `searchFocused` rather than `searchAtTop`, so it stops the moment
                the caret goes rather than the moment the row does.

                ⚠ **It was turquoise for one commit and is `text-muted` again** —
                directed, 15 August. `--color-caret` is left defined and unused in
                globals.css, the way `--font-ojuju` was: the value is measured and
                argued, and putting it back is this one class. What the revert
                restores is §11's position that this palette has two meaningful
                colours, which is worth more than the signal a third was buying.

                The blink is doing the work on its own — nothing else on a matte
                black screen moves — so the colour was saying a second time what
                the motion already said.
              */}
              <span
                className={`text-muted shrink-0 ${searchFocused ? 'animate-caret' : ''}`}
              >
                <ChevronIcon />
              </span>
              <SearchField id={TOP_FIELD_ID} />
            </div>
          ) : (
            <>
          {/*
            `wordmark-trim` contains the descender so it cannot reach what
            follows, and takes back the diacritic space "again" never uses, so
            the element's outer box is the inked bounds. The measurements, and
            what to change if the mark's case moves again, are on the utility in
            globals.css.

            **`pl-[var(--type-indent)]` is the horizontal half of the same
            idea**, and it is shared with the wall's caption rather than owned
            here — see the token. The mark sits a fraction in from the gutter
            that the posters below it run flush to; the caption that replaces it
            when this recedes sits in by the same amount, so the corner holds
            still through the swap.

            Padding rather than a margin, so the tap area still reaches the
            gutter: the mark is the only route to `/` on a phone, and an indent
            is not a reason to make it a smaller target.
          */}
          <Link href="/" className="wordmark wordmark-trim text-wordmark pl-[var(--type-indent)]">
            Again
          </Link>

          {/*
            ───────────────────────────────────────────────────────────────────
             Profile, then search — 15 August
            ───────────────────────────────────────────────────────────────────

            **The house is gone and search has its place**, directed. Search had
            no route of its own once the bar at the foot stopped carrying a
            field, and between the two, it is the one nobody would guess at:
            **the wordmark has always linked home**, which is the convention a
            masthead is read by, so removing the explicit control costs a glyph
            and no destination.

            ⚠ **It does cost something, and it is worth knowing.** The old note
            here argued Home was a destination in its own right and deserved the
            explicit control. On a phone `/` is now reachable only through the
            wordmark, and the wordmark is the half of this row that `searchAtTop`
            replaces — so while you are typing there is no way home at all. The
            arrow beside the field is the way out of that state, which is why it
            exists rather than being left to a tap on the page.

            **Search sits on the right, profile to its left** — also directed, and
            the swap is the sound way round: search is what a thumb reaches for
            repeatedly and the right edge is where it lands, while a profile is
            looked at rarely.

            `-my-3/py-3` takes both tap targets to the full header height; the
            gap between them is what keeps the two 44px areas from meeting.

            `data-opens-search` rather than a ref or a class: the gesture is heard
            at the `header`, which has to recognise this control by looking at the
            event's target — see `onMastheadPointerDown` for why it cannot listen
            on the button itself.
          */}
          {/*
            `text-active` — lacquer red — on the profile when you are looking at
            it. See the token in globals.css for the scarcity rule it inherits and
            for why it must never become the error colour.

            An unlabelled glyph has no word to carry its state, so it needs the
            colour more than a label does; the collections in the bottom bar still
            mark the current one with full-strength text, which is a deliberate
            difference rather than an oversight — they are words, and a word can
            say where it is by getting brighter.

            **Search takes no `aria-current` and no red.** It is not a place, and
            colouring it would say you were somewhere. When it is active this row
            is not on screen at all.

            Colour is not the only signal: `aria-current="page"` carries the
            profile's state, so nothing depends on being able to see red.
          */}
          <div className="flex items-center gap-5">
            <Link
              href="/profile"
              aria-label="Profile"
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className={`-my-3 py-3 transition-colors ${
                pathname === '/profile' ? 'text-active' : 'text-muted hover:text-text'
              }`}
            >
              <ProfileIcon />
            </Link>

            <button
              type="button"
              data-opens-search
              onClick={openSearch}
              aria-label="Search"
              aria-expanded={searchAtTop}
              className="text-muted hover:text-text -my-3 py-3 transition-colors"
            >
              <SearchIcon />
            </button>
          </div>
            </>
          )}
        </div>
      </header>

      {showCollections &&
        portalReady &&
        createPortal(
      /*
        The collection row, at the foot of the phone screen.

        It began under the wordmark and moved here on 9 August. The reason it
        works better at the bottom is not style: this row is the only thing on a
        phone you reach for repeatedly, and the top of a handset is the part of
        it a thumb cannot get to. Everything else in the header — the mark, the
        way to your profile — is looked at rather than pressed, so the two
        halves separate cleanly by how often they are touched.

        `fixed` rather than `sticky`. Sticky would keep the bar in flow, which
        sounds like it saves the padding below — it does not, because a sticky
        element pulled up to the viewport edge still overlays whatever is under
        it. Given the padding is needed either way, fixed is the honest spelling.

        The viewport is `interactiveWidget: 'resizes-content'` (app/layout.tsx),
        so an open keyboard shrinks the layout viewport and this settles above
        it rather than under it. The capture dropdown is capped at 50dvh
        directly beneath an input that scrolls itself to the top on focus, so it
        ends around mid-screen and never reaches this.

        **Not on `/profile`** — see `showCollections` above.

        **It recedes as you scroll down**, and returns on the first movement
        back up — see `collectionsHidden`. `translate-y-full` moves it by its own
        height including the safe-area padding, so it clears the screen exactly
        whatever the device inset is, and no number here has to know about any
        other number. The `motion-reduce` rule in globals.css collapses the
        transition to nothing, which leaves the behaviour and removes the slide.

        **It holds one of two things**, and the chevron swaps them. Search is the
        default, because adding is the thing you came to do and it is now the
        only way to reach the field on a phone; the collections are one tap
        behind it. They cannot both be shown — the collection line already runs
        to within about 15px of a 375px screen, and there is no width left for a
        field beside it.

        **No rule along the top of it**, matching the header. The bar has
        `bg-bg`, so content still stops cleanly at its edge — the ground does the
        separating and the line was only naming a boundary the eye already had.
        Same argument that took the hairline out from under the wordmark: a rule
        dividing two things which are already divided is decoration, and §11 does
        not spend rules on decoration.
      */
      <nav
        aria-label="Main"
        /*
          ⚠ **No pointer handlers here since 15 August.** It carried the three
          that opened the masthead's field, because the field was in this bar and
          a tap on it had to be intercepted. The bar holds only the collections
          now — search is a glyph in the masthead and opens from there — so the
          links in here are their own answer, the way links are everywhere else.
        */
        /*
          `transition-[translate]` rather than `transition-transform`, still. The
          recede slide writes `translate` and wants its 300ms; nothing writes
          `transform` here any more, and naming the one property keeps it that
          way — a later `transform` would be animated by accident under the
          shorthand, which is exactly how the bar once ended up visibly chasing
          a keyboard.
        */
        /*
          ───────────────────────────────────────────────────────────────────
           The inset, less a centimetre of it (11 August)
          ───────────────────────────────────────────────────────────────────

          This was the whole of `env(safe-area-inset-bottom)`, which is correct
          in a browser tab and wrong installed — and installing it is what
          exposed that. In Safari the toolbar already occupies that band so the
          inset reports 0; standalone there is no toolbar, the inset becomes the
          full home-indicator reservation, and the bar rose 34px overnight. It
          read as though the address bar were still there and the app had simply
          left a gap where it used to be.

          **The indicator needs clearing, not the whole band it is quoted in.**
          It is about 5px of ink sitting about 8px off the bottom edge, so it
          occupies roughly the lowest 13px. 34 − 16 leaves 18px: the indicator
          cleared with five to spare, and sixteen given back to a bar whose only
          job is to be within reach of a thumb.

          `max(0px, …)` and not a positive floor, deliberately. On anything with
          no inset — every browser tab, every device without an indicator — this
          must come out at zero and change nothing. A floor of even half a rem
          would have lifted the bar in exactly the place it was already right.

          ⚠ **`useKeyboardPin` used to overwrite this to `0px` while a keyboard
          was open**, because the bar was being held against the keys and the
          clearance became dead space between the two. It is not held against
          anything any more — the keyboard simply covers it — so the inset stands
          at all times and nothing writes this from JS.
        */
        /*
          ⚠ **The inset is `--collections-inset` now, not written out here.**
          `/profile` has no collections and stands its *Sign out* on this exact
          line, so the number has two readers — and the whole reasoning above is
          why it is not simply `env(safe-area-inset-bottom)`. See globals.css.
        */
        className={`bg-bg rail:hidden fixed inset-x-0 bottom-0 z-20 pb-[var(--collections-inset)] transition-[translate] duration-300 ${
          collectionsHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/*
          The row is a fixed 42px, and neither state is allowed to set it.

          The two are not naturally the same height: search is an input at
          `leading-6`, so 24px of content, while the collections are `micro` —
          11px at 1.3 line-height, 14.3px. Tailwind's preflight zeroes input
          padding and borders, so those two numbers are the whole of it. Against
          a bar pinned to `bottom-0`, a 9.7px difference in content height moves
          the whole row as you toggle.

          **42px is the collections height**, which is the one asked for: the
          28px this row used to carry as `py-3.5` plus that 14.3px line. Search
          is the taller state and now centres inside it rather than growing it,
          which is the right way round — the field is the thing with slack in it,
          and 24px of line-height in 42px still clears a 16px face comfortably.

          The padding had to go with it. `min-h` on a border box is satisfied by
          padding alone, so `min-h-6` against `py-3.5` was a no-op: 24px of
          minimum against 28px of padding never binds, and the height stayed
          content-driven. Height and padding cannot both set this; the height
          does, and the centring replaces the padding.

          `min-h` rather than `h` so nothing is ever clipped — at 320px the
          collections wrap to two lines, which comes to 38.6px and still fits
          inside the 42px, but if a label is ever added it grows rather than
          cutting one off.
        */}
        {/*
          There was a screen-tall black panel here, hung below the bar to hide
          any gap between it and a keyboard still animating in. **Removed
          10 August: it made a small fault into a large one.**

          It only ever covered the keyboard's own area, which is invisible — as
          long as the bar was where it should be. The moment the bar was not,
          the panel came with it and drew a sheet of black across the results.
          A brief gap under the bar is a blemish; a screen of the page hidden
          behind an opaque rectangle is a broken app, and the second failure was
          the price of insuring against the first.

          ⚠ **That advice was taken, and it failed the same way.** This note
          used to end by asking for the panel back, bounded to a plausible
          keyboard height so the worst case stayed small; `6fadfa8` built exactly
          that on 11 August as a `box-shadow`, and it was removed on 14 August
          after two handset reports. The full record is where the function was —
          see the note in place of `groundFor` at the top of this file. **The gap
          is accepted now. Do not fill it a third time.**
        */}
        {/*
          ⚠ **There was a chevron here that toggled this row between a search
          field and the collections. Both it and the field are gone — 15 August.**
          The bar holds one thing now, so there is nothing to toggle and nothing
          to name: search moved to a glyph in the masthead, where it costs one tap
          rather than two and does not have to share a 375px line with four
          labels. See the note where `barMode` used to be.

          The row keeps its 42px. It was a fixed height because the two states
          were not naturally the same one; with a single state it could be left to
          the content, and is not — the collections wrap to two lines at 320px and
          the height is what keeps that from moving the bar under a thumb.
        */}
        <div className="gutter flex min-h-[var(--collections-row)] items-center">
          {/*
            Dotted, not spaced. Labels separated by gaps alone read as loose
            words; a `·` between them makes one line of navigation, which is
            what it is — and it is the same separator the entry rows use
            between a title and its year, so the app has one way of saying
            "and then this".

            **The counts come off here**, and that is most of what makes the
            line fit. The four labels come to about 236px at the caption size
            and the gaps to 48px, against the ~335px a 375px handset leaves
            after the gutter — with more room again now that the chevron and its
            `gap-2` have gone with the field. Four counts would add another 80px
            and put it back over. The rail has two edges to hang a label and a
            numeral from; a single line has one, so the count is the thing that
            gives.

            `flex-wrap` with `justify-center` is kept for 320px, where it is
            still tight. The padding under `main` clears two lines for exactly
            that reason: content hidden behind a fixed bar is a worse failure
            than a little dead space above it.
          */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-2.5">
            {/*
              ⚠ **The house is a member of this line, not furniture beside it —
              directed 18 August, and it is the third arrangement in a day.** It
              went in as a flex sibling with an equal spacer opposite, which cost
              the row 64px and wrapped it to two lines; then out of the flow in an
              overlay, which cost nothing but left it standing apart from the thing
              it belongs to. Asked for plainly: **a dot after it, and the whole
              row — house included — centred.**

              That is what this is, and it is the simplest of the three: the house
              is the first item, a `Dot` follows it exactly as one follows every
              other pair, and `justify-center` centres what is now one line of
              navigation. Nothing is positioned, nothing is spaced against
              anything, and there is no second copy of the gutter.

              It also costs the line the least of the three arrangements that keep
              the house visible: 14px and one dot, against 20px plus a 20px spacer
              plus two gaps.

              ⚠ **The house never takes `--color-active`.** Red is the profile
              glyph's convention in the masthead; this row says *here* with
              full-strength text, and `CollectionLink` beside it does the same.
              One row, one signal.
            */}
            <Link
              href="/"
              aria-label="Home"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`tap-target -my-3 shrink-0 py-3 transition-colors ${
                pathname === '/' ? 'text-text' : 'text-muted hover:text-text'
              }`}
            >
              <HomeIcon />
            </Link>
            <Dot />

            {COLLECTION_LINKS.map((link, i) => (
              <Fragment key={link.href}>
                {i > 0 && <Dot />}
                <CollectionLink
                  {...link}
                  count={counts[link.view]}
                  active={pathname === link.href}
                  layout="inline"
                />
              </Fragment>
            ))}
          </div>
        </div>
          </nav>,
          document.body,
        )}

      {/*
        `min-w-0` so a long film title makes the column narrower rather than
        pushing the rail off the screen. `flex flex-col` so a page can push
        something to the foot of the viewport — `/profile` is the one that does.

        The bottom padding is a variable rather than an inline style, because it
        has to differ by width *and* by page: it exists only to clear the fixed
        collection bar. 6rem covers a bar that has wrapped to two lines at 320px,
        which is deliberately more than the ~48px it usually occupies — the cost
        of overshooting is dead space below the last row, the cost of
        undershooting is a row you cannot read.

        It drops back to 2rem on `/profile` below the breakpoint, where there is
        no bar at all. That page is composed around its own bottom-left corner,
        so 6rem of clearance for a bar that is not there would leave the handle
        and *Sign out* floating well above the fold of the screen they are meant
        to sit in.

        **At rail widths it is 6rem too, and that was 2rem until 10 August.**
        There is no collection bar up there, which is what the 2rem was reasoning
        about — but there is a fixed search row at the foot of the same column,
        and it is about 84px tall: 24px of `pt-6`, a 24px field, 36px of `pb-9`.
        2rem of clearance is 32px, so the last row of a list or the last rank of
        posters sat under it and could not be scrolled clear. 6rem clears 84 with
        room to spare, and it is the number the phone already uses.

        It applies on `/profile` at rail widths as well, deliberately: the search
        row is fixed to the viewport and does not know which page is under it, so
        the corner that page is composed around is exactly the corner the row
        covers.

        `safe-bottom` adds the home-indicator inset on top of whichever applies.

        **The top padding is the header plus the gap**, and it has to be, because
        the header is `fixed` and holds no space open itself.

        **The whole term is `--masthead-clearance`**, and it stopped being
        spelled out here on 16 August. It was the same expression as the token —
        the notch, `--masthead-gap`, the mark's ink, `--masthead-gap`, the hem —
        written a second time in a second file, which is one edit away from two
        files disagreeing about how tall the masthead is. The home wall's caption
        pulls itself up by the same quantity, so there would have been three.

        `--wordmark-ink` is the measured inked height as a fraction of
        `--text-wordmark`; see globals.css for the measurement and for the warning
        that the fraction is a property of the *word*, not of the size.

        **It was three different literals in eight days** — 3.375rem for `again`,
        2.9375rem for the caps pass and again for `need`, 2.125rem-worth of
        argument in between — and each one was a fact about a typeface written
        down in a component, needing a hand edit nobody would remember to make.
        The type size then changed on 15 August, hours after the last of them,
        which is exactly the failure the expression removes.

        ⚠ **It used to run about 10px generous and now does not.** Measured at
        390px before this: the header reported 44.02px against the 54 the literal
        claimed, because the row's height was whatever its tallest child happened
        to be — `wordmark`'s `line-height: 1` wins over `wordmark-trim`'s
        `1.2778`, so the mark's box is never the size the trim intends and the ink
        overhangs it at each end. Giving the row its own `--wordmark-ink` closes
        the gap.

        **The gap under the mark is `--masthead-hem`, and it is the same token as
        the header's shadow.** They have to be equal — the shadow is what keeps
        the distance identical once the page scrolls and content starts passing
        under the mark — and since 16 August they are equal by being one number
        rather than by being remembered. **Nothing here moves separately** from
        the header's own paddings any more; this whole padding is two tokens.

        The notch inset is added rather than folded in, because it is clearance
        rather than height and varies by device — it is inside
        `--masthead-height`, at the point where the header spends it too.

        Written as literals rather than as the constants above because Tailwind
        reads class names as text: a template value here would compile to
        nothing, and a padding that silently resolves to zero is precisely the
        failure this file has already had once today.

        It is also, deliberately, a bigger gap than the 10px above the mark. That
        symmetry was an earlier request and it did not survive contact: the space
        above the mark is dead air against a status bar, while the space below is
        a lane things move through. Collapsing it to 10px is what made the
        descender look met by the posters, and the slack is what fixed it.

        Above the breakpoint there is no header at all, so `rail:pt-10` overrides
        the lot — which is why this is an arbitrary class rather than an inline
        style, since an inline style would win against the breakpoint.

        `rail:pt-10` rather than `py-10`: `padding-block` would set the bottom
        too, and the bottom belongs to `safe-bottom` at every width. Two rules
        writing one property is how a spacing bug survives a fix.
      */}
      {/*
        `isolate` — `isolation: isolate` — is not styling. It gives `main` its own
        stacking context so nothing inside it can paint above the sticky header,
        whatever the compositor decides to do.

        Added 9 August after a report that the posters overlapped the wordmark's
        descender *only after a pull-to-refresh*, having been correct on first
        paint at the same scroll position. Spacing does not change between two
        paints of the same layout — measured in a browser, the descender clears
        by ~10px — so the cause is compositing rather than geometry, and
        pull-to-refresh is exactly when iOS Safari tears down and rebuilds layers.

        Without a stacking context here, `main`'s contents sit in the root one
        alongside the header. The header's `z-20` should still win, and does
        everywhere it can be measured — but a promoted image layer is free to be
        composited out of document order, and images are what get promoted.
        Nothing inside `main` sets a `z-index`, so this changes no intended
        painting; it only removes the freedom to get it wrong.
      */}
      <main
        className={`gutter safe-bottom rail:max-w-3xl rail:pt-10 isolate flex w-full min-w-0 flex-1 flex-col pt-[var(--masthead-clearance)] ${
          /*
            ⚠ **`/profile`'s floor is the collections bar's floor**, expressed
            through the base rather than by a second rule writing
            `padding-bottom` — two rules on one property is how a spacing bug
            survives a fix, which is already the note above.

            `safe-bottom` adds `env(safe-area-inset-bottom)` in full, and the bar
            deliberately clears only the indicator inside it, so the base is
            whatever cancels the difference: on a 47px inset it comes to −16px and
            the total to 31px, and where there is no inset both terms are zero and
            nothing moves. That lands *Sign out* on the line the four labels
            vacate, instead of 2rem above it.
          */
          /*
            Named utilities rather than a pair of arbitrary properties. Two
            declarations of one custom property at equal specificity are resolved
            by their order in the compiled stylesheet, which a class attribute
            cannot state — so both states live in CSS, where the `rail:` override
            is nested inside the utility it overrides. Measured at both widths:
            21.01px from the foot on a phone, 47.15px above `rail`, which are the
            collections' line and the rail's own line respectively. See
            `foot-collections` / `foot-bare` in globals.css.
          */
          showCollections ? 'foot-collections' : 'foot-bare'
        }`}
      >
        {/*
          **Searching replaces the page, it does not open a list over it.**

          Typing swaps whatever collection or wall you were looking at for a wall
          of what matched, in the same grid, at the same size, tapping to the same
          intent sheet. A dropdown would have been less work and a worse answer:
          this app's home screen is already a wall of posters you pick from, and a
          search that produced a different *kind* of thing would have made finding
          a film by name feel unlike finding one by looking.

          It replaces the content on every route rather than only on Home. The
          alternative was navigating to `/` first, which would lose your place in
          a collection to run a search you might abandon in two keystrokes.
          Escape, or emptying the field, puts the page back.

          `results` is empty until the query passes the provider's minimum, so a
          single character shows the page rather than an empty wall.

          **It keeps going.** `onReachEnd` pulls the next twenty as the foot of
          the wall approaches, up to TMDB's own ceiling of five hundred pages —
          see `loadMore`. Only search pages: the cinema listing is what is on and
          what is coming, which is a set rather than a stream.
        */}
        {/*
          **A search that failed does not say "Nothing by that name."**

          It did until 10 August: every non-2xx became zero results, and zero
          results is a sentence about the film. A rate limit is the one that
          matters — it arrives while someone is typing fast, and the advice it
          silently gave was "that one does not exist, try another", which spends
          the budget that just ran out. See `SearchFailure`.

          The retry sits under the wall rather than inside it. `PosterWall` is
          silent artwork by instruction, with no spinner and no caption; a line
          that appears only when something is broken is a different thing from a
          mechanism announcing itself, but it is still not the wall's business.

          Not offered for `signed-out`, where trying again does the same thing
          again — the message is the action there.
        */}
        {searchActive ? (
          failure && results.length === 0 ? (
            /* Nothing came back at all, so the notice is the whole screen. */
            <SearchFailureNotice failure={failure} retryAfter={retryAfter} onRetry={retry} />
          ) : (
            <>
              <PosterWall
                films={results}
                empty={searching ? 'Looking…' : 'Nothing by that name.'}
                onReachEnd={loadMore}
              />
              {/*
                A page failed under a wall worth looking at. The notice goes
                below it, where the next twenty would have appeared.
              */}
              {failure && <SearchFailureNotice failure={failure} retryAfter={retryAfter} onRetry={retry} />}
            </>
          )
        ) : (
          children
        )}
      </main>
    </div>
    </div>
  )
}

/**
 * One search dock, and the untransformed twin that says where it rests.
 */
type SearchDock = {
  /** The element to move. */
  el: React.RefObject<HTMLElement | null>
  /**
   * A zero-size element with the dock's positioning and nothing else. Both wear
   * the dock's breakpoint, so a hidden dock has a hidden anchor and the pair is
   * either laid out together or not at all.
   */
  anchor: React.RefObject<HTMLElement | null>
}

/**
 * Holds whichever search dock is on screen on the top edge of an open keyboard,
 * and holds the foot of the page above it.
 *
 * ⚠ **Only the rail's dock is passed to this now (15 August), and the second job
 * is the one that still runs everywhere.** Below `rail` the field moves to the
 * masthead to be typed in — see `searchAtTop` — so nothing is docked where a
 * keyboard lands and `measure()` finds no laid-out dock to hold. `floor()` does
 * not care which layout is up: a keyboard covers the foot of a phone's results
 * wall whether or not anything is sitting there, and `--keyboard-overlap` is
 * what makes the last row reachable.
 *
 * **Two jobs, because they are one measurement.** Both need the bottom edge of
 * the visible area, and both need re-reading on the same five events; splitting
 * them would mean a second copy of every listener to answer the same question
 * twice a frame. See `floor` below, and `safe-bottom` in globals.css.
 *
 * **The symptom this exists for**: with the keyboard up and a wall of results to
 * scroll, the bar vanished and came back only at the very bottom of the results.
 * That is not a hidden bar, it is a bar parked out of sight. iOS positions
 * `fixed` against the *layout* viewport, which stays the full height of the
 * screen while the keyboard covers the bottom of it — so `bottom-0` sits behind
 * the keyboard, and it only scrolls into view when the visual viewport reaches
 * the foot of the layout one, which is the foot of the document. A page with
 * nothing to scroll never showed the fault.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It measures, it does not calculate — and that is the point (10 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Five versions of this computed the lift from viewport arithmetic, and every
 * one of them was wrong on a real handset in a different way: the bar rode up
 * on scroll, or stuck above the keyboard, or sat behind it, or dragged a screen
 * of black over the results. Each fix was a better guess at what iOS means by
 * `innerHeight`, `clientHeight` and `offsetTop` with a keyboard open, and each
 * guess was falsified by the next test.
 *
 * The guessing is what was wrong, not any particular guess. **Safari may anchor
 * a `fixed` element to the layout viewport or to the visual one, and this no
 * longer needs to know which**, because it reads the position back off the
 * element instead of predicting it:
 *
 *     error = rect.bottom − vv.offsetTop − vv.height
 *     lift −= error
 *
 * Under either behaviour the measurement is of what actually happened, so the
 * correction is right in both. Where the old formula was a model of the
 * browser, this is a thermostat.
 *
 * It settles in one frame — `transform` does not affect layout, so the next
 * `getBoundingClientRect` already includes it and the error reads zero.
 *
 * **Written straight to the element rather than through state.**
 * `visualViewport` emits `scroll` continuously while a finger is down, and a
 * re-render per event is how a list starts dropping frames while it is read.
 * Nothing else needs the number.
 */
function useKeyboardPin(
  focused: boolean,
  /**
   * Where `--keyboard-overlap` is written. Not a scroller since 13 August — it
   * is the element the property has to inherit from, and nothing more.
   */
  host: React.RefObject<HTMLElement | null>,
  /** A zero-height fixed twin on the viewport's bottom edge — see `floor`. */
  floorAnchor: React.RefObject<HTMLElement | null>,
  docks: SearchDock[],
) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!focused || !vv) return

    let frame = 0
    let until = 0

    /*
      Captured for the cleanup rather than read from the ref there, which would
      be reading it after React may have pointed it somewhere else. `floor`
      below still reads the ref live, because it runs while the effect is
      current and the freshest value is the right one.
    */
    const hostEl = host.current

    const rest = (dock: SearchDock) => {
      const el = dock.el.current
      if (!el) return
      el.style.transform = ''
    }

    const measure = () => {
      frame = 0

      /*
        **Which dock, asked of the DOM rather than of a media query.**

        The breakpoint that chooses between them lives in a Tailwind variant,
        and JS cannot read a variant — only re-state it, as a number free to
        drift from the one in globals.css. `getClientRects()` is empty for a
        `display: none` element and not for a laid-out one, which is the same
        question asked of the thing that actually answers it. It costs a rect
        per dock per frame, on a path that is already measuring one.
      */
      const all = docks
      const shown = all.find((d) => (d.el.current?.getClientRects().length ?? 0) > 0)

      /*
        Anything not on screen goes back to rest. Without this, turning a phone
        sideways mid-search would leave the bar holding the transform it needed
        in portrait, waiting to be turned back and found halfway up the screen.
      */
      for (const dock of all) if (dock !== shown) rest(dock)
      if (!shown) return

      const el = shown.el.current
      const anchor = shown.anchor.current
      /*
        A `display: none` anchor measures as all zeros, and a lift computed from
        that is the height of the screen. The pair share a breakpoint so this
        should not happen; it is cheap to be sure, because the failure is the
        dock leaving the screen entirely.
      */
      if (!el || !anchor || anchor.getClientRects().length === 0) return

      /*
        `bottom-0` is not where the browser puts `bottom-0`, so ask it.

        The anchor is a zero-size element with the dock's exact positioning and
        nothing else — no transform, no recede, no padding. Wherever it has
        ended up *is* where an untouched fixed element sits on this device at
        this instant, including whatever iOS has done to it, and the dock needs
        the difference between that and the bottom of the visible area.

        **Measured off the anchor rather than off the dock** because the phone's
        bar carries its own recede — a `translate` of one bar-height,
        mid-animation for 300ms of it. Reading the bar meant reading that too,
        and correcting it away: the hide was being cancelled by the pin, which
        is why the bar stayed on screen and drifted instead of leaving.
      */
      /*
        **Not clamped.** It was `Math.min(0, …)` — "only ever lift, never push
        down" — which sounds safe and threw the fix away.

        Measured on the device: keyboard open at rest gives `anch.b 660`,
        `vv.h 389`, so the correction is −271 and the bar lands right. Scroll
        down and the anchor drifts up with the page, so by 300px of scroll the
        correction wanted is *positive* — the bar has to be pushed back down to
        stay level with the keyboard. The clamp discarded exactly that, which is
        why the bar floated mid-results from a few hundred pixels in.
      */
      const lift = vv.offsetTop + vv.height - anchor.getBoundingClientRect().bottom

      /*
        ⚠ **There was a guard here holding a pre-lift in place, and it went with
        the pre-lift (15 August).** While a remembered keyboard height existed,
        a measured lift of zero could mean either "the dock is where it should
        be" or "no keyboard has turned up yet", and this preferred the second
        reading for the length of the arrival window — otherwise the thermostat
        wrote `transform = ''` one frame after the pre-lift and undid it every
        time. Nothing pre-lifts now, so zero means the one thing it says.
      */
      el.style.transform = lift ? `translateY(${lift}px)` : ''
    }

    /*
      **The floor of the page, held above the keyboard — see `safe-bottom`.**

      **iOS does not shrink the layout viewport for a keyboard** — it ignores
      `interactive-widget: resizes-content`, see app/layout.tsx. So the foot of
      the page is behind the keys, and at maximum scroll the last row of a long
      list is parked in there with no range left to lift it out. Reported on the
      handset the moment the document stopped scrolling: the document scrolling
      had been supplying the missing distance all along, as a side effect of the
      fault it caused everywhere else.

      ⚠ **Still needed now the document scrolls again (13 August), which reads
      as though it should not be.** What used to supply the distance was the
      range iOS *invented* to reveal a focused field, and iOS no longer invents
      it — the dock is lifted clear before it decides. A flowing document's real
      range is content minus layout viewport, and the keyboard is over the bottom
      of that either way.

      ⚠ **Measured against `floorAnchor`, not against the page's own box.** Until
      13 August this read the bottom edge of `#scroll-root`, which was the
      viewport's bottom only because that element was `fixed inset-0`. In the flow
      its bottom is the bottom of the *content* — usually far below the screen —
      and the overlap would come out as most of the page.

      Measured, like the pin above, rather than derived from `innerHeight` or
      `clientHeight`: the distance between a fixed twin on the viewport's bottom
      edge and the bottom of what can be seen is the answer whatever iOS thinks
      those two numbers mean, and it is zero when there is no keyboard.

      Written as a custom property rather than as `paddingBottom`, because the
      elements that need it already have a padding rule with two other terms in
      it. Setting the property adds a third; setting the padding would replace
      all three and drop the home-indicator inset on the floor.
    */
    const floor = () => {
      const box = host.current
      const edge = floorAnchor.current
      if (!box || !edge) return
      const overlap = Math.max(0, edge.getBoundingClientRect().bottom - (vv.offsetTop + vv.height))
      box.style.setProperty('--keyboard-overlap', `${Math.round(overlap)}px`)

      /*
        ⚠ **This used to be written down for the next tap, and it is not any
        more (15 August).** The number was kept in a module variable and in
        `localStorage`, always the largest ever seen, so that a field about to be
        focused could be moved clear of a keyboard that did not exist yet. Nothing
        needs to predict a keyboard now — see the note where `lastKeyboardOverlap`
        used to be — so the measurement is used where it is taken and nowhere
        else. There is no stored value left to go stale, and `again:keyboard-overlap`
        can be deleted from storage by anyone who still has one; nothing reads it.
      */
    }

    /*
      ─────────────────────────────────────────────────────────────────────────
       One frame for an event, every frame for an animation (11 August)
      ─────────────────────────────────────────────────────────────────────────

      **Measured: `ERR` peaked at −333 on the handset** — a full keyboard-height
      below the visible area, which is the bar sitting at its resting position
      with the keys already drawn over it. That is the pin arriving late, not
      arriving wrong: `ERR` settled at 0 immediately after.

      A correction scheduled from an event is always one frame behind the event,
      and a keyboard is not an event — it is a three-hundred-millisecond
      animation that reports its progress in steps. Correcting once per step
      means the bar is visibly chasing it up the screen, which is the same
      complaint this hook's own note says five earlier versions produced by
      arithmetic.

      So a viewport change now holds the loop open for the length of the
      animation and re-measures every frame, while a scroll — genuinely a
      discrete event — still costs exactly one.
    */
    const run = () => {
      measure()
      floor()
      frame = performance.now() < until ? requestAnimationFrame(run) : 0
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }

    const hold = () => {
      until = performance.now() + KEYBOARD_ARRIVAL_MS
      schedule()
    }

    /* The effect itself re-runs on focus, which is the keyboard being asked for. */
    hold()

    /*
      **The window's scroll, which since 13 August is the only one there is.**

      There were two listeners here, this one and one on `#scroll-root`. That
      element no longer scrolls, so its listener watched the one thing guaranteed
      not to happen — which is, word for word, what this comment used to say
      about the window before 11 August measured it wrong. The mistake is
      symmetrical and worth keeping on the page: **subscribe to what moves, and
      check which one that is rather than reasoning about it.**

      This is the backstop, and it is now the only guard of its kind — the clamp
      it used to sit beside is deleted. It reads the dock's real position and
      corrects whatever displaced it without needing to know what did. A
      thermostat does not care why the room got cold, which is exactly why it
      survives a change of cause.

      `resize` and `orientationchange` are here because the choice of dock is a
      breakpoint away, and turning a handset sideways crosses it with a keyboard
      still open.
    */
    window.addEventListener('scroll', schedule, { passive: true })
    /* The three that mean "something is animating", not "something happened". */
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    return () => {
      window.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', hold)
      vv.removeEventListener('scroll', hold)
      window.removeEventListener('resize', hold)
      window.removeEventListener('orientationchange', hold)
      if (frame) cancelAnimationFrame(frame)

      /* Back to the resting position the moment the keyboard is not there. */
      for (const dock of docks) rest(dock)
      /*
        And the floor with it, or every page keeps a keyboard's worth of dead
        space under it for the rest of the session.
      */
      hostEl?.style.removeProperty('--keyboard-overlap')
    }
  }, [focused, host, floorAnchor, docks])
}

/**
 * A search that did not work, and the way to ask again.
 *
 * **Deliberately outside `PosterWall`.** The wall is silent artwork by
 * instruction — no spinner, no "loading more", nothing announcing a mechanism
 * whose job is to go unnoticed. A line that appears only when something is
 * broken is a different kind of thing, but it is still not the wall's business,
 * and keeping it out means the wall did not have to learn about failure to say
 * so.
 *
 * **Being signed out gets a link, not a retry.** Pressing *Try again* against a
 * 401 fails the same way every time, so the control has to be the thing that
 * actually fixes it — and telling someone to sign in without giving them the
 * door is the version of this that gets abandoned. Everything else is worth one
 * more attempt: a rate limit expires, and an unreachable upstream usually is not.
 *
 * Not `text-active`. Red is the wrong register here and it is spoken for; §11's
 * scarcity rule is about the accent, and the same argument holds for the second
 * colour in the app. A failure that recovers on a tap is not an alarm.
 */
function SearchFailureNotice({
  failure,
  retryAfter,
  onRetry,
}: {
  failure: SearchFailure
  retryAfter: number | null
  onRetry: () => void
}) {
  const action = 'text-text hover:text-muted tap-target underline underline-offset-4 transition-colors'

  return (
    <p className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 py-10 text-sm">
      {failureText(failure, retryAfter)}
      {failure === 'signed-out' ? (
        <Link href="/sign-in" className={action}>
          Sign in
        </Link>
      ) : (
        <button type="button" onClick={onRetry} className={action}>
          Try again
        </button>
      )}
    </p>
  )
}

/**
 * The separator in the phone collection row.
 *
 * A sibling rather than a `::before` on each link, so it never sits inside a tap
 * target — the links carry `tap-target`, which expands their hit area to 44px,
 * and a dot inside that expansion would be swallowed by it. `select-none` so
 * dragging across the row to copy a collection name does not pick the dots up.
 */
function Dot() {
  return (
    <span aria-hidden className="text-micro text-muted select-none opacity-50">
      ·
    </span>
  )
}

/**
 * One collection, in either of the two places collections are listed.
 *
 * `rail` gets the count: the column has two edges to hang a label and a numeral
 * from, so the count costs nothing. `inline` does not, because a single line
 * across the top of a phone has no second edge and no width to spare — see the
 * nav above for the arithmetic.
 *
 * The count is mono because it is data — §11 keeps that face scarce and spends
 * it on numerals and timestamps, and a collection size is exactly that.
 *
 * **A zero renders as nothing.** An empty collection is already saying so with
 * its empty state; four grey zeroes down the rail of a new account is the app
 * announcing that it is empty four times before you have done anything.
 */
function CollectionLink({
  href,
  label,
  count,
  active,
  layout,
}: {
  href: Route
  label: string
  count: number
  active: boolean
  layout: 'rail' | 'inline'
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`micro tap-target flex items-baseline gap-2 transition-colors ${
        layout === 'rail' ? 'justify-between' : ''
      } ${active ? 'text-text' : 'text-muted hover:text-text'}`}
    >
      <span>{label}</span>
      {layout === 'rail' && count > 0 && (
        <span className={`font-mono tabular-nums ${active ? 'text-muted' : 'opacity-60'}`}>
          {count}
        </span>
      )}
    </Link>
  )
}
