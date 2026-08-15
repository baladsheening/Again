# Decisions

Why things are the way they are, and what is still open.

`CLAUDE.md` holds the rules for building. This holds the reasoning behind them,
the choices that deviate from or extend the brief, and the questions nobody has
answered yet. If a decision here looks wrong later, the "what would change this"
line is the thing to check first — most of them are waiting on a trigger, not on
someone's opinion.

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

*What would you try, and try again?* — in the `<meta description>` and under the
mark on sign-in, and nowhere else.

It names the two states directly: **would try** is a want, **try again** is a
go-back-to. The whole data model in six words, and the app's name becomes the
payoff rather than a label sitting above unrelated copy.

The question mark is correct because it is one question with a compound verb —
"what would you try, and *what would you* try again" — not two questions joined
by a comma. An earlier draft was two clauses and took a full stop for that
reason; the reason left when the draft did.

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

**The correction changes side with the pointer**, so there are two classes rather
than one with an override:

```
mouse  100px above the pair, 94px below  → 6px short → pointer-fine:pb-[6px]
touch  100px above the pair, 104px below → 4px over  → pointer-coarse:pt-1
```

Touch is heavier below because `control-box` grows the fields and the button to
48px there while the header and the 12px switches do not move. A device
reporting neither pointer gets no correction and sits 3px low, which is the right
way to fail.

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
form's rhythm makes them wrong, and they have already moved twice: closing the
submit button's `mt-1` took them from 18/8 to 22/12, and setting the switches
`mt-4` below the button took them to 6/4 and flipped the touch one's sign. Both
were verified by compiling `app/globals.css` through `@tailwindcss/postcss`
directly — the dev server serves a cached CSS chunk that can lag a source edit by
several minutes, and it will happily show you a class you have deleted.

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

Re-verify with:

```
npm run typecheck && npm run lint && npm run build
```
