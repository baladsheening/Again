# Again — implementation specification

Status: normative product and build specification  
Date: 22 August 2026  
Amended: 22 August 2026 — Amendment 1, §13 (see *Amendments* below)

This document defines the product that the implementation should deliver. It
turns the product-direction and implementation notes into requirements that can
be built, tested, and handed off.

Documentation precedence:

1. This document owns future product behaviour and delivery scope.
2. CLAUDE.md owns engineering invariants: database access, session handling,
   privacy enforcement, transactionality, validation, testing, and responsive
   quality. Its legacy film-only product rules must be updated in Phase 0.
3. product-direction.md and implementation-of-product-implementation.md are
   retained as product rationale. They are not competing build instructions.

No implementation phase may rely on a legacy product rule when it conflicts
with this specification.

### Amendments

This document is normative, so it is amended in the open rather than edited
quietly. Every change to a requirement is listed here with its date and its
reason, and the reasoning behind it belongs in `docs/decisions.md`.

**Amendment 1 — 22 August 2026, §13.** Two Phase 0 deliverables moved, and no
requirement dropped:

- *Canonical vocabulary and status copy* moves to Phase 1. Phase 0 established
  the model's vocabulary — capture, possibility, visibility, provenance — in
  the schema, the data layer, the linting and the documentation. What remains
  is the conversion of existing records and the user-facing copy, and both want
  the screens that display them. Expanding the type unions alone is not
  delivery: nothing would construct the new values, so nothing would prove them
  right.
- *Fixtures for disputed and stale data* move to the phases that introduce
  those states — disputed to Phase 4, stale and expired to Phase 5. Phase 0
  cannot produce a fixture for a state its schema cannot represent, so the
  clause was unsatisfiable rather than merely deferred.

The Phase 0 migration is unaffected. It is a compatibility and data-safety
step, and it is complete on its own terms.

## 1. Product definition

Again is a calm, private-first social app for recording things a person wants
to do, try, experience, learn, visit, or buy.

The core loop is:

> capture an intention → optionally resolve it to a possibility → discover
> meaningful overlap with people → notice relevant possibilities nearby

The app is not primarily a search engine, catalogue, recommendation feed, or
marketplace. The user already has an intention. Catalogue results make capture
faster and make overlap possible; they do not define what the user is allowed to
record.

The social value comes from four progressively stronger loops:

1. **Friend convergence:** people who mutually track each other have the same
   explicit intention.
2. **In-person exchange:** two people who meet can deliberately add each other
   as mutual tracks or transfer selected intentions.
3. **Location-aware discovery:** the user sees possibilities available near
   them, including a subset connected to their own list.
4. **Distal matching:** consenting strangers discover explainable overlap in
   their lists.

The first loop must work before the later three are treated as successful.

### Release boundary

This is a staged product plan, not one undifferentiated implementation.

**Release 1 is the commitment:** free-form capture, optional resolution,
private-by-default personal records, exact convergence between mutual tracks,
and an optional QR/code contact handshake for people who meet. It ends at
Phase 2.

The contributed catalogue, local discovery, and distal matching are later
releases. They must not delay Release 1 or be represented as already available
to users.

## 2. Product principles

### Capture before categorisation

The user can type and save immediately. No category, provider result, image, or
intent choice is required before saving.

### Suggestions resolve; they do not gate

Autocomplete suggestions are there to reduce typing and connect a capture to a
canonical possibility. A missing result is not a failed capture.

### Private by default

An individual capture is private until the user chooses to contribute it to the
shared catalogue or share it for social matching. A user's precise location is
never stored by default.

### Social without a feed

There are no likes, comments, follower counts, public activity feeds, scores,
streaks, or engagement loops. Social information appears when it is relevant to
an intention.

### No marketplace behaviour

Again may record that a possibility was recently available from a source. It
does not take payment, host checkout, optimise affiliate links, compare prices,
rank retailers, or claim that an offer is the best one. A source link is
evidence and attribution, not a transactional call to action.

### Provenance over false certainty

The app must distinguish a thing existing, a thing being correctly identified,
and a thing being available in a particular place at a particular time.

### Exact overlap before inferred similarity

The first convergence implementation matches the same canonical possibility.
Semantic or AI-assisted similarity is later, opt-in, and explainable.

### Remove friction before adding intelligence

The primary product quality is the speed and calmness of capture. Enrichment,
matching, and discovery must not interrupt it.

## 3. Vocabulary

These terms should be used consistently in product copy, code, and data
structures.

### Capture

The user's original input: text, and optionally an image, source URL, or other
context. A capture remains valid even when it has no catalogue match.

### Possibility

A canonical or candidate representation of a real-world thing a user may want
to know about. Examples include a product, place, service, film, book,
activity, exhibition, or experience.

The existing items table can be retained as the physical table initially,
but its conceptual meaning becomes canonical possibilities rather than films
only.

Initial possibility types are:

- product or object
- place
- service
- activity or experience
- media
- event or occurrence
- other

The user is not required to choose one during capture. The type may be inferred
from a provider result or selected during later enrichment.

### Claim

Evidence that a possibility exists or that a capture refers to it. A claim may
come from a user, a source URL, a catalogue provider, a venue, or a later
confirmation.

### Offer

A location- and time-specific indication that a possibility can be bought,
visited, booked, or obtained. Offers expire and must carry provenance.

### Occurrence

A time-bound experience connected to a possibility: a screening, workshop,
concert, event, or scheduled visit.

### Intention

The user's relationship to a capture. It is optional at the moment of capture
and can be refined later. Initial supported intentions are:

- experience or try
- visit
- learn
- buy or acquire
- consume, such as watch, read, or listen
- other

