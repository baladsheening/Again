'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { authClient } from '@/lib/auth-client'
import type { OwnerView } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'
import { ChevronIcon } from './icon-chevron'
import { HomeIcon } from './icon-home'
import { ProfileIcon } from './icon-profile'
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
 * The keyboard's height, as measured the last time one was open.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why a remembered number is worth more than a measured one here
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The bump on tapping the field is iOS moving the web view, not the page.**
 * Measured on the handset, installed: the wordmark, the header icons and the
 * poster wall all move together — so `position: fixed` elements move — while
 * every quantity the page can see holds still. `scrY 0`, `docT 0`, `vv.t 0`,
 * `sTop 0`, and the wall's client rect pinned at 109 through the whole focus.
 * Nothing inside the document can move a fixed element without moving one of
 * those, so the movement is happening underneath the page's own coordinate
 * system, where nothing here can observe or undo it.
 *
 * It is standalone keyboard avoidance. The focused field sits at the foot of a
 * 797px layout viewport, the keyboard covers the bottom 333 of it, so UIKit
 * lifts the view to reveal the field. `useKeyboardPin` then raises the bar clear
 * of the keys, the field is no longer covered, and iOS puts the view back —
 * which is the drop. **The bump and the drop are iOS reacting to us, one beat
 * apart**, and three attempts to correct the movement failed because there was
 * never anything on this side to correct.
 *
 * So the answer is to leave it nothing to reveal: the bar has to be clear of the
 * keyboard *at the instant of focus*, before the keyboard has arrived and
 * therefore before it can be measured. The only number available that early is
 * the one from last time — and a keyboard's height does not change between two
 * taps of the same field on the same device.
 *
 * **Confirmed on the handset, 11 August**: with the lift applied at
 * `pointerdown` and focus called by hand — see `onDockPointerDown` — the second
 * tap of a launch was smooth and the clamp counted zero document scrolls. The
 * first tap bumped only because nothing was remembered yet, which is what the
 * persistence removes: the height survives launches in `localStorage`, so it is
 * known from the first tap of every session after the very first.
 *
 * It only ever grows — the larger of memory and measurement, mirrored to
 * storage. The two directions of error cost differently: remembering too little
 * reproduces the native bump this exists to prevent, remembering too much parks
 * the bar a touch high for the few frames before the real measurement lands.
 * Growth is the cheap side.
 */
let lastKeyboardOverlap = 0

const OVERLAP_KEY = 'again:keyboard-overlap'

/**
 * The ground a lifted dock stands on, as a `box-shadow` value.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why the gap needs dressing at all
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The bar reaches its lifted position instantly and the keyboard takes about
 * three hundred milliseconds to arrive, so for that beat there is a strip of
 * poster wall between the two. Reported on the handset as looking wrong even
 * though it closes itself, and it does look wrong: content appears *below* the
 * bar, which is somewhere content never otherwise lives.
 *
 * **The instant arrival is not negotiable.** The field has to be clear of the
 * keyboard before focus is granted or the native reveal scroll comes back — see
 * `lastKeyboardOverlap` — and iOS exposes no animated keyboard edge to ride up
 * with. One viewport resize is reported, when the movement has already
 * finished.
 *
 * So the strip is filled with ground instead. The keys then rise over black
 * rather than over artwork, which reads as the page ending where it in fact
 * ends the moment the keyboard is up.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  A shadow, and bounded — both deliberate
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **A shadow rather than an element**, for the reason the header's ground is one
 * (see its note): it joins no layout, adds no height, cannot swallow a tap, and
 * needs no ref threaded to it. It is painted behind the dock's own background,
 * so it can only ever extend the ground, never cover the row.
 *
 * **Offset and spread are each half the depth**, which is not a trick for its
 * own sake. A plain offset shifts the whole box down, so once the depth exceeds
 * the bar's height — 333 against about 60 — the copy detaches and leaves a band
 * of poster between. Inflating by half and shifting by half puts the shadow's
 * top edge exactly on the element's own and its bottom edge exactly `depth`
 * below: one continuous ground. The sideways inflation runs off both screen
 * edges, where there is nothing to hit.
 *
 * ⚠ **Bounded to the lift, and that is the whole safety argument.** A screen-tall
 * panel lived here until 10 August and was removed for making a small fault into
 * a large one: it only covered the keyboard's own area *as long as the bar was
 * where it should be*, and the moment it was not, it drew a sheet of black
 * across the results. Its removal note asked for exactly this — a panel bounded
 * to a plausible keyboard height, so the worst case stays small. The height is
 * no longer plausible but measured, and the bound is the lift itself, so the
 * ground can never reach further than the distance the bar has actually moved.
 *
 * Black is spelled out rather than taken from the token, for the same reason
 * the header's shadow spells it: this has to match the dock's own ground
 * exactly, and one shade off reads as a band across the screen. If
 * `--color-bg` ever moves, this moves with it by hand.
 */
