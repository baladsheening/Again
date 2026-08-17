# Evaluating events and alternative verticals

Two alternatives to paying for live cinema data are worth evaluating:

1. Let people submit event information themselves.
2. Add a different vertical whose data is cheaper, easier to enter, and more globally useful.

## Recommendation

Treat user-submitted events as a new input type, not as a supposedly complete global event catalogue. Add books as the strongest candidate for a second vertical rather than abandoning films.

## User-submitted events

This could fit Again well because events are occasions that people can attend together. The app should make a narrow claim:

> Shared by Alex — Saturday at 7pm

It should not make a broad claim:

> All events happening near you

Each submitted event should carry:

- title
- date, time, and timezone
- venue or location
- source link or uploaded evidence
- submitting user
- last verified time
- automatic expiry

The user becomes the source of the information, and other users can confirm or correct it. This avoids the showtimes-provider bill, but introduces moderation, spam prevention, duplicate merging, and stale-event handling. It is likely cheaper at the beginning, especially if events are shown to friends or people who track one another.

This should be treated as an occurrence attached to an item or intention, not as a public event directory. The existing occurrence model is the right conceptual home for it; see [`docs/decisions.md`](decisions.md#the-living-map-is-not-a-different-aim--it-is-the-same-mechanism-second-trigger).

## Alternative verticals

### Books

Books are the strongest candidate:

- globally understandable
- easy to enter by title, author, or ISBN
- stable rather than time-sensitive
- naturally suited to wants and go-back-tos
- already anticipated as a possible second kind

Open Library offers public APIs and free data dumps. Its current guidance says the API is intended for low-volume, human-facing discovery rather than high-traffic commercial infrastructure, so it should not be treated as an unlimited free backend. See [Open Library's Developer Center](https://openlibrary.org/developers) and [API usage guidance](https://openlibrary.org/developers/api).

Books also avoid the central cinema problem: the app does not need to claim that a book is available in a particular shop, library, or country. It can simply identify the thing someone wants or would return to.

### Music

Music is another plausible vertical. MusicBrainz provides broad metadata and stable identifiers, but its API is free for non-commercial use and commercial users need to follow its commercial arrangements. It also requires a meaningful user agent and has request-rate limits. See [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API).

Music is globally relevant and easy to enter, but it brings additional identity choices: artist, recording, release, album, or track. Artwork and licensing would also need separate consideration.

### Events as the replacement vertical

Events are not the best replacement vertical for the wall. Event data is more local, volatile, and difficult to keep globally complete than film data. User-submitted events are better treated as a social feature whose provenance is visible, rather than as a universal events feed.

## Proposed order

1. Rename the current wall to `New releases`.
2. Keep films as the first item type.
3. Test a small user-submitted occasion flow.
4. Add books as the first additional vertical.
5. Delay paid showtimes until real usage proves they are necessary.

This preserves Again's core idea—the convergence between people—while reducing dependence on expensive external availability data.
