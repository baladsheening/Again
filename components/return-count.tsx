/**
 * The signature element (§11). The one number in the product that can't be
 * inflated, and the key the go-back-tos list sorts by. Mono numeral, quiet
 * weight, large enough to read as the point.
 *
 * Deliberately not amber: the accent marks overlap state and nothing else.
 *
 * **It appears on the go-back-tos collection only.** It used to sit in the live
 * list too, where it had no context to explain itself — a bare numeral beside a
 * film nobody had watched yet reads as a mystery, and did. On a tab of nothing
 * but go-back-tos, sorted by it, the column says what it is.
 */
export function ReturnCount({ count, label }: { count: number; label?: string }) {
  /*
    The count is times *experienced*, not times returned: it is 1 the moment
    something becomes a go-back-to, because an experience you would go back to
    has been had once (lib/db/entries.ts). The old text here said "Been back 1
    times" — wrong on both halves, since you have been back zero times and
    "1 times" is not English.

    `label` comes from the spec rather than being written here, so this reads
    "Seen 3 times" for a film and "Been 3 times" for a place (§4).
  */
  const times = count === 1 ? 'once' : `${count} times`
  const described = label ? `${label} ${times}` : times

  return (
    <span className="flex shrink-0 items-baseline gap-1" title={described}>
      {/* Hidden from the reader so it does not announce the numeral twice. */}
      <span className="return-count" aria-hidden="true">
        {count}
      </span>
      <span className="sr-only">{described}</span>
    </span>
  )
}
