# The phase checks — verified 31 August 2026

⚠⚠ **THIS IS A SNAPSHOT, NOT A REGISTER.** It was true when it was written and
every line of it is checkable. It is deliberately **not** the place any of this
is owned:

| what | who owns it |
|---|---|
| phase scope and exit criteria | **§13 of `docs/re-direction/implementation-spec.md`** — normative |
| engineering rules and what was built | **`CLAUDE.md`** |
| why a decision went the way it did | **`docs/decisions.md`** |
| what state production is in | ⚠ **nothing. Ask it** — `npm run migration:state`, `scripts/prod-check.sh` |

That last row is the one that has cost real money: a confident, stale register
cost roughly eighteen hours of 500s on 25 August. **If this file and the tree
disagree, the tree is right and this file is out of date.**

---

## Where the phases stand

Release 1 is Phases 0–2. **Phases 3–6 are each a separate launch decision, and
none has been started** — verified against the schema and the routes, not
against the previous table.

| Phase | State |
|---|---|
| **0 — product and data migration** | Done, deployed, verified (22 Aug) |
| **1 — capture** | Built, deployed, in daily use. **Four items outstanding**, none of them a screen that does not work |
| **2 — friend convergence** | ⚠ **The design sequence is COMPLETE (31 Aug)** — console, swipes, portal, mark — **and the gate that made all of it inert is open.** Two items left in §13 |
| **3 — proximity transfer** | Nothing. No transfer session and no QR or pairing code anywhere in the tree |
| **4 — emergent catalogue** | Nothing. No candidates, claims, confidence states or moderation queue in the schema |
| **5 — location discovery** | Nothing. No geolocation, no offer or occurrence records |
| **6 — distal matching** | Nothing, and correctly so — gated behind adult verification, consent, blocking, reporting and moderation |

---

## What changed since the last check

**Five things, and two of them were bugs that had been live for a fortnight.**

1. **Phase 2 step 4 — THE MARK is built.** A bar in the record's gutter,
   `--color-accent`, on every line that has ever converged, and **it does not
   empty**. *The portal is arrival; the mark is memory.* ⚠ Its read has **no
   `read_at` term**, and that absence is the mark — adding one deletes the only
   durable record that a convergence happened.

2. ⚠⚠ **NOTHING COULD CONVERGE AT ALL, and now it can.** `addCapture` never set
   `visibility`, the column defaults to `private`, `runOverlap` requires
   `SHARED_SCOPES`, and **`setCaptureVisibility` had no caller outside the
   tests**. *Share visibility* was a named Phase 2 deliverable that was never
   built. Production held **79 captures, all private, 0 notifications**. The
   engine, the portal and the mark were all correct and all downstream of a shut
   gate. **Directed fix:** a self-written capture is shareable when written; a
   copied one stays private; a per-capture **lock** takes a line out of the pool.
   Recorded as **Amendment 2** to the specification. The 79 were backfilled.

3. ⚠ **The swipe changed verb: it carries the LOCK, and crossing off is the
   console's ×.** Directed — crossing off is rare, locking is the valuable act,
   so the reflex gesture follows the frequency. The mechanism is untouched: the
   same signs, the same detent at the row's own height, the same arbitration. **A
   padlock in the row's tail is the gesture's only confirmation**, because iOS
   has no Vibration API.

4. ⚠⚠ **There was no way to sign out on a desktop.** `profile-panel.tsx` kept
   `rail:hidden` from the days when `shell.tsx`'s rail carried a duplicate; Phase
   1 deleted the rail and the correction stayed, so at 720px and up the only way
   out of an account was gone. **Fixed by deleting one variant.** Its orphans
   `foot-collections` and `foot-bare` went with it, and a warning now stands at
   the top of `globals.css`: every mention of `shell.tsx` or the rail below it is
   history.

5. **The portal reads `notifications`, and two accounts prove the chain.**
   `tests/portal.test.ts` and `tests/mark.test.ts` — including the suppression
   rule seen from a surface, and the mark outliving the portal emptying.

---

## Phase 1's four outstanding items

None is a screen that does not work. `docs/re-direction/phase-1-capture.md` is
the register.

1. **The vocabulary migration** — deferred by direction, and the **only
   non-additive** one in the phase. When it runs, `PUBLIC_STATES` is re-derived
   rather than renamed.
2. **A `kind` that is not a film.** `Kind` names `film | book | place | object`
   and **every possibility in the database is a film**, because TMDB is the only
   catalogue. It is why **Have** is a word in the tray nothing can reach.
3. **A Blob store** for the photographs, which are built and dark behind
   `BLOB_READ_WRITE_TOKEN`. Money, not code.
4. **The five-second criterion** — *open, typed into and closed in under five
   seconds, one-handed.* Accepted by direction, judged good on hardware, **never
   stopwatched**.

*(The thing detail view was the fifth and was closed on 30 August by the
console.)*

---

## What Phase 2 still has not got

- **The QR/code contact handshake** that creates mutual tracks. Nothing in the
  tree.
- **Possible-match prompts** for unresolved, normalised-equal captures — no
  notification until each person confirms the resolution.

The **overlap list and detail** are delivered: the portal is the list and the
console is the detail.

---

## Two constraints on what "done" means, unchanged

- **Overlap joins on `possibility_id` and TMDB is the only catalogue**, so today
  two people can converge on a film and on nothing else. Phase 4 widens it.
- **The legacy tree still stands beside the new one by design** — `entries`,
  `swaps` and `captures.legacy_entry_id` are retained to verify the Phase 0
  migration against its own source, and they are retired by their own migration.

---

## Live, and known

- ⚠ **The desktop regression, deferred by you.** It followed the ink lift; the
  first suspect is the chrome going up with the text when only the text was
  reported, and one line out of `globals.css` backs it out. Still open.
- ⚠ **Phase 2 has never fired for a real person.** Production holds **one account
  and no tracks**, so every convergence this phase has produced was produced by a
  fixture. The next thing that tests the product rather than the code is a second
  account.
- **Recorded, not fixed:** the sign-out pill is ~30px against `--tap-floor`'s 44
  (40px on the desk). Pre-existing since 18 August, and it is the only way out of
  an account. The fix is `tap-target`'s pseudo-element, not a bigger pill.
- **Recorded, not fixed:** `--mark-width` is `2.5px` like `--caret-width`, so the
  convergence mark does **not** scale with the desk's four-thirds. Never looked
  at on a real desk.
