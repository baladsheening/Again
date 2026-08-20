'use client'

import { createContext, use, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { FilmScreen } from './film-screen'

/**
 * Adding a film, from wherever the film came from.
 *
 * There are two surfaces — the poster wall on the home screen and the search
 * field in the phone's bottom bar — and both end in the same place. A surface
 * only has to say *this film*, by calling `choose`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two surfaces left this file on 17 August, and it is most of what it did
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It used to own an intent sheet and an acknowledgement band, along with the add,
 * the undo timer, the error state and the ten-second window. All of it is in
 * `film-screen.tsx` now, because all of it belongs to one screen: the film is
 * shown, the add is a control on it, and the confirmation is that control
 * changing. There is no longer a moment where something is added and the thing
 * you added is not in front of you, which is what the band existed to cover.
 *
 * What is left is the part that was always this file's: **one film chosen, from
 * anywhere.** The state is a single value and the provider is four lines, which
 * is the shape it should have had once the flow stopped being spread across a
 * grid, a bottom bar and a strip above them.
 */

/**
 * ⚠ **Two verbs, and the difference is whose idea it was — 20 August.**
 *
 * `choose` is a person picking a film: the screen opens and takes the focus,
 * which is right, because they asked for it and their next key belongs there.
 *
 * `present` is the page putting one there on arrival — the wall's first film,
 * standing in the column the desk layout reserves. **It must not take the
 * focus.** `dialog.show()` runs the focusing steps whatever opened it, so
 * without this the page landed with the keyboard on the panel's *Close* button:
 * the first Tab or Enter from a fresh page would shut something nobody opened.
 *
 * The flag is on the choice rather than on the screen because that is where the
 * fact lives. A screen cannot tell how it came to be shown, and any test it
 * could make — the pointer, the width, whether anything is focused — would be
 * inferring an intention that the caller simply knows.
 */
const CaptureContext = createContext<{
  choose: (film: FilmSearchResult) => void
  present: (film: FilmSearchResult) => void
} | null>(null)

export function useCapture() {
  const ctx = use(CaptureContext)
  if (!ctx) throw new Error('useCapture must be used inside CaptureProvider')
  return ctx
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  /* The film and how it got here, because the second decides the focus. */
  const [chosen, setChosen] = useState<{
    film: FilmSearchResult
    byHand: boolean
  } | null>(null)

  /*
    ⚠ **The wall gets the panel's column back when the panel is closed — and this
    is written from the handlers, not from an effect.** `pane-inset` in
    globals.css reserves that column by default, so the page loads with it held
    and nothing has to run for the first paint to be right. What is left is the
    one transition a person asks for, and the two places that know about it are
    right here: closing sets the property, choosing or presenting clears it.

    ⚠ **`el.style` on the root, like every other custom property this app sets
    from JS.** A rendered `style` attribute is dropped by the CSP in production
    while `next dev` allows it — see `proxy.ts`, and `--keyboard-overlap` and
    `--print-fade` for the same route taken for the same reason.

    An effect keyed on `chosen` would have been the obvious build and it is the
    wrong one: it runs on mount too, with nothing chosen, and would have to be
    taught that the first `null` is not a close. There is no such state here —
    only a null that was never opened, and a null that a handler made.
  */
  const paneClosed = (closed: boolean) => {
    const root = document.documentElement
    if (closed) root.style.setProperty('--pane-closed', '1')
    else root.style.removeProperty('--pane-closed')
  }

  return (
    <CaptureContext.Provider
      value={{
        choose: (film) => {
          paneClosed(false)
          setChosen({ film, byHand: true })
        },
        present: (film) => {
          paneClosed(false)
          setChosen({ film, byHand: false })
        },
      }}
    >
      {children}

      {/*
        A `HapticSwitch` was mounted here — a hidden `<input type="checkbox"
        switch>` that iOS was supposed to buzz when toggled. It never buzzed. See
        `lib/haptics.ts`, and `docs/plan.md` for the want it leaves open.
      */}

      {chosen && (
        <FilmScreen
          film={chosen.film}
          takeFocus={chosen.byHand}
          onClose={() => {
            paneClosed(true)
            setChosen(null)
          }}
        />
      )}
    </CaptureContext.Provider>
  )
}
