# Plan

The build order from §12, with state. Update this as phases move — it is the
only place the sequence lives outside the brief itself.

`docs/decisions.md` holds *why*. This holds *where we are* and *what must not be
forgotten*.

**Looking for what is left to do?** *Outstanding*, below, is the complete list —
one line per item, with the detail further down. It is an index, not a second
copy: keep it to one line, and let items leave it rather than collect ticks.

**Ship each phase to Vercel before starting the next** (§12). A phase is not
done because the code exists.

---

## Status

| Phase | Scope | State |
|---|---|---|
| 0 — foundations | Neon, Drizzle schema + migrations, Better Auth, `lib/db/` convention | **Built, verified against live DB. Not deployed.** |
| 0.5 — account recovery | Password reset, auth rate limiting, `lib/email.ts` | **Built, verified end to end against the dev server and live DB. Resend wired 8 August; needs only the API key.** |
| 1 — single player | Profiles, input box, entries, live list, resolve flow, return counts, visual system | **Built. Server verified, and the React layer now driven end to end in a real browser — one blocking bug found and fixed. Not deployed.** |
| 2 — two players | Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'` | Not started |
| 3 — overlap | Trigger + notification rows, `/notifications`, `/overlap` picker. In-app only | Not started |
| 4 — swap | Full flow, blind commit enforced in the data layer, `landed` | Not started |
| 5 — PWA + push | Manifest, service worker, VAPID, subscriptions, install prompt | Not started |

§13: the multiplayer half is roughly **80% of the work and 100% of the value**.
Phases 2–4 are the product. Budget accordingly and resist the pull of the part
that is fast to build.

---

## Outstanding

### Before anyone else can use it

Upstash and Resend both exist now and are verified against the real services —
see steps 2 and 2b. Their credentials live in `.env.local` and **still have to be
entered into Vercel**, which is part of step 3 rather than a separate item.

- [ ] **Deploy to Vercel.** Import the repo, set env, redeploy with the real
      `BETTER_AUTH_URL`. Nothing has ever been deployed. → *step 3*
- [ ] **Run it on a phone.** Nothing has ever run on hardware. → *step 4*

### Found by looking at it — 8 August

The first human pass over the signed-in app, and it produced three things in ten
minutes. That is the argument for having done it.

- [ ] **The return count leaves the live list**, and its tooltip is wrong where
      it stays. → *Decided, not yet built*
- [ ] **A satisfied want is ticked and sinks below the unsatisfied ones.** →
      *Decided, not yet built*
- [ ] **The wrong-password message is styled as an aside.** →
      *Decided, not yet built*
- [ ] **Groups, and names instead of handles.** New, and the identity half lands
      in Phase 2. → *Carry-forward register*

### Decided on 8 August, not yet built

- [ ] **A resolved entry stops reading "Want to see".** →
      *Decided, not yet built*
- [ ] **A private one-line note on your own entry.** →
      *Decided, not yet built*

### The product

- [ ] **Phase 2** — tracks, `/u/[handle]`, visibility, copy. → *step 5*

### Smaller, unscheduled

- [ ] **`/settings` does not exist**, and three things now want it. →
      *Unscheduled*
- [ ] **Reset rate limiting is per IP, not per email address.** → *Unscheduled*

### Flagged and never answered

All in `docs/decisions.md` under *Still open*. None is blocking today; each one
bites in a specific phase.

- [ ] **Five notification kinds or six.** Six are built. §6 says five.
- [ ] **Overlap never fires when a track becomes mutual** — the seed-time case,
      which is the app's first impression. Phase 2.
- [ ] **Swap landing versus the unique constraint** — can silently make `landed`
      unreachable, and §7.5 calls it the only feedback loop in the product.
      Phase 4.
- [ ] **Counterpart notification copy** for `guide` and `lend` was invented and
      marked as invented. Wants a read-through.

The fifth, *No email provider*, is the blocker listed above rather than a
separate question.

---

## Where we are, and what is next

Written at the end of the session of **7 August 2026**, updated **8 August**.
Steps are strictly ordered unless noted — each one below is genuinely blocked by
the one above it.

### 0. Commit and push — **done**

