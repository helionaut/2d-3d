import type { PresetParameterDefinition } from '../lib/presets'

interface ParameterControlsProps {
  definitions: PresetParameterDefinition[]
  draftValues: Record<string, string>
  errors: Record<string, string>
  onChange: (id: string, value: string) => void
}

export function ParameterControls({
  definitions,
  draftValues,
  errors,
  onChange,
}: ParameterControlsProps) {
  if (definitions.length === 0) {
    return null
  }

  return (
    <section className="control-group" aria-labelledby="parameter-heading">
      <div className="group-heading">
        <p className="eyebrow">Parameters</p>
        <h2 id="parameter-heading">Tune the preset variables before rendering.</h2>
      </div>

      <div className="sample-grid">
        {definitions.map((definition) => (
          <label key={definition.id} className="control-card sample-card" htmlFor={`parameter-${definition.id}`}>
            <span className="sample-title">{definition.label ?? definition.id}</span>
            <span className="control-copy">
              Use <code>{definition.id}</code> in the expression.
            </span>
            <input
              aria-label={definition.label ?? definition.id}
              id={`parameter-${definition.id}`}
              name={definition.id}
              type="number"
              inputMode="decimal"
              min={definition.min}
              max={definition.max}
              step={definition.step}
              value={draftValues[definition.id] ?? ''}
              onChange={(event) => onChange(definition.id, event.target.value)}
            />
            <span className="field-hint">
              Default: {definition.default}
              {definition.min !== undefined && definition.max !== undefined
                ? ` • Range: ${definition.min} to ${definition.max}`
                : ''}
            </span>
            {errors[definition.id] ? <span className="field-error">{errors[definition.id]}</span> : null}
          </label>
        ))}
      </div>
    </section>
  )
}
