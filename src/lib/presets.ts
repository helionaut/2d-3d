import { MODE_DEFINITIONS, validateExpressionInput, type GraphMode } from './expression'
import {
  createPlotControlDraft,
  validatePlotControlDraft,
  type PlotControlDraftByMode,
  type PlotControls2D,
  type PlotControls3D,
  type PlotControlsByMode,
} from './graphControls'

interface PresetManifestEntry {
  id: string
  mode: GraphMode
  path: string
  canonical?: boolean
}

interface PresetManifest {
  version: number
  presets: PresetManifestEntry[]
}

export interface PresetParameterDefinition {
  id: string
  label?: string
  default: number
  min?: number
  max?: number
  step?: number
}

interface BuiltInPresetBase<Mode extends GraphMode> {
  version: number
  id: string
  title: string
  description?: string
  mode: Mode
  expression: string
  parameters: PresetParameterDefinition[]
  tags: string[]
}

export interface BuiltInPreset2D extends BuiltInPresetBase<'2d'> {
  viewport: {
    x: { min: number; max: number }
    y: { min: number; max: number }
  }
  sampling: {
    samples: number
  }
}

export interface BuiltInPreset3D extends BuiltInPresetBase<'3d'> {
  viewport: {
    x: { min: number; max: number }
    y: { min: number; max: number }
    z: { min: number; max: number }
  }
  sampling: {
    xSamples: number
    ySamples: number
  }
}

export type BuiltInPreset = BuiltInPreset2D | BuiltInPreset3D

export interface HydratedPresetState<Mode extends GraphMode> {
  selectedPresetId: string
  presetTitle: string
  presetDescription?: string
  parameterDefinitions: PresetParameterDefinition[]
  parameterDraftValues: Record<string, string>
  rawInput: string
  validation: ReturnType<typeof validateExpressionInput> & { mode: Mode }
  lastRendered: Extract<ReturnType<typeof validateExpressionInput>, { ok: true }> & { mode: Mode }
  draftControls: PlotControlDraftByMode[Mode]
  appliedControls: PlotControlsByMode[Mode]
  presetControls: PlotControlsByMode[Mode]
}

export interface RuntimeValidation {
  parameterErrors: Record<string, string>
  validation: ReturnType<typeof validateExpressionInput>
}

const manifestModule = import.meta.glob('../../presets/manifest.json', {
  eager: true,
  import: 'default',
})['../../presets/manifest.json'] as unknown