The UI must not ask the user to choose one before saving.

### Convergence

Two mutually tracking people independently holding an active intention linked to
the same canonical possibility.

### Track

The existing relationship between people. Mutual tracks enable convergence and
the social visibility rules.

### Transfer

A deliberate, short-lived in-person exchange between two authenticated users.
A transfer either creates a mutual track or copies a selected set of captures
from one person to the other. It is never an automatic synchronisation.

## 4. What the finished app should feel like

The app should have the calm, immediate quality of Apple Notes:

- opening it exposes a writing surface quickly
- a user can start typing without navigating or choosing a category
- text is the primary visual element
- entries save optimistically and quietly
- organisation happens after capture
- metadata is secondary
- the interface is restrained, spacious, and legible

It should not look like a cinema catalogue or a social media feed. Images are
functional and selective:

- suggestion rows may contain thumbnails
- resolved entries may contain a small thumbnail
- the Here surface uses horizontal thumbnail rails
- the personal list remains primarily text-led

## 5. Navigation and screens

The exact URL structure may follow the existing App Router conventions, but the
product must provide these surfaces.

### Home / Capture

The primary screen contains:

1. a prominent capture field
2. optional suggestions below the field while typing
3. recent active captures
4. a quiet indication of newly relevant overlaps
5. a horizontal Here or For you here rail when location discovery is
   available

The capture field should remain usable from the home screen without opening a
dialog or separate search route.

### My things

The user's captures are shown as a calm, text-first list. The list supports:

- active intentions
- completed intentions
- repeatable experiences
- dropped or archived intentions
- filtering by intention or possibility type after capture

Filtering is optional organisation, not a prerequisite for saving.

### Thing detail

A detail surface shows:

- the original capture text
- the resolved possibility, if any
- image and essential metadata
- the user's intention and status
- the user's private note
- sharing/contribution controls
- known overlap with mutual tracks
- relevant local offers or occurrences when available

The detail surface must never replace the original user wording with catalogue
wording without showing the relationship between them.

### People

People are reached by a known handle, existing track, or invitation. The screen
shows mutual tracks and their relationship state. It is not a directory of
strangers.

### Transfer

Transfer is an action available from Home, People, and an individual capture.
The sender chooses one of:

- add each other as contacts
- send this capture
- send selected captures
- send an explicitly chosen collection

The receiver sees a review screen before anything is added. Whole-list transfer
means the sender's explicitly selected collection; it never silently includes
private notes, dropped records, or an entire account history.

### Overlaps

This is a list of actionable convergences. Each row explains:

- who the overlap is with
- the shared possibility
- why it is being shown
- whether the overlap is a want, experience, offer, or occurrence

There is no public activity feed.

### Here

The Here surface requires an explicit location permission or a manually chosen
location. It has two modes:

- **Here:** a broad local smorgasbord of available possibilities.
- **For you here:** a subset connected to the user's active list.

Both modes are horizontal thumbnail rails on Home and can also be opened as a
dedicated page.

### Profile and settings

The user can manage:

- display name and handle
- tracking relationships
- entry visibility defaults
- catalogue contribution preference
- location permission and default area
- discovery and distal-matching opt-in
- blocking and reporting
- account recovery and sign-out

## 6. Capture behaviour

### Basic flow

1. User focuses the capture field.
2. User enters natural language.
3. Suggestions may appear after a short debounce.
4. User presses Return or taps the save action.
5. The capture is saved immediately as an active intention.
6. The user can continue typing another capture.

The typed text must not be replaced by a suggestion merely because a suggestion
matches. Selecting a suggestion is an explicit action.

### Unmatched input

If no provider result exists, the input is still saved. It appears in the
user's personal list as an unresolved capture.

The app must not show language implying that the user's intention is invalid,
unimportant, or misspelled because no catalogue result was found.

### Matching input

When a suggestion is selected:

- the original text is preserved
- the capture links to the canonical possibility
- the provider and external identifier are stored
- the provider image may be used with attribution/licensing rules
- the capture becomes eligible for exact convergence

### Duplicate input

Repeated raw text is not automatically discarded. The user may have entered
the same words for a different context. If the captures resolve to the same
possibility and intention, the app should offer the existing record rather than
create a second active relationship.

Every capture submission carries a client mutation id so retrying one action
cannot create two records. Once a capture is resolved, the app permits one
active record per user, possibility, and intention. It returns the existing
record rather than creating another. A later occurrence is the correct way to
represent a distinct visit, workshop, or purchase context.

### Optional images

A capture may include an image supplied by the user or a provider. User images
must:

- be stored outside the database in object storage
- have a size and type limit
- have metadata and EXIF data stripped where appropriate
- be served through an access-controlled media path
- retain uploader and provenance information
- be reportable and removable when policy requires it

The implementation should use a storage abstraction, with a Vercel-compatible
object store as the initial deployment choice. Binary image data must not be
stored in Postgres or committed to public/.

## 7. Possibility and catalogue model

The catalogue is generated from use. It is not required to be complete before
capture works.

### Required conceptual records

The implementation should provide the following concepts. They may be
implemented as new tables or as carefully migrated versions of existing tables,
but the distinctions must remain visible in the data model.

#### Captures

Minimum fields:

- id
- authenticated user id
- original text
- normalised text for matching
- optional image asset
- optional source URL
- immutable provenance: source type, nullable originating capture id, and nullable
  originating user id
- optional possibility id
- optional intention
- status
- visibility
- created and updated timestamps

Captures are the durable, user-owned source of truth for intentions. The
possibility link is nullable. New product writes must not create a parallel
entry record for the same intention.

