import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/sign-in-form'
import { WallBeats } from '@/components/wall-beats'
import { getSessionUser } from '@/lib/db'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The sign-in wall, in the zine treatment — 31 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed, and drawn first: a grainy darkroom ground, the mark oversized in a
 * high-contrast serif, three typewriter-labelled beats explaining the product,
 * and a form made of rules rather than boxes. See the zine block at the foot of
 * `app/globals.css` for why the treatment is spent on this screen and the empty
 * first run, and reaches the record on no account.
 *
 * ⚠⚠ **THIS SCREEN IS THE ONLY PLACE THE PRODUCT IS EXPLAINED BEFORE A PERSON
 * COMMITS, AND ONE OF THE THREE BEATS IS A DISCLOSURE.** *match* says plainly
 * that what you write is compared against the people you follow — which since
 * 31 August is true of every capture on write, `SHARED_SCOPES` by default. A
 * new account that reached the record without passing this sentence would be
 * writing into a pool it had not been told about. **Do not quietly drop a beat
 * to shorten the page.**
 *
 * ⚠ **What was deleted here, and why it is deletion rather than breakage.** The
 * old wall carried two measured optical corrections — `pointer-coarse:pb-[10px]`
 * and `pointer-fine:pb-[20px]` — which centred the *field pair* inside a block
 * that was not symmetric about it, and a
 * `gap-[calc(14px_-_var(--wordmark-slack))]` that held 14px of visible air under
 * a Jost mark whose ink stops short of its box. **Both answered conditions this
 * layout no longer has**: nothing is optically centred on the fields any more —
 * the composition is top-down, mark first — and the mark is not `wordmark`, so
 * `--wordmark-slack` measures a face this screen does not set. Removing the
 * mechanism rather than re-deriving it, in the order *How things get fixed*
 * asks for. The numbers survive in git with their workings.
 *
 * ⚠ **The two-line tagline is gone with them** — *things to try. things to try
 * again.* / *the things i want. the things i'd buy again.* It said what the app
 * felt like and never what it did, and the note asking this wall to explain the
 * app's usefulness is what the three beats answer. ⚠ **The first line survives
 * as `metadata.description` in `app/layout.tsx`**, which is where a search
 * result or a link preview reads it; the note there says the two were one
 * string, and now there is one string in one place.
 *
 * ⚠ **The mark is `Keep.` — the rename landed 31 August**, and the fence at the
 * top of globals.css was re-measured with it: KEEP is a different word, so the
 * advance, the trim and the inked bounds all moved even though the face did not.
 * See `node_modules/.probe/keepmark.mjs`.
 *
 * ⚠ **The two-face inconsistency IS CLOSED — 1 September.** This note used to
 * say the bar set the mark in Jost while this screen set it in `--font-serif`,
 * that a person never saw both at once, and that unifying them was the next job.
 * It was directed the next day and it is done: `--font-display` resolves to
 * Instrument Serif, so the mark is one face everywhere it appears. Splitting the
 * rename from the face swap is what let the record column's two moves be told
 * apart — 2.6592 was the rename's, 2.176 is this one's.
 *
 * ⚠ **The two screens still differ in CASE, and that is not an oversight.** This
 * one sets `Keep.` at 6.5rem with a full stop, in `zine-command`; the bar sets
 * `KEEP` in caps through `wordmark`, whose fence is measured for capitals. The
 * poster is a sentence and the bar is a mark. **Making them agree would move
 * every vertical number in the fence** — `serifmark.mjs` reads drop 0.205 and
 * slack −0.045 for `Keep` against 0 and 0.16 for `KEEP` — so it is a measured
 * job and not a string edit.
 */
