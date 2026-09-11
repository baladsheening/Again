# Again

Again is a private possibility record that turns independently held intentions
into real-world opportunities between people who trust each other. A person can
save what they want to do, try, experience, learn, visit, or buy in natural
language; when a mutual contact wants the same thing, Again helps them take the
next action together.

Release 1 is a trusted-group beta: writing-first capture, reciprocal known-person
connections, exact explained convergence, a respectful post-match action, and
limited earned service notifications. It deliberately does not launch as a
global discovery feed, marketplace, public social network, or stranger-matching
service.

## Documentation

| | |
|---|---|
| [docs/re-direction/product-truth.md](docs/re-direction/product-truth.md) | **One page. The product truth, and it wins over everything else here** |
| [docs/re-direction/README.md](docs/re-direction/README.md) | **Current documentation map and precedence** |
| [docs/re-direction/consumer-product-strategy.md](docs/re-direction/consumer-product-strategy.md) | **Active consumer-product direction, USP, Release 1, and launch evidence** |
| [docs/re-direction/implementation-spec.md](docs/re-direction/implementation-spec.md) | **Normative product and build specification for the re-direction** |
| [docs/re-direction/current-code-audit.md](docs/re-direction/current-code-audit.md) | Assessment of the implementation against active Release 1 requirements, in four buckets |
| [docs/re-direction/view.md](docs/re-direction/view.md) | The outside read that caused the 11 September reset, verbatim, with amendments |
| [docs/re-direction/inactive/product-direction.md](docs/re-direction/inactive/product-direction.md) | Historical original pivot rationale |
| [docs/re-direction/inactive/implementation-of-product-implementation.md](docs/re-direction/inactive/implementation-of-product-implementation.md) | Historical product rationale and sequencing |
| [docs/re-direction/inactive/phase-0-production-migration.md](docs/re-direction/inactive/phase-0-production-migration.md) | Historical migration runbook |
| [docs/re-direction/phase-1-capture.md](docs/re-direction/phase-1-capture.md) | Historical capture implementation register |
| [`docs/plan.md`](docs/plan.md) | Historical film-first build record and migration context |
| [`docs/decisions.md`](docs/decisions.md) | Why things are the way they are, and what is still open |
| [`docs/spec-sheet.md`](docs/spec-sheet.md) | Legacy film-first screen specification |
| [`CLAUDE.md`](CLAUDE.md) | Engineering invariants and migration guidance — read before changing anything structural |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Neon (serverless Postgres) ·
Drizzle · Better Auth · Vercel · TMDB

## The one rule

The database is never reachable from the client. Every query goes through
`lib/db/`, and every function in it takes the authenticated session user as its
first argument and filters on it. There is no Row Level Security in this design
and no backstop, so the privacy guarantees are enforced there and nowhere else.

See `CLAUDE.md` before working around it — the boundary is held up by
`server-only` imports, a branded `SessionUser` type, and an ESLint rule, and all
three are load bearing.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run db:migrate
npm run dev
```

```bash
npm run typecheck
npm run lint
npm run build
npm run db:generate          # after any change to lib/db/schema.ts
```

## Attribution

This product uses TMDB and the TMDB APIs but is not endorsed, certified, or
otherwise approved by TMDB.
