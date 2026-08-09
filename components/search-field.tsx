'use client'

import { useRef } from 'react'

import { CloseIcon } from './icon-close'
import { useSearch } from './search-provider'

/**
 * The search prompt: a caret waiting to be typed into, and the word itself.
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
  const { query, setQuery, setFocused, focused, clear } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    /*
      `-translate-y-px` is an optical correction, not a layout fix. The field is
      already centred mathematically against the chevron beside it; a lowercase
      word without descenders still reads about a pixel and a half low, because
      the eye measures the x-height band and not the line box. Applied to the
      caret and the field together so the two stay in step.
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
        A prompt, not a control. The caret blinks only while the field is empty
        and unfocused: once it has focus the browser draws the real one, and two
        carets in a row is a bug rather than an effect.
      */}
      {!focused && query.length === 0 && (
        <span
          aria-hidden
          className="bg-muted animate-caret h-[1.1em] w-px shrink-0 self-center"
        />
      )}

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

        **It keeps focus.** Clearing is usually the start of typing something
        else, and dropping the keyboard between two searches is the difference
        between correcting a query and starting one again.

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
          onClick={() => {
            clear()
            inputRef.current?.focus()
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
