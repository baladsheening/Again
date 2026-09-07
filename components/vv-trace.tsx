'use client'

import { useEffect, useRef } from 'react'

/**
 * **A readout of what the viewport actually does when a field takes focus.**
 *
 * ⚠⚠ **THIS IS A DIAGNOSTIC AND IT IS MEANT TO BE DELETED.** It exists because
 * two fixes for *the page goes up and comes back down* were built on reasoning
 * about iOS rather than on numbers off the device, and both were wrong. No
 * desktop browser can raise an iOS keyboard, so the handset is the only
 * instrument — this is the instrument.
 *
 * Open `/?trace=1`, tap in the composer, screenshot. Everything else on the
 * page behaves exactly as it does without the parameter.
 *
 * ⚠ **It draws OUTSIDE the host and follows the visual viewport itself**, so it
 * stays on screen whatever the host does, and it can never be the thing being
 * measured. `pointer-events: none` so it cannot take the tap.
 *
 * ⚠ **Written through the CSSOM.** §10 blocks `style` attributes; the same door
 * every other measurement in this app uses.
 */
export function VvTrace() {
  const holder = useRef<HTMLPreElement | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    const el = holder.current
    if (!el) return
    /*
      Hidden rather than unmounted, and decided in the effect rather than in
      state: the server cannot know the query string, so a state read of it is a
      hydration mismatch waiting to happen.
    */
    if (!vv || new URLSearchParams(window.location.search).get('trace') !== '1') return
    el.hidden = false

    const rows: string[] = []
    let head = ''
    let t0 = 0
    let frame = 0
    let until = 0
    let last = ''

    const paint = () => {
      const el = holder.current
      if (el) el.textContent = `${head}\n${rows.slice(-22).join('\n')}`
    }

    const sample = () => {
      const box = document.querySelector('.screen-viewport')
      const r = box?.getBoundingClientRect()
      const line = [
        String(Math.round(performance.now() - t0)).padStart(4),
        String(Math.round(vv.offsetTop)).padStart(4),
        String(Math.round(vv.height)).padStart(4),
        String(Math.round(window.innerHeight)).padStart(4),
        String(document.documentElement.clientHeight).padStart(4),
        String(Math.round(r?.top ?? -1)).padStart(4),
        String(Math.round(r?.height ?? -1)).padStart(4),
        String(Math.round(window.scrollY)).padStart(3),
      ].join(' ')
      /* Only the frames where something moved, so a screenshot holds the story. */
      const shape = line.slice(5)
      if (shape !== last) {
        last = shape
        rows.push(line)
      }
      paint()
    }

    const run = () => {
      frame = 0
      sample()
      frame = performance.now() < until ? requestAnimationFrame(run) : 0
    }

    const trace = (label: string) => {
      t0 = performance.now()
      rows.length = 0
      last = ''
      const box = document.querySelector('.screen-viewport') as HTMLElement | null
      head =
        `${label}  screen ${window.screen.width}x${window.screen.height}` +
        `  dpr ${window.devicePixelRatio}` +
        `\n  vvh@focus ${Math.round(vv.height)}  hostH ${box ? Math.round(box.getBoundingClientRect().height) : -1}` +
        `\n   t  off  vvh   ih   ch  top   hh  sy`
      until = performance.now() + 2500
      if (!frame) frame = requestAnimationFrame(run)
    }

    const onFocus = (e: FocusEvent) => {
      const target = e.target
      if (target instanceof Element && target.matches('textarea, input')) trace('FOCUS')
    }
    const onBlur = () => trace('BLUR')

    window.addEventListener('focusin', onFocus)
    window.addEventListener('focusout', onBlur)

    /* Keep the readout on screen whatever the page does. */
    let follow = 0
    const stick = () => {
      follow = 0
      const el = holder.current
      if (el) el.style.setProperty('top', `${Math.round(vv.offsetTop)}px`)
      follow = requestAnimationFrame(stick)
    }
    follow = requestAnimationFrame(stick)

    trace('LOAD')

    return () => {
      window.removeEventListener('focusin', onFocus)
      window.removeEventListener('focusout', onBlur)
      if (frame) cancelAnimationFrame(frame)
      if (follow) cancelAnimationFrame(follow)
    }
  }, [])

  return (
    <pre
      ref={holder}
      hidden
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] m-0 bg-[rgba(0,0,0,0.82)] p-1 font-[family-name:var(--font-mono)] text-[9px] leading-[1.25] text-[#7fe08a] whitespace-pre"
    />
  )
}
