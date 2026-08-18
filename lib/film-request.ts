/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The film request, started at the moment the poster is pressed — 18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Reported on the handset, 17 August: tap a poster and **the title is there
 * before the director and the synopsis are.** Nothing is broken; the screen
 * arrives in two stages because its two halves come from two places. Title, year
 * and artwork came off the poster that was tapped, so they paint on the first
 * frame. Director, runtime, synopsis and whether it is already on your list come
 * from `/api/film/[id]`, so they land a round trip later.
 *
 * **This removes the pause by starting the round trip earlier**, and the pair to
 * it — reserving the credit line's height so the block does not grow when the
 * words arrive — is in `film-screen.tsx`. They are different fixes for the two
 * halves of one report, and neither does the other's job.
 *
 * **`pointerdown` is the earliest honest signal.** It is the first moment the
 * app knows *which* film a person has chosen; anything sooner is guessing. The
 * alternative on the table was firing for every poster on screen, which spends
 * the upstream quota on the ones nobody opens, and on a desk a mouse crossing a
 * six-column wall would spend it on a dozen in a second. One press, one request.
 *
 * ⚠ **A hand-off, deliberately not a cache — and the difference is correctness,
 * not size.** The obvious next step is to keep answers keyed by external id so a
 * re-open is instant. That would be wrong here: half of this response is
 * `listed`, which is *your* list and changes the moment you add something, so a
 * cache would draw a `+` over a film you had just added. The route's own
 * `Cache-Control` note worries about exactly that and answers it with
 * `private, max-age=15`. **So the re-open is already fast and already bounded, at
 * the layer that has the contract written on it** — this module holds one
 * request for the span between a finger going down and a dialog mounting, and
 * then lets go of it.
 */

type Held = {
  externalId: string
  response: Promise<Response>
  controller: AbortController
}

/**
 * One, not a map. A person can press one poster and open one screen, so a second
 * entry could only ever be an abandoned press — which is what `prefetchFilm`
 * aborts rather than accumulates.
 */
let held: Held | null = null

function start(externalId: string): Held {
  const controller = new AbortController()

  return {
    externalId,
    response: fetch(`/api/film/${encodeURIComponent(externalId)}`, {
      signal: controller.signal,
    }),
    controller,
  }
}

/** Called from the poster, on `pointerdown`. */
export function prefetchFilm(externalId: string): void {
  if (held?.externalId === externalId) return

  // A press on a different poster: the last one is not being opened.
  held?.controller.abort()
  held = start(externalId)

  /*
    Nobody is waiting on this yet, and an unclaimed rejection — an abort, a dead
    network — would otherwise surface as an unhandled one. Attaching a handler
    marks it as handled without consuming it: the real reader still sees the
    rejection when it claims the request below.
  */
  held.response.catch(() => {})
}

/**
 * Called from the screen, on mount. Takes the request the press started if it is
 * the right one, and otherwise starts its own — so the screen never depends on
 * having been prefetched and works identically if it was opened some other way.
 */
export function claimFilmRequest(externalId: string): {
  response: Promise<Response>
  abort: () => void
} {
  const claimed = held?.externalId === externalId ? held : null

  // Held, but for something else: whatever it was, it is not what opened.
  if (held && !claimed) held.controller.abort()
  held = null

  const request = claimed ?? start(externalId)

  return {
    response: request.response,
    abort: () => request.controller.abort(),
  }
}
