'use client'

import { useEffect, useState } from 'react'

/**
 * **What is pointing at the screen, and whether there is room to stand beside
 * the wall.**
 *
 * ⚠ **These lived in `film-screen.tsx` and moved out on 25 August**, when the
 * capture page needed the same answer. Two components asking the same question
 * must not each own the asking — the same rule that gave `keyboard-hem.ts` its
 * own file. Nothing about them changed in the move.
 */

export function paneQuery(): MediaQueryList {
  const width = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-pane')
    .trim()
  return window.matchMedia(`(min-width: ${width})`)
}

/**
 * ⚠ **A hand, not a width — directed 18 August.** Everything built for the phone
 * was arriving in a maximally narrowed desk window, because a narrow window and a
 * phone were the same thing to `film-screen.tsx`. They are not: **a poster you
 * push out of the way with your thumb is a different object from one you click
 * past with a cursor**, and the glass, the chevron and the full-screen picture
 * were all asked for as the first.
 *
 * ⚠ **`(pointer: coarse)` is a capability, not a device.** CLAUDE.md rules out
 * branches that sniff for a browser, and this is the opposite of that: it asks
 * what the person is pointing with, which is the thing the design actually
 * depends on. Two other places in the app already ask it — the sign-in page's
 * optical padding and the entry rows' spacing.
 *
 * ⚠ **It stays testable.** A browser can be told it has a coarse pointer
 * (`hasTouch: true, isMobile: true` in Playwright), so the touch layout is still
 * driven and measured here rather than only on glass. What it can no longer do is
 * appear by accident when a window is dragged narrow.
 *
 * ⚠ **An iPad with a trackpad reports fine, and a touchscreen laptop reports
 * coarse.** Neither is wrong for this question — both get the layout that suits
 * what is in their hand — but it does mean the answer is not "phone".
 */
export function touchQuery(): MediaQueryList {
  return window.matchMedia('(pointer: coarse)')
}

/**
 * One subscription, one question. `build` must be a module-level function so
 * the effect's dependency is stable; passing an inline arrow would resubscribe
 * on every render.
 *
 * ⚠ **It answers `false` on the server and corrects on mount**, which is the
 * only honest thing it can do: there is no pointer to ask about until there is
 * a browser. Anything reading it must be right while the answer is still
 * `false` — a layout that only looks correct after the correction is a flash on
 * every load.
 */
export function useMatches(build: () => MediaQueryList): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : build().matches,
  )

  useEffect(() => {
    const query = build()
    const onChange = () => setMatches(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [build])

  return matches
}