Provenance is server-owned and is never a client-selectable capture field. A
transferred capture has source type `transfer` and records the sender's original
capture and user internally. Matching must be able to read that relationship
when it evaluates suppression, even after the transfer session has expired.
Transfer items remain the immutable audit record; they are not the only place
the matching rule depends on provenance.

Phase 0 migrates existing film entries into captures. The old entries table may
be exposed through a read-only compatibility projection while migration is
verified, but it receives no new writes and is retired after verification.

#### Possibilities

Minimum fields:

- id
- type
- canonical title
- optional description
- optional image
- optional external source and identifier
- lifecycle state
- internal confidence states
- created and updated timestamps

The current items table can serve this purpose initially. Provider-specific
fields must remain inside provider metadata or an adapter boundary.

#### Claims / evidence

Minimum fields:

- possibility id
- originating capture or source
- contributing user, when applicable
- evidence type
- source URL or provider identifier
- evidence fingerprint
- created timestamp
- review or dispute state

#### Offers and occurrences

Minimum fields:

- possibility id
- place or area
- source
- source URL or evidence
- observed timestamp
- start and end time when relevant
- expiry timestamp
- availability or occurrence state

An offer is not the same thing as a possibility. A possibility can remain valid
after an offer expires.

#### Transfer sessions and items

Transfer sessions hold the short-lived pairing state and immutable sender
snapshot. Transfer items record exactly which source captures were accepted and
which receiver captures they created. These records are separate from captures
so that expiry, cancellation, replay protection, and audit history cannot alter
the receiver's eventual personal record.

### Catalogue contribution

A private capture must not become publicly attributable evidence without the
user's consent. The user can explicitly contribute a capture to the shared
catalogue. The contribution may be anonymous to other users while retaining
internal provenance for moderation and abuse handling.

When a user contributes a new possibility:

1. create an unverified candidate
2. preserve the original capture and supplied evidence
3. attempt deterministic duplicate detection
4. present possible existing matches before creating a second candidate
5. allow later users to confirm, correct, merge, or dispute it

If identity is uncertain, do not merge automatically. A false merge damages
every downstream convergence and location result.

### Reliability and confidence

The system must maintain separate internal confidence for:

- identity: whether records refer to the same thing
- existence: whether the thing appears to be genuine
- availability: whether it can be obtained in a specified place and time

Repeated independent entries are evidence, not proof. Independence should
discount:

- identical or near-identical images
- copied source URLs
- copied descriptions
- repeated submissions from one account
- automated or coordinated activity

Positive evidence may include:

- independent users in different contexts
- stable identifiers such as ISBN, barcode, model number, or official listing
- multiple source links
- consistent title, brand, image, and description
- direct confirmation from a user
- recently observed local evidence

Negative evidence and availability must decay with time. A product can be real
but discontinued, out of stock, or unavailable in a particular location.

Do not expose a single unexplained numeric reliability score in the first
release. Use states such as:

- Unverified possibility
- Corroborated by several people
- Identified by a trusted source
- Recently confirmed nearby
- Possibly outdated
- Disputed

The internal score may rank results, but the UI must be able to explain the
evidence behind a displayed state.

### Catalogue operations and moderation

Phase 4 starts with a deliberately small, human-reviewable operating model:

- one contributed claim with no approved source is Unverified
- two independent claims, with no shared account, source URL, description, or
  image fingerprint, are Corroborated
- a stable identifier or an approved provider/source is Source verified
- an offer is Recently confirmed nearby only while its observed or expiry time
  remains current
- any unresolved report puts the possibility into Disputed

Claims do not become visible proof merely because a numerical score rises.
Automatic duplicate detection may suggest a merge, but only a moderator may
complete one. Moderators may merge, unpublish, restore, and settle disputes;
every such action requires an audit record and leaves the original claims
traceable. A user can report a possibility, offer, image, or source.

## 8. Social implementation

### Friend convergence

The first social feature uses the existing mutual-track relationship.

Convergence fires when:

- both users mutually track each other
- both have an active capture
- both captures resolve to the same possibility
- neither capture is private from the other
- the match is not suppressed by the existing copy/source rule
- neither capture was transferred from the other participant

The match must be exact at first. “Visit Japan” and “visit Tokyo” should not be
treated as the same possibility merely because they are semantically related.

Existing overlap logic should remain the single owner of classification and
notification writing. The code must support both triggers:

- a new or changed capture
- a transition into mutual tracking

Notifications should initially be in-app. Push delivery remains a background
worker concern and must not run inside the capture mutation or undo window.

### Visibility

Required default:

- captures are private
- Release 1 supports one social visibility scope: shared with mutual tracks
- selected-person sharing is deferred until a dedicated access-control table
  and management surface exist
- a user may contribute evidence to the catalogue separately from sharing the
  capture socially
- public/discoverable matching is an explicit opt-in

The data layer must enforce visibility. It must not depend on a page remembering
to hide a field.

### Distal matching

Distal matching is not part of Release 1, the contributed catalogue release, or
the first location release. It remains off until all of the following exist:

- verified adult eligibility
- explicit user consent
- explainable overlap results
- a two-sided reveal before direct contact
- block, report, and unmatch controls
- moderation response procedures
- a proof that private lists cannot be inferred

If verified adult eligibility is unavailable, distal matching does not launch.

An acceptable first result is:

> You both want to visit three of the same places.

## 9. Proximity transfer

### Product role

Proximity transfer makes an in-person meeting useful immediately. Two people
can touch phones in the social sense of the gesture: they meet, open Again, and
deliberately exchange a contact connection or part of a list.

The feature supports two distinct outcomes:

