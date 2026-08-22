# Decisions

> **Mixed status.** *The re-direction* section below is current and applies to
> new work. Everything after it records decisions for the film-first product and
> its deployed implementation. When one of those conflicts with
> docs/re-direction/implementation-spec.md, the re-direction specification
> governs future work. Reuse the technical reasoning there only where it remains
> compatible with the new model.

Why things are the way they are, and what is still open.

`CLAUDE.md` holds the rules for building. This holds the reasoning behind them,
the choices that deviate from or extend the brief, and the questions nobody has
answered yet. If a decision here looks wrong later, the "what would change this"
line is the thing to check first — most of them are waiting on a trigger, not on
someone's opinion.

---

## The re-direction — 22 August

The product moved from a film-first diary to intent capture and convergence.
`docs/re-direction/implementation-spec.md` is normative: it owns the model, the
vocabulary and the phase sequence, and none of that is restated here. These are
the calls the specification left open, taken on 22 August. Everything below this
section is the film-first record.

### Visibility becomes a column, and the state allowlist stays

Visibility is currently derived from state alone. `PUBLIC_STATES` in
`lib/domain.ts` publishes `want`, `go_back_to` and `fixture`, and any signed-in
account holding a handle reads them. The specification requires captures private
by default, with one social scope: shared with mutual tracks.

The tempting reading is that a visibility column *replaces* the state filter. It
does not. §14 still requires that done, dropped, disputed and stale states are
never exposed, so a capture scoped to mutuals and then dropped has to disappear
anyway.

**Visibility is a fourth positive term, not a replacement.** A capture reaches
someone else only when its scope is `mutuals`, the relationship is mutual, and
its state is in `PUBLIC_STATES` — three conditions, all stated positively, all
failing closed.

The allowlist is positive for the reason already recorded against it:
`ne(state, 'done')` was correct exactly until `dropped` existed, and then it was
wrong with no symptom. Retiring the allowlist in favour of a visibility column
recreates that bug in a new place, where it would again fail by publishing
rather than by hiding.

### The migration lands every existing entry private

Phase 0 migrates entries into captures, and has to choose a scope for rows
created under a regime where the owner understood them to be handle-visible.

Private is the direction that cannot leak. It is not free: every migrated row
leaves the convergence pool until its owner re-shares it, so friend convergence
effectively starts empty.

**Took private.** The cost is acceptable only because the population is the
author plus test accounts — the databases were separated and the test accounts
cleared on 17 August. **This reasoning is contingent, not principled.** The same
choice against a real userbase is a silent feature outage, and a later migration
reaching for this precedent should read this paragraph rather than the verdict.

### `/u/[handle]` stops being a browse surface

Once non-mutuals see nothing, the page cannot show them an empty list. Empty is
ambiguous between *this person has nothing* and *this person has nothing for
you*, and the first is a claim about someone else's list that the app has no
business making.

**Non-mutuals get one unconditional state: the list is not shared with you.**
Unconditional is what makes it leak-free — the same response whether the owner
holds a thousand captures or none, so it carries no information about them.

The consequence is larger than the page. The old flow was *find handle → read
the list → decide to track*. That is gone, and nothing on the page replaces it.

### Mutual-only sharing does not ship without the handshake

Which makes the QR/code contact handshake load-bearing earlier than its position
in Phase 2 suggests. It is not a convenience for two people who happen to be in
the same room; after the inversion it is close to the only way anyone becomes
connected at all.

**The handshake is a required companion to mutual-only sharing in any usable
release**, even though the migration lands first and could technically ship
without it. A release that inverts visibility and offers no working way to
create a mutual track is an app in which nobody can see anybody.

### The copy rule survives; only its justification is retired

`app/(app)/u/[handle]/page.tsx` argues that public browsing must stay open
*because* §6's suppression rule exists to suppress copying off someone's page —
if the page needed permission, the rule would have nothing to suppress.

**That justification is retired. The rule is not.** The specification keeps both
conditions by name: a match is suppressed by the existing copy/source rule, and
when either capture was transferred from the other participant. Copying does not
disappear under mutual-only visibility, it narrows. A mutual can still copy off
a mutual, and receipt is still not independent discovery.

The mechanism already has the right shape. `isSuppressed` in `lib/overlap.ts`
tests `source` against `sourceUserId` directionally, which is what the
specification means by server-owned provenance. Transfer is a third value in
that union, plus a mutation that clears the pair when a receiver makes a
transferred capture their own. `'swap'` already occupies the bulk-copy slot and
swaps were never built, so the value is available.

**Do not delete the copy rule while deleting the paragraph that defended it.**

### The film screen stays; the wall goes with the Home it belonged to

The specification demotes the film screen to one type of resolved detail, and
removes the cinema wall from Home.

**Keep `film-screen.tsx` as the detail surface for a capture resolved to a media
possibility.** That is what the specification asks for, and the geometry that
settled into it — the receded poster, the cross-off, the corner disc — would
otherwise be rebuilt worse.

**Remove `cinema-wall.tsx`, `poster-wall.tsx` and `poster-tiles.tsx` when the
capture-first Home replaces them, rather than switching them off.** No flag and
no dormant surface: *remove the mechanism* is the first reach in `CLAUDE.md`,
and the app already carries one thing living behind a constant — the wall
caption, after D1. A second one is a pattern.

---

## Still open

Flagged to the client, not yet resolved. Listed first because they are the ones
that get lost otherwise.

### Five notification kinds or six?

§6 says "those five kinds in the schema are the complete set." The schema lists
six — `convergence`, `guide`, `lend`, `swap_invite`, `swap_revealed`, `landed` —
and §8 says "the six kinds."

**Built six.** All six are in `NotificationKind` in `lib/domain.ts`. If five was
meant, one has to go, and it is not obvious which.

### Overlap never fires on a new mutual track

§6 runs the fan-out on insert into `entries` and on state change. Two people who
already hold matching wants and *then* start tracking each other produce
nothing: the pair exists, but no entry moved, so nothing triggers.

This bites hardest exactly at seed time, when §13's "one friend group, a dozen
people" all join in a week and backfill their lists before the graph is
complete. The app's first impression is the case it currently misses.

**Proposed fix, not yet built:** call the same `lib/overlap.ts` fan-out when a
track becomes mutual, scoped to that one pair. Second caller, same module — it
does not scatter the logic, which is what §3 cares about. Belongs in Phase 2,
when tracking is built.

### Swap landing versus the unique constraint

§7.4 lands each side's picks in the other's wants. §10 says adding the same item
twice is a no-op. `unique (user_id, item_id, intent)` enforces it.

So if B already has an entry for a swapped-in item — already wants it, already
resolved it, already archived it — the insert is a no-op, and **the giver can
never receive a `landed` for that item.** §7.5 calls `landed` the only feedback
loop in the product.

**Current intent:** on-conflict-do-nothing, existing row and its `source`
untouched. Flagged rather than decided. Belongs in Phase 4.

### Groups

Raised 8 August 2026, explicitly to be kept rather than built: *people will want
groups — one for family, one for each friend group — and members of a group
should see each other's names rather than handles.*

**Not in the brief at all.** §5 has one relation, `tracks`, and it is a mutual
pair. There is no object between a person and their people.

It is not obviously out of scope either, which is why it is here rather than
dismissed. §2 excludes group *chat*, feeds and public discovery — sociality as
content. A group as a **visibility scope** is a different thing, and §13 already
assumes the shape: *"one friend group, a dozen people who already talk about
films"*, and *"two hundred people in twelve clusters produces constant
overlap"*. The clusters are in the design; they are just implicit, expressed as
a dense mesh of mutual tracks rather than named.

**What would have to be true for this to be right:** that a group does something
tracks cannot. Two candidates, neither yet tested against a real list —

- **Scoping what is visible.** Different lists to family and to friends. This is
  the one that cannot be built out of tracks, because a track is all-or-nothing.
- **Naming a cluster** so overlap can say where it came from.

**The risk, stated plainly.** Groups are an administrative surface: creating,
naming, inviting, leaving, who can add whom. That is a lot of product for
something whose value shows up only at a density the app has never had. §12's
checkpoint for Phase 2 is *two accounts on two devices seeing each other
correctly* — one pair, not twelve. Building the group object before the pair
works is the definition of the wrong order.

**Decision for now: keep, do not build.** Revisit when there are enough real
users that a single undifferentiated list of people is visibly wrong — which is
also the first moment there is any evidence about what a group should do.

**Sharpened 15 August, to one observable request.** A track is all-or-nothing, so
the moment groups become necessary is the first time somebody wants a want kept
from a *particular* person while it stays visible to everyone else — family
against friends. Until that is asked for, tracks do the job, and there are
already two pressure valves: `done` is private from everyone, and the note will
be. Naming a cluster so a convergence can say where it came from is pleasant and
is not a reason to build an administrative surface.

**The preparation is already done, and it is §3.** Visibility scoping is the
expensive kind of feature because it changes who can see what on every read — but
every read already goes through `lib/db/` on a `SessionUser`, so a group scope is
a filter added in one layer rather than a rule hunted through the app. That rule
was written for privacy; it happens to be the groups insurance too. Nothing else
needs doing in advance.

**The identity half is separate and is happening sooner.** "Names for people who
know you, handles for strangers" needs settling in Phase 2, when `/u/[handle]`
is built, and is carried forward in `docs/plan.md`. It does not require groups:
a mutual track is already a workable definition of knowing someone.

### Notification copy for the counterpart side

§6 gives exact copy for `convergence` and for the guide-holder's side of
`guide`. It does not give the other side's line for `guide` or either line for
`lend` beyond "{name} has a copy of {title}."

**Invented, and marked as invented** in `notificationCopy` in `lib/overlap.ts`.
Worth a read-through by whoever owns the voice.

---

## Decisions taken

### Neon WebSocket driver, not `neon-http`

§10 requires that "entries plus notifications plus swap state changes never
partially apply." The HTTP driver cannot do interactive transactions. The
WebSocket driver can, and it satisfies §10's pooling requirement at the same
time.

Cost: needs a WebSocket constructor. Node 22+ ships one globally, so this adds
no dependency.

*What would change this:* nothing likely. Dropping to `neon-http` would mean
giving up transactions.

### Better Auth `generateId: 'uuid'`, and the column defaults it implies

§5 has `profiles.id uuid references "user"(id)`, but Better Auth's default id is
an opaque string. `advanced.database.generateId: 'uuid'` fixes that in one line
and keeps the schema exactly as the brief has it.

**The trap:** with that setting Better Auth emits `values (default, ...)` and
delegates id generation to Postgres. The four auth tables therefore need
`gen_random_uuid()` as a *column default*. Without it every sign-up fails a
not-null constraint on `id`. The build was clean and the schema looked right;
only an end-to-end sign-up caught it. Fixed in migration `0001`.

### `profiles.handle_skeleton`

Not in §5. §10 requires handles be checked against homoglyph impersonation, and
a uniqueness check needs somewhere to compare. Stores the confusable-folded form
of the handle, unique — see `lib/handles.ts`.

This matters more here than in most apps: the entire product is "this list
belongs to my friend," so a handle that reads as someone else's is the attack
that actually pays.

### `items.external_source`

Not in §5. `kind` otherwise implies the catalogue by convention alone
(film→TMDB, book→Open Library per §2), and a convention is not something you can
query.

The unique constraint stays on `(kind, external_id)` as §5 specifies — one
canonical row per real thing. Widening it is a decision to take at migration
time along with a deduplication strategy, not a guess to bake in now.

### The 10-second undo deletes rather than defers

§10 mandates optimistic UI on add, §6 fires overlap on insert, and §5 allows a
10-second undo for typos. The obvious reading is a race: a mistyped entry
writes, notifies both sides, and *then* gets undone.

Two ways out. Defer the insert until the window closes — but then closing the
tab within ten seconds silently loses the add, and the capture tool drops
captures. Or write immediately and let undo delete, which §5.1 already sanctions
as the one exception to "nothing is ever deleted."

**Took the second.** `undoEntry` bounds the deletion in SQL by `created_at`
rather than trusting a timestamp from the client, and will not touch anything
already resolved.

This is safe today because notifications are in-app only until Phase 3. **Phase 3
must ensure the push worker does not fire inside the undo window**, or an undone
typo will still have buzzed someone's phone. Noted in `undoEntry`.

### `lib/domain.ts` split out of the schema

The domain unions — `Kind`, `Intent`, `EntryState` — are vocabulary (§4), not
schema. Client Components need them to render a label, and `lib/db/` is
`server-only`. Keeping them separate lets a Client Component speak the domain
without being able to reach the database.

Found by the ESLint boundary rule on its first run, which is a decent sign the
rule earns its keep.

### Nonce-based CSP, and the dynamic rendering it forces

§10 requires a CSP with no `unsafe-inline`. That means nonces, and nonces mean
every page renders dynamically.

Normally a real cost. Here it is free: every page is behind auth and personal to
the viewer, so none of it was ever going to be statically cached.

Lives in `proxy.ts` — Next.js 16 renamed the `middleware` convention.

### Upstash over Vercel KV, and the fallback that had to be closed

§10 permits either. Upstash keeps rate limiting portable if the app ever leaves
Vercel; Vercel KV would not.

**This was an open question until 8 August**, and the reason is worth keeping:
`lib/rate-limit.ts` falls back to an in-process `Map` when
`UPSTASH_REDIS_REST_URL` is unset, which is fine locally and **is not protection
in production** — each serverless instance gets its own memory, so an attacker
simply lands on a different one. It mattered more once `LIMITS.auth` began
guarding sign-in, sign-up and password reset, putting the fallback in front of
the account boundary and an emailed bearer token rather than only the TMDB proxy.
Better Auth's own limiter is no help: it defaults to in-memory too, which is the
identical hole.

Closed twice over. `scripts/preflight.mjs` fails a production build without the
credentials, because the fallback is undetectable after a deploy — the app looks
healthy, responds normally and simply does not limit anything. And the
credentials now exist and were verified against the live service (a pipelined
`INCR`/`EXPIRE` in London, counter 1 → 2, TTL 60s, key removed).

⚠ **Still per IP rather than per email address**, so a distributed attacker could
fill one person's inbox with reset mail. The fix means reading the request body
in `app/api/auth/[...all]/route.ts`; deliberately not built.

### `unoptimized: true` on images

§3 says poster images are served by TMDB's CDN and to never proxy images through
the app. Without this, `next/image` routes them through `/_next/image` and the
egress becomes ours.

### Password reset, and the removal of magic link

Magic link was carried for account recovery. It never did it. It signs you *in*
but never lets you fix the password, because every route to changing one is
closed to someone who has forgotten it — `changePassword` needs the current
password, `setPassword` only applies when none exists. So the flow it was
justified by did not exist.

Reset was built (one-hour token, single use, via
`emailAndPassword.sendResetPassword` and `/reset-password`), and magic link was
then removed rather than kept as a convenience. Two reasons beyond simply being
redundant:

- `disableSignUp` was never set, so a magic link could create an account with no
  password at all — and reset cannot repair that, since `resetPassword` expects
  an existing credential to replace. It was quietly producing a second class of
  user that the recovery path could not serve.
- It was a second emailed bearer token, which is a second inbox-spam surface and
  a second thing to get right, for a convenience already covered.

One way in, one way back in.

Decisions inside the reset flow:

- **`revokeSessionsOnPasswordReset: true`.** Reset is what someone reaches for
  when they think another person is in their account. Leaving other sessions
  alive defeats the point — the attacker keeps a valid 30-day cookie while the
  owner changes a string and believes they have fixed it.
- **The form says the same thing whether or not the address is registered.**
  Better Auth is careful about this server-side, including padding the timing;
  a helpful "no such account" in the UI would hand it straight back and turn the
  sign-in page into a way to ask whether someone has an account.
- **`lib/email.ts` is the single outbound path.** It throws in production rather
  than resolving quietly: a recovery email that reports success and never arrives
  locks someone out while telling them to check their inbox. Reset is now its
  only caller, but the seam is where a provider gets wired and where the next
  caller inherits the failure behaviour instead of reinventing it.
- **Auth endpoints now go through `lib/rate-limit.ts`.** `LIMITS.auth` had been
  declared since Phase 0 with no caller. Better Auth's own limiter defaults to
  in-memory, which on Vercel is per-instance — the same hole documented about the
  Upstash fallback. Only the endpoints that cost something are listed;
  `/get-session` runs on ordinary navigation and must never be throttled.

**Still open:** limiting is per IP, not per email address, so a distributed
attacker could still fill one person's inbox. Per-email limiting means reading
the request body in the route handler; not built.

Verified end to end against the running dev server and the live database:
sign-up, request, token TTL, the redirect through Better Auth's callback, the
new password taking effect, the old one being refused, and the token refusing a
second use.

### Correct on every screen

§10 asks for 320px up. What existed was a layout that did not *overflow*, which
is not the same thing. Five utilities in `app/globals.css` carry all of it, so
the rules live in one place rather than being re-derived per component.

**`gutter`** replaces `px-5` on every page container. `max(1.25rem, env(...))`
rather than an addition: in landscape on a notched phone the safe-area inset is
larger than the design gutter and should *replace* it. Add them and content is
shoved toward the middle of the screen on exactly the devices with least room.

**`safe-bottom`** is additive, unlike the gutter, because the home indicator
sits *over* the viewport. Use `max()` there and content ends up correctly spaced
from the screen edge and underneath the indicator anyway. Each page sets
`--safe-bottom-base` to whatever its design padding was.

**`control-box`** pins line-height and vertical padding — between them the whole
of a control's height. Inputs and buttons both wear it, which is what lets them
carry different font sizes and still align in the inline sign-in row. On a coarse
pointer it grows to 48px, clearing the 44px touch floor, without either of them
being told.

**`input-text`** is 14px, and **16px on touch**. Not a style choice: iOS Safari
zooms the viewport on focus below 16px and does not zoom back out. The other fix
is `maximum-scale=1`, which disables pinch zoom for everyone and is an
accessibility failure. So the type scale now differs by input device, which is
the honest trade — 14px reads better with a mouse, 16px is the price of a
touchscreen.

**`tap-target`** gives a 44×44 minimum hit area via a transparent
pseudo-element, on touch only and **without changing layout**. The entire resolve
flow is plain text buttons around 20px tall; padding them to 44px would blow the
list spacing apart on every screen to fix a problem that exists on one. Watch the
gap when two sit side by side — the areas overlap and steal each other's taps if
the visible controls are closer than the expansion. That is why Yes/No widens to
`gap-5` on touch: it is the one place in the app where a mistap does something
you cannot undo after ten seconds.

Two layout fixes that are not utilities:

- **`my-auto` on an inner wrapper, not `justify-center` on the parent**, for
  every vertically centred page. When a phone keyboard takes half a landscape
  viewport the content is taller than the container, and centred flex content
  overflows in *both* directions — the top goes above the scroll origin and
  cannot be reached at all. Auto margins collapse to zero when there is no free
  space, degrading to top-aligned and scrollable.
- **The nav yields in one place only.** The handle is the sole variable-width
  item, so it truncates and everything else is `shrink-0`. The `/me` collection
  tabs wrap rather than scroll: the four labels come to roughly 290px, which
  overflows 320px once the gutter is off, and a scrolling strip with no
  affordance just hides a tab.

**Not verified on hardware.** All of this is reasoned from the specs and checked
in the compiled CSS. Nothing has run on a phone.

### The typographic rule (§11), stated

§11 gives two instances of the same principle without naming it. Amber marks
overlap and nothing else. Mono marks counts and timestamps and nothing else.
Both are justified with the same sentence: it stops meaning anything the second
it is used for decoration.

Generalised, that is the design philosophy for this app:

> **Every typographic signal encodes exactly one fact. If the fact cannot be
> named in four words, the signal is decoration and does not belong.**

| Signal | The fact it encodes |
|---|---|
| Ojuju | this is the name of the app |
| Plex Mono | this number is data |
| Amber `--color-accent` | overlap state |
| Plex Sans | everything else |
| Size and weight | hierarchy, and only hierarchy |

This is what decides the questions that otherwise come down to taste. The tagline
stays in Plex Sans, for instance: it is a sentence someone reads, not a name, and
setting it in Ojuju would redefine that face from "the app is called this" to
"this is the top of the page" — a layout fact, already carried by size and
position. Two signals for one fact leaves neither of them load bearing.

It also settles the sign-in page specifically. The mark is brand there and
navigation in the header, which is an argument for treating the sign-in block as
a lockup. Refused: the mark has to read identically in both places or it is not a
mark.

### A third typeface, for the wordmark only

§11 names two faces — Plex Sans for interface, Plex Mono for counts and
timestamps — and is silent on the name of the app. It was being set in Plex Sans
at `font-medium`, which is not a wordmark; it is body text that happens to say
Again.

**Ojuju**, weight 500, applied through a `wordmark` utility in
`app/globals.css` and used in exactly two places: the nav and the sign-in
heading. It carries the same scarcity rule as the accent and the mono, for the
same stated reason — a display face used twice is a signature, used everywhere it
is a theme. It is deliberately not on page headings.

The face was chosen by eye, after Instrument Serif and Newsreader were both put
on screen and rejected. Ojuju is a display sans, so unlike those two it separates
from Plex Sans by personality rather than by category.

**Set lowercase, and in CSS rather than in the JSX.** `again` reads as the word
rather than a proper noun, which suits a name that states the entry criterion —
the same argument §4 makes for keeping "go-back-to". The `text-transform` lives
in the utility because the mark must render identically in both placements, and a
transform cannot drift the way two hard-coded strings can.

**Loaded as a static single weight, not the variable font.** Only the mark uses
this face and only at one weight, so a weight range is payload nobody spends.
This was measured rather than assumed, during the Newsreader attempt: requesting
that family's `opsz` axis cost **129 KB** on the preloaded latin subset against
**22 KB** for a static cut, and `wght` alone still cost 57 KB. The general lesson
survives the specific face — **do not request variable axes for the wordmark
without measuring the subset first.** 100-odd KB to optically size five letters
at two hard-coded sizes is not a trade this app can make.

Consequence worth knowing: only one weight file is loaded, so a stray
`font-bold` on the mark would synthesise a fake bold rather than fail visibly.
The weight is pinned in the utility to keep that from happening quietly.

**If 22KB ever needs to be 3KB:** the mark is five glyphs (`a g a i n`). A
`pyftsubset` cut checked in and loaded via `next/font/local` removes the Google
fetch entirely. Not done — it adds a build dependency and a binary in the repo
for a saving nobody has asked for yet.

### Input text at 13, and no field labels

Settled by eye over several passes rather than derived from a ratio. Inputs went
14 → 15 → 14.5 → 14 → **13**; field labels went 12 → 13 → 12.5 → **gone**, into
the field as placeholders (below). The landing point matters less than the two
constraints that survived the wandering, below.

**13 arrived via the placeholder, not on its own.** The placeholder was set a
pixel under the 14px value, then the value was matched down to it, so a field
does not change size between empty and typed. That is the rule worth keeping:
**one size per field, `::placeholder` inheriting it**, with no second declaration
anywhere that can fall out of step.

**The 16px touch branch stayed.** Matching the value down briefly took the coarse
size to 15px, which is under Safari's zoom threshold and cost the guard the
branch exists for (caveat below). It went back to 16. The rule above survives it
intact — value and placeholder are still one size — because what differs is the
pointer, not the state of the field: 13/13 with a mouse, 16/16 on touch. A field
that grows when you touch it is a scale; a field that grows when you type in it
is a bug.

**Nothing is set at a half pixel any more**, but they were not a mistake when
they were: browsers lay type out at subpixel precision, and only the rasterised
glyph snaps to the pixel grid.

**The trap this scale carries**, which has already caused a visible bug once:
`text-xs` and `text-sm` set font-size **and** line-height, while `input-text` and
`control-box` set one property each on purpose — size in one, height in the
other. Swap either for a Tailwind size and the two fight over the height, which
is how a row of controls ends up at three different heights with nothing in the
diff to suggest it. `CONTROL_TEXT` in `components/sign-in-form.tsx` pairs them
and should not be inlined back. It had two siblings once — `BUTTON_TEXT` for a
submit button that carried its own size, and `FIELD_LABEL` for the label and the
button's height-matching spacer. Both are gone: one size for every control now,
and no labels to match.

**The capture results sit at 13**, which on a mouse is the input's size too. They
were a pixel under a 14px input before, and matched at 14/14 before that; the
step said the query is yours and the results are the world's, and they should not
read as one tier. At 13/13 that step is carried by the input's border and surface
instead of by size, which is enough — a field with chrome above a bare list is
not ambiguous, and it is how every search field in a browser reads. **Taking the
results to 12 to reopen the gap would be worse**: 12 is the meta tier (the year
beside each title lives there), so it would trade a distinction for a collision,
at a size that is too small for the primary label of a touch target in a
phone-first product. On touch the step is still there for free — 16px input, 13px
results.

### Sign-in and reset fields name themselves from the inside

No label above the input on either form: **Email**, **Password**, **Name**, **New
password** and **Confirm** are placeholders, same words, moved inside the field
they belong to. Asked for directly, and it suits these two forms in particular —
there are at most three fields, every one of them is a form everyone has filled
in before, and the label row was the only thing making the inline row a layout
problem. Removing it took the spacer, `FIELD_LABEL` and the button's wrapper
`<div>` with it (above).

**Each input keeps an `aria-label`.** A placeholder is presentation that happens
to read as a name: it disappears at the first keystroke, so anyone who looks away
mid-form loses it, and it is the wrong thing to leave a field's only accessible
name resting on. The `aria-label` is what a screen reader announces and it does
not depend on the field being empty.

**Password placeholders are `placeholder:font-sans`**, against the `font-mono` on
the value. The mono is there to be read character by character (below) and a
placeholder is never read that way; left in mono it made those fields look like a
different species to the email beside them.

**Onboarding went the same way**, asked for directly a moment later, so no form
in the product now labels a field from above; `components/capture.tsx` was
already placeholder-only with an `sr-only` label. Two things it does differently:

- The handle placeholder is lower case and **stays in mono**, the one exception
  to the rule above. It renders immediately after the `@` prefix, and the two
  only read as one address — `@handle` — if they agree on case and typeface. A
  sans placeholder there looked like two strings that had collided.
- **`Name (optional)`** is one flat string. As a label it was "Name" plus a
  dimmed `(optional)` span; a placeholder cannot carry two weights. The word
  stays regardless — it is the only field in that form which is not required.

The handle's rule (letters, numbers, underscores, 2–20) is a `<p>` under the
field, not the placeholder, so it survives the first keystroke. That is the part
that matters, and it was never in the label.

### Password fields: mono, and an eye inside the input

Passwords are set in **Plex Mono**, which is the second functional exception to
§11's scarcity rule after the handle field, and earns it the same way (§10,
homoglyphs). The moment a password is revealed it is read character by character,
and telling `l` from `1` from `I` is the entire job. Applied whether or not it is
currently revealed, so toggling does not reflow the text under the cursor.

The reveal control is an **eye glyph inside the input**, right-aligned,
`inset-y-0` so it matches the field height and keeps matching if the type scale
moves again. Password fields get `pr-10` and nothing else does, so text never
runs under it.

Inline SVG in `components/icon-eye.tsx` rather than an icon package: §11 permits
known icons and the eye is the known one, but two usages do not justify a
dependency, and §10 wants a reason written down before one is added. It is shared
rather than pasted into both forms because duplicated path data drifts invisibly.
`currentColor` throughout, so it inherits the muted/hover treatment of its button
— the accent is not available to it, since §11 reserves amber for overlap.

A first attempt put a Show/Hide **text** button beside the label instead, to
avoid eating width from a ~200px field in the inline row. Rejected on sight: it
read as a second label rather than a control.

**Caveat, held rather than resolved:** iOS Safari zooms the viewport on focus for
any input under 16px and does not zoom back out. `input-text` holds a 16px
coarse-pointer branch specifically to prevent it, and that branch is the only
thing standing between a phone-first product (§5) and a zoom on every field.

It has been dropped to 15px once, as a consequence of matching the value size to
the placeholder, and put back. **Anything that lowers the coarse branch under 16
reintroduces the bug**, however good the reason looks in the desktop preview
where it is invisible. The other fix, `maximum-scale=1` on the viewport, disables
pinch zoom and is an accessibility failure; it is not on the table. Still worth
confirming on a real phone — see the Phase 5 PWA work.

### The tagline

**Two lines since 16 August, directed, and set exactly as they were written:**

> things to try. things to try again.
> the things i want. the things i’d buy again.

The first is the tagline proper and is the string in the `<meta description>` and
the manifest. The second sits under it on `/sign-in` and nowhere else — a link
preview shows one sentence on its own, and the pair reads as a lockup rather than
as a description.

**It still names the two states, which is the job.** *Things to try* is a want,
*things to try again* is a go-back-to, and the second line says the same thing
again in the app's own vocabulary. The name is still the payoff rather than a
label over unrelated copy.

**Three things about it are new and are worth naming, because none is accidental:**

- **It is lower case throughout, including the `i`**, under a capitalised mark.
  Written that way and set that way.
- **It speaks in the first person.** Everywhere else the app addresses the reader;
  this is the reader talking. The line is a person describing their own list,
  which is what the product holds.
- ⚠ **It says *buy*.** §2's ban is on availability and acquisition as *features* —
  retailer links, price tracking, ownership inventory — and a word in a tagline is
  not one of those. But the line drawn in *What Again is for* is *acquisition
  makes the app a remote control; occasion makes it a diary*, and this is the
  acquisition word. Recorded rather than argued: it was asked for directly, and
  it is one string if it ever reads wrong.

