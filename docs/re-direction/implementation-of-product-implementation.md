# Implementation of product implementation

Status: product rationale. It records the reasoning that led to the build
contract; implementation-spec.md in this folder is the normative specification.

I’d make this a deliberate product pivot, not a ground-up rewrite. The existing project has a useful engine; it has simply been wrapped in a film-specific interface.

The central product should become:

> A calm, private place to capture intentions, where social value appears when those intentions overlap.

## The Notes-like experience

The first screen should feel almost empty and immediate:

> What do you want to do, try, experience, or buy?

The user types naturally:

- “try pottery”
- “visit Kyoto”
- “buy a moka pot”
- “see the new Cronenberg film”

Suggestions appear underneath, but they are autocomplete—not a search gate. Pressing Return saves the text even if there is no match.

A saved entry should be simple and text-led. The user can enrich it later with:

- a canonical thing
- a category or intent
- a note
- a place or occasion
- sharing permissions

This preserves the Apple Notes qualities: immediate capture, minimal decisions, quiet presentation, and organisation after the fact.

The social layer should remain ambient rather than becoming a feed. If a meaningful overlap exists, the app can surface:

> You and Maya both want to try this.

No likes, comments, public activity stream, or engagement mechanics are necessary.

## The most important product decision

I would revisit the current visibility model before going much further.

A Notes-like app suggests that entries are private by default, with explicit sharing. The current implementation allows a person who knows someone’s handle to see their live wants and go-back-tos even without tracking them. That may be convenient for convergence, but it does not feel like Notes.

I’d consider entry-level visibility:

- private
- shared with mutual tracks
- shared with selected people
- discoverable for similarity matching, only by explicit opt-in

The existing `tracks` system can remain. It would become the relationship that enables shared visibility and convergence, rather than simply being a way to follow someone’s page.

## How I would use what already exists

The current work in `docs/plan.md` and the existing schema gives us a reasonable foundation.

Keep:

- authentication, profiles, handles, and onboarding
- the database privacy boundary in `lib/db/`
- the `tracks` relationship
- idempotent entry creation and the ten-second undo
- the mutual-track logic
- `overlap.ts` and the notification infrastructure
- the existing responsive shell and accessibility work
- TMDB as one catalogue adapter for films

Change or demote:

- the poster wall should no longer be the home screen
- TMDB should no longer define what “input” means
- the film screen should become one type of resolved item, not the core product
- the intent sheet should not be required before saving
- “want → done → go-back-to” should be generalised, since “bought,” “visited,” “tried,” and “watched” are different outcomes
- `guide`, `lend`, and swap behaviour should wait until the basic convergence loop proves itself

The existing `items` and `entries` tables are close to useful, but I would avoid stretching `items` into a global directory. Conceptually, separate:

- the raw thing the user typed
- the canonical thing it may refer to
- the user’s relationship to it

That could eventually mean a lightweight `captures` layer with raw text and an optional `item_id`. An unresolved capture would still be a valid personal record. A resolved capture could participate in exact overlap matching.

This is better than forcing every input to have a catalogue ID.

## Development order

This is the rationale for the dependency order, not a second delivery plan. The
normative specification adds a Phase 0 migration, then delivers the same six
product phases in this order: capture, friend convergence and contact handshake,
list transfer, catalogue, location-aware discovery, and distal matching.

### 1. Capture first

Build the complete solo loop:

- open the app
- type freely
- see optional suggestions
- save with Return
- view a calm list of captured things
- edit or enrich an entry later

Do not build a global catalogue yet. Use films as one suggestion source, but also allow unmatched text.

### 2. Friend convergence

Use the existing tracking work and build the first genuinely social loop:

- two people track each other
- both capture the same resolved thing
- the app creates one clear overlap notification
- the overlap can be opened and acted upon outside the app
- people who meet can use a two-sided QR/code handshake to become mutual tracks

This should be tested with a small real friend group before adding more verticals.

### 3. In-person list transfers

The contact handshake belongs to the friend-convergence phase. The next phase
makes the same in-person meeting useful for a different outcome: one person can
send a selected capture or collection for the other to import.

The web version should use a short-lived QR/code pairing session. Literal
phone-to-phone NFC is a later native-client enhancement, not a web guarantee.
The sender chooses exactly what to send; the receiver previews and accepts it;
the resulting import is a private copy rather than a shared live list.

Transferred records retain provenance and do not create a convergence with the
sender, because receipt is not independent discovery. A recipient may later
explicitly make one their own.

### 4. User-created catalogue records

The worldwide catalogue should emerge from people’s everyday captures rather than being built centrally from the beginning.

The underlying flow is:

> user capture → possibility → optional local offer

A person’s entry initially creates a candidate possibility. If later entries appear to describe the same thing, they can be clustered together. The possibility gains confidence through corroboration, while each original user entry remains preserved as provenance.

