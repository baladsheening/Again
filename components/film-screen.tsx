'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { claimFilmRequest } from '@/lib/film-request'
import { posterUrl } from '@/lib/posters'
import { PosterReveal } from './poster'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from '@/lib/haptics'
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
 * ─────────────────────────────────────────────────────────────────────────────
 *  *Want a copy* is gone, and it takes a collection's inflow with it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed 17 August. The screen offers one intent now: the `+` adds a
 * *Want to see*, and there is no second control.
 *
 * ⚠ **This is a product change wearing the clothes of a layout change, and the
 * consequence is worth writing down where the next person will meet it.** Intent
 * is a property of the entry (§4) and `own` still exists everywhere else — in
 * `lib/vocabulary.ts`, in the schema, in the resolve flow. What has gone is the
 * only place a person could *create* one. So:
 *
 *   - **Nothing new lands in Fixtures.** `own` resolves to `fixture` (§5), and
 *     with no way to make an `own` want, that collection can only grow by copying
 *     someone else's — `copyEntry` carries the source's intent over deliberately.
 *   - Existing `own` entries are untouched. Nothing is ever deleted (§5), and they
 *     still resolve, still appear, still participate in overlap as the `lend`
 *     match.
 *
 * If Fixtures is meant to stay a live collection, this is the thing to come back
 * to — not by restoring a control that has been rejected, but by deciding where
 * *Want a copy* belongs, if anywhere.
 */

/**
 * ⚠ **The client's own copy of §5.1's window, as the band's was.** The authority
 * is `UNDO_WINDOW_MS` in `lib/db/entries.ts`, which cannot be imported here —
 * `lib/db` is `server-only`, by §3. If they ever disagree the server wins and the
 * undo simply fails, which is the right way round for a divergence to break.
 */
const UNDO_WINDOW_MS = 10_000

/**
 * Two thirds of the screen for the artwork, the rest for the words. Directed
 * 17 August, up from a half.
 *
 * ⚠ **A fraction of the parent, not of the viewport.** It was `h-[52svh]`, and
 * `svh` is the *screen*, which is not the same thing as the box this sits in —
 * the dialog is `h-full` today, so they agree, and they would stop agreeing the
 * moment anything gained a margin or the layout took an inset. `h-2/3` is two
 * thirds of whatever it is inside, which is what "two thirds" was asked for.
 *
 * The pane below takes the remainder and scrolls, so a long synopsis costs a
 * scroll rather than a squeeze — and `Want a copy`, which sits under it, can now
 * fall below the fold on a wordy film. That is the trade this fraction makes.
 */
const ARTWORK = 'h-2/3'

/**
 * The one mark beside the title.
 *
 * ⚠ **No ring. It had one for a single commit and it is reverted** — a hairline
 * in `currentColor`, added on 17 August so the outline sat on the `+` rather than
 * on the close, and rejected on sight. The fill alone is the shape.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It was frosted glass for a day, and the day ended — 17–18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **This note is kept short on purpose, because the thing it described is gone.**
 * The control used to sit on the artwork over a scrim, and most of a day went into
 * making it read as frosted glass there: the fix turned out to be in the
 * *gradient* rather than the disc, since **frost is blurred content and a blurred
 * flat colour is that colour** — the scrim had to stop short of solid black so
 * that a fifth of the poster reached the control and the blur had something to
 * smear. The whole account is in git, at `9c467dd` and `a24fac8`.
 *
 * It ended when the words came off the poster on 18 August. There is no scrim, so
 * there is nothing behind this to blur, so `backdrop-blur-band` would be inert —
 * and the contrast floor it forced is gone with it. **The green tick was the number
 * to watch at 3.3:1 against the 3:1 WCAG 1.4.11 asks of a graphical control; on
 * flat black it is 6.0:1**, on every poster rather than on the kind ones.
 *
 * **What survives is `bg-text/8`, and its job changed.** It was the *floor* — the
 * least tint that kept the shape findable where the artwork behind it was dark.
 * With no artwork behind it, it is simply the fill. Warm rather than a cool
 * `white/8`, or the one filled control in the app would be the one thing in it
 * that is not warm.
 *
 * ⚠ **If the `+` is ever put back on the poster** — a parked want, see
 * `docs/plan.md` — the frost, the scrim and the floor come back together or not at
 * all. Do not restore one part and expect the control to read.
 */
