# Again -- consumer product strategy

Status: active product direction. Updated 11 September 2026.

This document is the consumer-product tiebreaker. It deliberately speaks about
the value a person receives, not the database objects used to provide it. The
implementation specification translates these decisions into build constraints.

## 1. The decision in one sentence

> Again turns the private things I want to do into real-world opportunities when
> someone I trust wants the same thing.

The product is a private possibility record with a social action layer. It is
not a general social network, public wish-list site, catalogue, recommendation
feed, marketplace, or dating product.

## 2. The user and the job

Again initially serves people who already have trusted relationships -- friends,
partners, households, colleagues, or a small community -- and who regularly
notice things they may want to do, visit, try, see, learn, or buy.

Their job is:

> When something catches my attention, help me save it in seconds. When it
> becomes a shared possibility with someone I know, help us make it real.

Capture has standalone value: it reduces the cost of remembering. The social
layer must add a second, stronger value: it turns a forgotten someday into a
concrete reason to contact somebody or make a plan.

## 3. The promise and the USP

Consumer-facing promise:

> Save what you want to do next. When someone you trust wants the same thing,
> Again helps you make it real.

The promise ends on the action deliberately. An earlier wording said Again
"lets you know" when a capture is something you could do together, and that
stops at the coincidence: it promises a notification, which is the weakest
thing this product does. The sentence a person reads has to carry the same
payoff as the decision in section 1, or the surfaces get built to satisfy the
smaller claim.

The distinction is important. A Notes app stores an intention. A discovery app
shows possibilities. A messaging app carries a conversation. Again connects a
person's own intention to a trusted person's independently held intention, then
makes the next real-world action easy. It is a possibility network rather than
a conventional social network: the thing that travels between people is
something somebody might do, never a post, a status, or an audience.

The name earns its place when a shared experience becomes something to do
again, together, or for the first time.

## 4. The core loop

```
Worldly cue -> instant capture -> exact shared relevance -> one-tap invitation
or message -> real-world plan -> more useful future captures
```

Each step is necessary.

- **Worldly cue:** a recommendation, place, object, event, conversation, or
  passing thought gives the person a reason to open Again.
- **Instant capture:** natural-language input saves without a category,
  catalogue result, image, or further decision.
- **Exact shared relevance:** Again tells mutually connected people about a
  genuine overlap while preserving their private records.
- **One-tap action:** the overlap offers a respectful bridge into the person's
  normal communication channel, for example a pre-filled message proposing the
  shared activity. Again does not need to build chat, a calendar, RSVPs, or
  payments to earn this payoff.
- **Real-world plan:** success is a useful conversation, plan, or shared
  experience, not an opened notification.

This is a healthy habit loop, not a compulsion loop. No streaks, unread-count
pressure, endless feeds, or generic re-engagement notifications are permitted.
An opt-in service notification for a new mutual match or a contact request is
permitted because it completes an action the user already values.

## 5. Release 1: the smallest product that proves the promise

Release 1 is a trusted-group beta. It must prove capture, connection, and
action before it grows into local discovery or stranger matching.

It includes:

1. A writing-first capture surface. Any useful wording can be saved immediately;
   suggestions enrich it but never decide whether it is valid.
2. A durable personal record that is obvious to reach and makes a saved capture
   feel confirmed.
3. A reciprocal way to add a known person: a handle, invitation link, or QR is
   only transport; the recipient must accept and neither list is exposed by the
   request.
4. Exact, explained convergence between mutually connected people. A match is
   the same resolved possibility or the same normalised wording; wording alone
   must never be presented as certainty about the real-world thing.
5. An explicit, comprehensible friend-matching consent model. Creating a mutual
   connection must explain that independently written captures can produce a
   one-line overlap. The current matching state and an individual lock must be
   easy to find, not discoverable only by a gesture.
6. A post-convergence action that helps the person leave Again and contact the
   other person. It is an invitation to act, not an in-app conversation system.
7. A limited, earned push/service-notification path for new contact requests and
   new mutual convergences. Permission is requested only after its value is
   understandable; it never carries a generic return prompt.

Release 1 explicitly excludes:

- a global or random browse rail;
- image-only tiles, opening counts, and any popularity proxy;
- a public feed, likes, comments, followers, scores, or streaks;
- automatic semantic matching or opaque compatibility scores;
- public people discovery or stranger matching;
- chat, scheduling, calendars, RSVPs, payments, checkout, affiliate behaviour,
  or retailer ranking;
- claims of worldwide catalogue or local-event coverage.

The record stays one tap away at most. A discovery surface may return only when
it can state an actionable reason for every item. There are three admissible
shapes, and an item that cannot carry one of them does not appear:

- "Because you saved 'try pottery'." -- the person's own record;
- "Available near you this week." -- a sourced, current, local opportunity;
- "Three things you and Maya could do." -- the trusted-relationship layer.

The third is the one Again is uniquely able to say, and the only one that comes
from the relationships rather than from the person's own history or a location
feed. A discovery surface that can offer only the first two has not used the
thing that separates Again from a notes app with a search box. It carries one
condition: it may restate **only overlaps both people have already been told
about**. A pair reason computed from the other person's unconverged captures
discloses what somebody else wrote to somebody who was never told, which the
matching rules forbid and no ranking exemption reaches.

