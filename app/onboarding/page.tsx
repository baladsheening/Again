import { redirect } from 'next/navigation'

import { OnboardingForm } from '@/components/onboarding-form'
import { getMyProfile, getSessionUser } from '@/lib/db'

export default async function OnboardingPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')
  if (await getMyProfile(sessionUser)) redirect('/')

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
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-medium">Pick a handle</h1>
          <p className="text-muted text-sm">
            This is how people find you. There is no directory and no search for
            strangers — someone reaches your page because you gave them the handle.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </main>
  )
}
