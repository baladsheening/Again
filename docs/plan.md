# Plan

The build order from §12, with state. Update this as phases move — it is the
only place the sequence lives outside the brief itself.

`docs/decisions.md` holds *why*. This holds *where we are* and *what must not be
forgotten*. When an item here is done, it leaves; it does not collect a tick.
The record of how it was decided is in `decisions.md`, which is the file that
keeps things.

**Ship each phase to Vercel before starting the next** (§12). A phase is not done
because the code exists.

Current at `0f52dba`, 15 August 2026.

---

## Status

| Phase | Scope | State |
|---|---|---|
| 0 — foundations | Neon, Drizzle schema + migrations, Better Auth, `lib/db/` convention | **Done.** Verified against the live DB |
| 0.5 — account recovery | Password reset, auth rate limiting, `lib/email.ts` | **Done.** Reset proven end to end to a real inbox |
| 1 — single player | Profiles, capture, entries, collections, resolve flow, the visual system, the phone shell | **Done and deployed.** Judged on hardware over four sessions |
| pre-2 | Stop the wall claiming what it cannot support; decide whether Again becomes cinema-aware; split the databases | **Planned, nothing built.** This is the next work |
| 2 — two players | Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'` | Not started |
| 3 — overlap | Trigger + notification rows, `/notifications`, `/overlap` picker. In-app only | Not started |
| 4 — swap | Full flow, blind commit enforced in the data layer, `landed` | Not started |
| 5 — PWA + push | Manifest, service worker, VAPID, subscriptions, install prompt | Manifest and install exist; push does not |

Live at `https://again-msaef.vercel.app`, deployed from `main` on every push
since 8 August.

§13: the multiplayer half is roughly **80% of the work and 100% of the value**.
Phases 2–4 are the product, and everything below is arranged so that nothing
outranks them without a reason written down.

---

## Outstanding

One line each. The detail is further down, or in `decisions.md` where it is a
question rather than a task.

### Pre-phase 2 — the next work

- [ ] **The wall claims *In cinemas* and cannot support it.** Relabel to something
      TMDB can carry. Unblocked, and the wording is a decision. → *Pre-phase 2,
      Stage 0*
- [ ] **D1: does Again become cinema-aware at all?** Everything else about
      showtimes waits on this. → *Pre-phase 2, the three gates*
- [ ] **D2: which showtimes provider**, if D1 is yes. Trial key, one venue, one
      day, one question about TMDB ids. → *Pre-phase 2, Stage 1*
- [ ] **D3: how the app learns where someone is.** Country from an IP is all it
      has. → *Pre-phase 2, Stage 2*
- [ ] **Separate the production and development databases.** Required either way,
      and required before two accounts exist. → *Pre-phase 2, Stage 4*

### The product

- [ ] **Phase 2** — tracks, `/u/[handle]`, visibility, copy. → *What is next*
- [ ] **A private one-line note on your own entry.** Decided 8 August, needs a
      column and a migration. → *Carry-forward, Phase 2*

### Before a second person can use it

- [ ] **A verified sending domain in `EMAIL_FROM`.** Resend's shared sender
      delivers only to the address that owns the account, so a second user's
      reset mail fails silently on their side. → *Blocking*

### Correctness nobody has looked at yet

- [ ] **The masthead field on the handset.** The device produced the reports that
      caused it; the result has not been seen there. → *Verification debt*
- [ ] **Split-screen and 200% zoom**, in one browser session. → *Verification debt*

### Smaller, unscheduled

- [ ] **No live regions anywhere in the app** — the ten-second undo is announced
      to nobody. → *Unscheduled*
- [ ] **`/settings` does not exist**, and three things want it. `/profile` is
      where they land. → *Unscheduled*
- [ ] **Reset rate limiting is per IP, not per email address.** → `decisions.md`
- [ ] **The poster wall behind `/sign-in`.** Open since 9 August on presentation,
      not on whether to build it. → *Unscheduled*

