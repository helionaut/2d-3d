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

export type PlotViewportRelayoutEvent = Record<string, unknown>

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
const MAX_SURFACE_GRID_CELLS = 12_000

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
        max: 121,
      },
      {
        field: 'ySamples',
        label: 'Y samples',
        description: 'Rows sampled along the y-axis.',
        min: 9,
        max: 121,
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
    z: { min: -1.5, max: 1.5 },
    xSamples: 96,
    ySamples: 96,
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

  if (xSamples * ySamples > MAX_SURFACE_GRID_CELLS) {
    const message =
      `Combined surface density must stay at or below ${MAX_SURFACE_GRID_CELLS.toLocaleString()} cells.`
    errors.xSamples = message
    errors.ySamples = message
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

export function applyViewportRelayout2D({
  currentControls,
  resetControls,
  relayoutData,
}: {
  currentControls: PlotControls2D
  resetControls: PlotControls2D
  relayoutData: PlotViewportRelayoutEvent
}): PlotControls2D | null {
  const nextControls: PlotControls2D = {
    x: { ...currentControls.x },
    y: { ...currentControls.y },
    samples: currentControls.samples,
  }
  let changed = false

  for (const axis of ['x', 'y'] as const) {
    if (readAxisAutorange(relayoutData, axis)) {
      if (!rangesMatch(nextControls[axis], resetControls[axis])) {
        nextControls[axis] = { ...resetControls[axis] }
        changed = true
      }
      continue
    }

    const nextRange = readAxisRange(relayoutData, axis, currentControls[axis])
    if (!nextRange || rangesMatch(nextControls[axis], nextRange)) {
      continue
    }

    nextControls[axis] = nextRange
    changed = true
  }

  return changed ? nextControls : null
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

function readAxisAutorange(relayoutData: PlotViewportRelayoutEvent, axis: 'x' | 'y'): boolean {
  return relayoutData[`${axis}axis.autorange`] === true
}

function readAxisRange(
  relayoutData: PlotViewportRelayoutEvent,
  axis: 'x' | 'y',
  fallbackRange: NumericRange,
): NumericRange | null {
  const directRange = relayoutData[`${axis}axis.range`]

  if (Array.isArray(directRange) && directRange.length >= 2) {
    const min = parseFiniteNumber(directRange[0])
    const max = parseFiniteNumber(directRange[1])

    if (min !== null && max !== null && min < max) {
      return { min, max }
    }
  }

  const minimum = parseFiniteNumber(relayoutData[`${axis}axis.range[0]`]) ?? fallbackRange.min
  const maximum = parseFiniteNumber(relayoutData[`${axis}axis.range[1]`]) ?? fallbackRange.max

  if (
    relayoutData[`${axis}axis.range[0]`] === undefined &&
    relayoutData[`${axis}axis.range[1]`] === undefined
  ) {
    return null
  }

  if (minimum >= maximum) {
    return null
  }

  return {
    min: minimum,
    max: maximum,
  }
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function rangesMatch(left: NumericRange, right: NumericRange): boolean {
  return left.min === right.min && left.max === right.max
}
