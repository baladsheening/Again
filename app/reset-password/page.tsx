import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '@/components/reset-password-form'
import { getSessionUser } from '@/lib/db'

/**
 * Where Better Auth lands someone after they click the emailed link. It
 * validates the token first and redirects here with either `?token=` or
 * `?error=`, so both have to be handled — an expired link is the common case,
 * not an edge one, and dropping someone on a broken form with no explanation is
 * how a recovery flow loses the person it exists for.
 *
 * Not behind the session check: the entire point is that you cannot get in.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  if (await getSessionUser()) redirect('/')

  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : null

  return (
    /*
      An arbitrary property class, not a `style` attribute — the CSP allows no
      inline styles, so the attribute version was dropped in production only.
      See the note on `wordmark-trim` in globals.css.
    */
    <main className="gutter safe-bottom mx-auto flex w-full max-w-sm flex-1 flex-col py-12 [--safe-bottom-base:3rem]">
      {/*
        ⚠ **`my-auto` STAYS HERE, and the cross-reference this note used to carry
        is the thing that went stale — 3 September.** It read *my-auto rather
        than justify-center — see app/sign-in/page.tsx*, and that page now says
        the opposite about itself: its three auto margins were **deleted** on 1
        September because a poster with a mark, three beats and a form that grows
        by a field drifted every time the mode changed. Read alone, the pointer
        was an instruction to come and delete this one too.

        ⚠ **Nothing here drifts, because there is one block and it is one
        route's content.** The wall's fault needed three items sharing the
        leftover space; this is a single flex item, so the auto margin has
        exactly one gap above and one below and no third party to re-split them
        between. Measured centred at every width and on both engines —
        `node_modules/.probe/authcentre.mjs`.

        ⚠ **And it is already what the wall was given on 3 September, by a
        different mechanism.** A flexbox auto margin absorbs POSITIVE free space
        only; when free space is negative it resolves to zero, so this can never
        push the block above the scroll origin. That is the guarantee `safe
        center` had to be chosen to get over there, and the reason this screen
        needed no change when the wall did. **Do not "unify" the two** — the wall
        is top-packed on a phone on purpose and this is not, so one declaration
        cannot serve both.
      */}
      <div className="my-auto flex w-full flex-col gap-7">
        {/* 14px of visible air, adjusted by wherever this face stops the mark's
            ink relative to its box — positive for Jost's capitals, which stop
            short of it. Full argument in app/sign-in/page.tsx — and the two must
            stay equal, since this block reads the same on both pages. */}
        <div className="flex flex-col gap-[calc(14px_-_var(--wordmark-slack))] text-start">
          <h1 className="wordmark text-wordmark">Keep</h1>
          {/* Same tier as the sign-in tagline — this block has to read the same
              way on both pages, and an expired link is not a footnote. */}
          <p className="text-muted text-sm">
            {token ? 'Choose a new password.' : 'That link has expired.'}
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-muted text-sm">
            Reset links last an hour and work once.{' '}
            <Link
              href="/sign-in"
              className="hover:text-text -my-2 inline-block py-2 underline underline-offset-4"
            >
              Ask for another
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  )
}