const presetModules = import.meta.glob('../../presets/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const BUILT_IN_PRESETS = loadBuiltInPresets()

export function loadBuiltInPresets(): BuiltInPreset[] {
  const manifest = parseManifest(manifestModule)
  const seenIds = new Set<string>()

  return manifest.presets.map((entry) => {
    if (seenIds.has(entry.id)) {
      throw new Error(`Preset manifest contains duplicate id "${entry.id}".`)
    }

    seenIds.add(entry.id)

    const modulePath = `../../${entry.path}`
    const presetSource = presetModules[modulePath]
    if (presetSource === undefined) {
      throw new Error(`Preset manifest path "${entry.path}" does not resolve to a checked-in preset file.`)
    }

    return parsePreset(entry, presetSource)
  })
}

export function getBuiltInPresetById(id: string): BuiltInPreset {
  const preset = BUILT_IN_PRESETS.find((entry) => entry.id === id)
  if (!preset) {
    throw new Error(`Unknown preset "${id}".`)
  }

  return preset
}

export function getDefaultPresetForMode<Mode extends GraphMode>(mode: Mode): Extract<BuiltInPreset, { mode: Mode }> {
  const presets = BUILT_IN_PRESETS.filter(
    (preset): preset is Extract<BuiltInPreset, { mode: Mode }> => preset.mode === mode,
  )

  if (presets.length === 0) {
    throw new Error(`No built-in presets available for ${mode} mode.`)
  }

  return presets.find((preset) => isCanonicalPreset(mode, preset.id)) ?? presets[0]
}

export function hydratePresetState<Mode extends GraphMode>(
  preset: Extract<BuiltInPreset, { mode: Mode }>,
): HydratedPresetState<Mode> {
  const rawInput = formatPresetRawInput(preset)
  const parameterDraftValues = createParameterDraftValues(preset.parameters)
  const runtimeValidation = validateRuntimeExpressionState({
    mode: preset.mode,
    rawInput,
    parameterDefinitions: preset.parameters,
    parameterDraftValues,
  })

  if (!runtimeValidation.validation.ok) {
    throw new Error(`Preset "${preset.id}" failed runtime validation: ${runtimeValidation.validation.error.message}`)
  }

  const controls = createControlsFromPreset(preset) as PlotControlsByMode[Mode]

  return {
    selectedPresetId: preset.id,
    presetTitle: preset.title,
    presetDescription: preset.description,
    parameterDefinitions: preset.parameters,
    parameterDraftValues,
    rawInput,
    validation: runtimeValidation.validation as HydratedPresetState<Mode>['validation'],
    lastRendered: runtimeValidation.validation as HydratedPresetState<Mode>['lastRendered'],
    draftControls: createPlotControlDraft(preset.mode, controls),
    appliedControls: controls,
    presetControls: controls,
  }
}

export function createParameterDraftValues(
  definitions: PresetParameterDefinition[],
  parameterValues = Object.fromEntries(definitions.map((definition) => [definition.id, definition.default])),
): Record<string, string> {
  return Object.fromEntries(
    definitions.map((definition) => [definition.id, String(parameterValues[definition.id] ?? definition.default)]),
  )
}

export function validateRuntimeExpressionState({
  mode,
  rawInput,
  parameterDefinitions,
  parameterDraftValues,
}: {
  mode: GraphMode
  rawInput: string
  parameterDefinitions: PresetParameterDefinition[]
  parameterDraftValues: Record<string, string>
}): RuntimeValidation {
  const parameterErrors: Record<string, string> = {}
  const parsedParameterValues: Record<string, number> = {}

  for (const definition of parameterDefinitions) {
    const rawValue = parameterDraftValues[definition.id]?.trim() ?? ''
    const parsedValue = Number(rawValue)

    if (!rawValue || !Number.isFinite(parsedValue)) {
      parameterErrors[definition.id] = `Parameter "${definition.id}" must be a finite number.`
      continue
    }

    parsedParameterValues[definition.id] = parsedValue
  }

  if (Object.keys(parameterErrors).length > 0) {
    const [parameterId, message] = Object.entries(parameterErrors)[0]

    return {
      parameterErrors,
      validation: {
        ok: false,
        mode,
        rawInput,
        normalizedExpression: null,
        error: {
          code: 'invalid-parameter-value',
          message,
          start: 0,
          end: parameterId.length || 1,
        },
      },
    }
  }

  return {
    parameterErrors,
    validation: validateExpressionInput({
      mode,
      rawInput,
      parameterValues: parsedParameterValues,
    }),
  }
}

export function formatPresetRawInput(preset: BuiltInPreset): string {
  return `${MODE_DEFINITIONS[preset.mode].dependentVariable} = ${preset.expression}`
}

function parseManifest(source: unknown): PresetManifest {
  if (!isRecord(source)) {
    throw new Error('Preset manifest must be a JSON object.')
  }

  if (source.version !== 1) {
    throw new Error('Preset manifest version must equal 1.')
  }

  if (!Array.isArray(source.presets)) {
    throw new Error('Preset manifest must provide a presets array.')
  }

  return {
    version: 1,
    presets: source.presets.map((entry) => parseManifestEntry(entry)),
  }
}

function parseManifestEntry(source: unknown): PresetManifestEntry {
  if (!isRecord(source)) {
    throw new Error('Preset manifest entries must be JSON objects.')
  }

  if (source.mode !== '2d' && source.mode !== '3d') {
    throw new Error('Preset manifest entries must declare mode "2d" or "3d".')
  }

  if (typeof source.id !== 'string' || !source.id) {
    throw new Error('Preset manifest entries must provide a non-empty id.')
  }

  if (typeof source.path !== 'string' || !source.path) {
    throw new Error(`Preset "${source.id}" must provide a checked-in path.`)
  }

  return {
    id: source.id,
    mode: source.mode,
    path: source.path,
    canonical: source.canonical === true,
  }
}

function parsePreset(entry: PresetManifestEntry, source: unknown): BuiltInPreset {
  if (!isRecord(source)) {
    throw new Error(`Preset "${entry.id}" must be a JSON object.`)
  }

  if (source.version !== 1) {
    throw new Error(`Preset "${entry.id}" must declare version 1.`)
  }

  if (source.id !== entry.id) {
    throw new Error(`Preset file for "${entry.id}" must use the same id in the file body.`)
  }

  if (source.mode !== entry.mode) {
    throw new Error(`Preset "${entry.id}" mode does not match the manifest entry.`)
  }

  if (typeof source.title !== 'string' || !source.title) {
    throw new Error(`Preset "${entry.id}" must provide a title.`)
  }

  if (typeof source.expression !== 'string' || !source.expression) {
    throw new Error(`Preset "${entry.id}" must provide an expression.`)
  }

  const parameters = parseParameterDefinitions(entry.id, source.parameters)
  const preset =
    entry.mode === '2d'
      ? ({
          version: 1,
          id: entry.id,
          title: source.title,
          description: typeof source.description === 'string' ? source.description : undefined,
          mode: '2d',
          expression: source.expression,
          parameters,
          viewport: parseViewport2D(entry.id, source.viewport),
          sampling: parseSampling2D(entry.id, source.sampling),
          tags: parseTags(source.tags),
        } satisfies BuiltInPreset2D)
      : ({
          version: 1,
          id: entry.id,
          title: source.title,
          description: typeof source.description === 'string' ? source.description : undefined,
          mode: '3d',
          expression: source.expression,
          parameters,
          viewport: parseViewport3D(entry.id, source.viewport),
          sampling: parseSampling3D(entry.id, source.sampling),
          tags: parseTags(source.tags),
        } satisfies BuiltInPreset3D)

  const validation = validateExpressionInput({
    mode: preset.mode,
    rawInput: formatPresetRawInput(preset),
    parameterValues: Object.fromEntries(parameters.map((definition) => [definition.id, definition.default])),
  })

  if (!validation.ok) {
    throw new Error(`Preset "${entry.id}" expression is invalid: ${validation.error.message}`)
  }

  const controlsValidation = validatePlotControlDraft(
    preset.mode,
    createPlotControlDraft(preset.mode, createControlsFromPreset(preset)),
  )

  if (!controlsValidation.ok) {
    throw new Error(`Preset "${entry.id}" controls are invalid: ${Object.values(controlsValidation.errors)[0]}`)
  }

  return preset
}

function parseParameterDefinitions(id: string, source: unknown): PresetParameterDefinition[] {
  if (!Array.isArray(source)) {
    throw new Error(`Preset "${id}" must provide a parameters array.`)
  }

  return source.map((parameter, index) => parseParameterDefinition(id, parameter, index))
}

function parseParameterDefinition(id: string, source: unknown, index: number): PresetParameterDefinition {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" parameter #${index + 1} must be a JSON object.`)
  }

  if (typeof source.id !== 'string' || !source.id) {
    throw new Error(`Preset "${id}" parameter #${index + 1} must provide a non-empty id.`)
  }

  const definition: PresetParameterDefinition = {
    id: source.id,
    default: readFiniteNumber(id, `parameter "${source.id}" default`, source.default),
  }

  if (typeof source.label === 'string') {
    definition.label = source.label
  }

  if (source.min !== undefined) {
    definition.min = readFiniteNumber(id, `parameter "${source.id}" min`, source.min)
  }

  if (source.max !== undefined) {
    definition.max = readFiniteNumber(id, `parameter "${source.id}" max`, source.max)
  }

  if (source.step !== undefined) {
    definition.step = readFiniteNumber(id, `parameter "${source.id}" step`, source.step)
  }

  return definition
}