### Open questions, none blocking today

All in `decisions.md` under *Still open*, each biting in a named phase: five
notification kinds or six; overlap never firing when a track becomes mutual
(Phase 2, and it is the seed-time case); swap landing against the unique
constraint (Phase 4); the invented counterpart copy for `guide` and `lend`;
groups.

### Housekeeping

**The build spec is not in the repo, and this is a note rather than a task.**
Every § reference in `CLAUDE.md`, this file and `decisions.md` points at a
document that has never been in this repository — no trace in git history, and
searched for without success on 15 August.

It matters less than the number of citations suggests. `CLAUDE.md` restates the
operative half; every passage that decides anything is quoted verbatim somewhere
in these three files; and the rules that must not drift are held up by ESLint,
`server-only`, the branded `SessionUser` and the two §13 tests rather than by a
reference. Nothing has been blocked by its absence.

If it turns up in a chat or a folder, paste it in as `docs/brief.md`. Do not go
looking for it.

---

## Pre-phase 2

Everything that has to happen before tracks are built. **None of it is
implemented.** Stage 0 is the only part safe to do without an answer; the rest
waits on the gates below.

### The problem, stated once

The wall says *In cinemas*, and TMDB cannot support that sentence. `now_playing`
is a `discover` call over **release dates**; TMDB holds no record of when a film
leaves a cinema and no cinema programming at all. Their own forum states it:
*"it may not be very accurate, as TMDB has the premiered release date but doesn't
have the date that ended in the cinema."*

Checked on 15 August against one venue's published programme (Picturehouse
Central): films on the wall under *In cinemas* showing nowhere in the UK, films on
at that venue absent from the wall entirely, and a major release missing from both
halves. Paging every list did not fix it and could not — it is the wrong question,
not too few answers. Repertory and re-release screenings, which are a large part
of that venue's programme, have no new release date and are structurally invisible.

⚠ **The label created the fault.** Until 14 August the wall was unlabelled posters
and made no checkable claim. Everything below follows from choosing whether to
support the sentence or stop saying it.

### The three gates

None is answered. Each blocks what follows it.

**D1 — does Again become cinema-aware at all?** A screening is an *occasion*, so
the line recorded in `decisions.md` permits it where a streaming link is refused.
That makes it allowed, not decided. It brings a monthly bill, a location feature,
and the first data in the product that **decays** — a showtime is true for a day.
⚠ It also fails §13's test outright: cinema listings make the app more useful to a
stranger with no friends on it.

**D2 — which provider, if D1 is yes.** Evaluated 15 August, prices as published:

| Provider | Coverage | Price |
|---|---|---|
| UK Cinema API | 18 UK chains inc. Picturehouse, Curzon, Everyman, Odeon, Cineworld, Vue, plus select independents; booking links, formats, accessibility and event screenings; daily | £49/mo, £499/yr. **UK only** |
| International Showtimes | 120+ markets, ~25,000 cinemas, deep booking links, **native TMDB id matching** | from €149/mo **per market**; 7-day free trial |
| MovieGlu | 125 countries | quote only |

Scraping is not an option: CineList and its successors were killed by Cloudflare,
and a per-chain scraper is a per-chain maintenance obligation in every market.

**D3 — how the app learns where someone is.** Country from an IP is all it knows,
and cinemas are local. Browser geolocation, a stored postcode, or a chosen city —
each is user context, which `decisions.md` deferred deliberately, and each needs
`/settings`, which does not exist.

### Stage 0 — Stop making the claim

**Do this regardless of every gate, and first.** The home screen currently states
something false, and the cheapest correct fix is to stop stating it. Relabel the
first half to something TMDB can support — *New releases*, *Just released*, or no
label — and leave *Coming soon*, which is a release-date claim and therefore true.

It is not throwaway work. Even with showtimes there is a "recently released" tier,
and the wall's actual job (§8: a capture prompt for what you have been meaning to
see) never needed a listing.

