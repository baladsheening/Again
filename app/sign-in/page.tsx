import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/sign-in-form'
import { getSessionUser } from '@/lib/db'

export default async function SignInPage() {
  if (await getSessionUser()) redirect('/')

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Again</h1>
        <p className="text-muted text-sm leading-relaxed">
          What you would go back to, and what you have not tried yet.
        </p>
      </div>

      <SignInForm />
    </main>
  )
}
