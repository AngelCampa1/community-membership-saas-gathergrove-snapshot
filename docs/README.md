# GatherGrove working documentation

This directory is the project's working notes: plans, feature specs, setup guides, and superseded
reports. It is dated, self-addressed, and open-ended, and it was written while the work was going on
rather than for anyone reading the repository later.

**If you are evaluating the project, start with [`portfolio/`](../portfolio/) instead.** That
directory holds the retrospective write-ups: the architecture, the engineering decisions, and the
schema notes.

## What is in here

| Directory | Contents |
|---|---|
| [`01-improvements-05-09/`](01-improvements-05-09/) | Feature specs for event charging, member targeting, and targeted invitations, broken into numbered stories |
| [`archived/`](archived/) | Superseded test and coverage reports, kept rather than deleted so the gap between what the project claimed and what it measured stays checkable. See the coverage note in the [root README](../README.md#tests-and-coverage) |
| [`deployment/`](deployment/) | A deployment playbook that predates the PostgreSQL cutover and does not describe what the project actually ran on. It carries a warning at the top and is kept as an artifact |
| [`e2e-testing/`](e2e-testing/) | End-to-end testing infrastructure notes, scripts, and templates |
| [`features/`](features/) | Event engagement analysis feature notes |
| [`goal/`](goal/) | Backlog, orchestration, and progress tracking |
| [`goal-portfolio-public/`](goal-portfolio-public/) | The ledger for the pass that built `portfolio/` and cleaned this repository up for publication |
| [`guides/`](guides/) | Setup guides for Azure Key Vault, Resend, Google and Apple SSO, and Stripe Connect |
| [`images/`](images/) | The capture manifest, plus three screenshots showing live error states (`admin-analytics.png`, `admin-dashboard.png`, `admin-member-segments.png`), kept as evidence of the bugs recorded in [ENGINEERING-LOG.md's Known compromises](../portfolio/ENGINEERING-LOG.md#known-compromises), not embedded anywhere. The 11 captures actually embedded in the root README live in [`portfolio/screenshots/`](../portfolio/screenshots/) |
| [`seo/`](seo/) | Content planning and research prompts for the marketing site |
| [`unlimited/`](unlimited/) | User stories and roadmap for the unlimited pricing tier |

## A note on what these say

These documents were not revised to match what shipped. Several describe work that was planned and
never finished, and the coverage reports in `archived/` assert numbers that were later measured and
found to be wrong. They are kept because the record is more useful than a tidy version of it, not
because they are accurate. Where a document is known to be misleading, it says so at the top.
