import { describe, expect, it } from 'vitest'

import { validateExpressionInput, type ExpressionValidationSuccess } from '../../src/lib/expression'
import { createDefaultPlotControls } from '../../src/lib/graphControls'
import {
  buildPlotModel,
  evaluateCurveSamples,
  evaluateSurfaceSamples,
  sampleLinear,
} from '../../src/lib/plotting'

function validate2DExpression(
  rawInput: string,
  parameterValues?: Record<string, number>,
): ExpressionValidationSuccess {
  const result = validateExpressionInput({
    mode: '2d',
    rawInput,
    parameterValues,
  })

  if (!result.ok) {
    throw new Error(`Expected "${rawInput}" to validate successfully.`)
  }

  return result
}

function validate3DExpression(
  rawInput: string,
  parameterValues?: Record<string, number>,
): ExpressionValidationSuccess {
  const result = validateExpressionInput({
    mode: '3d',
    rawInput,
    parameterValues,
  })

  if (!result.ok) {
    throw new Error(`Expected "${rawInput}" to validate successfully.`)
  }

  return result
}

describe('plotting', () => {
  it('evaluates canonical 2D curve samples from the parsed expression and parameters', () => {
    const result = validate2DExpression('y = a * sin(x)', { a: 2 })
    const controls = {
      ...createDefaultPlotControls('2d'),
      x: { min: 0, max: Math.PI },
      samples: 3,
    }

    const curve = evaluateCurveSamples(result, controls)

    expect(curve.notice).toBeUndefined()
    expect(curve.xValues).toEqual([0, Math.PI / 2, Math.PI])
    expect(curve.yValues).toHaveLength(3)
    expect(curve.yValues[0]).toBeCloseTo(0)
    expect(curve.yValues[1]).toBeCloseTo(2)
    expect(curve.yValues[2]).toBeCloseTo(0)
  })

  it('returns a readable notice when evaluation throws instead of crashing the plot model', () => {
    const controls = createDefaultPlotControls('2d')
    const result = {
      ...validate2DExpression('y = x'),
      ast: {
        kind: 'binary',
        operator: '%',
        left: { kind: 'number', value: 1 },
        right: { kind: 'number', value: 2 },
      },
    } as unknown as ExpressionValidationSuccess

    const curve = evaluateCurveSamples(result, controls)
    const plotModel = buildPlotModel(result, controls)

    expect(curve.notice).toContain('Unable to evaluate this curve')
    expect(curve.yValues.every((value) => value === null)).toBe(true)
    expect(plotModel.notice).toContain('Unable to evaluate this curve')
  })

  it('evaluates canonical 3D surface samples from the parsed expression and controls', () => {
    const result = validate3DExpression('z = sin(x) * cos(y)')
    const controls = {
      ...createDefaultPlotControls('3d'),
      x: { min: 0, max: Math.PI },
      y: { min: 0, max: Math.PI / 2 },
      xSamples: 3,
      ySamples: 2,
    }

    const surface = evaluateSurfaceSamples(result, controls)
    const plotModel = buildPlotModel(result, controls)
    const surfaceTrace = plotModel.plot.data[0]

    expect(surface.notice).toBeUndefined()
    expect(surface.xValues).toEqual([0, Math.PI / 2, Math.PI])
    expect(surface.yValues).toEqual([0, Math.PI / 2])
    expect(surface.zValues).toHaveLength(2)
    expect(surface.zValues[0]?.[0]).toBeCloseTo(0)
    expect(surface.zValues[0]?.[1]).toBeCloseTo(1)
    expect(surface.zValues[0]?.[2]).toBeCloseTo(0)
    expect(surface.zValues[1]?.every((value) => Math.abs(value ?? 0) < 1e-12)).toBe(true)
    expect(surfaceTrace.type).toBe('surface')
    expect(plotModel.plot.data).toHaveLength(5)
  })

  it('returns a readable notice when surface evaluation throws instead of crashing the plot model', () => {
    const controls = createDefaultPlotControls('3d')
    const result = {
      ...validate3DExpression('z = x + y'),
      ast: {
        kind: 'binary',
        operator: '%',
        left: { kind: 'number', value: 1 },
        right: { kind: 'number', value: 2 },
      },
    } as unknown as ExpressionValidationSuccess

    const surface = evaluateSurfaceSamples(result, controls)
    const plotModel = buildPlotModel(result, controls)
    const surfaceTrace = plotModel.plot.data[0]

    expect(surface.notice).toContain('Unable to evaluate this surface')
    expect(surface.zValues.flat().every((value) => value === null)).toBe(true)
    expect(plotModel.notice).toContain('Unable to evaluate this surface')
    expect(surfaceTrace.type).toBe('surface')
  })

  it('keeps sampling deterministic even at the minimum count', () => {
    expect(sampleLinear(-2, 6, 1)).toEqual([-2])
  })
})
