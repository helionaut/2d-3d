import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/PlotCanvas', () => ({
  PlotCanvas: ({ fixture }: { fixture: { plotTestId: string } }) => (
    <div data-testid={`mock-${fixture.plotTestId}`} />
  ),
}))

let App: typeof import('../../src/App').default

beforeAll(async () => {
  App = (await import('../../src/App')).default
})

describe('App', () => {
  it('surfaces the harness contract and deterministic paths', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: /Static-web graphing baseline with one 2D proof and one 3D proof/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('npm run check')).toBeInTheDocument()
    expect(screen.getByText('fixtures/graphFixtures.ts')).toBeInTheDocument()
    expect(screen.getByText('reports/out/')).toBeInTheDocument()
  })

  it('shows both canonical graph expressions from the PRD', () => {
    render(<App />)

    expect(screen.getAllByText('y = sin(x)')).toHaveLength(2)
    expect(screen.getAllByText('z = sin(x) * cos(y)')).toHaveLength(2)
    expect(screen.getAllByTestId('mock-plot-2d')[0]).toBeInTheDocument()
    expect(screen.getAllByTestId('mock-plot-3d')[0]).toBeInTheDocument()
  })
})
