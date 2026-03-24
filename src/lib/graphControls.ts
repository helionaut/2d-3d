import type { GraphMode } from './expression'

export type RangeAxis = 'x' | 'y' | 'z'
export type SampleFieldKey = 'samples' | 'xSamples' | 'ySamples'

export interface NumericRange {
  min: number
  max: number
}

export interface NumericRangeDraft {
  min: string
  max: string
}

export interface PlotControls2D {
  x: NumericRange
  y: NumericRange
  samples: number
}

export interface PlotControls3D {
  x: NumericRange
  y: NumericRange
  z: NumericRange
  xSamples: number
  ySamples: number
}

export interface PlotControlDraft2D {
  x: NumericRangeDraft
  y: NumericRangeDraft
  samples: string
}

export interface PlotControlDraft3D {
  x: NumericRangeDraft
  y: NumericRangeDraft
  z: NumericRangeDraft
  xSamples: string
  ySamples: string
}

export type PlotControlsByMode = {
  '2d': PlotControls2D
  '3d': PlotControls3D
}

export type PlotControlDraftByMode = {
  '2d': PlotControlDraft2D
  '3d': PlotControlDraft3D
}

export type PlotControlErrorKey = RangeAxis | SampleFieldKey
export type PlotControlErrors = Partial<Record<PlotControlErrorKey, string>>

export type PlotControlValidationResult<Mode extends GraphMode> =
  | {
      ok: true
      value: PlotControlsByMode[Mode]
    }
  | {
      ok: false
      errors: PlotControlErrors
    }

export interface RangeControlDefinition {
  axis: RangeAxis
  label: string
  description: string
}

export interface SampleControlDefinition {
  field: SampleFieldKey
  label: string
  description: string
  min: number
  max: number
}

const twoPi = Math.PI * 2

export const CONTROL_LAYOUT: Record<
  GraphMode,
  {
    rangeControls: RangeControlDefinition[]
    sampleControls: SampleControlDefinition[]
  }
> = {
  '2d': {
    rangeControls: [
      {
        axis: 'x',
        label: 'X range',
        description: 'Visible horizontal domain for the curve.',
      },
      {
        axis: 'y',
        label: 'Y range',
        description: 'Visible vertical range for the curve.',
      },
    ],
    sampleControls: [
      {
        field: 'samples',
        label: 'Samples',
        description: 'Points evaluated across the x-axis for the rendered curve.',
        min: 25,
        max: 801,
      },
    ],
  },
  '3d': {
    rangeControls: [
      {
        axis: 'x',
        label: 'X range',
        description: 'Visible x-domain for the surface.',
      },
      {
        axis: 'y',
        label: 'Y range',
        description: 'Visible y-domain for the surface.',
      },
      {
        axis: 'z',
        label: 'Z range',
        description: 'Visible z-range for the surface viewport.',
      },
    ],
    sampleControls: [
      {
        field: 'xSamples',
        label: 'X samples',
        description: 'Columns sampled along the x-axis.',
        min: 9,
        max: 81,
      },
      {
        field: 'ySamples',
        label: 'Y samples',
        description: 'Rows sampled along the y-axis.',
        min: 9,
        max: 81,
      },
    ],
  },
}

const DEFAULT_PLOT_CONTROLS: PlotControlsByMode = {
  '2d': {
    x: { min: -twoPi, max: twoPi },
    y: { min: -1.5, max: 1.5 },
    samples: 241,
  },
  '3d': {
    x: { min: -Math.PI, max: Math.PI },
    y: { min: -Math.PI, max: Math.PI },
    z: { min: -1, max: 1 },
    xSamples: 33,
    ySamples: 33,
  },
}

export function createDefaultPlotControls<Mode extends GraphMode>(
  mode: Mode,
): PlotControlsByMode[Mode] {
  return cloneControls(DEFAULT_PLOT_CONTROLS[mode]) as PlotControlsByMode[Mode]
}

