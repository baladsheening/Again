'use client'

import { useEffect, useRef } from 'react'

/**
 * ⚠ **TEMPORARY, AND DELIBERATELY ALWAYS ON.** A live readout of the numbers
 * behind the phone search bar's behaviour with a keyboard open. Delete this file
 * and its one use in `components/shell.tsx` the moment the numbers are in.
 *
 * **Unconditional, and that is the second time it has been decided.** The first
 * version was behind `?probe=1` and did not appear on the device it was built
 * for — the app was opened without the flag — which cost a whole round trip to a
 * handset. A flag that can be forgotten is a flag that will be. Ugly and
 * unmissable beats tidy and absent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why this exists at all (11 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Five attempts at this bar shipped on 10 August, each a different theory about
 * what iOS does with `position: fixed` and a keyboard, none of them measured
 * first, none of them right. What was missing every time was an instrument.
 *
 * The intended instrument was Safari's Web Inspector over USB. It needs a Mac;
 * this project is worked on from Windows against an iPhone, so there is no
 * console to read and the numbers have to be printed on the handset itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It holds the peaks, and that is the whole difference
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The old readout showed instantaneous values. Every question worth asking here
 * is about a *moment* — where the bar is while the keyboard is arriving, how far
 * out it gets three hundred pixels down — and a person holding the phone cannot
 * catch a number that is only true for one frame while their thumb is on the
 * screen.
 *
 * So the worst reading since the field was last focused stays on screen, with
 * the scroll offset it happened at. Tap the field, do the gesture, then read.
 * Focus resets it, so each attempt is one clean measurement.
 *
 * **It writes to the DOM rather than through state**, on a `requestAnimationFrame`
 * loop. A probe that re-rendered sixty times a second would be measuring a page
 * it was itself slowing down, and scrolling is the thing under investigation.
 * The ancestry walk below is the one expensive read, and it is throttled.
 */

/**
 * The properties that capture a `fixed` descendant, making it position against
 * that ancestor instead of the viewport.
 *
 * This is the check that the portals of `01ae9a5` were supposed to make
 * unnecessary — the docks now hang off `document.body`, so there should be
 * nothing between them and the root that could do this. Should be, hence the
 * check: if something in `body`'s own computed style is doing it, every theory
 * that assumes the portal fixed the ancestry is wrong from the first line.
 */
const CAPTURING = [
  'transform',
  'filter',
  'perspective',
  'backdropFilter',
  'contain',
  'willChange',
] as const

/** What each of those reads as when it is not set. */
const NEUTRAL = new Set(['none', 'auto', 'normal', ''])

function describe(el: HTMLElement) {
  return el.id ? `#${el.id}` : el.tagName.toLowerCase()
}

/**
 * The nearest ancestor that would capture a fixed child, or `—`.
 *
 * Walks to the root rather than stopping at the first interesting element,
 * because the answer wanted is "is there one at all", and the nearest is the one
 * that would be doing it.
 */
function capturingAncestor(el: HTMLElement) {
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent)
    for (const prop of CAPTURING) {
      const value = style[prop]
      if (typeof value === 'string' && !NEUTRAL.has(value)) {
        return `${describe(parent)}:${prop.slice(0, 4)}`
      }
    }
  }
  return '—'
}

/** How often to walk the ancestry, in frames. It cannot change mid-gesture. */
const ANCESTRY_EVERY = 30

type ProbeDock = {
  el: React.RefObject<HTMLElement | null>
  anchor: React.RefObject<HTMLElement | null>
  /** True on the phone's bar only — used here purely to name it in the readout. */
  dropsSafeArea?: boolean
}

type Peaks = {
  /** The signed error with the largest magnitude, and the offset it happened at. */
  err: number
  errAt: number
  scrollY: number
  docTop: number
  scrollTop: number
  /**
   * The furthest the *visible window* slid down the layout viewport.
   *
   * Added on the second attempt at the bump when tapping the field. `scrY` says
   * whether the document moved; this says whether what you can see moved. They
   * travelled together on 11 August, and if they have come apart — `scrY 0`
   * against a non-zero `vv.t` — then holding the document down cannot fix the
   * bump and every attempt to has been aimed at the wrong number.
   */
  vvTop: number
}

const NO_PEAKS: Peaks = {
  err: 0,
  errAt: 0,
  scrollY: 0,
  docTop: 0,
  scrollTop: 0,
  vvTop: 0,
}

