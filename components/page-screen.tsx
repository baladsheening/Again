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
import { mutationId as newMutationId } from '@/lib/mutation-id'
import { Bar, OFF } from './bar'
import { useChromeRecede } from './chrome-recede'
import { Foot, ToolStack } from './foot'
import { AttachGlyph, CrossOffGlyph, LinkGlyph, RewriteGlyph, UndoGlyph } from './glyphs'
import { useKeyboardHem } from './keyboard-hem'
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
 * **One question, two answers**, and the page asks exactly two kinds: *Again?*
 * when a line is settled, and *is this what you meant?* when a possibility is
 * offered.
 *
 * ⚠ **The offer reuses the settle pair rather than inventing an accept
 * control**, which the design asks for by name — and it reuses it by being the
 * same component, so the two cannot drift into looking like different kinds of
 * question. They are not: both are one line of the record asking the person who
 * wrote it to decide something, and both are answerable by ignoring them.
 *
 * `gap-5` on a coarse pointer because Yes and No both carry a 44px hit area and
 * at `gap-4` the two expansions meet in the middle.
 */
function Question({
  ask,
  onYes,
  onNo,
}: {
  ask: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 pb-3 pointer-coarse:gap-5">
      <span className="text-sm">{ask}</span>
      <button
        type="button"
        onClick={onYes}
        className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className="text-muted hover:text-text tap-target text-sm transition-colors"
      >
        No
      </button>
    </div>
  )
}

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
 *  The line's own slot — 25 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed: the undo belongs beside the line it takes back, and when its ten
 * seconds pass that same slot carries the two controls that act on a **picked**
 * line — cross off and rewrite. One slot, three states, and never two of them at
 * once.
 *
 * ⚠ **It answers the confusable moment the bar's undo had written down and left
 * open.** For ten seconds after a line landed, the bar's undo and the foot's ×
 * were both lit and both acted on it, with nothing saying that one erases and
 * the other strikes through. They are the same slot now, in sequence rather than
 * side by side: while the window is open the slot is undo, and it becomes cross
 * off the moment undo stops being possible. The pair can no longer be seen
 * together, which is a stronger answer than the colour the note proposed.
 *
 * ⚠ **Absent until the line is picked, and this is settled.** They were shown on
 * every line for an hour and taken back off: a record of two hundred lines each
 * carrying two glyphs is the density device inverted, which was the objection
 * before it was tried and the answer after. *Controls go off; they do not
 * disappear* stays the **two bars'** rule; on the line, absent is the off state.
 *
 * ⚠ **Immediately after the words, which is what "the end of the entry" means.**
 * `ms-auto` put them at the end of the *row* for an hour and the report was
 * immediate — a short line left its controls stranded out at the margin with a
 * gap of nothing between. A line is only as wide as its own words, so the end of
 * the entry is where the words stop.
 *
 * ⚠ **A crossed-off line offers one control and it is the way back.** Cross off
 * is a resolution, not a delete — the row stays where it is, struck through —
 * and while it is struck the other two would be acting on something somebody has
 * said they are done with. Rewriting words that are crossed out is editing a
 * decision rather than a capture.
 *
 * ⚠ **The rewrite *goes*, rather than going off**, and that is the same rule as
 * the slot itself: on the line, absent is the off state. A dark pencil beside a
 * struck line would be the record explaining what it is refusing; nothing there
 * is the record showing one way back, which is the × that put it there. It
 * returns the moment the strike is undone.
 *
 * ⚠ **It must not set the height of the row.** One line is one line: the glyph
 * is `--glyph-line`, the padding buys a hit area and the negative margin gives
 * the height back, so what the row measures is the drawing and what a thumb gets
 * is bigger than it.
 */