⚠ **The exact wording is a decision, not a task.** It is the one thing on the home
screen a new account is guaranteed to read.

### Stage 1 — Evaluate a provider, on a trial key

Bounded, a week, and it produces a written verdict rather than code.

- Take the International Showtimes 7-day trial.
- **The one question that decides the integration: how cleanly do their films map
  to TMDB ids?** `items` is keyed on TMDB ids and `lib/overlap.ts` joins on
  `items`, so a provider returning titles means building a matching layer, which
  is where this class of integration usually fails.
- **The acceptance test is the one the app already failed**: for one venue and one
  day, the provider's list must match that venue's published programme. Compare
  against Picturehouse Central, which is the ground truth that found this.
- Price UK Cinema API against the same test. It is a fifth of the cost and covers
  one country, which may be the right trade while there is one user.
- Record the verdict in `decisions.md` whichever way it goes.

### Stage 2 — Location

Blocks stage 3 and nothing else. Needs D3, `/settings`, and a decision about
whether a refused permission degrades to country-level or to no wall at all.

### Stage 3 — Build it, only if D1 is yes

- One provider, one adapter, in `lib/showtimes/`. **No abstraction layer** —
  `decisions.md` argues against speculative generality under *What not to build*,
  and the insurance is the schema.
- Provenance on every screening: source and when it was last checked. This is the
  first thing in the product that can be out of date, and the expansion model's
  freshness rule exists for exactly it.
- The wall becomes what is showing near you, with an honest coverage line — *"from
  the cinemas we cover in your area"*, never an implied all.
- ⚠ **No booking link.** The line is acquisition versus occasion; a checkout is the
  wrong side of it and starts pulling the whole product towards being a listings
  business.

### Stage 4 — Split the databases

Independent of everything above and required either way. Production and
development share one Neon database; Phase 2's checkpoint is *two accounts on two
devices*, so the test accounts would be created in the database the live site
reads. A Neon branch for local development, production left on main, `.env.local`
repointed.

### Not in scope here

Global coverage claims, venue pages, seat maps, ticket prices, anything a stranger
with no friends on Again would open the app for. Kinds beyond film.

### Exit criteria

Pre-phase 2 is done when the wall says only what it can support, the databases are
separate, and **D1 is answered either way and written down.** Building showtimes is
not required to leave this stage — deciding about them is.

⚠ **Recorded because it was argued and not taken:** the recommendation was Stage 0
now and showtimes after Phase 2, on the grounds that tracks and convergence are
what the app is for and neither exists. Sequencing this before Phase 2 is a
deliberate choice against that advice, which is a fine thing to be — it is here so
nobody re-derives the argument in a month.

---

## What is next

Ordered, and each is genuinely blocked by the one above it.

### 0. Pre-phase 2

The section above. Stage 0 and Stage 4 are unblocked today; the rest waits on D1.

### 1. Phase 2 — tracks and the other person

Where the value is, and everything the app currently lacks is downstream of it.
`/u/[handle]`, the §5 visibility rules in `lib/db/`, copying with
`source='copy'`, and the identity question below.

Three things must land with it rather than after it — all three are in the
carry-forward register, and each one is the kind of omission that fails silently:
`listEntriesForOtherUser` never returning `done`, the private `note` staying out
of the shared projection, and the overlap fan-out firing when a track becomes
mutual.

**The checkpoint is §12's, taken literally:** two accounts on two devices seeing
each other correctly. Not how the list looks.

### 2. The verification debt, alongside it

Small, and none of it blocks Phase 2. See *Verification debt*.

### 3. Phase 3 — overlap

The first time the accent is used for anything, and the first time a
notification arrives that neither party triggered.

---

## Decided 15 August

Written up in full in `decisions.md` under *What Again is for, and the map it is
not*. What it changes here:

