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
        <label htmlFor="handle" className="text-muted text-xs">
          Handle
        </label>
        {/*
          Mono here is functional rather than decorative, so it survives the
          scarcity rule: a handle is an identifier, and telling l from 1 from I
          is exactly what §10's homoglyph concern is about.
        */}
        <div className="bg-surface border-rule focus-within:border-muted flex items-center rounded-md border px-3 transition-colors">
          <span className="text-muted font-mono">@</span>
          <input
            id="handle"
            name="handle"
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent py-2 pl-1 font-mono outline-none"
          />
        </div>
        <p className="text-muted text-xs">
          Letters, numbers and underscores. Between 2 and 20 characters.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-muted text-xs">
          Name <span className="opacity-60">(optional)</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          className="bg-surface border-rule focus:border-muted rounded-md border px-3 py-2 outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="border-rule hover:border-text mt-1 rounded-md border px-4 py-2 text-sm transition-colors disabled:opacity-50"
      >
        {pending ? 'One moment…' : 'Continue'}
      </button>

      {state && !state.ok && <p className="text-muted text-sm">{state.message}</p>}
    </form>
  )
}
