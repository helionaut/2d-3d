# External Inputs Contract: Онлайн-калькулятор графиков функций 2D/3D

Status: Draft
Last Updated: HEL-83

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
| Supported math syntax contract | missing | to be authored in repo docs | Required before parser and validation work can be accepted |
| Two-variable graph contract | missing | to be authored in repo docs/tests | Must define accepted input form and expected visualization |
| Three-variable graph contract | missing | to be authored in repo docs/tests | Must define the representation strategy instead of implying a direct 4D plot |
| Example expressions and expected outcomes | missing | to be prepared in fixtures/docs | Needed for demos, regression checks, and acceptance evidence |
| Hosting/runtime configuration | partially available | `.bootstrap/project.json` (`static-web`) | Deployment profile exists, but runtime details still need implementation artifacts |

## Prepared Artifacts

| Prepared artifact | Generator / owner | Output path | Validation / downstream use |
| --- | --- | --- | --- |
| Product requirements document | HEL-83 | `docs/PRD.md` | Planning baseline for implementation and review |
| Input readiness contract | HEL-85 or follow-up updates | `docs/INPUTS.md` | Source of truth for missing inputs and prepared assets |
| Syntax reference | implementation/docs work | `docs/` path TBD | Used by parser, UI copy, and reviewer acceptance |
| Expression fixture set | implementation/test work | path TBD | Used by tests, demos, and validation checklist |
| Acceptance evidence checklist | implementation/validation work | path TBD | Used to prove PRD success criteria |
| Deployment artifact | implementation/release work | build output path TBD | Used for published review and release validation |

## Deterministic Paths

Use stable repo-local locations whenever possible.

Suggested conventions:
- raw/private inputs: `datasets/user/raw/`
- prepared/private artifacts: `datasets/user/prepared/`
- checked-in shareable fixtures: `datasets/fixtures/`
- calibration/config bundles: `configs/`
- manifests describing prepared runs: `manifests/`
- logs and reports: `logs/out/` and `reports/out/`

## Bootstrap And Acquisition

No external private assets are present yet.

Current acquisition work that must be converted into committed repo artifacts:

- Author the math syntax and graph-mode contracts before implementation relies on
  implicit behavior.
- Prepare a canonical set of valid and invalid example expressions.
- Record deployment/runtime setup once the web stack is selected and bootstrapped.

## Real Gaps

| Gap | Why it is real | Likely resolver | Blocks |
| --- | --- | --- | --- |
| Supported syntax definition | Cannot be derived from repo metadata alone | product/implementation owner | parser, validation, docs, tests |
| Three-variable representation choice | The intent says "three variables" but not how that is visualized | product/implementation owner | rendering design, acceptance criteria |
| Canonical example fixture set | No source examples exist in the repo yet | implementation/test work | regression coverage and demo evidence |
