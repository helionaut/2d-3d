import { describe, expect, it } from 'vitest'

import {
  BUILT_IN_PRESETS,
  getBuiltInPresetById,
  getDefaultPresetForMode,
  hydratePresetState,
} from '../../src/lib/presets'

describe('presets', () => {
  it('loads manifest-backed built-in presets for both modes', () => {
    expect(BUILT_IN_PRESETS.map((preset) => preset.id)).toEqual([
      'canonical-sine',
      'amplitude-sine',
      'canonical-sine-cosine-surface',
    ])
    expect(BUILT_IN_PRESETS.map((preset) => preset.mode)).toEqual(['2d', '2d', '3d'])
  })

  it('prefers the canonical preset as the default entry point for each mode', () => {
    expect(getDefaultPresetForMode('2d').id).toBe('canonical-sine')
    expect(getDefaultPresetForMode('3d').id).toBe('canonical-sine-cosine-surface')
  })

  it('hydrates a parameterized preset into expression, parameters, viewport, and sampling state', () => {
    const preset = getBuiltInPresetById('amplitude-sine')
    const state = hydratePresetState(preset)

    expect(state.selectedPresetId).toBe('amplitude-sine')
    expect(state.rawInput).toBe('y = a * sin(b * x)')
    expect(state.parameterDefinitions.map((definition) => definition.id)).toEqual(['a', 'b'])
    expect(state.parameterDraftValues).toEqual({ a: '2', b: '3' })
    expect(state.validation.ok).toBe(true)
    expect(state.lastRendered.parameterValues).toEqual({ a: 2, b: 3 })
    expect(state.appliedControls).toMatchObject({
      x: { min: -6.2831853072, max: 6.2831853072 },
      y: { min: -2.5, max: 2.5 },
      samples: 361,
    })
  })
})
