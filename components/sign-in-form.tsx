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
    <form onSubmit={submit} data-mode={mode} className="flex flex-col gap-3">
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
      {/*
        ⚠⚠ **THE HOVER DIM IS DELETED AND THE GROWTH REPLACES IT — 1 September.**
        It was `hover:text-muted hover:border-muted`, and it was the only
        direction available when colour was the whole hover vocabulary: this
        control is already full-strength ink on a full-strength rule, so the one
        thing it could do on hover was *recede*.

        **Grow and dim are contradictory signals** — one advances, one retreats —
        and shipping both would have made the cursor say two things at once. The
        growth is the better of the two because it is the one that means *this is
        the control*, so the dim goes rather than being kept alongside. See
        `control-lift`, which also states why a disabled submit does not grow.
      */}
      <button
        type="submit"
        disabled={busy}
        className="zine-command border-text control-lift tap-target mt-2 self-start border-b-[1.5px] pb-1 text-[1.875rem] normal-case transition-colors disabled:opacity-50"
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
      {/*
        ⚠⚠ **`gap-1` IS GONE BECAUSE THE SWITCHES WERE OVERLAPPING EACH OTHER'S
        HIT AREAS — 1 September, and one of them did not work.** Measured on a
        390 handset: `zine-label` is a 14.3px line, the gap was 4px, so the
        centres sat **18.3px apart while each wore a 44px `tap-target`**. Two
        44px areas 18px apart overlap by 26px and the later one in DOM order
        takes the tap — so `elementFromPoint` at the centre of *create an
        account* returned **reset password**. Tapping one control activated the
        other, on the pre-auth screen a new account meets first.

        It is the failure `--bar-gap` was written to prevent, and it was live.

        ⚠ **The fix is to remove the invisible box, not to space it out.**
        `tap-target` exists for controls whose drawn box must stay small — a
        glyph in a bar, where there is no room to grow into. These are three
        words in open space: they can simply BE 44px tall. A real box cannot
        overlap its neighbour, so the bug becomes unexpressible rather than
        corrected for. See `Switch`. The gap goes because the boxes now carry
        the rhythm; 44px of box against 4px of gap would be 48px of pitch and
        the extra 4 says nothing.
      */}
      <div className="text-muted mt-6 flex flex-col items-start pointer-coarse:gap-1">
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
    // ⚠ **The colour hover STAYS here, where the submit's went — 1 September.**
    // These sit at `text-muted`, so they have somewhere to brighten *to*, and
    // brightening and growing are the same signal pointing the same way. The
    // submit had neither: already full strength, its only colour move was to
    // dim, which fights a growth. Two controls, two answers, and the difference
    // is which end of the palette each one starts at.
    //
    // ⚠⚠ **`min-h-[--tap-floor]` REPLACES `tap-target`, and it fixed a control
    // that did not work** — see the stack above for the measurement. The
    // pseudo-element gave a 44px hit area on a 14px box, so three of them in a
    // 4px-gapped stack overlapped and one switch answered for its neighbour.
    // **A real box is the fix**: it is exactly as tall, it cannot overlap
    // anything, and there is nothing invisible left to collide.
    //
    // ⚠ **`items-center` and NOT `py-*`.** Padding would need the line's height
    // to be known here to land on 44, which is a face measurement written in a
    // component; a minimum height with the text centred in it needs no number
    // and follows `zine-label` wherever it goes.
    //
    // ⚠ **The box hugs the word — it is deliberately NOT `w-full`.** A
    // full-width box would be a wider thumb target, and it would also be the
    // thing `control-lift` scales: 8% of the whole column pushes the right edge
    // past it, and this app has never had a horizontal scrollbar. The word is
    // the control, so the word plus its height is the target.
    //
    // ⚠⚠ **THE DESK HAS A FLOOR HERE AND THE HANDSET DELIBERATELY DOES NOT — 1
    // September, directed, and the two halves were decided separately.**
    //
    // **Desk:** *as short as possible without impacting the usability and the
    // hover lift.* A mouse's target floor is 24px (WCAG 2.5.8) where a thumb's
    // is 44, so `--click-floor` is what a fine pointer gets. ⚠ **It is not a
    // smaller `--tap-floor`; it is a different measurement of a different input
    // device**, which is why it is its own token and why neither scales.
    //
    // ⚠ **The 4px between desk rows protects the hover lift and must not
    // close.** `control-lift` scales the box 8% about its vertical centre, so a
    // 24px row grows 0.96px each way — and a transform DOES move hit-testing, so
    // touching boxes would overlap on hover and flicker as the cursor crossed
    // between them. That is where "as short as possible" stops.
    //
    // ⚠⚠ **HANDSET: NO MINIMUM AT ALL, AND THE 44px BOX I PUT HERE IS REVERTED —
    // directed.** For a few hours these were `min-h-[var(--tap-floor)]`, which
    // took the stack from 32.6px to 88 on a phone. **That height was never
    // asked for**; it arrived as my fix for the overlap below and was bundled
    // into a commit about something else. The stack is back to what it was.
    //
    // ⚠ **What does NOT come back is the overlap, and that is the whole point of
    // reverting this way.** The bug was never the tight spacing — it was
    // `tap-target` painting a 44px pseudo-element on a 14.3px box, so three of
    // them on an 18.3px pitch overlapped by 26px and the later one in DOM order
    // took the taps: `elementFromPoint` at the centre of *create an account*
    // returned *reset password*. **With no pseudo-element the hit area is the
    // box, and boxes in a column cannot overlap.** Same height as before, and
    // every control answers its own taps.
    //
    // ⚠ **The price, stated: a handset target here is 14.3px, well under
    // `--tap-floor`.** That is a deliberate choice made with the number in front
    // of it — 44px targets need 44px of pitch and there is no construction that
    // avoids it, because unlike the foot's chips these have a neighbour above
    // and below to hang into. **If these ever read as hard to hit, the fix is
    // `pointer-coarse:min-h-*` here, and the cost is the stack's height.**
    <button
      type="button"
      onClick={onClick}
      className="zine-label hover:text-text control-lift flex items-center text-start transition-colors pointer-fine:my-0.5 pointer-fine:min-h-[var(--click-floor)]"
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
    // ⚠ **`gap-1` IS GONE FROM THE STACK AND EACH JOINT NOW STATES ITS OWN — 1
    // September.** One gap was serving two joints that want different things:
    // label-to-field, which the direction asked to close to almost nothing, and
    // input-to-hint, which is a sentence under a control and wants normal air.
    // With both on one declaration the label's spacing could not be touched
    // without moving the hint, and the label's `mb-1` was quietly adding to it —
    // 4 + 4 = 8px where the markup read like 4.
    //
    // The field is full width at every size; the `min-w-0 flex-1` pair that used
    // to be here was for sharing a row with the other fields, and there is no
    // row now.
    <div className="flex flex-col">
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
      {/*
        ⚠ **The margin is DERIVED, and it is the gap under the INK rather than
        under the box — 1 September.** Directed: the label as close to the top of
        its field as possible, keeping a tiny space beneath any descender. It was
        `mb-1` on top of the stack's `gap-1`, which put **8.6px between the `p` of
        *password* and the top of the field**; it is `--label-ink-gap` now, which
        is 2px, because the margin subtracts the slack the line box already holds
        under the descender. See the two tokens in globals.css.

        The subtraction is what makes this hold on both surfaces without a
        second number: both terms are `em` of the label's own type, so the desk
        gets the same optical gap at 4/3 and nothing here knows about a
        breakpoint.
      */}
      <label
        htmlFor={id}
        className="zine-label text-muted mb-[calc(var(--label-ink-gap)-var(--label-ink-foot))] block"
      >
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
      {/* ⚠ Its own `mt-1`, which is the `gap-1` the stack used to give it. The
          gap left so the label could be closed up; this joint did not change and
          says so itself now. */}
      {hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
    </div>
  )
}
