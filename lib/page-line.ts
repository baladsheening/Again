import type { EntryState } from '@/lib/domain'
import type { Day } from '@/lib/day'

/**
 * One line of the record, as the server hands it to the page.
 *
 * ⚠ **It lives here rather than beside the component because two callers build
 * it** — the route's first read and the *Earlier* action — and a view shape
 * with two producers is exactly the thing that goes quietly out of step. The
 * mapper below is the only way to make one, so a column added to the query
 * reaches both or neither.
 *
 * ⚠ **This is a projection, not the row.** `lib/db/captures.ts` says why the
 * page's read selects columns instead of the table: the shape crosses into a
 * Client Component, and `note` is private. Nothing here may grow a field that
 * the record does not display.
 */
export type PageLineView = {
  id: string
  text: string
  state: EntryState
  year: number | null
  /** Stamped on the server — see `lib/day.ts` for why the client never formats. */
  day: string
  dayLabel: string
  /**
   * **A question standing on this line**, or `null`. Derived in the read —
   * *suggested, and not yet resolved, and not refused* — see `PageLine.offer`.
   */
  offer: { title: string; year: number | null } | null
  /**
   * **Whether there is a photograph on this line** — never where it is. The
   * bytes are behind `/api/media/[id]`, which checks the session against the
   * owner of that row; the id the client already has is all it needs to ask.
   */
  hasImage: boolean
  /**
   * **The link this capture was written against**, or `null`.
   *
   * ⚠ **The address itself, unlike the photograph above.** A picture is
   * *whether*: its bytes are private and reachable only through a door that
   * checks the session. A link is a public address and the row has to draw an
   * `href` from it, so there is nothing to withhold and no door to build.
   *
   * ⚠ **Cleaned before it was stored, not before it is drawn.**
   * `cleanSourceUrl` in `lib/db/captures.ts` is what guarantees this is
   * `http:` or `https:` — an allowlist, so `javascript:` is excluded by not
   * being named rather than by being remembered. A row written before that
   * existed cannot exist: the column and the check shipped together.
   */
  sourceUrl: string | null
  /**
   * **Whether this line has ever converged with anybody** — the mark, Phase 2
   * step 4.
   *
   * ⚠ **A bit, and the sentence is not on this shape.** *Who* is fetched when a
   * console opens, for the one line somebody tapped; this rides every line of
   * every read, so a record of two hundred lines pays for two hundred `exists`
   * and no sentences at all. See `converged` in `lib/db/captures.ts`.
   *
   * ⚠ **It does not empty when the portal does.** The portal is arrival, the
   * mark is memory (§5) — a line keeps its mark long after the row that
   * announced it has gone.
   */
  converged: boolean
  /**
   * **Whether this line is in the convergence pool** — the inverse of the lock.
   *
   * ⚠ **`true` is the ordinary case**, since captures are written shareable.
   * `false` is a line its owner swiped out of the pool: it draws a padlock and
   * matches nobody. The row's swipe toggles exactly this.
   *
   * ⚠ **It is not about who can read the line.** Browsing somebody's record
   * needs all four terms of `listCapturesForOtherUser`; this only decides
   * whether the fan-out may see it.
   */
  shared: boolean
}

/** What the mapper needs of a row, and nothing more. */
type Stampable = {
  id: string
  text: string
  state: EntryState
  year: number | null
  createdAt: Date
  offer?: { title: string; year: number | null } | null
  hasImage?: boolean
  sourceUrl?: string | null
  converged?: boolean
  shared?: boolean
}

/**
 * Rows to lines, with the day stamps already resolved.
 *
 * The stamps are computed on the server and only there: grouping by day depends
 * on a timezone, and the server's and the browser's are not the same. See
 * `dayStamper`.
 */
export function toPageLines(
  rows: readonly Stampable[],
  stamp: (at: Date) => Day,
): PageLineView[] {
  return rows.map((row) => {
    const day = stamp(row.createdAt)
    return {
      id: row.id,
      text: row.text,
      state: row.state,
      year: row.year,
      day: day.key,
      dayLabel: day.label,
      /*
        `?? null` because two of the three reads that build these rows have no
        question to carry — the tray and search both select a literal null, and
        a row that simply omits the field must mean the same thing as one that
        says so. Optional in, definite out.
      */
      offer: row.offer ?? null,
      hasImage: row.hasImage ?? false,
      sourceUrl: row.sourceUrl ?? null,
      /*
        `?? false` for the same reason as the two above — optional in, definite
        out. Every read that draws a line of the record selects it, so the
        fallback is for a caller that has not been written yet: **no mark is the
        safe default**, since a mark the page cannot explain is worse than a
        line that keeps quiet about something the console can still show.
      */
      converged: row.converged ?? false,
      /*
        ⚠ **`?? true`, unlike the two above, and the asymmetry is deliberate.**
        A capture is written shareable, so the ordinary case is `true` and the
        padlock is the exception's mark — a fallback of `false` would draw a
        lock on every line a future caller forgot to select it for, which is
        the app claiming a state nobody chose. It is display only: whether a
        line actually converges is decided in `lib/db/`, never here.
      */
      shared: row.shared ?? true,
    }
  })
}
