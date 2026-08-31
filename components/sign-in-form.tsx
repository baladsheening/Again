'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
        ⚠ **This said *no `mt-1`* and it now carries `mt-2` — 31 August, and the
        rule it broke is deleted rather than broken.** The old note was: the
        submit sits one `gap-3` from the last field, the same 12px that separates
        the fields, so the form is on one rhythm rather than setting the button
        slightly apart. **That was right while the submit was a box the size of a
        field.** It is a word now, and a word on the fields' own rhythm reads as
        a third field rather than as the thing you press. The extra 8px is the
        smallest amount that says so.

        Its second sentence is gone with the layout: /sign-in's optical centring
        was two measured `pb-` corrections and they are deleted — see the
        docblock on `app/sign-in/page.tsx` for why the condition went.
      */}
      {/*
        ⚠ **The submit is the serif, underlined — a word rather than a box.** It
        is `self-start` so the rule under it is as wide as the word and not as
        wide as the form: a full-width underline beneath two full-width field
        rules is three identical lines down the page, and the one that is a
        control has to be the one that looks unlike the others.

        `zine-command` carries the face, the case and the tracking; the size is
        a call-site pair for the reason its docblock gives. It is deliberately
        NOT `CONTROL_TEXT` — `control-box`'s coarse-pointer growth would put air
        between the word and its own underline, and the underline is the control.

        ⚠⚠ **`tap-target`, and it is not optional — `zine.mjs` caught its
        absence.** Dropping `control-box` dropped the 44px floor with it: this
        measured **30.8px on a 390 handset**, and the comment that stood here
        claimed 1.875rem cleared 44 on its own, which was reasoned rather than
        measured and was wrong. `tap-target` puts the floor back through a
        pseudo-element, so the hit area is 44px and **the drawing does not move
        by a pixel** — the same fix `docs/decisions.md` names for the sign-out
        pill, applied before it could ship rather than a fortnight after.
      */}
      <button
        type="submit"
        disabled={busy}
        className="zine-command border-text hover:text-muted hover:border-muted tap-target mt-2 self-start border-b-[1.5px] pb-1 text-[1.875rem] normal-case transition-colors disabled:opacity-50"
      >
        {busy
          ? 'one moment…'
          : mode === 'sign-up'
            ? 'create account'
            : mode === 'reset'
              ? 'send reset link'
              : 'sign in'}
      </button>

      {/*
        Not `text-muted`. This is the only failure message in the product, and
        setting it in the colour reserved for de-emphasised metadata made a
        refused password read as an aside — reported by someone who typed the
        wrong one on purpose and nearly missed the response. Full-strength text
        rather than a new colour token: §11 keeps the palette small, amber is
        spoken for, and the message being grey was the whole problem.

        Carries both outcomes, so it cannot be coloured by meaning without first
        being split by meaning — the reset path sets a neutral notice here too.
      */}
      {message && <p className="text-sm">{message}</p>}

      {/*
        These switches change what the form *is*, so they are deliberately not on
        its rhythm — `mt-6` on top of the form's `gap-3` is 36px against the 12px
        between fields, which is what says so.

        ⚠ **It was `mt-4`, whose whole justification was that 16 + 12 = 28 = the
        `gap-7` the tagline sat above the first field.** There is no tagline and
        no `gap-7` on this wall any more, so the arithmetic pointed at nothing;
        the number is now simply large enough to separate a switch from a
        control, and it is stated as that rather than derived from a gap that
        left.

        ⚠ **Stacked, not wrapped.** `flex-wrap` in a row was right for three
        12px phrases; at `zine-label`'s 0.2em tracking they no longer fit a
        handset's column side by side, and a wrapped row of two-then-one reads as
        a mistake.
      */}
      <div className="text-muted mt-6 flex flex-col items-start gap-1">
        {mode !== 'sign-in' && (
          <Switch onClick={() => setMode('sign-in')}>sign in with a password</Switch>
        )}
        {mode !== 'sign-up' && (
          <Switch onClick={() => setMode('sign-up')}>create an account</Switch>
        )}
        {mode === 'sign-in' && (
          <Switch onClick={() => setMode('reset')}>reset password</Switch>
        )}
      </div>
    </form>
  )
}

function Switch({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    // ⚠ **The chevron is gone — 31 August, with the zine treatment's *no icons*
    // rule.** Its argument was that three *underlined* phrases in a row at 12px
    // is a lot of rule for very little text, and that argument is untouched:
    // these are not underlined either. What replaced the rule is the typewriter
    // label — mono, lowercase, widely tracked — which reads as a switch because
    // nothing else on the wall is set that way, and colour still carries the
    // hover. `ChevronIcon` is drawn elsewhere and stays in the tree.
    //
    // Stacked rather than wrapped in a row: at this tracking three phrases on
    // one line run past a handset's column and wrap unevenly.
    <button
      type="button"
      onClick={onClick}
      className="zine-label hover:text-text tap-target block text-start transition-colors"
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
    // gap-1 holds the hint under the input. The field is full width at every
    // size; the `min-w-0 flex-1` pair that used to be here was for sharing a row
    // with the other fields, and there is no row now.
    <div className="flex flex-col gap-1">
      {/*
        ⚠ **The name came OUT of the field and became a real `<label>` — 31
        August, with the zine treatment.** It was a `placeholder` carrying an
        `aria-label` beside it, which is the arrangement a box affords: the name
        sits in the box until you type. **A rule is not a box and has no inside**,
        so the name has to stand above it — and once it does, the honest element
        is a `<label>`, which gives the rule a click target and a name that does
        not vanish the moment somebody types. The `aria-label` that stood in for
        it is deleted rather than kept beside it: two names on one field is one
        of them going stale.
      */}
      <label htmlFor={id} className="zine-label text-muted mb-1 block">
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
          // ⚠ **`field-rule` is the zine treatment's field: a border-bottom and
          // nothing else.** `control-box` still comes with `CONTROL_TEXT`, so
          // the box keeps its height and the 44px touch floor on a coarse
          // pointer — what went is the surface, the border and the radius, not
          // the hit area. `focus:border-muted` is deleted with them: the focus
          // signal on a rule is the caret and the browser's own ring, and a
          // hairline that dims on focus reads as the field going away.
          //
          // pr-14 on password fields only, so the text never runs under the
          // reveal.
          className={`field-rule ${isPassword ? 'pr-14 font-mono' : ''} ${CONTROL_TEXT}`}
        />
        {isPassword && (
          // ⚠ **Raw text, not the eye — 31 August.** The brief forbids icons and
          // this is the one place the app had a control that *was* a picture:
          // `EyeIcon` is still drawn for nothing else and stays in the tree. A
          // word also states which way the toggle goes, which an eye with a slash
          // through it never quite does.
          //
          // inset-y-0 gives it the input's full height, so it clears 44px on
          // touch for free once `control-box` grows. min-w-11 does the same for
          // width, and only on touch — 44px of it on a desktop would be eating
          // field width to no purpose.
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="zine-label text-muted hover:text-text absolute inset-y-0 right-0 flex items-center justify-center transition-colors pointer-coarse:min-w-11"
          >
            {revealed ? 'hide' : 'show'}
          </button>
        )}
      </div>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  )
}