/*
  ⚠ **`size-6`, down from 9 then 8 then 7 across 17 August, and `tap-target` is
  why that is free.** The visible shape is 24px and the hit area stays 44px — the
  utility centres a transparent pseudo-element on the control and floors it at the
  touch minimum, so the mark can be as small as it looks right without the target
  following it down. Shrinking a control that carried its own hit area would have
  been a legibility change *and* an accessibility one.

  ⚠ **A rounded square rather than a circle, directed 17 August — and the corner
  shrinks with the box or it stops being one.** `rounded-md` is 6px on 24px, the
  same quarter-of-the-side the previous pair held at 8 on 28. Holding the radius
  still while the box came down would have walked the shape back toward the circle
  it was asked to stop being: at 24px, an 8px corner is a third of the side.

  **Deliberately not `--radius-artwork`.** That token is the corner the posters and
  the banners over them share, and its own note says nothing else reads it — chips
  and controls have their own scale and are not artwork. This sits *on* the
  artwork without being any of it, and tying its corner to the poster's would
  invent a relationship that is not there.
*/
const CONTROL =
  'bg-text/8 tap-target flex size-6 shrink-0 items-center justify-center rounded-md'

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
  /* Which shape it is open in, and whether the next `close` is ours — see below. */
  const mode = useRef<'panel' | 'takeover' | null>(null)
  const reopening = useRef(false)

  /*
    Whether there is room to stand beside the wall rather than cover it. The number
    is `--breakpoint-pane` in globals.css and is read from there rather than
    repeated here — a width that lives in two files is a width that will disagree
    with itself.
  */
  const pane = usePaneWidth()
  /*
    The first intent and only the first. `intentsFor` still returns both — the
    vocabulary is unchanged — and this screen deliberately reads one of them; see
    the note at the top for what that costs Fixtures.
  */
  const [primary] = intentsFor('film')

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

    ⚠ **There was a `close()` in the cleanup here and it made this screen
    impossible to open in development.** A `<dialog>` fires `close` however it was
    closed, and `onClose` clears the state that renders this component — so the
    cleanup was asking to be unmounted. React runs every effect twice in
    development (mount, clean up, mount again) to surface exactly this kind of
    self-dependency, and it did: mount showed the dialog, the cleanup closed it,
    the close event unmounted the screen, and the second mount had nothing left to
    show. Nothing was wrong in production, where effects run once — which is why
    it went unseen, and it would have stayed unseen for as long as the dev server
    could not reach TMDB.

    **The cleanup is gone rather than guarded, because it never had a job.**
    Removing an open modal from the document takes it out of the top layer by
    itself, and React removes it the moment this component unmounts. A flag saying
    *this close is the machinery, not the person* was tried first and cannot work:
    `close` is dispatched asynchronously, so the second mount clears the flag
    before the event it was set for arrives.

    `if (!dialog.open)` is what the removal costs, and it is the whole cost:
    `showModal()` on a dialog that is already modal throws, and after the cleanup
    stopped closing it, the second mount meets one.
  */
  /*
    `show()` beside the wall, `showModal()` over it — see the class list in the
    render for why that is the whole of the difference between the two.

    **It re-runs when the width crosses `pane`**, because a dialog cannot be moved
    between the page and the top layer while it is open: rotating a tablet with a
    film open has to close it and open it again in the other mode. Without that,
    crossing upward leaves a 24rem panel wearing a full-screen backdrop, with the
    wall visible behind it and unclickable.

    ⚠ **Closing to re-open fires `close`, and `onClose` unmounts this screen.** The
    ref says which kind of close it was, and the handler *consumes* it — that is
    what makes it work where the same idea failed for the unmount case above.
    `close` is queued rather than dispatched, so a flag that is only ever set
    immediately before a close we caused is still true when that close arrives, and
    is cleared by the handler that reads it.
  */
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const wanted = pane ? 'panel' : 'takeover'
    if (mode.current === wanted && dialog.open) return

    if (dialog.open) {
      reopening.current = true
      dialog.close()
    }

    mode.current = wanted
    if (pane) dialog.show()
    else dialog.showModal()
  }, [pane])

  /*
    Escape, which a modal dialog gets from the platform and a panel does not. One
    listener, and only in the mode that lacks it — the takeover would end up
    closing twice.
  */
  useEffect(() => {
    if (!pane) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pane, onClose])

  /*
    The room the panel takes out of the page — `pane-inset` in globals.css. Set
    here rather than passed through the shell, so nothing between this component
    and the layout has to carry a flag it would only forward.
  */
  useEffect(() => {
    if (!pane) return
    const root = document.documentElement
    root.style.setProperty('--pane-open', '1')
    return () => {
      root.style.removeProperty('--pane-open')
    }
  }, [pane])

  /*
    ───────────────────────────────────────────────────────────────────────────
     The wall is where you left it — 17 August, and actually so since the 18th
    ───────────────────────────────────────────────────────────────────────────

    **Objective, in the words it was reported in: you should not be able to swipe
    while a poster is open and find yourself somewhere else on the wall when you
    close it.**

    ⚠ **The first attempt is reverted, and the reason it was the wrong shape is
    worth more than the reason it did not work.** It was `touch-none` on the
    artwork, `overscroll-contain` on the pane and `overscroll-none` on the
    dialog — three declarations, each blocking one route by which a gesture can
    reach the document. That is a defence built from a *list*, and a list is only
    as good as its completeness: momentum after the finger has gone, a wheel over
    a margin, a focus that reveals something, the browser's own address-bar
    reflow. Every one of those is another line, and the failure of any one of
    them looks exactly like the failure the report describes.

    **This does not care how the page moved: it takes the range away**, so there
    is nowhere for any of those routes to arrive. Two lines, in the order they
    matter:

    1. **The document has no scroll range while the screen is open.** `body` goes
       out of flow, and an out-of-flow box contributes nothing to its ancestors'
       scrollable overflow — so the range is not *refused*, it does not exist.
       There is nothing left for an engine to be lenient about.
    2. **The position is carried across it.** Taking the content out of flow
       forces `scrollY` to zero, so `top: -y` holds the page where it was for as
       long as the screen is open, and `scrollTo` puts it back on the way out.

    ───────────────────────────────────────────────────────────────────────────
     `overflow: hidden` on the root was the whole of line 1, and it was not
     enough — 18 August
    ───────────────────────────────────────────────────────────────────────────

    Reported from the handset: with a poster open, **a short indicator appeared
    partway down the right edge and moved under a drag** — over the artwork,
    where nothing scrolls.

    **Every box between that finger and the viewport was walked, and none of them
    can scroll.** The artwork block and this dialog are `overflow-hidden`; the
    column between them never sets `overflow`, and a `visible` box is not a scroll
    container; and the synopsis pane — the one thing on this screen that really
    does scroll — is a *sibling* of the artwork rather than an ancestor, so a
    gesture on the poster cannot reach it. Chaining goes up, never across, which
    is also why `scrollbar-none` sitting on that pane alone was never the gap.

    **So the indicator was the document's, and its shape said so twice over.** A
    stub means a long scroller, and the wall is many screens tall; *partway down*
    means it knew where you were.

    ⚠ **`overflow: hidden` on the root removes the user's ability to scroll, not
    the range.** A clipped scroller keeps its scrollable overflow, which is
    exactly what was left for an indicator to describe. Whether iOS was then
    honouring the lock and drawing a bar for a scroller nobody could move, or
    defeating it and letting the wall drift while line 2 quietly put it back,
    **the two readings share a cause and a cure**: a range that should not have
    been there. Line 1 no longer leaves one.

    ⚠ **Which means line 2 changed jobs, and it is worth knowing which.** It was
    a backstop — *the first line is why nothing moves, the second is why it does
    not matter if it does* — and a backstop is what let a broken lock ship
    looking fine. **A guard built beside a cure hides whether the cure works**:
    globals.css says it about the last lock and it was true again about this one.
    It is not a guard now, it is the mechanism that keeps the page's position
    while the flow it lived in is gone.

    ⚠ **This is the fixed body globals.css records removing on 13 August, and the
    reason it is safe here is the reason written there.** What it cost was
    Safari's address-bar collapse and pull-to-refresh — both responses to the
    *document* scrolling, and neither of them means anything under a modal that
    covers the viewport. It went out because it was permanent. This one lives as
    long as one screen is open.

    ⚠ **`left`/`right` rather than a width.** A fixed box shrinks to fit without
    them, and the wall behind would reflow to its widest row while nobody can see
    it, then reflow back on close — having moved the thing line 2 is trying to
    put back.

    ⚠ **Leaving the flow is itself a scroll event, and so is coming back.**
    Neither is a gesture, and the masthead in `shell.tsx` differences one scroll
    against the last — see the note on the scroll range there, which re-baselines
    across a change of shape rather than reading it as a flick.

    `behavior: 'instant'` because `html` sets `scroll-behavior: smooth`, and a
    restore is not a journey — smooth would animate the wall back under you.

    Written through the CSSOM rather than as a class, and that is a CSP
    requirement rather than a preference: `style-src` has no `unsafe-inline`, so
    a rendered `style` attribute is dropped in production while `el.style.x` from
    JS is untouched. See the note on `wordmark-trim` in globals.css.
  */
  useEffect(() => {
    /*
      ⚠ **Only the takeover locks the document.** Beside the wall the whole point
      is that the wall still scrolls, and the objective this lock exists for —
      *you should not find yourself somewhere else when you close it* — is not at
      risk when you can see where you are the entire time.
    */
    if (pane) return

    const root = document.documentElement
    const body = document.body
    const y = window.scrollY

    const previous = {
      overflow: root.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
    }

    root.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `${-y}px`
    body.style.left = '0'
    body.style.right = '0'

    return () => {
      root.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [pane])

  /*
    The details, and whether it is already on your list — one request, see
    `app/api/film/[id]/route.ts`.

    **Nothing waits for it.** The title, the year and the artwork all came off the
    thing that was tapped, so the screen is complete from the first frame and this
    fills in the synopsis and the marks. A spinner over a poster we already have
    would be inventing a wait.

    ⚠ **It is usually already in flight by the time this runs.** The poster starts
    it on `pointerdown` and this claims it — see `lib/film-request.ts` for why the
    hand-off is one request rather than a cache. `claimFilmRequest` starts its own
    if there is nothing to claim, so this path does not depend on having been
    prefetched and a screen opened some other way behaves identically.

    Cancelled on unmount so closing the screen does not leave a request writing
    into a component that has gone. The flag rather than the signal, because the
    request may not be the one this effect created.
  */
  useEffect(() => {
    let cancelled = false
    const request = claimFilmRequest(film.externalId)

    request.response
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        if (cancelled) return
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
        if (cancelled) return
        /*
          The synopsis is the part that fails softly — there is a line for that
          below. The marks are not: an unknown list state stays unknown rather
          than defaulting to "not on your list", because the `+` that would draw
          is the one thing on this screen that can be wrong in a way you act on.
        */
        setDetails({ synopsis: null, runtime: null, directors: [] })
      })

    return () => {
      cancelled = true
      request.abort()
    }
  }, [film.externalId])

  /* §5.1. The offer expires; the row does not (§5 — nothing is ever deleted). */
  useEffect(() => {
    if (!undoable) return
    const timer = setTimeout(() => setUndoable(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [undoable])

  function add(intent: Intent) {
    // Inside the gesture: a haptic answers a finger, and every platform that has
    // one refuses it once the gesture is over. See `lib/haptics.ts` — on iOS this
    // currently does nothing, and that is not for want of trying.
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
      onClose={(event) => {
        /*
          ⚠ **React makes `close` propagate where the platform does not, and it
          cost this screen its own life.** `close` is a non-bubbling event: a
          native listener here would never hear a *nested* dialog close. React
          delegates from the root and dispatches along the **React tree**, so the
          full poster opened by `PosterReveal` — which is rendered inside this
          dialog — closed this one with it. Expanding the poster and dismissing it
          took the whole film screen back to the wall.

          **This is the same lesson `shell.tsx` records from the other side**, where
          a portalled dock's taps arrived at a handler on `#scroll-root` because
          React propagates through the component tree rather than the DOM. There
          it added listeners the DOM would not have; here it adds propagation the
          DOM does not have. Ask the event which element it happened to.
        */
        if (event.target !== ref.current) return

        /*
          Consumed, not merely read: this flag is set immediately before a close
          this component caused, so the first `close` to arrive after it is that
          one. Clearing it here is what stops the next real close being swallowed.
        */
        if (reopening.current) {
          reopening.current = false
          return
        }
        onClose()
      }}
      aria-label={film.title}
      /*
        Full bleed on black. `backdrop:bg-black` spelled out rather than taken
        from the token, for the reason `PosterReveal` gives: this is black because
        artwork wants nothing behind it, not because it inherits the app's ground.

        ─────────────────────────────────────────────────────────────────────────
         `h-dvh` and `overflow-hidden`: the dialog was the thing scrolling
        ─────────────────────────────────────────────────────────────────────────

        Reported: a scrollbar on the right while swiping, even though the wall
        behind was correctly held still. Both halves of that were true, and
        together they name the culprit — **it was not the document, it was this
        element.**

        Two facts meet. A `<dialog>`'s UA style is `overflow: auto`, so it becomes
        a scroller the moment its content is taller than it is. And `h-full` on a
        modal dialog is 100% of the *initial containing block*, which is the
        **layout** viewport — the full height of the screen including the strip
        Safari's address bar is sitting over. So on a phone with chrome showing,
        the box was taller than the visible area by exactly the height of that
        bar, and the overflow it produced was scrollable and indicated.

        Nothing moved on the wall because the lock was working. What moved was the
        screen itself, inside a box slightly too tall for the window.

        `h-dvh` is the *visible* viewport rather than the layout one, so there is
        nothing left over to scroll. `overflow-hidden` is the guarantee rather
        than the fix: whatever any engine decides the height should be, this
        element is never a scroll container, so it can never indicate or absorb a
        gesture again.

        ⚠ **`dvh` rather than `svh`.** `svh` is the *smallest* viewport, which
        would leave a strip of the screen unpainted whenever the address bar is
        already collapsed. The usual objection to `dvh` — that it changes as the
        chrome moves, resizing the layout underneath you — does not reach here:
        Safari collapses its bar in response to the *document* scrolling, and the
        document is locked for as long as this screen is open. See the effect
        above.
      */
      /*
        ─────────────────────────────────────────────────────────────────────────
         Above `pane` it stands beside the wall instead of covering it — 18 August
        ─────────────────────────────────────────────────────────────────────────

        **Directed: at desk and tablet-landscape widths the film sits beside the
        wall and the wall stays live**, so tapping another poster swaps what is in
        the panel rather than closing anything.

        ⚠ **The expensive reading of that is wrong, and it is worth saying why.**
        It sounds like "make the dialog non-modal", which means hand-building the
        four things `<dialog>` was chosen for — focus containment, inertness,
        Escape, and dismissal by tapping outside. **Three of them are things a live
        wall must not have.** A panel beside the page does not trap focus, does not
        make the page inert, and is emphatically not dismissed by clicking the
        page, because clicking the page is how you change what it shows. Only
        Escape survives, and Escape on a non-modal dialog is one listener — see the
        effect above.

        So this stays one element with one set of children, and the mode is data:
        `show()` puts it in the page, `showModal()` puts it in the top layer, and
        the class list says which shape it takes. **Two behaviours, no second
        component and no second copy of the screen to keep in step.**

        ⚠ **The panel is the rail's mirror.** `right: max(0px, 50% - 36rem)` is the
        rail's own expression with the side flipped, so on a wide screen the panel
        sits at the band's edge rather than the glass's and the composition stays
        centred. The room it takes out of the page is `pane-inset` in globals.css,
        driven by a custom property — the shell never learns this exists.

        `z-30` because a dialog outside the top layer is an ordinary positioned
        element again, and the masthead is `z-20`.
      */
      data-film-panel={pane ? '' : undefined}
      className={
        pane
          ? /* `left-auto` because a `<dialog>`'s UA style pins both edges to zero,
               and a left of zero beats a right of anything. */
            'fixed top-0 left-auto right-[max(0px,calc(50%_-_36rem))] z-30 m-0 h-dvh max-h-none w-(--pane-column) max-w-none overflow-hidden bg-black p-0 text-text'
          : 'm-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-text backdrop:bg-black'
      }
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
            ⚠ **The scrim is deleted, and it took three other things with it — 18
            August.** It was a gradient over the foot of the artwork, stopped at
            80% rather than solid black so the `+` would have something to frost
            against, and it existed for exactly one reason: type was sitting on a
            picture. **Directed: none of the writing overlaps the poster.** So
            there is no type on the picture, and the scrim, the frost and the
            contrast floor that governed both are gone with it.

            What that bought, and it is worth stating because it was the argument
            for doing it: **legibility no longer depends on which film you tapped.**
            Over the brightest poster the title read 11:1 and the credit line 5:1,
            and the green tick — the number this file told you to watch — sat at
            3.3:1 against a 3:1 floor. On the flat ground below the artwork the
            tick is `--color-listed` on black at **6.0:1** and the title is full
            strength, on every poster there has ever been. A design whose contrast
            is a function of the image is one that is wrong on some image you have
            not met yet.
          */}

          {/*
            ─────────────────────────────────────────────────────────────────────
             The artwork is the way back — 17 August
            ─────────────────────────────────────────────────────────────────────

            Directed: tapping the artwork returns you to the wall. Which is the
            interaction `PosterReveal` in `poster.tsx` has had since 8 August —
            *tap the title, see the poster; tap anywhere, close it* — and the
            reason it works there is the reason it works here: a picture that
            opened on a tap is a picture that should shut on one.

            ⚠ **A `<button>` covering the artwork, not an `onClick` on the div.**
            The same call the intent sheet's scrim made, in its own words: a click
            handler on a div is something only a mouse can find, while a button is
            reachable from a keyboard and announced as a control. It costs one
            element and it is the difference between an affordance and a secret.

            **Nothing is excluded by name, and since 18 August nothing needs to
            be.** This button is the only thing in the artwork block now. The title
            and the credit line used to lie over it, which cost them
            `pointer-events-none` and cost the `+` a `pointer-events-auto` to climb
            back out — **three declarations arranging for a stack that no longer
            exists.** They are below the picture, so they are simply not in the way.
          */}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="absolute inset-0"
          />
        </div>

        {/*
          --- what it is, under the artwork -------------------------------

          **Directed 18 August: none of the writing overlaps the poster.** This was
          `absolute inset-x-0 bottom-0` over the foot of the artwork; it is an
          ordinary block in the column now, and everything that existed to make
          type survive a picture went with the move — see the note where the scrim
          was.

          `shrink-0` because the synopsis below is the `flex-1` that gives, and a
          title that lost a line to a long write-up would be the wrong thing to
          compress.

          ⚠ **The `+` came down with the title, and that is a decision rather than
          a consequence.** It is inline in the heading, so it followed the words by
          construction — but it was asked for explicitly, with a note that it may
          go back to **the poster's top right** later. If it does, it needs its
          frost back, and the frost needs a scrim, and the scrim needs the contrast
          floor: the note where the scrim was is the whole recipe. Do not restore
          one part of it and expect the control to read.
        */}
        <div className="gutter shrink-0 pt-5">
            {/*
              ─────────────────────────────────────────────────────────────────
               The `+` ends the title, on whichever line the title ends
              ─────────────────────────────────────────────────────────────────

              It has been in three places today: the artwork's top right, opposite
              the close, which put the one thing this screen is *for* in the corner
              reserved for furniture; under the credit line, which read as an
              afterthought to the metadata; and beside the title in a flex row,
              which was right for a one-line name and wrong for every other —
              a row aligns the control to the *block*, so a title that ran to three
              lines left the control floating beside the first with two lines of
              nothing under it.

              ⚠ **So it is not beside the heading any more, it is inside it.** The
              control is inline content, after the last word, with an ordinary
              space in front of it: it flows, so it ends up at the end of the last
              line whatever that line turns out to be, at any width and any length
              of name. There is no case analysis and no breakpoint — the same rule
              produces the one-line answer and the four-line answer.

              ⚠ **`h-[1lh]` on the wrapper is what stops the last line growing.**
              An inline box taller than the line it sits in would push that line
              past the ones above it, and uneven leading in a wrapped title is the
              sort of thing you see without being able to name. The wrapper is
              exactly one line high — it inherits the heading's size and line
              height, so it follows the type step at 64rem without knowing the
              number — and the mark centres in it and overflows evenly, which costs
              the line box nothing.

              ─────────────────────────────────────────────────────────────────
               `align-middle` is not the middle the eye reads — 17 August
              ─────────────────────────────────────────────────────────────────

              Asked: *are we sure it sits optically in line with the words beside
              it?* We were not, and it did not. **`vertical-align: middle` centres
              a box on the x-height band by definition** — its whole meaning is
              *baseline plus half the x-height* — and a title set in title case is
              read against its **capitals**, not its x-height. The two bands do not
              share a centre: for IBM Plex Sans, cap height is 0.698em and
              x-height 0.516em, so the cap band's centre sits `(cap − x) / 2` —
              about 2px at 22px type — **above** where `align-middle` puts things.

              That is the correction, and it is written as the expression rather
              than as the 2px: `bottom: calc((1cap - 1ex) / 2)` on a relatively
              positioned box, which shifts it up by exactly that much. **`cap` and
              `ex` are the font's own metrics**, so this stays right at 28px type
              on a desk, and stays right if the face is ever changed — which a
              measured margin would not. It is the same move `--wordmark-drop`
              makes in globals.css: take the band the eye reads rather than the box
              the layout gives you.

              Relative positioning, so the shift is visual only and the line box is
              untouched — a margin would have moved the layout and grown the line.

              ⚠ **Also asked: which side is it on?** Whichever side the language
              ends its lines on. The mark is inline content in the heading, not a
              positioned element, so it flows — after the last word in English, and
              at the left of the last line in an RTL context, with nothing here
              needing to know which. Untested: nothing in this app sets `dir`, so
              this is a property of the construction rather than something that has
              been exercised.

              ⚠ `1lh`, `1cap` and `1ex` — `ex` is universal; the other two are
              Safari 16.4 and Chrome 109. Where either is not understood its
              declaration is dropped on its own: without `lh` the final line of a
              wrapped title is a few pixels taller than its siblings, without `cap`
              the mark sits where it did before this note. Degrades to slightly
              wrong, never to broken.

              ⚠ **`aria-label` on the heading, because the control lives in it
              now.** A heading takes its accessible name from its contents, so
              without this it would announce as *"The Zone of Interest, Want to
              see"* — the title welded to a button's label. The label pins the
              heading to the film's name; the button keeps its own name and stays a
              separate stop for anything navigating by control.
            */}
            <h2 className="title" aria-label={film.title}>
              {film.title}{' '}
              {/*
                ⚠ **The slot is drawn from the first frame and its contents are
                not.** `marks === null` is *not yet known*, and a `+` drawn then
                would be claiming the film is not on your list before anything has
                asked. The circle is there, so the line is laid out and the title
                never reflows around it; the glyph inside waits for the answer.

                The tick is green, and the green means *this is on your list*
                rather than *that worked*. See `--color-listed` in globals.css for
                what that distinction costs and why it is drawn that way round.
              */}
              <span className="relative bottom-[calc((1cap_-_1ex)/2)] inline-flex h-[1lh] items-center align-middle">
                <AddControl
                  state={marks === null ? 'unknown' : listedPrimary ? 'listed' : 'absent'}
                  label={specFor('film', primary).wantLabel}
                  undoable={Boolean(undoablePrimary)}
                  onAdd={() => add(primary)}
                  onUndo={() => undoablePrimary && undo(primary, undoablePrimary.entryId)}
                />
              </span>
            </h2>

            {/*
              ⚠ **`min-h-[1lh]` is the other half of the two-stage report** — the
              lurch, where `lib/film-request.ts` takes the pause. This block is
              `absolute bottom-0`, so it grows *upward*: a credit line that is
              empty on the first frame and one line high a moment later drags the
              title up with it, under your eyes, on the screen you just opened.

              **The line is reserved, not the block.** One line is what this holds
              on almost every film — the year alone is usually there from the
              tapped poster — and the case that moves is the one where it is not:
              a film with no year renders nothing at all until the request lands.
              Reserving *two* would stop a long director list reflowing as well,
              and would cost every other film a permanent empty line over its
              artwork. That trade is not worth it; this one costs nothing.

              `1lh` is the element's own line box, so it follows the type step at
              64rem without knowing the number — the same reasoning as the `+`
              wrapper above, including its Safari 16.4 floor. Where it is not
              understood the declaration drops on its own and the behaviour is
              what it was before this note.
            */}
            <p className="text-muted mt-2 min-h-[1lh] text-sm">
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

            {/*
              ─────────────────────────────────────────────────────────────────
               Seeing the poster is a control now, not the picture itself
              ─────────────────────────────────────────────────────────────────

              Asked, 18 August: can the poster in the panel be tapped to expand
              it? **Not the picture — tapping the artwork closes the screen**, and
              that is deliberate (17 August, *no visible way out: the artwork is
              it*). Overloading it in the panel and not in the takeover would have
              made the same tap mean two different things depending on how wide
              the window was, which is the divergence this screen has otherwise
              avoided. Directed instead: put the expand somewhere that is not the
              image. **So the artwork still closes, at every width, and this is
              the way to the full poster at every width.**

              ⚠ **`PosterReveal`, not a second lightbox.** It has been doing
              exactly this since 8 August for the lists — full bleed on black,
              `object-contain`, `touch-none` because an unhandled pinch zooms the
              *page* and iOS gives no way back, tap anywhere to close. Rebuilding
              any of that here would be a second copy of reasoning that took a
              day to settle. The words are its own: `see the poster` is already
              what its `aria-label` says in the lists.

              **It earns its place beyond consistency**, because the artwork above
              is `object-cover object-top` and therefore cropped. This is the only
              way to see the whole poster, which is a different thing from seeing
              a bigger one.

              ⚠ **Guarded on `large` rather than left to the component.**
              `PosterReveal` renders its children unwrapped when there is no
              artwork — right when the children are a film's title, wrong when
              they are a label, which would leave the words *See the poster*
              sitting there as text that does nothing.
            */}
            {/*
              ⚠ **Panel only, and that is a parked question rather than a
              decision.** Directed 18 August: the handset goes back to what it was
              before this control existed. It is not that the handset does not
              want a way to the full poster — it is that **where** that control
              goes there has not been settled, and a third line under the credit
              line was not it. An open row in `docs/plan.md`.

              Everything else about the two widths is identical: the words sit
              below the artwork at both, and this is the only thing that differs.
            */}
            {pane && large && (
              <PosterReveal
                posterPath={film.posterPath}
                title={film.title}
                /*
                  The app's quiet text-button tier, the one the resolve actions
                  wear in `entry-row.tsx`: muted 14px that takes full strength on
                  hover, with `tap-target` giving it a 44px hit area without
                  changing the line it sits on.

                  ⚠ **No underline classes here on purpose.** `PosterReveal`
                  brings its own — `decoration-rule` at a 6px offset, taking
                  colour on hover — and a second `underline-offset` in this string
                  would be two declarations of one property resolved by stylesheet
                  order rather than by anything written down. It is also the right
                  underline: this is the same affordance as *tap the title, see the
                  poster* in the lists, so it should look like it.

                  `micro` was tried first and was wrong. It uppercases, which put
                  this in the same tier as the *Synopsis* heading directly below
                  it — two labels stacked, one of which is secretly a control.
                */
                className="text-muted hover:text-text tap-target mt-3 block w-fit text-sm"
              >
                See the poster
              </PosterReveal>
            )}
        </div>

        {/*
          --- the synopsis, and the other intent ---------------------------

          **The word holds still and the writing moves under it**, directed
          17 August. The heading used to scroll away with its own paragraph, which
          made a long synopsis a wall of text with nothing naming it once you were
          three lines in.

          ⚠ **`min-h-0` on both this column and the scroller inside it, and it is
          the whole mechanism.** A flex item's automatic minimum size is its
          content, so a `flex-1` child with more text than room grows the column
          instead of scrolling — the overflow never happens, so `overflow-y-auto`
          has nothing to do and the artwork above gets squeezed instead. Setting
          the floor to zero is what lets the box be smaller than what is in it,
          which is the precondition for scrolling at all.

          The `gutter` sits on the heading and the scroller separately rather than
          on the column, so that the writing scrolls under a heading that is inset
          to the same line.

          ⚠ **`scrollbar-none`, because the bar was making a claim about the wrong
          thing.** Reported 17 August: an indicator still appeared and moved under
          a drag with a poster open, reading as *your scrolling is having an
          effect*. It was — on this pane, which really does scroll — but on a
          screen whose whole promise is that the wall behind it is frozen, a moving
          bar at the right edge is a statement about the page. The pane still
          scrolls; it simply stops reporting it. See the utility in globals.css for
          what that costs.
        */}
        <div className="flex min-h-0 flex-1 flex-col pt-6">
          <h3 className="gutter micro text-muted shrink-0">Synopsis</h3>

          {/*
            `safe-bottom` is back on the scroller, because the scroller is the last
            thing in the column again — the *Close* that briefly sat under it is
            gone. There is no visible way out now: the artwork closes on a tap, and
            Escape closes from a keyboard. Same as `PosterReveal`, which has never
            had one either.
          */}
          <div className="gutter safe-bottom scrollbar-none mt-3 min-h-0 flex-1 overflow-y-auto [--safe-bottom-base:1.5rem]">
            <p className="text-sm">
              {details === null ? '' : (details.synopsis ?? 'No synopsis for this one.')}
            </p>

            {/*
              Full strength, not `text-muted` — a failure set in the colour reserved
              for de-emphasised metadata reads as an aside. docs/decisions.md,
              8 August, and it has survived every surface this message has lived on.
            */}
            {error && <p className="mt-6 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    </dialog>
  )
}

/**
 * Whether there is room to stand beside the wall rather than cover it.
 *
 * ⚠ **The number is not here.** `--breakpoint-pane` is declared in globals.css,
 * where the arithmetic that produced it is written down, and this reads it back
 * off the root. A breakpoint spelled once in CSS and again in JavaScript is a
 * breakpoint that will disagree with itself the first time either moves — and the
 * disagreement would be invisible, since each half would look right on its own.
 *
 * `matchMedia` takes the value as written, `72rem` and all, so nothing here has to
 * know what a rem is worth.
 *
 * Read synchronously on the first render rather than in an effect: this screen
 * only ever mounts from a tap, so there is no server render to disagree with, and
 * settling it a frame later would open every desk poster as a takeover and then
 * snap it into a panel.
 */
function paneQuery(): MediaQueryList {
  const width = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-pane')
    .trim()
  return window.matchMedia(`(min-width: ${width})`)
}

function usePaneWidth(): boolean {
  const [pane, setPane] = useState(() =>
    typeof window === 'undefined' ? false : paneQuery().matches,
  )

  useEffect(() => {
    const query = paneQuery()
    const onChange = () => setPane(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return pane
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
  /*
    ⚠ **`span`, not `div`, in both non-button states.** This control is inline
    content inside the `<h2>` now, and a heading takes phrasing content — a `div`
    there is invalid markup that browsers repair by guessing. `CONTROL` sets
    `display: flex`, so what the element is called changes nothing about how it
    draws.
  */
  if (state === 'unknown') {
    return <span aria-hidden className={`${CONTROL} opacity-40`} />
  }

  if (state === 'listed') {
    /*
      A button only while it can do something. §5 has no delete: after ten seconds
      this is a state marker, and a control that silently stops working would be
      worse than one that was never a control.
    */
    if (!undoable) {
      return (
        <span
          className={`${CONTROL} text-listed`}
          role="img"
          aria-label={`${label} — on your list`}
        >
          <TickIcon />
        </span>
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

/*
  A `SecondaryIntent` lived here — the quiet *Want a copy* control under the
  synopsis — and it went with its call site on 17 August. Deleted rather than left
  unreferenced, for the reason the `return-count` utility was deleted from
  globals.css: a component with no callers is a component waiting to be reapplied
  by someone who does not know why it existed. The reasoning that would matter to
  whoever needs it back is at the top of this file, not here.
*/

/**
 * §11 permits known icons, and a plus is the known one for "add this". Same
 * inline-rather-than-a-package reasoning as `icon-close.tsx`, and `currentColor`
 * so the control's own state decides its colour.
 *
 * ⚠ **14px, following the box down on 17 August.** A plus is two strokes and no
 * interior, so it needs air around it to read as a mark rather than as a fill: at
 * 16px in a 24px box it left 4px a side and looked crowded. This holds roughly
 * the proportion it had at 28, which is what "smaller" was asking for — the
 * control, not the glyph inside it pressing against the corners.
 */
function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
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
