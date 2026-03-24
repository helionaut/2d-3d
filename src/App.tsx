import { useState, type FormEvent } from 'react'

import { GraphControls } from './components/GraphControls'
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
import {
  createDefaultPlotControls,
  createPlotControlDraft,
  formatRangeSummary,
  formatSampleSummary,
  validatePlotControlDraft,
  type PlotControlDraft2D,
  type PlotControlDraft3D,
  type PlotControls2D,
  type PlotControls3D,
  type RangeAxis,
  type SampleFieldKey,
} from './lib/graphControls'
import { buildPlotModel } from './lib/plotting'
import './App.css'

interface ModeEditorState<Mode extends GraphMode> {
  rawInput: string
  validation: ExpressionValidationResult
  lastRendered: ExpressionValidationSuccess & { mode: Mode }
  draftControls: PlotControlDraft2D | PlotControlDraft3D
  appliedControls: PlotControls2D | PlotControls3D
}

type ModeEditorStateByMode = {
  '2d': ModeEditorState<'2d'>
  '3d': ModeEditorState<'3d'>
}

function createInitialModeState<Mode extends GraphMode>(mode: Mode): ModeEditorState<Mode> {
  const initialValidation = validateExpressionInput({
    mode,
    rawInput: MODE_DEFINITIONS[mode].exampleInput,
  })

  if (!initialValidation.ok) {
    throw new Error(`Initial formula for ${mode} mode must be valid.`)
  }

  return {
    rawInput: MODE_DEFINITIONS[mode].exampleInput,
    validation: initialValidation,
    lastRendered: initialValidation as ExpressionValidationSuccess & { mode: Mode },
    draftControls: createPlotControlDraft(mode),
    appliedControls: createDefaultPlotControls(mode),
  }
}

