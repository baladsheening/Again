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
 *
 * The database check below is the exception: it fails a **preview** build too.
 * A preview with no limiter is a rehearsal, but a preview writing to production
 * is not a rehearsal at all — it is production, wearing a different URL.
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
/** Fails any build, not only a production one. See the header. */
const hardFailures = []

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

if (!set('TMDB_READ_ACCESS_TOKEN')) {
  failures.push(
    'No TMDB_READ_ACCESS_TOKEN. Search and the cinema wall are both this key, ' +
      'so the app deploys, signs people in and then cannot find a single film. ' +
      'It is optional in lib/env.ts on purpose — the schema is phase-gated so a ' +
      'partial .env.local still boots — which makes this the only place the ' +
      'requirement is stated.',
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

/*
  The two databases, split 17 August. `production` serves the live site; the
  `development` branch serves this machine and every preview deployment.

  Nothing about a mispointing looks wrong from outside, which is the whole reason
  it is checked here rather than trusted: Vercel holds environment variables as
  one record per name with a list of targets, so the natural mistake — the one
  this project actually made — is a single DATABASE_URL aimed at Production and
  Preview together. `vercel env pull` reintroduces it locally in one command.

  Only the production host is named, because it is the only one that must never
  be reached by accident. It is a hostname, not a credential.

  ⚠ If the production branch is ever recreated its endpoint id changes and this
  constant goes stale — at which point the **production** build fails and says
  so, rather than passing quietly. That direction is deliberate.
*/
const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'

const dbHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').hostname
  } catch {
    return ''
  }
})()

if (dbHost) {
  const onProductionDb = dbHost === PRODUCTION_DB_HOST

  if (isProduction && !onProductionDb) {
    hardFailures.push(
      `A production build is pointed at ${dbHost}, which is not the production ` +
        'database. Either the Vercel Production value is wrong, or the production ' +
        'branch was recreated and PRODUCTION_DB_HOST in this file needs updating — ' +
        'check which before changing anything.',
    )
  }

  if (onProductionDb && process.env.VERCEL_ENV === 'preview') {
    hardFailures.push(
      'This preview is pointed at the production database. Previews belong on the ' +
        'Neon `development` branch — a preview that writes to production is not a ' +
        'rehearsal, it is production. Vercel is most likely holding one DATABASE_URL ' +
        'record targeting Production and Preview together; it must be two records.',
    )
  }

  if (onProductionDb && !onVercel) {
    notices.push(
      'DATABASE_URL points at the production database, so `npm run dev` and ' +
        '`npm run db:migrate` write to what the live site reads. Local work belongs ' +
        'on the Neon `development` branch — see .env.example. Most likely cause: ' +
        '`vercel env pull` overwrote .env.local.',
    )
  }
}

/*
  A notice and never a failure. Images are the one part of the product that is
  optional by construction: without a store the camera glyph is dark, which is
  the foot's own rule about a control that cannot act — so a deploy with no Blob
  store is a deploy without photographs, not a broken one. Saying so is what
  stops a dark camera being investigated as a bug.
*/
if (!set('BLOB_READ_WRITE_TOKEN')) {
  notices.push(
    'No BLOB_READ_WRITE_TOKEN, so the camera is off. Photographs need a Vercel ' +
      'Blob store; create one, link it to this project, and the glyph lights on ' +
      'the next deploy with no code change.',
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

if (hardFailures.length > 0) {
  console.error(
    `\npreflight failed — refusing to build against the wrong database\n`,
  )
  for (const failure of hardFailures) console.error(`  - ${failure}\n`)
  process.exit(1)
}

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
