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
        ⚠ **`wall-frame` IS WHAT LETS THE FORM PUSH UP, and it fires on the
        create-account form alone.** Reported: *create an account* adds a field
        and slides *sign in with a password* under the fold.

        The answer is flex shrink — the beats give the height back — and **flex
        shrink cannot happen against a container with no definite height.**
        `body` is `min-h-full`, so it sizes to its content: laid out that way
        there is never negative free space, every item gets its hypothetical
        size, and the document simply grows. That is exactly what was reported.
        Capping this box at the viewport is what makes the free space negative,
        and the shrink follows with no measurement anywhere.

        ⚠⚠ **The cap shipped UNGATED for an hour and ate the beats on the opening
        screen** — reported, *i didn't ask for that*, and correctly. The whole
        argument for the gate, and the 46px of iOS the handset added to it, is in
        `wall-frame`'s docblock. Sign-in and reset are untouched by this screen's
        arrangement; only the third field buys the compression.
      */}
      <main className="gutter safe-bottom wall-frame relative z-[1] mx-auto flex w-full max-w-sm flex-1 flex-col pt-[calc(3rem+env(safe-area-inset-bottom))] [--safe-bottom-base:3rem] stack:grid stack:max-w-[76rem] stack:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] stack:items-center stack:gap-x-24">
        {/*
          ⚠⚠ **THERE ARE NO AUTO MARGINS ON THIS COLUMN ANY MORE, AND THAT IS
          THE WHOLE OF *THE TEXT SHIFTS UPWARDS* — 1 September.** It was
          `my-auto` here and `mb-auto` on the form: three auto margins sharing
          whatever space was left over — above the mark, between, and under the
          switches. So a field arriving or leaving changed **all three at once**
          and the mark drifted with it.

          ⚠ **A composition that floats in its leftover space moves whenever the
          content changes, and there is no split that fixes that.** Measured on
          the handset's own state — a 797px box, which is what iOS gives the
          installed app before it re-lays out — sign-in against reset: three
          autos drifted the mark **4.9px**, one auto above the form drifted it 0
          but threw the switches **60px**. Both were built and both were thrown
          away. **The mechanism is the free space being distributed at all.**

          ⚠ **So it is packed from the top on every phone, and nothing floats.**
          The mark is at the page lead on an SE and on a Pro Max, in all three
          modes; what moves when the password field leaves is what was under it,
          by exactly one field. That is the field leaving, which is legible, and
          not the page shifting, which is not.

          ⚠ **What this costs, stated: the leftover space is all at the foot**,
          so a tall phone shows more ground under the switches than a short one.
          That is the poster being laid out from the top rather than hung in the
          middle, and it is the only arrangement that is the same on every
          screen. **Do not answer a tall phone's foot by putting `my-auto` back.**

          The landscape-keyboard case the old note worried about is answered by
          construction rather than by an auto margin collapsing: nothing centres,
          so nothing can overflow upward past the scroll origin.

          `min-h-0` so this column can be shrunk under its own content — the
          default `min-height: auto` on a flex item is what would otherwise
          refuse, and the shrink is what stops the form pushing the switches off
          the bottom. The mark does not pay for it (`shrink-0` below); the beats
          do, which is the one box on this screen that can be scrolled.
        */}
        <div className="flex min-h-0 flex-col gap-9">
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
          above it.

          ⚠ **`mb-auto` is gone from here, and it is not coming back** — it was
          one of the three auto margins the column's note above says caused the
          drift. `mt-12` is now the whole of what separates this from the beats,
          on every phone and in every mode.
        */}
        <div className="mt-12 shrink-0 stack:mt-0">
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
