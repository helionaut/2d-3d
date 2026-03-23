import { graphFixtures, invalidExpressionFixture } from '../fixtures/graphFixtures'
import { PlotCanvas } from './components/PlotCanvas'
import './App.css'

function App() {
  const conventions = [
    {
      title: 'Local loop',
      body: 'Run the repo-local bootstrap once, then use the Vite dev server for daily implementation work.',
      command: 'npm run bootstrap && npm run dev',
    },
    {
      title: 'Aggregate validation',
      body: 'Future implementation tickets should prove lint, unit checks, production build, and browser smoke through one command.',
      command: 'npm run check',
    },
    {
      title: 'Future test lanes',
      body: 'Keep reusable graph inputs in fixtures, fast assertions in unit tests, and browser interaction proof in Playwright.',
      command: 'fixtures/ + tests/unit/ + tests/browser/',
    },
  ]

  const artifactPaths = [
    'fixtures/graphFixtures.ts',
    'tests/unit/',
    'tests/browser/',
    'logs/out/',
    'reports/out/',
  ]

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">HEL-84 engineering harness</p>
          <h1>Static-web graphing baseline with one 2D proof and one 3D proof.</h1>
          <p className="lede">
            This harness locks the frontend stack, local workflow, and validation
            paths so future tickets can implement calculator behavior instead of
            rebuilding setup.
          </p>
          <div className="chip-row" aria-label="Chosen stack">
            <span>React 19</span>
            <span>Vite</span>
            <span>TypeScript</span>
            <span>Plotly</span>
            <span>Vitest</span>
            <span>Playwright</span>
          </div>
        </div>
        <aside className="hero-note">
          <h2>Harness contract</h2>
          <ul className="note-list">
            <li>Single aggregate validation command mirrored by CI.</li>
            <li>Deterministic paths for fixtures, logs, and reports.</li>
            <li>Canonical examples fixed to the PRD acceptance flows.</li>
          </ul>
        </aside>
      </section>

      <section className="convention-grid" aria-label="Harness conventions">
        {conventions.map((item) => (
          <article className="convention-card" key={item.title}>
            <p className="eyebrow">{item.title}</p>
            <p>{item.body}</p>
            <code>{item.command}</code>
          </article>
        ))}
      </section>

      <section className="plots-section" aria-labelledby="plots-heading">
        <div className="section-heading">
          <p className="eyebrow">Rendering spike</p>
          <h2 id="plots-heading">Chosen stack proves both canonical plotting modes.</h2>
          <p>
            The cards below are the reusable acceptance proofs from the PRD:
            `y = sin(x)` in 2D and `z = sin(x) * cos(y)` in 3D.
          </p>
        </div>

        <div className="plot-grid">
          {graphFixtures.map((fixture) => (
            <article className="plot-card" key={fixture.id}>
              <div className="plot-copy">
                <p className="eyebrow">{fixture.mode} proof</p>
                <h3>{fixture.title}</h3>
                <p>{fixture.summary}</p>
                <dl className="fixture-meta">
                  <div>
                    <dt>Expression</dt>
                    <dd>
                      <code>{fixture.expression}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Interaction</dt>
                    <dd>{fixture.interactionNote}</dd>
                  </div>
                  <div>
                    <dt>Sampling</dt>
                    <dd>{fixture.samplingNote}</dd>
                  </div>
                </dl>
              </div>
              <PlotCanvas fixture={fixture} />
            </article>
          ))}
        </div>
      </section>

      <section className="artifact-panel" aria-labelledby="artifact-heading">
        <div className="section-heading">
          <p className="eyebrow">Deterministic paths</p>
          <h2 id="artifact-heading">Future implementation work reuses fixed locations.</h2>
          <p>
            Browser tests, fixtures, logs, and reports already have committed
            homes. The placeholder invalid example is also fixed now so parser
            work has a shared starting point.
          </p>
        </div>
        <div className="artifact-grid">
          <article className="artifact-card">
            <h3>Fixtures and tests</h3>
            <ul className="path-list">
              {artifactPaths.map((path) => (
                <li key={path}>
                  <code>{path}</code>
                </li>
              ))}
            </ul>
          </article>
          <article className="artifact-card">
            <h3>Invalid-input placeholder</h3>
            <p>{invalidExpressionFixture.summary}</p>
            <code>{invalidExpressionFixture.expression}</code>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
