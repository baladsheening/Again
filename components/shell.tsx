'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

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

const USER_SCROLL_GRACE_MS = 750

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
  const userScrollAtRef = useRef(0)

  function onDockFocus(event: React.FocusEvent<HTMLElement>) {
    if (!(event.target instanceof HTMLInputElement)) return
    keyboardOpeningRef.current = true
    keyboardFocusAtRef.current = performance.now()
    setReceded({ route: pathname, hidden: false })
  }

  function onDockBlur(event: React.FocusEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement) keyboardOpeningRef.current = false
  }

  /*
    Which of the two things the bar is holding. Search is the default: on a phone
    it is the only route to the field, and adding is what the app is for.
  */
  const [barMode, setBarMode] = useState<'search' | 'nav'>('search')

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

    const markUserScroll = () => {
      userScrollAtRef.current = performance.now()
    }

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
        if (now - userScrollAtRef.current > USER_SCROLL_GRACE_MS) {
          last = y
          return
        }
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
    scroller.addEventListener('touchmove', markUserScroll, { passive: true })
    scroller.addEventListener('wheel', markUserScroll, { passive: true })
    window.visualViewport?.addEventListener('resize', onViewport)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('touchmove', markUserScroll)
      scroller.removeEventListener('wheel', markUserScroll)
      window.visualViewport?.removeEventListener('resize', onViewport)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [showCollections, searchFocused, pathname])

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
      has to be chased, and chasing is always a frame behind. Every fault today
      — the bar riding up over the results, sticking mid-wall, sliding back only
      on the way up — is that chase, not the arithmetic.

      The keyboard is not the removable condition. The document scrolling is. A
      viewport-sized scroller keeps `scrollY` at zero forever, so `fixed` holds,
      the bar does not move, and receding is the same plain slide it already is
      with the keyboard down.

      Fixed children still anchor to the viewport rather than to this box — no
      ancestor here sets `transform`, `filter` or `perspective`, which are the
      only things that would capture them. If one is ever added to this element,
      the header, the rail and the bar all fall into it at once.

      ⚠ **It costs pull-to-refresh**, which was deliberately restored on
      9 August. A document that never scrolls cannot be pulled past its top. The
      rubber band inside the scroller stays.
    */
    <div id="scroll-root" ref={scrollRef} className="fixed inset-0 overflow-y-auto">
    <div className="rail:pl-68 mx-auto flex min-h-full w-full max-w-6xl flex-col">
      {/*
        The two references for `useKeyboardPin`. Each carries its dock's
        positioning and nothing else — no transform, no recede, no padding — so
        it reports where an untransformed fixed element actually lands on this
        device. Zero size, no paint, no hit area: they exist to be measured.

        They wear their dock's breakpoint too, so exactly one of them is ever
        laid out, and the hook picks the pair that is.
      */}
      <div
        ref={anchorRef}
        aria-hidden
        className="rail:hidden pointer-events-none fixed inset-x-0 bottom-0 h-0"
      />
      {/*
        The rail dock hangs off `top-0` and `h-svh` rather than `bottom-0` — see
        the dock itself for why — so its resting edge is not the same line as the
        bar's, and it needs a twin of its own shape rather than a share of that
        one.
      */}
      <div
        ref={railAnchorRef}
        aria-hidden
        className="rail:block pointer-events-none fixed top-0 hidden h-svh w-0"
      />

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
      </div>

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

      {showCollections && (
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
        onFocusCapture={onDockFocus}
        onBlurCapture={onDockBlur}
        /*
          `transition-[translate]`, not `transition-transform`. Two things move
          this element: the recede slide writes `translate` and wants its 300ms,
          while `useKeyboardPin` writes `transform` and must be instant.
          Tailwind's `transition-transform` covers both properties at once,
          which would make the bar visibly chase the keyboard.
        */
        className={`bg-bg rail:hidden fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)] transition-[translate] duration-300 ${
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
      </nav>
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
 * Holds whichever search dock is on screen on the top edge of an open keyboard.
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

    const rest = (dock: SearchDock) => {
      const el = dock.el.current
      if (!el) return
      el.style.transform = ''
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
      const lift = vv.offsetTop + vv.height - anchor.getBoundingClientRect().bottom

      el.style.transform = lift ? `translateY(${lift}px)` : ''
      if (shown.dropsSafeArea) el.style.paddingBottom = '0px'
    }

    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    schedule()

    /*
      **The scroll listened to is the shell's own, not the window's.**

      Since 10 August the page scrolls inside `#scroll-root` and the document
      never moves, which is what keeps `fixed` honoured with a keyboard open.
      `window`'s scroll event therefore fires exactly never — so a listener on it
      was watching the one thing in the app guaranteed not to happen, and if iOS
      does let a dock drift after all, nothing would have corrected it.

      `resize` and `orientationchange` are here because the choice of dock is a
      breakpoint away, and turning a handset sideways crosses it with a keyboard
      still open.
    */
    const box = scroller.current
    box?.addEventListener('scroll', schedule, { passive: true })
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)

    return () => {
      box?.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      if (frame) cancelAnimationFrame(frame)

      /* Back to the resting position the moment the keyboard is not there. */
      for (const dock of docks) rest(dock)
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
