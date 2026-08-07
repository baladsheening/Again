import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db } from '@/lib/db/client'
import { account, session, user, verification } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'

/**
 * `lib/auth.ts` is the one place outside `lib/db/` allowed to hold a Drizzle
 * handle, because Better Auth owns its four tables and manages them itself.
 * Application data still goes through `lib/db/` without exception (§3).
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  advanced: {
    database: {
      // Keeps `user.id` a real uuid so `profiles.id` can reference it (§5).
      generateId: 'uuid',
    },
    // §10: SameSite=Lax, httpOnly, Secure.
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,

    /**
     * One hour, not Better Auth's default of one. Same number, stated here so
     * changing it is a decision rather than an accident.
     */
    resetPasswordTokenExpiresIn: 60 * 60,

    /**
     * Reset is the flow someone reaches for when they think another person is
     * in their account. Leaving the other sessions alive would defeat the point:
     * the attacker keeps a valid 30-day cookie and the owner has done nothing
     * but change a string.
     */
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        body: [
          'Someone asked to reset the password for this account.',
          '',
          url,
          '',
          'The link works once and expires in an hour. If this was not you,',
          'ignore this email — nothing has changed yet.',
        ].join('\n'),
      })
    },
  },

  session: {
    // Sessions in Postgres (§3). Rolling refresh so an active user stays in.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  /**
   * Magic link was removed once password reset existed. It was carried for
   * account recovery, which it never actually did — it signs you in without
   * ever letting you repair the password — and reset does that properly now.
   * What remained was a second way to do something that already worked.
   *
   * It also left the user population inconsistent: `disableSignUp` was not set,
   * so a magic link could create an account with no password at all, which
   * reset cannot then fix (`resetPassword` expects a credential to replace).
   * One way in, one way back in.
   */
  plugins: [
    // Must stay last: it wraps the others to set cookies from Server Actions.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
