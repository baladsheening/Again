# Again

Again is being redirected into a private-first social app for capturing things
people want to do, try, experience, learn, visit, or buy. People save natural
language intentions first; catalogue suggestions optionally resolve them to
shared possibilities. People who meet can deliberately pair as contacts or
transfer a selected list. Meaningful overlap between mutual tracks comes first,
with sourced local discovery and opt-in distal matching following later.

**Where it stands, 23 August.** Phase 0 — the migration of film entries into
captures and possibilities — is done, deployed and verified. **Phase 1's capture
page is deployed and works on a handset**, so `/` is the page rather than the
poster wall. The target product, release sequence and acceptance criteria live
in docs/re-direction/implementation-spec.md, whose §13 carries a status marker
against every Phase 1 deliverable.

⚠ **One acceptance criterion is still unmeasured**: the four-second capture the
whole design answers to has never been stopwatched, and a desk cannot do it.
docs/re-direction/phase-1-capture.md, *Build status*, is the register — it also
records the two decisions the first handset session reversed: the record is
newest-first, and a line is only as wide as its own words.

## Documentation

| | |
|---|---|
| [docs/re-direction/implementation-spec.md](docs/re-direction/implementation-spec.md) | **Normative product and build specification for the re-direction** |
| [docs/re-direction/product-direction.md](docs/re-direction/product-direction.md) | Original product-direction discussion and rationale |
| [docs/re-direction/implementation-of-product-implementation.md](docs/re-direction/implementation-of-product-implementation.md) | Supporting product rationale and sequencing |
| [docs/re-direction/phase-0-production-migration.md](docs/re-direction/phase-0-production-migration.md) | Phase 0's runbook, and the record of it being run |
| [docs/re-direction/phase-1-capture.md](docs/re-direction/phase-1-capture.md) | **Phase 1: the capture page's design, and what is built of it** |
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
