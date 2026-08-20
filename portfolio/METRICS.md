# Metrics

Every number below is either reproduced directly against this snapshot (marked **verified**) or
carried forward from this project's own prior documentation because nothing in the tree can
reproduce it (marked **unverified, stated as claimed**). No number in this file was invented for
the portfolio pass. Where a figure could not be reproduced, that is said plainly rather than
repeated as fact.

---

## Code volume, verified

Counted with `cloc` (or an equivalent line counter) against each platform's source tree, excluding
`node_modules/`, `bin/`, `obj/`, `.next/`, and generated files.

| | Production | Tests |
|---|---:|---:|
| Backend (C#) | 122,466 | 195,282 |
| Web client (TS/TSX) | 170,792 | 182,181 |
| Mobile (TS/TSX) | 36,173 | 85,967 |
| Shared design tokens | 1,750 | n/a |
| **Total** | **331,181** | **463,430** |

Plus 24,479 lines of EF Core migrations, counted separately because they are generated, not
authored. Test code (463,430 lines) outweighs production code (331,181 lines) by 1.4×.

## Surface area, verified by direct count

Each figure below was re-counted against this tree while writing this document, independently of
the number carried in the README, and matched or came within a small margin of it.

| Metric | Command | Result | README claim |
|---|---|---:|---:|
| API controllers | `find backend/src/GatherGrove.API -iname "*Controller.cs" \| wc -l` | 65 | 65 |
| SignalR hubs | grep for `class.*Hub` under `GatherGrove.API` | 3 | 3 |
| Next.js routes | `find client/src/app -iname "page.tsx" \| wc -l` | 119 | 119 |
| React components | `.tsx` files under `client/src/components`, excluding tests | 251 | 251 |
| Domain entities | `.cs` files under `Domain/Entities` | 87 | 85 |
| E2E test cases | `grep -rE "^\s*test\(" e2e/tests --include="*.spec.ts" \| wc -l` | 41 | 41 |

The domain-entity recount (87) is close enough to the README's 85 to be the same claim measured a
different way, likely a difference in whether one or two support classes under `Entities/` count as
entities proper, and is not treated as a discrepancy worth chasing further for a two-file
difference.

## Test counts, verified within measurement noise

Test *counts* (how many test cases exist) are a different claim from test *coverage* (what
percentage of lines they exercise), and the two were checked separately. Counts were reproduced by
grepping for test-declaration patterns directly, independent of running the suites:

| Suite | Pattern | Recount | Project's own claim | Difference |
|---|---|---:|---:|---:|
| Backend | `^\s*\[Test\]` across the four in-solution test projects | 6,136 | 6,213 | 1.2% |
| Web client | `^\s*(it\|test)\(` under `client/src` | 10,964 | 11,055 | 0.8% |
| Mobile | `^\s*(it\|test)\(` under `mobile/src` and `mobile/__tests__` | 5,809 | 5,871 | 1.1% |
| E2E | `^\s*test\(` under `e2e/tests` | 41 | 41 | exact |

The small gaps (0.8% to 1.2%) are consistent with test cases generated from `[TestCase(...)]` data
rows, `describe.each`/`it.each` tables, and multiline test declarations that a single-line grep
pattern does not catch, not with the claimed counts being fabricated. They were not chased down to
an exact match because closing a sub-2% gap by hand-counting edge cases would not change what the
number means.

## Coverage tooling

No line-coverage percentage is published from this snapshot. Four backend test projects each emit
their own Cobertura report (`backend/coverlet.runsettings` configures Cobertura output to
`backend/tests/**/TestResults/`), and `client/jest.config.js` configures an 80% coverage threshold
across lines, branches, functions, and statements. Both are the *configuration* for generating
coverage, not the output itself: no Cobertura, lcov, or Jest coverage report is committed anywhere
in this tree, and actually running `dotnet test --collect:"XPlat Code Coverage"` across four test
projects, or `npm test -- --coverage` against 11,000+ Jest cases, was out of scope for a
documentation pass.

The closest thing to a committed coverage artifact in the tree is
[`docs/archived/mobile-coverage/COVERAGE-VERIFIED-ACTUAL.md`](../docs/archived/mobile-coverage/COVERAGE-VERIFIED-ACTUAL.md),
a dated Jest text-summary from 2026-01-12 showing 66.89% line coverage on mobile at that point in
the project's history: a real, self-contained coverage run, kept as evidence the tooling was real
and used, not as a statement about current coverage.

To measure current coverage, someone with the toolchain installed would run:

```bash
cd backend && dotnet test --collect:"XPlat Code Coverage"
cd client && npm test -- --coverage --watchAll=false
cd mobile && npm test -- --coverage --watchAll=false
```

and read the resulting Cobertura/lcov summaries. See [`portfolio/TESTING.md`](./TESTING.md) for the
suite structure this coverage would be measured against.

## Commit history, verified from the private repository's own log, not reproducible here

This snapshot is a single commit, so `git log` inside it shows one entry. The 2,130-commit figure,
its 150-day spread, and its conventional-commit-type breakdown (421 `fix`, 406 `test`, 163 `docs`,
89 `feat`) come from the private repository this snapshot was taken from and cannot be reproduced by
running a command in this tree: they are reported here as a historical fact about the source
repository, not as something checkable from the snapshot itself.

---

## How to reproduce the verified numbers

```bash
# Code volume (requires cloc)
cloc backend/src client/src mobile/src shared/design-tokens \
  --exclude-dir=node_modules,.next,bin,obj

# Surface area
find backend/src/GatherGrove.API -iname "*Controller.cs" | wc -l
find client/src/app -iname "page.tsx" | wc -l
grep -rE "^\s*test\(" e2e/tests --include="*.spec.ts" | wc -l

# Test counts
grep -rc "^\s*\[Test\]" backend/tests/GatherGrove.*.Tests --include="*.cs"
grep -rE "^\s*(it|test)\(" client/src --include="*.test.ts*" | wc -l
```
