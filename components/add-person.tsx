'use client'

import { useState, useTransition } from 'react'

import { trackAction } from '@/app/actions/tracks'
import { HANDLE_ERROR_COPY, validateHandle } from '@/lib/handles'

/**
 * **Add somebody by their handle** — on `/profile`, inside People.
 *
 * ⚠ **Until 4 September there was NO WAY IN THIS APP TO ADD A PERSON.**
 * `/u/[handle]` was reachable only by typing the URL, and People listed only
 * those already added. That is half of why two accounts holding the same film
 * converged on nothing (§9 of `phase-2-convergence.md`).
 *
 * ⚠⚠ **IT SENT YOU TO THEIR PAGE FOR THE FIRST HOUR OF ITS LIFE, AND THAT WAS
 * WRONG — reported and rebuilt the same day.** The argument for the detour was
 * that a mistyped handle can reach a real person, so you should see who you are
 * about to ask. **The page you landed on could not tell you.** A non-mutual sees
 * nothing of somebody's record — by design — so the destination was the handle
 * you had just typed, an *Add* button, and *This list is not shared with you*.
 * Reported as confusing, and it was worse than that: **it read as done.** The
 * request had not been sent, the field had only navigated, and the failure was
 * silent — the exact failure this whole feature exists to remove.
 *
 * ⚠ **So the field ADDS, and a typo is answered in place.** *No such person.*
 * lands under the field, which is the check the detour was reaching for and
 * could not perform. **What it costs, stated: a typo that happens to be
 * somebody's real handle sends them a request.** They see a handle they do not
 * know and decline it; nothing about them is disclosed by being asked.
 *
 * ⚠ **This is not search and must not become it.** §2 rules out discovery: no
 * directory, no stranger search, no suggestions, no partial matching. It takes a
 * handle you were given and asks that person — which is why the shape is checked
 * here and existence is answered by the mutation, rather than by an endpoint
 * that would tell a caller which handles exist.
 *
 * ⚠ **A leading `@` is stripped here and NOT in `normaliseHandle`.** People type
 * the handle as they were told it, and §5 shows handles with their `@`
 * everywhere. Folding the `@` into the shared normaliser would let it through at
 * onboarding too, where `@sam` and `sam` becoming one handle is a rule about
 * identity rather than a convenience.
 */
export function AddPerson() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function add(event: React.FormEvent) {
    event.preventDefault()

    const typed = value.trim().replace(/^@/, '')
    const parsed = validateHandle(typed)
    if (!parsed.ok) {
      /*
        `reserved` cannot be reached usefully from here — a reserved word is not
        a person — and its copy says *that handle is taken*, which is
        onboarding's sentence rather than this one's. Both land on the shape
        message, which is the true statement either way: what was typed is not a
        handle.
      */
      setError(HANDLE_ERROR_COPY.shape)
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await trackAction(parsed.handle)
      if (!result.ok) {
        setError(result.message)
        return
      }
      /*
        ⚠ **The field empties and the list is what confirms it.** `trackAction`
        calls `refresh()`, so the person arrives in People below marked
        *Requested* — the state is on the row where the relationship lives,
        rather than in a message that would say the same thing and then vanish.
      */
      setValue('')
    })
  }

  return (
    <form onSubmit={add} className="mb-4 flex flex-col gap-2">
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
          disabled={isPending}
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
          className="input-text border-rule focus:border-text min-w-0 flex-1 rounded border bg-transparent px-2 py-1 transition-colors outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Full strength at body size, as everywhere else a failure is reported. */}
      {error && <p className="text-sm">{error}</p>}
    </form>
  )
}