**What it replaced, and why the replacement is not a downgrade of the argument.**
The old line was *What would you try, and try again?*, and this file used to
defend its question mark at length — one question with a compound verb, not two
questions joined by a comma. That reasoning was sound and it went with the draft.
Two statements need no question mark, and they buy something the question did not:
the second line is a **restatement**, so the pair works the way a headline and a
standfirst work.

⚠ **A tagline is a layout dependency on this page.** Adding the second line grew
the header by 20px and moved both optical-centring corrections — one of them
changed *side*. See *Centring the fields, not the block* below, and re-measure
rather than adjust if this copy changes again.

### The sign-in form is stacked at every width

**One column, `max-w-sm`, no breakpoint.** Asked for directly, and it settles
something that had been consuming a disproportionate share of this file. The form
used to go inline at 560px — fields and button on one line, with the container
widening to 42.5rem to give the row something to divide up. The dimensions kept
now are the stacked ones exactly: `flex flex-col gap-3`, full-width controls,
`mt-1` on the submit.

The removal took four things with it, all of which existed only to serve that
row, and each of which had already broken once: the `min-[560px]:*` variants, the
wrapper `<div>` around the fields (redundant once it was `flex flex-col gap-3`
inside a form that already was), the `min-w-0 flex-1` pair on each field, and the
container's width bump. **What is left has no alignment problem to solve**, which
is the real gain — every control is full width, so nothing can line up wrongly.

**One gap for the whole form.** The submit button had `mt-1` on top of the gap-3,
setting it slightly apart from the last field; it is gone on all three forms, so
the space between password and button is the space between the fields. It read as
an exception to a rhythm that has nothing else in it — three or four boxes in a
column — and 12px throughout is what makes that column read as one object. The
sign-in centring numbers derive from these gaps, so this is a two-file change.

**The mode switches sit `mt-4` below that**, making 28px with the form's gap —
the same `gap-7` that separates the tagline from the first field. They are the one
thing in the form that overrides the gap, and they earn it: they do not submit
anything, they change what the form *is*. Setting them at the distance that
separates the header from the form says so. The number is written as that
arithmetic, not as a loose `mt-4`.

**They lost their underlines and took a chevron instead**
(`components/icon-chevron.tsx`). Three underlined phrases at 12px is a lot of rule
for very little text, and on a page whose only real content is two boxes the
underlines were the heaviest marks on it. The chevron points right and sits on the
left, so it reads as a marker on something that leads somewhere rather than as a
back arrow; hover is carried by colour alone. It is 12px against a 16px line box
on purpose — a taller glyph would grow the switch row and invalidate the centring
numbers above.

It also puts the three auth pages on one shape: /sign-in, /onboarding and
/reset-password are now all `max-w-sm` single columns, which they were not while
one of them widened past the others at 560px.

**If an inline row is ever wanted back**, the parts to restore are listed above
and in `components/sign-in-form.tsx`; the ordering constraint is that the button
needs whatever the fields have above them, or it will not align.

Alignment of the mark and tagline uses `text-start`, not `text-left`, so it
follows writing direction. Nothing on this page uses a physical direction.

### Centring the fields, not the block (/sign-in)

`my-auto` centres the whole block — mark, tagline, fields, button, switches — but
the thing that should *look* centred is the field pair, and the block is not
symmetric about it. Padding the light side makes it symmetric, which moves the
pair by half of what you add.

**Both corrections are on the bottom since 16 August**, when the tagline became
two lines and the header grew 20px:

```
mouse  113.76px above the pair, 94px below  → 19.76 → pointer-fine:pb-[20px]
touch  113.76px above the pair, 104px below →  9.76 → pointer-coarse:pb-[10px]
```

Touch is lighter because `control-box` grows the fields and the button to 48px
there, which adds 10px below the pair while the header and the 12px switches do
not move. A device reporting neither pointer gets no correction and sits about
10px low, which is the right way to fail.

⚠ **The touch correction changed side, not merely size.** It was `pt-1` — 4px on
*top*, because on a coarse pointer the block used to be heavier below. One line of
tagline reversed that. **These numbers cannot be adjusted by reasoning about the
direction of the last change**, which is the trap this pair has now sprung twice;
measure the imbalance and pad the lighter side.

**Measured rather than compiled this time**, driving the real page at 390×780
touch, 1440×900 mouse and 320×568 touch: the pair's centre lands 0.11px from the
content box's centre at all three. The residual .76 in the table is the mark's ink
and is rounded away deliberately.

Two declarations do it, and the split between them is the point:

- **The pointer pair above, on the centred block.** Nothing renders in that
  padding; it is optical centring, not spacing.
- **`pt-[calc(3rem+env(safe-area-inset-bottom))]` on `<main>`.** The top padding
  carries the *bottom* inset deliberately. `safe-bottom` adds that inset below for
  clearance, correctly, but the same padding is what `my-auto` centres inside — an
  inset on one edge only lifts the content by half of it, so the more home
  indicator a device has, the higher the form floats. Mirroring it on top keeps
  the box symmetric on every device. It replaced `py-12`, whose only remaining job
  was that 3rem top, so there is now one declaration per edge and no override.

**This started as `--safe-bottom-base: 4rem`** — one rem of extra bottom padding,
which lifted the content by half. It measured right on a laptop and overshot by
~21px on any iPhone with an indicator, because it corrected a fixed imbalance with
a device-variable property. Two jobs on one declaration. That is the failure mode
worth remembering, not the number.

**Both numbers are derived, not chosen.** They are the header-above minus
switches-below difference at each control size, so anything that changes the
form's rhythm makes them wrong, and they have now moved three times: closing the
submit button's `mt-1` took them from 18/8 to 22/12, setting the switches `mt-4`
below the button took them to 6/4 and flipped the touch one's sign, and the
tagline's second line took them to 20/10 and flipped it back. **Two of those three
were a change to the copy or the spacing, not to the correction** — which is the
whole reason this note exists. The first two were verified by compiling
`app/globals.css` through `@tailwindcss/postcss` directly, because the dev server
serves a cached CSS chunk that can lag a source edit by several minutes and will
happily show you a class you have deleted; the third was measured in the page
itself, which is better and is what to do next time.

**It is per-page, not a token**, because the imbalance is per-page. /onboarding
has a two-line heading and a three-line paragraph over one field and would need
more; /reset-password is close to this page but not identical. Neither has been
measured, and neither is corrected.

**Landscape is deliberately not centred at all.** `my-auto` collapses when the
content is taller than the container, which is what keeps the top of the form
reachable when a keyboard takes half the viewport. The padding above stays
scrollable; a transform-based correction would not have.

**Nothing here is measured on hardware.** The numbers come from the box model —
line-height plus padding plus border, per control. The Phase 5 phone pass is where
they get confirmed or corrected.

### Resend, over its REST API

**Decided 8 August 2026.** Resend and Postmark were both acceptable and the
choice sat open for a week. Resend, for one reason that outweighed the rest:
`onboarding@resend.dev` sends with no domain, no DNS and no approval, so password
reset is live on the deployment immediately. Postmark's sender signatures need
clearing first, which would have left the deploy with reset still broken — and
reset being broken is the condition this whole phase exists to end.

⚠ **That sender only delivers to the address owning the Resend account.** It is
enough to prove the flow end to end and it is not enough for a second person, who
would hit a 403 that throws on our side and looks like silence on theirs. A
verified domain in `EMAIL_FROM` is required before anyone else signs up, and
`scripts/preflight.mjs` prints this as a notice on every build until it is set.

**Called over `fetch`, not the `resend` package** — the same trade as
`lib/rate-limit.ts` and Upstash. §10 wants a written reason for every dependency;
this is one POST with three headers against a stable API, and the SDK's whole
contribution would be `await resend.emails.send`.

**It does not fail open, and `lib/rate-limit.ts` does.** The two sit next to each
other and look alike, so the difference is worth stating. A limiter outage should
not take the app down — failing open costs a few minutes of lapsed limits. An
email failure has no equivalent: swallow it and Better Auth returns success, the
UI says check your inbox, and the account is gone. So `sendEmail` throws.

**What would change this:** volume, or deliverability trouble. Postmark remains
the stronger transactional reputation, and moving is one function.

### True black, over the note that said not to

**Decided 8 August 2026.** `--color-bg` was `#0e0e10`, carrying a comment that
read *"near-black, not #000 — pure black reads as glass and pulls too hard on
OLED"*. That reasoning is sound and it was overruled by looking at the thing: on
an iPhone 12, which is precisely the OLED panel the note was written about,
`#0e0e10` read as grey rather than as black.

The note was a general principle. It lost to the specific screen, which is the
right order — the same order that produced the intent-sheet bug, the landscape
dropdown and the upscaled thumbnail, all found by use rather than by reasoning.

**What it was guarding against, in case it shows up later:** black smear. OLED
pixels switching from fully off are slower than pixels switching between two lit
values, so a pure-black background can trail slightly during a fast scroll. If
that appears, the fix is a step back towards `#08080a` rather than all the way
to `#0e0e10` — the complaint was that the old value was visibly grey, and
`#08080a` is not.

`themeColor` in `app/layout.tsx` moved with it. iOS tints the status-bar strip
from that value, so a mismatch shows as a lighter band across the top of every
screen — which is also why `components/poster.tsx` no longer swaps it: the
expanded poster and the app now share one ground, and the swap became a no-op.

`--color-surface` stayed at `#16161a` at the time, further from the ground than
it had been, which suited it. It has since become the warm `#20201d` — see
*An editorial palette* below.

### An editorial palette: warm ink, warm charcoal, brass

**Decided 8 August 2026**, from a proposed set aimed at "classy, magazine-like".
Adopted with one change and one rejection.

| token | was | now |
|---|---|---|
| `--color-bg` | `#000000` | unchanged |
| `--color-surface` | `#16161a` | `#20201d` |
| `--color-text` | `#e8e8e6` | `#eae6da` |
| `--color-rule` | `#26262b` | `#30302b` |
| `--color-accent` | `#e0a458` | `#b49a62` |

**The background was rejected.** The set proposed `#171715` — `rgb(23,23,21)`,
lighter than the `#141414` ruled out earlier the same day and much lighter than
the `#0e0e10` rejected before that. It also worked against itself: the warm
charcoal surface separates from it by only **1.10:1**, where against pure black
it manages **1.29** — better than the cool `#16161a` ever did at 1.16. Warm
surfaces read as raised, and they need a black ground to do it.

**The muted tier was lifted.** The set's ladder is one ink faded — secondary at
0.689, muted at 0.436, to within 1–2 of exact — which is the structure this
codebase had just adopted, so it dropped straight in. But 0.436 measures
**3.69:1**, under AA's 4.5 for body text, and muted is where timestamps and
metadata live. Kept at 0.6, which measures 6.08. The same 0.42-ish step appears
in the Gide palette and fails there too; it is a recurring instinct worth
distrusting.

**Warmth is the point of the whole change.** The ink goes from +2 to +16 on
R−B. Neutral off-white reads as *screen* — print ink is never neutral, and that
warmth is most of what makes a thing look printed rather than rendered.

**What it cost: the accent got quieter.** `#b49a62` is the better colour and
`#e0a458` was the louder signal. §11 gives the accent exactly one duty — marking
overlap, "the one moment the app exists for" — and that duty is to interrupt.
Brass is classier and less alarming, which is a real trade on the one colour
meant to be alarming.

**What would change this back:** overlap failing to catch the eye in Phase 3,
which is the first time the accent appears against real notifications rather
than in a palette. If it does, the value moves and the rule around it does not.

### The return count is removed, and §11 loses its signature element

**Decided 8 August 2026**, against the brief and knowingly. §11: *"The signature
element is the return count beside each go-back-to — mono numeral, quiet weight,
large enough to read as the point."* There is no longer a return count.

It went in stages over an hour, and the stages matter because each one was
reasonable and the destination was not obviously where they led. The count was
moved off the live list, because a bare numeral beside an unwatched film explains
nothing. The increment button followed it, because an action that changes a
number you cannot see is a tap into the void. Then: *"still not sure about it.
Don't think it has a purpose."* Renamed first — *Seen it again* rather than *Been
back again* — and that did not rescue it. Removed.

**The case for removing it.** Nobody was going to tap it. It is self-reporting
about something you did somewhere else, weeks earlier, with nothing prompting
you and no consequence if you do not. §8 made that manual deliberately — the
alternative is check-ins, which is a different product — but deliberate is not
the same as used, and a number that only ever reads `1` is worse than no number:
it looks like data and is an artefact of the resolve step.

**What it cost, itemised, because none of it is free:**

- **The go-back-tos tab lost its sort key.** It ranked by how many times you had
  been back — the one ordering in the app that reflected the strength of a
  preference rather than its recency. It now falls back to most recently
  resolved.
- **`guide` lost its evidence.** §6 specifies the copy *"{name} wants to see
  {title}. You've been back n times."* That sentence cannot be written. It now
  reads *"…You would go back to it."* — the same claim without the weight behind
  it. `guide` exists to say *you are the person to talk to about this*, and the
  number was the reason it was true of you and not of someone else. **This is
  the sharpest cost and it is unresolved**, carried into Phase 3.
- **The mono face lost its main job.** §11 gave IBM Plex Mono to return counts
  and timestamps. It keeps timestamps and the handle input; it is no longer the
  type of anything that matters.
- **A go-back-to is now binary.** Been back once and been back eleven times are
  the same row. §1's distinction between *liked it* and *returns to it* survives
  only as the state itself.

**What was kept.** The `go_back_to` state, which was never the same thing as the
count — it says *I would return to this*, and that is intact. The `return_count`
column also survives, unread and unwritten, holding whatever it held. §5's
"nothing is ever deleted" is about entries rather than columns, but dropping it
would destroy the only counts anyone recorded, for tidiness. Restoring the
feature means restoring three files and a CSS utility; restoring the data means
nothing, if the column is gone.

**What would change this back:** evidence that people do record returns when
asked — or `guide` proving unconvincing in Phase 3 without a number behind it,
which is the first place the absence will actually be felt rather than reasoned
about.

### The want label leaves the row once the want is resolved

`components/entry-row.tsx` renders `spec.wantLabel` unconditionally in the
metadata line, and one `EntryRow` serves all four `/me` tabs. So "Want to see"
appears under a go-back-to that already has a return count of 1 and a *Been back
again* button, and under an archived `done` — a film that was seen, that nobody
is going back to, and that nobody wants.

**Decided 8 August 2026: render it only while `state = 'want'`.**

The defence for the current behaviour is real but narrow. §5.2 says a go-back-to
is still a want, which is why the live view is `state in ('want','go_back_to')`
— so the label is not *false* on a go-back-to. It is false on `done` and on
`fixture`, where nothing is wanted at all, and on the live list it is redundant
with the thing beside it.

Nothing replaces it, because two things already carry the state. The tab names
the collection on three of the four views. And on the live list — the only view
that mixes `want` with `go_back_to` — the return count is the difference, which
is precisely the load §11 puts on it when it calls the count the signature
element of the product. A word saying "want" next to a numeral saying "you have
been back once" is the label competing with the signature.

**What would change this:** the live list gaining a third state, or the count
being cut. Neither is planned.

This is a label, not a state change. `done` stays archived and owner-only,
`fixture` stays reachable only from the `own` intent, and §5.2 is untouched.

### A private one-line note, and why it is not a review

**Decided 8 August 2026:** an entry may carry a short note written by its owner,
readable by nobody else.

§4 bans the word `review` outright and `no-restricted-syntax` fails the build on
the identifier. §2 puts comments, scores and stars out of scope. The question was
whether this is that thing under another name.

It is not, and the test is not the length of the text but who it is for. A review
is addressed to an audience: it is published, it accumulates, it ranks, and its
existence changes what other people pick. This note is addressed to the person
who wrote it — *the one with the long tracking shot*, *saw this with Dad* — and
it is invisible to everyone else, so none of that machinery can start. Nothing is
published, nothing is scored, nothing is aggregated, and no one else's decision
can be moved by it. Remove the audience and the objection goes with it.

It also serves the state the product otherwise says least about. `done` is a
private archive nobody can see; a note is the only reason to open it.

**Constraints, all of which are the point:**

- **The identifier is `note`.** Not `review`, not `comment`. The lint rule is
  correct and stays.
- **Owner only, enforced in `lib/db/`** (§3). Never in
  `listEntriesForOtherUser`, never in overlap, never in an aggregate. Carried
  forward to Phase 2 in `docs/plan.md`, because the shared projection gets
  written there and a leaked column is exactly the failure §5 cannot detect.
- **One nullable text column on `entries`**, bounded by Zod at the boundary
  (§10). Bounded because an unbounded text field is how a note becomes an essay
  and an essay becomes a review with an audience of one, then two.

**What would change this:** any request to show a note to anyone but its author.
That is not an extension of this decision, it is the reversal of it — the whole
argument above is the privacy.

### The redesign, 9 August: scale contrast, one navigation, and a rail

**Trigger:** the person who commissioned the app looked at it and said it was
neither instinctive nor attractive, and that the desktop view was "compact and
bare". That is the second time in three days that looking at the thing produced
findings that reasoning about it had not, and the pattern is now worth naming
rather than re-learning.

Four separate faults, and only one of them was taste.

**1. Nothing was ever big.** The largest type in the signed-in app was the 21px
nav wordmark. A film title — the subject of the entire product — was 15px, the
same size as the year beside it, the label under it, and the button under that.
§11 says type is the entire design, and that had been read as *small type only*.
It is the opposite: editorial design is violent contrast between one large thing
and everything else, and the app had only the "everything else". Fixed by
`--text-title` (22px, 28px from `lg`) against `--text-micro` (11px), a little
over 2:1, where it used to be 15 against 12.

**2. Nearly everything was muted.** `--color-muted` was on the year, the want
label, the resolve button, the tick, the tabs, the handle, sign out, every empty
state, and the only error message in the product. Roughly four glyphs in five on
a given screen sat at 60% opacity, which does not read as restraint — it reads as
disabled. The palette did not change (it is three days old and correct); its
application did. Contrast is now carried by size, which frees colour to mean
something.

**3. The 32px poster was decoration that failed at decorating.** Too small to
recognise a film by, and cropped square so it was not even poster-shaped, on the
one screen §11 wants type to carry. Removed from every list. It survives where it
is *functional* — the search dropdown and the intent sheet, where telling two
films of the same title apart is the actual task — and tapping a title now opens
the artwork full-bleed at TMDB's largest size. The trade: no poster anywhere you
did not ask for one, a real poster when you did, instead of a thumbnail
everywhere that was neither.

**4. Half the navigation was a duplicate, and that is what "not instinctive"
meant.** A header offered *Add* and *Me*; `/me` then offered four collection tabs
beneath it. And `/` listed the `live` view while `/me` **defaulted to the `live`
view** — two top-level destinations onto one list. There is one axis of
navigation in this product (which collection am I looking at) and it was being
expressed as two, one of them a second door onto one room.

So: the collections are routes — `/`, `/go-back-tos`, `/fixtures`, `/archive` —
named once, in one place. `/me` `permanentRedirect`s, translating its old
`?view=` values rather than dropping everyone on Wants, because a bookmarked
`?view=archive` was a bookmark of the archive. Adding happens on Wants, which is
where a new want lands, and is a better answer than a tab called *Add* that had
to explain itself.

**The rail answers the desktop question, and it is not primarily a visual fix.**
`docs/plan.md` recorded the browser view as sparse and cramped at once: a 576px
column of phone-sized type in a 1440px window. The obvious repair was to widen
the measure and step the type up, and that would have fixed *cramped* while
making *sparse* worse — a longer line of bigger text is still one column in a
void. Putting the four collections in a persistent left rail spends the width on
navigation that was previously stacked vertically above the content, so the wide
layout gains something the narrow one cannot have instead of being the narrow one
stretched. It also happens to dissolve fault 4, which is the argument for doing
both at once rather than in sequence.

**The desktop question itself is now settled: a browser is a target.** It had
been open since 8 August, on the reasoning that §12 ends at a home-screen PWA and
§13 seeds by text message. That reasoning still holds for where people will *use*
the app; it did not survive the observation that a browser is what a link opens,
and a link is how §13 seeds. Deciding it deliberately was the point.

**Two reversals worth flagging, both of earlier entries in this file.**

- **Hairlines are back between rows.** They were removed on 8 August because "a
  border under every item drew a horizontal line every three lines of text and
  turned a short list into a table". True at the spacing it was written about:
  12px of padding, so the rule sat closer to the text than the text sat to
  itself, and read as a cell boundary. At 28px it inverts — the space separates
  and the rule measures, which is what a hairline does on a printed page. §11's
  own palette calls `--color-rule` an editorial divider; this is that use.
- **The capture field no longer wears `input-text`.** That utility exists to sit
  at 13px with a mouse and 16px on touch, and its whole argument was that a form
  should be set in one size throughout. The capture box is not in a form. It
  takes `text-base` — 16px at every pointer, which clears iOS Safari's zoom
  threshold for the same reason `input-text` does, without taking a compromise
  made for a consistency it is not part of.

**What was deliberately not touched:** the auth pages. `plan.md` had already
concluded a narrow sign-in form is correct at any width, and `/sign-in`'s optical
centring is arithmetic derived from the current control heights and gaps — the
one place in the app where changing a gap silently invalidates a recorded
calculation. It is also the most-worked screen in the project and was not what
anyone was complaining about.

**What would change this:** the title size is the load-bearing number. If real
lists turn out to be full of long titles that wrap to three lines at 22px, the
answer is a smaller title rather than truncation — the ellipsis was removed on
8 August because it promised an expansion that did not exist, and that is still
true.

### A second colour: lacquer red for "you are here"

**Directed 9 August.** `--color-active: #c1483c` marks whichever of the two
header glyphs — Home or Profile — you are currently on, and nothing else.

This is the first colour added to the palette since it was set, and the palette
being small is most of §11. Three things make it defensible rather than drift:

- **It does not touch the amber rule.** §11 reserves `--color-accent` for overlap
  state, and brass is still spoken for, still unused until Phase 3, still the
  only thing that will mark a convergence. Two colours, two meanings, neither
  borrowed from the other.
- **It inherits the same scarcity discipline.** The moment red appears on
  something that is not a current-page marker it stops meaning anything, and the
  header glyphs stop being readable at a glance. The rule around it is the rule
  around amber, word for word.
- **An unlabelled glyph has no word to carry its state.** That is why the two
  icons get colour and the collection labels in the bottom bar do not — a word
  can say where it is by getting brighter, and `text-text` on the current
  collection still does. The inconsistency is deliberate and is about labels
  versus glyphs, not about two ideas of "active".

**⚠ It is not the error colour, and spending it on one would cost this.**
`docs/plan.md` has wanted a red for failure messages since 8 August and
deliberately did not add one — those are full-strength text instead, for exactly
this reason. If a red is ever wanted there it has to be a *different* red, or
this stops being a position and starts being an alarm.

Measured 4.26:1 against the true-black ground, past the 3:1 WCAG 1.4.11 asks of
a graphical control. `aria-current="page"` is on both links regardless, so
nothing depends on seeing the colour.

### The poster wall, and the largest deviation from the brief so far

**Directed on 9 August**, and it needs stating plainly rather than buried: the
home screen is now a wall of posters for films in cinemas or about to be, and
that is imagery well beyond what §11 allows. §11 says "no imagery beyond small
poster thumbnails"; §2 rules out public discovery and algorithmic
recommendation; and the same day this landed, the thumbnails were being removed
from the lists for being decoration that failed at decorating. Both moves are
defensible together, but only if the argument is written down.

**The argument is that this is a capture prompt, not a catalogue.** Again is a
capture tool first (§8), and the thing it was worst at was the moment before
capture — you have to already know what you want in order to type it. A wall of
what is on is the answer to *what have I been meaning to see*, which is the
question the app exists to catch. Three tests it passes, and each one is a line
that must not be crossed later:

- **It is not availability.** §2 calls "where to get it" the most tempting wrong
  feature in the whole design. Nothing here says where to watch anything, and
  nothing may be added that does — no streaming lookup, no cinema times, no
  booking link. That is the line, and it is close.
- **It is not recommendation.** No algorithm, no personalisation, no ranking by
  anything about you. Everyone signed in sees the same wall. It is ordered by
  **release date rather than TMDB's popularity score**, deliberately: popularity
  order would make it a chart, and a chart is the discovery feature §2 rules
  out. `inCinemas` in `lib/tmdb.ts` does that sort for this reason alone.
- **It is not a feed.** One page from each of two endpoints, no infinite scroll,
  no accumulation, and nothing about it responds to what you did yesterday.

**Tapping a poster starts an add**, which is what keeps it a capture surface
rather than something to look at. A wall you cannot act on would be decoration,
and decoration is exactly what §11 is guarding against.

**Where it is still wrong, if it is:** the §13 test — "if a feature request
makes the app more useful to a stranger, it is probably wrong". This one does.
A stranger with no friends on Again gets a browsable wall of new releases. The
counter is that it makes the app more useful to a *member* in the same motion,
by removing the blank screen §8 warned about; but the test is failed, not
passed, and that is the thing to weigh if this ever feels like the wrong product.

### The wall is regional, and its sort was backwards — 15 August

Two changes, both directed, and the first is the one with an argument in it.

**"In cinemas" is a claim about a place, and it was being made about the United
States to everybody.** TMDB defaults `now_playing` and `upcoming` to the US when
no `region` is given, so a London wall opened on American release dates that run
weeks or months out of step with the ones down the road. The region now comes off
the request — `x-vercel-ip-country`, validated, in `lib/region.ts` — and rides in
the URL, so Next's data cache fragments by country rather than by person.

**It is a guess and it is allowed to be.** An IP is wrong for a traveller and for
anyone on a VPN. Nothing stores it, nothing filters a query by it, and the worst
case is somebody seeing another country's release dates — which is exactly what
everybody saw before. A setting would be right rather than usually right, and it
costs a column, a screen and a question asked of someone who opened the app to
look at posters. The deferred user-context model in *What Again is for* is the
same judgement.

⚠ **This does not move the §2 line, and it is worth being explicit about why,
because it looks like it might.** Regionalising does not add a claim — it makes
the claim already on screen true. The wall still says nothing about which cinema,
at what time, for how much, or how to get in, and none of those may be added. An
incorrect claim is not the safer side of that boundary.

**Region, not language**, and the reason is in `items`. `language` decides the
title TMDB returns, and the title on the wall is the title copied into `items`
when somebody taps a poster — so localising it would write a French name into a
row that a mutual track reads in English, and `lib/overlap.ts` joins on `items`.
Dates are regional; the canonical name is not.

**The sort was newest-first, which is `upcoming` descending** — so the wall
opened on the film furthest from being watchable and what is actually on was
below the fold. The comment above the function had claimed *"what is on now, then
what is coming"* since 9 August; the code had never done it. It sorts by distance
from today now, in both directions, which is one comparator and puts "out last
week" beside "out next week".

### Country is the ceiling, not a stage on the way to something better

Asked immediately afterwards: *how regional is the regionalisation?* Country
only, and it is worth writing down why that is the end of the road rather than
the first step of it.

`region` filters **release dates in a country**. It knows nothing about screens.
A film released here six weeks ago stays in `now_playing` after it has left every
cinema, and tonight's repertory screening of something from 1974 is not in the
listing at all, because it has no new release date. So the wall is right about
the country and blind to everything below it.

**Below country there is nothing but venues and showtimes**, which is the
acquisition side of the line drawn earlier the same day in *What Again is for*.
There is no intermediate granularity to want. If the wall ever looks
approximate, that is the data being honest rather than a setting missing.

### The wall says what it is, and the app finally has headings

Reported in the same breath: *there is still no indicator to users that these are
on-now and on-soon movies where they are*, and *how soon are the on-soon films?*
Both were true, and the second had an answer the app was throwing away.

**TMDB sends the window in every list response** — a `dates` object beside
`results` — and the Zod schema parsed `page`, `total_pages` and `results` only.
The wall knew its own span and never said it. It is one optional field now,
optional for the same reason the paging fields are: a caption that quietly loses
a clause beats a wall that throws because an envelope was reshaped.

**One line, not two section headings.** Headings for *On now* and *Coming soon*
would mean splitting the wall back into two blocks, and the sort deliberately
fans outward from today in both directions so that "out last week" sits beside
"out next week". The caption describes the whole thing instead, at the `micro`
tier — whose own note already describes this use: *the app's own words about
someone else's content*.

⚠ **The tempting clause is the false one.** *Showing near you* is what a reader
wants it to say and it cannot be said, for the reason above. The line states
where and when and claims nothing about a venue.

**Naming the country is not decoration.** The region is a guess from an IP, so it
is occasionally wrong — and when it is, this line is the only thing that turns a
strange-looking wall into a legible one. `Intl.DisplayNames` is in the runtime,
so it costs no table of country names and no dependency. A preposition is avoided
on purpose: *in the United Kingdom* wants an article that *in France* does not,
and that is a list of exceptions to maintain for no gain over a dash.

**And it turned out the app had no `<h1>` anywhere at all.** Not on `/`, not on
the four collections, not on `/profile` — while `docs/spec-sheet.md` asked for
one meaningful heading per page. Three answers, and none of them adds anything
visible except the first:

- `/` takes the caption, which was going to exist anyway.
- The four collections take an `sr-only` heading reading `COLLECTIONS`, because
  the bar at the foot and the rail already name each one on screen — a visible
  heading would name it twice, which is the duplication the 9 August redesign
  removed when `/` and `/me` were two doors onto one list.
