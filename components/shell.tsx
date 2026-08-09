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

/**
 * The air above and below the wordmark on a phone — the *visible* air, measured
 * to the letters rather than to the box they sit in.
 *
 * One constant rather than two matching literals, because two numbers that have
 * to stay equal eventually will not: this pair was 16px and 48px before
 * 9 August, and nothing in the code said they were meant to be related.
 *
 * The notch inset is added to the top separately. That is clearance, not
 * spacing, and counting it as spacing is what makes a mark drift down the screen
 * by however much inset a given device reports.
 *
 * 10px rather than 8: measured in a browser, the corrections below land the
 * visible gaps within 0.2px of this number at both ends, so it is now the gap
 * rather than an approximation of it, and 8 was tight enough that any remaining
 * error showed up as a collision.
 */
const MASTHEAD_GAP = '0.625rem'

/**
 * The two corrections that turn `MASTHEAD_GAP` from a box measurement into a
 * visible one. Both exist because `wordmark` sets `line-height: 1`, which makes
 * a box the size of the em for type whose ink does not fit inside it.
 *
 * **Measured, not derived.** Both were estimated twice from the metrics
 * next/font reports for the fallback face, and both were wrong — the declared
 * ascent and descent describe the space a font reserves, not the space "again"
 * actually inks. These are `TextMetrics.actualBoundingBox*` for the rendered
 * string at 36px, taken from the real shell in a browser:
 *
 *   baseline sits 33.50px below the box top
 *   ink ascent  26.00px  → 7.50px of empty box **above** the letters (0.2083em)
 *   ink descent  8.00px  → 5.50px of `g` hanging **below** the box  (0.1528em)
 *
 * Note the declared metrics said 7.31px of overhang; the truth is 5.50px. The
 * gap between those two numbers is why guessing at this twice did not converge.
 *
 * Written as a multiple of `--text-wordmark` rather than as a fixed rem, so they
 * follow the mark if its size changes again — which it has twice today. The
 * ratios above are properties of the typeface and the word, not of 36px.
 */
/**
 * The wordmark's own box, in the phone header, corrected so that it *is* the
 * letters.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why this replaced two rounds of padding arithmetic (9 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `wordmark` sets `line-height: 1`, which gives a 36px box to type whose content
 * area is 1.4167em — 51px. The ink therefore hangs 7.5px *below* the box, and
 * the posters kept meeting the `g`. Two attempts fixed that by padding the
 * header to compensate, and both were a number in one place describing a fact
 * about a font in another. The last of them expressed that number as
 * `calc(… * var(--text-wordmark))` inside an inline style, which was never
 * verified in a browser and fails silently to `0` if the variable does not
 * resolve — a collapse that looks exactly like the reported symptom.
 *
 * So the box is made honest instead. `line-height` is set to the content area,
 * which means the descender **cannot** leave the element: overlap stops being a
 * measurement to get right and becomes impossible.
 *
 * That leaves dead space — a line box holds room for diacritics nothing in
 * "again" uses. Measured with `TextMetrics.actualBoundingBox*` at 36px: the
 * baseline sits 41px down, the ink runs 26px above it and 8px below, so there is
 * **15px of nothing above the letters and 2px below them**. The negative margins
 * remove exactly that, leaving an element whose outer box is the inked bounds.
 *
 * Everything is in `em`, so it is the mark's own size that scales it and no
 * custom property has to resolve for the layout to hold. Once the box is the
 * letters, the header's padding is plain `MASTHEAD_GAP` on both sides and means
 * what it says.
 */
