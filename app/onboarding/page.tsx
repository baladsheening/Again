import { redirect } from 'next/navigation'

import { OnboardingForm } from '@/components/onboarding-form'
import { getMyProfile, getSessionUser } from '@/lib/db'

export default async function OnboardingPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')
  if (await getMyProfile(sessionUser)) redirect('/')

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Pick a handle</h1>
        <p className="text-muted text-sm leading-relaxed">
          This is how people find you. There is no directory and no search for
          strangers — someone reaches your page because you gave them the handle.
        </p>
      </div>

      <OnboardingForm />
    </main>
  )
}
