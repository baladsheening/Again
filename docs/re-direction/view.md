# The view

Status: source document. Recorded 11 September 2026.

This is an outside read of the plan, given in full and kept as written. It is
the reason `consumer-product-strategy.md` and Amendment 10 exist, and it is the
general direction the product is heading in: **a possibility network, not a
private capture app with a social feature.**

⚠ **It is a source, not a to-do list.** Most of it has already been applied —
see *Where it landed* at the foot. Read that section before treating any
paragraph here as outstanding work.

⚠ **The text below is the view as given.** Only the terminal's hard line-wraps
were repaired — words it had broken across lines — and no word was changed,
added or removed. My own additions are in *Amendments* underneath, kept separate
so the source stays clean.

---

## The view as given

The core idea is strong, but the plan is currently a better private capture
product than a social/networking product.

The USP should be:

> Again turns private "I want to…" thoughts into real-world plans when they
> overlap with someone I trust.

That is distinctive. Notes captures the thought; Pinterest/Instagram help
discover it; WhatsApp helps arrange it. Again's job is to notice the shared
intention at the right moment and make the next real-world move obvious. It
should be a possibility network, not a conventional social network.

What is excellent already:

- Free-form capture is the right centre. "Save it even if nothing matches" is
  the most important rule.
- Mutual, consented overlap is far more meaningful than followers, likes, or an
  activity feed.
- Preserving original wording, provenance, privacy boundaries, and avoiding
  false certainty are unusually mature choices.
- "Sam too" is a lovely, human expression of the product. It makes the app's
  name earn itself.

The central weakness is that a convergence currently produces a notification,
not an opportunity. Two people both wanting pottery is interesting; a one-tap
bridge to "Want to try this together?" is the payoff. You do not need to build
chat, calendars, RSVPs, or a marketplace. But Release 1 needs one intentional
exit into the real world: a pre-filled message/share action, with the shared
item and a natural prompt. Otherwise the product stops at coincidence.

The other major issue is density. Free text plus exact matching is safe, but it
will yield very few matches — especially before there is a rich, well-resolved
corpus. A broad "everything people might want" product gives you wonderful
long-term scope but weak early network effects. Pick a launch wedge where people
naturally overlap and act together: a real friend group, one city, cultural
outings, food, classes, or a community with existing shared context. Prove that
one small network repeatedly gets from capture to message to real plan before
expanding the taxonomy.

I would also demote the global image rail in the first release. Image-only
tiles, hidden titles, and an opening count borrow the surface grammar of content
apps without yet delivering their value. Random film posters neither reinforce
the capture promise nor make an actionable local opportunity. The opening count
is especially weak: it is neither useful social proof nor a decision aid, and it
muddies your principled rejection of engagement metrics.

A browse rail earns its place only when it can answer one of these:

- "Because you saved 'try pottery'."
- "Available near you this week."
- "Three things you and Maya could do."

Until then, make capture and the user's own record dominant. If you retain
visual discovery, give it information scent — people should not have to tap
every card merely to learn what it is.

For a genuinely habitual product, do not aim for dark-pattern addiction. Aim for
a dependable loop:

worldly cue → instant capture → timely shared relevance → one-tap real-world
action → better future capture

The plan has the first two parts. It needs the latter three more urgently than
more rail polish. In particular, in-app-only convergence is not enough: a
carefully limited push permission, requested after a user understands the value,
is a service notification — not a streak or re-engagement tactic.

Privacy is the other make-or-break point. "Mutual track" is meaningful consent
to connect, but it is not automatically obvious consent to reveal every shared
thought — some captures can be sensitive. A hidden lock gesture alone is too
subtle for that responsibility. Make the matching rule unmistakable during
onboarding and easily controllable: "Ideas you write can create one-line
overlaps with people you both add; lock any idea to keep it out." Keep stranger
matching deferred exactly as the plan proposes.

The essence to borrow from the best products is structure, not their decorative
habits:

- WhatsApp: an arrival should make the next human action obvious.
- Maps/events products: time and place turn an interest into an opportunity.

Your current plan excels at Notes and privacy. It is not yet strong enough on
the WhatsApp/real-world-action layer.

Finally, the cure mission needs its own credible product and business answer.
The documents explain how the app avoids marketplace behaviour, but not how
success funds research. Decide and communicate a verifiable model — e.g. a
defined share of subscription revenue or profits, independently reported. Do not
turn the cause into a retention mechanic. The app must first be useful enough to
deserve love; the mission should make that love consequential.

If I were freezing the strategy into one page, it would be:

> Again is a private place to save what you want to do. When someone you trust
> independently wants the same thing, Again helps you make it real.

That is focused, emotionally legible, socially useful, and large enough to grow
into local opportunity and carefully designed new connections later.

---

## Amendments

Nine, in the order they bear on the build. Each is a place where the view is
right but under-specified, or where following it literally would break something
it is itself protecting.

