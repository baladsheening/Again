'use client'

import { useRef } from 'react'

import { CloseIcon } from './icon-close'
import { useSearch } from './search-provider'

/**
 * The search prompt: the word, and the field it names.
 *
 * **It has no results of its own.** Until 9 August this owned the query, the
 * fetch and a dropdown list beneath it; results now replace the poster wall
 * instead, so the state moved up to `SearchProvider` and the list is gone. What
 * is left is the input — which is the whole of what this ever was visually,
 * since the field has been borderless and transparent since the boxed version
 * was dropped.
 *
 * The same prompt appears in two places: the phone's bottom bar and the foot of
 * the poster column at rail widths. Both wrap it in a chevron and a row.
 *
 * **`id` is not optional, and it is not decoration.** Both placements are in the
 * document at every width — the breakpoint hides one with CSS rather than
 * choosing between them, because choosing would need a media query in JavaScript
 * and a server render that cannot know the answer. Two inputs therefore exist,
 * and two inputs sharing an `id` is a duplicate identifier with two `<label for>`
 * pointing at whichever the browser found first.
 */
export function SearchField({ id }: { id: string }) {
  const { query, setQuery, setFocused, clear } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Whether the field held the caret at the instant the × was pressed.
   *
   * Recorded on `pointerdown` because that is the last moment the answer is
   * still true: pressing a button moves focus off the input as its default
   * action, so by `click` the field has already lost it and
   * `document.activeElement` no longer says what the person was doing.
   *
   * A ref rather than state — it is written and read inside one gesture, and a
   * render in the middle of that is both pointless and a chance to be stale.
   */
  const hadCaret = useRef(false)

  return (
    /*
      `-translate-y-px` is an optical correction, not a layout fix. The field is
      already centred mathematically against the chevron beside it; a lowercase
      word without descenders still reads about a pixel and a half low, because
      the eye measures the x-height band and not the line box.
    */
    /*
      `flex-1` is what puts the × on the right-hand edge. Without it the row
      shrinks to the width of the word "search" and the clear control sits in the
      middle of the screen; with it the input takes the slack and the × is pushed
      out to the container's edge — which in both placements is the gutter, and
      therefore the same line the last poster in a row ends on.
    */
    <div className="flex min-w-0 flex-1 -translate-y-px items-center gap-1.5">
      <label htmlFor={id} className="sr-only">
        Search for a film
      </label>

      {/*
        ─────────────────────────────────────────────────────────────────────
         There was a caret here, and taking it out fixed two things (10 August)
        ─────────────────────────────────────────────────────────────────────

        A 1px element blinked at 1.06s while the field was empty and unfocused —
        a prompt waiting to be typed into — and it unmounted on focus, so the
        browser's real caret could take over without two appearing in a row.

        Both halves of that were wrong, and they were the same fault seen twice:

        **It blinked when nobody was in the field.** A blinking cursor means
        *this is where your typing goes*, and it was making that claim at a field
        the user had not touched — so the one moment it fell silent was the
        moment it became true. Asked for on 10 August the right way round: the
        cursor should blink when you tap in, and the browser already does that,
        for free, in the platform's own rhythm.

        **Unmounting it moved the word.** The span was 1px wide with 6px of the
        row's `gap` beside it, so the placeholder and everything typed after it
        jumped 7px left the instant the field took focus, and 7px back on blur.
        A prompt that flinches when you tap it is the app twitching under your
        finger.

        Deleting it answers both, and there is nothing to replace it with: the
        word "search" is the affordance, and the caret is the browser's.
      */}

      <input
        id={id}
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          // Escape puts the listing back. It is the only way out other than
          // deleting what you typed, and the wall gives no other affordance.
          if (e.key === 'Escape') {
            clear()
            inputRef.current?.blur()
          }
        }}
        autoComplete="off"
        spellCheck={false}
        placeholder="search"
        /*
          Borderless and transparent: whatever holds the field is its container,
          and a box inside a box would read as two surfaces. 16px is not a style
          choice — iOS Safari zooms the viewport on focus for anything below it
          and does not zoom back.
        */
        className="placeholder:text-muted/70 w-full min-w-0 bg-transparent text-base leading-6 outline-none"
      />

      {/*
        The way back to the listing.

        Escape already did this, and Escape is not an affordance on a phone —
        with the results filling the screen and no visible control, clearing the
        field was something you had to know rather than something you could see.

        **It keeps focus, and only keeps it.** Clearing is usually the start of
        typing something else, and dropping the keyboard between two searches is
        the difference between correcting a query and starting one again.

        ⚠ **Keeping is not the same as taking, and this took.** The refocus was
        unconditional, so pressing × with the keyboard already down raised
        one — reported from the handset on 11 August. Nobody asked to type; they
        asked to be rid of what was in the field, and the answer was half the
        screen filling with keys. The distinction the original note meant is
        between *holding* a caret through the clear and *summoning* one, and only
        the first was ever wanted. See `hadCaret`.

        `ml-2` on top of the row's gap, so `tap-target`'s 44px expansion reaches
        only about a pixel into the field. That utility's own note warns about
        neighbours stealing each other's taps, and the neighbour here is the text
        you are trying to put a cursor in.

        Rendered from the first character rather than from the search minimum:
        one character shows the listing through, but it is still text you may
        want rid of.
      */}
      {query.length > 0 && (
        <button
          type="button"
          onPointerDown={() => {
            hadCaret.current = document.activeElement === inputRef.current
          }}
          onClick={() => {
            clear()
            if (hadCaret.current) inputRef.current?.focus()
          }}
          aria-label="Clear search"
          className="text-muted hover:text-text tap-target ml-2 shrink-0 self-center transition-colors"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
