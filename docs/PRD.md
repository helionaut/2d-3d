# Product Requirements Document

Project: Онлайн-калькулятор графиков функций 2D/3D
Status: Draft for implementation alignment
Canonical intent: "Создать онлайн-калькулятор с построением графиков функций от двух и трех переменных."

## Product framing

This project is a browser-based calculator for visualizing multivariable functions.
The explicit project intent is the source of truth. This PRD does not infer extra
scope from the repository slug.

This is not a generic "math app" brief. It is a delivery and validation contract
for the first shippable version of an online graphing tool that can accept typed
functions and render them in a form that users can inspect interactively.

## Problem statement

Potential users who work with multivariable functions need a fast way to inspect
equations visually without installing desktop math software or writing plotting
code manually.

The project is testing whether a browser-based calculator can cover that need with
enough clarity and responsiveness to be useful for exploratory work.

## Product hypothesis

If users can enter supported functions of two and three variables directly in the
browser, receive an interactive graph quickly, and understand invalid input when
it fails, then the product will be good enough to justify continued investment as
the primary graphing surface for this project.

## Target users and stakeholders

### Primary user

- A user who needs to inspect multivariable functions quickly in a browser.
- Typical motivations: learning, checking a formula, explaining a surface or
  slice visually, or validating whether an expression behaves as expected.

### Operator

- The project maintainer or small internal team responsible for defining the
  supported syntax, shipping the web app, and validating that the graph output is
  correct enough for the supported scenarios.

### Stakeholder

- The project sponsor evaluating whether the calculator solves the intended
  problem well enough to continue implementation and release work.

## MVP scope contract

The first shippable version must provide:

- A public browser-based UI with no required local installation for end users.
- An input flow for entering supported math expressions.
- A documented visualization path for functions of two variables.
- A documented visualization path for functions of three variables.
- Interactive inspection controls appropriate to the selected graph mode, such as
  zoom, pan, rotate, slice selection, or equivalent view manipulation.
- Clear validation and error handling for unsupported or invalid expressions.
- A documented list of supported operators, constants, and built-in functions.

## Critical scope clarification

The phrase "functions of three variables" is ambiguous for visualization.
A function of the form `w = f(x, y, z)` is not directly viewable as a simple 2D or
3D graph without an additional representation rule.

Implementation must not guess here.

Before feature delivery is considered complete, the project must explicitly choose
and document one supported representation for three-variable functions, such as:

- fixed-parameter slices
- isosurfaces / level sets
- projection or reduction rules with user-controlled parameters

No implementation is successful if three-variable support is implied but not
defined.

## User outcomes

The product should let a user:

- enter a valid supported function and see a graph without leaving the page
- understand which graph mode is being used and why
- adjust the view enough to inspect the result
- recover from invalid input through a readable error message

## Required source inputs

The implementation depends on these source-of-truth inputs:

| Input | Status | Purpose |
| --- | --- | --- |
| `.bootstrap/project.json` intent | available | Canonical project goal and repo metadata |
| Linear issue `HEL-83` | available | Scope for this PRD and success contract |
| Supported math syntax contract | missing, must be authored | Defines what users may type |
| Two-variable rendering contract | missing, must be authored | Defines accepted form and output for 2-variable functions |
| Three-variable rendering contract | missing, must be authored | Defines the representation used instead of an implied 4D plot |
| Example expressions and expected outputs | missing, must be prepared | Drives demos, fixtures, and acceptance checks |
| Deployment target and runtime constraints | partially available | Repo metadata says static web, but hosting details still need implementation |

## Required prepared artifacts

The project must prepare these artifacts before implementation can be judged
complete:

| Artifact | Producer | Purpose |
| --- | --- | --- |
| `docs/PRD.md` | this issue | Product scope and validation contract |
| `docs/INPUTS.md` | input-contract maintenance | External input readiness and gaps |
| Expression fixture set | implementation/test work | Valid and invalid examples for regression and demos |
| Supported syntax reference | implementation/docs work | User-facing input contract |
| Acceptance checklist with evidence links | validation/review work | Proof that the shipped app meets the PRD |
| Deployment artifact and live URL | release work | Publicly accessible product output |

## Success metrics

The product is successful when all of the following are true:

1. A user can enter at least one documented two-variable example and receive the
   expected graph in the browser.
2. A user can enter at least one documented three-variable example and receive the
   explicitly documented representation for that mode.
3. Invalid or unsupported input produces a readable error instead of a silent
   failure or broken render.
4. The supported syntax and graph modes are documented well enough that a reviewer
   can reproduce the acceptance examples without source-code guesswork.
5. The app is deployed to a reachable URL and can be exercised on desktop and
   mobile browsers for the supported flows.

## Failure criteria

The project fails the contract if any of the following remain true:

- three-variable support is claimed without a concrete representation rule
- graph output only works for undocumented internal examples
- invalid input can leave the UI in an unreadable, blank, or misleading state
- deployment exists but the core example flows cannot be reproduced by a reviewer
- the implementation scope expands into a general CAS or advanced math suite
  before the graphing core works reliably

## Acceptance evidence

Completion evidence must include:

- a deployed build URL
- a short acceptance checklist covering the documented example expressions
- proof that both the two-variable and three-variable paths were exercised
- evidence of invalid-input handling
- local validation results for the implementation branch
- remote PR/CI evidence for the published branch

If the delivered feature is UI-facing, acceptance evidence must also include:

- at least one reviewed desktop screenshot
- at least one reviewed mobile screenshot
- confirmation that those screenshots match the documented graphing flow

## Non-goals

The first version does not need to provide:

- symbolic algebra, derivation, integration, or equation solving
- user accounts, saved workspaces, or collaboration features
- arbitrary 4D visualization beyond the explicitly chosen three-variable
  representation
- a native desktop or mobile application
- a full educational content library

## Unresolved risks

- Three-variable rendering remains the highest product-definition risk until the
  representation contract is chosen.
- Performance constraints are not yet benchmarked for heavy expressions or dense
  meshes.
- The supported syntax is not yet defined, which can create rework across parser,
  validation, and documentation.
- No canonical example set exists yet, so future tasks must create fixtures before
  acceptance can be automated.

## Final deliverables

The project should ultimately ship:

- a deployed online calculator for supported multivariable graphing scenarios
- a documented input and graph-mode contract
- prepared example expressions used for validation and demonstration
- implementation validation evidence tied back to this PRD

## Exit condition for this PRD

This PRD is complete for planning purposes when a reviewer can answer, without
guesswork:

- who the product is for
- what problem is being tested
- what counts as two-variable and three-variable support
- which inputs and artifacts are required before implementation is accepted
- what evidence proves success or failure
