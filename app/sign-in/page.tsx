import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/sign-in-form'
import { getSessionUser } from '@/lib/db'

export default async function SignInPage() {
  if (await getSessionUser()) redirect('/')

  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center gap-7 px-5 py-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-medium">Again</h1>
        <p className="text-muted text-sm">
          What you would go back to, and what you have not tried yet.
        </p>
      </div>

      <SignInForm />
    </main>
  )
}