- `/profile` promotes the display name from `<p>` to `<h1>`. It was already the
  largest type on that screen; only the tag was wrong. An account with no display
  name gets an `sr-only` fallback, since a heading that disappears with its data
  is the same fault one layer down.

### Two words, and they change as you scroll — later the same day

Directed after seeing it: the caption should read **In cinemas**, and then
**Coming soon** once you reach the first row of films that are not out yet. No
country, no date.

**It is not a shorter caption. It is a different wall**, and that is the part
worth recording. A label that changes at the first row of *coming soon* needs
such a row to exist, and a wall that fans outward from today has none — released
and unreleased alternate all the way down. So the fan-out ends and the two groups
come back, each ordered towards the present: newest release at the top of one,
soonest arrival at the top of the other.

**Three orderings in one day**, which is the useful thing here rather than the
destination. Newest-first (wrong, and contradicting its own comment since
9 August), then distance-from-today (right for an unlabelled wall), then two
groups (right for a labelled one). Each was correct for the screen it was built
against, and what changed underneath them was whether the wall speaks.

**The `dates` parse went with the caption that read it.** It had one reader,
which is now two fixed words, and unread parsing is the kind of thing that
survives for a year because nobody is sure. The one-line restoration is written
at the point it was removed from.

⚠ **What the shorter caption costs, stated once so it is not rediscovered.** The
country was there because the region is guessed from an IP: when it is wrong — a
traveller, a VPN — that word was the only thing that turned a strange-looking
wall into a legible one. Without it a wrong guess is silent, and looks like the
app being broken rather than the app being wrong about where you are. Putting it
back is one string in `app/(app)/page.tsx`.

**Sticky, and the first attempt at it was wrong.** Each section got its own
heading, pinning and being pushed out by the next — list-section behaviour, pure
CSS, no listener and no state. It shipped and was rejected on sight, for the
reason that is obvious once seen: **the second heading is a permanent band in the
document.** *Coming soon* existed on the page whether or not you had reached it,
and scrolling past it read as passing a divider rather than as one label changing
its mind.

**One slot, one label.** The caption sticks for the whole scroll and swaps its
text at the seam; between the grids there is nothing but the row gap, so the two
halves read as one wall with a change of subject.

That costs the CSS-only property, and buys the thing that was asked for. An
`IntersectionObserver` watches a 1px seam, with the root's top edge pulled down
by the caption's own measured height — which is what makes the swap happen when
the seam reaches *the label* rather than when it reaches the top of the screen.
Still nothing per frame, and nothing reading `scrollY`.

Both directions come out of one reading: `isIntersecting` goes false at the top
of the root *and* at the bottom, so the sign of `boundingClientRect.top` is what
separates them. Scrolling back up restores the label without a second observer.

⚠ **And it pinned under the status bar.** At `top: 0` the label sat beneath the
clock on the handset, reported within minutes. The masthead has cleared
`env(safe-area-inset-top)` since the first week; a second pinned surface needed
telling separately, because the inset is a property of the screen and not of the
element that happened to learn about it first.

> **Every new pinned surface re-opens the safe area.** Nothing inherits it, and
> the failure is invisible on any device without a notch — which is every device
> this project builds on.

⚠ **It sits *below* the masthead on purpose**, `z-10` against `z-20`, with `main`'s
`isolate` making that ordering a guarantee rather than a coincidence of two
numbers. So the label is hidden while the masthead is up and appears as the
masthead recedes — which is to say it is present exactly while you are scrolling
down through posters, and hands the top strip back to the mark when you scroll
up. The two behaviours were designed hours apart and this is the only place they
meet.

> ⚠ **The last sentence of that paragraph was false, and was reported on
> 16 August.** The z-order holds only while the two elements move together, and an
> overscroll at the top separates them — so the caption slid out from under the
> mark on the opening screen. It reads `data-masthead` now rather than relying on
> being covered, and the negative margin is the whole of `--masthead-clearance`
> rather than the notch. See *The caption becomes the masthead's other half*.

`/`'s `<h1>` is `sr-only` as a result. The visible caption names whichever half
you are looking at and changes as you scroll, so it describes a moment rather
than a page — which is the one thing a page heading may not do.

⚠ **The country being absent from the caption is not the region being absent from
the request**, and the two were confused within the hour. `viewerRegion()` still
goes to TMDB and the wall is still filtered to the viewer's country. What was cut
is the word on screen. The cost is only that a wrong guess is now silent.

### Four more from the handset, and the label had never once changed

#### The swap never fired, and the reason generalises

> ⚠ **Superseded 16 August, by a second bug in the same observer.** The
> `rootBounds` comparison this entry arrives at is gone — the observer watches a
> *half* rather than the seam, so nothing asks where anything is. The rule below
> survives intact and is the reason both bugs took a report. See *A boundary
> cannot report a jump*.

The observer was given a `rootMargin` pulling the root's top edge down to the
caption's lower edge, so that the label would change when the seam reached *it*
rather than the top of the screen. The callback then tested
`boundingClientRect.top < 0`.

**Those are two different lines.** `boundingClientRect` is viewport-relative; the
margin moved the root's edge to 38px. So the callback fired as the seam crossed
38 — at which moment `top` was about +38, and the test was false. And that is the
only moment it ever runs:

> **An observer reports crossings, not positions.** A test that is false at the
> crossing is false forever, because nothing calls back to ask again.

It read as the feature being absent rather than broken, which is what took a
report to find. `rootBounds` already carries the margin and is the honest source
for that line; the measured height stands in where a browser leaves it null.

#### The bar goes to the top of the screen, and the inset is given back

Three requirements meet on one element, and only one spelling satisfies all
three. Pinned at the inset, a strip of screen sits above it with posters running
through — reported. Pinned at zero without padding, the label is drawn under the
clock — reported an hour earlier. So the box starts at zero and carries the inset
as padding, which is what the masthead has always done.

That would then spend the inset again as dead space *in flow*, where the bar sits
below a masthead that has already cleared it — about 47px of nothing before the
first poster. A negative top margin of the same inset gives it back: the box is
pulled up behind the masthead, which is opaque and one layer above, so the space
it takes is space already covered. On a screen with no inset both values are zero
and nothing about it exists.

> ⚠ **The margin was the wrong quantity, and it took until 16 August to see it.**
> Cancelling the inset alone leaves the box in flow *below* a masthead that has
> already cleared the notch, so the label hung under the mark from the first paint
> instead of waiting behind it. It is `--masthead-clearance` now — the masthead's
> whole box and its hem — which lands the caption's band exactly on the
> masthead's painted one. The `top-0`-with-padding spelling above is unchanged and
> still correct.

#### A second red, and glass

Both directed. `--color-live` is documented at the token, including the cost: it
is the **second** red in a palette whose argument is scarcity, and it is brighter
than `--color-active` on purpose, since two reds a viewer cannot tell apart would
be worse than one red doing two jobs. They are never adjacent — the active red
marks Search or Profile and neither is current on `/`. It is still not the error
colour, and there being two reds now makes that refusal more important rather
than less.

The caption is the app's **first and only translucent surface**: `bg-bg/60` over a
backdrop blur, so artwork passing underneath reads as movement without the
letters sitting on it. §11's matte black is otherwise unbroken, and a second such
surface would make this a theme rather than a bar.

> ⚠ **It is three layers as of 16 August**, because the blur ramps up the band and
> an element cannot hold two strengths of one. The 60% survives as the ground's
> value at the band's foot. *Coming soon* also left `--color-muted` that day: a
> token tuned for text on ground is a different value on glass. See *The glass is
> three layers* and *The one marginal thing in the band*.

⚠ **All five new utilities were checked in the compiled CSS, not inferred from a
green build.** Tailwind emits nothing for a class it does not recognise and the
markup keeps the attribute, so an unknown utility is inert rather than an error —
`text-live`, `backdrop-blur-xl`, `bg-bg/60` and both `env()` calcs were confirmed
as real rules in the output.

#### Bigger, a blink, and a tick where there is one

**13px against the tier's 11**, set by overriding `--text-micro` on the element
rather than adding a second size class. `micro` reads that token for its size, so
one arbitrary property scales this caption alone — no duplicated tracking and
transform, and no two size declarations racing to win on emission order, which is
the trap the `input-text` note describes.

**The blink is a remount, not an animation state.** A CSS animation runs when an
element is inserted and not when its text changes, so the span carrying the word
is keyed by the word: a new label is a new element and the animation replays. It
also blinks on first mount, which costs nothing, because at rest the masthead is
up and the caption is behind it.

> ⚠ **That is half the mechanism, and the missing half meant one of the two words
> never blinked at all** — reported 16 August. A remount fires on a change of
> *word*, which is the only way *Coming soon* ever arrives; *In cinemas* is
> already mounted when the mark recedes. The animation hangs on `data-masthead`
> now and the key covers a crossing while the band is already up. The blink also
> moved onto the band and the word rises into place, because a word is 2.57% of
> the band's area and too small to be seen out of the corner of an eye. See *The
> blink had never fired for one of the two words*.

⚠ **The last keyframe is `opacity: 1` on purpose.** The reduced-motion block runs
every animation once at 0.01ms, so the final keyframe is what the element is left
showing — a blink written as `0% { opacity: 0 }` alone would leave the caption
permanently invisible for anyone who asked for less movement. The caret's note
records the same trap from the other side.

**A haptic at the crossing, and ⚠ it does nothing on the device this is installed
on.** There is no Vibration API in Safari, in a tab or standalone. It is written
as `navigator.vibrate?.(12)` — a capability check rather than a platform check,
per `CLAUDE.md`, so it simply does not run where the method is absent and needs
no change if it ever arrives. On Android it also stays quiet until the page has
sticky user activation, so the first crossing of a session can be silent there
too. Offered and kept because Android is one of the four shipping surfaces; if
that stops being true, this is three lines to delete.

#### A film missing from the wall, and two causes behind it

Reported by checking the wall against UK cinema listings: mostly right, with one
title on in cinemas and absent. Both causes are structural and neither was
visible from here, since TMDB's host is unreachable from this environment.

**It only ever asked for page one.** Twenty from `now_playing`, twenty from
`upcoming`. A national listing runs well past that, so the wall was not *what is
on* but *the twenty most popular things that are on* — and nothing on screen said
so, which is the part that makes it a fault rather than a limit.

**Depth is nearly free here, and that is the whole difference from search.**
`searchFilms` pages lazily because a query runs on a debounce of tens of
milliseconds, so an eagerly-fetched page is fetched again for every letter typed
on the way to a word. This is one fixed set behind a six-hour cache keyed by URL
and shared by everyone in a region: a five-page listing costs five upstream calls
per region per six hours however many people open the app. The argument that
made search lazy is the argument that makes this eager, and they only look
contradictory.

**The second cause is wrong however the first turns out.** Which half a film
belonged in was inferred by comparing `release_date` to today — after merging the
two lists, which threw away the one piece of ground truth in the response.
`now_playing` *means* showing and `upcoming` *means* not yet. Worse, the field it
inferred from is not reliably the regional date, so a film out here now but
released later in the United States reads as unreleased and lands under *Coming
soon*: a wrong claim, made confidently, on the one screen whose labels are the
whole point.

> Where a source already states a fact, do not re-derive it from a field that
> merely correlates with it.

The date now orders each group and classifies nothing, which is a job where being
approximate costs a poster two rows out of place rather than a false label.

⚠ **"Accurate always everywhere" has a ceiling, and it is worth naming before it
disappoints.** What this buys is completeness *within TMDB* for the viewer's
country. It cannot buy: a film TMDB has no regional release date for, a
long-running title that has aged out of the `now_playing` window while still
being on, or a repertory screening of an old film, which has no new release date
and is therefore in neither list. The wall is honest about *releases*, not about
*screens* — the same boundary the caption may never cross, recorded above under
*Country is the ceiling*.

#### And paging did not fix it, because it was the wrong question

Checked against a real venue's programme the same day: films under *In cinemas*
showing nowhere in the UK, films on at Picturehouse Central missing from the wall
entirely, and a major release absent from both halves. **The fix above was not
the fix.**

⚠ **Correct the record on one thing said here hours earlier.** The suspicion that
`release_date` might not be the regional date was wrong — TMDB uses the regional
release date when `region` is set. The provenance change stands on its own merits;
the diagnosis attached to it did not.

**The real cause is that the data does not exist.** `now_playing` is a `discover`
call behind the scenes, over **release dates**, and TMDB's own forum states the
limit: *"it may not be very accurate, as TMDB has the premiered release date but
doesn't have the date that ended in the cinema."* There is no record of a film
leaving a cinema and no cinema programming at all. So a film that opened five
weeks ago and has closed is still listed; one still running has aged out of the
window; and repertory screenings, which are much of an independent cinema's
programme, have no new release date and can never appear.

**No endpoint fixes this.** `/discover` with theatrical release types is the same
data through the same door. Depth was never the problem.

> **The label created the fault.** Until the caption existed the wall made no
> checkable claim, and nobody could catch it being wrong. Adding *In cinemas*
> turned a prompt into a statement about the world.

Which leaves exactly two honest moves: support the sentence, or stop saying it.
`docs/plan.md` carries both as *Pre-phase 2*, with the provider prices as
evaluated, and the decision is open.

The architectural conclusion is sound: either change the label to `New releases`, or pay for and integrate genuine showtime data.

**Two things found in that evaluation that are worth keeping whatever is
decided:**

- **TMDB id matching is the integration**, not the showtimes. `items` is keyed on
  TMDB ids and `lib/overlap.ts` joins on `items`, so a provider returning titles
  means building a matching layer — which is where this class of integration
  usually fails. One provider advertises native TMDB ids; that is worth more than
  its price difference.
- **"Accurate where the user is" needs to know where the user is.** All the app
  has is a country, from an IP. Cinemas are local, so showtimes imply a location
  permission or a stored postcode — user context, deferred deliberately in *What
  Again is for*, and needing a `/settings` that does not exist. The data source is
  the visible cost; this is the one that gets underestimated.

#### Tailwind reads comments, and compiled one

> **Do not spell a class's own syntax into a comment.** The scanner treats the
> file as text and has no idea what a comment is.

A sentence explaining the `--text-micro` override wrote the arbitrary-property
syntax out as an example, and a rule with a literal ellipsis for a value appeared
in the production stylesheet. Harmless, unused, and only found because the
compiled CSS was being read rather than trusted — which is the second thing that
check caught in one session.

**Unverified:** `inCinemas()` has never run against the real API. TMDB's API host
is unreachable from the environment this was built in, so the call is checked
only by types and by sharing its Zod schema with `searchFilms`, which does work
in production. Both list endpoints return the same `results[]` shape as
`/search/movie`, so the parse should hold — but should is not does, and an empty
wall with search still working is the designed failure.

### The search field moved into the phone's bottom bar

Same instruction. The bar now holds one of two things and a chevron swaps them:
search by default, the collections one tap behind it. They cannot both be shown
— the collection line already runs to within about 15px of a 375px screen, and
there is no width left for a field beside it.

**Search is the default**, because on a phone the bar is now the only route to
the field, and adding is what the app is for. The chevron points right at a
field waiting to be typed into and flips to point back once the collections
show: one glyph doing one job in both directions, rather than two icons to learn.

**A caret blinks while the field is empty and unfocused**, at the 1.06s interval
terminals use. It stops on focus, because the browser draws the real one and two
carets is a bug rather than an effect. WCAG 2.2.2 governs blinking content and
exempts a text cursor, which is what this is.

**Results open upward.** There is nothing below the bar but the edge of the
screen, and this also puts them where the keyboard is not: the viewport is
`interactiveWidget: 'resizes-content'`, so an open keyboard shrinks the layout
viewport and the list opens into what remains. This is a better arrangement than
the one it replaces — the old top-of-page dropdown is what produced the
landscape bug on 8 August.

**The bar stops receding while search is in use.** A bar that slid away
mid-search would take the field, the results and the keyboard's anchor with it,
and the scroll that triggered it would usually be someone reaching for a result.

**At rail widths none of this applies** — the field stays at the top of the home
screen, above the wall. Two fields in two places would mean two pieces of state
and one of them always stale, so it is one or the other by width, never both.

**The add flow moved above both surfaces.** There are two ways to start an add
now — a poster in the wall and the search field — and both end in the same
intent sheet, server action and ten-second undo window. `CaptureProvider` owns
that once; duplicating it would have meant two undo timers and a second intent
sheet free to drift from the first. The sheet became an overlay in the process,
because the thing that starts an add may be a 110px poster halfway down a grid
or a field pinned to the bottom of the screen, and neither has room to answer in.

### Space Grotesk, capitalised — and the old face kept

> ⚠ **Superseded 15 August: the face is Ojuju again, at 1.75rem.** Every
> measurement in this entry describes Space Grotesk and none of it is current.
> Kept for the two things that outlived it — why the capitalisation is a deletion
> rather than a string, and why the losing face is left declared and lazy. See
> *The masthead takes the typing*.

**Directed 9 August.** `--font-display` is Space Grotesk and the mark reads
*Again* rather than *again*.

The capitalisation is a deletion rather than an addition: `wordmark` carried
`text-transform: lowercase`, and the JSX string has always said "Again". The
transform existed so the mark could not drift between the two places it appears;
removing it keeps that guarantee and renders the string that was written.

**Ojuju is still in the code, deliberately, and costs nothing.** The declaration
stays in `app/layout.tsx` with `preload: false`, so switching back is one line in
`globals.css`. `@font-face` is lazy — a browser fetches a font only when text
actually uses the family — so the only thing that would have downloaded it
anyway is next/font's preload hint, and that is the thing turned off.

**Every trim constant had to be re-measured**, because they describe a typeface
rather than a size. Space Grotesk at 36px: declared ascent 35, descent 11, so a
46px content area against Ojuju's 51px; the ink of "Again" runs 26px above the
baseline and 8px below. `MARK_LINE_HEIGHT` went 1.4167 → 1.2778 and the trims
with it. The inked height came out at **34px either way**, which is the only
reason `HEADER_HEIGHT`'s 3.375rem did not have to move — a coincidence worth
knowing about rather than relying on.

### One character is a search, and the cap comes off

Both were dropdown-shaped decisions that stopped making sense when results
became a wall.

**The two-character minimum is now one.** A single letter would have dropped a
list of noise over the page; the same letter produces a different wall of
posters, which is a thing you can look at. The floor lives in three places and
all three moved together: `MIN_QUERY` in `components/search-provider.tsx`, the
Zod schema in `app/api/search/route.ts`, and `searchFilms` in `lib/tmdb.ts`.

**The eight-result cap is gone.** Eight rows is as much list as anyone reads
before retyping; eight posters is two thirds of a screen with the rest empty. It
is the whole page now — twenty, which is TMDB's page size.

⚠ **TMDB has no prefix search, and there is no endpoint that does.**
`/search/movie?query=b` is a relevance match ranked by popularity, not "films
beginning with b". A single letter therefore returns TMDB's twenty best guesses
for that letter, not an alphabetical run, and no amount of paging changes what
kind of answer it is. Whole pages *could* be chained to go deeper — at one
upstream request each, on every keystroke, behind a rate limiter, for a wall
nobody scrolls to the four hundredth poster of.

### The phone shell, and a breakpoint named for the layout

All directed on 9 August, after the redesign was looked at. Recorded for the two
places where carrying out the instruction required a call nobody made.

**`--breakpoint-rail: 45rem`, rather than `md`.** The trigger was "make iPads
show the rail" — the rail had been at `lg` (64rem), so every iPad in portrait
except the 12.9" Pro was getting the phone layout. `md` at 48rem would have
fixed three of the four and still missed the mini at 744px. So the number comes
from the layout instead of from the device: the rail costs 224px plus a 48px gap
plus gutters, and below about 720px the reading column is squeezed harder than
the navigation is worth. That it catches every current iPad is a consequence
rather than the definition, which is what keeps it correct when the device
landscape moves.

**It is deliberately not the same breakpoint as the type step.** Titles go to
28px at 64rem, and the entry row moves its action to the right at 64rem. So a
tablet gets the rail with phone-sized rows and a laptop gets both. One
breakpoint doing both jobs would have forced a choice between a cramped tablet
and no rail on one at all.

**The counts came off the phone collection row.** Not asked for, and it is what
makes the dotted line fit: the labels are ~240px at the caption size, the dots
bring it to 295px and the home icon to ~320px, against the ~335px a 375px
handset leaves after the gutter. Four counts add another ~80px and put it over
the edge on *every* phone, so the row would have wrapped to two lines and undone
the reason for the dots. The rail has two edges to hang a label and a numeral
from; a single line has one, so the count is the thing that gives.

**The collection row moved to the foot of the phone screen.** Directed, and the
reason it is better is not style: that row is the only thing on a phone reached
for repeatedly, and the top of a handset is the part a thumb cannot get to. What
stays in the header — the mark, the way to your profile — is looked at rather
than pressed, so the two halves separate cleanly by how often they are touched.

`fixed`, not `sticky`. Sticky sounds like it saves the padding underneath by
staying in flow, and does not: a sticky element pulled to the viewport edge still
overlays whatever is beneath it. The padding is needed either way, so `fixed` is
the honest spelling of it.

**The padding under `main` is 6rem below the rail breakpoint and 2rem above**,
set as an arbitrary property rather than the inline style it used to be, because
it now has to differ by width. 6rem clears a bar that has wrapped to two lines at
320px, which is more than the ~48px it normally occupies — deliberately, because
overshooting costs dead space below the last row and undershooting costs a row
you cannot read.

**Home and Wants became different screens, and §8 pays for it.** Directed late
on 9 August: *the input field should be on the home screen, not the Wants.* So
`/` is the capture box alone and `/wants` is the list.

This resolves the awkwardness flagged earlier the same day — a house glyph
pointing at the collection sitting next to it — in the other direction from the
one that was defended. It is the better answer: capture is now a place rather
than the top of a list, which suits a product §8 calls a capture tool first and
a browsing tool second.

**What it costs is §8's "it is never blank underneath."** That requirement was
written when the list *was* the home screen and there was nowhere else for it to
be; with the list one tap away, a home screen showing only its field is the
honest shape rather than a regression. But it is a real deviation and the first
thing to revisit if a new account finds nothing to do on the screen it lands on.
The cheapest remedy, if so, is the last two or three additions under the field —
recent captures, not the collection, so it does not become the duplicate the
shell was rebuilt to remove.

**The optimistic row went with it.** Adding used to appear instantly as a row in
the list underneath — `useOptimistic` over the entries, reverting on its own if
the action failed, which is what §10 asks for. With no list on the route there is
no row to insert, so the acknowledgement is a sentence: *Adding {title}…* set on
the same tick the film is picked, replaced by *Added {title}. Undo* when the
server answers. The undo window is unchanged.

**`/profile` exists.** The second of
those looks like the exact fault this shell was built to remove, and is not. The
old fault was two *named* destinations onto one list, which made you choose
between two words for the same thing. A glyph at the head of the line is not a
fifth collection — it is the way back to the top of the app from anywhere, which
on a phone is the one move worth an icon.

`/profile` carries the handle and *Sign out* in the **bottom-left corner**,
because that is where the rail already puts them. The same two things in the
same corner at every width, so moving between a phone and a laptop does not move
them; a centred block would have been a different composition that happened to
contain the same words. It also renders `profiles.display_name`, which has been
collected at onboarding since Phase 0 and rendered nowhere — showing your own
name to yourself pre-empts nothing, since the open Phase 2 question is what
*other* people see.

**This is where `/settings` will grow.** Three things are already waiting on it
in `docs/plan.md` — TMDB attribution (a licence condition), the iOS install
note, and changing a password you *do* know. None is built and none was asked
for, so the page holds two items and no heading.

---

## Search goes deep, and the mark changes case twice — 10 August

Four instructions in one pass, after the first look at real search results on the
deployed app. Two were settled by looking and needed no code: **one letter does
give a usable wall**, so `MIN_QUERY` stays at 1, and **the 300ms slide on the
phone's collection bar is right**, so it stays. Space Grotesk stays too.

### As many results as possible, in real time

Both halves were asked for together and they pull against each other, which is
most of what the design here is about: *deeper* means more upstream requests and
*faster* means more of them again, and the budget is one TMDB quota.

**Depth is pulled, not pushed.** `searchFilms` takes a page number and returns
one page; the wall asks for the next twenty as its foot comes into view, up to
TMDB's own ceiling of 500 pages. The alternative on the table was fetching three
or four pages per query, which is simpler and wrong: the request runs on a
debounce measured in tens of milliseconds, so every eagerly-fetched page is
fetched again for every letter typed on the way to a word — quadrupling the bill
for posters three screens below the fold. First paint still costs exactly one
request.

⚠ **This does not make search complete, and no amount of paging would.**
`/search/movie?query=b` is a relevance match ranked by popularity. Page 5 is the
81st–100th most popular match for "b"; it never becomes an alphabetical run,
because TMDB has no prefix-search endpoint. Depth buys more matches, not all of
them, and that distinction should survive any future request to "show
everything".

**Real time is 90ms, down from 220.** A fast typist is at 100–150ms between
letters, so 220 waited out the ordinary gaps as well as the deliberate ones and
the wall always arrived a beat after you stopped. It cannot go to zero: a request
per keystroke is mostly requests for prefixes nobody meant, and their answers
race each other back. A `generation` counter makes late answers safe to drop —
`AbortController` alone does not, since an abort races the response rather than
beating it.

**A client-side cache is what actually makes it feel immediate.** Every query
typed this session keeps its pages in a `Map`. Backspacing out of `matrix` is not
a new question, and correcting a typo — the most common thing anyone does in a
search field — now costs a render rather than a round trip.

**`LIMITS.search` went 30/min → 120/min.** Thirty was sized for a four-times
longer debounce and a single page; one unlucky minute of typing and scrolling now
passes it, and a 429 mid-search reads as the app being broken rather than as a
limit working. The limit exists to stop a script draining the quota, and 120 does
that as well as 30 did.

**The four fields of a loaded query are one piece of state.** Held separately, a
keystroke could leave `results` describing the old query while `page` described
the new one, and *load more* would append page 2 of what you are typing onto the
results of what you typed a moment ago. Carrying the query string alongside them
makes that unrepresentable.

**A new query returns to the top.** It did not matter at twenty posters; at
several hundred, typing another letter three screens down would leave you three
screens into a wall that had been replaced under you.

**No spinner at the foot.** The wall is silent artwork, and a caption every
twenty posters would be the loudest thing on screen — announcing a mechanism
whose job is not to be noticed. Posters simply continue.

⚠ Still unverified against the live API: that a page is twenty and that
`total_pages` says what it is documented to say. TMDB's host is unreachable from
the build environment. Nothing depends on the figure — `hasMore` reads
`total_pages` off the response rather than assuming a page size — but the number
in these notes is still documented behaviour rather than one anyone has read.

### The blinking caret was wrong twice over

A hand-drawn 1px caret blinked in the search field while it was **empty and
unfocused**, and unmounted on focus so the browser's real one could take over.
Deleted, along with `--animate-caret`.

A blinking cursor means *this is where your typing goes*, and it was making that
claim at a field nobody had touched — falling silent at the exact moment it
became true. Asked for the right way round on 10 August: it should blink when you
tap in, which the browser does for free, in the platform's own rhythm.

The same element caused the second fault. At 1px wide with 6px of the row's `gap`
beside it, unmounting on focus moved the placeholder and everything typed after
it 7px left, and 7px back on blur — a prompt that flinched when you tapped it.
One deletion answers both, and there is nothing to put in its place: the word
"search" is the affordance and the caret is the browser's.

The original was defensible, which is why it was built. It is recorded here so
the argument for it is not made again.

### The mark's case: caps, then back to lower — both on 10 August

> ⚠ **Superseded 15 August.** The mark is capitalised, in Ojuju, at 1.75rem, and
> the numbers below are Space Grotesk at 36px. **The mechanism this entry
> describes is also gone**: the trims and paddings no longer have to be moved by
> hand, because `--wordmark-ink` and `--wordmark-slack` express them against
> `--text-wordmark`. Kept for the argument that a `text-transform` beats four
> literals, and for the record of a decision that has now moved five times.

Directed twice in one day. The mark went `Again` → `AGAIN` in the morning and
`AGAIN` → `again` in the afternoon, and it is now set in lower case.

**The record is kept because the round trip is the useful part**, not the
destination. Case is a taste decision settled by looking, it has now been all
three values in two days, and it will very likely move again. What matters is
that the cost of moving it stays near zero and that nobody re-derives these
measurements a third time.

**One declaration, not four strings.** `text-transform` on the `wordmark`
utility, where it was before 9 August. The mark appears in the phone header, the
rail, `/sign-in` and `/reset-password`; four literals are four things that can
drift, and a transform keeps them one thing. It also keeps the DOM text as
"Again" at every call site, so `<title>`, prose and the accessible name all
spell the app's name as a word whatever the CSS is doing — which is the
accessibility argument too, since a screen reader may spell out a five-letter
literal in caps.

**`letter-spacing` follows the case.** −0.005em for lower case; it was raised to
+0.03em for the caps pass, because caps at display size are drawn expecting to be
tracked, and put back with them. The same value on a lowercase mark reads loose.

**Every case measured, so the next change is two lines.** `TextMetrics.
actualBoundingBox*` at 36px in Space Grotesk:

| | ink above baseline | ink below | inked height | `MARK_TRIM_BOTTOM` | `main` padding |
|---|---|---|---|---|---|
| `again` (**current**) | 26px | 8px (the `g`) | 34px | −0.0833em | 3.375rem |
| `Again` | 26px | 8px | 34px | −0.0833em | 3.375rem |
| `AGAIN` | 26px | 1px | 27px | −0.2778em | 2.9375rem |

**Lower case and capitalised measure identically**, which is why going back cost
nothing but restoring the old numbers: the `g` sets the bottom either way, and
the top is 26px in all three — the dot of the `i` reaches as high as the capital
A. Only caps differ, and only at the bottom, where the descender is missing. Its
1px is the `G`'s overshoot, not noise: round letters are drawn a hair past the
baseline so they do not read short beside a flat one, and trimming it would clip
the curve.

`MARK_LINE_HEIGHT` and `MARK_TRIM_TOP` did not move through any of it. They
describe the typeface and a height the case does not change.

Both headers were measured against the real thing rather than computed: 47.00px
in caps, 54.02px in lower case, each with both visible gaps landing on 10px of
ink. The 0.02 is subpixel rounding on the em-based margins.

**The auth pages carry the same dependency.** The h1's box is 36px but its ink is
not centred in it — the baseline lands 30px down, so the mark's `g` hangs 2px
*below* its own box, and `gap-4` therefore shows 14px of visible air rather than
16. In caps the ink stopped 5px *above* the box instead and the same `gap-4` read
as 21px, the tagline visibly drifting off the mark; it was cut to `gap-[9px]` for
those few hours and restored with the lower case.

That correction was spent on the gap rather than on the mark deliberately, and
the reasoning survives the revert: a negative margin on the h1 would shorten the
column, and the column is centred by `my-auto` with two optical corrections
measured against its current height. Moving what sits *between* two elements
changes nothing else; moving the mark's own box would re-open all of it.

---

## The keyboard, and why the iOS counter-measures are still portable — 11 August

The phone's search bar with a keyboard open took two days and eleven commits.
The mechanisms are documented where each fix lives, in `components/shell.tsx`
and `app/globals.css`. This entry is about the shape of the result, because a
reader meeting that file for the first time will see a stack of
platform-specific workarounds and reasonably ask whether the app has been built
for one handset.

**It has not, and the reason is a rule worth stating on its own: every
counter-measure arms off a measured symptom, never off a platform identity.**
There is no user-agent sniffing anywhere in it, and no `isIOS`.

### What is in the stack

Five things, each answering a mechanism that was measured on the device rather
than reasoned about:

1. **The document is held at zero** — a clamp on positive `window.scrollY`, plus
   `overflow: hidden` and a fixed body. iOS scrolls the document by the
   keyboard's exact height to reveal a focused field.
2. **The pin re-measures every frame while the keyboard moves**, rather than
   once per viewport event. A correction scheduled from an event is a frame
   behind an animation.
3. **The bar is lifted at `pointerdown`**, using a keyboard height remembered
   from last time. The native reveal is decided before the DOM focus event
   fires, so a lift written at focus is always one verdict late.
4. **Focus is called at `pointerup`.** iOS grants a keyboard to a completed tap,
   not to a focus arranged while the finger is still down — arrange it at
   `pointerdown` and you get focus with no keys.
5. **The tap's aftermath is swallowed.** The synthesized mouse burst is
   hit-tested at the touch point, where the bar no longer is; `preventDefault`
   on `pointerdown` kills mousedown/mouseup, and a 300ms document-level capture
   handler kills the `click`, which the spec deliberately spares.

### Why this is not an iOS build

Items 3, 4 and 5 all live behind one early return: `rememberedOverlap() > 0`.
Overlap is *measured*, as the distance between the shell's scroller and the
bottom of the visible area. On a platform that shrinks the layout viewport for
its keyboard — which is what `interactiveWidget: 'resizes-content'` asks for and
what Chromium implements — that distance is zero, nothing is ever remembered,
and none of the three ever runs. The tap takes the plain native path from end to
end.

Item 2 is a thermostat: it corrects the error it measures, and on a platform
where `fixed` behaves the error is zero and it writes nothing. Item 1's clamp
fires only on a non-zero offset, which such a platform never produces.

The pointer handlers return immediately for `pointerType === 'mouse'`, so no
desktop browser sees any of it.

⚠ **One part is not gated, and it is the one to revisit.** The `overflow:
hidden` document lock in `globals.css` is unconditional CSS, so it costs
pull-to-refresh in *any* browser tab, not only Safari's. It was left broad
deliberately while the mechanism was unproven — a
`@media (display-mode: standalone)` wrapper would narrow it, at the risk of the
query being unsupported and the fix silently doing nothing. The mechanism is now
proven, so narrowing it is live work rather than a gamble. See "Still open".

⚠ **It was narrowed once, on 11 August, and put back.** Loosening the lock to a
single pixel of range on coarse pointers was how the status-bar gesture was
given something to listen to, and it cost ordinary scrolling twice on the
handset before being reverted whole. If this is narrowed again it should be for
pull-to-refresh's sake alone, and with no detector reading the result — see
"What was tried for the status bar, and removed" below.

⚠ **And the want behind it is now served elsewhere.** Asked on 12 August what
bringing pull-to-refresh back would cost, the answer was this range and the
fault that comes with it — for a gesture iOS does not give a standalone app at
all. Freshness on return is built in `components/shell.tsx` instead, and needs
no scroll range. Read "Pull-to-refresh, and what was actually being asked for"
before narrowing anything here.

### Is there a better way?

**On today's iOS, no.** A standalone web app gets no keyboard contract from the
platform: `interactive-widget` is ignored, there is no `VirtualKeyboard` API and
no `keyboard-inset` environment variable, and the reveal decision happens in
native focus machinery before any script runs. Chromium offers all three, which
is exactly why none of this fires there. Every production web app with a
bottom-docked input on iOS carries some version of this; the difference here is
that ours is measured and documented rather than copied.

Two genuine alternatives exist, neither of them a refactor:

- **A thin native wrapper** (Capacitor and similar) receives UIKit's real
  keyboard-frame callbacks, including the animation curve, and would delete most
  of this. That is a platform decision, not a code cleanup, and it buys a great
  deal of other cost.
- **The decoy-field pattern** — the visible bar becomes a facade that never
  moves, and the real input lives permanently above the keyboard line. It would
  collapse items 3, 4 and 5 into one structure. It is the designed fallback if a
  future iOS release breaks any link in the tap chain, and is not worth churning
  a working stack for before then.

**What would change this:** iOS Safari implementing `interactive-widget` or the
VirtualKeyboard API, at which point items 1 and 3–5 all fall dormant on their
own measurements and can be deleted rather than disabled; or a decision to ship
a native wrapper; or a report of the tap chain breaking, which is the trigger for
the decoy-field rewrite.

**What is not verified:** none of this has been seen on Android or an iPad. The
gating above says they take the native path untouched, and that is a prediction.
This project's own record is that predictions about layout lose to five minutes
of looking — see the note at the end of this file, and every entry dated
10 August.

---

## Three reports from one handset — two answered, one withdrawn — 11 August

Directed, in one line: *tapping outside the keyboard should collapse it without
opening the intent sheet; tapping the status bar should return users to top;
tapping the × should clear the field.* The first and third are built and live in
comments beside their code. **The second was built, shipped, broke scrolling
twice, and was removed entirely at the client's instruction** — that account is
at the end of this entry, because what it cost is worth more than what it did.

This section is for the decisions that are not local to any one mechanism, and
for the trap that connects the first and the third.

### Dismissal swallows the tap that dismissed

One rule, applied to the whole page: **the first tap with a keyboard up puts the
keyboard away and does nothing else.** The alternative — dismiss, but let the
tap through — is precisely the reported fault, since what fills the screen
during a search is a wall of posters and every one of them opens the intent
sheet.

What it costs is a second tap on the header's two glyphs, which are the only
controls inside the page rather than in the furniture. A list of exemptions
would have bought them back and would need extending by hand for every control
added afterwards, which is how a rule stops being one. The collection bar, the
field and the × are unaffected: they are in the docks, and a tap on the keyboard
side of the argument is not a tap outside it.

### React events do not follow the DOM, and that broke the ×

Both docks are `createPortal`ed into `document.body` from inside `#scroll-root`'s
JSX. The dismissal handler was scoped to that element on the reasoning that the
docks are not in its subtree — **true of the DOM and false of React**, which
propagates a synthetic event through the component tree. So every tap on the
field and on the × arrived at the dismissal handler, which blurred the field and
swallowed the click that was meant to clear it.

That is one of the three reported faults, reproduced exactly, and caused by the
fix for another of them. It was found by driving the real app in Chromium under
touch emulation, five minutes after the change looked finished and typechecked
clean. Containment is now asked of the DOM, where the portals actually are.

**The wider point is the file's own rule, restated:** a passing build says
nothing about whether a screen works, and this is the second time this project
has had a fault that only a browser could see.

### Measured, not preferred

**Cancelling `pointerdown` spares the `click` in Chromium too**, which the
keyboard stack had only measured in WebKit. The × relies on it: the cancellation
is what stops the focus moving, and the click is what clears.

**What is not verified:** the handset mechanism behind the × — the fix removes
the movement that best explains the report, but the report was never reproduced
on hardware. Everything else is covered by browser assertions at phone, tablet
and desk widths.

### What was tried for the status bar, and removed

**Do not rebuild this without reading the whole of this subsection.** It shipped
twice and was withdrawn at the client's instruction with the gesture still never
observed working once.

iOS scroll-to-top acts on the main frame's scroll view, and this app
deliberately has none: the page scrolls in `#scroll-root` and the document is
locked flat. There is no event for the gesture — UIKit scrolls the view and
reports nothing else — so the only way to hear it is to have somewhere to be
sent *from*. The attempt gave the root one pixel of range on coarse pointers,
parked the document at the far end of it, and read an arrival at zero as the tap.

It cost ordinary scrolling twice:

1. **First version.** The guard asked whether a finger was on the glass or had
   lately left. With the keyboard down, an ordinary swipe threw the page back to
   the top; with the keyboard up it behaved, because a focused input was a
   separate guard and the only one still standing.
2. **Second version.** The guard asked whether anything had *moved* —
   `#scroll-root` reports every frame of a flick and of the momentum after it —
   and required 600ms of stillness before an arrival at zero counted. The
   reported fault was reproduced in a browser before the change and covered
   after it. **The client reported it still made things worse**, and the whole
   mechanism came out.

Two things are worth carrying forward from it.

**On iOS, a finger is not a proxy for motion.** The first version's premise is
the one this file had already written down when `USER_SCROLL_GRACE_MS` was
removed the same day — touch events are not reliably delivered while momentum is
running — and it was rebuilt three commits later, in a different function, for a
different purpose. A flick hands the page to iOS and the finger leaves; the
scroll runs for a second or more afterwards, and a parked document reaches zero
in the elastic settle at the end of it, long after any touch-based grace has
expired.

**`min-height`, not `height`, if a range is ever wanted on the root.** `height:
calc(100% + 1px)` from a stylesheet does nothing at all — the root keeps a used
height of exactly the viewport — while the identical declaration set from
JavaScript produces the range. `min-height` composes with the `height: 100%`
already there instead of arguing with it. It fails silently, which is how it
cost an hour.

**What would make this worth attempting again:** evidence that a standalone web
app on iOS receives the status-bar tap at all. That was never established, and
without it the whole design is a detector for an event that may never arrive —
which is the real reason to leave it out, ahead of any argument about guards. A
deliberate control in the app is the honest alternative: the wordmark is already
a link home, and a tap on the masthead is a gesture this app can actually
observe.

---

## Pull-to-refresh, and what was actually being asked for — 12 August

Asked in one line: *what happens if we bring back the pull to refresh?*

### Three things were blamed for costing it. One of them does

This is worth stating plainly because the record contains two wrong answers,
both of them written down confidently at the time:

- **The container scroll (`413c1d9`) — did not.** It claimed the cost and never
  charged it; the document was still scrolling, which was the bug rather than
  the price.
- **The document clamp in `components/shell.tsx` — does not.** It pushes back
  *positive* offsets only, and an overscroll past the top reads zero or
  negative, so the gesture passes through untouched.
- **The `overflow: hidden` document lock in `app/globals.css` — does.** A
  document that cannot scroll cannot overscroll, so there is nothing for the
  gesture to happen in. Unconditional CSS, so it costs pull-to-refresh in every
  browser tab.

`overscroll-behavior` is deliberately unset and is moot while the lock holds —
that argument is kept in place in `globals.css` for whenever it stops holding.

### Why it was not brought back

Two reasons, and the second is the one that settles it.

**Restoring the gesture means restoring document scroll range**, and that range
is precisely the 271px iOS invents to reveal a focused field — the whole subject
of the 11 August keyboard entry above. The lock is what makes the clamp's error
zero; without it the clamp goes back to correcting a fault instead of preventing
one. That is a real trade rather than a free win.

**And it buys nothing where the app is used.** iOS gives a standalone web app no
pull-to-refresh. The app is installed (`0f8419a`), so on the handset there is
none to restore. Building the mechanism anyway would be the status-bar tap over
again: a structure serving a gesture that never arrives.

Two costs that would *not* be paid, for the record, because they were paid
already: the header is `fixed` rather than `sticky` specifically so it holds
through the rubber-band, and `isolate` on `main` exists because pull-to-refresh
was when iOS tore down and rebuilt layers and the posters climbed over the
wordmark.

### What was built instead

**Returning to the app is what a person means by refreshing**, it is observable
installed and in a tab alike, and it needs no scroll range at all. So
`components/shell.tsx` now calls `router.refresh()` when the app comes back
after `STALE_AFTER_MS` away — 10 seconds.

The reasoning that is not local to the code:

- **The measure is how long you were gone, not how recently we last asked.** A
  banner glanced at and a call declined in one tap are not returns, and they are
  exactly the sub-threshold case — so one number both defines staleness and
  stops app-switching becoming a request per switch. A rate limit on top would
  be a second answer to a question already answered.
- **It is in the shell, so it is one listener for the whole signed-in app**, and
  the refresh re-runs layouts as well as the page — which is what brings the
  collection `counts` up to date, not only the list under them.
- **`Date.now()`, not `performance.now()`.** How much time passed in the world
  while the app was not running is a wall-clock question. Every other timing in
  that file is a frame question and correctly uses the other instrument.
- **`pageshow` alongside `visibilitychange`**, because a back gesture in a tab
  can thaw the whole frame out of the bfcache rather than merely revealing it.
  Whichever fires first clears the timestamp and the other finds nothing to do,
  so the reset is the de-duplication and there is no second timer to keep in
  step.

⚠ **This does not narrow the lock, and it is not an argument for narrowing it
later.** If pull-to-refresh is ever wanted in a tab for its own sake, the note
under "Still open" applies unchanged — and it should be narrowed with nothing
listening to the result, which is what broke scrolling twice on 11 August.

⚠ **If it is narrowed, invert the failure the old note worried about.** The
concern recorded in `globals.css` was that `@media (display-mode: standalone)`
would silently do nothing where the query is unsupported, dropping the lock
everywhere — the worst of the three outcomes. Detect standalone in script
instead (`matchMedia` plus `navigator.standalone`), stamp the root, and key the
lock off the *absence* of a proven browser tab. Then an unanswered question
keeps the lock rather than losing it.

**Not verified in a browser.** It typechecks and lints; the signed-in shell
needs an account to reach, and none was created for this. See "Verified, versus
assumed" — this file's own record is that a passing build says nothing about
whether a screen behaves.

---

## The document scrolls again, and the lock was never needed — 13 August

Asked in one line: *why can we not have the address bar recede when scrolling
down? It happens on other sites.*

### The answer, and why it is one cause and not three

Safari collapses its address bar in response to the **document** scrolling. This
app's document could not scroll: the page lived in `#scroll-root`, which was
`fixed inset-0`, behind an `overflow: hidden` lock in `app/globals.css`. So the
bar was never told anything had happened.

Measured in Chromium at phone width, document scroll range:

| as shipped | the lock lifted, nothing else | the lock lifted **and** `#scroll-root` un-pinned |
|---|---|---|
| 0px | 0px | 1229px |

⚠ **The middle column is the one worth keeping.** Lifting the lock on its own
changes nothing, because the content was in a box stapled to the glass and the
document had no height to scroll whether or not it was permitted to. Anyone who
tries the one-line CSS fix will see no difference and conclude the diagnosis was
wrong. Scroll ownership had to move with it.

### What made it safe, and the method lesson underneath

The lock existed for a real fault, measured on 11 August: tapping the search
field made iOS scroll the document by the keyboard's height — 271px in a tab,
333 standalone — to reveal the focused field, dragging every `position: fixed`
element in the app up with it, the header included.

**But the lock and the real fix were built in the same week, and the lock was
never taken off to see whether the fix stood on its own.** It does. The dock
lifts clear of the keyboard at `pointerdown` now, before iOS decides whether it
needs to reveal anything, so there is nothing left to reveal.

Measured on the handset through a temporary probe, with the document unlocked
and the clamp stood down — six keyboard openings, three installed and three in a
Safari tab, nothing left to put the document back: **`scrollY` peaked at 0 every
time.** In the tab, the address bar receded on scroll and stopped receding again
the moment the lock went back on.

> **A defence built beside a cure hides whether the cure works.** The two of them
> together look exactly like the cure alone, and the guard gets kept forever on
> the strength of the bug never recurring. When a guard and a fix land together,
> take the guard off once and look.

That is the transferable part. The CSS is incidental.

### The clamp could never have been narrowed

It reset any positive `window.scrollY` from a scroll listener, every frame for
the length of a keyboard animation. Measured in Chromium against one deliberate
400px scroll of the unlocked document, **it fired 18 times and won every time.**
It could not tell iOS's scrolling from a person's, because it never asked — so
every surviving version of it is a version that fights the user. Deleting was
the only move available, which is exactly why the handset measurement had to
come first.

### What it cost to build, against what it looked like it would cost

The part that looked riskiest needed nothing. **The masthead and the search dock
are `position: fixed`, which is viewport-relative, so document scrolling leaves
them alone** — measured before the change, unchanged after it.

Four things did need moving, and all four were mechanical:

- The bar's recede logic now watches the window rather than `#scroll-root`. Its
  old note leaned on "the only scrolls this element receives are ones a person
  made", which is no longer true — the settle window written for the 271px case
  is what carries it instead.
- `useKeyboardPin`'s `floor()` measures `--keyboard-overlap` against a new
  zero-height fixed twin on the viewport's bottom edge. It used to read
  `#scroll-root`'s own bottom, which meant the viewport's bottom **only because
  that element was pinned**; in the flow it is the bottom of the content, and the
  overlap would have come out as most of the page.
- `scrollSearchRootToTop` in `search-provider.tsx` scrolls the window. Silent
  when wrong: the wall would simply have stayed where it was on the next
  keystroke.
- The per-route scroll reset was **deleted rather than repointed**, which is the
  one judgement call here. It existed only because a nested scroller broke Next's
  own handling on 10 August. Repointing it at `window` would have been strictly
  worse than nothing: Next restores the previous offset on Back, and a reset
  keyed on `pathname` cannot tell a Back from a tap, so it would have forced the
  top on both. The restoration that the old note recorded as already lost is not
  lost any more.

`floor()` is still needed, which reads as though it should not be. What used to
supply that distance was the range iOS *invented* to reveal a focused field, and
iOS no longer invents it; a flowing document's real range is content minus layout
viewport, and iOS does not shrink the layout viewport for a keyboard either way.

### What came back with it

The address bar recedes in a tab. Pull-to-refresh works in a tab again — the
`overscroll-behavior` note in `globals.css` stops being moot after eight days.
Neither exists installed, where the app is actually used, so this is for arrival
before install. Refresh-on-return (`ef1a909`) is unaffected and remains the
freshness mechanism in both modes.

**Verified in a browser**: 34 assertions across phone, tablet and desk widths —
scroll range, the lock's absence, the wall tracking the scroll exactly, the
masthead holding its place, the bar receding and returning, routes starting at
their top, the search wall resetting on a keystroke, and tap-to-dismiss still
blurring without opening the intent sheet.

⚠ **Not verified on the handset after the change.** The measurement that
authorised it was taken there; the result of it has not been looked at yet.

⚠ **Playwright screenshots under `isMobile: true` capture from the layout
viewport origin and ignore document scroll.** A screenshot showed the wall
standing still while `scrollY` read 400; the bounding rect showed it had moved
the full 400. Measure rects, not screenshots, when the question is whether
something moved — this nearly produced a wrong conclusion in the other direction.

---

## The masthead takes the typing, and three mechanisms retire — 14–15 August

Directed across one evening in several passes: the house glyph becomes a search
glyph, search and profile swap sides, the field leaves the bottom bar and opens
across the top of the masthead, a back arrow sits beside it, and the mark goes
back to Ojuju — capitalised, and smaller. `db0a207` through `0f52dba`.

The mechanisms are documented where each one lives; `components/shell.tsx` and
`app/globals.css` carry the measurements and the warnings. This entry is for what
is not local to any of them.

### Moving the typing to the top is the fix the whole keyboard stack stood in for

The field went into the phone's bottom bar on 9 August because the collection
line already ran to within about 15px of a 375px screen and there was no width
left for a field beside it. The bar then held one of two things with a chevron
swapping them, and the rest of the shell had to ask which. **All of that is
gone** — the bar holds one thing, `barMode` went with the field, and the
argument the mode existed to settle stopped existing rather than being won.

The larger cost it removed is the keyboard. A field at the bottom of a phone is a
field the keyboard covers, and everything built for it between 11 and 14 August
was an attempt to answer one question: *how tall is a keyboard that has not
appeared yet.* It is not answerable — iOS decides the reveal before any script
runs — so the app estimated it from last time's measurement, kept the maximum
ever seen, and painted black under the lifted bar to hide the error.

> A number that cannot be known in time is not a number to estimate. It is a sign
> that something is in the wrong place.

Retired by name, and all three are recorded at their sites rather than here:
`lastKeyboardOverlap` and `rememberedOverlap()`, and `groundFor` for the second
and final time — its own note now says do not build a third one. `--keyboard-overlap`
survives, because `floor()` measures it *while* the keyboard is up, needs no
prediction, and is what keeps the last row of a long list reachable.

**This is `CLAUDE.md`'s rule in its cleanest instance so far.** Remove the
mechanism, then the condition it fails under, and only then correct it. Three
mechanisms came out and the symptom left with them, on every device at once.

### One fault, three times: a control that removes its own surface

The × on 11 August, the search button that is unmounted between its own
`pointerdown` and `pointerup`, and the back arrow that blurs the field it lives
in — the same fault arrived at from three directions, and each was found
separately.

> A control that removes its own surface has to be listened to from something
> that outlives the gesture, and has to hold focus until its click has landed.

The header outlives both halves of the masthead, so the gesture is heard there.
The arrow prevents its own blur on both pointers. Neither is a workaround for a
platform; both are consequences of asking an element to survive its own
disappearance.

### The mark: Ojuju again, capitalised, and the size is a knob now

Space Grotesk set the mark from 9 August until this session, on the instruction
that it did not work for it. Ojuju is back, setting `Again` at 1.75rem, down from
2.25. The mark also read `Need` for a few hours (`ece1113`) before being reverted
— recorded for the same reason the case changes of 10 August are: **the round
trip is the useful part**, and this one has now happened three times.

The part that matters is not the face. Every previous change of face, case or
size needed hand edits in three places, because the trims were measurements taken
at 36px of a specific face setting a specific word, and the masthead's height and
`main`'s top padding were px and rem derived from them. They read
`--wordmark-ink` (0.92) and `--wordmark-slack` (−0.135) now, both expressed
against `--text-wordmark`, so the size is one line and the numbers cannot fall
out of step with it.

**`docs/plan.md` carried a table called *Numbers that must move together*, and
most of it described exactly this coupling. It is retired with the coupling**,
which is the honest way for that table to end — not by being maintained, but by
the mechanism it warned about being removed.

⚠ **The two ratios are properties of the face *and* the word.** Ojuju hangs
`Again`'s `g` below its own box, which is why the slack is negative where Space
Grotesk setting `need` was positive. A new face or a new word re-opens both.

### A third colour, added and taken back the same evening

`--color-caret: #3fbfae` gave the search chevron a turquoise blink, argued at the
token: a caret reports a *system state* — the app is listening — which is neither
of the two claims the palette already makes, and platforms tint their own carets
for that reason. Measured 9.27:1 on the true-black ground, and deliberately cool
against a palette that is warm throughout.

**Reverted within the hour, on instruction.** The chevron is `text-muted` again
and the token stays defined and unused, the way `--font-ojuju` outlived its own
replacement and was there when it was wanted back. What the revert restores is
§11's position that this palette carries two meaningful colours — amber for
overlap, lacquer red for *you are here* — and the point that decided it: on a
matte black screen the blink was already the only thing moving.

### The caret came back, turned the right way round

Deleted on 10 August for blinking while the field was *unfocused* — making its
claim at the one moment it was false, and shifting the placeholder 7px when it
unmounted. It is back as a state on a glyph that is drawn anyway, keyed to focus,
so nothing mounts, unmounts or moves. Only the midpoint keyframe is declared, so
the reduced-motion block leaves the chevron visible rather than hidden.

The entry recording its deletion stands. The argument against the old one was
correct and is not the argument against this one.

### Focus decides the keyboard; the query decides the bar

Typing `alien` and then tapping the page used to take the bar away and leave a
wall of matches with nothing on screen saying what was matched, and no way to
amend the query except opening search again to find the word still in it. The bar
now survives the keyboard, and both ways out already pass through an empty field,
so nothing else had to learn the rule.

⚠ **A tap with nothing to dismiss is an ordinary tap.** The first version of that
swallowed unconditionally whenever the bar was up, which ate a tap aimed at a
poster — a dropped tap, which is the exact failure the whole dismissal design is
about, arrived at from the other side. Suppression has to be earned by something
actually being put away.

### And then the masthead recedes too — 15 August

Directed, and it reverses a position this file's own code held in a comment: the
header stayed put while the bar at the foot slid, *because it is the only thing
on screen that says where you are, and a mark that comes and goes reads as a
rendering fault rather than as a gesture*.

**That reasoning was right, and it is now carried by two rules instead of by an
exemption.** The masthead does not recede while it is holding the search field —
sliding it away mid-search would take the query, the caret and the only way out
with it — and leaving search reveals both bars, so the mark cannot return to a
header that is about to slide away on the same frame.

⚠ **The first of those two rules is narrower since 17 August: it is the caret,
not the row.** Directed — search something, start scrolling, and the bar holding
the query should recede the way the collections do. The exemption was written
against `searchAtTop`, which is the row being *in* the masthead, and that row
deliberately outlives the keyboard (`onDockBlur` keeps it up over a non-empty
query) — so it pinned the masthead for the whole time a wall of results was being
read, which is exactly when the screen is wanted back. It reads `searchFocused`
now. The clause above says what it was always protecting: *the query, the caret
and the only way out* — a caret is focus, and a query on screen with no caret in
it is a label rather than an input. The second rule is untouched and is what
keeps the mark from returning into a header that is about to leave.

On touch this is a smaller change than it sounds, because focused-and-scrolling
is very nearly unrepresentable: since 14 August a drag aimed at the page blurs
the field before the scroll gets going. So the first drag folds the keyboard, the
500ms settle window swallows the scroll that folding produces, and both surfaces
leave together on the same gesture — which is the point of one signal.

⚠ **The recede costs more at the top than at the foot, and only since 14 August.**
With the house glyph gone the wordmark is the only route to `/` on a phone, and
the search glyph is the only route to the field, so both leave with the masthead.
The 32px floor and the return on the first upward movement are what make that
affordable; they are the numbers to reach for if it ever reads as a trap rather
than a gesture.

**One signal, two surfaces.** The existing scroll listener already computes
`receded`, stamped with the route it was hidden on, and the masthead derives from
it. A second listener measuring the same scroll would be a second threshold to
keep in step, and the two would disagree on the frame a flick reverses.

The one number that is not shared: the masthead moves by its own height **plus
the `0.5rem` of its shadow**, which paints ground below the element so posters
pass under the mark. Moving it by 100% alone leaves that strip behind, clipping
the top of the wall against a ground it happens to match — invisible in a
screenshot and wrong.

⚠ **Not verified anywhere.** Typecheck, lint and a production build pass, and by
this file's own standard that says nothing about whether a screen behaves. This
one is a gesture, so it wants a phone.

### What is verified, and what is not

Driven against the running app at 390×780 and at desk width: 30 assertions for
`ea1f914`, 35 for `e6d972b`, 42 plus 8 for `0f52dba`. Typecheck, lint and a
production build are clean throughout.

The handset was not silent this week — three reports came off it on 13 and
14 August (a black sheet over the posters, flicker while scrolling with the
keyboard up, and a slither of a gap under the bar), and all three are answered
above. ⚠ **What has not been looked at on hardware is the result**: the masthead
field itself, on the device that produced the reports.

---

## What Again is for, and the map it is not — 15 August

Asked directly, after a read-through of every document in the project: what is
the long-term aim even if we start with movies, and is the *living map of things
you could do* in the expansion reference really a different product, or a sharp
distinction drawn where there is none?

### The aim is the convergence graph

