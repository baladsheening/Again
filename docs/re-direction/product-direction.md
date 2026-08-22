# Product direction: intent capture and convergence

Status: product rationale and record of the original re-direction discussion.
For implementation decisions, use implementation-spec.md in this folder.

## The original idea

> so the idea is the one this project is developing. you can read the docs, i guess, to get a sense of it as well as the decisions made to develop it. but i have a feeling we're going in the wrong direction in terms of implementation. my idea is of people creating records of things they want, things they want to try/experience, and things they want to buy. it occurred to me whilst browing the net, whether insta or youtube or pinterest or just reading stuff online, that i often bookmark things of interest. i was thinking we could simply have a sort of apple iphone notes-like app where people can open it and start typing the thing they want, and the app throw up results that match their input. note that i say, 'input', not 'search', because people are typing the thing they know they want. the results are just there to make it quicker but the facility depends on essentially there being a corpus of all services and products on earth, a sort of yellow pages of things, something not available, i don't think, and which if is to be available, will require people uploading them to the app's database a la wikipedia being an open source, yet somehow reliable, encyclopedia. the second part of the app would be the convergence part wherein friends with overlapping 'things' on their lists, especially experiences, are matched on that common experience so that they know of an organic opportunity to socialise. the third part relates to distal social relation wherein strangers are matched based on common profiles, i.e. having very similar lists as to suggest a possible friendship or day out. so yh, those are my thoughts. what do you think

## Response and product assessment

Yes. My honest reaction is that your instinct is probably right: the project has found a strong social mechanic, but the implementation has become too committed to a narrower “film diary” product.

The valuable idea is not films, posters, or search. It is:

> People casually record intentions, and those intentions become socially useful when they overlap.

The current work is not wasted. Authentication, privacy, entries, tracks, mutual relationships, and notifications are useful foundations. The `items × entries × tracks` model is close to the right underlying shape. But the current interface and domain language push users toward maintaining a cinema collection: TMDB search, poster walls, films, “go-back-tos,” and film-specific states. The actual product being described is broader and more interesting.

The app can be framed around three layers.

### 1. Capture

The user opens the app and types naturally:

- “try pottery”
- “buy a moka pot”
- “visit Kyoto”
- “see the new Cronenberg film”
- “learn to make sourdough”

Results appear while typing, but they are suggestions, not search results that control whether the entry can be saved. If nothing matches, the user can still save the text immediately.

That distinction is crucial: the app is an intent inbox with entity resolution attached to it.

### 2. Resolution

When a suggestion exists, it can connect the entry to a canonical thing: a film, book, place, product, service, or experience.

When it does not exist, the raw user-created record still exists. Later it might be enriched, merged with another record, or confirmed with other users.

The app should not begin by trying to build “a corpus of everything on earth.” That is effectively a separate global directory company. The app does not need complete coverage to be useful. It needs fast capture and reliable matching for the things that matter to the current user.

A useful data model would separate:

- what the user typed
- the canonical thing it may refer to
- the person’s intent or context
- any specific occasion, offer, date, venue, or source

The existing idea of occurrences and provenance moves toward this distinction, but it should become central rather than something postponed behind cinema.

### 3. Convergence

This is where the app becomes more than Notes.

The first social loop should be friends or mutual tracks with the same explicit item or experience. That is concrete, explainable, and actionable:

> You and Maya both want to try this pottery studio.

The stranger-matching idea is compelling, but it should come later and be strongly opt-in. Similar-list matching creates privacy, safety, false-positive, and “is this a dating app?” problems. It should probably reveal only an explained overlap, not expose someone’s entire list or produce an opaque compatibility score.

Every intent should not be treated equally. Shared experiences naturally suggest socialising. Shared products may not. “We both want to hike this trail” is socially meaningful; “we both want to buy the same headphones” may simply be a useful coincidence.

## Recommended pivot

- Replace the poster wall as the primary entry point with a Notes-like capture composer.
- Allow every capture to survive without a catalogue match.
- Keep catalogue suggestions as lightweight autocomplete.
- Generalise the lifecycle beyond the film-specific `want → done → go-back-to` model.
- Build friend overlap before stranger similarity.
- Keep buying as a personal intent initially, without retailer links, pricing, or marketplace behaviour.
- Treat user-contributed catalogue records as a gradual network effect, not a prerequisite for launch.

The clearest diagnosis is in the project’s own plan: the multiplayer phases contain the product’s social value, while the single-player phase has received most of the implementation attention. The current product is therefore polished around the capture mechanism before the actual reason to return has been proven.

The broader concept is stronger than the current cinema-first direction. The thing to preserve is the convergence graph; the thing to reconsider is almost everything that currently makes the app look like a film app.
