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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ZINE TREATMENT REACHES THIS SCREEN — 3 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed: *make the reset screen match the wall.* It is the wall's
 * composition now — the oversized serif mark with its full stop, the sentence
 * under it, rules instead of boxes, a serif word for a submit — and everything
 * on it is a class the wall already carries. The reasoning for each lives on
 * `app/sign-in/page.tsx` and `components/sign-in-form.tsx`.
 *
 * ⚠⚠ **THE MARK MOVED FROM `wordmark` TO `zine-command`, AND THAT IS A CHANGE OF
 * FENCE, NOT OF SIZE.** `wordmark` is the BAR's mark: KEEP in capitals, and the
 * `--wordmark-*` tokens are measurements of that word in that case. This screen
 * now sets `Keep.` the way the wall does — a sentence rather than a mark — so
 * **the `gap-[calc(14px - var(--wordmark-slack))]` that used to sit under it is
 * deleted rather than re-derived.** That correction held 14px of visible air
 * under a mark whose ink stops short of its box, and it measured a face and a
 * case this screen no longer sets. Removing the mechanism rather than
 * re-measuring it, in the order *How things get fixed* asks for. The wall
 * deleted the identical expression on 31 August for the identical reason.
 *
 * ⚠ **The note in this file used to say the mark block *has to read the same way
 * on both pages*, and it now does — which is what makes the note redundant
 * rather than wrong.** The two screens agreed on `wordmark` while the wall was
 * the old design; they agree on `zine-command` now.
 *
 * ⚠ **The gaps are the wall's two, not numbers picked here.** `gap-9` between
 * the mark and the sentence under it, `mt-12` down to the form — the same pair
 * the wall spends between its mark, its beats and its form. They are nested
 * rather than flattened because a single `gap-9` column plus `mt-12` would add
 * both at that joint.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  if (await getSessionUser()) redirect('/')

  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : null

  return (
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
      <div className="my-auto flex w-full flex-col">
        <div className="flex flex-col gap-9">
          {/*
            ⚠ **`Keep.` with the full stop, and the capitals come from CSS.**
            `zine-command` is `text-transform: uppercase`, so the markup holds
            the word as it is written and the screen shows the mark — the same
            arrangement `zine.mjs` asserts on the wall, because a word typed in
            capitals is a word that cannot be set any other way later.
          */}
          <h1 className="zine-command text-[6.5rem] stack:text-[10rem]">Keep.</h1>

          {/*
            The wall's beat sentence, at the wall's size and at full strength.
            ⚠ **Not `text-muted`, which is what it was.** An expired link is the
            common case on this screen rather than a footnote, and the two
            sentences share one slot — so colouring by meaning would mean first
            splitting by meaning, which is the argument the wall's message
            carries.
          */}
          <p className="text-sm">
            {token ? 'Choose a new password.' : 'That link has expired.'}
          </p>
        </div>

        <div className="mt-12">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <>
              <p className="text-sm">Reset links last an hour and work once.</p>
              {/*
                ⚠ **The way on is a `zine-label` switch, not an underlined link
                inside a sentence.** The wall's three mode switches are the
                app's established *this takes you somewhere else* control —
                mono, lowercase, widely tracked, colour on hover — and this is
                the same act. The old inline link brought an underline back onto
                a screen whose whole treatment is that a rule means a field.

                ⚠ **The `-my-2 py-2` pair that used to give it a touch target is
                deleted with it.** A `Switch` on the wall carries its floor as a
                real minimum height on a fine pointer and deliberately none on a
                coarse one; this copies that rather than inventing a third
                answer. See the long note on `Switch` for why a pseudo-element
                floor was the bug and a real box is the fix.

                `mt-6` is the wall's gap from its form down to its switches —
                the same joint, the same number, and it says *this is not part
                of what you were reading*.
              */}
              <div className="text-muted mt-6 flex flex-col items-start">
                <Link
                  href="/sign-in"
                  className="zine-label hover:text-text control-lift flex items-center text-start transition-colors pointer-fine:my-0.5 pointer-fine:min-h-[var(--click-floor)]"
                >
                  ask for another
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
