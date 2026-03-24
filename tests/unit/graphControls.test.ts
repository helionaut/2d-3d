import { describe, expect, it } from 'vitest'

import {
  applyViewportRelayout2D,
  createDefaultPlotControls,
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