function parseViewport2D(id: string, source: unknown): BuiltInPreset2D['viewport'] {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" must provide a viewport object.`)
  }

  return {
    x: parseRange(id, 'viewport.x', source.x),
    y: parseRange(id, 'viewport.y', source.y),
  }
}

function parseViewport3D(id: string, source: unknown): BuiltInPreset3D['viewport'] {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" must provide a viewport object.`)
  }

  return {
    x: parseRange(id, 'viewport.x', source.x),
    y: parseRange(id, 'viewport.y', source.y),
    z: parseRange(id, 'viewport.z', source.z),
  }
}

function parseSampling2D(id: string, source: unknown): BuiltInPreset2D['sampling'] {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" must provide a sampling object.`)
  }

  return {
    samples: readPositiveInteger(id, 'sampling.samples', source.samples),
  }
}

function parseSampling3D(id: string, source: unknown): BuiltInPreset3D['sampling'] {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" must provide a sampling object.`)
  }

  return {
    xSamples: readPositiveInteger(id, 'sampling.xSamples', source.xSamples),
    ySamples: readPositiveInteger(id, 'sampling.ySamples', source.ySamples),
  }
}

function parseTags(source: unknown): string[] {
  if (!Array.isArray(source)) {
    return []
  }

  return source.filter((tag): tag is string => typeof tag === 'string')
}

function parseRange(id: string, label: string, source: unknown): { min: number; max: number } {
  if (!isRecord(source)) {
    throw new Error(`Preset "${id}" must provide ${label}.`)
  }

  const min = readFiniteNumber(id, `${label}.min`, source.min)
  const max = readFiniteNumber(id, `${label}.max`, source.max)

  if (min >= max) {
    throw new Error(`Preset "${id}" must provide ${label} with min < max.`)
  }

  return { min, max }
}

function createControlsFromPreset(preset: BuiltInPreset): PlotControls2D | PlotControls3D {
  if (preset.mode === '2d') {
    return {
      x: preset.viewport.x,
      y: preset.viewport.y,
      samples: preset.sampling.samples,
    }
  }

  return {
    x: preset.viewport.x,
    y: preset.viewport.y,
    z: preset.viewport.z,
    xSamples: preset.sampling.xSamples,
    ySamples: preset.sampling.ySamples,
  }
}

function readFiniteNumber(id: string, label: string, value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Preset "${id}" must provide a finite number for ${label}.`)
  }

  return value
}

function readPositiveInteger(id: string, label: string, value: unknown): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value <= 0) {
    throw new Error(`Preset "${id}" must provide a positive integer for ${label}.`)
  }

  return value
}

function isCanonicalPreset(mode: GraphMode, id: string): boolean {
  return (
    (manifestModule as PresetManifest).presets?.some?.(
      (entry) => entry.id === id && entry.mode === mode && entry.canonical === true,
    ) ?? false
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