- **The aim is the convergence graph.** Films are the first kind, not the shape.
- **The "living map" of occurrences is not a separate product** — it is the same
  mechanism with a second trigger — but it is **not being built, and the database
  is not being prepared for it.** An `occurrences` table is additive; identity is
  the one expensive retrofit and is cheap while there is a single source. The
  preparation is due when a second source arrives.
- **The four-brief expansion programme proposed on 10 August is not being run.**
  Its architecture preflight was a prerequisite rewrite for a feature that has
  been deferred, and `decisions.md` already argues against the abstraction layer
  it would have produced.
- **If occurrences are ever built:** only against a want already held, shared
  with someone who already tracks you back, no booking link, and not before
  Phase 4. The line is *acquisition versus occasion*.

⚠ **D1 in *Pre-phase 2* reopened the second and fourth of those the same day**,
and from the honest direction: not a roadmap wanting occurrences, but the wall
being caught making a claim TMDB cannot support. Nothing above is withdrawn — the
aim is unchanged and the line still holds — but *not before Phase 4* is now
something to decide rather than something decided. The trigger those entries named
was evidence from real use, and this is that, arriving early.
- **The app feeling inert is Phase 2's absence, not a design fault.** The
  designed supply of new things is other people. Do not answer it with content.

---

## Verification debt

Specific, and short. Everything else about the app has been driven in a browser
or seen on the handset.

- [ ] **The masthead search field on the handset.** The device produced three
      reports on 13–14 August — a black sheet over the posters, flicker while
      scrolling with the keyboard up, a slither of a gap under the bar — and all
      three are answered by moving the typing to the top. The answer has been
      driven in a browser (42 assertions at 390×780, 8 at desk width) and not
      looked at on the phone that found them.
- [ ] **Split-screen and 200% zoom**, in one browser session, at 507px and at
      320px. Treat the result as a verdict on `--breakpoint-rail: 45rem`: an iPad
      halved falls below it and gets the phone layout, which is either the
      breakpoint being honest about layout or a device rule in disguise.
- [ ] **Deep paging against the real API.** Search results are confirmed on the
      deployed app; nobody has scrolled a broad query — `b`, or `star` — past the
      first twenty to check the posters keep coming and never repeat. TMDB's host
      is blocked from the build environment, so this can only be done by hand.
- [ ] **The 90ms debounce on mobile data**, where it may be spending requests the
      next keystroke throws away. The lever is `DEBOUNCE_MS` in
      `components/search-provider.tsx`.
- [x] ~~**`inCinemas()` and the regional wall against the real API.**~~ Answered
      on 15 August by checking the deployed wall against UK listings, and the
      answer was that it is **wrong on its own terms** — see *Pre-phase 2*. The
      endpoint parses, the region reaches TMDB, the ordering is right, and none of
      that makes *In cinemas* true. What was verification debt is now a product
      decision.
- [ ] **The masthead recede on a phone.** Built 15 August against the collection
      bar's existing signal. It never recedes while it holds the field, and
      leaving search reveals both bars; what wants looking at is whether losing
      the wordmark and the search glyph mid-scroll reads as a gesture or as a
      trap. The knobs are `ALWAYS_SHOWN_ABOVE` and the return on first upward
      movement.

---

## Numbers that must move together

Changing one of these without the others reintroduces a bug that has already been
fixed once. All are in `components/shell.tsx` unless noted.

| | |
|---|---|
| `shadow-[0_0.5rem_0_0_#000]` on the masthead ↔ the `+ 0.5rem` in `main`'s `pt-[calc(…)]` | keeps the mark-to-poster distance identical scrolled and at rest |
| foot `left-[calc(max(0px,50%_-_36rem)_+_17rem)]` + inner `gutter max-w-3xl` ↔ `rail:pl-68` and `rail:max-w-3xl` on `main` | puts the rail search row's two edges on the posters' two edges |
| foot `pb-9` ↔ rail `py-10` | 4px, so the search and *Sign out* share a baseline rather than a box edge |
| `MIN_QUERY` ↔ the Zod schema in `app/api/search/route.ts` ↔ the guard in `lib/tmdb.ts` | the search floor lives in three files |
| `--wordmark-ink` / `--wordmark-slack` ↔ the typeface **and the word** | measured, not derived. A change of face or of the word re-opens both |

