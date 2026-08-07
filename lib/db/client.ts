import 'server-only'

import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import { env } from '@/lib/env'
import * as schema from './schema'

/**
 * The `neon-serverless` (WebSocket) driver rather than `neon-http`, because §10
 * requires real transactions — "entries plus notifications plus swap state
 * changes never partially apply" — and the HTTP driver cannot do interactive
 * transactions.
 *
 * Node 22+ ships a global WebSocket, so this needs no `ws` dependency (§10:
 * no dependency added without a reason written down).
 */
if (!neonConfig.webSocketConstructor) {
  if (typeof globalThis.WebSocket === 'undefined') {
    throw new Error(
      'No global WebSocket. The Neon serverless driver needs Node 22+ or an explicit `ws` polyfill.',
    )
  }
  neonConfig.webSocketConstructor = globalThis.WebSocket
}

/**
 * One pool per process, never per request (§10). Cached on `globalThis` so dev
 * hot-reloads reuse it instead of leaking a pool per edit.
 */
const globalForDb = globalThis as unknown as { __againPool?: Pool }

const pool =
  globalForDb.__againPool ?? new Pool({ connectionString: env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalForDb.__againPool = pool

/**
 * The Drizzle handle. Importable only from within `lib/db/` — see the rule in
 * `lib/db/index.ts`. No Server Component, Server Action or route handler may
 * import this directly.
 */
export const db = drizzle(pool, { schema })

export type Db = typeof db

/** A transaction handle, for DAL functions that accept an ambient transaction. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** Either the pool or an open transaction — lets DAL functions compose. */
export type Executor = Db | Tx