- **Contact handshake:** both people agree to become mutual tracks.
- **List import:** one person sends one capture, selected captures, or an
  explicitly selected collection for the other person to copy into their own
  private list.

A transfer is a copy or connection event, never a live shared list, background
sync, or permission to inspect the sender's account.

### Platform contract

The web app must not promise literal phone-to-phone NFC on every device. The
Web NFC API is experimental, has limited browser support, and is designed around
NDEF-capable tags rather than a portable phone-to-phone pairing contract.
Likewise, the Web Share API opens an operating-system share flow chosen by the
user; it is useful as an optional invitation fallback, not as a direct pairing
protocol.

The universal transport is QR/code pairing. It ships first for the Release 1
contact handshake and carries list transfers in Phase 3:

1. sender creates a short-lived transfer session
2. sender presents a QR code and a short readable pairing code
3. receiver scans the code or enters it in Again
4. both people explicitly review and confirm the result

The QR code and pairing code contain only an opaque, expiring session token.
They never contain a list, names, notes, image URLs, or precise location.

An installed native client may later add literal NFC, Bluetooth, or platform
nearby exchange as an acceleration layer. It must use the same server-side
transfer session and confirmation flow as QR pairing. NFC or any other radio
transport is not the authority that grants access.

### Sender flow

1. The sender opens Transfer from Home, People, or a capture.
2. The sender chooses contact handshake, this capture, selected captures, or an
   explicitly selected collection.
3. For a list import, the sender sees the exact items being sent and chooses
   whether to include an eligible image. Private notes, source URLs, private
   metadata, dropped records, and completed history are excluded by default.
4. The sender creates the session and keeps the transfer screen open.
5. Again shows a QR code, a short readable pairing code, a cancel action, and,
   where supported, a native proximity prompt.
6. The sender sees a confirmation only after the receiver accepts.

### Receiver flow

1. The receiver opens Accept transfer from Home or People.
2. The receiver scans the QR code, enters the pairing code, or accepts a native
   proximity handoff.
3. The receiver sees the sender's display name or handle according to the
   existing relationship rules, the transfer type, and a count/preview of the
   selected captures.
4. The receiver can accept all eligible captures, deselect individual captures,
   decline the transfer, or block the sender.
5. The receiver explicitly confirms. No contact or capture is created before
   this action.
6. Both people receive a completion state. The sender cannot alter the
   snapshot after the receiver has claimed it.

### Contact handshake

Contact handshake is a two-sided action. Each participant must be authenticated,
unblocked with respect to the other, and explicitly confirm.

On successful confirmation, create both existing track rows atomically. This is
the only transfer type that makes the pair mutual. The normal new-mutual-track
convergence trigger then runs against captures the two people independently
hold.

One-sided tracking remains available elsewhere in the product. A transfer
handshake is deliberately different: it means “add each other,” not “follow
this person.”

### List-import semantics

Imported captures are new records owned by the receiver. They preserve:

- the sender-selected original text
- the linked possibility, if one exists
- the chosen intention and active status
- an optional eligible image
- server-only transfer provenance: source type `transfer`, originating capture
  id, and originating user id

They do not preserve by default:

- private notes
- source URLs or private metadata
- hidden visibility choices
- the sender's later edits, completions, deletions, or new captures

An unresolved imported capture remains unresolved. The import must not create a
new canonical possibility merely because it crossed a transfer.

Every imported capture has source type transfer. Transfer provenance suppresses
convergence between the sender and receiver for that capture: importing
someone's list is not an independently discovered common interest. The receiver
may later explicitly make a transferred capture their own; that action removes
transfer provenance and allows the ordinary convergence rules to apply.
It changes only the receiver's capture provenance, never the immutable transfer
item or audit history, and it must be performed as an authenticated mutation.

### Session, data, and security requirements

Add transfer sessions and transfer items as first-class server-owned records.

A transfer session requires at least:

- id
- opaque high-entropy token hash
- sender user id
- optional receiver user id once claimed
- transfer type
- immutable payload snapshot
- status: created, claimed, accepted, declined, cancelled, expired, or failed
- created, claimed, accepted, cancelled, and expiry timestamps
- one-use enforcement

A transfer item requires at least:

- transfer session id
- source capture id
- receiver capture id after acceptance
- payload snapshot fields required for import
- server-owned source type, originating capture id, and originating user id
  required for matching and suppression
- created timestamp

Security rules:

- sessions expire after two minutes and are single-use
- a sender can cancel an unclaimed session at any time
- a user cannot claim their own session
- every claim and acceptance rechecks authentication, blocking, expiry, and
  sender ownership
- transfer payloads are fetched only after the receiver presents a valid token
  and is authenticated
- accepted writes, mutual-track creation, provenance, and audit records occur
  in one transaction
- repeated scan, retry, or network replay returns the completed or expired
  result; it never imports a second copy
- transfer actions have their own rate limit and abuse logging

No current implementation should attempt offline peer-to-peer payload transfer.
The first version requires a network connection because Again's privacy,
provenance, and convergence guarantees are server-owned.

### Privacy, safety, and accessibility

Transfers are intentional but still require the same privacy discipline as
other social features:

- a sender can only send captures they own
- sending is an explicit, item-by-item or collection-by-collection grant
- a blocked pair cannot create, claim, or accept a transfer
- the receiver can decline without becoming a track
- transfer history is visible only to the participants and moderators handling
  abuse
- the sender is not told why a receiver declined
- any included user image follows the existing media permission and reporting
  rules

Physical touch, scanning, or camera access must never be the only way to use
the feature. The visible code, a copyable link where safe, keyboard controls,
and clear status announcements are required alternatives.

### Testing