export function ProbeReadout({
  focused,
  scroller,
  docks,
}: {
  focused: boolean
  scroller: React.RefObject<HTMLElement | null>
  docks: ProbeDock[]
}) {
  const out = useRef<HTMLPreElement>(null)
  /**
   * The probe's own zero-height `bottom-0` twin.
   *
   * It could have read one of the docks' anchors instead, but those wear their
   * dock's breakpoint — the rail's is `top-0 h-svh`, which is not the same edge —
   * so the probe would be measuring a different thing at different widths. It
   * needs one line it can trust at every width, both to hold itself on screen and
   * as an independent second reading of where an untouched fixed element lands.
   */
  const hold = useRef<HTMLDivElement>(null)
  const peaks = useRef<Peaks>(NO_PEAKS)

  /*
    One focus, one measurement. Without this the peaks accumulate across every
    attempt of the afternoon and the worst reading is from a gesture nobody
    remembers making.
  */
  useEffect(() => {
    peaks.current = { ...NO_PEAKS }
  }, [focused])

  useEffect(() => {
    let frame = 0
    let count = 0
    let ancestry = '—'
    let parentage = '—'

    const tick = () => {
      const el = out.current
      const vv = window.visualViewport

      if (el && vv) {
        const shown = docks.find((d) => (d.el.current?.getClientRects().length ?? 0) > 0)
        const dock = shown?.el.current ?? null

        if (dock && count % ANCESTRY_EVERY === 0) {
          ancestry = capturingAncestor(dock)
          parentage = dock.parentElement ? describe(dock.parentElement) : '—'
        }
        count += 1

        const holdBottom = hold.current?.getBoundingClientRect().bottom
        const anchorBottom = shown?.anchor.current?.getBoundingClientRect().bottom
        const dockBottom = dock?.getBoundingClientRect().bottom

        const scrollY = window.scrollY
        const docTop = document.scrollingElement?.scrollTop ?? 0
        const scrollTop = scroller.current?.scrollTop ?? 0

        /* Where the bottom edge of the visible area is — what the pin aims at. */
        const target = vv.offsetTop + vv.height
        /* What the pin should be applying, read off the untransformed twin. */
        const offset = anchorBottom === undefined ? undefined : target - anchorBottom
        /* What is left over after it applied it. Zero is correct. */
        const error = dockBottom === undefined ? undefined : target - dockBottom

        const p = peaks.current
        if (error !== undefined && Math.abs(error) > Math.abs(p.err)) {
          p.err = error
          p.errAt = scrollTop
        }
        if (Math.abs(scrollY) > Math.abs(p.scrollY)) p.scrollY = scrollY
        if (Math.abs(docTop) > Math.abs(p.docTop)) p.docTop = docTop
        if (scrollTop > p.scrollTop) p.scrollTop = scrollTop
        if (Math.abs(vv.offsetTop) > Math.abs(p.vvTop)) p.vvTop = vv.offsetTop

        /*
          Hold itself on screen, or it is useless exactly when it is needed.

          This is `fixed`, and iOS may stop honouring that while the keyboard is
          open — which is the thing being investigated, so the probe cannot
          assume its own position any more than the bar's. However far the twin
          has strayed from `clientHeight` is the drift; the same amount put back,
          plus the visual viewport's own offset, holds this against the top of
          what can actually be seen.
        */
        if (holdBottom !== undefined) {
          const drift = holdBottom - document.documentElement.clientHeight
          el.style.transform = `translateY(${vv.offsetTop - drift}px)`
        }

        const n = (v: number | undefined) =>
          v === undefined ? '    —' : String(Math.round(v)).padStart(5)

        el.textContent = [
          `dock ${(shown ? (shown.dropsSafeArea ? 'bar' : 'rail') : 'none').padEnd(5)}par ${parentage}`,
          `capt ${ancestry}`,
          `kbd  ${focused ? 'focused' : 'closed'}`,
          '',
          // Must be zero. If it is not, `fixed` is not being honoured and every
          // fix since 10 August rests on a false premise.
          `scrY ${n(scrollY)} docT ${n(docTop)}`,
          `sTop ${n(scrollTop)} hold ${n(holdBottom)}`,
          `inn  ${n(window.innerHeight)} cli  ${n(document.documentElement.clientHeight)}`,
          `vv.h ${n(vv.height)} vv.t ${n(vv.offsetTop)}`,
          `anch ${n(anchorBottom)} bar  ${n(dockBottom)}`,
          `TGT  ${n(target)} OFF  ${n(offset)}`,
          `ERR  ${n(error)}`,
          '',
          '--- worst since focus ---',
          `ERR  ${n(p.err)} @    ${n(p.errAt)}`,
          `scrY ${n(p.scrollY)} docT ${n(p.docTop)}`,
          `sTop ${n(p.scrollTop)} vv.t ${n(p.vvTop)}`,
        ].join('\n')
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [docks, scroller, focused])

  return (
    <>
      <div ref={hold} aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-0" />
      <pre
        ref={out}
        aria-hidden
        /*
          Top-left, and no wider than its longest line — about 145px, so the
          right two-thirds of a 375px handset still shows the wall. That matters
          for this particular investigation: one of the three symptoms is that
          the first row of results is not in view, and a probe covering the top
          of the screen would hide the evidence.

          It sits over the wordmark rather than over the two header glyphs, which
          are the only things up there anyone taps. `pointer-events-none` means it
          could not swallow the tap anyway; this is so they can still be seen.

          Yellow on black survives a photograph taken at arm's length.

          **The notch inset is an arbitrary class, not an inline style.** A style
          *attribute* cannot carry a nonce, so the CSP drops it in production and
          nowhere else — which the previous version of this probe had, and which
          would have parked the readout under the status bar on the one build
          that mattered. The `transform` written by the loop above is CSSOM
          rather than an attribute, and is not affected.
        */
        className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)_+_4px)] left-1 z-50 w-fit bg-black/90 px-1.5 py-1 font-mono text-[11px] leading-[1.35] whitespace-pre text-yellow-300 tabular-nums"
      />
    </>
  )
}
