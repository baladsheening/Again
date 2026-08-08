import 'server-only'

import { env } from '@/lib/env'

/**
 * The single outbound email path.
 *
 * Exactly one flow needs it: password reset. Magic link was the other caller and
 * was removed once reset existed, since it never repaired an account — it only
 * signed you into one.
 *
 * The indirection stays anyway. It is where the provider is wired, and a second
 * caller (an email change, say) must not reinvent the failure behaviour.
 *
 * §2 is not in play here — this is not a notification channel. Notifications are
 * push and stay push (§6). Email exists in this app only so that somebody who
 * cannot sign in can get back in.
 *
 * **Provider: Resend**, called over its REST API rather than through the `resend`
 * package. Same reasoning as `lib/rate-limit.ts`: §10 wants a written reason for
 * every dependency, and this is one POST with three headers. The SDK would add a
 * package to keep current in exchange for `await resend.emails.send`.
 */

export type OutboundEmail = {
  to: string
  subject: string
  /** Plain text. There is no HTML template and no tracking pixel. */
  body: string
}

/**
 * Resend's shared sender, which works with no domain and no DNS.
 *
 * ⚠ **It can only deliver to the address that owns the Resend account.** That is
 * enough to prove reset works on a deployment, and it is not enough for a second
 * person. The first friend who forgets a password needs a verified domain in
 * `EMAIL_FROM` — and the failure is silent to them, because a 403 here throws on
 * our side while they just never receive anything.
 */
const RESEND_TEST_SENDER = 'Again <onboarding@resend.dev>'

export async function sendEmail(message: OutboundEmail): Promise<void> {
  if (!env.RESEND_API_KEY) {
    /*
      No key. In development this is the normal case and the reset link goes to
      the terminal running `npm run dev` — documented in docs/plan.md, and the
      only way into an account right now.

      In production it throws. A recovery email that reports success and never
      arrives locks someone out while telling them to check their inbox, and
      `scripts/preflight.mjs` exists so this is never reached on a real deploy.
    */
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Email requested ("${message.subject}") but RESEND_API_KEY is unset. ` +
          'See .env.example.',
      )
    }

    console.info(
      `\n[email] to: ${message.to}\n[email] subject: ${message.subject}\n${message.body}\n`,
    )
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? RESEND_TEST_SENDER,
      to: [message.to],
      subject: message.subject,
      text: message.body,
    }),
    cache: 'no-store',
  })

  if (res.ok) return

  /*
    This deliberately does not fail open, which is the opposite of the choice in
    lib/rate-limit.ts — and the difference is worth stating, because the two sit
    next to each other and look alike.

    A limiter outage should not take the app down: the cost of failing open is
    that limits lapse for a few minutes. An email outage has no equivalent
    "carry on" — if this swallowed the error, Better Auth would return success,
    the UI would say check your inbox, and the account would be gone. Throwing
    surfaces it to the caller, which is the only honest option.

    The message body is read for the log, not shown to the user: it can name the
    recipient, and reset must not leak whether an address has an account.
  */
  const detail = await res.text().catch(() => '')
  throw new Error(
    `Resend rejected "${message.subject}" (${res.status}). ${detail}`.trim(),
  )
}
