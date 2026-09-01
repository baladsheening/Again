'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The three beats, and the box that gives way to the form — 1 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Reported from the handset: tapping *create an account* adds a third field, and
 * the whole form slid down far enough that *sign in with a password* went under
 * the fold. Directed: **the fields should push UP instead, and where they cover
 * the text above, that text should fade.**
 *
 * ⚠ **The pushing up is FLEX SHRINK and there is no JavaScript in it.** `main`
 * is capped at the viewport, the form is `shrink-0`, the mark is `shrink-0`, and
 * this box is the one thing on the screen that can give ground — so a field
 * arriving takes its height out of the beats rather than out of the bottom of
 * the screen. Nothing measures a field, nothing knows a mode, and the same
 * mechanism answers a short phone, a landscape keyboard and a face that loads
 * wider than the fallback.
 *
 * ⚠ **What IS measured is whether anything is actually cut**, and that is the
 * whole job of this component. A mask fades the bottom line of the box; a mask
 * that is always on fades the last line of *keep?* on a screen where nothing has
 * been cut at all, which is a defect in the resting state to fix a defect in the
 * crowded one. CSS cannot ask *am I overflowing* — there is no selector for it,
 * `scroll()` timelines are far too new for the handset this ships to, and a
 * `:has()` gate on the sign-up field would be a proxy for space rather than a
 * reading of it: it would fade on a tall phone with nothing cut, and stay hard
 * on a short one in sign-in mode. **So the boolean is read off the box.**
 *
 * ⚠ **It is `scrollHeight − clientHeight − scrollTop`, which is *is there text
 * below this edge* — not *does this box overflow*.** The two differ once
 * somebody scrolls to the end, where a fade would be promising more that is not
 * there. That is why `scroll` is on the listener list beside the observer.
 *
 * ⚠ **It scrolls, and that is not decoration.** One of the three beats is the
 * disclosure that what you write is matched against the people you follow — see
 * the docblock on `app/sign-in/page.tsx`. Cut text that cannot be reached would
 * be that sentence gone on a small enough screen; cut text that scrolls is the
 * record's own arrangement, where the fade says *there is more* and the finger
 * gets it.
 */
export function WallBeats({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cut, setCut] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const read = () => setCut(el.scrollHeight - el.clientHeight - el.scrollTop > 1)

    /*
      The box's own height changes when the form gains a field, and its
      children's heights change when the mono lands and the sentences re-wrap.
      Neither implies the other — a box that has already been shrunk keeps its
      height while its content grows — so both are observed.
    */
    const observer = new ResizeObserver(read)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    el.addEventListener('scroll', read, { passive: true })
    read()

    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', read)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-cut={cut || undefined}
      className="wall-beats flex flex-col gap-6 stack:max-w-[34rem]"
    >
      {children}
    </div>
  )
}
