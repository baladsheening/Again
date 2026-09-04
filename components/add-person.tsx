'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { HANDLE_ERROR_COPY, validateHandle } from '@/lib/handles'

/**
 * **A handle, and the way to somebody's page** — on `/profile`, inside People.
 *
 * ⚠ **Until 4 September there was NO WAY IN THIS APP TO ADD A PERSON.**
 * `/u/[handle]` was reachable only by typing the URL, and People listed only
 * those already added — so the one route to somebody's page was retyping a
 * handle into the address bar. That is half of why two accounts holding the same
 * film converged on nothing (§9 of `phase-2-convergence.md`).
 *
 * ⚠ **It GOES TO THEIR PAGE; it does not add them.** A handle typed with a typo
 * can reach a real person, and adding is the act that puts a question in
 * somebody's portal — so the field ends on *their page with a button on it*,
 * where you can see who you are about to ask. One more tap, and the tap is the
 * point.
 *
 * ⚠ **This is not search and must not become it.** §2 rules out discovery: no
 * directory, no stranger search, no suggestions, no partial matching. It takes a
 * handle you were given and resolves it — which is why the shape is checked here
 * and existence is answered by the destination, rather than by an endpoint that
 * would tell a caller which handles exist.
 *
 * ⚠ **A leading `@` is stripped here and NOT in `normaliseHandle`.** People type
 * the handle as they were told it, and §5 shows handles with their `@`
 * everywhere. Folding the `@` into the shared normaliser would let it through at
 * onboarding too, where `@sam` and `sam` becoming one handle is a rule about
 * identity rather than a convenience.
 */
export function AddPerson() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function go(event: React.FormEvent) {
    event.preventDefault()

    const typed = value.trim().replace(/^@/, '')
    const parsed = validateHandle(typed)
    if (!parsed.ok) {
      /*
        `reserved` cannot be reached from here in any useful way — a reserved
        word is not a person — and its copy says *that handle is taken*, which is
        onboarding's sentence rather than this one's. Both land on the shape
        message, which is the true statement in either case: what was typed is
        not a handle.
      */
      setError(HANDLE_ERROR_COPY.shape)
      return
    }

    setError(null)
    // `as Route`: the path is interpolated, so no literal can cover it.
    router.push(`/u/${parsed.handle}` as Route)
  }

  return (
    <form onSubmit={go} className="mb-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="add-person" className="sr-only">
          Somebody&rsquo;s handle
        </label>
        <input
          id="add-person"
          name="handle"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder="@handle"
          /*
            All four off: a handle is not a word, and an engine that capitalises
            or corrects one produces a person who does not exist. The same four
            the onboarding field carries.
          */
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          maxLength={21}
          className="input-text border-rule focus:border-text min-w-0 flex-1 rounded border bg-transparent px-2 py-1 transition-colors outline-none"
        />
        <button
          type="submit"
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
        >
          Go
        </button>
      </div>

      {/* Full strength at body size, as everywhere else a failure is reported. */}
      {error && <p className="text-sm">{error}</p>}
    </form>
  )
}
