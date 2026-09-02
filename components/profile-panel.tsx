'use client'

import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

/**
 * `/profile`: your handle, and the way out — **as two pieces at opposite ends of
 * the document, not as a bar.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  There is no profile foot — 2 September, redesigned from first principles
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **THE FIXED BOTTOM BAR IS DELETED, AND THE ANSWER TO *redesign it* WAS
 * THAT IT SHOULD NOT EXIST.** It had been redesigned twice in two days — the
 * handle put beside the pill, then the pair spread to opposite gutters and the
 * ground taken to glass — and each pass improved a bar whose premise nobody had
 * checked. Checked, it fails on the app's own law.
 *
 * ⚠ **§2 of the brief: *the bottom edge is for what you do without looking, the
 * top edge is for what you go to on purpose*.** Signing out is the most
 * deliberate act in the product. It is never a reflex, it is done once in
 * months, and it throws away the session. **A control like that on the reflex
 * edge is the law broken** — and it was broken here without ever being
 * directed, unlike the portal's `+`-adjacent door in `foot.tsx`, which was
 * ordered with the cost stated and is flagged there as *not a precedent*.
 *
 * ⚠ **The handle was chrome and it is the page's SUBJECT.** Pinning it to a
 * corner forced the page's real `<h1>` to be `sr-only`: a fixed block cannot
 * come first in the document, so the outline read *h2 before h1* unless a hidden
 * heading was added above both. **That hidden heading was a workaround for this
 * component's position**, and it is deleted with it — the handle is the heading
 * now, so there is nothing to work around.
 *
 * ⚠ **The reason it was pinned is spent.** The note said: *before that it sat
 * wherever the content happened to end, so the foot of the screen jumped every
 * time you opened your own profile.* That jump was against the collections bar,
 * which Phase 1 deleted. Nothing is pinned to the bottom of this route now, so
 * there is nothing for a foot to jump against.
 *
 * **What the screen says, in order: who you are, who you keep, the way out.**
 * The bottom edge is empty, and that is correct rather than unfinished — this
 * screen has no reflex actions, so by §2 it is owed no bottom bar.
 *
 * ⚠ **`--collections-inset` and `--collections-row` are deleted with it.** Their
 * last reader was that bar's `py`; the collections bar they were measured for
 * went in Phase 1. Same rule that took `--profile-foot` and Jost: a token
 * nobody reads is a number the next person keeps a layout in step with for no
 * reason.
 *
 * This is where `/settings` will grow — `docs/plan.md` lists three things
 * waiting on it (TMDB attribution, the iOS install note, and changing a
 * password you *do* know). None of them is built, and none was asked for. **When
 * it is, it goes between the People list and the way out**, which is the order
 * this composition already states.
 */

/**
 * **The page's heading, and it is the handle itself.**
 *
 * ⚠ **Not a label, and not the display name.** A visible *Profile* would be a
 * third thing naming what the tapped glyph already named — the argument the old
 * `sr-only` heading was written on, which survives its deletion. And the display
 * name went on 17 August because nobody needs telling their own name; **the
 * handle is different, because it has a use**: it is the string you read out to
 * somebody so they can track you, and there is no directory, so this is the one
 * place it can be got.
 *
 * That is also why it is bigger here than it was in the bar. It used to be
 * `text-sm` furniture in a corner; a string that exists to be read aloud and
 * typed by somebody else should be the largest thing on the screen that is not
 * the mark.
 *
 * ⚠ **One line of air under it, against the two the way out gets above it.**
 * The card belongs to the heading and the sign-out does not, and that is the
 * whole of the hierarchy on this screen — stated in `--leading-line`, the unit
 * everything else on this ground is separated by, rather than in two spacing
 * scales that would have to be kept in proportion.
 *
 * Sans, not mono: a displayed handle is a name, not data (§11).
 */
export function ProfileIdentity({ handle }: { handle: string }) {
  return (
    <h1 className="title text-text mb-[var(--leading-line)]">@{handle}</h1>
  )
}

/**
 * **The way out, at the end of the flow.**
 *
 * ⚠ **It is the ONLY place `signOut` is called, at every width — 31 August.**
 * This file used to say it existed because the phone header had no room for a
 * handle and a *Sign out* button, and that above `rail` the rail carried both.
 * **Phase 1 deleted the rail** (`components/shell.tsx`, gone), and for a
 * fortnight this block was still hidden above 720px — so there was no way to
 * sign out on a desktop at all. Reported and fixed; a `rail:hidden` was deleted
 * and nothing was added, because *the condition went, so the correction had to
 * go with it*.
 *
 * ⚠ **Last in the document, which is the whole of its placement.** Reached by
 * arriving at the end of the screen rather than by a thumb resting on the bottom
 * edge — see the account above of why this is not a bar. It keeps the muted ink
 * and comes up to full only under a cursor, so it is findable without being
 * inviting.
 *
 * ⚠⚠ **`mt-auto` ON A WRAPPER, SO IT SITS AT THE END OF THE COLUMN AND NOT
 * WHEREVER THE CONTENT RAN OUT — 2 September.** Reported: with an empty People
 * card it stranded a third of the way down the screen. **That is not the pinned
 * bar coming back.** The bar was `position: fixed`: it occupied the bottom edge
 * permanently, on every scroll position, which is what §2 forbids. This is in
 * flow and last in the document — it reaches the bottom only while the page is
 * short enough to have spare column, and a long People list pushes it off the
 * screen like any other content.
 *
 * ⚠ **The auto margin and the minimum gap are on DIFFERENT elements, and they
 * have to be.** They are both `margin-top`, and two classes setting one property
 * are resolved by their order in the compiled sheet — the trap `--bar-gutter` is
 * a token to avoid and `--sheet-row-lead` is two properties to avoid. The
 * wrapper takes the `auto`; the gap is the wrapper's `padding-top`, so on a page
 * with no spare column the two lines still separate it.
 *
 * ⚠ **The gap is two lines of the record, derived rather than picked.**
 * `--leading-line` is the app's unit of separation everywhere else on this
 * screen's ground, and two of them say *this is not part of what is above it*
 * without a rule, which §11 does not allow anyway.
 *
 * The pill's fill is the People card's own `bg-surface/40`, and its 10px corners
 * are read against a box this short — the card's 16 would close the ends into a
 * lozenge. ⚠ Neither fill has been seen on OLED, where a 1.09:1 ground may come
 * to nothing at all; if it does, the ladder is in globals.css and both should
 * move together rather than this one alone.
 */
export function SignOut() {
  const router = useRouter()

  return (
    <div className="mt-auto pt-[calc(var(--leading-line)*2)]">
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut()
          router.push('/sign-in')
          router.refresh()
        }}
        className="text-muted hover:text-text bg-surface/40 hover:bg-surface/60 micro tap-target cursor-pointer rounded-[10px] px-4 py-2 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
