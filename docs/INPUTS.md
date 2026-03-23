# Input Contract: Онлайн-калькулятор графиков функций 2D/3D

Status: Harness baseline and input contract established
Last Updated: `HEL-84`, `HEL-85`

## Purpose

This document is the source of truth for every product input the MVP consumes:

- formula strings entered by the user
- parameter values referenced by formulas
- built-in preset/example files checked into the repo
- any private assets, secrets, or external dependencies required to use those
  inputs

The contract in this file is intentionally narrow. It is designed to let parser,
validation, preset, and UI tickets proceed without reopening product scope.

## Canonical Inputs

| Input | Availability | Source of truth | Notes |
| --- | --- | --- | --- |
| Product intent | available | `.bootstrap/project.json` | Canonical project/task metadata |
| Product scope and acceptance | available | `docs/PRD.md` | Locks MVP to `2D = y = f(x)` and `3D = z = f(x, y)` |
| Formula grammar and validation rules | available | this document plus `fixtures/grammar/examples.json` | Normative for parsing and error handling |
| Built-in presets | available | `presets/manifest.json` plus files under `presets/2d/` and `presets/3d/` | Deterministic checked-in examples |
| Harness plot proof fixtures | available | `fixtures/graphFixtures.ts` | Shared by the HEL-84 spike UI, unit tests, and browser tests |
| Preset/example validation | available | `scripts/check_inputs_contract.py` | Repo-local contract check |
| Host bootstrap path | available | `scripts/bootstrap_host_deps.sh` | Reproducible local install/bootstrap path for future tickets |

## Harness Baseline Artifacts

| Artifact | Owner | Path | Downstream use |
| --- | --- | --- | --- |
| Host bootstrap script | HEL-84 | `scripts/bootstrap_host_deps.sh` | Installs dependencies, Playwright Chromium, and deterministic output directories |
| Plot proof fixture set | HEL-84 | `fixtures/graphFixtures.ts` | Shared acceptance examples for the demo app and tests |
| Grammar example fixture set | HEL-85 | `fixtures/grammar/examples.json` | Normative parser and validation examples |
| Built-in preset manifest | HEL-85 | `presets/manifest.json` | Stable index for canonical checked-in presets |
| Browser acceptance checklist | HEL-84 | `tests/browser/plots.spec.ts` | Desktop/mobile smoke path for the canonical 2D and 3D renderings |
| Validation output directories | HEL-84 | `logs/out/`; `reports/out/` | Stable locations for logs, reports, screenshots, and future evidence |

## MVP Decisions Locked Here

- `2D` mode accepts expressions for `y = f(x)`.
- `3D` mode accepts expressions for `z = f(x, y)`.
- True `f(x, y, z)` visualization is out of scope for MVP.
- URL-state sharing is not part of MVP. The first release only needs in-memory
  state plus checked-in presets.
- No private inputs, user-provided datasets, third-party assets, API keys, or
  secrets are required for formula entry or built-in presets.
- Formula/preset inputs must be fully usable offline once the static app bundle
  is loaded.

## Formula Contract

### Normalized formula representation

The stored contract is always the right-hand side expression only.

Examples:

- `2D` canonical storage: `sin(x)`
- `3D` canonical storage: `sin(x) * cos(y)`

The UI may accept either raw expression input or an optional dependent-variable
prefix:

- `2D`: `sin(x)` or `y = sin(x)`
- `3D`: `sin(x) * cos(y)` or `z = sin(x) * cos(y)`

Normalization rules:

1. Strip leading/trailing whitespace.
2. Accept at most one optional prefix of the form `<dependent> =`.
3. The prefix must match the selected mode:
   - `2D` only allows `y =`
   - `3D` only allows `z =`
4. Persist and compare formulas only in normalized right-hand-side form.
5. Multi-line expressions are invalid.

### Supported grammar

The supported MVP grammar is intentionally small and deterministic.

```ebnf
formula          = expression ;
expression       = sum ;
sum              = product , { ("+" | "-") , product } ;
product          = power , { ("*" | "/") , power } ;
power            = unary , { "^" , unary } ;
unary            = [ "+" | "-" ] , primary ;
primary          = number | identifier | function_call | "(" , expression , ")" ;
function_call    = function_name , "(" , arguments? , ")" ;
arguments        = expression , { "," , expression } ;
number           = int | float ;
int              = digit , { digit } ;
float            = (
                     digit , { digit } , "." , { digit }
                   | "." , digit , { digit }
                   ) , exponent?
                 | int , exponent ;
exponent         = ("e" | "E") , [ "+" | "-" ] , int ;
identifier       = letter , { letter | digit | "_" } ;
function_name    = identifier ;
letter           = "a" ... "z" | "A" ... "Z" ;
digit            = "0" ... "9" ;
```

Additional grammar rules:

- `^` is the exponent operator.
- Function calls require parentheses: `sin(x)` is valid, `sin x` is invalid.
- Implicit multiplication is invalid:
  - `2x`
  - `x(y + 1)`
  - `sin(x)cos(x)`
- Brackets `[]`, braces `{}`, comparison operators, boolean operators,
  assignment inside the expression body, and statement separators are invalid.
- Only ASCII identifiers are supported in MVP.

### Supported functions and constants

Allowed constants:

- `pi`
- `e`

Allowed one-argument functions:

- `abs`
- `acos`
- `asin`
- `atan`
- `ceil`
- `cos`
- `cosh`
- `exp`
- `floor`
- `ln`
- `log10`
- `round`
- `sign`
- `sin`
- `sinh`
- `sqrt`
- `tan`
- `tanh`

Allowed two-argument functions:

- `atan2`
- `max`
- `min`

Rules:

- Function names are case-sensitive.
- Any identifier that is not a mode variable, parameter id, supported constant,
  or supported function name is invalid.
- `log` is not supported in MVP because its base semantics are ambiguous.
- `pow(a, b)` is not supported; use `a ^ b`.

### Variables, constants, and parameters

Mode variables:

- `2D`: `x`
- `3D`: `x`, `y`

Reserved identifiers:

- dependent variables: `y`, `z`
- mode variables: `x`, `y`
- constants: `pi`, `e`
- all supported function names

Parameter identifier rules:

- regex: `^[a-z][a-z0-9_]*$`
- must not collide with any reserved identifier
- must be unique within one preset/runtime formula state

Parameter value rules:

- parameters are numeric scalars only
- values must be finite JSON numbers
- booleans, strings, arrays, objects, `NaN`, `Infinity`, and `null` are invalid

Runtime parameter representation:

```json
{
  "a": 1.0,
  "b": 0.5
}
```

Preset parameter definition representation:

```json
[
  {
    "id": "a",
    "label": "Amplitude",
    "default": 1,
    "min": -5,
    "max": 5,
    "step": 0.1
  }
]
```

Preset parameter field rules:

- required: `id`, `default`
- optional: `label`, `min`, `max`, `step`
- `label` is display-only and does not affect parsing
- parameter order is preserved by array order

### Validation requirements

The parser/validator must reject these cases explicitly:

- empty expression after normalization
- unsupported dependent-variable prefix for the selected mode
- unsupported variable for the selected mode
- unknown identifier
- reserved parameter id
- unsupported function name
- wrong function arity
- implicit multiplication
- mismatched parentheses
- malformed numeric literal

Canonical invalid examples are checked in at `fixtures/grammar/examples.json`.

## Preset Contract

### Deterministic storage paths

- preset manifest: `presets/manifest.json`
- 2D presets: `presets/2d/<id>.json`
- 3D presets: `presets/3d/<id>.json`
- grammar examples: `fixtures/grammar/examples.json`
- graph proof fixtures: `fixtures/graphFixtures.ts`
- unit and component tests: `tests/unit/`
- browser and responsive tests: `tests/browser/`
- logs and traces: `logs/out/`
- reports and screenshots: `reports/out/`

The preset file basename must equal the preset `id`.

### Preset manifest shape

`presets/manifest.json` is the stable index for built-in examples.

```json
{
  "version": 1,
  "presets": [
    {
      "id": "canonical-sine",
      "mode": "2d",
      "path": "presets/2d/canonical-sine.json",
      "canonical": true
    }
  ]
}
```

Manifest field rules:

- `version` is an integer and starts at `1`
- `id` must be unique across all presets
- `mode` must be `2d` or `3d`
- `path` must point to the checked-in preset file for that id
- `canonical` marks acceptance-flow presets from `docs/PRD.md`

### Preset file shape

```json
{
  "version": 1,
  "id": "canonical-sine",
  "title": "Sine Wave",
  "description": "Canonical 2D acceptance preset from the PRD.",
  "mode": "2d",
  "expression": "sin(x)",
  "parameters": [],
  "viewport": {
    "x": { "min": -6.2831853072, "max": 6.2831853072 },
    "y": { "min": -1.5, "max": 1.5 }
  },
  "sampling": {
    "samples": 512
  },
  "tags": ["canonical", "trigonometric"]
}
```

Required preset fields:

- `version`
- `id`
- `title`
- `mode`
- `expression`
- `parameters`
- `viewport`
- `sampling`

Optional preset fields:

- `description`
- `tags`

Mode-specific viewport rules:

- `2D` presets require `viewport.x` and `viewport.y`
- `3D` presets require `viewport.x`, `viewport.y`, and `viewport.z`
- each axis range must provide finite numeric `min` and `max`
- `min` must be strictly less than `max`

Mode-specific sampling rules:

- `2D` presets require `sampling.samples`
- `3D` presets require `sampling.xSamples` and `sampling.ySamples`
- all sampling counts must be positive integers

## Grammar Example Fixture Contract

`fixtures/grammar/examples.json` stores deterministic parser/validation cases.

```json
{
  "version": 1,
  "cases": [
    {
      "id": "valid-2d-prefixed",
      "kind": "valid",
      "mode": "2d",
      "rawInput": "y = sin(x)",
      "normalizedExpression": "sin(x)",
      "parameterValues": {}
    },
    {
      "id": "invalid-2d-implicit-multiplication",
      "kind": "invalid",
      "mode": "2d",
      "rawInput": "2x",
      "expectedError": "implicit-multiplication"
    }
  ]
}
```

Case field rules:

- required for all cases: `id`, `kind`, `mode`, `rawInput`
- valid-case required fields:
  - `normalizedExpression`
  - `parameterValues`
- invalid-case required fields:
  - `expectedError`

## URL-State Sharing Decision

URL-state sharing is explicitly out of MVP for this contract.

Reason:

- the PRD already requires built-in presets for reviewability
- URL serialization adds another public input format to stabilize
- the first implementation tickets should focus on parser/render correctness,
  not state encoding

If a later ticket adds URL-state sharing, it must introduce a separate public
serialization contract and versioned schema.
