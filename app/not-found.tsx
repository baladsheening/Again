import Link from 'next/link'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NOTHING HERE — the 404, 1 September
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠ **Until now this screen was Next's default: a WHITE page in `system-ui`.**
 * Found by `node_modules/.probe/allscreens.mjs`, which swept every route and
 * caught `/u/<unknown-handle>` rendering `next-error-h1` on `rgb(255,255,255)`.
 * On an app whose ground is black paper it was the least consistent surface in
 * the product — and the one a stranger reaches by mistyping a handle, which is
 * the *only* way to reach a person here.
 *
 * ⚠ **This file catches BOTH cases, which is why there is no
 * `global-not-found.tsx`.** Next's docs say the root `not-found` handles
 * `notFound()` thrown in a segment *and* every unmatched URL in the app. The
 * experimental `global-not-found` exists for apps with multiple root layouts or
 * a top-level dynamic segment; this app has one root layout and neither. **Do
 * not add it** — it bypasses the layout, so it would need its own copy of the
 * fonts, the stylesheet and the paper, which is three things to keep in step
 * for a page nobody should see twice.
 *
 * ⚠ **The paper is inherited and is NOT mounted here.** `not-found` renders
 * inside `app/layout.tsx`, whose single `grain-ground` sits at `z-index: -1`
 * under everything. A second mount would be a second full-bleed photograph.
 *
 * ⚠ **It reads no session, deliberately.** A signed-in/signed-out branch would
 * make the one link nicer and would make this route dynamic — cookies in a
 * `not-found` force it out of the static shell for every unmatched URL in the
 * app. `/` already redirects to the wall when there is no session, so one link
 * is honest in both states and the screen stays static.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The composition is the sign-in wall's, at one third the scale**: the serif
 * command, a typewriter label, one sentence, and the serif-underlined control
 * that `SignInForm`'s submit established. It is the *zine* treatment, which §11
 * permits here for the reason it permits it there — this is composition, not
 * record. One dominant element, no list, no state to show.
 *
 * ⚠ **4rem, against the wall's 6.5.** The wall's command is the product's name
 * and the first thing an account ever sees; this is an apology. Setting them at
 * the same size would make a wrong address as loud as the front door.
 */
export default function NotFound() {
  return (
    <main className="gutter safe-bottom relative z-[1] mx-auto flex w-full max-w-sm flex-1 flex-col pt-[calc(3rem+env(safe-area-inset-bottom))] [--safe-bottom-base:3rem] stack:max-w-[34rem]">
      {/*
        `my-auto` rather than `justify-center`, for the reason the wall states:
        auto margins collapse to zero with no free space, so a viewport too short
        for the content degrades to top-aligned and stays scrollable, where
        centred flex content would overflow in both directions with its top above
        the scroll origin.
      */}
      <div className="my-auto flex flex-col gap-9">
        {/*
          ⚠ **Sentence case in the markup, capitals in the CSS** — `zine-command`
          carries `text-transform`, so a screen reader is handed a sentence
          rather than something it may spell out. The rule the first run states,
          applied again.
        */}
        <h1 className="zine-command text-[4rem] stack:text-[5.5rem]">Nothing here.</h1>

        <div>
          <p className="zine-beat text-muted mb-2">missing</p>
          <p className="text-sm">
            This address does not exist. If you were looking for a person, check the
            handle — from here, one nobody has taken and one that is mistyped look
            exactly the same.
          </p>
        </div>

        {/*
          ⚠ **A `Link`, wearing the submit's clothes.** The wall's control is the
          serif underlined — a word rather than a box — and that is the one
          control vocabulary these composition screens have. `normal-case`
          because `zine-command` uppercases, and a lowercase way home reads as an
          aside rather than as a second shout after the command above it.

          `tap-target` because the underline is thin: the drawn control is a word
          and the hit area is a thumb's, which is the rule the whole app is built
          on and the reason `--tap-floor` never scales.
        */}
        <Link
          href="/"
          className="zine-command border-text hover:text-muted hover:border-muted tap-target mt-2 self-start border-b-[1.5px] pb-1 text-[1.875rem] normal-case transition-colors"
        >
          keep.
        </Link>
      </div>
    </main>
  )
}