function createInitialEditorState(): ModeEditorStateByMode {
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
  const activeControlValidation = validatePlotControlDraft(mode, activeEditorState.draftControls)
  const activePlotModel = buildPlotModel(activeEditorState.lastRendered, activeEditorState.appliedControls)
  const activeControlErrors = activeControlValidation.ok ? {} : activeControlValidation.errors
  const isFormulaDirty = activeEditorState.validation.ok
    ? activeEditorState.validation.normalizedExpression !==
      activeEditorState.lastRendered.normalizedExpression
    : activeEditorState.rawInput !== activeEditorState.lastRendered.rawInput
  const isControlDirty =
    JSON.stringify(activeEditorState.draftControls) !==
    JSON.stringify(createPlotControlDraft(mode, activeEditorState.appliedControls))
  const hasPendingChanges = isFormulaDirty || isControlDirty
  const canRender = activeEditorState.validation.ok && activeControlValidation.ok

  const handleFormulaChange = (nextRawInput: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]
      const nextValidation = validateExpressionInput({
        mode,
        rawInput: nextRawInput,
      })

      return {
        ...currentState,
        [mode]: {
          ...activeState,
          rawInput: nextRawInput,
          validation: nextValidation,
        },
      }
    })
  }

  const handleRangeChange = (axis: RangeAxis, boundary: 'min' | 'max', value: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]

      if (!(axis in activeState.draftControls)) {
        return currentState
      }

      return {
        ...currentState,
        [mode]: {
          ...activeState,
          draftControls: {
            ...activeState.draftControls,
            [axis]: {
              ...(activeState.draftControls as Record<RangeAxis, { min: string; max: string }>)[axis],
              [boundary]: value,
            },
          },
        },
      }
    })
  }

  const handleSampleChange = (field: SampleFieldKey, value: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]

      if (!(field in activeState.draftControls)) {
        return currentState
      }

      return {
        ...currentState,
        [mode]: {
          ...activeState,
          draftControls: {
            ...activeState.draftControls,
            [field]: value,
          },
        },
      }
    })
  }

  const handleRender = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeEditorState.validation.ok || !activeControlValidation.ok) {
      return
    }

    setEditorStateByMode((currentState) => ({
      ...currentState,
      [mode]: {
        ...currentState[mode],
        lastRendered: activeEditorState.validation,
        appliedControls: activeControlValidation.value,
      },
    }))
  }

  const handleReset = () => {
    setEditorStateByMode((currentState) => ({
      ...currentState,
      [mode]: createInitialModeState(mode),
    }))
  }

  return (
    <main className="calculator-shell">
      <section className="hero-card" aria-labelledby="app-title">
        <div className="hero-copy">
          <p className="eyebrow">Online function grapher</p>
          <h1 id="app-title">Plot a 2D curve or 3D surface from one expression.</h1>
          <p className="lede">
            Switch modes, set the visible ranges, and render the graph with one responsive control
            surface for both views.
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
        <form className="panel editor-panel" aria-labelledby="editor-heading" onSubmit={handleRender}>
          <div className="panel-heading">
            <p className="eyebrow">Calculator controls</p>
            <h2 id="editor-heading">Set the formula and viewport for {activeModeDefinition.label} mode.</h2>
            <p>
              {activeModeDefinition.label} mode accepts a raw expression or an optional
              <code>{` ${activeModeDefinition.dependentVariable} = ...`}</code> prefix.
            </p>
          </div>

          <label className="field-label" htmlFor="formula-input">
            Expression
          </label>
          <textarea
            id="formula-input"
            className={`formula-input ${activeEditorState.validation.ok ? '' : 'has-error'}`}
            value={activeEditorState.rawInput}
            onChange={(event) => handleFormulaChange(event.target.value)}
            aria-invalid={!activeEditorState.validation.ok}
            spellCheck={false}
            rows={2}
          />
          <p className="field-hint">
            Variables: <code>{activeModeDefinition.variables.join(', ')}</code>. Constants:{' '}
            <code>{SUPPORTED_CONSTANTS.join(', ')}</code>. Functions use parentheses and explicit
            operators only.
          </p>

          {activeEditorState.validation.ok ? (
            <p
              className={`status-banner ${hasPendingChanges ? 'is-pending' : 'is-valid'}`}
              role="status"
            >
              <strong>{hasPendingChanges ? 'Changes ready.' : 'Graph up to date.'}</strong>{' '}
              {hasPendingChanges
                ? 'Render graph to update the viewport.'
                : 'The rendered graph matches the current formula and controls.'}
            </p>
          ) : (
            <div className="status-banner is-error">
              <p role="alert">{activeEditorState.validation.error.message}</p>
              <p className="recovery-copy">The viewport keeps the last rendered graph until you recover.</p>
            </div>
          )}

          {activeEditorState.validation.ok && !activeControlValidation.ok ? (
            <div className="status-banner is-error">
              <p role="alert">Review the highlighted graph controls before rendering.</p>
              <p className="recovery-copy">The current viewport stays active until the control values are valid.</p>
            </div>
          ) : null}

          <div className="action-row">
            <button className="primary-button" type="submit" disabled={!canRender}>
              Render graph
            </button>
            <button className="secondary-button" type="button" onClick={handleReset}>
              Reset mode
            </button>
          </div>

          <GraphControls
            mode={mode}
            draftControls={activeEditorState.draftControls}
            errors={activeControlErrors}
            onRangeChange={handleRangeChange}
            onSampleChange={handleSampleChange}
          />

          <article className="support-card support-card-inline">
            <p className="eyebrow">Math support</p>
            <h2>Available functions</h2>
            <p className="function-list">{SUPPORTED_FUNCTION_REFERENCE.join(', ')}</p>
          </article>
        </form>

        <section className="panel plot-panel" aria-labelledby="plot-heading">
          <div className="panel-heading">
            <p className="eyebrow">Graph viewport</p>
            <h2 id="plot-heading">{activePlotModel.title}</h2>
            <p>{activePlotModel.description}</p>
          </div>

          <div className="rendered-state-grid">
            <div>
              <span className="state-label">Rendered expression</span>
              <code data-testid="rendered-expression-value">
                {activeModeDefinition.dependentVariable} = {activeEditorState.lastRendered.normalizedExpression}
              </code>
            </div>
            <div>
              <span className="state-label">Interaction</span>
              <p>{activePlotModel.interactionHint}</p>
            </div>
            <div>
              <span className="state-label">X range</span>
              <p data-testid="rendered-x-range">
                {formatRangeSummary(activeEditorState.appliedControls.x)}
              </p>
            </div>
            <div>
              <span className="state-label">Y range</span>
              <p data-testid="rendered-y-range">
                {formatRangeSummary(activeEditorState.appliedControls.y)}
              </p>
            </div>
            {'z' in activeEditorState.appliedControls ? (
              <div>
                <span className="state-label">Z range</span>
                <p data-testid="rendered-z-range">
                  {formatRangeSummary(activeEditorState.appliedControls.z)}
                </p>
              </div>
            ) : (
              <div>
                <span className="state-label">Samples</span>
                <p data-testid="rendered-samples">
                  {formatSampleSummary(activeEditorState.appliedControls.samples)}
                </p>
              </div>
            )}
            {'xSamples' in activeEditorState.appliedControls ? (
              <>
                <div>
                  <span className="state-label">X samples</span>
                  <p data-testid="rendered-x-samples">
                    {formatSampleSummary(activeEditorState.appliedControls.xSamples)}
                  </p>
                </div>
                <div>
                  <span className="state-label">Y samples</span>
                  <p data-testid="rendered-y-samples">
                    {formatSampleSummary(activeEditorState.appliedControls.ySamples)}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          <PlotCanvas plot={activePlotModel.plot} plotTestId={activePlotModel.plotTestId} />
        </section>
      </section>
    </main>
  )
}

export default App
