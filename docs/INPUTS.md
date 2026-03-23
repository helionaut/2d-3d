# External Inputs Contract: Онлайн-калькулятор графиков функций 2D/3D

Status: Harness baseline established
Last Updated: HEL-84

## Project Intent

Создать онлайн-калькулятор с построением графиков функций от двух и трех переменных.

## Purpose

This document is the source of truth for every external, private, or user-supplied
input the project needs. Its job is to let agents move forward autonomously.

Rules:
- If raw assets already exist, the next step is to adapt them into the required
  tool format. That is implementation work, not a reason to stop.
- Only list something as "missing" if the source-of-truth asset, secret, or
  non-derivable fact is genuinely absent.
- Any required download, bootstrap, extraction, conversion, or preprocessing
  step should be scripted or documented in repo-local commands.

## Source Inputs

| Source input | Availability | Location / retrieval | Notes |
| --- | --- | --- | --- |
| Canonical project intent | available | `.bootstrap/project.json` | Source of truth for project scope and mode |
| PRD / success contract | available after HEL-83 | `docs/PRD.md` | Defines problem, users, scope, metrics, and non-goals |
| Linear issue scope | available | `HEL-83` and related project issues in Linear | Captures current task boundaries |
| Supported math syntax contract | partially available | `fixtures/graphFixtures.ts`; follow-up docs still required | HEL-84 fixes the canonical examples and an invalid placeholder fixture, but the full grammar still belongs to later implementation/docs work |
| Two-variable graph contract | available at MVP level | `docs/PRD.md` | Locked to `y = f(x)` for the first release |
| Three-variable graph contract | available at MVP level | `docs/PRD.md` | Locked to `z = f(x, y)`; true `f(x, y, z)` is out of MVP scope |
| Example expressions and expected outcomes | available for harness proof | `fixtures/graphFixtures.ts` | Canonical 2D, 3D, and invalid examples are now reusable by the app and tests |
| Hosting/runtime configuration | available for local harness work | `.bootstrap/project.json`; `scripts/bootstrap_host_deps.sh` | Static-web profile and host bootstrap are committed for repeatable local setup |

## Prepared Artifacts

| Prepared artifact | Generator / owner | Output path | Validation / downstream use |
| --- | --- | --- | --- |
| Product requirements document | HEL-83 | `docs/PRD.md` | Planning baseline for implementation and review |
| Input readiness contract | HEL-83 and follow-up updates | `docs/INPUTS.md` | Source of truth for missing inputs and prepared assets |
| Host bootstrap script | HEL-84 | `scripts/bootstrap_host_deps.sh` | Reproducible local dependency/bootstrap path |
| Expression fixture set | HEL-84 | `fixtures/graphFixtures.ts` | Used by the spike UI, unit tests, and browser tests |
| Acceptance evidence checklist | HEL-84 | `tests/browser/plots.spec.ts` | Browser smoke path for both canonical rendering flows |
| Validation output directories | HEL-84 | `logs/out/`; `reports/out/` | Deterministic destinations for machine-readable results and future evidence |

## Deterministic Paths

Use stable repo-local locations whenever possible.

Current conventions:
- checked-in graph fixtures and acceptance examples: `fixtures/`
- unit tests: `tests/unit/`
- browser/responsive tests: `tests/browser/`
- logs and run traces when needed: `logs/out/`
- machine-readable and HTML reports: `reports/out/`

## Bootstrap And Acquisition

No external private assets are present yet.

Current acquisition work that must be converted into committed repo artifacts:

- Expand the fixture-backed syntax contract from canonical examples into the
  full supported grammar before parser tickets land.
- Add richer expected-value fixtures once behavior goes beyond the HEL-84 spike.
- Record deployment/runtime setup once the static hosting lane is implemented.

## Real Gaps

| Gap | Why it is real | Likely resolver | Blocks |
| --- | --- | --- | --- |
| Supported syntax definition | Canonical fixtures exist, but the full grammar is still not documented | product/implementation owner | parser, validation, docs, tests |
| Invalid-input rendering behavior | The invalid fixture exists, but the UI/parser contract for surfacing errors is still future work | implementation/test work | validation UX review and acceptance evidence |
