import type { CaptureCard } from '@/lib/db'
import { PersonRow } from './person-row'

/**
 * A section of somebody else's page. Server component — the rows are the client
 * half, because only the *Add to wants* button needs to be.
 *
 * The heading is visible here, unlike the `sr-only` one on your own collections.
 * On your own pages the collection is already named twice over, in the rail and
 * in the bottom bar, so a third would be duplication. Here there is no
 * navigation saying which of someone's lists you are looking at, and the page
 * shows two of them at once — so the heading is the only thing that says.
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
  /*
    ⚠ **An empty section is not drawn, and there is no longer a way to ask for
    one.** The `empty` prop and its one caller — *Nothing here yet.* under
    *Wants* — went on 4 September: a heading and a line of copy spent saying
    there is nothing to see is the absence the rest of this page stopped
    explaining. Fixtures were already silent, and the two had no business
    differing.
  */
  if (entries.length === 0) return null

  return (
    <section className="flex flex-col">
      <h2 className="micro text-muted mb-1">{heading}</h2>

      <ul className="flex flex-col">
        {entries.map((card) => (
          <PersonRow key={card.id} card={card} />
        ))}
      </ul>
    </section>
  )
}
