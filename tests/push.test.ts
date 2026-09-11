/**
 * **Earned push — the server half, which is the half nothing else can see.**
 *
 * A headless browser cannot make a real subscription: `pushManager.subscribe()`
 * fails with `AbortError: Registration failed - permission denied` because
 * headless Chromium ships no push-service backend to register with. So
 * `node_modules/.probe/push.mjs` measures the offer and the permission, and
 * **everything downstream of a stored subscription is proved here** — against a
 * local HTTP server standing in for a push service, reading back exactly what
 * `web-push` put on the wire.
 *
 * What is asserted:
 *
 *   1. A subscription is stored, and **re-subscribing the same browser updates
 *      rather than accumulating** — a person has as many rows as browsers, and a
 *      duplicate is a second push to one device.
 *   2. ⚠ **Nobody can unsubscribe a device that is not theirs.** The endpoint is
 *      a URL a push service issued and is not secret; the user filter is what
 *      makes that not matter.
 *   3. `deliver` actually sends: a VAPID `Authorization`, `aes128gcm` content
 *      encoding, and a body that is **encrypted rather than the plain JSON** —
 *      which is the one thing a shape test would miss.
 *   4. ⚠⚠ **A GONE ENDPOINT IS PRUNED AND NOTHING ELSE IS.** `404`/`410` means
 *      the browser dropped it; a `500` is the push service having a bad minute,
 *      and deleting somebody's device over one would silently unsubscribe them.
 *   5. It sends nothing for a person with no devices, and never throws.
 *
 * ⚠ **Writes. Development branch only.** The guard below is `mark.test.ts`'s.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { createServer, type Server } from 'node:https'
import { createECDH, randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync as read, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'

const url = process.env.DATABASE_URL ?? ''
if (!url) throw new Error('DATABASE_URL is unset — see .env.local')
if (new URL(url).hostname === PRODUCTION_DB_HOST) {
  throw new Error('These tests write. DATABASE_URL points at production — refusing to run.')
}

neonConfig.webSocketConstructor ??= globalThis.WebSocket
const pool = new Pool({ connectionString: url })

const A = 'push-ada'
const B = 'push-bo'
let adaId = ''
let boId = ''

type Dal = typeof import('@/lib/db')
let dal: Dal
let deliver: typeof import('@/lib/push').deliver

const asViewer = (id: string, handle: string) =>
  ({ id, email: `${handle}@example.com` }) as unknown as Parameters<Dal['listMyPage']>[0]

const person = async (handle: string) => {
  const { rows } = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ($1, $2, true)
     on conflict (email) do update set name = excluded.name returning id`,
    [handle, `${handle}@example.com`],
  )
  await pool.query(
    `insert into profiles (id, handle, handle_skeleton, display_name)
     values ($1, $2, $2, $3) on conflict (id) do nothing`,
    [rows[0].id, handle.replace(/-/g, ''), handle],
  )
  return rows[0].id as string
}

/**
 * ⚠ **Real ECDH material, not a placeholder string.** `web-push` derives a
 * shared secret from `p256dh` and will reject anything that is not a valid
 * P-256 point — so a fixture of `'key'` would fail for a reason that has nothing
 * to do with what is being tested.
 */
const browserKeys = () => {
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()
  return {
    p256dh: ecdh.getPublicKey().toString('base64url'),
    auth: randomBytes(16).toString('base64url'),
  }
}

/**
 * ⚠⚠ **THE STAND-IN MUST SPEAK TLS, BECAUSE `web-push` REFUSES ANYTHING ELSE.**
 * A plain HTTP endpoint fails with *client network socket disconnected before
 * secure TLS connection was established* — the library attempts TLS whatever the
 * URL scheme says. **That is correct of it**: a push endpoint carries encrypted
 * payloads to a third party and http:// would be a downgrade nobody asked for.
 *
 * So the fixture generates a throwaway self-signed certificate and trusts it for
 * this process only. ⚠ **`NODE_TLS_REJECT_UNAUTHORIZED` is set on the test
 * process and nowhere else** — the app never touches it, and a stand-in whose
 * certificate is verified would need a CA nobody is going to run.
 */
const selfSigned = () => {
  const dir = mkdtempSync(join(tmpdir(), 'juce-push-'))
  const key = join(dir, 'key.pem')
  const cert = join(dir, 'cert.pem')
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', key, '-out', cert, '-days', '1',
    '-subj', '/CN=127.0.0.1',
    '-addext', 'subjectAltName=IP:127.0.0.1',
  ], { stdio: 'ignore' })
  return { dir, key: read(key), cert: read(cert) }
}

/** A push service that records what it was sent, and answers how it is told to. */
type Caught = { path: string; headers: Record<string, string | undefined>; body: Buffer }
let server: Server
let origin = ''
let caught: Caught[] = []
let status = 201
let certDir = ''

