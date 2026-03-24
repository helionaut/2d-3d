import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  normalizeExpressionInput,
  validateExpressionInput,
  type GraphMode,
} from '../../src/lib/expression'

interface GrammarExampleCase {
  id: string
  kind: 'valid' | 'invalid'
  mode: GraphMode
  rawInput: string
  normalizedExpression?: string
  expectedError?: string
  parameterValues?: Record<string, number | null>
}

const fixturePath = resolve(import.meta.dirname, '../../fixtures/grammar/examples.json')
const fixtureCases = JSON.parse(readFileSync(fixturePath, 'utf-8')) as {
  cases: GrammarExampleCase[]
}

describe('normalizeExpressionInput', () => {
  it('strips an allowed dependent-variable prefix down to the stored expression', () => {
    expect(normalizeExpressionInput({ mode: '2d', rawInput: ' y = sin(x) ' })).toEqual({
      ok: true,
      normalizedExpression: 'sin(x)',
    })
  })

  it('rejects a dependent-variable prefix that does not match the active mode', () => {
    const result = normalizeExpressionInput({
      mode: '3d',
      rawInput: 'y = sin(x) * cos(y)',
    })

    expect(result.ok).toBe(false)

    if (result.ok) {
      throw new Error('Expected normalization to fail for a mismatched prefix.')
    }

    expect(result.error.code).toBe('unsupported-dependent-variable-prefix')
  })
})

describe('validateExpressionInput', () => {
  for (const exampleCase of fixtureCases.cases) {
    it(`matches fixture ${exampleCase.id}`, () => {
      const result = validateExpressionInput({
        mode: exampleCase.mode,
        rawInput: exampleCase.rawInput,
        parameterValues: exampleCase.parameterValues ?? {},
      })

      if (exampleCase.kind === 'valid') {
        expect(result.ok).toBe(true)

        if (!result.ok) {
          throw new Error(`Expected fixture ${exampleCase.id} to validate successfully.`)
        }

        expect(result.normalizedExpression).toBe(exampleCase.normalizedExpression)
        expect(result.parameterValues).toEqual(exampleCase.parameterValues ?? {})
        return
      }

      expect(result.ok).toBe(false)

      if (result.ok) {
        throw new Error(`Expected fixture ${exampleCase.id} to fail validation.`)
      }

      expect(result.error.code).toBe(exampleCase.expectedError)
    })
  }
})