- Contact handshake creates both track rows only after both confirmations.
- A blocked user cannot use an existing token to reach the other user.
- A QR token reveals no list data when decoded or logged.
- A token expires, cancels, and rejects replay correctly.
- A receiver can deselect an item without cancelling the rest of the transfer.
- Imported captures omit private notes and source URLs by default.
- Imported captures suppress convergence with the sender.
- An explicit “make this mine” action restores ordinary convergence behaviour.
- A failed claim or acceptance leaves no partial capture, transfer item, track,
  or completed session state.
- Rate limits and audit records cover session creation, claim, acceptance, and
  cancellation without placing transfer payloads in logs.
- QR/code pairing works when NFC, Bluetooth, camera, or Web Share is unavailable.
- Keyboard and screen-reader users can complete sender and receiver flows.

## 10. Location-aware discovery

### Location input

The app may request browser location only when the user opens Here or explicitly
enables location-aware discovery. It must not continuously track the user.

If permission is denied, offer:

- a manually chosen city or area
- the last explicitly saved coarse area, if one exists
- the ability to continue using the rest of the app without location

Precise coordinates should be sent only for the active query and should not be
logged. Send location in an authenticated request body, never in a URL query
string. Persist a coarse area only when the user asks the app to remember it.

### Here mode

Here shows possibilities and offers from sources currently covered in the area.
It must not claim to show everything available locally.

Every result must carry enough metadata to support:

- approximate distance or area
- source
- observed time
- expiry or freshness
- whether it is a possibility, offer, or occurrence

The UI should communicate coverage honestly:

> Possibilities from the sources currently covered here.

### Location launch contract

Phase 4 is blocked until the product owner records a launch contract containing:

- the initial city, region, or other bounded geography
- the distance/radius behaviour
- every approved source and its terms of use
- the refresh or expiry rule for each source
- the minimum fields each source supplies
- the exact coverage wording shown to users

The initial supply should be user-contributed offers and occurrences plus
explicitly approved sources. The Here rail remains absent when the selected area
has no current source coverage; it must not be filled with unrelated global
catalogue results.

### For you here mode

The first ranking pass should use explicit evidence from the user's list:

1. exact active possibility match
2. same place or activity linked to an active possibility
3. same explicit intention or type
4. freshness and confidence
5. distance and time relevance

The result should explain itself:

> Because you saved “try pottery”.

Inferred taste, embeddings, and opaque recommendation models are not required
for the first release.

### Presentation

The Home surface may contain two horizontal rails:

- Here
- For you here

Each thumbnail must have accessible text, a stable aspect ratio, loading
placeholder, source attribution where required, and a detail view. A dedicated
page must provide the same information in a more navigable list/grid for
keyboard users and users who do not use horizontal scrolling.

### Coverage and freshness

The location system must distinguish:

- durable possibilities, such as a product or place
- offers, such as a shop currently selling a product
- occurrences, such as a workshop on a particular date

The latter two require expiry and should disappear or be marked stale rather
than being presented as current indefinitely.

## 11. Provider and service boundaries

External providers must be adapters. The rest of the application must not know
provider-specific response shapes.

Initial provider roles may include:

- film metadata and artwork
- book metadata
- place and local possibility sources
- user-submitted evidence
- image/object storage

Provider failure must not prevent raw capture. A provider is an enrichment
source, never the source of truth for whether a user may record an intention.

Use:

- server-only provider credentials
- cached provider responses
- rate limits
- typed result objects
- background processing for enrichment, deduplication, confidence updates, and
  notifications

No external provider call should be required to render the user's already saved
capture list.

## 12. Data and application architecture

Retain the existing stack: Next.js App Router, TypeScript, Drizzle, Neon,
Better Auth, and Vercel.

Retain the existing hard boundary:

- the browser never reaches the database
- every database function receives the authenticated session user first
- all user-scoped reads filter by that user or an explicitly authorised
  relationship
- server-only and the branded session user remain in force
- no direct Drizzle imports outside lib/db/

Use Server Actions for authenticated mutations where that matches the existing
codebase. Use route handlers for search, provider proxies, paginated reads, and
location queries. Validate every boundary with Zod.

Suggested application boundaries:

- lib/capture/ — capture creation, normalisation, and lifecycle
- lib/catalogue/ — possibility resolution, claims, merge, and confidence
- lib/location/ — location permission, nearby queries, offers, occurrences
- lib/matching/ — exact convergence and later distal matching
- lib/transfer/ — session lifecycle, claim/accept handling, imports, and audit
- lib/media/ — upload validation, storage, and attribution
- lib/db/ — all database access and privacy enforcement

The names may follow the existing structure, but responsibility must remain
separated. Do not put provider, matching, and privacy logic into page
components.

### Existing implementation map

The implementation should reuse the existing work as follows:

- Better Auth, profiles, handles, onboarding, and account recovery remain the
  account layer.
- The current lib/db boundary, branded session user, and server-only imports
  remain mandatory.
- The current items table becomes the starting point for canonical
  possibilities, with film/TMDB rows migrated rather than discarded.
- A new capture layer is the durable user-owned intention record and holds raw
  user input that may not yet have an item link.
- Existing entries are migrated into captures. During verification, a
  read-only compatibility projection may keep legacy screens working; new
  product mutations write captures only.
- Existing tracks, mutual naming, overlap classification, notification rows,
  and suppression rules are reused for friend convergence.
- The current responsive shell and accessibility utilities are retained, but
  the cinema wall is removed from the Home entry point.
- TMDB becomes one provider adapter rather than the definition of the product.

The Phase 0 migration must make external source/id nullable for
user-created canonical possibilities or introduce a namespaced manual source.
A fake TMDB identifier must not be used. Phase 0 also replaces legacy
film-specific vocabulary restrictions in linting and documentation with the
vocabulary in this specification.