Again is a private record of what someone would try and what they would return
to, held by people who track each other, where the event that matters is two of
them independently wanting the same thing. It improves as the graph gets denser
and degrades as it gets wider — §13's two hundred people in twelve clusters
against a million spread evenly. The asset is `entries` × `tracks` × `items` in
our own Postgres, which *Third-party dependencies* below already identifies as
the one thing that cannot be replaced.

Films are the first kind, not the shape. §2 has always allowed a second one.

### The living map is not a different aim — it is the same mechanism, second trigger

This was first framed as two different products, and that was too strong. Both
are the same proposition: an intent you have already expressed becomes
actionable. Convergence is one trigger — someone you track wants it too. A
screening on Saturday is another — the world makes it possible. Neither is
discovery, and the expansion reference was right to say the personal layer should
*"prefer explicit intent over inferred taste"*.

**What separates them is truth decay, and that is the whole of it.** A
convergence is computed from rows we own and cannot be wrong. An occurrence is a
claim about the world that rots — the screening moves, the price changes, it
sells out. It would be the first thing in the product capable of lying to
someone, in a product whose entire proposition is that what it says is true. That
is a reason to sequence it late and build it with provenance, not a reason to
call it a different company.

### The line, stated better than §2 states it

§2 bans *"availability, acquisition or where to get it"*, and every example on
its list — streaming lookup, library availability, retailer links, price
tracking, ownership inventory — is about acquiring a thing to consume alone. A
screening is not that. It is an occasion, at a time and a place, that two people
can attend together, which is the thing this app says it exists to produce.

> **Acquisition makes the app a remote control. Occasion makes it a diary.**

That is the line to hold, and it is sharper than "availability" because it
explains *why* a streaming deep-link is wrong where "the Prince Charles has it on
Saturday" might not be.

Even under it, **no booking link.** The moment there is a checkout the incentive
to become a listings product starts pulling on everything else in the design.

### Decided: not now, and the order matters more than the rule

If occurrences are ever built, they fire only against a want already held, shared
with someone who already tracks you back — no browse, no availability filter, no
surface a stranger can use. And not before Phase 4, because the answer to *the
app feels inert* is other people, and other people do not exist in it yet.

### The passivity question, which is the same question

Asked in the same session: with no browse and no discovery, does the app reduce
to typing in things you happened to walk past? Three things are true.

- **It already isn't.** The poster wall answered exactly this on 9 August — *"the
  thing it was worst at was the moment before capture"* — and it carries three
  tests it must keep passing: not availability, not ranked or personalised, not a
  feed.
- **The designed supply is other people.** The README's founding line is that a
  go-back-tos list *is* the recommendation, the way a bookshelf tells you more
  than a list someone writes for you. Phase 2 gives `/u/[handle]` and copying with
  `source='copy'`. The proof that browsing a friend's shelf is designed behaviour
  rather than tolerated is §6's suppression rule: nobody writes a suppression rule
  for an activity they do not expect people to perform.
- **None of it is built.** Phases 2 to 4 are the supply, and §13 puts 100% of the
  value there.

> The app is not too passive by design. It is passive because the half that
> supplies it has not been built yet.

### The database is not being prepared for this, and the reasoning is already in this file

*What not to build* argues it under third-party dependencies: the insurance is
the schema, not the code, and a provider abstraction is speculative generality.
Three things make the wait safe:

- **An `occurrences` table is additive.** New table, foreign key to `items`;
  `entries`, `tracks` and `notifications` do not change shape. Building it later
  costs one migration and touches nothing that exists.
- **Identity is the one expensive retrofit** — what counts as the same thing when
  a film arrives from TMDB and from a cinema's feed. `items.external_source`
  exists for it and is deliberately not in the unique constraint.
- **And even that is cheap while there is one source**, because duplicates cannot
  exist. It becomes expensive on the day a second source lands.

**So the preparation is due when the second source arrives, and not before.** The
trigger belongs in the table at the end of *When to revisit*, where the provider
migration row already says to settle the constraint and deduplication together.

### The shape that was sketched, kept in one paragraph

`docs/product-reference_for expansion.md` held this and has been removed, since
everything else in it either duplicated this file or was overtaken. Worth
keeping in case the trigger ever fires: the category-neutral concepts were a
**thing** (film, exhibition, concert), an **occurrence** (a specific screening or
performance), a **place**, a **source**, an **availability** state backed by
evidence, the person's **context** (location, travel tolerance, budget,
accessibility — all optional and user-controlled), their **intent**, and
**provenance** on every field: source, timestamp, extraction confidence, last
verification. Category specifics belong in adapters rather than in the core, and
the product must never imply complete coverage — *"12 opportunities found from
the sources currently covered in your area"*, never *all* of them.

That paragraph is the whole of what a future version needs to start from. The
529 lines around it were a plan for building it now, which is the part that was
declined.

**What would change all of this:** a dozen real people using the app with their
shelves visible to each other, and it still feeling like there is nothing to open
it for. That is evidence. A roadmap wanting it is not.

---

## The caption becomes the masthead's other half — 16 August

Fifteen passes over one screen, `f5cb915` through `d1e8117`, directed throughout.
`main` deploys on every push, so each change was on the handset within a minute of
landing and most of what follows was **reported rather than reasoned** — eight
reports came off the device between them, and two of those contradicted notes this
file had already written.

The mechanisms live where they run: `components/cinema-wall.tsx` holds the caption
and its layers, `app/globals.css` the tokens and the two keyframe sets,
`components/shell.tsx` the state the caption reads. This entry is for what is not
local to any of them.

### One slot occupied at two moments

The mark and the wall's caption are the same corner of the screen at different
times — the masthead slides off on a downward scroll and the caption pins in the
strip it vacates. That was already the arrangement on 15 August, and the two were
*matched* rather than shared: two elements that happened to agree.

They now share three terms, none of which is a number written at either site:
`masthead-box` (the air above and below, the notch cleared), the row at
`h-[var(--wordmark-ink)]` with its contents centred, and `--type-indent` for the
horizontal fraction. A change of size, face or gap moves both surfaces or neither.

**The failure that argues for sharing is not a misalignment, it is a movement.**
Two placements that agree today show up, when one of them drifts, as the top-left
corner of the app stepping sideways or up during a scroll — a movement with no
cause a person can name, which is the worst kind. Alignment is the visible half;
the invisible half is that there is nothing left to keep in step.

⚠ **The letters still start 1px apart and that is deliberate.** Both text origins
land at 26px; Ojuju's `A` carries a side bearing at 28px that 13px capitals do
not. Correcting it needs a per-face, per-*glyph* nudge, and the caption is two
words with no one glyph to correct against. Where the text is set *from* is the
stable thing to align.

### Covering is not hiding

⚠ Reported: a pull-down at the top of the wall showed the caption. It was hidden
by sitting underneath the masthead — `z-10` against `z-20`, opaque, one layer
above — and an overscroll rubber-bands the document while a `fixed` header stays
with the viewport, so the two came apart and the label slid out from under the
mark on the opening screen.

> **Covering is not hiding.** It holds only while the two elements move together,
> and overscroll is exactly the case where the platform moves them apart.

So the caption stopped asking to be covered and reads the mark's state instead:
`data-masthead` on `#scroll-root`, which the shell already computes for the
masthead's own recede. An attribute rather than context, because one boolean is
the whole of what has to travel — no provider, no subscription, and `main` is a
sibling of the header, so it arrives at the caption in CSS alone. The fade is the
masthead's own 300ms, so the two are one movement rather than two.

⚠ **And it settled a claim two notes had been making since 15 August that neither
had checked.** Both said the label was hidden at rest. It was not: the negative
margin cancelled `env(safe-area-inset-top)` and nothing else, which left the box
in flow *below* a masthead that had already cleared the notch — so the label hung
under the mark from the first paint, and `sticky` had nothing to pin until you had
scrolled past it. The pull is `--masthead-clearance` now, the whole of what the
masthead claims, which lands the band exactly on the masthead's painted band.

### One token retires a row of the coupling table

Asked in the same breath: why does the mark's banner run 8px deeper than the
caption's? The boxes were already identical. The difference is the `box-shadow`
the header paints below itself, which fills the gap it keeps from the wall so that
posters do not show through it.

Deleting that gap is the thing not to do — it has been tried, and collapsing the
space under the mark made the `g`'s descender look met by the posters. So the band
with no hem grows one instead, as a margin on its row, and the two banners paint
to one line.

That number is `--masthead-hem`, and `--masthead-clearance` is the box and the hem
together. It had been `0.5rem` written out in the shadow, in `main`'s top padding
and in the recede's extra travel, with a row in `docs/plan.md` asking whoever
changed one to remember the rest. **Four sites read one token now, and that row is
retired** — the second coupling this month to leave that table by being removed
rather than by being maintained.

### A boundary cannot report a jump

⚠ Reported from the handset: in *Coming soon*, tapping the status bar to fly to
the top left the caption reading *Coming soon* over the first row of what is on
now, and only scrolling back down through the crossing put it right.

The observer watched the ten-pixel seam between the two grids, and the seam's two
states are one state to an observer — out of view above and out of view below are
both `isIntersecting: false`. Going from one to the other without stopping in
between is not a change, so nothing calls back. The label was never stale; it was
never told.

> **An observer holds a state, and can only report the states its subject can
> distinguish.** If a subject can be on both sides of the root between two frames,
> the subject is wrong — no amount of correcting the callback reaches it.

So the subject is a **half** rather than the boundary. *In cinemas* is precisely
"some of what is on now is still below the caption", which is a state the two
answers differ on, so every crossing raises a callback whatever route it takes, at
any speed, including none. The swap point does not move — the grid's bottom edge
*is* the seam's top edge — and the comparison against `rootBounds.top` that
15 August added disappears with it, since it only existed because the boolean
could not tell above from below.

**That is two bugs in one observer in two days, and they are the same bug.** The
first tested a position at the only moment the position was never right; this one
watched a subject that could not tell two situations apart. Both read as the
feature being absent rather than broken, which is why both took a report from a
person holding a phone.

⚠ **Still an observer rather than a scroll listener, and now for a better reason
than cheapness.** iOS withholds events during momentum — this shell has been
bitten by that once already, where `USER_SCROLL_GRACE_MS` used to be — while
intersections are recomputed from layout on every rendering opportunity, delivered
events or not. A scroll listener would answer the jump correctly and reopen that.

### `svh` is not the screen

⚠ Reported: installed, tapping *Go-back-tos*, *Fixtures* or *Archive* moved the
collection bar up the screen and left it there. *Wants* — nineteen entries — and
the home wall did not. The three are the same component with the same props; the
only difference between them is whether the content overflows.

Measured off three screenshots, 1170×2532 on a 390×844 handset: the bar's labels
sit 35.0 CSS px above the foot of the screen on the wall and on Wants, and 81.7 on
Go-back-tos. The difference is 47.0 exactly, which is that device's
`env(safe-area-inset-top)` — confirmed in the same images by the mark, which lands
at the inset plus `--masthead-gap`.

> **`viewport-fit=cover` lets the page paint into the status-bar band. `100svh`
> does not grow to include it.** So a page whose content does not overflow ends
> one inset above the foot of the glass, and anything measured against the page
> box lands on that line rather than on the screen's.

`min-h-[calc(100svh_+_env(safe-area-inset-top))]` states the thing that is true —
the page box is the screen — and is a no-op everywhere else, since the inset reads
0 in a Safari tab, on Android and on the desk. `/profile` gains the same 47px,
which is the identical fault seen from the other end: that page is composed around
its own bottom-left corner and was landing above the foot.

⚠ **The number was already written in the file from another day's measuring, and
nobody had subtracted it.** The note where `lastKeyboardOverlap` used to be calls
this "an 797px handset"; 844 − 797 is the 47. A measurement recorded during one
investigation is evidence in the next one only if somebody goes back and reads it.

### The tail is a stroke, not mass

⚠ Reported: the caption sits on the mark's line and looks low against it. It was
centred honestly, and that was the fault.

`--wordmark-ink` is cap-to-tail, so the centre of that box is not the centre
anybody sees — a reader takes a word between its cap line and its baseline and
discounts the `g`'s tail, which is a stroke rather than mass. The two centres are
exactly half a descender apart, and the caption was sitting on the lower one.

`--wordmark-drop` (0.21 of the type size, the same 0.21 the ink's own note has
recorded since the face changed back) is now named, because something subtracts
it: the caption's row takes it as padding at the foot, leaving exactly the band
the eye reads to centre in. **A subtraction rather than a nudge** — no lift is
written anywhere, nothing is tuned against a screenshot, and a change of size or
face moves it through the same tokens that move everything else about the mark.

Measured at 390px with both real faces: the capitals now centre 0.27px from the
mark's cap-to-baseline centre, where they were 2.7px below it.

### The glass is three layers, and two of them had to be measured first

Directed: the band's blur should double from its foot to its head, linearly; and
the ground should be darker at the top, where the clock and the battery sit, and
should accentuate the row the caption is in.

**`backdrop-filter` is one strength over a whole element**, so a ramp is two blurs
stacked with the upper one masked to fade in toward the top. Three things had to
be measured before any of it could be written, and each changed the answer:

- ⚠ **They must be siblings, not nested.** An element carrying a
  `backdrop-filter` *is* a backdrop root, so a child of it has no page left to
  blur — stacked inside, the second layer changed a hard edge's softening by
  0.0px. That is also why the `h2` gives up the blur it used to carry.
- ⚠ **Blurs compose in quadrature, so the upper layer is not the target.** To land
  on `2b` over a base of `b` it must be `b√3` — 41.57 against 24, not 48. The two
  stacked read 125.0 in edge widths where a flat `blur(48)` reads 124.0; a top
  layer of 48 overshoots to 134.
- ⚠ **The reveal cannot sit on the box that holds them.** An element below full
  opacity forms a backdrop root too, so a fade on the parent leaves both layers
  blurring nothing for the length of it — 0.8px of softening under a parent at
  0.5, against 40.5 for the same blur on the element carrying the opacity. The
  three layers fade together and separately, off one string.

**The ground then had to stop sharing the blur's mask.** The blur is depth and
should ramp the whole way up the band; the ground is emphasis, and its job is to
make the label read as a label. One mask forces one curve on both, and the curve
that suits either is wrong for the other. So the tint became a third layer above
both blurs, where nothing filters it.

⚠ **Its first shape was flat through the row, and that was rejected on sight.**
Holding full strength down to where the letters end puts the flat region's edge at
84% of the band's height, leaving 16px for the fall.

> A band that is flat for most of its height is not a gradient. It is a bar with a
> soft lip.

`--band-solid` is `env(safe-area-inset-top)` instead — the one strip of the band
the page can name, and the one with a reason to be solid, since iOS draws the
clock, the signal and the battery over it and gives the page no say in how. Below
that line the ground eases away through everything else, the caption's row
included, which gives the ramp fifty pixels to happen in rather than sixteen. 88%
at the top against the 60% glass at the foot. Where there is no inset — a tab,
Android, the desk — the flat region is zero and it is a plain linear fade, which
is what it should be when there is no status bar to sit under.

### The blink had never fired for one of the two words

⚠ Reported: *Coming soon* blinks when it appears and *In cinemas* does not.

The animation was applied outright and replayed by the span remounting on a
changed key, so it fired on a **change of word** — which is the only way *Coming
soon* ever arrives. *In cinemas* is usually mounted already when the mark recedes;
it has been sitting behind it since the page loaded, so the band appeared and the
word just sat there. It had fired once on load, behind an opaque masthead, and
never again.

An animation starts when `animation-name` goes from none to a name, which is
exactly the moment `data-masthead` flips — so the animation hangs on the state
now, and the key stays for a crossing that happens while the band is already up.
**Two triggers, two different events, neither doing the other's job.** Applied
unconditionally it could never have done the first: the property is already set,
and a value that does not change restarts nothing.

**Then the blink was moved onto something big enough to see.** Measured off a
rendered band, the label's ink is **2.57% of the band's area**, so a full swing on
it moves as much light as a 2.6% change across the whole bar — against a wall of
artwork in motion, which is the only time it ever fires.

> Peripheral vision reads luminance transients over **area**, and is nearly blind
> to colour and to detail. A word is not a cue; neither is a colour.

So a sheet of plain ground sits above the glass and below the label, steps solid
on the first frame, holds 80ms and eases out — a step because what gets detected
is the rate of change, and an eased onset of the same depth reads as half of one.

⚠ **And that flash changed nothing anybody noticed, which is the arithmetic that
should have been done before it was built.** A black flash can only subtract the
light the artwork is still contributing, and at the caption's row the ground has
already taken 76–88% of it: in perceptual terms 12 → 0 over a dark poster (5% of
the scale), 36 → 0 over a middling one (14%), 59 → 0 over a bright one (23%). A
light flash is uniform and no stronger — 8, 7 and 6% — because there is only so
far a black app can move without reading as a flashbang.

> **Movement has no such ceiling and no dependence on what is behind it.**

So the word rises into place: `0.8em` over the first 126ms, measured at 10.4px and
about 80px a second — a roll rather than a jump. The blink follows it unchanged
once the word has landed, so it is still one gesture and still one event. The
band's flash stays, because it is worth most over bright artwork, which is exactly
where the caption is hardest to read, and costs nothing where it is worth least.

**The word stopped fading out in the same pass.** ⚠ Reported: flying to the top
from *Coming soon* showed a glimpse of a red *In cinemas* on the way — the glass
fading over 300ms while the observer, watching the wall come back up, flipped the
word underneath it. A label announcing itself on its way out, during transit
nobody reads. The glass keeps its fade, because a band that vanishes on the frame
the mark starts sliding back leaves the top strip bare; the word does not need
one, since **its entrance is the blink and its exit should be the moment it stops
being true.**

### Four pixels, and a corner taken back

`--masthead-gap` is 8px, from 10. It is the only air in a banner — the rest is the
mark's own ink and the notch — so it is the only honest place to take height from,
and `masthead-box` is worn by both surfaces, so both lose the same 4px and the
wall comes up by it.

⚠ **The token's note had argued for 10 over 8, and that argument had expired
without anyone noticing.** It was measured under Space Grotesk, before the trims
were re-measured for Ojuju on 15 August. Re-measured with the face that ships, at
8px the ink clears by 7.25 above and 8.5 below. **A measurement written as a rule
outlives the thing it measured**, which is the same failure as the two notes that
claimed the caption was hidden.

Both banners took the posters' own corner on their lower edge, by
`--radius-artwork` rather than by two `rounded`s that agree because Tailwind's
default is the same number twice. It lasted one commit and was reverted on the
caption, directed; the mark keeps it. ⚠ **The curve only ever read on one of
them** — the caption's band is the width of the wall, so its corners land over the
first and last column of posters, while the mark's runs to the screen's edges
where there is only ground behind it and a curve cut into black shows nothing.

### The one marginal thing in the band

Directed: *Coming soon* is too muted. `--color-muted` is `--color-text` at 60% and
it is tuned for text **on ground**; this text is on glass over artwork that is
moving, so 40% of every letterform was the wall showing through it.

Measured at the caption's row with the wall through the letters: 6.07:1 over a
dark poster, 5.61 over a middling one, and **4.49 over a bright one** — which is
the 4.5:1 floor for text this size. So it was not merely quiet, it was sitting on
the line. `text-text/80` reads 10.43 / 8.91 / 6.63 and lets half as much wall
through.

It stays brighter than the live red, which measures 5.79:1 on the same band, as
the muted value already did. **The red has never carried by being lighter** — it
carries by being the only colour on the screen and by naming the half that is on.

> A token tuned against one background is not a value, it is a measurement of that
> background. The first translucent surface in the app is where every one of them
> gets re-opened.

### What is verified, and what is not

Every change was measured in a browser at 390px before it shipped, several against
a simulated 47px notch, and the observer rewrite was run against both mechanisms
on one page. Typecheck, lint and a production build are clean.

**The handset carried this session rather than checking it afterwards**, which is
new: eight of the findings above are reports, and each fix was back on the device
minutes later.

⚠ **What has not been looked at:** the last change — the 80% ink — has not been
reported back on. The band's ground ramp has been measured only against a
simulated inset, never against a real notch. And nothing today was seen above the
`rail` breakpoint, where the caption is an ordinary sticky heading and every
`data-masthead` variant is bypassed by a `rail:` — reasoned, and not looked at.

---

## D1 is answered `no`, and the caption is switched off rather than cut — 16 August

**Again does not become cinema-aware now.** That is the gate `docs/plan.md` names
as D1, and it is answered the same evening the caption was finished — which is
the awkward order, and the right one.

**It is a "not yet" rather than a "no".** Directed: showtimes come back as a
**paid feature**. So D2 (which provider) and D3 (how the app learns where someone
is) are not answered, they are parked, and the prices evaluated on 15 August stand
as the starting point for whenever that is.

### Why no, on the evidence already in this file

- **It fails §13's test outright**, and it is the only thing on the roadmap that
  does. Cinema listings make the app more useful to a stranger with no friends on
  it.
- **It would be the first thing in the product that decays.** A convergence is
  computed from rows we own and cannot be wrong; a showtime is true for a day.
  *The line, stated better than §2 states it* permits an occasion, and permitting
  is not the same as being ready to be wrong in public.
- **It needs a location, which needs `/settings`, which does not exist.** All the
  app has is a country from an IP, and cinemas are local. That is the cost this
  class of integration gets wrong, not the data.
- **€149/mo per market, or £49 UK-only, for one user with nobody to converge
  with.** Phases 2 to 4 are unbuilt, and §13 puts 100% of the value there.

The recommendation recorded in `docs/plan.md` on 15 August — Stage 0 now,
showtimes after the product exists — is therefore the position again, and the ⚠
noting that it had been argued and not taken can rest.

### Stage 0 is resolved as **no label**

`docs/plan.md` offered three: *New releases*, *Just released*, or no label.
Directed: no label. The wall carries no caption at all, which is what it was until
14 August.

**That is the cheapest correct answer and it is not a retreat.** The label created
the fault — until it existed the wall made no checkable claim and nobody could
catch it being wrong. Take the words away and the posters are a capture prompt
again. **A prompt cannot be wrong; a statement about the world can.**

⚠ **It also saves the second red, which relabelling would have quietly spent.**
`--color-live` was argued as marking *the half that is on now* — a fact about
screens. Under *New releases* it would have been colouring a release date, which
is not a fact worth a colour under §11's one-signal-one-fact rule, and the token
would have been re-purposed rather than kept. Switched off, its argument survives
intact: when showtimes are bought, *In cinemas* is true again and the red means
what it always meant.

### Switched off as live code, not commented out

Directed: keep everything, comment it out. Offered two spellings and the second
was taken —

- **(a) Comment the JSX and CSS out in place.** Easy to read, and it rots:
  commented code is not type-checked, not linted, and drifts with everything
  around it until the day somebody uncomments it and it does not work.
- **(b) Keep it as live code and stop rendering it.** One annotated constant,
  `CAPTION`, in `components/cinema-wall.tsx`. The band, the observer, the haptic
  and the blink all hang off it; the two halves do not, and still ship.

> **A feature that is waiting should stay in the checker's sight. A feature that
> is commented out is a promise nobody is keeping.**

⚠ **`const CAPTION: boolean = false`, and the annotation is load-bearing.** As a
bare literal the compiler narrows it and treats everything behind it as
unreachable, which is the same rot in a different spelling. Annotated, both
branches stay live: the JSX is type-checked, the classes are still scanned by
Tailwind, and turning it back on is that one word.

**What that costs, stated so nobody is surprised by it:** the band's rules are
still emitted into the stylesheet, unused, and `data-masthead` is still written
onto `#scroll-root` with nothing reading it. Both are the price of the restoration
being one line, and both are small.

**This project already keeps things this way and has been repaid for it.**
`--color-caret` was measured, argued, reverted within the hour and left defined;
`--font-ojuju` outlived its own replacement and was wanted back four days later.
The tokens the caption owns — `--color-live`, `--wordmark-drop`, `--blur-band`,
`--animate-caption`, `--animate-band` — stay defined for the same reason.

### The heading went with the words

⚠ `/`'s `sr-only` `<h1>` read *In cinemas and coming soon*. Removing a sentence
from the screen while leaving it in the accessibility tree is **hiding the claim
rather than dropping it**, and it is the same claim TMDB cannot support. It reads
*New releases and coming soon* now: the first half is TMDB's recent-release window
for the viewer's country and the second is dated but unreleased, both of which are
release-date facts.

That the visible surface says nothing and the heading says something is not an
inconsistency. A page needs one meaningful heading, and the wall needs no caption
to be a wall.

**Two halves are kept**, directed. They exist because a label had to change
between them, so with no label they are ordering rather than structure — and they
are the structure the caption returns into. `inCinemas` is untouched.

### What would change this

Paying for showtime data, which is the stated intent. When that happens, the
conditions in *What Again is for* still hold and are not re-opened by this entry:
only against a want already held, shared with someone who already tracks you back,
provenance on every screening, an honest coverage line, and **no booking link.**

**Verified in a browser** at 390×780, signed in, against the real listing: no
caption in the DOM at rest or after scrolling, both grids present, 303 posters, the
first poster's top at 49.75 against `main`'s 49.76 of padding — so the wall begins
exactly where content begins on every other screen and nothing was left behind by
the element that used to pull itself up over it. No console errors. Typecheck, lint
and a production build are clean.

---

## Phase 2: the other person — 17 August

Tracks, `/u/[handle]`, copying, and the identity question that had to be settled
before the route existed. §13 calls the multiplayer half 80% of the work and 100%
of the value; this is the first of it.

### Names for people who know you, handles for everyone else

One function, `nameFor` in `lib/domain.ts`. A mutual track shows the display
name; everything else shows `@handle`.

**Knowing someone is a mutual track**, which is the whole reason this needed no
new object: the condition was already in the schema because §6 requires it for
overlap. The identity rule is a *read* of a relation that had to exist anyway, so
it does not wait on groups (see *Groups* above, where the identity half is
explicitly separated from the group question).

It returns the handle **with its `@`**, so no call site decides whether to add
one. A caller that branches on `mutual` itself is a second copy of the rule and
will drift from it — which is also why `listMyTracks` computes `mutual` in the
data layer rather than handing callers two booleans.

⚠ **Inbound-only is deliberately not announced.** Somebody tracking you with no
track back sees the same page a stranger does, and the control still reads
*Track*. Announcing it would be a follower notification — the §2 shape this
design avoids — and it would publish a one-sided interest the other person never
chose to make visible. The value is not lost: pressing *Track* is exactly the
moment the pair becomes mutual, which is what the notification would have been
prompting.

### The app was asking for a name twice, and the wrong one won

Found by driving the rule against real rows, not by reading it: `nameFor` fell
back to `@collateralflora` for the only real account, because
`profiles.display_name` was null.

Sign-up collects a name into Better Auth's `user.name`
(`components/sign-in-form.tsx`). Onboarding then collects an **optional**
`profiles.display_name`. §5's rule reads the second one, so anyone who typed
their name at sign-up and skipped the optional field was shown to their friends
as a handle. **The rule never fired for the account that had already given its
name.**

`createProfile` now falls back to `user.name` when the optional field is blank,
and the optional field survives as an override — the name you go by is not always
the name on the account.

⚠ **The fallback has to refuse an address.** Sign-up does `name: name || email`,
so `user.name` can *be* the account's email. Seeding a display name from it
unchecked would have put people's email addresses in front of their friends,
which is worse than having no name. `usableAsDisplayName` rejects anything
containing `@` — which covers that case by construction rather than by comparing
against one particular address, and is right on its own terms, since `@` is how
this app writes a handle.

The existing row was backfilled on both databases, rehearsed on `development`
first, with assertions that nobody who already had a name could lose or change
one and that nothing could end up holding an address.

### Overlap's second trigger, and what it cost to find

The carry-forward item, open since §6 was first read: the fan-out ran on entry
insert and on state change, so two people who already held matching wants and
*then* tracked each other produced nothing. No entry moved. That is §13's
seed-time case exactly — a dozen friends joining in a week and backfilling their
lists before the graph is complete — so **the case it missed was the app's first
impression.**

`runOverlapForNewMutual` is a second **caller** of `lib/overlap.ts`, not a second
copy of it: same `classify`, same writer, scoped to the one pair, and still one
set-based statement (`entries` joined to itself on `item_id`).

It fires only on the transition into mutuality, and `onConflictDoNothing` on the
composite primary key is what decides that — a constraint rather than a check
someone has to remember. An already-mutual pair pressing *Track* again cannot
reach it.

`writeNotifications` came out of this. Both entry points go through it, and it
takes **the item per match rather than per batch** — which is what lets the pair
fan-out stay one INSERT while spanning many items. A writer that assumed one item
would have forced a query per item, the exact per-row shape §6 rules out.

⚠ **The burst is uncapped, and that is a decision with a date on it.** Two people
with forty items in common produce forty matches each at the moment they connect.
While notifications are in-app that is the *value* of connecting arriving at once
— the app has nowhere else to say it. It stops being obviously right when push
exists, and `docs/plan.md` carries it into Phase 5, where the worker is written.

⚠ **Untracking and re-tracking legitimately fires again**, because mutuality is
genuinely re-established. The durable answer is remembering what has already been
said, which is Phase 3's problem; the interim guard is `LIMITS.track`, a bucket of
its own because tracking is the only mutation whose cost lands on somebody else.

### Untracking deletes its row, and §5 is not violated

*Nothing is ever deleted* is a rule about **entries**: resolving one changes its
state because having wanted something remains true, and the history is the point.

A track is not a record of an event. It is a live statement about who may see your
list, and a statement you cannot withdraw is not a statement. There is also no
state a withdrawn track could sit in that would not amount to *a list of people
you stopped following*, which is a worse thing to keep than the row.

