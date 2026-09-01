'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SOMETHING BROKE — the error boundary, 1 September
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The second half of the 404's job. `not-found.tsx` answers *this address does
 * not exist*; this answers *this address exists and failed*, which until now was
 * Next's unstyled white default on every route in the app.
 *
 * ⚠ **The case for it is narrower than the 404's, and it is worth knowing why.**
 * §10 routes *expected* failures through typed `Result` returns from `lib/db/`
 * rather than thrown exceptions, so nothing that is merely absent, unauthorised
 * or empty reaches here. **What reaches here is a bug**, and a bug is something
 * to notice rather than to retry.
 *
 * ⚠⚠ **WHICH IS WHY THIS SCREEN STATES A FAULT AND DOES NOT SHRUG.** The
 * temptation with an error boundary is a friendly *something went wrong, try
 * again*, and that is actively harmful here: it makes a broken app look merely
 * inconvenient and it trains a reader to press a button instead of reporting it.
 * **The precedent is real** — on 25 August every signed-in request was a 500 for
 * roughly eighteen hours, and part of why it ran that long is that nothing was
 * screaming. Retry is offered *after* the fault is named, not instead of it.
 *
 * ⚠ **The captures are safe and the screen says so, because that is the actual
 * question a person has.** Nothing on this path writes: a render failure loses a
 * *screen*, never a line. The record is on the server and the failure is on the
 * way to reading it.
 *
 * ⚠⚠ **`retry`, NOT `reset` — and this is a real difference in Next 16.3.0.**
 * `retry()` re-fetches *and* re-renders the boundary's children; `reset()` only
 * clears the error state and re-renders, without re-fetching. **Everything that
 * plausibly lands on this screen is a SERVER failure**, which a re-render alone
 * would reproduce instantly. The docs say to prefer `retry` in most cases; here
 * it is the only one of the two that can work. `retry` became the stable prop in
 * this exact version — check `node_modules/next/dist/docs` before changing it.
 *
 * ⚠ **`app/error.tsx` and deliberately no `global-error.tsx`.** This file wraps
 * every page, loading, not-found and nested layout below the root — one file,
 * whole app. `global-error` covers the *root layout itself* throwing, and to do
 * that it replaces the layout, so it must render its own `<html>` and `<body>`
 * and carry its own copy of the fonts, the stylesheet and the paper. That is
 * three things to keep in step — the same argument that ruled out
 * `global-not-found` — to cover a layout that is static markup and font
 * declarations. **And if that layout is broken, the duplicated copy of its
 * dependencies probably is too.**
 *
 * The composition is `not-found.tsx`'s, which is the sign-in wall's at a third
 * the scale. The two screens are the same kind of screen and must not drift.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  /*
    ⚠ **The console is the only reporting there is, and that is stated rather
    than assumed.** There is no error service wired up. In production a Server
    Component's message is replaced by a generic one and the `digest` is the only
    handle that matches a server log — which is exactly why it is printed here
    *and* drawn on the screen below.
  */
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="gutter safe-bottom relative z-[1] mx-auto flex w-full max-w-sm flex-1 flex-col pt-[calc(3rem+env(safe-area-inset-bottom))] [--safe-bottom-base:3rem] stack:max-w-[34rem]">
      {/* `my-auto` rather than `justify-center` — see not-found.tsx. */}
      <div className="my-auto flex flex-col gap-9">
        {/* Sentence case in the markup, capitals in the CSS — `zine-command`
            carries the transform, so a reader is handed a sentence. */}
        <h1 className="zine-command text-[4rem] stack:text-[5.5rem]">Something broke.</h1>

        <div>
          <p className="zine-beat text-muted mb-2">fault</p>
          <p className="text-sm">
            This is a bug in Keep, not something you did. Nothing was lost — a failure
            here costs a screen, never a line, and your captures are on the server where
            you left them.
          </p>
        </div>

        {/*
          ⚠ **The digest is drawn, not just logged.** In production the message
          of a Server Component error is replaced by a generic one specifically
          so it cannot leak; the digest is the hash that matches the server log,
          and it is the one piece of this screen worth reading out. Mono, because
          §11 keeps mono for the things that are *data* rather than prose — and
          `select-all` so it can be copied in one gesture on a handset.

          It is conditional because a Client Component error carries no digest,
          and an empty label is furniture with nothing in it.
        */}
        {error.digest ? (
          <div>
            <p className="zine-beat text-muted mb-2">reference</p>
            <p className="text-muted font-mono text-xs select-all">{error.digest}</p>
          </div>
        ) : null}

        {/*
          Two ways out, in this order deliberately. Trying again is first because
          it is the only one that can actually resolve a transient failure, but
          it is drawn as a *word* rather than as a filled button, so it reads as
          an option rather than as an instruction to keep pressing.

          `tap-target` on both: the drawn control is a word and the hit area is a
          thumb's — the rule the whole app is built on.
        */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-4">
          <button
            type="button"
            onClick={() => retry()}
            className="zine-command border-text hover:text-muted hover:border-muted tap-target self-start border-b-[1.5px] pb-1 text-[1.875rem] normal-case transition-colors"
          >
            try again
          </button>
          <Link
            href="/"
            className="zine-beat text-muted hover:text-text tap-target self-start transition-colors"
          >
            keep.
          </Link>
        </div>
      </div>
    </main>
  )
}
