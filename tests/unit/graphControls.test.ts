import { describe, expect, it } from 'vitest'

import {
  applyViewportRelayout2D,
  createDefaultPlotControls,
  validatePlotControlDraft,
  type PlotControls2D,
} from '../../src/lib/graphControls'

describe('applyViewportRelayout2D', () => {
  it('maps explicit relayout ranges back into 2D controls', () => {
    const currentControls = createDefaultPlotControls('2d')

    const nextControls = applyViewportRelayout2D({
      currentControls,
      resetControls: createDefaultPlotControls('2d'),
      relayoutData: {
        'xaxis.range[0]': -4,
        'xaxis.range[1]': 2,
        'yaxis.range': [-3, 5],
      },
    })

    expect(nextControls).toEqual({
      x: { min: -4, max: 2 },
      y: { min: -3, max: 5 },
      samples: currentControls.samples,
    } satisfies PlotControls2D)
  })

  it('uses the reset viewport when Plotly emits autorange for both axes', () => {
    const resetControls = createDefaultPlotControls('2d')

    const nextControls = applyViewportRelayout2D({
      currentControls: {
        ...resetControls,
        x: { min: -2, max: 2 },
        y: { min: -4, max: 4 },
      },
      resetControls,
      relayoutData: {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      },
    })

    expect(nextControls).toEqual(resetControls)
  })

  it('ignores incomplete or unchanged relayout data', () => {
    const currentControls = createDefaultPlotControls('2d')

    expect(
      applyViewportRelayout2D({
        currentControls,
        resetControls: createDefaultPlotControls('2d'),
        relayoutData: {},
      }),
    ).toBeNull()

    expect(
      applyViewportRelayout2D({
        currentControls,
        resetControls: createDefaultPlotControls('2d'),
        relayoutData: {
          'xaxis.range[0]': 8,
          'xaxis.range[1]': -8,
        },
      }),
    ).toBeNull()
  })
})

describe('validatePlotControlDraft', () => {
  it('allows the canonical 3D preset density', () => {
    const validation = validatePlotControlDraft('3d', {
      x: { min: '-3.14', max: '3.14' },
      y: { min: '-3.14', max: '3.14' },
      z: { min: '-1.5', max: '1.5' },
      xSamples: '96',
      ySamples: '96',
    })

    expect(validation.ok).toBe(true)
  })

  it('returns readable density errors when the combined 3D grid is too large', () => {
    const validation = validatePlotControlDraft('3d', {
      x: { min: '-3.14', max: '3.14' },
      y: { min: '-3.14', max: '3.14' },
      z: { min: '-1.5', max: '1.5' },
      xSamples: '121',
      ySamples: '121',
    })

    expect(validation.ok).toBe(false)
    if (validation.ok) {
      throw new Error('Expected dense 3D controls to fail validation.')
    }

    expect(validation.errors.xSamples).toContain('Combined surface density')
    expect(validation.errors.ySamples).toContain('Combined surface density')
  })
})
