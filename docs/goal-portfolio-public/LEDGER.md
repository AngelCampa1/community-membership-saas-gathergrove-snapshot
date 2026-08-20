# Goal: Portfolio-public — restructure the snapshot for a reader

> Make this snapshot readable by a skeptical senior engineer who gives it ninety seconds.
> Promote the retrospective, evidence-backed write-ups out of `docs/` into a root `portfolio/`
> directory so they are visible in GitHub's file listing without scrolling. Leave the working
> residue — plans, sprint notes, superseded reports — in `docs/`, labelled for what it is.
> Remove committed tooling output and machine-local paths. Fix every inbound link that moves.
>
> The honesty is the asset. Nothing in this pass softens an admission of failure, and no claim
> goes in that cannot be checked against the tree.

## Method

1. Inventory the tree: every markdown file, every embedded image, every committed artifact.
2. Sort each document into **portfolio** (retrospective, reader-addressed, finite, every claim
   traceable) or **docs** (prospective, self-addressed, dated, open-ended). When in doubt, it
   stays in `docs/`. A thin honest `portfolio/` beats a padded one.
3. Verify before promoting. A document only moves if its claims survive being checked against
   source. Where a promoted document overstates, annotate it in place rather than quietly
   correcting it.
4. Move with `git mv` so history follows; then grep for every inbound reference and fix it.
5. Judge images as a viewer, not by filename. Reject error states, empty states, and anything
   that makes the product look broken.
6. Re-verify: no dead links, no machine-local paths, no committed tooling output.

## Cycle log

### Cycle 1 — 2026-08-13 — Inventory and verification

- Read the tree. Fourteen markdown files at portfolio-candidate level, eleven images embedded in
  the root README, six committed tooling dumps.
- Checked inbound references to all six dumps before touching them: zero, in every case.
- Checked the README's thirteen-month arc against `portfolio/ENGINEERING.md`: nine months on SQL
  Server, cutover 2026-02-17, five-week `DateTimeKind.Utc` tail. Consistent in both places, with
  commit hashes in the write-up. Left as written.
- Checked the README's Known-gaps section: still states the DI registration gap, the
  `Application → Infrastructure` inversion, the coverage shortfall against the project's own
  earlier claims, and the unpublished mobile app. All still honest. No change.
- Confirmed `e2e/screenshots.mjs` still scans rendered text for error and loading states and
  still detects an unexpected `/login` bounce, rather than reporting success whenever navigation
  did not throw. Not modified.

### Cycle 2 — 2026-08-13 — Build `portfolio/`, rewire the README

- Created root `portfolio/` and moved four documents into it with `git mv`.
- Fixed all inbound links in the moved files and in the README.
- Added the three surfacing mechanisms to the README: a repository-map code fence with a
  `portfolio/` entry, a two-column Documentation table, and inline `→` callouts in the sections
  that have a deeper write-up.
- Replaced the hero image and corrected one caption that promised more than its image showed.

### Cycle 3 — 2026-08-13 — Hygiene

- Removed committed tooling output and rewrote machine-local absolute paths as repo-relative.
- Rewrote `docs/README.md`, which indexed two directories that do not exist in this snapshot.

## Findings registry

**P0 = broken or blocking · P1 = looks bad or confusing · P2 = polish**

- **F-01 (P1, FIXED): `docs/README.md` was an index of files that do not exist.** Fifty-five of
  its link lines pointed into `docs/user-stories/` and `docs/status/`, neither of which is in this
  snapshot. Every one of those links was dead. It was the second file a reader would open.
  Rewritten as an accurate index of what `docs/` actually contains, pointing at `portfolio/`
  first.

- **F-02 (P1, FIXED): committed tooling output.** Six files of raw test, lint, and inventory
  output were sitting in the tree, three of them tracked. Nothing in the repository cited any of
  them as evidence — checked by grep before removal — so none had the standing that would justify
  keeping raw output as backing for a metric. Removed.

- **F-03 (P1, FIXED): machine-local absolute paths in documentation.** Twenty-seven occurrences
  across six documents, plus three developer scripts that hardcoded a home directory and
  therefore only ever ran on one machine. Rewritten as repo-relative, or resolved at runtime from
  `$PSScriptRoot` / `$env:USERPROFILE`.

