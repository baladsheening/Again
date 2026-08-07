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
| 1 — single player | Profiles, input box, entries, live list, resolve flow, return counts, visual system | **Built, server verified. React layer unverified. Not deployed.** |
| 2 — two players | Tracks, `/u/[handle]`, §5 visibility in `lib/db/`, copy with `source='copy'` | Not started |
| 3 — overlap | Trigger + notification rows, `/notifications`, `/overlap` picker. In-app only | Not started |
| 4 — swap | Full flow, blind commit enforced in the data layer, `landed` | Not started |
| 5 — PWA + push | Manifest, service worker, VAPID, subscriptions, install prompt | Not started |

§13: the multiplayer half is roughly **80% of the work and 100% of the value**.
Phases 2–4 are the product. Budget accordingly and resist the pull of the part
that is fast to build.

---

## Blocking before the next deploy

- [ ] **Upstash credentials.** Rate limiting is written and wired but falls back
      to an in-process Map, which is not protection in serverless. §10 lists it
      as non-negotiable from the first commit. This is the only item on that
      list currently unmet.
- [ ] **Vercel function region `lhr1`**, to match Neon in `eu-west-2`.
- [ ] **`BETTER_AUTH_URL`** set to the deployed URL — it cannot be known until
      the first build finishes, so this is a deploy-then-set-then-redeploy.
- [ ] **Email provider** (Resend or Postmark). Magic link logs to console in
      development and throws in production, so nobody can sign in by link on a
      real deployment until this is chosen.

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

### Unscheduled

- [ ] The React layer of Phase 1 — input box, intent sheet, optimistic
      rollback, tab navigation — has never been exercised. Needs a human or a
      browser.

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