Branch `reset-flow-and-screen-correctness`, **5 commits ahead of local `main`**,
all pushed, working tree clean.

| | |
|---|---|
| `446a51d` | Password reset, magic link removed, auth rate limiting, screen correctness |
| `a4bd90b` | Fix the intent sheet being unclickable |
| `9c61891` | Wordmark at 36, new tagline, wider auth pages |
| `2acb43f` | This section |
| `64eb1da` | Labels into the fields, one column, one control size |

**`origin/main` was fast-forwarded to `64eb1da` on 8 August**, which settles the
question the deploy was waiting on. Local `main` is stale at `a2e0788`, five behind;
`git branch -f main origin/main` catches it up.

Git identity was not configured at all and had to be set repo-locally to
`MsAeF <baladsheen@gmail.com>` to match existing history. It is **not** global,
so a fresh clone elsewhere will hit the same wall.

### 1. Click through the React layer — **done**

Driven in real Edge via `playwright-core`, installed in the session scratchpad
rather than the project, so `package.json` is untouched. No browser download —
it used the installed Edge through the `msedge` channel.

**It found one blocking bug, now fixed in `a4bd90b`.** Picking a film opened the
intent sheet *behind* the still-open search dropdown, which is `absolute z-10`
against a sheet in normal flow. The sheet was completely covered and swallowed
every click, so **nothing could be added to a list at all**. It typechecked, it
built, and all 21 Phase 1 server assertions passed the whole time the feature
was dead. That is the argument for this step existing.

Verified working: sign-up → onboarding → capture → TMDB search → intent sheet →
optimistic add → undo (row removed, still gone after reload, window closes at
10.1s) → resolve *Seen it → Go back? Yes* → `go_back_to` with return count 1 and
the action flipping to *Been back again* → the go-back-to correctly staying in
the live list (§5.2) → all four `/me` tabs tracking both `aria-current` and the
URL. No console errors. No horizontal overflow at 320px on `/sign-in` or `/me`.
Nothing on screen uses the amber accent, which is correct — none of it is
overlap state.

Test accounts were removed from Neon afterwards.

### 2. Upstash and Resend credentials — **done**

Both created and **verified against the live services**, not just present in the
file. Upstash: a real pipelined `INCR`/`EXPIRE` against
`special-gorilla-208577.upstash.io` in London — counter 1 → 2, TTL 60s, test key
removed. Resend: an intentionally unsendable request returned 422 rather than
401, proving the key authenticates without sending anything.

Preflight went 3 problems → 1. The survivor is `BETTER_AUTH_URL`, which only the
deploy can resolve.

⚠ **Development now sends real email.** With `RESEND_API_KEY` in `.env.local`,
reset links no longer print to the `npm run dev` terminal — they go to the inbox.
Comment the key out to get terminal logging back.

Original note, kept because the reasoning still applies:

Both were previously filed *after* the deploy, on the reasoning that a URL nobody
has been given needs neither rate limiting nor recovery email. That reasoning was
sound and it is now overridden: `scripts/preflight.mjs` fails a production build
without them, deliberately, because both failures are invisible once deployed.
Two accounts, three values, and they gate everything below.

- **Upstash** — `console.upstash.com`, create a Redis database, ideally
  `eu-west-1` or `eu-west-2` to sit near the functions. Copy
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the *REST API*
  panel. No code change: `lib/rate-limit.ts` speaks to the REST API directly.
- **Resend** — `resend.com/api-keys`, one key, sending permission only. Leave
  `EMAIL_FROM` unset for now and it uses the shared sender; see *Blocking before
  the next deploy* for what that costs.

### 2b. The reset chain, proven end to end — **done**

8 August. An account was created on `baladsheening@gmail.com` through
`/sign-in` → *Create an account* → onboarding, a film added and resolved, then a
password reset run for real: request → email delivered to the inbox from
`onboarding@resend.dev` → link followed → new password set → signed out
everywhere (`revokeSessionsOnPasswordReset`) → signed back in. The obsolete
password was tried first and correctly refused.

That closes the chain nothing had ever exercised: Better Auth → `lib/email.ts` →
Resend → a real inbox. **It also means a human has now seen the signed-in app** —
see the section below, which is left in place for what it says about the
sessions that preceded it.