- **F-04 (P1, FIXED): the hero image contained an empty state.** The first image on the page is
  the highest-leverage asset in the repository, and the bottom third of it showed a zeroed
  engagement panel with a red `0.0%` average score, plus a floating badge from outside the
  application overlapping the corner. Cropped to the top half, which shows real seeded data —
  member counts, upcoming events, and plan usage — and nothing broken. The full capture is kept.

- **F-05 (P1, FIXED): a caption promised what its image did not show.** The white-label branding
  caption claimed "colors, logo, custom domain, live preview". The image shows no uploaded logo
  and no custom domain, and it does show a contrast warning and a brand-consistency score.
  Rewritten to describe the live preview and its inline warnings, which is both accurate and the
  more interesting thing about the screen.

- **F-06 (P1, FIXED): a promoted schema document specified more than was built.** Of the seven
  tables in the event engagement analytics schema, three are mapped, three have entity classes
  but no `DbSet`, and one has neither — it exists only as a heading. The four that never landed
  are exactly the four the original draft marked "(NEW)", and three of them appear on the
  README's own list of unmapped domain entities. Rather than trim the document, added a header
  table naming the state of each table with the `DbSet` line numbers, so the document now
  corroborates the README's known gap instead of contradicting it.

- **F-07 (P1, FIXED): the deployment playbook describes a system that never existed.** It is
  dated before the project's first commit, deploys to IIS and nginx rather than Railway and
  Cloudflare Workers, runs SQL Server backup and restore procedures the project moved off in
  February, submits mobile builds to two app stores that were never submitted to, and lists five
  role email addresses for a team of one. Left in `docs/` rather than promoted, and given a
  header saying all of this plainly. Not rewritten: correcting it would invent a deployment
  history that did not happen.

- **F-08 (P2, OPEN): a badge from outside the application appears in every admin screenshot.**
  A circular image badge overlaps the bottom-right corner of all nine authenticated captures,
  next to the app's own connection-status pill. It is cropped out of the hero. The remaining
  captures still carry it. Removing it properly means re-capturing with a clean browser profile,
  which is out of scope for this pass.

- **F-09 (RETRACTED): committed .NET build artifacts.** Initially recorded as a hygiene problem
  after finding machine-local paths inside generated `obj/` files. Checked against the index:
  zero `obj/` or `bin/` files are tracked. They are local build output, already ignored, and
  never reach the published repository. No action needed, and the finding was wrong.

### Cycle 4 — 2026-08-14 — Second review pass: the disclosure was incomplete

A second reviewer established that the "three broken screens" framing in Cycle 3 understated the
problem, and that the DI disclosure was imprecise. Both findings were checked against source
before writing anything.

- **F-10 (P0, FIXED): ten live endpoints hard-403, not just degrade, and were undisclosed.**
  `UnlimitedTierRequirementHandler.cs:32` reads `User.FindFirst("sub") ?? FindFirst("userId")`,
  and the JWT minted at `AuthService.cs:435` carries only `ClaimTypes.NameIdentifier`. The claim
  is never present, so the handler fails closed on every call. It backs the `"UnlimitedTier"`
  policy (`Program.cs:664-665`), gating `AnalyticsController.cs:69,92,114,138,163` and
  `EngagementController.cs:37,83,122,158,210`. A sibling handler,
  `Application/Authorization/UnlimitedTierHandler.cs`, reads a `ClubId` claim that does exist and
  works, but backs a differently named policy, `"UnlimitedTierRequired"`. Added to the README's
  Known-gaps section and to `portfolio/ENGINEERING.md`'s Known-compromises section, with the file,
  line, and endpoint list.

- **F-11 (P0, FIXED): the same claims bug recurs at three more sites the record did not name.**
  `AnalyticsController.cs:39` and `EventEngagementController.cs:231,401` carry the identical
  `FindFirst("sub") ?? FindFirst("userId")` pattern already present at
  `MemberEngagementController.cs:69,272`. Five call sites in total. Added alongside F-10.

