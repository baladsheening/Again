# Plan

The build order from §12, with state. Update this as phases move — it is the
only place the sequence lives outside the brief itself.

`docs/decisions.md` holds *why*. This holds *where we are* and *what must not be
forgotten*.

**Ship each phase to Vercel before starting the next** (§12). A phase is not
done because the code exists.

---

## Status

| Phase | Scope | State |
|---|---|---|
| 0 — foundations | Neon, Drizzle schema + migrations, Better Auth, `lib/db/` convention | **Built, verified against live DB. Not deployed.** |
| 0.5 — account recovery | Password reset, auth rate limiting, `lib/email.ts` | **Built, verified end to end against the dev server and live DB. Blocked on an email provider before it works in production.** |
| 1 — single player | Profiles, input box, entries, live list, resolve flow, return counts, visual system | **Built. Server verified, and the React layer now driven end to end in a real browser — one blocking bug found and fixed. Not deployed.** |
| 2 — two players | Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'` | Not started |
| 3 — overlap | Trigger + notification rows, `/notifications`, `/overlap` picker. In-app only | Not started |
| 4 — swap | Full flow, blind commit enforced in the data layer, `landed` | Not started |
| 5 — PWA + push | Manifest, service worker, VAPID, subscriptions, install prompt | Not started |

§13: the multiplayer half is roughly **80% of the work and 100% of the value**.
Phases 2–4 are the product. Budget accordingly and resist the pull of the part
that is fast to build.

---

## Where we are, and the next six steps

Written at the end of the session of **7 August 2026**. Steps are strictly
ordered unless noted — each one below is genuinely blocked by the one above it.

### 0. Commit and push — **done**

Branch `reset-flow-and-screen-correctness`, **3 commits ahead of `main`**, all
pushed, working tree clean.

| | |
|---|---|
| `446a51d` | Password reset, magic link removed, auth rate limiting, screen correctness |
| `a4bd90b` | Fix the intent sheet being unclickable |
| `9c61891` | Wordmark at 36, new tagline, wider auth pages |

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

### 2. Deploy to Vercel — **next, and blocked on a decision**

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `TMDB_READ_ACCESS_TOKEN` → deploy → set
`BETTER_AUTH_URL` to the resulting URL → redeploy. Region `lhr1`, to match Neon
in `eu-west-2`.

**The decision, unanswered:** production follows `main`, and all of this work is
on a branch. Three options — fast-forward `main` and push; merge the PR GitHub
has already offered; or deploy the branch as a preview first. The third is
probably best given nothing has ever been deployed: a preview is a free
rehearsal for the `BETTER_AUTH_URL` deploy-then-set-then-redeploy dance.

### 3. Verify on a phone

Has to follow the deploy, which is why it is not folded into step 1. The whole
responsive layer was reasoned from specs and confirmed in compiled CSS, and has
never run on hardware. Check specifically: that iOS really stops zooming on
focus, that the notch and home indicator are clear in both orientations, and
that Yes/No cannot be mistapped with a thumb.

### 4. Upstash

Before real users rather than before the first deploy — a URL nobody has been
given does not need rate limiting. See *Blocking before the next deploy* below.

### 5. Email provider

Before real users, same reasoning. Someone who loses their password on a
deployment with no email provider has lost the account.

Steps 4 and 5 can be done in either order, or alongside step 3.

### 6. Phase 2

Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'`.
Where the value is.

---

## Read this before judging the visuals again

**There is no account to sign in with, so the signed-in app has never actually
been looked at by a human.** Every visual judgement made so far — the wordmark,
the type scale, the tagline, the inline field row, the eye toggle — is of
`/sign-in`, because that is the only page reachable without an account.

Unseen by anyone but the browser driver: the capture box and its search results,
the intent sheet, entry rows, **the return count** (§11 calls it the signature
element of the whole product), the resolve flow, and the `/me` tabs.

To get in: *Create an account* on `/sign-in` works and is verified. The dev
database has one pre-existing user; if that is yours and the password is gone,
password reset now works in development — the link is printed to the terminal
running `npm run dev`, since no email provider is configured yet.

---

## Blocking before the next deploy

- [ ] **Upstash credentials.** Rate limiting is written and wired but falls back
      to an in-process Map, which is not protection in serverless. §10 lists it
      as non-negotiable from the first commit. This is the only item on that
      list currently unmet — and it now guards sign-in, sign-up and password
      reset, so the fallback is protecting the account boundary, not just the
      TMDB proxy.
- [ ] **Vercel function region `lhr1`**, to match Neon in `eu-west-2`.
- [ ] **`BETTER_AUTH_URL`** set to the deployed URL — it cannot be known until
      the first build finishes, so this is a deploy-then-set-then-redeploy.
- [ ] **Email provider** (Resend or Postmark). Password reset goes through
      `lib/email.ts`, which logs in development and throws in production. Until
      it is chosen, a deployed user who forgets their password has no way back
      into their account. The hardest of the four — the others degrade the
      deployment, this one loses accounts.

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
