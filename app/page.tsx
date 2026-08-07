/**
 * Phase 0 placeholder. The real home screen is Phase 1: an input box at the
 * top with live TMDB search, the live list directly beneath it, and nothing
 * else (§8). This exists only to prove the visual system renders.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Again</h1>
        <p className="text-muted text-sm">
          What you would go back to, and what you have not tried yet.
        </p>
      </div>

      <hr className="border-rule" />

      <section className="flex flex-col gap-4">
        <h2 className="text-muted text-xs font-medium tracking-widest uppercase">
          Phase 0 — foundations
        </h2>
        <ul className="text-muted flex flex-col gap-2 text-sm">
          <li>Drizzle schema and migrations</li>
          <li>Better Auth, sessions in Postgres</li>
          <li>
            <code className="text-text font-mono">lib/db/</code> data-access layer, session
            user first
          </li>
        </ul>
      </section>

      <div className="border-rule flex items-baseline gap-4 rounded-lg border p-5">
        <span className="return-count">11</span>
        <span className="text-muted text-sm">
          the return count — mono numeral, quiet weight, read as the point
        </span>
      </div>
    </main>
  )
}
