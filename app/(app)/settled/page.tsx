import { redirect } from 'next/navigation'

import { LockGlyph } from '@/components/glyphs'
import { Screen } from '@/components/screen'
import { getMyProfile, getSessionUser, listMySettled } from '@/lib/db'
import { STATE_WORD } from '@/lib/vocabulary'

/**
 * The tray: everything you are done deciding about.
 *
 * **Settled captures leave the page**, which is the largest single reduction
 * available for reading back and it costs nothing new — so this is where they
 * go, and it is the destination the bar's tray glyph and the foot's settle
 * glyph share. The arrow dropping into the tray is the only difference between
 * the noun and the verb.
 *
 * ⚠ **One surface, not three, and the states stay distinct inside it.** Whether
 * *Again*, *Have* and *Done* want a surface each is still open; they carry their
 * own word here either way, so splitting it later is a routing change and
 * nothing else.
 *
 * ⚠ **`done` is private (§5.3)** — never in anyone else's view, never in an
 * aggregate. This is the owner's own screen and `listMySettled` filters on the
 * owner, which is what makes showing it safe.
 *
 * ⚠ **This is a destination, not a screen with tools.** There is no foot: the
 * foot's four controls act on the line the caret is on, and nothing here is
 * live. Bringing a settled capture back is not built — the ways out of the tray
 * are Phase 1's remaining work, and until they exist the honest surface is a
 * list rather than a set of controls that do nothing.
 */
export default async function SettledPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const rows = await listMySettled(sessionUser)

  return (
    <Screen>
        <h1 className="stamp text-muted mb-2.5">Settled</h1>

        {rows.length === 0 ? (
          <p className="page-line text-muted">Nothing settled yet.</p>
        ) : (
          /*
            ⚠ **The mark travels to the tray — 31 August.** A settled line is
            still a line of the record, and a convergence that happened before it
            was settled still happened. Nothing here acts on a line, so the mark
            says *there is something* and the record is where the sentence is
            read.
          */
          <ol>
            {rows.map((row) => (
              <li
                key={row.id}
                className={`page-line flex items-baseline gap-3 ${
                  row.converged ? 'converged' : ''
                }`}
              >
                <span className="min-w-0 flex-1">
                  {row.text}
                  {row.year !== null && (
                    <span className="text-muted ms-2 text-[0.8125rem] leading-none">{row.year}</span>
                  )}
                  {/* Hidden text rather than a label — see `search-screen.tsx`. */}
                  {row.converged && (
                    <span className="sr-only">. Also on someone else’s page.</span>
                  )}
                  {!row.shared && <span className="sr-only">. Locked.</span>}
                </span>
                {/* `self-center`: this row is `items-baseline` — see `search-screen.tsx`. */}
                {!row.shared && (
                  <span
                    aria-hidden
                    className="text-muted ms-2 inline-flex shrink-0 self-center [--glyph:0.875rem]"
                  >
                    <LockGlyph />
                  </span>
                )}
                {/*
                  The word the state is called on screen, and `null` is a word
                  too — the two states that say nothing are not in the tray, so
                  every row here has one. See `STATE_WORD`.
                */}
                <span className="micro text-muted shrink-0">{STATE_WORD[row.state]}</span>
              </li>
            ))}
          </ol>
        )}
    </Screen>
  )
}
