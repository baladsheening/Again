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
      {/* my-auto rather than justify-center — see app/sign-in/page.tsx. */}
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
