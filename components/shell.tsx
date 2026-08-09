'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import type { OwnerView } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'
import { ChevronIcon } from './icon-chevron'
import { HomeIcon } from './icon-home'
import { ProfileIcon } from './icon-profile'
import { SearchField } from './search-field'

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
  */
  const [collectionsHidden, setCollectionsHidden] = useState(false)

  /*
    Which of the two things the bar is holding. Search is the default: on a phone
    it is the only route to the field, and adding is what the app is for.
  */
  const [barMode, setBarMode] = useState<'search' | 'nav'>('search')

  /*
    True while the search field is focused or has something in it. The bar is
    pinned in place for as long as that holds — a bar that slid away mid-search
    would take the field, the results and the keyboard's anchor with it, and the
    scroll that triggered it would often be the user reaching for a result.
  */
  const [searchActive, setSearchActive] = useState(false)

  useEffect(() => {
    if (!showCollections || searchActive) return

    let last = window.scrollY
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = Math.max(0, window.scrollY)
        const delta = y - last
        // `last` deliberately does not move until the threshold is crossed, so
        // slow scrolling accumulates instead of never registering.
        if (Math.abs(delta) < SCROLL_THRESHOLD) return
        last = y
        setCollectionsHidden(y > ALWAYS_SHOWN_ABOVE && delta > 0)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [showCollections, searchActive])

  /*
    There is deliberately no effect resetting this on navigation. Moving to
    another collection scrolls the page to the top, which fires the handler
    above with a large negative delta and reveals the bar on its own — and the
    only way to reach another collection from a hidden bar is to scroll up
    first, which has already revealed it.
  */

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
    <div className="rail:flex-row rail:gap-12 mx-auto flex w-full max-w-6xl flex-1 flex-col">
      {/* --- the rail, from 45rem up ------------------------------------- */}
      <aside
        /*
          `sticky` with `h-dvh`, so the collections stay put while the list
          scrolls past them. That is the whole reason a rail beats a header on a
          large screen: the navigation stops being something you scroll back up
          to find.
        */
        className="gutter rail:sticky rail:top-0 rail:flex rail:h-dvh rail:w-56 rail:flex-col rail:py-10 hidden shrink-0"
      >
        <Link href="/" className="wordmark text-wordmark-nav">
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
        --- the header, below 45rem ---------------------------------------

        No rule under it. A hairline here drew a line across the screen directly
        beneath the one piece of display type in the app, which boxed the mark in
        rather than letting it sit at the top of the page — and there is nothing
        for it to divide, since the row below is the content itself. The bar at
        the foot keeps its rule, where it is doing real work: separating a fixed
        surface from the list scrolling underneath it.

        **It does not move.** `sticky` rather than `fixed`, and the difference is
        not cosmetic: sticky keeps the header in normal flow, so the content
        below it starts in the right place on its own and then passes underneath
        as you scroll. Fixed would take it out of flow and require `main` to
        carry a top padding equal to the header's height — a number that has to
        be kept in step with the wordmark size by hand, and is wrong the moment
        it is not.

        `bg-bg` is what makes the pass-under work at all: without a ground the
        list would show through the mark.
      */}
      <header className="bg-bg rail:hidden sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="gutter flex items-center justify-between py-4">
          <Link href="/" className="wordmark text-wordmark-nav">
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
          <div className="flex items-center gap-5">
            <Link
              href="/"
              aria-label="Home"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`-my-3 py-3 transition-colors ${
                pathname === '/' ? 'text-text' : 'text-muted hover:text-text'
              }`}
            >
              <HomeIcon />
            </Link>

            <Link
              href="/profile"
              aria-label="Profile"
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className={`-my-3 py-3 transition-colors ${
                pathname === '/profile' ? 'text-text' : 'text-muted hover:text-text'
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
      */
      <nav
        aria-label="Main"
        className={`border-rule bg-bg rail:hidden fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
          collectionsHidden ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="gutter flex items-center gap-2 py-3.5">
          {/*
            The one control that is always there. It points right at a field
            waiting to be typed into, and flips to point back the way it came
            once the collections are showing — the same glyph doing the same job
            in both directions, rather than two icons that have to be learned.

            `-my-3.5/py-3.5` takes the tap target to the full height of the bar,
            and `pr-1` gives it width without pushing the field along.
          */}
          <button
            type="button"
            onClick={() => setBarMode((m) => (m === 'search' ? 'nav' : 'search'))}
            aria-expanded={barMode === 'nav'}
            aria-label={barMode === 'search' ? 'Show collections' : 'Search'}
            className="text-muted hover:text-text -my-3.5 shrink-0 py-3.5 pr-1 transition-colors"
          >
            <ChevronIcon
              className={`transition-transform duration-200 ${
                barMode === 'nav' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {barMode === 'search' ? (
            <SearchField placement="bar" onActiveChange={setSearchActive} />
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
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-center gap-x-2 gap-y-2.5">
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

        It drops back to 2rem wherever there is no bar: at rail widths, and on
        `/profile` at every width. That page is composed around its own
        bottom-left corner, so 6rem of clearance for a bar that is not there
        would leave the handle and *Sign out* floating well above the fold of
        the screen they are meant to sit in.

        `safe-bottom` adds the home-indicator inset on top of whichever applies.
      */}
      <main
        className={`gutter safe-bottom rail:max-w-3xl rail:py-10 rail:[--safe-bottom-base:2rem] flex w-full min-w-0 flex-1 flex-col py-8 ${
          showCollections ? '[--safe-bottom-base:6rem]' : '[--safe-bottom-base:2rem]'
        }`}
      >
        {children}
      </main>
    </div>
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
