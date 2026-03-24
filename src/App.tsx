import { useState, type FormEvent } from 'react'

import { GraphControls } from './components/GraphControls'
import { ParameterControls } from './components/ParameterControls'
import { PlotCanvas } from './components/PlotCanvas'
import {
  MODE_DEFINITIONS,
  SUPPORTED_CONSTANTS,
  SUPPORTED_FUNCTION_REFERENCE,
  type ExpressionValidationResult,
  type ExpressionValidationSuccess,
  type GraphMode,
} from './lib/expression'
import {
  applyViewportRelayout2D,
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
import {
  BUILT_IN_PRESETS,
  getBuiltInPresetById,
  getDefaultPresetForMode,
  hydratePresetState,
  validateRuntimeExpressionState,
  type PresetParameterDefinition,
} from './lib/presets'
import { buildPlotModel } from './lib/plotting'
import './App.css'

interface ModeEditorState<Mode extends GraphMode> {
  selectedPresetId: string
  presetTitle: string
  presetDescription?: string
  parameterDefinitions: PresetParameterDefinition[]
  parameterDraftValues: Record<string, string>
  rawInput: string
  validation: ExpressionValidationResult
  lastRendered: ExpressionValidationSuccess & { mode: Mode }
  draftControls: PlotControlDraft2D | PlotControlDraft3D
  appliedControls: PlotControls2D | PlotControls3D
  presetControls: PlotControls2D | PlotControls3D
}

type ModeEditorStateByMode = {
  '2d': ModeEditorState<'2d'>
  '3d': ModeEditorState<'3d'>
}

function createInitialModeState<Mode extends GraphMode>(mode: Mode): ModeEditorState<Mode> {
  return hydratePresetState(getDefaultPresetForMode(mode)) as ModeEditorState<Mode>
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
  const activeRuntimeValidation = validateRuntimeExpressionState({
    mode,
    rawInput: activeEditorState.rawInput,
    parameterDefinitions: activeEditorState.parameterDefinitions,
    parameterDraftValues: activeEditorState.parameterDraftValues,
  })
  const activeControlValidation = validatePlotControlDraft(mode, activeEditorState.draftControls)
  const activePlotModel = buildPlotModel(activeEditorState.lastRendered, activeEditorState.appliedControls)
  const activeControlErrors = activeControlValidation.ok ? {} : activeControlValidation.errors
  const activeParameterErrors = activeRuntimeValidation.parameterErrors
  const getAppliedDraftControls = () =>
    mode === '2d'
      ? {
          x: {
            min: String((activeEditorState.appliedControls as PlotControls2D).x.min),
            max: String((activeEditorState.appliedControls as PlotControls2D).x.max),
          },
          y: {
            min: String((activeEditorState.appliedControls as PlotControls2D).y.min),
            max: String((activeEditorState.appliedControls as PlotControls2D).y.max),
          },
          samples: String((activeEditorState.appliedControls as PlotControls2D).samples),
        }
      : {
          x: {
            min: String((activeEditorState.appliedControls as PlotControls3D).x.min),
            max: String((activeEditorState.appliedControls as PlotControls3D).x.max),
          },
          y: {
            min: String((activeEditorState.appliedControls as PlotControls3D).y.min),
            max: String((activeEditorState.appliedControls as PlotControls3D).y.max),
          },
          z: {
            min: String((activeEditorState.appliedControls as PlotControls3D).z.min),
            max: String((activeEditorState.appliedControls as PlotControls3D).z.max),
          },
          xSamples: String((activeEditorState.appliedControls as PlotControls3D).xSamples),
          ySamples: String((activeEditorState.appliedControls as PlotControls3D).ySamples),
        }
  const isFormulaDirty = activeEditorState.validation.ok
    ? activeEditorState.validation.normalizedExpression !==
      activeEditorState.lastRendered.normalizedExpression
    : activeEditorState.rawInput !== activeEditorState.lastRendered.rawInput
  const areParametersDirty =
    JSON.stringify(activeEditorState.parameterDraftValues) !==
    JSON.stringify(
      Object.fromEntries(
        activeEditorState.parameterDefinitions.map((definition) => [
          definition.id,
          String(activeEditorState.lastRendered.parameterValues[definition.id] ?? definition.default),
        ]),
      ),
    )
  const isControlDirty =
    JSON.stringify(activeEditorState.draftControls) !== JSON.stringify(getAppliedDraftControls())
  const hasPendingChanges = isFormulaDirty || areParametersDirty || isControlDirty
  const canRender = activeRuntimeValidation.validation.ok && activeControlValidation.ok

  const handleFormulaChange = (nextRawInput: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]
      const nextValidation = validateRuntimeExpressionState({
        mode,
        rawInput: nextRawInput,
        parameterDefinitions: activeState.parameterDefinitions,
        parameterDraftValues: activeState.parameterDraftValues,
      }).validation

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

  const handleParameterChange = (parameterId: string, value: string) => {
    setEditorStateByMode((currentState) => {
      const activeState = currentState[mode]
      const parameterDraftValues = {
        ...activeState.parameterDraftValues,
        [parameterId]: value,
      }
      const nextValidation = validateRuntimeExpressionState({
        mode,
        rawInput: activeState.rawInput,
        parameterDefinitions: activeState.parameterDefinitions,
        parameterDraftValues,
      }).validation

      return {
        ...currentState,
        [mode]: {
          ...activeState,
          parameterDraftValues,
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

    if (!activeRuntimeValidation.validation.ok || !activeControlValidation.ok) {
      return
    }

    setEditorStateByMode((currentState) => ({
      ...currentState,
      [mode]: {
        ...currentState[mode],
        lastRendered: activeRuntimeValidation.validation,
        appliedControls: activeControlValidation.value,
      },
    }))
  }

  const handleReset = () => {
    setEditorStateByMode((currentState) => ({
      ...currentState,
      [mode]: hydratePresetState(getBuiltInPresetById(currentState[mode].selectedPresetId) as never),
    }))
  }

  const handlePresetChange = (presetId: string) => {
    const preset = getBuiltInPresetById(presetId)

    setEditorStateByMode((currentState) => ({
      ...currentState,
      [preset.mode]: hydratePresetState(preset as never),
    }))
    setMode(preset.mode)
  }

  const handleViewportChange = (event: Record<string, unknown>) => {
    if (mode !== '2d') {
      return
    }

    setEditorStateByMode((currentState) => {
      const activeState = currentState['2d']
      const nextControls = applyViewportRelayout2D({
        currentControls: activeState.appliedControls as PlotControls2D,
        resetControls: activeState.presetControls as PlotControls2D,
        relayoutData: event,
      })

      if (!nextControls) {
        return currentState
      }

      return {
        ...currentState,
        '2d': {
          ...activeState,
          appliedControls: nextControls,
          draftControls: createPlotControlDraft('2d', nextControls),
        },
      }
    })
  }

  return (
    <main className="calculator-shell">
      <section className="hero-card" aria-labelledby="app-title">
        <div className="hero-copy">
          <p className="eyebrow">Built-in examples</p>
          <h1 id="app-title">Start from a checked-in 2D curve or 3D surface preset.</h1>
          <p className="lede">
            Load a preset, adjust the formula or parameters, then render the graph with one
            responsive control surface for both views.
          </p>
        </div>

        <div className="preset-picker">
          <label className="field-label" htmlFor="preset-select">
            Built-in example
          </label>
          <select
            id="preset-select"
            className="preset-select"
            value={activeEditorState.selectedPresetId}
            onChange={(event) => handlePresetChange(event.target.value)}
          >
            {(['2d', '3d'] as GraphMode[]).map((presetMode) => (
              <optgroup key={presetMode} label={MODE_DEFINITIONS[presetMode].label}>
                {BUILT_IN_PRESETS.filter((preset) => preset.mode === presetMode).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="field-hint">{activeEditorState.presetDescription ?? 'Loaded from presets/manifest.json.'}</p>
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
            <h2 id="editor-heading">Adjust {activeEditorState.presetTitle} for {activeModeDefinition.label} mode.</h2>
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
            className={`formula-input ${activeRuntimeValidation.validation.ok ? '' : 'has-error'}`}
            value={activeEditorState.rawInput}
            onChange={(event) => handleFormulaChange(event.target.value)}
            aria-invalid={!activeRuntimeValidation.validation.ok}
            spellCheck={false}
            rows={2}
          />
          <p className="field-hint">
            Variables: <code>{activeModeDefinition.variables.join(', ')}</code>. Constants:{' '}
            <code>{SUPPORTED_CONSTANTS.join(', ')}</code>. Functions use parentheses and explicit
            operators only.
          </p>

          {activeRuntimeValidation.validation.ok ? (
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
              <p role="alert">{activeRuntimeValidation.validation.error.message}</p>
              <p className="recovery-copy">The viewport keeps the last rendered graph until you recover.</p>
            </div>
          )}

          {activeRuntimeValidation.validation.ok && !activeControlValidation.ok ? (
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

          <ParameterControls
            definitions={activeEditorState.parameterDefinitions}
            draftValues={activeEditorState.parameterDraftValues}
            errors={activeParameterErrors}
            onChange={handleParameterChange}
          />

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

          {activePlotModel.notice ? (
            <p className="status-banner is-error" role="status" data-testid="plot-notice">
              {activePlotModel.notice}
            </p>
          ) : null}

          <PlotCanvas
            plot={activePlotModel.plot}
            plotTestId={activePlotModel.plotTestId}
            onViewportChange={handleViewportChange}
          />
        </section>
      </section>
    </main>
  )
}

export default App
