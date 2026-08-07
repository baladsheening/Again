/**
 * The signature element (§11). The one number in the product that can't be
 * inflated, and the key the go-back-tos list sorts by. Mono numeral, quiet
 * weight, large enough to read as the point.
 *
 * Deliberately not amber: the accent marks overlap state and nothing else.
 */
export function ReturnCount({ count }: { count: number }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1" title={`Been back ${count} times`}>
      <span className="return-count">{count}</span>
      <span className="sr-only">times</span>
    </span>
  )
}
