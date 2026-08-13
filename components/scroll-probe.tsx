'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

/**
 * ⚠ **TEMPORARY INSTRUMENT — delete this file and its three uses in
 * `components/shell.tsx` once the number below is known.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The one question this exists to answer (13 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Safari collapses its address bar in response to the *document* scrolling, and
 * this app's document cannot scroll: the page lives in `#scroll-root`, which is
 * `fixed inset-0`, behind an `overflow: hidden` lock in `app/globals.css`.
 * Measured in Chromium on 13 August, at phone width:
 *
 * | state                                  | document scroll range |
 * |----------------------------------------|-----------------------|
 * | as shipped                             |    0px                |
 * | the lock lifted, and nothing else      |    0px                |
 * | the lock lifted *and* `#scroll-root` un-pinned | 1229px        |
 *
 * So the lock is not the whole cost and removing it alone changes nothing —
 * scroll ownership has to move back to the document. The question that decides
 * whether that is safe cannot be asked in Chromium, which honours
 * `interactive-widget: resizes-content` and therefore never reproduces the
 * fault. It has to be asked here, on the handset:
 *
 * **With the document unlocked, does iOS still invent scroll range to reveal the
 * focused search field?**
 *
 * On 11 August it invented 271px in a tab and 333px standalone, and dragged
 * every `position: fixed` element in the app up with it — the header scrolled
 * off the top of a screen it was pinned to. That is the fault the lock exists
 * to prevent. Since then the fix changed shape: the dock now lifts itself clear
 * at `pointerdown`, *before* iOS decides whether it needs to reveal anything.
 * The lock has been in place for every minute of that fix's life, so nobody has
 * ever seen whether it is still load-bearing or defending against a ghost.
 *
 * **Read `scrY` under "worst since focus".** Zero across several attempts means
 * the pointerdown lift already prevents the reveal, the lock is dead weight, and
 * handing scrolling back to the document is a mechanical change. Anything near
 * 271 or 333 means the lock is still the only thing holding that fault down, and
 * the address bar is not worth what buying it back would cost.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why the readout is unconditional and the unlock is not
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `13cbd86` learned this the expensive way: its first probe was behind
 * `?probe=1`, the app was opened without the flag, and a whole round trip to a
 * handset was wasted. **A flag that can be forgotten is a flag that will be** —
 * so the numbers are always on screen, ugly and unmissable.
 *
 * The *unlock* is the opposite case. It un-pins the app's entire scroll
 * container, so it must not be what the app does by default while the question
 * is open. It is behind a button rather than a query string because the app is
 * used installed, where there is no address bar to type one into — which is the
 * same fact that motivates the whole investigation. The choice is kept in
 * `localStorage` so it survives navigation and relaunch; one tap arms it, one
 * tap puts it back.
 *
 * ⚠ **Everything here writes through CSSOM (`el.style.setProperty`), never a
 * style attribute.** A style attribute cannot carry a nonce, so the production
 * CSP drops it — silently, and only on the one build that matters. The same trap
 * is documented on the probe of `13cbd86`.
 */

const STORAGE_KEY = 'again:probe:unlock'

/**
 * The document lock, and the pinning that makes it moot, both lifted together.
 *
 * The three properties on `html`/`body` are the lock in `app/globals.css`; the
 * three on `#scroll-root` are what actually gives the document something to
 * scroll. Chromium says the first three alone do nothing at all, so they are
 * applied as one thing rather than offered as two.
 *
 * ⚠ **`min-height`, not `height`, and set from JS rather than a stylesheet.**
 * Both halves of that are scars: a stylesheet rule for the document's height was
 * measured doing nothing on 11 August while the identical declaration set from
 * JS worked. Re-measure `scrollHeight − clientHeight` rather than trusting any
 * of it — which is what `rnge` in the readout is for.
 */
function applyUnlock(on: boolean) {
  const root = document.getElementById('scroll-root')
  const set = (el: HTMLElement | null, prop: string, value: string) => {
    if (!el) return
    if (on) el.style.setProperty(prop, value, 'important')
    else el.style.removeProperty(prop)
  }

  for (const el of [document.documentElement, document.body]) {
    set(el, 'overflow', 'visible')
    set(el, 'height', 'auto')
    set(el, 'min-height', '100%')
  }
  set(document.body, 'position', 'static')

  set(root, 'position', 'static')
  set(root, 'overflow', 'visible')
  set(root, 'height', 'auto')
}

/**
 * `localStorage` is an external store, so it is read as one.
 *
 * The obvious shape — `useState(false)` plus an effect that reads storage and
 * sets it — is a cascading render, and the lint rule says so. `useSyncExternalStore`
 * is the tool for exactly this: a value that lives outside React, differs
 * between server and client, and must not be read during render.
 *
 * `getServerSnapshot` returns `false` so the markup rendered on the server is
 * the locked app, which is also what an unarmed client renders. Arming is a
 * client event, after hydration, every time.
 */
const storeListeners = new Set<() => void>()

