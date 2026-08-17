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

        `pointer-events-none` on the strip, restored on the line itself. The line
        is the width of the column now, so what that spares is the strip's own
        padding rather than the space either side of a short sentence — but a
        surface that covers something still has to absorb the taps it covers, the
        same argument the rail's search band makes in `components/shell.tsx`.

        ─────────────────────────────────────────────────────────────────────────
         The width of the column, not of the sentence — 17 August
        ─────────────────────────────────────────────────────────────────────────

        Directed. It hugged its text and centred, which made every message a
        different size and put none of them on any line the app already holds:
        the entry rows above it start at the gutter, and the acknowledgement of
        an add started wherever that film's title happened to end.

        ⚠ **"Screen width" is the column's width above `rail`, not the window's.**
        Full bleed there would run the bar under the rail and frost the handle and
        *Sign out* through it, since this comes later in the document and would
        win. So the strip takes the content column's left edge — the shell's own
        centring plus the 17rem of `rail:pl-68` — and the column's cap, which is
        the same pair `main` and the rail's search dock are built from. Below
        `rail` there is no rail and `left-0 right-0` is that same column.

        `left-0 right-0` rather than `inset-x-0`, because the rail override is a
        `left`: two declarations of the same property resolve by cascade order,
        which a variant guarantees, and a physical property against a logical one
        does not.
      */}
      {(adding || undo || error) && (
        <div className="gutter rail:left-[calc(max(0px,50%_-_36rem)_+_17rem)] rail:max-w-3xl rail:pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none fixed right-0 bottom-0 left-0 z-30 flex pb-[calc(env(safe-area-inset-bottom)+4.25rem)]">
          {/*
            Glass, on the app's one glass strength — `backdrop-blur-band`, the
            24px the home wall's caption frosts artwork by. Directed, and the wall
            is why it is worth having: this bar answers a tap on a poster, so most
            of the time the thing behind it is the moving grid those posters are
            in. A blur is what turns that into a ground.

            ⚠ **`/70` is a legibility number, not a taste one.** The tint is what
            stops the backdrop reaching the text: at 70% over a bright poster the
            ground composites to about #4c4c4a, where `--color-text` reads 6.9:1.
            Less tint is more glass and a worse floor — the wall's caption sits at
            60% and measures 4.49:1 over the same poster, which its own note calls
            the one marginal thing in the band.

            ⚠ **Which is why nothing in here is `text-muted` any more.** It was on
            the in-flight line and on *Undo*, and 60% of the text colour over that
            same ground comes to 3.7:1 — under the 4.5:1 floor for text this size,
            on the one control in the app with a ten-second life. Full strength
            costs the hierarchy nothing: the ellipsis says the first is in flight,
            and the underline says the second is a control.
          */}
          <p className="border-rule bg-surface/70 backdrop-blur-band pointer-events-auto flex w-full items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-sm">
            {adding && <span className="truncate">Adding {adding}…</span>}

            {undo && (
              <>
                <span className="truncate">Added {undo.title}.</span>
                <button
                  type="button"
                  onClick={undoAdd}
                  // A ten-second window (§5). Missing it because the target was
                  // 30px wide is not a recoverable mistake.
                  className="tap-target shrink-0 underline underline-offset-4"
                >
                  Undo
                </button>
              </>
            )}

            {/*
              Full strength, not `text-muted`. A failure message set in the
              colour reserved for de-emphasised metadata reads as an aside; see
              docs/decisions.md, 8 August. Everything in this bar is full strength
              since the glass — see the note above — so this is no longer the line
              that stands apart, and the argument for it is unchanged either way.
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
