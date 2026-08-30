'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
/* Aliased: the bare name is the DOM one, which this file also listens with. */
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

import {
  acceptOfferAction,
  captureAction,
  captureWithImageAction,
  crossOffCaptureAction,
  declineOfferAction,
  earlierAction,
  editCaptureAction,
  offerAction,
  settleCaptureAction,
  undoCaptureAction,
} from '@/app/actions/captures'
import type { EntryState } from '@/lib/domain'
import type { PageLineView } from '@/lib/page-line'
import { haptic, hapticCrossedOff, hapticSettled } from '@/lib/haptics'
import { mutationId as newMutationId } from '@/lib/mutation-id'
import { Bar, OFF } from './bar'
import { useChromeRecede } from './chrome-recede'
import { Ask, Console } from './console'
import { Foot, ToolStack } from './foot'
import { AttachGlyph, LinkGlyph, UndoGlyph } from './glyphs'
import { useKeyboardHem } from './keyboard-hem'
import { useRowSwipe } from './row-swipe'
import { touchQuery, useMatches } from './pointer'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The page is the app
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **The field is summoned since 27 August, and much of what follows was
 * written for a pinned one.** The live line is not on the page: the record has
 * the screen, and the foot's `+` raises a **writing sheet** on the bottom edge
 * of the glass, above the keyboard, which grows with the words in it. Read
 * `writing-sheet` in globals.css for the argument — the short version is that a
 * one-row field cannot show a capture longer than the column, and **a drag
 * inside a focused single-line field means caret-and-selection on every engine**,
 * so it could not be scrolled back to either.
 *
 * What is unchanged is everything about the *record*: the order, the picking,
 * the line's own slot, the day stamps, *Earlier*. What is corrected below is
 * marked; what is not marked was true of the pinned band and is true of the
 * sheet.
 *
 * **The landing screen is a blank page you type down.** Not a capture field
 * pinned above a list — the page itself is the record, empty on first run and
 * filling as you write. One line is one capture; Return commits the line and
 * drops to a fresh one, so a run of captures is a run of Returns and nothing
 * else.
 *
 * **The newest line is the first one.** Every capture pushes the record down,
 * so what you just wrote is at the top without a scroll, and the line most
 * likely to be settled is the one nearest the thumb.
 *
 * ⚠ **The caret used to sit under the bar and does not.** It is in the sheet, at
 * the bottom, where the thumb and the keyboard already are — which is what the
 * original argument for the top wanted (*a caret the keyboard can never cover*)
 * and gets more directly: the sheet rides the keys, so nothing can cover it.
 * The record keeps the top because a line has to be **seen** to land.
 *
 * ⚠ **This reverses the written order the page shipped with**, and the metaphor
 * it cost is real: you no longer type down a page the way you write in a
 * notebook. It was traded for the two things a handset made obvious — arriving
 * on the newest line without a scroll to the end of the record, and a caret the
 * keyboard can never cover, because it is above the fold by construction.
 *
 * ⚠ **Nothing in the app can cause an open.** No feed, no notification, no
 * streak. Every open is caused by something in the world — a shelf, a poster, a
 * sentence at a party — so the whole design answers one requirement: **open,
 * typed into, and closed in under five seconds, one-handed.** Until convergence
 * exists in Phase 2 the app has to win on capture speed alone, which sets the
 * bar precisely: if typing into Again is not faster than typing into Notes,
 * there is no reason to use it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The page is not a text buffer, and that is the load-bearing decision
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Only the bottom line is live.** Every line above it is a *record*, not an
 * input — which is already true and was being pretended otherwise: a committed
 * line can be struck through or carry a year, and neither of those is text.
 *
 * Once that is admitted the collision disappears:
 *
 *   - **Tap the words and the line is picked.** One meaning, no modifier, no
 *     hidden gesture.
 *   - **Tap the `+` and you are writing.** It is in the foot, so it is one tap
 *     away wherever the record is scrolled to — and on iOS starting a capture
 *     always cost one gesture anyway, because a keyboard cannot be raised
 *     without one. This is that gesture, given a target of its own.
 *   - **Tap the paper and the picked line is let go.** The inverse of the first
 *     rule, and the only thing the paper does. It does not start a capture —
 *     see below for why that affordance was built and taken out.
 *   - **The keyboard follows the sheet.** It comes up with it and goes with it,
 *     and the sheet cannot be open while a line is picked.
 *
 * ⚠ **The record used to be a way to start writing, and is not any more.** Every
 * row carried an invisible button filling whatever width its words did not use,
 * and the tail of the page carried another named "Write". Both existed because
 * the live line was the first thing in the document and scrolled away. Pinning
 * it made them a second way to reach something already in reach — and a large
 * invisible target beside every line of a record whose other gesture is *tap a
 * line to pick it*. A line is still only as wide as its own words, which was a
 * consequence of the paper rather than a decision of its own.
 *
 * ⚠ Without this, tapping a line to settle it would place a caret and start an
 * edit instead. The fix is not a modifier gesture on an always-editable page; it
 * is removing the premise that every line is a live input.
 *
 *   - **The foot's pencil is the only door to a rewrite.** Tapping the words
 *     again did it too for a day, and that is removed: the pick is the common
 *     act — settle it, cross it off — and a gesture that means one thing the
 *     first time and another the second is the modifier gesture this section
 *     rules out. One control, one meaning, and a tap on a line always picks it.
 *
 * ⚠ **The rewrite happens in the sheet** — the band's successor, and the same
 * one field. This is the answer to the question the design left open.** *In place or in a detail view* was the one thing
 * undecided; the answer is neither. In place shipped for a day and a handset
 * reported the page moving under it — see `startEdit` for why a field in normal
 * flow breaks three instruments at once, and why removing it is the fix rather
 * than correcting each. A detail view loses to this page's own argument: it
 * behaves like paper, and paper does not navigate to be written on. Nothing
 * navigates here, and the premise above is not merely untouched but stronger:
 * **no line of the record is ever an input**, not even for a moment.
 *
 * ⚠ **The page has exactly one field, always.** It holds a new capture, or the
 * words of the line being rewritten. It is the sheet's since 27 August and it
 * was the pinned band's before; what has never changed is that there is one of
 * them, and that **no line of the record is ever an input**.
 *
 * ⚠ **Two exits on a handset, and both commit.** Return, and a tap on the scrim
 * — because the words on screen are the words somebody meant, and an exit that
 * threw them away would be the page losing something. `Escape` is the third and
 * the only one that discards, and it is a key, so a thumb never reaches it.
 * Unchanged words write nothing at all, so opening a line to *look* at it costs
 * no round trip. See `leave` and `discard`.
 *
 * ⚠ **This header claimed two rules for weeks that nothing implemented.** It
 * said a second tap should edit, and that unpicking was a tap on the page — and
 * neither was built until 24 August; a third clause, "which is also how you get
 * back to writing", had gone stale the day the record stopped being a way to
 * start writing. **A rule written in a header is not a rule that ships** — and
 * the first of the three no longer ships either: the second tap was built and
 * then taken out again once the foot carried a pencil of its own, because two
 * doors to a rare act cost the common one its single meaning.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The client owns the list, and the server is the seed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Return does not wait for the network and does not `refresh()`.** The line
 * lands in the list, the caret drops to a fresh one, and the save goes out
 * behind it. A router refresh per Return would put a server round trip between
 * somebody and their next word — and then tell the page its own list a second
 * time, which is a flicker on a screen whose whole promise is that it behaves
 * like paper.
 *
 * So this component owns the page for the length of the session and reads the
 * server again on the next load. There is exactly one list on screen and no
 * reconciliation, which is also why every mutation here is optimistic and
 * reverts on a failure rather than waiting on one.
 *
 * ⚠ **An installed app has no next load, so one is made** — see the resume
 * effect. It re-enters on becoming visible, and only while the page is settled,
 * which is what keeps the sentence above true rather than aspirational: a
 * re-entry re-seeds, it does not merge, so there is still exactly one list.
 */

/**
 * One line, as the server hands it over.
 *
 * ⚠ **Defined in `lib/page-line.ts` and re-exported here.** It moved the day
 * *Earlier* was built: two things produce it now — the route's first read and
 * the action — and a view shape with two producers drifts unless one mapper
 * makes both.
 */
export type { PageLineView }

/**
 * One line, as the page holds it.
 *
 * `key` is stable from the moment a line exists, which for a line typed here is
 * before it has an `id`. React needs one that does not change when the server's
 * answer arrives, or the row it is keyed by unmounts and remounts under the
 * finger that made it — and on an optimistic list that is every line.
 */
type Line = PageLineView & {
  key: string
  /** Held for the length of the line, so a retry is the *same* submission. */
  mutationId?: string
  /**
   * The photograph, while it is still only on this device.
   *
   * ⚠ **The page cannot wait for the upload to show the picture.** `hasImage`
   * is true the moment the line lands, but the bytes are behind
   * `/api/media/[id]` and there is no id until the save returns — several
   * seconds, on a photograph over a handset connection. Without this the line
   * would show an empty slot where the picture is, which is the app looking like
   * it lost it.
   *
   * An object URL, revoked when the page unmounts.
   */
  previewUrl?: string
  pending?: boolean
  /** What went wrong, on the line it went wrong on. */
  failed?: string | null
  /**
   * Typed here rather than read from the server, which is the whole of what it
   * means: the row flashes once as the line arrives on it.
   *
   * ⚠ **A property of the line, not a piece of state with a timer.** The flash
   * is a CSS animation with `both`, so it runs once on mount and ends holding
   * its final frame — nothing. A `landed` id held in state would need a timeout
   * to clear it, and the timeout would be a second opinion about a duration the
   * stylesheet already owns.
   *
   * Seeded lines never carry it, so a reload does not re-flash the record.
   */
  landed?: boolean
}

/**
 * ⚠ **`Question` was here and it lives in `console.tsx` as `Ask` — 30 August.**
 * The page asks exactly two kinds — *Again?* when a line is settled, and *is
 * this what you meant?* when a possibility is offered — and both are now asked
 * inside the console, which is the surface a capture is considered on. It is
 * imported back for the one place the record still asks: **the offer, at the
 * moment of capture**, so a question arrives visibly on the line it belongs to
 * rather than as a mark somebody has to notice.
 *
 * ⚠ **Moved rather than copied.** Two components would be two designs waiting to
 * disagree about what a question looks like, which is the thing its own note
 * warned against when it was one component serving two questions.
 */

/**
 * **The photograph, riding the line** — in the same slot a resolved capture's
 * year takes, so a picture never costs the page its rhythm. One line is still
 * one line.
 *
 * ⚠ **Its own button, beside the words rather than inside them.** The words are
 * the pick target; a thumbnail inside them would be a tap that picks the line
 * when the design says tapping the picture opens it. Two targets, two meanings,
 * no modifier.
 *
 * ⚠ **The preview wins over the stored one while it exists.** There is no id to
 * ask `/api/media` for until the upload returns, and an empty slot in the
 * meantime is the app looking like it lost the photograph.
 */
