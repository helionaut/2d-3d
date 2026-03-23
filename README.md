# 2d-3d

Static-web harness for the browser-based 2D/3D graphing calculator defined in
the planning docs.

## Stack baseline

- React 19 + Vite + TypeScript for the frontend harness
- Plotly for both required rendering proofs: `y = f(x)` and `z = f(x, y)`
- Vitest + Testing Library for unit coverage
- Playwright for browser validation on desktop and mobile
- GitHub Actions mirrors the local `npm run check` command

## Quick start

```bash
npm run bootstrap
npm run dev
```

The bootstrap script installs npm dependencies, installs the Chromium browser
used by Playwright, and prepares deterministic report/log directories.

## Common commands

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e
npm run check
```

`npm run check` is the aggregate validation command future tickets should use
before handoff.

## Test and artifact conventions

- Unit and component behavior: `tests/unit/`
- Browser flows and responsive checks: `tests/browser/`
- Reusable graph fixtures and acceptance examples: `fixtures/`
- Runtime logs when needed: `logs/out/`
- Machine-readable and HTML reports: `reports/out/`

## Planning docs

- `docs/EXECUTION_PLAN.md`
- `docs/PRD.md`
- `docs/ENVIRONMENT.md`
- `docs/INPUTS.md`
