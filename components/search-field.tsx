'use client'

import { useRef } from 'react'

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
 * the poster column at rail widths. Both wrap it in a chevron and a row; neither
 * needs anything else from it, which is why it takes no props.
 */
export function SearchField() {
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
    <div className="flex -translate-y-px items-center gap-1.5">
      <label htmlFor="search" className="sr-only">
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
        id="search"
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
    </div>
  )
}
