'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { posterUrl } from '@/lib/posters'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from './haptics'
import { CloseIcon } from './icon-close'
import { TickIcon } from './icon-tick'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The film, when you tap its poster — 17 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed, with a layout. **The artwork takes the top of the screen edge to
 * edge, the synopsis takes the bottom, and a `+` over the poster adds the film.**
 *
 * It replaces two surfaces: the intent sheet, which asked *see or a copy?* as a
 * modal over the wall, and the acknowledgement band, which answered from the foot
 * of the screen a second later. Both are gone.
 *
 * **The reason it is better is the order of the questions.** The sheet asked
 * which want you meant before telling you what the film was — and the moment that
 * matters is a poster on the wall you do not recognise. This answers *what is
 * this* first, and the add is a control on the answer rather than a modal in
 * front of it. It also puts the confirmation where your finger already is, which
 * is what let the band go.
 *
 * ⚠ **It is a step past §2's "images beyond poster thumbnails".** The wall took
 * the first step; this is the second, taken deliberately and recorded here rather
 * than discovered later. What it does not do is add a *second kind* of image:
 * this is the poster, cropped, not the backdrop still the reference layout used.
 * One image type in the app, at three sizes, all from TMDB's CDN (§10 — never
 * proxied).
 *
 * ⚠ **Both intents survive, and that is not optional.** Intent is a property of
 * the entry (§4), and a `+` alone would have collapsed it to whichever one the
 * default happened to be. The primary is the `+` on the artwork; the secondary is
 * a quiet control under the synopsis. Which is what the sheet offered — the same
 * two things, without a modal, and now with the film in front of you when you
 * choose.
 */

/**
 * ⚠ **The client's own copy of §5.1's window, as the band's was.** The authority
 * is `UNDO_WINDOW_MS` in `lib/db/entries.ts`, which cannot be imported here —
 * `lib/db` is `server-only`, by §3. If they ever disagree the server wins and the
 * undo simply fails, which is the right way round for a divergence to break.
 */
const UNDO_WINDOW_MS = 10_000

/** Half the screen for the artwork, the rest for the words. */
const ARTWORK = 'h-[52svh]'

/**
 * The two circles on the artwork.
 *
 * ⚠ **`black/80` and no blur, and both halves are deliberate.** These sit over
 * whatever the poster happens to be, so the ground has to be dark enough to carry
 * a stroke icon against a bright one: at 80% over a bright poster the circle
 * composites to about #282828, where the tick's green reads 4.0:1 and the plus
 * reads 11:1. At 50% the green fell to 1.7:1 — a mark you could not see on the
 * films most likely to have a bright poster.
 *
 * No `backdrop-blur`, because a blur clipped to a rounded border is the exact
 * combination WebKit has a history of rendering wrong, and a control that
 * sometimes has no ground is worse than one that is plainly opaque. The band at
 * the foot of the app is where glass belongs; this is a button.
 */
const CONTROL =
  'bg-black/80 tap-target flex size-9 shrink-0 items-center justify-center rounded-full'

type Details = {
  synopsis: string | null
  runtime: number | null
  directors: string[]
}

/**
 * What is on your list, by intent. **`null` means not yet known**, which is a
 * different thing from an empty object and is why this is not a plain record: a
 * `+` drawn before the answer arrives is a control that says *not on your list*
 * without having asked.
 */
type Marks = Partial<Record<Intent, { entryId: string | null }>> | null