Still in the dev database: one abandoned `reset-test-…@example.com` row from
7 August, no profile, no entries. `docs/plan.md` claimed test accounts had been
cleared; that one was missed. Harmless, and unremoved because nothing is deleted
here without asking.

### 3. Deploy to Vercel — **done, 8 August**

**Live at `https://again-msaef.vercel.app`**, imported from GitHub so every push
to `main` deploys from here on. Verified from outside: `/sign-in` renders,
`/` and `/me` both redirect to it while signed out, and `X-Vercel-Id` reports
`lhr1` — `vercel.json` took effect.

**The build succeeding is itself the credential check.** `scripts/preflight.mjs`
fails a production build without Upstash, without Resend, or with a localhost
`BETTER_AUTH_URL`. It passed, so all three are set correctly in the project.
`BETTER_AUTH_URL` was set to the predicted domain before the first build rather
than after it, so the deploy-then-set-then-redeploy dance never happened.

⚠ **Production and development share one Neon database.** `DATABASE_URL` was
copied from `.env.local`, so the account made locally works on the live site and
anything added on either appears on both. Fine for one person; wants separating
before anyone else joins, or a stray test row becomes real data.

Original instructions, kept for the next deploy:

### 3b. Deploy to Vercel — how

Import `baladsheening/Again` in the Vercel dashboard. `main` is already at the
branch tip, so it deploys as it stands, and every later branch gets a preview —
the rehearsal this step never got.

Env vars, all environments: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
`TMDB_READ_ACCESS_TOKEN`, the two Upstash values, `RESEND_API_KEY`, and
`BETTER_AUTH_URL`. Region `lhr1` comes from `vercel.json`, to match Neon in
`eu-west-2`.

**`BETTER_AUTH_URL` is the awkward one**: it cannot be known until the first
build finishes, and preflight rejects a production build that still says
localhost. So set it to the URL you expect (`https://again-….vercel.app`), let
the build run, then correct it and redeploy if it came out different. Between the
two builds auth does not work — nobody has the URL, so the cost is zero, but do
it in one sitting.

### 4. Verify on a phone — **started**

8 August: loaded on iPhone Safari and looks right. That is the first time any of
this has rendered on hardware, and it clears the crudest failure — that the
layout simply breaks on a real screen.

The five things actually worth testing are still untested, because each needs a
deliberate action rather than a look. In likelihood order:

- [ ] **Tap into a field.** Does Safari zoom and stay zoomed? The 16px-on-touch
      rule exists for this and has never been exercised.
- [ ] **Yes/No with a thumb**, on the resolve question. The one mistap in the app
      that cannot be undone after ten seconds.
- [ ] **Landscape with the keyboard up** — is the top of the form still
      reachable?
- [ ] **Notch and home indicator**, both orientations.
- [ ] **The `/me` tabs at narrow width** — wrap, or fall off the edge?

Has to follow the deploy, which is why it is not folded into step 1. The whole
responsive layer was reasoned from specs and confirmed in compiled CSS, and has
never run on hardware. Check specifically: that iOS really stops zooming on
focus, that the notch and home indicator are clear in both orientations, and
that Yes/No cannot be mistapped with a thumb.

This is also the first chance to look at the signed-in app at all — see *Read
this before judging the visuals again*.

### 5. Phase 2

Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'`.
Where the value is.

---

## Decided, not yet built

Two calls made in conversation on **8 August 2026**. Neither is in the brief, so
both are written up in `docs/decisions.md` — the reasoning is there, the work is
here. They are small, and they are not blocked by the deploy.

### A resolved entry stops reading "Want to see"

`components/entry-row.tsx:55` renders `spec.wantLabel` on every state, and all
four `/me` tabs share the row. So a go-back-to says "Want to see" beside a return
count and a *Been back again* button, and an archived `done` says it about a film
nobody wants any more.

**Render it only while `state = 'want'`.** Nothing takes its place: the tab
already names the collection, and on the live list — the one view where `want`
and `go_back_to` are mixed (§5.2) — the return count is what tells them apart,
which is the job §11 gives it.

The state model does not move. `done` is still archived and private, `fixture` is
still reachable only from the `own` intent, and a go-back-to is still a want
(§5.2). Only the label changes.