export function createPlotControlDraft<Mode extends GraphMode>(
  mode: Mode,
  controls = createDefaultPlotControls(mode),
): PlotControlDraftByMode[Mode] {
  if (mode === '2d') {
    const curveControls = controls as PlotControls2D

    return {
      x: createRangeDraft(curveControls.x),
      y: createRangeDraft(curveControls.y),
      samples: String(curveControls.samples),
    } as PlotControlDraftByMode[Mode]
  }

  const surfaceControls = controls as PlotControls3D

  return {
    x: createRangeDraft(surfaceControls.x),
    y: createRangeDraft(surfaceControls.y),
    z: createRangeDraft(surfaceControls.z),
    xSamples: String(surfaceControls.xSamples),
    ySamples: String(surfaceControls.ySamples),
  } as PlotControlDraftByMode[Mode]
}

export function validatePlotControlDraft<Mode extends GraphMode>(
  mode: Mode,
  draft: PlotControlDraftByMode[Mode],
): PlotControlValidationResult<Mode> {
  const errors: PlotControlErrors = {}

  if (mode === '2d') {
    const curveDraft = draft as PlotControlDraft2D
    const x = parseRangeDraft(curveDraft.x, 'x', 'X range', errors)
    const y = parseRangeDraft(curveDraft.y, 'y', 'Y range', errors)
    const samples = parseSampleDraft(curveDraft.samples, CONTROL_LAYOUT['2d'].sampleControls[0], errors)

    if (!x || !y || samples === null) {
      return { ok: false, errors }
    }

    return {
      ok: true,
      value: {
        x,
        y,
        samples,
      } as PlotControlsByMode[Mode],
    }
  }

  const surfaceDraft = draft as PlotControlDraft3D
  const x = parseRangeDraft(surfaceDraft.x, 'x', 'X range', errors)
  const y = parseRangeDraft(surfaceDraft.y, 'y', 'Y range', errors)
  const z = parseRangeDraft(surfaceDraft.z, 'z', 'Z range', errors)
  const xSamples = parseSampleDraft(surfaceDraft.xSamples, CONTROL_LAYOUT['3d'].sampleControls[0], errors)
  const ySamples = parseSampleDraft(surfaceDraft.ySamples, CONTROL_LAYOUT['3d'].sampleControls[1], errors)

  if (!x || !y || !z || xSamples === null || ySamples === null) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      x,
      y,
      z,
      xSamples,
      ySamples,
    } as PlotControlsByMode[Mode],
  }
}

export function formatRangeSummary(range: NumericRange): string {
  return `${formatDisplayNumber(range.min)} to ${formatDisplayNumber(range.max)}`
}

export function formatSampleSummary(value: number): string {
  return String(value)
}

function cloneControls<TControls extends PlotControls2D | PlotControls3D>(controls: TControls): TControls {
  return structuredClone(controls)
}

function createRangeDraft(range: NumericRange): NumericRangeDraft {
  return {
    min: formatDraftNumber(range.min),
    max: formatDraftNumber(range.max),
  }
}

function parseRangeDraft(
  range: NumericRangeDraft,
  key: RangeAxis,
  label: string,
  errors: PlotControlErrors,
): NumericRange | null {
  const minimum = Number(range.min)
  const maximum = Number(range.max)

  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    errors[key] = `${label} needs numeric minimum and maximum values.`
    return null
  }

  if (minimum >= maximum) {
    errors[key] = `${label} minimum must be less than maximum.`
    return null
  }

  return {
    min: minimum,
    max: maximum,
  }
}

function parseSampleDraft(
  value: string,
  definition: SampleControlDefinition,
  errors: PlotControlErrors,
): number | null {
  const sampleCount = Number(value)

  if (!Number.isInteger(sampleCount)) {
    errors[definition.field] = `${definition.label} must be a whole number.`
    return null
  }

  if (sampleCount < definition.min || sampleCount > definition.max) {
    errors[definition.field] =
      `${definition.label} must stay between ${definition.min} and ${definition.max}.`
    return null
  }

  return sampleCount
}

function formatDraftNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(Number(value.toFixed(2)))
}

function formatDisplayNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
