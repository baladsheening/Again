'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * ⚠ **TEMPORARY.** A live readout of the viewport numbers, for diagnosing where
 * the phone's search bar ends up with a keyboard open. Delete this file and its
 * one use in `components/shell.tsx` once that is settled.
 *
 * Only renders with `?probe=1` on the URL, so it cannot appear by accident.
 *
 * **It writes to the DOM rather than through state**, on a `requestAnimationFrame`
 * loop. A probe that re-rendered sixty times a second would be measuring a page
 * it was itself slowing down, and the thing under investigation is scrolling
 * behaviour.
 */
export function ProbeReadout({ bar }: { bar: React.RefObject<HTMLElement | null> }) {
  /*
    `useSearchParams` rather than reading `window.location` into state: it is
    the same answer on the server and the client, so there is no hydration
    mismatch and no render spent discovering the flag.
  */
  const on = useSearchParams().get('probe') === '1'
  const out = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!on) return

    let frame = 0

    const tick = () => {
      const el = out.current
      const vv = window.visualViewport

      if (el && vv) {
        const rect = bar.current?.getBoundingClientRect()
        const n = (v: number | undefined) =>
          v === undefined ? '—' : String(Math.round(v * 10) / 10).padStart(7)

        // The same quantity `useKeyboardPin` corrects on. Zero means the bar's
        // bottom edge is exactly on the bottom of the visible area.
        const err =
          rect === undefined ? undefined : rect.bottom - vv.offsetTop - vv.height

        el.textContent = [
          `inner  ${n(window.innerHeight)}`,
          `client ${n(document.documentElement.clientHeight)}`,
          `vv.h   ${n(vv.height)}`,
          `vv.top ${n(vv.offsetTop)}`,
          `vv.pg  ${n(vv.pageTop)}`,
          `scrY   ${n(window.scrollY)}`,
          `bar.t  ${n(rect?.top)}`,
          `bar.b  ${n(rect?.bottom)}`,
          `ERR    ${n(err)}`,
        ].join('\n')
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [on, bar])

  if (!on) return null

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
