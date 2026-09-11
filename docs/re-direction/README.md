# Again product direction

Status: active documentation index. Updated 11 September 2026.

The product is no longer defined by the film-first implementation or by the
accumulated visual experiments in this directory. The active product truth is
small on purpose, and **it is read in this order**:

0. [product-truth.md](product-truth.md) is one page and wins over every other
   document in the repository, this one included. Read it first and read nothing
   else if that is all the time there is.
1. [consumer-product-strategy.md](consumer-product-strategy.md) defines the
   audience, promise, core loop, Release 1 boundary, launch evidence, product
   anti-goals, how Again is paid for, and what must be fixed and published
   before any research-mission claim is made.
2. [implementation-spec.md](implementation-spec.md) defines the build and data
   requirements. Amendment 10 applies the strategy to the existing technical
   specification; it wins wherever earlier amendments disagree.
3. [current-code-audit.md](current-code-audit.md) records how the current
   implementation compares with the active Release 1. It is written after each
   substantive product reset, not treated as a build plan.
4. [view.md](view.md) is the outside read of the plan that caused this reset,
   kept verbatim with amendments. It is a source document and not a to-do list;
   its *Where it landed* table maps each point onto the two documents above.

`CLAUDE.md` continues to own engineering invariants: privacy enforcement,
database access, session handling, validation, transactionality, testing, and
responsive quality. It is not a competing product strategy.

## Historical and implementation records

The following files are retained because they contain valuable migration,
interaction, and safety reasoning. They are **not** sources of new product
scope. When one conflicts with the active strategy or Amendment 10, the active
documents win.

**Still in this directory**, because each one carries engineering constraint
that is live — a runbook with steps outstanding, or device findings nothing else
records. Each is banner-marked and none proposes product scope.

| File | Role now |
|---|---|
| `phase-1-capture.md` | Capture implementation register and interaction history. CLAUDE.md requires reading it before touching Phase 1 |
| `phase-2-convergence.md` | Convergence implementation register; parts of it are still unbuilt |
| `the-handshake.md` | Contact-request implementation record. QR and blocking are still open in it |
| `the-rail-and-the-keyboard.md` | A reverted session's account. Its rail half is deferred; its **iOS keyboard and viewport findings are live and are recorded nowhere else** |
| `vocabulary-migration.md` | Vocabulary migration runbook, with one stage outstanding |

**Moved to [`inactive/`](inactive/) on 11 September**, because their product
scope is superseded and a document in an active folder gets opened. Nothing in
them is deleted or downgraded as *reasoning*; they are simply no longer in the
path of somebody deciding what to build.

| File | Why it moved |
|---|---|
| `inactive/product-direction.md` | Original pivot rationale, superseded by the strategy |
| `inactive/implementation-of-product-implementation.md` | Original sequencing rationale, superseded by Amendment 10 and §13 |
| `inactive/phase-0-production-migration.md` | Completed migration runbook, nothing outstanding |
| `inactive/the-front-page.md` | Superseded front-page exploration. Its browse half, image-only tiles and opening count are **deferred out of Release 1**; retain only for reusable interaction findings |

Do not start a new feature from one of these files alone. Start with the product
truth, find the corresponding requirement in the implementation specification,
then consult the historical record only for constraints already earned in the
build.
