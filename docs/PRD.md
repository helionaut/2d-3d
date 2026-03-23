# Product Requirements Document

Project: Онлайн-калькулятор графиков функций 2D/3D
Status: Scope baseline for implementation
Canonical intent: "Создать онлайн-калькулятор с построением графиков функций от двух и трех переменных."

## Purpose

This PRD is the product contract for the first shippable version of the
calculator. Its job is to remove the scope ambiguity from intake so `HEL-84`
can choose a stack without reopening product meaning.

`.bootstrap/project.json` is the source of truth for project intent. This
document translates that intent into a concrete MVP boundary.

## Product promise

The product is a browser-based graphing calculator that lets a user type a
supported mathematical expression and inspect the result interactively in either
2D or 3D.

For this MVP, the "2D/3D" promise refers to the rendered coordinate space, not
to general N-variable math support.

- `2D` means plotting a Cartesian curve of the form `y = f(x)`.
- `3D` means plotting a Cartesian surface of the form `z = f(x, y)`.
- True three-input scalar fields such as `f(x, y, z)` are out of scope for MVP.

This interpretation aligns the project title with a web-deliverable graphing
experience and avoids turning the first release into an isosurface, slicing, or
volume-rendering product.

## Problem statement

People who need to sanity-check a formula visually often have to install heavy
desktop software, write plotting code, or switch between tools that are too
complex for quick inspection.

The product should cover the lightweight use case: enter a supported expression,
render it in the browser, inspect it immediately, and recover cleanly from bad
input.

## Target user

Primary user:
- A STEM learner, educator, or engineer who needs a quick browser-based check
  of a function without local setup.

Primary job-to-be-done:
- "When I have a formula I want to inspect, let me enter it in the browser and
  get a manipulable graph quickly enough to confirm whether the function behaves
  as I expect."

Secondary stakeholder:
- The project maintainer who needs a narrow, testable MVP scope and explicit
  acceptance evidence for future implementation tickets.

## MVP scope

The first release must provide:

- a public browser UI with no account or backend dependency for the core graph
  flow
- one expression input flow that accepts documented syntax and clearly indicates
  whether the app is in `2D` or `3D` mode
- one active graph at a time
- 2D plotting for `y = f(x)` with visible axes plus zoom and pan controls
- 3D surface plotting for `z = f(x, y)` with visible orientation cues plus
  rotate and zoom controls
- user-editable visible ranges for the active graph
- clear inline validation for parse errors and unsupported syntax
- built-in example presets for at least one 2D flow and one 3D flow
- responsive layout that remains usable on desktop and mobile

## Non-goals

The MVP must not include:

- true `f(x, y, z)` visualization
- implicit surfaces, parametric curves, parametric surfaces, or volume rendering
- multiple simultaneous graphs, graph overlays, or comparison workspaces
- symbolic algebra, solving, differentiation, integration, or CAS behavior
- user accounts, saved history, collaboration, or backend persistence
- native mobile or desktop apps

## Launch risks

- Rendering stack risk: one frontend stack has to support both responsive 2D
  interaction and usable 3D surface rendering without a backend.
- Syntax-contract risk: if supported math grammar is vague, parser, validation,
  examples, and docs will drift.
- Mobile-UX risk: 3D manipulation can become unusable quickly on small screens
  if controls are too dense or gesture handling is poor.
- Performance risk: dense surfaces or high sampling defaults can make the app
  feel broken on average laptop/mobile hardware.

## Scope decisions locked by this PRD

### 1. Exact meaning of the 2D/3D promise

- `2D` flow: the user enters an expression for `y` as a function of `x`.
- `3D` flow: the user enters an expression for `z` as a function of `x` and
  `y`.
- The app may infer the mode from variable usage, use an explicit toggle, or use
  presets, but the selected mode must always be obvious in the UI.

### 2. `f(x, y, z)` scope decision

True three-input function visualization is not part of MVP.

