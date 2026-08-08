#!/usr/bin/env node
/**
 * Deploy readiness. Runs before `next build` (see package.json).
 *
 * §10 calls rate limiting non-negotiable and the code has been there since the
 * first commit — but `lib/rate-limit.ts` silently falls back to an in-process
 * Map when Upstash is unset, and in serverless that is not protection at all:
 * every instance gets its own memory and an attacker lands on a different one.
 * Nothing about a deployment looks wrong when this happens. That is the whole
 * problem, and it is what this file exists to prevent.
 *
 * The same shape applies to email. `lib/email.ts` throws in production without a
 * key, so the failure surfaces — but it surfaces to the one person who has
 * already lost their password, which is far too late to learn about it.
 *
 * **Only production deploys fail.** Previews and local builds print the same
 * findings as notices and carry on, because a preview with no limiter is a
 * rehearsal and a local build with no limiter is Tuesday.
 */

import { existsSync } from 'node:fs'
import { config } from 'dotenv'

const onVercel = Boolean(process.env.VERCEL)
const isProduction = process.env.VERCEL_ENV === 'production'

// Vercel injects its own; locally the values live in .env.local, which
// `next build` would load itself — but this runs before it.
if (!onVercel && existsSync('.env.local')) config({ path: '.env.local', quiet: true })

const set = (name) => Boolean(process.env[name]?.trim())

const failures = []
const notices = []

if (!set('UPSTASH_REDIS_REST_URL') || !set('UPSTASH_REDIS_REST_TOKEN')) {
  failures.push(
    'Rate limiting has no backing store. UPSTASH_REDIS_REST_URL and ' +
      'UPSTASH_REDIS_REST_TOKEN are both required — without them lib/rate-limit.ts ' +
      'falls back to an in-process Map, which does not limit anything across ' +
      'serverless instances. It guards sign-in, sign-up and password reset.',
  )
}

if (!set('RESEND_API_KEY')) {
  failures.push(
    'No RESEND_API_KEY. Password reset is the only way back into an account, ' +
      'and lib/email.ts throws in production rather than reporting a success ' +
      'that never arrives. A deploy without this loses accounts.',
  )
}

const authUrl = process.env.BETTER_AUTH_URL?.trim()
if (!authUrl) {
  failures.push('BETTER_AUTH_URL is unset.')
} else if (/localhost|127\.0\.0\.1/.test(authUrl)) {
  failures.push(
    `BETTER_AUTH_URL still points at ${authUrl}. Reset links are built from it, ` +
      'so every recovery email would send people to their own machine.',
  )
}

if (set('RESEND_API_KEY') && !set('EMAIL_FROM')) {
  notices.push(
    "EMAIL_FROM is unset, so email sends from Resend's shared sender. That " +
      'delivers only to the address owning the Resend account — fine for proving ' +
      'reset works, silently useless for the first friend who forgets a password.',
  )
}

for (const notice of notices) console.warn(`\n  note: ${notice}`)

if (failures.length === 0) {
  console.log('preflight: ok')
  process.exit(0)
}

const heading = isProduction
  ? 'preflight failed — refusing to build for production'
  : `preflight found ${failures.length} problem(s) — not blocking a ${
      onVercel ? 'preview' : 'local'
    } build`

console[isProduction ? 'error' : 'warn'](`\n${heading}\n`)
for (const failure of failures) console[isProduction ? 'error' : 'warn'](`  - ${failure}\n`)

if (isProduction) {
  console.error('  Set these in the Vercel project, then redeploy. See .env.example.\n')
  process.exit(1)
}