- **F-12 (P0, FIXED): the DI disclosure named one dead composition root and there are two.**
  `AddInfrastructure()` (documented already) is one. `AddApplicationServices()`
  (`Application/Extensions/ServiceCollectionExtensions.cs:23`) registers `ILoginActivityService`
  and is a second, separate one — checked directly: it is not called anywhere in this codebase,
  including test setup. Also added: `IMemberSegmentationService` has no implementing class
  anywhere in `src/`, confirmed by search, so registering it under either composition root would
  not make `MemberSegmentationController` work. Both corrections went into the same two bullets as
  F-10/F-11.

- **F-13 (P1, FIXED): `tests/Domain/Domain.Tests.csproj` does not compile.** Verified by running
  `dotnet build` against it directly: nine `CS0117` errors, all `ExportFormat.Csv`/`.Pdf`/`.Json`
  against an enum whose real members are `CSV`/`PDF`/`JSON`
  (`Domain/Enums/ExportEnums.cs:20-23`). The prior record said the two out-of-solution test
  projects "do not run under `dotnet test`," which is true but understates `Domain.Tests`
  specifically — it is bit-rotted, not merely excluded. Verified `LoginActivityFunctionalTest`
  builds clean by comparison (0 errors). Also confirmed and added: `tests/Application/Services/`
  (four files, including a test that instantiates a nonexistent `MemberSegmentationService`) and
  `tests/unit-tests/MemberEngagementControllerTests.cs` sit outside any `.csproj`, not just outside
  the `.sln`.

- **F-14 (P1, FIXED): `docs/images/admin-members.png` is a login screen.** Opened it directly: it
  shows "Welcome back," email/password fields, and Google/Apple SSO buttons — a public login page,
  not an admin members interface. It was not embedded anywhere in the README or `portfolio/`, so
  no caption needed correcting. Removed rather than renamed, since nothing referenced it.

- **F-15 (P1, FIXED): `client/public/screenshots/mobile-dashboard.png` is a placeholder.** Opened
  it directly: logo wordmark on a white background, no application UI. No other capture exists in
  the tree to substitute. Removed. `client/public/manifest.json` still lists this path under its
  PWA `screenshots` array; that file is application source, not documentation or an image, so the
  reference was left in place rather than edited. It will 404 until someone either fixes the
  manifest or re-captures the asset.

- **Correction to Cycle 2/3's framing:** the "Deliberately not done" note below, written in Cycle
  3, says the claims-bug screen was "already recorded in the README's Known-gaps section." Checked
  against the README as it stood at the start of this cycle: it was not. No bullet named the
  claims bug, a file, a line, or an endpoint count. The three-screens framing itself came from an
  outside reviewer's brief, not from anything in this repository's own history that I could find.
  Not correcting the note below, since it is a dated log entry, not a live claim — but the gap is
  now closed by F-10/F-11 above.

- **Not verified, and said so rather than guessed: the 42.6% / 63.2% / 73.6% coverage figures.**
  The README's own account of the backend number describes summing four Cobertura reports keyed on
  source file and line. Reproducing that union was out of scope for this pass, same as it was for
  the reviewer who flagged this gap. The figures are left as written because nothing found here
  contradicts them, not because they were re-derived.

### Cycle 5 — 2026-08-14 — Link audit: twenty dead markdown links

Ran a repo-wide markdown link checker (root-relative, encoded, and code-fence links classified
separately and excluded as false positives). It found twenty `MISSING` links, none in `README.md`
or `portfolio/` — both were already clean. Checked first whether any pointed at the two screenshots
`git rm`'d earlier today (the deleted `docs/images/admin-members.png` and
`client/public/screenshots/mobile-dashboard.png` from F-14/F-15) or at the dangling
`client/public/manifest.json` entry cleaned up afterward: none did. All twenty are unrelated,
pre-existing dead links, not fallout from that cleanup.

