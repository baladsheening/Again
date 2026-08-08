'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'

import { EyeIcon } from '@/components/icon-eye'
import { authClient } from '@/lib/auth-client'

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

      <button
        type="submit"
        disabled={busy}
        // `control-box input-text`, the same pair the fields wear, so the button
        // is set in the form's one size rather than a size of its own. No `mt-1`,
        // for the same reason as the sign-in submit: one gap for the whole form.
        className="border-rule hover:border-text control-box input-text rounded-md border px-4 transition-colors disabled:opacity-50"
      >
        {busy ? 'One moment…' : 'Set password'}
      </button>

      {message && <p className="text-muted text-sm">{message}</p>}
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
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          placeholder={label}
          // As on sign-in: the field names itself from the inside, and the name
          // disappears as soon as there is a value, so `aria-label` holds it for
          // a screen reader rather than the placeholder being the only one.
          aria-label={label}
          // Mono for the same reason as the sign-in password field — a revealed
          // password is read character by character, which is what mono is for.
          // The placeholder is interface text and stays sans, so these two read
          // as the same kind of field as the ones on sign-in.
          className="bg-surface border-rule placeholder:text-muted focus:border-muted control-box input-text w-full rounded-md border pr-11 pl-3 font-mono outline-none transition-colors placeholder:font-sans"
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'Hide password' : 'Show password'}
          className="text-muted hover:text-text absolute inset-y-0 right-0 flex items-center justify-center px-3 transition-colors pointer-coarse:min-w-11"
        >
          <EyeIcon off={revealed} />
        </button>
      </div>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  )
}