export default async function SignInPage() {
  if (await getSessionUser()) redirect('/')

  return (
    <>
      {/*
        ⚠ **THE PAPER'S MOUNT MOVED TO `app/layout.tsx` — 1 September, directed:
        put it on all the screens.** This screen had one of the app's two, and
        the other was on the record's *empty* state, which meant a person with a
        real record never saw it. There is one mount now, for every route, and
        deleting it from here is what stops the wall carrying two.

        ⚠ **There is no second, `multiply` layer over the type, and there was for
        an hour.** See the `grain-ink` tombstone in globals.css: a blend mode
        inside its own stacking context has a transparent backdrop, so it drew
        itself as a grey rectangle with the exact bounds of the block it was
        meant to be invisible over. The tooth is the ground layer's job alone.
      */}

      {/*
        ⚠ **`relative z-[1]` is what keeps the content above the grain**, which
        is `z-index: 0` on a fixed layer. Without a stacking context of its own
        the column would sit *under* the speckle rather than in front of it, and
        `screen` over type reads as fog rather than as tooth.

        The top padding still carries the *bottom* safe-area inset, and it is
        still not a typo: `safe-bottom` adds that inset below for clearance, and
        mirroring it on top keeps whatever this centres symmetric on a device
        with a home indicator.

        Below the desk it is one column at `max-w-sm`, mark first. At and above
        `--breakpoint-stack` it becomes the drawn two-column spread — the mark,
        and the three beats on the left, the form on the right — which
        is the composition a 1440 has room for and a handset does not.
      */}
      {/*
        ⚠ **`max-h-dvh` IS WHAT LETS THE FORM PUSH UP — 1 September, and it is
        the load-bearing half of that change.** Reported: *create an account*
        adds a field and slides *sign in with a password* under the fold.

        The answer is flex shrink — the beats give the height back — and **flex
        shrink cannot happen against a container with no definite height.**
        `body` is `min-h-full`, so it sizes to its content: laid out that way
        there is never negative free space, every item gets its hypothetical
        size, and the document simply grows. That is exactly what was reported.
        Capping this box at the viewport is what makes the free space negative,
        and the shrink follows with no measurement anywhere.

        ⚠ **`dvh`, not `vh` or `%`.** A percentage resolves against a container
        whose height is auto and computes to `none`; `100vh` is the *large*
        viewport, so in a Safari tab with the toolbars showing it is taller than
        the screen and the fold comes back. `dvh` is the one that tracks what is
        actually visible.

        ⚠ **Off above `--breakpoint-stack`.** Up there the wall is a grid and the
        form grows into its own column, so there is nothing to push and a short
        desk window should go on scrolling the way it does today.
      */}
      <main className="gutter safe-bottom relative z-[1] mx-auto flex max-h-dvh w-full max-w-sm flex-1 flex-col pt-[calc(3rem+env(safe-area-inset-bottom))] [--safe-bottom-base:3rem] stack:grid stack:max-h-none stack:max-w-[76rem] stack:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] stack:items-center stack:gap-x-24">
        {/*
          `my-auto` rather than `justify-center` on the parent: when a phone
          keyboard takes half a landscape viewport the content is taller than the
          container, and centred flex content then overflows in *both* directions
          with the top above the scroll origin and unreachable. Auto margins
          collapse to zero with no free space, so this degrades to top-aligned
          and stays scrollable. On the desk the grid centres the two columns
          against each other instead, so the auto margins are handed back.
        */}
        {/*
          `min-h-0` so this column can be shrunk under its own content — the
          default `min-height: auto` on a flex item is what would otherwise
          refuse, and the shrink is what stops the form pushing the switches off
          the bottom. The mark does not pay for it (`shrink-0` below); the beats
          do, which is the one box on this screen that can be scrolled.
        */}
        <div className="my-auto flex min-h-0 flex-col gap-9 stack:my-0">
          {/*
            ⚠ **The mark carries no rule under it, and the wrapper that held the
            two together is gone with it — directed.** The hairline was the one
            piece of furniture on this screen that was not type, and it was
            justified as separating the mark from the beats without spending a
            heading on them. The beats have their own labels, so it was drawing a
            division the type already makes. **Do not put it back as a lighter or
            shorter rule**: the argument against it is that the separation exists,
            not that the line was too heavy.

            The outer stack's `gap-9` is now the only thing between the mark and
            the first beat.
          */}
          {/*
            ⚠ **`shrink-0`, and the mark is the thing that does NOT give way.**
            It is the identity, it is the poster, and at `line-height: 0.86` its
            capitals stand outside their own line box — so a box that clipped it
            would take 2px off the tops of the letters before it took anything
            off a sentence. The beats absorb instead; see `WallBeats`.
          */}
          <h1 className="zine-command shrink-0 text-[6.5rem] stack:text-[10rem]">Keep.</h1>

          {/*
            **Three beats: write, match, keep?** — the product's whole loop, and
            the third one is the name, which is the point of it being there. ⚠ **It
            followed the rename for that reason and not as a copy tweak**: the
            beat is the name asked as a question, so if the name moves it moves.

            ⚠ **These words are the first run's, MOVED rather than copied.**
            `components/page-screen.tsx` carried all three; it now carries the
            command alone, because two of the three describe states a person with
            an empty record is not in — you cannot swipe a line you have not
            written, and nothing can match when nothing is written. The
            explanation lives here, once, before the first capture. **Do not put
            it back on the first run as well**: two tellings drift, and the one
            that drifts is the one nobody re-reads.
          */}
          <WallBeats>
            <Beat label="write">
              The things you want to do, try, watch, buy, or remember. No categories. No
              overthinking. One line is enough.
            </Beat>
            <Beat label="match">
              Your lines are matched with the people you follow. When you both write the
              same thing, you&rsquo;ll know.
            </Beat>
            <Beat label="keep?">
              When something turns out to be worth it, say you&rsquo;d do it again — or
              simply mark it done.
            </Beat>
          </WallBeats>
        </div>

        {/*
          The form. On a handset it follows the beats down the page; on the desk
          it is the right-hand column and the top margin is handed back, because
          the grid is what puts the two side by side.
        */}
        {/*
          ⚠ **`shrink-0` — the form never gives up height, which is the point of
          the whole arrangement.** Everything a person is here to fill in stays
          at full size and stays on the screen; what moves is the explanation
          above it. `mb-auto` still holds it where it is whenever there IS free
          space, so a screen with room looks exactly as it did.
        */}
        <div className="mt-12 mb-auto shrink-0 stack:mt-0 stack:mb-0">
          <SignInForm />
        </div>
      </main>
    </>
  )
}

/**
 * One beat: a typewriter label over a sentence.
 *
 * ⚠ **The label is a `<p>` and not an `<h2>`.** These read as a caption above
 * their sentence, not as sections of a document, and three headings under an
 * `<h1>` on a page whose real content is a login form is structure invented for
 * a screen reader that nothing else on the page has.
 */
function Beat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="zine-beat text-muted mb-2">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  )
}