Repeated entries are useful evidence, but they do not prove everything. Several people entering the same product suggests that it is a recognisable thing. It does not, by itself, prove that the entries refer to the same product, that the product genuinely exists, or that it can currently be bought in a particular place.

Those are separate questions:

- **Identity confidence:** are these entries describing the same thing?
- **Existence confidence:** is this a genuine artefact in the world?
- **Availability confidence:** can it currently be obtained in a particular place?

Evidence for confidence can include:

- genuinely independent user entries
- consistent brand, model, ISBN, barcode, or other identifier
- multiple source links
- consistent images, titles, and descriptions
- reports from different locations
- confirmation that somebody actually saw or bought it
- the freshness of the information

Copied entries, identical images, imported text, bots, and coordinated submissions should not count as independent evidence. The system should use duplicate detection, source comparison, rate limits, user reputation, reporting, and moderation as it grows.

The app should avoid displaying a mysterious score such as `87% reliable`. Initially, possibilities should have understandable states such as:

- Unverified possibility
- Corroborated by several people
- Identified by a trusted source
- Recently confirmed nearby
- Possibly outdated

An internal confidence model can still support ranking, but the product should explain why a possibility is trusted. A real product may be discontinued, sold only in one country, available only second-hand, or temporarily out of stock. “Exists in the world” and “can be bought here now” must remain distinct.

The catalogue should therefore be represented as three related layers:

- a raw capture preserving what the user typed and supplied
- a canonical possibility representing the merged thing
- an offer or occurrence representing a location, seller, venue, date, or source-specific availability

The catalogue is an enabling layer, not the product’s centre of gravity. It should grow out of real use and repeated unmatched captures, rather than becoming a prerequisite for capture or a claim to be a complete yellow pages.

### 5. Location-aware discovery

Later, attach specific occurrences to things:

- a pottery workshop
- a film screening
- a concert
- a restaurant visit
- a particular venue or date

These need source, timestamp, location, and expiry. They should be treated as user-supplied or sourced opportunities, never as a claim that the app knows everything happening everywhere.

At a later stage, users should be able to open the app wherever they are and see what that location has to offer.

There could be two views:

- **Here** — a broad local smorgasbord of experiences, places, services, events, and distinctive objects available in or near the user’s location.
- **For you here** — a personalised subset showing the local possibilities most likely to be relevant to the user’s captured intentions.

The expression could be a horizontal thumbnail rail on the front page, or a dedicated discovery page. It should feel like browsing possibilities rather than conducting a search: a gentle visual invitation to notice what is around you.

This makes sense as an extension of the product because the user’s list supplies the intent, the location supplies the opportunity, and the app creates the connection between them. It also gives the app a reason to open when the user is out in the world, rather than only when they remember something they want to record.

However, this feature changes the product boundary. It introduces local discovery, availability, freshness, and recommendation questions that the current film-first brief deliberately excludes. It should therefore be treated as a new product layer, not quietly added to the existing poster wall.

The first version should avoid claiming to show everything available in a place. A safer expression would be:

> Possibilities from the sources currently covered here.

Every location-based result would eventually need provenance, location, source, timestamp, and—where relevant—an expiry time. Experiences and events decay quickly; durable places and objects decay more slowly. The app should make that difference visible rather than presenting all results as equally current.

The personalised view should initially be based on explicit overlap with the user’s list: the same place, activity, object, or category they have recorded. Inferred taste and semantic similarity can come later, once the app has enough evidence to make those suggestions trustworthy and explainable.

This feature should follow the capture and friend-convergence loops. The app first needs to understand what a person wants and prove that shared intentions create value. Only then should it start showing the person what their surroundings might offer.

### 6. Distal matching

Only after the earlier loops provide sufficient evidence should strangers be
matched. Make it opt-in and explainable:

> You both want to visit three of the same places.

Avoid opaque “compatibility” scores and never expose someone’s whole list by
default. This feature also needs blocking, reporting, age/safety considerations,
and careful privacy design.

## The first version I would actually build

The initial home screen would have:

- a large capture field
- a short list of recent intentions
- optional inline catalogue suggestions
- a quiet “overlaps” indicator when something meaningful occurs
- a separate People area for mutual tracks

There would be no poster wall, no feed, no public recommendation surface, and no requirement to classify an entry before saving it.

The key metrics would be:

- how quickly someone can save an intention
- how often suggestions help without interrupting capture
- how many unmatched inputs are saved successfully
- whether people return to add more things
- how often mutual pairs develop overlaps
- whether an overlap leads to an actual conversation or plan

The biggest mistake would be building the worldwide catalogue first. The hardest and most valuable part is proving that people repeatedly capture things and feel genuine value when those things intersect with another person’s list. Once that loop works, the catalogue can grow around it.