Reason:
- it introduces an entirely different representation problem
- it would force early scope decisions around slicing, isosurfaces, or 4D-to-3D
  reduction that are unnecessary for proving the core product
- it would distort stack selection for `HEL-84`

If future work wants `f(x, y, z)` support, it needs a separate PRD amendment and
explicit representation contract.

### 3. Primary user and JTBD

- Primary user: browser-first learner/educator/engineer who needs fast visual
  confirmation of a formula.
- JTBD: "Enter a formula and inspect the graph immediately without setup."

### 4. MVP boundary

The MVP proves one browser product can handle:
- a typed 2D curve flow
- a typed 3D surface flow
- invalid-input handling
- responsive desktop/mobile usage

It does not prove:
- broad math-system coverage
- advanced scientific visualization
- collaboration, storage, or pedagogy features

## Canonical acceptance flows

These flows are mandatory because they are the baseline for both implementation
and review.

### 2D flow

- Expression: `y = sin(x)`
- Expected result: a 2D sinusoidal curve rendered against visible axes
- Required interaction proof: the reviewer can zoom and pan the graph without
  losing the curve or breaking the UI

### 3D flow

- Expression: `z = sin(x) * cos(y)`
- Expected result: a 3D surface with visible peaks and valleys rendered in a
  manipulable 3D scene
- Required interaction proof: the reviewer can rotate and zoom the surface
  without the graph disappearing or the controls overlapping the viewport

## Measurable acceptance criteria

The ticket is only considered satisfied when all of the following are true:

1. The product contract states that MVP `2D` means `y = f(x)` and MVP `3D`
   means `z = f(x, y)`.
2. The product contract explicitly states that true `f(x, y, z)` visualization
   is out of scope for MVP.
3. The PRD names one primary user and one primary job-to-be-done.
4. The PRD lists MVP features, non-goals, and launch risks in implementation-useful
   terms.
5. The PRD defines at least one canonical 2D example and one canonical 3D
   example that future implementation and review must exercise.
6. Acceptance evidence requires desktop and mobile proof for the graphing UI.
7. The acceptance evidence for the 2D flow is specific enough that a reviewer
   can tell whether the graph rendered correctly.
8. The acceptance evidence for the 3D flow is specific enough that a reviewer
   can tell whether the surface rendered correctly.
9. The contract is narrow enough that `HEL-84` can choose libraries for a
   static frontend app without needing to solve true `f(x, y, z)` visualization.

## Required acceptance evidence

Any implementation claiming compliance with this PRD must produce all of the
following evidence:

- a deployed or locally reviewable app URL/path
- local validation evidence for the implementation branch
- published branch / PR evidence for the implementation branch
- one invalid-input example showing readable inline error handling
- one reviewed desktop screenshot for the 2D flow
- one reviewed mobile screenshot for the 2D flow
- one reviewed desktop screenshot for the 3D flow
- one reviewed mobile screenshot for the 3D flow

## Explicit evidence contract for the canonical flows

### Evidence for the 2D flow

The acceptance packet must include:

- the exact expression used: `y = sin(x)`
- a screenshot showing the input value, the selected `2D` mode, visible axes,
  and the rendered curve on desktop
- a screenshot showing the same flow on mobile without control overlap or hidden
  primary actions
- a short note confirming zoom and pan were exercised successfully

### Evidence for the 3D flow

The acceptance packet must include:

- the exact expression used: `z = sin(x) * cos(y)`
- a screenshot showing the input value, the selected `3D` mode, and the
  rendered surface on desktop
- a screenshot showing the same flow on mobile with usable 3D viewport and
  controls
- a short note confirming rotate and zoom were exercised successfully

## Exit condition

`HEL-83` is complete when a follow-on engineering ticket can answer all of these
questions without reopening scope:

- What does `2D` mean?
- What does `3D` mean?
- Is true `f(x, y, z)` visualization required now?
- Who is the primary user?
- What exact flows must the first release prove?
- What screenshots and validation evidence are required on desktop and mobile?