None of the three may displace capture or masquerade as a recommendation feed.

## 6. Launch wedge and proof

The first public promise is not "meet like-minded strangers." It is "make your
existing relationships more likely to turn shared interests into real plans."

Before a broad launch, choose one named, high-density beta community and one
socially actionable context. The choice might be a friendship network in a
single city, a university society, a workplace community, or a group organised
around outings. It must be made deliberately; a universal catalogue is not a
substitute for network density.

The risk most likely to end the beta is that nothing overlaps. Free wording
matched exactly is safe and explainable, and it is also sparse: two people have
to independently want a comparable thing, write it in comparable words or
resolve it to the same possibility, and already be mutually connected. The
honest early expectation is very few convergences per person per month. That is
an argument for a dense, context-rich community, not for loosening the matching
rule -- inferred similarity is excluded because a wrong match damages trust
faster than a missing one, and a product whose first social event is
embarrassing does not get a second. Watch the meaningful-overlap rate from the
first week: if it is near zero inside a genuinely dense group, the fault is the
wedge or the capture prompt, not the exactness.

The beta has passed only when real people can repeatedly complete this path:

1. save several genuinely useful captures;
2. add at least a few trusted people;
3. receive an overlap they regard as accurate and welcome;
4. use the action to start a real conversation or plan; and
5. return because the record or the relationships became more useful.

Primary measures are capture success and time, reciprocal-connection rate,
meaningful-overlap rate, overlap-to-message or plan rate, privacy confusion,
false-positive reports, and qualitative evidence that an interaction would not
otherwise have happened. Raw opens, notification clears, and time spent are not
success metrics.

## 7. What comes after proof

Only after Release 1 earns repeat use:

1. **Selected sharing and individual invitations.** Make one possibility easy to
   send intentionally, without confusing receipt with independent overlap.
2. **Narrow, sourced local opportunity.** Launch one area and a bounded supply
   of current events, places, or occurrences. Every result needs a source,
   freshness, and an explanation of why it appears.
3. **Contributed catalogue.** Grow shared world records from consented evidence,
   with provenance, duplicate protection, moderation, and no claim of complete
   coverage.
4. **Opt-in stranger matching.** This is a separate safety product, requiring
   adult eligibility, two-sided reveal, block, report, unmatch, and a proof that
   private lists cannot be inferred.

## 8. Trust and safety

Trust is an acquisition feature. A match may itself disclose something personal,
so privacy controls must be understandable before a sensitive capture can
create a social event. A person must be able to stop friend matching, lock one
capture, remove a connection, and later block/report without losing their own
record.

## 9. How Again is paid for

The revenue model is not an open question, because the product's own anti-goals
close it. There is no advertising: an ad business needs attention metrics, an
engagement feed and inferred taste, and all three are excluded. There is no data
sale: the asset is a private record, and selling it destroys the only promise
the product makes. There is no marketplace, affiliate revenue or retailer
ranking. What is left is that the people who get the value pay for it, so
**Again is funded directly by its users.**

Two constraints on that, both derived rather than chosen:

1. **The loop is never paywalled.** Capture, the personal record, adding a
   trusted person, convergence, and the action that follows it are free for
   everybody, permanently. Charging for any of them prices out exactly the
   density the product depends on -- a paid connection is a connection that does
   not get made, and a convergence behind a paywall withholds the one moment the
   product exists for. Anything priced sits outside the loop.
2. **What may carry a price is undecided, and it is the product owner's call.**
   The candidates are a voluntary supporter subscription with no functional
   gate, a tier of conveniences that cannot affect matching, and a tier for
   organised groups. Each has to be tested against constraint 1 before it is
   built. None is a Release 1 decision, and no Release 1 surface may be shaped
   around an unchosen one.

## 10. The research mission

Again may support medical research out of that revenue. Until all five of the
following are fixed and published, **no public claim may be made at all** --
not on the sign-in wall, not in a store listing, not in marketing:

- **A share of revenue, not of profit.** Profit is an accounting outcome a
  private company can shape, and a percentage of it is not a verifiable
  commitment. Revenue is countable and can be audited from outside the company.
- **The percentage,** fixed in advance and stated as a number.
- **The recipient,** named, with the mechanism: a fund, a named institution, or
  a registered charity.
- **The cadence** of contribution, and of publication.
- **The verification:** who reports it, how often, and where a person can read
  the figure without having to ask.

Three of those five are open and are the product owner's to set: the percentage,
the recipient, and the reporting arrangement. The first and the fourth are
decided here.

The mission is never a retention mechanic. It may not appear in a notification,
a prompt to return, a streak, a progress bar, an upgrade dialogue, or an
onboarding step a person has to pass through. The product must be worth using
with the mission taken off the screen entirely; the mission is what makes that
use consequential, not what persuades somebody into it.

## 11. Product decision rules

Before approving a feature, answer all three questions:

1. Does it reduce the effort to capture a real intention, reveal a trustworthy
   shared possibility, or help turn that possibility into an offline action?
2. Can the person understand what data is shared, why it is shown, and what the
   next control will do?
3. Does it strengthen the trusted-group loop without becoming an attention feed
   or expanding into a separate product category?

If the answer is no, defer it. Craft matters, but no visual experiment is more
important than proving the capture-to-real-world-action loop with real people.
