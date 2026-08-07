'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { EyeIcon } from '@/components/icon-eye'
import { authClient } from '@/lib/auth-client'

type Mode = 'sign-in' | 'sign-up' | 'reset'

/**
 * Shared rather than written out at each use, because they have already drifted
 * once and the symptom was silent — the row simply stopped lining up.
 *
 * `LABEL_TEXT` is worn by the field label and by the empty spacer above the
 * submit button, which only does its job if it renders at exactly the label's
 * height. `CONTROL_TEXT` goes on the inputs and the button alike, which in the
 * inline row derive their height from line-height plus the same padding.
 *
 * These are arbitrary values, which set font-size *without* a line-height —
 * unlike `text-sm` and friends, which set both. That is precisely how they came
 * apart last time, so do not swap one form for the other.
 */
const LABEL_TEXT = 'text-[12.5px]'
const FIELD_LABEL = `text-muted ${LABEL_TEXT}`

/**
 * `control-box` (app/globals.css) pins line-height and vertical padding, which
 * between them are the whole of a control's height. Both the inputs and the
 * submit button wear it, so they can carry different font sizes and still line
 * up in the inline row — and it grows on a coarse pointer to clear the 44px
 * touch-target floor without either of them being told about it here.
 *
 * `input-text` is 14px, and 16px on touch because iOS Safari zooms the viewport
 * on focus below that. The button keeps its own smaller size in both cases; it
 * is not a field, so nothing zooms on it.
 */
const CONTROL_TEXT = 'control-box input-text'
const BUTTON_TEXT = 'control-box text-[13.5px]'

export function SignInForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      if (mode === 'reset') {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: '/reset-password',
        })
        // Same words whether or not the address is registered. Better Auth is
        // careful about this server-side, including the timing; saying "no such
        // account" here would hand that back — this form would become a way to
        // ask whether someone has an account.
        setMessage(
          error
            ? error.message ?? 'That did not work.'
            : 'If that address has an account, a reset link is on its way.',
        )
        return
      }

      const { error } =
        mode === 'sign-up'
          ? await authClient.signUp.email({ email, password, name: name || email })
          : await authClient.signIn.email({ email, password })

      if (error) {
        setMessage(error.message ?? 'That did not work.')
        return
      }

      router.push('/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/*
        Stacked until INLINE_AT (see below), then one row. `items-start` rather
        than `items-end` because the password field grows a hint underneath it in
        sign-up mode — aligning to the bottom would shunt that one input out of
        line with the others. Aligning to the top instead lines the labels up,
        which lines the inputs up, and lets the hint hang harmlessly.
      */}
      <div className="flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-start">
        {mode === 'sign-up' && (
          <Field label="Name" value={name} onChange={setName} autoComplete="name" />
        )}

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        {mode !== 'reset' && (
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            required
            // §10 sets minPasswordLength to 10 server-side; say so before they type.
            hint={mode === 'sign-up' ? 'At least 10 characters.' : undefined}
          />
        )}

        {/*
          Mirrors Field's own shape — label slot, then control — so the button
          drops into the row already aligned with the inputs instead of being
          nudged down by a hard-coded offset. The slot wears the real label's
          classes for that reason; it is empty and hidden from assistive tech,
          since the button labels itself.
        */}
        <div className="flex flex-col gap-1 min-[560px]:shrink-0">
          <span
            aria-hidden="true"
            className={`hidden select-none min-[560px]:block ${FIELD_LABEL}`}
          >
            &nbsp;
          </span>
          <button
            type="submit"
            disabled={busy}
            className={`border-rule hover:border-text mt-1 rounded-md border px-4 transition-colors disabled:opacity-50 min-[560px]:mt-0 ${BUTTON_TEXT}`}
          >
            {busy
              ? 'One moment…'
              : mode === 'sign-up'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
          </button>
        </div>
      </div>

      {message && <p className="text-muted text-sm">{message}</p>}

      <div className="text-muted flex flex-wrap gap-3.5 text-xs">
        {mode !== 'sign-in' && (
          <Switch onClick={() => setMode('sign-in')}>Sign in with a password</Switch>
        )}
        {mode !== 'sign-up' && (
          <Switch onClick={() => setMode('sign-up')}>Create an account</Switch>
        )}
        {mode === 'sign-in' && (
          <Switch onClick={() => setMode('reset')}>Reset password</Switch>
        )}
      </div>
    </form>
  )
}

function Switch({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:text-text tap-target underline underline-offset-4 transition-colors"
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  required?: boolean
  hint?: string
}) {
  const id = `field-${label.toLowerCase()}`
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)

  return (
    // min-w-0 so the inputs share the row evenly and shrink rather than
    // overflowing it — flex items default to min-width:auto.
    <div className="flex flex-col gap-1 min-[560px]:min-w-0 min-[560px]:flex-1">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          // Mono on passwords, for the same functional reason the handle field
          // gets it (§10 homoglyphs): the moment these characters are visible,
          // telling l from 1 from I is the entire job. Applied whether or not it
          // is currently revealed, so toggling does not reflow the text.
          //
          // pr-10 on password fields only, so the text never runs under the eye.
          className={`bg-surface border-rule focus:border-muted w-full rounded-md border pl-3 outline-none transition-colors ${
            isPassword ? 'pr-11 font-mono' : 'pr-3'
          } ${CONTROL_TEXT}`}
        />
        {isPassword && (
          // inset-y-0 rather than a fixed height: the control matches the input
          // exactly and keeps doing so if the type scale moves again.
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            // inset-y-0 gives it the input's full height, so it clears 44px on
            // touch for free once `control-box` grows. min-w-11 does the same
            // for width, and only on touch — 44px of it on a desktop would be
            // eating field width to no purpose.
            className="text-muted hover:text-text absolute inset-y-0 right-0 flex items-center justify-center px-3 transition-colors pointer-coarse:min-w-11"
          >
            <EyeIcon off={revealed} />
          </button>
        )}
      </div>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  )
}