const listen = () =>
  new Promise<void>((resolve) => {
    const tls = selfSigned()
    certDir = tls.dir
    server = createServer({ key: tls.key, cert: tls.cert }, (req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c) => chunks.push(c as Buffer))
      req.on('end', () => {
        caught.push({
          path: req.url ?? '',
          headers: req.headers as Record<string, string | undefined>,
          body: Buffer.concat(chunks),
        })
        res.writeHead(status)
        res.end()
      })
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      origin = typeof address === 'object' && address ? `https://127.0.0.1:${address.port}` : ''
      resolve()
    })
  })

const endpointsOf = async (userId: string) => {
  const { rows } = await pool.query(
    `select endpoint from push_subscriptions where user_id = $1 order by endpoint`,
    [userId],
  )
  return rows.map((r) => r.endpoint as string)
}

beforeAll(async () => {
  dal = await import('@/lib/db')
  ;({ deliver } = await import('@/lib/push'))

  adaId = await person(A)
  boId = await person(B)
  await pool.query('delete from push_subscriptions where user_id = any($1::uuid[])', [
    [adaId, boId],
  ])
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  await listen()
})

afterAll(async () => {
  server.close()
  if (certDir) rmSync(certDir, { recursive: true, force: true })
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${A}@example.com`, `${B}@example.com`],
  ])
  await pool.end()
})

describe('earned push (Amendment 10)', () => {
  it('stores a device, and re-subscribing the same one does not duplicate it', async () => {
    const keys = browserKeys()
    const endpoint = `${origin}/one`

    expect((await dal.savePushSubscription(asViewer(adaId, A), { endpoint, keys })).ok).toBe(true)
    expect(await endpointsOf(adaId)).toEqual([endpoint])

    /* The same browser, asked again — a person re-granting permission. */
    expect(
      (await dal.savePushSubscription(asViewer(adaId, A), { endpoint, keys: browserKeys() })).ok,
    ).toBe(true)
    expect(await endpointsOf(adaId)).toEqual([endpoint])

    /* A second browser is a second row. */
    await dal.savePushSubscription(asViewer(adaId, A), { endpoint: `${origin}/two`, keys })
    expect(await endpointsOf(adaId)).toHaveLength(2)
  })

  it('refuses a subscription that is missing its keys', async () => {
    const result = await dal.savePushSubscription(asViewer(adaId, A), {
      endpoint: `${origin}/bad`,
      keys: { p256dh: '', auth: '' },
    })
    expect(result.ok).toBe(false)
  })

  it('nobody can unsubscribe a device that is not theirs', async () => {
    /*
      ⚠ Bo knows Ada's endpoint — it is a URL, not a secret — and still cannot
      touch it. The session filter is the whole of the protection.
    */
    await dal.removePushSubscription(asViewer(boId, B), `${origin}/one`)
    expect(await endpointsOf(adaId)).toContain(`${origin}/one`)

    await dal.removePushSubscription(asViewer(adaId, A), `${origin}/two`)
    expect(await endpointsOf(adaId)).toEqual([`${origin}/one`])
  })

  it('sends an encrypted, VAPID-signed push to every device', async () => {
    caught = []
    status = 201
    await dal.savePushSubscription(asViewer(adaId, A), {
      endpoint: `${origin}/two`,
      keys: browserKeys(),
    })

    await deliver([{ userId: adaId, title: 'You and Sam both saved “learn to sail”.', tag: 'convergence' }])

    expect(caught).toHaveLength(2)
    for (const sent of caught) {
      expect(sent.headers.authorization).toMatch(/^vapid /)
      expect(sent.headers['content-encoding']).toBe('aes128gcm')
      /*
        ⚠ **The body is CIPHERTEXT, and asserting that is the point.** A shape
        test would pass on plaintext JSON, which is the one outcome that would
        mean every push in production is readable by the push service.
      */
      expect(sent.body.length).toBeGreaterThan(0)
      expect(sent.body.toString('utf8')).not.toContain('learn to sail')
    }
  })

  it('sends nothing for somebody with no devices', async () => {
    caught = []
    await deliver([{ userId: boId, title: 'Nobody is listening.' }])
    expect(caught).toHaveLength(0)
  })

  it('prunes an endpoint the push service says is gone', async () => {
    caught = []
    status = 410
    await deliver([{ userId: adaId, title: 'Gone.' }])

    expect(caught).toHaveLength(2)
    expect(await endpointsOf(adaId)).toEqual([])
  })

  it('keeps an endpoint when the push service merely fails', async () => {
    caught = []
    status = 201
    await dal.savePushSubscription(asViewer(adaId, A), {
      endpoint: `${origin}/three`,
      keys: browserKeys(),
    })

    status = 500
    await deliver([{ userId: adaId, title: 'A bad minute.' }])

    /*
      ⚠ A 500 is the push service having a bad minute. Deleting somebody's
      device over one would silently unsubscribe them, and they would never
      know to turn it back on.
    */
    expect(await endpointsOf(adaId)).toEqual([`${origin}/three`])
    status = 201
  })
})
