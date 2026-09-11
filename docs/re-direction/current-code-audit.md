# Current code against Release 1

Status: written 11 September 2026, after the Amendment 10 product reset.

This file records how the implementation as it stands compares with Release 1 as
`product-truth.md` and `consumer-product-strategy.md` now define it. It is a
snapshot of a comparison, not a build plan and not a register of what is
deployed. ⚠ **It must never state what migrations production has** —
`npm run migration:state` asks, and `scripts/prod-check.sh` asks production. A
number that is right when it is typed and silently wrong an hour later is worse
than no number.

Rewrite this file after the next substantive product reset. Do not maintain it
between resets; a stale audit reads as current and is the failure it exists to
prevent.

## The headline

The reset costs almost nothing already built. The browse rail it defers was
already off the front page, pulled on 7 September so the keyboard could be
judged with one variable on screen. What the reset does is convert three known
gaps into Release 1 blockers, add a fourth that was a deliberate decision going
the other way, and leave a quantity of dead weight visible for the first time.

Four buckets follow. The only one that has to be emptied before a beta is
**missing and essential**; the only one that can quietly mislead the next
session is **actively contradictory**.

## 1. Already aligned

Built, correct under the new strategy, and not to be touched by this reset.

| | Where |
|---|---|
| Free-form capture, suggestions that never gate | `components/compose-screen.tsx` |
| The durable record, one screen away | `app/(app)/record/page.tsx` |
| Reciprocal connection, neither list exposed by the request | `the-handshake.md`, `lib/db/tracks.ts` |
| Exact convergence on a resolved possibility, and its suppression rule | `lib/overlap.ts` |
| The portal — arrival — and the mark — memory | `components/portal.tsx`, the gutter mark |
| The privacy boundary itself | `lib/db/`, the branded `SessionUser`, the import ban |

The engine, the boundary and the two social surfaces are sound. The reset does
not weaken any of the guarantees in CLAUDE.md; it reorders delivery around the
thing they exist to make safe.

## 2. Useful but premature

Built or declared, costs nothing to keep, and must not be built on or deleted.

- **`listRail`, `items_rail_idx`, `possibilities.image_path`,
  `possibilities.open_count`.** The rail's data layer, dormant since the rail
  came off Home. ⚠ **Do not delete them** — discovery is deferred, not answered,
  and the backfills that populated them cannot be re-run for free. ⚠ **Do not
  build on them either**: the day `open_count` orders anything, the exclusion has
  been broken.
- **`pushSubscriptions`.** A declared table with **zero readers and zero
  writers** anywhere in `lib/`, `app/` or `components/`. It becomes essential the
  moment bucket 3's fourth item is built, and until then it is a table that
  exists because somebody thought ahead. Leave it.
- **`lib/tmdb.ts`, `lib/posters.ts`, `lib/film-request.ts`.** Resolution for
  exactly one kind. Not wrong — resolution is optional by design and a film is a
  real kind — but it is the only catalogue there is, which is what makes
  bucket 3's first item urgent rather than merely overdue.

## 3. Missing and essential

The Release 1 blockers, in the order they should be closed. Each one is a thing
a person would notice; none of them is a screen that looks wrong.

**1. Convergence on wording.** ⚠ **BUILT 11 September** — struck from this
bucket, and the account is `tests/words.test.ts` plus CLAUDE.md's entry. It
needed no migration: `normalised_text` was already a generated, indexed column.
The remaining three are still open.

**2. Matching consent, and a lock you can find.** Two things, neither built.
Nothing in `components/onboarding-form.tsx`, `components/track-button.tsx` or
`components/add-person.tsx` tells anybody that independently written captures
can produce a one-line overlap — the disclosure is nowhere on the path that
creates the relationship. And the lock is reachable only by a swipe;
`components/console.tsx` carries cross-off, rewrite and settle, and is the
obvious home for it. See bucket 4, which is why this is not merely an omission.

**3. The action after a convergence.** There is no `mailto:`, no `sms:`, no
`navigator.share` anywhere in the tree. The product currently stops at the
sentence — the exact stopping point that caused this reset. The bridge carries
the capture's **own wording**, and goes through the system share sheet rather
than a channel Again picks; `view.md` amendments E and F carry the reasoning.

**4. Earned delivery.** No service worker in `public/`, and VAPID keys are
optional in `lib/env.ts`. Delivery is in-app only, so a convergence arriving
while the app is closed is a convergence nobody is told about. Permission is
asked for at the **first convergence**, never at launch — it is the only moment
the dialogue can be truthful about what it will deliver.

## 4. Actively contradictory

Present in the tree and at odds with Release 1 as now defined. These mislead a
reader more than they cost to run.

- **The swipe-only lock.** This is not an omission, which is why it is here
  rather than in bucket 3. The current design *asserts* that the gesture is
  sufficient: the lock's teaching sentence was deliberately deleted on 4
  September, on the reasoning that a rare verb does not need teaching on a
  person's first capture. Amendment 10 reverses that. What the reasoning did not
  account for is that the gesture is the **only** disclosure that a private
  capture can produce a social event, and a responsibility that size cannot be
  carried by something nobody has been shown.
- **`swaps`, `swapItems`, `getSwap`.** List transfer — an **explicit Release 1
  exclusion**. Unreachable from any screen: nothing in `app/` or `components/`
  imports them. Yet `getSwap` is one of only **two** functions CLAUDE.md §3 names
  as carrying a guarantee whose breakage damages trust rather than function, so
  the repository's most emphatic privacy rule is currently spent defending a
  feature the product has decided not to ship. ⚠ **Nothing here authorises
  deleting user data**; the question is whether the guarantee should be retired
  with the feature, and it should be answered rather than left.
- **`entries`, and the legacy state machine.** Superseded by `captures`, kept
  for migration safety, still described at length in CLAUDE.md's legacy sections.
  `listEntriesForOtherUser` is the other of those two guarantee-carrying
  functions and has the same problem as `getSwap`.
- **`docs/re-direction/inactive/the-front-page.md`.** 52,000 characters of front-page
  design whose central proposals — the browse half, image-only tiles, the opening
  count — are deferred. It is banner-marked and has been moved to
  `inactive/`; it is listed here because a document is as capable of steering a
  build as a table is.

## What is not in any bucket

Privacy enforcement, the data boundary, transactionality, idempotency, the
vocabulary rules and the responsive guarantees are CLAUDE.md's, are intact, and
are unaffected by the reset.
