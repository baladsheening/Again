'use client'

import { useActionState } from 'react'

import { createProfileAction, type ProfileResult } from '@/app/actions/profile'

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<ProfileResult | null, FormData>(
    createProfileAction,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        {/*
          Mono here is functional rather than decorative, so it survives the
          scarcity rule: a handle is an identifier, and telling l from 1 from I
          is exactly what §10's homoglyph concern is about.
        */}
        <div className="bg-surface border-rule focus-within:border-muted flex items-center rounded-md border px-3 transition-colors">
          <span className="text-muted input-text font-mono">@</span>
          <input
            id="handle"
            name="handle"
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
            // Lower case, and left in mono unlike the other placeholders: it
            // renders directly against the `@` above, and the two only read as
            // one address — `@handle` — if they agree on case and typeface.
            placeholder="handle"
            aria-label="Handle"
            className="control-box input-text placeholder:text-muted flex-1 bg-transparent pl-1 font-mono outline-none"
          />
        </div>
        <p className="text-muted text-xs">
          Letters, numbers and underscores. Between 2 and 20 characters.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          // "(optional)" was a dimmed span inside the label; a placeholder is one
          // string and cannot carry two weights, so it is plain text now. It has
          // to stay said either way — this is the only field in the form that is
          // not required, and nothing else in here indicates that.
          placeholder="Name (optional)"
          aria-label="Name (optional)"
          className="bg-surface border-rule focus:border-muted control-box input-text placeholder:text-muted rounded-md border px-3 outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        // `control-box input-text` and no `mt-1`, both as on the sign-in submit:
        // the form's one size, and the form's one gap.
        className="border-rule hover:border-text control-box input-text rounded-md border px-4 transition-colors disabled:opacity-50"
      >
        {pending ? 'One moment…' : 'Continue'}
      </button>

      {state && !state.ok && <p className="text-muted text-sm">{state.message}</p>}
    </form>
  )
}
