import 'server-only'

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins/magic-link'

import { db } from '@/lib/db/client'
import { account, session, user, verification } from '@/lib/db/schema'

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
  },

  session: {
    // Sessions in Postgres (§3). Rolling refresh so an active user stays in.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // No email provider is wired yet — flagged rather than invented (§0).
        // Phase 1 decides between Resend and Postmark.
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Magic link requested but no email provider is configured.')
        }
        console.info(`[magic-link] ${email} -> ${url}`)
      },
    }),
    // Must stay last: it wraps the others to set cookies from Server Actions.
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
