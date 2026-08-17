'use client'

import { createContext, use, useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { HapticSwitch, haptic } from './haptics'
import { TickIcon } from './icon-tick'
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

    ─────────────────────────────────────────────────────────────────────────────
     No sentence at all: the title, and then a tick — 17 August
    ─────────────────────────────────────────────────────────────────────────────

    ⚠ **This was `adding` and `undo`, two states holding two sentences, and the
    handover between them was visible.** Reported: *the message jumps, I think
    it's because it starts with 'adding' before becoming 'added'.* It did: the
    verb changed width, so the title after it slid, and the *Undo* beside it
    arrived in the same frame.

    Directed, and it goes further than dropping the second sentence: **the band
    shows the film's title, and the add is confirmed by a tick rather than by a
    word.** Which is the better answer for the same reason the jump happened —
    there was never anything a verb could say that the title did not. The tap
    said *add this*; the title says *this*; the only thing that actually arrives
    from the server is the **entry id**, which is what makes an undo addressable.
    So the id is the only thing that changes, and it changes a mark and a
    control, never the text.

    Failure still corrects the claim: both failure paths clear this and put an
    error in its place, which is what optimistic means and is the same behaviour
    the two-state version had.
  */
  const [added, setAdded] = useState<{ title: string; entryId: string | null } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const [, startTransition] = useTransition()

  /* --- the undo window (§5.1) --------------------------------------------- */

  /*
    ⚠ **Keyed on the entry id arriving, not on the sentence appearing.** The
    sentence is up from the tick of the tap, and starting the clock there would
    spend the network's share of the ten seconds before there was anything to
    undo. `added` changes identity when the id lands, so this effect runs then
    and §5.1's window is ten seconds of *offer* rather than ten seconds minus
    whatever the round trip cost.

    While the id is null there is no timer, which is deliberate: the message
    stands until the server answers one way or the other. An action that never
    resolves leaves it standing, exactly as the `adding` state it replaces did.
  */
  useEffect(() => {
    if (!added?.entryId) return
    const timer = setTimeout(() => setAdded(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [added])

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
    setAdded({ title: film.title, entryId: null })

    startTransition(async () => {
      const result = await addFilmAction({ externalId: film.externalId, intent })

      if (!result.ok) {
        setAdded(null)
        setError(result.message)
        return
      }
      // Already on the list — say so rather than pretending something happened.
      // Idempotent by design (§10): the second add is a no-op, not a duplicate.
      if (!result.value.created) {
        setAdded(null)
        setError(`${film.title} is already on your list.`)
        return
      }
      // The same title, now with something to undo. Only the mark changes.
      setAdded({ title: film.title, entryId: result.value.entryId })
    })
  }

  function undoAdd() {
    const entryId = added?.entryId
    if (!entryId) return
    setAdded(null)
    startTransition(async () => {
      const result = await undoEntryAction(entryId)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <CaptureContext.Provider value={{ choose: setChosen }}>
      {children}

      {/* Mounted once for the app — see `haptics.tsx` for why it is a checkbox. */}
      <HapticSwitch />

      {chosen && (
        <IntentSheet film={chosen} onPick={add} onClose={() => setChosen(null)} />
      )}

      {/*
        Pinned above the bottom bar rather than to the bottom of the screen. The
        offset is larger below the rail breakpoint because that is where the bar
        is; above it there is no bar and the line sits at the foot of the window.

        `pointer-events-none` on the strip, restored on the band — a surface that
        covers something has to absorb the taps it covers, the same argument the
        rail's search band makes in `components/shell.tsx`, and what the strip
        spares is its own padding above the band.

        ─────────────────────────────────────────────────────────────────────────
         Edge to edge, and the text keeps the gutter — 17 August
        ─────────────────────────────────────────────────────────────────────────

        Directed twice. It hugged its text and centred, which made every message a
        different size; then it filled the column *inside* the gutter, which was
        reported as still not edge to edge. It is a band now, not a pill: **the
        ground runs to the screen edges and the sentence sits at the gutter**, the
        way the masthead's mark does over the wall it covers. Rounded corners and
        side hairlines went with the inset — both were properties of a shape that
        stopped short of the edge, and a rounded full-bleed element only puts
        notches in the corners of the screen.

        ⚠ **"Edge to edge" is the column's left edge above `rail`, not the
        window's.** Full bleed there would run the band under the rail and frost
        the handle and *Sign out* through it, since this comes later in the
        document and would win — the same reason the rail's own search band stops
        short. So the strip takes the content column's left edge (the shell's
        centring plus the 17rem of `rail:pl-68`) and runs to the right of the
        window, while the sentence inside stops at `max-w-3xl`, which is `main`'s
        own cap. Below `rail` there is no rail and `left-0 right-0` is the screen.

        `left-0 right-0` rather than `inset-x-0`, because the rail override is a
        `left`: two declarations of the same property resolve by cascade order,
        which a variant guarantees, and a physical property against a logical one
        does not.
      */}
      {(added || error) && (
        <div className="rail:left-[calc(max(0px,50%_-_36rem)_+_17rem)] rail:pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none fixed right-0 bottom-0 left-0 z-30 pb-[calc(env(safe-area-inset-bottom)+4.25rem)]">
          {/*
            Glass, on the app's one glass strength — `backdrop-blur-band`, the
            24px the home wall's caption frosts artwork by. The wall is why it is
            worth having: this bar answers a tap on a poster, so most of the time
            the thing behind it is the moving grid those posters are in.

            ⚠ **`/60`, down from `/70`, because the glass could not be seen.**
            Reported off the handset: no blur effect. The blur was never the thing
            missing — it is the same declaration the caption band uses, and the
            served CSS carries `-webkit-backdrop-filter` beside it — **it was the
            tint sitting on top of it.** A backdrop is only visible in the
            fraction of the surface that is not painted over: at 70% that is three
            tenths of a *blurred* wall, which is a dark wash whichever way it is
            filtered, and blurring something invisible looks exactly like not
            blurring it. At 60% it is four tenths, which is the caption band's own
            figure and is the fraction that reads as glass there.

            **60% is also the floor, so it is where this stops.** Over a bright
            poster the ground composites to about #5b5b59 and `--color-text` reads
            5.4:1; at 50% it is #6a6a69 and 4.35:1, which is under the 4.5:1 AA
            floor for text this size. The caption gets away with 60% of a *black*
            tint; this is 60% of the warm charcoal, which is lighter, so the same
            fraction buys a little less contrast and there is nothing left to
            spend.

            ⚠ **Losing the corner radius may matter here too, and that is a
            second reason not to want it back.** WebKit has a long history of
            `backdrop-filter` misbehaving when it has to be clipped to a rounded
            border — sometimes painting the unclipped backdrop, sometimes nothing
            at all. A square-edged band cannot meet that class of bug, so if the
            glass now reads, this is part of why.

            ⚠ **Nothing in here is `text-muted`.** It was on the in-flight line and
            on *Undo*, and 60% of the text colour over that ground comes to 3.3:1
            — under the floor, on the one control in the app with a ten-second
            life. The underline says it is a control without a colour doing it.
          */}
          <div className="border-rule bg-surface/60 backdrop-blur-band pointer-events-auto border-y">
            {/*
              `role="status"` because the visible text no longer says what
              happened — the tick does. It is a polite live region, so the mark
              arriving inside it is announced as *Added.* rather than passing in
              silence. Nothing announced before this change, so the initial
              appearance is no worse than it was and the confirmation is better.
            */}
            <p
              role="status"
              className="gutter rail:max-w-3xl flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              {added && (
                <>
                  <span className="truncate">{added.title}</span>
                  {/*
                    ⚠ **Rendered from the first frame and made invisible until
                    there is an id**, rather than mounted when the id arrives.
                    `visibility: hidden` keeps the box, so the title is laid out
                    against its final width and the tick and *Undo* appearing move
                    nothing — which is the other half of the reported jump. Both
                    are out of the accessibility tree and untappable while hidden,
                    so there is no control to find and nothing announced until
                    there is something to undo.

                    The tick is the app's own — the one on a satisfied want in
                    `entry-row.tsx` — because "done with this" is the claim in both
                    places and §11 permits the known icon for it. `currentColor`,
                    so it stays out of the amber that marks overlap.

                    A ten-second window (§5). Missing it because the target was
                    30px wide is not a recoverable mistake, so `tap-target` stands.
                  */}
                  <span
                    className={`flex shrink-0 items-center gap-3 ${
                      added.entryId ? '' : 'invisible'
                    }`}
                  >
                    <TickIcon />
                    <span className="sr-only">Added.</span>
                    <button
                      type="button"
                      onClick={undoAdd}
                      className="tap-target underline underline-offset-4"
                    >
                      Undo
                    </button>
                  </span>
                </>
              )}

              {/*
                Full strength, not `text-muted`. A failure message set in the
                colour reserved for de-emphasised metadata reads as an aside; see
                docs/decisions.md, 8 August. Everything in this band is full
                strength since the glass — see the note above — so this is no
                longer the line that stands apart, and the argument for it is
                unchanged either way.
              */}
              {error && <span>{error}</span>}
            </p>
          </div>
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

        {/*
          `haptic()` on the tap itself, not on the server's answer — see
          `haptics.tsx`. iOS only plays one inside a live gesture, and this is the
          gesture: the finger is still on the control that means *add this*. What
          the phone is answering is the tap, which is the honest thing for a
          haptic to answer; the tick is what answers the add.
        */}
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={() => {
              haptic()
              onPick(film, primary)
            }}
            className="border-rule hover:border-text w-full rounded border px-4 py-3 text-left text-sm transition-colors"
          >
            {specFor('film', primary).wantLabel}
          </button>

          {secondary.map((intent) => (
            <button
              key={intent}
              type="button"
              onClick={() => {
                haptic()
                onPick(film, intent)
              }}
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