No fan-out on the way out. §6 fires on convergence, never on its loss, and should
not gain a notification for a match going away.

### Their page is visible without tracking

A stranger who knows the handle sees the same two lists a mutual does. §5 makes
`done` the private state and nothing else, and **§6's suppression rule is the
proof this is intended** — it exists precisely because browsing someone's page
and copying off it is expected behaviour. If the page needed permission, that
rule would have nothing to suppress.

What a track changes is overlap and naming, not access.

`state = 'done'` never appears there, and the page does not filter for it:
`listEntriesForOtherUser` does, unconditionally, and `PublicView` cannot express
the archive. The guarantee stays one layer down, because a regression would not be
visible on the page.

### Copying always lands as a want

`copyEntry` takes **the entry id the caller was already shown**, never an item id,
so a client cannot name a row it was never given. Three properties fall out of
that shape rather than out of instructions:

- **A `done` entry cannot be copied** — the same unconditional exclusion as the
  list, spelled again because this is a second door onto the same rows. It answers
  `not_found` rather than `forbidden`, deliberately: *that exists but is private*
  is itself the leak.
- **It always lands as `want`.** Copying someone's fixture must not assert that
  you own the thing, and copying a go-back-to must not claim you have been. The
  intent carries over; the state does not.
- **`sourceUserId` is read from the row, never taken from the caller**, because it
  is the input to §6's suppression rule. A caller that could name its own source
  could switch suppression off — which would turn copying somebody's list into a
  way of pinging them.

The button says *Add to wants* rather than *Copy*: what happens is that it joins
your wants, and the copying is an implementation detail only §6 cares about. The
idempotent path reports *Already in your wants*, because a button that silently
does nothing reads as broken.

### `PersonRow` is not `EntryRow` with a flag

The two rows differ by which actions they may offer, and that is exactly the
difference §5 cares about. A public row must be **structurally incapable** of
rendering *Seen it*, and the way to guarantee that is for the component not to
import the action at all.

A shared row with a `mine` prop would put the owner's resolve flow one boolean
away from a page it must never appear on, and that boolean would be passed by a
page whose author had forgotten why it mattered. The type ratio, the hairline and
the poster reveal are shared — by being the same classes, not the same component.

### A way in, or the route does not exist

`/u/[handle]` was unreachable: §2 rules out discovery and search for strangers, so
the only route to a person is a handle someone gave you. `TrackedPeople` on
`/profile` is a list of people you have already reached, not a directory.

It sits **above** the identity block, because that block is anchored to the
bottom-left corner at every width on purpose.

⚠ **Whether a track is mutual is legible there without being labelled**: `nameFor`
shows a name for a mutual and `@handle` for everyone else, so a row wearing a
handle is a track that has not been returned. That is the identity rule doing the
work rather than a badge repeating it — and the reason not to add a *mutual* tag,
which would state the same fact twice and give the weaker version its own weight.

### Verified through the product, 37 assertions

Driven in a real browser at 390×780 against the `development` branch — the real
button, the real Server Action, the real data layer — with the assertions about
what was *written* read straight out of the database. That combination is the
point: a screen that looks right says nothing about whether the fan-out wrote
anything.

The relationship was walked through all three states, stranger → tracking →
mutual → stranger again, and the naming followed it in both directions. All six
notifications appeared on the transition into mutuality, and the three cases that
must produce **silence** did: the pair sharing only an intent, the resolved `done`
entry, and the entry copied off the other person.

⚠ **Two things this did not cover**, both recorded in `docs/plan.md`: a *populated*
Fixtures section on somebody's page (the account under test holds none, and an
empty section renders nothing by design), and any of it on hardware.

⚠ **Three lessons from the probe itself**, all of which cost time:

1. **The shell's masthead is a `<header>` too**, so `header button` matched the
   search glyph and the probe waited twenty seconds for a label that was never
   coming. Scope into `main`.
2. **Never index into a list that the thing under test mutates.** Adding replaces
   that row's button with a report, so every later index shifts by one — an
   earlier run clicked `nth(1)` after the first add and silently exercised a
   different film. Address rows by title.
3. **Assert a 404 on the status, not the words.** Next's own error page reads
   empty via `innerText` before hydration; the status is the contract.

⚠ **TMDB is unreachable from this machine again** —
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`, TLS interception on the local network — so `/`
wedges in development and the probe signs in over the API and injects the cookie
rather than driving the form. The note in the memory file saying TMDB *is*
reachable from the dev server was true on 11 August and is not now. Nothing about
the deployed app is affected.

---

## `/profile`, the private note, and two tests — 17 August

Six commits on `/profile` and one on the note. The reasoning that has to survive:

### The foot stops jumping, and both feet read one number

`/profile` is the only route with the collections bar hidden, so its *Sign out* sat
wherever content ended and the foot of the screen moved as you entered and left.
The bar's geometry is `--collections-inset` and `--collections-row` now, read by
both screens. ⚠ **The inset is the home-indicator band *less a centimetre*** — the
whole band is right in a Safari tab and wrong installed. Measured 0px drift:
21.01px above the foot on a phone, 47.15px above `rail`, which is the rail's own
line.

⚠ **`foot-collections` / `foot-bare` are `@utility` blocks, not arbitrary
properties in a class string.** Two declarations of one custom property at equal
specificity are resolved by stylesheet order, which a class attribute cannot state;
`@variant rail` nested inside `@utility` can.

### The name came off, and the pill went quiet

Nobody needs telling their own name, and the rail carries `@handle` alone — so the
two corners now agree. `display_name` still feeds `nameFor` for people who track
you back, which is the audience it was collected for.

Removing it exposed an outline defect this session had introduced: with People above
and identity pinned to the foot, the handle as `<h1>` gave *h2 then h1*. The page's
`<h1>` is `sr-only` in the page, where it can precede the `<h2>`.

The pill is the **first surface in the app with a fill and no hairline**. Full
strength `bg-surface` was rejected on sight — it is 1.29:1 against black, which is
what a card wants and far too much for grouping two lines of quiet text. `/40`
composites to `#0d0d0c`, about 1.09:1. ⚠ **Use opacity, never a hand-picked
near-black:** a tint of the same charcoal cannot drift out of the palette's warmth.

### Nothing at that screen's edges moves

Handle and *Sign out* are a fixed foot below `rail`; `main` reserves their height
through `--profile-foot`, written as *handle font size + `--collections-row`* rather
than as 56px. Verified across a real scroll — 253px on a phone, 147px on a desk —
mark and identity unmoved at both.

⚠ **Above `rail` the block is hidden, not repositioned.** The rail already carries
the same two things in the same corner, fixed, so this was a duplicate — and it was
the thing scrolling, 184px of travel while the rail's copy held still. The
alternative was a second set of coupled numbers to hold a second copy of what was
already on screen.

⚠ **The masthead never could recede here** — the recede listener returns early on
`!showCollections` and `receded` is stamped with the route it hid on. Nothing was
broken; `mastheadHidden` now states `showCollections` outright so the guarantee is a
property of the masthead rather than a consequence of two things elsewhere.

### The private note, and why the projection changed shape

One nullable column, bounded at 140 by `NOTE_MAX`, written through
`setEntryNote(SessionUser, …)` filtered on `userId` as well as `id`. Empty clears to
`null`, so "no note" has one representation.

⚠ **`listEntriesForOtherUser` no longer selects `entries`.** It selects
`PUBLIC_ENTRY_COLUMNS` by name. `select({ entry: entries })` returns whatever the
table happens to hold, so the day a private column is added it is already in every
public read — nothing fails, nothing looks wrong, and the guarantee is gone. Listing
the public columns means a new private field is excluded **by default rather than by
memory**. Adding one to that object is a decision to publish it.

**Where the note is offered in the UI is still not decided**, and `plan.md` always
said it was the small part. The column, the bound, the mutation and the exclusion
are done and tested.

### A test file, and deliberately not a suite

`npm test` — Vitest, one file, six assertions, three guarantees: another person's
`done` never returned, the note never in a public projection, `getSwap` blind until
both commit.

⚠ **The argument against a real suite still stands.** Every fault that has mattered
in this project was found by driving the app and looking at it, and no unit test
would have caught any of them. What is here is the opposite case — guarantees that
fail with **no symptom**, where a passing build and a screen that looks right are
both consistent with the guarantee being gone.

Three things worth knowing about the setup:

- ⚠ **It writes, and it refuses to run against production** — the same
  `PRODUCTION_DB_HOST` check `preflight` uses.
- ⚠ **`server-only` is not an installed package**; Next resolves it. Vitest aliases
  it to a stub, which removes nothing — the rule exists to stop a *client bundle*
  importing `lib/db/`, and a test process is not one.
- **Fixtures are written with the raw driver**, and `tests/**` is exempt from the
  §3 import ban for that reason: a test that inserted a note *through* the layer
  would be asking the layer whether it agrees with itself. `SessionUser` is cast
  there and nowhere else.

---

## The databases are two — 17 August

The last thing in pre-phase 2, and the only one that could not be retrofitted.

### What was wrong

One Neon database served both jobs. `DATABASE_URL` in `.env.local` and
`DATABASE_URL` in the Vercel project were the same string, and Vercel held it as
**one record targeting Production and Preview together** — a shape that is easy
to miss, because the dashboard lists a variable once and shows the targets in a
column nobody reads. Three consequences:

- `npm run dev` wrote to the database the live site reads.
- Every preview deployment did too.
- `npm run db:migrate` migrated production. There was no rehearsal anywhere.

None of it had cost anything, because there was one user and every row was his.
"Development data" and "real data" were the same rows.

### Why it had to be now rather than during Phase 2

Phase 2's checkpoint is §12's, taken literally: two accounts on two devices
seeing each other correctly. Reaching it means making, breaking and remaking a
track between two accounts, repeatedly — and Phase 2 is also where the two
functions carrying **silent** guarantees arrive, `listEntriesForOtherUser`
excluding `done` and the private `note` staying out of the shared projection.
Those want exercising against rows that can be thrown away, because the whole
property of that class of bug is that nothing looks wrong when it breaks.

And the cost curve only goes one way. Splitting while every row belongs to one
person is an ops task. Splitting after a second person's rows are interleaved
with test rows is a data migration with a judgement call per row.

### The shape

A Neon branch, which is copy-on-write, so a clone of the data costs no storage
and takes seconds:

| | |
|---|---|
| `production` (default branch) | the live site. Untouched |
| `development` (`br-lingering-union-zasig3cn`) | this machine **and** preview deployments |

No code changed. `lib/db/client.ts` reads one variable and does not care which
database answers, which is the property that made this an hour rather than a
refactor.

The branch came up as a true copy — 13 tables, all three migrations in
`drizzle.__drizzle_migrations`, and the real data — so `npm run dev` works on
the first run with a real signed-in account rather than an empty schema. That is
also the argument for branching **with** data rather than taking a schema-only
branch: a migration rehearsed against an empty database does not rehearse the
half that goes wrong, which is the backfill.

⚠ **Preview points at `development`, not at a third database.** A preview is a
rehearsal, and giving it its own database would mean a third migration target
and a third set of accounts for no gain. The rule it enforces is the one that
matters: **nothing but production writes to production.**

### Two hazards worth knowing about

⚠ **`vercel env pull` overwrites `.env.local`** and would silently undo the
repoint. The file already carries a `# Created by Vercel CLI` line, so it has
been pulled at least once. Do not run it. Recover the development string with

```
npx neonctl connection-string development --project-id crimson-paper-70987817 --pooled
```

which is why the branch is named in this file and the string is not.

⚠ **Vercel cannot narrow a record's targets in place.** Splitting one record
into two is remove-then-add-twice, so there is a window with no `DATABASE_URL`
on the project. It is harmless — environment variables bind when a deployment is
built, so the running site keeps the value it already has — and production was
re-added with the identical string, so even an immediate redeploy is a no-op.

### The test accounts are gone from production

Production held five users: one real, and four left by test harnesses — a
`reset-test-…@example.com` from proving password reset on 7 August, and three
`probe-…@example.com` from the browser-driven sessions on 11 August, one of them
with 114 sessions behind it. None held an entry and none was the `source_user_id`
of anyone else's, so removing them changed nothing but their own graph: −4 users,
−4 accounts, −117 sessions, −1 profile, with **entries 22 → 22 and items 23 → 23**.

⚠ **This is not a hole in §5.** *Nothing is ever deleted* is a rule about the
product — resolving an entry changes its state, it never removes the row, and
there is no delete action anywhere in the UI. It says nothing about fixtures left
behind by a test harness, and leaving them would have meant a stranger's first
sight of Again being a database with four fake people in it.

Done in one transaction with the survivor's id, handle and entry counts asserted
before and after, and `items` asserted unchanged because they are shared TMDB
rows rather than anyone's data. **Rehearsed on `development` first, which is the
first thing the split paid for** — the numbers above were read off the copy
before production was touched.

⚠ **The stored probe credential is dead.** `probe-msove4za@example.com` was the
account previous sessions were told to reuse rather than making more. It is gone
from both databases, and that is the right end state: probe accounts belong on
`development`, where making one costs nothing. A future probe signs itself up.

### What is still not split

`BETTER_AUTH_SECRET`, Upstash and Resend are one instance each across both
environments. None of them stores rows that belong to a person — a shared rate
limiter is one counter, and the same auth secret across environments only means a
session cookie would validate in either. Revisit if a second person ever holds a
session.

---

## The film screen, and a fifth colour — 17 August

Directed, with a layout: tapping a poster opens the film — artwork edge to edge
across the top half of the screen, synopsis below it, a `+` on the artwork, and a
luminescent green tick when it is on your list.

It replaces **two** surfaces. The intent sheet asked *see or a copy?* as a modal
over the wall, and the acknowledgement band answered from the foot of the screen
a second later. Neither exists now.

### Why it is better, in one sentence

The sheet asked which want you meant before saying what the film was, and the
moment that matters is a poster on the wall you do not recognise. The screen
answers *what is this* first and makes the add a control on the answer.

That also retires the band: there is no longer a moment where something has been
added and the thing you added is not in front of you, which is the gap the band
was covering. §5.1's ten seconds survive as the tick itself — while the window is
open the mark is the way back out, and after it the mark is a state rather than a
control. A button that silently stopped working would be worse than one that was
never a button.

### The colour, and the terms it arrives on

`--color-listed` is the **fifth** meaningful colour in a palette whose whole
argument was that it had two. The terms matter more than the value:

- **It marks a state, not an event.** `listMyEntriesForExternalId` asks before you
  touch anything, so a film added last month opens green. A colour that only
  appeared for a second after a tap would be a flourish, and §11 does not spend
  colours on flourishes. This was the condition the colour was agreed under.
- ⚠ **It is not the tick in `entry-row.tsx`, and that was the original plan.**
  Proposed as "one green for both ticks", and wrong on inspection: that tick marks
  a want that has been *satisfied* — watched — which is a different claim from
  *listed*. Everything in a list is on the list. Tinting both would have given
  green two meanings on its first day, which is how a palette stops meaning
  anything.
- ⚠ **Quieter than the accent, measured: 6.0:1 against the ground, against amber's
  7.7:1.** Amber marks overlap, the one moment the product exists for; adding a
  film is the most routine thing anybody does here. If the routine action were the
  brightest thing on the screen the important one would stop being where the eye
  goes. Any change to the value has to keep that gap — green also has the hue
  advantage, peaking near 555nm, so parity in contrast would already read louder.

### What it costs against §2

⚠ **It is a step past "images beyond poster thumbnails".** The home wall took the
first step and this is the second, taken deliberately rather than discovered
later. What it does *not* do is add a second **kind** of image: this is the
poster, cropped, not the backdrop still the reference layout used. One image type
in the app, at three sizes, all from TMDB's CDN and never proxied (§10).

Also refused, and worth naming because the reference layout leads with it: **no
rating, no score, no stars.** The metadata line is director, year, runtime — the
three things that decide whether you want a film tonight.

### Both intents survive

Intent is a property of the entry (§4), and a `+` alone would have collapsed it to
whichever default it happened to carry. The primary is the circle on the artwork;
*Want a copy* is a quiet control under the synopsis. That is §8's shape — one
prominent action, the rarer one beneath it — and it is the only part of the sheet
worth keeping.

### Two things that would have shipped broken

- **`next/image`'s `fill` renders its positioning as a `style` attribute**, and
  the CSP drops style attributes in production while `next dev` allows them. It
  would have laid out perfectly in development and collapsed on the deployed site
  — the same divergence that cost a masthead and a wordmark on 10 August. Explicit
  `width`/`height` with classes doing the layout.
- **The controls were `black/50` and the green measured 1.7:1 over a bright
  poster** — invisible on exactly the films most likely to have one. At 80% it is
  4.0:1 and the plus is 11:1. No `backdrop-blur` on them either: a blur clipped to
  a rounded border is the combination WebKit has a history of rendering wrong, and
  these are buttons rather than glass.

### Haptics: wanted, and not possible on iOS today

Directed on 17 August — a light haptic when a film is added — and then, the same
afternoon, **removed**: it was never felt on the handset.

**Android has it and keeps it.** `navigator.vibrate(10)` in `lib/haptics.ts`,
called as the first statement in the `+`'s handler. Ten milliseconds is the
conventional light tap; longer is a buzz, and a buzz for an add is the phone
asking to be noticed rather than answering.

**iOS Safari implements no Vibration API on any version** — not behind a prefix,
not behind a permission. That is the whole of the problem and nothing in the app
can route around it.

**What was tried, so nobody tries it twice.** Safari 17.4 added the `switch`
attribute for checkboxes, and toggling one through its label is widely reported to
play the system's own light haptic. It was built as a hidden pair mounted once for
the app and clicked from the tap handler. Two variants:

1. Hidden with `sr-only` — a 1px box clipped with `clip-path: inset(50%)`.
2. Hidden with `opacity: 0` on a real 44px box, laid out and painted, on the
   theory that the haptic rides the switch's *animation* and an engine may skip
   animating something clipped out of existence.

Neither produced anything perceptible. **The call was never in doubt** — it is the
first statement in the handler, before any state change — so the failure is
downstream of the app in every version.

⚠ **Deleted rather than left in place, and that is the part to keep.** A mechanism
that does nothing is worse than no mechanism: it reads as a working feature to
whoever finds it next, it costs a hidden interactive element in every signed-in
page, and it makes the *absence* of haptics look like a bug in this code rather
than a gap in the platform. The want does not go with it — it is open in
`docs/plan.md`.

**What would reopen it:** Safari shipping the Vibration API, or a specified web
haptics API, or a first-hand demonstration that the checkbox trick works in a PWA
context this project can reproduce. Two things outside the app produce the same
symptom and were never ruled out from here — System Haptics being off in Settings,
and Low Power Mode — so a future attempt should start by confirming a haptic on
*any* web page on the device before touching this code.

### ⚠ Open: should there be a synopsis at all?

Raised 17 August, as a question rather than a change. **It is not settled and
nothing below is a decision.**

**What it is doing there.** The screen exists to answer *what is this* for a
poster on the wall you do not recognise, and title, director, year and runtime may
not answer it for an unfamiliar film. That is the whole case, and it is a real
one.

**What is uncomfortable about it.**

- §2's closing test is *if a feature request makes the app more useful to a
  stranger, it is probably wrong* — and **a synopsis is the most stranger-facing
  thing on any screen in this product.** It is precisely what you need if you know
  nothing about the film and precisely what you skip if a friend has already told
  you about it, which is the case this app is built around.
- It is the most catalogue-like element in an app that is deliberately not a
  catalogue. Every listings product leads with it.
- §11 says type is the entire design, and this is the only place where the type on
  screen is **somebody else's prose** rather than the app's own words or a
  person's.
- It costs a third of the screen for something read once.

**The question underneath the question: what is the bottom third for?** If the
synopsis goes, the honest candidates are:

1. **Nothing** — artwork to the foot, with the title and the `+` over it. The
   screen becomes a poster and an action, which is the smallest thing that answers
   the tap.
2. **Who else has it.** Overlap is the one moment the product exists for, and *two
   people you know want this* is a better reason to add something than a plot
   summary. That is Phase 3 material and does not exist yet — **which raises the
   possibility that the synopsis is standing in the space overlap is meant to
   occupy**, and that the right time to answer this is when there is something to
   put there.
3. **The private note**, which has a column, a bound, a mutation and a test, and
   still has nowhere in the UI to be offered.

⚠ **Do not resolve this by deleting the synopsis and leaving a gap.** The question
is what the bottom third is for; removing its current occupant without answering
that is how a screen ends up with a third of itself unaccounted for.

### The synopsis is fetched, never stored

`/api/film/[id]` answers both halves in one round trip — what the film is, from
TMDB, and whether it is already yours, from `lib/db/`. Two requests would mean a
`+` that lies for as long as the second one takes.

The synopsis and runtime are not written to `items`. §5's schema is a canonical
row for a real thing, not a copy of somebody's catalogue; a stored synopsis goes
stale and the app then has to decide whether to trust it.

⚠ `Cache-Control: private` is load-bearing here rather than cautious. `/api/search`
says private because the request is authenticated even though the answer is the
same for everyone; **half of this answer is one person's own list.**

### Unseen on hardware

Built and deployed the same afternoon it was asked for. Nothing in it has been
looked at on a phone.

---

## Third-party dependencies

### Where TMDB actually sits

`items` is *our* table. Title, year, poster path and director are copied into
Postgres at add time; TMDB's id is stored as a string. Overlap — the thing the
app exists for — is a join between `entries`, `tracks` and `items`, all local.
TMDB appears nowhere in `lib/overlap.ts` and cannot, because that query never
leaves the database.

If TMDB went dark: every entry, go-back-to, fixture, return count, convergence,
swap and notification keeps working. Posters break, since they are hotlinked.
**The only thing that stops is adding films not already in the table.**

This is a property of §5's design. The version of this app that *is* critically
dependent is the one that stores a TMDB id and fetches titles at render time.

### The rest, ranked

- **Neon** — looks like the biggest exposure, is among the smallest. Plain
  Postgres, no extensions, standard Drizzle migrations. `pg_dump` walks out the
  door. Neon-specific code is `lib/db/client.ts` and `drizzle.config.ts`.
- **Better Auth** — owns four tables *in your database*, sessions in Postgres.
  If the project were abandoned you would still hold every user, credential hash
  and session. Contrast Clerk or Auth0, where users live in someone else's
  system and leaving is a migration you do not fully control.
- **Vercel** — moderate. Next.js runs anywhere Node runs, and image optimization
  is already off.
- **Web Push** — a W3C standard, not a vendor.
- **Upstash** — rate limiting only.

The asset that cannot be replaced is the entries-and-tracks graph, and it
depends on nothing but Postgres.

### What not to build

- **A film-provider abstraction layer.** Speculative generality. The insurance
  is the schema, not the code: `external_source` costs one column and makes a
  migration mechanical. An interface hierarchy costs ongoing complexity and buys
  nothing the column does not.
- **Mirroring poster images.** Violates §3's never-proxy rule, turns on an
  egress bill, and protects decoration in a design where §11 says type is the
  entire design.
- **Defensive metadata caching beyond §10.** Already required, already planned
  for Phase 1, already doubles as outage resilience.

### When to revisit

Triggers, so this is not a standing worry:

| Trigger | What to do |
|---|---|
| Books get added (§2's second kind) | Nothing — `external_source` starts earning immediately |
| TMDB changes free-tier terms or rate limits | Cost out an alternative; the column means you can |
| Again starts earning money | Commercial TMDB licence. No public pricing; contact `sales@themoviedb.org` with your country. A third-party figure of ~$149/mo under $1M revenue circulates but is not TMDB-published |
| Neon's free tier stops fitting | `pg_dump`, restore elsewhere, change one file |
| A provider migration actually happens | Revisit the `(kind, external_id)` unique constraint *and* decide deduplication at the same time |

### Licence obligations on the free TMDB key

Attribution is required and not yet implemented — belongs in `/settings`:

> This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
> otherwise approved by TMDB.

Plus their logo, displayed less prominently than your own branding. It is a
licence condition, not a feature, so it does not collide with §2's ban on
imagery beyond poster thumbnails.

Incidentally, §2 ruling out streaming availability also avoids TMDB's
watch-provider data, which carries separate JustWatch attribution requirements.
A licence surface avoided as a side effect of a product decision.

---

## Verified, versus assumed

Phase 0 was checked against the live Neon database, not just compiled:

- All twelve tables, the three §6 indexes, and the `(user_id, item_id, intent)`
  unique constraint
- Duplicate entry under one intent rejected; the same item under a *second*
  intent allowed, so the two wants stay independent — the property the
  dual-intent architecture exists to prove
- Sign-up creates a uuid user, persists the session to Postgres, and stores a
  hashed credential account

Phase 1 was checked through a temporary route handler driving the real
data-access layer in the real Next runtime — 21 assertions, all passing.
Browser tooling was unavailable, so the React layer is **not** verified; the
harness covered everything behind it:

- `upsertItem` idempotent; `addEntry` twice is a no-op, not a second row
- The same item under a second intent is allowed, so the two wants stay
  independent — the property the dual-intent architecture exists to prove
- *Seen it → Go back? Yes* lands `go_back_to` with `return_count` 1; *Been back
  again* increments; a second resolve is rejected
- *Got it → Keeping it? Yes* lands `fixture` with no return count
- A go-back-to appears in live (§5.2) and a fixture does not (§5)
- *Go back? No* lands `done`, which is absent from live and present in the
  owner's archive (§5.3)
- The undo window deletes; `toEntryCard` exposes no `user_id`

Password reset was checked end to end against the running dev server and the
live database, driving the real HTTP endpoints rather than the library:

- Requesting a reset returns the same body for a registered and an unregistered
  address
- The token is stored with a one-hour expiry, matching
  `resetPasswordTokenExpiresIn`
- Better Auth's callback validates the token and redirects to
  `/reset-password?token=…`
- Setting the new password succeeds; the **same token is refused on replay**
- The **old password is refused** afterwards and the new one is accepted
- `LIMITS.auth` returns 429 on the eleventh request in the window

The React layer has since been driven end to end in a real browser (Edge, via
`playwright-core`): sign-up, onboarding, the capture box, TMDB search, the intent
sheet, optimistic add, undo, the resolve flow, return counts and the `/me` tabs.
No console errors, no overflow at 320px, no stray use of the accent.

That run found the one bug nothing else could have: the intent sheet rendered
behind the search dropdown and could not be clicked, so nothing could be added
at all. Typecheck, lint, build and all 21 server assertions passed throughout.
Fixed in `a4bd90b` — **a passing data layer says nothing about whether the
product works.**

**All three of the things that paragraph used to end on have since happened**, and
they are kept here as the shape of the gap rather than as the gap itself: there
was no deployment (there is one, from 8 August, in `lhr1` beside Neon in
`eu-west-2`), there was no account (there is, and the signed-in app has been
judged repeatedly since), and nothing had run on hardware (it has, and the
handset has produced findings on 8, 11, 13 and 14 August that nothing else
could).

What is still unverified is smaller and more specific, and it is listed in
`docs/plan.md` rather than duplicated here. The standing lesson is the one this
section exists for:

> A passing data layer says nothing about whether the product works, and a
> passing build says nothing about whether a screen does. Every fault that
> mattered in this project was found by looking at it.

### Looking at it means looking at the build you actually made — 18 August

**An installed web app on iOS does not reload.** It keeps its document alive
across switching away, and standalone has no address bar to reload from, so a
home-screen Again keeps running whatever JavaScript it launched with until it is
force-quit from the app switcher.

That cost an afternoon. The scrollbar over the artwork was diagnosed, fixed and
deployed, and came back reported *still there* — from an app that had never
picked the fix up. A probe was designed, built, shipped and reverted on the
strength of that report. The same build in a Safari tab, which fetches fresh
every time, was right on the first look.

> **Force-quit the installed app before trusting a negative result from it**, and
> when a fix looks dead, open the same URL in a tab before touching the code. If
> the tab is right and the app is wrong, suspect the bundle. It is the same
> mistake as a guard beside a cure: something that looks exactly like the code
> being wrong, and is not.

Two smaller versions of the same trap, both met the same day. Production tracks
`main`, so a fix pushed to a branch is on a preview URL and not on the bookmark
anyone actually opens. And a report is worth naming its surface — *installed*,
*tab*, *Android*, *desk* — because the answer to "which of the four is this on"
turned out to be the whole of this one.

Re-verify with:

```
npm run typecheck && npm run lint && npm run build
```

## Three surfaces, two rules: what the desk and the tablet get — 18 August

Asked, before the last parked report was closed: give due consideration to the
different versions' needs — the installed app, and the wider landings on tablets,
laptops and desktops — and treat them differently.

**The answer is not three designs.** Two layouts that can drift are two places for
the same bug, and this project has been caught by that twice in a week (the CSP
divergence between `next dev` and production; the installed app running a
different bundle from the tab). What was actually wrong was subtler:

> **The app branched on width and used it as a proxy for what kind of thing it was
> running on.** On a tablet that proxy breaks — `--breakpoint-rail` catches every
> tablet in portrait, so a tablet was getting the desk's *layout* by accident of
> being 744px wide.

So there are two rules, and everything falls out of them:

- **Room follows width.** Columns, the reading measure, the rail, and whether a
  screen can stand beside the page or has to cover it.
- **Controls follow pointer.** Hit areas, hover, and anything about a finger.

**The tablet decision, made under those rules and naming no device:** a tablet is
a touch device with a desk's amount of room. It keeps the rail, keeps 44px
targets, and its posture decides itself — portrait falls below `--breakpoint-pane`
and takes the takeover, landscape falls above it and takes the panel. This holds
for any tablet, which matters more for Android than for iPad: those run from about
7" to 13", so a device assumption would have had to guess and a column measurement
does not.

⚠ **An audit of the pointer axis found it already right, and the case made for
changing it was built on a bad example.** `hover:` is framework-gated by Tailwind
into `@media (hover: hover)`, `tap-target` is already `@media (pointer: coarse)`,
and the handful of `pointer-coarse:` uses are doing their job. **No width query was
standing in for an input question.** The claim is recorded here because it was
made confidently and was wrong, and the next person to reach for that work should
know it has been looked at.

**What was actually wrong on both the desk and the tablet was one thing: the
takeover.** A 448px card blacking out a 1440px screen. That is `--breakpoint-pane`
and the panel, and the reasoning is in `film-screen.tsx`.

### Local development works again, and it is worth knowing how

TMDB is blocked on this network — not TLS interception this time but a 451 block
page for the host, so the dev server had no films and every screen that mattered
was empty locally. That is why the film screen had a bug nobody could see: React's
development double-invoke made it impossible to open, and the only way to reach it
was a handset running a production build.

The unblock is a Node-level stub of `globalThis.fetch` for `api.themoviedb.org`,
preloaded with `NODE_OPTIONS=--require`, living in `node_modules/.probe` so it
cannot be committed and no application code knows it exists. With it, the whole
app drives in a real browser at any width. **Both of this session's layout
findings — the panel's geometry and the 82px posters just above `rail` — came from
measuring in that browser, not from reading the code.**

⚠ Two traps met while building it, both of which will recur. A preloaded module
must print nothing: npm shells out to `node -p` and parses the output, so one
banner line breaks `npm run` itself. And every click on a server-rendered control
must be retried until it takes effect — the button exists and is "actionable"
before React has hydrated it, and a click inside that window does nothing at all,
silently.

## A stamp is mono, and §11 does not name that use — 18 August

*Synopsis* on the film screen was `micro`: small, capitals, a little tracking —
the same label register as every other small heading in the app. Directed:
set it as a **stamp**.

The `stamp` utility in `globals.css` is mono, wider tracking and one step of
weight. All three do work. Mono alone reads as a filename, tracking alone reads
as a fashion caption, and weight alone just reads as a heavier label; together
they read as something pressed onto the page rather than typeset on it.

**The call this records: §11 reserves IBM Plex Mono for return counts and
timestamps — for data — and a section heading is not data.** The extension is
made deliberately and on one argument: mono's other quality is *impression*.
Even widths and blunt terminals are what a rubber stamp has, and nothing in the
sans does that. The alternative was a fourth typeface for a single word, which
§11 would like considerably less than this, and which would have to be loaded,
subset and paid for on every route to serve eight characters.

It is scoped to one utility rather than applied as a class list, so the day
this is regretted it is one block to delete and one class to change back. If a
second thing ever wants to be stamped, it wears `stamp` — and if a third does,
the question stops being about a heading and becomes a real change to §11.

⚠ The trap it comes with: letter-spacing puts space after the **last** letter
too, so a stamp's box is 0.22em wider than its ink on the right. Left-aligned
to a gutter that is invisible. Centred, it will sit visibly off to the left.

Two smaller calls made in the same pass, neither of which needed a decision but
both of which have a reason worth keeping:

- **The heading belongs to the synopsis, not to the screen.** A film TMDB has no
  write-up for used to get *Synopsis* over the words *No synopsis for this one*
  — a heading introducing its own absence. Both are gone; it is the title, the
  credit line, and then black. Nothing shows while the answer is still unknown
  either, which is the rule the `+` already follows.
- **Only the two states that are buttons get a hover.** `CONTROL` is also the
  settled tick and the empty box for *not yet known*; lifting those under a
  cursor would promise a press that does nothing. `hover:` is not a desktop
  branch — Tailwind wraps it in `(hover: hover)`, verified in the compiled
  stylesheet — so a finger cannot leave a control stuck lit.

## The film screen asks what is pointing at it, not how wide the window is — 18 August

**The complaint that produced this: everything built for the phone was arriving
in a maximally narrowed desk window.** The glass panel, the chevron, the
full-screen poster and the mono synopsis were all asked for as *the phone
experience*, and a narrow window was getting all four — because a narrow window
and a phone were the same thing to `film-screen.tsx`. It had one signal,
`--breakpoint-pane`, and used it for two different questions.

⚠ **This section was written with the wrong answer and is corrected below. Both
wrong versions are kept, because the shape of the mistake is the same each time
and it is the useful part.**

There are two questions, and they are answered by different signals:

- **Shape decides the ARRANGEMENT.** `overlay` is *is this a tall narrow screen
  where a poster nearly fills the width, so the words have nowhere to go but over
  it.* The glass panel, the chevron, the full-screen picture and the recede are a
  response to that, and **a maximally narrowed desk window has exactly that
  shape** — so it gets them. `overlay` is `!pane`: a width.
- **The pointer decides the TYPOGRAPHY.** `touch` is *is this being handled with a
  thumb.* The mono synopsis was asked for on the phone and the printing on the
  desk, and neither is a fact about how tall a window is. `(pointer: coarse)`.
- **`pane` — is there room to stand beside the wall?** Unchanged, still
  `--breakpoint-pane`, and it is what `overlay` is derived from.

**The one place the two axes meet is the poster's size.** `original` is asked for
only when `overlay && touch` — a full-screen poster on a 3x handset, ~1170 real
pixels, where `w780` would be an upscale. A narrowed desk window has the same
layout at 1x or 2x and takes `w780`; a large touchscreen at `pane` widths has a
384px column and takes `w780`. Either axis alone would fetch megabytes for a box
that cannot show them.

### Both wrong versions, and why they were wrong the same way

1. **Width decides everything** (before this section existed). The phone's
   typography landed on any narrow desk window — which is the complaint that
   started this.
2. **The pointer decides everything** (the first version of this section). Fixed
   that, and took the *arrangement* away from a narrowed window along with the
   typography: **five things moved when two had been asked for.** The report was
   immediate and exact — a narrowed browser no longer had the presentation it had
   the day before.

**Both are the same error: one signal answering two questions.** That error is
what this file already records under *the film screen's height stopped being a
decision* and under the search dock's three-times-repeated containment bug. When a
rule has to distinguish two things, check whether it is really distinguishing one.

⚠ **`(pointer: coarse)` is a capability query, and that is what makes it
allowed.** *How things get fixed* rules out "branches that sniff for a browser",
and this is the opposite: it does not ask what the device is called, it asks what
the person is pointing with — which is the thing the design actually depends on.
A poster you push out of the way with your thumb is a different object from one
you click past with a cursor. Two other places already ask the same question: the
sign-in page's optical padding and the entry rows' spacing.

⚠ **It stays testable, and better than before.** A browser can be told it has a
coarse pointer — `hasTouch: true, isMobile: true` in Playwright — so the phone's
typography is driven and measured here rather than only on glass. And because the
*arrangement* is a width, **narrowing a window is a real preview of the phone's
layout again**: valid for the chevron and the poster's geometry, not for how the
synopsis reads. `recede.mjs` asserts both halves — a coarse 390×844 that must have
the chevron and mono, and a *fine* 390×844 that must have the chevron and **not**
mono, at `w780`.

⚠ **The edges are real and are accepted.** An iPad with a trackpad reports fine
and gets the stacked layout; a touchscreen laptop reports coarse and gets the
overlay. Neither is wrong for the question being asked — both get what suits what
is in the hand — but it does mean the answer is never "is this a phone", and
nothing downstream should be written as though it were.

**What a narrow desk window gets:** the overlay's layout and the desk's
typography — full-screen poster, glass panel, chevron, and a sans synopsis that
prints. The stacked arrangement (artwork a share of the column, words under it,
*See the poster*) is the panel's alone again.

### The surround: blurred under a cursor, black under a thumb

The question has no third answer — a 2:3 poster and a 0.46 screen are different
shapes, so *whole* and *full-bleed* are mutually exclusive for the picture, and the
chevron exists to make it whole. With the words away there is room left over and
something has to be in it. **The two surfaces are ruled differently, and this is
the only pixel they disagree about:**

- **Under a thumb: black.** The poster centred, gaps split evenly above and below,
  read as deliberately framed. `calc(50% - 75cqw)`.
- **Under a cursor: the same image out of focus.** Cover-scaled, `blur-2xl`, at 70%
  so the sharp one in front stays the subject, so the screen is full.

It went on everywhere first, was rejected, came back, and the resolution is that it
was only ever wrong on the phone. Worth stating plainly, since the code now carries
both and a future reader will otherwise assume one of them is a leftover.

⚠ **`w342`, deliberately** — the size the wall already fetched, so the surround
costs no request at all, and there is no resolution left to see after that blur.

⚠ **`scale-110` is not decoration.** A blur samples past the element's edges, where
there is nothing, so an unscaled copy fades out on all four sides and reads as a
vignette nobody asked for.

⚠ **It has no bearing on the panel's contrast floor.** At rest the sharp poster
covers the screen and the surround is invisible; it is only uncovered once the words
have gone, so nothing is ever read against it.

⚠ **A probe that wants the poster must not take `querySelector('img')`** — the
surround is also an `img` and comes first. Select the one whose computed `filter`
has no blur. Two assertions failed this way the moment it was added back.

⚠ **The stacked branch is still reached by only one condition, and that is worth
keeping.** It is the same JSX for the panel as it ever was; the two axes cost two
booleans and no third layout.

### Mono reaches the synopsis, on one surface

The `stamp` note above records mono arriving on a heading. It then went on the
synopsis body everywhere, and came off the desk within the hour: **the
instruction was to leave it as it is for the phone home app.** So the overlay's
synopsis agrees with the stamp above it and the panel's stays sans.

This is the larger of the two extensions to §11's reservation of mono for return
counts and timestamps — a heading is eight characters, this is the longest run of
prose in the app — and it now applies on exactly one of the three surfaces. The
argument is the stamp's: impression rather than data, against a fourth typeface.

⚠ **`printing` and `mono` are passed to `PrintedSynopsis` separately even though
they are complements today.** The printing was asked for on the desk and the mono
on the phone; folding them into one prop would mean that the day either moves,
both move.

## The type changes: Jost in capitals, Fira Sans under it — 21 August

Two decisions on one day, and only the second one deviates from the brief.

### The mark is Jost, set in AGAIN

Directed after looking at eleven faces set in capitals. Futura's geometry
redrawn: a circular G, a sharp-apex A and one stem width. §11 is silent on the
mark's own face — it governs interface, mono and the accent — so this replaces
Ojuju without extending anything.

**Capitals are the substantive half of it.** The word gains a tracking
requirement it did not have (a lone `I` between an `A` and an `N` disappears set
solid) and loses a descender, and losing the descender is what moved every
number the mark drives: the ink ratio falls 0.92 → 0.775, `--wordmark-drop` goes
to zero because there is no tail for a row to take back, and `--wordmark-slack`
**changes sign** — Ojuju hung the `g` below its own box, capitals stop short of
it.

That sign change is the best evidence the machinery was built right. Three
places consume the slack — the masthead, `/sign-in` and `/reset-password` —
each as `14px − slack`, and none of them branches on the case. The gap under the
mark on the auth pages went from about 17.8px of box to 10.7px, in both
directions, for the same 14px of visible air, with nothing edited at any call
site.

⚠ **The numbers are now fenced with the face they describe.** They were in three
separate places, so "switching the face is one line plus a flag" was true of the
line and false of everything else: a switch moved the family and left seven
measurements describing the previous typeface. There is one block in
`globals.css` now — face, tracking, the three trim numbers and the three ratios —
and the reserve's complete set sits beside it, already measured.

⚠ **Bebas Neue is the reserve, held deliberately** at the user's request, for a
refresh later. `preload: false` keeps it declared and not downloaded. Seven of
its eight numbers are measured; its tracking is a starting point rather than a
reading, and the note says so.

### The interface is Fira Sans, and this one deviates from §11

**§11 names IBM Plex Sans, and this replaces it.** Recorded here because it is a
change to the brief rather than a choice inside it.

Directed: the menus and the collection rows should go with Jost, be readable, and
not get boring or overwhelming. The argument for moving is that **Plex Sans is
engineered in the same rational way Jost is** — two constructed faces next to
each other read as one slightly inconsistent voice rather than as a pairing.
Fira Sans is humanist where Jost is geometric, which is the contrast that was
missing, and it was drawn for small text on screens, which is the only thing this
app asks of it: 11px uppercase labels in the rail, and lists of film titles.

Longevity was the stated criterion and it is why the shortlist ended where it
did. Libre Franklin and Work Sans were the other two considered; Inter is ruled
out by §11 and stays ruled out.

⚠ **The cost lands on the mono, and it is real.** Plex Sans and Plex Mono are one
superfamily — shared skeletons, so a return count sat inside a sentence
invisibly. Plex Mono stays, because §11 names it for counts and timestamps and
nothing asked for it to move, but it is now a *contrast* against the text rather
than a sibling of it. **If that ever reads as a mismatch the answer is Fira
Mono**, which is Fira Sans's actual sibling, and it is one line in
`app/layout.tsx` plus `--font-mono`.

⚠ **Three families is the same count as before**, not one more: Ojuju, Plex Sans
and Plex Mono became Jost, Fira Sans and Plex Mono. Ojuju and Space Grotesk are
deleted rather than left declared — a font nothing points at is a font the next
person reapplies without knowing why it was there.

### What was measured, and how

`node_modules/.probe/metrics.mjs` loads the real self-hosted faces and reads
`TextMetrics`; `mark.mjs` then checks the result on all three surfaces the mark
appears on. Fifteen assertions, production build: the ink is as tall as
`--wordmark-ink` claims, the masthead row is exactly that ink, the letters land
inside it at both ends, the header is `gap + hem + ink + gap` to within a
rounding, and the auth pages' gap resolves to 10.71px.

⚠ **The search field is outside the row again, and it is expected.**
`shell.tsx` says to re-measure this whenever the mark changes: the field's line
box is 24px against a row that is now 21.69px, so it overhangs 1.15px at each
end into 8px of `--masthead-gap`. Nothing clips, and — the thing that actually
matters — **the header measures 45.69px resting and 45.69px with the field
open**, so tapping the field still cannot resize the masthead.

## A want has a third exit — 21 August

**A lapsed want had nowhere to go, and the only door out of one was a lie.**
Asked whether entries should be removable. The answer is no, and the question
turned out to be two questions.

*That's wrong* — the wrong film, a mistapped poster, a row that should never have
existed — is what §5.1's ten-second undo is for, and ten seconds is the whole of
it.

*I've gone off it* — the row was right and the intention has lapsed — had no
exit at all. The only way out was the resolve flow: **Seen it → Go back? → no**,
which files the entry in the archive. Correcting a true change of mind therefore
required making a false statement: you had to claim you watched something you
did not.

⚠ **The argument for changing anything here is not that people want to delete
things.** It is that the absence of an exit was quietly corrupting a state the
app treats as meaningful. The archive is the record of what you actually tried;
if mistakes and lapsed intentions land there too, `done` stops meaning done and
the archive becomes a bin. That is a loss that compounds silently, which is the
kind this project takes seriously.

### What was built: a fourth state, not a delete

`dropped`. §5.1 says resolving changes state and never removes the row, and this
obeys that completely — it is a resolution that happens to be the honest one.
Private like `done`, out of the live pool, out of overlap, out of everyone
else's view.

**The control is an ×, and the row does not leave the list.** It shipped as a
text control reading *Not any more*, then as *Remove*, then as neither: directed
the same afternoon, *make it an x in fact, no 'remove'* — and, before that,
*when removed don't actually delete from the list, dim and put a strikethrough*.
What survives of the naming argument is that nothing is named at all. A crossed-
off row says what it is by being crossed off, which is the one label that cannot
be the wrong word.

⚠ **The strikethrough is not decoration on top of a resolution — it is the
resolution's whole interface**, and three things follow from it that would each
have needed inventing otherwise. There is no confirmation, because nothing
disappears. There is no toast, because the row is the acknowledgement. There is
no undo window, because the way back is the same × in the same place. That last
one is the reason this is the only resolution in the product with no ten-second
clock attached: it does not need one.

**`want` only.** The guard is the same clause `resolveEntry` uses, so the set of
droppable entries is exactly the set of resolvable ones: a want has three exits
and nothing else has any.

⚠ **A go-back-to is deliberately not droppable, and the temptation is real.** You
saw it, you said you would return, you would not now. But you *did* see it, and
dropping it would take that out of the record. The honest destination is `done`,
which already means *tried, and not going back* — getting there needs a resolve
on an already-resolved entry, which is a gap this did not close. **Open**, and
small; see the register in `docs/plan.md`.

### Two ways back, and they are deliberately different

`restoreEntry` is the ×, tapped again: `dropped` → `want`, **`created_at`
untouched**, so the strikethrough lifts and the row does not move. Restoring
something and finding it somewhere else would undo the point of striking it
through in place.

`addEntry` also revives a `dropped` row rather than colliding with it —
`onConflictDoUpdate` with `setWhere: state = 'dropped'`, writing exactly what the
insert would have written, `created_at` included. That path is a want that
*started again* — through the `+`, or through a copy off someone's page — so it
takes a new clock, sorts to the top, and is inside §5.1's undo window. Without it
the unique index on (user, item, intent) would answer *already yours* for a film
sitting crossed off in front of you.

⚠ **`listMyEntriesForExternalId` includes `dropped`, and briefly did not.** While
a crossed-off entry lived in the archive it was fair to call it *not on your list*
and let the film screen offer the `+`. It lives in Wants now, in plain sight, so
the screen saying *not on your list* would contradict the page its own tick points
at. The tick links to Wants, the row is there, and the way back is the × on that
row — one control, in one place.

⚠ **The ten-second undo was left exactly as it was, and an earlier suggestion to
widen it was wrong.** The idea was to bound it by the film screen being open
rather than by a clock. It cannot be: the window is `created_at > now() -
interval` **in SQL**, specifically so the client cannot lie about it, and *the
screen is still open* is a client claim the server cannot check. It also stops
mattering — past ten seconds, overlap has already written notification rows to
other people, and a row that has caused effects elsewhere should change state
rather than vanish. The mistap and the lapsed intention converge on the same
honest exit once the window closes.

### The guarantee this touched, and the shape of the fix

`listEntriesForOtherUser` excluded one state **by name**: `ne(state, 'done')`.
That is correct exactly as long as `done` is the only private state, and adding a
second one made it wrong in the way §13 exists to warn about — nothing throws,
nothing looks broken, and somebody's abandoned wants are on their page.

⚠ **The fix inverts the filter rather than extending it.** `PUBLIC_STATES` in
`lib/domain.ts` lists what may be seen, and both public doors — that function and
`copyEntry`, which carried its own copy of the same clause — filter on it. A
state that is added and not listed there disappears from public views. The
mistake now produces a missing row, which someone reports, instead of a leak,
which nobody sees. §13 gained two cases: the dropped equivalent of the archive
test, and the copy door.

### Where it lives: in Wants, crossed off — and the archive stays one list

**A crossed-off want stays on the page it was on, struck through and dimmed, in
the position it held.** `stateFilter('live')` selects `dropped`; the archive is
one list again.

⚠ **This was built as a second band in `/archive` first, and that version is
gone.** It was the right answer to a question nobody had asked: *where do these
rows go?* The answer is that they do not go anywhere. What the band cost was the
one thing the strikethrough gives for free — being able to see what you crossed
off, next to what you did not, without navigating. Both bands, the `band` prop on
`EntryList`, the fifth `OwnerView` and the `first-of-type` separator that came
with them were all removed the same day. Nothing of it survives except this
paragraph, which is here so it is not rebuilt.

Three things had to move so the row could sit still:

- **`orderFor('live')`'s CASE names `go_back_to`, not `want`.** It was
  `when state = 'want' then 0 else 1`, which put `dropped` in the sinking half —
  crossing something off made it jump down the page and putting it back made it
  jump up. Naming the one state that is *meant* to sink leaves every other row
  where it is.
- **`countMyEntries` counts `dropped` nowhere**, so the rail's *Wants* number is
  deliberately not the number of rows on the Wants page. The rail says how many
  things you want; a film you crossed off is not one. Counting it would put the
  strikethrough back into the total it was struck out of.
- **The row is a flex *row* at every width**, where it used to be a column that
  became a row at `lg`. The × belongs beside the title on all four surfaces, and
  in the old shape it would have been a fourth stacked line on a phone. Measured
  at 390px with a coarse pointer: no two hit areas in a row intersect, and the ×
  carries a full 44×44.

⚠ **The strikethrough and the title's underline are one CSS property.** Passing
`line-through` alongside `PosterReveal`'s `underline` put two
`text-decoration-line` utilities on one element and the stylesheet quietly kept
the underline — a crossed-off title rendered identically to a live one, and the
build was green. The fix is a `struck` prop on `PosterReveal` so the component
writes one decoration or the other, never both: the collision is removed rather
than won. Struck, the underline goes and does not return on hover — between an
affordance that is deliberately almost invisible at rest and a state that has to
read across the room, the state wins.

### What was considered and not built

**A general delete.** Not much technically; what it costs is the claim. *Nothing
is ever deleted* is why the list is a record rather than a feed, and why the
archive is worth reading back. Once entries can vanish the archive becomes
curated, and a curated archive is a list of things you are happy to admit to.
Scoping a delete to `want` only — an intention never acted on is the one row
whose disappearance rewrites nothing — would have worked and buys nothing the
fourth state does not.

**Retracting notifications on a drop.** A convergence that fired was true when it
fired. §5.1 is about entries rather than notification rows, but withdrawing one
later would make the six kinds in §6 less trustworthy, not more.

**Firing overlap from `dropEntry`.** Every predicate in `classify` is positive
and `dropped` appears in none of them, so the fan-out would run two queries to
write nothing. `resolveEntry` fires because one of *its* outcomes creates a
match; this one has a single outcome and creates none.

**A general "removed" section under the live list.** Never seriously, but worth
naming: it is the band again with a shorter walk. The whole value of the
strikethrough is that the row keeps its place among the things it was listed
beside.

### Verified

Production build, driven in a browser at 1440px and at 390px with touch. The ×
crosses a row off and the list does not reorder; the strikethrough and the
dimming survive a reload; the same × reads *Put {title} back* and restores the
row without moving it; the rail's *Wants* count drops while the row stays on the
page; `text-decoration-line` computes to `line-through` on a crossed-off title
and the live rows keep their underline. No two hit areas intersect on the
handset, and the × measures 44×44. Console clean.

`npm run typecheck`, `npm run lint`, and the §13 suite (8 tests) pass. The suite's
dropped case now asserts the owner sees the row in their **live** view while
`listEntriesForOtherUser` still returns nothing — which is the case that makes
the positive filter earn its keep, because the view a stranger asks for now
selects the private state and the guarantee holds anyway.

---

## The poster paints in from the top (21 August)

Reported at the desk: tapping a title in Wants opens the artwork and you watch
it arrive in strips, top to bottom. Reported on the handset: not that, but still
noticeably slow sometimes.

Three separate causes, and the difference between the two devices was the first
one — the handset was already fetching roughly the size it needed and the desk
was not.

### 1. One size cannot be right on two screens, so we stopped choosing one

`lib/posters.ts` picks every other poster size by arithmetic: rendered CSS px x
the pixel ratio of the screen it renders on. That works for a 32px square and a
24rem column, and it cannot work here, because the revealed poster's box is *the
viewport* on a device whose pixel ratio is not knowable from the server. The two
defensible answers contradicted each other and the file records both: `w780` is
a downscale on a 1x desk display and an upscale on a 3x phone, and the note
rejecting `w780` twice is right about the phone and wrong about the desk.

So this one caller names no size. It offers a `srcSet` of every width TMDB
publishes with the box stated in `sizes`, and the browser — the only party that
knows the pixel ratio — resolves it. Measured: a 1440x900 desk screen at 1x
fetches `w780`, the same screen at 2x fetches `original`, a 390px handset at 3x
fetches `original`. Nothing in the markup differs between them.

Measured off TMDB for one film, so the sizes are not guesses: `w342` 62KB,
`w500` 121KB, `w780` 358KB, `original` 1.87MB at 2000x3000. Most originals are
2000 wide; some are 1000, which is why `original` is declared `2000w` — over-
declaring only ever means the browser reaches for it slightly later, and there
is nothing above it to reach for instead.

That is not a bandwidth optimisation dressed up. It is the rule in CLAUDE.md
applied literally: **remove the condition** — here, the condition that one
number has to be right everywhere — rather than tune the number until one device
looks acceptable.

`sizes` is `min(100vw, 67vh)`, which is the arithmetic of a 2:3 poster contained
in a full-bleed ground and not a constant anybody chose. If a browser cannot
parse `min()` there the attribute is invalid and the spec falls back to `100vw`,
which is to say it fetches `original` — the behaviour this replaced. The failure
mode is the old code, not a broken screen.

> ⚠ **Superseded within the hour — the `srcSet` is gone.** The reasoning above
> about *which file* is still the reasoning the code follows; the mechanism it
> chose could not carry it, because a `w` descriptor is also a promise about
> layout and `original`'s width is not knowable here. See *And the `srcSet`
> lasted about an hour* at the end of this file before touching any of it.

### 2. An `<img>` paints as it arrives, so it is not shown until it has

A baseline JPEG decodes progressively; displaying one before it is complete is
what draws it in strips. There is nothing to time out and nothing to cover with
a spinner — the element is transparent until `load` and fades in over 200ms. No
engine can paint bands of something it is not showing, which is why this is
stated at the display and not at the encoding, where it would be TMDB's to fix
and ours to guess at.

### 3. The lazy loader was load-bearing by accident

`next/image` lazy-loads by default, and this image lives inside a closed
`<dialog>`. `display: none` never intersects the viewport, so the lazy loader
was the only thing standing between a forty-row Wants list and forty full-size
posters fetched on arrival — which nobody had written down. It also meant the
request could not start until the dialog was *shown* and an IntersectionObserver
had noticed it, which is latency bought with nothing.

The image is now mounted on first open instead. That buys the same protection
outright — there is no element, so there is no request — and the fetch starts
eagerly in the same tick as the tap. Verified: zero requests to `image.tmdb.org`
while the list sits there, one request on the press, none on a reopen.

The press, not the click: `pointerdown` warms the exact URL the ladder will pick
by running the same selection on a detached image. Deliberately **not** on
hover. `lib/posters.ts` records that these bytes are spent on a deliberate tap,
and a cursor crossing a title on its way somewhere else is not one.

### The cursor says which of two clicks you are about to spend

Asked for at the desk, and it is the thing that makes the rest legible: a
magnifying glass over the artwork, an ordinary arrow over the ground. Clicking
the ground closes. Clicking the artwork magnifies it to `original` at its own
pixel size, with the ground becoming the scroll container; the cursor turns to
`zoom-out` and a second click comes back.

- **The magnified size is `original`, fetched on the click and swapped in on
  arrival.** Swapping first and waiting after would blank the poster at the
  exact moment somebody asked to see more of it. Whenever the ladder had already
  chosen `original` for the fitted view — every high-DPR screen — it is already
  in the cache and the swap is instant.
- ⚠ **A `srcSet` leaves a pixel density behind that removing the attribute does
  not take away.** Choosing from a `srcSet` stamps the element with the ratio
  between the file's real width and the width `sizes` claimed for the box, and
  from then on the element lays itself out — and reports `naturalWidth` — at the
  corrected size. Swapping in `original` and deleting both attributes measured
  **603px for a 2000px file**: 2000 / 3.32, the density from a ladder that was
  no longer there. Each mode now gets its own element via a `key`, so the one
  that means *at its own pixel size* was never told a box. A state removed
  rather than a state cleared.
- **`touch-none` becomes `pan-x pan-y` when magnified**, which is the exact
  subtraction: dragging comes back, `pinch-zoom` stays withheld. The reason
  `touch-none` is there at all is that an unhandled pinch zooms the *page* and
  iOS offers no way to put page zoom back, so a pinch on a poster used to strand
  the list behind it magnified. Panning must not reopen that.
- **The artwork centres with `m-auto`, not `justify-center`.** A centred flex
  child that overflows its scroll container is clipped at the start edge, which
  would make the top-left corner of a magnified poster unreachable. The scroll
  position is centred on the swap for the same reason — auto margins resolve to
  zero when the child overflows, so it would otherwise land on the one part of a
  poster nobody magnified to read.

### Then undone in the hand, the same day

Shipped, looked at, and pulled back on the handset within the hour. The reason
was visible before it went out and is worth stating plainly rather than as a
caveat: **on a phone the fitted artwork takes the full width**, so the ground it
is dismissed from is two ~130px bands at 390x844 rather than a margin all round
— and the tap that used to close it started zooming instead. A gesture arrived
where a dismissal used to be, and the dismissal retreated to the thinnest part
of the screen. Under a finger the whole surface is a dismissal again, which is
what this screen did for its first two weeks.

⚠ **This is not the device branch CLAUDE.md rules out, and the difference is the
whole of why it is allowed to exist.** A banned branch asks *what browser is
this* and then corrects for it: a guess about a class of machine, made once, and
wrong on the next machine in that class. This asks the event that actually
arrived — `pointerType` off the `pointerdown` — what kind of input made it. That
is neither a guess nor a class. A touchscreen laptop magnifies under its mouse
and dismisses under a finger, in the same session, on the same element, and
nothing had to know which laptop it was. **A media query cannot do that**,
because `(pointer: coarse)` describes the device and the question here is about
the gesture. The probe checks the touch path on all three profiles for exactly
this reason — a desk screen touched on its glass must dismiss too.

Anything that is not a mouse dismisses, including a click with no pointer behind
it. The fallback is the older behaviour, which is the safe direction to fail in.

It also puts a guarantee back rather than complicating one. `touch-none` gives
way to `pan-x pan-y` only when magnified, and magnifying is now a cursor's
gesture — so under a finger this element is `touch-none` for the whole of its
life and the iOS page-zoom trap has one state, not two.

**What this leaves as a real question:** whether magnifying is worth having at
all on a surface whose primary device cannot reach it. It stays because the desk
asked for it and the desk is where a 2000px master is legible. If it turns out
nobody uses it, the subtraction is one `pointer` ref and two class strings.

### What was considered and not built

**A low-resolution first paint.** Show `w342` immediately, swap in the real one
behind it. It removes the blank rather than the strips, at the cost of two
fetches on every open and a visible sharpening. With the press warming the fetch
and the desk now pulling a fifth of the bytes it used to, there is not much
blank left to fill.

**Hover prefetch.** A real win at the desk and a real cost on mobile data, and
it contradicts a rule already written down. Pointerdown gets most of the
distance for none of the argument.

**Zooming toward the click point.** The classic magnifier behaviour, and it
would mean a focal-point calculation on every screen shape. Centred is
predictable and was not what anybody asked for.

**The film screen's own artwork.** The same progressive paint is possible there,
and it has its own sizing note and its own reveal. Out of scope for a report
about the list, and it should be looked at with that screen's animation in hand.

### Verified

Driven against a production build in a browser at 1440x900 at 1x and 2x and at
390x844 at 3x, with `image.tmdb.org` answered by real rasters at each rung's
true pixel size — `node_modules/.probe/reveal.mjs`, 23 checks per profile, all
clear. Every profile is given a touchscreen as well as a mouse, and both paths
are driven on each: a tap on the artwork dismisses, a click on it magnifies. ⚠ The first version of that probe served SVGs and was theatre: an SVG has
no fixed pixel size, Chromium reported `naturalWidth` 603 for a stub declaring
2000, and `width === naturalWidth` passed while measuring nothing. A poster is a
JPEG; the stub had to be a raster before the magnify claim meant anything.

`reveal-nested.mjs` covers the hazard `film-screen.tsx` records — the poster
opened from inside the film screen at pane width, magnified, returned and
dismissed, with the film screen still standing afterwards. The takeover has no
`PosterReveal` in it; below `--breakpoint-pane` the film screen recedes its own
artwork instead.

`npm run typecheck`, `npm run lint` and the §13 suite (8 tests) pass.

### And the `srcSet` lasted about an hour (21 August)

Reported from the phone: *some posters open small*. They did, and the cause was
the mechanism this entry opened by recommending.

**A `w` descriptor is a promise about the file, and the browser spends it
twice.** Once to choose a candidate — the part everybody means by responsive
images — and once to compute the image's *intrinsic size*, as `naturalWidth /
(descriptor / the width sizes claimed)`. Every rung below `original` keeps that
promise exactly, because TMDB resizes to the number in the path. `original` is
whatever the distributor supplied, and `2000w` was a guess. Measured against a
stub serving each real master width, on a 390px phone at 3x:

| master | fetched | rendered | should be |
| --- | --- | --- | --- |
| 2000px | `original` | 390px | 390px |
| 1400px | `original` | **273px** | 390px |
| 1000px | `original` | **195px** | 390px |

Shrunk by exactly the ratio the promise was wrong by. Most TMDB masters are
2000 wide, which is why it was *some* posters and not all of them — and the desk
never showed it at all, because a 1x desk screen picks `w780`, whose descriptor
is exact. The bug lived entirely on the surface it was hardest to see on, in the
half of the mechanism nobody thinks about.

⚠ **Do not put the `srcSet` back, and in particular not with a "safer"
descriptor.** There is no safe number. Under-promise and the browser reaches
past a file that would have done; over-promise and the poster shrinks. The
descriptor cannot be right without knowing each master's width, and nothing on
the client knows it — `items.metadata` holds a path, and TMDB gives dimensions
only from a separate `/images` call this app does not make.

So the arithmetic moved back into the app, but to **the moment the box exists**
rather than to `lib/posters.ts`, where it does not: `rungFor` measures the
viewport and multiplies by `devicePixelRatio` when the poster is asked for. The
rungs it lands on are the same ones the browser was landing on — `w780` on a 1x
desk, `original` at 2x and on a 3x phone — so nothing about the first entry's
bandwidth argument changes.

**What changed is that the choice stopped touching the geometry.** With one
`src` and no descriptor, the intrinsic size is the file's true size, and
`object-contain` lays out whatever actually arrived. That is the difference
between the two designs and the whole of the lesson: the old one made a
guessable number load-bearing for layout, so being wrong about it was silent and
visible at the same time.

Three things fell out of it, all subtractions:

- **The `key` went.** It existed to escape the pixel density a `srcSet` leaves
  behind; with no `srcSet` there is no density to inherit. One element for both
  modes is also the better swap — the browser holds the old frame until the new
  one decodes instead of blanking between them.
- **The detached `Image` used to warm the cache went.** Naming a rung mounts the
  `<img>`, in a dialog that is still `display: none`, where an eagerly-loaded
  image fetches anyway. The press starts the bytes from the same element that
  will show them, so there is no second URL to keep in step with the first.
- **`mounted` went.** The rung being non-null *is* "has been opened" — the
  element and the size it wants come into existence at the same moment.

**The aspect ratio is the one thing still assumed**, and only to guess at the box
before there is a file to measure it from. It is asked again on `load`, from the
artwork itself, and the rung ratchets up if the guess was mean. That is not
belt-and-braces: *contained, never enlarged* means a file narrower than its box
renders at its own width, so under-picking a rung costs the poster **size**, not
just sharpness. Measured — a square master on a 1440x900 desk came back at 780px
where the box allowed 900, until it was asked a second time. The same ratchet
handles a phone rotating from landscape to portrait, and only ever moves up:
coming back down would swap a sharp file for a soft one to save bytes already
spent, and it is what stops `load` and `reconsider` chasing each other.

**Verified** with `node_modules/.probe/small.mjs`, which serves masters at 2000,
1400 and 1000 wide and at 2:3, 1:1 and 1:2, on a 3x phone and a 1x desk. Ten
cases, every one rendering the width `object-contain` owes it. `reveal.mjs` and
`reveal-nested.mjs` still all clear; typecheck, lint and the §13 suite pass.

### The poster fills the phone, and grows a door (21 August)

Asked for: on the phone, tile the poster so it fills the screen, and close it
with an × in the top right instead of by tapping the picture.

The two halves are one decision. Tiling leaves nowhere to tap that is not the
picture, so the × is not a preference about affordances — it is the door to a
room that has just been sealed. Building either without the other gives you an
× nobody would look for, or a screen with no way out.

**The tiles are the same file continuing off the top and bottom edges**, not a
grid of smaller copies and not the artwork cropped to fill. One copy sits where
it always did, and the bands above and below carry the tail of the previous copy
and the head of the next.

#### Flush, not "the handset"

The condition is not a width and not a device. It is **does the artwork already
reach both side edges** — `aspect(image) > aspect(viewport)` — which is true of
a 2:3 poster on a phone held upright and of very little else.

That is the exact condition under which the technique works, rather than an
approximation of the machine it was asked for. `background-size: <width> auto`
with `repeat-y` only repeats seamlessly along an axis the artwork already spans;
tile a height-bound poster and you get columns of it side by side, which is a
wallpaper and not a poster. So a phone upright tiles, a phone on its side does
not, a 1440x900 desk does not, and a narrow browser window does — because it is
the same shape as a phone and the same treatment is the right one there.

It also means the rule needs no maintenance when a new screen shape appears.
Nothing is enumerated.

#### One rule for what a tap does

**A tap closes wherever there is no control saying how to close.** Flush, the
picture and the tiles are inert and the × is the way out. Not flush, a finger
tapping anywhere still closes — which is what this surface has always done — and
a cursor still gets the ground for closing and the artwork for magnifying.

Nothing was taken away. The affordance appears exactly where the gesture stops,
so a phone rotating between the two states is telling you which one it is in.

#### Details that are load-bearing

- **The tile is sized from the picture's measured box, not `100%`.** The centre
  tile has to land exactly under the `<img>` or the poster is drawn twice a
  pixel apart and the seam is a bright line across the middle of it. `100%`
  would usually be right; *contained, never enlarged* is what makes "usually"
  not good enough, because a master narrower than the screen renders at its own
  width and `100%` would be wider than the thing it sits under.
- **The tiles are painted only once the picture has loaded**, on a layer that
  fades in with it. A background paints in from the top exactly like an `<img>`
  does — gating one without the other would put the strips straight back into
  the two bands, in the one place nobody would think to look for them.
- **Never tiled while magnified.** A magnified poster is larger than the screen
  and pans; a fixed backdrop behind it would slide under the picture as it
  moves, which reads as the artwork coming apart.
- **The tile layer is `pointer-events-none`** so a tap on a tile is a tap on the
  ground, which keeps the one decision about what a tap does in the one place
  that makes it.
- **The picture needs `relative`.** The tiles are absolutely positioned, and a
  positioned element paints above a static one whatever the document order says.
- **The × is `fixed`, not `absolute`.** The ground becomes a scroll container
  when magnified, and a control that scrolls off the top of the artwork is a
  control that is not there.
- **It carries its own disc.** It sits on artwork nobody has seen, and a bare
  glyph is legible or invisible depending on the film. 44px, matte black at 55%,
  offset by `env(safe-area-inset-top)` so it clears the status bar on an
  installed app.

#### What was considered and not built

**A grid of smaller copies**, and **one poster cropped to fill**. Both were put
to the person who asked; the repeat won. Cropping would have been the smallest
change and it loses artwork off both sides, which is the one thing this screen
exists to show.

**Keeping the ground dismissive as well as the ×.** Belt and braces, and it
would have made the × unfindable: a control nobody needs is a control nobody
learns. If the × turns out to be missed in the hand, the answer is to make it
larger, not to make the whole screen dismiss again.

**A width breakpoint.** It would have been shorter to write and wrong on the
first screen nobody had thought of.

#### Verified

`node_modules/.probe/tiles.mjs`, driven against a production build on four
shapes — a phone upright at 3x, the same phone on its side, a 1440x900 desk, and
a 520x1000 window. Each one tiles or does not as its own shape dictates; where it
tiles, the tile is the picture's measured width, centred, repeating down, from
the same file, faded in with it, and the repeat meets the picture's top edge at
130px on the phone, which is exactly the band. The × is 44x44 in the top right,
tapping the picture and tapping a tile both do nothing, and the × closes.
Where it does not tile there is no × and a tap still closes.

`reveal.mjs` now reads which rule to expect off the layout rather than off the
profile's name, and is all clear on all three profiles; `small.mjs` and
`reveal-nested.mjs` unchanged and clear. Typecheck, lint and the §13 suite pass.

### The surround becomes one thing, in two places (21 August)

Three asks, and they turned out to be one: take the outline off the ×, blur the
tiles the way the panel's backdrop is blurred, and put the same treatment behind
the receded film screen.

#### The disc was the outline

There was no focus ring — checked, because that was the obvious suspect and it
was wrong: `showModal()` leaves focus on the `<dialog>` itself, whose outline
computes to `none`. What read as an outline around the × **was** the ×'s disc,
`bg-black/55` and `rounded-full`, which is a second shape drawn around a mark
that is already a shape.

What the disc was for is still real: this control sits on artwork nobody has
seen, and a bare mark is legible or invisible depending on the film. **A drop
shadow does that job without drawing anything of its own** — it is the mark's
own edge darkened rather than a plate behind it. The 44px hit area stays and is
now invisible, which is the point: a target the thumb finds and the eye does
not.

⚠ The shadow was not asked for. It is there because this project has a standing
rule that legibility must not be a function of which film you tapped — the same
argument that derives the panel's 80% glass. If it reads as too much, the
subtraction is one class.

#### One surround, two rooms

`film-screen.tsx` has filled the room left by the receded poster since 20 August
— on a narrowed desk window — with one cover-scaled copy of the artwork at
`blur-2xl` and 70%. That is the reference. The poster reveal's tiles now carry
**the same two numbers**, and `components/poster-tiles.tsx` holds them once so
the two surfaces are out of focus by the same amount and neither can drift.

And the film screen's own handset surround, which that file's comment described
as *black — the poster centred and deliberately framed*, is now tiled too. That
ruling is reversed here deliberately; the comment has been rewritten rather than
left to contradict the code.

**Why the two surrounds still differ in fill.** It is the shape of the room, not
the machine. A narrowed desk window leaves the poster short of the screen's
height, so there is room to crop *to* and one cover-scaled copy fills it. On a
handset the picture already spans the width: there is nothing to crop to, only
bands to continue into, so the fill has to be the same picture repeating or it
is a second image nobody asked for.

#### What is load-bearing in `PosterTiles`

- **Two elements.** The outer clips; the inner overhangs by `8rem` on every side
  and carries the paint. A blur samples past its element's edges, where there is
  nothing, so an exactly-sized copy fades out at all four sides and reads as a
  vignette — the same reason `film-screen.tsx` gives its `scale-110`. 8rem is
  `blur-2xl`'s own radius three times over, which is where a Gaussian has
  nothing left to give.
- ⚠ **The overhang is symmetric and must stay symmetric.** It is what keeps the
  layer's centre on the clip's centre, which is what keeps the centre tile under
  the sharp poster. `scale-110` would vignette-proof it just as well and is the
  wrong tool: scaling resizes the tiles with it, and the tile size is the one
  thing that has to agree with something else.
- **The overhang is why the clip exists.** Without `overflow-hidden` around it, a
  layer larger than the dialog grows a scrollbar on it.
- **`background-repeat: repeat`, not `repeat-y`.** The tile is the poster's
  width, which is narrower than the overhanging layer, so a vertical-only repeat
  would leave transparent columns for the blur to sample at the left and right
  edges — dimming the bands exactly where they meet the screen.
- **`align` is measured, not assumed.** The poster reveal passes its `<img>`,
  because *contained, never enlarged* means the picture can be narrower than the
  box it is centred in. The film screen passes nothing, because there the
  artwork spans the column by construction.

#### Verified

`tiles.mjs` extended: the layer is out of focus at `blur(40px)` and 70%, the
tile is the picture's measured width, centred, repeating, from the same file —
on a phone upright and a 520x1000 window, and absent on a phone on its side and
at the desk. The × is asserted to have no background, no border, no outline and
no box-shadow, and to keep a drop shadow.

`recede.mjs` is new: it opens a film from the wall and presses the down chevron.
Under a thumb the surround tiles at the column's width, centred, at the same
blur and the same 70%, with the poster whole and centred (measured 390x585 at
top 130 on a 390x844 screen); under a cursor it is still the single cover copy
and no tiles. At rest, before the chevron, the sharp poster covers the column
and the surround is invisible — which is why neither surround needs any state.

`reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and `arrive.mjs` all clear;
typecheck, lint and the §13 suite pass.

⚠ **One unexplained event, recorded rather than dismissed.** A single run of
`reveal-nested.mjs` reported `Minified React error #441` as a page error. Five
subsequent runs of that probe and four of `tiles.mjs` and `recede.mjs` did not
reproduce it, and neither new component is even mounted in that scenario — the
nested case is a 1440x900 pane, where nothing is flush and `touch` is false. It
is noted here so that the next person to see it knows it is the second sighting
and not the first.

### The recede was animating the wrong properties (21 August)

Reported from the handset: press the chevron and the panel drops away, then the
poster follows late and resizes in two stuttering steps; tap the poster and the
panel pops back before the picture has finished. It has to be smooth.

**It was not a tuning problem. The two halves of one gesture were animating
different kinds of property.** The panel moves with a transform, which the
compositor runs on its own thread. The artwork animated `height` and `top`,
which are layout: every frame relaid the box and re-`object-cover`-ed a 2000x3000
master into a different-sized hole. Perceived as lag because half the gesture was
smooth and the other half was not.

#### Measured, twice, because the first measurement was of the wrong thing

`node_modules/.probe/jolt.mjs` samples the box every frame with the CPU
throttled 6x: the poster got **13 frames of a 300ms move with a 57ms gap** in the
middle. Useful, but it cannot prove the diagnosis — its own
`getBoundingClientRect()` every frame is main-thread work, so it competes with
what it measures and partly reports on itself.

`composited.mjs` asks the only question that separates the two mechanisms:
**does the picture keep moving while the main thread is busy?** It presses the
control, waits two frames for React to commit, jams the main thread with a
synchronous loop for 250ms, and counts distinct frames arriving over CDP's
screencast — which is what the compositor put on the glass, not what the page
believes it drew.

| | frames while the main thread was jammed | distinct frames over the whole move |
| --- | --- | --- |
| `height` + `top` | **1** — frozen solid | 4–5 |
| `transform` | 9–16 | 14–20 |

⚠ **That probe was wrong twice before it was right, and both mistakes flattered
the code.** First it blocked in the same task as the click and reported FROZEN
for everything including the panel — React's `setState` is asynchronous, so the
loop ran before the transform was ever written and measured a transition that had
not started. Then it hashed the whole frame and reported *composited* for the old
animation too — the panel is composited beyond suspicion and covers half the
screen, so something moved whatever the picture did. It only discriminates with
the panel made invisible, which is what isolation means here. **A probe that
agrees with you is not evidence until it can also disagree**: the control run
against the old code is what makes the table above worth reading.

#### The shape of the fix

The box no longer changes size. It is laid out once at the **resting** geometry
and scaled *down* to recede.

That direction is deliberate. The other way round was available — lay out at the
receded size and scale up — and it would leave the state you are looking at
almost all of the time rasterised for a smaller box. At rest the transform is now
`none`, so the picture is drawn at its own layout scale and nothing is resampled
at all.

⚠ **It is JavaScript rather than `cqw` because the geometry is a ratio of two
measured lengths, and CSS cannot express one.** A scale is a number, and `calc()`
cannot divide a length by a length to produce a number. Everything else is still
arithmetic and none of it is a chosen number: the resting box is the poster at
cover size — `max` of the two axes, so it is right upright and on its side — and
receding scales it to the column's width, which is what *whole* means here. The
transform is written through the CSSOM, which the CSP permits; the ban is on the
`style` attribute.

⚠ **A `ResizeObserver`, and a `window` resize listener will not do.** The first
version measured on mount and listened for resizes, and measured **zero** — this
screen is a `<dialog>` its own effect opens a tick later, and until it does the
column is `display: none` with no size at all. Nothing resizes the window when a
dialog opens, so nothing would have corrected it; it happened to be re-measured
by an unrelated re-render, which is luck and not a mechanism. The observer asks
the question the code actually has — *what size is this box now* — and answers it
on the first layout, on the dialog opening and on a rotation, without naming any
of the three.

#### Verified

The geometry is unchanged, which is the claim that matters most: `recede.mjs`
measures the receded poster at **390x585 at top 130** on a 390x844 screen, the
same numbers the old `calc(50% - 75cqw)` and `150cqw` produced, and the resting
screenshot is unchanged. Both orientations were checked against the old
expressions before they were deleted.

`tiles.mjs`, `reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and `arrive.mjs` all
clear; typecheck, lint and the §13 suite pass.

### The film screen stops being rebuilt every time (21 August)

Two changes, both aimed at the part of the pathway that is not an animation: the
time between tapping a poster on the wall and the screen being there. The
backdrop blur stays — its cost while sliding is real (~50ms of worst-case gap,
measured) but it is not what this is about, and its recipe is derived.

#### The poster starts on the tap, not on the mount

`Artwork` asks for its file in a `useEffect`, so the fetch waits for React to
mount the whole film screen first. `capture-provider.tsx` knows which film was
chosen a render and a commit earlier, and on a handset that file is `original` —
0.8–1.9MB. `choose` and `present` now start it.

⚠ **On the click, not on `pointerdown`.** `lib/posters.ts` records that these
bytes are spent on a deliberate tap, and on the wall a press is how *scrolling*
starts — warming there would spend a megabyte on every flick past a poster. This
is the same rule `PosterReveal` follows and the opposite conclusion, because the
surfaces differ: a title in a list is not scrolled by pressing it.

⚠ **The rung comes from `filmPoster`, exported from `film-screen.tsx` and called
by both.** A copy of `overlay && touch ? 'original' : 'w780'` in the provider
would be free to drift, and the drift shows as either a wasted megabyte or a soft
poster — neither of which announces itself. The media queries are read
imperatively rather than through their hooks: subscribing in the provider would
re-render every route in the app on a breakpoint change.

#### Mounted is no longer the same as open

`chosen` used to be cleared on close, which unmounted the screen: every open then
rebuilt the tree, re-rastered two blurs and re-decoded a poster. Measured on a
throttled phone profile, tap → a picture on screen: **237ms, then 140ms, then
92ms.** The screen was throwing that warmth away on every close.

It stays mounted now, with an `open` prop saying whether it is showing.

⚠ **Four things read *mounted* and meant *open*, and every one of them is a bug
that would not have looked like this change:**

- **The scroll lock**, which pins `body` behind the takeover. Left on after a
  close, the wall is dead and the bug looks like the wall's.
- **The Escape listener**, which the panel adds because `show()` gets no
  dismissal from the platform. Left attached, a key pressed anywhere in the app
  closes a screen that is not there.
- **The recede.** Unmounting used to forget it; without a reset the next film
  opens with its words already pushed off the bottom. It resets in the `close`
  handler rather than an effect on `open` — that is the event that *means* it,
  and the reopening case returns before it, which is right, because a mode
  switch is not a close.
- ⚠ **The close itself, which is the one the probe caught.** The takeover is
  modal and the platform dismisses it, so `open` goes false as a *consequence*
  of the dialog closing. The panel is `show()`, which the platform never
  dismisses — `onClose` closed it by unmounting it. With nothing unmounting, the
  desk panel stayed on screen with `open` false: the whole feature failing, in
  the one mode where it is least visible. The effect closes it now, flagged as
  ours so the `close` it fires is not read as a person's.

#### What it bought, honestly

Measured at 4x CPU throttle, and **the single-run variance on these is ±60ms**,
which is larger than most of the differences:

| step | before | after |
| --- | --- | --- |
| tap a poster on the wall | 402ms worst gap, 666ms settled | 350ms, 662ms |
| tap the chevron | 119ms, 382ms | 175ms, 422ms |
| tap the poster (words back) | 62ms, 388ms | 53ms, 372ms |
| tap the poster (the wall) | 113ms, 126ms | **77ms, 90ms** |

The close is the one clear win — there is no teardown any more. Reopening moved
from 140/92ms to 128/79ms for the second and third opens. The chevron's apparent
regression is inside the noise; its median across seven runs is ~42ms.

**So this is a modest change and it should be recorded as one.** The decay from
237 to 92ms turned out to be mostly JIT and raster warmth rather than the mount,
which is not what the mount hypothesis predicted, and the honest reading is that
the second point in that series was never worth much.

#### What was measured and not built

**`will-change: transform` on the artwork**, and **`translateZ(0)` on the tiles.**
Both were tried and both measured, median of seven, at 4x throttle:

| | recede worst gap | back |
| --- | --- | --- |
| as shipped | 42ms | 30ms |
| tiles cached | 37ms | 31ms |
| artwork promoted | 45ms | **47ms** |
| both | 46ms | 37ms |

`will-change` makes it *worse*; the tiles cache is inside the noise. Neither was
applied — a class that does not help is just a class.

**Turning the backdrop filter off while the panel is in motion.** Held at the
author's request, not rejected. It is the largest remaining lever (109ms → 60ms
on the recede, 51 → 35 on the way back) and the open question is whether the flip
is visible: `bg-bg/80` means only 20% of the blurred image shows through, so it
may not be, but that has to be seen before it is relied on.

#### Verified

`mounted.mjs` is new and covers the four hazards above on both surfaces: closing
closes, the screen stays mounted, the document is unlocked, Escape reaches
nothing, it reopens, and it reopens with the words up. It caught the panel bug.

`recede.mjs`, `tiles.mjs`, `reveal.mjs`, `reveal-nested.mjs`, `small.mjs` and
`arrive.mjs` all clear; typecheck, lint and the §13 suite pass.

### The white ring around the × (21 August)

Reported as a shadow around the ×. It was not: the drop shadow is half a pixel
of black. It was a **focus ring** — `outline: solid 2px` in `--color-text`, drawn
by the browser because `showModal()` had focused the ×.

⚠ **It appeared only sometimes, and the "sometimes" is the interesting part.** A
`<dialog>` focuses its first focusable descendant, or itself if it has none. The
× exists only when `flush` is true, and `flush` is not known until the artwork's
shape is — so opening a poster for the first time landed focus on the dialog, and
opening one already in the cache landed it on the ×. **The same code produced two
behaviours, decided by whether a file had been fetched before.** That is the kind
of difference that reads as random and gets chased as a rendering fault.

Focusing the dialog outright removes it: the focus target stops depending on what
had mounted by the time the screen opened.

⚠ **`outline-none` on the dialog is the other half, and without it the fix is
worse than the fault** — taking the ring off the × by focusing the dialog just
draws it around the dialog, which is the whole screen. A ring belongs on
something you can Tab to; this is focused programmatically and is not in the tab
order.

Nothing is taken from a keyboard. Measured on both surfaces, opened by tap, by
keyboard and by mouse: focus lands on the dialog every time with no ring, and one
Tab reaches the × with `solid 2px` — which is correct, because that is what a
ring is for.

### Crossed off is inert, and the ring hugs the mark (21 August)

**A struck title no longer answers a tap.** It was a button that merely stopped
advertising itself, on the reasoning that a crossed-off film is `dropped` rather
than deleted (§5) and its artwork is still its artwork. Directed otherwise.

⚠ **A `span`, not a disabled button, and not the children handed back bare.**
The strikethrough is drawn by `PosterReveal` — that is the whole reason `struck`
is a prop rather than a class from the caller — so returning `<>{children}</>`
would take the crossing-off with it and a dropped row would read as live. A
disabled button would keep the decoration and still be a control: announced,
tab-reachable, and doing nothing. There is no control there any more, so there
should be no element claiming to be one. `struck.mjs` checks both halves, and
that restoring the row makes it a button again.

**The focus ring around the × is smaller, and it is smaller by construction.**
The button was `size-11` — 44px of box around a 20px glyph — and a ring traces
the box, so a keyboard drew a rounded square twice the size of the thing it
pointed at. The alternative was a negative outline offset: a number tuned against
one glyph at one size, wrong the moment either changed.

Instead the element is the size of the mark and `tap-target` gives the hit area
back — the app's own utility for exactly this, used the same way by the resolve
flow: a transparent 44px pseudo-element under a coarse pointer. The ring hugs the
mark, and the target is still 44px where a target matters. The position moved
from `right-3`/`top-…+0.75rem` to `right-6`/`+1.5rem` so the *mark* stays where
it was rather than the box.

⚠ **The probe had to stop measuring the box.** `boundingBox()` reports the
element, which is now 20px, and would call a perfectly good target a failure.
`tiles.mjs` hit-tests four corners at ±21px through `elementFromPoint` instead,
which is the question that was always meant.

#### The ring at 32px, one pixel thick (21 August)

Directed. The box is what a focus ring traces, so the box is the size the ring
should be: 32px, which sits it 6px clear of a 20px mark on every side. 32 is
under 44, so `tap-target` still carries the thumb.

⚠ **The insets are derived from the box rather than chosen.** The mark has sat
34px in from the top-safe and right edges since it was a 44px box at 12px, and
`34 − 16` is what keeps it there at 32. Change the size and that number changes
with it — it is arithmetic, not a position.

⚠ **The width was written as 1.5px and Chromium reported 1.** It floors
sub-pixel outline widths, at 3x as well as at 1x, so this is not device-pixel
rounding — 1.5 would have drawn as 1 there and as 1.5 in Safari. A hairline is
the one thing that cannot afford to differ by engine, so it is written as 1px:
what it actually draws.

And `focus-visible:outline-solid` rather than `focus-visible:outline`, because
the latter sets a width of its own and quietly won.

#### The tiles appeared seemingly at random (21 August)

Reported: the blurred bands are missing on the handset, and when they do appear
they appear at random. They were not random. `flush` was set in one place —
`reconsider`, which runs from the image’s `load` event and from a resize — and
**a cached image fires no `load`**: the element is already `complete` before
React attaches a handler. So a film opened for the first time tiled and the same
film opened again did not.

⚠ **The same shape of fault as the ring around the ×, in the same file, on the
same day.** Both were state that only a late event could set, describing
something knowable at the tap: this screen’s shape is the viewport’s shape, and
the viewport is right there. It is now decided in `choose`, beside the rung,
and `load` still refines it with the artwork’s true aspect rather than being
the only source of an answer.

⚠ **The probe could not have caught it**, and that is the more useful lesson.
`tiles.mjs` opened each poster once, from cold, in a fresh context — a cache
state the app almost never meets in use. It now opens the same poster twice and
asserts the two agree, which is the assertion that would have failed on the
shipped build.
