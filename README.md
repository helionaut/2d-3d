# 2d-3d

Static-web harness for the browser-based 2D/3D graphing calculator defined in
the planning docs.

Production URL: https://helionaut.github.io/2d-3d/

## Stack baseline

- React 19 + Vite + TypeScript for the frontend harness
- Plotly for both required rendering proofs: `y = f(x)` and `z = f(x, y)`
- Vitest + Testing Library for unit coverage
- Playwright for browser validation on desktop and mobile
- Checked-in grammar examples and presets define the MVP input contract
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
npm run build:pages
npm run lint
npm run check:inputs
npm run test:unit
npm run test:e2e
npm run check
npm run preview:pages
npm run verify:pages -- https://helionaut.github.io/2d-3d/
```

`npm run check` is the aggregate validation command future tickets should use
before handoff. It validates repo diff hygiene, the checked-in input contract,
lint, unit tests, production build output, and Playwright browser coverage.

`npm run build:pages` rebuilds the deployable artifact with the repository base
path used by GitHub Pages. `npm run preview:pages` serves that artifact locally
at `http://127.0.0.1:4173/2d-3d/`, and `npm run verify:pages -- <url>` compares
the live site to the local `dist/` output byte-for-byte.

## Test and artifact conventions

- Unit and component behavior: `tests/unit/`
- Browser flows and responsive checks: `tests/browser/`
- Reusable graph fixtures and acceptance examples: `fixtures/`
- Built-in canonical presets: `presets/`
- Runtime logs when needed: `logs/out/`
- Machine-readable and HTML reports: `reports/out/`

## Planning docs

- `docs/EXECUTION_PLAN.md`
- `docs/PRD.md`
- `docs/ENVIRONMENT.md`
- `docs/INPUTS.md`
- `DEPLOYING.md`

## Deployment

`.github/workflows/pr-validation.yml` uploads a `static-preview-dist` artifact
for every validated branch so reviewers can inspect the built static output
without recreating it locally.

`.github/workflows/deploy-pages.yml` publishes `dist/` to GitHub Pages on
pushes to `main`, verifies the deployed site against the built artifact, and
posts the production URL to the Telegram topic configured in
`.bootstrap/project.json`.
