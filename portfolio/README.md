# Portfolio index

This directory is for a reader deciding whether GatherGrove's engineering holds up, not for the
author picking up where they left off: that residue lives in [`../docs/`](../docs/) instead. Every
number and claim below traces to a specific file, a specific command, or a named decision; where
that trace does not exist, the document says so instead of asserting the number anyway. See
[`ENGINEERING-LOG.md`'s Known compromises](./ENGINEERING-LOG.md#known-compromises) for the
trade-offs and bugs found while building this, each with the file, the reasoning, and what fixing it
would cost.

## Files

| Document | Length | Covers |
|---|---:|---|
| [README.md](./README.md) | n/a | This index |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 289 lines | The four backend projects, request pipeline, multi-tenancy, payments, real-time, and deployment topology, each with a Mermaid diagram |
| [ENGINEERING-LOG.md](./ENGINEERING-LOG.md) | 353 lines | The decisions behind the architecture, including the SQL Server → PostgreSQL migration with commit hashes, and a full "Known compromises" accounting |
| [SECURITY.md](./SECURITY.md) | 145 lines | Tenant isolation, auth, payment idempotency and webhook verification, and the GDPR account-deletion feature, including that its dedicated security test suite has no `.csproj` and has never run |
| [METRICS.md](./METRICS.md) | 133 lines | Every headline number, split into what was independently re-counted for this pass versus what is carried forward from the project's own prior claims |
| [TESTING.md](./TESTING.md) | 137 lines | The boundary-mocking rule, suite-by-suite structure across four platforms, which backend test projects never run, and the local quality gate |
| [ENGAGEMENT-ANALYTICS-SCHEMA.md](./ENGAGEMENT-ANALYTICS-SCHEMA.md) | 146 lines | One subsystem's schema in detail, including a header table marking which of its seven tables actually reached the database |
| [ENGAGEMENT-ANALYTICS-ERD.md](./ENGAGEMENT-ANALYTICS-ERD.md) | 395 lines | Entity-relationship diagram for the same subsystem |
| [screenshots/](./screenshots/) | 11 images | The 11 captures embedded in the root README and this directory's documents |

[`../docs/`](../docs/) holds the working residue instead: sprint plans, per-story implementation
guides, superseded coverage reports, SEO research, and dated E2E bug logs, indexed at
[`../docs/README.md`](../docs/README.md).
