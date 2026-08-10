'use client'

import { useEffect, useRef } from 'react'

/**
 * ⚠ **TEMPORARY, AND DELIBERATELY ALWAYS ON.** A live readout of the viewport
 * numbers, for settling where the phone's search bar ends up with a keyboard
 * open. Delete this file and its one use in `components/shell.tsx` once that is
 * done.
 *
 * It was behind `?probe=1` and did not appear on the device it was built for —
 * most likely the app was opened without the flag, which is exactly the kind of
 * thing that costs a whole round trip. Unconditional is uglier and cannot fail.
 *
 * **It writes to the DOM rather than through state**, on a `requestAnimationFrame`
 * loop. A probe that re-rendered sixty times a second would be measuring a page
 * it was itself slowing down, and scrolling is the thing under investigation.
 */
export function ProbeReadout({
  bar,
  anchor,
}: {
  bar: React.RefObject<HTMLElement | null>
  anchor: React.RefObject<HTMLElement | null>
}) {
  const out = useRef<HTMLPreElement>(null)

  useEffect(() => {
    let frame = 0

    const tick = () => {
      const el = out.current
      const vv = window.visualViewport

      if (el && vv) {
        const barRect = bar.current?.getBoundingClientRect()
        const anchorRect = anchor.current?.getBoundingClientRect()
        const n = (v: number | undefined) =>
          v === undefined ? '      —' : String(Math.round(v)).padStart(7)

        el.textContent = [
          `inner  ${n(window.innerHeight)}`,
          `client ${n(document.documentElement.clientHeight)}`,
          `vv.h   ${n(vv.height)}`,
          `vv.top ${n(vv.offsetTop)}`,
          `scrY   ${n(window.scrollY)}`,
          `anch.b ${n(anchorRect?.bottom)}`,
          `bar.b  ${n(barRect?.bottom)}`,
          // What the pin is aiming the bar's bottom edge at, and how far off it
          // currently is. TARGET − bar.b is the whole diagnosis.
          `TARGET ${n(vv.offsetTop + vv.height)}`,
          `OFF    ${n(barRect ? vv.offsetTop + vv.height - barRect.bottom : undefined)}`,
        ].join('\n')
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [bar, anchor])

  return (
    <pre
      ref={out}
      aria-hidden
      /*
        Top-right and above everything, because the keyboard owns the bottom of
        the screen and the bar being diagnosed owns the rest of it. Yellow on
        black survives a screenshot taken at arm's length.
      */
      className="pointer-events-none fixed right-1 z-50 bg-black/90 px-1.5 py-1 font-mono text-[11px] leading-[1.35] text-yellow-300 tabular-nums"
      style={{ top: 'calc(env(safe-area-inset-top) + 4px)' }}
    />
  )
}