export function FilmScreen({
  film,
  onClose,
}: {
  film: FilmSearchResult
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [primary, ...secondary] = intentsFor('film')

  const [details, setDetails] = useState<Details | null>(null)
  const [marks, setMarks] = useState<Marks>(null)
  const [undoable, setUndoable] = useState<{ intent: Intent; entryId: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  /*
    `showModal()` rather than an `open` attribute, and a `<dialog>` rather than the
    hand-built overlay the intent sheet was. It brings focus containment, the
    inertness of everything behind it and Escape for nothing, all of which the
    sheet did by hand and did partially — `PosterReveal` in `poster.tsx` reached
    the same conclusion first.
  */
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  /*
    The details, and whether it is already on your list — one request, see
    `app/api/film/[id]/route.ts`.

    **Nothing waits for it.** The title, the year and the artwork all came off the
    thing that was tapped, so the screen is complete from the first frame and this
    fills in the synopsis and the marks. A spinner over a poster we already have
    would be inventing a wait.

    Aborted on unmount so closing the screen does not leave a request writing into
    a component that has gone.
  */
  useEffect(() => {
    const abort = new AbortController()

    fetch(`/api/film/${encodeURIComponent(film.externalId)}`, { signal: abort.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        setDetails({
          synopsis: body.film?.synopsis ?? null,
          runtime: body.film?.runtime ?? null,
          directors: body.film?.directors ?? [],
        })
        const found: Marks = {}
        for (const entry of body.listed ?? []) {
          found[entry.intent as Intent] = { entryId: entry.entryId }
        }
        setMarks(found)
      })
      .catch(() => {
        if (abort.signal.aborted) return
        /*
          The synopsis is the part that fails softly — there is a line for that
          below. The marks are not: an unknown list state stays unknown rather
          than defaulting to "not on your list", because the `+` that would draw
          is the one thing on this screen that can be wrong in a way you act on.
        */
        setDetails({ synopsis: null, runtime: null, directors: [] })
      })

    return () => abort.abort()
  }, [film.externalId])

  /* §5.1. The offer expires; the row does not (§5 — nothing is ever deleted). */
  useEffect(() => {
    if (!undoable) return
    const timer = setTimeout(() => setUndoable(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [undoable])

  function add(intent: Intent) {
    // Inside the gesture: iOS plays a haptic for a tap and not for what follows
    // one. See `haptics.tsx`.
    haptic()
    setError(null)
    // Optimistic, like every add in this app has been: the mark is the answer to
    // the tap, and the network is not part of the answer.
    setMarks((current) => ({ ...(current ?? {}), [intent]: { entryId: null } }))

    startTransition(async () => {
      const result = await addFilmAction({ externalId: film.externalId, intent })

      if (!result.ok) {
        setMarks((current) => {
          const next = { ...(current ?? {}) }
          delete next[intent]
          return next
        })
        setError(result.message)
        return
      }

      setMarks((current) => ({
        ...(current ?? {}),
        [intent]: { entryId: result.value.entryId },
      }))

      /*
        Only a real creation is undoable. Tapping `+` on something already on
        your list is idempotent (§10) — it returns the row that was there, and
        offering to undo it would be offering to delete something you did not
        just add.
      */
      if (result.value.created) {
        setUndoable({ intent, entryId: result.value.entryId })
      }
    })
  }

  function undo(intent: Intent, entryId: string) {
    haptic()
    setUndoable(null)
    setMarks((current) => {
      const next = { ...(current ?? {}) }
      delete next[intent]
      return next
    })

    startTransition(async () => {
      const result = await undoEntryAction(entryId)
      if (!result.ok) {
        setError(result.message)
        setMarks((current) => ({ ...(current ?? {}), [intent]: { entryId } }))
      }
    })
  }

  const large = posterUrl(film.posterPath, 'original')
  const small = posterUrl(film.posterPath, 'w342')
  const listedPrimary = marks?.[primary]
  const undoablePrimary = undoable?.intent === primary ? undoable : null

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={film.title}
      /*
        Full bleed on black. `backdrop:bg-black` spelled out rather than taken
        from the token, for the reason `PosterReveal` gives: this is black because
        artwork wants nothing behind it, not because it inherits the app's ground.
      */
      className="m-0 h-full max-h-none w-full max-w-none bg-black p-0 text-text backdrop:bg-black"
    >
      {/*
        `max-w-md` and centred. Above `rail` a takeover the width of a desk would
        be a poster stretched across a metre of screen; below it the cap is wider
        than any phone and does nothing. One layout, one class, right at both ends
        — the same move the acknowledgement band makes at its own breakpoint.
      */}
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className={`${ARTWORK} relative shrink-0 overflow-hidden`}>
          {small && (
            /*
              ⚠ **Two layers, and the small one is the point.** `w342` is what the
              wall already fetched, so it is in the browser's cache and paints on
              the first frame; `original` arrives over it a moment later. Without
              this the screen opens on an empty rectangle for as long as a 1MB
              image takes on mobile data — which is the one thing a tap-to-open
              screen must not do.

              No state and no `onLoad`: the second image simply paints over the
              first when it has something to paint. A fade would need to know when
              that happened, and knowing costs a re-render to hide a transition
              nobody asked for.
            */
            <Image
              src={small}
              alt=""
              aria-hidden
              /*
                ⚠ **`width`/`height` and classes, never `fill`.** `fill` renders
                its positioning as a `style` attribute, and the CSP in `proxy.ts`
                drops every style attribute in production while `next dev` allows
                them — so it would have laid out perfectly here and collapsed on
                the deployed site. That divergence has already cost this project a
                masthead and a wordmark (10 August); see the note on
                `wordmark-trim` in globals.css. The numbers are the source's own
                aspect, which is all they are for: the classes do the layout.
              */
              width={342}
              height={513}
              className="absolute inset-0 h-full w-full object-cover object-top"
              priority
            />
          )}
          {large && (
            <Image
              src={large}
              alt={`Poster for ${film.title}`}
              width={2000}
              height={3000}
              className="absolute inset-0 h-full w-full object-cover object-top"
              priority
            />
          )}

          {/*
            The scrim. Type over artwork is unreadable without one, and this is the
            same argument the wall's caption band makes — a gradient rather than a
            blur here because the artwork below the words is what the screen is
            for, and a blur would take the bottom third of it.
          */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/70 to-transparent"
          />

          {/* --- the two controls, on the artwork's top line ------------------ */}
          <div className="gutter absolute inset-x-0 top-0 flex items-start justify-between pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className={CONTROL}
            >
              <CloseIcon />
            </button>

            {/*
              ⚠ **The slot is drawn from the first frame and its contents are not.**
              `marks === null` is *not yet known*, and a `+` drawn then would be
              claiming the film is not on your list before anything has asked. So
              the circle is there — the layout is settled, nothing moves — and the
              glyph inside it waits for the answer.

              The tick is green, and the green means *this is on your list* rather
              than *that worked*. See `--color-listed` in globals.css for what that
              distinction costs and why it is drawn that way round.
            */}
            <AddControl
              state={marks === null ? 'unknown' : listedPrimary ? 'listed' : 'absent'}
              label={specFor('film', primary).wantLabel}
              undoable={Boolean(undoablePrimary)}
              onAdd={() => add(primary)}
              onUndo={() =>
                undoablePrimary && undo(primary, undoablePrimary.entryId)
              }
            />
          </div>

          {/* --- what it is, over the foot of the artwork --------------------- */}
          <div className="gutter absolute inset-x-0 bottom-0 pb-5">
            <h2 className="title">{film.title}</h2>
            <p className="text-muted mt-2 text-sm">
              {/*
                Director, year, runtime — the three things that decide whether you
                want a film tonight, in the order you ask them. Joined with a
                middot rather than laid out in rows: they are one line of
                metadata, and three rows of one item each is a table of contents
                for nothing.

                §2 is the reason the list stops there. No rating, no score, no
                stars — the reference layout leads with 5.1/10 and that is exactly
                what this product does not do.
              */}
              {[
                details?.directors.length
                  ? `Directed by ${details.directors.join(', ')}`
                  : null,
                film.year ? String(film.year) : null,
                details?.runtime ? `${details.runtime} min` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {/* --- the synopsis, and the other intent --------------------------- */}
        <div className="gutter safe-bottom flex-1 overflow-y-auto pt-6 [--safe-bottom-base:1.5rem]">
          <h3 className="micro text-muted">Synopsis</h3>
          <p className="mt-3 text-sm">
            {details === null
              ? ''
              : (details.synopsis ??
                'No synopsis for this one.')}
          </p>

          <div className="mt-8 flex flex-col items-start gap-4">
            {secondary.map((intent) => (
              <SecondaryIntent
                key={intent}
                label={specFor('film', intent).wantLabel}
                state={marks === null ? 'unknown' : marks[intent] ? 'listed' : 'absent'}
                undoable={undoable?.intent === intent}
                onAdd={() => add(intent)}
                onUndo={() => {
                  if (undoable?.intent === intent) undo(intent, undoable.entryId)
                }}
              />
            ))}
          </div>

          {/*
            Full strength, not `text-muted` — a failure set in the colour reserved
            for de-emphasised metadata reads as an aside. docs/decisions.md,
            8 August, and it has survived every surface this message has lived on.
          */}
          {error && <p className="mt-6 text-sm">{error}</p>}
        </div>
      </div>
    </dialog>
  )
}

/**
 * The `+` on the artwork, and what it becomes.
 *
 * Three states and one box. `unknown` holds the space while the answer is in
 * flight, `absent` offers the add, `listed` marks it — and while §5.1's window is
 * open the mark is also the way back out, which is what let the acknowledgement
 * band go: the undo is under the finger that just added.
 */
function AddControl({
  state,
  label,
  undoable,
  onAdd,
  onUndo,
}: {
  state: 'unknown' | 'absent' | 'listed'
  label: string
  undoable: boolean
  onAdd: () => void
  onUndo: () => void
}) {
  if (state === 'unknown') {
    return <div aria-hidden className={`${CONTROL} opacity-40`} />
  }

  if (state === 'listed') {
    /*
      A button only while it can do something. §5 has no delete: after ten seconds
      this is a state marker, and a control that silently stops working would be
      worse than one that was never a control.
    */
    if (!undoable) {
      return (
        <div className={`${CONTROL} text-listed`} role="img" aria-label={`${label} — on your list`}>
          <TickIcon />
        </div>
      )
    }
    return (
      <button
        type="button"
        onClick={onUndo}
        aria-label="Undo"
        className={`${CONTROL} text-listed`}
      >
        <TickIcon />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={label}
      className={`${CONTROL} text-text`}
    >
      <PlusIcon />
    </button>
  )
}

/**
 * The other intent — *Want a copy* for a film. A quiet text control rather than a
 * second circle on the artwork: §8 wants one prominent action and the rarer one
 * beneath it, which is what the sheet did and the only part of the sheet worth
 * keeping.
 */
function SecondaryIntent({
  label,
  state,
  undoable,
  onAdd,
  onUndo,
}: {
  label: string
  state: 'unknown' | 'absent' | 'listed'
  undoable: boolean
  onAdd: () => void
  onUndo: () => void
}) {
  if (state === 'unknown') {
    return <span aria-hidden className="text-muted text-sm opacity-40">{label}</span>
  }

  if (state === 'listed') {
    const mark = (
      <>
        <span className="text-listed">
          <TickIcon />
        </span>
        {label}
      </>
    )
    if (!undoable) {
      return (
        <span className="text-muted flex items-center gap-2 text-sm">
          {mark}
          <span className="sr-only"> — on your list</span>
        </span>
      )
    }
    return (
      <button
        type="button"
        onClick={onUndo}
        className="text-muted tap-target flex items-center gap-2 text-sm underline underline-offset-4"
      >
        {mark}
        <span className="sr-only"> — undo</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className="text-muted hover:text-text tap-target text-left text-sm underline underline-offset-4 transition-colors"
    >
      {label}
    </button>
  )
}

/**
 * §11 permits known icons, and a plus is the known one for "add this". Same
 * inline-rather-than-a-package reasoning as `icon-close.tsx`, and `currentColor`
 * so the control's own state decides its colour.
 */
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 2.5v7M2.5 6h7" />
    </svg>
  )
}