function LineTools({
  undoable,
  picked,
  crossedOff,
  onUndo,
  onCrossOff,
  onRewrite,
}: {
  /** This line is the one inside its ten seconds. */
  undoable: boolean
  /** This line is the picked one. */
  picked: boolean
  crossedOff: boolean
  onUndo: () => void
  onCrossOff: () => void
  /** `null` while a rewrite is already open — reopening would discard it. */
  onRewrite: (() => void) | null
}) {
  if (!undoable && !picked) return null

  return (
    /*
      ⚠ **`line-glyph`, not `align-middle` — 26 August.** A handset read the undo
      as sitting low, and it was: `middle` centres a box on the *parent's*
      x-height, so this was being centred on a lowercase x while sitting beside
      the line's words. The utility makes the box the line box and top-aligns it,
      which puts the glyph on the line's own centre with no number in it. See
      `line-glyph` and `page-row` in globals.css.
    */
    <div className="line-glyph ms-3 shrink-0 gap-2 [--glyph:var(--glyph-line)]">
      {undoable ? (
        <button
          type="button"
          onClick={onUndo}
          aria-label="Undo the last capture"
          className="text-chrome flex items-center"
        >
          <UndoGlyph />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onCrossOff}
            aria-label={crossedOff ? 'Put it back' : 'Cross it off'}
            className="text-chrome flex items-center"
          >
            <CrossOffGlyph />
          </button>
          {/* Gone while the line is struck, not dark — see the note above. */}
          {!crossedOff && (
            <button
              type="button"
              disabled={!onRewrite}
              onClick={() => onRewrite?.()}
              aria-label="Rewrite it"
              className={`flex items-center ${onRewrite ? 'text-chrome' : OFF}`}
            >
              <RewriteGlyph />
            </button>
          )}
        </>
      )}
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
  const [picked, setPicked] = useState<string | null>(null)
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
   * ⚠ **A `<textarea>` since 27 August, and it is mounted at all times.**
   *
   * Multi-line, because the field is no longer a row of the page: a capture
   * longer than the column wraps in the sheet instead of scrolling sideways
   * inside a box it cannot be panned out of. Return still commits — see the key
   * handler, which has always refused a newline.
   *
   * ⚠ **Mounted even while the sheet is closed, and that is load-bearing.** iOS
   * raises a keyboard only for a focus that happens *inside* a user gesture, and
   * a component mounted by a state change is focused a tick too late. So the
   * field exists from the first paint, off the bottom of the glass, and the
   * `+`'s own click handler focuses it synchronously before anything is asked
   * to render. See `openSheet`.
   */
  const input = useRef<HTMLTextAreaElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const floorAnchor = useRef<HTMLDivElement>(null)
  /** The writing sheet, for nothing but a name in the DOM to aim probes at. */
  const sheet = useRef<HTMLDivElement>(null)
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
    ⚠ **A picked line is the hold, and focus deliberately is not.** The foot is
    the picked line's toolbar, so it cannot be off screen while one is picked.
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
    held: picked !== null,
    writing,
    top: topMark,
    end: endMark,
  })

  const pickedLine = lines.find((l) => l.id === picked) ?? null

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
    ⚠ **The field grows again since 27 August, and it is not the mechanism that
    was deleted.** A `scrollHeight`-driven textarea used to live here and went
    with the pinned band; what replaced it is `grow-field`, a one-cell grid
    sized by a ghost copy of the same text. **No measurement, no `el.style`
    write, no resize loop, and no engine feature to wait for.**

    What made growing wrong before was where it grew: a row in the page's own
    flow shoved the record down while somebody was typing. A sheet is not in the
    flow, so the objection went with the band.
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
    The live line carries `autoFocus`, so the page comes back in its resting
    state; the caret is at the top and the record beneath it, so scrolling to
    the top loses no position. This page was built to be re-entered. It also
    picks up new code, which is the same stale-document problem wearing its
    other hat — the force-quit an installed build otherwise needs.

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
    picked === null &&
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
  const onResume = useRef<() => void>(() => {})
  useEffect(() => {
    onResume.current = () => {
      if (settled) {
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
    setPicked(null)
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
   * ⚠ **The pick is kept, deliberately.** The band holds the words but the
   * record holds the line, and the mark stays on the row they came from — so
   * the foot is still that line's toolbar and `release` still has something to
   * release. That is why the field's own `onFocus` no longer clears the pick;
   * see `live`.
   *
   * ⚠ **`focus()` inside the gesture, which is what raises the keyboard.**
   * Picking blurred the field (*the keyboard follows liveness*), so this is a
   * real focus inside a real tap and iOS treats the keyboard as the gesture's
   * own consequence. It is also why nothing here can be done in an effect.
   *
   * ⚠ **Never a line that is not on the server yet.** A pending line has no id
   * to name in the mutation, and a failed one wants its retry rather than an
   * edit — `pick` already routes that case.
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
    input.current?.focus({ preventScroll: true })
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
  /*  The foot's two live controls                                      */
  /* ------------------------------------------------------------------ */

  function crossOff(line: Line) {
    const crossedOff = line.state === 'dropped'
    const next: EntryState = crossedOff ? 'want' : 'dropped'
    mark(line.key, { state: next, failed: null })
    setAsking(null)

    void crossOffCaptureAction(line.id, !crossedOff).then((result) => {
      if (!result.ok) mark(line.key, { state: line.state, failed: result.message })
    })
  }

  function settle(line: Line, again: boolean) {
    setAsking(null)
    setPicked(null)
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
   * **Letting the picked line go.** Always both, because `asking` belongs to the
   * picked line and outlives it otherwise — every other `setPicked(null)` on
   * this page already travels with its `setAsking(null)`, and this is that pair
   * given a name rather than a fifth copy.
   */
  function release() {
    /*
      ⚠ **An open rewrite commits on the way out, and this is a belt.** The
      writing pane is over the record for as long as a line is open — it takes
      the touch — so `main` cannot receive a click then and this cannot fire
      with an open rewrite. It stays because the rule it states is the rule:
      leaving by the paper must never be the exit that discards. `commitEdit`
      writes nothing when nothing changed and nothing at all when nothing is
      open, so it costs a comparison.
    */
    commitEdit()
    setPicked(null)
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
   * handler is two `setState` calls rather than `release()`. `release` commits an
   * open edit on its way out, so it holds the draft — and a document listener
   * that mounted a keystroke ago would hold an old one. The listener not existing
   * while a line is open is what makes that unreachable rather than merely
   * unlikely.
   */
  useEffect(() => {
    if (picked === null || editing !== null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return
      setPicked(null)
      setAsking(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [picked, editing])

  /**
   * ⚠ **Tapping the words picks the line, and that is all it ever does.** A
   * second tap used to open the words for rewriting; it does not any more. The
   * foot's pencil is the one door to a rewrite, so the gesture and the control
   * cannot disagree about what a tap on a line means — and a tap that changes
   * meaning the second time it lands is the modifier gesture this page's header
   * rules out, wearing a different coat.
   *
   * ⚠ **A second tap is therefore a no-op, deliberately, rather than a
   * release.** Letting go is a tap on the paper (or `Escape`), and it has to
   * stay the *inverse* of picking rather than a second reading of the same
   * target — otherwise a thumb that lands twice on a line it meant to settle
   * un-picks it and darkens the foot it was aiming for.
   *
   * ⚠ **A line already open is not re-picked.** Tapping the words of the line
   * you are rewriting is a tap on a row whose words are in the band, and it must
   * leave both alone.
   */
  function pick(line: Line) {
    if (line.pending) return
    if (line.failed) {
      retry(line)
      return
    }
    if (editing === line.id) return
    if (picked === line.id) return
    /* Moving to another line closes whatever was open, and keeps its words. */
    commitEdit()
    setPicked(line.id)
    setAsking(null)
    /* The keyboard follows liveness: gone the moment a saved line is picked. */
    input.current?.blur()
  }

  const empty = lines.length === 0

  /**
   * **The three tools, built once and handed to both placements.**
   *
   * ⚠ **Built here rather than inline on each**, because `Foot` and `ToolStack`
   * are the same set in two arrangements and the states must be identical. Two
   * inline prop lists is how a bar and a stack start disagreeing about whether
   * settle is lit.
   */
  const tools = {
    /*
      ⚠ **Never null.** Every other entry here can be off, because every other
      entry needs something to act on. There is nowhere a capture cannot be
      started, so this is the one control on the page that is always lit — and on
      an empty record it is the only one.
    */
    write: openSheet,
    /*
      A crossed-off line cannot be settled: `resolveCapture` guards on `want`,
      which makes the settleable set exactly the resolvable one, and the way back
      is the × that put it there.
    */
    settle:
      pickedLine && pickedLine.state === 'want'
        ? () => setAsking((open) => (open === pickedLine.id ? null : pickedLine.id))
        : null,
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
  function openSheet() {
    input.current?.focus({ preventScroll: true })
    setWriting(true)
    setPicked(null)
    setAsking(null)
  }

  /**
   * **Leaving the sheet, which always commits.**
   *
   * ⚠ **There are two exits and neither discards.** Return and a tap on the
   * scrim, and both land the words — because the words on screen are the words
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
    if (editing !== null) {
      abandonEdit()
    } else {
      setDraft('')
      setLink(null)
      clearPhoto()
    }
    done()
  }

  function leave() {
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
   * ⚠ **`blur()` fires `onBlur` synchronously, which calls `commitEdit`** — a
   * no-op here, because `commit` is only ever reached while `editing` is
   * `null` and `commitEdit` returns on that first line.
   *
   * ⚠ **Safe against the hem, because `commit` has already scrolled to the
   * caret.** Dropping `writing` unmounts `useKeyboardHem`, whose cleanup takes
   * `--keyboard-overlap` and the band's correction off while an iOS keyboard is
   * still animating away. At `scrollY` 0 the visual viewport starts where the
   * layout one does, so the band's correction is already the empty string and
   * the hem is padding at the foot of a page nobody is looking at the foot of.
   */
  function done() {
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
    <div ref={host}>
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

        ⚠ **Under the band and under the two bars**, so everything that can act
        stays sharp and stays tappable: `z-5` against the band's `z-10` and the
        bars' `z-20`.

        ⚠ **Inert when it is not wanted.** No blur is applied and no pointer is
        taken unless the line has focus — a full-viewport `backdrop-filter` left
        armed at zero opacity is a compositing layer the scrolling page pays for
        and never sees.
      */}
      <div
        aria-hidden
        onClick={leave}
        className={`fixed inset-0 z-5 transition-opacity duration-[var(--recede)] ease-[var(--ease-recede)] ${
          writing
            ? 'bg-[var(--scrim-tint)] opacity-100 [touch-action:none]'
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
        ⚠ **The paper lets the picked line go, and that is the only thing it
        does.** Picking had no inverse: `pick` is not a toggle, so re-tapping the
        words re-picks them, and every other exit — Return, crossing off,
        settling, reaching up to the live line — is somebody deciding something
        rather than deciding *nothing*. Tapping beside a selection to drop it is
        the one gesture everybody already has, and the page was ignoring it.

        ⚠ **It does not raise the keyboard, and that is deliberate rather than
        unfinished.** Paper as a way to *start writing* was built and removed —
        see the foot's note above: the live line is pinned, so a second way to
        reach it was a second way to reach something already in reach. Nothing
        here reopens that. Picking blurs the field on purpose (*the keyboard
        follows liveness*), so the gesture that undoes a pick has to land back in
        the browsing state it came from, not overshoot into writing.

        ⚠ **A tap that reached a control is that control's.** One rule instead of
        a `stopPropagation` in every handler — the words, the settle buttons, the
        input and anything added later are all covered by the same line, and none
        of them has to remember this exists.
      */}
      <main
        onClick={(e) => {
          if (picked === null) return
          if (
            e.target instanceof Element &&
            e.target.closest('button, input, a, [role="button"]')
          ) {
            return
          }
          release()
        }}
        className="gutter page-hem mx-auto flex min-h-[calc(100svh_+_env(safe-area-inset-top))] w-full max-w-[var(--page-measure)] flex-col pt-[calc(var(--bar-height)+var(--page-lead))]"
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
            const isPicked = line.id !== '' && line.id === picked

            /*
              ⚠ **The last word is split off the rest, and it is the only thing
              that keeps the line's tail on the line.** Everything after the
              words — the thumbnail, the link, the controls — is an *atomic*
              inline: it cannot fragment, so when the last line of a capture ends
              with less room than the tail needs, the whole cluster goes to a line
              of its own at the left margin, where it reads as a separate entry.

              Four ways to stop that were built and measured, and three do not
              work. `padding-inline-end` on the words hangs past the column
              instead of forcing a break (measured: 407px of padding on a 358px
              column). The same padding on an empty spacer contributes nothing at
              all. A `U+2060` word joiner does not suppress the break across an
              element boundary. And a `white-space: nowrap` wrapper is overridden
              by the `normal` the words need for their own text.

              What works is binding the last word to the tail inside one nowrap
              box: when the pair will not fit, the **word** comes down with the
              glyphs and they are still immediately after the last character.
              `node_modules/.probe/keepwith.mjs` is the measurement.
            */
            const cut = line.text.lastIndexOf(' ')
            const head = cut === -1 ? '' : line.text.slice(0, cut + 1)
            const lastWord = cut === -1 ? line.text : line.text.slice(cut + 1)

            /*
              **One control per line, and it is named with the whole capture.**
              The split is a layout device, so it must not reach the a11y tree as
              two buttons and two tab stops per line. The half that carries the
              role is labelled with everything the line says — including the year
              or the standing question, which a reader would otherwise get as a
              bare `?` — and the other half is `aria-hidden` with the same click,
              so a thumb sees one target and a reader sees one control.
            */
            const label =
              line.year !== null
                ? `${line.text} ${line.year}`
                : line.offer !== null
                  ? `${line.text} — is this ${line.offer.title}?`
                  : line.text

            const pickable = {
              role: 'button' as const,
              tabIndex: 0,
              'aria-label': label,
              'aria-current': isPicked ? ('true' as const) : undefined,
              onClick: () => pick(line),
              onKeyDown: (e: ReactKeyboardEvent<HTMLSpanElement>) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                /* Space scrolls the page otherwise, which a button never does. */
                e.preventDefault()
                pick(line)
              },
            }
            /* The same target to a thumb, silent to a reader. */
            const quiet = { 'aria-hidden': true, onClick: () => pick(line) }

            /*
              ⚠ **Both halves of the words wear this, from one place.** They are
              one line as far as anybody looking at them is concerned, so a
              strike or a landing that reached only one of them would be the
              split becoming visible. `cursor-default` and `select-none` are what
              a `<button>` gave for free and a span does not: an I-beam over a
              line that cannot be typed into is the same lie as a caret on it.

              ⚠ **No type here.** It was `page-words` until 26 August; the line's
              size, leading and tracking live on the row now, so the words
              inherit them — and so does every glyph that has to align against
              them, which is what that move was for.
            */
            const words = `inline cursor-default select-none ${
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

                  ⚠ **The hem and the picked mark moved up here with it.**
                  `page-line`'s `padding-block` is what set a row's height while
                  the words were a block; on an inline box it does not, so this
                  takes the hem. The mark hangs off `picked`, which is
                  `position: relative` with an absolutely placed `::before` — on
                  an inline box that spans two lines it would resolve against the
                  first fragment, so it belongs to the row, which is what its own
                  note always said it was measuring.

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
                  className={`page-row ${isPicked ? 'picked' : ''}`}
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
                  ⚠ **A span, because a `<button>` cannot be inline — and that
                  is the whole of the bug this replaced.** The row was made
                  inline flow on 25 August so the controls would follow the last
                  character, and the words kept `display: inline` on a
                  `<button>`. Engines refuse it: the computed display comes back
                  `inline-block`, so the words never fragment, the box is as wide
                  as the whole column, and the tail lands after the *box* —
                  which is the flex behaviour that change set out to remove,
                  reached by another road. Measured side by side in
                  `node_modules/.probe/inlinebutton.mjs`: `<button>` gives one
                  fragment 358px wide and the glyphs at x=12 on the next line;
                  `<span>` and `<a>` give two fragments and the glyphs at x=186,
                  immediately after the last character.

                  ⚠ **This is why `text-start` is gone with it.** It was undoing
                  a `<button>`'s centred UA text — a span has nothing to undo,
                  and the row already reads its alignment from the page.
                */}
                {head !== '' && (
                  <span {...pickable} className={words}>
                    {head}
                  </span>
                )}

                {/*
                  ⚠ **The binding.** The last word and everything after it sit in
                  one box that cannot break, so the glyphs can never be left
                  behind on a line of their own — see the note where `lastWord`
                  is cut for the three mechanisms that do not work.
                */}
                <span className="whitespace-nowrap">
                <span
                  {...(head === '' ? pickable : quiet)}
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
                    ⚠ **`inline`, which is the whole of this change.** A
                    block-level box ends its own line, so anything after it
                    starts a new one or sits beside the *box*; an inline box ends
                    where its last character does, and the controls follow it
                    there. It is also what lets `line-through` run across every
                    fragment of a wrapped capture rather than across a rectangle.
                  */
                  className={words}
                >
                  {lastWord}
                  {/*
                    ⚠ **`leading-none`, and it is the difference between 44px and
                    46px.** A 13px span inheriting the line's 28px line-height
                    gets its own half-leading — (28 − 15.6)/2 against the 18px
                    strut's (28 − 21.6)/2 — so its inline box hangs ~2px below
                    the strut and grows the line box under it. **One line is one
                    line**, whether or not it resolved to something, so the
                    year's box is made smaller than the strut rather than left to
                    push it about.
                  */}
                  {line.year !== null && (
                    <span className="text-muted ms-2 text-[0.8125rem] leading-none">
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
                      className="text-muted ms-2 text-[0.8125rem] leading-none"
                      title={`Is this ${line.offer.title}?`}
                    >
                      ?
                    </span>
                  )}
                </span>

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
                      className="text-muted ms-2 inline align-middle line-through opacity-50 [--glyph:var(--glyph-line)] [&>svg]:align-middle"
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
                */}
                <LineTools
                  undoable={line.id !== '' && line.id === undoable}
                  picked={isPicked}
                  crossedOff={crossedOff}
                  onUndo={undo}
                  onCrossOff={() => crossOff(line)}
                  /*
                    Off while a rewrite is already open: reopening the line would
                    replace what is in the field with what is saved, which is a
                    discard nobody asked for.
                  */
                  onRewrite={editing === null ? () => startEdit(line) : null}
                />
                </span>

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
                  ⚠ **Shown in full while the line is live or picked**, and as
                  the `?` above the rest of the time. *Live* is the moment of
                  capture — so a question arrives visibly rather than as a mark
                  somebody has to notice — and *picked* is the line being pointed
                  at, which is when somebody is deciding about it anyway.

                  ⚠ **Ignoring it is simply not answering**, which is why there
                  is no dismiss. Walking away leaves the `?` standing, and that
                  is the correct outcome for a question nobody wanted asked.
                */}
                {line.offer !== null && (isPicked || offering === line.id) && (
                  <Question
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

                {asking === line.id && (
                  /*
                    ⚠ **One question, and the word is *Again?*** The two outcomes
                    are genuinely different claims — *I would do this again*
                    against *that is dealt with* — and nothing about a raw
                    capture can supply the answer. The word generalises where the
                    film-first *Go back?* did not, and it is the app's own name.
                  */
                  <Question
                    ask="Again?"
                    onYes={() => settle(line, true)}
                    onNo={() => settle(line, false)}
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
      <div
        ref={sheet}
        className={`writing-sheet z-10 transition-[translate] duration-[var(--recede)] ease-[var(--ease-recede)] ${
          writing ? '' : 'pointer-events-none translate-y-full'
        }`}
      >
        <div className="gutter mx-auto w-full max-w-[var(--page-measure)]">
          {/*
            ⚠ **The chips sit beside the field and the field gives up the
            width**, exactly as they did on the pinned row. What has changed is
            that the field may now be several lines tall, so they align to its
            *first* line rather than to its middle — a photograph belongs beside
            the words it captions, and the words start at the top.
          */}
          {/*
            ⚠ **The hem is the row's, exactly as it is on a line of the record.**
            `page-row` puts `--line-hem` on the block and the words inherit the
            type from it; this is that arrangement, so `line-glyph` centres the
            chips on the field's **first line** by the same arithmetic it uses in
            the record. Put the hem on the field's own wrapper instead and every
            chip sits a hem too high.
          */}
          <div className="page-line flex items-start">
            <div className="relative min-w-0 flex-1">
            <div
              /*
                ⚠ **The ghost is a copy of the same text, and it is what sizes
                the box.** It can only measure the same line breaks if every
                property that affects them is inherited from one place — which is
                the row, since 27 August. See `grow-field`.
              */
              data-value={bandValue}
              className="grow-field"
            >
              <textarea
                ref={input}
                rows={1}
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
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return
                  /*
                    ⚠ **Return commits and never inserts a newline**, which is
                    the one thing a textarea has to be told. One line is one
                    capture: a capture with a line break in it is two things
                    somebody meant to say separately, and the matching path would
                    treat the pair as one string forever after. `isComposing` is
                    the exception — the Return that closes an IME candidate
                    window is not this Return.

                    ⚠ **The field wraps; it does not break.** Wrapping is the
                    browser laying one sentence over several lines, which is what
                    the record does with the same words. A newline would be the
                    person doing it, and that is what is refused.
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
            </div>

            {drawnCaret && (
              <span
                aria-hidden
                className="animate-caret bg-chrome pointer-events-none absolute top-1/2 left-0 h-[var(--caret-height)] w-[var(--caret-width)] -translate-y-1/2"
              />
            )}
            </div>

{photo && (
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Take the photograph off"
                className="line-glyph tap-target ms-2 shrink-0"
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
                className="line-glyph text-chrome ms-2 shrink-0 gap-1 rounded-full bg-[var(--glass-tint)] px-2 text-[0.8125rem] leading-none [--glyph:0.875rem]"
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
              className={`line-glyph ms-2 shrink-0 transition-colors [--glyph:var(--glyph-line)] ${
                imagesOn ? 'text-chrome' : OFF
              }`}
            >
              <AttachGlyph />
            </button>
          </div>
        </div>
      </div>

      {/*
        ⚠ **The foot goes while the sheet is up, and it is not a z-index
        problem.** The sheet rests on `--keyboard-overlap`, which is zero
        wherever there is no on-screen keyboard — a Safari tab before the keys
        rise, and the desk — so the two would share the bottom edge and the
        glyphs would sit over the words. Stacking them would only hide the
        collision: **none of these three is wanted while somebody is writing**,
        and the `+` least of all, since it is a second door to the thing that is
        already open. The way out is the scrim, which is the whole screen.
      */}
      <Foot receded={receded || writing} {...tools} />
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
