'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ChevronIcon } from '@/components/icon-chevron'
import { EyeIcon } from '@/components/icon-eye'
import { authClient } from '@/lib/auth-client'

type Mode = 'sign-in' | 'sign-up' | 'reset'

/**
 * One class string for every control in the form — inputs and the submit button
 * alike. There were two of these, a size each, and they drifted once with a
 * silent symptom: the row they were then in stopped lining up. There is no row
 * any more (the form is always stacked) and there is no second size, so the way
 * that happened is gone rather than guarded against.
 *
 * `control-box` (app/globals.css) pins line-height and vertical padding, which
 * between them are the whole of a control's height, and grows on a coarse
 * pointer to clear the 44px touch-target floor without any caller knowing.
 * `input-text` is 13px, and 16px on touch because iOS Safari zooms the viewport
 * on focus below that.
 *
 * Both are utilities that set one property each. A Tailwind size like `text-sm`
 * sets font-size **and** line-height, so it would fight `control-box` for the
 * height — that is the specific mistake, and it is why this is not `text-sm`.
 */
const CONTROL_TEXT = 'control-box input-text'

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
        Stacked at every width. The fields and the button are direct children of
        the form, which is the same `flex flex-col gap-3` the wrapper around them
        used to be — so removing that wrapper changed no spacing. There is no
        breakpoint here on purpose; see docs/decisions.md.
      */}
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
        No `mt-1`. The submit is one gap-3 from the last field, the same 12px that
        separates the fields from each other, so the whole form is on one rhythm
        rather than setting the button slightly apart. The optical centring on
        /sign-in is derived from these gaps — changing one means recomputing it.
      */}
      <button
        type="submit"
        disabled={busy}
        className={`border-rule hover:border-text rounded-md border px-4 transition-colors disabled:opacity-50 ${CONTROL_TEXT}`}
      >
        {busy
          ? 'One moment…'
          : mode === 'sign-up'
            ? 'Create account'
            : mode === 'reset'
              ? 'Send reset link'
              : 'Sign in'}
      </button>

      {message && <p className="text-muted text-sm">{message}</p>}

      {/*
        `mt-4` on top of the form's gap-3 makes 28px, which is `gap-7` — the same
        distance the tagline sits above the first field. These switches change what
        the form is, so they are not part of its rhythm; setting them at the gap
        that separates the header from the form says that. It is the one place in
        this form that overrides the gap, which is why the number is written as the
        arithmetic it is rather than as `mt-4` with no explanation.

        Careful: /sign-in's optical centring is derived from what sits below the
        fields, and this is part of it (docs/decisions.md).
      */}
      <div className="text-muted mt-4 flex flex-wrap gap-3.5 text-xs">
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
    // A chevron instead of an underline. Three underlined phrases in a row at
    // 12px is a lot of rule for very little text, and the underline was also the
    // heaviest thing on a page whose only real content is two boxes. The chevron
    // carries the affordance and colour carries the hover.
    //
    // `inline-flex items-center` keeps the glyph on the text's baseline block
    // rather than the line box's, and `gap-1` is tight on purpose: the chevron is
    // a marker on the phrase, not a sibling of it.
    <button
      type="button"
      onClick={onClick}
      className="hover:text-text tap-target inline-flex items-center gap-1 transition-colors"
    >
      <ChevronIcon />
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
    // gap-1 holds the hint under the input. The field is full width at every
    // size; the `min-w-0 flex-1` pair that used to be here was for sharing a row
    // with the other fields, and there is no row now.
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={label}
          // The name lives inside the field, so it goes the instant anything is
          // typed. `aria-label` carries it for a screen reader independently of
          // that — a placeholder is decoration that happens to read as a name,
          // and it is the wrong thing to leave a field's only name resting on.
          aria-label={label}
          // Mono on passwords, for the same functional reason the handle field
          // gets it (§10 homoglyphs): the moment these characters are visible,
          // telling l from 1 from I is the entire job. Applied whether or not it
          // is currently revealed, so toggling does not reflow the text.
          //
          // The placeholder is exempt — it is interface text, not a password,
          // and in mono it read as a different kind of thing to the field beside
          // it. pr-11 on password fields only, so the text never runs under the
          // eye.
          className={`bg-surface border-rule placeholder:text-muted focus:border-muted w-full rounded-md border pl-3 outline-none transition-colors ${
            isPassword ? 'pr-11 font-mono placeholder:font-sans' : 'pr-3'
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