function groundFor(lift: number) {
  /* A positive lift pushes the dock *down*; there is no gap under it then. */
  const depth = Math.ceil(Math.max(0, -lift))
  if (!depth) return ''
  const half = depth / 2
  return `0 ${half}px 0 ${half}px #000`
}

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
 * The remembered height, hydrated from storage on first use. Module state is
 * asked first: storage can throw and is slower, and after the first keyboard of
 * a session the module already knows.
 */
function rememberedOverlap(): number {
  if (lastKeyboardOverlap > 0) return lastKeyboardOverlap
  try {
    lastKeyboardOverlap = Number(window.localStorage.getItem(OVERLAP_KEY)) || 0
  } catch {
    // Private mode or storage denied: the first tap of a launch bumps, as before.
  }
  return lastKeyboardOverlap
}

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
    The collection bar recedes as you scroll down and comes back the moment you
    scroll up, which is the behaviour the browser's own address bar has — the
    two now move together rather than one sitting still while the other slides.

    The header does not do this. It is `sticky` and stays put, because it is the
    only thing on the screen that says where you are, and a mark that comes and
    goes reads as a rendering fault rather than as a gesture.

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
    **The pre-lift moved from focus to pointerdown, because focus is after the
    verdict.** Measured on `51d9b16`: the bar was in position through the whole
    arrival — peak `ERR` read 0 — and iOS still scrolled the document by the full
    keyboard height (`clmp 1 max 333`). If the reveal were computed from where
    the field was once the focus *event* had run, that scroll would have been
    zero. So the decision is made in the native focus machinery, before the DOM
    handler fires, and a pre-lift written there is always one verdict late.

    `pointerdown` is before any of it: the dock is lifted there, so by the time
    anything computes what needs revealing, the field is already above where the
    keyboard will land.

    ⚠ **The focus itself happens at `pointerup`, and that split is load-bearing.**
    The first version called `focus()` here, in the same handler as the lift —
    and on the handset the bump was gone *and no keyboard ever arrived*. iOS
    does not grant a keyboard for a focus arranged while the finger is still
    down; it grants one for a focus made by a completed tap. So the lift takes
    the earliest moment and the focus takes the latest one, which is also the
    order the two need anyway — style is long flushed by the time the tap ends,
    so the verdict reads the lifted rect.

    The pair stays matched across the movement because touch pointers have
    **implicit pointer capture**: every pointer event after `pointerdown` is
    delivered to the same element, even though the bar has moved 333px out from
    under the finger in between. A `click` could not be trusted for that; this
    can.

    `preventScroll` covers the separate scroll `focus()` itself can request; the
    keyboard reveal is not that scroll, which is why the option alone never
    fixed anything.

    A gesture can end somewhere other than a tap — a drag, or a cancel — and
    that would leave the bar lifted over nothing with no keyboard coming.
    `pointerup` treats real movement as "not a tap" and puts the bar back, and
    `pointercancel` puts it back unconditionally.

    ⚠ **The tap's aftermath is silenced twice, and both are needed.** For
    touch, the mouse events are dispatched *after* `pointerup`, hit-tested at
    the touch point — where the bar no longer is, because the lift moved it.
    They land on whatever sits behind: first observed as the keyboard being
    granted and taken back a beat later, then — with `pointerdown` cancelled —
    as the intent sheet opening for the poster that happened to be under the
    finger.

    Cancelling `pointerdown` suppresses the *compatibility* events, mousedown
    and mouseup, and the blur their defaults carry. But `click` is deliberately
    not one of them — the spec keeps it device-independent, firing regardless —
    so it reached the poster on its own and opened the sheet, whose arrival
    blurred the field and folded the keyboard anyway. `suppressTapAftermath`
    swallows the whole burst at the document, capture-phase, for just longer
    than it takes to arrive.

    **The whole row is the field, not just the input's own 24px box.** The
    input sits centred in a 42px row, and a tap in the strip above or below it
    has the row as its target — which fell through to the native path: iOS's
    own touch adjustment focused the input anyway, without the lift, and the
    bump came back. Observed as "it works near the bottom edge, but it bumps".
    Any non-interactive target inside the dock now counts as the field; the
    chevron and the collection links are interactive and keep themselves.

    **Touch only.** A mouse needs none of this — no keyboard, no reveal, no
    bump — and cancelling its pointerdown would break click-to-place-caret in
    a field that still holds text.
  */
  const pendingTapRef = useRef<{
    input: HTMLInputElement
    el: HTMLElement
    dropsSafeArea: boolean
    y: number
  } | null>(null)

  function restDock(el: HTMLElement, dropsSafeArea: boolean) {
    el.style.transform = ''
    el.style.boxShadow = ''
    if (dropsSafeArea) el.style.paddingBottom = ''
  }

  /** The input a tap on the dock means, or null where it means something else. */
  function dockInput(dock: HTMLElement, target: EventTarget | null): HTMLInputElement | null {
    if (!(target instanceof Element)) return null
    /* Buttons and links in the dock are their own answer — the chevron, the
       collections. Everything else in a dock is the field's furniture. */
    if (target.closest('button, a')) return null
    if (target instanceof HTMLInputElement) return target
    return dock.querySelector('input')
  }

  function onDockPointerDown(event: React.PointerEvent<HTMLElement>, dropsSafeArea = false) {
    if (event.pointerType === 'mouse') return
    const el = event.currentTarget
    const input = dockInput(el, event.target)
    if (!input) return
    if (document.activeElement === input) return
    const overlap = rememberedOverlap()
    if (overlap <= 0) return

    /* See the note above — this is what stops the synthesized mouse events
       landing behind the moved bar and blurring the focus arranged below. */
    event.preventDefault()

    el.style.transform = `translateY(${-overlap}px)`
    /*
      The ground goes down with the lift, in the same write, or the strip of
      poster it exists to cover is visible for the frame between them. Only the
      phone's bar — see the note on `dropsSafeArea` at the hook's call site.
    */
    if (dropsSafeArea) el.style.boxShadow = groundFor(-overlap)
    if (dropsSafeArea) el.style.paddingBottom = '0px'
    pendingTapRef.current = { input, el, dropsSafeArea, y: event.clientY }
  }

  function onDockPointerUp(event: React.PointerEvent<HTMLElement>) {
    const pending = pendingTapRef.current
    pendingTapRef.current = null
    if (!pending) return

    /* A finger that travelled was scrolling, not tapping. */
    if (Math.abs(event.clientY - pending.y) > 12) {
      restDock(pending.el, pending.dropsSafeArea)
      return
    }

    suppressTapAftermath()
    pending.input.focus({ preventScroll: true })

    /* If the keyboard is refused anyway, do not leave the bar lifted over nothing. */
    window.setTimeout(() => {
      if (document.activeElement !== pending.input) restDock(pending.el, pending.dropsSafeArea)
    }, 400)
  }

  function onDockPointerCancel() {
    const pending = pendingTapRef.current
    pendingTapRef.current = null
    if (pending) restDock(pending.el, pending.dropsSafeArea)
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

    **The tap has to be a tap.** A finger that travelled was scrolling a wall of
    results, and scrolling with the keyboard up is a thing people deliberately do
    — the bar recedes for it. Same 12px as the dock, and for the same reason.

    **Touch only.** A mouse click outside a field already blurs it, for free and
    with no keyboard involved; swallowing desktop clicks to reproduce that would
    break every control on the page.
  */
  const dismissTapRef = useRef<{ y: number } | null>(null)

  /** Whether a tap landed in the page itself, rather than in a portalled dock. */
  function inThePage(event: React.PointerEvent<HTMLElement>) {
    return event.target instanceof Node && event.currentTarget.contains(event.target)
  }

  function onContentPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') return
    if (!inThePage(event)) return
    /* Asked of the DOM rather than of `searchFocused`, because the question is
       "is a keyboard up", and the answer is whichever field holds the caret. */
    if (!(document.activeElement instanceof HTMLInputElement)) return
    dismissTapRef.current = { y: event.clientY }
  }

  function onContentPointerUp(event: React.PointerEvent<HTMLElement>) {
    const pending = dismissTapRef.current
    dismissTapRef.current = null
    if (!pending) return
    if (!inThePage(event)) return
    if (Math.abs(event.clientY - pending.y) > 12) return

    const field = document.activeElement
    if (!(field instanceof HTMLInputElement)) return

    /* The same swallow the dock uses, for the same burst: `click` is not a
       compatibility event and arrives whatever is done to the pointer. */
    suppressTapAftermath()
    field.blur()
  }

  function onContentPointerCancel() {
    dismissTapRef.current = null
  }

  /*
    `dropsSafeArea` is passed rather than looked up, because reaching for the
    memoised `docks` array from an event handler is enough to stop the React
    Compiler preserving that memo — and the two call sites each already know
    which dock they are.
  */
  function onDockFocus(event: React.FocusEvent<HTMLElement>, dropsSafeArea = false) {
    if (!(event.target instanceof HTMLInputElement)) return
    keyboardOpeningRef.current = true
    keyboardFocusAtRef.current = performance.now()
    setReceded({ route: pathname, hidden: false })

    /*
      **Get out from behind the keyboard before iOS notices the field is there.**
      See `lastKeyboardOverlap` for the measurement this rests on.

      Written here rather than in an effect because *here* is the focus event
      itself — the earliest moment in the browser at which anything can happen.
      An effect is a render away, and a render is a frame, and one frame is
      already too late: iOS begins its avoidance animation with the keyboard's.

      It is an estimate and it does not have to be right. `useKeyboardPin`
      measures the real position on the next frame and every frame after, so
      being a few pixels out costs nothing — the only job here is that the field
      not be *underneath the keyboard* when iOS looks. The transform written is
      the same shape the hook writes, so the hook's own correction replaces it
      rather than fighting it.

      `currentTarget` is the dock: this handler is on the dock, and the field
      that fired it is inside. No lookup, and no question of picking the one
      that is on screen — the one that took the focus is by definition it.
    */
    const overlap = rememberedOverlap()
    if (overlap <= 0) return
    const el = event.currentTarget
    el.style.transform = `translateY(${-overlap}px)`
    if (dropsSafeArea) el.style.paddingBottom = '0px'
  }

  function onDockBlur(event: React.FocusEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement) keyboardOpeningRef.current = false
  }

  /*
    Which of the two things the bar is holding. Search is the default: on a phone
    it is the only route to the field, and adding is what the app is for.
  */
  const [barMode, setBarMode] = useState<'search' | 'nav'>('search')

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
    active: searchActive,
    focused: searchFocused,
    results,
    searching,
    failure,
    retryAfter,
    loadMore,
    retry,
  } = useSearch()

  /* The page's scroller — see the note on the element itself. */
  const scrollRef = useRef<HTMLDivElement>(null)

  /*
    Keeps whichever search dock is on screen on the keyboard's top edge — see
    `useKeyboardPin`.

    **There are two docks, and a phone reaches both of them.** The bar at the
    foot is `rail:hidden` and the row above the posters is `hidden rail:flex`, so
    the breakpoint chooses; and 45rem is 720px, which most handsets clear the
    moment they are turned on their side. Pinning only the phone's bar left the
    landscape field — the one actually on screen — sitting behind the keyboard.

    Each dock carries a zero-height twin with its own positioning and nothing
    else. That is what the hook measures: see the note on `useKeyboardPin`.
  */
  const barRef = useRef<HTMLElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const railAnchorRef = useRef<HTMLDivElement>(null)

  /*
    Memoised because the hook subscribes against it: a fresh array literal every
    render would tear down and rebuild five listeners on each keystroke. Refs are
    stable for the life of the component, so there is nothing for this to depend
    on.
  */
  const docks = useMemo<SearchDock[]>(
    () => [
      /* The phone's bar wears the home-indicator inset, which a keyboard covers. */
      { el: barRef, anchor: anchorRef, dropsSafeArea: true },
      { el: railRef, anchor: railAnchorRef },
    ],
    [],
  )

  useKeyboardPin(searchFocused, scrollRef, docks)

  /*
    The bar recedes on every screen, search included.

    It used to freeze while search was in use, on the reasoning that a bar
    sliding away mid-search would take the field and the results' anchor with
    it. Directed otherwise on 10 August, and the new answer is better: with the
    keyboard up, the bar and the keys together take half the screen, and
    scrolling a wall of results is exactly when that half is wanted back. It
    returns on the first upward movement, so the field is never more than a
    flick away.
  */
  useEffect(() => {
    const scroller = scrollRef.current
    if (!showCollections || !scroller) return

    let last = scroller.scrollTop
    let frame = 0

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
        const y = Math.max(0, scroller.scrollTop)
        const now = performance.now()

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
          **Every scroll of this element counts, whoever made it.**

          Nothing is asked here about fingers any more — see the note where
          `USER_SCROLL_GRACE_MS` used to be. The only scrolls this element
          receives are ones a person made: the keyboard moves the document and
          the two scroll-to-top calls move it upward, which can only ever show
          the bar.

          Momentum therefore keeps the bar reacting for as long as the page is
          moving, in both directions, which is what the gesture always looked
          like it should do.
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
      last = scroller.scrollTop
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('resize', onViewport)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('resize', onViewport)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [showCollections, searchFocused, pathname])

  /*
    ─────────────────────────────────────────────────────────────────────────
     The document is held at zero, because iOS will not leave it there
    ─────────────────────────────────────────────────────────────────────────

    **This is the fault, measured on the handset on 11 August**, after five
    fixes that each corrected a different number. With the keyboard open the
    probe read:

        scrY 271   docT 271   vv.t 271   sTop 0   cli 660   vv.h 389

    The document had scrolled 271px — the keyboard's exact height — while the
    shell's own scroller had not moved at all. `413c1d9` states the opposite as
    its premise: *"the shell now scrolls in a viewport-sized element, scrollY
    stays zero, fixed holds."* It does not, and everything built on top of that
    sentence was correcting the wrong quantity.

    Where the 271 comes from: iOS Safari ignores `interactiveWidget:
    'resizes-content'` (see app/layout.tsx), so the layout viewport stays the
    full 660 while the visible area drops to 389. The difference is scroll range
    the browser invents out of nothing, and it scrolls into it to reveal the
    focused field. Every `fixed` element in the app is displaced by that amount:
    the search dock, and — visibly, in the diagnostic photographs — the header,
    which scrolled off the top of a screen it is pinned to.

    All three reported symptoms are this one number. The bar could not be seen;
    the first row of results was not in view; the swipe back up "had resistance"
    and the bar arrived at the moment the top was reached. That was the document
    being dragged back to zero, and everything landing when it got there.

    **Nothing in this app is laid out in the document flow.** The page lives in
    `#scroll-root`, which is `fixed inset-0`. A positive `window.scrollY` is
    therefore never something a person asked for and never something a layout
    needs — it is only ever iOS acting on its own. So this is not a chase or a
    correction; it is an invariant the design already assumed, now enforced
    rather than hoped for.

    ⚠ **Only positive offsets.** Pull-to-refresh is an *over*scroll past the top
    and reads as zero or negative, so it survives untouched — which matters,
    because it was deliberately restored on 9 August and `413c1d9` wrongly
    claimed to have cost it. It never did: the document was still scrolling, and
    that was the bug rather than the price.

    `instant` against the `scroll-behavior: smooth` on `html`. Smooth here would
    animate the correction, which is the visible slide this exists to remove.

    Resetting inside a scroll handler fires another scroll event; the second one
    reads zero and does nothing, so it settles rather than looping.
  */
  useEffect(() => {
    let frame = 0
    let until = 0

    const clamp = () => {
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' })
    }

    /*
      **Every frame, for as long as the keyboard is moving — see
      `KEYBOARD_ARRIVAL_MS`.**

      Clamping on the scroll event alone left the page visibly pushed up for the
      length of the animation, because iOS reports that scroll once at the end
      rather than as it happens. Reported from the handset on 11 August as the
      page pushing up and dropping back; the drop was the correction landing.

      A frame loop does not need to be told when the document moved. It puts it
      back before the frame is painted, so there is nothing to see.

      ⚠ **This is a browser-tab concern only, and that is now measured.**
      Installed to the home screen the document does not move at all: `scrY`,
      `docT` and `vv.t` all held at 0 through an entire focus on the handset. The
      271px scroll was Safari's, and the app is no longer usually in Safari. Kept
      because the site is still reachable in a tab, where the fault is real — but
      **do not reach for this when something moves in the installed app**, which
      is a mistake already made twice.
    */
    const pump = () => {
      clamp()
      frame = performance.now() < until ? requestAnimationFrame(pump) : 0
    }

    const hold = () => {
      until = performance.now() + KEYBOARD_ARRIVAL_MS
      if (!frame) frame = requestAnimationFrame(pump)
    }

    /*
      Focus is the earliest warning that a keyboard is coming — earlier than the
      viewport resize, which arrives once it has started moving. Both arm the
      loop, because closing the keyboard moves the document too and there is no
      focus event that reliably precedes *that*.

      `focusin` on the document rather than the field's own handler: the two
      docks each have one and this is not their business, and it costs one
      listener instead of a prop threaded to both.
    */
    const onFocusChange = (event: FocusEvent) => {
      if (event.target instanceof HTMLInputElement) hold()
    }

    clamp()
    window.addEventListener('scroll', clamp, { passive: true })
    document.addEventListener('focusin', onFocusChange)
    document.addEventListener('focusout', onFocusChange)
    /*
      The keyboard arriving is not a scroll, and on iOS the scroll it causes can
      land before or after the viewport resize. Listening to both means the
      document is put back whichever order they come in.
    */
    window.visualViewport?.addEventListener('resize', hold)
    window.visualViewport?.addEventListener('scroll', clamp)
    return () => {
      window.removeEventListener('scroll', clamp)
      document.removeEventListener('focusin', onFocusChange)
      document.removeEventListener('focusout', onFocusChange)
      window.visualViewport?.removeEventListener('resize', hold)
      window.visualViewport?.removeEventListener('scroll', clamp)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /*
    A new route starts at the top of itself.

    **This used to be free and stopped being so on 10 August.** Next's own scroll
    handling moves the *document*, and the shell now scrolls in `#scroll-root`
    instead — so navigation left the new page at whatever offset the last one was
    at. Three screens into Wants, tapping Archive put you three screens into
    Archive, which reads as the app having lost your tap rather than as a scroll
    position.

    The bar comes back on its own, and not because of anything here — see
    `receded` above, which is scoped to the route it was hidden on.

    `instant` against the `scroll-behavior: smooth` on `html`, for the reason the
    search field's reset gives: animating a journey nobody took is a lurch.

    It costs restoring the position on Back, which was already lost — Next
    restores the document, and the document has not moved since this became a
    nested scroller.
  */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

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
       The page scrolls in here, not in the document (10 August)
      ─────────────────────────────────────────────────────────────────────────

      **This is what makes the keyboard case behave like the keyboard-down
      case**, rather than being approximated by it.

      iOS stops honouring `position: fixed` while the software keyboard is open
      *and the document scrolls*: the bar is dragged along by the page, so it
      has to be chased, and chasing is always a frame behind.

      The keyboard is not the removable condition. The document scrolling is.

      ⚠ **Moving the page in here did not, on its own, stop the document
      scrolling — measured 11 August.** This block used to claim that a
      viewport-sized scroller "keeps `scrollY` at zero forever". It does not:
      iOS invents scroll range from the gap between the layout viewport and the
      visible area, whatever the document contains. `scrollY` read 271 with the
      keyboard open. The full reading is on the clamp effect in `Shell`, which
      is the part that actually holds `scrollY` at zero — this element and that
      effect are two halves of one fix, and neither works alone.

      The posters are the only things in this scroller. The search docks and
      their measuring anchors are portalled to `document.body`. That was done on
      the theory that an overflow scroller can drag a fixed descendant with it;
      the probe has since shown `capt —` and `par body`, so no ancestor was ever
      capturing anything. **The portals are kept anyway** — they are correct, and
      they take the docks out of a box whose height is not the visible height.

      ⚠ **It was said to cost pull-to-refresh. It never did.** The claim was that
      a document which never scrolls cannot be pulled past its top — but the
      document was still scrolling, which was the bug rather than the price, and
      the gesture kept working throughout. The clamp only ever pushes *positive*
      offsets back, so the overscroll past the top is untouched.
    */
    <div
      id="scroll-root"
      ref={scrollRef}
      onPointerDownCapture={onContentPointerDown}
      onPointerUpCapture={onContentPointerUp}
      onPointerCancelCapture={onContentPointerCancel}
      className="fixed inset-0 overflow-y-auto"
    >
    <div className="rail:pl-68 mx-auto flex min-h-full w-full max-w-6xl flex-col">
      {/*
        The two references for `useKeyboardPin`. Each carries its dock's
        positioning and nothing else — no transform, no recede, no padding — so
        it reports where an untransformed fixed element actually lands on this
        device. Zero size, no paint, no hit area: they exist to be measured.

        They wear their dock's breakpoint too, so exactly one of them is ever
        laid out, and the hook picks the pair that is.

        The second hangs off `top-0` and `h-svh` rather than `bottom-0` — see the
        rail dock itself for why — so its resting edge is not the same line as the
        bar's, and it needs a twin of its own shape rather than a share of that
        one.

        **Portalled with their docks**, or they would be measuring a box the
        docks are no longer in.
      */}
      {portalReady &&
        createPortal(
          <>
            <div
              ref={anchorRef}
              aria-hidden
              className="rail:hidden pointer-events-none fixed inset-x-0 bottom-0 h-0"
            />
            <div
              ref={railAnchorRef}
              aria-hidden
              className="rail:block pointer-events-none fixed top-0 hidden h-svh w-0"
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
      */}
      {portalReady &&
        createPortal(
          <div
            ref={railRef}
            onPointerDownCapture={onDockPointerDown}
            onPointerUpCapture={onDockPointerUp}
            onPointerCancelCapture={onDockPointerCancel}
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
      <header className="bg-bg rail:hidden fixed inset-x-0 top-0 z-20 pt-[calc(env(safe-area-inset-top)_+_var(--masthead-gap))] shadow-[0_0.5rem_0_0_#000]">
        <div className="gutter flex items-center justify-between pb-[var(--masthead-gap)]">
          {/*
            `wordmark-trim` contains the descender so it cannot reach what
            follows, and takes back the diacritic space "again" never uses, so
            the element's outer box is the inked bounds. The measurements, and
            what to change if the mark's case moves again, are on the utility in
            globals.css.
          */}
          <Link href="/" className="wordmark wordmark-trim text-wordmark">
            Again
          </Link>

          {/*
            The two glyphs. Home moved up here from the head of the collection
            row on 9 August, which is where it had been since it was a way back
            to the top of the app rather than a destination — now that it is the
            poster wall it belongs with the other place you go rather than with
            the collections you filter between.

            It also buys the collection line about 33px, which it needed: with
            the house and its dot in it the row ran past a 375px screen and
            wrapped.

            The wordmark still links home too. That is a duplicate address and
            deliberately so — a masthead that does not go home reads as broken,
            and this is the explicit control rather than the convention.

            `-my-3/py-3` takes both tap targets to the full header height; the
            gap between them is what keeps the two 44px areas from meeting.
          */}
          {/*
            `text-active` — lacquer red — on whichever of the two you are
            currently looking at. See the token in globals.css for the scarcity
            rule it inherits and for why it must never become the error colour.

            These are the only two places it appears. An unlabelled glyph has no
            word to carry its state, so it needs the colour more than a label
            does; the collections in the bottom bar still mark the current one
            with full-strength text, which is a deliberate difference rather than
            an oversight — they are words, and a word can say where it is by
            getting brighter.

            Colour is not the only signal either way: `aria-current="page"` is on
            both, so nothing here depends on being able to see red.
          */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Home"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`-my-3 py-3 transition-colors ${
                pathname === '/' ? 'text-active' : 'text-muted hover:text-text'
              }`}
            >
              <HomeIcon />
            </Link>

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
          </div>
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
        ref={barRef}
        aria-label="Main"
        /* The phone's bar is the one whose bottom padding is a home-indicator
           inset — see `dropsSafeArea` on `SearchDock`. */
        onPointerDownCapture={(event) => onDockPointerDown(event, true)}
        onPointerUpCapture={onDockPointerUp}
        onPointerCancelCapture={onDockPointerCancel}
        onFocusCapture={(event) => onDockFocus(event, true)}
        onBlurCapture={onDockBlur}
        /*
          `transition-[translate]`, not `transition-transform`. Two things move
          this element: the recede slide writes `translate` and wants its 300ms,
          while `useKeyboardPin` writes `transform` and must be instant.
          Tailwind's `transition-transform` covers both properties at once,
          which would make the bar visibly chase the keyboard.
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

          ⚠ **`useKeyboardPin` overwrites this to `0px` while a keyboard is
          open** and clears the override when it closes, because a keyboard
          covers the indicator and the clearance becomes dead space holding the
          row off the keys. Anything written here has to survive being replaced
          and restored — which is why it is a class and not an inline style.
        */
        className={`bg-bg rail:hidden fixed inset-x-0 bottom-0 z-20 pb-[max(0px,calc(env(safe-area-inset-bottom)_-_1rem))] transition-[translate] duration-300 ${
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

          If the gap on opening turns out to be worth fixing, fix it by bounding
          the panel to a plausible keyboard height rather than a whole screen,
          so the worst case stays small.
        */}
        <div className="gutter flex min-h-10.5 items-center gap-2">
          {/*
            The one control that is always there. It points right at a field
            waiting to be typed into, and flips to point back the way it came
            once the collections are showing — the same glyph doing the same job
            in both directions, rather than two icons that have to be learned.

            `self-stretch` rather than the negative margins it used to carry:
            with the row at a fixed height the button can simply take all of it,
            which is both simpler and immune to the height changing again.
            `pr-1` gives it width without pushing the field along.

            42px is under the 44px floor, so `tap-target` adds the last two
            without moving anything — which is the whole reason that utility
            exists rather than being padding.
          */}
          <button
            type="button"
            onClick={() => setBarMode((m) => (m === 'search' ? 'nav' : 'search'))}
            aria-expanded={barMode === 'nav'}
            aria-label={barMode === 'search' ? 'Show collections' : 'Search'}
            className="text-muted hover:text-text tap-target flex shrink-0 items-center self-stretch pr-1 transition-colors"
          >
            <ChevronIcon
              className={`transition-transform duration-200 ${
                barMode === 'nav' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {barMode === 'search' ? (
            <SearchField id="search-bar" />
          ) : (
            /*
              Dotted, not spaced. Labels separated by gaps alone read as loose
              words; a `·` between them makes one line of navigation, which is
              what it is — and it is the same separator the entry rows use
              between a title and its year, so the app has one way of saying
              "and then this".

              **The counts come off here**, and that is most of what makes the
              line fit. The four labels come to about 236px at the caption size
              and the gaps to 48px, against the ~335px a 375px handset leaves
              after the gutter — comfortable now that the house glyph has moved
              to the header and taken its dot and two gaps with it. Four counts
              would add another 80px and put it back over. The rail has two edges
              to hang a label and a numeral from; a single line has one, so the
              count is the thing that gives.

              `flex-wrap` with `justify-center` is kept for 320px, where it is
              still tight. The padding under `main` clears two lines for exactly
              that reason: content hidden behind a fixed bar is a worse failure
              than a little dead space above it.
            */
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-2.5">
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
          )}
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

        `3.375rem` is the header, and it is not a guess — it is `MASTHEAD_GAP`
        above the mark, the mark's trimmed box, and `MASTHEAD_GAP` below it:

          0.625rem  +  2.125rem  +  0.625rem  =  3.375rem
          (10px)       (34px)       (10px)       (54px)

        The 2.125rem is the mark after its trims, `(1.2778 − 0.25 − 0.0833) ×
        36px`, and it is the one term that is a consequence rather than a
        decision — **if `--text-wordmark`, the trims or the mark's case move,
        this moves with them.** Measured against the real header, which reports
        54.00px.

        **It was 2.9375rem for part of 10 August**, while the mark was in caps
        and its inked box had no descender in it — 27px of ink rather than 34.
        The spacing never changed; the thing being spaced did, and this number is
        the only place that fact is written down.

        `1.5rem` is the gap, and it is the same 1.5rem as the header's shadow
        offset. Those two must stay equal: the shadow is what keeps the distance
        identical once the page scrolls and content starts passing under the
        mark. **Three numbers move together** — this padding, that shadow, and
        the header's own paddings above.

        The notch inset is added rather than folded in, because it is clearance
        rather than height and varies by device.

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
        className={`gutter safe-bottom rail:max-w-3xl rail:pt-10 rail:[--safe-bottom-base:6rem] isolate flex w-full min-w-0 flex-1 flex-col pt-[calc(env(safe-area-inset-top)_+_3.375rem_+_0.5rem)] ${
          showCollections ? '[--safe-bottom-base:6rem]' : '[--safe-bottom-base:2rem]'
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
  /**
   * Whether the dock's bottom padding is home-indicator clearance rather than
   * design spacing. An open keyboard covers the indicator, so that padding is
   * dead space holding the row off the keys — dropped while the keyboard is up
   * and restored with it.
   */
  dropsSafeArea?: boolean
}

/**
 * Holds whichever search dock is on screen on the top edge of an open keyboard,
 * and holds the foot of the page above it.
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
  scroller: React.RefObject<HTMLElement | null>,
  docks: SearchDock[],
) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!focused || !vv) return

    let frame = 0
    let until = 0

    const rest = (dock: SearchDock) => {
      const el = dock.el.current
      if (!el) return
      el.style.transform = ''
      /* Unconditional: neither dock carries a shadow from its class list, so
         clearing one that was never written costs nothing and cannot be
         forgotten if the ground is ever given to the other. */
      el.style.boxShadow = ''
      if (dock.dropsSafeArea) el.style.paddingBottom = ''
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
      let lift = vv.offsetTop + vv.height - anchor.getBoundingClientRect().bottom

      /*
        **Do not undo the pre-lift while waiting for the keyboard to arrive.**

        `onDockFocus` raises the bar clear of where the keyboard is about to be,
        so that iOS has no covered field to reveal — see `lastKeyboardOverlap`.
        This function then ran on the very next frame, found a viewport that had
        not shrunk yet, measured a lift of zero, and wrote `transform = ''`.

        The pre-lift was therefore destroyed about one frame after it was
        applied, every time, which is why it changed nothing. A thermostat that
        switches the heating off because the room is not yet cold.

        Zero is not "the bar is where it should be" during the arrival window; it
        is "no keyboard has been seen yet". While that is true and a height is
        remembered, the assumption stands. The moment the viewport actually
        shrinks the measurement is non-zero and takes over on its own.

        Outside the window this is skipped entirely, so a bar with no keyboard
        under it still returns to rest.
      */
      const remembered = rememberedOverlap()
      if (Math.abs(lift) < 1 && remembered > 0 && performance.now() < until) {
        lift = -remembered
      }

      el.style.transform = lift ? `translateY(${lift}px)` : ''
      /*
        ⚠ **The phone's bar only** — `dropsSafeArea` is standing in for "this
        dock rests on the bottom edge of the screen", which is the one fact both
        it and the ground follow from. The rail's dock is a full-height column
        whose visible band is at the foot of the *content*, so a shadow on the
        element this holds would paint a screen of black rather than a strip.
        Dressing that one needs a ref to the band inside it, and it is untested
        territory besides — see `docs/decisions.md` on iPad.
      */
      if (shown.dropsSafeArea) el.style.boxShadow = groundFor(lift)
      if (shown.dropsSafeArea) el.style.paddingBottom = '0px'
    }

    /*
      **The floor of the page, held above the keyboard — see `safe-bottom`.**

      The scroller is `fixed inset-0`, so it is as tall as the *layout* viewport,
      and iOS does not shrink that for a keyboard. Its bottom strip is therefore
      behind the keys, and at maximum scroll the last row of a long list is
      parked in there with no range left to lift it out. Reported on the handset
      the moment the document stopped scrolling: the document scrolling had been
      supplying the missing distance all along, as a side effect of the fault it
      caused everywhere else.

      Measured, like the pin above, rather than derived from `innerHeight` or
      `clientHeight`. The distance between the scroller's own bottom edge and the
      bottom of what can be seen is the answer whatever iOS thinks those two
      numbers mean, and it is zero when there is no keyboard.

      Written as a custom property rather than as `paddingBottom`, because the
      elements that need it already have a padding rule with two other terms in
      it. Setting the property adds a third; setting the padding would replace
      all three and drop the home-indicator inset on the floor.
    */
    const floor = () => {
      const box = scroller.current
      if (!box) return
      const overlap = Math.max(0, box.getBoundingClientRect().bottom - (vv.offsetTop + vv.height))
      box.style.setProperty('--keyboard-overlap', `${Math.round(overlap)}px`)

      /*
        Remembered for the *next* focus, which is the only moment it is worth
        anything — see `lastKeyboardOverlap` for why it only grows. A zero is
        the keyboard being closed, and writing that down would throw away the
        number the next tap needs.
      */
      const rounded = Math.round(overlap)
      if (rounded > lastKeyboardOverlap) {
        lastKeyboardOverlap = rounded
        try {
          window.localStorage.setItem(OVERLAP_KEY, String(rounded))
        } catch {
          // Nothing to do — the in-memory copy still improves this session.
        }
      }
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
      **Both scrolls are listened to — the shell's own and the window's.**

      This said the opposite until 11 August: that the document never moves, so
      `window`'s scroll event "fires exactly never" and a listener on it was
      watching the one thing guaranteed not to happen. Measured on the handset,
      it fires and it carries 271px. See the clamp in `Shell`.

      The clamp is what fixes it; this is the backstop. The two are worth having
      together because they fail differently: the clamp puts the document back
      and cannot help on a frame where iOS has moved it and not yet been told,
      while this reads the dock's real position and corrects whatever displaced
      it, without needing to know what did. A thermostat does not care why the
      room got cold.

      `resize` and `orientationchange` are here because the choice of dock is a
      breakpoint away, and turning a handset sideways crosses it with a keyboard
      still open.
    */
    const box = scroller.current
    box?.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    /* The three that mean "something is animating", not "something happened". */
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    return () => {
      box?.removeEventListener('scroll', schedule)
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
      box?.style.removeProperty('--keyboard-overlap')
    }
  }, [focused, scroller, docks])
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
