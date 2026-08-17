'use client'

import { createContext, use, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { FilmScreen } from './film-screen'
import { HapticSwitch } from './haptics'

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

  return (
    <CaptureContext.Provider value={{ choose: setChosen }}>
      {children}

      {/* Mounted once for the app — see `haptics.tsx` for why it is a checkbox. */}
      <HapticSwitch />

      {chosen && <FilmScreen film={chosen} onClose={() => setChosen(null)} />}
    </CaptureContext.Provider>
  )
}