- **F-16 (P1, FIXED): `docs/unlimited/README.md` pointed its "User Stories Documentation" and
  "Technical Implementation" sections at five files — a roadmap and four phase-based story
  documents — that do not exist anywhere in this snapshot's history; only the initial commit ever
  touched this directory, so nothing was deleted. The real, numbered user stories that were
  actually tracked and built live in `docs/unlimited/user-stories/` (US-001 through US-012), with
  status tracked in two sibling documents in the same folder. Rewrote both sections to point at
  those instead, and said plainly that the original phase-by-phase outline does not match how the
  work was ultimately organized.

- **F-17 (P1, FIXED): two `.codex/skills` files carried a relative link that only resolves one
  directory up from where it was pasted.** `arrange/SKILL.md` and `typeset/SKILL.md` each reference
  a design-reference doc using a path that is correct only inside `frontend-design/SKILL.md`, which
  has its own sibling `reference/` folder — `arrange/` and `typeset/` do not. Retargeted both links
  to point into `frontend-design/reference/` where the real files live.

- **F-18 (P2, FIXED): a payment-links user story cited a completion report that was never
  committed.** `docs/01-improvements-05-09/event-charging/event-charging-02-payment-links.md`
  linked a per-story completion report; no such report exists anywhere in the tree, for this story
  or any other in the same folder. Removed the link line; the Definition-of-Done checklist above it
  already substantiates the completed status without it.

- **F-19 (P1, FIXED): `docs/e2e-testing/README.md` and `docs/e2e-testing/templates/README.md`
  linked a directory structure — `automation/`, `test-execution/`, `guides/` — that was never
  built.** Only `infrastructure/` (Docker Compose files, no setup doc), `scripts/` (two shell
  scripts), and `templates/` (one test-case template) actually exist under `docs/e2e-testing/`.
  Rewrote the Quick Start list in the parent README to point at what is really there, and removed
  the "Related Documentation" / "Related Resources" sections in both files outright rather than
  substitute a plausible-looking link, since nothing in the tree stands in for a testing index,
  deployment checklist, or CI/CD doc.

### Cycle 6 — 2026-08-18 — Portfolio-standard compliance pass

Brought this repository into line with the shared `PORTFOLIO-STANDARD.md` spec that now governs
all fifteen `*-snapshot` repos: exact heading set and order, `portfolio/` house style, image
location, and prose wrap width.

- Converted the README's status disclosure and byline/license teaser from plain prose into
  `> [!IMPORTANT]` and `> [!NOTE]` alerts, added `## Contents` and `## If you read one thing`
  (README is now 515 lines), and reordered sections into the spec's required sequence — `What it
  does` and `Architecture` now precede the numbers and the engineering narrative, which they
  followed before.
- Added the required `## Built with AI agents` section. Verified what actually survives the squash
  to one commit (nothing per-commit) rather than inventing an attribution percentage; cited the
  concrete, checkable enforcement in `.githooks/pre-commit` and the boundary-mocking rule instead.
- Moved the 11 screenshots actually embedded in the README from `docs/images/` to
  `portfolio/screenshots/` and rewrote the image grid as HTML `<table>` markup per the spec's grid
  pattern, replacing two-column Markdown table cells that ran 200–470 characters. Left the three
  unreferenced, error-state captures (`admin-analytics.png`, `admin-dashboard.png`,
  `admin-member-segments.png`) in `docs/images/` as working evidence, and updated `docs/README.md`'s
  description of that directory to match.