### The return count does not say what it is

Found on 8 August, by the person who commissioned it asking "what's the 1?".
§11 calls this the signature element of the entire product, and it does not
explain itself to anyone who has not read the brief. Three separate faults:

- **Nothing on screen names it.** A bare mono numeral beside a title.
- **The tooltip is false.** `components/return-count.tsx:10` sets
  `title="Been back 1 times"` on an entry you have been back to **zero** times.
  Ungrammatical at 1, and wrong at every value.
- **The screen reader reads the same thing** — `{count}` plus a `sr-only`
  "times".

The count means **times experienced**, not times returned:
`lib/db/entries.ts:185` sets it to 1 on resolve — *"an experience you would go
back to has been had once, by definition"* — and *Been back again* makes it 2.
That is the better meaning and it stays: a list of fresh go-back-tos all reading
`0` would be a poor signature. So this is a wording fix, and "been back" is the
part that has to go.

**Decided 8 August, and it removes the question of a label.** The count comes off
the live list entirely and appears only on the **Go-back-tos** tab. Asked "what's
the 1?" in a list of things not yet seen, it had no context to answer with. On a
tab of nothing but go-back-tos, sorted by it, the column explains itself — and it
is closer to §11's own wording, *"the return count beside each go-back-to"*, than
showing it in a list of wants ever was.

The tooltip and screen-reader text still need correcting where the count does
live. "Been back" stays wrong at every value.

### A satisfied want is ticked, and sinks

Decided 8 August. In the live list, an entry resolved to `go_back_to` gets a
**tick** and moves **below every want not yet satisfied**, rather than holding its
place by creation date.

This is what makes the other two changes safe, and it is worth being explicit
about why. Removing "Want to see" and removing the return count would, between
them, have left a go-back-to in the live list with **no mark distinguishing it
from an unwatched want at all** — same title, same year, same everything. The
tick and the position replace both signals with two that are easier to read than
either: state is carried by where the row sits, and confirmed by one known icon.

§5.2 is untouched. A go-back-to is still a want and still appears in the live
view; it simply sorts after the unsatisfied ones instead of among them.

**The change is to `orderFor` in `lib/db/entries.ts:57`,** which currently returns
`desc(createdAt)` for the live view — wants and go-back-tos interleaved by age.
It wants a satisfied-last key first, then `desc(createdAt)` within each group. One
statement, still one query, still paginated (§10).

The `go_back_tos` tab keeps its own order — `desc(returnCount)`, then
`desc(resolvedAt)` — which is unaffected and correct. The tick is a live-list
affordance only; on a tab where everything is satisfied it would mark nothing.

### The wrong-password message is styled as an aside

`components/sign-in-form.tsx:134` renders it `text-muted text-sm` —
`--color-muted` is `#8a8a85`, the quietest value in the system and the one used
for de-emphasised metadata. The only failure message in the product is set in the
colour reserved for things that do not matter.

Two things make this more than a class change:

- **One state carries both outcomes.** `message` holds the error *and* the
  neutral notice at line 58 ("if that address has an account, a reset link is on
  its way"). Anything that distinguishes errors visually has to split them first
  — a kind alongside the string, not a colour on the existing element.
- **There is no error colour.** `app/globals.css` defines bg, surface, text,
  muted, rule and accent, and that is all. §11's rule is specifically that amber
  marks overlap state and nothing else, so amber is out — but a new `--color-…`
  token is a change to the visual system and wants deciding, not assuming.

**Cheapest correct fix, if no new colour is wanted:** full-strength `text-text`
at body size rather than muted small. That alone would have made it read as a
failure. A red is defensible and is a bigger decision.

### A private one-line note on an entry

Allowed, **owner only**. Never on `/u/[handle]`, never in overlap, never in any
aggregate.

What it needs:

- **The identifier is `note`.** `no-restricted-syntax` in `eslint.config.mjs:11`
  fails the build on `review`, and correctly — see `decisions.md` for why this
  is not the thing §4 bans.
- One nullable text column on `entries`, `npm run db:generate` after, and a
  bounded Zod schema at the boundary (§10).
- Read and write through `lib/db/entries.ts` on the `SessionUser`, like
  everything else (§3).
- **It must never enter the shared projection.** Carried forward to Phase 2
  below, because that is where the projection gets written.

Where it is offered — inside the resolve question, or on the row afterwards — is
not decided and is small.

---

## Read this before judging the visuals again

**Resolved on 8 August 2026** — an account exists and the signed-in app has been
seen. Kept because the section explains where the visual work up to that point
came from, and because it took ten minutes of real use to produce three findings
that months of reasoning had not.

What it said, and why it was right:

**There was no account to sign in with, so the signed-in app had never actually
been looked at by a human.** Every visual judgement made so far — the wordmark, the
type scale, the tagline, the eye toggle, and then a second session on
placeholders-as-labels, one control size and the chevron (`64eb1da`) — is of
`/sign-in`, because that is the only page reachable without an account.

Two sessions of visual work have now gone into the one page §12 calls the least
of it.

Unseen by anyone but the browser driver: the capture box and its search results,
the intent sheet, entry rows, **the return count** (§11 calls it the signature
element of the whole product), the resolve flow, and the `/me` tabs.

~~To get in: the dev database has one pre-existing user; if that is yours and the
password is gone, the reset link prints to the `npm run dev` terminal.~~ Both
halves of that are now wrong. The pre-existing user was an abandoned test row,
not anyone's account — and with Resend configured, reset links go to the inbox
rather than the terminal. *Create an account* on `/sign-in` is the way in, and is
what was used.

---

## Blocking before the next deploy

**None of these can now reach production silently.** `scripts/preflight.mjs`
runs before `next build` and fails a production build if the first, third or
fourth is missing. Previews and local builds print the same findings and carry
on. The gate sits before the deploy because two of these failures are invisible
after it: an unlimited limiter looks healthy, and a broken reset only announces
itself to someone already locked out.

- [ ] **Upstash credentials.** Code needs nothing —
      `lib/rate-limit.ts` talks to the REST API directly. Two values, from
      `console.upstash.com` → the database → *REST API*, into the Vercel project
      as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. §10 lists rate
      limiting as non-negotiable from the first commit, and it now guards
      sign-in, sign-up and password reset, not just the TMDB proxy.
- [x] **Vercel function region `lhr1`**, to match Neon in `eu-west-2`. In
      `vercel.json`.
- [ ] **`BETTER_AUTH_URL`** set to the deployed URL — it cannot be known until
      the first build finishes, so this is a deploy-then-set-then-redeploy.
      Preflight rejects a production build that still points at localhost, since
      every reset link is built from this value.
- [ ] **Email provider — Resend, chosen 8 August.** `lib/email.ts` is written
      against their REST API and needs `RESEND_API_KEY`. `EMAIL_FROM` is
      optional: unset, it uses Resend's shared sender, which needs no domain and
      ⚠ **delivers only to the address that owns the Resend account.** That is
      enough to prove reset works and not enough for a second person, so a
      verified domain is required before anyone else signs up.

---

## Carry-forward register

Things that must land in a **specific** later phase. Each was a real decision,
not an oversight — the reasoning is in `docs/decisions.md`.

### Phase 2

- [ ] **Overlap must fire when a track becomes mutual.** §6 only runs the
      fan-out on entry insert and state change, so two people who already hold
      matching wants and *then* start tracking each other produce nothing. This
      is exactly the seed-time case — §13's dozen friends all joining in a week
      and backfilling before the graph is complete. Fix: call the same
      `lib/overlap.ts` fan-out from the track mutation, scoped to that pair.
- [ ] **§13 test one:** another user's `done` entries are never returned.
      `listEntriesForOtherUser` exists and is written for it.
- [ ] **Decide what a person is called before `/u/[handle]` exists.** Raised
      8 August: *people who know you should see your name; the handle is for
      strangers who land on your page.* The groups half of that idea is later
      (see `docs/decisions.md`), but this half is Phase 2 and cannot wait —
      `/u/[handle]` is the page being built, and retrofitting an identity rule
      means revisiting every surface that names a person.

      Half of it already exists and is unused: `profiles.display_name` is
      collected at onboarding, stored, and already preferred over the handle in
      `lib/overlap.ts:210`. Nothing renders it anywhere else, because nothing
      that renders people exists yet.

      The question is what "knows you" means at Phase 2, when the only relation
      is a track. Mutual track = name, otherwise handle, is the obvious reading
      and matches §5's existing shape. Worth stating before it is assumed.
- [ ] **The private note must not reach `/u/[handle]`.** When
      `listEntriesForOtherUser` gains its projection, `note` stays out of it —
      and out of any type that projection returns. Same shape as the `done`
      exclusion: nothing fails, nobody notices, and the guarantee is gone.

### Phase 3

- [ ] **The push worker must not fire inside the 10-second undo window.** Undo
      currently deletes the row, which is fine while notifications are in-app
      only. Once push exists, an undone typo would still buzz someone's phone.
- [ ] **Resolve five notification kinds or six.** §6 says five, the schema and
      §8 say six. Six are built.
- [ ] Notification copy for the counterpart side of `guide` and `lend` was
      invented and marked as such in `notificationCopy`. Wants a read-through.

### Phase 4

- [ ] **Swap landing versus the unique constraint.** If a swapped-in item is one
      the receiver already has an entry for, the insert is a no-op — so the
      giver can never receive a `landed`, which §7.5 calls the only feedback
      loop in the product. Current intent is on-conflict-do-nothing; not
      decided.
- [ ] **§13 test two:** swap items stay hidden until both sides commit.
      `getSwap` exists and is written for it.

### Phase 5

- [ ] **TMDB attribution.** A licence condition of the free key, currently
      unimplemented. Belongs in `/settings`: the required sentence plus their
      logo, less prominent than your own branding.
- [ ] iOS requires home-screen install for push to work — surface that clearly
      in settings rather than hiding it (§12).
- [ ] **Inputs are 14px, and iOS Safari zooms on focus below 16px.** Pre-dates
      this — the 15px body already crossed the line — but it first becomes
      visible when the app is on a phone. Fix is 16px inputs, *not*
      `maximum-scale=1`, which kills pinch zoom.

### Correct on every screen — built, not yet verified on hardware

The reasoning is in `docs/decisions.md`; five utilities in `app/globals.css`
carry it. Built and confirmed in the compiled CSS:

- [x] **Safe-area insets** — `gutter` and `safe-bottom` on every page container,
      plus `env(safe-area-inset-top)` on the nav header so the rule reaches the
      screen edge while its content clears the notch.
- [x] **iOS zoom on focus** — `input-text` is 14px, 16px on a coarse pointer.
      The type scale now differs by input device; that was the design decision.
- [x] **Touch targets** — `control-box` grows to 48px on touch; `tap-target`
      gives a 44×44 hit area to text controls without moving layout. Yes/No
      widens to `gap-5` on touch so the two areas cannot overlap.
- [x] **The nav at 320px** — handle truncates, everything else `shrink-0`. The
      `/me` tabs wrap rather than scroll.
- [x] **Landscape with the keyboard up** — `my-auto` on an inner wrapper instead
      of `justify-center`, so overflowing content stays reachable.

- [ ] **Verify on real devices.** Still outstanding and still the point. Nothing
      in this app has ever run on a phone. Specifically worth checking by hand:
      that iOS genuinely stops zooming on focus, that the notch and home
      indicator are clear in both orientations, and that Yes/No cannot be
      mistapped with a thumb.

### Unscheduled

- [x] ~~The React layer of Phase 1 has never been exercised.~~ Done — driven in
      a real browser, one blocking bug found and fixed. See step 1 above.
- [ ] **Nobody has looked at the signed-in app.** Distinct from the item above:
      the interactions are verified, but a human has still only ever seen
      `/sign-in`. See *Read this before judging the visuals again*.
- [ ] **`/settings` does not exist.** Three things now want it: TMDB attribution
      (a licence condition), the iOS install note, and changing a password you
      *do* know — reset only serves the case where you have forgotten it, so a
      signed-in user currently has no way to change their password at all.
- [ ] **Reset rate limiting is per IP, not per email address.** A distributed
      attacker could still fill one person's inbox. The fix means reading the
      request body in `app/api/auth/[...all]/route.ts`; deliberately not built.

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