## 13. Delivery sequence

Each phase must be deployed and verified before the next phase begins.

Phases 0 through 2 are Release 1. Phases 3 through 6 are separate launch
decisions, each gated by the evidence and operating requirements in that phase.

### Phase 0 — product and data migration

⚠ **Status: done, deployed and verified — 22 August, `origin/main` at
`33ff151`.** The runbook and its record are
`docs/re-direction/phase-0-production-migration.md`.

Deliver:

- this specification accepted as the product source of truth
- migration of film-specific entries into captures and possibilities
- captures established as the only new-write path for user intentions
- private and mutual-track visibility implemented
- the model's vocabulary — capture, possibility, visibility, provenance — in
  the schema, the data layer, the linting and the documentation
- legacy product rules in CLAUDE.md, README.md, plan.md, and linting aligned
- test fixtures for raw, resolved, private, and shared data

Exit criteria:

- no parallel capture/entry write path remains
- existing accounts and entries remain readable
- privacy tests cover every new projection

⚠ Amendment 1 moved *canonical vocabulary and status copy* to Phase 1, and the
*disputed* and *stale* fixtures to Phases 4 and 5. Phase 0 is a compatibility
and data-safety step: it changes what the records are, not what they say.

### Phase 1 — capture

⚠ **Status, 30 August: built, deployed, migrated, and used on a handset.**
Everything on the build register's *Still to build* list is built and nothing is
held back. The design and the build slice are
`docs/re-direction/phase-1-capture.md`, which carries the full register — what
is built, what is not, and what hardware has and has not answered. The markers
below are that register in one line each; the document is the account.

⚠⚠ **Do not record what state production is in — not here, not anywhere.** This
block said *no deploy in this phase has carried a migration* while three commits
selecting `captures.suggested_possibility_id` went out against a production
database that did not have the column, and **every signed-in request was a 500**
until the morning of 25 August. Two registers said the migrations were applied
and neither had asked. **`npm run migration:state` asks** — host first, then the
applied count, then whether the columns the page reads exist — and
`scripts/prod-check.sh` wraps it for production. The runbook's order stands:
*migrate production first, deploy second.*

⚠ **Four things are outstanding, and none of them is a screen that does not
work:** the vocabulary migration (deferred, and the only non-additive one in the
phase), a `kind` that is not a film, a Blob store for the photographs that are
already built, and the binding acceptance criterion below. ⚠ **The thing detail
view was the fifth and is closed — 30 August.** Phase 2 step 1 built the console
(a tap on a line opens the whole capture) and deleted `film-screen.tsx` into it.

⚠ **The binding criterion was closed at the user's direction on 24 August and
was never stopwatched.** *Accepted* and *measured* are different claims and only
the first is true. The first handset session also reversed two decisions the
design had made — the record is newest-first with the caret under the bar, and a
line is only as wide as its own words — both recorded in the register and in
`docs/decisions.md`. ⚠ The second of those was itself reversed on 28 August: the
one-line rule replaced it, and a record line now truncates rather than wrapping.

Deliver:

- **[built]** Notes-like Home
- **[built]** raw capture creation
- **[built]** optional provider suggestions — the offer is written onto the row
  (`suggested_possibility_id`) so that it *stands* rather than being recomputed,
  and the provider path is deliberately fire-and-forget: an offer that never
  lands is an ordinary outcome, not a failure, and costs the capture nothing
- **[built]** unmatched capture persistence
- **[built]** optimistic save and undo
- **[built]** personal list and detail view — the page and the settled tray were
  built in this phase; ⚠ **the detail view landed on 30 August as Phase 2 step
  1's console**, which is what a tap on a line now opens. `film-screen.tsx` was
  being kept for it and is deleted into it. See `components/console.tsx`
- **[built, and dark]** optional image attachment — built end to end and ⚠ **the
  upload path has never run**: there is no Blob store on the project, so the
  camera ships dark and lights the day one exists. Lodged rather than built
  around, at the user's direction of 25 August: do not build what costs money
- **[built]** edit/enrichment after capture — `setCaptureText` exists and the
  rewrite happens **in place**, in the page's one field. ⚠ A second tap on a line
  picks and never edits: the foot's pencil is the one door, so a tap on a line
  cannot mean two things depending on the tap before it
- **[part]** canonical vocabulary and status copy: the possibility types and
  intentions in §3, the conversion of existing records onto them, and the
  user-facing words that replace the film-first ones (Amendment 1, from
  Phase 0) — **the words are on screen** (`STATE_WORD`, `WHERE_IT_IS`); the
  Postgres enum and §3's types and intentions are untouched. ⚠ **Deferred at
  the user's direction on 24 August, and it is the only item nothing has
  touched** — because it is the **one migration in this phase that is not
  additive**. The three that shipped are nullable columns old code ignores, so a
  revert push is still a rollback; renaming enum values ends that permanently.
  It wants a phase that plans a down migration. ⚠ When it runs, `PUBLIC_STATES`
  is **re-derived** rather than renamed

Exit criteria:

- **[met]** a user can save any text without a provider result
- **[met, for film]** a user can save and resolve a known film or other
  supported possibility. ⚠ **Only film**: a capture acquires a kind by resolving
  to a possibility, and TMDB is the only catalogue in the product, so every
  possibility is a film. *Other supported possibility* has no referent until
  Phase 4's user-contributed catalogue or a second provider — which is also why
  `fixture` (**Have**) is a word in the tray that nothing can reach
