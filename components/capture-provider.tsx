'use client'

import { createContext, use, useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { Poster } from './poster'

/**
 * Adding a film, from wherever the film came from.
 *
 * There are two surfaces now — the poster wall on the home screen and the search
 * field in the phone's bottom bar — and both end in the same place: the intent
 * sheet, the server action, the ten-second undo window (§5.1). Duplicating that
 * across two components would mean two undo timers, two error states, and a
 * second intent sheet that drifts from the first.
 *
 * So the flow lives here, once, above both. A surface only has to say *this
 * film*, by calling `choose`.
 *
 * The sheet and the acknowledgement render as overlays rather than in the page,
 * because the thing that started the add may be a 110px poster halfway down a
 * grid or a field pinned to the bottom of the screen, and neither has room
 * beneath it to answer in.
 */

const UNDO_WINDOW_MS = 10_000

const CaptureContext = createContext<{ choose: (film: FilmSearchResult) => void } | null>(
  null,
)

export function useCapture() {
  const ctx = use(CaptureContext)
  if (!ctx) throw new Error('useCapture must be used inside CaptureProvider')
  return ctx
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [chosen, setChosen] = useState<FilmSearchResult | null>(null)
  /*
    The acknowledgement, set on the same tick the film is picked rather than when
    the server answers. This replaced an optimistic row in the list underneath —
    there is no list underneath any more, so the confirmation has to be a
    sentence, and a sentence that waits for the network is not a confirmation.
  */
  const [adding, setAdding] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ entryId: string; title: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [, startTransition] = useTransition()

  /* --- the undo window (§5.1) --------------------------------------------- */

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [undo])

  // Errors are not undo — they need clearing, but on a timer long enough to
  // read a sentence rather than the window for changing your mind.
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(timer)
  }, [error])

  function add(film: FilmSearchResult, intent: Intent) {
    setChosen(null)
    setError(null)
    setUndo(null)
    setAdding(film.title)

    startTransition(async () => {
      const result = await addFilmAction({ externalId: film.externalId, intent })
      setAdding(null)

      if (!result.ok) {
        setError(result.message)
        return
      }
      // Already on the list — say so rather than pretending something happened.
      // Idempotent by design (§10): the second add is a no-op, not a duplicate.
      if (!result.value.created) {
        setError(`${film.title} is already on your list.`)
        return
      }
      setUndo({ entryId: result.value.entryId, title: film.title })
    })
  }

  function undoAdd() {
    if (!undo) return
    const { entryId } = undo
    setUndo(null)
    startTransition(async () => {
      const result = await undoEntryAction(entryId)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <CaptureContext.Provider value={{ choose: setChosen }}>
      {children}

      {chosen && (
        <IntentSheet film={chosen} onPick={add} onClose={() => setChosen(null)} />
      )}

      {/*
        Pinned above the bottom bar rather than to the bottom of the screen. The
        offset is larger below the rail breakpoint because that is where the bar
        is; above it there is no bar and the line sits at the foot of the window.

        `pointer-events-none` on the strip, restored on the line itself, so the
        empty space either side of a short sentence does not eat taps meant for
        whatever is underneath it.
      */}
      {(adding || undo || error) && (
        <div className="gutter rail:pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(env(safe-area-inset-bottom)+4.25rem)]">
          <p className="border-rule bg-surface pointer-events-auto flex max-w-full items-center gap-3 rounded-md border px-4 py-2.5 text-sm">
            {adding && <span className="text-muted truncate">Adding {adding}…</span>}

            {undo && (
              <>
                <span className="truncate">Added {undo.title}.</span>
                <button
                  type="button"
                  onClick={undoAdd}
                  // A ten-second window (§5). Missing it because the target was
                  // 30px wide is not a recoverable mistake.
                  className="text-muted hover:text-text tap-target shrink-0 underline underline-offset-4 transition-colors"
                >
                  Undo
                </button>
              </>
            )}

            {/*
              Full strength, not `text-muted`. A failure message set in the
              colour reserved for de-emphasised metadata reads as an aside; see
              docs/decisions.md, 8 August.
            */}
            {error && <span>{error}</span>}
          </p>
        </div>
      )}
    </CaptureContext.Provider>
  )
}

/**
 * One sheet per item, not one per intent (§8). The default action is prominent
 * and the secondary intent sits quieter beneath it — splitting by intent would
 * double every result to serve the rarer case, and put a decision in the fastest
 * interaction in the app.
 *
 * An overlay since 9 August, because it can now be opened from a poster in a
 * grid as well as from a search result.
 */
function IntentSheet({
  film,
  onPick,
  onClose,
}: {
  film: FilmSearchResult
  onPick: (film: FilmSearchResult, intent: Intent) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [primary, ...secondary] = intentsFor('film')

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      {/*
        The scrim is a button so dismissing by tapping outside is reachable from
        a keyboard and announced, rather than being a click handler on a div that
        only a mouse can find.
      */}
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={film.title}
        tabIndex={-1}
        className="border-rule bg-surface gutter safe-bottom relative z-10 flex w-full max-w-sm flex-col gap-5 rounded-t-lg border p-5 outline-none sm:rounded-lg [--safe-bottom-base:1.25rem]"
      >
        {/*
          The poster earns its place here, unlike in the lists: this is the
          moment of choosing, and the artwork is the fastest way to tell two
          films of the same title apart. See `poster.tsx`.
        */}
        <div className="flex items-center gap-3">
          <Poster posterPath={film.posterPath} />
          <div className="min-w-0">
            <p className="truncate">{film.title}</p>
            <p className="micro text-muted mt-1">{film.year ?? '—'}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={() => onPick(film, primary)}
            className="border-rule hover:border-text w-full rounded border px-4 py-3 text-left text-sm transition-colors"
          >
            {specFor('film', primary).wantLabel}
          </button>

          {secondary.map((intent) => (
            <button
              key={intent}
              type="button"
              onClick={() => onPick(film, intent)}
              className="text-muted hover:text-text tap-target text-left text-sm underline underline-offset-4 transition-colors"
            >
              {specFor('film', intent).wantLabel}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-text micro tap-target self-start transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
