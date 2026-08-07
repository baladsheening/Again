# Again

A web app for keeping a personal record of things you've tried and would return
to, and a list of things you want to try — where the interesting event is when
your list and a friend's list touch.

Each person keeps two things: **wants** (not yet done) and **go-back-tos** (done,
and they'd do it again). Nobody writes reviews — the go-back-tos list *is* the
recommendation, the way a bookshelf tells you more than a list someone writes for
you. People **track** each other. When two people who track each other
independently want the same thing, both are told, because that's a plan waiting
to happen.

The entry test for a go-back-to is not a rating. It is: *would I go back?*
Ranking is by how many times you actually have.

v1 is films only.

## Documentation

| | |
|---|---|
| [`docs/plan.md`](docs/plan.md) | Build order, current state, and what must not be forgotten |
| [`docs/decisions.md`](docs/decisions.md) | Why things are the way they are, and what is still open |
| [`CLAUDE.md`](CLAUDE.md) | The rules for building — read before changing anything structural |

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
