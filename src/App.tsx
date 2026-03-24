import { useState } from 'react'

import { PlotCanvas } from './components/PlotCanvas'
import {
  MODE_DEFINITIONS,
  SUPPORTED_CONSTANTS,
  SUPPORTED_FUNCTION_REFERENCE,
  validateExpressionInput,
  type ExpressionValidationResult,
  type ExpressionValidationSuccess,
  type GraphMode,
} from './lib/expression'
import { buildPlotModel } from './lib/plotting'
import './App.css'

interface ModeEditorState {
  rawInput: string
  parameterValues: Record<string, number>
  validation: ExpressionValidationResult
  lastValid: ExpressionValidationSuccess
}

function createInitialModeState(mode: GraphMode): ModeEditorState {
  const initialValidation = validateExpressionInput({
    mode,
    rawInput: MODE_DEFINITIONS[mode].exampleInput,
    parameterValues: {},
  })

  if (!initialValidation.ok) {
    throw new Error(`Initial formula for ${mode} mode must be valid.`)
  }

  return {
    rawInput: MODE_DEFINITIONS[mode].exampleInput,
    parameterValues: {},
    validation: initialValidation,
    lastValid: initialValidation,
  }
}

function createInitialEditorState(): Record<GraphMode, ModeEditorState> {
  return {
    '2d': createInitialModeState('2d'),
    '3d': createInitialModeState('3d'),
  }
}

function App() {
  const [mode, setMode] = useState<GraphMode>('2d')
  const [editorStateByMode, setEditorStateByMode] = useState(createInitialEditorState)

  const activeModeDefinition = MODE_DEFINITIONS[mode]
  const activeEditorState = editorStateByMode[mode]
  const activePlotModel = buildPlotModel(activeEditorState.lastValid)

  const handleFormulaChange = (nextRawInput: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]
      const nextValidation = validateExpressionInput({
        mode,
        rawInput: nextRawInput,
        parameterValues: activeState.parameterValues,
      })

      return {
        ...currentState,
        [mode]: {
          ...activeState,
          rawInput: nextRawInput,
          validation: nextValidation,
          lastValid: nextValidation.ok ? nextValidation : activeState.lastValid,
        },
      }
    })
  }

  return (
    <main className="calculator-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Browser graph calculator</p>
          <h1>Type a formula, validate it inline, and keep the graph stable while you edit.</h1>
          <p className="lede">
            {activeModeDefinition.label} mode accepts a raw expression or the optional
            <code>{` ${activeModeDefinition.dependentVariable} = ...`}</code>
            prefix.
          </p>
        </div>

        <div className="mode-switch" aria-label="Graph mode">
          {(Object.entries(MODE_DEFINITIONS) as [GraphMode, (typeof MODE_DEFINITIONS)[GraphMode]][]).map(
            ([nextMode, definition]) => (
              <button
                key={nextMode}
                type="button"
                className={`mode-button ${mode === nextMode ? 'is-active' : ''}`}
                aria-pressed={mode === nextMode}
                onClick={() => setMode(nextMode)}
              >
                <span className="mode-button-title">{definition.buttonLabel}</span>
                <span className="mode-button-copy">
                  {definition.dependentVariable} = f({definition.variables.join(', ')})
                </span>
              </button>
            ),
          )}
        </div>
      </section>

      <section className="workspace-grid">
        <section className="panel editor-panel" aria-labelledby="editor-heading">
          <div className="panel-heading">
            <p className="eyebrow">Formula entry</p>
            <h2 id="editor-heading">Normalize input before it reaches graph state.</h2>
            <p>
              Persisted formulas keep only the right-hand side. Invalid edits stay inline and
              never replace the last valid graph.
            </p>
          </div>

          <label className="field-label" htmlFor="formula-input">
            Formula
          </label>
          <textarea
            id="formula-input"
            className={`formula-input ${activeEditorState.validation.ok ? '' : 'has-error'}`}
            value={activeEditorState.rawInput}
            onChange={(event) => handleFormulaChange(event.target.value)}
            aria-invalid={!activeEditorState.validation.ok}
            spellCheck={false}
            rows={3}
          />
          <p className="field-hint">
            Variables: <code>{activeModeDefinition.variables.join(', ')}</code>. Constants:{' '}
            <code>{SUPPORTED_CONSTANTS.join(', ')}</code>. Functions use parentheses and explicit
            operators only.
          </p>

          {activeEditorState.validation.ok ? (
            <p className="status-banner is-valid" role="status">
              <strong>Valid formula.</strong> The stored expression is ready for the graph surface.
            </p>
          ) : (
            <div className="status-banner is-error">
              <p role="alert">{activeEditorState.validation.error.message}</p>
              <p className="recovery-copy">Showing the last valid graph while you edit.</p>
            </div>
          )}

          <div className="state-grid">
            <article className="state-card">
              <p className="state-label">Stored expression</p>
              <code data-testid="stored-expression-value">
                {activeEditorState.lastValid.normalizedExpression}
              </code>
            </article>
            <article className="state-card">
              <p className="state-label">Mode variables</p>
              <p>{activeModeDefinition.variables.join(', ')}</p>
            </article>
            <article className="state-card">
              <p className="state-label">Parameters in use</p>
              <p>
                {activeEditorState.lastValid.referencedParameters.length > 0
                  ? activeEditorState.lastValid.referencedParameters.join(', ')
                  : 'None'}
              </p>
            </article>
          </div>
        </section>

        <section className="panel plot-panel" aria-labelledby="plot-heading">
          <div className="panel-heading">
            <p className="eyebrow">Live graph</p>
            <h2 id="plot-heading">{activePlotModel.title}</h2>
            <p>{activePlotModel.description}</p>
          </div>

          <div className="plot-meta">
            <div>
              <span className="state-label">Current graph</span>
              <code>{activeEditorState.lastValid.normalizedExpression}</code>
            </div>
            <div>
              <span className="state-label">Interaction</span>
              <p>{activePlotModel.interactionHint}</p>
            </div>
          </div>

          <PlotCanvas plot={activePlotModel.plot} plotTestId={activePlotModel.plotTestId} />
        </section>
      </section>

      <section className="support-grid" aria-label="Formula guidance">
        <article className="panel support-card">
          <p className="eyebrow">Accepted syntax</p>
          <h2>Small, deterministic grammar.</h2>
          <p>
            Use <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>^</code>,
            parentheses, constants, and named functions. Implicit multiplication like{' '}
            <code>2x</code> or <code>x(y + 1)</code> is rejected so the result model stays
            predictable.
          </p>
        </article>

        <article className="panel support-card">
          <p className="eyebrow">Function set</p>
          <h2>Supported by the validator and evaluator.</h2>
          <p className="function-list">{SUPPORTED_FUNCTION_REFERENCE.join(', ')}</p>
        </article>
      </section>
    </main>
  )
}

export default App
