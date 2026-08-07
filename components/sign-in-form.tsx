'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authClient } from '@/lib/auth-client'

type Mode = 'sign-in' | 'sign-up' | 'magic-link'

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
      if (mode === 'magic-link') {
        const { error } = await authClient.signIn.magicLink({ email })
        setMessage(error ? error.message ?? 'That did not work.' : 'Check your email.')
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

      {mode !== 'magic-link' && (
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

      <button
        type="submit"
        disabled={busy}
        className="border-rule hover:border-text mt-1 rounded-md border px-4 py-2 text-sm transition-colors disabled:opacity-50"
      >
        {busy
          ? 'One moment…'
          : mode === 'sign-up'
            ? 'Create account'
            : mode === 'magic-link'
              ? 'Send a link'
              : 'Sign in'}
      </button>

      {message && <p className="text-muted text-sm">{message}</p>}

      <div className="text-muted flex flex-wrap gap-3.5 text-xs">
        {mode !== 'sign-in' && (
          <Switch onClick={() => setMode('sign-in')}>Sign in with a password</Switch>
        )}
        {mode !== 'sign-up' && (
          <Switch onClick={() => setMode('sign-up')}>Create an account</Switch>
        )}
        {mode !== 'magic-link' && (
          <Switch onClick={() => setMode('magic-link')}>Email me a link</Switch>
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
      className="hover:text-text underline underline-offset-4 transition-colors"
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
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted text-xs">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="bg-surface border-rule focus:border-muted rounded-md border px-3 py-2 outline-none transition-colors"
      />
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  )
}