**Two rows retired on 15 August, and not by being maintained.** The masthead's
height and `main`'s top padding used to be hand-derived from a trim measured at
36px, so a change of size, case or face needed three edits and the one that
mattered was the one nobody made. They read `--wordmark-ink` and
`--wordmark-slack` now, so the size is one line in `app/globals.css`. The
remaining dependency is the last row above: the ratios describe a *face setting a
word*, and both are warned about at the token.

**How to measure any of it:** a temporary route under `app/` rendering
`CaptureProvider` → `SearchProvider` → `Shell` with a fake `PosterWall`, plus a
client component reporting `getBoundingClientRect` and
`TextMetrics.actualBoundingBox*`, driven by `msedge --headless=new --dump-dom`. A
client component is required — the app's CSP blocks inline `<script>`. Delete the
route and run `npx next typegen` afterwards, or `tsc` fails on a stale route type.

---

## Blocking before anyone else signs up

- [ ] **A verified domain in `EMAIL_FROM`.** Unset, `lib/email.ts` uses Resend's
      shared sender, which ⚠ **delivers only to the address that owns the Resend
      account.** Enough to prove reset works, not enough for a second person —
      they get a 403 that throws on our side and reads as silence on theirs.
      `scripts/preflight.mjs` prints this on every build until it is set.
- [ ] **Separate the databases.** `DATABASE_URL` was copied from `.env.local` to
      Vercel, so production and development share one Neon database. Fine for one
      person; the moment a second joins, a local test row is somebody's data.

Everything else that used to be on this list is done: Upstash, Resend, the
`lhr1` region, and `BETTER_AUTH_URL`. `scripts/preflight.mjs` fails a production
build without them, which is why they cannot silently regress.

---

## Carry-forward register

Things that must land in a **specific** later phase. Each was a real decision,
not an oversight — the reasoning is in `decisions.md`.

### Phase 2

- [ ] **Overlap must fire when a track becomes mutual.** §6 only runs the fan-out
      on entry insert and state change, so two people who already hold matching
      wants and *then* start tracking each other produce nothing. That is exactly
      the seed-time case §13 describes — a dozen friends joining in a week and
      backfilling before the graph is complete — so the app's first impression is
      the case it currently misses. Fix: call the same `lib/overlap.ts` fan-out
      from the track mutation, scoped to that pair.
- [ ] **§13 test one:** another user's `done` entries are never returned.
      `listEntriesForOtherUser` exists and is written for it.
- [ ] **The private note must not reach `/u/[handle]`.** When
      `listEntriesForOtherUser` gains its projection, `note` stays out of it and
      out of any type that projection returns. Same shape as the `done`
      exclusion: nothing fails, nobody notices, and the guarantee is gone.
- [ ] **Decide what a person is called before `/u/[handle]` exists.** *People who
      know you should see your name; the handle is for strangers who land on your
      page.* Half of it already exists and is unused — `profiles.display_name` is
      collected at onboarding and already preferred over the handle in
      `lib/overlap.ts`. Mutual track = name, otherwise handle, is the obvious
      reading and matches §5's shape. Worth stating before it is assumed.
- [ ] **Build the private note.** One nullable text column on `entries`, bounded
      by Zod at the boundary, read and written through `lib/db/entries.ts` on the
      `SessionUser`. The identifier is `note` — `no-restricted-syntax` fails the
      build on `review`, correctly. Where it is offered is not decided and is
      small.

### Phase 3

- [ ] **`guide` has no evidence behind it any more.** §6 specifies *"{name} wants
      to see {title}. You've been back n times."* The return count was removed on
      8 August, so the copy now makes the same claim with nothing supporting it.
      Accept the weaker sentence, find another signal, or bring the count back for
      this one purpose — the column still exists, so the third option costs a
      migration of nothing.