- Compared every image against the equivalent capture in the private source repository
  (`D:\code\GatherGrove\docs\images\`) before moving anything: file sizes differ slightly (a
  different seed run), but the same screens, including the same two error states, so nothing
  stronger was available to harvest.
- **F-20 (P1, FIXED): `portfolio/` had no index and was missing two required files.** Created
  `portfolio/README.md`, `portfolio/METRICS.md`, and `portfolio/TESTING.md`. Renamed
  `ENGINEERING.md` to `ENGINEERING-LOG.md` per the spec's name-resolution table and fixed all five
  inbound links (`README.md` ×4, `ARCHITECTURE.md` ×2, plus one in
  `docs/deployment/deployment-playbook.md`); left the two historical mentions in this ledger's own
  earlier cycles unchanged, since they are dated log entries describing a past state, not live
  navigation.
- **F-21 (P0, FIXED): the 42.6% / 63.2% / 73.6% coverage figures were being restated as fact with
  no reproduction check, which Cycle 4 had already flagged as unverified and left open.** Checked
  the tree directly for a committed coverage artifact (Cobertura XML, lcov, Jest JSON summary):
  none exists — coverage output is gitignored, same as `bin/`/`obj/`/`node_modules/`. The only
  coverage evidence actually in the tree is
  `docs/archived/mobile-coverage/COVERAGE-VERIFIED-ACTUAL.md`, a dated Jest run from 2026-01-12
  showing 66.89%, seven months before this snapshot and 6.7 points off the 73.6% now claimed.
  Rewrote the README's coverage section and `portfolio/METRICS.md` to say plainly that these three
  figures are carried forward from the project's own `CLAUDE.md`, not independently confirmed by
  this pass, and to show the exact commands that would confirm them.
- **F-22 (P1, FIXED): re-counted five of the README's own headline numbers independently, without
  trusting the prior figure.** API controllers (65), Next.js routes (119), React components (251),
  and E2E test cases (41) matched exactly by direct recount. Domain entities recounted at 87
  against a claimed 85 — a two-file gap, not chased further. Test *counts* (not coverage) for all
  three platforms were recounted by grepping test-declaration patterns directly: backend 6,136
  against a claimed 6,213 (1.2% gap), web client 10,964 against 11,055 (0.8%), mobile 5,809 against
  5,871 (1.1%) — consistent with table-driven tests a single-line grep under-counts, not with the
  claims being fabricated. Recorded all of this in `portfolio/METRICS.md` rather than silently
  trusting or silently correcting the prior numbers.
- **F-23 (P0, FIXED, new): created `portfolio/SECURITY.md`**, required by the spec for any repo
  touching PII or payments and previously absent. While researching it, found that a **second,
  larger set of orphaned tests exists beyond the ones already documented**: the root `tests/`
  directory holds 30 C# test files with no `.csproj` anywhere in that tree, so none of them have
  ever compiled or run — including `tests/Account.Deletion.TDD/Security/AccountDeletionSecurityTests.cs`,
  the only test file in the repository that specifically probes the GDPR account-deletion feature
  for self-deletion enforcement, tampered-JWT rejection, and SQL-injection resistance. Two further
  account-deletion test files (`tests/gathergrove-api-tests/`,
  `tests/gathergrove-application-tests/`) are in the same condition. Added a bullet to the README's
  Known gaps and a full accounting in `portfolio/SECURITY.md`, rather than treating the untested
  security surface as covered because test files with the right names exist.
- Fixed trailing whitespace on 11 lines of `portfolio/ENGAGEMENT-ANALYTICS-ERD.md` and added the
  missing final newline to both `ENGAGEMENT-ANALYTICS-ERD.md` and `ENGAGEMENT-ANALYTICS-SCHEMA.md`
  — this repository's only whitespace defects in the corpus-wide review that produced the shared
  spec.
- Reflowed prose to a 100-column hard wrap across `README.md`, `portfolio/ARCHITECTURE.md`,
  `portfolio/ENGINEERING-LOG.md`, and the three new `portfolio/` documents, leaving tables, fences,
  Mermaid diagrams, and HTML markup untouched. Verified afterward with a direct link-and-anchor
  checker run against every Markdown file in the tree: zero missing files, zero missing anchors.
- Confirmed `GatherGrove Assets/` (26 brand/logo files at repository root, outside both `docs/` and
  `portfolio/`) is not misplaced: `mobile/generate-icons.js` reads from it by a relative path
  (`path.join(__dirname, '..', 'GatherGrove Assets', ...)`), documented in
  `mobile/README-ICONS.md`. Left it at root and added one line to the README's repository map
  explaining why, rather than moving it and breaking that script.

### Cycle 7 — 2026-08-18 — Third review pass: orphaned-tests scope, a dead entity cited as
evidence, an unreadable ERD, and a broken screenshot row

A third reviewer checked Cycle 6's new `portfolio/SECURITY.md` and the engagement-analytics ERD
against source rather than against each other. Nine findings, most severe first; all counts below
were re-derived directly rather than trusted from the finding text.

- **F-24 (P0, FIXED): the orphaned-tests disclosure (F-23) named less than a quarter of the
  problem.** Counted directly: the root `tests/` directory holds 96 TypeScript/JavaScript files
  (excluding `node_modules`), 69 of them following a `.test.`/`.spec.` naming convention and
  together declaring exactly 1,592 `it(`/`test(` blocks — both figures confirmed by direct grep,
  not estimated. Only 27 of those 96 files sit in the six directories the finding named
  (`tests/ab-testing`, `tests/security`, `tests/e2e`, `tests/deployment`,
  `tests/quality-assurance`, `tests/client`); the other 69 are spread across `tests/analytics`,
  `tests/Integration`, `tests/Services`, `tests/unit`, `tests/performance`, `tests/auth`,
  `tests/mobile`, `tests/helpers`, and about a dozen loose files directly under `tests/`. Confirmed
  the sub-tree's `package.json` (`gathergrove-deployment-tests`) has independent Jest/Playwright
  scripts, that no `node_modules` was ever installed for it, and that neither
  `.githooks/pre-commit` nor `scripts/check.sh` references it. Confirmed
  `tests/security/auth-security.test.ts` mocks the entire Express app (`mockApp` with four
  `jest.fn()` methods) rather than testing a real boundary, which is exactly what this project's
  own boundary-mocking rule forbids. Rewrote both `README.md`'s Known-gaps bullet and
  `portfolio/SECURITY.md`'s GDPR section to state the real scope, and to say plainly this is a
  build-configuration and dead-code problem, not a breach.

- **F-25 (P1, FIXED): `portfolio/SECURITY.md` cited a dead domain entity as evidence a feature is
  real.** It named the unmapped `AccountDeletionRequest`/`DataExport` domain entities alongside a
  real `EncryptionService` as proof the GDPR feature "is real, not aspirational" — while
  `portfolio/ENGINEERING-LOG.md`'s Known-compromises section already lists both as two of eleven
  entities with no `DbSet`. Verified `UserAccountDeletionService.cs` operates directly on
  `_context.Users` and never references `Domain.Entities.AccountDeletionRequest`; the identically
  named class it does use at `RequestAccountDeletionAsync` is `Application.DTOs.AccountDeletionRequest`,
  an unrelated request DTO in a different namespace. Rewrote the section to rest the feature's
  reality on the controller, the two services, and the encryption pair, and to cross-reference the
  ENGINEERING-LOG disclosure by name instead of contradicting it.

- **F-26 (P1, FIXED): `ENGAGEMENT-ANALYTICS-ERD.md`'s "Relationship Descriptions" section
  re-narrated what the mermaid diagram and the per-entity FK columns already said.** Replaced it
  with "Relationship enforcement," the one thing the diagram cannot show on its own: of the
  diagram's thirteen relationship lines, eight are backed by a real Fluent API foreign key in
  `GatherGroveDbContext.cs` (with cascade/restrict delete behavior stated), and five
  (`Clubs↔FeatureAccessControls` and the four cancellation/timing-analysis relationships) are
  design intent only, because the entity on one end has no `DbSet`.

- **F-27 (P1, FIXED): the same ERD's mermaid diagram was unreadable** — nine entities, up to 40
  attribute rows each, in one block. Split it into a slim relationship-only diagram (entities and
  cardinalities, no attributes) plus ten per-entity Markdown tables (Field / Type / Key), each
  tagged mapped or unmapped against `portfolio/ENGAGEMENT-ANALYTICS-SCHEMA.md`'s mapping table. The
  companion SCHEMA document turned out not to already hold per-entity attribute tables as the
  finding assumed — it has prose "Key Features" bullets, not tables — so the tables were built here
  from the original diagram's own field lists rather than duplicated from elsewhere.

- **F-28 (P1, FIXED): the README's screenshot grid bottom-aligned a short landscape capture under
  roughly 900px of dead space next to a tall portrait phone capture in the same row.** Confirmed
  the pixel dimensions directly: `admin-events.png` is 2880×1800, `admin-dashboard-mobile.png` is
  780×1688. Added `valign="top"` to every `<td>` in both screenshot tables and moved both portrait
  captures (`admin-dashboard-mobile.png` and, for the same reason, `public-homepage-mobile.png` in
  the collapsed "More screenshots" table, which paired with a landscape branding capture) into
  their own full-width rows rather than cropping, since no image-editing tool was available in this
  pass.

- **F-29 (P2, FIXED): `ENGAGEMENT-ANALYTICS-SCHEMA.md`'s honesty disclaimer opened with "What of
  this actually shipped," not valid English.** Fixed to "What actually shipped."

- **F-30 (P2, FIXED): the same document's hand-drawn ASCII box diagram truncated field names with
  ellipses** (`AvgPartic...`, `TotalReg...`, `TotalEventsAtt...`), the only non-mermaid diagram in
  the corpus. Deleted it in favor of a pointer to the ERD document's new mermaid diagrams, which
  now cover the same ground without truncation.

- **F-31 (P2, FIXED): two code samples overflowed their fence with no wrap.** The
  `_logger.LogWarning` call in `portfolio/ENGINEERING-LOG.md` (115 characters) was split across two
  lines at the method-call boundary; the `cloc` command in `portfolio/METRICS.md` (100 characters)
  was given a `\` line continuation. Both now fit under 100 columns.

- **F-32 (P2, FIXED): `ENGAGEMENT-ANALYTICS-SCHEMA.md` and its ERD companion were missed by
  Cycle 6's reflow pass.** The SCHEMA document had a 204-character overview paragraph and two
  overlong blockquote lines; hard-wrapped all three at 100 columns, leaving its table rows
  untouched. The ERD document had no prose over 100 real characters once its multi-byte `↔`
  characters were counted correctly (a byte-length check had produced false positives); no change
  needed there beyond what F-26/F-27 already touched.

- **Re-verified every relative link and `#anchor` in `README.md` and every `portfolio/*.md` file
  programmatically**, resolving each target against the real file tree and the real heading list
  (GitHub slug rules, including duplicate-heading suffixing) rather than by inspection: zero broken
  paths, zero broken anchors, across all files touched in this cycle and all files left alone.

- **Not verified:** whether `backend/database-migrations/event-engagement-analytics-tables.sql`
  (SQL Server dialect — `NVARCHAR`, `IDENTITY`, `GETUTCDATE()`) is the migration that ever actually
  ran, given the project's documented SQL Server → PostgreSQL cutover; it was read for context on
  F-26 but reconciling it against the live PostgreSQL schema was out of scope for this pass. No
  claim in the fixed documents depends on it.
- No secret literal was found during this pass; the `whsec_`/JWT values already on record as test
  fixtures were not re-touched.

## Deliberately not done

- **Three screenshots stay unembedded.** Two of them fail because services they depend on are
  never registered in DI — the same `AddInfrastructure()` gap the README already documents — and
  the third bounces to `/login` because a controller reads JWT claims the issued token does not
  carry. These are real application bugs, they are already recorded in the README's Known-gaps
  section, and fixing application code is outside this pass. They were not re-captured and their
  embeds were not restored.
- **`docs/archived/` stays archived.** The superseded coverage and test-status reports are the
  evidence that the project once claimed numbers it could not reproduce. Deleting them would
  remove the only checkable record of that gap.
- **Azure resource names stay.** They are infrastructure naming, not credentials.

### Cycle 8 — 2026-08-18 — Corpus-wide index column order (`PORTFOLIO-STANDARD.md` §2.5)

- The cross-repo standard fixed `portfolio/README.md`'s index table column order as link,
  length, summary — length second, not last. This repo's `## Files` table had
  `Document | Covers | Length`, length last.
- Reordered to `Document | Length | Covers`; all nine rows (including the `README.md` `—` row
  and the `screenshots/` `11 images` row) and the alignment row updated, cell content
  unchanged.
- Recomputed every length cell against `wc -l` after the edit: all rows still match exactly.
- Ran a relative-link and `#anchor` resolution sweep over `README.md` and every
  `portfolio/*.md` file: all resolve, nothing else touched this cycle.
