'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment } from 'react'

import { authClient } from '@/lib/auth-client'
import type { OwnerView } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'
import { HomeIcon } from './icon-home'
import { ProfileIcon } from './icon-profile'

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
  { href: '/', label: COLLECTIONS.wants, view: 'live' },
  { href: '/go-back-tos', label: COLLECTIONS.goBackTos, view: 'go_back_tos' },
  { href: '/fixtures', label: COLLECTIONS.fixtures, view: 'fixtures' },
  { href: '/archive', label: COLLECTIONS.archive, view: 'archive' },
] as const satisfies ReadonlyArray<{ href: Route; label: string; view: OwnerView }>

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

        <nav aria-label="Collections" className="mt-12 flex flex-col gap-4">
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

      {/* --- the header, below 45rem ------------------------------------- */}
      <header className="border-rule rail:hidden border-b pt-[env(safe-area-inset-top)]">
        <div className="gutter flex items-center justify-between py-3">
          <Link href="/" className="wordmark text-wordmark-nav">
            Again
          </Link>

          {/*
            This replaced the handle and a *Sign out* button, which between them
            took the right-hand half of the row to say something you already
            know — your own handle — and to offer an action you want roughly
            once. Both are still one tap away, in the same bottom-left corner
            the rail puts them in.

            `-my-3/py-3` expands the tap target to the full header height, and
            `pl-4` gives it width on the side it can take it from.
          */}
          <Link
            href="/profile"
            aria-label="Profile"
            aria-current={pathname === '/profile' ? 'page' : undefined}
            className={`-my-3 py-3 pl-4 transition-colors ${
              pathname === '/profile' ? 'text-text' : 'text-muted hover:text-text'
            }`}
          >
            <ProfileIcon />
          </Link>
        </div>

        {/*
          Dotted, not spaced. Four labels separated by gaps alone read as four
          loose words; a `·` between them makes one line of navigation, which is
          what it is — and it is the same separator the entry rows use between a
          title and its year, so the app has one way of saying "and then this".

          **The counts come off here**, and that is what makes the line fit. The
          labels are about 240px at the caption size, the dots bring it to 295px
          and the home icon to ~320px, inside the ~335px a 375px handset leaves
          after the gutter. Four counts would add another 80px and put it over
          the edge on every phone. The rail has two edges to hang a label and a
          count from; a single line has one, so the count is the thing that
          gives.

          Still `flex-wrap`: at 320px it wraps rather than overflowing, and gap-y
          is 3 so the wrapped rows' tap areas do not meet. A horizontally
          scrolling strip with no affordance would simply hide a collection.

          The dots are siblings rather than `::before` on each link so they are
          never inside a tap target, and `select-none` so dragging across the
          row to copy a collection name does not pick them up.
        */}
        <nav
          aria-label="Collections"
          className="gutter flex flex-wrap items-baseline gap-x-2.5 gap-y-3 pb-3"
        >
          {/*
            Home and Wants are the same address, and that is deliberate rather
            than the duplication this shell was built to remove: the old fault
            was two *named* destinations onto one list, which made you choose
            between two words for one thing. A glyph at the head of the line is
            not a fifth collection — it is the way back to the top of the app
            from anywhere, which on a phone is the one move worth an icon.
          */}
          <Link
            href="/"
            aria-label="Home"
            className="text-muted hover:text-text tap-target mr-0.5 self-center transition-colors"
          >
            <HomeIcon />
          </Link>

          {COLLECTION_LINKS.map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 && (
                <span aria-hidden className="text-micro text-muted select-none opacity-50">
                  ·
                </span>
              )}
              <CollectionLink
                {...link}
                count={counts[link.view]}
                active={pathname === link.href}
                layout="inline"
              />
            </Fragment>
          ))}
        </nav>
      </header>

      {/*
        `min-w-0` so a long film title makes the column narrower rather than
        pushing the rail off the screen. `flex flex-col` so a page can push
        something to the foot of the viewport — `/profile` is the one that does.
      */}
      <main
        className="gutter safe-bottom rail:max-w-3xl rail:py-10 flex w-full min-w-0 flex-1 flex-col py-8"
        style={{ '--safe-bottom-base': '2rem' } as React.CSSProperties}
      >
        {children}
      </main>
    </div>
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
