import { describe, expect, it } from 'vitest'

import { resolveBasePath } from '../../src/config/basePath'

describe('resolveBasePath', () => {
  it('uses an explicit public base path override', () => {
    expect(resolveBasePath({ PUBLIC_BASE_PATH: ' 2d-3d ' })).toBe('/2d-3d/')
  })

  it('derives a project pages base path from the repository name in GitHub Actions', () => {
    expect(
      resolveBasePath({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY: 'helionaut/2d-3d',
      }),
    ).toBe('/2d-3d/')
  })

  it('keeps the root base path for user site repositories', () => {
    expect(
      resolveBasePath({
        GITHUB_ACTIONS: 'true',
        GITHUB_REPOSITORY: 'helionaut/helionaut.github.io',
      }),
    ).toBe('/')
  })

  it('defaults to the root base path for local development', () => {
    expect(resolveBasePath({})).toBe('/')
  })
})
