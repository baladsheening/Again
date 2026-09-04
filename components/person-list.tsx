'use client'

import { useState } from 'react'

import type { CaptureCard } from '@/lib/db'
import { PersonRow } from './person-row'

/**
 * A section of somebody else's page.
 *
 * The heading is visible here, unlike the `sr-only` one on your own
 * collections. On your own pages the collection is already named twice over, in
 * the rail and in the bottom bar, so a third would be duplication. Here there is
 * no navigation saying which of someone's lists you are looking at, and the page
 * shows two of them at once — so the heading is the only thing that says.
 *
 * ⚠ **An empty section is not drawn, and there is no longer a way to ask for
 * one.** The `empty` prop and its one caller — *Nothing here yet.* under *Wants*
 * — went on 4 September: a heading and a line of copy spent saying there is
 * nothing to see is the absence the rest of this page stopped explaining.
 *
 * ⚠⚠ **IT HOLDS WHICH ROW IS OPEN, WHICH IS WHY IT IS A CLIENT COMPONENT SINCE
 * 4 SEPTEMBER.** One at a time, exactly as the record allows one console: two
 * lines open at once is two answers to *which line am I looking at*. The state
 * cannot live in the row, because a row cannot know that another one opened.
 */
export function PersonList({
  heading,
  entries,
}: {
  heading: string
  /**
   * ⚠ **`CaptureCard`, since 24 August.** It was `EntryCard`, whose projection
   * drops every capture that resolved to nothing — so everything typed as words
   * on the capture page was silently absent from this list. See `PersonRow`.
   */
  entries: CaptureCard[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (entries.length === 0) return null

  return (
    <section className="flex flex-col">
      <h2 className="micro text-muted mb-1">{heading}</h2>

      {/*
        ⚠ **No rules between the rows, and no padding around them.** Rule 3: the
        record parts its lines by rhythm, and this is the record read from
        somebody else's side. The `border-b` and `py-7` that used to be here made
        one capture 111px where the same capture is 34px on your own page.
      */}
      <ul className="flex flex-col">
        {entries.map((card) => (
          <PersonRow
            key={card.id}
            card={card}
            open={openId === card.id}
            onOpen={() => setOpenId((id) => (id === card.id ? null : card.id))}
          />
        ))}
      </ul>
    </section>
  )
}
