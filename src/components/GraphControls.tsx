import type { GraphMode } from '../lib/expression'
import {
  CONTROL_LAYOUT,
  type PlotControlDraft2D,
  type PlotControlDraft3D,
  type PlotControlErrors,
  type RangeAxis,
  type SampleFieldKey,
} from '../lib/graphControls'

interface GraphControlsProps {
  mode: GraphMode
  draftControls: PlotControlDraft2D | PlotControlDraft3D
  errors: PlotControlErrors
  onRangeChange: (axis: RangeAxis, boundary: 'min' | 'max', value: string) => void
  onSampleChange: (field: SampleFieldKey, value: string) => void
}

export function GraphControls({
  mode,
  draftControls,
  errors,
  onRangeChange,
  onSampleChange,
}: GraphControlsProps) {
  const layout = CONTROL_LAYOUT[mode]

  return (
    <div className="control-sections">
      <section className="control-group" aria-labelledby={`${mode}-viewport-heading`}>
        <div className="group-heading">
          <p className="eyebrow">Viewport</p>
          <h2 id={`${mode}-viewport-heading`}>Choose the visible coordinate ranges.</h2>
        </div>

        <div className="range-grid">
          {layout.rangeControls.map((definition) => {
            const range = (draftControls as Record<RangeAxis, { min: string; max: string } | undefined>)[
              definition.axis
            ]

            if (!range) {
              return null
            }

            return (
              <fieldset key={definition.axis} className="control-card range-card">
                <legend>{definition.label}</legend>
                <p className="control-copy">{definition.description}</p>

                <div className="range-inputs">
                  <label className="inline-field" htmlFor={`${mode}-${definition.axis}-min`}>
                    <span>{definition.axis.toUpperCase()} minimum</span>
                    <input
                      id={`${mode}-${definition.axis}-min`}
                      name={`${definition.axis}-min`}
                      type="number"
                      inputMode="decimal"
                      value={range.min}
                      onChange={(event) => onRangeChange(definition.axis, 'min', event.target.value)}
                    />
                  </label>

                  <label className="inline-field" htmlFor={`${mode}-${definition.axis}-max`}>
                    <span>{definition.axis.toUpperCase()} maximum</span>
                    <input
                      id={`${mode}-${definition.axis}-max`}
                      name={`${definition.axis}-max`}
                      type="number"
                      inputMode="decimal"
                      value={range.max}
                      onChange={(event) => onRangeChange(definition.axis, 'max', event.target.value)}
                    />
                  </label>
                </div>

                {errors[definition.axis] ? (
                  <p className="field-error" role="alert">
                    {errors[definition.axis]}
                  </p>
                ) : null}
              </fieldset>
            )
          })}
        </div>
      </section>

      <section className="control-group" aria-labelledby={`${mode}-sampling-heading`}>
        <div className="group-heading">
          <p className="eyebrow">Sampling</p>
          <h2 id={`${mode}-sampling-heading`}>Balance detail and responsiveness.</h2>
        </div>

        <div className="sample-grid">
          {layout.sampleControls.map((definition) => {
            const value =
              definition.field in draftControls
                ? (draftControls as unknown as Record<string, string | undefined>)[definition.field]
                : undefined

            if (typeof value !== 'string') {
              return null
            }

            return (
              <label key={definition.field} className="control-card sample-card" htmlFor={`${mode}-${definition.field}`}>
                <span className="sample-title">{definition.label}</span>
                <span className="control-copy">{definition.description}</span>
                <input
                  aria-label={definition.label}
                  id={`${mode}-${definition.field}`}
                  name={definition.field}
                  type="number"
                  inputMode="numeric"
                  min={definition.min}
                  max={definition.max}
                  step={1}
                  value={value}
                  onChange={(event) => onSampleChange(definition.field, event.target.value)}
                />
                <span className="field-hint">
                  Range: {definition.min} to {definition.max}
                </span>
                {errors[definition.field] ? <span className="field-error">{errors[definition.field]}</span> : null}
              </label>
            )
          })}
        </div>
      </section>
    </div>
  )
}
