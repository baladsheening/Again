'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'

import { authClient } from '@/lib/auth-client'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The zine treatment reaches this screen — 3 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed: *make the reset screen match the wall.* It did not — this form was
 * the pre-31-August one, with filled boxes, rounded corners, a solid submit and
 * an eye icon, and the sign-in wall beside it had been rules, typewriter labels
 * and a serif word for three days. **A recovery flow is the same product**, and
 * it is reached from a link in an email by somebody who has just been looking at
 * the wall.
 *
 * ⚠ **Nothing here is a new decision. Every class on this page is the wall's,
 * and the reasoning stays in `components/sign-in-form.tsx`** — `field-rule` for
 * a field that is a rule rather than a box, `zine-label` for the name above it,
 * `zine-command` for a submit that is a word with its own underline, `show` and
 * `hide` as words because the brief forbids icons. Do not re-argue any of them
 * here; two copies of one argument is the drift `notificationCopy` warns about.
 *
 * ⚠ **`EyeIcon` is no longer imported and that is the point of the change, not a
 * side effect.** It is still drawn in the tree and used by nothing, exactly as
 * the wall left it on 31 August.
 *
 * ⚠ **`CONTROL_TEXT` is duplicated from the wall rather than exported, and that
 * is deliberate.** It is two utilities in a string; a shared constant would be a
 * module both forms import for one line, and the thing that must not drift —
 * `control-box`'s coarse-pointer growth and `input-text`'s 16px iOS floor — is
 * in the utilities, which are already shared.
 */
const CONTROL_TEXT = 'control-box input-text'

/**
 * §10 wants Zod at every boundary, and this is one — the server enforces the
 * length independently, but finding out you mistyped the confirmation only
 * after a round trip that also burns the single-use token is a bad way to learn
 * it. The token is spent whether or not the new password is accepted.
 */
const schema = z
  .object({
    // Matches `minPasswordLength` in lib/auth.ts.
    password: z.string().min(10, 'At least 10 characters.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Those do not match.',
    path: ['confirm'],
  })

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = schema.safeParse({ password, confirm })
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Check the fields above.')
      return
    }

    setBusy(true)
    setMessage(null)

    try {
      const { error } = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      })

      if (error) {
        setMessage(error.message ?? 'That link is no longer valid.')
        return
      }

      // Every other session was revoked server-side, so this is a real sign-in
      // rather than a redirect into a session that still exists.
      router.push('/sign-in')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Field
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint="At least 10 characters."
      />
      <Field
        label="Confirm"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {/*
        ⚠ **The submit is the serif, underlined — a word rather than a box**, and
        every term here is the wall's submit unchanged: `self-start` so the rule
        is as wide as the word rather than as wide as the form, `tap-target`
        because dropping `control-box` drops the 44px floor with it, and
        `control-lift` for the cursor. The full argument for each is on the wall's
        button; see `components/sign-in-form.tsx`.

        ⚠ **`normal-case` because `zine-command` is uppercase**, and the two words
        of a command are set the way the wall sets *sign in* — lowercase in the
        markup, and the utility's `text-transform` turned off rather than the
        markup shouting.
      */}
      <button
        type="submit"
        disabled={busy}
        className="zine-command border-text control-lift tap-target mt-2 self-start border-b-[1.5px] pb-1 text-[1.875rem] normal-case transition-colors disabled:opacity-50"
      >
        {busy ? 'one moment…' : 'set password'}
      </button>

      {/*
        ⚠ **Not `text-muted`, and it used to be.** This is the wall's rule
        applied to the screen that shares its failure modes: a refused password
        set in the colour reserved for de-emphasised metadata reads as an aside,
        which was reported on the wall by somebody who typed the wrong password
        on purpose and nearly missed the response. **A mistyped confirmation here
        also burns the token**, so the message this screen shows is the more
        expensive of the two to miss.
      */}
      {message && <p className="text-sm">{message}</p>}
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  hint?: string
}) {
  const id = `reset-${label.toLowerCase().replace(/\s+/g, '-')}`
  const [revealed, setRevealed] = useState(false)

  return (
    // No `gap-*` on the stack: each joint states its own spacing, because
    // label-to-field is closed to 2px of ink and input-to-hint is a sentence
    // under a control and wants normal air. One gap serving both is what the
    // wall's `Field` removed on 1 September.
    <div className="flex flex-col">
      {/*
        ⚠ **A real `<label>`, and the `placeholder` that stood in for it is
        deleted.** A box has an inside for a name to sit in and a rule does not,
        so the name stands above it — and once it does, the honest element is a
        `<label>`, which gives the rule a click target and a name that does not
        vanish the moment somebody types. The `aria-label` beside it goes for the
        same reason it went on the wall: two names on one field is one of them
        going stale.

        The margin is the gap under the *ink*, not under the box — both terms are
        `em` of the label's own type, so the desk gets the same optical gap at
        4/3 with no second number. See `--label-ink-gap` in globals.css.
      */}
      <label
        htmlFor={id}
        className="zine-label text-muted mb-[calc(var(--label-ink-gap)-var(--label-ink-foot))] block"
      >
        {label}
      </label>
      <div className="relative">
        {/*
          Mono for the reason the wall's password field has it, and the handle
          field before that (§10 homoglyphs): the moment these characters are
          visible, telling l from 1 from I is the entire job. Applied whether or
          not it is currently revealed, so toggling does not reflow the text.

          `pr-14` so the text never runs under the reveal.
        */}
        <input
          id={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`field-rule pr-14 font-mono ${CONTROL_TEXT}`}
        />
        {/*
          ⚠ **A word, not the eye — the brief forbids icons and this screen was
          the last place in the app that still had a control which *was* a
          picture.** A word also states which way the toggle goes, which an eye
          with a slash through it never quite does.

          `inset-y-0` gives it the input's full height, so it clears 44px on
          touch for free once `control-box` grows; `min-w-11` does the same for
          width, and only on touch.
        */}
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="zine-label text-muted hover:text-text absolute inset-y-0 right-0 flex items-center justify-center transition-colors pointer-coarse:min-w-11"
        >
          {revealed ? 'hide' : 'show'}
        </button>
      </div>
      {/* Its own `mt-1`, which is the gap the stack used to give it — the stack's
          gap left so the label could be closed up, and this joint did not
          change. */}
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
    </div>
  )
}