- **[met]** reload, sign-out, and provider failure do not lose saved captures.
  There is a provider to fail now, and it cannot take a capture with it: the save
  completes first and the suggestion is a later, fire-and-forget write against
  four conditions in its own `WHERE`
- **[met]** every capture submission from the interface carries a client
  mutation id that is stable across a retry, and a retried submission returns
  the original record rather than a second one. ⚠ Phase 0 does not meet this:
  its only write path resolves a possibility first, so the unique key on (user,
  possibility, intent) carries the idempotency instead. A raw capture has no
  such key. ⚠ It cost no column — `client_mutation_id` was in the schema from
  Phase 0 — and `crypto.randomUUID` is unavailable outside a secure context, so
  `lib/mutation-id.ts` falls back to `getRandomValues`
- **[met]** no film wall or intent modal is required — the wall is deleted
- **[met]** an unresolved capture can be offered a possible resolution without
  being silently converted or matched. The offer resolves nothing on its own;
  accepting is a second, explicit write, and a refusal is recorded
  (`resolution_declined_at`) so the same question is never asked twice — which
  is the whole difference between ignoring an offer and refusing one
- **[part]** no user-visible screen, label, or new write uses film-first
  vocabulary, and every active capture and possibility is represented in the
  vocabulary of §3 — no screen does; the stored values and `VOCABULARY` still
  read `want`, `go_back_to`, `fixture`, `see`, `own`
- ⚠ **and one criterion this list does not carry, which is the binding one:**
  *open, typed into, and closed in under five seconds, one-handed.* It is
  measured on a thumb and nothing else, and it is **unmeasured** — closed at the
  user's direction on 24 August, judged good on hardware, never timed. See the
  design document's *Only hardware can answer this*, which is where anyone
  reopening Phase 1's acceptance starts
- ⚠ the read-only legacy comparison surface is exempt: `entries` and
  `captures.legacy_entry_id` are retained historical records kept to verify the
  Phase 0 migration against its own source, and they are retired by their own
  separate migration rather than by this criterion. A criterion that included
  them could not be met while they exist, which is deliberate

### Phase 2 — friend convergence

⚠ **Status, 30 August: the matching engine is deployed and nothing reads it.**
This section reads as unstarted and is not. What already exists, inherited from
the film-first build and re-pointed at captures in Phase 0:

- `tracks` with mutuality, and `/u/[handle]` as the shared page
- `lib/overlap.ts` as the one matching owner — **one set-based SQL statement**
  joining `captures` to itself, on both triggers: a capture resolving
  (`lib/db/captures.ts`) and a track becoming mutual (`lib/db/tracks.ts`)
- the suppression rule for copied and transferred provenance
- `notifications` rows written in the same transaction as the write that caused
  them

⚠ **And the half that makes it a product is still unbuilt.** **Nothing in the
tree reads the `notifications` table** — the rows have been accumulating behind a
surface that does not exist, which also means the fan-out has never been proved
end to end with two accounts. Neither is there an overlap list or detail, a
QR/code contact handshake, or a possible-match prompt for unresolved
normalised-equal captures.

⚠ **Steps 1 and 2 of the design's sequence are built and deployed — 30 August:
the CONSOLE and the SWIPES.** A swipe on a row crosses it off one way and asks
*Again?* the other; the haptic vocabulary is wired and is inert on iOS, which
Safari gives no Vibration API. Neither touches the network.

**The console.** Tapping a line opens a box holding the whole capture, its
photograph, its link, its year, its standing question and its three controls —
cross off, rewrite and settle. **It touches no network and reads no
`notifications`**, so none of the paragraph above has changed; what it changes is
that Phase 2 now has the surface every later piece of it hangs on. The portal is
*a list of things that open consoles*, and the convergence sentence lands in a
slot this box already leaves empty.

It also closes Phase 1's outstanding **thing detail view**: `film-screen.tsx` was
kept for a surface nothing opened and is deleted into this. The design and its
consequences are `docs/re-direction/phase-2-convergence.md`, whose §1 is deleted
now that the code carries the argument; the build is `components/console.tsx` and
`console-sheet` in `app/globals.css`, measured by
`node_modules/.probe/console.mjs` on a handset and a desk.

⚠ **A constraint to know before planning this: overlap joins on
`possibility_id`, so only *resolved* captures can converge** — and TMDB is the
only catalogue. Today two people can converge on a film and on nothing else. The
exit criteria below are writable against that; the product they describe is
narrower than it sounds until Phase 4.

⚠ **Phase 2's first visual decision is the colour that marks overlap**, and §11
now makes it harder than it was: the accent's job is to interrupt, and splitting
`--color-chrome` off made the screen louder, so the colour to out-shout is the
lit brass rather than the muted one beside it in the palette. Do not pick it
before there is a convergence to look at.

Deliver:

- mutual tracks
- QR/code contact handshake that creates mutual tracks; no list import yet
- share visibility
- exact canonical overlap
- possible-match prompts for unresolved, normalised-equal captures; no
  notification until each user confirms the resolution
- in-app convergence notification
- overlap list and detail
- suppression for copied/source entries

Exit criteria:

- two real accounts can capture the same possibility and see one correct
  convergence
- a new mutual track triggers existing matching captures
- two people can complete a QR/code contact handshake without exposing either
  list
- identical unresolved text cannot create a false convergence, but can be
  reviewed as a possible match by its owner
- private captures never leak
- duplicate mutations do not duplicate notifications

### Phase 3 — proximity list transfer

Deliver:

- sender selection of one capture, selected captures, or an explicit collection
- receiver preview, per-item deselection, accept, decline, and block
- two-minute, one-use transfer sessions
- QR/code pairing with an accessible fallback
- transfer provenance and convergence suppression
- transfer audit records, cancellation, expiry, and rate limits

