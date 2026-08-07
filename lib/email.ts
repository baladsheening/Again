import 'server-only'

/**
 * The single outbound email path.
 *
 * Exactly one flow needs it: password reset. Magic link was the other caller and
 * was removed once reset existed, since it never repaired an account — it only
 * signed you into one.
 *
 * The indirection stays anyway. It is where the provider gets wired, and a
 * second caller (an email change, say) must not reinvent the failure behaviour.
 *
 * No provider is chosen yet (Resend or Postmark; see docs/plan.md). Until one
 * is, this logs in development and throws in production rather than resolving
 * silently. Throwing is deliberate: a recovery email that reports success and
 * never arrives locks someone out of their account while telling them to go and
 * check their inbox.
 *
 * §2 is not in play here — this is not a notification channel. Notifications are
 * push and stay push (§6). Email exists in this app only so that somebody who
 * cannot sign in can get back in.
 */

export type OutboundEmail = {
  to: string
  subject: string
  /** Plain text. There is no HTML template and no tracking pixel. */
  body: string
}

export async function sendEmail(message: OutboundEmail): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Email requested ("${message.subject}") but no provider is configured. ` +
        'Set one up before deploying — see docs/plan.md.',
    )
  }

  console.info(
    `\n[email] to: ${message.to}\n[email] subject: ${message.subject}\n${message.body}\n`,
  )
}
