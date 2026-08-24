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
    }
  })
}
