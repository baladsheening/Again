import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/sign-in-form'
import { getSessionUser } from '@/lib/db'

export default async function SignInPage() {
  if (await getSessionUser()) redirect('/')

  // 560px is where the form goes inline, and the container has to widen with it
  // or the row would only ever have 320px to divide up. Deliberately a step past
  // the point it first fits (~480px) rather than at it — switching layout the
  // instant it is technically possible lands you in the cramped version of it,
  // which is worse than the stacked one.
  return (
    <main
      className="gutter safe-bottom mx-auto flex w-full max-w-sm flex-1 flex-col py-12 min-[560px]:max-w-[42.5rem]"
      style={{ '--safe-bottom-base': '3rem' } as React.CSSProperties}
    >
      {/*
        `my-auto`, not `justify-center` on the parent. When a phone keyboard
        takes half a landscape viewport the content is taller than the container,
        and centred flex content then overflows in *both* directions — the top
        goes above the scroll origin and cannot be reached. Auto margins collapse
        to zero when there is no free space, so this degrades to top-aligned and
        stays scrollable.
      */}
      <div className="my-auto flex w-full flex-col gap-7">
        {/*
          `text-start`, not `text-left`: the mark and tagline hang off the same
          edge as the first input, and which edge that is follows the writing
          direction rather than being pinned to the left. Nothing else in here
          uses a physical direction, so this stays correct under `dir="rtl"`.
        */}
        <div className="flex flex-col gap-4 text-start">
          <h1 className="wordmark text-[2.25rem]">Again</h1>
          {/*
            Holding this on one line is what set the stacked container to
            `max-w-sm`. It had been `max-w-xs`, which leaves 280px after the
            gutter — narrower than the sentence, and narrower than any phone
            made in years. Shrinking the type to fit 280px was the wrong lever;
            the container was the thing that was wrong.
          */}
          <p className="text-muted text-sm">Things to try. Things to do again.</p>
        </div>

        <SignInForm />
      </div>
    </main>
  )
}