function subscribeToFlag(onChange: () => void) {
  storeListeners.add(onChange)
  /* Another tab of the same site counts as a change. */
  window.addEventListener('storage', onChange)
  return () => {
    storeListeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function readFlag() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    /* Private mode, or storage disabled. Treated as unarmed. */
    return false
  }
}

/** The app as shipped, which is what the server renders and an unarmed client agrees with. */
function readFlagOnServer() {
  return false
}

export function useUnlockFlag() {
  const unlocked = useSyncExternalStore(subscribeToFlag, readFlag, readFlagOnServer)

  useEffect(() => {
    applyUnlock(unlocked)
    return () => applyUnlock(false)
  }, [unlocked])

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, readFlag() ? '0' : '1')
    } catch {
      /* Nothing to persist and nothing to toggle; the button is inert here. */
    }
    for (const listener of storeListeners) listener()
  }, [])

  return { unlocked, toggle }
}

type Peaks = {
  /** The furthest the document was scrolled. **This is the answer.** */
  scrollY: number
  docTop: number
  /** How far the visible window slid down the layout viewport. */
  vvTop: number
  /** Frames on which the document was found off zero — a blip against a state. */
  hits: number
}

const NO_PEAKS: Peaks = { scrollY: 0, docTop: 0, vvTop: 0, hits: 0 }

export function ScrollProbe({
  focused,
  unlocked,
  onToggle,
  scroller,
}: {
  focused: boolean
  unlocked: boolean
  onToggle: () => void
  scroller: React.RefObject<HTMLElement | null>
}) {
  const out = useRef<HTMLPreElement>(null)
  const peaks = useRef<Peaks>(NO_PEAKS)

  /*
    One focus, one measurement — the lesson of the 11 August probe. Without it
    the peaks accumulate across every attempt of the afternoon and the worst
    reading belongs to a gesture nobody remembers making. Arming or disarming
    the unlock resets them too, for the same reason.
  */
  useEffect(() => {
    peaks.current = { ...NO_PEAKS }
  }, [focused, unlocked])

  useEffect(() => {
    let frame = 0

    const tick = () => {
      const el = out.current
      const vv = window.visualViewport

      if (el && vv) {
        const de = document.documentElement
        const scrollY = window.scrollY
        const docTop = document.scrollingElement?.scrollTop ?? 0
        const range = de.scrollHeight - de.clientHeight

        const p = peaks.current
        if (Math.abs(scrollY) > Math.abs(p.scrollY)) p.scrollY = scrollY
        if (Math.abs(docTop) > Math.abs(p.docTop)) p.docTop = docTop
        if (Math.abs(vv.offsetTop) > Math.abs(p.vvTop)) p.vvTop = vv.offsetTop
        if (scrollY !== 0) p.hits += 1

        const n = (v: number | undefined) =>
          v === undefined ? '    —' : String(Math.round(v)).padStart(5)

        el.textContent = [
          `lock ${unlocked ? 'OFF (unlocked)' : 'ON  (as shipped)'}`,
          `kbd  ${focused ? 'focused' : 'closed'}`,
          '',
          /* Is there anything for Safari's toolbar to respond to at all? */
          `rnge ${n(range)}`,
          `scrY ${n(scrollY)} docT ${n(docTop)}`,
          `sTop ${n(scroller.current?.scrollTop)}`,
          `vv.h ${n(vv.height)} vv.t ${n(vv.offsetTop)}`,
          `inn  ${n(window.innerHeight)} cli  ${n(de.clientHeight)}`,
          '',
          '--- worst since focus ---',
          /*
            271 in a tab, 333 standalone, on 11 August. Zero across several
            attempts with the lock OFF is what says the lift already prevents it.
          */
          `scrY ${n(p.scrollY)} hits ${n(p.hits)}`,
          `docT ${n(p.docTop)} vv.t ${n(p.vvTop)}`,
        ].join('\n')
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [focused, unlocked, scroller])

  return (
    <div
      /*
        Top-left, narrow enough to leave the right of a 375px handset showing the
        wall — the address bar's behaviour is half of what is being watched here,
        and a readout across the top would hide it.

        Portalled to `document.body` by the caller, so `inThePage` in `Shell`
        reports false for taps in here and the tap-outside-dismiss rule leaves
        the button alone. That containment is asked of the DOM precisely because
        React would answer it the other way — see the note on that handler.
      */
      className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)_+_4px)] left-1 z-50 flex w-fit flex-col items-start gap-1"
    >
      <pre
        ref={out}
        aria-hidden
        /* Yellow on black survives a photograph taken at arm's length. */
        className="bg-black/90 px-1.5 py-1 font-mono text-[11px] leading-[1.35] whitespace-pre text-yellow-300 tabular-nums"
      />
      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto rounded border border-yellow-300 bg-black/90 px-2 py-1 font-mono text-[11px] text-yellow-300"
      >
        {unlocked ? 'relock document' : 'unlock document'}
      </button>
    </div>
  )
}
