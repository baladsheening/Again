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
    <main
      className="gutter safe-bottom mx-auto flex w-full max-w-sm flex-1 flex-col py-12"
      style={{ '--safe-bottom-base': '3rem' } as React.CSSProperties}
    >
      {/* my-auto rather than justify-center — see app/sign-in/page.tsx. */}
      <div className="my-auto flex w-full flex-col gap-7">
        {/* `gap-4` holds 14px of visible air, because the mark's `g` hangs 2px
            below its own box. Full argument in app/sign-in/page.tsx — and the
            two must stay equal, since this block reads the same on both pages. */}
        <div className="flex flex-col gap-4 text-start">
          <h1 className="wordmark text-wordmark">Again</h1>
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