**A — the pair reason needs a disclosure condition, and without it it is the
most dangerous line in the view rather than the best one.** *Three things you
and Maya could do* is admissible **only over overlaps both people have already
been told about**. Computed from Maya's unconverged captures it becomes *three
of your friends want this*: the app disclosing what somebody else wrote, to
somebody who was never told, about a person who never agreed to say it. The safe
form restates a disclosure that has already happened and adds none. The
distinction is invisible in the copy and total in the code.

**B — revenue, not profit.** The view offers *subscription revenue or profits*.
Profit is an accounting outcome a private company can shape, so a percentage of
it is not a verifiable commitment and fails the view's own *independently
reported* test. Revenue is countable and auditable from outside. Take revenue,
and state the percentage as a number before any claim is made.

**C — the loop is never paywalled.** The view asks for a business answer but not
for its boundary. Capture, the record, adding a trusted person, convergence and
the action after it are free for everybody, permanently. A priced connection is
a connection that does not get made, and density — the view's own second major
issue — is the first thing a paywall removes. Whatever is eventually charged for
sits outside the loop.

**D — say the matching rule twice, and the second time is the load-bearing
one.** The view puts the explanation *during onboarding*. Onboarding is the
moment it has no referent: nothing captured, nobody connected, and a person
trying to get in. State it there, and state it **again at the moment it becomes
true** — when a connection is about to become mutual. That is where somebody is
actually deciding, and it is the disclosure the swipe was never able to carry.

**E — the drafted message carries the person's own wording.** The bridge must
quote the capture as written, never a generated paraphrase. Preserving original
wording is one of the three things the view calls unusually mature; a share
action that rewrites *learn to sail* as *Sailing lessons* breaks it at the one
moment the words leave the app.

**F — the bridge is the system share sheet, not a channel Again picks.** Again
holds no phone numbers and should not start. The share sheet hands the drafted
text to whatever the pair already use, needs no new permission, and asks for no
contact data. Naming a channel means asking for contacts, which contradicts the
privacy stance the view is protecting two paragraphs later.

**G — the rail was already off Home before this was written.** It was pulled on
7 September so the keyboard could be judged with one variable on screen. What
remains is dormant data-layer work — `listRail`, and the `image_path`,
`open_count` and `items_rail_idx` objects. So *demote the rail* is a decision to
**keep**, not one to execute. Do not demote it twice, and do not delete the
dormant columns on the strength of this paragraph; they cost nothing, and the
discovery question is deferred rather than answered.

**H — do not loosen exactness to fix density.** The view is right that exact
matching is sparse, and the fix is a denser wedge rather than fuzzier matching.
A wrong match damages trust faster than a missing one, and a product whose first
social event is embarrassing does not get a second. Watch the meaningful-overlap
rate from the first week: near zero **inside a genuinely dense group** means the
wedge or the capture prompt is wrong, not the exactness.

**I — push is asked for at the first convergence, not at launch.** *After a user
understands the value* has a specific moment, and it is the first convergence
they receive in-app. That is the only point at which the permission dialogue can
be truthful about what it will deliver, and asking earlier spends the one
request on somebody who has nothing to be notified about.

---

## Where it landed

| The view says | Where it now lives |
|---|---|
| The USP, and *possibility network not social network* | strategy §1, §3 |
| Notes / discovery / messaging contrast | strategy §3 |
| A convergence must be an opportunity, not a notification | strategy §4, §5.6; Amendment 10; spec §13 acceptance |
| Pre-filled message, no chat or calendar needed | strategy §4 |
| Density, and the launch wedge | strategy §6 |
| Sparsity as the risk most likely to end the beta | strategy §6 — amendment H |
| Demote the rail and the opening count | Amendment 10; spec §2, §5 |
| The three admissible rail reasons | strategy §5; spec §7 — amendment A on the third |
| Information scent | covered by construction: image-only tiles are an exclusion |
| The dependable loop, not addiction | strategy §4 |
| Limited earned push | strategy §4, §5.7; Amendment 10 |
| Matching consent is not obvious from mutuality | strategy §5.5, §8; Amendment 10; spec §7 |
| The lock must not be a hidden gesture alone | Amendment 10 — it reverses a 4 September decision |
| Stranger matching stays deferred | strategy §5, §7.4 |
| WhatsApp: the arrival makes the next action obvious | strategy §4 |
| Maps/events: time and place make an opportunity | strategy §7.2, occurrences |
| The business answer | strategy §9 — amendments B and C |
| The mission must be verifiable and never a mechanic | strategy §10 — amendment B |
| The one-page freeze | strategy §1 and §3 |

What the view asked for that is **built**: nothing new. What it asked for that
is **unbuilt and now blocks Release 1**: the external action, the consent
explanation and the findable lock, earned push, and convergence on wording.
`current-code-audit.md` has them in the order they should be closed.
