'use client'

import { useEffect, useRef, useState } from 'react'

import { haptic } from '@/lib/haptics'
import { askDraft } from '@/lib/vocabulary'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The way out — Amendment 10, 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The one control in this app whose whole job is to end the session.**
 *
 * The product reset turned on a single observation: *a convergence currently
 * produces a notification, not an opportunity.* The engine, the portal and the
 * mark were all correct and all stopped at the coincidence. This is the step
 * that was missing — `docs/re-direction/view.md`, and §5.6 of the consumer
 * strategy: *a post-convergence action that helps the person leave Again and
 * contact the other person. It is an invitation to act, not an in-app
 * conversation system.*
 *
 * ⚠⚠ **THE SYSTEM SHARE SHEET, NEVER A CHANNEL THIS APP PICKS.** Again holds no
 * phone numbers and must not start: naming WhatsApp or SMS means asking for the
 * contacts permission, which contradicts the privacy stance the same document
 * spends a section protecting. The share sheet hands the drafted text to
 * whatever the two of them already use, needs no new permission, and asks for no
 * contact data at all. **The person picks the recipient in their own app**, and
 * that is a feature rather than a shortfall — see amendment F in the view.
 *
 * ⚠ **So it does not know who it is messaging, and does not need to.** The
 * counterpart is named in the sentence above this control; the recipient is
 * chosen in the sheet. Plumbing an identity through to pre-address it would buy
 * nothing the person is not already about to do with their thumb.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What it degrades to
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **`navigator.share` is not everywhere, and the fallback is the clipboard.**
 * It is present on iOS Safari, Android Chrome, macOS Safari and Chromium on
 * Windows — the four shipping surfaces plus the desk — and absent on Firefox.
 * A control that did nothing there would be the button that lies, so the
 * fallback copies the same draft and says so.
 *
 * ⚠⚠ **A CANCELLED SHARE IS NOT A FAILURE, AND TREATING IT AS ONE IS THE BUG
 * WAITING HERE.** Dismissing the sheet rejects the promise with an
 * `AbortError`; a bare `catch` that showed an error would accuse somebody of
 * breaking something every time they changed their mind. It is swallowed by
 * name, and only a real fault falls through to the clipboard.
 *
 * ⚠⚠ **NOTHING RENDERS OFF `navigator`, WHICH IS WHY THERE IS NO CAPABILITY
 * STATE AND NO EFFECT TO SET IT.** The first draft read `navigator.share` in a
 * `useEffect` and kept the answer in state, and the lint rule against setting
 * state synchronously in an effect was right to refuse it — but the real fault
 * was upstream: **the label is *Ask them* either way**, so the capability
 * decides only what the handler does, and a handler runs in the browser by
 * definition. There is no server/client divergence to guard against because
 * nothing about the markup depends on the answer. **Do not reintroduce a
 * `canShare` flag to "avoid checking twice"** — checking is a property lookup,
 * and the flag costs a render pass plus a hydration hazard to save it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why it is a word and not a glyph
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **It sits in the run of the sentence, exactly as `Accept` and `Decline` do
 * on the request row.** That precedent is the whole argument: a bordered
 * control is a block and cannot sit inside a line of words, and this control is
 * *about* the sentence beside it rather than about the capture. **The console's
 * glyph row is the wrong home** — cross off, rewrite and settle all act on your
 * own line, this acts on the overlap; and that row is a measured sight line
 * (`traysightline.mjs`) that a conditional fourth glyph would move.
 *
 * ⚠ **`Ask them`, two words, a state and a verb.** Design rule 1: the sentence
 * above says the state (*Sam too.*), this says the verb. **Not `Share`**, which
 * names the mechanism rather than the act, and not `Message`, which is a noun
 * before it is a verb. It stays *them* for one name or five — `portalSentence`
 * names everybody and this control addresses whoever the reader chooses.
 *
 * ⚠ **`--color-chrome`, because it is a control.** §11 gives the accent to
 * overlap *state* and it is already spent on the mark in the gutter; a second
 * tenant beside it would be the same thing said twice.
 */
export function AskThem({ text }: { text: string }) {
  /*
    ⚠ **Three states and the third is the fallback's receipt.** A clipboard copy
    is invisible — nothing opens, nothing moves — so a control that did it
    silently would read as a control that did nothing. The share sheet needs no
    receipt because it *is* one.
  */
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* The receipt is on a timer, and a console can close before it fires. */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const say = () => {
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2_000)
  }

  const ask = async () => {
    /*
      ⚠ **Composed at the tap, not held in state.** The words can be rewritten
      while a console is open — that is what the ✎ does — and a draft captured
      at mount would then send a sentence quoting what the line used to say.
    */
    const draft = askDraft(text)
    haptic()

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: draft })
        return
      } catch (e) {
        /*
          ⚠ **`AbortError` is somebody changing their mind**, which is not a
          failure and must not fall through to the clipboard — a cancelled share
          that silently copied would leave the draft on the clipboard of a
          person who decided against sending it.
        */
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(draft)
      say()
    } catch {
      /*
        ⚠ **Both doors shut, and the honest thing is to say nothing.** There is
        no third way to hand text to another application, and §6's *silence
        stays silent* is the rule for an absence the interface cannot fix. The
        words are on screen above this control; they can be selected.
      */
    }
  }

  return (
    <button
      type="button"
      onClick={ask}
      aria-label={copied ? 'Message copied' : 'Ask them about this'}
      className="text-chrome tap-target ms-2 transition-opacity hover:opacity-80"
    >
      {copied ? 'Copied' : 'Ask them'}
    </button>
  )
}
