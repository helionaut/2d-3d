# Execution Plan

Project: Онлайн-калькулятор графиков функций 2D/3D

## Outcome

Ship a browser-based calculator that lets a user enter mathematical expressions
and interactively render them as 2D and 3D graphs without requiring a backend
for the core experience.

The deploy profile in `.bootstrap/project.json` is `static-web`, so the working
default is a frontend-first product unless the PRD proves that a backend is
required.

## Working Product Interpretation

The intake phrase "графики функций от двух и трех переменных" is ambiguous.
To keep the project actionable, use this planning assumption until `HEL-83`
confirms otherwise:

- 2D mode plots expressions with one free variable, for example `y = f(x)`.
- 3D mode plots surfaces with two free variables, for example `z = f(x, y)`.
- True three-variable scalar fields such as `f(x, y, z)` are out of the first
  MVP unless the PRD explicitly promotes them into scope.

This assumption keeps the scope aligned with the "2D/3D" title and avoids
quietly expanding the product into volume rendering, slicing, or isosurface
work before the project has a validated core.

## MVP Scope

Must have:

- expression input for supported math syntax
- clear validation and parse/runtime error states
- interactive 2D graphing with axes, zoom, and pan
- interactive 3D surface graphing with camera rotation and zoom
- configurable visible ranges and graph density/resolution controls
- several built-in example functions that prove both modes work
- responsive UI that remains usable on desktop and mobile
- static deployment path with a public URL once the project is ready

Should have if cost stays low:

- URL-persisted graph state for easy sharing and QA reproduction
- a small set of parameterized examples that exercise tricky cases

Explicitly out of initial scope:

- implicit surfaces, parametric surfaces, or volume rendering
- symbolic algebra / CAS features
- authentication, saved accounts, or server-side history
- collaboration or multi-user state
- native/mobile apps

## Scope Risks To Resolve Early

- product meaning risk: whether "three variables" means `z = f(x, y)` or true
  `f(x, y, z)` visualization
- rendering-library risk: one stack must support both smooth 2D interaction and
  acceptable 3D surface performance in the browser
- math-syntax risk: the accepted expression grammar must be strict enough to be
  predictable but broad enough to cover useful examples
- mobile UX risk: 3D controls can become clumsy quickly on small screens

## Execution Stages

### Stage 1: Product Contract (`HEL-83`)

Goal:
- turn the intake into a real PRD with measurable acceptance criteria

Outputs:
- `docs/PRD.md`
- explicit answer to the variable/scope ambiguity
- named target user and primary job-to-be-done
- launch-quality acceptance evidence for 2D, 3D, and responsive behavior

Exit criteria:
- the MVP boundary is frozen well enough to make stack decisions

### Stage 2: Engineering Harness (`HEL-84`)

Goal:
- establish a repeatable frontend development path that future feature tickets
  can build on

Outputs:
- project scaffold, local run command, aggregate `check` command, CI baseline,
  and development docs
- a lightweight graphing/rendering spike that proves the chosen stack can draw
  one 2D example and one 3D example

Exit criteria:
- Symphony can run, test, and validate the app without rediscovering setup

### Stage 3: Input Contract (`HEL-85`)

Goal:
- formalize every input the product consumes and confirm whether any private or
  external dependencies exist

Outputs:
- updated `docs/INPUTS.md`
- deterministic location for example presets, fixtures, and config
- documented expression grammar and any URL-state/share contract

Exit criteria:
- downstream feature tickets know exactly what input shape to support

### Stage 4: Backlog Decomposition (`HEL-86`)

Goal:
- break implementation into small tickets after the PRD, harness, and input
  contract are stable

Expected ticket lanes:
- expression engine and validation UX
- 2D plotting workflow
- 3D surface plotting workflow
- responsive shell and graph controls
- presets/share state/polish

Exit criteria:
- each implementation ticket is independently actionable and testable

### Stage 5: Deployment Setup (`HEL-87`)

Goal:
- make the static-web release path repeatable and observable

Outputs:
- deploy workflow, release verification command, and production URL reporting

Exit criteria:
- the project can publish a reviewable build without ad hoc steps

## Recommended Sequencing

- `HEL-83` is the immediate next action because it resolves the biggest scope
  risk.
- `HEL-84` can start as soon as `HEL-83` nails down the MVP shape well enough
  to pick a frontend stack.
- `HEL-85` should run in parallel with late `HEL-83` / early `HEL-84` once the
  accepted expression grammar and preset strategy are known.
- `HEL-86` should only begin after `HEL-83`, `HEL-84`, and `HEL-85` have made
  the implementation surface concrete.
- `HEL-87` can begin after the harness exists, but it does not need to block
  core feature decomposition.

## First Next Actions For Symphony

1. Finish `HEL-83` with a hard decision on the supported function/variable
   model, the MVP user flow, and the acceptance evidence for success.
2. Use `HEL-84` to bootstrap the frontend app and prove one 2D and one 3D graph
   render through a repeatable local workflow.
3. Use `HEL-85` to lock the expression grammar, example presets, and deterministic
   input/config paths so future tickets do not invent them ad hoc.
4. Once those foundations exist, run `HEL-86` to create implementation tickets
   in dependency order.
5. Wire `HEL-87` after the harness baseline exists so previews and release
   validation have a stable app to publish.

## Evidence That Intake Is Complete

- the project scope is captured with explicit in-scope and out-of-scope
  boundaries
- the critical ambiguity and major risks are written down, not hidden
- the existing Linear issue pack has a clear order and purpose
- the next issue for Symphony is obvious without re-reading the intake
