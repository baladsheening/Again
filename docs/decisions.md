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

### Rate limiting is not real without Upstash

`lib/rate-limit.ts` falls back to an in-process `Map` when
`UPSTASH_REDIS_REST_URL` is unset. That is fine locally and **is not protection
in production**: each serverless instance gets its own memory, so an attacker
simply lands on a different one.

§10 lists rate limiting as non-negotiable from the first commit, and the code is
there — but the backing store is not. `rateLimitIsDurable()` reports which mode
is live. Needs Upstash credentials before any real deployment.

**Enforced as of 8 August 2026:** `scripts/preflight.mjs` fails a production
build when the credentials are missing. The gate has to sit *before* the deploy,
because the fallback is undetectable after it — the app looks healthy, responds
normally, and simply does not limit anything. Previews and local builds print the
same findings and carry on. This is the enforcement, not the fix: the credentials
themselves are still outstanding, and this entry stays open until they exist.

The comment in `lib/rate-limit.ts` previously said `assertRateLimitConfigured()`
was "called at the point of deploy readiness". No such function was ever written,
and `rateLimitIsDurable()` has no callers either — the file described a guard it
did not have. The comment now names the script that does the work.

This got more serious once auth started going through it. `LIMITS.auth` guards
sign-in, sign-up and password reset, so the in-process fallback is now standing
in front of the account boundary and an emailed bearer token, not only the TMDB
proxy. Better Auth's own limiter is no help here — it defaults to in-memory too,
which is the identical hole.

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

### Upstash over Vercel KV

§10 permits either. Upstash keeps rate limiting portable if the app ever leaves
Vercel; Vercel KV would not.

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

Still unverified: anything on hardware, and the visual design of the signed-in
app, which no human has seen — there is no account to sign in with, so every
visual judgement so far has been of `/sign-in`. And no deployment exists. §12
wants each phase shipped to Vercel before the next starts. Neon is in
`eu-west-2` (London), so Vercel's function region should be `lhr1`.

Re-verify with:

```
npm run typecheck && npm run lint && npm run build
```