function Thumbnail({ line, onOpen }: { line: Line; onOpen: () => void }) {
  const src = line.previewUrl ?? (line.id === '' ? null : `/api/media/${line.id}`)
  if (!src) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the photograph"
      /* The line's own centre — see `line-glyph`. `tap-target` is still what
         gives it 44px of *width*; the utility only answers the height. */
      className="line-glyph tap-target ms-2 shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a private route, not a CDN; see app/api/media */}
      <img
        src={src}
        alt=""
        className="size-[var(--thumb)] rounded-[3px] object-cover"
      />
    </button>
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The line's own slot — 25 August, and it holds one thing since the 30th
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The undo belongs beside the line it takes back.** For ten seconds after a
 * capture lands, that slot is the way to erase it; after them it used to become
 * cross off and rewrite, for a *picked* line.
 *
 * ⚠ **`LineTools` was that component and it is deleted — 30 August.** The pick
 * is gone: a tap on a line opens the console, and **cross off and rewrite are on
 * the console's bottom edge**, on the box that shows the capture they act on.
 * Three states in one slot was the right answer while the record was the only
 * surface a line had; it has one of its own now.
 *
 * ⚠ **What that argument protected is untouched, and it is why this stayed.**
 * The undo and the × were both lit on the same line for ten seconds with nothing
 * saying that one erases and the other strikes through — so they were made one
 * slot, in sequence, never side by side. They still cannot be seen together, and
 * now they are not even on the same surface: the undo is on the row, the × is in
 * the console, and the ten seconds are the only time the row carries anything at
 * all.
 *
 * ⚠ **It must not move into the console with the other two.** The undo is a
 * *window*, not an action on a considered line — it exists for a typo in
 * something written half a second ago, and reaching it through a console is two
 * gestures and a read for the one act on this page that has to cost neither.
 *
 * ⚠ **Absent until the window is open, and this is settled.** Controls were
 * shown on every line for an hour and taken back off: a record of two hundred
 * lines each carrying glyphs is the density device inverted. *Controls go off;
 * they do not disappear* stays the **two bars'** rule; on the line, absent is the
 * off state.
 *
 * ⚠ **Immediately after the words, which is what "the end of the entry" means.**
 * `ms-auto` put it at the end of the *row* for an hour and the report was
 * immediate — a short line left its control stranded out at the margin with a
 * gap of nothing between. A line is only as wide as its own words, so the end of
 * the entry is where the words stop.
 *
 * ⚠ **It must not set the height of the row.** One line is one line: the glyph
 * is `--glyph-line`, the padding buys a hit area and the negative margin gives
 * the height back, so what the row measures is the drawing and what a thumb gets
 * is bigger than it.
 */
function LineUndo({ undoable, onUndo }: { undoable: boolean; onUndo: () => void }) {
  if (!undoable) return null

  return (
    /*
      ⚠ **`line-glyph`, not `align-middle` — 26 August.** A handset read the undo
      as sitting low, and it was: `middle` centres a box on the *parent's*
      x-height, so this was being centred on a lowercase x while sitting beside
      the line's words. The utility makes the box the line box and top-aligns it,
      which puts the glyph on the line's own centre with no number in it. See
      `line-glyph` and `page-row` in globals.css.
    */
    <div className="line-glyph ms-3 shrink-0 [--glyph:var(--glyph-line)]">
      <button
        type="button"
        onClick={onUndo}
        aria-label="Undo the last capture"
        className="text-chrome flex items-center"
      >
        <UndoGlyph />
      </button>
    </div>
  )
}

export function PageScreen({
  lines: seed,
  todayKey,
  undoWindowMs,
  earlier: earlierSeed,
  imagesOn,
}: {
  lines: PageLineView[]
  /**
   * Whether the app has anywhere to put a photograph.
   *
   * ⚠ **Decided on the server, because the token is a server fact.** The camera
   * is dark without a store — a control that cannot act goes off, which is the
   * foot's own rule, and it is what makes deploying with no Blob store safe
   * rather than broken.
   */
  imagesOn: boolean
  /**
   * Where the record continues, or `null` if it does not.
   *
   * An opaque cursor: the page passes it back and never reads it. See
   * `pageCursor` in `lib/db/captures.ts` for why *Earlier* is not an offset —
   * a record with a live head cannot be paged by counting.
   */
  earlier: string | null
  /**
   * The group a line typed now belongs to, decided by the server so that it is
   * the same group the server already put today's other lines in.
   */
  todayKey: string
  /**
   * ⚠ **The window, passed down rather than imported.** It is
   * `UNDO_WINDOW_MS` in `lib/db/captures.ts`, which is `server-only` and cannot
   * be reached from here — and the alternative, a second `10_000` written in a
   * client file, is a number that goes stale silently the day the real one
   * moves. The server bounds the delete in SQL either way; this only decides how
   * long the glyph is lit.
   */
  undoWindowMs: number
}) {
  const [lines, setLines] = useState<Line[]>(() =>
    seed.map((l) => ({ ...l, key: l.id })),
  )
  const [draft, setDraft] = useState('')
  /**
   * **The line whose console is open**, by id, or `null`.
   *
   * ⚠ **This was `picked` until 30 August, and the rename is the change.** A tap
   * on a line used to *mark* it: the row grew a brass bar in the gutter, the
   * foot's settle glyph lit, and `×` and `✎` appeared in the line's own slot —
   * three controls acting on a capture whose text the row could not show. A tap
   * now opens the console, which shows the whole capture and carries all three.
   *
   * ⚠ **The state is the same shape and every rule it carried still holds.** It
   * is an id and not a boolean, so *which* line survives a re-render; `asking`
   * belongs to it and must be cleared with it; and the chrome is held while it
   * is set, because the bar has to stay where it was when the line was tapped.
   *
   * ⚠ **Step 2 of the Phase 2 brief deletes this outright**, when cross off and
   * settle become swipes on the row. It is still here because the swipes are not
   * built, and a console that nothing can reach would be worse than a name that
   * has one more job to lose.
   */
  const [opened, setOpened] = useState<string | null>(null)
  /*
    ⚠ **There is no `focused` state on this page any more, and that is the end
    of a long argument.** Four things were keyed to focus and all four had to
    come off it — the chrome hold, the writing pane, the row light and the
    keyboard hem — because the live line carries `autoFocus`: focus is the
    *resting state* of this page on the desk and in a Safari tab, it arrives
    without a keyboard on iOS, and React may never see the event at all. Every
    one of those now reads `writing`, which is a gesture. Do not add it back.
  */
  /**
   * Somebody is writing, as opposed to the field merely holding focus.
   *
   * ⚠ **`focused` cannot do this job, and the reason is the same one that took
   * it out of the chrome's hold.** The live line carries `autoFocus`, so on the
   * desk and in a Safari tab the page *opens* focused — and a writing mode keyed
   * to focus would open with the record blurred, sunk and untouchable, before
   * anybody had asked for anything. On iOS focus also arrives without a
   * keyboard, so it is not even a proxy for one.
   *
   * So this is set by the gesture instead: a tap on the paper, a tap on the
   * field, or a keystroke in it. All three are somebody saying *I am writing
   * now*, on every surface, and none of them is a platform behaviour.
   *
   * Cleared on blur, which is the only way out — including the writing pane's
   * own tap and `pick`, both of which blur the field.
   */
  const [writing, setWriting] = useState(false)
  /** The line whose *Again?* is standing open. */
  const [asking, setAsking] = useState<string | null>(null)
  /**
   * The line being rewritten, and the words while they are being rewritten.
   *
   * ⚠ **The draft is held here rather than on the line**, so the record stays
   * the record: `lines` holds what was saved until an edit is committed, and
   * abandoning one costs nothing because nothing was overwritten to begin with.
   * It is the same division the live line makes between `draft` and `lines`.
   *
   * ⚠ **An id, not a boolean**, for the same reason `picked` and `asking` are:
   * exactly one line can be open at a time, and holding the id makes that true
   * by construction rather than by remembering to close the last one.
   */
  const [editing, setEditing] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  /** The last line to land, while the ten seconds hold. */
  const [undoable, setUndoable] = useState<string | null>(null)
  /**
   * The line whose offer is standing open **because it just arrived.**
   *
   * ⚠ **An id, and only ever the newest.** The design says an offer is shown in
   * full while its line is *live or picked* — live meaning the moment of
   * capture, so that a question arrives visibly rather than as a mark somebody
   * has to notice. Every other line's offer is the trailing `?` until it is
   * pointed at. Holding one id is what stops a session of captures ending with
   * ten open questions down the page.
   */
  const [offering, setOffering] = useState<string | null>(null)
  /**
   * **Where the record continues.** `null` is the end of it, and the tail
   * control exists exactly while this is a string.
   */
  const [earlier, setEarlier] = useState<string | null>(earlierSeed)
  /**
   * The photograph waiting to be captioned, and its preview.
   *
   * ⚠ **A photograph is not a capture until it is captioned.** The camera puts
   * the picture on the live line and leaves the caret waiting; there is no
   * record until Return. That rule is a product decision with two engineering
   * consequences worth having — nothing inert reaches the matching path, and
   * Phase 2 never has to handle a textless capture.
   */
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null)
  /**
   * **A link waiting on the live line**, lifted out of a paste.
   *
   * ⚠ **It is not in the words, and that is the whole idea.** A capture is a
   * sentence somebody wrote; a URL pasted into the middle of one is forty
   * characters of machine address sitting in it, and every line of the record
   * would carry it forever. Pasting takes it *onto* the line rather than into
   * it — the same relationship the photograph has — so the words stay the words
   * and Return commits the three together.
   *
   * ⚠ **Only one, and the last paste wins.** A capture points at one thing;
   * two links is a list, which is a different feature with a different shape.
   * Pasting a second replaces the first, visibly, in a chip that is already on
   * screen.
   */
  const [link, setLink] = useState<string | null>(null)
  /** The picture being looked at, full size. */
  const [looking, setLooking] = useState<Line | null>(null)
  /** A read in flight, so a second tap cannot ask for the same slice twice. */
  const [reading, setReading] = useState(false)
  /**
   * Whether *Earlier* has been used this session.
   *
   * ⚠ **Only to stop a resume throwing the reading away** — see the resume
   * effect. A record paged back through is a view somebody built a tap at a
   * time, and re-entering would hand back the first fifty lines and lose it.
   * `earlier` cannot answer this: it is non-null on arrival for anybody with
   * more than a page of record, so it says there *is* more, never that anybody
   * went and got it.
   */
  const [paged, setPaged] = useState(false)
  /**
   * **Whether a thumb is doing this**, which on this page means one thing only:
   * whether there is a keyboard covering the glass that an empty line cannot
   * dismiss. See the field's `onChange`.
   *
   * ⚠ **It is `false` until mount**, so anything else reading it must be right
   * while it still is — the only consumer here runs inside an event, which is
   * always after the correction.
   */
  const touch = useMatches(touchQuery)
  /** What went wrong reading back, said where the reading happens. */
  const [readFailed, setReadFailed] = useState<string | null>(null)

  /**
   * **The page's one field**, and since 24 August it is the only one: it holds a
   * new capture, and it holds the words of a line being rewritten. `editField`
   * was a second ref for a second `<input>` mounted in the record, and it is
   * deleted with it — see `startEdit` for what a field in normal flow cost.
   */
  const camera = useRef<HTMLInputElement>(null)
  /**
   * Every object URL this page has minted, so they can all be given back.
   *
   * ⚠ **A set rather than one, because a session is a run of captures.** Each
   * committed photograph leaves its preview on the line it belongs to — that is
   * what stops the picture vanishing while the upload finishes — so they
   * accumulate, and a page held open all afternoon would hold every one of them
   * in memory with nothing to release them.
   */
  const previews = useRef(new Set<string>())

  /**
   * **An `<input>` again — 28 August, second pass — and it is mounted at all
   * times.**
   *
   * ⚠ **The line slides; it does not wrap and it does not stack.** Directed:
   * *when the caret reaches the end of the row, the text already written moves
   * out of the far edge.* That is what a one-line field does natively — the
   * engine keeps the caret in view and scrolls the value under it — and it is
   * the reason this is an `<input>` rather than a `<textarea>` with `wrap="off"`.
   * A textarea wraps by nature; making one behave like a single line means a
   * legacy attribute value and `white-space: pre` propping up an element in a
   * role it was not built for.
   *
   * ⚠ **This element has been swapped twice in two days and the reasons are
   * both written down, because the next reader will assume one of them was a
   * mistake.**
   *
   *   - **27 August, `<input>` → `<textarea>`.** Reported: a capture longer than
   *     the column ran off the side and could not be got back.
   *     `node_modules/.probe/panfield.mjs` measured why — a horizontal drag
   *     inside a focused field is caret-and-selection on every engine, Chromium
   *     pans one anyway and iOS does not. Wrapping removed the condition.
   *   - **28 August, back.** The wrap was replaced by the one-line rule for the
   *     whole page, and then the sliding line was asked for directly, with the
   *     consequence stated first: on a handset the words that have slid off are
   *     reachable by caret, selection and Home, but **not by swiping the row**.
   *     Accepted at that price. The rule that said *never swap this for an
   *     `<input>`* was written the same morning under the opposite condition,
   *     and the condition is what changed.
   *
   * ⚠ **`dir="auto"`, which is the whole of *depending on user language*.** The
   * field takes its direction from the first strong character typed into it, so
   * the value slides left under an English caret and right under an Arabic one
   * with no branch, no locale lookup and no setting. An empty field falls back
   * to the page's own direction, which is why the drawn caret is `start-0` and
   * not `left-0`.
   *
   * Return still commits — see the key handler. An `<input>` refuses a newline
   * by nature, so that handler is now belt as well as braces.
   *
   * ⚠ **Mounted even while the sheet is closed, and that is load-bearing.** iOS
   * raises a keyboard only for a focus that happens *inside* a user gesture, and
   * a component mounted by a state change is focused a tick too late. So the
   * field exists from the first paint, off the bottom of the glass, and the
   * `+`'s own click handler focuses it synchronously before anything is asked
   * to render. See `openSheet`.
   */
  const input = useRef<HTMLInputElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const floorAnchor = useRef<HTMLDivElement>(null)
  /** The writing sheet, for nothing but a name in the DOM to aim probes at. */
  const sheet = useRef<HTMLDivElement>(null)

  /**
   * **Is the sheet open — synchronously, this instant, not next render.**
   *
   * ⚠ **It exists because every exit can now be reached twice in one gesture.**
   * A tap on the scrim blurs the field and *then* clicks the scrim; `done`
   * blurs a field whose `onBlur` is itself an exit. `writing` cannot arbitrate
   * either of those — it is state, so a handler reading it inside the same tick
   * reads the value it was rendered with, which is `true` for both halves of the
   * pair. Two exits in one tick is **two captures**: `commit` mints a fresh
   * client id each time, so the idempotency key that protects a retry does not
   * protect this.
   *
   * ⚠ **It is not a second source of truth for the mode.** Nothing renders from
   * it and nothing outside the exits reads it; `writing` is still the fact the
   * page is built on. This says only *has the closing already started*.
   */
  const open = useRef(false)
  /** The two ends of the record, watched so the bars are there at both. */
  const topMark = useRef<HTMLDivElement>(null)
  const endMark = useRef<HTMLDivElement>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /*
    ⚠ **The band's correction is gone with the band — 27 August.** The hook used
    to hold a *top*-pinned live line on the visible viewport's top edge, because
    iOS drags every `position: fixed` element up when it scrolls to reveal a
    focused field. The field is on the bottom edge now and rides
    `--keyboard-overlap`, which the hook's other half already measures — so what
    is left is one measurement with one consumer.

    `writing` is the sheet being open, which is the only thing that asks for a
    keyboard.
  */
  useKeyboardHem({ writing, host, floorAnchor })

  /*
    ⚠ **An open console is the hold, and focus deliberately is not.** It was a
    *picked* line until 30 August, on the reasoning that the foot was that line's
    toolbar and could not be off screen while one was picked. The console carries
    those controls now, and the hold matters more rather than less: **the bar
    must stay visible if it was visible when the line was tapped**, because a
    console is not navigation and somebody looking at a capture is still visibly
    on their own page.

    Focus was in here for a day and was wrong on the desk, where the live line
    takes focus on arrival and the chrome therefore never receded; the keyboard
    it was standing in for is measured instead. See `chrome-recede.ts`.
  */
  /*
    ⚠ **`writing` freezes the chrome where it stands.** Somebody who scrolled
    down and then tapped the live line asked for a keyboard, not for the bars
    back — and somebody who was at the top and tapped it should not lose them.
    Both are one rule: *writing does not move the furniture.*
  */
  const receded = useChromeRecede({
    held: opened !== null,
    writing,
    top: topMark,
    end: endMark,
  })

  /**
   * **Tap thinks, swipe does — 30 August.**
   *
   * ⚠ **One hook for the whole record, and `bindSwipe` is what a row wears.**
   * The state it holds is *the one pointer currently dragging*, of which there is
   * exactly one on any surface, so a hook per row would be fifty copies of a
   * fact that is singular. It also means a swipe that runs off one row and over
   * another cannot start a second.
   *
   * The gesture, the axis arbitration and why the row travels its own height are
   * all in `row-swipe.ts`.
   */
  const bindSwipe = useRowSwipe()

  /*
    The top of the page, instantly — which is where the caret is.

    ⚠ **`behavior: 'instant'` because `html` carries `scroll-behavior: smooth`**
    (§10/§11 — respected throughout), and an animated scroll is the app taking a
    second to show somebody where they have just asked to be.

    ⚠ **Nothing scrolls on arrival any more, and nothing scrolls after a Return.**
    The caret is the first thing in the document, so the top of the page is where
    the browser already opens. A `useLayoutEffect` used to run a scroll-to-end
    before paint, so a record with three months in it did not open on March; it
    went with the written order that put March first in the document. **A
    subtraction cannot be wrong on a device nobody has tested.**

    What is left is the one case that still needs a scroll: a tap on the paper
    while the record is scrolled away from the caret. Focus alone would leave the
    choice to the browser, and with a fixed bar overhead its choice can be a
    caret sitting underneath it.
  */
  /**
   * The head of the record, instantly — which is where a new line lands.
   *
   * ⚠ **`behavior: 'instant'` because `html` carries `scroll-behavior: smooth`**
   * (§10/§11 — respected throughout), and an animated scroll is the app taking a
   * second to show somebody where they have just asked to be.
   *
   * ⚠ **It runs on `commit`, and that is the whole of what it is for now.** It
   * used to go first in `write`, to get the caret on screen before focus handed
   * the scrolling to the browser; the field brings its own position with it, so
   * that race is gone. What is left is the job it was quietly doing:
   * **a capture has to be seen to land.** Write
   * from halfway down the record and the new line arrives at the head, out of sight,
   * with the blink playing to nobody. So the record comes to the head *after*
   * the keystroke — which cannot cost the four seconds, because the four seconds
   * are over.
   */
  const toCaret = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  /*
    ⚠ **The field grew for one day and does not grow — 28 August.** A
    `scrollHeight`-driven textarea went with the pinned band; `grow-field`, a
    one-cell grid sized by a ghost copy of the same text, replaced it on the 27th
    and is deleted on the 28th. **Every line on this page is one line, the field
    included**, so there is no height left to compute. What the field does with a
    capture too long for the column is scroll it, vertically, inside itself — see
    `page-input` for why that is not the horizontal scroll of 27 August wearing a
    different hat.

    Kept because it will be argued again: what made growing wrong *before* the
    sheet was where it grew — a row in the page's own flow shoved the record down
    while somebody was typing. That objection died with the band and is not what
    killed this one.
  */

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }, [])

  /*
    ⚠ **Read inside the effect, never during a render.** The set itself is
    created once and never replaced, so capturing it here and releasing it in
    the cleanup is exact — and it is the only arrangement React allows, because
    a ref read during render is a value the renderer cannot know changed.
  */
  useEffect(() => {
    const minted = previews.current
    return () => minted.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  /*
    ────────────────────────────────────────────────────────────────────────
     Resume is a load, because for an installed app it never was one
    ────────────────────────────────────────────────────────────────────────

    ⚠ **The header above is true and was quietly not being honoured.** It says
    this component "owns the page for the length of the session and reads the
    server again on the next load", and that is the right design — Return has to
    land in under a frame, so the client owns the list and there is exactly one
    list and no reconciliation. But an installed app has no next load. It
    resumes the same document for days, so a capture written on another device
    never appears, and the record on the handset is silently short.

    ⚠ **Silently short is the part that matters.** Not freshness for its own
    sake: a record that can be incomplete without saying so is one you check,
    fail to find something in, and write twice. That is the same class of harm
    as the two guarantees in `lib/db/` — a bug that costs trust rather than
    function.

    **So the condition is removed rather than corrected.** Not a poll, not a
    merge: a real re-entry, which re-runs the seed against the server with no
    reconciliation to get wrong, because there is still only ever one list.
    `router.refresh()` was the obvious alternative and does nothing here — it
    hands down a new `seed` prop that `useState`'s initialiser, having run once
    on mount, ignores. Making it work means teaching this page to merge two
    lists, which is the thing the header says it does not do.

    ⚠ **Re-entry is cheap here by construction, which is the argument for it.**
    The page comes back in its resting state, the record is newest-first, and at
    the top a re-entry changes nothing anybody can see. This page was built to be
    re-entered. It also picks up new code, which is the same stale-document
    problem wearing its other hat — the force-quit an installed build otherwise
    needs.

    ⚠ **And that argument has a condition in it, which is now in the gate — 30
    August.** Reported from the installed app: scroll down until the bars recede,
    background it, come back, and **the bars drop and then recede again**. They
    do, and it is not the chrome's fault. The browser restores the scroll before
    the first frame — measured, `node_modules/.probe/resumechrome.mjs` — but the
    server cannot know the reader is 900px down, so the document arrives with the
    bars in it, sits like that for **260ms** while it hydrates, and then plays the
    340ms recede. **Nothing about a reload can fix that: the flash is the reload.**

    ⚠ **So a scrolled page does not re-enter.** The sentence above used to say
    *scrolling to the top loses no position*, and that is simply false of somebody
    reading the past. Re-entry was licensed on costing nothing; where it costs
    something, it does not happen. The condition is removed rather than the
    symptom corrected, which is the order `CLAUDE.md` asks for.

    ⚠ **What it costs, stated: a reader who leaves the app scrolled down gets no
    re-seed on that resume.** The record is newest-first, so what a re-seed brings
    is at the *top* — off the screen of the one person this withholds it from —
    and the next resume at the top does it. **Silently short is still the harm to
    avoid**, so if this ever has to choose, it chooses the reload: no mark means
    no measurement, and no measurement re-enters exactly as before.

    ⚠ **Measured off the mark, never off `window.scrollY`.** In a Safari tab the
    address bar collapses and `scrollY` moves backwards while the page is still
    going down — see `chrome-recede.ts`, which learned it the expensive way. The
    mark is the same instrument the chrome reads, so the gate and the bars can
    never disagree about whether the page is at the top.

    ⚠ **Only when the page is settled, and the list is the strictest term.** A
    `pending` line has not been saved and a `failed` one exists nowhere else;
    re-entering over either destroys work. So does a draft, a photograph waiting
    for its caption, an open rewrite, or the ten seconds still holding. Somebody
    using the page is never settled, so this cannot fire under their hands — and
    somebody who put it down is settled by definition, which is exactly when
    they wanted it.

    ⚠ **`offering` is deliberately not in the gate.** An open offer is shown in
    full "while its line is live or picked", and live means the moment of
    capture — a moment a resume has already ended. It comes back as the trailing
    `?`, which is what every other line's question looks like. Gating on it
    would mean the one path that most needs a re-entry — capture on the phone,
    put it down, come back — is the one path that never gets one.

    ⚠ **No timer, and the reason is not battery.** A clock fires while somebody
    is looking, and re-entry is precisely what must never happen to a page in
    somebody's hands. Visibility cannot do that: by construction it fires when
    they were not looking. The case a clock would buy — two screens open, this
    one untouched, the other writing — costs a real merge to cover properly and
    is bounded by the handset's own auto-lock in the meantime.
  */
  const settled =
    draft === '' &&
    !writing &&
    opened === null &&
    editing === null &&
    asking === null &&
    photo === null &&
    looking === null &&
    undoable === null &&
    !reading &&
    !paged &&
    !lines.some((l) => l.pending || l.failed)

  /*
    ⚠ **Written in an effect and read in one**, per the note on `previews`
    above: a ref assigned during render is a value the renderer cannot know
    changed. Holding it this way is also what keeps the listener attached once
    for the life of the page rather than being torn down and rebuilt on every
    keystroke, which is what a dependency array of eleven values would do.
  */
  /**
   * **Is the record at the top — measured, this instant.**
   *
   * ⚠ **A rendered box, not `window.scrollY`**, and the very mark the chrome
   * watches. See the re-entry note above.
   *
   * ⚠ **No mark, no measurement — and then it re-enters.** A missing ref must
   * not silently switch the re-entry off; a record that is short without saying
   * so is the harm this whole mechanism exists to prevent, and a flash of the
   * bars is not.
   */
  const atTopNow = () => {
    const mark = topMark.current
    return !mark || mark.getBoundingClientRect().bottom > 0
  }

  const onResume = useRef<() => void>(() => {})
  useEffect(() => {
    onResume.current = () => {
      if (settled && atTopNow()) {
        window.location.reload()
        return
      }

      /*
        ──────────────────────────────────────────────────────────────────────
         Not settled: the page stays, and stops claiming a keyboard it has lost
        ──────────────────────────────────────────────────────────────────────

        ⚠ **Reported on a handset, 25 August:** background the app with the
        keyboard up, come back, and the keyboard rises and then collapses. It is
        iOS drawing its resume snapshot, finding no focused field underneath and
        dropping the keys — **focus does not survive the background, and the
        words on the line prove nothing about it**, because `draft` is state and
        has never depended on focus.

        ⚠ **The keyboard cannot be held up, and that half of the request is not
        buildable.** Raising one needs a gesture, and a resume is not one. What
        was left behind instead was worse than the flash: `writing` still true,
        so the scrim was up and the chrome receded — a page insisting somebody
        was writing, with no keyboard and no caret anywhere on it.

        So the claim is dropped rather than the symptom covered. `writing` is
        the sheet being open, which means *a keyboard has been asked for*; after
        a resume on glass that is false, and saying so puts the page back at rest.

        ⚠ **The draft survives the sheet closing, and always did.** `draft` is
        state and has never depended on focus or on the sheet, so re-opening with
        the `+` hands back the words that were there. That is what makes closing
        it the honest answer rather than a loss.

        ⚠ **Both, because the blur alone is not enough** — the same trap the
        writing pane's click hit. `blur()` on a field that is not focused fires
        no event, and after a resume it is exactly that, so the flag would stand
        with no way out.

        ⚠ **Coarse pointers only, and it is the mirror of `rest()`.** That fires
        only on a fine pointer, this only on a coarse one, and both turn on one
        fact: whether there is an on-screen keyboard that can disagree with the
        page. On the desk focus survives an app switch, so somebody who alt-tabs
        away mid-line is still writing and nothing should say otherwise.
      */
      if (!touch) return
      /*
        ⚠ **Before the blur, and for a different reason than `done`'s.** The
        draft is deliberately *kept* across a resume; without this the blur would
        reach `onBlur`, which is an exit, and an exit commits. Closing the sheet
        and writing the line are not the same act.
      */
      open.current = false
      input.current?.blur()
      setWriting(false)
    }
  })

  useEffect(() => {
    const resumed = () => {
      if (document.visibilityState !== 'visible') return
      onResume.current()
    }
    document.addEventListener('visibilitychange', resumed)
    return () => document.removeEventListener('visibilitychange', resumed)
  }, [])

  /** The ten seconds, as a colour on one glyph. The server owns the real bound. */
  const openUndo = useCallback(
    (id: string) => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
      setUndoable(id)
      undoTimer.current = setTimeout(() => setUndoable(null), undoWindowMs)
    },
    [undoWindowMs],
  )

  const closeUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoable(null)
  }, [])

  /**
   * Put a message on the line it belongs to, and take it off the rest.
   *
   * Every write here is a functional update, so a stale closure over this cannot
   * be wrong — it never reads the list it is changing.
   */
  const mark = useCallback(
    (key: string, patch: Partial<Line>) =>
      setLines((all) => all.map((l) => (l.key === key ? { ...l, ...patch } : l))),
    [],
  )

  /* ------------------------------------------------------------------ */
  /*  Return                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * **Ask the provider, after the line is on the page.**
   *
   * ⚠ **Nothing here can fail visibly**, which is §13's requirement rather than
   * a shortcut: a capture is complete when it is saved, and provider failure is
   * the absence of an offer — logged and invisible. `offerAction` returns *no
   * offer* for an outage, a rate limit and a query that matched nothing alike,
   * so there is one path and it draws nothing.
   *
   * ⚠ **It runs behind the save and never in front of it.** The line is on the
   * page before this is called, and the four seconds are over by then.
   */
  const ask = useCallback(
    async (key: string, id: string) => {
      const result = await offerAction(id)
      if (!result.ok || !result.value.offer) return
      mark(key, { offer: result.value.offer })
      setOffering(id)
    },
    [mark],
  )

  const send = useCallback(
    async (key: string, text: string, mutationId: string, sourceUrl: string | null) => {
      const result = await captureAction({ text, clientMutationId: mutationId, sourceUrl })
      if (!result.ok) {
        mark(key, { pending: false, failed: result.message })
        return
      }
      mark(key, { id: result.value.id, pending: false, failed: null })
      /*
        ⚠ **Only a real creation is offered anything.** A retry that found the
        submission already written is the same line arriving twice; asking the
        provider again would either write the same suggestion or overwrite an
        answer somebody has already given.
      */
      if (result.value.created) void ask(key, result.value.id)
      /*
        Only a real creation opens the window. A retry that found the submission
        already written returns the row that was there, and offering to delete
        something that landed a minute ago because the connection came back is
        the opposite of what undo is for.
      */
      if (result.value.created) openUndo(result.value.id)
    },
    [ask, mark, openUndo],
  )

  /**
   * The same submission, carrying the photograph.
   *
   * ⚠ **One call, not an upload followed by a save**, and it is slow on purpose:
   * the line is already on the page, so the upload happens behind a screen that
   * has finished. A retried submission finds the capture already written and
   * stores no second copy — see `captureWithImageAction`.
   */
  const sendWithImage = useCallback(
    async (
      key: string,
      text: string,
      mutationId: string,
      file: File,
      sourceUrl: string | null,
    ) => {
      const form = new FormData()
      form.set('text', text)
      form.set('clientMutationId', mutationId)
      form.set('image', file)
      /* Omitted rather than sent empty: the schema is nullish, not nullable-string. */
      if (sourceUrl) form.set('sourceUrl', sourceUrl)

      const result = await captureWithImageAction(form)
      if (!result.ok) {
        mark(key, { pending: false, failed: result.message })
        return
      }
      mark(key, { id: result.value.id, pending: false, failed: null })
      if (result.value.created) {
        openUndo(result.value.id)
        void ask(key, result.value.id)
      }
    },
    [ask, mark, openUndo],
  )

  /** The photograph goes back and the caret stays where it is. */
  function clearPhoto() {
    if (!photo) return
    previews.current.delete(photo.url)
    URL.revokeObjectURL(photo.url)
    setPhoto(null)
  }

  function commit() {
    const text = draft.trim()
    if (text === '') return

    /*
      ⚠ **One light tap, and it is the third of the vocabulary's three.** A
      capture landing is the fact this whole page exists to produce, and until
      now nothing marked it but the blink on the words. Synchronous, inside the
      gesture, before the write — see `lib/haptics.ts`. An empty sheet returns
      above this line, so closing the field without writing stays silent.
    */
    haptic()

    /*
      ⚠ **One id, minted here, held with the line.** It is what makes a
      double-tapped Return or a resumed connection one capture rather than two —
      raw text is never deduplicated, because the same words can mean a
      different thing on a different day, so there is no unique key standing
      behind this the way there is behind a resolved film.
    */
    const mutationId = newMutationId()
    const line: Line = {
      key: mutationId,
      /* No server id yet. The line is on the page regardless; that is the point. */
      id: '',
      text,
      state: 'want',
      year: null,
      day: todayKey,
      dayLabel: 'Today',
      /* No question yet. One may arrive behind the save — see `ask`. */
      offer: null,
      hasImage: photo !== null,
      /*
        The preview stays with the line rather than being revoked here: there is
        no id to ask `/api/media` for until the upload returns, and an empty
        slot in the meantime is the app looking like it lost the photograph.
      */
      previewUrl: photo?.url,
      /*
        ⚠ **It goes on the line, so a retry carries it.** The chip is cleared
        below and the state it held is gone with it; the line is what `retry`
        re-sends from, and a link that lived only in `link` would be dropped by
        the one path that exists to not drop anything.
      */
      sourceUrl: link,
      mutationId,
      pending: true,
      failed: null,
      landed: true,
    }

    /* The head of the list, because the head of the list is under the caret. */
    setLines((all) => [line, ...all])
    setDraft('')
    /* The link went with the line; the band starts empty like the field does. */
    setLink(null)
    /*
      The line is written, so the writing is over — see `done`. The sheet closes
      and the keyboard goes with it, which is what puts the record back in front
      of the person at the moment it has something to show them.
    */
    done()
    setOpened(null)
    setAsking(null)
    /*
      The open offer belongs to the line that was just written; another line
      being written is the moment that stops being true. It keeps its `?`.
    */
    setOffering(null)
    closeUndo()

    /* The line lands at the head, so the head is where the page goes. */
    toCaret()

    /* Not in a transition: the list is already right, and this is the receipt. */
    if (photo) {
      const file = photo.file
      /* The URL is kept — the line is holding it — so only the slot is cleared. */
      setPhoto(null)
      void sendWithImage(line.key, text, mutationId, file, line.sourceUrl)
    } else {
      void send(line.key, text, mutationId, line.sourceUrl)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Earlier                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * **The next slice, appended at the tail.**
   *
   * ⚠ **Appended, never merged.** The cursor names a place strictly older than
   * every line on screen, so what comes back cannot overlap what is already
   * here — which is the whole reason it is a cursor. There is nothing to
   * de-duplicate and no key to reconcile on.
   *
   * ⚠ **Nothing scrolls.** The lines arrive below the last one, under a thumb
   * that is already at the bottom of the record; moving the page as well would
   * take the reader off the line they stopped at.
   *
   * ⚠ **It is not optimistic, because there is nothing to be optimistic
   * about.** Every other mutation here puts its result on the page first and
   * sends behind it; a read has no result until the server answers. So this is
   * the one place on the page that waits, and `reading` is what stops a second
   * tap asking for the same slice again.
   */
  async function readEarlier() {
    if (earlier === null || reading) return
    setReading(true)
    setReadFailed(null)

    const result = await earlierAction(earlier)
    setReading(false)
    if (!result.ok) {
      setReadFailed(result.message)
      return
    }

    setLines((all) => [...all, ...result.value.lines.map((l) => ({ ...l, key: l.id }))])
    setEarlier(result.value.earlier)
    setPaged(true)
  }

  /** The same submission again, with the same id — so a retry cannot double. */
  /**
   * ⚠ **A line that carried a photograph has nothing to retry with.** The
   * `File` was handed to the upload and the page does not keep it — only the
   * object URL, which is a view of bytes the browser owns rather than the bytes
   * themselves. So a failed photo capture says so on the line and stops there,
   * where a failed text capture retries.
   *
   * That is a real limit and it is named rather than hidden: the alternative is
   * holding every photograph of the session in memory against a failure that may
   * not come, on the device least able to afford it.
   */
  function retry(line: Line) {
    if (!line.mutationId || line.hasImage) return
    mark(line.key, { pending: true, failed: null })
    void send(line.key, line.text, line.mutationId, line.sourceUrl)
  }

  /* ------------------------------------------------------------------ */
  /*  Rewriting a line                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * **The words come to the writing line.** A tap picks the line; the foot's
   * rewrite glyph then lifts that line's words into the band and puts the caret
   * at the end of them.
   *
   * ⚠ **The pencil is the only caller, and a second tap on the words is not.**
   * It was, briefly. Two doors to the rare act meant a tap on a line answered
   * *pick* or *rewrite* depending on what the last tap had been, which is a
   * modifier gesture on a page whose header rules them out — see `pick`.
   *
   * ─────────────────────────────────────────────────────────────────────────
   *  ⚠ The field this used to mount in the record is deleted (24 August)
   * ─────────────────────────────────────────────────────────────────────────
   *
   * **In-place editing shipped for a day and a handset reported the page moving
   * under it**: the band descending far enough to cover entries, and the bar
   * receding with no scroll to explain it. Both are one cause, and it is not a
   * threshold or a curve — **every instrument on this page is built on the
   * premise that there is one field and it is pinned.** A field in normal flow
   * breaks the premise three ways at once:
   *
   *   - iOS scrolls the document to reveal a focused in-flow field, and
   *     over-scrolls the layout viewport to do it. `useChromeRecede` watches a
   *     mark in that document, so it reads a keyboard's arithmetic as a reader
   *     scrolling and takes the bar away.
   *   - `useKeyboardHem`'s band correction then puts the band on the visible top
   *     edge, which with the layout viewport over-scrolled is well down the
   *     glass and on top of the record.
   *   - and a keyboard can cover a line in flow, which is the exact defect
   *     pinning the live line was built to remove.
   *
   * Correcting each is three corrections and a race at the moment the line is
   * let go, while the keyboard is still closing and the over-scroll has not
   * unwound. **Removing the second field removes all three**, and returns both
   * hooks to what they were before this feature existed — which is the order
   * `CLAUDE.md` asks for: remove the condition rather than correct for it.
   *
   * ⚠ **It does not reopen "a record is not a text buffer" — it closes it
   * harder.** No line of the record is ever an input now, not even briefly. The
   * question this document left open was *in place or in a detail view*; the
   * answer is neither, and nothing navigates. The band is the page's one
   * writing line and always was.
   *
   * ⚠ **The console CLOSES on the way in — 30 August, and it reverses the rule
   * that stood here.** The pick used to be kept: the band held the words, the
   * record held the line, and the mark stayed on the row they came from. The
   * console cannot be kept, and that is the brief's instruction rather than a
   * convenience: **`✎` closes the console and hands the words to the strip.**
   * Two reasons, and either is enough.
   *
   *   - **One scrim, one occupant.** A console and a sheet up together share the
   *     scrim, and a tap on it could then mean two things — which is the exact
   *     shape of every gesture bug this page has fixed.
   *   - **The console would be showing the saved words** while the strip held
   *     the words being written. Two versions of one capture on one screen, and
   *     the page would be showing the stale one.
   *
   * ⚠ **The rewrite is therefore the path that already exists, entered through a
   * different door.** Nothing about `editing`, the strip or `commitEdit` changes
   * for having been reached from a console.
   *
   * ⚠ **The pencil is now this function's only caller in two places at once.**
   * The record's slot has no pencil any more — see `LineUndo` — so the console's
   * is the one door, which is what the 25 August rule asked for and finally gets
   * literally.
   *
   * ⚠ **`focus()` inside the gesture, which is what raises the keyboard.**
   * Picking blurred the field (*the keyboard follows liveness*), so this is a
   * real focus inside a real tap and iOS treats the keyboard as the gesture's
   * own consequence. It is also why nothing here can be done in an effect.
   *
   * ⚠ **Through `raise`, and not by focusing the field here — 30 August.** The
   * focus and the `open` latch are one act now that losing focus is an exit; a
   * pencil that focused the field on its own would open a sheet whose Return and
   * whose scrim both returned on the first line.
   *
   * ⚠ **Never a line that is not on the server yet.** A pending line has no id
   * to name in the mutation, and a failed one wants its retry rather than an
   * edit — `openConsole` already routes that case, so a pending line never has a
   * console to hold a pencil.
   */
  function startEdit(line: Line) {
    if (line.id === '' || line.pending) return
    /*
      ⚠ **Focus first and synchronously, before any state is set** — the same
      rule `openSheet` states and for the same reason: iOS raises a keyboard only
      inside the gesture that asked for it, and the pencil's click is that
      gesture. `preventScroll` because the sheet is still off the glass at this
      instant and is about to come up on its own.
    */
    raise()
    setOpened(null)
    setAsking(null)
    setEditing(line.id)
    setEditDraft(line.text)
    setWriting(true)
  }

  /**
   * Put the rewritten words in the record, and send them.
   *
   * ⚠ **Three ways out, and only one of them discards.** Return commits, and so
   * does a tap on the scrim. `Escape` abandons. Both of the first two are
   * `leave`, because the words on screen are the words somebody meant — an exit
   * that silently threw them away would be the page losing something, which is
   * the shape this screen spends most of its design avoiding.
   *
   * ⚠ **Unchanged text writes nothing at all.** Opening a line and closing it is
   * the ordinary way to *look* at one, and it must not cost a round trip, a
   * rate-limit token, or a row's `updated_at`.
   *
   * ⚠ **Empty is an abandon, not a delete.** `setCaptureText` refuses it
   * server-side; this refuses it before the trip so the line simply stays as it
   * was. Removing a capture is the ×, which is a resolution rather than a
   * deletion (§5.1).
   */
  function commitEdit() {
    const id = editing
    if (id === null) return
    setEditing(null)

    const line = lines.find((l) => l.id === id)
    const next = editDraft.trim()
    if (!line || next === '' || next === line.text) return

    const before = line.text
    mark(line.key, { text: next, failed: null })

    void editCaptureAction(id, next).then((result) => {
      /* Back to the words that are actually saved, and say so on the line. */
      if (!result.ok) mark(line.key, { text: before, failed: result.message })
    })
  }

  /**
   * Leave the words as they were. The line stays picked, so `Escape` steps.
   *
   * The field goes back to holding whatever capture was being typed before the
   * line was opened — `draft` was never touched, so there is nothing to put
   * back and nothing that could have gone stale.
   */
  function abandonEdit() {
    setEditing(null)
    setEditDraft('')
  }

  /**
   * **The caret goes to the end of the existing words, not the start.**
   *
   * ⚠ **Stated rather than inherited.** Where a focused field puts its caret is
   * an engine's choice, and the four surfaces do not agree — one of them selects
   * the whole value, which turns the next keystroke into *replace everything*.
   * Somebody who opened a line to fix its last word would lose the line. So the
   * position is written down, and a rewrite starts where writing left off.
   */
  useEffect(() => {
    if (editing === null) return
    const field = input.current
    if (!field) return
    const end = field.value.length
    field.setSelectionRange(end, end)
  }, [editing])

  /* ------------------------------------------------------------------ */
  /*  The two resolutions — crossing off swipes, settling opens a console */
  /* ------------------------------------------------------------------ */

  /**
   * **Cross a line off, or put it back.** One function for both, because they
   * are one fact and its inverse — which is exactly what lets the row carry it
   * as a swipe and its reverse. See `row-swipe.ts` for why settling does not
   * get one.
   */
  function crossOff(line: Line) {
    const crossedOff = line.state === 'dropped'
    const next: EntryState = crossedOff ? 'want' : 'dropped'
    /*
      ⚠ **Synchronously, and before the write goes out.** A haptic answers a
      finger: every platform that has one grants it for a live gesture and
      refuses it afterwards. The record is optimistic, so *became true* means
      became true on the page — see `lib/haptics.ts`, which also says why iOS
      feels none of this and why nothing may be designed around it.

      ⚠ **Putting a line back is the CAPTURE's tap, not the cross-off's thud,
      and there is deliberately no fourth pattern.** The thud means *crossed
      off*; firing it for the opposite act would teach the hand one buzz for two
      facts, which is the noise `lib/haptics.ts` exists to prevent. A line
      returning to the live record is the same fact as a line landing on it, so
      it borrows the same light tap rather than inventing a signal nobody can
      tell from the other three.
    */
    if (crossedOff) haptic()
    else hapticCrossedOff()
    mark(line.key, { state: next, failed: null })
    setAsking(null)

    void crossOffCaptureAction(line.id, !crossedOff).then((result) => {
      if (!result.ok) mark(line.key, { state: line.state, failed: result.message })
    })
  }

  /**
   * **Put *Again?* on the line**, which is what the console's settle glyph does.
   *
   * ⚠ **This is reachable from the console and from nowhere else since 30
   * August.** It was the settle swipe's handler as well, and the swipe is
   * deleted: settling has two answers, one direction cannot carry both, and a
   * gesture that asks rather than acts costs the second beat the swipe existed
   * to save. **So settling stays where there is room to state two answers**, and
   * the row keeps the one resolution that is its own inverse. The full argument
   * is at the head of `row-swipe.ts`.
   *
   * ⚠ **Which means `asking` is now only ever set while a console is open**, and
   * the record's own copy of this question is gone with the swipe that needed
   * it. Do not put it back on the row without putting the swipe back too.
   *
   * ⚠ **A crossed-off line cannot be settled.** `resolveCapture` guards on
   * `want`, so the settleable set is exactly the resolvable one, and the console
   * does the same thing by not drawing the glyph. The guard below is the same
   * rule stated where the state actually changes.
   *
   * ⚠ **No haptic here.** Nothing became true in the database — a question
   * appeared. `hapticSettled` fires in `settle`, when one is answered.
   */
  function askAgain(line: Line) {
    if (line.state !== 'want') return
    setAsking((open) => (open === line.id ? null : line.id))
  }

  function settle(line: Line, again: boolean) {
    hapticSettled()
    setAsking(null)
    setOpened(null)
    /* It leaves the page for the tray, so it leaves the list. */
    const at = lines.findIndex((l) => l.key === line.key)
    setLines((all) => all.filter((l) => l.key !== line.key))

    void settleCaptureAction(line.id, again).then((result) => {
      if (result.ok) return
      /*
        Back **where it was**, by the index it held rather than by re-sorting.
        The page is in written order, and two lines saved in the same
        millisecond have no order to sort them back into — so the position is
        remembered rather than recomputed.
      */
      setLines((all) => [
        ...all.slice(0, at),
        { ...line, failed: result.message },
        ...all.slice(at),
      ])
    })
  }

  /**
   * **Yes.** The line is about that possibility now.
   *
   * ⚠ **The words do not change.** §6: the text is what somebody typed and is
   * never replaced by a suggestion's title. What appears is the year, in the
   * slot the `?` was occupying — which is the whole visible difference between
   * a raw line and a resolved one, and the reason the `?` lives in that slot.
   */
  function acceptOffer(line: Line) {
    const offer = line.offer
    if (!offer) return
    if (offering === line.id) setOffering(null)
    mark(line.key, { offer: null, year: offer.year, failed: null })

    void acceptOfferAction(line.id).then((result) => {
      if (!result.ok) mark(line.key, { offer, year: line.year, failed: result.message })
    })
  }

  /**
   * **No.** Not that one — and it is recorded, so nothing asks again.
   *
   * ⚠ **Ignoring is not this.** An unanswered offer stands indefinitely, which
   * is correct: a question that expires on its own has quietly answered itself.
   * This is the only thing that takes the `?` away without resolving anything.
   */
  function declineOffer(line: Line) {
    const offer = line.offer
    if (!offer) return
    if (offering === line.id) setOffering(null)
    mark(line.key, { offer: null, failed: null })

    void declineOfferAction(line.id).then((result) => {
      if (!result.ok) mark(line.key, { offer, failed: result.message })
    })
  }

  function undo() {
    const line = lines.find((l) => l.id === undoable)
    if (!line) return
    closeUndo()
    setLines((all) => all.filter((l) => l.key !== line.key))

    void undoCaptureAction(line.id).then((result) => {
      /*
        ⚠ **A refusal puts the line back, and it has to.** `undoCapture` bounds
        the delete in SQL against `created_at` rather than trusting the client's
        word for how long ago the line landed — so the clock here and the clock
        there can disagree, and the honest answer to "too late" is the line
        still being on the page.
      */
      if (!result.ok) {
        /* Where it was: the newest line is the only one undo can reach. */
        setLines((all) => [{ ...line, failed: result.message }, ...all])
      }
    })
  }

  /* ------------------------------------------------------------------ */

  /**
   * **Closing the console.** Always both, because `asking` belongs to the open
   * line and outlives it otherwise — every other `setOpened(null)` on this page
   * already travels with its `setAsking(null)`, and this is that pair given a
   * name rather than a fifth copy.
   *
   * ⚠ **It was `release`, and it let a *picked* line go — 30 August.** The
   * gesture that calls it has not changed by a pixel: **tap the paper.** What
   * changed is what is on the paper. It is now the app's one exit gesture, used
   * by the writing strip and the console alike, and the console's only door out
   * — there is deliberately no close control on the box, because a second door
   * to the one gesture every surface shares is how a gesture stops being
   * learnable.
   */
  function close() {
    /*
      ⚠ **An open rewrite commits on the way out, and this is a belt.** The
      scrim is over the record for as long as the sheet is up — it takes the
      touch — so `main` cannot receive a click then and this cannot fire with an
      open rewrite. It stays because the rule it states is the rule: leaving by
      the paper must never be the exit that discards. `commitEdit` writes nothing
      when nothing changed and nothing at all when nothing is open, so it costs a
      comparison.
    */
    commitEdit()
    setOpened(null)
    setAsking(null)
  }

  /**
   * **Escape steps back one state at a time**, because the paper tap above is a
   * thumb's gesture and the desk is one of the four surfaces that ship. A
   * pointer has no "tap beside it" — clicking the paper works, but the key is
   * what a keyboard reaches for, and without it the desk keeps the trap the
   * handset just lost.
   *
   * ⚠ **It does not listen while a line is open**, so `Escape` steps rather than
   * jumping: an open line abandons its edit first — handled on the field itself,
   * which is where the focus is — and only a second press releases. That is what
   * `Escape` means everywhere, *cancel this* rather than *cancel everything*,
   * and it keeps the one exit that discards from also being the one that lets go.
   *
   * ⚠ **Nothing here closes over anything that can go stale**, which is why the
   * handler is two `setState` calls rather than `close()`. `close` commits an
   * open edit on its way out, so it holds the draft — and a document listener
   * that mounted a keystroke ago would hold an old one. The listener not existing
   * while a rewrite is open is what makes that unreachable rather than merely
   * unlikely.
   *
   * ⚠ **It closes the console, which is what the paper does — 30 August.** The
   * key and the tap have to mean the same thing on the same surface, and on the
   * desk the console has no scrim to tap: the paper is `main` itself, and this
   * is the keyboard's way to reach the same door.
   */
  useEffect(() => {
    if (opened === null || editing !== null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return
      setOpened(null)
      setAsking(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [opened, editing])

  /**
   * ⚠ **Tapping the words opens the line's console, and that is all it ever
   * does.** It picked the line until 30 August; before that, briefly, a second
   * tap opened the words for rewriting. Both of those are gone for one reason
   * this page has now stated three times: **a tap on a line means one thing.**
   * A gesture that answers *pick* or *rewrite* depending on what the last tap
   * was is the modifier gesture the header rules out, wearing a coat.
   *
   * ⚠ **A second tap is a no-op, deliberately, rather than a close.** Closing is
   * a tap on the paper (or `Escape`), and it has to stay the *inverse* of
   * opening rather than a second reading of the same target — otherwise a thumb
   * that lands twice on a line it meant to open shuts the box it was aiming at.
   *
   * ⚠ **The row's own y is written onto the host on the way through**, and only
   * so the console knows where to rise from. `.page-row` is the row's box — the
   * words are one flex item inside it, so measuring the words would put the
   * origin on a line's *text* rather than on the line. A miss here costs one
   * odd-looking slide; the box it lands in is a constant either way.
   *
   * ⚠ **A custom property rather than state, and it is the page's own idiom.**
   * It feeds nothing but a keyframe, so state would re-render the record to
   * change one property, and an inline `style` attribute is blocked by the
   * production CSP (§10). `useKeyboardHem` writes `--keyboard-overlap` onto this
   * same host, which is what makes this a pattern rather than a workaround.
   *
   * ⚠ **Written BEFORE the state, so it is on the element the console will
   * inherit from before the console exists.** A value set after the render could
   * be a frame late, and a frame late in a 340ms rise is a console that starts
   * from the wrong place.
   *
   * ⚠ **A line already being rewritten is not opened.** Its words are in the
   * strip, and a console over a line whose text is somewhere else would be
   * showing the saved words back to somebody in the middle of changing them.
   */
  function openConsole(line: Line, target: EventTarget | null) {
    if (line.pending) return
    if (line.failed) {
      retry(line)
      return
    }
    if (editing === line.id) return
    if (opened === line.id) return
    /* Moving to another line closes whatever was open, and keeps its words. */
    commitEdit()
    const row = target instanceof Element ? target.closest('.page-row') : null
    host.current?.style.setProperty(
      '--console-from',
      `${Math.round(row?.getBoundingClientRect().top ?? 0)}px`,
    )
    setOpened(line.id)
    setAsking(null)
    /* The keyboard follows liveness: gone the moment a saved line is opened. */
    input.current?.blur()
  }

  const empty = lines.length === 0

  /**
   * **The two tools, built once and handed to both placements.**
   *
   * ⚠ **Built here rather than inline on each**, because `Foot` and `ToolStack`
   * are the same set in two arrangements and the states must be identical. Two
   * inline prop lists is how a bar and a stack start disagreeing about whether
   * something is lit.
   *
   * ⚠ **It was three, and settle left on 30 August — `foot.tsx` had written down
   * that it would.** Its docblock said: *settle is the last asymmetry… if the
   * grouping is revisited, settle is the thing to move — onto the line, where
   * the other two that act on it already are.* It acted on a picked line; there
   * are no picked lines, and it now sits on the console beside the × and the ✎,
   * which is the same rule the other two moved under. What is left here is
   * genuinely not per-line: **one control that starts a capture, and one that
   * goes somewhere.**
   */
  const tools = {
    /*
      ⚠ **Never null.** The other entry here can be off, because it needs
      something to act on. There is nowhere a capture cannot be started, so this
      is the one control on the page that is always lit — and on an empty record
      it is the only one.
    */
    write: openSheet,
    /*
      ⚠ **The page's own list is the test, and it is not the whole record.**
      Search reads across settled captures too, so a person whose every line is
      in the tray has an empty page and a searchable record — and the glyph would
      be dark on the one screen that could use it. The alternative is a count on
      every open of the page to light a link, which is a query to avoid a wrong
      answer that is nearly unreachable: to have settled a line you had to have
      written it *here*, so an empty page is a first run or a tray that grew from
      one. Named rather than left to be found.
    */
    searchable: !empty,
  }

  /**
   * **What the one field is holding**: a new capture, or the words of the line
   * being rewritten. Everything that reads the field reads this — the italic
   * rule, the drawn caret, the field itself — so there is one answer to *what
   * is on that line* rather than three that can disagree.
   */
  const bandValue = editing === null ? draft : editDraft

  /**
   * **Summon the field.**
   *
   * ⚠ **Focus first, synchronously, and only then ask React for anything.** iOS
   * raises a keyboard only for a focus that happens inside the user gesture that
   * caused it; a focus run from an effect after a re-render is a tick too late
   * and the keys stay down. That is why the field is mounted from the first
   * paint rather than by this function — there is something to focus before
   * there is anything to show.
   *
   * ⚠ **`preventScroll`, because the field is off the glass when this runs.**
   * Without it the browser scrolls the document to reveal an element that is
   * about to come to the bottom edge on its own, which is a page jumping under a
   * thumb for no reason.
   *
   * ⚠ **`live()` and `rest()` were here and are deleted.** They inferred a
   * writing *mode* from gestures — a tap on the field, a keystroke in it, the
   * value going empty — because the field was always on screen and there was no
   * other way to tell writing from resting. The sheet is the mode: it is open or
   * it is not, and every instrument that read `writing` now reads a fact instead
   * of an inference. Do not reintroduce a gesture that opens it implicitly.
   */
  /**
   * **Focus the field inside the gesture, and latch the sheet open.**
   *
   * ⚠ **Two lines in one function because they must never be written apart.**
   * The focus has to happen synchronously inside the gesture or iOS keeps the
   * keys down, and `open` has to be true before that focus can come back as a
   * blur — which it can, since `onBlur` is an exit. **Both doors into the sheet
   * call this**: the `+` below and the pencil in `startEdit`. A second door that
   * focused the field itself would open a sheet no exit could close, and that is
   * exactly the bug the pencil had for the ten minutes this took to write.
   */
  function raise() {
    input.current?.focus({ preventScroll: true })
    open.current = true
  }

  /*
    ⚠ **The console closes here, and that is what *one scrim, one occupant*
    means.** The `+` stays reachable at `z-20` while a console is open, so it is
    a real door from one to the other — and the two must never share the screen,
    because they would share the scrim and a tap on it could not mean one thing.
  */
  function openSheet() {
    raise()
    setWriting(true)
    setOpened(null)
    setAsking(null)
  }

  /**
   * **Leaving the sheet, which always commits.**
   *
   * ⚠ **There is one exit, reached three ways, and none of them discards —
   * 30 August.** Return, a tap on the scrim, and the keyboard's own *Done*; what
   * they have in common is that the field stops being focused, which is what
   * `onBlur` now watches. It was two doors each wired to its own gesture until
   * iOS's dismiss turned out to be a third that the page could not see. All of
   * them land the words — because the words on screen are the words
   * somebody meant, and a page that threw them away on a stray tap would be the
   * page losing something. That is the same rule the old blur-commits behaviour
   * stated; what has gone with the pinned band is the *third* state it needed, a
   * draft sitting uncommitted in a row on the page. There is no unsent draft any
   * more, which is why `unsent` and `record-held` are deleted.
   *
   * ⚠ **An empty sheet writes nothing.** Opening the field and closing it is how
   * somebody changes their mind, and it must not cost a row.
   */
  /**
   * **The one exit that discards**, and it is a key.
   *
   * ⚠ **A thumb has no such gesture, deliberately.** Both exits a handset can
   * reach — Return and a tap on the scrim — commit, because the words on screen
   * are the words somebody meant. `Escape` is the desk's way of saying *not
   * this*, and it takes the chips with the words: a photograph and a link belong
   * to the capture being abandoned, not to the next one.
   */
  function discard() {
    if (!open.current) return
    if (editing !== null) {
      abandonEdit()
    } else {
      setDraft('')
      setLink(null)
      clearPhoto()
    }
    done()
  }

  /**
   * **The scrim's tap, whoever is under it — 30 August.**
   *
   * ⚠ **One scrim, one occupant, so one handler that asks which.** The console
   * and the sheet can never be open together, so this is not arbitration; it is
   * the scrim naming the door it belongs to at the moment it is tapped.
   *
   * ⚠ **Both doors commit, which is the rule that made one gesture possible.**
   * Tapping the paper lands the words on the strip, and on the console it closes
   * a box that has no unsaved anything in it — so *tap the paper* means the same
   * thing on both surfaces. A gesture that meant *save* on one and *abandon* on
   * the other could not be learned by a hand, which is why `✎` hands the words
   * to the strip rather than opening a field in here.
   */
  function dismiss() {
    if (writing) leave()
    else close()
  }

  function leave() {
    /* Already closing — see `open`. The second half of a gesture, or our own blur. */
    if (!open.current) return
    if (editing !== null) {
      commitEdit()
      done()
      return
    }
    /* `commit` ends with `done`, so this is not two closings. */
    if (draft.trim() !== '') commit()
    else done()
  }

  /**
   * **The line is written, so the writing is over** — the pane goes, and on
   * glass the keyboard goes with it.
   *
   * ⚠ **Directed 27 August, and it reverses `rest()`'s coarse-pointer guard for
   * this one caller.** The page held the mode after a Return on the argument
   * that a session of captures is a run of them; on a handset that left the
   * record behind glass at the one moment it has something to say, so the blink
   * that is the whole receipt happened in a blur. **Once a line is submitted the
   * person is presumed done.** Another capture is a tap back into the live row,
   * which is one gesture on a target that is never off screen.
   *
   * ⚠ **It takes the door the writing pane already opens, rather than a new
   * one.** `blur()` then `setWriting(false)` is exactly what a tap on the pane
   * does, and for the same reason it does both: blurring a field that is not
   * focused fires no event, so the flag has to be cleared directly as well. That
   * pair is the only way out of the mode on glass and it is proven; a commit
   * should not invent a second.
   *
   * ⚠ **`blur()` fires `onBlur` synchronously, and `onBlur` is now an exit —
   * 30 August.** It calls `leave`, which commits. That would be this function
   * calling itself through the platform, so `open` is cleared on the line above
   * the blur and `leave` returns on it. **Do not reorder those two lines.**
   *
   * ⚠ **Safe against the hem, because `commit` has already scrolled to the
   * caret.** Dropping `writing` unmounts `useKeyboardHem`, whose cleanup takes
   * `--keyboard-overlap` and the band's correction off while an iOS keyboard is
   * still animating away. At `scrollY` 0 the visual viewport starts where the
   * layout one does, so the band's correction is already the empty string and
   * the hem is padding at the foot of a page nobody is looking at the foot of.
   */
  function done() {
    /*
      ⚠ **First, and before the blur.** `blur()` fires `onBlur` synchronously and
      `onBlur` is an exit, so this line is what stops the exit calling itself.
    */
    open.current = false
    /* The keyboard follows focus, and nothing else can dismiss it. */
    input.current?.blur()
    setWriting(false)
  }

  /**
   * **A pasted address, read as an address.**
   *
   * ⚠ **The whole clipboard or nothing.** It lifts only when what was pasted
   * *is* a link — not when a link is somewhere inside a paragraph somebody
   * pasted. Fishing a URL out of prose would silently edit text a person
   * deliberately put on the line, which is the one thing this page does not do
   * to anybody's words.
   *
   * ⚠ **`http(s)` only, matching `cleanSourceUrl`.** Two checks that can
   * disagree are worse than one, so this is the same allowlist under a
   * different roof: a `mailto:` or a `data:` paste is left to land as text,
   * where it is harmless and visible, rather than lifted into an `href`.
   *
   * ⚠ **A bare `example.com` is text.** `new URL` refuses it and nothing here
   * invents a scheme for it — guessing `https://` in front of something a
   * person typed is the app deciding what they meant about a thing they will
   * later click.
   */
  function liftLink(pasted: string): string | null {
    const trimmed = pasted.trim()
    if (trimmed === '' || /\s/.test(trimmed)) return null
    try {
      const url = new URL(trimmed)
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
    } catch {
      return null
    }
  }

  /** What the chip says. The host, because the rest is machinery. */
  function linkLabel(href: string): string {
    try {
      return new URL(href).host.replace(/^www\./, '')
    } catch {
      return href
    }
  }

  /*
    ────────────────────────────────────────────────────────────────────────
     A keystroke is a keystroke wherever it lands
    ────────────────────────────────────────────────────────────────────────

    `live()` above says the two gestures meaning *I am starting a new capture*
    are a tap on the field and a keystroke in it. **A keystroke arriving while
    the field is blurred is the same gesture** and was the one the page did not
    hear: focus is the resting state here, but four things take it away on
    purpose — picking a line, `Escape`, the writing pane's own click, and the
    rewrite's exit — and after any of them somebody had to go and click the line
    before they could write. On a page whose whole promise is paper, that is a
    step paper does not ask for.

    So the key is redirected rather than a new state added: focus the one field
    and call `live()`, which is the same code path a tap takes. Nothing here
    knows about focus as an event, and `focused` is still not a thing.

    ⚠ **No `preventDefault`, which is what makes the character land.** A keydown
    that is not cancelled dispatches its default action to whatever is focused
    *after* the handlers have run, so focusing here puts the letter in the field
    — spec behaviour, not a browser quirk. Appending the character by hand would
    be the alternative and is worse: it would break IME composition, which is the
    only way some people type at all.

    ⚠ **Desk-only by construction, with no platform test in it.** A handset has
    no physical keyboard, so a printable keydown can only come from the on-screen
    one — which exists only when the field is already focused, and a focused
    field is the target, which returns above. An iPad with a keyboard attached
    gets this and should. That is the rule holding on four surfaces rather than
    being switched on for one.

    ⚠ **Space is deliberately not redirected.** It is the page's keyboard scroll
    on the desk, and the record is the thing being scrolled. No capture begins
    with a space, so nothing is lost; a broken spacebar on a long record would
    be.
  */
  const typeHere = useRef<() => void>(() => {})
  useEffect(() => {
    typeHere.current = () => {
      /* A picture open full size is not a page anybody is writing on. */
      if (looking !== null) return
      openSheet()
    }
  })

  useEffect(() => {
    const redirect = (e: KeyboardEvent) => {
      /* Shortcuts belong to the browser and to the desk, not to the line. */
      if (e.ctrlKey || e.metaKey || e.altKey) return
      /*
        One character, which is the whole test: `Escape`, `Tab`, `Enter`, the
        arrows and the function keys all have longer names and all mean
        something already. Enter especially — it would commit an empty capture.
      */
      if (e.key.length !== 1 || e.key === ' ') return
      const el = e.target
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return
      }
      typeHere.current()
    }
    document.addEventListener('keydown', redirect)
    return () => document.removeEventListener('keydown', redirect)
  }, [])

  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  ⚠ While the line is empty, the caret is **drawn** rather than the field's
   * ───────────────────────────────────────────────────────────────────────────
   *
   * *A caret on an empty page is already the instruction* — it is the whole of
   * what the first-run screen says, and there is nothing else on it. So it
   * cannot be left to depend on focus, which is the one thing this app does not
   * control: **iOS will not raise a keyboard without a gesture**, `autoFocus`
   * therefore does not do there what it does on the desk, and whether a focused
   * field with no keyboard paints a caret at all is a platform behaviour rather
   * than a promise.
   *
   * Drawing it removes the question instead of answering it. While the draft is
   * empty this span **is** the caret — brass, blinking on `--animate-caret`,
   * exactly where the field's own would sit — and the field's is suppressed with
   * `caret-transparent` so the two can never both appear. The moment a character
   * is typed the real one takes over, because from there on it has to track a
   * position only the browser knows.
   *
   * ⚠ **No focus test and no platform test**, which is the point: one rule, the
   * same on four surfaces, right before anyone has touched the screen.
   *
   * Nothing is drawn while a saved line is picked. That is the browsing state,
   * and the design's own word for it is *no caret anywhere*.
   */
  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  ⚠ While the field is empty, the caret is **drawn** rather than the field's
   * ───────────────────────────────────────────────────────────────────────────
   *
   * An empty sheet with no caret in it is a black rectangle. The words are the
   * only thing on it, so before there are any there has to be something saying
   * *here*, and a caret is the one mark that says it without copy.
   *
   * ⚠ **It is drawn because a field's own caret is a platform behaviour rather
   * than a promise.** This page has been bitten by that before: whether a
   * focused field paints one, and when, is not something the app controls, and
   * on the one surface that matters the keyboard arrives on its own schedule.
   * Drawing it removes the question instead of answering it — brass, blinking on
   * `--animate-caret`, exactly where the field's own would sit, with the real
   * one suppressed by `caret-transparent` so the two can never both appear.
   *
   * ⚠ **Empty only, and that is what makes the position free.** The moment a
   * character exists the browser's caret takes over, because from there it has
   * to track a position only the browser knows. While it is empty the field is
   * exactly one line tall, so *centred on the wrapper* and *centred on the first
   * line* are the same place and no arithmetic is needed.
   *
   * ⚠ **It lost its `picked === null` half with the pinned band.** That clause
   * kept a caret off the page while somebody was browsing the record; the sheet
   * cannot be open and the record be browsed at the same time.
   */
  const drawnCaret = bandValue === ''

  return (
    /*
      ⚠ **The paper's tap is on the HOST and not on `main` — 30 August, and a
      probe is what moved it.** It was on `main` while it was letting a picked
      line go, which was fine: the record's own column was the only place a pick
      could be looked at. **On the desk the console is in flow inside that column
      and the window is not**, so at 1440 the record spans 267–1173 and a click
      at x=40 landed on nothing at all — the console stayed open with nowhere
      obvious to close it but `Escape`. Measured, not reasoned about.

      ⚠ **The paper is the page, which is what this element is.** Everything is
      inside it: the bar, the scrim, the record and the strip. What that costs is
      that a tap on the *dead space* of the bar or the strip closes the console
      too — and that is correct rather than tolerated, because the rule is not
      *tap the record*, it is **tap anything that is not the console**.

      ⚠ **On a handset almost nothing reaches this**, because the scrim is over
      the whole glass with its own `onClick`. This is the desk's door and the
      handset's backstop, in one handler.
    */
    <div
      ref={host}
      onClick={(e) => {
        if (opened === null) return
        if (
          e.target instanceof Element &&
          (e.target.closest('.console-sheet') ||
            e.target.closest('button, input, a, [role="button"]'))
        ) {
          return
        }
        close()
      }}
    >
      {/*
        The top of the document, as a thing that can be watched — see
        `useChromeRecede`. It is **before the bar** rather than under it, so the
        chrome answers the first pixel of a scroll.

        `h-px -mb-px` costs no layout and takes no space: an element with no box
        at all sits exactly on the viewport's edge at rest, which is the one
        position where an intersection is ambiguous.
      */}
      <div ref={topMark} aria-hidden className="pointer-events-none -mb-px h-px" />

      {/*
        ⚠ **No `undo` prop since 25 August.** It moved onto the line it takes
        back — see `LineTools` — so the bar is the wordmark, the tray and you,
        and every screen in the app now renders the same three.
      */}
      <Bar receded={receded} />

      {/*
        **The record, behind glass while a line is being written.**

        ⚠ **One pane doing four jobs**, and the third is the one it exists for.
        It blurs the record and sinks it a stop, so the words in hand are the
        only sharp thing on the screen. It **takes the touch** — with a keyboard
        up on iOS a `fixed` element is anchored to the layout viewport, which
        does not shrink, so scrolling can carry the visual viewport away from the
        live line and off the top of the glass; `touch-action: none` removes the
        scroll rather than correcting for the drift, which is the order
        `CLAUDE.md` asks for and is one standard property rather than a
        thermostat that took five versions to get right at the other edge. And a
        tap on it puts the keyboard away, which is the way back.

        ⚠ **Under the console and under the two bars**, so everything that can
        act stays sharp and stays tappable: `z-5` against the console's `z-10`
        and the bars' `z-20`.

        ⚠ **Inert when it is not wanted.** No blur is applied and no pointer is
        taken unless something is open — a full-viewport `backdrop-filter` left
        armed at zero opacity is a compositing layer the scrolling page pays for
        and never sees.

        ─────────────────────────────────────────────────────────────────────
         ⚠ ONE SCRIM, ONE OCCUPANT — 30 August
        ─────────────────────────────────────────────────────────────────────

        **This was the writing sheet's and it is the app's.** The console needs
        exactly what the sheet needs — the record sunk and out of reach, and a
        tap on it meaning *leave* — so it takes this one rather than bringing a
        second. Two full-viewport panes would be two things a tap could land on
        and two z-indices to keep in order, which is how a page ends up with a
        gesture that means different things depending on which invisible sheet
        is on top.

        ⚠ **The console and the sheet can never both be open**, which is what
        makes one scrim honest rather than merely economical: `openSheet` closes
        the console and `startEdit` closes it too, so the occupant is always
        exactly one and `dismiss` always knows whose door it is.

        ⚠ **It blurs for the console and not for the sheet, and that is not an
        inconsistency.** The sheet's blur was deleted on 27 August because a
        full-viewport `backdrop-filter` is a compositing layer repainted **on
        every keystroke**, and the strip has its own ground to separate the words
        in hand from the record under them. Nothing is typed over the console, so
        there is no keystroke to pay for — and the brief asks for the console to
        sit *over a blurred record* by name.

        ⚠⚠ **AND IT DOES NOT TINT FOR THE CONSOLE, WHICH IS THE WHOLE REASON THE
        CARD IS VISIBLE — 30 August, and it took three grounds to find.** The
        console is meant to look like the bars: *a glass see-through effect with
        the relevant blur, not far from the banner treatment.* Two attempts at
        the card's own ground failed — the strip's 38% was invisible, a lifted
        mix of `--color-surface` was **grey** — and the third, the bars' own
        `--glass-tint`, was invisible **again**.

        **The card was never the problem.** The bars read as glass because what
        passes under them is the record at full strength; this scrim had already
        darkened and blurred everything, so by the time the card's glass got
        there was nothing left for it to darken and no edge for it to make. So
        the tint comes off the scrim and the card keeps it. The record behind is
        **bright and heavily blurred**, the card is a darker pane over it, and
        the difference between them is exactly the difference the bars have.

        ⚠ **`--glass-blur` and not `--scrim-blur`** — 18px against 5. Five was
        picked for a photograph opened full size, where the blur is a backdrop
        for one picture; here it has to make a page of prose unreadable while
        leaving it *present*, which is the job the bars' number was chosen for.

        ⚠ **The sheet keeps its tint.** It has no blur, so a tint is the only
        thing sinking the record under a field somebody is typing into. These two
        branches are not two opinions about one surface — they are two occupants
        with different needs, which is why they are written separately rather
        than reconciled into one expression.

        ⚠ **It is a handset object only.** Above `--breakpoint-stack` the console
        expands the row in place, so there is nothing to blur and nothing to put
        out of reach — the record around it is exactly what somebody wants to
        keep seeing. `stack:` turns it off for the console and leaves it on for
        the sheet, which still wants it at every width.
      */}
      <div
        aria-hidden
        onClick={dismiss}
        className={`fixed inset-0 z-5 transition-opacity duration-[var(--recede)] ease-[var(--ease-recede)] ${
          writing
            ? 'bg-[var(--scrim-tint)] opacity-100 [touch-action:none]'
            : opened !== null
              ? 'stack:pointer-events-none stack:opacity-0 opacity-100 backdrop-blur-[var(--glass-blur)] [touch-action:none]'
              : 'pointer-events-none opacity-0'
        }`}
      />

      {/*
        The floor of the layout viewport, as a thing that can be measured — see
        `useKeyboardHem`. Zero height, no paint, no hit area: it exists to be
        read.
      */}
      <div
        ref={floorAnchor}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-0"
      />
      {/*
        ⚠ **The page box is the screen, and `svh` is not the screen.**
        `100svh` in an installed app is the screen *less* the status-bar band —
        `viewport-fit=cover` lets the page paint into that band, but the viewport
        unit does not grow to match it. Measured at 47px on this handset. So a
        page with two lines on it ends 47px above the glass, and whatever iOS
        then does with `position: fixed` puts the foot on *that* line rather than
        on the screen's. Adding the inset back states the one thing that is
        actually true, and it is a no-op in a Safari tab, on Android and on the
        desk, where the inset reads 0.

        ⚠ **The minimum used to make the tail of the page tappable, and there is
        nothing left at the tail to tap.** It held a full-width `grow` button
        named "Write" — the announced way to raise a keyboard, back when the live
        line could be scrolled off the screen. Both it and the invisible paper on
        every row are gone: the live line is pinned, so a second way to reach it
        was a second way to reach something already in reach.

        The minimum stays because it is doing another job — it is what makes a
        two-line record end at the bottom of the glass rather than partway up it,
        so `page-hem` reserves the foot against the screen and not against the
        text. Nothing fills it now, and nothing should: the space at the end of a
        short record is space.
      */}
      {/*
        ⚠ **The paper closes the console, and that is the only thing it does.**
        It let a *picked* line go until 30 August; the gesture has not changed by
        a pixel, only what is on the paper. **Tapping the paper is now the one
        exit gesture in the whole app** — the writing strip and the console alike
        — because a gesture that means *leave* on one surface and something else
        on another cannot be learned by a hand.

        ⚠ **On the desk this is the console's only door**, because up there the
        console expands the row in place and there is no scrim over the record to
        tap. The paper is the page itself, exactly as it has been.

        ⚠ **The handler lives on the HOST, not here** — see the note on the host
        element. It was on `main` and a probe found the hole: `main` is the
        *column*, and on a desk the window is wider than the column, so a click
        beside the record reached nothing. One handler on the page, not two on
        two boxes.

        ⚠ **It does not raise the keyboard, and that is deliberate rather than
        unfinished.** Paper as a way to *start writing* was built and removed —
        the strip's `+` is one tap away wherever the record is scrolled to, so a
        second way to reach it was a second way to reach something already in
        reach. Opening a console blurs the field on purpose (*the keyboard
        follows liveness*), so the gesture that closes one has to land back in
        the browsing state it came from, not overshoot into writing.

        ⚠ **A tap that reached a control is that control's.** One rule instead of
        a `stopPropagation` in every handler — the words, the console's own
        buttons, the input and anything added later are all covered by the same
        line, and none of them has to remember this exists.
      */}
      <main
        /*
          ⚠ **`--record-measure`, not `--page-measure` — 28 August.** Directed:
          the entries column may never overlap the mark's own band on the desk.
          It is `--page-measure` everywhere else and at every width where there
          is room; where there is not, it gives up width rather than crossing —
          the bar is glass, so a column reaching into that band puts lines behind
          the letters as they scroll under it. See `--mark-column`.
        */
        className="gutter page-hem mx-auto flex min-h-[calc(100svh_+_env(safe-area-inset-top))] w-full max-w-[var(--record-measure)] flex-col pt-[calc(var(--bar-height)+var(--page-lead))]"
      >
        <h1 className="sr-only">Again</h1>

        {/*
          ⚠ **No recede on the record any more.** It used to sit back while a
          draft was unsent, because a draft could be left in the pinned band with
          the keyboard gone and nothing else said it was not saved. The sheet's
          two exits both commit, so there is no such state — see `leave`, and
          `record-held` in globals.css for what went with it. What sinks the
          record while somebody writes is the scrim, and only for as long as the
          sheet is up.
        */}
        <ol className="flex flex-col">
          {lines.map((line, i) => {
            const stamped = i === 0 || lines[i - 1].day !== line.day
            const crossedOff = line.state === 'dropped'
            const isOpen = line.id !== '' && line.id === opened

            /*
              ⚠ **The last word used to be split off the rest and bound to the
              tail, and that is deleted — 28 August.** Everything after the words
              is an *atomic* inline, so on a line that fragmented it could be left
              behind at the left margin reading as a separate entry, and the only
              mechanism that stopped it was a `white-space: nowrap` box holding
              the last word and the glyphs together. Three cheaper ones were
              measured and did not work — `padding-inline-end` hangs past the
              column rather than forcing a break, the same padding on an empty
              spacer contributes nothing, and `U+2060` does not suppress a break
              across an element boundary. `node_modules/.probe/keepwith.mjs` is
              still the measurement and it is still true of wrapped text.

              **There is no wrapped text.** A line is one line now, so there are
              no fragments, nothing can be left behind on one, and the split's
              whole reason for existing has gone. The a11y dance it needed —
              two spans, one `role="button"` labelled with the whole capture and
              one `aria-hidden` carrying the same click — goes with it: the words
              are one span again, which is one control by being one thing.
            */

            /*
              **The label is still the whole capture**, including the year or the
              standing question a reader would otherwise get as a bare `?`. It is
              also what an ellipsis takes away on screen and must never take away
              here: the row shows as much as fits, and the control is named with
              all of it.
            */
            const label =
              line.year !== null
                ? `${line.text} ${line.year}`
                : line.offer !== null
                  ? `${line.text} — is this ${line.offer.title}?`
                  : line.text

            /*
              ⚠ **`aria-expanded`, where it was `aria-current` — 30 August.** The
              tap used to *mark* the line and the mark was a state a reader
              needed told; it now opens a box that follows this control in the
              document, which is what `expanded` is for and what `current` never
              said. The console is inside the same `<li>`, so the relationship is
              structural and needs no `aria-controls` to state it.

              ⚠ **The whole capture stays in the label**, and the reason is
              sharper than it was: the row truncates *because* the console holds
              the rest, so an ellipsis takes text off the screen for a reader who
              can see the screen — and must never take it off one who cannot.
            */
            const pickable = {
              role: 'button' as const,
              tabIndex: 0,
              'aria-label': label,
              'aria-expanded': isOpen,
              onClick: (e: React.MouseEvent) => openConsole(line, e.currentTarget),
              onKeyDown: (e: ReactKeyboardEvent<HTMLSpanElement>) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                /* Space scrolls the page otherwise, which a button never does. */
                e.preventDefault()
                openConsole(line, e.currentTarget)
              },
            }
            /* The same target to a thumb, silent to a reader. */
            const quiet = {
              'aria-hidden': true,
              onClick: (e: React.MouseEvent) => openConsole(line, e.currentTarget),
            }

            /*
              ⚠ **`truncate` and `min-w-0`, and they are the one-line rule — 28
              August.** `truncate` is nowrap, clipped, with an ellipsis; `min-w-0`
              is what lets a flex item shrink below its own text, without which
              the words would push the tail off the row rather than give up width
              to it. The pair is the whole mechanism — see `page-row` for why
              flex is the only layout that can do this and why that does not
              reopen the 25 August bug.

              ⚠ **`inline` is gone with the split.** It was there so the words
              would fragment and the tail would follow the last character
              wherever it fell. Nothing fragments now, and a flex item is
              block-level whatever this said.

              `cursor-default` and `select-none` are what a `<button>` gave for
              free and a span does not: an I-beam over a line that cannot be
              typed into is the same lie as a caret on it.

              ⚠ **No type here.** It was `page-words` until 26 August; the line's
              size, leading and tracking live on the row now, so the words
              inherit them — and so does every glyph that has to align against
              them, which is what that move was for.
            */
            const words = `min-w-0 truncate cursor-default select-none ${
              crossedOff ? 'line-through opacity-50' : ''
            } ${line.landed ? 'landed' : ''}`

            return (
              <li key={line.key}>
                {stamped && (
                  /*
                    The day, in mono, quiet. It asks nothing of anybody, it uses a
                    column the record already has, and it makes two hundred lines
                    navigable by *roughly when* rather than by scrolling.
                  */
                  <p
                    className={`stamp text-muted mb-2.5 ${i === 0 ? '' : 'mt-[26px]'}`}
                  >
                    {line.dayLabel}
                  </p>
                )}

                {/*
                  ⚠ **Inline flow, not flex — 25 August.** This was
                  `flex items-stretch` and the line's controls were a flex item,
                  so a capture that wrapped to two lines left its × and pencil
                  out at the right margin, level with the middle of the entry. A
                  flex container has no notion of *after the text ends*; inline
                  layout has, and nothing else does. So the words are an inline
                  box and everything that belongs after them is inline beside
                  them, which puts them after the last character wherever the
                  last character falls.

                  ⚠ **The hem moved up here with it.** `page-line`'s
                  `padding-block` is what set a row's height while the words were
                  a block; on an inline box it does not, so this takes the hem.

                  ⚠ **The gutter mark went with the pick — 30 August.** A tapped
                  line opens a console that shows the whole capture, so the row
                  no longer has to say *this one* about a line whose text it
                  could not show. The `picked` utility survives in globals.css
                  unapplied, because §11 reserves `--color-accent` for
                  **convergence** and the gutter is where a state may live: the
                  mark's next tenant is Phase 2's, not this one's. Do not put a
                  pick mark back there.

                  ⚠ **The line's type is the row's too, since 26 August**, and
                  that is the fix for furniture that read as sitting low. It was
                  on the words, so every glyph beside them was aligning against
                  the page's body type instead of the line's — see `page-row` in
                  globals.css for the measurement.
                */}
                <div
                  /*
                    ⚠ **A landed line was lifted clear of the writing pane here
                    for a day, and the lift is deleted rather than kept.** It
                    existed because the pane was still over the record when a
                    line landed on glass, so the blink happened behind the blur.
                    The commit gives the keyboard back now — see `done` — so the
                    pane is down before the line arrives and there is nothing
                    left to see through. **The condition went, so the correction
                    goes**, per *How things get fixed* in CLAUDE.md; putting the
                    lift back means the commit has stopped ending the mode.
                  */
                  /*
                    ⚠ **The swipe is on the ROW, not on the words — 30 August.**
                    *A gesture that can be made anywhere on a row is the only
                    kind of target that survives being used while walking*, and
                    the words are only as wide as themselves. The space beside
                    them used to do nothing; it swipes now, and that is the one
                    thing it has ever been allowed to do — it is still not a way
                    to start a capture, and tapping it still does nothing at all.

                    ⚠ **A pending or failed line is not swipeable.** There is no
                    id to name in the mutation, and a failed one wants its retry
                    — which is a *tap*, and is why that check lives in
                    `openConsole` rather than being repeated here.

                    ⚠ **The ROW says which way it swipes, and it is the one thing
                    the hook cannot work out for itself — 30 August.** A live line
                    goes away to be crossed off; a struck one comes back to be
                    restored. One handler serves both, because `crossOff` is
                    already the toggle — what the direction buys is that each
                    half is a separate gesture rather than the same swipe meaning
                    two things depending on a state the hand cannot feel.
                  */
                  {...(line.id !== '' && !line.pending && !line.failed
                    ? bindSwipe(crossedOff ? 'restore' : 'crossOff', () => crossOff(line))
                    : {})}
                  className="page-row"
                >
                  {/*
                    ⚠ **A line of the record is never an input, not even
                    briefly.** An `<input>` was mounted here for a day, borrowing
                    the row's own `page-line` box so the swap cost no layout —
                    and a handset reported the page moving under it. A field in
                    normal flow is the one condition every instrument on this
                    screen was built without: iOS scrolls the document to reveal
                    it, which `useChromeRecede` reads as a reader scrolling and
                    `useKeyboardHem` corrects the band for, and a keyboard can
                    cover it. The rewrite happens in the pinned band now — see
                    `startEdit` for the full argument, and for why this is a
                    condition removed rather than three corrections applied.
                  */}
                {/*
                  ⚠ **A span and not a `<button>`, still.** The original reason
                  was that a button cannot be inline — engines compute
                  `inline-block` for it whatever the declaration says, so on the
                  inline row of 25 August the words never fragmented, the box
                  filled the column and the tail landed after the *box*.
                  `node_modules/.probe/inlinebutton.mjs` measured it: `<button>`
                  gave one fragment 358px wide with the glyphs at x=12 on the
                  next line, `<span>` gave two fragments with them at x=186.

                  ⚠ **That reason expired on 28 August and the rule did not.**
                  The words are a flex item now, so display is settled by the
                  container and a button would compute `block` like anything
                  else. What a `<button>` still brings is a UA font, a centred
                  text alignment and a baseline of its own, into a row whose
                  whole design is one inherited type — and `text-start` back to
                  undo the middle of it. A span with a role costs none of that.
                */}
                <span
                  {...pickable}
                  /*
                    ⚠ **A line in flight looks exactly like a line that landed,
                    and that is the contract rather than an oversight.** It was
                    dimmed to `opacity-40` for one pass, and measured: Server
                    Actions queue per client, so a run of Returns leaves the last
                    several in flight for a second or two — which showed as the
                    app going pale under somebody who was still typing, doubting
                    lines it had already promised were captured.

                    The page's promise is that the line is on the page. What is
                    worth saying is a **failure**, which the message below says on
                    the line it happened to; anything short of that is the app
                    narrating its own network.
                  */
                  /*
                    ⚠ **`landed` blinks the words, and it goes here rather than
                    on the row or the `<li>`.** A ground behind the line shipped
                    first and was wrong on sight: lighting the paper says *this
                    area*, and what just happened is a *line*. The `<li>` would
                    have taken in the day stamp and said *this day landed*.
                  */
                  /*
                    ⚠ **`inline` was here and is gone — 28 August.** It was the
                    whole of the 25 August change: an inline box ends where its
                    last character does, so the controls followed the text
                    wherever it fell, and a strike ran across every fragment of a
                    wrapped capture rather than across a rectangle. The words are
                    one unbroken line and a flex item now — there are no
                    fragments for either argument to be about, and `truncate`
                    needs a box it can clip. See `words` and `page-row`.
                  */
                  className={words}
                >
                  {line.text}
                </span>

                {/*
                  ⚠ **The year is beside the words, not inside them — 28
                  August.** It lived in the same span, which was right while that
                  span ended where its text did; it is a clipping box now, so a
                  year inside it would be the first thing an ellipsis ate. Out
                  here it is a flex item of its own and survives any truncation,
                  which is what a resolved line has to say.

                  ⚠ **`quiet`, so the split does not reach a reader.** It is the
                  same target to a thumb — tapping the year picks the line, as it
                  did when it was inside the words — and silent to a screen
                  reader, which already has the year in `label`.

                  ⚠ **`leading-none`, and it is the difference between 44px and
                  46px.** A 13px span inheriting the line's 28px line-height gets
                  its own half-leading — (28 − 15.6)/2 against the 18px strut's
                  (28 − 21.6)/2 — so its box hung ~2px below the strut and grew
                  the line box under it. **One line is one line**, whether or not
                  it resolved to something. `page-row`'s `align-items: center` is
                  what then puts the shorter box on the line's own centre.
                */}
                {line.year !== null && (
                  <span
                    {...quiet}
                    className="text-muted ms-2 shrink-0 text-[0.8125rem] leading-none"
                  >
                    {line.year}
                  </span>
                )}

                {/*
                  ⚠ **The standing question, as one character in the year's own
                  slot.** No glyph, no colour and no new vocabulary: a resolved
                  line carries a year there and an offered one carries a `?`,
                  which is exactly the difference between them. The two can
                  never collide — an offer only exists on a capture that has
                  not resolved, and a capture that has not resolved has no
                  year.

                  ⚠ **It stands forever.** No expiry: any number would be a
                  constant tuned to nothing, and an unanswered question is not
                  wrong, it is unanswered. Only *No* takes it away.
                */}
                {line.offer !== null && line.year === null && (
                  <span
                    {...quiet}
                    className="text-muted ms-2 shrink-0 text-[0.8125rem] leading-none"
                    title={`Is this ${line.offer.title}?`}
                  >
                    ?
                  </span>
                )}

                {line.hasImage && (
                  <Thumbnail line={line} onOpen={() => setLooking(line)} />
                )}

                {/*
                  ⚠ **A real `<a>`, and a sibling of the words rather than
                  something inside them.** The words are the pick target, and a
                  control nested inside another control is exposed differently by
                  every reader and every engine — which is as true of an anchor
                  inside `role="button"` as it was of one inside the `<button>`
                  this used to be. Beside it, the pick gesture is untouched and
                  the link keeps middle-click, long-press and the back button,
                  which is the whole argument the foot's search control already
                  makes.

                  ⚠ **`noreferrer` as well as `noopener`.** The destination is
                  somewhere a person saved privately; the Referer header would
                  tell that site which page they came from, and this page is a
                  private record.

                  ⚠ **The host, never a title.** A URL is user input shaped like
                  chrome, and rendering anything the app has not verified —
                  a fetched page title, an og:image — is a capture claiming
                  something nobody checked. §7's evidence rules come first.
                */}
                {line.sourceUrl !== null &&
                  (crossedOff ? (
                    /*
                      ⚠ **A struck line's link is struck with it, and it is a
                      `<span>`.** There is no disabled state for an anchor — an
                      `<a>` without an `href` is not a control at all — which is
                      the same reason the foot's dark search is a span. A door
                      out of a line somebody has crossed off is a door out of a
                      decision they have already made.

                      ⚠ **The same two classes the words carry**, so the strike
                      and the fade match by being the identical rule rather than
                      by two numbers agreeing. `[&>svg]:align-middle` is what
                      puts the line *through* the glyph instead of under it: an
                      inline SVG sits on the baseline, and the strike is drawn
                      near the x-height.

                      ⚠ **This is the one glyph on the row that keeps `middle`,
                      and `line-glyph` must not be put on it.** Everything else
                      here was moved off `middle` on 26 August because it centres
                      on the x-height and therefore sits low against the words —
                      but the x-height is exactly where a strikeout is drawn, so
                      it is the right middle for the one glyph the strike has to
                      pass through. The 1.3px it now sits below its live twin is
                      on a line that is struck and at half strength, and the two
                      can never appear together.
                    */
                    <span
                      aria-hidden
                      /*
                        ⚠ **The outer `inline align-middle` went on 28 August and
                        the one on the SVG did not.** This is a flex item now, so
                        both were inert on the box itself — but the box still
                        carries the line's own type, and `[&>svg]:align-middle`
                        inside it still puts the glyph on the x-height, which is
                        where a strikeout is drawn. `shrink-0` because a glyph
                        that gives up width to the words is a squashed glyph.
                      */
                      className="text-muted ms-2 shrink-0 line-through opacity-50 [--glyph:var(--glyph-line)] [&>svg]:align-middle"
                    >
                      <LinkGlyph />
                    </span>
                  ) : (
                    <a
                      href={line.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${linkLabel(line.sourceUrl)}`}
                      className="line-glyph text-muted hover:text-chrome ms-2 shrink-0 transition-colors [--glyph:var(--glyph-line)]"
                    >
                      <LinkGlyph />
                    </a>
                  ))}

                {/*
                  ⚠ **Immediately after the words, and "the end of the entry"
                  means the end of the words.** It was `ms-auto` for an hour —
                  the end of the *row* — on a misreading of that phrase, and the
                  report came back at once: on a handset the controls only met
                  the words on a line long enough to fill the row, and every
                  shorter capture left them stranded at the margin across a gap
                  of nothing. A line is only as wide as its own words, so its end
                  is where they stop.

                  ⚠ **`min-w-0` on the words is what keeps that true under flex
                  — 28 August.** A flex item that cannot shrink below its content
                  would push this off the row and out of the overflow that hides
                  the ellipsis. With it, the words give up exactly the width the
                  tail needs and stop where the tail begins, at any length.
                */}
                <LineUndo
                  undoable={line.id !== '' && line.id === undoable}
                  onUndo={undo}
                />

                {/*
                  ⚠ **The paper is gone, and it was here.** Every row carried
                  an invisible button filling whatever width the words did not
                  use, and tapping it started a capture. It existed for one
                  reason: the live line was the first thing in the document and
                  scrolled away, so the record had to be a way back to it.
                  **The live line is pinned now** — on screen at every scroll
                  position — so the paper was a second way to reach a thing
                  already in reach, and a large invisible target sitting beside
                  every line of the record.

                  What is left in the row is the words and the space beside
                  them, and the space does nothing. That is a page.

                  ⚠ **The line is still only as wide as its own words**, which
                  was a consequence of the paper rather than a decision of its
                  own. Left alone rather than quietly widened to the measure: a
                  full-width row is a bigger target for picking *and* a bigger
                  target for picking by accident, and that is a judgement for a
                  thumb rather than a tidy-up.
                */}
                </div>

                {/*
                  Full strength, at body size. There is no error colour in the
                  palette — §11 spends red on "you are here" and on a live
                  marker, and a third red would make both of those an alarm — so
                  weight and size carry it instead.
                */}
                {line.failed && (
                  <p className="pb-2">
                    {line.failed} <span className="text-muted">Tap the line to try again.</span>
                  </p>
                )}

                {/*
                  ⚠ **The record asks this only at the moment of capture — 30
                  August.** It used to ask it *live or picked*; the picked half
                  has moved into the console, where there is room to ask it under
                  the capture it is about rather than under a truncated line. The
                  live half stays here and cannot move: a question about the line
                  somebody just wrote has to arrive **visibly**, on the page they
                  are looking at, rather than behind a tap on a `?`.

                  ⚠ **`Ask` is the console's component, imported back.** One
                  question looks like one question wherever it is asked; two
                  copies would be two designs waiting to disagree.

                  ⚠ **Ignoring it is simply not answering**, which is why there
                  is no dismiss. Walking away leaves the `?` standing, and that
                  is the correct outcome for a question nobody wanted asked.
                */}
                {line.offer !== null && offering === line.id && (
                  <Ask
                    /*
                      The title, and the year when it has one — which is what
                      distinguishes two films of the same name and is the whole
                      of what somebody needs to answer. No poster: a picture is
                      a second claim, and the question is *is this the thing*,
                      not *do you like the look of it*.
                    */
                    ask={
                      line.offer.year !== null
                        ? `${line.offer.title} (${line.offer.year})?`
                        : `${line.offer.title}?`
                    }
                    onYes={() => acceptOffer(line)}
                    onNo={() => declineOffer(line)}
                  />
                )}

                {/*
                  ⚠ **THE RECORD ASKED *Again?* HERE FOR A DAY AND IT IS DELETED
                  — 30 August, the same day it was built.** It was the settle
                  swipe's question, drawn on the row the swipe was made on, and
                  it went when the swipe did: settling is the console's now, so
                  `asking` can only be set while a console is open and this branch
                  was unreachable rather than merely unused. See `askAgain`, and
                  `row-swipe.ts` for why the gesture went.

                  **What went with it**, and none of it should come back on its
                  own: the `!isOpen` guard that kept one question from being drawn
                  in two places at once, and the record's second reason to own a
                  copy of the console's `Ask`. The offer above is the only
                  question a row still asks, and it is the row's own — it arrives
                  unbidden from the provider, where settling is something somebody
                  went looking for.
                */}

                {/*
                  ⚠ **The console, inside the `<li>` of the line it belongs to,
                  and that is one mount point for two surfaces.** `console-sheet`
                  is `fixed` below `--breakpoint-stack` — a rectangle in the same
                  place every time, over the blurred record — and `static` at and
                  above it, where it expands this row in place. Directed 30
                  August; see `console.tsx` for the whole argument.

                  ⚠ **It is here rather than at the end of the document**, unlike
                  the writing strip, and it has to be: on the desk it is in flow
                  and its place in the record *is* the design. The handset's
                  `fixed` box does not care where it is mounted, so one position
                  serves both. Nothing between here and `main` carries a
                  transform, a filter or a `contain`, which is what would quietly
                  turn that `fixed` into a box positioned against an ancestor.

                  ⚠ **Mounted only while it is open, unlike the strip's field.**
                  The strip has to exist before the gesture that focuses it, or
                  iOS keeps the keyboard down; there is nothing to focus in here,
                  so a console that is not open is a console that is not there.
                */}
                {isOpen && (
                  <Console
                    line={line}
                    asking={asking === line.id}
                    crossedOff={crossedOff}
                    onCrossOff={() => crossOff(line)}
                    /*
                      Off while a rewrite is already open: reopening the line
                      would replace what is in the field with what is saved,
                      which is a discard nobody asked for.
                    */
                    onRewrite={editing === null ? () => startEdit(line) : null}
                    /* One owner for the question, wherever it is asked from. */
                    onSettle={() => askAgain(line)}
                    onAgain={() => settle(line, true)}
                    onDone={() => settle(line, false)}
                    onAcceptOffer={() => acceptOffer(line)}
                    onDeclineOffer={() => declineOffer(line)}
                    onOpenPhoto={() => setLooking(line)}
                    linkLabel={linkLabel}
                  />
                )}
              </li>
            )
          })}
        </ol>

        {/*
          ⚠ **The tail was a control, stopped being one, and is one again for a
          different reason.** It held a full-width button named "Write" — the
          announced way to raise a keyboard, back when the live line could be
          scrolled off the screen — and that went with the pin. What is here now
          is not a way to write; it is the record continuing.

          ⚠ **A word, on a page that says nothing.** Everywhere else the page
          refuses copy because a gesture already carries the meaning: the caret
          is the instruction, italic is the state, the mark is the pick. At the
          end of fifty lines there is **no** gesture that says *there is more* —
          scrolling has already stopped — so a door has to be drawn, and the
          smallest honest door is the word for what is behind it.

          ⚠ **In the day stamps' own type**, mono and muted, because this is the
          same furniture: the stamps are how the record is navigated by *roughly
          when*, and this reaches the days below the ones on screen. It is not a
          fourth use of a scarce face; it is the third one arriving at its tail.

          ⚠ **It exists only while there is more**, so a record under fifty lines
          never grows one and nobody is offered a door to nothing.
        */}
        {earlier !== null && (
          <button
            type="button"
            onClick={readEarlier}
            disabled={reading}
            /*
              ⚠ **The box is the target, which is what keeps it off the foot.**
              It shipped as a bare word with `tap-target`, whose 44px pseudo-
              element is centred on the text — so half of it hung *below* the
              word, and at the bottom of a scroll that half is under the foot.
              `page-hem` reserves the foot's height so a **line** comes to rest
              above the glyphs, and a line is 44px because `page-line` gives it a
              hem. This is a 14px word, so it needs the same thing said its own
              way: a box a thumb's height, with the word centred in it. Then the
              page's existing arrangement holds it clear with no special case.

              Measured before the change: the word's box ended at 799.9 and the
              foot began at 800.

              ⚠ **No top margin, and that is the box paying for it.** The day
              stamps carry `mt-[26px]` because their box hugs their text; half of
              this one is air already, and adding both would set the word adrift
              from the record it belongs to.

              `self-start` for the same reason a line is only as wide as its own
              words: a full-width target at the tail of the record is a large
              invisible button beside every scroll that overshoots.
            */
            className="stamp text-muted hover:text-text flex min-h-[var(--tap-floor)] items-center self-start transition-colors"
          >
            Earlier
          </button>
        )}

        {/*
          The failure, in the page's own voice: full strength, at body size,
          where the thing that failed is. There is no error colour in the
          palette — see the line-level message above.
        */}
        {readFailed !== null && (
          <p className="pt-2">
            {readFailed}{' '}
            <span className="text-muted">Tap Earlier to try again.</span>
          </p>
        )}

        {/*
          The end of the record, as a thing that can be observed — see
          `useChromeRecede`. Zero height, no paint, no hit area: it exists to be
          watched, the way `floorAnchor` exists to be measured.

          ⚠ **It sits inside `page-hem`'s padding rather than after it**, so it
          crosses into view when the last line does rather than when the reserved
          band under it does. The bars are wanted back at the end of the
          *record*, not at the end of the box holding it.
        */}
        <div ref={endMark} aria-hidden className="h-0" />
      </main>

      {/*
        ⚠ **One set of props, two placements, and the props are built once.**
        `Foot` is the bar under the record below `--breakpoint-stack` and
        `ToolStack` is the column beside it above — the CSS decides which is on
        screen, so neither placement can be given a different set of states than
        the other. Cross off and rewrite are not here any more; they went to
        `LineTools`, on the line they act on.
      */}
      {/*
        ─────────────────────────────────────────────────────────────────────
         The writing sheet — 27 August
        ─────────────────────────────────────────────────────────────────────

        **The field is summoned, and it arrives on the bottom edge of the
        glass.** It was a row pinned under the bar, always on screen and always
        one line tall; the report that closed that design was that a capture
        longer than the column scrolls sideways inside it and cannot be scrolled
        back — because **a drag inside a focused single-line field means
        caret-and-selection on every engine**, not panning. See `writing-sheet`
        in globals.css for the measurements and the whole argument.

        ⚠ **Mounted at all times, translated off the glass when closed.** iOS
        raises a keyboard only for a focus that happens inside the gesture that
        asked for it, so there has to be something to focus *before* anything
        re-renders. The `+` focuses this synchronously and then opens the sheet —
        see `openSheet`. Do not make this conditional.

        ⚠ **It is the last thing in the document**, which is where it is on the
        screen. The pinned band came before the record because it was above it.

        ⚠ **`z-10`: over the scrim, under the two bars.** Nothing about the
        record may come up over the field.
      */}
      {/*
        ─────────────────────────────────────────────────────────────────────
         One strip, two states — 28 August
        ─────────────────────────────────────────────────────────────────────

        **The glyph row and the writing line are the same strip on the bottom
        edge of the glass.** Directed: *the row at the bottom that contains the
        glyphs should simply swap out the glyphs for the live row.* It was two
        objects sharing that edge — a 44px foot bar and a 36px sheet — so
        starting a capture changed the shape of the bottom of the screen, and
        four rounds of *a tad more* / *a tad less* were really that.

        ⚠ **The box never changes; the contents and the ground do.** The strip is
        `--line-hem` + `--leading-line` + `--line-hem` = 44px — a row of the
        record, `--tap-floor`, and what the foot already measured on a handset.
        Idle it is glass, with the record dissolving under the glyphs; writing it
        is opaque and lit, because it holds body text at the record's own size
        and a line showing through would read as a second line of the capture.

        ⚠ **It moves between two positions and that is the one thing it does
        move.** Idle it sits on the bottom edge; writing it rides
        `--keyboard-overlap`, because the field is the one thing that wants the
        keys' top edge and the foot deliberately never did — see
        `keyboard-hem.ts` for the five wrong versions of holding a bar there. The
        notch expression in `writing-sheet` covers both ends: the home indicator
        is cleared on the glass and the term collapses to zero on the keys.

        ⚠ **Above `--breakpoint-stack` there is no glyph row**, because the tools
        stand beside the column — so up there the strip is the field alone and is
        translated off the glass when idle, exactly as the sheet always was. That
        layout is untouched.

        ⚠ **`z-20`, which was the foot's.** The strip carries controls that must
        stay over the record, and the scrim is `z-5` under it.
      */}
      <div
        ref={sheet}
        className={`writing-sheet z-20 transition-[translate] duration-[var(--recede)] ease-[var(--ease-recede)] ${
          writing
            ? 'sheet-lit'
            : `stack:pointer-events-none stack:translate-y-full bg-[var(--glass-tint)] backdrop-blur-[var(--glass-blur)] ${
                receded ? 'pointer-events-none translate-y-full' : ''
              }`
        }`}
      >
        {/*
          ⚠ **`--record-measure` — the same token, the same `gutter` and the same
          `mx-auto` as the record's own column in `main` — 29 August.** Directed:
          *the start of the writing line always aligns with the entry column.*
          The only way to mean *always* is for there to be one column: two
          measures agree at the widths somebody checks and part company at the
          mark's band, where the record narrows and nothing else does.

          ⚠ **This is the field's width, never the ground's.** The strip spans
          the window and always has; what was 54rem was the words in it, starting
          under the `+` in the tool stack rather than under the first character
          of the lines they join. See the deleted `--sheet-measure`.

          Below the desk the viewport is narrower than either, so `w-full` and
          `gutter` decide it exactly as they did.
        */}
        <div className="gutter mx-auto w-full max-w-[var(--record-measure)]">
          {/*
            ⚠ **The chips sit beside the field and the field gives up the
            width**, exactly as they did on the pinned row. The field is one line
            and stays one line, so there is no *first* line to align to any more
            — it is the line, and `items-center` puts them on it.
          */}
          {/*
            ⚠ **`sheet-row`, not `page-line` — 28 August.** Directed: on a
            handset the writing box should be only as tall as the one line it
            holds. Everything about the type is identical to a line of the record
            and must stay so — same face, size, leading and tracking, which is
            what has kept the page from jumping on Return since the pinned band.
            **Only the air differs**, and only below `--breakpoint-stack`: the
            hem is `--sheet-hem`, which is zero on a handset and `--line-hem` on
            the desk. The row is then 28px on glass and 44px on a desk.

            ⚠ **The hem still belongs to the row, wherever it is not zero.** Put
            it on the field's own wrapper instead and every chip sits a hem too
            high, because `sheet-glyph` centres on the row's line box.

            ⚠ **The chips wear `sheet-glyph`, and that is what makes the short box
            free.** `line-glyph` splits its 44px hit area evenly above and below
            the line; with no hem to land in, the lower half would sit on the
            keyboard and be untappable. `sheet-glyph` hangs the whole of it
            upward over the scrim instead — same 44px, same invisible box,
            somewhere it can be reached. **A hit area does not have to be inside
            the box it belongs to**, which is the whole reason the height and the
            tap floor are not in tension.
          */}
          {/*
            ⚠ **A one-cell grid, and it is what makes the strip constant.** The
            field row and the glyph row are both at `1 / 1`, so the cell is as
            tall as the taller of them — 28px, the line — and swapping which one
            is visible cannot resize anything. Neither may be unmounted or set to
            `display: none`; they fade.
          */}
          {/*
            ⚠ **`sheet-writing` lowers the row’s air while the field is up — 30
            August.** The strip is shorter writing than idle, which the one-strip
            rule of 28 August forbade; it was directed, and the argument is in the
            utility. The class is on the ROW and not on the sheet, because what
            changes is the air around one line, not the sheet’s clearance or its
            ground.
          */}
          <div className={`sheet-row grid ${writing ? 'sheet-writing' : ''}`}>
          <div
            className={`col-start-1 row-start-1 flex items-center transition-opacity duration-[var(--recede)] ease-[var(--ease-recede)] ${
              writing ? '' : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="relative min-w-0 flex-1">
              <input
                ref={input}
                type="text"
                /*
                  ⚠ **`dir="auto"` and not a hardcoded direction.** The value
                  slides out of the *start* edge as the caret reaches the end,
                  and which edge that is comes from the first strong character
                  typed — left under English, right under Arabic or Hebrew. One
                  standard attribute instead of a locale branch. See the field's
                  own docblock.
                */
                dir="auto"
                value={bandValue}
                onChange={(e) => {
                  if (editing !== null) setEditDraft(e.target.value)
                  else setDraft(e.target.value)
                }}
                /*
                  ⚠ **A paste that is a link lands on the line, not in it.** See
                  `liftLink` for why it has to be the *whole* clipboard: pulling a
                  URL out of pasted prose would edit words somebody meant to keep.
                */
                onPaste={(e) => {
                  if (editing !== null) return
                  const lifted = liftLink(e.clipboardData.getData('text/plain'))
                  if (!lifted) return
                  e.preventDefault()
                  setLink(lifted)
                }}
                /*
                  ────────────────────────────────────────────────────────────
                   **Losing focus is leaving — 30 August**
                  ────────────────────────────────────────────────────────────

                  ⚠ **Reported on both handset surfaces: tap the field, then tap
                  *Done* on the keyboard's accessory bar — the keys go and the
                  row stays, sitting on the bottom edge with the drawn caret
                  still blinking in it.** Every other way out was wired to a
                  gesture the page could see: Return to `onKeyDown`, a tap
                  outside to the scrim's `onClick`, `Escape` to the key. iOS's
                  own dismiss is none of those — it takes the focus and says
                  nothing else — so `writing` stood with no keyboard under it,
                  which is the same wrong state a resume used to leave behind.

                  ⚠ **So the mode is tied to the one fact that is true of all
                  four: the field has focus.** The sheet is open exactly while
                  it does, and anything that takes it away closes the sheet and
                  lands the words, which is what the two exits already did.
                  There is no keyboard detector in this and there must not be —
                  `--keyboard-overlap` measures a gap that opens and closes as a
                  Safari tab's address bar collapses, and reading it as *a
                  keyboard is up* is a bug this page has already shipped once.
                  See `useKeyboardHem`.

                  ⚠ **`relatedTarget` inside the sheet is not leaving.** The
                  chips beside the field take focus on a desk click, and losing
                  the sheet because somebody reached for attach would be worse
                  than the bug this fixes. iOS does not focus a button on tap at
                  all, so there the field never blurs for one.

                  ⚠ **A blur with nowhere to go is the dismiss**, and that is the
                  case with `relatedTarget` `null`: the accessory bar's Done, and
                  the drag-down over the keys.
                */
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null
                  if (next && sheet.current?.contains(next)) return
                  leave()
                }}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return
                  /*
                    ⚠ **Return commits.** It had to be *told* not to insert a
                    newline while this was a textarea; an `<input>` refuses one
                    by nature, so the `preventDefault` is belt as well as braces
                    and the commit is the part that matters. One line is one
                    capture: a capture with a line break in it is two things
                    somebody meant to say separately, and the matching path would
                    treat the pair as one string forever after. `isComposing` is
                    the exception — the Return that closes an IME candidate
                    window is not this Return.

                    ⚠ **The field slides; it does not wrap and it does not
                    break.** The value scrolls under the caret when it reaches
                    the end of the row, which is the engine's own behaviour for a
                    one-line field. See the field's docblock for what that costs
                    on a handset and why it was accepted.
                  */
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    leave()
                  }
                  /*
                    ⚠ **`Escape` is the one exit that discards, and it belongs to
                    the field.** It must not call `blur()`: blur is synchronous,
                    so the discard would race the exit that performs it.
                  */
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    discard()
                  }
                }}
                enterKeyHint="enter"
                inputMode="text"
                autoCapitalize="sentences"
                autoCorrect="on"
                autoComplete="off"
                spellCheck
                /*
                  Named for a screen reader and **not placeheld on screen**: a
                  word sitting in the field would be the app talking over the one
                  gesture it wants.
                */
                aria-label={editing === null ? 'Capture' : 'Rewrite this capture'}
                className={`page-input ${
                  drawnCaret ? 'caret-transparent' : 'caret-chrome'
                }`}
              />

              {/*
                ⚠ **`start-0`, not `left-0` — 28 August.** The field takes its
                direction from what is typed into it, and an empty one falls back
                to the page's. A caret pinned to the *left* would be at the wrong
                end of an empty field on an RTL page; `inset-inline-start` is the
                end the writing begins at, whichever that is.
              */}
              {drawnCaret && (
                <span
                  aria-hidden
                  className="animate-caret bg-chrome pointer-events-none absolute top-1/2 start-0 h-[var(--caret-height)] w-[var(--caret-width)] -translate-y-1/2"
                />
              )}
            </div>

{photo && (
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Take the photograph off"
                className="sheet-glyph tap-target ms-2 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
                <img
                  src={photo.url}
                  alt=""
                  className="size-[var(--thumb)] rounded-[3px] object-cover"
                />
              </button>
            )}

{link !== null && (
              <button
                type="button"
                onClick={() => setLink(null)}
                aria-label={`Take the link to ${linkLabel(link)} off`}
                className="sheet-glyph text-chrome ms-2 shrink-0 gap-1 rounded-full bg-[var(--glass-tint)] px-2 text-[0.8125rem] leading-none [--glyph:0.875rem]"
              >
                <LinkGlyph />
                {linkLabel(link)}
              </button>
            )}

<button
              type="button"
              disabled={!imagesOn}
              onClick={() => camera.current?.click()}
              aria-label="Attach a picture"
              className={`sheet-glyph ms-2 shrink-0 transition-colors [--glyph:var(--glyph-line)] ${
                imagesOn ? 'text-chrome' : OFF
              }`}
            >
              <AttachGlyph />
            </button>
          </div>

          {/*
            ⚠ **The other state of the strip, in the same cell.** The foot used
            to be a `fixed` bar of its own on this same edge and it *receded*
            while somebody wrote — see the note this replaces. It does not
            recede; it fades, in place, and the strip stays exactly where it is.

            **None of the three is wanted while somebody is writing**, and the
            `+` least of all, since it is a second door to the thing already
            open. That rule is unchanged. What changed is that acting on it costs
            no movement.
          */}
          <Foot hidden={writing} {...tools} />
          </div>
        </div>
      </div>

      <ToolStack {...tools} />

      {/*
        ⚠ **A file input, hidden, driven by the foot's glyph.** The camera is a
        control on a bar that is glass over the record; a visible `<input
        type="file">` is the one element in HTML whose appearance no stylesheet
        can fully take, so the drawing is the glyph and this is the mechanism
        behind it.

        ⚠ **`accept` names three types rather than `image/*`, and that is what
        makes an iPhone convert.** Safari hands over HEIC for `image/*`, and
        decoding HEIC needs a native codec this project will not carry — naming
        the three transcodes on the way out, which puts the conversion before the
        photograph rather than a failure after it.

        ⚠ **No `capture` attribute.** It would force the camera and take away the
        library, and *the poster I saw last week* is at least as likely as the one
        in front of you.
      */}
      <input
        ref={camera}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          /* Same file twice in a row: without this the second pick is no event. */
          e.target.value = ''
          if (!file) return
          clearPhoto()
          const url = URL.createObjectURL(file)
          previews.current.add(url)
          setPhoto({ file, url })
          /* The caret is waiting, which is the whole of the caption step. */
          openSheet()
        }}
      />

      {/*
        **The picture, opened.** A takeover rather than a route: the record is
        one page and looking at a photograph is not going somewhere.

        ⚠ **Anywhere closes it**, because there is nothing else on the screen to
        aim at and a close control would be the only chrome in a view whose whole
        content is one picture.
      */}
      {looking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photograph"
          onClick={() => setLooking(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLooking(null)
          }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
          className="fixed inset-0 z-30 flex items-center justify-center bg-[var(--scrim-tint)] p-6 backdrop-blur-[var(--scrim-blur)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a private route, not a CDN */}
          <img
            src={looking.previewUrl ?? `/api/media/${looking.id}`}
            alt={looking.text}
            className="max-h-full max-w-full rounded-[3px] object-contain"
          />
        </div>
      )}

      {/*
        Nothing is said about an empty page, deliberately. The caret is the
        instruction, and a line of prose explaining that this is where you type
        would be the app talking over the one gesture it wants.
      */}
      {empty && <span className="sr-only">Nothing captured yet.</span>}
    </div>
  )
}