Exit criteria:

- a list import copies only the sender-selected snapshot
- private notes and source URLs are absent by default
- a replayed or expired token cannot import a second copy
- a transferred capture cannot create a convergence with its sender until the
  receiver explicitly makes it their own
- every transfer remains usable without NFC, Bluetooth, camera, or Web Share
- an accepted import writes its capture, transfer item, provenance, and audit
  record atomically; rate-limited or failed actions reveal no transfer payload

### Phase 4 — emergent catalogue

Deliver:

- explicit catalogue contribution
- candidate possibilities
- claims and provenance
- deterministic duplicate detection
- merge, dispute, and correction flows
- confidence states
- rate limits and abuse reporting
- a moderator audit trail and review queue
- test fixtures for disputed data (Amendment 1, from Phase 0)

Exit criteria:

- repeated independent entries can corroborate a possibility
- copied evidence is not counted as independent
- uncertain candidates are not silently merged
- users can withdraw a contribution without deleting another person's private
  capture
- every merge, unpublish, restore, and dispute decision is auditable

### Phase 5 — location discovery

Deliver:

- explicit location permission
- manual location fallback
- an approved location launch contract
- Here and For you here
- local possibility, offer, and occurrence records
- source, freshness, and expiry display
- horizontal Home rails plus an accessible dedicated page
- test fixtures for stale and expired data (Amendment 1, from Phase 0)

Exit criteria:

- location denial leaves the rest of the app fully usable
- an area without source coverage does not render a misleading Here rail
- results never claim complete local coverage
- stale and expired records are visibly differentiated
- For you here can explain its relation to the user's list

### Phase 6 — distal matching and maturity

Deliver:

- explicit opt-in
- verified adult eligibility
- explainable overlap matching
- two-sided reveal
- block, report, unmatch, and moderation
- push delivery only through the background worker

Exit criteria:

- no stranger can infer a private list
- every match has an explanation
- blocked users cannot reappear through matching
- matching can be disabled without affecting private capture or friend
  convergence

## 14. Testing and acceptance

### Capture

- Save a free-form input with no suggestion.
- Save a known provider result.
- Save while the provider is unavailable.
- Preserve the user's original wording after resolution.
- Press Return repeatedly without duplicate canonical entries.
- Undo a newly created capture within the allowed window.
- Confirm that undo cannot remove an already resolved or completed record.

### Privacy

- A private capture is absent from every unauthorised list, query, notification,
  aggregate, and search result.
- A catalogue contribution does not reveal the user's private note or full
  capture history.
- A user's precise location is not persisted or logged without consent.
- Done, dropped, disputed, and stale states are not accidentally exposed.
- Account deletion and blocking remove access everywhere they should.

### Convergence

- Same canonical possibility plus mutual track creates one match.
- Same text without canonical resolution does not create a false exact match.
- A copied capture does not notify its source user.
- Mutual tracking after both captures already exist triggers the match.
- Untracking removes future visibility without generating a loss notification.

### Proximity transfer

- A contact handshake creates mutual tracks only after both participants confirm.
- A list transfer expires, cancels, and rejects replay correctly.
- The receiver can decline, deselect individual captures, or block the sender.
- Imported captures omit private notes and source URLs by default.
- Transfer provenance suppresses convergence with the sender.
- Explicitly making an imported capture one's own removes only its provenance;
  it can then converge with the sender only when all ordinary rules are met.
- A blocked user or decoded token cannot reveal a transfer preview or payload.
- Transfer creation, claim, acceptance, cancellation, and rate limiting leave
  the required audit trail without logging the payload.
- QR/code pairing is accessible without camera, NFC, Bluetooth, or Web Share.

### Catalogue

- Two different raw entries can resolve to one possibility.
- One ambiguous raw entry can remain unresolved.
- Duplicate images and copied URLs do not inflate independence.
- A possibility can be real while its local offer is expired.
- A disputed possibility remains traceable and reviewable.

### Location

- Permission denied, unavailable, and manually selected location each have a
  usable path.
- Nearby results are bounded by the requested area.
- Here and For you here are distinct modes.
- For you here explains at least the strongest relevance reason.
- Expired occurrences do not appear as current opportunities.
- Horizontal rails have an equivalent keyboard-accessible presentation.

### Responsive and accessibility

- Capture works at 320px width and with the software keyboard open.
- No focused input is hidden at any supported viewport.
- Keyboard users can capture, select a suggestion, save, open detail, and
  navigate every rail.
- Screen readers receive save, loading, success, error, and overlap updates.
- Images have useful alternative text or are marked decorative correctly.
- Reduced motion, zoom, large text, and touch target requirements remain
  satisfied.

### Engineering quality

Before each phase is accepted:

- npm run lint
- npm run typecheck
- npm run build
- unit tests for normalisation, confidence, visibility, and matching
- database integration tests for every privacy guarantee
- browser tests for the full capture and convergence paths
- production CSP verification
- failure tests for provider timeout, rate limit, malformed data, and expired
  records

## 15. Definition of done

The implementation is complete when a new user can:

1. open Again and immediately type an intention
2. save it whether or not a catalogue result exists
3. enrich it without losing their original wording
4. keep it private or explicitly share/contribute it
5. see a meaningful overlap with a mutual track
6. meet someone and use a deliberate transfer to add each other or import a
   selected list without exposing anything else
7. open the app in a place and browse honest local possibilities
8. see which local possibilities relate to their own list
9. opt into explainable matching with strangers, or remain entirely private

The finished app must feel like a personal notes tool that happens to create
social opportunities—not like a catalogue, recommendation feed, or marketplace
that happens to contain personal lists.