- [ ] **The push worker must not fire inside the 10-second undo window.** Undo
      deletes the row, which is fine while notifications are in-app only. Once
      push exists, an undone typo still buzzes someone's phone.
- [ ] **Resolve five notification kinds or six.** §6 says five; the schema and §8
      say six. Six are built.
- [ ] **Read through the counterpart copy** for `guide` and `lend`, which was
      invented and marked as invented in `notificationCopy`.

### Phase 4

- [ ] **Swap landing versus the unique constraint.** If a swapped-in item is one
      the receiver already has an entry for, the insert is a no-op — so the giver
      can never receive a `landed`, which §7.5 calls the only feedback loop in the
      product. Current intent is on-conflict-do-nothing; not decided.
- [ ] **§13 test two:** swap items stay hidden until both sides commit. `getSwap`
      exists and is written for it.

### Phase 5

- [ ] **TMDB attribution.** A licence condition of the free key: the required
      sentence plus their logo, less prominent than our own branding. Belongs in
      `/settings`.
- [ ] **iOS requires home-screen install for push to work** — surface that in
      settings rather than hiding it (§12).

---

## Unscheduled

- [ ] **Live regions and `aria-busy`.** There are none in the app. Two moments
      are announced to nobody: the capture toast, where *Added {title}. Undo* is
      the only reversible action in the entire product and disappears on a
      ten-second timer, and the search wall, which replaces itself 90ms after a
      keystroke and renders its three failure strings into silence. Additive, and
      it holds on every device by construction.
- [ ] **`/settings` does not exist.** Three things want it: TMDB attribution (a
      licence condition), the iOS install note, and changing a password you *do*
      know — reset only serves the case where you have forgotten it, so a
      signed-in user currently cannot change their password at all. `/profile`
      exists and is where all three land; the route, the layout and the sign-out
      path are in place, so each is an addition rather than a new screen.
- [ ] **The poster wall behind `/sign-in`.** Asked for on 9 August, deferred
      twice, and still open on *what it should look like* rather than on whether
      to build it. Three directions were costed and are only recorded in a
      screenshot in the repo root: a dense dimmed grid, a single slow column
      behind the form, or four or five large posters at 8% opacity placed as a
      collage. The first reads as a streaming service, which is the §2 trap in
      visual form. All three need the same plumbing — a cached trending source —
      so the decision is presentation only and can wait. §12 calls the sign-in
      page the least of it, which is the argument for it being last.
- [ ] **Reset rate limiting is per IP, not per email address.** A distributed
      attacker could still fill one person's inbox. The fix means reading the
      request body in `app/api/auth/[...all]/route.ts`; deliberately not built.
- [ ] **`control-box` on fine pointers.** 38px because a mouse is precise, not
      because 38px looks good. The auth fields are the only place it is still
      felt, and it is the last survivor of the desktop list from 9 August.

---

## Checkpoints

§12 gives one explicitly, and it is worth taking literally.

- **Phase 1:** "This phase will look finished and feel like most of the app. It
  is about a fifth of it. Do not polish here."
- **Phase 2:** "The real checkpoint is two accounts on two devices seeing each
  other correctly. Judge progress by this, not by how the list looks."
- **Phase 3:** a notification arrives that neither party triggered directly —
  independent convergence, with the suppression rule holding for copies.
- **Phase 4:** neither side can see the other's picks before both commit,
  verified at the data layer rather than in the UI.
- **Phase 5:** a push arrives on a phone with the app installed to the home
  screen.

---

## Seeding (§13)

Not a phase, but it decides whether any of this works.

Seed narrow: one friend group, a dozen people who already talk about films. This
product gets *worse* with thin scale — a million users spread evenly produce no
overlap at all, while twelve friends produce it constantly.

If a feature request arrives that makes the app more useful to a stranger, it is
probably wrong.