const MARK_LINE_HEIGHT = 1.4167
const MARK_TRIM_TOP = '-0.4167em'
const MARK_TRIM_BOTTOM = '-0.0556em'

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
        <Link href="/" className="wordmark text-wordmark">
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
        **The shadow is why a poster never reaches the descender.**

        The header is `sticky`, so content passes under it and is cut off at its
        bottom edge — which sits only `MASTHEAD_GAP` below the `g`. At rest the
        first poster is 24px further down again, thanks to `pt-6` on `main`; the
        moment you scroll, that 24px slides away and the cut edge arrives 10px
        under the descender. The gap was never constant, it just looked it until
        something moved.

        So the header paints 24px further than it measures: a hard-edged
        box-shadow, offset down by exactly the distance `main` holds open, with
        no blur and no spread. It adds no height and joins no layout — it only
        extends the ground the mark sits on, so the cut edge lands where the
        resting gap already was. The offset is `pt-6` on `main`: **the two must
        stay equal**, and that is the whole trick — the distance from the
        descender to the first poster is then the same number whether the page
        is scrolled or not.

        **A shadow rather than the `::after` this started as.** A positioned
        pseudo-element is painted *above* its parent's in-flow content, so if its
        top edge lands even slightly high it covers the very descender it exists
        to protect — which is exactly what happened. An outer box-shadow is
        painted *behind* the element's own background and text, so it cannot
        reach the mark however it is positioned. It also cannot swallow a tap,
        which the pseudo-element needed `pointer-events-none` to avoid.

        Black is spelled out rather than taken from the token, for the same
        reason `poster.tsx` spells its backdrop: this has to match the header's
        ground exactly, and a shadow that is one shade off reads as a band across
        the screen. If `--color-bg` ever moves, this moves with it by hand.
      */}
      <header
        className="bg-bg rail:hidden sticky top-0 z-20 shadow-[0_1.5rem_0_0_#000]"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + ${MASTHEAD_GAP})` }}
      >
        <div
          className="gutter flex items-center justify-between"
          style={{ paddingBottom: MASTHEAD_GAP }}
        >
          {/*
            The trim. `line-height` contains the descender so it cannot reach
            what follows, and the negative margins take back the diacritic space
            "again" never uses, so the element's outer box is the inked bounds.
          */}
          <Link
            href="/"
            className="wordmark text-wordmark"
            style={{
              lineHeight: MARK_LINE_HEIGHT,
              marginTop: MARK_TRIM_TOP,
              marginBottom: MARK_TRIM_BOTTOM,
            }}
          >
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
        aria-label="Main"
        className={`bg-bg rail:hidden fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
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

        It drops back to 2rem wherever there is no bar: at rail widths, and on
        `/profile` at every width. That page is composed around its own
        bottom-left corner, so 6rem of clearance for a bar that is not there
        would leave the handle and *Sign out* floating well above the fold of
        the screen they are meant to sit in.

        `safe-bottom` adds the home-indicator inset on top of whichever applies.

        **`pt-6` below the rail breakpoint, and it is the fix for a regression I
        caused.** This was `py-8` — 32px — until 9 August, when the mark was
        moved up and the whole gap was collapsed into the header's `pb` so the
        two could be one constant. The number went 48px to 10px in one step, and
        the descender has been meeting the posters ever since, on a device I
        cannot reproduce it on.

        Everything measurable says 10px is clear: rendered in a browser the ink
        stops 10.00px above the first poster, and the descender is now contained
        by the mark's own box, so it cannot reach past it. But the report is
        consistent, it began exactly here, and it survived three fixes aimed at
        the type. Whatever is moving on that device is worth about ten pixels,
        and at 48px there was enough slack to absorb it without anyone noticing.

        So the slack comes back — not all of it, and not to where it was.

        **The gaps are deliberately no longer equal**, which was the earlier
        request, and the reason is the header above: it is `sticky`, so content
        passes *underneath* it. The space above the mark is dead air against a
        status bar; the space below it is a lane things move through. A static
        masthead wants those equal. A sticky one wants room beneath.

        Above the breakpoint there is no header, so `rail:pt-10` supplies the
        space instead.

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
        className={`gutter safe-bottom rail:max-w-3xl rail:pt-10 rail:[--safe-bottom-base:2rem] isolate flex w-full min-w-0 flex-1 flex-col pt-6 ${
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
